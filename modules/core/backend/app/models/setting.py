from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class Setting(Base):
    __tablename__ = "core_settings"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Organization (Multi-tenancy) - NULL for system settings
    org_id = Column(UUID(as_uuid=True), ForeignKey("core_organizations.id", ondelete="CASCADE"), index=True)

    # User - NULL for org-level settings
    user_id = Column(UUID(as_uuid=True), ForeignKey("core_users.id", ondelete="CASCADE"), index=True)

    # Setting Identification
    setting_key = Column(String(255), nullable=False, index=True)  # email.smtp.host, ui.theme, crm.default_currency
    setting_category = Column(String(100), index=True)  # system, organization, module, user
    module_name = Column(String(100), index=True)  # crm, hr, accounting, core

    # Setting Value
    setting_value = Column(JSONB, nullable=False)  # Flexible JSON value
    value_type = Column(String(50))  # string, number, boolean, object, array

    # Default Value
    default_value = Column(JSONB)

    # Metadata
    setting_name = Column(String(255))
    setting_description = Column(Text)
    setting_group = Column(String(100))  # Group related settings

    # Constraints
    is_required = Column(Boolean, default=False)
    is_encrypted = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)  # Can be exposed to frontend
    validation_rules = Column(JSONB)  # JSON schema for validation

    # Scope
    scope = Column(String(50), default='organization')  # system, organization, module, user

    # Status
    is_active = Column(Boolean, default=True)
    deleted_flag = Column(Boolean, default=False)

    # Audit Fields
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True))
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True))
    deleted_date = Column(DateTime)
    deleted_by = Column(UUID(as_uuid=True))

    # Relationships
    organization = relationship("Organization", back_populates="settings")

    def __repr__(self):
        return f"<Setting(id={self.id}, setting_key={self.setting_key}, scope={self.scope})>"

    @property
    def is_system_setting(self) -> bool:
        """Check if this is a system-level setting"""
        return self.scope == 'system' and self.org_id is None

    @property
    def is_organization_setting(self) -> bool:
        """Check if this is an organization-level setting"""
        return self.scope == 'organization' and self.org_id is not None and self.user_id is None

    @property
    def is_user_setting(self) -> bool:
        """Check if this is a user-level setting"""
        return self.scope == 'user' and self.user_id is not None

    def get_typed_value(self):
        """Return setting value with proper type casting"""
        if self.value_type == 'boolean':
            return bool(self.setting_value)
        elif self.value_type == 'number':
            return float(self.setting_value) if '.' in str(self.setting_value) else int(self.setting_value)
        elif self.value_type == 'string':
            return str(self.setting_value)
        else:
            return self.setting_value  # Return as-is for objects/arrays
