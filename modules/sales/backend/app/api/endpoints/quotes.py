from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime, date
from uuid import UUID
import uuid as uuid_lib

from app.core.database import get_db

router = APIRouter()


@router.get("/quotes")
async def get_quotes(
    status: Optional[str] = None,
    customer_id: Optional[UUID] = None,
    opportunity_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all quotes with optional filters"""
    query = "SELECT * FROM quotes WHERE 1=1"
    params = {}

    if status:
        query += " AND status = :status"
        params["status"] = status

    if customer_id:
        query += " AND customer_id = :customer_id"
        params["customer_id"] = str(customer_id)

    if opportunity_id:
        query += " AND opportunity_id = :opportunity_id"
        params["opportunity_id"] = str(opportunity_id)

    query += " ORDER BY quote_date DESC"

    result = await db.execute(text(query), params)
    quotes = result.fetchall()

    return {
        "quotes": [
            {
                "id": str(row[0]),
                "quote_number": row[1],
                "quote_name": row[2],
                "customer_id": str(row[3]),
                "opportunity_id": str(row[4]) if row[4] else None,
                "status": row[5],
                "quote_date": row[6] if isinstance(row[6], str) else (row[6].isoformat() if row[6] else None),
                "valid_until": row[7] if isinstance(row[7], str) else (row[7].isoformat() if row[7] else None),
                "subtotal": float(row[8]) if row[8] else 0.0,
                "total_amount": float(row[13]) if row[13] else 0.0,
                "payment_terms": row[15],
                "prepared_by": row[21],
                "created_at": row[24] if isinstance(row[24], str) else (row[24].isoformat() if row[24] else None),
            }
            for row in quotes
        ],
        "total": len(quotes)
    }


@router.get("/quotes/{quote_id}")
async def get_quote(
    quote_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get quote by ID"""
    result = await db.execute(
        text("SELECT * FROM quotes WHERE id = :id"),
        {"id": str(quote_id)}
    )
    quote = result.fetchone()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    return {
        "id": str(quote[0]),
        "quote_number": quote[1],
        "quote_name": quote[2],
        "customer_id": str(quote[3]),
        "opportunity_id": str(quote[4]) if quote[4] else None,
        "status": quote[5],
        "quote_date": quote[6].isoformat() if quote[6] else None,
        "valid_until": quote[7].isoformat() if quote[7] else None,
        "subtotal": float(quote[8]) if quote[8] else 0.0,
        "discount_amount": float(quote[9]) if quote[9] else 0.0,
        "discount_percentage": float(quote[10]) if quote[10] else 0.0,
        "tax_amount": float(quote[11]) if quote[11] else 0.0,
        "shipping_amount": float(quote[12]) if quote[12] else 0.0,
        "total_amount": float(quote[13]) if quote[13] else 0.0,
        "line_items": quote[14],
        "payment_terms": quote[15],
        "delivery_terms": quote[16],
        "terms_and_conditions": quote[17],
        "sent_date": quote[18].isoformat() if quote[18] else None,
        "accepted_date": quote[19].isoformat() if quote[19] else None,
        "rejected_date": quote[20].isoformat() if quote[20] else None,
        "rejection_reason": quote[21],
        "prepared_by": quote[22],
        "approved_by": quote[23],
        "notes": quote[24],
        "created_at": quote[25].isoformat() if quote[25] else None,
        "updated_at": quote[26].isoformat() if quote[26] else None,
    }


@router.post("/quotes")
async def create_quote(
    quote_number: str,
    quote_name: str,
    customer_id: UUID,
    quote_date: date,
    total_amount: float,
    opportunity_id: Optional[UUID] = None,
    valid_until: Optional[date] = None,
    subtotal: Optional[float] = 0.0,
    discount_amount: Optional[float] = 0.0,
    discount_percentage: Optional[float] = 0.0,
    tax_amount: Optional[float] = 0.0,
    shipping_amount: Optional[float] = 0.0,
    payment_terms: Optional[str] = None,
    delivery_terms: Optional[str] = None,
    terms_and_conditions: Optional[str] = None,
    prepared_by: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new quote"""
    quote_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO quotes (
                id, quote_number, quote_name, customer_id, opportunity_id,
                status, quote_date, valid_until,
                subtotal, discount_amount, discount_percentage, tax_amount, shipping_amount, total_amount,
                payment_terms, delivery_terms, terms_and_conditions,
                prepared_by, notes, created_at, updated_at
            ) VALUES (
                :id, :quote_number, :quote_name, :customer_id, :opportunity_id,
                'draft', :quote_date, :valid_until,
                :subtotal, :discount_amount, :discount_percentage, :tax_amount, :shipping_amount, :total_amount,
                :payment_terms, :delivery_terms, :terms_and_conditions,
                :prepared_by, :notes, NOW(), NOW()
            )
        """),
        {
            "id": str(quote_id),
            "quote_number": quote_number,
            "quote_name": quote_name,
            "customer_id": str(customer_id),
            "opportunity_id": str(opportunity_id) if opportunity_id else None,
            "quote_date": quote_date,
            "valid_until": valid_until,
            "subtotal": subtotal,
            "discount_amount": discount_amount,
            "discount_percentage": discount_percentage,
            "tax_amount": tax_amount,
            "shipping_amount": shipping_amount,
            "total_amount": total_amount,
            "payment_terms": payment_terms,
            "delivery_terms": delivery_terms,
            "terms_and_conditions": terms_and_conditions,
            "prepared_by": prepared_by,
            "notes": notes,
        }
    )
    await db.commit()

    return {
        "message": "Quote created successfully",
        "id": str(quote_id),
        "quote_number": quote_number
    }


