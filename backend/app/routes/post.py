import uuid
import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.instagram_account import InstagramAccount
from app.models.preset import Preset
from app.models.post_history import PostHistory
from app.schemas.api import ApiResponse
from app.schemas.post import PostPublish, PostResponse
from app.services.image_service import image_service
from app.services.instagram_service import instagram_service
from app.routes.deps import get_current_user
from app.lib.errors import NotFoundError, ForbiddenError, InstagramError, ValidationError

router = APIRouter(prefix="/posts", tags=["posts"])

class ImageUploadResponse(BaseModel):
    imageId: str

def expand_template(
    template: str,
    account_name: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    loc: Optional[str] = None
) -> str:
    """テンプレート変数を置換する (GPS位置情報対応)"""
    now = datetime.now()
    date_str = now.strftime("%Y/%m/%d")
    time_str = now.strftime("%H:%M")
    
    replacements = {
        "${date}": date_str,
        "${time}": time_str,
        "${datetime}": f"{date_str} {time_str}",
        "${app}": "Insta-Imme",
        "${account}": account_name,
        "${lat}": f"{lat:.6f}" if lat is not None else "",
        "${lng}": f"{lng:.6f}" if lng is not None else "",
        "${loc}": loc if loc else ""
    }
    
    result = template
    for key, val in replacements.items():
        result = result.replace(key, val)
    return result

def determine_preset_by_rules(auto_rules_json: str) -> Optional[str]:
    """自動ルール設定と現在時刻から適用するプリセットIDを判定する"""
    try:
        data = json.loads(auto_rules_json)
        if not data.get("enabled"):
            return None
        
        rules = data.get("rules", [])
        if not rules:
            return None
            
        now = datetime.now()
        # 曜日判定 (weekday: 0-4, weekend: 5-6)
        day_type = "weekend" if now.weekday() >= 5 else "weekday"
        
        # 時間区分判定
        hour = now.hour
        if 5 <= hour < 11:
            time_range = "morning"
        elif 11 <= hour < 18:
            time_range = "day"
        elif 18 <= hour < 24:
            time_range = "night"
        else:
            time_range = "late_night"

        # 曜日と時間帯が合致するルールを探す
        for r in rules:
            if (r.get("dayOfWeek") == day_type or r.get("dayOfWeek") == "all") and r.get("timeRange") == time_range:
                return r.get("presetId")

        return None
    except Exception:
        return None

@router.post("/upload", response_model=ApiResponse[ImageUploadResponse], status_code=201)
async def upload_post_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """画像を一時保存する"""
    image_id = image_service.save_image(image, current_user.id)
    return ApiResponse(data=ImageUploadResponse(imageId=image_id))

@router.post("/publish", response_model=ApiResponse[PostResponse])
def publish_post(
    data: PostPublish,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instagramに写真を投稿する (自動プリセット選択・GPS変数置換対応)"""
    # アカウントの存在確認と権限チェック
    account = db.query(InstagramAccount).filter(InstagramAccount.id == data.instagramAccountId).first()
    if not account:
        raise NotFoundError("Instagramアカウントが見つかりません")
    
    if account.user_id != current_user.id:
        raise ForbiddenError("このInstagramアカウントを使用する権限がありません")

    # 適用プリセットIDの決定 (1: 時間帯・曜日自動ルール, 2: デフォルトプリセット)
    preset_id_applied = None
    if account.auto_preset_rules:
        preset_id_applied = determine_preset_by_rules(account.auto_preset_rules)
    
    if not preset_id_applied:
        preset_id_applied = account.preset_id

    preset = None
    if preset_id_applied:
        preset = db.query(Preset).filter(Preset.id == preset_id_applied).first()

    # キャプションの決定とテンプレート展開
    caption = data.caption
    if caption:
        caption = expand_template(caption, account.username, data.latitude, data.longitude, data.locationName)
    elif preset:
        caption_base = preset.caption_template
        if preset.hashtags:
            caption_base += "\n\n" + preset.hashtags
        caption = expand_template(caption_base, account.username, data.latitude, data.longitude, data.locationName)
    else:
        caption = ""

    # 投稿履歴のレコード作成
    post_id = str(uuid.uuid4())
    db_post = PostHistory(
        id=post_id,
        user_id=current_user.id,
        instagram_account_id=account.id,
        caption=caption,
        preset_id=preset_id_applied,
        image_id=data.imageId,
        status="uploading"
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    try:
        # 画像パスの取得
        image_path = image_service.get_image_path(current_user.id, data.imageId)
        
        # プリセットがあり、透かしが有効な場合は透かし加工を施す
        if preset and preset.watermark_template:
            try:
                watermark_settings = json.loads(preset.watermark_template)
                if watermark_settings.get("enabled"):
                    text = watermark_settings.get("text", "")
                    text_replaced = expand_template(
                        text,
                        account.username,
                        data.latitude,
                        data.longitude,
                        data.locationName
                    )
                    position = watermark_settings.get("position", "bottom_right")
                    font_size = watermark_settings.get("font_size", 36)
                    
                    image_service.apply_watermark(
                        image_path=image_path,
                        text=text_replaced,
                        position=position,
                        font_size=font_size
                    )
            except Exception as e:
                raise ValidationError(f"透かしの適用に失敗しました: {str(e)}")
        
        # 投稿開始
        db_post.status = "publishing"
        db.commit()

        # instagrapiで写真アップロード
        media_id = instagram_service.upload_photo(
            session_data_encrypted=account.session_data,
            image_path=image_path,
            caption=caption
        )

        # 投稿成功処理
        db_post.status = "success"
        db_post.instagram_post_id = media_id
        db_post.posted_at = datetime.utcnow()
        db.commit()
        db.refresh(db_post)

        # 一時画像の削除
        image_service.delete_image(current_user.id, data.imageId)

        return ApiResponse(data=PostResponse.model_validate(db_post))

    except Exception as e:
        # 投稿失敗処理
        db_post.status = "failed"
        db.commit()
        if isinstance(e, InstagramError) or isinstance(e, ValidationError):
            raise e
        raise InstagramError(f"Instagramへの投稿に失敗しました: {str(e)}")

@router.get("/history", response_model=ApiResponse[List[PostResponse]])
def get_post_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """投稿履歴一覧を取得"""
    history = db.query(PostHistory).filter(
        PostHistory.user_id == current_user.id
    ).order_by(PostHistory.created_at.desc()).all()
    
    return ApiResponse(data=[PostResponse.model_validate(h) for h in history])

@router.get("/status/{post_id}", response_model=ApiResponse[PostResponse])
def get_post_status(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """投稿のステータスを取得する"""
    post = db.query(PostHistory).filter(PostHistory.id == post_id).first()
    if not post:
        raise NotFoundError("投稿が見つかりません")
        
    if post.user_id != current_user.id:
        raise ForbiddenError("この投稿情報にアクセスする権限がありません")
        
    return ApiResponse(data=PostResponse.model_validate(post))
