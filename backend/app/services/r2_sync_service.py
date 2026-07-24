import os
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger("r2_sync")

R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")

# 実行環境のカレントディレクトリに左右されないよう、絶対パスでデータベース位置を固定
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_FILE_PATH = os.path.join(BASE_DIR, "insta_imme.db")

def get_r2_client():
    """Cloudflare R2接続用クライアントを取得"""
    if not all([R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
        return None
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

def download_db() -> bool:
    """R2からデータベースファイルをダウンロードしてローカルに配置"""
    client = get_r2_client()
    if not client:
        print("[R2 Sync] R2環境変数が未設定のため、R2データベース同期は無効です。")
        return False
    try:
        print(f"[R2 Sync] R2からデータベースをダウンロード中... (保存先: {DB_FILE_PATH})")
        client.download_file(R2_BUCKET_NAME, "insta_imme.db", DB_FILE_PATH)
        print("[R2 Sync] データベースのダウンロードに成功しました。")
        return True
    except ClientError as e:
        # 404エラーの場合は初回起動とみなす
        if e.response["Error"]["Code"] == "404":
            print("[R2 Sync] R2上にデータベースが見つかりません。初回起動として新規作成します。")
            return True
        logger.error("[R2 Sync] R2からのDL中にClientError: %s | response=%s", e, getattr(e, "response", None), exc_info=True)
        return False
    except Exception as e:
        logger.error("[R2 Sync] DB DL中に予期せぬエラー: %s", e, exc_info=True)
        return False

def upload_db() -> bool:
    """ローカルのデータベースファイルをR2にアップロードしてバックアップ"""
    client = get_r2_client()
    if not client:
        return False
    if not os.path.exists(DB_FILE_PATH):
        print(f"[R2 Sync] アップロード対象のデータベースファイルが見つかりません: {DB_FILE_PATH}")
        return False
    try:
        print(f"[R2 Sync] R2へデータベースをアップロード中... (送信元: {DB_FILE_PATH})")
        client.upload_file(DB_FILE_PATH, R2_BUCKET_NAME, "insta_imme.db")
        print("[R2 Sync] データベースのアップロードに成功しました。")
        return True
    except Exception as e:
        logger.error("[R2 Sync] DB アップロード中にエラー: %s", e, exc_info=True)
        return False
