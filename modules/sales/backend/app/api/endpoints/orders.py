from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime, date
from uuid import UUID
import uuid as uuid_lib

from app.core.database import get_db

router = APIRouter()


@router.get("/orders")
async def get_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    customer_id: Optional[UUID] = None,
    sales_rep: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all orders with optional filters"""
    query = "SELECT * FROM orders WHERE 1=1"
    params = {}

    if status:
        query += " AND status = :status"
        params["status"] = status

    if payment_status:
        query += " AND payment_status = :payment_status"
        params["payment_status"] = payment_status

    if customer_id:
        query += " AND customer_id = :customer_id"
        params["customer_id"] = str(customer_id)

    if sales_rep:
        query += " AND sales_rep = :sales_rep"
        params["sales_rep"] = sales_rep

    query += " ORDER BY order_date DESC"

    result = await db.execute(text(query), params)
    orders = result.fetchall()

    return {
        "orders": [
            {
                "id": str(row[0]),
                "order_number": row[1],
                "customer_id": str(row[2]),
                "quote_id": str(row[3]) if row[3] else None,
                "status": row[4],
                "order_date": row[5] if isinstance(row[5], str) else (row[5].isoformat() if row[5] else None),
                "expected_delivery_date": row[6] if isinstance(row[6], str) else (row[6].isoformat() if row[6] else None),
                "subtotal": float(row[8]) if row[8] else 0.0,
                "total_amount": float(row[12]) if row[12] else 0.0,
                "paid_amount": float(row[13]) if row[13] else 0.0,
                "balance_due": float(row[14]) if row[14] else 0.0,
                "payment_status": row[18],
                "sales_rep": row[20],
                "created_at": row[23] if isinstance(row[23], str) else (row[23].isoformat() if row[23] else None),
            }
            for row in orders
        ],
        "total": len(orders)
    }


@router.get("/orders/{order_id}")
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get order by ID"""
    result = await db.execute(
        text("SELECT * FROM orders WHERE id = :id"),
        {"id": str(order_id)}
    )
    order = result.fetchone()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "id": str(order[0]),
        "order_number": order[1],
        "customer_id": str(order[2]),
        "quote_id": str(order[3]) if order[3] else None,
        "status": order[4],
        "order_date": order[5].isoformat() if order[5] else None,
        "expected_delivery_date": order[6].isoformat() if order[6] else None,
        "actual_delivery_date": order[7].isoformat() if order[7] else None,
        "subtotal": float(order[8]) if order[8] else 0.0,
        "discount_amount": float(order[9]) if order[9] else 0.0,
        "tax_amount": float(order[10]) if order[10] else 0.0,
        "shipping_amount": float(order[11]) if order[11] else 0.0,
        "total_amount": float(order[12]) if order[12] else 0.0,
        "paid_amount": float(order[13]) if order[13] else 0.0,
        "balance_due": float(order[14]) if order[14] else 0.0,
        "line_items": order[15],
        "shipping_address": order[16],
        "shipping_method": order[17],
        "tracking_number": order[18],
        "payment_status": order[19],
        "payment_method": order[20],
        "sales_rep": order[21],
        "notes": order[22],
        "created_by": order[23],
        "created_at": order[24].isoformat() if order[24] else None,
        "updated_at": order[25].isoformat() if order[25] else None,
    }


