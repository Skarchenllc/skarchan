"""Centralized AI control-plane API (/api/v1/ai).

- status / capabilities  → what's available
- settings (GET/PUT)     → per-(module, section) toggles that gate capabilities
- run                    → invoke a capability through the gateway (gated)
- runs / usage           → audit & cost
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user_optional
from app.services.ai import (config, runs as ai_runs, settings as ai_settings, proactive,
                             knowledge, vectorstore, workers as ai_workers, feedback as ai_feedback,
                             promotion as ai_promotion, specialist as ai_specialist, manager as ai_manager,
                             proposer as ai_proposer, access as ai_access)
from app.services.ai.capabilities import CAPABILITIES, get_capability
from app.services.ai.gateway import run_capability, apply_capability

router = APIRouter()


def _actor(user) -> str | None:
    return str(user.id) if user else None


@router.get("/status")
async def ai_status(db: AsyncSession = Depends(get_db), user=Depends(get_current_user_optional)):
    gov = await ai_settings.get_global(db)
    latest = await ai_runs.latest_run(db)
    last_err = (latest or {}).get("error") if (latest or {}).get("status") == "error" else None
    credits_low = bool(last_err and any(k in last_err.lower() for k in ("credit balance", "billing", "insufficient_quota")))
    return {
        "key": config.key_status(),
        "default_model": config.DEFAULT_MODEL,
        "model_tiers": config.MODEL_TIERS,
        "capabilities": len(CAPABILITIES),
        "governance": {
            "enabled": gov["enabled"],
            "monthly_budget_usd": gov["monthly_budget_usd"],
            "month_spend_usd": await ai_runs.month_spend(db),
            "jobs_auto": gov["ai_jobs_auto"],
            "ceo_standup": {
                "enabled": gov["ceo_standup_enabled"],
                "instruction": gov["ceo_standup_instruction"],
                "interval_hours": gov["ceo_standup_interval_hours"],
            },
        },
        "access": {"writes_require": gov["writes_require"], "approvals_require": gov["approvals_require"]},
        "policy": {"mode": gov["policy_mode"]},
        "ai_health": {"credits_low": credits_low, "message": last_err if credits_low else None},
        "me": await ai_access.me(db, user),
        "semantic": {
            "available": vectorstore.semantic_available(),
            "chroma": vectorstore.chroma_available(),
            "embeddings": vectorstore.EMBED_MODEL if vectorstore.embedder_available() else None,
        },
    }


@router.post("/index")
async def index_section(module_code: str = Query(...), entity_type: str = Query(...),
                        db: AsyncSession = Depends(get_db), user=Depends(get_current_user_optional)):
    """Embed a section's records into ChromaDB so Ask Your Data uses semantic search."""
    await ai_access.require(db, user, "admin")
    return await knowledge.index_section(db, module_code=module_code, entity_type=entity_type)


@router.get("/specialist")
async def specialist_status(module_code: str = Query(...), entity_type: str = Query(...)):
    """Training status of the narrow specialist (classify) model for a section."""
    return ai_specialist.status(module_code, entity_type)


@router.post("/manage")
async def manage(module_code: str = Query(...), goal: str | None = Query(None),
                 db: AsyncSession = Depends(get_db)):
    """Run the module's manager: delegate to section specialists, synthesize a briefing."""
    return await ai_manager.run_manager(db, module_code, goal)


class DelegatePayload(BaseModel):
    module_code: str
    instruction: str
    section: str | None = None  # optional: target a single section's specialist


@router.post("/delegate")
async def delegate(payload: DelegatePayload, db: AsyncSession = Depends(get_db)):
    """Instruct a unit manager — it plans the work and gets it done through its
    section experts (reads return findings; writes route through policy). When
    `section` is set, the work is scoped to that one section's specialist."""
    return await ai_manager.delegate(db, payload.module_code, payload.instruction, section=payload.section)


