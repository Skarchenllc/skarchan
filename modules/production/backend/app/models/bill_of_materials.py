from sqlalchemy import Column, String, Text, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base



class BillOfMaterials(Base):
    __tablename__ = "bill_of_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bom_code = Column(String(50), unique=True, nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    version = Column(String(20), default="1.0")
    is_active = Column(Boolean, default=True)
    materials = Column(JSONB, default=list)  # array of {product_id, product_code, product_name, quantity, unit, cost}
    total_material_cost = Column(Numeric(10, 2), default=0.00)
    labor_cost = Column(Numeric(10, 2), default=0.00)
    overhead_cost = Column(Numeric(10, 2), default=0.00)
    total_cost = Column(Numeric(10, 2), default=0.00)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "bom_code": self.bom_code,
            "product_id": str(self.product_id),
            "version": self.version,
            "is_active": self.is_active,
            "materials": self.materials,
            "total_material_cost": float(self.total_material_cost) if self.total_material_cost else 0.00,
            "labor_cost": float(self.labor_cost) if self.labor_cost else 0.00,
            "overhead_cost": float(self.overhead_cost) if self.overhead_cost else 0.00,
            "total_cost": float(self.total_cost) if self.total_cost else 0.00,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
