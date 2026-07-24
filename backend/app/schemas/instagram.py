from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class InstagramLogin(BaseModel):
    username: str
    password: str
    verification_code: Optional[str] = None  # 2FA用

class InstagramAccountResponse(BaseModel):
    id: str
    username: str
    preset_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InstagramAssociatePreset(BaseModel):
    presetId: Optional[str] = None
