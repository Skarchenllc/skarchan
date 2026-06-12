from sqlalchemy import Column, Integer, String, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Association table for many-to-many relationship between roles and permissions
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
)


class Role(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", secondary="user_roles", back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

    def __repr__(self):
        return f"<Role(id={self.id}, name={self.name})>"


class Permission(Base):
    __tablename__ = 'permissions'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    resource = Column(String, nullable=False)  # e.g., 'users', 'roles', 'settings'
    action = Column(String, nullable=False)    # e.g., 'create', 'read', 'update', 'delete'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

    def __repr__(self):
        return f"<Permission(id={self.id}, name={self.name}, resource={self.resource}, action={self.action})>"
