"""Deliver AI output to the existing in-app Notifications system."""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.notification import Notification


async def notify_users(db: AsyncSession, *, title: str, message: str, category: str = "alert",
                       priority: str = "normal", module_name: str | None = None,
                       resource_url: str | None = None, group: str | None = None) -> int:
    """Create an in-app notification for every active user. Returns count created."""
    users = (await db.execute(select(User))).scalars().all()
    buttons = [{"label": "Review", "url": resource_url or "/nexacore/ai"}]
    n = 0
    for u in users:
        if getattr(u, "is_active", True) is False or not u.org_id:
            continue
        db.add(Notification(
            org_id=u.org_id, user_id=u.id, title=title[:255], message=(message or "")[:2000],
            category=category, channel="in_app", priority=priority, module_name=module_name,
            resource_url=resource_url, action_buttons=buttons, sender_name="AI",
            notification_group=group, is_read=False, is_sent=True,
            delivery_status="delivered", sent_date=datetime.utcnow(),
        ))
        n += 1
    await db.commit()
    return n
