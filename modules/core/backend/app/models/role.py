from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class Role(Base):
    __tablename__ = "core_roles"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Organization (Multi-tenancy) - NULL for system roles
    org_id = Column(UUID(as_uuid=True), ForeignKey("core_organizations.id", ondelete="CASCADE"), index=True)

    # Role Info
    role_code = Column(String(100), nullable=False, index=True)  # super_admin, org_admin, crm_admin, etc.
    role_name = Column(String(255), nullable=False)
    role_description = Column(Text)

    # Permissions
    permissions = Column(JSONB, default=list)  # ['*', 'crm.*', 'crm.accounts.create']

    # Role Type
    is_system_role = Column(Boolean, default=False)  # System roles cannot be deleted
    is_custom_role = Column(Boolean, default=False)  # Custom roles created by organization

    # Scope
    scope = Column(String(50), default='organization')  # system, organization, module
    module_name = Column(String(100))  # crm, hr, accounting, etc.

    # Hierarchy
    parent_role_id = Column(UUID(as_uuid=True), ForeignKey("core_roles.id"))
    hierarchy_level = Column(Integer, default=0)  # 0 = highest, 999 = lowest

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
    organization = relationship("Organization", back_populates="roles")
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    parent_role = relationship("Role", remote_side=[id], backref="child_roles")

    def __repr__(self):
        return f"<Role(id={self.id}, role_code={self.role_code}, role_name={self.role_name})>"

    def has_permission(self, permission_code: str) -> bool:
        """Check if this role has a specific permission"""
        if not self.permissions:
            return False

        # Wildcard permission grants everything
        if "*" in self.permissions:
            return True

        # Direct permission match
        if permission_code in self.permissions:
            return True

        # Module wildcard match (e.g., 'crm.*' matches 'crm.accounts.create')
        parts = permission_code.split('.')
        if len(parts) >= 2:
            module_wildcard = f"{parts[0]}.*"
            if module_wildcard in self.permissions:
                return True

        return False


class Permission(Base):
    __tablename__ = "core_permissions"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Permission Info
    permission_code = Column(String(255), unique=True, nullable=False, index=True)  # crm.accounts.create
    permission_name = Column(String(255), nullable=False)
    permission_description = Column(Text)

    # Permission Category
    module_name = Column(String(100), index=True)  # crm, hr, accounting
    resource_type = Column(String(100))  # accounts, contacts, employees
    action = Column(String(50))  # create, read, update, delete, export

    # Permission Type
    is_system_permission = Column(Boolean, default=False)
    permission_category = Column(String(100))  # data, settings, admin, reports

    # Status
    is_active = Column(Boolean, default=True)

    # Audit Fields
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True))
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True))

    def __repr__(self):
        return f"<Permission(id={self.id}, permission_code={self.permission_code})>"


class UserRole(Base):
    __tablename__ = "core_user_roles"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("core_users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("core_roles.id", ondelete="CASCADE"), nullable=False, index=True)

    # Assignment Info
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("core_users.id"))
    assigned_date = Column(DateTime, default=datetime.utcnow)

    # Time-bound Role Assignment
    valid_from = Column(DateTime)
    valid_until = Column(DateTime)

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
    user = relationship("User", back_populates="user_roles", foreign_keys=[user_id])
    role = relationship("Role", back_populates="user_roles")
    assigner = relationship("User", foreign_keys=[assigned_by])

    def __repr__(self):
        return f"<UserRole(id={self.id}, user_id={self.user_id}, role_id={self.role_id})>"

    def is_valid(self) -> bool:
        """Check if this role assignment is currently valid"""
        if not self.is_active:
            return False

        now = datetime.utcnow()

        if self.valid_from and now < self.valid_from:
            return False

        if self.valid_until and now > self.valid_until:
            return False

        return True
