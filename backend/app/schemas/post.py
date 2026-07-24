from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class PostPublish(BaseModel):
    imageId: str
    instagramAccountId: str
    caption: str

class PostResponse(BaseModel):
    id: str
    status: str
    image_id: Optional[str] = None
    instagram_post_id: Optional[str] = None
    posted_at: Optional[datetime] = None
    caption: str
    instagram_account_id: str

    model_config = ConfigDict(from_attributes=True)
