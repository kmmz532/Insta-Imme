import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from typing import Generator

from app.config import settings
from app.services.r2_sync_service import DB_FILE_PATH

# SQLite接続時は、環境変数の記述に関わらず自動的に絶対パスを適用して絶対パス解決の不整合を防ぐ
db_url = settings.database_url
if db_url.startswith("sqlite"):
    # スラッシュ3つ + 絶対パス (Windows環境等のドライブレター等も考慮)
    # 例: sqlite:///E:\workspace\...\insta_imme.db
    db_url = f"sqlite:///{DB_FILE_PATH}"

engine = create_engine(
    db_url,
    connect_args=(
        {"check_same_thread": False}
        if db_url.startswith("sqlite")
        else {}
    ),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy モデルの基底クラス"""

    pass


def get_db() -> Generator[sessionmaker, None, None]:
    """DBセッションの依存性注入用ジェネレータ"""
    db = SessionLocal()
    try:
        yield db  # type: ignore[misc]
    finally:
        db.close()
