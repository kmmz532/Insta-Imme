from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.lib.errors import AuthError
from app.services.auth_service import decode_access_token
from app.models.user import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """JWTトークンを検証し、現在ログインしているユーザーを取得する"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise AuthError("無効なトークンまたはトークンの有効期限が切れています")
        
    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("トークンペイロードが無効です")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthError("ユーザーが見つかりません")
        
    return user
