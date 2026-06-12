"""
Entity Record Model - Stores dynamic data for custom modules/components
This is like a generic entity storage system where different entity types
(components) can store their data with custom fields
"""

from sqlalchemy import Column, String, DateTime, Text, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class EntityRecord(Base):
    """
    Stores records for custom entities (components/sub-branches)
    Each record is associated with an entity_type (component_code)
    and contains custom field data in JSON format
    """
    __tablename__ = "entity_records"

    # Primary identifiers
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(100), nullable=False, index=True)  # component_code (e.g., 'mybranch', 'yourbranch')

    # Custom field data stored as JSON
    # Example: {"custom_my_field": "value1", "custom_another_field": "value2"}
    data = Column(JSON, nullable=False, default={})

    # Metadata
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Soft delete
    is_deleted = Column(String(1), default='N', nullable=False)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_date = Column(DateTime, nullable=True)

    # Indexes for common queries
    __table_args__ = (
        Index('idx_entity_records_org_type', 'organization_id', 'entity_type'),
        Index('idx_entity_records_deleted', 'is_deleted'),
    )

    def __repr__(self):
        return f"<EntityRecord(id={self.id}, entity_type={self.entity_type}, org={self.organization_id})>"
