"""
Inbound form capture — the front door for new leads.

A public submission (web form / API) is turned into:
  • a lead (deduplicated by email — existing leads are reused & enriched),
  • a `lead_activities` record (the engagement that drives scoring),
  • a `form_submissions` record (raw audit of what was sent),
  • optional journey enrollment.

It reuses the rest of the stack: scoring runs on the new activity (which can
push the lead over the qualify line and fire the automation engine), and a
brand-new lead fires automations watching `leads` / created.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")
ORG_DEFAULT = uuid.UUID("00000000-0000-0000-0000-000000000000")


def _full_name(payload: dict):
    return (payload.get("name")
            or " ".join(p for p in [payload.get("first_name"), payload.get("last_name")] if p).strip()
            or payload.get("email"))


async def capture_submission(db: AsyncSession, form: EntityRecord | None, payload: dict) -> dict:
    cfg = (form.data if form else {}) or {}
    form_name = cfg.get("name") or "Web Form"
    event = cfg.get("scoring_event") or "Form Submitted"
    source = cfg.get("source") or form_name
    journey_name = cfg.get("journey_name")
    org = form.organization_id if form else ORG_DEFAULT

    email = (payload.get("email") or "").strip().lower() or None
    name = _full_name(payload)

    # --- dedupe lead by email ---
    lead = None
    if email:
        lead = (await db.execute(
            select(EntityRecord).where(
                EntityRecord.entity_type == "leads", EntityRecord.is_deleted == "N",
            ).where(text("lower(data->>'email') = :e")).params(e=email)
        )).scalars().first()

    is_new = lead is None
    if is_new:
        lead = EntityRecord(
            entity_type="leads", module_code="marketing",
            data={"name": name, "email": email,
                  "phone": payload.get("phone"),
                  "company_name": payload.get("company") or payload.get("company_name"),
                  "status": "New", "source": source,
                  "campaign": payload.get("campaign") or cfg.get("campaign"),
                  "score": 0},
            organization_id=org, created_by=SYS_USER, last_modified_by=SYS_USER,
        )
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
        from app.services.automation.engine import fire_event
        await fire_event(db, "created", "leads", lead.id, lead.data)
    else:
        d = dict(lead.data or {})
        for k_src, k_dst in [("phone", "phone"), ("company", "company_name"), ("company_name", "company_name")]:
            if payload.get(k_src) and not d.get(k_dst):
                d[k_dst] = payload[k_src]
        d["last_form"] = form_name
        lead.data = d
        lead.last_modified_at = datetime.utcnow()
        await db.commit()

    # --- engagement activity (drives scoring) ---
    db.add(EntityRecord(
        entity_type="lead_activities", module_code="marketing",
        data={"name": f"{event} · {name}", "activity_type": event,
              "lead_id": str(lead.id), "lead_email": email,
              "description": f"Submitted form: {form_name}",
              "form_name": form_name, "activity_date": datetime.utcnow().isoformat()},
        organization_id=org, created_by=SYS_USER, last_modified_by=SYS_USER,
    ))
    await db.commit()

    # --- score it (may qualify → fire handoff automation) ---
    from app.services.marketing.scoring import apply_event
    score = await apply_event(db, event, lead_id=str(lead.id))

    # --- raw submission audit ---
    db.add(EntityRecord(
        entity_type="form_submissions", module_code="marketing",
        data={"name": f"{form_name} · {name}", "form_name": form_name,
              "lead_id": str(lead.id), "lead_email": email,
              "payload": payload, "submitted_at": datetime.utcnow().isoformat()},
        organization_id=org, created_by=SYS_USER, last_modified_by=SYS_USER,
    ))
    await db.commit()

    # --- optional journey enrollment (skip if already actively enrolled) ---
    enrolled = False
    if journey_name:
        existing = (await db.execute(
            select(EntityRecord).where(
                EntityRecord.entity_type == "journey_enrollments",
                EntityRecord.is_deleted == "N",
            ).where(text("data->>'subject_id' = :sid AND data->>'journey_name' = :jn AND data->>'status' = 'Active'"))
            .params(sid=str(lead.id), jn=journey_name)
        )).scalars().first()
        if existing is None:
            db.add(EntityRecord(
                entity_type="journey_enrollments", module_code="marketing",
                data={"name": f"{journey_name} · {name}", "journey_name": journey_name,
                      "subject_id": str(lead.id), "subject_email": email, "subject_name": name,
                      "status": "Active", "current_step": 0,
                      "enrolled_at": datetime.utcnow().isoformat(),
                      "next_run_at": datetime.utcnow().isoformat(),
                      "source": f"form:{form_name}"},
                organization_id=org, created_by=SYS_USER, last_modified_by=SYS_USER,
            ))
            await db.commit()
            enrolled = True

    return {"ok": True, "lead_id": str(lead.id), "lead_name": name,
            "new_lead": is_new, "form": form_name,
            "score": score.get("new_score"), "grade": score.get("grade"),
            "qualified": score.get("qualified"),
            "enrolled_journey": journey_name if enrolled else None}
