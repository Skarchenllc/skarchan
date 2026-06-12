from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Numeric, Date, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class Quote(Base):
    """Sales Quote/Proposal"""
    __tablename__ = "quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    quote_number = Column(String(100), unique=True, nullable=False, index=True)
    quote_name = Column(String(255), nullable=False)

    # Associations
    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id"), index=True)

    # Quote Details
    status = Column(String(50), default="draft")  # draft, sent, accepted, rejected, expired
    quote_date = Column(Date, nullable=False)
    valid_until = Column(Date)

    # Financial
    subtotal = Column(Numeric(15, 2), default=0.0)
    discount_amount = Column(Numeric(15, 2), default=0.0)
    discount_percentage = Column(Numeric(5, 2), default=0.0)
    tax_amount = Column(Numeric(15, 2), default=0.0)
    shipping_amount = Column(Numeric(15, 2), default=0.0)
    total_amount = Column(Numeric(15, 2), nullable=False)

    # Line Items
    line_items = Column(JSONB)  # Array of {product, description, quantity, unit_price, total}

    # Terms
    payment_terms = Column(String(100))
    delivery_terms = Column(Text)
    terms_and_conditions = Column(Text)

    # Status Tracking
    sent_date = Column(DateTime)
    accepted_date = Column(DateTime)
    rejected_date = Column(DateTime)
    rejection_reason = Column(Text)

    # Sales Information
    prepared_by = Column(String(100))
    approved_by = Column(String(100))

    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Quote {self.quote_number} - {self.quote_name}>"


class Order(Base):
    """Sales Order"""
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    order_number = Column(String(100), unique=True, nullable=False, index=True)

    # Associations
    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quotes.id"), index=True)

    # Order Details
    status = Column(String(50), default="pending")  # pending, confirmed, processing, shipped, delivered, cancelled
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date)
    actual_delivery_date = Column(Date)

    # Financial
    subtotal = Column(Numeric(15, 2), default=0.0)
    discount_amount = Column(Numeric(15, 2), default=0.0)
    tax_amount = Column(Numeric(15, 2), default=0.0)
    shipping_amount = Column(Numeric(15, 2), default=0.0)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0.0)
    balance_due = Column(Numeric(15, 2), default=0.0)

    # Line Items
    line_items = Column(JSONB)  # Array of {product, description, quantity, unit_price, total}

    # Shipping
    shipping_address = Column(Text)
    shipping_method = Column(String(100))
    tracking_number = Column(String(100))

    # Payment
    payment_status = Column(String(50), default="unpaid")  # unpaid, partial, paid
    payment_method = Column(String(50))

    # Sales Information
    sales_rep = Column(String(100))

    # Metadata
    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Order {self.order_number}>"
