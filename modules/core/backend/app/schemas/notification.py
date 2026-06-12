from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class NotificationBase(BaseModel):
    """Base notification schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Notification title")
    message: str = Field(..., min_length=1, description="Notification message")
    category: str = Field(default="info", description="Notification category")
    channel: str = Field(default="in_app", description="Delivery channel")
    priority: str = Field(default="normal", description="Priority level")


class NotificationCreate(NotificationBase):
    """Create notification schema"""
    user_id: UUID = Field(..., description="Recipient user ID")
    org_id: UUID = Field(..., description="Organization ID")
    module_name: Optional[str] = Field(None, max_length=100, description="Module name")
    resource_type: Optional[str] = Field(None, max_length=100, description="Resource type")
    resource_id: Optional[UUID] = Field(None, description="Resource ID")
    resource_url: Optional[str] = Field(None, max_length=500, description="Deep link URL")
    action_buttons: Optional[list[dict]] = Field(default_factory=list, description="Action buttons")
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")
    sender_user_id: Optional[UUID] = Field(None, description="Sender user ID")
    sender_name: Optional[str] = Field(None, max_length=255, description="Sender name")
    notification_group: Optional[str] = Field(None, max_length=100, description="Notification group")
    expires_date: Optional[datetime] = Field(None, description="Expiry date")


class NotificationUpdate(BaseModel):
    """Update notification schema"""
    is_read: Optional[bool] = None
    read_date: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    """Notification response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    user_id: UUID
    module_name: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[UUID] = None
    resource_url: Optional[str] = None
    action_buttons: list
    is_read: bool
    read_date: Optional[datetime] = None
    is_sent: bool
    sent_date: Optional[datetime] = None
    delivery_status: Optional[str] = None
    metadata: dict
    sender_user_id: Optional[UUID] = None
    sender_name: Optional[str] = None
    notification_group: Optional[str] = None
    expires_date: Optional[datetime] = None
    created_date: datetime


class NotificationListResponse(BaseModel):
    """Notification list response with pagination"""
    total: int
    unread_count: int
    page: int
    page_size: int
    notifications: list[NotificationResponse]


class NotificationMarkAllRead(BaseModel):
    """Mark all notifications as read"""
    notification_ids: Optional[list[UUID]] = Field(None, description="Specific notification IDs to mark as read")


class NotificationBulkSend(BaseModel):
    """Bulk send notifications"""
    user_ids: list[UUID] = Field(..., description="List of recipient user IDs")
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    category: str = Field(default="info")
    channel: str = Field(default="in_app")
    priority: str = Field(default="normal")
    module_name: Optional[str] = None
    action_buttons: Optional[list[dict]] = Field(default_factory=list)
