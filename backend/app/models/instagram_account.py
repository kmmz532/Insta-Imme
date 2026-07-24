from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class InstagramAccount(Base):
    __tablename__ = "instagram_accounts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    username = Column(String, nullable=False)
    session_data = Column(String, nullable=False)  # 暗号化/シリアライズされたセッション情報
    preset_id = Column(String, ForeignKey("presets.id", ondelete="SET NULL"), nullable=True)
    auto_preset_rules = Column(String, nullable=True)  # JSON形式の自動切替ルール
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
