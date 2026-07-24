import uuid
import json
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.preset import Preset
from app.schemas.api import ApiResponse
from app.schemas.preset import PresetCreate, PresetUpdate, PresetResponse, WatermarkSettings
from app.routes.deps import get_current_user
from app.lib.errors import NotFoundError, ForbiddenError

router = APIRouter(prefix="/presets", tags=["presets"])

def db_to_response(db_preset: Preset) -> PresetResponse:
    """DBモデルをPydanticレスポンスモデルに変換する (watermark_templateのデシリアライズ含む)"""
    try:
        watermark_dict = json.loads(db_preset.watermark_template)
        watermark = WatermarkSettings(**watermark_dict)
    except Exception:
        # デフォルト設定
        watermark = WatermarkSettings()

    return PresetResponse(
        id=db_preset.id,
        user_id=db_preset.user_id,
        name=db_preset.name,
        caption_template=db_preset.caption_template,
        hashtags=db_preset.hashtags,
        watermark=watermark,
        created_at=db_preset.created_at
    )

@router.post("", response_model=ApiResponse[PresetResponse], status_code=201)
def create_preset(
    data: PresetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """プリセットを新規作成する"""
    preset_id = str(uuid.uuid4())
    
    # 透かし設定をJSON文字列に変換
    watermark_json = ""
    if data.watermark:
        watermark_json = json.dumps(data.watermark.model_dump())
    else:
        watermark_json = json.dumps(WatermarkSettings().model_dump())

    db_preset = Preset(
        id=preset_id,
        user_id=current_user.id,
        name=data.name,
        caption_template=data.caption_template,
        hashtags=data.hashtags,
        watermark_template=watermark_json
    )
    db.add(db_preset)
    db.commit()
    db.refresh(db_preset)

    return ApiResponse(data=db_to_response(db_preset))

@router.get("", response_model=ApiResponse[List[PresetResponse]])
def get_presets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ログインユーザーのプリセット一覧を取得"""
    presets = db.query(Preset).filter(Preset.user_id == current_user.id).all()
    return ApiResponse(data=[db_to_response(p) for p in presets])

@router.get("/{preset_id}", response_model=ApiResponse[PresetResponse])
def get_preset(
    preset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """プリセット詳細を取得"""
    preset = db.query(Preset).filter(Preset.id == preset_id).first()
    if not preset:
        raise NotFoundError("プリセットが見つかりません")
    
    if preset.user_id != current_user.id:
        raise ForbiddenError("このプリセットにアクセスする権限がありません")
        
    return ApiResponse(data=db_to_response(preset))

@router.put("/{preset_id}", response_model=ApiResponse[PresetResponse])
def update_preset(
    preset_id: str,
    data: PresetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """プリセットを更新する"""
    preset = db.query(Preset).filter(Preset.id == preset_id).first()
    if not preset:
        raise NotFoundError("プリセットが見つかりません")
    
    if preset.user_id != current_user.id:
        raise ForbiddenError("このプリセットを更新する権限がありません")

    preset.name = data.name
    preset.caption_template = data.caption_template
    preset.hashtags = data.hashtags
    
    if data.watermark:
        preset.watermark_template = json.dumps(data.watermark.model_dump())

    db.commit()
    db.refresh(preset)
    
    return ApiResponse(data=db_to_response(preset))

@router.delete("/{preset_id}", response_model=ApiResponse[None])
def delete_preset(
    preset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """プリセットを削除する"""
    preset = db.query(Preset).filter(Preset.id == preset_id).first()
    if not preset:
        raise NotFoundError("プリセットが見つかりません")
    
    if preset.user_id != current_user.id:
        raise ForbiddenError("このプリセットを削除する権限がありません")

    db.delete(preset)
    db.commit()
    return ApiResponse(data=None)
