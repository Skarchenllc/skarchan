"""
Development Center API - Centralized in Core Backend
Owns ALL module builder data - NO CRM proxying
Unified module system (no system vs custom distinction)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.module import Module, EntityType
from app.models.entity_record import EntityRecord
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue

router = APIRouter()


# ==================== Modules (unified - no system/custom distinction) ====================

@router.get("/modules")
async def list_modules(
    organization_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    scope: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List all modules (unified system - no distinction between system and custom)
    Like Drupal content types - all treated equally
    """
    query = select(Module)

    if organization_id:
        # Include both system modules (org_id is NULL) and org-specific modules
        query = query.where(
            or_(
                Module.organization_id == uuid.UUID(organization_id),
                Module.organization_id.is_(None)
            )
        )

    if is_active is not None:
        query = query.where(Module.is_active == is_active)

    if scope:
        query = query.where(Module.scope == scope)

    query = query.order_by(Module.display_order, Module.module_name)

    result = await db.execute(query)
    modules = result.scalars().all()

    return {
        "data": [
            {
                "id": str(m.id),
                "module_code": m.module_code,
                "module_name": m.module_name,
                "module_label": m.module_label,
                "description": getattr(m, "description", None),
                "icon": getattr(m, "icon", None),
                "color": getattr(m, "color", None),
                "is_active": getattr(m, "is_active", True),
                "is_system_module": getattr(m, "is_system_module", False),
                "show_in_navigation": getattr(m, "show_in_navigation", True),
                "display_order": getattr(m, "display_order", 0),
                "parent_id": str(m.parent_id) if getattr(m, "parent_id", None) else None,
                "settings": getattr(m, "settings", None),
                "organization_id": str(m.organization_id) if getattr(m, "organization_id", None) else None,
                "created_at": m.created_at.isoformat() if getattr(m, "created_at", None) else None,
                "last_modified_at": m.last_modified_at.isoformat() if getattr(m, "last_modified_at", None) else None,
            }
            for m in modules
        ]
    }


