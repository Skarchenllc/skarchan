from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class BillStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Bill(Base):
    """Vendor Bill (Accounts Payable)"""
    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)

    # Bill Information
    bill_number = Column(String(100), unique=True, nullable=False, index=True)
    vendor_invoice_number = Column(String(100))  # Vendor's invoice number

    # Dates
    bill_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)

    # Amounts
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    amount_due = Column(Float, nullable=False)

    # Status
    status = Column(SQLEnum(BillStatus), default=BillStatus.DRAFT)

    # Payment Information
    payment_terms = Column(String(100))

    # Description
    description = Column(Text)
    notes = Column(Text)

    # Line Items (stored as JSON)
    line_items = Column(JSONB)  # Array of {description, quantity, rate, amount, account_id}

    # Attachments
    attachments = Column(JSONB)  # Array of file URLs

    # Approval Workflow
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Bill {self.bill_number} - {self.total_amount}>"


class BillPayment(Base):
    """Payment made against a vendor bill"""
    __tablename__ = "bill_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id"), nullable=False)

    # Payment Information
    payment_number = Column(String(100), unique=True, nullable=False, index=True)
    payment_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)

    # Payment Method
    payment_method = Column(String(50))  # Check, ACH, Wire, Credit Card, Cash
    reference_number = Column(String(100))  # Check number, transaction ID, etc.

    # Linked to bank account
    bank_account_id = Column(UUID(as_uuid=True))  # Link to chart of accounts

    # Description
    notes = Column(Text)

    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<BillPayment {self.payment_number} - {self.amount}>"
