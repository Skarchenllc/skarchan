"""Manager worker — multi-agent coordination.

A manager oversees a module's sections. It delegates to each section's specialist
(runs the `ask` capability to pull a status report), then synthesizes an
executive briefing via the `manager_brief` capability. Results persist as
`ai_insights` so they show up alongside other AI output.
"""
import asyncio
import json
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.entity_record import EntityRecord
from . import settings as ai_settings, workers as ai_workers, policy
from .capabilities import CAPABILITIES
from .gateway import run_capability, apply_capability

INSIGHTS_ENTITY = "ai_insights"
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")
MAX_SECTIONS = 4
REPORT_CAP = "ask"  # the capability a section specialist uses to file its status report
MANAGER_ET = "__manager__"    # pseudo-section a unit manager (a first-class worker) is stored under
DIVISION_ET = "__division__"  # pseudo-section a division head is stored under (keyed by division)
ORG_KEY = "__org__"           # pseudo-module the company CEO is stored under
CEO_ET = "__ceo__"            # pseudo-section the CEO is stored under
MAX_UNITS = 4                 # a division dispatch fans out to at most this many unit managers
MAX_DIVISIONS = 4             # an org-wide CEO run fans out to at most this many divisions

# Divisions = the org's business domains (mirror of the frontend nav groups). Each
# division head oversees these unit managers (one per module).
DIVISIONS = {
    "front_office":        {"label": "Front Office",          "modules": ["sales", "contacts", "marketing", "customer-service", "ecommerce"]},
    "finance":             {"label": "Finance",               "modules": ["accounting"]},
    "supply_chain":        {"label": "Supply Chain",          "modules": ["inventory", "scm"]},
    "production":          {"label": "Production",             "modules": ["production", "qms"]},
    "people":              {"label": "People",                "modules": ["hr"]},
    "projects_governance": {"label": "Projects & Governance", "modules": ["pm", "rd", "administration"]},
}
# Capabilities a manager can delegate at the section level (operate on a section,
# not a single hand-picked record). Summarize/extract are record-level → excluded.
DELEGABLE = {"ask", "risk_scan", "create_record", "update_record", "classify"}


async def _plan(db, capability_id: str, *, module_code: str, entity_type: str, context: dict):
    """Run a manager *planning* capability defensively — one retry on a transient
    failure, never raises. Returns (result_dict, cost, error_or_None). This is what
    keeps a single API hiccup from aborting a whole CEO→division→unit cascade."""
    err = None
    for attempt in range(2):
        try:
            out = await run_capability(db, capability_id, module_code=module_code,
                                       entity_type=entity_type, context=context, enforce_gate=False)
            return (out.get("result") or {}), float(out.get("usage", {}).get("cost_usd") or 0), None
        except Exception as e:
            err = str(getattr(e, "detail", None) or e)[:300]
            if "budget" in (err or "").lower():
                break  # budget is terminal — don't retry and burn more
    return {}, 0.0, err