@router.post("/orders")
async def create_order(
    order_number: str,
    customer_id: UUID,
    order_date: date,
    total_amount: float,
    quote_id: Optional[UUID] = None,
    expected_delivery_date: Optional[date] = None,
    subtotal: Optional[float] = 0.0,
    discount_amount: Optional[float] = 0.0,
    tax_amount: Optional[float] = 0.0,
    shipping_amount: Optional[float] = 0.0,
    shipping_address: Optional[str] = None,
    shipping_method: Optional[str] = None,
    payment_method: Optional[str] = None,
    sales_rep: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new order"""
    order_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO orders (
                id, order_number, customer_id, quote_id,
                status, order_date, expected_delivery_date,
                subtotal, discount_amount, tax_amount, shipping_amount, total_amount,
                paid_amount, balance_due,
                shipping_address, shipping_method,
                payment_status, payment_method, sales_rep, notes,
                created_at, updated_at
            ) VALUES (
                :id, :order_number, :customer_id, :quote_id,
                'pending', :order_date, :expected_delivery_date,
                :subtotal, :discount_amount, :tax_amount, :shipping_amount, :total_amount,
                0, :total_amount,
                :shipping_address, :shipping_method,
                'unpaid', :payment_method, :sales_rep, :notes,
                NOW(), NOW()
            )
        """),
        {
            "id": str(order_id),
            "order_number": order_number,
            "customer_id": str(customer_id),
            "quote_id": str(quote_id) if quote_id else None,
            "order_date": order_date,
            "expected_delivery_date": expected_delivery_date,
            "subtotal": subtotal,
            "discount_amount": discount_amount,
            "tax_amount": tax_amount,
            "shipping_amount": shipping_amount,
            "total_amount": total_amount,
            "shipping_address": shipping_address,
            "shipping_method": shipping_method,
            "payment_method": payment_method,
            "sales_rep": sales_rep,
            "notes": notes,
        }
    )
    await db.commit()

    return {
        "message": "Order created successfully",
        "id": str(order_id),
        "order_number": order_number
    }


@router.put("/orders/{order_id}")
async def update_order(
    order_id: UUID,
    status: Optional[str] = None,
    expected_delivery_date: Optional[date] = None,
    actual_delivery_date: Optional[date] = None,
    tracking_number: Optional[str] = None,
    payment_status: Optional[str] = None,
    paid_amount: Optional[float] = None,
    balance_due: Optional[float] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Update order"""
    updates = []
    params = {"id": str(order_id)}

    if status:
        updates.append("status = :status")
        params["status"] = status

    if expected_delivery_date is not None:
        updates.append("expected_delivery_date = :expected_delivery_date")
        params["expected_delivery_date"] = expected_delivery_date

    if actual_delivery_date is not None:
        updates.append("actual_delivery_date = :actual_delivery_date")
        params["actual_delivery_date"] = actual_delivery_date

    if tracking_number is not None:
        updates.append("tracking_number = :tracking_number")
        params["tracking_number"] = tracking_number

    if payment_status is not None:
        updates.append("payment_status = :payment_status")
        params["payment_status"] = payment_status

    if paid_amount is not None:
        updates.append("paid_amount = :paid_amount")
        params["paid_amount"] = paid_amount

    if balance_due is not None:
        updates.append("balance_due = :balance_due")
        params["balance_due"] = balance_due

    if notes is not None:
        updates.append("notes = :notes")
        params["notes"] = notes

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = NOW()")
    query = f"UPDATE orders SET {', '.join(updates)} WHERE id = :id"

    await db.execute(text(query), params)
    await db.commit()

    return {"message": "Order updated successfully"}


@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete order"""
    await db.execute(
        text("DELETE FROM orders WHERE id = :id"),
        {"id": str(order_id)}
    )
    await db.commit()

    return {"message": "Order deleted successfully"}


@router.get("/orders/stats/overview")
async def get_orders_overview(db: AsyncSession = Depends(get_db)):
    """Get overall order statistics"""
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                SUM(total_amount) as total_revenue,
                SUM(paid_amount) as total_paid,
                SUM(balance_due) as total_outstanding,
                AVG(total_amount) as avg_order_value,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as fully_paid_orders,
                COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_orders
            FROM orders
        """)
    )
    stats = result.fetchone()

    # Calculate fulfillment rate
    total_orders = stats[0] or 0
    delivered_orders = stats[5] or 0
    fulfillment_rate = (delivered_orders / total_orders * 100) if total_orders > 0 else 0

    return {
        "total_orders": stats[0] or 0,
        "pending_orders": stats[1] or 0,
        "confirmed_orders": stats[2] or 0,
        "processing_orders": stats[3] or 0,
        "shipped_orders": stats[4] or 0,
        "delivered_orders": stats[5] or 0,
        "cancelled_orders": stats[6] or 0,
        "total_revenue": float(stats[7]) if stats[7] else 0.0,
        "total_paid": float(stats[8]) if stats[8] else 0.0,
        "total_outstanding": float(stats[9]) if stats[9] else 0.0,
        "average_order_value": float(stats[10]) if stats[10] else 0.0,
        "fully_paid_orders": stats[11] or 0,
        "unpaid_orders": stats[12] or 0,
        "fulfillment_rate_percentage": round(fulfillment_rate, 2),
    }
