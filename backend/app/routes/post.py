import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.instagram_account import InstagramAccount
from app.models.post_history import PostHistory
from app.schemas.api import ApiResponse
from app.schemas.post import PostPublish, PostResponse
from app.services.image_service import image_service
from app.services.instagram_service import instagram_service
from app.routes.deps import get_current_user
from app.lib.errors import NotFoundError, ForbiddenError, InstagramError

router = APIRouter(prefix="/posts", tags=["posts"])

class ImageUploadResponse(BaseModel):
    imageId: str

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
    """Instagramに写真を投稿する"""
    # アカウントの存在確認と権限チェック
    account = db.query(InstagramAccount).filter(InstagramAccount.id == data.instagramAccountId).first()
    if not account:
        raise NotFoundError("Instagramアカウントが見つかりません")
    
    if account.user_id != current_user.id:
        raise ForbiddenError("このInstagramアカウントを使用する権限がありません")

    # 投稿履歴のレコード作成
    post_id = str(uuid.uuid4())
    db_post = PostHistory(
        id=post_id,
        user_id=current_user.id,
        instagram_account_id=account.id,
        caption=data.caption,
        status="uploading"
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    try:
        # 画像パスの取得
        image_path = image_service.get_image_path(current_user.id, data.imageId)
        
        # 投稿開始
        db_post.status = "publishing"
        db.commit()

        # instagrapiで写真アップロード
        media_id = instagram_service.upload_photo(
            session_data_encrypted=account.session_data,
            image_path=image_path,
            caption=data.caption
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
        if isinstance(e, InstagramError):
            raise e
        raise InstagramError(f"Instagramへの投稿に失敗しました: {str(e)}")

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
