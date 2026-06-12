"""
Custom Fields Models - Centralized in Core Backend.
Owns the canonical custom_field_definitions / custom_field_values tables
shared across ALL modules.
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Date, DECIMAL, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class CustomFieldDefinition(Base):
    """
    Custom Field Definitions for extending ANY entity across the system.
    Backed by the canonical custom_field_definitions table.
    """
    __tablename__ = "custom_field_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Field Metadata
    field_name = Column(String(100), nullable=False)
    field_label = Column(String(255), nullable=False)
    field_type = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)

    # Field Configuration
    is_required = Column(Boolean, default=False)
    is_unique = Column(Boolean, default=False)
    is_searchable = Column(Boolean, default=True)
    default_value = Column(Text)
    help_text = Column(Text)

    # Picklist / list lookup
    picklist_values = Column(JSONB)  # legacy inline values; prefer list_code
    list_code = Column(String(100), nullable=True)

    # Validation
    validation_type = Column(String(50))
    validation_rule = Column(JSONB)

    # Display
    display_order = Column(Integer, default=0)
    is_visible = Column(Boolean, default=True)
    field_group = Column(String(100))

    # Security flags
    is_encrypted = Column(Boolean, default=False)
    is_pii = Column(Boolean, default=False)
    is_sensitive = Column(Boolean, default=False)
    encryption_key_ref = Column(String(255), nullable=True)

    # Timestamps + auditing
    created_date = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)

    # Soft delete (boolean in canonical schema)
    deleted_flag = Column(Boolean, default=False, nullable=False)

    # Relationships
    field_values = relationship(
        "CustomFieldValue",
        back_populates="field_definition",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "field_name": self.field_name,
            "field_label": self.field_label,
            "field_type": self.field_type,
            "entity_type": self.entity_type,
            "is_required": self.is_required,
            "is_unique": self.is_unique,
            "is_visible": self.is_visible,
            "is_searchable": self.is_searchable,
            "display_order": self.display_order,
            "picklist_values": self.picklist_values,
            "list_code": self.list_code,
            "help_text": self.help_text,
            "field_group": self.field_group,
            "default_value": self.default_value,
            "validation_type": self.validation_type,
            "validation_rule": self.validation_rule,
            "is_encrypted": self.is_encrypted,
            "is_pii": self.is_pii,
            "is_sensitive": self.is_sensitive,
            "created_by": str(self.created_by) if self.created_by else None,
            "last_modified_by": str(self.last_modified_by) if self.last_modified_by else None,
            "created_date": self.created_date.isoformat() if self.created_date else None,
            "last_modified_date": self.last_modified_date.isoformat() if self.last_modified_date else None,
        }


class CustomFieldValue(Base):
    """
    Custom Field Values - per-record values for a field definition.
    Backed by the canonical custom_field_values table.
    """
    __tablename__ = "custom_field_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    field_definition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("custom_field_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    # Polymorphic value storage
    value_text = Column(Text)
    value_number = Column(DECIMAL(20, 4))
    value_date = Column(Date)
    value_datetime = Column(DateTime)
    value_boolean = Column(Boolean)
    value_json = Column(JSONB)

    # Auditing
    created_date = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), nullable=False)

    field_definition = relationship("CustomFieldDefinition", back_populates="field_values")
