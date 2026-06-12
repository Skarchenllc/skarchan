"""
Template for Entity CRUD Operations
Reusable pattern for all module entities
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.entity_record import EntityRecord
from app.core.crypto import encrypt, decrypt


async def _sensitive_fields(db: AsyncSession, entity_type: str) -> Set[str]:
    """Names of fields flagged is_sensitive=true for this entity_type.

    Cached per-request via the surrounding endpoint. The query is cheap
    (small table, indexed by entity_type).
    """
    result = await db.execute(
        text(
            "SELECT field_name FROM custom_field_definitions "
            "WHERE entity_type = :et AND deleted_flag = false AND is_sensitive = true"
        ),
        {"et": entity_type},
    )
    return {row[0] for row in result.fetchall()}


def _apply(fn, data: dict, fields: Set[str]) -> dict:
    """Return a copy of `data` with `fn` applied to each sensitive field."""
    out = dict(data)
    for k in fields:
        if k in out:
            out[k] = fn(out[k])
    return out


def create_entity_router(module_code: str, entity_type: str):
    """
    Factory function to create CRUD router for any entity type

    Usage:
        router = create_entity_router("inventory", "warehouses")
    """
    router = APIRouter()

    @router.get("")
    async def list_entities(
        organization_id: str = Query(...),
        skip: int = Query(0),
        limit: int = Query(100),
        search: Optional[str] = Query(None),
        db: AsyncSession = Depends(get_db),
    ):
        """List all entities of this type"""
        query = select(EntityRecord).where(
            EntityRecord.module_code == module_code,
            EntityRecord.entity_type == entity_type,
            EntityRecord.organization_id == uuid.UUID(organization_id),
            EntityRecord.is_deleted == 'N'
        )

        if search:
            query = query.where(
                text("data::text ILIKE :search")
            ).params(search=f"%{search}%")

        query = query.order_by(EntityRecord.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        records = result.scalars().all()

        sensitive = await _sensitive_fields(db, entity_type)
        return {
            "data": [
                {
                    "id": str(record.id),
                    "entity_type": record.entity_type,
                    "module_code": record.module_code,
                    **_apply(decrypt, record.data, sensitive),
                    "created_at": record.created_at.isoformat() if record.created_at else None,
                    "last_modified_at": record.last_modified_at.isoformat() if record.last_modified_at else None,
                }
                for record in records
            ],
            "total": len(records),
            "skip": skip,
            "limit": limit
        }

    @router.get("/{entity_id}")
    async def get_entity(
        entity_id: str,
        organization_id: str = Query(...),
        db: AsyncSession = Depends(get_db),
    ):
        """Get a specific entity by ID"""
        query = select(EntityRecord).where(
            EntityRecord.id == uuid.UUID(entity_id),
            EntityRecord.module_code == module_code,
            EntityRecord.entity_type == entity_type,
            EntityRecord.organization_id == uuid.UUID(organization_id),
            EntityRecord.is_deleted == 'N'
        )

        result = await db.execute(query)
        record = result.scalar_one_or_none()

        if not record:
            raise HTTPException(status_code=404, detail=f"{entity_type.title()} not found")

        sensitive = await _sensitive_fields(db, entity_type)
        return {
            "id": str(record.id),
            "entity_type": record.entity_type,
            "module_code": record.module_code,
            **_apply(decrypt, record.data, sensitive),
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "created_by": str(record.created_by) if record.created_by else None,
            "last_modified_at": record.last_modified_at.isoformat() if record.last_modified_at else None,
            "last_modified_by": str(record.last_modified_by) if record.last_modified_by else None,
        }

    @router.post("")
    async def create_entity(
        data: dict,
        organization_id: str = Query(...),
        created_by: str = Query(...),
        db: AsyncSession = Depends(get_db),
    ):
        """Create a new entity"""
        entity_data = {k: v for k, v in data.items() if k not in ['organization_id', 'created_by']}

        sensitive = await _sensitive_fields(db, entity_type)
        encrypted_data = _apply(encrypt, entity_data, sensitive)

        new_record = EntityRecord(
            entity_type=entity_type,
            module_code=module_code,
            data=encrypted_data,
            organization_id=uuid.UUID(organization_id),
            created_by=uuid.UUID(created_by),
            last_modified_by=uuid.UUID(created_by),
        )

        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)

        # Fire automation/AI events through the central seam (plaintext data).
        from app.services.events import emit_write
        await emit_write(db, event="created", entity_type=entity_type,
                         record_id=new_record.id, data=entity_data,
                         module_code=module_code, actor=created_by)

        # Return decrypted to the client (UI expects plaintext)
        return {
            "id": str(new_record.id),
            "entity_type": new_record.entity_type,
            "module_code": new_record.module_code,
            **_apply(decrypt, new_record.data, sensitive),
            "created_at": new_record.created_at.isoformat(),
            "message": f"{entity_type.title()} created successfully"
        }

    @router.put("/{entity_id}")
    async def update_entity(
        entity_id: str,
        data: dict,
        organization_id: str = Query(...),
        last_modified_by: str = Query(...),
        db: AsyncSession = Depends(get_db),
    ):
        """Update an existing entity"""
        query = select(EntityRecord).where(
            EntityRecord.id == uuid.UUID(entity_id),
            EntityRecord.module_code == module_code,
            EntityRecord.entity_type == entity_type,
            EntityRecord.organization_id == uuid.UUID(organization_id),
            EntityRecord.is_deleted == 'N'
        )

        result = await db.execute(query)
        record = result.scalar_one_or_none()

        if not record:
            raise HTTPException(status_code=404, detail=f"{entity_type.title()} not found")

        entity_data = {k: v for k, v in data.items() if k not in ['organization_id', 'last_modified_by']}
        sensitive = await _sensitive_fields(db, entity_type)
        prev_plain = _apply(decrypt, record.data or {}, sensitive)  # plaintext snapshot for 'changed' conditions
        record.data = _apply(encrypt, entity_data, sensitive)
        record.last_modified_by = uuid.UUID(last_modified_by)
        record.last_modified_at = datetime.utcnow()

        await db.commit()
        await db.refresh(record)

        # Fire automation/AI events through the central seam (plaintext data).
        from app.services.events import emit_write
        await emit_write(db, event="updated", entity_type=entity_type,
                         record_id=record.id, data=entity_data, prev_data=prev_plain,
                         module_code=module_code, actor=last_modified_by)

        return {
            "id": str(record.id),
            **_apply(decrypt, record.data, sensitive),
            "last_modified_at": record.last_modified_at.isoformat(),
            "message": f"{entity_type.title()} updated successfully"
        }

    @router.delete("/{entity_id}")
    async def delete_entity(
        entity_id: str,
        organization_id: str = Query(...),
        deleted_by: str = Query(...),
        db: AsyncSession = Depends(get_db),
    ):
        """Soft delete an entity"""
        query = select(EntityRecord).where(
            EntityRecord.id == uuid.UUID(entity_id),
            EntityRecord.module_code == module_code,
            EntityRecord.entity_type == entity_type,
            EntityRecord.organization_id == uuid.UUID(organization_id),
            EntityRecord.is_deleted == 'N'
        )

        result = await db.execute(query)
        record = result.scalar_one_or_none()

        if not record:
            raise HTTPException(status_code=404, detail=f"{entity_type.title()} not found")

        sensitive = await _sensitive_fields(db, entity_type)
        deleted_plain = _apply(decrypt, record.data or {}, sensitive)  # plaintext for rule conditions

        record.is_deleted = 'Y'
        record.deleted_by = uuid.UUID(deleted_by)
        record.deleted_at = datetime.utcnow()

        await db.commit()

        # Fire automation/AI events through the central seam (plaintext data).
        from app.services.events import emit_write
        await emit_write(db, event="deleted", entity_type=entity_type,
                         record_id=record.id, data=deleted_plain,
                         module_code=module_code, actor=deleted_by)

        return {"message": f"{entity_type.title()} deleted successfully"}

    return router
