"""Feedback & learning loop.

Captures human judgement on AI outputs (👍/👎, edits/corrections). Approved or
corrected outputs become "golden examples" that the gateway injects as dynamic
few-shot, so future outputs match the org's style and quality — the system
learns from actions over time without retraining the base model.

Stored as entity_records of type 'ai_feedback'.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

FEEDBACK_ENTITY = "ai_feedback"
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")


async def record(db: AsyncSession, payload: dict, actor: uuid.UUID | None = None) -> dict:
    data = {
        "capability_id": payload.get("capability_id"),
        "module_code": payload.get("module_code"),
        "entity_type": payload.get("entity_type"),
        "run_id": payload.get("run_id"),
        "rating": payload.get("rating"),          # 'up' | 'down' | None
        "input": (payload.get("input") or "")[:4000],
        "output": (payload.get("output") or "")[:4000],
        "corrected": (payload.get("corrected") or None),
        "comment": payload.get("comment"),
    }
    if data["corrected"]:
        data["corrected"] = data["corrected"][:4000]
    rec = EntityRecord(entity_type=FEEDBACK_ENTITY, module_code="core", data=data,
                       organization_id=DEFAULT_ORG_ID,
                       created_by=actor or SYSTEM_USER_ID, last_modified_by=actor or SYSTEM_USER_ID)
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    # Train the narrow specialist model: a classify approval/correction is a labelled
    # example (input → correct label). This is the literal "learns from labels" path.
    if data["capability_id"] == "classify" and data["input"]:
        label = data["corrected"] or (data["output"] if data["rating"] == "up" else None)
        if label:
            try:
                from . import specialist
                specialist.add_example(data["module_code"], data["entity_type"], data["input"], label)
            except Exception:
                pass

    return {"id": str(rec.id), **data}


async def _all(db: AsyncSession) -> list[EntityRecord]:
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == FEEDBACK_ENTITY, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc()))
    return list((await db.execute(q)).scalars().all())


async def golden_examples(db: AsyncSession, *, capability_id: str, module_code: str,
                          entity_type: str, limit: int = 3) -> list[dict]:
    """Approved or corrected outputs for this (capability, section) → few-shot examples."""
    out = []
    for r in await _all(db):
        d = r.data or {}
        if d.get("capability_id") != capability_id or d.get("module_code") != module_code \
                or d.get("entity_type") != entity_type:
            continue
        good = d.get("corrected") or (d.get("output") if d.get("rating") == "up" else None)
        if not good or not d.get("input"):
            continue
        out.append({"input": d["input"], "output": good})
        if len(out) >= limit:
            break
    return out


async def list_feedback(db: AsyncSession, module_code: str | None = None, limit: int = 100) -> list[dict]:
    out = []
    for r in await _all(db):
        d = r.data or {}
        if module_code and d.get("module_code") != module_code:
            continue
        out.append({"id": str(r.id), "created_at": r.created_at.isoformat() if r.created_at else None, **d})
        if len(out) >= limit:
            break
    return out


async def quality_by_section(db: AsyncSession) -> dict:
    """Per (module/entity) quality: up/down/corrections and an approval score."""
    agg: dict[str, dict] = {}
    for r in await _all(db):
        d = r.data or {}
        key = f"{d.get('module_code')}/{d.get('entity_type')}"
        a = agg.setdefault(key, {"up": 0, "down": 0, "corrections": 0, "total": 0})
        a["total"] += 1
        if d.get("rating") == "up":
            a["up"] += 1
        elif d.get("rating") == "down":
            a["down"] += 1
        if d.get("corrected"):
            a["corrections"] += 1
    for a in agg.values():
        rated = a["up"] + a["down"]
        a["approval"] = round(a["up"] / rated, 3) if rated else None
    return agg
