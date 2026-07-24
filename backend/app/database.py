from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from typing import Generator

from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args=(
        {"check_same_thread": False}
        if settings.database_url.startswith("sqlite")
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
