from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class WatermarkSettings(BaseModel):
    enabled: bool = False
    text: str = ""
    position: str = "bottom_right"  # top_left, top_right, bottom_left, bottom_right, center
    font_size: int = 36

class PresetBase(BaseModel):
    name: str
    caption_template: str = ""
    hashtags: str = ""  # スペースまたはカンマ区切り
    # watermark_template には WatermarkSettings をJSONシリアライズした文字列が入るが、
    # スキーマ上はオブジェクトとして扱い、サービス/ルート層で相互変換する
    watermark: Optional[WatermarkSettings] = None

class PresetCreate(PresetBase):
    pass

class PresetUpdate(PresetBase):
    pass

class PresetResponse(BaseModel):
    id: str
    user_id: str
    name: str
    caption_template: str
    hashtags: str
    watermark: WatermarkSettings
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
