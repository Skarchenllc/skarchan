from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role_ids: List[int] = []


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    role_ids: Optional[List[int]] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_ids: List[int] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
