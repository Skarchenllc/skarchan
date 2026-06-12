"""
Funnel history — persist a daily snapshot of the lifecycle funnel so Insights can
show trends (week-over-week conversion / revenue movement), not just a live shot.

A snapshot is one `funnel_snapshots` record, idempotent per day (upsert by
snapshot_date), written by the background scheduler (and on demand).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord
from app.services.analytics.funnel import lifecycle_funnel

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")
ORG_DEFAULT = uuid.UUID("00000000-0000-0000-0000-000000000000")


def _flatten(f: dict, date_str: str) -> dict:
    m, s, c = f["marketing"], f["sales"], f["conversions"]
    return {
        "name": f"Funnel {date_str}", "snapshot_date": date_str,
        "leads": m["leads"], "mql": m["mql"], "sql": m["qualified"],
        "opportunities": s["opportunities"], "won": s["won"], "lost": s["lost"],
        "open_pipeline": s["open_pipeline"], "won_revenue": s["won_revenue"], "win_rate": s["win_rate"],
        "quotes_value": s["quotes_value"], "orders_value": s["orders_value"],
        "lead_to_won_pct": c["lead_to_won_pct"],
        "open_rate": m["open_rate"], "click_rate": m["click_rate"],
        "form_submissions": m["form_submissions"],
    }


async def take_snapshot(db: AsyncSession, date_str: str | None = None) -> dict:
    """Compute the funnel and upsert today's (or `date_str`'s) snapshot."""
    f = await lifecycle_funnel(db)
    if date_str is None:
        date_str = datetime.utcnow().date().isoformat()
    data = _flatten(f, date_str)
    existing = (await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "funnel_snapshots", EntityRecord.is_deleted == "N",
        ).where(text("data->>'snapshot_date' = :d")).params(d=date_str)
    )).scalars().first()
    if existing is not None:
        existing.data = data
        existing.last_modified_at = datetime.utcnow()
    else:
        db.add(EntityRecord(
            entity_type="funnel_snapshots", module_code="analytics", data=data,
            organization_id=ORG_DEFAULT, created_by=SYS_USER, last_modified_by=SYS_USER,
        ))
    await db.commit()
    return data


def _conv(n, d) -> float:
    return round(100.0 * (n or 0) / d, 1) if d else 0.0


def _with_conversions(snap: dict) -> dict:
    """Derive stage-to-stage conversion rates from the stored stage counts."""
    return {
        **snap,
        "conv_lead_mql": _conv(snap.get("mql"), snap.get("leads")),
        "conv_mql_sql": _conv(snap.get("sql"), snap.get("mql")),
        "conv_sql_won": _conv(snap.get("won"), snap.get("sql")),
    }


async def get_trend(db: AsyncSession, days: int = 30) -> list[dict]:
    """Return the last `days` daily snapshots (oldest → newest), each enriched
    with derived stage-to-stage conversion rates."""
    rows = (await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "funnel_snapshots", EntityRecord.is_deleted == "N",
        ).order_by(text("data->>'snapshot_date'"))
    )).scalars().all()
    series = [_with_conversions(r.data) for r in rows]
    return series[-days:] if days and len(series) > days else series