@router.post("/synthesize")
async def synthesize(payload: dict, db: AsyncSession = Depends(get_db)):
    """Re-write the decision note from already-gathered team reports — used for the
    'refine' option (no need to re-run the specialists)."""
    reports = (payload.get("report_input") or payload.get("reports") or "").strip()
    if not reports:
        return {"error": "Nothing to synthesise."}
    try:
        out = await run_capability(
            db, "synthesize", module_code="__org__", entity_type="__ceo__",
            context={"goal": payload.get("goal") or payload.get("instruction") or "",
                     "reports": reports[:14000], "refinement": payload.get("refinement")},
            enforce_gate=False)
        return {"report": out.get("result"), "cost_usd": (out.get("usage") or {}).get("cost_usd")}
    except Exception as e:
        return {"error": str(getattr(e, "detail", None) or e)[:200]}


@router.get("/divisions")
async def divisions(db: AsyncSession = Depends(get_db)):
    """The org's divisions, their AI-enabled units (+ unit managers), division heads, and the CEO."""
    out = []
    for key, d in ai_manager.DIVISIONS.items():
        units = await ai_manager.division_roster(db, key)
        head = await ai_workers.get_worker(db, key, ai_manager.DIVISION_ET)
        out.append({"key": key, "label": d["label"], "modules": d["modules"],
                    "units": units, "head": (head or {}).get("name"),
                    "head_role": (head or {}).get("role")})
    ceo = await ai_workers.get_worker(db, ai_manager.ORG_KEY, ai_manager.CEO_ET)
    return {"data": out, "ceo": (ceo or {}).get("name"), "ceo_role": (ceo or {}).get("role")}


class DispatchPayload(BaseModel):
    division: str
    instruction: str


@router.post("/dispatch")
async def dispatch(payload: DispatchPayload, db: AsyncSession = Depends(get_db)):
    """Instruct a division head — it routes work to the right unit managers, who
    delegate down to their section experts (manager-to-manager)."""
    return await ai_manager.dispatch(db, payload.division, payload.instruction)


class OrgPayload(BaseModel):
    instruction: str


@router.post("/org")
async def org(payload: OrgPayload, db: AsyncSession = Depends(get_db)):
    """Instruct the CEO — it sets direction and cascades down divisions → units → experts."""
    return await ai_manager.run_org(db, payload.instruction)


class StandupPayload(BaseModel):
    enabled: bool | None = None
    instruction: str | None = None
    interval_hours: float | None = None


@router.put("/ceo-standup")
async def set_ceo_standup(payload: StandupPayload, db: AsyncSession = Depends(get_db),
                          user=Depends(get_current_user_optional)):
    """Configure the scheduled daily CEO standup (admins only)."""
    await ai_access.require(db, user, "admin")
    g = await ai_settings.set_ceo_standup(db, payload.model_dump(exclude_none=True), user.id if user else None)
    return {"enabled": g["ceo_standup_enabled"], "instruction": g["ceo_standup_instruction"],
            "interval_hours": g["ceo_standup_interval_hours"]}


@router.post("/ceo-standup/run")
async def run_ceo_standup(db: AsyncSession = Depends(get_db)):
    """Run the CEO standup now (the same routine the scheduler runs daily)."""
    return await ai_manager.ceo_standup(db)


# --- HR recruitment pipeline (stage-by-stage hiring workflow) ----------------
from app.services.ai import recruitment as ai_recruitment


class HirePayload(BaseModel):
    role: str


@router.get("/recruitment")
async def recruitment_list(db: AsyncSession = Depends(get_db)):
    """All hiring pipelines + the fixed stage definitions + the HR manager running them."""
    mgr = await ai_workers.get_worker(db, "hr", "__manager__")
    return {"data": await ai_recruitment.list_pipelines(db), "stages": ai_recruitment.stages_meta(),
            "manager": {"name": mgr["name"], "role": mgr.get("role")} if mgr else None}


