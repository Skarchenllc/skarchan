"""Promotion engine — earned autonomy.

Evaluates a worker's track record (from ai_feedback) and, when it qualifies,
proposes the next autonomy level. Promotion is never automatic: the engine
recommends; a human confirms via POST /ai/workers/{id}/promote.

A "correction" counts against readiness (the AI needed fixing), even though it
also teaches the model via golden examples — so a worker promotes only when it
earns clean approvals with few corrections.
"""
from . import feedback as ai_feedback, workers as ai_workers

LADDER = ["suggest", "review", "auto"]
MIN_SIGNALS = 5          # need a track record before promoting
APPROVAL_MIN = 0.8       # clean-approval rate
MAX_CORRECTION_RATE = 0.34


async def _metrics(db, module_code: str, entity_type: str) -> dict:
    rows = await ai_feedback.list_feedback(db, None, 2000)
    clean_up = down = corrections = 0
    for d in rows:
        if d.get("module_code") != module_code or d.get("entity_type") != entity_type:
            continue
        if d.get("corrected"):
            corrections += 1
        elif d.get("rating") == "up":
            clean_up += 1
        elif d.get("rating") == "down":
            down += 1
    signals = clean_up + down + corrections
    approval = round(clean_up / signals, 3) if signals else None
    correction_rate = round(corrections / signals, 3) if signals else 0.0
    return {"signals": signals, "clean_approvals": clean_up, "down": down,
            "corrections": corrections, "approval": approval, "correction_rate": correction_rate}


def _recommend(current: str, m: dict) -> dict | None:
    idx = LADDER.index(current) if current in LADDER else 0
    if idx >= len(LADDER) - 1:
        return {"eligible": False, "at_top": True, "recommended": None,
                "reasons": ["Already at maximum autonomy."], "metrics": m}
    nxt = LADDER[idx + 1]
    signals = m["signals"]
    approval = m["approval"]
    approval_pct = int((approval or 0) * 100)
    corr_pct = int(m["correction_rate"] * 100)
    blockers = []
    if signals < MIN_SIGNALS:
        blockers.append(f"needs >={MIN_SIGNALS} feedback signals (has {signals})")
    if approval is None or approval < APPROVAL_MIN:
        have = "" if approval is None else f" (has {approval_pct}%)"
        blockers.append(f"needs >={int(APPROVAL_MIN * 100)}% clean approval{have}")
    if m["correction_rate"] > MAX_CORRECTION_RATE:
        blockers.append(f"correction rate too high ({corr_pct}%)")
    eligible = not blockers
    reasons = [f"{signals} signals, {approval_pct}% approval, {corr_pct}% corrections"] if eligible else blockers
    return {"eligible": eligible, "at_top": False, "recommended": nxt, "reasons": reasons, "metrics": m}


async def evaluate(db, worker: dict) -> dict:
    m = await _metrics(db, worker["module_code"], worker["entity_type"])
    return _recommend(worker.get("autonomy", "suggest"), m)


async def promote(db, worker_id: str) -> dict:
    """Apply a promotion after a human confirms — re-checks eligibility first."""
    workers = await ai_workers.list_workers(db)
    w = next((x for x in workers if x["id"] == worker_id), None)
    if not w:
        return {"ok": False, "reason": "worker not found"}
    rec = await evaluate(db, w)
    if not rec.get("eligible"):
        return {"ok": False, "reason": "not eligible", "promotion": rec}
    updated = await ai_workers.upsert_worker(db, {**w, "autonomy": rec["recommended"]})
    return {"ok": True, "autonomy": updated["autonomy"], "worker": updated}
