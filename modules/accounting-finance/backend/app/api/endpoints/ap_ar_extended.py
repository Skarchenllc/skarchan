"""
Extended AP/AR endpoints for Purchase Orders, Batch Payments, and Statements
This file contains additional endpoints to be added to ap_ar.py
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from typing import List, Optional
from datetime import date, datetime, timedelta
from uuid import UUID

from app.core.database import get_db
from app.models.purchase_order import PurchaseOrder, POReceipt, BatchPayment, POStatus
from app.models.vendor import Vendor
from app.models.customer import Customer
from app.models.bill import Bill, BillStatus
from app.models.invoice import Invoice, InvoiceStatus, InvoicePayment
from app.schemas.ap_ar import (
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderResponse,
    POReceiptCreate,
    POReceiptResponse,
    BatchPaymentCreate,
    BatchPaymentUpdate,
    BatchPaymentResponse,
    StatementRequest,
    StatementResponse,
    StatementLineItem,
    ConvertPOToBillRequest,
    BillResponse,
)

router = APIRouter()


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
