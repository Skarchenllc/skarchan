from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime, date
from uuid import UUID
import uuid as uuid_lib

from app.core.database import get_db

router = APIRouter()


@router.get("/customers")
async def get_customers(
    customer_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    industry: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all customers with optional filters"""
    query = "SELECT * FROM customers WHERE 1=1"
    params = {}

    if customer_type:
        query += " AND customer_type = :customer_type"
        params["customer_type"] = customer_type

    if is_active is not None:
        query += " AND is_active = :is_active"
        params["is_active"] = is_active

    if industry:
        query += " AND industry = :industry"
        params["industry"] = industry

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    customers = result.fetchall()

    return {
        "customers": [
            {
                "id": str(row[0]),
                "customer_code": row[1],
                "company_name": row[2],
                "customer_type": row[3],
                "primary_contact_name": row[4],
                "primary_email": row[5],
                "primary_phone": row[6],
                "city": row[11],
                "state": row[12],
                "country": row[13],
                "industry": row[15],
                "company_size": row[16],
                "total_lifetime_value": float(row[18]) if row[18] else 0.0,
                "total_orders": row[19] or 0,
                "assigned_sales_rep": row[22],
                "is_active": row[26],
                "created_at": row[29].isoformat() if row[29] else None,
            }
            for row in customers
        ],
        "total": len(customers)
    }


@router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get customer by ID"""
    result = await db.execute(
        text("SELECT * FROM customers WHERE id = :id"),
        {"id": str(customer_id)}
    )
    customer = result.fetchone()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return {
        "id": str(customer[0]),
        "customer_code": customer[1],
        "company_name": customer[2],
        "customer_type": customer[3],
        "primary_contact_name": customer[4],
        "primary_email": customer[5],
        "primary_phone": customer[6],
        "billing_address": customer[7],
        "shipping_address": customer[8],
        "city": customer[9],
        "state": customer[10],
        "country": customer[11],
        "postal_code": customer[12],
        "industry": customer[13],
        "company_size": customer[14],
        "annual_revenue": float(customer[15]) if customer[15] else None,
        "website": customer[16],
        "customer_since": customer[17].isoformat() if customer[17] else None,
        "total_lifetime_value": float(customer[18]) if customer[18] else 0.0,
        "total_orders": customer[19] or 0,
        "payment_terms": customer[20],
        "credit_limit": float(customer[21]) if customer[21] else None,
        "assigned_sales_rep": customer[22],
        "account_manager": customer[23],
        "tags": customer[24],
        "custom_fields": customer[25],
        "is_active": customer[26],
        "notes": customer[27],
        "created_by": customer[28],
        "created_at": customer[29].isoformat() if customer[29] else None,
        "updated_at": customer[30].isoformat() if customer[30] else None,
    }


@router.post("/customers")
async def create_customer(
    customer_code: str,
    company_name: str,
    customer_type: Optional[str] = "prospect",
    primary_contact_name: Optional[str] = None,
    primary_email: Optional[str] = None,
    primary_phone: Optional[str] = None,
    billing_address: Optional[str] = None,
    shipping_address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
    postal_code: Optional[str] = None,
    industry: Optional[str] = None,
    company_size: Optional[str] = None,
    annual_revenue: Optional[float] = None,
    website: Optional[str] = None,
    payment_terms: Optional[str] = None,
    credit_limit: Optional[float] = None,
    assigned_sales_rep: Optional[str] = None,
    account_manager: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new customer"""
    customer_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO customers (
                id, customer_code, company_name, customer_type,
                primary_contact_name, primary_email, primary_phone,
                billing_address, shipping_address, city, state, country, postal_code,
                industry, company_size, annual_revenue, website,
                customer_since, total_lifetime_value, total_orders,
                payment_terms, credit_limit, assigned_sales_rep, account_manager,
                is_active, notes, created_at, updated_at
            ) VALUES (
                :id, :customer_code, :company_name, :customer_type,
                :primary_contact_name, :primary_email, :primary_phone,
                :billing_address, :shipping_address, :city, :state, :country, :postal_code,
                :industry, :company_size, :annual_revenue, :website,
                NOW(), 0, 0,
                :payment_terms, :credit_limit, :assigned_sales_rep, :account_manager,
                true, :notes, NOW(), NOW()
            )
        """),
        {
            "id": str(customer_id),
            "customer_code": customer_code,
            "company_name": company_name,
            "customer_type": customer_type,
            "primary_contact_name": primary_contact_name,
            "primary_email": primary_email,
            "primary_phone": primary_phone,
            "billing_address": billing_address,
            "shipping_address": shipping_address,
            "city": city,
            "state": state,
            "country": country,
            "postal_code": postal_code,
            "industry": industry,
            "company_size": company_size,
            "annual_revenue": annual_revenue,
            "website": website,
            "payment_terms": payment_terms,
            "credit_limit": credit_limit,
            "assigned_sales_rep": assigned_sales_rep,
            "account_manager": account_manager,
            "notes": notes,
        }
    )
    await db.commit()

    return {
        "message": "Customer created successfully",
        "id": str(customer_id),
        "customer_code": customer_code
    }


