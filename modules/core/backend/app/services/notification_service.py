from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationUpdate


class NotificationService:
    """Service for creating and managing notifications across modules"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        notification_data: NotificationCreate
    ) -> Notification:
        """
        Create a new notification.

        Args:
            notification_data: Notification creation data

        Returns:
            Notification: Created notification
        """
        notification = Notification(
            org_id=notification_data.org_id,
            user_id=notification_data.user_id,
            title=notification_data.title,
            message=notification_data.message,
            category=notification_data.category,
            channel=notification_data.channel,
            priority=notification_data.priority,
            module_name=notification_data.module_name,
            resource_type=notification_data.resource_type,
            resource_id=notification_data.resource_id,
            resource_url=notification_data.resource_url,
            action_buttons=notification_data.action_buttons,
            metadata=notification_data.metadata,
            sender_user_id=notification_data.sender_user_id,
            sender_name=notification_data.sender_name,
            notification_group=notification_data.notification_group,
            expires_date=notification_data.expires_date,
            is_read=False,
            is_sent=False,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)

        # TODO: Trigger actual notification delivery based on channel
        # - For email: Queue email sending job
        # - For SMS: Queue SMS sending job
        # - For push: Send push notification
        # - For in_app: Already saved to database

        return notification

    async def send_notification(
        self,
        user_id: UUID,
        org_id: UUID,
        title: str,
        message: str,
        category: str = "info",
        channel: str = "in_app",
        priority: str = "normal",
        module_name: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[UUID] = None,
        resource_url: Optional[str] = None,
        action_buttons: Optional[List[dict]] = None,
        sender_user_id: Optional[UUID] = None,
        sender_name: Optional[str] = None
    ) -> Notification:
        """
        Quick method to send a notification.

        Args:
            user_id: Recipient user ID
            org_id: Organization ID
            title: Notification title
            message: Notification message
            category: Notification category
            channel: Delivery channel
            priority: Priority level
            module_name: Module name
            resource_type: Resource type
            resource_id: Resource ID
            resource_url: Resource URL
            action_buttons: Action buttons
            sender_user_id: Sender user ID
            sender_name: Sender name

        Returns:
            Notification: Created notification
        """
        notification_data = NotificationCreate(
            org_id=org_id,
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            channel=channel,
            priority=priority,
            module_name=module_name,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_url=resource_url,
            action_buttons=action_buttons or [],
            sender_user_id=sender_user_id,
            sender_name=sender_name,
        )
        return await self.create_notification(notification_data)

    async def bulk_send_notification(
        self,
        user_ids: List[UUID],
        org_id: UUID,
        title: str,
        message: str,
        category: str = "info",
        channel: str = "in_app",
        priority: str = "normal",
        module_name: Optional[str] = None,
        action_buttons: Optional[List[dict]] = None
    ) -> List[Notification]:
        """
        Send notification to multiple users.

        Args:
            user_ids: List of recipient user IDs
            org_id: Organization ID
            title: Notification title
            message: Notification message
            category: Notification category
            channel: Delivery channel
            priority: Priority level
            module_name: Module name
            action_buttons: Action buttons

        Returns:
            List[Notification]: Created notifications
        """
        notifications = []
        for user_id in user_ids:
            notification = await self.send_notification(
                user_id=user_id,
                org_id=org_id,
                title=title,
                message=message,
                category=category,
                channel=channel,
                priority=priority,
                module_name=module_name,
                action_buttons=action_buttons,
            )
            notifications.append(notification)

        return notifications

    async def get_user_notifications(
        self,
        user_id: UUID,
        org_id: UUID,
        page: int = 1,
        page_size: int = 50,
        unread_only: bool = False
    ) -> tuple[List[Notification], int, int]:
        """
        Get notifications for a user.

        Args:
            user_id: User ID
            org_id: Organization ID
            page: Page number
            page_size: Page size
            unread_only: Return only unread notifications

        Returns:
            tuple: (notifications, total_count, unread_count)
        """
        # Build query
        conditions = [
            Notification.user_id == user_id,
            Notification.org_id == org_id,
            Notification.deleted_flag == False
        ]

        if unread_only:
            conditions.append(Notification.is_read == False)

        query = (
            select(Notification)
            .where(and_(*conditions))
            .order_by(Notification.created_date.desc())
        )

        # Get total count
        count_query = select(func.count(Notification.id)).where(and_(*conditions))
        total = await self.db.scalar(count_query)

        # Get unread count
        unread_query = select(func.count(Notification.id)).where(
            and_(
                Notification.user_id == user_id,
                Notification.org_id == org_id,
                Notification.is_read == False,
                Notification.deleted_flag == False
            )
        )
        unread_count = await self.db.scalar(unread_query)

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        notifications = result.scalars().all()

        return list(notifications), total or 0, unread_count or 0

    async def mark_as_read(
        self,
        notification_id: UUID,
        user_id: UUID
    ) -> Notification:
        """
        Mark notification as read.

        Args:
            notification_id: Notification ID
            user_id: User ID (for verification)

        Returns:
            Notification: Updated notification
        """
        notification = await self.db.get(Notification, notification_id)
        if not notification or notification.user_id != user_id:
            return None

        notification.mark_as_read()
        await self.db.commit()
        await self.db.refresh(notification)

        return notification

    async def mark_all_as_read(
        self,
        user_id: UUID,
        org_id: UUID,
        notification_ids: Optional[List[UUID]] = None
    ):
        """
        Mark all notifications as read for a user.

        Args:
            user_id: User ID
            org_id: Organization ID
            notification_ids: Optional list of specific notification IDs to mark as read
        """
        conditions = [
            Notification.user_id == user_id,
            Notification.org_id == org_id,
            Notification.is_read == False,
            Notification.deleted_flag == False
        ]

        if notification_ids:
            conditions.append(Notification.id.in_(notification_ids))

        result = await self.db.execute(
            select(Notification).where(and_(*conditions))
        )
        notifications = result.scalars().all()

        for notification in notifications:
            notification.mark_as_read()

        await self.db.commit()

    async def delete_notification(
        self,
        notification_id: UUID,
        user_id: UUID
    ):
        """
        Delete notification (soft delete).

        Args:
            notification_id: Notification ID
            user_id: User ID (for verification)
        """
        notification = await self.db.get(Notification, notification_id)
        if not notification or notification.user_id != user_id:
            return

        notification.deleted_flag = True
        notification.deleted_date = datetime.utcnow()
        notification.deleted_by = user_id

        await self.db.commit()

    async def get_unread_count(
        self,
        user_id: UUID,
        org_id: UUID
    ) -> int:
        """
        Get count of unread notifications for a user.

        Args:
            user_id: User ID
            org_id: Organization ID

        Returns:
            int: Unread count
        """
        count = await self.db.scalar(
            select(func.count(Notification.id))
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.org_id == org_id,
                    Notification.is_read == False,
                    Notification.deleted_flag == False
                )
            )
        )
        return count or 0
