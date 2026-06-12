from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class Customer(Base):
    """Customer for Accounts Receivable"""
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    contact_person = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    website = Column(String(255))

    # Address
    billing_address = Column(Text)
    shipping_address = Column(Text)

    # Tax Information
    tax_id = Column(String(100))
    tax_exempt = Column(Boolean, default=False)

    # Credit Terms
    payment_terms = Column(String(100))  # Net 30, Net 60, Due on Receipt, etc.
    credit_limit = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)

    # Banking Information (for ACH payments)
    bank_name = Column(String(255))
    bank_account = Column(String(100))
    routing_number = Column(String(50))

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    notes = Column(Text)
    tags = Column(JSONB)  # JSON array of tags

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Customer {self.customer_code} - {self.company_name}>"
