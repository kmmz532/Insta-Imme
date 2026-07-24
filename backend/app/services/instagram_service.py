import json
import base64
import hashlib
import logging
from cryptography.fernet import Fernet
from instagrapi import Client
from instagrapi.exceptions import (
    TwoFactorRequired,
    BadPassword,
    UserNotFound,
    ChallengeRequired,
    ClientError,
)
from app.config import settings
from app.lib.errors import InstagramError, ValidationError

logger = logging.getLogger("instagram")


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
        # API制限の回避等のため、操作ごとの待機時間を設定
        cl.delay_range = [2, 5]

        # データセンターIP(Render等)がブロックされる場合に備えたプロキシ設定
        if settings.instagram_proxy:
            try:
                cl.set_proxy(settings.instagram_proxy)
            except Exception as e:
                logger.warning("Instagramプロキシ設定に失敗しました: %s", e)

        if session_data_encrypted:
            try:
                session_settings = self.decrypt_session(session_data_encrypted)
                cl.set_settings(session_settings)
            except Exception as e:
                # セッション復元に失敗した場合は新規クライアントとして扱う
                logger.warning("セッション復元に失敗しました。新規クライアントとして続行します: %s", e)
        return cl

    def _is_session_valid(self, cl: Client) -> bool:
        """既存セッションが有効かどうかをタイムライン取得で判定する"""
        try:
            cl.get_timeline_feed()
            return True
        except Exception:
            return False

    def login(
        self,
        username: str,
        password: str,
        verification_code: str = None,
        session_data_encrypted: str = None,
    ) -> tuple[Client, dict]:
        """Instagramにログインし、クライアントと新しいセッション設定を返す"""
        # 既存セッションがあれば、まずその有効性を確認し、有効ならパスワード不要でそのまま使う
        if session_data_encrypted:
            existing_cl = self.get_client(session_data_encrypted)
            if self._is_session_valid(existing_cl):
                logger.info("既存セッションが有効なため再ログインをスキップします: @%s", username)
                return existing_cl, existing_cl.get_settings()
            logger.info("既存セッションが無効。資格情報で再ログインします: @%s", username)

        # 失効セッションのauthorization/cookieを引き継ぐと正しいパスワードでもBadPasswordになるため、
        # 資格情報ログインは必ずクリーンなクライアントで行う(端末UUID等の設定のみ引き継ぐ)
        cl = self.get_client()
        if session_data_encrypted:
            try:
                old_settings = self.decrypt_session(session_data_encrypted)
                uuids = old_settings.get("uuids")
                if uuids and hasattr(cl, "set_uuids"):
                    cl.set_uuids(uuids)
            except Exception as e:
                logger.warning("端末UUIDの引き継ぎに失敗しました: %s", e)

        try:
            if verification_code:
                # 2FAコード付きログイン
                cl.login(username, password, verification_code=verification_code)
            else:
                cl.login(username, password)

            logger.info("Instagramログインに成功しました: @%s", username)
            return cl, cl.get_settings()

        except TwoFactorRequired:
            # フロントエンドで2FAコード入力を促すための識別文字列
            raise ValidationError("2FA")
        except BadPassword as e:
            # 正しいパスワードでもここに来る場合がある(IP評価/チャレンジ)。実際の内容をログに残す
            logger.warning("Instagram BadPassword(@%s): %s", username, self._extract_error_detail(e))
            raise ValidationError(
                "パスワードが拒否されました。パスワードが正しい場合、"
                "Instagramがログイン元IP(サーバー)を制限している可能性があります。"
                "しばらく待つか、公式アプリで一度ログインしてからお試しください。"
            )
        except UserNotFound:
            raise ValidationError("ユーザーが見つかりません")
        except ChallengeRequired as e:
            logger.warning("Instagram ChallengeRequired(@%s): %s", username, self._extract_error_detail(e))
            raise InstagramError(
                "Instagramが本人確認(チャレンジ)を要求しています。"
                "公式アプリまたはブラウザで一度ログインして確認を完了してから、再度お試しください。"
            )
        except ClientError as e:
            detail = self._extract_error_detail(e)
            logger.warning("Instagram ClientError(@%s): %s", username, detail)
            raise InstagramError(f"Instagramログインに失敗しました: {detail}")
        except Exception as e:
            detail = self._extract_error_detail(e)
            logger.exception("Instagramログインで予期せぬエラー(@%s): %s", username, detail)
            raise InstagramError(f"ログインに失敗しました: {detail}")

    def _extract_error_detail(self, exc: Exception) -> str:
        """instagrapi例外から可能な限り具体的なメッセージを取り出す"""
        # instagrapiの例外はレスポンスJSON(message等)を保持していることがある
        for attr in ("message",):
            value = getattr(exc, attr, None)
            if value:
                return str(value)
        return str(exc) or exc.__class__.__name__

    def upload_photo(self, session_data_encrypted: str, image_path: str, caption: str) -> str:
        """写真を投稿し、投稿されたメディアのIDを返す"""
        cl = self.get_client(session_data_encrypted)

        # セッションが有効か確認、無効ならログインエラー
        if not self._is_session_valid(cl):
            raise ValidationError("Instagramセッションの有効期限が切れています。再連携してください。")

        try:
            # instagrapiで写真をアップロード (image_path はローカルパス)
            media = cl.photo_upload(path=image_path, caption=caption)
            return media.pk
        except Exception as e:
            raise InstagramError(f"写真の投稿に失敗しました: {self._extract_error_detail(e)}")


instagram_service = InstagramService()
