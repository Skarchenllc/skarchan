from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class TaxType(str, enum.Enum):
    SALES_TAX = "Sales Tax"
    VAT = "VAT (Value Added Tax)"
    WITHHOLDING_TAX = "Withholding Tax"
    INCOME_TAX = "Income Tax"
    PROPERTY_TAX = "Property Tax"
    EXCISE_TAX = "Excise Tax"
    OTHER = "Other"


class TaxReportingPeriod(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


class TaxRate(Base):
    __tablename__ = "tax_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(TaxType), nullable=False)
    rate = Column(Float, nullable=False)  # percentage
    account = Column(String(255))  # linked account code/name
    authority = Column(String(255))  # tax authority name
    active = Column(Boolean, default=True)
    description = Column(String(500))

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TaxRate {self.name} - {self.rate}%>"


class TaxSettings(Base):
    __tablename__ = "tax_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_reg_number = Column(String(100))
    vat_number = Column(String(100))
    default_sales_tax_rate = Column(Float, default=0.0)
    tax_reporting_period = Column(SQLEnum(TaxReportingPeriod), default=TaxReportingPeriod.MONTHLY)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TaxSettings {self.tax_reg_number}>"


class TaxPayment(Base):
    __tablename__ = "tax_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_date = Column(Date, nullable=False)
    tax_type = Column(SQLEnum(TaxType), nullable=False)
    period = Column(String(100))  # e.g., "Q1 2025", "January 2025"
    amount_paid = Column(Float, nullable=False)
    payment_method = Column(String(100))
    reference = Column(String(100))
    description = Column(String(500))

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TaxPayment {self.tax_type} - ${self.amount_paid}>"
