from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class Vendor(Base):
    """Vendor/Supplier for Accounts Payable"""
    __tablename__ = "vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    contact_person = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    website = Column(String(255))

    # Address
    billing_address = Column(Text)
    shipping_address = Column(Text)

    # Tax Information
    tax_id = Column(String(100))  # EIN, VAT number, etc.

    # Payment Terms
    payment_terms = Column(String(100))  # Net 30, Net 60, COD, etc.
    credit_limit = Column(Float, default=0.0)

    # Banking Information
    bank_name = Column(String(255))
    bank_account = Column(String(100))
    routing_number = Column(String(50))

    # Status
    is_active = Column(Boolean, default=True)
    is_1099_vendor = Column(Boolean, default=False)  # US tax reporting

    # Metadata
    notes = Column(Text)
    tags = Column(JSONB)  # JSON array of tags

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Vendor {self.vendor_code} - {self.company_name}>"
