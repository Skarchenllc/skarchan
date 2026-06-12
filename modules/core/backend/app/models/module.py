"""
Module and Entity Type Models - Centralized in Core Backend
Unified system for ALL modules and entities (like Drupal content types)
NO distinction between "System Modules" and "Custom Modules"
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class Module(Base):
    """
    Module Definition - represents ANY module in the system

    Examples:
    - Core system modules: CRM, Inventory, SCM, HR, Accounting
    - Custom modules: Real Estate, Healthcare, Education

    Like Drupal - no distinction between system and custom
    """
    __tablename__ = "custom_modules"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Module Identification
    module_code = Column(String(50), unique=True, nullable=False, index=True)  # inventory, crm, real_estate
    module_name = Column(String(255), nullable=False)  # "Inventory Management", "CRM"
    module_label = Column(String(255), nullable=False)  # Display name

    # Module Metadata
    description = Column(Text)
    icon = Column(String(50))  # Icon name (lucide-react, heroicons, etc.)
    color = Column(String(20))  # UI theme color

    # Module Configuration
    organization_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # NULL for system modules
    is_system_module = Column(Boolean)  # True for system modules (CRM, Sales, etc.)
    is_active = Column(Boolean, default=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey('custom_modules.id', ondelete='CASCADE'), nullable=True)
    depth = Column(Integer)
    display_order = Column(Integer, default=0)
    show_in_navigation = Column(Boolean)

    # Settings
    settings = Column(JSON, default={})  # Module-specific settings

    # Audit Trail
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    entity_types = relationship("EntityType", back_populates="module", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_modules_org', 'organization_id'),
        Index('idx_modules_parent', 'parent_id'),
    )


class EntityType(Base):
    """
    Entity Type Definition - like Drupal Content Types

    Defines what entities exist in each module
    Examples:
    - CRM module: accounts, contacts, opportunities, leads
    - Inventory module: warehouses, stock_items, stock_transfers
    - Real Estate module: properties, listings, agents

    Previously called "Components" - now unified as Entity Types
    """
    __tablename__ = "custom_components"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Entity Identification
    entity_type_code = Column('component_code', String(100), nullable=False, index=True)  # warehouses, accounts, properties
    entity_type_name = Column('component_name', String(255), nullable=False)  # "Warehouses", "Accounts"
    entity_type_label = Column('component_label', String(255), nullable=False)  # Display name (singular)

    # Module Reference
    module_id = Column(UUID(as_uuid=True), ForeignKey('custom_modules.id', ondelete='CASCADE'), nullable=False)

    # Entity Metadata
    description = Column(Text)
    icon = Column(String(50))  # Icon for this entity type

    # Configuration
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    # UI Configuration
    list_view_config = Column(JSON, default={})    # Table columns, filters
    form_config = Column('form_view_config', JSON, default={})         # Form layout, tabs

    # Permissions
    permissions = Column('permissions_config', JSON, default={})  # CRUD permissions configuration

    # Base fields config (from DB)
    base_fields_config = Column(JSON)

    # Audit Trail
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    module = relationship("Module", back_populates="entity_types")

    __table_args__ = (
        Index('idx_entity_types_module', 'module_id'),
    )
