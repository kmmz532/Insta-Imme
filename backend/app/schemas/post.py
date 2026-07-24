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
    instagram_post_id: Optional[str] = None
    posted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
