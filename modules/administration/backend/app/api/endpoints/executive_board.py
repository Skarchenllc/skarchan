from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
from datetime import datetime, date
import uuid

router = APIRouter(prefix="/executive-board", tags=["executive-board"])


@router.get("")
async def list_executive_board(
    position: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all executive board members with optional filters."""
    query = "SELECT * FROM executive_board WHERE 1=1"
    params = {}

    if position:
        query += " AND position = :position"
        params["position"] = position

    if status:
        query += " AND status = :status"
        params["status"] = status

    if department:
        query += " AND department = :department"
        params["department"] = department

    if search:
        query += " AND (member_name ILIKE :search OR position ILIKE :search)"
        params["search"] = f"%{search}%"

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    members = result.mappings().all()

    return {
        "executive_board": [dict(row) for row in members],
        "total": len(members)
    }


@router.get("/stats/overview")
async def get_executive_board_stats(db: AsyncSession = Depends(get_db)):
    """Get executive board statistics overview."""
    # Total members
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM executive_board"))
    total_members = total_result.scalar()

    # Active members
    active_result = await db.execute(text("SELECT COUNT(*) as count FROM executive_board WHERE status = 'active'"))
    active_members = active_result.scalar()

    # C-Suite count
    csuite_result = await db.execute(text("""
        SELECT COUNT(*) as count FROM executive_board
        WHERE position IN ('CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CHRO') AND status = 'active'
    """))
    csuite_count = csuite_result.scalar()

    # Board members count
    board_result = await db.execute(text("""
        SELECT COUNT(*) as count FROM executive_board
        WHERE position LIKE '%Board Member%' AND status = 'active'
    """))
    board_members_count = board_result.scalar()

    return {
        "total_members": total_members,
        "active_members": active_members,
        "csuite_count": csuite_count,
        "board_members_count": board_members_count
    }


@router.get("/{member_id}")
async def get_executive_board_member(member_id: str, db: AsyncSession = Depends(get_db)):
    """Get executive board member details by ID."""
    query = text("SELECT * FROM executive_board WHERE id = :member_id")
    result = await db.execute(query, {"member_id": member_id})
    member = result.mappings().first()

    if not member:
        raise HTTPException(status_code=404, detail="Executive board member not found")

    return {"executive_board_member": dict(member)}


@router.post("")
async def create_executive_board_member(member_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new executive board member."""
    member_id = str(uuid.uuid4())

    # Helper function to parse date strings
    def parse_date(date_str):
        if not date_str:
            return None
        if isinstance(date_str, date):
            return date_str
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except:
            return None

    query = text("""
        INSERT INTO executive_board (
            id, member_name, position, department, email, phone,
            start_date, end_date, status, bio, photo_url, reports_to_id
        ) VALUES (
            :id, :member_name, :position, :department, :email, :phone,
            :start_date, :end_date, :status, :bio, :photo_url, CAST(:reports_to_id AS uuid)
        )
        RETURNING *
    """)

    params = {
        "id": member_id,
        "member_name": member_data.get("member_name"),
        "position": member_data.get("position"),
        "department": member_data.get("department"),
        "email": member_data.get("email"),
        "phone": member_data.get("phone"),
        "start_date": parse_date(member_data.get("start_date")),
        "end_date": parse_date(member_data.get("end_date")),
        "status": member_data.get("status", "active"),
        "bio": member_data.get("bio"),
        "photo_url": member_data.get("photo_url"),
        "reports_to_id": member_data.get("reports_to_id") or member_data.get("reports_to")
    }

    result = await db.execute(query, params)
    await db.commit()
    member = result.mappings().first()

    return {"executive_board_member": dict(member), "message": "Executive board member created successfully"}


@router.put("/{member_id}")
async def update_executive_board_member(member_id: str, member_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing executive board member."""
    # Helper function to parse date strings
    def parse_date(date_str):
        if not date_str:
            return None
        if isinstance(date_str, date):
            return date_str
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except:
            return None

    # Build dynamic update query
    update_fields = []
    params = {"member_id": member_id}

    for key, value in member_data.items():
        if key not in ("id", "created_at", "updated_at"):
            # Parse date fields
            if key in ("start_date", "end_date") and value:
                value = parse_date(value)

            if key == "reports_to_id" and value:
                update_fields.append(f"{key} = CAST(:{key} AS uuid)")
            elif key == "reports_to" and value:
                # Handle frontend sending "reports_to" instead of "reports_to_id"
                update_fields.append("reports_to_id = CAST(:reports_to AS uuid)")
            else:
                update_fields.append(f"{key} = :{key}")
            params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE executive_board
        SET {', '.join(update_fields)}
        WHERE id = :member_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    member = result.mappings().first()

    if not member:
        raise HTTPException(status_code=404, detail="Executive board member not found")

    return {"executive_board_member": dict(member), "message": "Executive board member updated successfully"}


@router.delete("/{member_id}")
async def delete_executive_board_member(member_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an executive board member."""
    query = text("DELETE FROM executive_board WHERE id = :member_id RETURNING id")
    result = await db.execute(query, {"member_id": member_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Executive board member not found")

    return {"message": "Executive board member deleted successfully", "id": str(deleted["id"])}
