from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.models.vendor import Vendor
from app.models.customer import Customer
from app.models.bill import Bill, BillPayment, BillStatus
from app.models.invoice import Invoice, InvoicePayment, InvoiceStatus
from app.models.purchase_order import PurchaseOrder, POReceipt, BatchPayment, POStatus
from app.schemas.ap_ar import (
    VendorCreate, VendorUpdate, VendorResponse,
    CustomerCreate, CustomerUpdate, CustomerResponse,
    BillCreate, BillUpdate, BillResponse,
    BillPaymentCreate, BillPaymentResponse,
    InvoiceCreate, InvoiceUpdate, InvoiceResponse,
    InvoicePaymentCreate, InvoicePaymentResponse,
    AgingReportResponse, AgingBucket, VendorAgingDetail, CustomerAgingDetail,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse,
    POReceiptCreate, POReceiptResponse,
    BatchPaymentCreate, BatchPaymentUpdate, BatchPaymentResponse,
    StatementRequest, StatementResponse, StatementLineItem,
    ConvertPOToBillRequest,
)

router = APIRouter()


# ===== VENDORS =====

@router.post("/vendors", response_model=VendorResponse)
async def create_vendor(vendor: VendorCreate, db: AsyncSession = Depends(get_db)):
    """Create a new vendor"""
    # Check for duplicate vendor code
    result = await db.execute(select(Vendor).where(Vendor.vendor_code == vendor.vendor_code))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Vendor code already exists")

    db_vendor = Vendor(**vendor.model_dump())
    db.add(db_vendor)
    await db.commit()
    await db.refresh(db_vendor)
    return db_vendor


@router.get("/vendors", response_model=List[VendorResponse])
async def list_vendors(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all vendors"""
    query = select(Vendor)

    if is_active is not None:
        query = query.where(Vendor.is_active == is_active)

    if search:
        query = query.where(
            or_(
                Vendor.company_name.ilike(f"%{search}%"),
                Vendor.vendor_code.ilike(f"%{search}%"),
                Vendor.email.ilike(f"%{search}%")
            )
        )

    query = query.offset(skip).limit(limit).order_by(Vendor.company_name)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific vendor"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: UUID,
    vendor_update: VendorUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a vendor"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    update_data = vendor_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vendor, field, value)

    vendor.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a vendor (soft delete by marking inactive)"""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor.is_active = False
    vendor.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "Vendor deactivated successfully"}


# ===== BILLS (Accounts Payable) =====

@router.post("/bills", response_model=BillResponse)
async def create_bill(bill: BillCreate, db: AsyncSession = Depends(get_db)):
    """Create a new vendor bill"""
    # Check for duplicate bill number
    result = await db.execute(select(Bill).where(Bill.bill_number == bill.bill_number))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bill number already exists")

    db_bill = Bill(**bill.model_dump())
    db_bill.amount_due = bill.total_amount
    db.add(db_bill)
    await db.commit()
    await db.refresh(db_bill)
    return db_bill


