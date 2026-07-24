import os
import shutil
from fastapi import UploadFile
from PIL import Image, ImageDraw, ImageFont
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
        for file in os.listdir(settings.upload_dir):
            if file.startswith(f"{user_id}_{image_id}"):
                return os.path.join(settings.upload_dir, file)
        
        raise NotFoundError("画像が見つかりません")

    def apply_watermark(self, image_path: str, text: str, position: str = "bottom_right", font_size: int = 36) -> None:
        """画像に透かし文字を焼き込む (Pillow使用)"""
        try:
            img = Image.open(image_path)
            # EXIFの向き情報に基づいて画像を回転させておく (Pillow標準の orientation 処理)
            img = self._rotate_by_exif(img)
            
            draw = ImageDraw.Draw(img)
            
            # フォントのロード試行
            font = None
            font_paths = [
                "C:\\Windows\\Fonts\\msgothic.ttc",  # Windows 日本語
                "C:\\Windows\\Fonts\\arial.ttf",      # Windows 英語
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", # Linux 英語
                "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf" # Linux 日本語 (一般的なもの)
            ]
            for path in font_paths:
                if os.path.exists(path):
                    try:
                        font = ImageFont.truetype(path, font_size)
                        break
                    except Exception:
                        pass
            
            if font is None:
                font = ImageFont.load_default()

            # テキストサイズの算出 (Pillow 10.0以降のtextbbox対応)
            try:
                bbox = draw.textbbox((0, 0), text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
            except Exception:
                # 古いPillow用のフォールバック
                text_w, text_h = draw.textsize(text, font=font) # type: ignore[attr-defined]

            img_w, img_h = img.size
            margin = 30
            
            # 表示座標の決定
            if position == "top_left":
                x, y = margin, margin
            elif position == "top_right":
                x, y = img_w - text_w - margin, margin
            elif position == "bottom_left":
                x, y = margin, img_h - text_h - margin
            elif position == "bottom_right":
                x, y = img_w - text_w - margin, img_h - text_h - margin
            else:  # center
                x, y = (img_w - text_w) // 2, (img_h - text_h) // 2

            # 視認性向上のための黒ふち (アウトライン) 描画
            for dx, dy in [(-2,-2), (-2,2), (2,-2), (2,2), (-1,0), (1,0), (0,-1), (0,1)]:
                draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, 180))
            
            # 白文字の描画
            draw.text((x, y), text, font=font, fill=(255, 255, 255, 240))
            
            # 保存 (元のフォーマットを維持)
            img.save(image_path, format=img.format)
        except Exception as e:
            raise ValidationError(f"透かしの適用に失敗しました: {str(e)}")

    def _rotate_by_exif(self, img: Image.Image) -> Image.Image:
        """EXIF情報のOrientationに基づいて画像を回転する"""
        try:
            exif = img._getexif() # type: ignore[attr-defined]
            if exif:
                orientation = exif.get(274)
                if orientation == 3:
                    return img.rotate(180, expand=True)
                elif orientation == 6:
                    return img.rotate(270, expand=True)
                elif orientation == 8:
                    return img.rotate(90, expand=True)
        except Exception:
            pass
        return img

    def delete_image(self, user_id: str, image_id: str) -> None:
        """画像を削除する"""
        try:
            path = self.get_image_path(user_id, image_id)
            if os.path.exists(path):
                os.remove(path)
        except NotFoundError:
            pass
        except Exception as e:
            raise ValidationError(f"ファイルの削除に失敗しました: {str(e)}")

image_service = ImageService()
