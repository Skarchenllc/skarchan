from sqlalchemy import Column, String, Text, Integer, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base



class ProductionLine(Base):
    __tablename__ = "production_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    line_code = Column(String(50), unique=True, nullable=False)
    line_name = Column(String(100), nullable=False)
    status = Column(String(20), default="operational")  # operational, maintenance, down
    capacity_per_hour = Column(Integer, default=0)
    current_work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True)
    last_maintenance_date = Column(Date)
    next_maintenance_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "line_code": self.line_code,
            "line_name": self.line_name,
            "status": self.status,
            "capacity_per_hour": self.capacity_per_hour,
            "current_work_order_id": str(self.current_work_order_id) if self.current_work_order_id else None,
            "last_maintenance_date": self.last_maintenance_date.isoformat() if self.last_maintenance_date else None,
            "next_maintenance_date": self.next_maintenance_date.isoformat() if self.next_maintenance_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
