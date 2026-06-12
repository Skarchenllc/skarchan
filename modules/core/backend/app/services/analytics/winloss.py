"""
Win/loss reason analytics — the "why" behind the win rate. Aggregates closed
opportunities by win_reason / loss_reason with deal counts and value.
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_NUM = r"^-?[0-9]+(\.[0-9]+)?$"


async def _by_reason(db, stage: str, field: str) -> list[dict]:
    rows = (await db.execute(text(f"""
        SELECT coalesce(nullif(trim(data->>'{field}'), ''), 'Unspecified') reason,
               count(*) cnt,
               coalesce(sum(CASE WHEN (data->>'amount') ~ '{_NUM}' THEN (data->>'amount')::numeric END), 0) value
        FROM entity_records
        WHERE entity_type='opportunities' AND is_deleted='N' AND data->>'stage' = :stage
        GROUP BY 1 ORDER BY cnt DESC, value DESC
    """).bindparams(stage=stage))).all()
    return [{"reason": r[0], "count": r[1], "value": float(r[2])} for r in rows]


async def win_loss(db: AsyncSession) -> dict:
    won = await _by_reason(db, "Closed Won", "win_reason")
    lost = await _by_reason(db, "Closed Lost", "loss_reason")
    won_n = sum(x["count"] for x in won)
    lost_n = sum(x["count"] for x in lost)
    return {
        "won": won, "lost": lost,
        "won_count": won_n, "lost_count": lost_n,
        "won_value": round(sum(x["value"] for x in won), 2),
        "lost_value": round(sum(x["value"] for x in lost), 2),
        "win_rate": round(100.0 * won_n / (won_n + lost_n), 1) if (won_n + lost_n) else 0.0,
    }
