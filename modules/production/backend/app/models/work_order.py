from sqlalchemy import Column, String, Text, Integer, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base



class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_order_number = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    bom_id = Column(UUID(as_uuid=True), ForeignKey("bill_of_materials.id"), nullable=True)
    quantity_planned = Column(Integer, nullable=False)
    quantity_produced = Column(Integer, default=0)
    quantity_rejected = Column(Integer, default=0)
    status = Column(String(20), default="draft")  # draft, scheduled, in_progress, completed, cancelled
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    scheduled_start_date = Column(Date)
    scheduled_end_date = Column(Date)
    actual_start_date = Column(DateTime)
    actual_end_date = Column(DateTime)
    production_line = Column(String(50))
    assigned_to = Column(String(100))
    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "work_order_number": self.work_order_number,
            "product_id": str(self.product_id),
            "bom_id": str(self.bom_id) if self.bom_id else None,
            "quantity_planned": self.quantity_planned,
            "quantity_produced": self.quantity_produced,
            "quantity_rejected": self.quantity_rejected,
            "status": self.status,
            "priority": self.priority,
            "scheduled_start_date": self.scheduled_start_date.isoformat() if self.scheduled_start_date else None,
            "scheduled_end_date": self.scheduled_end_date.isoformat() if self.scheduled_end_date else None,
            "actual_start_date": self.actual_start_date.isoformat() if self.actual_start_date else None,
            "actual_end_date": self.actual_end_date.isoformat() if self.actual_end_date else None,
            "production_line": self.production_line,
            "assigned_to": self.assigned_to,
            "notes": self.notes,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
