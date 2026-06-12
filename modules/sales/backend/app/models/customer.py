from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class Customer(Base):
    """Customer/Account"""
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    customer_code = Column(String(100), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    customer_type = Column(String(50), default="prospect")  # prospect, active, inactive

    # Contact Information
    primary_contact_name = Column(String(255))
    primary_email = Column(String(255), index=True)
    primary_phone = Column(String(50))

    # Address
    billing_address = Column(Text)
    shipping_address = Column(Text)
    city = Column(String(100))
    state = Column(String(50))
    country = Column(String(100))
    postal_code = Column(String(20))

    # Business Details
    industry = Column(String(100))
    company_size = Column(String(50))  # 1-10, 11-50, 51-200, 201-500, 500+
    annual_revenue = Column(Numeric(15, 2))
    website = Column(String(500))

    # Sales Information
    customer_since = Column(DateTime)
    total_lifetime_value = Column(Numeric(15, 2), default=0.0)
    total_orders = Column(Integer, default=0)
    payment_terms = Column(String(100))  # net_30, net_60, prepaid, etc.
    credit_limit = Column(Numeric(15, 2))

    # Relationship
    assigned_sales_rep = Column(String(100))
    account_manager = Column(String(100))

    # Custom Fields
    tags = Column(JSONB)  # Array of tags
    custom_fields = Column(JSONB)

    # Status
    is_active = Column(Boolean, default=True)
    notes = Column(Text)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Customer {self.customer_code} - {self.company_name}>"


class CustomerContact(Base):
    """Additional contacts for a customer"""
    __tablename__ = "customer_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Contact Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    job_title = Column(String(100))
    email = Column(String(255), index=True)
    phone = Column(String(50))
    mobile = Column(String(50))

    # Contact Type
    is_primary = Column(Boolean, default=False)
    is_billing = Column(Boolean, default=False)
    is_technical = Column(Boolean, default=False)

    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CustomerContact {self.first_name} {self.last_name}>"
