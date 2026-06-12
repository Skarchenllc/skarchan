from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

from app.models.bill import BillStatus
from app.models.invoice import InvoiceStatus


# ===== Vendor Schemas =====

class VendorBase(BaseModel):
    vendor_code: str = Field(..., max_length=50)
    company_name: str = Field(..., max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    tax_id: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: float = 0.0
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account: Optional[str] = Field(None, max_length=100)
    routing_number: Optional[str] = Field(None, max_length=50)
    is_active: bool = True
    is_1099_vendor: bool = False
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    company_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    tax_id: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = None
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account: Optional[str] = Field(None, max_length=100)
    routing_number: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    is_1099_vendor: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class VendorResponse(VendorBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Customer Schemas =====

class CustomerBase(BaseModel):
    customer_code: str = Field(..., max_length=50)
    company_name: str = Field(..., max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    tax_id: Optional[str] = Field(None, max_length=100)
    tax_exempt: bool = False
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: float = 0.0
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account: Optional[str] = Field(None, max_length=100)
    routing_number: Optional[str] = Field(None, max_length=50)
    is_active: bool = True
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    tax_id: Optional[str] = Field(None, max_length=100)
    tax_exempt: Optional[bool] = None
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = None
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account: Optional[str] = Field(None, max_length=100)
    routing_number: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CustomerResponse(CustomerBase):
    id: UUID
    current_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Bill Line Item =====

class BillLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    rate: float
    amount: float
    account_id: Optional[UUID] = None


# ===== Bill Schemas =====

class BillBase(BaseModel):
    vendor_id: UUID
    bill_number: str = Field(..., max_length=100)
    vendor_invoice_number: Optional[str] = Field(None, max_length=100)
    bill_date: date
    due_date: date
    subtotal: float
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    payment_terms: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    notes: Optional[str] = None
    line_items: Optional[List[BillLineItem]] = None
    attachments: Optional[List[str]] = None


class BillCreate(BillBase):
    pass


class BillUpdate(BaseModel):
    vendor_invoice_number: Optional[str] = Field(None, max_length=100)
    bill_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total_amount: Optional[float] = None
    status: Optional[BillStatus] = None
    payment_terms: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    notes: Optional[str] = None
    line_items: Optional[List[BillLineItem]] = None
    attachments: Optional[List[str]] = None


class BillResponse(BillBase):
    id: UUID
    status: BillStatus
    amount_paid: float
    amount_due: float
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Bill Payment Schemas =====

class BillPaymentBase(BaseModel):
    bill_id: UUID
    payment_number: str = Field(..., max_length=100)
    payment_date: date
    amount: float
    payment_method: Optional[str] = Field(None, max_length=50)
    reference_number: Optional[str] = Field(None, max_length=100)
    bank_account_id: Optional[UUID] = None
    notes: Optional[str] = None


class BillPaymentCreate(BillPaymentBase):
    pass


class BillPaymentResponse(BillPaymentBase):
    id: UUID
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Invoice Line Item =====

class InvoiceLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    rate: float
    amount: float
    account_id: Optional[UUID] = None


# ===== Invoice Schemas =====

class InvoiceBase(BaseModel):
    customer_id: UUID
    invoice_number: str = Field(..., max_length=100)
    invoice_date: date
    due_date: date
    subtotal: float
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    payment_terms: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    notes: Optional[str] = None
    customer_notes: Optional[str] = None
    line_items: Optional[List[InvoiceLineItem]] = None
    attachments: Optional[List[str]] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total_amount: Optional[float] = None
    status: Optional[InvoiceStatus] = None
    payment_terms: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    notes: Optional[str] = None
    customer_notes: Optional[str] = None
    line_items: Optional[List[InvoiceLineItem]] = None
    attachments: Optional[List[str]] = None


class InvoiceResponse(InvoiceBase):
    id: UUID
    status: InvoiceStatus
    amount_paid: float
    amount_due: float
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    next_invoice_date: Optional[date] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Invoice Payment Schemas =====

class InvoicePaymentBase(BaseModel):
    invoice_id: UUID
    payment_number: str = Field(..., max_length=100)
    payment_date: date
    amount: float
    payment_method: Optional[str] = Field(None, max_length=50)
    reference_number: Optional[str] = Field(None, max_length=100)
    deposit_account_id: Optional[UUID] = None
    notes: Optional[str] = None


class InvoicePaymentCreate(InvoicePaymentBase):
    pass


class InvoicePaymentResponse(InvoicePaymentBase):
    id: UUID
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Aging Report Schemas =====

class AgingBucket(BaseModel):
    current: float = 0.0
    days_1_30: float = 0.0
    days_31_60: float = 0.0
    days_61_90: float = 0.0
    over_90_days: float = 0.0
    total: float = 0.0


class VendorAgingDetail(BaseModel):
    vendor_id: UUID
    vendor_code: str
    vendor_name: str
    aging: AgingBucket


class CustomerAgingDetail(BaseModel):
    customer_id: UUID
    customer_code: str
    customer_name: str
    aging: AgingBucket


class AgingReportResponse(BaseModel):
    report_date: date
    total_outstanding: float
    aging_summary: AgingBucket
    details: List[VendorAgingDetail] | List[CustomerAgingDetail]


# ===== Purchase Order Schemas =====

class POLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    amount: float
    account_id: Optional[UUID] = None
    received_qty: float = 0.0


class PurchaseOrderBase(BaseModel):
    vendor_id: UUID
    po_number: str = Field(..., max_length=100)
    po_date: date
    expected_delivery_date: Optional[date] = None
    subtotal: float
    tax_amount: float = 0.0
    shipping_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    ship_to_name: Optional[str] = Field(None, max_length=255)
    ship_to_address: Optional[str] = None
    shipping_method: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    internal_notes: Optional[str] = None
    vendor_notes: Optional[str] = None
    line_items: Optional[List[POLineItem]] = None
    attachments: Optional[List[str]] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    po_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    shipping_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total_amount: Optional[float] = None
    ship_to_name: Optional[str] = Field(None, max_length=255)
    ship_to_address: Optional[str] = None
    shipping_method: Optional[str] = Field(None, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    internal_notes: Optional[str] = None
    vendor_notes: Optional[str] = None
    line_items: Optional[List[POLineItem]] = None
    attachments: Optional[List[str]] = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: UUID
    status: str
    amount_received: float
    amount_billed: float
    requested_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    sent_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    tracking_number: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== PO Receipt Schemas =====

class POReceiptItemBase(BaseModel):
    line_item_id: str
    description: str
    quantity_received: float
    notes: Optional[str] = None


class POReceiptBase(BaseModel):
    po_id: UUID
    receipt_number: str = Field(..., max_length=100)
    receipt_date: date
    received_items: List[POReceiptItemBase]
    inspection_passed: bool = True
    inspection_notes: Optional[str] = None
    received_at_location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None


class POReceiptCreate(POReceiptBase):
    pass


class POReceiptResponse(POReceiptBase):
    id: UUID
    received_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Batch Payment Schemas =====

class BatchPaymentBase(BaseModel):
    batch_number: str = Field(..., max_length=100)
    batch_date: date
    payment_method: str = Field(..., max_length=50)
    bank_account_id: Optional[UUID] = None
    bill_ids: List[UUID]
    notes: Optional[str] = None


class BatchPaymentCreate(BatchPaymentBase):
    pass


class BatchPaymentUpdate(BaseModel):
    status: Optional[str] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None


class BatchPaymentResponse(BatchPaymentBase):
    id: UUID
    total_amount: float
    payment_count: int
    status: str
    ach_file_name: Optional[str] = None
    ach_file_path: Optional[str] = None
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Statement Schemas =====

class StatementLineItem(BaseModel):
    date: date
    document_type: str  # invoice, payment, credit_memo
    document_number: str
    description: str
    amount: float
    balance: float


class StatementRequest(BaseModel):
    entity_id: UUID  # vendor_id or customer_id
    statement_date: date
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class StatementResponse(BaseModel):
    entity_type: str  # vendor or customer
    entity_code: str
    entity_name: str
    statement_date: date
    period_start: date
    period_end: date
    beginning_balance: float
    ending_balance: float
    total_charges: float
    total_payments: float
    line_items: List[StatementLineItem]


# ===== Convert PO to Bill =====

class ConvertPOToBillRequest(BaseModel):
    po_id: UUID
    bill_number: str = Field(..., max_length=100)
    bill_date: date
    vendor_invoice_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
