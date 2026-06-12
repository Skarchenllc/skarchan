from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "core_audit_logs"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Organization (Multi-tenancy)
    org_id = Column(UUID(as_uuid=True), ForeignKey("core_organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    # User who performed the action
    user_id = Column(UUID(as_uuid=True), ForeignKey("core_users.id", ondelete="SET NULL"), index=True)

    # Event Info
    event_type = Column(String(100), nullable=False, index=True)  # user.login, crm.account.create, hr.employee.update
    event_category = Column(String(50), index=True)  # auth, data, settings, security, system
    event_description = Column(Text)

    # Module & Resource
    module_name = Column(String(100), index=True)  # crm, hr, accounting, core
    resource_type = Column(String(100), index=True)  # account, contact, employee, user
    resource_id = Column(UUID(as_uuid=True), index=True)  # ID of the affected resource
    resource_name = Column(String(255))  # Human-readable name

    # Action Details
    action = Column(String(50), index=True)  # create, read, update, delete, login, logout, export
    old_values = Column(JSONB)  # Previous values (for updates)
    new_values = Column(JSONB)  # New values (for updates/creates)
    changes = Column(JSONB)  # Specific field changes

    # Request Info
    ip_address = Column(INET)
    user_agent = Column(Text)
    request_method = Column(String(10))  # GET, POST, PUT, DELETE
    request_path = Column(String(500))
    request_params = Column(JSONB)

    # Result
    status = Column(String(50))  # success, failed, error
    error_message = Column(Text)

    # Session Info
    session_id = Column(UUID(as_uuid=True))

    # Compliance & Security
    severity = Column(String(20))  # info, warning, critical
    is_security_event = Column(Boolean, default=False)
    compliance_category = Column(String(50))  # gdpr, hipaa, sox, pci

    # Timestamp
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    organization = relationship("Organization", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])

    def __repr__(self):
        return f"<AuditLog(id={self.id}, event_type={self.event_type}, user_id={self.user_id}, created_date={self.created_date})>"

    @property
    def is_data_modification(self) -> bool:
        """Check if this event modified data"""
        return self.action in ['create', 'update', 'delete']

    @property
    def is_authentication_event(self) -> bool:
        """Check if this is an authentication event"""
        return self.event_category == 'auth' or self.event_type.startswith('user.login')
