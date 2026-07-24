import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from app.config import settings
from app.database import engine, Base
# 全てのモデルをロードしてテーブル作成を行う
import app.models # noqa: F401
from app.routes import auth, instagram, post

# テーブルの作成 (簡易的なマイグレーション)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Insta-Imme API",
    description="Insta-ImmeのバックエンドAPI (FastAPI + instagrapi)",
    version="1.0.0"
)

# CORSの設定
# フロントエンドからのリクエストを許可
origins = [
    settings.frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(auth.router, prefix="/api")
app.include_router(instagram.router, prefix="/api")
app.include_router(post.router, prefix="/api")

# エラーハンドラ: FastAPIのHTTPException
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # 予期せぬエラー
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"サーバー内部エラーが発生しました: {str(exc)}"
            }
        }
    )

from fastapi import HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # カスタムHTTPExceptionの処理
    error_code = "API_ERROR"
    # 自作のErrorクラスからcode属性がある場合はそれを取得
    if hasattr(exc, "code"):
        error_code = exc.code
    elif exc.status_code == 401:
        error_code = "AUTH_ERROR"
    elif exc.status_code == 403:
        error_code = "FORBIDDEN"
    elif exc.status_code == 404:
        error_code = "NOT_FOUND"
    elif exc.status_code == 400:
        error_code = "VALIDATION_ERROR"
        
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": exc.detail
            }
        }
    )

# エラーハンドラ: リクエストバリデーションエラー
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Pydantic等の入力エラー
    errors = exc.errors()
    # 最初のメッセージを取得
    message = "入力内容が正しくありません"
    if errors:
        loc = ".".join(str(x) for x in errors[0].get("loc", []))
        msg = errors[0].get("msg", "")
        message = f"バリデーションエラー ({loc}): {msg}"

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message
            }
        }
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}
