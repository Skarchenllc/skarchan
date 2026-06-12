from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, Integer, Date
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class AssetCategory(str, enum.Enum):
    BUILDING = "Building"
    EQUIPMENT = "Equipment"
    VEHICLE = "Vehicle"
    FURNITURE = "Furniture & Fixtures"
    COMPUTER = "Computer & IT"
    LAND = "Land"
    OTHER = "Other"


class DepreciationMethod(str, enum.Enum):
    STRAIGHT_LINE = "Straight-Line"
    DECLINING_BALANCE = "Declining Balance"
    UNITS_OF_PRODUCTION = "Units of Production"


class FixedAsset(Base):
    __tablename__ = "fixed_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = Column(SQLEnum(AssetCategory), nullable=False)
    purchase_date = Column(Date, nullable=False)
    cost = Column(Float, nullable=False)
    useful_life = Column(Integer, nullable=False)  # in years
    depreciation_method = Column(SQLEnum(DepreciationMethod), nullable=False)
    salvage_value = Column(Float, default=0.0)
    serial_number = Column(String(100))
    description = Column(String(500))
    accumulated_depreciation = Column(Float, default=0.0)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<FixedAsset {self.name} - {self.category}>"

    @property
    def book_value(self):
        return self.cost - self.accumulated_depreciation
