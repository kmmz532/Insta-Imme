from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """環境変数から読み込むアプリケーション設定"""

    database_url: str = "sqlite:///./insta_imme.db"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    frontend_url: str = "http://localhost:5173"
    upload_dir: str = "./uploads"
    # データセンターIPがInstagramにブロックされる場合に使用する任意のプロキシ (例: http://user:pass@host:port)
    instagram_proxy: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
