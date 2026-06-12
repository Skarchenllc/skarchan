from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class Notification(Base):
    __tablename__ = "core_notifications"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Organization (Multi-tenancy)
    org_id = Column(UUID(as_uuid=True), ForeignKey("core_organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Recipient
    user_id = Column(UUID(as_uuid=True), ForeignKey("core_users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Notification Content
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), index=True)  # info, warning, error, success, task, approval, alert

    # Delivery Channels
    channel = Column(String(50), default='in_app')  # in_app, email, sms, push
    priority = Column(String(20), default='normal')  # low, normal, high, urgent

    # Module & Resource Context
    module_name = Column(String(100), index=True)  # crm, hr, accounting
    resource_type = Column(String(100))  # account, contact, employee, task
    resource_id = Column(UUID(as_uuid=True), index=True)
    resource_url = Column(String(500))  # Deep link to resource

    # Action Buttons
    action_buttons = Column(JSONB, default=list)  # [{"label": "View", "url": "/accounts/123"}]

    # Status
    is_read = Column(Boolean, default=False, index=True)
    read_date = Column(DateTime)
    is_sent = Column(Boolean, default=False)
    sent_date = Column(DateTime)
    delivery_status = Column(String(50))  # pending, sent, delivered, failed
    delivery_error = Column(Text)

    # Metadata
    notification_metadata = Column(JSONB, default=dict)  # Additional custom data

    # Sender
    sender_user_id = Column(UUID(as_uuid=True), ForeignKey("core_users.id", ondelete="SET NULL"))
    sender_name = Column(String(255))  # System, Admin, etc.

    # Grouping & Threading
    notification_group = Column(String(100))  # Group related notifications
    parent_notification_id = Column(UUID(as_uuid=True), ForeignKey("core_notifications.id"))

    # Expiry
    expires_date = Column(DateTime)

    # Soft Delete
    deleted_flag = Column(Boolean, default=False)

    # Audit Fields
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True))
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True))
    deleted_date = Column(DateTime)
    deleted_by = Column(UUID(as_uuid=True))

    # Relationships
    organization = relationship("Organization", back_populates="notifications")
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])
    sender = relationship("User", foreign_keys=[sender_user_id])
    parent_notification = relationship("Notification", remote_side=[id], backref="child_notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, title={self.title}, user_id={self.user_id}, is_read={self.is_read})>"

    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.read_date = datetime.utcnow()

    def mark_as_sent(self):
        """Mark notification as sent"""
        self.is_sent = True
        self.sent_date = datetime.utcnow()
        self.delivery_status = 'sent'

    @property
    def is_expired(self) -> bool:
        """Check if notification has expired"""
        if not self.expires_date:
            return False
        return datetime.utcnow() > self.expires_date

    @property
    def is_urgent(self) -> bool:
        """Check if notification is urgent"""
        return self.priority == 'urgent'
