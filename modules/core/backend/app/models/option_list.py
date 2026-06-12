"""
Option Lists Model - For managing dropdown options and picklists
Option Lists can be used for select/picklist fields across the system
"""
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.session import Base


class OptionList(Base):
    """
    Option Lists - Master lists for dropdown/picklist options
    Examples: "Countries", "Industries", "Priority Levels", "Status Values"
    """
    __tablename__ = "option_lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # List identification
    list_code = Column(String(100), unique=True, nullable=False, index=True)  # e.g., "countries", "industries"
    list_name = Column(String(255), nullable=False)  # e.g., "Countries", "Industries"
    list_label = Column(String(255), nullable=False)  # Display name

    # List metadata
    description = Column(Text)

    # Scope - can be used across all entities or specific to certain modules
    scope = Column(String(50), default='global')  # 'global', 'module_specific', 'entity_specific'
    module_code = Column(String(100), nullable=True)  # If module_specific
    entity_type = Column(String(100), nullable=True)  # If entity_specific

    # Organization and permissions
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    is_system_list = Column(Boolean, default=False)  # True for built-in lists
    is_active = Column(Boolean, default=True)

    # Audit fields
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Soft delete
    is_deleted = Column(String(1), default='N', nullable=False)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    options = relationship(
        "OptionListItem",
        back_populates="option_list",
        cascade="all, delete-orphan",
        lazy="selectin",
        viewonly=True,
        primaryjoin="and_(OptionList.id==OptionListItem.option_list_id, OptionListItem.is_deleted=='N')"
    )

    # Indexes
    __table_args__ = (
        Index('idx_option_lists_org_scope', 'organization_id', 'scope'),
        Index('idx_option_lists_module', 'module_code'),
        Index('idx_option_lists_deleted', 'is_deleted'),
    )


class OptionListItem(Base):
    """
    Individual items/options within an Option List
    """
    __tablename__ = "option_list_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    option_list_id = Column('list_id', UUID(as_uuid=True), ForeignKey('option_lists.id'), nullable=False, index=True)

    # Option data
    option_value = Column(String(255), nullable=False)  # The actual value stored
    option_label = Column(String(255), nullable=False)  # The display label
    option_description = Column('description', Text, nullable=True)

    # Additional metadata stored as JSON
    item_metadata = Column(JSON, default={})  # e.g., {"color": "#FF0000", "icon": "flag"}

    # Ordering and status
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Default selection

    # Audit fields
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Soft delete
    is_deleted = Column(String(1), default='N', nullable=False)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    option_list = relationship("OptionList", back_populates="options")

    # Indexes
    __table_args__ = (
        Index('idx_option_items_list_order', 'list_id', 'display_order'),
        Index('idx_option_items_deleted', 'is_deleted'),
    )
