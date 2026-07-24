from pydantic import BaseModel
from typing import Generic, TypeVar, Any

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
