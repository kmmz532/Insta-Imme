import os
import shutil
from fastapi import UploadFile
from app.config import settings
from app.lib.errors import ValidationError, NotFoundError

class ImageService:
    def __init__(self):
        os.makedirs(settings.upload_dir, exist_ok=True)

    def save_image(self, file: UploadFile, user_id: str) -> str:
        """アップロードされた画像を一時保存する"""
        if not file.content_type.startswith("image/"):
            raise ValidationError("画像ファイルのみアップロード可能です")

        # ユニークなファイル名を生成
        import uuid
        image_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        file_name = f"{user_id}_{image_id}{ext}"
        file_path = os.path.join(settings.upload_dir, file_name)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise ValidationError(f"ファイルの保存に失敗しました: {str(e)}")

        return image_id

    def get_image_path(self, user_id: str, image_id: str) -> str:
        """画像の絶対パスを取得する"""
        # セキュリティ対策: uploadsディレクトリ内のファイルのみ許可
        for file in os.listdir(settings.upload_dir):
            if file.startswith(f"{user_id}_{image_id}"):
                return os.path.join(settings.upload_dir, file)
        
        raise NotFoundError("画像が見つかりません")

    def delete_image(self, user_id: str, image_id: str) -> None:
        """画像を削除する"""
        try:
            path = self.get_image_path(user_id, image_id)
            if os.path.exists(path):
                os.remove(path)
        except NotFoundError:
            pass
        except Exception as e:
            # ログ出力など (AGENTS.md: try-catchの握りつぶし禁止に注意するが、削除失敗時は警告とする)
            raise ValidationError(f"ファイルの削除に失敗しました: {str(e)}")

image_service = ImageService()
