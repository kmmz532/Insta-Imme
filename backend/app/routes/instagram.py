import uuid
import json
import io
import logging
import zipfile
import requests

logger = logging.getLogger("instagram")
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.instagram_account import InstagramAccount
from app.schemas.api import ApiResponse
from app.schemas.instagram import (
    InstagramLogin,
    InstagramAccountResponse,
    InstagramAssociatePreset,
    AutoPresetSettings
)
from app.services.instagram_service import instagram_service
from app.routes.deps import get_current_user
from app.lib.errors import ValidationError, NotFoundError, ForbiddenError, InstagramError

router = APIRouter(prefix="/instagram", tags=["instagram"])

def db_to_account_response(db_account: InstagramAccount) -> InstagramAccountResponse:
    """DBモデルをPydanticレスポンスモデルに変換する (auto_preset_rulesのJSONパース含む)"""
    auto_rules = None
    if db_account.auto_preset_rules:
        try:
            auto_rules_dict = json.loads(db_account.auto_preset_rules)
            auto_rules = AutoPresetSettings(**auto_rules_dict)
        except Exception:
            pass

    return InstagramAccountResponse(
        id=db_account.id,
        username=db_account.username,
        preset_id=db_account.preset_id,
        auto_rules=auto_rules,
        created_at=db_account.created_at
    )

@router.post("/login", response_model=ApiResponse[InstagramAccountResponse], status_code=201)
def instagram_login(
    data: InstagramLogin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instagramにログインし、アカウントを連携・更新する"""
    existing_account = db.query(InstagramAccount).filter(
        InstagramAccount.user_id == current_user.id,
        InstagramAccount.username == data.username
    ).first()

    existing_session = existing_account.session_data if existing_account else None

    # instagrapiでログイン実行
    _, new_session = instagram_service.login(
        username=data.username,
        password=data.password,
        verification_code=data.verification_code,
        session_data_encrypted=existing_session
    )

    encrypted_session = instagram_service.encrypt_session(new_session)

    if existing_account:
        existing_account.session_data = encrypted_session
        db.commit()
        db.refresh(existing_account)
        return ApiResponse(data=db_to_account_response(existing_account))
    else:
        account_id = str(uuid.uuid4())
        db_account = InstagramAccount(
            id=account_id,
            user_id=current_user.id,
            username=data.username,
            session_data=encrypted_session
        )
        db.add(db_account)
        db.commit()
        db.refresh(db_account)
        return ApiResponse(data=db_to_account_response(db_account))

@router.get("/accounts", response_model=ApiResponse[List[InstagramAccountResponse]])
def get_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """連携されているInstagramアカウント一覧を取得"""
    accounts = db.query(InstagramAccount).filter(InstagramAccount.user_id == current_user.id).all()
    return ApiResponse(data=[db_to_account_response(a) for a in accounts])

@router.delete("/accounts/{account_id}", response_model=ApiResponse[None], status_code=status.HTTP_200_OK)
def delete_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instagramアカウントの連携を解除"""
    account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
    if not account:
        raise NotFoundError("Instagramアカウントが見つかりません")
    
    if account.user_id != current_user.id:
        raise ForbiddenError("このアカウントを削除する権限がありません")

    db.delete(account)
    db.commit()
    return ApiResponse(data=None)

@router.put("/accounts/{account_id}/preset", response_model=ApiResponse[InstagramAccountResponse])
def associate_preset(
    account_id: str,
    data: InstagramAssociatePreset,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instagramアカウントにプリセットを割り当てる"""
    account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
    if not account:
        raise NotFoundError("Instagramアカウントが見つかりません")
    
    if account.user_id != current_user.id:
        raise ForbiddenError("このアカウントの設定を変更する権限がありません")

    if data.presetId:
        from app.models.preset import Preset
        preset = db.query(Preset).filter(Preset.id == data.presetId).first()
        if not preset:
            raise NotFoundError("指定されたプリセットが見つかりません")
        if preset.user_id != current_user.id:
            raise ForbiddenError("このプリセットを使用する権限がありません")

    account.preset_id = data.presetId
    db.commit()
    db.refresh(account)
    
    return ApiResponse(data=db_to_account_response(account))

@router.put("/accounts/{account_id}/auto-rules", response_model=ApiResponse[InstagramAccountResponse])
def update_auto_rules(
    account_id: str,
    data: AutoPresetSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instagramアカウントの自動プリセット切替ルールを更新する"""
    account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
    if not account:
        raise NotFoundError("Instagramアカウントが見つかりません")
        
    if account.user_id != current_user.id:
        raise ForbiddenError("このアカウントの設定を変更する権限がありません")

    # プリセットIDの存在確認
    from app.models.preset import Preset
    for rule in data.rules:
        preset = db.query(Preset).filter(Preset.id == rule.presetId).first()
        if not preset:
            raise NotFoundError(f"ルールで指定されたプリセットが見つかりません: {rule.presetId}")
        if preset.user_id != current_user.id:
            raise ForbiddenError("他人のプリセットをルールに指定することはできません")

    # ルールをJSON文字列として保存
    account.auto_preset_rules = json.dumps(data.model_dump())
    db.commit()
    db.refresh(account)
    
    return ApiResponse(data=db_to_account_response(account))

@router.get("/accounts/{account_id}/download-all")
def download_all_photos(
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """指定されたアカウントの全投稿画像を一括ダウンロードする (ZIP形式)"""
    account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
    if not account:
        raise NotFoundError("Instagramアカウントが見つかりません")
        
    if account.user_id != current_user.id:
        raise ForbiddenError("このInstagramアカウントの画像を取得する権限がありません")

    try:
        cl = instagram_service.get_client(account.session_data)
        cl.get_timeline_feed()
    except Exception as e:
        logger.warning("[IG DL] セッション確認失敗 account=%s: %s", account.username, e, exc_info=True)
        raise ValidationError("Instagramのセッション期限が切れています。再連携してください。")

    try:
        # メディアを最大50件取得
        medias = cl.user_medias(cl.user_id, amount=50)
        
        # インメモリでZIP作成
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            for media in medias:
                urls = []
                # media_type (1: Image, 8: Album)
                if media.media_type == 1:
                    if media.thumbnail_url:
                        urls.append(media.thumbnail_url)
                elif media.media_type == 8:
                    for res in media.resources:
                        if res.media_type == 1 and res.thumbnail_url:
                            urls.append(res.thumbnail_url)
                
                # 各画像をダウンロードしてZIPに追加
                for u_idx, url in enumerate(urls):
                    try:
                        # Nominatim同様に適切なUAを指定
                        resp = requests.get(url, headers={"User-Agent": "Insta-Imme/1.0.0"}, timeout=15)
                        if resp.status_code == 200:
                            file_name = f"{media.pk}_{u_idx + 1}.jpg"
                            zip_file.writestr(file_name, resp.content)
                    except Exception as img_err:
                        logger.warning("[IG DL] 画像取得失敗 url=%s: %s", url, img_err)

        zip_buffer.seek(0)
        
        # ファイル名を指定してストリーム返却
        filename = f"instagram_photos_{account.username}.zip"
        headers = {
            "Content-Disposition": f"attachment; filename={filename}"
        }
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers=headers
        )
    except Exception as e:
        logger.error("[IG DL] 一括ダウンロード失敗 account=%s: %s", account.username, e, exc_info=True)
        raise InstagramError(f"画像一括ダウンロード処理に失敗しました: {str(e)}")
