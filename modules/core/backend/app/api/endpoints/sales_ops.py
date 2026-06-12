"""
Sales execution API — line-item pricing for quotes & orders.

Totals are computed server-side so the document is authoritative regardless of
what the client sends.
"""
import uuid
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entity_record import EntityRecord
from app.services.sales.pricing import compute_totals

router = APIRouter()

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")
_DOC_TYPES = ("quotes", "orders")
_MONEY = lambda v: "${:,.2f}".format(float(v or 0))


async def _load(db, record_id, types):
    try:
        rid = uuid.UUID(record_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid id")
    rec = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == rid, EntityRecord.is_deleted == "N")
    )).scalar_one_or_none()
    if rec is None or rec.entity_type not in types:
        raise HTTPException(status_code=404, detail="document not found")
    return rec


@router.post("/price")
async def price(payload: dict):
    """Stateless preview: given line_items, return computed totals."""
    return compute_totals(payload.get("line_items"))


@router.post("/document/{record_id}/recalc")
async def recalc_document(record_id: str, payload: dict | None = None, db: AsyncSession = Depends(get_db)):
    """
    Set a quote/order's line_items, recompute its totals, and persist them.
    Body: { "line_items": [ {product_id?, name, sku?, quantity, unit_price, discount_pct?, tax_rate?}, ... ] }
    """
    try:
        rid = uuid.UUID(record_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid record id")
    rec = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == rid, EntityRecord.is_deleted == "N")
    )).scalar_one_or_none()
    if rec is None:
        raise HTTPException(status_code=404, detail="document not found")
    if rec.entity_type not in _DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"{rec.entity_type} is not a quote or order")

    payload = payload or {}
    line_items = payload.get("line_items", (rec.data or {}).get("line_items", []))
    totals = compute_totals(line_items)
    rec.data = {**(rec.data or {}), **totals}
    rec.last_modified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(rec)
    return rec.to_dict()


def _carry(src: dict) -> dict:
    """Fields a quote/order hands down to the next document."""
    return {k: src.get(k) for k in ("customer_name", "customer_id", "line_items",
            "item_count", "amount", "discount_amount", "tax", "total_amount")}


@router.post("/quotes/{quote_id}/convert")
async def convert_to_order(quote_id: str, db: AsyncSession = Depends(get_db)):
    """Create an Order from a Quote, carrying its line items + totals."""
    q = await _load(db, quote_id, ("quotes",))
    if q.data.get("converted_order"):
        raise HTTPException(status_code=409, detail=f"already converted to {q.data['converted_order']}")
    num = (q.data.get("quote_number") or "QUO").replace("QUO", "ORD") + "-C"
    order = EntityRecord(entity_type="orders", module_code="sales", data={
        **_carry(q.data), "name": num, "order_number": num,
        "status": "Pending", "payment_status": "Unpaid",
        "order_date": date.today().isoformat(), "source_quote": q.data.get("quote_number"),
    }, organization_id=q.organization_id, created_by=SYS_USER, last_modified_by=SYS_USER)
    db.add(order)
    q.data = {**q.data, "status": "Accepted", "converted_order": num}
    q.last_modified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(order)
    return {"ok": True, "order_id": str(order.id), "order_number": num}


@router.post("/orders/{order_id}/invoice")
async def order_to_invoice(order_id: str, db: AsyncSession = Depends(get_db)):
    """Create an Invoice (accounting) from an Order."""
    o = await _load(db, order_id, ("orders",))
    if o.data.get("invoice_number"):
        raise HTTPException(status_code=409, detail=f"already invoiced as {o.data['invoice_number']}")
    num = (o.data.get("order_number") or "ORD").replace("ORD", "INV")
    inv = EntityRecord(entity_type="invoices", module_code="accounting", data={
        "name": num, "invoice_number": num,
        "customer_name": o.data.get("customer_name"), "customer_id": o.data.get("customer_id"),
        "line_items": o.data.get("line_items"),
        "amount": o.data.get("amount"), "tax": o.data.get("tax"), "total": o.data.get("total_amount"),
        "total_amount": o.data.get("total_amount"), "status": "Sent",
        "issue_date": date.today().isoformat(), "source_order": o.data.get("order_number"),
    }, organization_id=o.organization_id, created_by=SYS_USER, last_modified_by=SYS_USER)
    db.add(inv)
    o.data = {**o.data, "invoice_number": num}
    o.last_modified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(inv)
    return {"ok": True, "invoice_id": str(inv.id), "invoice_number": num}


@router.get("/document/{record_id}/print", response_class=HTMLResponse)
async def print_document(record_id: str, db: AsyncSession = Depends(get_db)):
    """A print-friendly HTML view of a quote/order (browser → Print → PDF)."""
    rec = await _load(db, record_id, _DOC_TYPES)
    d = rec.data or {}
    num = d.get("quote_number") or d.get("order_number") or str(rec.id)[:8]
    rows = "".join(
        f"<tr><td>{li.get('name','')}</td><td>{li.get('sku','') or ''}</td>"
        f"<td style='text-align:right'>{li.get('quantity',0)}</td>"
        f"<td style='text-align:right'>{_MONEY(li.get('unit_price'))}</td>"
        f"<td style='text-align:right'>{li.get('discount_pct',0)}%</td>"
        f"<td style='text-align:right'>{_MONEY(li.get('line_total'))}</td></tr>"
        for li in (d.get("line_items") or [])
    ) or "<tr><td colspan='6' style='color:#888'>No line items</td></tr>"
    html = f"""<!doctype html><html><head><meta charset=utf-8><title>{num}</title>
    <style>body{{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#111}}
    h1{{font-size:22px}} table{{width:100%;border-collapse:collapse;margin-top:16px}}
    th,td{{padding:6px 8px;border-bottom:1px solid #eee;font-size:14px;text-align:left}}
    .tot{{text-align:right;margin-top:12px;font-size:14px}} .tot b{{font-size:16px}}
    @media print{{button{{display:none}}}}</style></head><body>
    <h1>{ 'Quote' if rec.entity_type=='quotes' else 'Order' } {num}</h1>
    <div>{d.get('customer_name','')} · {d.get('status','')}</div>
    <table><thead><tr><th>Item</th><th>SKU</th><th style='text-align:right'>Qty</th>
    <th style='text-align:right'>Price</th><th style='text-align:right'>Disc</th><th style='text-align:right'>Total</th></tr></thead>
    <tbody>{rows}</tbody></table>
    <div class=tot>Subtotal: {_MONEY(d.get('amount'))}<br>Discount: −{_MONEY(d.get('discount_amount'))}<br>
    Tax: {_MONEY(d.get('tax'))}<br><b>Total: {_MONEY(d.get('total_amount'))}</b></div>
    <button onclick='window.print()' style='margin-top:20px;padding:8px 16px'>Print / Save PDF</button>
    </body></html>"""
    return HTMLResponse(content=html)
