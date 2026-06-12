"""
Campaign attribution — ties leads and won revenue back to the campaign that
sourced them, so you can see which campaigns actually drive deals.
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_NUM = r"^-?[0-9]+(\.[0-9]+)?$"


async def attribution(db: AsyncSession) -> dict:
    leads = {r[0]: r[1] for r in (await db.execute(text("""
        SELECT coalesce(nullif(trim(data->>'campaign'), ''), 'Direct / Unknown') campaign, count(*)
        FROM entity_records WHERE entity_type='leads' AND is_deleted='N' GROUP BY 1
    """))).all()}

    won = {r[0]: (r[1], float(r[2])) for r in (await db.execute(text(f"""
        SELECT coalesce(nullif(trim(data->>'campaign'), ''), 'Direct / Unknown') campaign,
               count(*),
               coalesce(sum(CASE WHEN (data->>'amount') ~ '{_NUM}' THEN (data->>'amount')::numeric END), 0)
        FROM entity_records
        WHERE entity_type='opportunities' AND is_deleted='N' AND data->>'stage' = 'Closed Won'
        GROUP BY 1
    """))).all()}

    rows = []
    for c in sorted(set(leads) | set(won)):
        wn, wv = won.get(c, (0, 0.0))
        ld = leads.get(c, 0)
        rows.append({
            "campaign": c, "leads": ld, "won_deals": wn, "won_revenue": round(wv, 2),
            "revenue_per_lead": round(wv / ld, 2) if ld else 0.0,
        })
    rows.sort(key=lambda r: (r["won_revenue"], r["leads"]), reverse=True)
    return {
        "campaigns": rows,
        "total_leads": sum(r["leads"] for r in rows),
        "total_won_revenue": round(sum(r["won_revenue"] for r in rows), 2),
    }
