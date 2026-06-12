"""
Entity Records API Endpoints
Handles CRUD operations for dynamic entity records
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from pydantic import BaseModel, UUID4
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models import EntityRecord

router = APIRouter()


# Pydantic schemas
class EntityRecordCreate(BaseModel):
    entity_type: str
    data: dict
    organization_id: UUID4
    created_by: UUID4


class EntityRecordUpdate(BaseModel):
    data: dict
    last_modified_by: UUID4


class EntityRecordResponse(BaseModel):
    id: UUID4
    entity_type: str
    data: dict
    organization_id: UUID4
    created_by: UUID4
    created_date: datetime
    last_modified_by: UUID4
    last_modified_date: datetime
    is_deleted: str

    class Config:
        from_attributes = True


class EntityRecordListResponse(BaseModel):
    records: List[EntityRecordResponse]
    total: int


@router.post("/entity-records", response_model=EntityRecordResponse)
async def create_entity_record(
    record: EntityRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new entity record"""
    new_record = EntityRecord(
        id=uuid.uuid4(),
        entity_type=record.entity_type,
        data=record.data,
        organization_id=record.organization_id,
        created_by=record.created_by,
        last_modified_by=record.created_by,
        is_deleted='N'
    )

    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)

    return new_record


@router.get("/entity-records", response_model=EntityRecordListResponse)
async def list_entity_records(
    entity_type: Optional[str] = None,
    organization_id: Optional[UUID4] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List entity records with optional filtering"""
    conditions = [EntityRecord.is_deleted == 'N']

    if entity_type:
        conditions.append(EntityRecord.entity_type == entity_type)

    if organization_id:
        conditions.append(EntityRecord.organization_id == organization_id)

    # Get total count
    count_query = select(EntityRecord).where(and_(*conditions))
    result = await db.execute(count_query)
    total = len(result.scalars().all())

    # Get paginated records
    query = (
        select(EntityRecord)
        .where(and_(*conditions))
        .order_by(EntityRecord.created_date.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    records = result.scalars().all()

    return EntityRecordListResponse(records=records, total=total)


@router.get("/entity-records/{record_id}", response_model=EntityRecordResponse)
async def get_entity_record(
    record_id: UUID4,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific entity record by ID"""
    query = select(EntityRecord).where(
        and_(
            EntityRecord.id == record_id,
            EntityRecord.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity record not found"
        )

    return record


@router.put("/entity-records/{record_id}", response_model=EntityRecordResponse)
async def update_entity_record(
    record_id: UUID4,
    record_update: EntityRecordUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an entity record"""
    query = select(EntityRecord).where(
        and_(
            EntityRecord.id == record_id,
            EntityRecord.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity record not found"
        )

    # Update fields
    record.data = record_update.data
    record.last_modified_by = record_update.last_modified_by
    record.last_modified_date = datetime.utcnow()

    await db.commit()
    await db.refresh(record)

    return record


@router.delete("/entity-records/{record_id}")
async def delete_entity_record(
    record_id: UUID4,
    deleted_by: UUID4,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete an entity record"""
    query = select(EntityRecord).where(
        and_(
            EntityRecord.id == record_id,
            EntityRecord.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity record not found"
        )

    # Soft delete
    record.is_deleted = 'Y'
    record.deleted_by = deleted_by
    record.deleted_date = datetime.utcnow()

    await db.commit()

    return {"message": "Entity record deleted successfully"}
