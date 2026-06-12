"""
Lifecycle funnel — one authoritative, server-side rollup spanning Marketing and
Sales: Leads → MQL (engaged grade) → SQL (qualified) → Opportunities → Won, with
conversion rates and the revenue that now flows through real quote/order totals.

Computed with SQL aggregates over entity_records so the client makes one call and
never pulls thousands of rows. Numeric jsonb fields are summed with a regex guard
so a stray non-numeric value can never break the query.
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# safe numeric cast for a jsonb text field
_NUM = r"^-?[0-9]+(\.[0-9]+)?$"


def _pct(n, d):
    return round(100.0 * n / d, 1) if d else 0.0


async def lifecycle_funnel(db: AsyncSession) -> dict:
    leads = (await db.execute(text("""
        SELECT count(*) total,
               count(*) FILTER (WHERE data->>'grade' = 'Cold') cold,
               count(*) FILTER (WHERE data->>'grade' = 'Warm') warm,
               count(*) FILTER (WHERE data->>'grade' = 'Hot') hot,
               count(*) FILTER (WHERE data->>'status' IN ('Qualified','Converted')) qualified,
               count(*) FILTER (WHERE data->>'grade' IN ('Warm','Hot')
                                   OR data->>'status' IN ('Qualified','Converted')) mql
        FROM entity_records WHERE entity_type='leads' AND is_deleted='N'
    """))).first()

    opp = (await db.execute(text(f"""
        SELECT count(*) total,
               count(*) FILTER (WHERE data->>'stage' = 'Closed Won') won,
               count(*) FILTER (WHERE data->>'stage' = 'Closed Lost') lost,
               count(*) FILTER (WHERE data->>'stage' NOT IN ('Closed Won','Closed Lost')) open,
               coalesce(sum(CASE WHEN data->>'stage' NOT IN ('Closed Won','Closed Lost')
                            AND (data->>'amount') ~ '{_NUM}' THEN (data->>'amount')::numeric END),0) open_value,
               coalesce(sum(CASE WHEN data->>'stage' = 'Closed Won'
                            AND (data->>'amount') ~ '{_NUM}' THEN (data->>'amount')::numeric END),0) won_value
        FROM entity_records WHERE entity_type='opportunities' AND is_deleted='N'
    """))).first()

    docs = {r[0]: (r[1], float(r[2])) for r in (await db.execute(text(f"""
        SELECT entity_type, count(*),
               coalesce(sum(CASE WHEN (data->>'total_amount') ~ '{_NUM}' THEN (data->>'total_amount')::numeric END),0)
        FROM entity_records WHERE entity_type IN ('quotes','orders') AND is_deleted='N' GROUP BY 1
    """))).all()}
    quotes_n, quotes_v = docs.get("quotes", (0, 0.0))
    orders_n, orders_v = docs.get("orders", (0, 0.0))

    em = (await db.execute(text("""
        SELECT count(*) total,
               count(*) FILTER (WHERE data->>'status' IN ('Opened','Clicked')) opened,
               count(*) FILTER (WHERE data->>'status' = 'Clicked') clicked
        FROM entity_records WHERE entity_type='email_sends' AND is_deleted='N'
    """))).first()

    extra = (await db.execute(text("""
        SELECT (SELECT count(*) FROM entity_records WHERE entity_type='form_submissions' AND is_deleted='N') submissions,
               (SELECT count(*) FROM entity_records WHERE entity_type='journey_enrollments' AND data->>'status'='Active' AND is_deleted='N') active_enr,
               (SELECT count(*) FROM entity_records WHERE entity_type='journey_enrollments' AND data->>'status'='Completed' AND is_deleted='N') done_enr
    """))).first()

    total_leads = leads.total or 0
    mql = leads.mql or 0          # grade Warm/Hot OR qualified — superset of SQL
    sql_q = leads.qualified or 0
    opp_total = opp.total or 0
    won = opp.won or 0

    stages = [
        {"stage": "Leads", "count": total_leads, "value": None},
        {"stage": "MQL (engaged)", "count": mql, "value": None},
        {"stage": "SQL (Qualified)", "count": sql_q, "value": None},
        {"stage": "Opportunities", "count": opp_total, "value": float(opp.open_value)},
        {"stage": "Won", "count": won, "value": float(opp.won_value)},
    ]
    # conversion rate from previous stage
    for i, s in enumerate(stages):
        s["conv_from_prev"] = 100.0 if i == 0 else _pct(s["count"], stages[i - 1]["count"])
        s["conv_from_top"] = _pct(s["count"], total_leads)

    return {
        "lifecycle": stages,
        "marketing": {
            "leads": total_leads, "cold": leads.cold or 0, "warm": leads.warm or 0, "hot": leads.hot or 0,
            "mql": mql, "qualified": sql_q,
            "lead_to_mql_pct": _pct(mql, total_leads), "lead_to_sql_pct": _pct(sql_q, total_leads),
            "email_sends": em.total or 0, "email_opened": em.opened or 0, "email_clicked": em.clicked or 0,
            "open_rate": _pct(em.opened or 0, em.total or 0), "click_rate": _pct(em.clicked or 0, em.total or 0),
            "form_submissions": extra.submissions or 0,
            "journeys_active": extra.active_enr or 0, "journeys_completed": extra.done_enr or 0,
        },
        "sales": {
            "opportunities": opp_total, "open": opp.open or 0, "won": won, "lost": opp.lost or 0,
            "open_pipeline": float(opp.open_value), "won_revenue": float(opp.won_value),
            "win_rate": _pct(won, won + (opp.lost or 0)),
            "avg_won_deal": round(float(opp.won_value) / won, 2) if won else 0.0,
            "quotes": quotes_n, "quotes_value": quotes_v, "orders": orders_n, "orders_value": orders_v,
        },
        "conversions": {
            "lead_to_won_pct": _pct(won, total_leads),
            "sql_to_won_pct": _pct(won, sql_q),
        },
    }