async def run_manager(db: AsyncSession, module_code: str, goal: str | None = None) -> dict:
    all_sections = [s for s in await ai_settings.list_settings(db, module_code)
                    if s.get("enabled") and s.get("module_code") != ai_settings.GLOBAL_MODULE]
    if not all_sections:
        return {"module_code": module_code, "error": "No AI-enabled sections in this module to manage."}

    # Respect worker ownership: a worker is the section's specialist. Match workers
    # to sections tolerantly (entity_type naming varies), and delegate FIRST to
    # sections that have a specialist owning the reporting capability.
    workers = await ai_workers.list_workers(db, module_code)
    by_et = {w["entity_type"]: w for w in workers if w.get("enabled") is not False}
    manager = await ai_workers.get_worker(db, module_code, MANAGER_ET)  # hired unit manager, if any

    def worker_for(entity_type: str):
        for k in ai_settings.variant_keys(module_code, entity_type):
            if k in by_et:
                return by_et[k]
        return None

    def rank(s):
        w = worker_for(s["entity_type"])
        if w and ai_workers.worker_owns(w, REPORT_CAP):
            return 0  # a hired specialist that owns reporting → delegate first
        if w:
            return 1  # has a worker (but doesn't own the report capability)
        return 2      # no specialist
    all_sections.sort(key=rank)
    sections = all_sections[:MAX_SECTIONS]

    # Delegate: ask each section's specialist for a short status report.
    reports, cost, specialists = [], 0.0, []
    for s in sections:
        entity = s["entity_type"]
        w = worker_for(entity)
        owned = bool(w and ai_workers.worker_owns(w, REPORT_CAP))
        header = (f"### {w['name']} ({w.get('role', 'specialist')}), reporting on {entity}"
                  if owned else f"### {entity}")
        if owned:
            specialists.append({"section": entity, "name": w["name"], "role": w.get("role")})
        try:
            out = await run_capability(
                db, REPORT_CAP, module_code=module_code, entity_type=entity,
                context={"question": "In 2-3 bullets: the current state and the single biggest concern for this section right now."},
                enforce_gate=False,
            )
            reports.append(f"{header}\n{(out.get('result') or {}).get('text', '').strip()}")
            cost += float(out.get("usage", {}).get("cost_usd") or 0)
        except Exception as e:
            reports.append(f"{header}\n(could not get a report: {e})")

    # Synthesize the manager briefing — tell it which specialists reported so it
    # can delegate back to them by name.
    specialist_note = ("You oversee these specialists: "
                       + "; ".join(f"{x['name']} ({x['role']}) for {x['section']}" for x in specialists)
                       + ". Address delegations to them by name where relevant.\n\n") if specialists else ""
    brief, brief_cost, brief_err = await _plan(
        db, "manager_brief", module_code=module_code, entity_type=MANAGER_ET,
        context={"goal": goal, "data": specialist_note + "\n\n".join(reports)})
    cost += brief_cost
    if brief_err and not brief:
        brief = {"summary": f"Briefing synthesis unavailable ({brief_err}). Section reports were gathered.",
                 "priorities": [], "risks": [], "delegations": []}

    rec = EntityRecord(
        entity_type=INSIGHTS_ENTITY, module_code="core",
        data={
            "module_code": module_code, "entity_type": "__manager__",
            "capability_id": "manager_brief", "summary": brief.get("summary", ""),
            "findings": brief.get("risks", []),
            "priorities": brief.get("priorities", []),
            "delegations": brief.get("delegations", []),
            "severity_max": _max_sev(brief.get("risks", [])),
        },
        organization_id=DEFAULT_ORG_ID, created_by=SYSTEM_USER_ID, last_modified_by=SYSTEM_USER_ID,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    return {"module_code": module_code, "sections_reviewed": [s["entity_type"] for s in sections],
            "specialists": specialists, "manager": (manager or {}).get("name"),
            "manager_role": (manager or {}).get("role"), "brief": brief,
            "insight_id": str(rec.id), "cost_usd": round(cost, 6)}


async def _available_caps(db, module_code, entity_type, worker):
    """Delegable capabilities enabled for a section (and owned by its expert, if curated)."""
    owned = (worker or {}).get("capabilities") or []
    out = []
    for cid in DELEGABLE:
        cap = CAPABILITIES.get(cid)
        if not cap:
            continue
        if not ("*" in cap.applies_to or entity_type in cap.applies_to):
            continue
        if owned and cid not in owned:
            continue
        if not await ai_settings.is_capability_enabled(db, module_code, entity_type, cid):
            continue
        out.append(cap)
    return out


async def delegate(db: AsyncSession, module_code: str, instruction: str, section: str | None = None,
                   synthesize: bool = True) -> dict:
    """Instruct the unit manager: it plans the work, assigns each task to a section
    expert, and the experts run it. Reads return findings; writes route through the
    confidence×risk policy (auto-apply / queue for review / block). When `section`
    is given, scope the work to that one section's specialist (third-level direct).
    When `synthesize` is True, ends with one decision note from the specialists'
    reports (set False when a higher tier will do the final synthesis)."""
    instruction = (instruction or "").strip()
    if not instruction:
        return {"module_code": module_code, "error": "Give the manager an instruction."}
    sections = [s for s in await ai_settings.list_settings(db, module_code)
                if s.get("enabled") and s.get("module_code") != ai_settings.GLOBAL_MODULE]
    if section:
        sections = [s for s in sections if s["entity_type"] == section]
        if not sections:
            return {"module_code": module_code, "error": "That section isn’t AI-enabled."}
    if not sections:
        # No section experts to delegate to → the manager answers directly from its
        # own expertise (a discussion/advice), so you can still talk to it.
        manager = await ai_workers.get_worker(db, module_code, MANAGER_ET)
        res, c, err = await _plan(
            db, "synthesize", module_code=module_code, entity_type=MANAGER_ET,
            context={"goal": instruction,
                     "reports": "(This department has no AI-enabled sections, so no record-level data was gathered. "
                                "Answer the leader from your own expertise as this department's manager, and clearly "
                                "flag what data or sections would need to be enabled to give a stronger, data-backed answer.)"})
        return {"module_code": module_code, "instruction": instruction,
                "manager": (manager or {}).get("name"), "manager_role": (manager or {}).get("role"),
                "manager_avatar": (manager or {}).get("avatar"),
                "summary": ((res or {}).get("summary") or "") if not err else f"Couldn’t respond: {err}",
                "steps": [], "report": (res if (res and not err) else None), "report_input": "", "cost_usd": round(c, 6)}

    workers = await ai_workers.list_workers(db, module_code)
    by_et = {w["entity_type"]: w for w in workers if w.get("enabled") is not False}
    manager = await ai_workers.get_worker(db, module_code, MANAGER_ET)  # the hired unit manager, if any

    def worker_for(entity_type: str):
        for k in ai_settings.variant_keys(module_code, entity_type):
            if k in by_et:
                return by_et[k]
        return None

    # Build the roster the planner assigns against + the allow-list it's validated by.
    roster_lines, allowed = [], {}
    for s in sections:
        et = s["entity_type"]
        w = worker_for(et)
        caps = await _available_caps(db, module_code, et, w)
        if not caps:
            continue
        allowed[et] = {c.id for c in caps}
        who = f"{w['name']} ({w.get('role', 'specialist')})" if w else "section staff"
        roster_lines.append(f'- section "{et}" — expert: {who} | capabilities: ' + ", ".join(sorted(c.id for c in caps)))
    if not allowed:
        return {"module_code": module_code, "error": "No delegable capabilities are enabled in this module."}

    # Graceful gap: exactly one section with exactly one capability → there is
    # nothing for the manager to decide. Run it directly and skip the planning call.
    flat = None
    if len(allowed) == 1:
        only_et = next(iter(allowed))
        if len(allowed[only_et]) == 1:
            flat = (only_et, next(iter(allowed[only_et])))

    if flat:
        plan, cost, plan_err = {"summary": "", "plan": [{"section": flat[0], "capability": flat[1], "instruction": instruction}]}, 0.0, None
    else:
        # 1) Plan: the manager decomposes the instruction into expert tasks.
        plan, cost, plan_err = await _plan(
            db, "manager_delegate", module_code=module_code, entity_type=MANAGER_ET,
            context={"goal": instruction, "roster": "\n".join(roster_lines)})
    if plan_err:
        return {"module_code": module_code, "instruction": instruction,
                "manager": (manager or {}).get("name"), "manager_role": (manager or {}).get("role"),
                "manager_avatar": (manager or {}).get("avatar"),
                "summary": "", "steps": [], "error": f"planning failed: {plan_err}", "cost_usd": round(cost, 6)}

    # 2) Execute each task through its expert (sequential, on the request session).
    mode = await policy.global_mode(db)
    steps_out = []
    for step in (plan.get("plan") or []):
        et, cid = step.get("section"), step.get("capability")
        instr = step.get("instruction") or instruction
        ew = worker_for(et)
        base = {"section": et, "capability": cid, "expert": (ew or {}).get("name"),
                "expert_avatar": (ew or {}).get("avatar"), "reason": step.get("reason")}
        if et not in allowed or cid not in allowed.get(et, set()):
            steps_out.append({**base, "status": "skipped", "detail": "not in this unit's roster"})
            continue
        is_action = cid in policy.ACTION_CAPS
        try:
            out = await run_capability(
                db, cid, module_code=module_code, entity_type=et,
                context={"question": instr, "input": instr, "text": instr},
                enforce_gate=True, dry_run=is_action)
        except Exception as e:
            steps_out.append({**base, "status": "failed", "detail": str(getattr(e, "detail", None) or e)[:300]})
            continue
        cost += float(out.get("usage", {}).get("cost_usd") or 0)

        if not is_action:
            res = out.get("result") or {}
            text = res.get("text") if isinstance(res, dict) and res.get("text") else json.dumps(res, ensure_ascii=False)
            steps_out.append({**base, "kind": "read", "status": "done", "result": (text or "")[:1500]})
            continue

        # Write task → confidence×risk policy decides what happens.
        autonomy = out.get("autonomy") or "suggest"
        decision, why = policy.decide(autonomy, "high", mode)
        if decision == "auto":
            await apply_capability(db, cid, module_code=module_code, entity_type=et,
                                   result=out.get("result") or {}, context={"input": instr}, enforce_gate=False)
            steps_out.append({**base, "kind": "write", "status": "applied", "decision": decision})
        elif decision == "review":
            rid = (out.get("result") or {}).get("record_id")  # update has a target; create doesn't
            db.add(EntityRecord(
                entity_type="ai_jobs", module_code="automation",
                data={
                    "name": f"Manager · {cid} → {et}", "capability": cid,
                    "module_code": module_code, "entity_type": et,
                    "record_id": str(rid) if rid else None,
                    "proposed_draft": out.get("result") or {},
                    "status": "Pending Review", "autonomy": autonomy, "risk": "high",
                    "decision": decision, "decision_reason": why,
                    "source_automation": f"manager:{module_code}",
                    "queued_at": datetime.utcnow().isoformat(),
                },
                organization_id=DEFAULT_ORG_ID, created_by=SYSTEM_USER_ID, last_modified_by=SYSTEM_USER_ID))
            steps_out.append({**base, "kind": "write", "status": "pending review", "decision": decision})
        else:
            steps_out.append({**base, "kind": "write", "status": "blocked", "decision": decision})

    await db.commit()

    # Final synthesis — one decision note from the specialists' reports.
    report, report_input = None, ""
    if synthesize:
        bits = [f"[{s.get('expert') or s.get('section')}] {s.get('result', '')}"
                for s in steps_out if s.get("kind") == "read" and s.get("result")]
        report_input = "\n\n".join(bits)[:12000]
        if report_input:
            res, c, err = await _plan(db, "synthesize", module_code=module_code, entity_type=MANAGER_ET,
                                      context={"goal": instruction, "reports": report_input})
            cost += c
            if not err and res:
                report = res

    return {"module_code": module_code, "instruction": instruction,
            "manager": (manager or {}).get("name"), "manager_role": (manager or {}).get("role"),
            "manager_avatar": (manager or {}).get("avatar"),
            "summary": plan.get("summary", ""), "steps": steps_out, "report": report,
            "report_input": report_input, "cost_usd": round(cost, 6)}


async def _module_has_ai(db, module_code) -> bool:
    return any(s.get("enabled") for s in await ai_settings.list_settings(db, module_code))


async def division_roster(db: AsyncSession, division: str) -> list[dict]:
    """The units (modules) of a division that have AI enabled, with their unit manager + head."""
    div = DIVISIONS.get(division)
    if not div:
        return []
    out = []
    for mc in div["modules"]:
        if not await _module_has_ai(db, mc):
            continue
        mgr = await ai_workers.get_worker(db, mc, MANAGER_ET)
        sections = [s["entity_type"] for s in await ai_settings.list_settings(db, mc) if s.get("enabled")]
        out.append({"module": mc, "manager": (mgr or {}).get("name"),
                    "manager_role": (mgr or {}).get("role"), "sections": sections})
    return out


async def dispatch(db: AsyncSession, division: str, instruction: str) -> dict:
    """Manager-to-manager: a division head routes the instruction to the right unit
    managers, each of which delegates down to its section experts."""
    instruction = (instruction or "").strip()
    div = DIVISIONS.get(division)
    if not div:
        return {"division": division, "error": "Unknown division."}
    if not instruction:
        return {"division": division, "error": "Give the division head an instruction."}

    units = await division_roster(db, division)
    if not units:
        return {"division": division, "label": div["label"], "error": "No AI-enabled units in this division yet."}

    head = await ai_workers.get_worker(db, division, DIVISION_ET)  # division head persona, if hired

    # Graceful gap: a single unit means the head has nothing to route between.
    # Skip its planning call and forward the instruction straight to that unit.
    if len(units) == 1:
        u = units[0]
        try:
            r = await delegate(db, u["module"], instruction)
        except Exception as e:
            r = {"error": str(getattr(e, "detail", None) or e)[:200]}
        return {"division": division, "label": div["label"], "instruction": instruction,
                "head": (head or {}).get("name"), "head_role": (head or {}).get("role"),
                "summary": r.get("summary", ""), "collapsed": "single-unit",
                "units": [{"module": u["module"], "manager": r.get("manager"), "instruction": instruction,
                           "summary": r.get("summary"), "steps": r.get("steps"), "error": r.get("error")}],
                "cost_usd": round(float(r.get("cost_usd") or 0), 6)}

    roster_lines = []
    avail = set()
    for u in units:
        avail.add(u["module"])
        who = f"{u['manager']} ({u['manager_role'] or 'manager'})" if u["manager"] else "unit manager"
        roster_lines.append(f'- unit "{u["module"]}" — manager: {who} | covers: ' + ", ".join(u["sections"][:8]))

    # 1) Division head plans which units handle what.
    plan, cost, plan_err = await _plan(
        db, "manager_dispatch", module_code=division, entity_type=DIVISION_ET,
        context={"goal": instruction, "roster": "\n".join(roster_lines)})
    if plan_err:
        return {"division": division, "label": div["label"], "instruction": instruction,
                "head": (head or {}).get("name"), "head_role": (head or {}).get("role"),
                "summary": "", "units": [], "error": f"planning failed: {plan_err}", "cost_usd": round(cost, 6)}

    # 2) Each assigned unit manager delegates down to its experts.
    unit_results = []
    for a in (plan.get("assignments") or [])[:MAX_UNITS]:
        mc, sub = a.get("module"), (a.get("instruction") or instruction)
        if mc not in avail:
            unit_results.append({"module": mc, "status": "skipped", "detail": "not in this division",
                                 "reason": a.get("reason")})
            continue
        try:
            r = await delegate(db, mc, sub)
        except Exception as e:
            r = {"error": str(getattr(e, "detail", None) or e)[:200]}
        cost += float(r.get("cost_usd") or 0)
        unit_results.append({"module": mc, "manager": r.get("manager"), "instruction": sub,
                             "reason": a.get("reason"), "summary": r.get("summary"),
                             "steps": r.get("steps"), "error": r.get("error")})

    return {"division": division, "label": div["label"], "instruction": instruction,
            "head": (head or {}).get("name"), "head_role": (head or {}).get("role"),
            "summary": plan.get("summary", ""), "units": unit_results, "cost_usd": round(cost, 6)}


async def _ai_enabled_modules(db) -> list[str]:
    """Distinct departments (modules) with at least one AI-enabled section, stable order."""
    seen: list[str] = []
    for s in await ai_settings.list_settings(db):
        mc = s.get("module_code")
        if mc and mc != ai_settings.GLOBAL_MODULE and s.get("enabled") and mc not in seen:
            seen.append(mc)
    return seen


async def run_org(db: AsyncSession, instruction: str) -> dict:
    """Company-wide: the CEO sets direction and delegates straight to the department
    managers, who run their section specialists. Three tiers — CEO → manager → specialist."""
    instruction = (instruction or "").strip()
    if not instruction:
        return {"error": "Give the CEO an instruction."}

    # Roster: every department that has AI-enabled sections OR a manager (so the CEO
    # can route to back-office managers too — they answer from their own expertise).
    enabled_mods = await _ai_enabled_modules(db)
    mgr_mods = [w["module_code"] for w in await ai_workers.list_workers(db)
                if w.get("entity_type") == MANAGER_ET and w.get("enabled") is not False]
    all_mods = list(dict.fromkeys([*enabled_mods, *[m for m in mgr_mods if m not in enabled_mods]]))
    depts = []
    for mc in all_mods:
        mgr = await ai_workers.get_worker(db, mc, MANAGER_ET)
        sections = [s["entity_type"] for s in await ai_settings.list_settings(db, mc) if s.get("enabled")]
        depts.append({"module": mc, "manager": (mgr or {}).get("name"),
                      "manager_role": (mgr or {}).get("role"), "sections": sections})
    if not depts:
        return {"error": "No departments with a manager or AI-enabled sections yet."}

    ceo = await ai_workers.get_worker(db, ORG_KEY, CEO_ET)  # hired CEO persona, if any

    # Graceful gap: a single department → nothing for the CEO to coordinate;
    # forward straight to that department's manager.
    if len(depts) == 1:
        mc = depts[0]["module"]
        try:
            r = await delegate(db, mc, instruction)
        except Exception as e:
            r = {"error": str(getattr(e, "detail", None) or e)[:200]}
        return {"ceo": (ceo or {}).get("name"), "ceo_role": (ceo or {}).get("role"), "ceo_avatar": (ceo or {}).get("avatar"),
                "instruction": instruction, "summary": r.get("summary", ""), "collapsed": "single-department",
                "report": r.get("report"), "report_input": r.get("report_input", ""),
                "departments": [{"module": mc, "manager": r.get("manager"), "manager_avatar": r.get("manager_avatar"),
                                 "instruction": instruction, "summary": r.get("summary"), "steps": r.get("steps"), "error": r.get("error")}],
                "cost_usd": round(float(r.get("cost_usd") or 0), 6)}

    # 1) CEO plans which departments handle what.
    roster_lines, avail = [], set()
    for u in depts:
        avail.add(u["module"])
        who = f"{u['manager']} ({u['manager_role'] or 'manager'})" if u["manager"] else "department manager"
        covers = ", ".join(u["sections"][:8]) if u["sections"] else "advisory only (no enabled data sections — answers from expertise)"
        roster_lines.append(f'- department "{u["module"]}" — manager: {who} | covers: {covers}')

    plan, cost, plan_err = await _plan(
        db, "manager_ceo", module_code=ORG_KEY, entity_type=CEO_ET,
        context={"goal": instruction, "roster": "\n".join(roster_lines)})
    if plan_err:
        return {"ceo": (ceo or {}).get("name"), "ceo_role": (ceo or {}).get("role"), "ceo_avatar": (ceo or {}).get("avatar"),
                "instruction": instruction, "summary": "", "departments": [],
                "error": f"planning failed: {plan_err}", "cost_usd": round(cost, 6)}

    # 2) Each assigned department manager delegates down to its specialists.
    dept_results = []
    for a in (plan.get("assignments") or [])[:MAX_DIVISIONS]:
        mc, sub = a.get("department"), (a.get("instruction") or instruction)
        if mc not in avail:
            dept_results.append({"module": mc, "status": "skipped", "detail": "not an AI-enabled department",
                                 "reason": a.get("reason")})
            continue
        try:
            r = await delegate(db, mc, sub, synthesize=False)  # CEO does the single org-wide synthesis below
        except Exception as e:
            r = {"error": str(getattr(e, "detail", None) or e)[:200]}
        cost += float(r.get("cost_usd") or 0)
        dept_results.append({"module": mc, "manager": r.get("manager"), "manager_avatar": r.get("manager_avatar"),
                             "instruction": sub, "reason": a.get("reason"), "summary": r.get("summary"),
                             "steps": r.get("steps"), "error": r.get("error")})

    # Final synthesis — one company-wide decision note from every department's reports.
    report, report_input = None, ""
    bits = []
    for d in dept_results:
        for s in (d.get("steps") or []):
            if s.get("kind") == "read" and s.get("result"):
                bits.append(f"[{d.get('module')} · {s.get('expert') or s.get('section')}] {s.get('result', '')}")
        if d.get("summary"):
            bits.append(f"[{d.get('module')} manager] {d.get('summary')}")
    report_input = "\n\n".join(bits)[:14000]
    if report_input:
        res, c, err = await _plan(db, "synthesize", module_code=ORG_KEY, entity_type=CEO_ET,
                                  context={"goal": instruction, "reports": report_input})
        cost += c
        if not err and res:
            report = res

    return {"ceo": (ceo or {}).get("name"), "ceo_role": (ceo or {}).get("role"), "ceo_avatar": (ceo or {}).get("avatar"),
            "instruction": instruction, "summary": plan.get("summary", ""),
            "departments": dept_results, "report": report, "report_input": report_input,
            "cost_usd": round(cost, 6)}


async def ceo_standup(db: AsyncSession) -> dict:
    """Scheduled daily CEO standup — runs the standing org-wide instruction, records
    the result as an Inbox insight, and notifies. Writes still go to AI Jobs review."""
    gov = await ai_settings.get_global(db)
    instruction = gov.get("ceo_standup_instruction") or "Run a company-wide standup of the most urgent risks."
    result = await run_org(db, instruction)
    if result.get("error"):
        return result

    departments = result.get("departments") or []
    pending = sum(1 for dp in departments for s in (dp.get("steps") or [])
                  if s.get("status") == "pending review")
    findings = [{"title": f"{dp.get('module')}", "severity": "medium",
                 "recommendation": dp.get("summary", "")} for dp in departments if dp.get("summary")]
    summary = result.get("summary", "")
    if pending:
        summary = f"{summary} ({pending} write{'s' if pending != 1 else ''} queued for your review.)"

    rec = EntityRecord(
        entity_type=INSIGHTS_ENTITY, module_code="core",
        data={
            "module_code": ORG_KEY, "entity_type": CEO_ET, "capability_id": "ceo_standup",
            "summary": summary, "findings": findings, "severity_max": "medium" if findings else None,
            "pending": pending, "cost_usd": result.get("cost_usd"),
        },
        organization_id=DEFAULT_ORG_ID, created_by=SYSTEM_USER_ID, last_modified_by=SYSTEM_USER_ID)
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    try:
        from . import notify as ai_notify
        await ai_notify.notify_users(
            db, title=f"🏢 CEO standup — {result.get('ceo') or 'the CEO'}",
            message=summary, category="info", priority="normal",
            resource_url="/nexacore/ai/inbox", group="ai-standup")
    except Exception:
        pass

    return {"insight_id": str(rec.id), "pending": pending, "cost_usd": result.get("cost_usd"),
            "departments": len(departments)}


_SEV = {"low": 1, "medium": 2, "high": 3}


def _max_sev(risks: list[dict]) -> str | None:
    sev = [r.get("severity") for r in risks if r.get("severity")]
    return max(sev, key=lambda s: _SEV.get(s, 0)) if sev else None
