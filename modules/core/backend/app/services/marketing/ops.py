"""
Marketing execution engine.

email_sends     — an outbound email (Queued → Sent → Delivered → Opened/Clicked)
journeys        — a drip sequence: data.steps = [{delay_days, action, value}, ...]
journey_enrollments — a subject moving through a journey (current_step, next_run_at)

Email *delivery* is simulated here (no SMTP credentials in this environment): a
send is recorded and marked delivered, with a realistic open/click roll. The
`_deliver` function is the single seam where a real provider (SES/SendGrid/SMTP)
plugs in — everything else (queueing, journeys, automation actions) is real.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")
ORG_DEFAULT = uuid.UUID("00000000-0000-0000-0000-000000000000")


def _now():
    return datetime.utcnow()


def _add(db, entity_type, data, org_id, module="marketing"):
    rec = EntityRecord(
        entity_type=entity_type, module_code=module, data=data,
        organization_id=org_id, created_by=SYS_USER, last_modified_by=SYS_USER,
    )
    db.add(rec)
    return rec


async def _score_engagement(db, status, to_email):
    """An opened/clicked email is a scorable engagement for the matching lead."""
    if to_email and status in ("Opened", "Clicked"):
        from app.services.marketing.scoring import apply_event
        await apply_event(db, "link_clicked" if status == "Clicked" else "email_opened", lead_email=to_email)


async def _deliver(send_data: dict) -> dict:
    """The provider seam. Routes to the configured email provider (smtp/console/
    simulate) and returns delivery status fields to merge into the send record."""
    from app.services.marketing.email_provider import deliver
    return await deliver(
        to_email=send_data.get("to_email"),
        subject=send_data.get("subject") or send_data.get("template_name"),
        html=send_data.get("body"),
        text=send_data.get("body"),
    )


async def _deliver_checked(db, send_data: dict) -> dict:
    """Deliver, but skip (status Suppressed) if the recipient is on the do-not-send list."""
    from app.services.marketing.suppression import is_suppressed
    if await is_suppressed(db, send_data.get("to_email")):
        return {"status": "Suppressed", "provider": "suppression", "sent_at": _now().isoformat()}
    return await _deliver(send_data)


async def send_email(db: AsyncSession, *, to_email, to_name=None, template_name=None,
                     subject=None, body=None, org_id=None, source=None) -> dict:
    """Create + deliver a single email immediately."""
    data = {
        "name": f"{template_name or subject or 'Email'} → {to_email or to_name or '?'}",
        "template_name": template_name, "subject": subject, "body": body,
        "to_email": to_email, "to_name": to_name,
    }
    if source:
        data["source"] = source
    data.update(await _deliver_checked(db, data))
    rec = _add(db, "email_sends", data, org_id or ORG_DEFAULT)
    await db.commit()
    await db.refresh(rec)
    await _score_engagement(db, data.get("status"), to_email)
    return rec.to_dict()


async def process_email_queue(db: AsyncSession, limit: int = 500) -> dict:
    """Deliver every email_send currently in Queued status (e.g. enqueued by automations)."""
    res = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "email_sends",
            EntityRecord.is_deleted == "N",
        ).limit(limit)
    )
    sent = 0
    engaged = []
    for rec in res.scalars().all():
        if (rec.data or {}).get("status") != "Queued":
            continue
        rec.data = {**rec.data, **(await _deliver_checked(db, rec.data))}
        rec.last_modified_at = _now()
        sent += 1
        if rec.data.get("to_email") and rec.data.get("status") in ("Opened", "Clicked"):
            engaged.append((rec.data["status"], rec.data["to_email"]))
    await db.commit()
    for status, email in engaged:
        await _score_engagement(db, status, email)
    return {"processed": sent}


async def enroll_subjects(db: AsyncSession, journey_id: str, *, entity_type: Optional[str] = None,
                          limit: int = 200) -> dict:
    """Enroll records of `entity_type` (e.g. all leads) into a journey."""
    journey = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == uuid.UUID(journey_id))
    )).scalar_one_or_none()
    if journey is None or journey.entity_type != "journeys":
        return {"error": "journey not found"}
    jname = journey.data.get("name")
    src_entity = entity_type or journey.data.get("audience_entity") or "leads"
    res = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == src_entity,
            EntityRecord.is_deleted == "N",
        ).limit(limit)
    )
    enrolled = 0
    for rec in res.scalars().all():
        d = rec.data or {}
        _add(db, "journey_enrollments", {
            "name": f"{jname} · {d.get('name') or d.get('email') or rec.id}",
            "journey_name": jname, "journey_id": str(journey.id),
            "subject_id": str(rec.id), "subject_email": d.get("email"),
            "subject_name": d.get("name") or d.get("first_name"),
            "status": "Active", "current_step": 0,
            "enrolled_at": _now().isoformat(), "next_run_at": _now().isoformat(),
        }, rec.organization_id)
        enrolled += 1
    await db.commit()
    return {"journey": jname, "audience": src_entity, "enrolled": enrolled}


def _steps(journey_data: dict):
    raw = journey_data.get("steps")
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            return json.loads(raw)
        except Exception:
            return []
    return []


async def _load_lead(db, lead_id):
    if not lead_id:
        return None
    try:
        lid = uuid.UUID(str(lead_id))
    except ValueError:
        return None
    return (await db.execute(
        select(EntityRecord).where(EntityRecord.id == lid, EntityRecord.entity_type == "leads")
    )).scalar_one_or_none()


async def run_journeys(db: AsyncSession, limit: int = 1000) -> dict:
    """
    One tick of the drip runner: advance every Active enrollment whose
    next_run_at is due, executing the current step's action.
    """
    now = _now()
    # cache journeys by name
    jres = await db.execute(select(EntityRecord).where(EntityRecord.entity_type == "journeys", EntityRecord.is_deleted == "N"))
    journeys = {j.data.get("name"): j for j in jres.scalars().all()}

    eres = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "journey_enrollments",
            EntityRecord.is_deleted == "N",
        ).limit(limit)
    )
    advanced = completed = emails = 0
    engaged = []
    for en in eres.scalars().all():
        d = en.data or {}
        if d.get("status") != "Active":
            continue
        nra = d.get("next_run_at")
        if nra:
            try:
                if datetime.fromisoformat(nra) > now:
                    continue  # not due yet
            except Exception:
                pass
        journey = journeys.get(d.get("journey_name"))
        steps = _steps(journey.data) if journey else []
        idx = int(d.get("current_step") or 0)
        if idx >= len(steps):
            en.data = {**d, "status": "Completed", "completed_at": now.isoformat()}
            completed += 1
            continue
        step = steps[idx] or {}
        action = step.get("action", "wait")
        if action == "send_email":
            delivery = await _deliver_checked(db, {"to_email": d.get("subject_email"), "subject": step.get("value")})
            _add(db, "email_sends", {
                "name": f"{step.get('value') or 'Journey email'} → {d.get('subject_email') or d.get('subject_name')}",
                "template_name": step.get("value"),
                "to_email": d.get("subject_email"), "to_name": d.get("subject_name"),
                "journey_name": d.get("journey_name"),
                **delivery,
            }, en.organization_id)
            if d.get("subject_email") and delivery.get("status") in ("Opened", "Clicked"):
                engaged.append((delivery["status"], d.get("subject_email")))
            emails += 1
        elif action == "create_activity":
            _add(db, "activities", {
                "subject": step.get("value") or "Journey task", "type": "Task",
                "status": "Open", "priority": "Medium",
                "related_to": d.get("subject_name") or d.get("subject_email"),
                "source_journey": d.get("journey_name"),
            }, en.organization_id, module="sales")
        elif action == "update_field" and step.get("field"):
            lead = await _load_lead(db, d.get("subject_id"))
            if lead is not None:
                lead.data = {**(lead.data or {}), step["field"]: step.get("value")}
                lead.last_modified_at = now
        elif action == "send_sms":
            _add(db, "lead_activities", {
                "name": f"SMS · {d.get('subject_name') or d.get('subject_email')}",
                "activity_type": "SMS Sent", "lead_id": d.get("subject_id"),
                "lead_email": d.get("subject_email"),
                "description": step.get("value") or "Journey SMS",
            }, en.organization_id)
        elif action == "branch":
            # conditional gate: exit the journey if the condition fails
            from app.services.marketing.segments import _match
            lead = await _load_lead(db, d.get("subject_id"))
            cond = [(step.get("cond_field"), step.get("cond_op") or "=", step.get("cond_value"))]
            if lead is not None and step.get("cond_field") and not _match(lead.data, cond):
                en.data = {**d, "status": "Exited", "exited_at": now.isoformat(),
                           "exit_reason": f"branch {step.get('cond_field')} {step.get('cond_op')} {step.get('cond_value')}"}
                completed += 1
                advanced += 1
                continue
        # advance
        nxt = idx + 1
        newd = {**d, "current_step": nxt}
        if nxt >= len(steps):
            newd["status"] = "Completed"
            newd["completed_at"] = now.isoformat()
            completed += 1
        else:
            delay = int(steps[nxt].get("delay_days") or 0)
            newd["next_run_at"] = (now + timedelta(days=delay)).isoformat()
        en.data = newd
        advanced += 1
    await db.commit()
    for status, email in engaged:
        await _score_engagement(db, status, email)
    return {"advanced": advanced, "completed": completed, "emails_sent": emails}
