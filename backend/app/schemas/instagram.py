from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Literal

class InstagramLogin(BaseModel):
    username: str
    password: str
    verification_code: Optional[str] = None  # 2FA用

class AutoPresetRule(BaseModel):
    dayOfWeek: Literal["weekday", "weekend", "all"]
    timeRange: Literal["morning", "day", "night", "late_night"]
    presetId: str

class AutoPresetSettings(BaseModel):
    enabled: bool
    rules: List[AutoPresetRule]

class InstagramAccountResponse(BaseModel):
    id: str
    username: str
    preset_id: Optional[str] = None
    # レポンス時はパース済みのオブジェクトとして返す
    auto_rules: Optional[AutoPresetSettings] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InstagramAssociatePreset(BaseModel):
    presetId: Optional[str] = None

