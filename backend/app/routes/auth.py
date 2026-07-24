import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.api import ApiResponse
from app.schemas.auth import UserRegister, UserLogin, AuthResponse, UserResponse
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.lib.errors import ValidationError, AuthError
from app.routes.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=ApiResponse[AuthResponse], status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """新規ユーザー登録"""
    # メールの重複チェック
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise ValidationError("このメールアドレスは既に登録されています")

    # 新規ユーザー作成
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(data.password)
    
    db_user = User(id=user_id, email=data.email, password_hash=hashed_pwd)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # JWT発行
    token = create_access_token(data={"sub": db_user.id})
    
    return ApiResponse(data=AuthResponse(token=token, user=UserResponse.model_validate(db_user)))

@router.post("/login", response_model=ApiResponse[AuthResponse])
def login(data: UserLogin, db: Session = Depends(get_db)):
    """ログイン"""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise AuthError("メールアドレスまたはパスワードが正しくありません")

    if not verify_password(data.password, user.password_hash):
        raise AuthError("メールアドレスまたはパスワードが正しくありません")

    # JWT発行
    token = create_access_token(data={"sub": user.id})
    
    return ApiResponse(data=AuthResponse(token=token, user=UserResponse.model_validate(user)))

@router.get("/me", response_model=ApiResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    """ログイン中のユーザー情報を取得"""
    return ApiResponse(data=UserResponse.model_validate(current_user))
