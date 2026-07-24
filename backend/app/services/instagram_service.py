import json
import base64
import hashlib
from cryptography.fernet import Fernet
from instagrapi import Client
from instagrapi.exceptions import (
    TwoFactorRequired,
    BadPassword,
    UserNotFound,
    ChallengeRequired
)
from app.config import settings
from app.lib.errors import InstagramError, ValidationError

class InstagramService:
    def __init__(self):
        # settings.jwt_secret から Fernet 暗号化用のキーを導出
        key = base64.urlsafe_b64encode(hashlib.sha256(settings.jwt_secret.encode()).digest())
        self.fernet = Fernet(key)

    def encrypt_session(self, session_dict: dict) -> str:
        """セッション辞書を暗号化された文字列にする"""
        json_data = json.dumps(session_dict)
        encrypted = self.fernet.encrypt(json_data.encode())
        return encrypted.decode()

    def decrypt_session(self, encrypted_str: str) -> dict:
        """暗号化された文字列からセッション辞書を復元する"""
        decrypted = self.fernet.decrypt(encrypted_str.encode())
        return json.loads(decrypted.decode())

    def get_client(self, session_data_encrypted: str = None) -> Client:
        """instagrapiクライアントを取得する。セッションデータがあれば読み込む。"""
        cl = Client()
        # API制限の回避等のため、デフォルトのユーザーエージェントなどを調整
        cl.delay_range = [2, 5]  # 操作ごとの待機時間
        
        if session_data_encrypted:
            try:
                session_settings = self.decrypt_session(session_data_encrypted)
                cl.set_settings(session_settings)
            except Exception as e:
                # セッション復元に失敗した場合は新規クライアントとして扱う
                pass
        return cl

    def login(self, username: str, password: str, verification_code: str = None, session_data_encrypted: str = None) -> tuple[Client, dict]:
        """Instagramにログインし、クライアントと新しいセッション設定を返す"""
        cl = self.get_client(session_data_encrypted)
        
        try:
            if session_data_encrypted:
                # 既存セッションの有効性を確認
                try:
                    if cl.get_timeline_feed(): # タイムラインが取れればセッションは有効
                        return cl, cl.get_settings()
                except Exception:
                    # セッションが無効なら再ログインを試みる
                    pass

            # 新規ログイン
            if verification_code:
                # 2FAコード付きログイン
                cl.login(username, password, verification_code=verification_code)
            else:
                cl.login(username, password)
                
            return cl, cl.get_settings()
            
        except TwoFactorRequired as e:
            raise ValidationError("2FA")  # フロントエンドで2FAコード入力を促すための識別文字列
        except BadPassword:
            raise ValidationError("パスワードが正しくありません")
        except UserNotFound:
            raise ValidationError("ユーザーが見つかりません")
        except ChallengeRequired:
            raise InstagramError("認証チャレンジ（電話番号/メール認証）が必要です。ブラウザで一度ログインしてください。")
        except Exception as e:
            raise InstagramError(f"ログインに失敗しました: {str(e)}")

    def upload_photo(self, session_data_encrypted: str, image_path: str, caption: str) -> str:
        """写真を投稿し、投稿されたメディアのIDを返す"""
        cl = self.get_client(session_data_encrypted)
        
        # セッションが有効か確認、無効ならログインエラー
        try:
            cl.get_timeline_feed()
        except Exception:
            raise ValidationError("Instagramセッションの有効期限が切れています。再連携してください。")

        try:
            # instagrapiで写真をアップロード
            # image_path はローカルパス
            media = cl.photo_upload(path=image_path, caption=caption)
            return media.pk
        except Exception as e:
            raise InstagramError(f"写真の投稿に失敗しました: {str(e)}")

instagram_service = InstagramService()
