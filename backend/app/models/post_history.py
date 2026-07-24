from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class PostHistory(Base):
    __tablename__ = "post_history"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    instagram_account_id = Column(String, ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False)
    caption = Column(String, default="", nullable=False)
    preset_id = Column(String, nullable=True)
    instagram_post_id = Column(String, nullable=True)
    status = Column(String, default="pending", nullable=False)  # pending, uploading, publishing, success, failed
    posted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
