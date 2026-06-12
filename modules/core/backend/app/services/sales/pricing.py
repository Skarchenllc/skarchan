"""
Line-item pricing — the single, authoritative totals calculator for quotes and
orders. Each line: quantity × unit_price, less a per-line discount %, plus a
per-line tax %. The document rolls up subtotal / discount / tax / grand total.
"""
from __future__ import annotations


def _f(v) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def compute_totals(line_items: list[dict] | None) -> dict:
    items = []
    subtotal = discount = tax = 0.0
    for li in (line_items or []):
        qty = _f(li.get("quantity"))
        price = _f(li.get("unit_price"))
        disc_pct = _f(li.get("discount_pct"))
        tax_pct = _f(li.get("tax_rate"))
        gross = qty * price
        d = gross * disc_pct / 100.0
        net = gross - d
        t = net * tax_pct / 100.0
        total = net + t
        items.append({
            "product_id": li.get("product_id"),
            "name": li.get("name"),
            "sku": li.get("sku"),
            "quantity": qty,
            "unit_price": round(price, 2),
            "discount_pct": disc_pct,
            "tax_rate": tax_pct,
            "line_subtotal": round(gross, 2),
            "line_discount": round(d, 2),
            "line_tax": round(t, 2),
            "line_total": round(total, 2),
        })
        subtotal += gross
        discount += d
        tax += t
    grand = subtotal - discount + tax
    return {
        "line_items": items,
        "item_count": len(items),
        "amount": round(subtotal, 2),
        "discount_amount": round(discount, 2),
        "tax": round(tax, 2),
        "total_amount": round(grand, 2),
    }