@router.put("/customers/{customer_id}")
async def update_customer(
    customer_id: UUID,
    company_name: Optional[str] = None,
    customer_type: Optional[str] = None,
    primary_contact_name: Optional[str] = None,
    primary_email: Optional[str] = None,
    primary_phone: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
    industry: Optional[str] = None,
    assigned_sales_rep: Optional[str] = None,
    account_manager: Optional[str] = None,
    is_active: Optional[bool] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Update customer"""
    updates = []
    params = {"id": str(customer_id)}

    if company_name:
        updates.append("company_name = :company_name")
        params["company_name"] = company_name

    if customer_type:
        updates.append("customer_type = :customer_type")
        params["customer_type"] = customer_type

    if primary_contact_name is not None:
        updates.append("primary_contact_name = :primary_contact_name")
        params["primary_contact_name"] = primary_contact_name

    if primary_email is not None:
        updates.append("primary_email = :primary_email")
        params["primary_email"] = primary_email

    if primary_phone is not None:
        updates.append("primary_phone = :primary_phone")
        params["primary_phone"] = primary_phone

    if city is not None:
        updates.append("city = :city")
        params["city"] = city

    if state is not None:
        updates.append("state = :state")
        params["state"] = state

    if country is not None:
        updates.append("country = :country")
        params["country"] = country

    if industry is not None:
        updates.append("industry = :industry")
        params["industry"] = industry

    if assigned_sales_rep is not None:
        updates.append("assigned_sales_rep = :assigned_sales_rep")
        params["assigned_sales_rep"] = assigned_sales_rep

    if account_manager is not None:
        updates.append("account_manager = :account_manager")
        params["account_manager"] = account_manager

    if is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = is_active

    if notes is not None:
        updates.append("notes = :notes")
        params["notes"] = notes

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = NOW()")
    query = f"UPDATE customers SET {', '.join(updates)} WHERE id = :id"

    await db.execute(text(query), params)
    await db.commit()

    return {"message": "Customer updated successfully"}


@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete customer"""
    await db.execute(
        text("DELETE FROM customers WHERE id = :id"),
        {"id": str(customer_id)}
    )
    await db.commit()

    return {"message": "Customer deleted successfully"}


@router.get("/customers/stats/overview")
async def get_customers_overview(db: AsyncSession = Depends(get_db)):
    """Get overall customer statistics"""
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as total_customers,
                COUNT(CASE WHEN customer_type = 'active' THEN 1 END) as active_customers,
                COUNT(CASE WHEN customer_type = 'prospect' THEN 1 END) as prospects,
                SUM(total_lifetime_value) as total_ltv,
                SUM(total_orders) as total_orders,
                AVG(total_lifetime_value) as avg_customer_value
            FROM customers
            WHERE is_active = true
        """)
    )
    stats = result.fetchone()

    return {
        "total_customers": stats[0] or 0,
        "active_customers": stats[1] or 0,
        "prospects": stats[2] or 0,
        "total_lifetime_value": float(stats[3]) if stats[3] else 0.0,
        "total_orders": stats[4] or 0,
        "average_customer_value": float(stats[5]) if stats[5] else 0.0,
    }
