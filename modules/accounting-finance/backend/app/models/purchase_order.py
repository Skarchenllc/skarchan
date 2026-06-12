from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Date, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class POStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    SENT = "sent"
    ACKNOWLEDGED = "acknowledged"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    BILLED = "billed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class PurchaseOrder(Base):
    """Purchase Order for procurement management"""
    __tablename__ = "purchase_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)

    # PO Information
    po_number = Column(String(100), unique=True, nullable=False, index=True)

    # Dates
    po_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date)

    # Amounts
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    shipping_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)

    # Received tracking
    amount_received = Column(Float, default=0.0)
    amount_billed = Column(Float, default=0.0)

    # Status
    status = Column(SQLEnum(POStatus), default=POStatus.DRAFT, index=True)

    # Shipping Information
    ship_to_name = Column(String(255))
    ship_to_address = Column(Text)
    shipping_method = Column(String(100))
    tracking_number = Column(String(100))

    # Payment Terms
    payment_terms = Column(String(100))

    # Description
    description = Column(Text)
    internal_notes = Column(Text)
    vendor_notes = Column(Text)  # Notes for vendor

    # Line Items (stored as JSON)
    line_items = Column(JSONB)  # Array of {description, quantity, unit_price, amount, account_id, received_qty}

    # Attachments
    attachments = Column(JSONB)  # Array of file URLs

    # Approval Workflow
    requested_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Sent tracking
    sent_at = Column(DateTime)
    sent_by = Column(String(100))

    # Acknowledged by vendor
    acknowledged_at = Column(DateTime)

    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PurchaseOrder {self.po_number} - {self.total_amount}>"


class POReceipt(Base):
    """Goods Receipt against Purchase Order"""
    __tablename__ = "po_receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    po_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False)

    # Receipt Information
    receipt_number = Column(String(100), unique=True, nullable=False, index=True)
    receipt_date = Column(Date, nullable=False)

    # Received Items (stored as JSON)
    received_items = Column(JSONB)  # Array of {line_item_id, description, quantity_received, notes}

    # Quality Check
    inspection_passed = Column(Boolean, default=True)
    inspection_notes = Column(Text)

    # Receiving Location
    received_at_location = Column(String(255))

    # Notes
    notes = Column(Text)

    received_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<POReceipt {self.receipt_number}>"


class BatchPayment(Base):
    """Batch payment processing for multiple bills"""
    __tablename__ = "batch_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Batch Information
    batch_number = Column(String(100), unique=True, nullable=False, index=True)
    batch_date = Column(Date, nullable=False)

    # Payment Details
    payment_method = Column(String(50), nullable=False)  # ACH, Check, Wire
    bank_account_id = Column(UUID(as_uuid=True))  # Paying from account

    # Amounts
    total_amount = Column(Float, nullable=False)
    payment_count = Column(Integer, default=0)

    # Status
    status = Column(String(50), default="draft")  # draft, approved, processing, completed, failed

    # Bill IDs (stored as JSON array)
    bill_ids = Column(JSONB)  # Array of bill UUIDs

    # ACH File Information (if applicable)
    ach_file_name = Column(String(255))
    ach_file_path = Column(String(500))

    # Processing
    processed_at = Column(DateTime)
    processed_by = Column(String(100))

    # Approval
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Notes
    notes = Column(Text)

    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BatchPayment {self.batch_number} - {self.payment_count} payments>"
