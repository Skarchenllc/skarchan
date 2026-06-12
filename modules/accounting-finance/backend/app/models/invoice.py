from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Invoice(Base):
    """Customer Invoice (Accounts Receivable)"""
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)

    # Invoice Information
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)

    # Dates
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)

    # Amounts
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    amount_due = Column(Float, nullable=False)

    # Status
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT)

    # Payment Information
    payment_terms = Column(String(100))

    # Description
    description = Column(Text)
    notes = Column(Text)
    customer_notes = Column(Text)  # Notes visible to customer

    # Line Items (stored as JSON)
    line_items = Column(JSONB)  # Array of {description, quantity, rate, amount, account_id}

    # Attachments
    attachments = Column(JSONB)  # Array of file URLs

    # Tracking
    sent_at = Column(DateTime)
    viewed_at = Column(DateTime)

    # Recurring Invoice
    is_recurring = Column(String(50), default=False)
    recurring_frequency = Column(String(50))  # monthly, quarterly, annually
    next_invoice_date = Column(Date)

    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Invoice {self.invoice_number} - {self.total_amount}>"


class InvoicePayment(Base):
    """Payment received against a customer invoice"""
    __tablename__ = "invoice_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)

    # Payment Information
    payment_number = Column(String(100), unique=True, nullable=False, index=True)
    payment_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)

    # Payment Method
    payment_method = Column(String(50))  # Check, ACH, Wire, Credit Card, Cash, PayPal, Stripe
    reference_number = Column(String(100))  # Check number, transaction ID, etc.

    # Linked to deposit account
    deposit_account_id = Column(UUID(as_uuid=True))  # Link to chart of accounts

    # Description
    notes = Column(Text)

    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<InvoicePayment {self.payment_number} - {self.amount}>"


class PaymentReminder(Base):
    """Automated payment reminders for overdue invoices"""
    __tablename__ = "payment_reminders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)

    reminder_type = Column(String(50))  # before_due, on_due, after_due_7, after_due_14, after_due_30
    sent_at = Column(DateTime)
    email_sent = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PaymentReminder {self.reminder_type}>"
