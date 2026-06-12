from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base



class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    location = Column(String(100), nullable=False)  # warehouse, production_floor, shipping, etc.
    quantity_on_hand = Column(Integer, default=0)
    quantity_reserved = Column(Integer, default=0)
    quantity_available = Column(Integer, default=0)  # computed: on_hand - reserved
    last_restock_date = Column(DateTime)
    last_count_date = Column(DateTime)
    minimum_stock = Column(Integer, default=0)
    maximum_stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "product_id": str(self.product_id),
            "location": self.location,
            "quantity_on_hand": self.quantity_on_hand,
            "quantity_reserved": self.quantity_reserved,
            "quantity_available": self.quantity_available,
            "last_restock_date": self.last_restock_date.isoformat() if self.last_restock_date else None,
            "last_count_date": self.last_count_date.isoformat() if self.last_count_date else None,
            "minimum_stock": self.minimum_stock,
            "maximum_stock": self.maximum_stock,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
