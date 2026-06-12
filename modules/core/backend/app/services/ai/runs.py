"""AI run log — every capability invocation is metered here for audit & cost.

Stored as entity_records of type 'ai_runs'.
"""
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

RUNS_ENTITY = "ai_runs"
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")


async def log_run(db: AsyncSession, *, capability_id: str, module_code: str, entity_type: str,
                  model: str, status: str, usage: dict, latency_ms: int,
                  actor: uuid.UUID | None = None, org: uuid.UUID | None = None,
                  error: str | None = None) -> str:
    rec = EntityRecord(
        entity_type=RUNS_ENTITY,
        module_code="core",
        data={
            "capability_id": capability_id,
            "module_code": module_code,
            "entity_type": entity_type,
            "model": model,
            "status": status,           # success | error
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "cost_usd": usage.get("cost_usd", 0),
            "latency_ms": latency_ms,
            "error": error,
        },
        organization_id=org or DEFAULT_ORG_ID,
        created_by=actor or SYSTEM_USER_ID,
        last_modified_by=actor or SYSTEM_USER_ID,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return str(rec.id)


async def list_runs(db: AsyncSession, limit: int = 100, module_code: str | None = None) -> list[dict]:
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == RUNS_ENTITY, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc())
         .limit(limit))
    rows = (await db.execute(q)).scalars().all()
    out = []
    for r in rows:
        d = r.data or {}
        if module_code and d.get("module_code") != module_code:
            continue
        out.append({"id": str(r.id), "created_at": r.created_at.isoformat() if r.created_at else None, **d})
    return out


async def latest_run(db: AsyncSession) -> dict | None:
    """The single most recent run's data — used to surface the current API health."""
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == RUNS_ENTITY, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc()).limit(1))
    r = (await db.execute(q)).scalar_one_or_none()
    return (r.data or {}) if r else None


async def month_spend(db: AsyncSession) -> float:
    """Total USD spent on successful runs since the start of the current UTC month."""
    now = datetime.utcnow()
    start = datetime(now.year, now.month, 1)
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == RUNS_ENTITY, EntityRecord.is_deleted == "N",
                EntityRecord.created_at >= start))
    rows = (await db.execute(q)).scalars().all()
    return round(sum(float((r.data or {}).get("cost_usd") or 0) for r in rows), 6)


async def usage_summary(db: AsyncSession) -> dict:
    rows = await list_runs(db, limit=2000)
    total_cost = sum(float(r.get("cost_usd") or 0) for r in rows)
    total_in = sum(int(r.get("input_tokens") or 0) for r in rows)
    total_out = sum(int(r.get("output_tokens") or 0) for r in rows)
    success = sum(1 for r in rows if r.get("status") == "success")
    errors = len(rows) - success
    lat = [int(r.get("latency_ms") or 0) for r in rows if r.get("latency_ms")]
    avg_latency_ms = round(sum(lat) / len(lat)) if lat else 0

    def _bump(bucket: dict, key: str, r: dict, *, tokens: bool = False):
        agg = bucket.setdefault(key or "unknown", {"runs": 0, "cost_usd": 0.0, "tokens": 0, "errors": 0})
        agg["runs"] += 1
        agg["cost_usd"] = round(agg["cost_usd"] + float(r.get("cost_usd") or 0), 6)
        agg["tokens"] += int(r.get("input_tokens") or 0) + int(r.get("output_tokens") or 0)
        if r.get("status") != "success":
            agg["errors"] += 1

    by_module: dict[str, dict] = {}
    by_capability: dict[str, dict] = {}
    by_model: dict[str, dict] = {}
    by_day: dict[str, dict] = {}
    for r in rows:
        _bump(by_module, r.get("module_code"), r)
        _bump(by_capability, r.get("capability_id"), r)
        _bump(by_model, r.get("model"), r)
        day = (r.get("created_at") or "")[:10]
        if day:
            d = by_day.setdefault(day, {"runs": 0, "cost_usd": 0.0})
            d["runs"] += 1
            d["cost_usd"] = round(d["cost_usd"] + float(r.get("cost_usd") or 0), 6)

    def _ranked(bucket: dict) -> list[dict]:
        return [{"key": k, **v} for k, v in sorted(bucket.items(), key=lambda kv: kv[1]["cost_usd"], reverse=True)]

    # Last 14 calendar days, oldest→newest, zero-filled so the chart has no gaps.
    today = datetime.utcnow().date()
    daily = []
    for i in range(13, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        d = by_day.get(day, {"runs": 0, "cost_usd": 0.0})
        daily.append({"date": day, "runs": d["runs"], "cost_usd": round(d["cost_usd"], 6)})

    return {
        "runs": len(rows),
        "success": success,
        "errors": errors,
        "avg_latency_ms": avg_latency_ms,
        "input_tokens": total_in,
        "output_tokens": total_out,
        "cost_usd": round(total_cost, 4),
        "month_spend_usd": await month_spend(db),
        "by_module": _ranked(by_module),
        "by_capability": _ranked(by_capability),
        "by_model": _ranked(by_model),
        "daily": daily,
    }