@router.put("/quotes/{quote_id}")
async def update_quote(
    quote_id: UUID,
    quote_name: Optional[str] = None,
    status: Optional[str] = None,
    valid_until: Optional[date] = None,
    subtotal: Optional[float] = None,
    discount_amount: Optional[float] = None,
    discount_percentage: Optional[float] = None,
    tax_amount: Optional[float] = None,
    shipping_amount: Optional[float] = None,
    total_amount: Optional[float] = None,
    payment_terms: Optional[str] = None,
    approved_by: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Update quote"""
    updates = []
    params = {"id": str(quote_id)}

    if quote_name:
        updates.append("quote_name = :quote_name")
        params["quote_name"] = quote_name

    if status:
        updates.append("status = :status")
        params["status"] = status

        # Update status tracking dates
        if status == "sent":
            updates.append("sent_date = NOW()")
        elif status == "accepted":
            updates.append("accepted_date = NOW()")
        elif status == "rejected":
            updates.append("rejected_date = NOW()")

    if valid_until is not None:
        updates.append("valid_until = :valid_until")
        params["valid_until"] = valid_until

    if subtotal is not None:
        updates.append("subtotal = :subtotal")
        params["subtotal"] = subtotal

    if discount_amount is not None:
        updates.append("discount_amount = :discount_amount")
        params["discount_amount"] = discount_amount

    if discount_percentage is not None:
        updates.append("discount_percentage = :discount_percentage")
        params["discount_percentage"] = discount_percentage

    if tax_amount is not None:
        updates.append("tax_amount = :tax_amount")
        params["tax_amount"] = tax_amount

    if shipping_amount is not None:
        updates.append("shipping_amount = :shipping_amount")
        params["shipping_amount"] = shipping_amount

    if total_amount is not None:
        updates.append("total_amount = :total_amount")
        params["total_amount"] = total_amount

    if payment_terms is not None:
        updates.append("payment_terms = :payment_terms")
        params["payment_terms"] = payment_terms

    if approved_by is not None:
        updates.append("approved_by = :approved_by")
        params["approved_by"] = approved_by

    if notes is not None:
        updates.append("notes = :notes")
        params["notes"] = notes

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = NOW()")
    query = f"UPDATE quotes SET {', '.join(updates)} WHERE id = :id"

    await db.execute(text(query), params)
    await db.commit()

    return {"message": "Quote updated successfully"}


@router.delete("/quotes/{quote_id}")
async def delete_quote(
    quote_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete quote"""
    await db.execute(
        text("DELETE FROM quotes WHERE id = :id"),
        {"id": str(quote_id)}
    )
    await db.commit()

    return {"message": "Quote deleted successfully"}


@router.get("/quotes/stats/overview")
async def get_quotes_overview(db: AsyncSession = Depends(get_db)):
    """Get overall quote statistics"""
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as total_quotes,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_quotes,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_quotes,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotes,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quotes,
                SUM(total_amount) as total_quoted_value,
                SUM(CASE WHEN status = 'accepted' THEN total_amount ELSE 0 END) as accepted_value,
                AVG(total_amount) as avg_quote_value
            FROM quotes
        """)
    )
    stats = result.fetchone()

    # Calculate acceptance rate
    total_sent = (stats[2] or 0) + (stats[3] or 0) + (stats[4] or 0)
    acceptance_rate = (stats[3] / total_sent * 100) if total_sent > 0 else 0

    return {
        "total_quotes": stats[0] or 0,
        "draft_quotes": stats[1] or 0,
        "sent_quotes": stats[2] or 0,
        "accepted_quotes": stats[3] or 0,
        "rejected_quotes": stats[4] or 0,
        "total_quoted_value": float(stats[5]) if stats[5] else 0.0,
        "accepted_value": float(stats[6]) if stats[6] else 0.0,
        "average_quote_value": float(stats[7]) if stats[7] else 0.0,
        "acceptance_rate_percentage": round(acceptance_rate, 2),
    }
