"""
Entity Records Model - Centralized in Core Backend
Universal entity data storage for ALL modules
Drupal-style entity system - stores dynamic data in JSON
"""
from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSON
from datetime import datetime
import uuid

from app.db.session import Base


class EntityRecord(Base):
    """
    Universal Entity Record - stores data for any entity type across all modules

    This is the Drupal-style content storage system that works for:
    - CRM: accounts, contacts, opportunities, leads
    - Inventory: warehouses, stock_items, stock_transfers
    - SCM: suppliers, purchase_orders, shipments
    - Customer Service: tickets, cases, feedback
    - Project Management: projects, tasks, milestones
    - Any custom module entities

    The 'data' JSON column stores all field values dynamically.
    """
    __tablename__ = "entity_records"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Entity Identification
    entity_type = Column(String(100), nullable=False, index=True)  # warehouses, accounts, products, etc.
    module_code = Column(String(50), nullable=False, index=True)   # inventory, crm, scm, etc.

    # Dynamic Data Storage (all field values stored here as JSON)
    data = Column(JSON, nullable=False, default={})

    # Organization (multi-tenancy)
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Audit Trail
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)

    # Soft Delete
    is_deleted = Column(String(1), default='N', nullable=False)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('idx_entity_records_type_module', 'entity_type', 'module_code', 'is_deleted'),
        Index('idx_entity_records_org', 'organization_id', 'is_deleted'),
        Index('idx_entity_records_module', 'module_code', 'is_deleted'),
    )

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "entity_type": self.entity_type,
            "module_code": self.module_code,
            "data": self.data,
            "organization_id": str(self.organization_id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "created_by": str(self.created_by) if self.created_by else None,
            "last_modified_at": self.last_modified_at.isoformat() if self.last_modified_at else None,
            "last_modified_by": str(self.last_modified_by) if self.last_modified_by else None,
        }
