from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid

router = APIRouter(prefix="/bom", tags=["bill-of-materials"])


@router.get("")
async def list_boms(
    is_active: Optional[bool] = None,
    product_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all Bill of Materials with optional filters."""
    query = """
        SELECT b.*, p.product_name, p.product_code
        FROM bill_of_materials b
        LEFT JOIN products p ON b.product_id = p.id
        WHERE 1=1
    """
    params = {}

    if is_active is not None:
        query += " AND b.is_active = :is_active"
        params["is_active"] = is_active

    if product_id:
        query += " AND b.product_id = :product_id"
        params["product_id"] = product_id

    query += " ORDER BY b.created_at DESC"

    result = await db.execute(text(query), params)
    boms = result.mappings().all()

    return {
        "bill_of_materials": [dict(row) for row in boms],
        "total": len(boms)
    }


@router.get("/stats/overview")
async def get_bom_stats(db: AsyncSession = Depends(get_db)):
    """Get BOM statistics overview."""
    # Total BOMs
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM bill_of_materials"))
    total_boms = total_result.scalar()

    # Active BOMs
    active_result = await db.execute(text("SELECT COUNT(*) as count FROM bill_of_materials WHERE is_active = true"))
    active_boms = active_result.scalar()

    # Average material cost
    avg_cost_query = text("""
        SELECT COALESCE(AVG(total_material_cost), 0) as avg_cost
        FROM bill_of_materials
        WHERE is_active = true
    """)
    avg_cost_result = await db.execute(avg_cost_query)
    avg_material_cost = float(avg_cost_result.scalar() or 0)

    # Total BOMs by product category
    category_query = text("""
        SELECT p.category, COUNT(b.id) as count
        FROM bill_of_materials b
        JOIN products p ON b.product_id = p.id
        WHERE b.is_active = true
        GROUP BY p.category
    """)
    category_result = await db.execute(category_query)
    boms_by_category = {row[0]: row[1] for row in category_result.all()}

    return {
        "total_boms": total_boms,
        "active_boms": active_boms,
        "average_material_cost": round(avg_material_cost, 2),
        "boms_by_category": boms_by_category
    }


@router.get("/{bom_id}")
async def get_bom(bom_id: str, db: AsyncSession = Depends(get_db)):
    """Get BOM details by ID."""
    query = text("""
        SELECT b.*, p.product_name, p.product_code
        FROM bill_of_materials b
        LEFT JOIN products p ON b.product_id = p.id
        WHERE b.id = :bom_id
    """)
    result = await db.execute(query, {"bom_id": bom_id})
    bom = result.mappings().first()

    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found")

    return {"bom": dict(bom)}


@router.post("")
async def create_bom(bom_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new Bill of Materials."""
    bom_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO bill_of_materials (
            id, bom_code, product_id, version, is_active, materials,
            total_material_cost, labor_cost, overhead_cost, total_cost, notes
        ) VALUES (
            :id, :bom_code, :product_id, :version, :is_active, :materials,
            :total_material_cost, :labor_cost, :overhead_cost, :total_cost, :notes
        )
        RETURNING *
    """)

    params = {
        "id": bom_id,
        "bom_code": bom_data.get("bom_code"),
        "product_id": bom_data.get("product_id"),
        "version": bom_data.get("version", "1.0"),
        "is_active": bom_data.get("is_active", True),
        "materials": bom_data.get("materials", []),
        "total_material_cost": bom_data.get("total_material_cost", 0.00),
        "labor_cost": bom_data.get("labor_cost", 0.00),
        "overhead_cost": bom_data.get("overhead_cost", 0.00),
        "total_cost": bom_data.get("total_cost", 0.00),
        "notes": bom_data.get("notes", "")
    }

    result = await db.execute(query, params)
    await db.commit()
    bom = result.mappings().first()

    return {"bom": dict(bom), "message": "BOM created successfully"}


@router.put("/{bom_id}")
async def update_bom(bom_id: str, bom_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing BOM."""
    update_fields = []
    params = {"bom_id": bom_id}

    for key, value in bom_data.items():
        if key != "id" and key != "created_at":
            update_fields.append(f"{key} = :{key}")
            params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE bill_of_materials
        SET {', '.join(update_fields)}
        WHERE id = :bom_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    bom = result.mappings().first()

    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found")

    return {"bom": dict(bom), "message": "BOM updated successfully"}


@router.delete("/{bom_id}")
async def delete_bom(bom_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a BOM."""
    query = text("DELETE FROM bill_of_materials WHERE id = :bom_id RETURNING id")
    result = await db.execute(query, {"bom_id": bom_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="BOM not found")

    return {"message": "BOM deleted successfully", "id": str(deleted["id"])}
