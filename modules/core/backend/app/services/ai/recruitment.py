"""HR recruitment pipeline — a stage-by-stage hiring workflow the HR unit manager
drives through its section specialists.

Fixed 6 stages: Requisition → Advertisement → Shortlisting → Interview →
Background check → Job offer. Each stage's specialist DRAFTS a record
(`create_record`, dry-run) on its section; the human approves to apply it (create
the real record) and unlock the next stage. State lives on a `recruitments`
entity_record (role, current_stage, per-stage draft/record).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord
from . import workers as ai_workers
from .gateway import run_capability, apply_capability

MODULE = "hr"
MANAGER_ET = "__manager__"  # the HR unit manager (a first-class worker) directs the pipeline
PIPE_ENTITY = "recruitments"
SYS = uuid.UUID("00000000-0000-0000-0000-000000000001")
ORG = uuid.UUID("00000000-0000-0000-0000-000000000000")

STAGES = [
    {"key": "requisition",      "label": "Requisition",      "section": "job_requisitions"},
    {"key": "advertisement",    "label": "Advertisement",    "section": "advertisements"},
    {"key": "shortlist",        "label": "Shortlisting",     "section": "applicants"},
    {"key": "interview",        "label": "Interview",        "section": "interviews"},
    {"key": "background_check",  "label": "Background check", "section": "background_checks"},
    {"key": "offer",            "label": "Job offer",        "section": "job_offers"},
]

INSTRUCTIONS = {
    "requisition": "Open a NEW job requisition to hire a {role}. Fill the fields with realistic values: a clear job title, department, employment type (Full-time), headcount (1), seniority/level, the must-have skills, and a one-line summary. Set status to 'Open'.",
    "advertisement": "Draft a public job ADVERTISEMENT for the open '{role}' role (from requisition: {requisition}). Fill: an engaging title, a short summary, key responsibilities, the requirements, location, and how to apply. Set status to 'Active'.",
    "shortlist": "Create ONE shortlisted APPLICANT for the '{role}' role (advertised as: {advertisement}). Invent a realistic candidate: full name, email, source, a few key strengths, and set status to 'Shortlisted'.",
    "interview": "Schedule an INTERVIEW for the shortlisted candidate {shortlist} applying for '{role}'. Fill: interview round (e.g. 'First round'), type (e.g. 'Video'), interviewer/panel, a date in the next two weeks, the focus areas, and status 'Scheduled'.",
    "background_check": "Initiate a BACKGROUND CHECK for {shortlist}, the candidate for '{role}'. Fill: the checks required (identity, employment history, references), the provider, the requested date, and status 'Pending'.",
    "offer": "Draft a JOB OFFER for {shortlist} for the '{role}' role. Fill: the job title, a realistic compensation/salary, the start date, a brief benefits summary, status 'Draft', and an offer-expiry date.",
}


def _new_stages() -> list[dict]:
    return [{"key": s["key"], "label": s["label"], "section": s["section"], "status": "pending",
             "draft": None, "record_id": None, "record_label": None, "expert": None} for s in STAGES]


async def _load(db: AsyncSession, pipe_id):
    try:
        return (await db.execute(select(EntityRecord).where(
            EntityRecord.id == uuid.UUID(str(pipe_id)), EntityRecord.entity_type == PIPE_ENTITY)
        )).scalar_one_or_none()
    except (ValueError, TypeError):
        return None


async def _draft(db: AsyncSession, data: dict, idx: int) -> tuple[dict, float]:
    """Draft stage idx (the specialist on its section) into a fresh copy of data."""
    stages = [dict(s) for s in data["stages"]]
    stage = stages[idx]
    role = data["role"]
    labels = {s["key"]: (s.get("record_label") or role) for s in stages[:idx]}
    fmt = {"role": role, **{k: labels.get(k, "the role") for k in ("requisition", "advertisement", "shortlist")}}
    objective = INSTRUCTIONS[stage["key"]].format(**fmt)
    cost = 0.0

    # 1) The HR MANAGER issues the order for this stage's specialist (in character).
    #    Falls back to the canonical objective if no manager is hired / the call fails.
    mgr = data.get("manager")
    brief = objective
    if mgr:
        done = [f"{s['label']}: {s.get('record_label')}" for s in stages[:idx] if s.get("record_label")]
        task = (f"You are running the hire for a '{role}'. It is now the '{stage['label']}' stage, handled by your "
                f"{stage['section']} specialist. Done so far: {'; '.join(done) or 'nothing yet'}. "
                f"The objective is: {objective} Write your instruction to that specialist now.")
        try:
            mout = await run_capability(db, "manager_instruct", module_code=MODULE, entity_type=MANAGER_ET,
                                        context={"input": task}, enforce_gate=False)
            b = (mout.get("result") or {}).get("text")
            if b and b.strip():
                brief = b.strip()
            cost += float(mout.get("usage", {}).get("cost_usd") or 0)
        except Exception:
            pass  # manager unavailable → specialist works to the canonical objective

    # 2) The SPECIALIST executes the manager's brief on its section.
    stage["brief"] = brief
    stage["manager"] = (mgr or {}).get("name") if brief != objective else None
    try:
        out = await run_capability(db, "create_record", module_code=MODULE, entity_type=stage["section"],
                                   context={"input": brief, "text": brief}, enforce_gate=False, dry_run=True)
        stage["draft"] = out.get("result") or {}
        stage["status"] = "drafted"
        stage["expert"] = out.get("worker")
        cost += float(out.get("usage", {}).get("cost_usd") or 0)
    except Exception as e:
        stage["draft"] = {"_error": str(getattr(e, "detail", None) or e)[:200]}
        stage["status"] = "draft_failed"
    stages[idx] = stage
    return {**data, "stages": stages, "current_stage": idx}, cost


def _out(rec: EntityRecord, cost: float = 0.0) -> dict:
    return {"id": str(rec.id), **(rec.data or {}), "cost_usd": round(cost, 6)}


async def start(db: AsyncSession, role: str) -> dict:
    role = (role or "").strip()
    if not role:
        return {"error": "Give a role to hire for."}
    mgr = await ai_workers.get_worker(db, MODULE, MANAGER_ET)  # the hired HR manager runs this hire
    manager = {"name": mgr["name"], "role": mgr.get("role"), "persona": mgr.get("persona")} if mgr else None
    data = {"name": f"Hire: {role}", "role": role, "status": "active", "current_stage": 0,
            "manager": manager, "stages": _new_stages()}
    data, cost = await _draft(db, data, 0)
    rec = EntityRecord(entity_type=PIPE_ENTITY, module_code=MODULE, data=data,
                       organization_id=ORG, created_by=SYS, last_modified_by=SYS)
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return _out(rec, cost)


async def approve_stage(db: AsyncSession, pipe_id: str) -> dict:
    rec = await _load(db, pipe_id)
    if not rec:
        return {"error": "pipeline not found"}
    data = rec.data or {}
    idx = data.get("current_stage", 0)
    stages = [dict(s) for s in data["stages"]]
    stage = stages[idx]
    if stage["status"] != "drafted":
        return {"error": f"stage is {stage['status']}, not ready to approve"}
    try:
        outcome = await apply_capability(db, "create_record", module_code=MODULE, entity_type=stage["section"],
                                         result=stage.get("draft") or {}, context={}, enforce_gate=False)
    except Exception as e:
        return {"error": f"could not create the record: {str(getattr(e, 'detail', None) or e)[:200]}"}
    created = (outcome or {}).get("result") or {}
    fields = created.get("fields") or {}
    label = created.get("label")
    if not label or label == stage["section"]:
        label = next((str(fields[f]) for f in ("job_title", "title", "full_name", "candidate_name",
                      "subject", "name", "position") if fields.get(f)), None)
    if not label:
        label = f"{data['role']} — {stage['label']}"
    stages[idx] = {**stage, "status": "approved", "record_id": created.get("id"), "record_label": label}
    cost = 0.0
    if idx + 1 < len(STAGES):
        new, cost = await _draft(db, {**data, "stages": stages, "current_stage": idx + 1}, idx + 1)
    else:
        new = {**data, "stages": stages, "status": "completed"}
    rec.data = new
    rec.last_modified_by = SYS
    rec.last_modified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(rec)
    return _out(rec, cost)


async def redraft_stage(db: AsyncSession, pipe_id: str) -> dict:
    rec = await _load(db, pipe_id)
    if not rec:
        return {"error": "pipeline not found"}
    data = rec.data or {}
    new, cost = await _draft(db, data, data.get("current_stage", 0))
    rec.data = new
    rec.last_modified_by = SYS
    rec.last_modified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(rec)
    return _out(rec, cost)


async def get(db: AsyncSession, pipe_id: str) -> dict:
    rec = await _load(db, pipe_id)
    return _out(rec) if rec else {"error": "not found"}


async def list_pipelines(db: AsyncSession, limit: int = 50) -> list[dict]:
    q = (select(EntityRecord).where(EntityRecord.entity_type == PIPE_ENTITY, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc()).limit(limit))
    return [{"id": str(r.id), **(r.data or {})} for r in (await db.execute(q)).scalars().all()]


def stages_meta() -> list[dict]:
    return [{"key": s["key"], "label": s["label"], "section": s["section"]} for s in STAGES]
