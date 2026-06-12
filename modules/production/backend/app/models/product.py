from sqlalchemy import Column, String, Text, Boolean, Integer, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base



class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_code = Column(String(50), unique=True, nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(50), nullable=False)  # raw_material, component, finished_good
    unit_of_measure = Column(String(20), nullable=False)  # pieces, kg, liters, etc.
    standard_cost = Column(Numeric(10, 2), default=0.00)
    selling_price = Column(Numeric(10, 2), default=0.00)
    reorder_point = Column(Integer, default=0)
    lead_time_days = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    specifications = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "product_code": self.product_code,
            "product_name": self.product_name,
            "description": self.description,
            "category": self.category,
            "unit_of_measure": self.unit_of_measure,
            "standard_cost": float(self.standard_cost) if self.standard_cost else 0.00,
            "selling_price": float(self.selling_price) if self.selling_price else 0.00,
            "reorder_point": self.reorder_point,
            "lead_time_days": self.lead_time_days,
            "is_active": self.is_active,
            "specifications": self.specifications,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