@router.post("/recruitment/start")
async def recruitment_start(payload: HirePayload, db: AsyncSession = Depends(get_db)):
    """Start a hire — the HR manager has its requisition specialist draft stage 1."""
    return await ai_recruitment.start(db, payload.role)


@router.get("/recruitment/{pipe_id}")
async def recruitment_get(pipe_id: str, db: AsyncSession = Depends(get_db)):
    return await ai_recruitment.get(db, pipe_id)


@router.post("/recruitment/{pipe_id}/approve")
async def recruitment_approve(pipe_id: str, db: AsyncSession = Depends(get_db)):
    """Approve the current stage's draft → create the record + draft the next stage."""
    res = await ai_recruitment.approve_stage(db, pipe_id)
    if res.get("error"):
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.post("/recruitment/{pipe_id}/redraft")
async def recruitment_redraft(pipe_id: str, db: AsyncSession = Depends(get_db)):
    """Re-draft the current stage (the specialist tries again)."""
    return await ai_recruitment.redraft_stage(db, pipe_id)


class BudgetPayload(BaseModel):
    enabled: bool = True
    monthly_budget_usd: float = 0


@router.put("/budget")
async def set_budget(payload: BudgetPayload, db: AsyncSession = Depends(get_db),
                     user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    return await ai_settings.set_global(db, payload.model_dump(), user.id)


class AccessPayload(BaseModel):
    writes_require: str | None = None
    approvals_require: str | None = None


@router.put("/access")
async def set_access(payload: AccessPayload, db: AsyncSession = Depends(get_db),
                     user=Depends(get_current_user_optional)):
    """Set who may run write actions / approve+administer AI (admins only)."""
    await ai_access.require(db, user, "admin")
    return await ai_settings.set_access(db, payload.model_dump(), user.id)


class PolicyPayload(BaseModel):
    policy_mode: str  # trust | review_all | auto_all


@router.put("/policy")
async def set_policy(payload: PolicyPayload, db: AsyncSession = Depends(get_db),
                     user=Depends(get_current_user_optional)):
    """Set the confidence×risk routing mode for AI actions (admins only)."""
    await ai_access.require(db, user, "admin")
    try:
        return await ai_settings.set_policy_mode(db, payload.policy_mode, user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class JobsAutoPayload(BaseModel):
    enabled: bool


@router.put("/jobs-auto")
async def set_jobs_auto(payload: JobsAutoPayload, db: AsyncSession = Depends(get_db),
                        user=Depends(get_current_user_optional)):
    """Turn automatic draining of the ai_jobs queue on/off (admins only)."""
    await ai_access.require(db, user, "admin")
    return await ai_settings.set_jobs_auto(db, payload.enabled, user.id)


@router.get("/review-count")
async def review_count(db: AsyncSession = Depends(get_db)):
    """How many AI items await a human: risk/briefing inbox + proposed changes + pending-review jobs."""
    from sqlalchemy import select
    from app.models.entity_record import EntityRecord
    insights = await proactive.list_insights(db, include_acknowledged=False)
    pending = await ai_proposer.list_pending(db, 500)
    res = await db.execute(select(EntityRecord).where(
        EntityRecord.entity_type == "ai_jobs", EntityRecord.is_deleted == "N"))
    jobs = sum(1 for r in res.scalars().all() if (r.data or {}).get("status") == "Pending Review")
    inbox_n, pending_n = len(insights), len(pending)
    return {"inbox": inbox_n, "pending": pending_n, "jobs": jobs, "total": inbox_n + pending_n + jobs}


@router.post("/proactive/run")
async def run_proactive(module_code: str | None = Query(None), db: AsyncSession = Depends(get_db),
                        user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    return await proactive.run_proactive(db, only_module=module_code)


@router.get("/insights")
async def get_insights(limit: int = Query(50, le=200), include_acknowledged: bool = Query(True),
                       db: AsyncSession = Depends(get_db)):
    return {"data": await proactive.list_insights(db, limit, include_acknowledged)}


@router.post("/insights/{insight_id}/ack")
async def ack_insight(insight_id: str, db: AsyncSession = Depends(get_db)):
    ok = await proactive.acknowledge_insight(db, insight_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"acknowledged": True}


@router.post("/propose")
async def propose(module_code: str = Query(...), entity_type: str = Query(...),
                  db: AsyncSession = Depends(get_db), user=Depends(get_current_user_optional)):
    """Manually run the write-proposer for one section (queues changes for approval)."""
    await ai_access.require(db, user, "admin")
    return await ai_proposer.run_proposer(db, module_code, entity_type)


@router.get("/pending")
async def get_pending(limit: int = Query(50, le=200), db: AsyncSession = Depends(get_db)):
    """AI-proposed record changes awaiting human approval."""
    return {"data": await ai_proposer.list_pending(db, limit)}


@router.post("/pending/{pending_id}/approve")
async def approve_pending(pending_id: str, db: AsyncSession = Depends(get_db),
                          user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    res = await ai_proposer.resolve_pending(db, pending_id, approve=True)
    if not res.get("ok"):
        raise HTTPException(status_code=409, detail=res.get("reason", "could not approve"))
    return res


@router.post("/pending/{pending_id}/reject")
async def reject_pending(pending_id: str, db: AsyncSession = Depends(get_db),
                         user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    res = await ai_proposer.resolve_pending(db, pending_id, approve=False)
    if not res.get("ok"):
        raise HTTPException(status_code=409, detail=res.get("reason", "could not reject"))
    return res


@router.get("/capabilities")
async def list_capabilities(entity_type: str | None = Query(None)):
    caps = [c.meta() for c in CAPABILITIES.values()]
    if entity_type:
        caps = [c for c in caps if "*" in c["applies_to"] or entity_type in c["applies_to"]]
    return {"data": caps}


@router.get("/settings")
async def get_settings(module_code: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    return {"data": await ai_settings.list_settings(db, module_code)}


class SettingPayload(BaseModel):
    module_code: str
    entity_type: str
    enabled: bool = False
    model_tier: str | None = None
    capabilities: dict | None = None
    updated_by: str | None = None


class BulkSettingsPayload(BaseModel):
    module_code: str
    entity_types: list[str]
    enabled: bool = True


@router.post("/settings/bulk")
async def bulk_settings(payload: BulkSettingsPayload, db: AsyncSession = Depends(get_db),
                        user=Depends(get_current_user_optional)):
    """Enable/disable AI across all (given) sections of a module in one call."""
    await ai_access.require(db, user, "admin")
    n = await ai_settings.bulk_set(db, payload.module_code, payload.entity_types, payload.enabled)
    return {"changed": n, "enabled": payload.enabled}


@router.put("/settings")
async def put_setting(payload: SettingPayload, db: AsyncSession = Depends(get_db),
                      user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    import uuid
    actor = None
    if payload.updated_by:
        try:
            actor = uuid.UUID(payload.updated_by)
        except (ValueError, TypeError):
            actor = None
    try:
        saved = await ai_settings.upsert_setting(db, payload.model_dump(), actor)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return saved


class RunPayload(BaseModel):
    capability: str
    module_code: str
    entity_type: str
    context: dict = {}
    created_by: str | None = None
    organization_id: str | None = None


async def _gate_write_capability(db, user, capability_id: str):
    """Write capabilities (create/update) require the 'write' access level."""
    cap = get_capability(capability_id)
    if cap and cap.is_action:
        await ai_access.require(db, user, "write")


@router.post("/run")
async def run(payload: RunPayload, db: AsyncSession = Depends(get_db),
              user=Depends(get_current_user_optional)):
    await _gate_write_capability(db, user, payload.capability)
    return await run_capability(
        db, payload.capability,
        module_code=payload.module_code, entity_type=payload.entity_type,
        context=payload.context, actor_raw=_actor(user) or payload.created_by, org_raw=payload.organization_id,
        enforce_gate=True,
    )


@router.post("/preview")
async def preview(payload: RunPayload, db: AsyncSession = Depends(get_db),
                  user=Depends(get_current_user_optional)):
    """Draft step: run a writes-data capability but return the result instead of persisting."""
    await _gate_write_capability(db, user, payload.capability)
    return await run_capability(
        db, payload.capability,
        module_code=payload.module_code, entity_type=payload.entity_type,
        context=payload.context, actor_raw=_actor(user) or payload.created_by, org_raw=payload.organization_id,
        enforce_gate=True, dry_run=True,
    )


class ApplyPayload(BaseModel):
    capability: str
    module_code: str
    entity_type: str
    result: dict
    context: dict = {}
    created_by: str | None = None
    organization_id: str | None = None


@router.post("/apply")
async def apply(payload: ApplyPayload, db: AsyncSession = Depends(get_db),
                user=Depends(get_current_user_optional)):
    """Review step: persist a previously-previewed draft (no model call)."""
    await ai_access.require(db, user, "write")
    return await apply_capability(
        db, payload.capability,
        module_code=payload.module_code, entity_type=payload.entity_type,
        result=payload.result, context=payload.context,
        actor_raw=_actor(user) or payload.created_by, org_raw=payload.organization_id, enforce_gate=True,
    )


# ----- AI Workers -----------------------------------------------------------
@router.get("/workers")
async def list_workers(module_code: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    workers = await ai_workers.list_workers(db, module_code)
    quality = await ai_feedback.quality_by_section(db)
    for w in workers:
        w["quality"] = quality.get(f"{w['module_code']}/{w['entity_type']}")
        w["promotion"] = await ai_promotion.evaluate(db, w)
    return {"data": workers}


class WorkerPayload(BaseModel):
    module_code: str
    entity_type: str
    name: str = "AI Specialist"
    role: str = "specialist"
    persona: str = ""
    avatar: str = ""
    autonomy: str = "suggest"
    model_tier: str | None = None
    kpis: list[str] = []
    enabled: bool = True


@router.put("/workers")
async def put_worker(payload: WorkerPayload, db: AsyncSession = Depends(get_db),
                     user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    try:
        return await ai_workers.upsert_worker(db, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/workers/{worker_id}")
async def remove_worker(worker_id: str, db: AsyncSession = Depends(get_db),
                        user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    ok = await ai_workers.delete_worker(db, worker_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {"deleted": True}


@router.post("/workers/{worker_id}/promote")
async def promote_worker(worker_id: str, db: AsyncSession = Depends(get_db),
                         user=Depends(get_current_user_optional)):
    await ai_access.require(db, user, "admin")
    """Human-confirmed promotion: re-checks the track record, then raises autonomy."""
    res = await ai_promotion.promote(db, worker_id)
    if not res.get("ok"):
        raise HTTPException(status_code=409, detail=res.get("reason", "not eligible"))
    return res


# ----- Feedback / learning --------------------------------------------------
class FeedbackPayload(BaseModel):
    capability_id: str
    module_code: str
    entity_type: str
    run_id: str | None = None
    rating: str | None = None        # 'up' | 'down'
    input: str = ""
    output: str = ""
    corrected: str | None = None
    comment: str | None = None


@router.post("/feedback")
async def post_feedback(payload: FeedbackPayload, db: AsyncSession = Depends(get_db)):
    return await ai_feedback.record(db, payload.model_dump())


@router.get("/feedback")
async def get_feedback(module_code: str | None = Query(None), limit: int = Query(100, le=500),
                       db: AsyncSession = Depends(get_db)):
    return {"data": await ai_feedback.list_feedback(db, module_code, limit)}


@router.get("/runs")
async def get_runs(limit: int = Query(100, le=1000), module_code: str | None = Query(None),
                   db: AsyncSession = Depends(get_db)):
    return {"data": await ai_runs.list_runs(db, limit=limit, module_code=module_code)}


@router.get("/usage")
async def get_usage(db: AsyncSession = Depends(get_db)):
    return await ai_runs.usage_summary(db)
