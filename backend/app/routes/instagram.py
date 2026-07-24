import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.instagram_account import InstagramAccount
from app.schemas.api import ApiResponse
from app.schemas.instagram import InstagramLogin, InstagramAccountResponse, InstagramAssociatePreset
from app.services.instagram_service import instagram_service
from app.routes.deps import get_current_user
from app.lib.errors import ValidationError, NotFoundError, ForbiddenError

router = APIRouter(prefix="/instagram", tags=["instagram"])

@router.post("/login", response_model=ApiResponse[InstagramAccountResponse], status_code=201)
def instagram_login(
    data: InstagramLogin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instagramにログインし、アカウントを連携・更新する"""
    # 既存の同一ユーザーの同一アカウントがあるか確認
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

    # 新しいセッションデータを暗号化
    encrypted_session = instagram_service.encrypt_session(new_session)

    if existing_account:
        # 既存アカウントのセッションを更新
        existing_account.session_data = encrypted_session
        db.commit()
        db.refresh(existing_account)
        return ApiResponse(data=InstagramAccountResponse.model_validate(existing_account))
    else:
        # 新規アカウント連携
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
        return ApiResponse(data=InstagramAccountResponse.model_validate(db_account))

@router.get("/accounts", response_model=ApiResponse[List[InstagramAccountResponse]])
def get_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """連携されているInstagramアカウント一覧を取得"""
    accounts = db.query(InstagramAccount).filter(InstagramAccount.user_id == current_user.id).all()
    return ApiResponse(data=[InstagramAccountResponse.model_validate(a) for a in accounts])

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

    # プリセットIDの検証 (nullでなければ存在確認)
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
    
    return ApiResponse(data=InstagramAccountResponse.model_validate(account))