@router.get("/modules/{module_id}")
async def get_module(module_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific module by ID"""
    query = select(Module).where(
        Module.id == uuid.UUID(module_id),
    )
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return {
        "id": str(module.id),
        "module_code": module.module_code,
        "module_name": module.module_name,
        "module_label": module.module_label,
        "description": module.description,
        "icon": module.icon,
        "color": module.color,
        "route_path": module.route_path,
        "is_active": module.is_active,
        "display_order": module.display_order,
        "module_type": module.module_type,
        "scope": module.scope,
        "settings": module.settings,
        "organization_id": str(module.organization_id) if module.organization_id else None,
        "created_at": module.created_at.isoformat() if module.created_at else None,
        "last_modified_at": module.last_modified_at.isoformat() if module.last_modified_at else None,
    }


@router.post("/modules")
async def create_module(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new module"""
    new_module = Module(
        module_code=data.get("module_code"),
        module_name=data.get("module_name"),
        module_label=data.get("module_label"),
        description=data.get("description"),
        icon=data.get("icon"),
        color=data.get("color"),
        route_path=data.get("route_path"),
        is_active=data.get("is_active", True),
        display_order=data.get("display_order", 0),
        module_type=data.get("module_type", "custom"),
        scope=data.get("scope", "organization"),
        organization_id=uuid.UUID(data["organization_id"]) if data.get("organization_id") else None,
        settings=data.get("settings", {}),
        created_by=uuid.UUID(data["created_by"]),
        last_modified_by=uuid.UUID(data["created_by"]),
    )

    db.add(new_module)
    await db.commit()
    await db.refresh(new_module)

    return {
        "id": str(new_module.id),
        "module_code": new_module.module_code,
        "module_name": new_module.module_name,
        "module_label": new_module.module_label,
        "description": new_module.description,
        "icon": new_module.icon,
        "color": new_module.color,
        "route_path": new_module.route_path,
        "is_active": new_module.is_active,
        "display_order": new_module.display_order,
        "module_type": new_module.module_type,
        "scope": new_module.scope,
        "settings": new_module.settings,
        "organization_id": str(new_module.organization_id) if new_module.organization_id else None,
        "created_at": new_module.created_at.isoformat() if new_module.created_at else None,
    }


@router.put("/modules/{module_id}")
async def update_module(module_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a module"""
    query = select(Module).where(
        Module.id == uuid.UUID(module_id),
    )
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Update fields
    if "module_name" in data:
        module.module_name = data["module_name"]
    if "module_label" in data:
        module.module_label = data["module_label"]
    if "description" in data:
        module.description = data["description"]
    if "icon" in data:
        module.icon = data["icon"]
    if "color" in data:
        module.color = data["color"]
    if "route_path" in data:
        module.route_path = data["route_path"]
    if "is_active" in data:
        module.is_active = data["is_active"]
    if "display_order" in data:
        module.display_order = data["display_order"]
    if "module_type" in data:
        module.module_type = data["module_type"]
    if "settings" in data:
        module.settings = data["settings"]
    if "last_modified_by" in data:
        module.last_modified_by = uuid.UUID(data["last_modified_by"])

    module.last_modified_at = datetime.utcnow()

    await db.commit()
    await db.refresh(module)

    return {
        "id": str(module.id),
        "module_code": module.module_code,
        "module_name": module.module_name,
        "module_label": module.module_label,
        "is_active": module.is_active,
        "last_modified_at": module.last_modified_at.isoformat(),
    }


@router.delete("/modules/{module_id}")
async def delete_module(
    module_id: str,
    deleted_by: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Delete a module (hard delete — table has no soft-delete column)."""
    query = select(Module).where(
        Module.id == uuid.UUID(module_id),
    )
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    await db.delete(module)

    await db.commit()

    return {"message": "Module deleted successfully"}


# ==================== Entity Types (previously called Components) ====================

@router.get("/entity-types")
async def list_entity_types(
    module_id: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all entity types (previously called components)"""
    query = select(EntityType).where(EntityType.is_deleted == 'N')

    if module_id:
        query = query.where(EntityType.module_id == uuid.UUID(module_id))

    if organization_id:
        query = query.where(
            or_(
                EntityType.organization_id == uuid.UUID(organization_id),
                EntityType.organization_id.is_(None)
            )
        )

    if is_active is not None:
        query = query.where(EntityType.is_active == is_active)

    query = query.order_by(EntityType.display_order, EntityType.entity_type_name)

    result = await db.execute(query)
    entity_types = result.scalars().all()

    return {
        "data": [
            {
                "id": str(et.id),
                "entity_type_code": et.entity_type_code,
                "entity_type_name": et.entity_type_name,
                "entity_type_label": et.entity_type_label,
                "entity_type_label_plural": et.entity_type_label_plural,
                "module_id": str(et.module_id),
                "description": et.description,
                "icon": et.icon,
                "is_active": et.is_active,
                "display_order": et.display_order,
                "list_view_config": et.list_view_config,
                "form_config": et.form_config,
                "detail_view_config": et.detail_view_config,
                "permissions": et.permissions,
                "organization_id": str(et.organization_id) if et.organization_id else None,
                "created_at": et.created_at.isoformat() if et.created_at else None,
            }
            for et in entity_types
        ]
    }


@router.get("/entity-types/{entity_type_id}")
async def get_entity_type(entity_type_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific entity type"""
    query = select(EntityType).where(
        EntityType.id == uuid.UUID(entity_type_id),
        EntityType.is_deleted == 'N'
    )
    result = await db.execute(query)
    entity_type = result.scalar_one_or_none()

    if not entity_type:
        raise HTTPException(status_code=404, detail="Entity type not found")

    return {
        "id": str(entity_type.id),
        "entity_type_code": entity_type.entity_type_code,
        "entity_type_name": entity_type.entity_type_name,
        "entity_type_label": entity_type.entity_type_label,
        "entity_type_label_plural": entity_type.entity_type_label_plural,
        "module_id": str(entity_type.module_id),
        "description": entity_type.description,
        "icon": entity_type.icon,
        "is_active": entity_type.is_active,
        "display_order": entity_type.display_order,
        "list_view_config": entity_type.list_view_config,
        "form_config": entity_type.form_config,
        "detail_view_config": entity_type.detail_view_config,
        "permissions": entity_type.permissions,
        "organization_id": str(entity_type.organization_id) if entity_type.organization_id else None,
    }


@router.post("/entity-types")
async def create_entity_type(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new entity type"""
    new_entity_type = EntityType(
        entity_type_code=data.get("entity_type_code"),
        entity_type_name=data.get("entity_type_name"),
        entity_type_label=data.get("entity_type_label"),
        entity_type_label_plural=data.get("entity_type_label_plural"),
        module_id=uuid.UUID(data["module_id"]),
        description=data.get("description"),
        icon=data.get("icon"),
        is_active=data.get("is_active", True),
        display_order=data.get("display_order", 0),
        list_view_config=data.get("list_view_config", {}),
        form_config=data.get("form_config", {}),
        detail_view_config=data.get("detail_view_config", {}),
        permissions=data.get("permissions", {}),
        organization_id=uuid.UUID(data["organization_id"]) if data.get("organization_id") else None,
        created_by=uuid.UUID(data["created_by"]),
        last_modified_by=uuid.UUID(data["created_by"]),
    )

    db.add(new_entity_type)
    await db.commit()
    await db.refresh(new_entity_type)

    return {
        "id": str(new_entity_type.id),
        "entity_type_code": new_entity_type.entity_type_code,
        "entity_type_name": new_entity_type.entity_type_name,
        "entity_type_label": new_entity_type.entity_type_label,
        "entity_type_label_plural": new_entity_type.entity_type_label_plural,
        "module_id": str(new_entity_type.module_id),
        "description": new_entity_type.description,
        "icon": new_entity_type.icon,
        "is_active": new_entity_type.is_active,
        "created_at": new_entity_type.created_at.isoformat(),
    }


@router.put("/entity-types/{entity_type_id}")
async def update_entity_type(entity_type_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update an entity type"""
    query = select(EntityType).where(
        EntityType.id == uuid.UUID(entity_type_id),
        EntityType.is_deleted == 'N'
    )
    result = await db.execute(query)
    entity_type = result.scalar_one_or_none()

    if not entity_type:
        raise HTTPException(status_code=404, detail="Entity type not found")

    # Update fields
    if "entity_type_name" in data:
        entity_type.entity_type_name = data["entity_type_name"]
    if "entity_type_label" in data:
        entity_type.entity_type_label = data["entity_type_label"]
    if "entity_type_label_plural" in data:
        entity_type.entity_type_label_plural = data["entity_type_label_plural"]
    if "description" in data:
        entity_type.description = data["description"]
    if "icon" in data:
        entity_type.icon = data["icon"]
    if "is_active" in data:
        entity_type.is_active = data["is_active"]
    if "display_order" in data:
        entity_type.display_order = data["display_order"]
    if "list_view_config" in data:
        entity_type.list_view_config = data["list_view_config"]
    if "form_config" in data:
        entity_type.form_config = data["form_config"]
    if "detail_view_config" in data:
        entity_type.detail_view_config = data["detail_view_config"]
    if "permissions" in data:
        entity_type.permissions = data["permissions"]
    if "last_modified_by" in data:
        entity_type.last_modified_by = uuid.UUID(data["last_modified_by"])

    entity_type.last_modified_at = datetime.utcnow()

    await db.commit()
    await db.refresh(entity_type)

    return {
        "id": str(entity_type.id),
        "entity_type_code": entity_type.entity_type_code,
        "entity_type_name": entity_type.entity_type_name,
        "is_active": entity_type.is_active,
    }


@router.delete("/entity-types/{entity_type_id}")
async def delete_entity_type(
    entity_type_id: str,
    deleted_by: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Delete an entity type (soft delete)"""
    query = select(EntityType).where(
        EntityType.id == uuid.UUID(entity_type_id),
        EntityType.is_deleted == 'N'
    )
    result = await db.execute(query)
    entity_type = result.scalar_one_or_none()

    if not entity_type:
        raise HTTPException(status_code=404, detail="Entity type not found")

    entity_type.is_deleted = 'Y'
    entity_type.deleted_by = uuid.UUID(deleted_by)
    entity_type.deleted_at = datetime.utcnow()

    await db.commit()

    return {"message": "Entity type deleted successfully"}


# ==================== Combined Endpoints ====================

@router.get("/modules-with-entity-types")
async def get_modules_with_entity_types(
    organization_id: Optional[str] = Query(None),
    include_system: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all modules with their entity types (components)
    Compatible with SystemModulesTab frontend component
    """
    # Get modules
    modules_query = select(Module)

    if organization_id:
        modules_query = modules_query.where(
            or_(
                Module.organization_id == uuid.UUID(organization_id),
                Module.organization_id.is_(None)
            )
        )

    modules_query = modules_query.order_by(Module.display_order, Module.module_name)

    modules_result = await db.execute(modules_query)
    modules = modules_result.scalars().all()

    # For each module, get its entity types (components)
    result = []
    for module in modules:
        entity_types_query = select(EntityType).where(
            EntityType.module_id == module.id
        ).order_by(EntityType.display_order)

        entity_types_result = await db.execute(entity_types_query)
        entity_types = entity_types_result.scalars().all()

        result.append({
            "id": str(module.id),
            "module_code": module.module_code,
            "module_name": module.module_name,
            "module_label": module.module_label,
            "description": module.description,
            "icon": module.icon,
            "color": module.color,
            "is_active": module.is_active,
            "is_system_module": module.is_system_module or False,
            "components": [
                {
                    "id": str(et.id),
                    "component_code": et.entity_type_code,
                    "component_name": et.entity_type_name,
                    "component_label": et.entity_type_label,
                    "description": et.description,
                    "icon": et.icon,
                    "is_active": et.is_active or True,
                    "display_order": et.display_order or 0,
                }
                for et in entity_types
            ]
        })

    return {"data": result}


# ==================== Entity Records ====================

@router.post("/entity-records")
async def create_entity_record(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new entity record. organization_id is resolved from the created_by user if not provided."""
    actor = _coerce_uuid(data.get("created_by"))

    org_id_raw = data.get("organization_id")
    if org_id_raw:
        org_id = uuid.UUID(str(org_id_raw))
    else:
        # Resolve from the actor's org_id
        from app.models.user import User
        user = await db.get(User, actor)
        if user and user.org_id:
            org_id = user.org_id
        else:
            # last-resort sentinel; harmless because no FK constraint enforces lookup here
            org_id = uuid.UUID("00000000-0000-0000-0000-000000000000")

    new_record = EntityRecord(
        entity_type=data["entity_type"],
        module_code=data.get("module_code", "core"),
        data=data.get("data", {}),
        organization_id=org_id,
        created_by=actor,
        last_modified_by=actor,
    )

    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)

    # Central write seam: automation rules + lead scoring + (future) AI hooks.
    from app.services.events import emit_write
    await emit_write(db, event="created", entity_type=new_record.entity_type,
                     record_id=new_record.id, data=new_record.data or {},
                     module_code=new_record.module_code, actor=actor)

    return new_record.to_dict()


@router.get("/entity-records")
async def list_entity_records(
    entity_type: Optional[str] = Query(None),
    module_code: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    db: AsyncSession = Depends(get_db),
):
    """List entity records with filtering"""
    query = select(EntityRecord).where(EntityRecord.is_deleted == 'N')

    if entity_type:
        query = query.where(EntityRecord.entity_type == entity_type)

    if module_code:
        query = query.where(EntityRecord.module_code == module_code)

    if organization_id:
        query = query.where(EntityRecord.organization_id == uuid.UUID(organization_id))

    query = query.order_by(EntityRecord.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    records = result.scalars().all()

    return {"data": [record.to_dict() for record in records]}


@router.get("/entity-analytics")
async def entity_analytics(
    entity_types: str = Query(..., description="Comma-separated entity_type codes"),
    organization_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated stats per entity type for dashboards — one call covers many
    entity types. Per type returns: count, summed amount, status breakdown,
    and a 6-month created-at trend (count + amount per month)."""
    from collections import defaultdict, OrderedDict

    types = [t.strip() for t in entity_types.split(",") if t.strip()]
    if not types:
        return {"data": {}}

    query = select(EntityRecord).where(
        EntityRecord.is_deleted == 'N',
        EntityRecord.entity_type.in_(types),
    )
    if organization_id:
        query = query.where(EntityRecord.organization_id == uuid.UUID(organization_id))

    result = await db.execute(query)
    records = result.scalars().all()

    # Build last-6-month buckets (YYYY-MM), oldest first.
    now = datetime.utcnow()
    months = []
    y, m = now.year, now.month
    for _ in range(6):
        months.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    months.reverse()
    month_set = set(months)

    def to_num(v):
        try:
            if v in (None, ""):
                return 0.0
            return float(str(v).replace(",", "").replace("$", "").strip())
        except Exception:
            return 0.0

    AMOUNT_KEYS = ("total_amount", "total", "amount", "value", "budget")
    STATUS_KEYS = ("status", "stage")

    stats = {
        t: {
            "count": 0,
            "amount": 0.0,
            "by_status": defaultdict(int),
            "monthly": OrderedDict((mo, {"count": 0, "amount": 0.0}) for mo in months),
        }
        for t in types
    }

    for r in records:
        s = stats.get(r.entity_type)
        if s is None:
            continue
        d = r.data if isinstance(r.data, dict) else {}
        s["count"] += 1
        amt = 0.0
        for k in AMOUNT_KEYS:
            if d.get(k) not in (None, ""):
                amt = to_num(d.get(k))
                break
        s["amount"] += amt
        st = None
        for k in STATUS_KEYS:
            if d.get(k):
                st = str(d[k])
                break
        s["by_status"][st or "Unspecified"] += 1
        if r.created_at:
            mo = f"{r.created_at.year:04d}-{r.created_at.month:02d}"
            if mo in month_set:
                s["monthly"][mo]["count"] += 1
                s["monthly"][mo]["amount"] += amt

    out = {
        t: {
            "count": s["count"],
            "amount": round(s["amount"], 2),
            "by_status": dict(s["by_status"]),
            "monthly": [{"month": mo, **vals} for mo, vals in s["monthly"].items()],
        }
        for t, s in stats.items()
    }
    return {"data": out}


@router.get("/module-stats")
async def module_stats(
    organization_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Per-module rollup for the control-room module table: total records,
    summed $ value, and last-activity timestamp — keyed by module_code."""
    from collections import defaultdict

    def to_num(v):
        try:
            return float(str(v).replace(",", "").replace("$", "").strip()) if v not in (None, "") else 0.0
        except Exception:
            return 0.0

    query = select(EntityRecord).where(EntityRecord.is_deleted == 'N')
    if organization_id:
        query = query.where(EntityRecord.organization_id == uuid.UUID(organization_id))
    result = await db.execute(query)
    records = result.scalars().all()

    agg = defaultdict(lambda: {"records": 0, "amount": 0.0, "last_activity": None})
    for r in records:
        mc = r.module_code or "unknown"
        a = agg[mc]
        a["records"] += 1
        d = r.data if isinstance(r.data, dict) else {}
        for k in ("total_amount", "total", "amount", "value"):
            if d.get(k) not in (None, ""):
                a["amount"] += to_num(d.get(k))
                break
        ts = r.last_modified_at or r.created_at
        if ts and (a["last_activity"] is None or ts > a["last_activity"]):
            a["last_activity"] = ts

    return {"data": {
        mc: {
            "records": v["records"],
            "amount": round(v["amount"], 2),
            "last_activity": v["last_activity"].isoformat() if v["last_activity"] else None,
        }
        for mc, v in agg.items()
    }}


@router.get("/action-items")
async def action_items(
    organization_id: Optional[str] = Query(None),
    soon_days: int = Query(60, description="Window (days) for 'expiring soon' rules"),
    db: AsyncSession = Depends(get_db),
):
    """Cross-module 'needs attention' feed — overdue, open, low, and expiring
    items rolled up for the control-room action center. Each rule scans one
    entity type and applies status/date logic; only non-empty groups return."""
    from datetime import date, timedelta

    # Rules: (key, label, entity_type, href, severity, predicate)
    # predicate(d, today) -> bool, given the record's data dict.
    def parse_date(v):
        try:
            return date.fromisoformat(str(v)[:10])
        except Exception:
            return None

    def to_num(v):
        try:
            return float(str(v).replace(",", "").replace("$", "").strip()) if v not in (None, "") else 0.0
        except Exception:
            return 0.0

    today = datetime.utcnow().date()
    soon = today + timedelta(days=soon_days)

    def overdue(date_field, done_statuses):
        def f(d):
            st = str(d.get("status", "")).lower()
            if any(x in st for x in done_statuses):
                return False
            dt = parse_date(d.get(date_field))
            return dt is not None and dt < today
        return f

    def status_in(values):
        vals = [v.lower() for v in values]
        return lambda d: str(d.get("status", "")).lower() in vals

    def expiring(date_field, dead_statuses):
        def f(d):
            st = str(d.get("status", "")).lower()
            if any(x in st for x in dead_statuses):
                return False
            dt = parse_date(d.get(date_field))
            return dt is not None and today <= dt <= soon
        return f

    RULES = [
        ("overdue_invoices", "Overdue invoices", "invoices", "/accounting/invoices", "high",
         overdue("due_date", ["paid", "cancel"]), True),
        ("overdue_bills", "Overdue bills", "bills", "/accounting/bills", "medium",
         overdue("due_date", ["paid", "cancel"]), True),
        ("open_ncrs", "Open non-conformances", "qms_nonconformances", "/qms/nonconformances", "high",
         status_in(["open", "under review"]), False),
        ("overdue_capa", "Overdue CAPA", "qms_corrective_actions", "/qms/corrective-actions", "high",
         overdue("due_date", ["closed"]), False),
        ("overdue_tasks", "Overdue tasks", "tasks", "/pm/tasks", "medium",
         overdue("due_date", ["done", "complete"]), False),
        ("low_stock", "Low / out-of-stock items", "stock_items", "/inventory/stock-items", "medium",
         status_in(["low stock", "out of stock"]), False),
        ("expiring_contracts", "Contracts expiring soon", "contracts", "/administration/contracts", "medium",
         expiring("end_date", ["expired", "terminat"]), True),
        ("expiring_licenses", "Licenses expiring soon", "licenses", "/administration/licenses", "medium",
         expiring("expires_at", ["expired", "cancel"]), False),
    ]

    types = list({r[2] for r in RULES})
    query = select(EntityRecord).where(
        EntityRecord.is_deleted == 'N',
        EntityRecord.entity_type.in_(types),
    )
    if organization_id:
        query = query.where(EntityRecord.organization_id == uuid.UUID(organization_id))
    result = await db.execute(query)
    records = result.scalars().all()

    by_type = {}
    for r in records:
        by_type.setdefault(r.entity_type, []).append(r.data if isinstance(r.data, dict) else {})

    items = []
    for key, label, et, href, severity, pred, with_amount in RULES:
        rows = [d for d in by_type.get(et, []) if pred(d)]
        if not rows:
            continue
        amount = 0.0
        if with_amount:
            for d in rows:
                for k in ("total", "amount", "value"):
                    if d.get(k) not in (None, ""):
                        amount += to_num(d.get(k))
                        break
        items.append({
            "key": key, "label": label, "count": len(rows),
            "amount": round(amount, 2) if with_amount else None,
            "severity": severity, "href": href,
        })

    sev_order = {"high": 0, "medium": 1, "low": 2}
    items.sort(key=lambda x: (sev_order.get(x["severity"], 3), -x["count"]))
    return {"data": items}


@router.get("/entity-records/{record_id}")
async def get_entity_record(record_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific entity record"""
    query = select(EntityRecord).where(
        EntityRecord.id == uuid.UUID(record_id),
        EntityRecord.is_deleted == 'N'
    )
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Entity record not found")

    return record.to_dict()


@router.put("/entity-records/{record_id}")
async def update_entity_record(record_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update an entity record"""
    query = select(EntityRecord).where(
        EntityRecord.id == uuid.UUID(record_id),
        EntityRecord.is_deleted == 'N'
    )
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Entity record not found")

    prev_data = dict(record.data or {})  # snapshot for 'changed' conditions

    # Update data field
    if "data" in data:
        record.data = data["data"]

    if "last_modified_by" in data:
        record.last_modified_by = uuid.UUID(data["last_modified_by"])

    record.last_modified_at = datetime.utcnow()

    await db.commit()
    await db.refresh(record)

    # Central write seam: automation rules + (future) AI hooks.
    from app.services.events import emit_write
    await emit_write(db, event="updated", entity_type=record.entity_type,
                     record_id=record.id, data=record.data or {}, prev_data=prev_data,
                     module_code=record.module_code,
                     actor=record.last_modified_by)

    return record.to_dict()


@router.delete("/entity-records/{record_id}")
async def delete_entity_record(
    record_id: str,
    deleted_by: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Delete an entity record (soft delete)"""
    query = select(EntityRecord).where(
        EntityRecord.id == uuid.UUID(record_id),
        EntityRecord.is_deleted == 'N'
    )
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Entity record not found")

    entity_type = record.entity_type
    module_code = record.module_code
    deleted_data = dict(record.data or {})

    record.is_deleted = 'Y'
    record.deleted_by = uuid.UUID(deleted_by)
    record.deleted_at = datetime.utcnow()

    await db.commit()

    # Central write seam: automation rules + (future) AI hooks.
    from app.services.events import emit_write
    await emit_write(db, event="deleted", entity_type=entity_type,
                     record_id=uuid.UUID(record_id), data=deleted_data,
                     module_code=module_code, actor=uuid.UUID(deleted_by))

    return {"message": "Entity record deleted successfully"}


# ==================== Custom Fields ====================

_SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _coerce_uuid(value, fallback: uuid.UUID = _SYSTEM_USER_ID) -> uuid.UUID:
    if not value:
        return fallback
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return fallback


@router.get("/custom-fields/definitions")
async def list_custom_field_definitions(
    entity_type: Optional[str] = Query(None),
    is_visible: Optional[bool] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    db: AsyncSession = Depends(get_db),
):
    """
    List all custom field definitions.
    Centralized in Core - canonical store shared by ALL modules.
    """
    query = select(CustomFieldDefinition).where(
        CustomFieldDefinition.deleted_flag == False  # noqa: E712
    )

    if entity_type:
        query = query.where(CustomFieldDefinition.entity_type == entity_type)

    if is_visible is not None:
        query = query.where(CustomFieldDefinition.is_visible == is_visible)

    query = query.order_by(CustomFieldDefinition.display_order).offset(skip).limit(limit)

    result = await db.execute(query)
    definitions = result.scalars().all()

    return {"data": [d.to_dict() for d in definitions]}


@router.get("/custom-fields/definitions/{field_id}")
async def get_custom_field_definition(field_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific custom field definition."""
    query = select(CustomFieldDefinition).where(
        CustomFieldDefinition.id == uuid.UUID(field_id),
        CustomFieldDefinition.deleted_flag == False,  # noqa: E712
    )
    result = await db.execute(query)
    definition = result.scalar_one_or_none()

    if not definition:
        raise HTTPException(status_code=404, detail="Custom field not found")

    return definition.to_dict()


@router.post("/custom-fields/definitions")
async def create_custom_field_definition(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new custom field definition."""
    actor = _coerce_uuid(data.get("created_by") or data.get("last_modified_by"))

    new_field = CustomFieldDefinition(
        field_name=data.get("field_name"),
        field_label=data.get("field_label"),
        field_type=data.get("field_type"),
        entity_type=data.get("entity_type"),
        is_required=data.get("is_required", False),
        is_unique=data.get("is_unique", False),
        is_searchable=data.get("is_searchable", True),
        is_visible=data.get("is_visible", True),
        default_value=data.get("default_value"),
        help_text=data.get("help_text"),
        picklist_values=data.get("picklist_values"),
        list_code=data.get("list_code"),
        validation_type=data.get("validation_type"),
        validation_rule=data.get("validation_rule"),
        display_order=data.get("display_order", 0),
        field_group=data.get("field_group"),
        is_encrypted=data.get("is_encrypted", False),
        is_pii=data.get("is_pii", False),
        is_sensitive=data.get("is_sensitive", False),
        created_by=actor,
        last_modified_by=actor,
    )

    db.add(new_field)
    await db.commit()
    await db.refresh(new_field)

    return new_field.to_dict()


@router.put("/custom-fields/definitions/{field_id}")
async def update_custom_field_definition(field_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a custom field definition."""
    query = select(CustomFieldDefinition).where(
        CustomFieldDefinition.id == uuid.UUID(field_id),
        CustomFieldDefinition.deleted_flag == False,  # noqa: E712
    )
    result = await db.execute(query)
    field = result.scalar_one_or_none()

    if not field:
        raise HTTPException(status_code=404, detail="Custom field not found")

    immutable = {"id", "created_date", "created_by", "deleted_flag"}
    for key, value in data.items():
        if key in immutable or not hasattr(field, key):
            continue
        if key == "last_modified_by" and value:
            setattr(field, key, uuid.UUID(str(value)))
        else:
            setattr(field, key, value)

    field.last_modified_date = datetime.utcnow()
    if not field.last_modified_by:
        field.last_modified_by = _SYSTEM_USER_ID

    await db.commit()
    await db.refresh(field)

    return field.to_dict()


@router.delete("/custom-fields/definitions/{field_id}")
async def delete_custom_field_definition(
    field_id: str,
    deleted_by: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a custom field definition."""
    query = select(CustomFieldDefinition).where(
        CustomFieldDefinition.id == uuid.UUID(field_id),
        CustomFieldDefinition.deleted_flag == False,  # noqa: E712
    )
    result = await db.execute(query)
    field = result.scalar_one_or_none()

    if not field:
        raise HTTPException(status_code=404, detail="Custom field not found")

    field.deleted_flag = True
    field.last_modified_by = _coerce_uuid(deleted_by, fallback=field.last_modified_by or _SYSTEM_USER_ID)
    field.last_modified_date = datetime.utcnow()

    await db.commit()

    return {"message": "Custom field deleted successfully"}


@router.post("/custom-fields/auto-generate")
async def auto_generate_fields(
    entity_type: Optional[str] = Query(None, description="Limit to a single entity_type; omit to seed all"),
    db: AsyncSession = Depends(get_db),
):
    """
    Auto-derive custom field definitions from the live PostgreSQL schema.
    For each entity type (or just the requested one), find its table and
    create field definitions for every non-system column. Idempotent —
    skips fields that already exist.
    """
    SKIP_COLS = {
        "id", "uuid",
        "created_at", "created_by", "created_date",
        "updated_at", "updated_by", "last_modified_at", "last_modified_by", "last_modified_date",
        "deleted_at", "deleted_by", "deleted_date", "deleted_flag", "is_deleted",
        "org_id", "organization_id", "tenant_id",
        "search_vector", "search_index",
    }
    AMOUNT_HINTS = ("amount", "cost", "price", "fee", "total", "subtotal", "tax",
                    "discount", "balance", "revenue", "salary", "value")
    LONG_HINTS = ("description", "note", "summary", "comment", "remarks", "body", "content", "address")

    def derive_field_type(name: str, pg_type: str) -> str:
        n = name.lower()
        t = pg_type.lower()
        if "email" in n: return "email"
        if "phone" in n or "mobile" in n or "fax" in n: return "phone"
        if "url" in n or "website" in n: return "url"
        if t == "boolean": return "boolean"
        if t == "date": return "date"
        if "timestamp" in t: return "datetime"
        if t == "uuid": return "text"
        if t in ("integer", "bigint", "smallint"): return "number"
        if t in ("numeric", "decimal", "real", "double precision"):
            if any(k in n for k in AMOUNT_HINTS): return "currency"
            if "percent" in n or "rate" in n: return "percentage"
            return "number"
        if t == "text": return "textarea"
        if t in ("character varying", "varchar", "character", "char"):
            if any(k in n for k in LONG_HINTS): return "textarea"
            return "text"
        if t in ("json", "jsonb"): return "textarea"
        return "text"

    async def find_table(module_code: str, component_code: str) -> Optional[str]:
        stripped = component_code
        for prefix in (f"{module_code}_", "marketing_", "sales_", "accounting_", "production_", "rd_", "hr_"):
            if stripped.startswith(prefix):
                stripped = stripped[len(prefix):]
                break
        candidates = [
            component_code,
            f"{module_code}_{component_code}",
            f"crm_{component_code}",
            f"hr_{component_code}",
            f"core_{component_code}",
            stripped,
            f"{stripped}s",
            f"{stripped}_records",
            f"{stripped}_runs",
        ]
        seen = set()
        for c in candidates:
            if c in seen:
                continue
            seen.add(c)
            row = await db.execute(text(
                "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=:t AND table_type='BASE TABLE'"
            ), {"t": c})
            if row.first():
                return c
        return None

    # Pull list of entity types to process
    if entity_type:
        ent_query = await db.execute(text(
            """
            SELECT cc.component_code, cm.module_code
            FROM custom_components cc
            JOIN custom_modules cm ON cm.id = cc.module_id
            WHERE cc.component_code = :ec AND cc.is_active = true
            """
        ), {"ec": entity_type})
    else:
        ent_query = await db.execute(text(
            """
            SELECT cc.component_code, cm.module_code
            FROM custom_components cc
            JOIN custom_modules cm ON cm.id = cc.module_id
            WHERE cc.is_active = true
            ORDER BY cm.module_code, cc.component_code
            """
        ))

    entities = ent_query.fetchall()

    total_created = 0
    total_skipped = 0
    no_table = []
    per_entity = []

    for ec, mc in entities:
        table = await find_table(mc, ec)
        if not table:
            no_table.append({"module": mc, "entity_type": ec})
            continue

        cols_res = await db.execute(text(
            """
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name=:t
            ORDER BY ordinal_position
            """
        ), {"t": table})
        cols = cols_res.fetchall()

        created_for_entity = 0
        skipped_for_entity = 0
        display_order = 0
        for cname, dtype, nullable in cols:
            if cname in SKIP_COLS:
                continue
            existing = (await db.execute(text(
                "SELECT 1 FROM custom_field_definitions WHERE entity_type=:e AND field_name=:f AND deleted_flag=false"
            ), {"e": ec, "f": cname})).first()
            if existing:
                skipped_for_entity += 1
                continue

            ftype = derive_field_type(cname, dtype)
            label = cname.replace("_", " ").strip().title()
            is_required = (nullable == "NO") and ftype in ("text", "email")

            await db.execute(text(
                """
                INSERT INTO custom_field_definitions
                  (id, field_name, field_label, field_type, entity_type,
                   is_required, is_unique, is_searchable, is_visible,
                   display_order, created_by, last_modified_by, deleted_flag)
                VALUES (gen_random_uuid(), :fn, :fl, :ft, :et, :req, false, true, true, :ord, :uid, :uid, false)
                """
            ), {
                "fn": cname, "fl": label, "ft": ftype, "et": ec,
                "req": is_required, "ord": display_order, "uid": _SYSTEM_USER_ID,
            })
            created_for_entity += 1
            display_order += 1

        total_created += created_for_entity
        total_skipped += skipped_for_entity
        if created_for_entity > 0:
            per_entity.append({
                "module": mc, "entity_type": ec, "table": table,
                "created": created_for_entity, "already": skipped_for_entity,
            })

    await db.commit()

    return {
        "total_entity_types": len(entities),
        "fields_created": total_created,
        "fields_already_present": total_skipped,
        "no_table": no_table,
        "per_entity": per_entity,
    }


@router.get("/custom-fields/values/{entity_type}/{entity_id}")
async def get_custom_field_values(
    entity_type: str,
    entity_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get custom field values for an entity."""
    query = select(CustomFieldValue).where(
        CustomFieldValue.entity_type == entity_type,
        CustomFieldValue.entity_id == uuid.UUID(entity_id),
    )

    result = await db.execute(query)
    values = result.scalars().all()

    return {
        "data": [
            {
                "id": str(v.id),
                "field_definition_id": str(v.field_definition_id),
                "entity_type": v.entity_type,
                "entity_id": str(v.entity_id),
                "value_text": v.value_text,
                "value_number": str(v.value_number) if v.value_number is not None else None,
                "value_date": v.value_date.isoformat() if v.value_date else None,
                "value_datetime": v.value_datetime.isoformat() if v.value_datetime else None,
                "value_boolean": v.value_boolean,
                "value_json": v.value_json,
            }
            for v in values
        ]
    }


@router.post("/custom-fields/values/{entity_type}/{entity_id}")
async def set_custom_field_value(
    entity_type: str,
    entity_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    """Create or update a custom field value for an entity."""
    actor = _coerce_uuid(data.get("created_by") or data.get("last_modified_by"))

    query = select(CustomFieldValue).where(
        CustomFieldValue.field_definition_id == uuid.UUID(data["field_definition_id"]),
        CustomFieldValue.entity_type == entity_type,
        CustomFieldValue.entity_id == uuid.UUID(entity_id),
    )
    result = await db.execute(query)
    existing_value = result.scalar_one_or_none()

    if existing_value:
        for key in ("value_text", "value_number", "value_date", "value_datetime", "value_boolean", "value_json"):
            if key in data:
                setattr(existing_value, key, data[key])

        existing_value.last_modified_by = actor
        existing_value.last_modified_date = datetime.utcnow()

        await db.commit()
        await db.refresh(existing_value)

        return {
            "id": str(existing_value.id),
            "field_definition_id": str(existing_value.field_definition_id),
            "entity_type": existing_value.entity_type,
            "entity_id": str(existing_value.entity_id),
        }

    new_value = CustomFieldValue(
        field_definition_id=uuid.UUID(data["field_definition_id"]),
        entity_type=entity_type,
        entity_id=uuid.UUID(entity_id),
        value_text=data.get("value_text"),
        value_number=data.get("value_number"),
        value_date=data.get("value_date"),
        value_datetime=data.get("value_datetime"),
        value_boolean=data.get("value_boolean"),
        value_json=data.get("value_json"),
        created_by=actor,
        last_modified_by=actor,
    )

    db.add(new_value)
    await db.commit()
    await db.refresh(new_value)

    return {
        "id": str(new_value.id),
        "field_definition_id": str(new_value.field_definition_id),
        "entity_type": new_value.entity_type,
        "entity_id": str(new_value.entity_id),
    }