@router.get("/bills", response_model=List[BillResponse])
async def list_bills(
    skip: int = 0,
    limit: int = 100,
    vendor_id: Optional[UUID] = None,
    status: Optional[BillStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all bills"""
    query = select(Bill)

    if vendor_id:
        query = query.where(Bill.vendor_id == vendor_id)

    if status:
        query = query.where(Bill.status == status)

    query = query.offset(skip).limit(limit).order_by(desc(Bill.bill_date))

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/bills/{bill_id}", response_model=BillResponse)
async def get_bill(bill_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific bill"""
    result = await db.execute(select(Bill).where(Bill.id == bill_id))
    bill = result.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@router.put("/bills/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: UUID,
    bill_update: BillUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a bill"""
    result = await db.execute(select(Bill).where(Bill.id == bill_id))
    bill = result.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    update_data = bill_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bill, field, value)

    bill.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(bill)
    return bill


@router.post("/bills/{bill_id}/approve")
async def approve_bill(bill_id: UUID, approved_by: str, db: AsyncSession = Depends(get_db)):
    """Approve a bill for payment"""
    result = await db.execute(select(Bill).where(Bill.id == bill_id))
    bill = result.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    bill.status = BillStatus.APPROVED
    bill.approved_by = approved_by
    bill.approved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(bill)

    return {"message": "Bill approved successfully", "bill": bill}


# ===== BILL PAYMENTS =====

@router.post("/bill-payments", response_model=BillPaymentResponse)
async def create_bill_payment(
    payment: BillPaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Record a payment against a bill"""
    # Get the bill
    result = await db.execute(select(Bill).where(Bill.id == payment.bill_id))
    bill = result.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    # Create payment
    db_payment = BillPayment(**payment.model_dump())
    db.add(db_payment)

    # Update bill
    bill.amount_paid += payment.amount
    bill.amount_due = bill.total_amount - bill.amount_paid

    # Update bill status
    if bill.amount_due <= 0.01:
        bill.status = BillStatus.PAID
    elif bill.amount_paid > 0:
        bill.status = BillStatus.PARTIALLY_PAID

    await db.commit()
    await db.refresh(db_payment)
    return db_payment


@router.get("/bill-payments", response_model=List[BillPaymentResponse])
async def list_bill_payments(
    bill_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List bill payments"""
    query = select(BillPayment)

    if bill_id:
        query = query.where(BillPayment.bill_id == bill_id)

    query = query.offset(skip).limit(limit).order_by(desc(BillPayment.payment_date))

    result = await db.execute(query)
    return result.scalars().all()


# ===== CUSTOMERS =====

@router.post("/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate, db: AsyncSession = Depends(get_db)):
    """Create a new customer"""
    # Check for duplicate customer code
    result = await db.execute(select(Customer).where(Customer.customer_code == customer.customer_code))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Customer code already exists")

    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    await db.commit()
    await db.refresh(db_customer)
    return db_customer


@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all customers"""
    query = select(Customer)

    if is_active is not None:
        query = query.where(Customer.is_active == is_active)

    if search:
        query = query.where(
            or_(
                Customer.company_name.ilike(f"%{search}%"),
                Customer.customer_code.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%")
            )
        )

    query = query.offset(skip).limit(limit).order_by(Customer.company_name)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific customer"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    customer_update: CustomerUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a customer"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    customer.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(customer)
    return customer


# ===== INVOICES (Accounts Receivable) =====

@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(invoice: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    """Create a new customer invoice"""
    # Check for duplicate invoice number
    result = await db.execute(select(Invoice).where(Invoice.invoice_number == invoice.invoice_number))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invoice number already exists")

    db_invoice = Invoice(**invoice.model_dump())
    db_invoice.amount_due = invoice.total_amount
    db.add(db_invoice)
    await db.commit()
    await db.refresh(db_invoice)
    return db_invoice


@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[UUID] = None,
    status: Optional[InvoiceStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all invoices"""
    query = select(Invoice)

    if customer_id:
        query = query.where(Invoice.customer_id == customer_id)

    if status:
        query = query.where(Invoice.status == status)

    query = query.offset(skip).limit(limit).order_by(desc(Invoice.invoice_date))

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/invoices/{invoice_id}/send")
async def send_invoice(invoice_id: UUID, db: AsyncSession = Depends(get_db)):
    """Mark invoice as sent"""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.status = InvoiceStatus.SENT
    invoice.sent_at = datetime.utcnow()
    await db.commit()
    await db.refresh(invoice)

    return {"message": "Invoice marked as sent", "invoice": invoice}


# ===== INVOICE PAYMENTS =====

@router.post("/invoice-payments", response_model=InvoicePaymentResponse)
async def create_invoice_payment(
    payment: InvoicePaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Record a payment against an invoice"""
    # Get the invoice
    result = await db.execute(select(Invoice).where(Invoice.id == payment.invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Create payment
    db_payment = InvoicePayment(**payment.model_dump())
    db.add(db_payment)

    # Update invoice
    invoice.amount_paid += payment.amount
    invoice.amount_due = invoice.total_amount - invoice.amount_paid

    # Update invoice status
    if invoice.amount_due <= 0.01:
        invoice.status = InvoiceStatus.PAID
    elif invoice.amount_paid > 0:
        invoice.status = InvoiceStatus.PARTIALLY_PAID

    # Update customer balance
    customer_result = await db.execute(select(Customer).where(Customer.id == invoice.customer_id))
    customer = customer_result.scalar_one()
    customer.current_balance -= payment.amount

    await db.commit()
    await db.refresh(db_payment)
    return db_payment


# ===== AGING REPORTS =====

@router.get("/reports/ap-aging", response_model=AgingReportResponse)
async def get_ap_aging_report(
    as_of_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get Accounts Payable Aging Report"""
    if not as_of_date:
        as_of_date = date.today()

    # Get all unpaid bills
    result = await db.execute(
        select(Bill, Vendor)
        .join(Vendor, Bill.vendor_id == Vendor.id)
        .where(Bill.amount_due > 0)
    )
    bills_vendors = result.all()

    aging_details = []
    total_aging = AgingBucket()

    # Group by vendor
    vendor_bills = {}
    for bill, vendor in bills_vendors:
        if vendor.id not in vendor_bills:
            vendor_bills[vendor.id] = {
                "vendor": vendor,
                "bills": []
            }
        vendor_bills[vendor.id]["bills"].append(bill)

    for vendor_data in vendor_bills.values():
        vendor = vendor_data["vendor"]
        bills = vendor_data["bills"]

        aging = AgingBucket()

        for bill in bills:
            days_overdue = (as_of_date - bill.due_date).days
            amount = bill.amount_due

            if days_overdue < 0:
                aging.current += amount
            elif days_overdue <= 30:
                aging.days_1_30 += amount
            elif days_overdue <= 60:
                aging.days_31_60 += amount
            elif days_overdue <= 90:
                aging.days_61_90 += amount
            else:
                aging.over_90_days += amount

            aging.total += amount

        aging_details.append(VendorAgingDetail(
            vendor_id=vendor.id,
            vendor_code=vendor.vendor_code,
            vendor_name=vendor.company_name,
            aging=aging
        ))

        # Add to total
        total_aging.current += aging.current
        total_aging.days_1_30 += aging.days_1_30
        total_aging.days_31_60 += aging.days_31_60
        total_aging.days_61_90 += aging.days_61_90
        total_aging.over_90_days += aging.over_90_days
        total_aging.total += aging.total

    return AgingReportResponse(
        report_date=as_of_date,
        total_outstanding=total_aging.total,
        aging_summary=total_aging,
        details=aging_details
    )


@router.get("/reports/ar-aging", response_model=AgingReportResponse)
async def get_ar_aging_report(
    as_of_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get Accounts Receivable Aging Report"""
    if not as_of_date:
        as_of_date = date.today()

    # Get all unpaid invoices
    result = await db.execute(
        select(Invoice, Customer)
        .join(Customer, Invoice.customer_id == Customer.id)
        .where(Invoice.amount_due > 0)
    )
    invoices_customers = result.all()

    aging_details = []
    total_aging = AgingBucket()

    # Group by customer
    customer_invoices = {}
    for invoice, customer in invoices_customers:
        if customer.id not in customer_invoices:
            customer_invoices[customer.id] = {
                "customer": customer,
                "invoices": []
            }
        customer_invoices[customer.id]["invoices"].append(invoice)

    for customer_data in customer_invoices.values():
        customer = customer_data["customer"]
        invoices = customer_data["invoices"]

        aging = AgingBucket()

        for invoice in invoices:
            days_overdue = (as_of_date - invoice.due_date).days
            amount = invoice.amount_due

            if days_overdue < 0:
                aging.current += amount
            elif days_overdue <= 30:
                aging.days_1_30 += amount
            elif days_overdue <= 60:
                aging.days_31_60 += amount
            elif days_overdue <= 90:
                aging.days_61_90 += amount
            else:
                aging.over_90_days += amount

            aging.total += amount

        aging_details.append(CustomerAgingDetail(
            customer_id=customer.id,
            customer_code=customer.customer_code,
            customer_name=customer.company_name,
            aging=aging
        ))

        # Add to total
        total_aging.current += aging.current
        total_aging.days_1_30 += aging.days_1_30
        total_aging.days_31_60 += aging.days_31_60
        total_aging.days_61_90 += aging.days_61_90
        total_aging.over_90_days += aging.over_90_days
        total_aging.total += aging.total

    return AgingReportResponse(
        report_date=as_of_date,
        total_outstanding=total_aging.total,
        aging_summary=total_aging,
        details=aging_details
    )
# ==================== Purchase Order Endpoints ====================

@router.post("/purchase-orders", response_model=PurchaseOrderResponse)
async def create_purchase_order(
    po: PurchaseOrderCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new purchase order"""
    # Check if PO number already exists
    existing = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.po_number == po.po_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Purchase order {po.po_number} already exists"
        )

    # Verify vendor exists
    vendor = await db.execute(
        select(Vendor).where(Vendor.id == po.vendor_id)
    )
    if not vendor.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Vendor not found")

    db_po = PurchaseOrder(**po.model_dump(), created_by=created_by)
    db.add(db_po)
    await db.commit()
    await db.refresh(db_po)

    return db_po


@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
async def get_purchase_orders(
    status: Optional[str] = None,
    vendor_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all purchase orders"""
    query = select(PurchaseOrder)

    if status:
        query = query.where(PurchaseOrder.status == status)

    if vendor_id:
        query = query.where(PurchaseOrder.vendor_id == vendor_id)

    query = query.order_by(desc(PurchaseOrder.created_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(po_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific purchase order"""
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po_id)
    )
    po = result.scalar_one_or_none()

    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    return po


@router.put("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    po_id: UUID,
    po: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a purchase order"""
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po_id)
    )
    db_po = result.scalar_one_or_none()

    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if db_po.status in [POStatus.RECEIVED, POStatus.BILLED, POStatus.CLOSED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update PO in {db_po.status} status"
        )

    update_data = po.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_po, field, value)

    db_po.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_po)

    return db_po


@router.post("/purchase-orders/{po_id}/approve", response_model=PurchaseOrderResponse)
async def approve_purchase_order(
    po_id: UUID,
    approved_by: str,
    db: AsyncSession = Depends(get_db)
):
    """Approve a purchase order"""
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po_id)
    )
    db_po = result.scalar_one_or_none()

    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if db_po.status != POStatus.DRAFT and db_po.status != POStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve PO in {db_po.status} status"
        )

    db_po.status = POStatus.APPROVED
    db_po.approved_by = approved_by
    db_po.approved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(db_po)

    return db_po


@router.post("/purchase-orders/{po_id}/send", response_model=PurchaseOrderResponse)
async def send_purchase_order(
    po_id: UUID,
    sent_by: str,
    db: AsyncSession = Depends(get_db)
):
    """Mark purchase order as sent to vendor"""
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po_id)
    )
    db_po = result.scalar_one_or_none()

    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if db_po.status != POStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail="Only approved POs can be sent"
        )

    db_po.status = POStatus.SENT
    db_po.sent_at = datetime.utcnow()
    db_po.sent_by = sent_by

    await db.commit()
    await db.refresh(db_po)

    return db_po


# ==================== PO Receipt Endpoints ====================

@router.post("/po-receipts", response_model=POReceiptResponse)
async def create_po_receipt(
    receipt: POReceiptCreate,
    received_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Record goods receipt against a PO"""
    # Verify PO exists
    po_result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == receipt.po_id)
    )
    db_po = po_result.scalar_one_or_none()

    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if db_po.status not in [POStatus.SENT, POStatus.ACKNOWLEDGED, POStatus.PARTIALLY_RECEIVED]:
        raise HTTPException(
            status_code=400,
            detail="PO must be sent or acknowledged to receive goods"
        )

    db_receipt = POReceipt(**receipt.model_dump(), received_by=received_by)
    db.add(db_receipt)

    # Update PO received amount and status
    total_received = sum(item.quantity_received * item.get('unit_price', 0)
                        for item in receipt.received_items)
    db_po.amount_received += total_received

    if db_po.amount_received >= db_po.total_amount:
        db_po.status = POStatus.RECEIVED
    else:
        db_po.status = POStatus.PARTIALLY_RECEIVED

    await db.commit()
    await db.refresh(db_receipt)

    return db_receipt


@router.get("/po-receipts", response_model=List[POReceiptResponse])
async def get_po_receipts(
    po_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get PO receipts"""
    query = select(POReceipt)

    if po_id:
        query = query.where(POReceipt.po_id == po_id)

    query = query.order_by(desc(POReceipt.created_at))
    result = await db.execute(query)
    return result.scalars().all()


# ==================== Convert PO to Bill ====================

@router.post("/purchase-orders/{po_id}/convert-to-bill", response_model=BillResponse)
async def convert_po_to_bill(
    po_id: UUID,
    convert_request: ConvertPOToBillRequest,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Convert a received PO to a bill"""
    # Get PO
    po_result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po_id)
    )
    db_po = po_result.scalar_one_or_none()

    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if db_po.status not in [POStatus.RECEIVED, POStatus.PARTIALLY_RECEIVED]:
        raise HTTPException(
            status_code=400,
            detail="PO must be received to convert to bill"
        )

    # Create bill from PO
    db_bill = Bill(
        vendor_id=db_po.vendor_id,
        bill_number=convert_request.bill_number,
        vendor_invoice_number=convert_request.vendor_invoice_number,
        bill_date=convert_request.bill_date,
        due_date=convert_request.bill_date + timedelta(days=30),  # Default 30 days
        subtotal=db_po.subtotal,
        tax_amount=db_po.tax_amount,
        discount_amount=db_po.discount_amount,
        total_amount=db_po.total_amount,
        amount_due=db_po.total_amount,
        payment_terms=db_po.payment_terms,
        description=f"Bill from PO {db_po.po_number}",
        notes=convert_request.notes,
        line_items=db_po.line_items,
        status=BillStatus.PENDING,
        created_by=created_by
    )

    db.add(db_bill)

    # Update PO status and billed amount
    db_po.amount_billed = db_po.total_amount
    db_po.status = POStatus.BILLED

    await db.commit()
    await db.refresh(db_bill)

    return db_bill


# ==================== Batch Payment Endpoints ====================

@router.post("/batch-payments", response_model=BatchPaymentResponse)
async def create_batch_payment(
    batch: BatchPaymentCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a batch payment for multiple bills"""
    # Verify all bills exist and are unpaid
    total_amount = 0.0
    for bill_id in batch.bill_ids:
        bill_result = await db.execute(
            select(Bill).where(Bill.id == bill_id)
        )
        bill = bill_result.scalar_one_or_none()

        if not bill:
            raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found")

        if bill.amount_due <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Bill {bill.bill_number} has no outstanding balance"
            )

        total_amount += bill.amount_due

    db_batch = BatchPayment(
        **batch.model_dump(),
        total_amount=total_amount,
        payment_count=len(batch.bill_ids),
        created_by=created_by
    )

    db.add(db_batch)
    await db.commit()
    await db.refresh(db_batch)

    return db_batch


@router.get("/batch-payments", response_model=List[BatchPaymentResponse])
async def get_batch_payments(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get batch payments"""
    query = select(BatchPayment)

    if status:
        query = query.where(BatchPayment.status == status)

    query = query.order_by(desc(BatchPayment.created_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/batch-payments/{batch_id}/process", response_model=BatchPaymentResponse)
async def process_batch_payment(
    batch_id: UUID,
    processed_by: str,
    db: AsyncSession = Depends(get_db)
):
    """Process a batch payment"""
    result = await db.execute(
        select(BatchPayment).where(BatchPayment.id == batch_id)
    )
    db_batch = result.scalar_one_or_none()

    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch payment not found")

    if db_batch.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved batches can be processed"
        )

    # In a real system, this would integrate with payment processing
    # For now, just mark as completed

    db_batch.status = "completed"
    db_batch.processed_at = datetime.utcnow()
    db_batch.processed_by = processed_by

    # TODO: Create individual bill payments for each bill in the batch

    await db.commit()
    await db.refresh(db_batch)

    return db_batch


# ==================== Statement Generation Endpoints ====================

@router.post("/statements/vendor", response_model=StatementResponse)
async def generate_vendor_statement(
    request: StatementRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate vendor statement"""
    # Get vendor
    vendor_result = await db.execute(
        select(Vendor).where(Vendor.id == request.entity_id)
    )
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Determine date range
    period_end = request.statement_date
    if request.start_date:
        period_start = request.start_date
    else:
        period_start = period_end - timedelta(days=30)

    # Get bills for the period
    bills_result = await db.execute(
        select(Bill).where(
            and_(
                Bill.vendor_id == request.entity_id,
                Bill.bill_date >= period_start,
                Bill.bill_date <= period_end
            )
        ).order_by(Bill.bill_date)
    )
    bills = bills_result.scalars().all()

    # Calculate beginning balance (bills before period start that are still unpaid)
    beginning_balance = 0.0
    # TODO: Calculate actual beginning balance

    # Build statement line items
    line_items = []
    running_balance = beginning_balance
    total_charges = 0.0
    total_payments = 0.0

    for bill in bills:
        running_balance += bill.total_amount
        total_charges += bill.total_amount

        line_items.append(StatementLineItem(
            date=bill.bill_date,
            document_type="bill",
            document_number=bill.bill_number,
            description=bill.description or f"Bill {bill.bill_number}",
            amount=bill.total_amount,
            balance=running_balance
        ))

        # TODO: Add payments for this bill

    return StatementResponse(
        entity_type="vendor",
        entity_code=vendor.vendor_code,
        entity_name=vendor.company_name,
        statement_date=request.statement_date,
        period_start=period_start,
        period_end=period_end,
        beginning_balance=beginning_balance,
        ending_balance=running_balance,
        total_charges=total_charges,
        total_payments=total_payments,
        line_items=line_items
    )


@router.post("/statements/customer", response_model=StatementResponse)
async def generate_customer_statement(
    request: StatementRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate customer statement"""
    # Get customer
    customer_result = await db.execute(
        select(Customer).where(Customer.id == request.entity_id)
    )
    customer = customer_result.scalar_one_or_none()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Determine date range
    period_end = request.statement_date
    if request.start_date:
        period_start = request.start_date
    else:
        period_start = period_end - timedelta(days=30)

    # Get invoices for the period
    invoices_result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.customer_id == request.entity_id,
                Invoice.invoice_date >= period_start,
                Invoice.invoice_date <= period_end
            )
        ).order_by(Invoice.invoice_date)
    )
    invoices = invoices_result.scalars().all()

    # Calculate beginning balance
    beginning_balance = 0.0  # TODO: Calculate actual

    # Build statement line items
    line_items = []
    running_balance = beginning_balance
    total_charges = 0.0
    total_payments = 0.0

    for invoice in invoices:
        running_balance += invoice.total_amount
        total_charges += invoice.total_amount

        line_items.append(StatementLineItem(
            date=invoice.invoice_date,
            document_type="invoice",
            document_number=invoice.invoice_number,
            description=invoice.description or f"Invoice {invoice.invoice_number}",
            amount=invoice.total_amount,
            balance=running_balance
        ))

        # Get payments for this invoice
        payments_result = await db.execute(
            select(InvoicePayment).where(
                InvoicePayment.invoice_id == invoice.id
            ).order_by(InvoicePayment.payment_date)
        )
        payments = payments_result.scalars().all()

        for payment in payments:
            running_balance -= payment.amount
            total_payments += payment.amount

            line_items.append(StatementLineItem(
                date=payment.payment_date,
                document_type="payment",
                document_number=payment.payment_number,
                description=f"Payment - {payment.payment_method}",
                amount=-payment.amount,  # Negative for payments
                balance=running_balance
            ))

    return StatementResponse(
        entity_type="customer",
        entity_code=customer.customer_code,
        entity_name=customer.company_name,
        statement_date=request.statement_date,
        period_start=period_start,
        period_end=period_end,
        beginning_balance=beginning_balance,
        ending_balance=running_balance,
        total_charges=total_charges,
        total_payments=total_payments,
        line_items=line_items
    )
