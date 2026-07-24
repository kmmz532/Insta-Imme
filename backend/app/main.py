import os
import threading
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from app.config import settings
from app.database import engine, Base
# 全てのモデルをロードしてテーブル作成を行う
import app.models # noqa: F401
from app.routes import auth, instagram, post, preset
from app.services.r2_sync_service import download_db, upload_db

# 起動前にR2から最新のデータベースファイルをダウンロード
download_db()

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
    "https://insta-imme.pages.dev",
    "https://insta-imme.kmmz.jp",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース更新時のR2バックアップミドルウェア
@app.middleware("http")
async def db_sync_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # 成功した書き込みリクエスト(POST, PUT, DELETE)の場合、バックグラウンドスレッドでR2へDBをアップロード
    if request.method in ["POST", "PUT", "DELETE"] and 200 <= response.status_code < 300:
        threading.Thread(target=upload_db, daemon=True).start()
        
    return response

# ルーターの登録
app.include_router(auth.router, prefix="/api")
app.include_router(instagram.router, prefix="/api")
app.include_router(post.router, prefix="/api")
app.include_router(preset.router, prefix="/api")

def add_cors_headers(response: JSONResponse, request: Request):
    origin = request.headers.get("origin")
    allowed_origins = [
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://insta-imme.pages.dev",
        "https://insta-imme.kmmz.jp",
    ]
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"

# エラーハンドラ: FastAPIのHTTPException
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # 予期せぬエラー
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"サーバー内部エラーが発生しました: {str(exc)}"
            }
        }
    )
    add_cors_headers(response, request)
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # カスタムHTTPException of error handle
    error_code = "API_ERROR"
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
        
    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": exc.detail
            }
        }
    )
    add_cors_headers(response, request)
    return response

# エラーハンドラ: リクエストバリデーションエラー
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Pydantic等の入力エラー
    errors = exc.errors()
    message = "入力内容が正しくありません"
    if errors:
        loc = ".".join(str(x) for x in errors[0].get("loc", []))
        msg = errors[0].get("msg", "")
        message = f"バリデーションエラー ({loc}): {msg}"

    response = JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message
            }
        }
    )
    add_cors_headers(response, request)
    return response

@app.get("/health")
def health_check():
    return {"status": "ok"}
