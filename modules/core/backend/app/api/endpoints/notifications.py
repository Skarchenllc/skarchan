from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse,
    NotificationMarkAllRead,
    NotificationBulkSend,
)
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services.notification_service import NotificationService


router = APIRouter()


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get notifications for current user.

    - **page**: Page number
    - **page_size**: Items per page
    - **unread_only**: Return only unread notifications
    """
    notification_service = NotificationService(db)
    notifications, total, unread_count = await notification_service.get_user_notifications(
        user_id=current_user.id,
        org_id=current_user.org_id,
        page=page,
        page_size=page_size,
        unread_only=unread_only
    )

    return NotificationListResponse(
        total=total,
        unread_count=unread_count,
        page=page,
        page_size=page_size,
        notifications=notifications
    )


@router.get("/unread/count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get count of unread notifications."""
    notification_service = NotificationService(db)
    count = await notification_service.get_unread_count(
        user_id=current_user.id,
        org_id=current_user.org_id
    )

    return {"unread_count": count}


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new notification.

    Typically called by other modules/services.
    """
    notification_service = NotificationService(db)
    notification = await notification_service.create_notification(notification_data)

    return notification


@router.post("/bulk-send")
async def bulk_send_notifications(
    bulk_data: NotificationBulkSend,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send notification to multiple users."""
    notification_service = NotificationService(db)
    notifications = await notification_service.bulk_send_notification(
        user_ids=bulk_data.user_ids,
        org_id=current_user.org_id,
        title=bulk_data.title,
        message=bulk_data.message,
        category=bulk_data.category,
        channel=bulk_data.channel,
        priority=bulk_data.priority,
        module_name=bulk_data.module_name,
        action_buttons=bulk_data.action_buttons,
    )

    return {"message": f"Sent {len(notifications)} notifications"}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark notification as read."""
    notification_service = NotificationService(db)
    notification = await notification_service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification


@router.post("/mark-all-read")
async def mark_all_read(
    mark_data: NotificationMarkAllRead,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications (or specific ones) as read."""
    notification_service = NotificationService(db)
    await notification_service.mark_all_as_read(
        user_id=current_user.id,
        org_id=current_user.org_id,
        notification_ids=mark_data.notification_ids
    )

    return {"message": "Notifications marked as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete notification."""
    notification_service = NotificationService(db)
    await notification_service.delete_notification(
        notification_id=notification_id,
        user_id=current_user.id
    )
