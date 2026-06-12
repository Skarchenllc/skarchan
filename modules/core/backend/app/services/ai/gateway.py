"""AI Gateway — the single engine that talks to Claude.

`run_capability` is the one entry point every module uses. It resolves the
capability, enforces the section toggle, calls Claude (structured output when
the capability defines a schema), runs the output handler, and meters the run.
This is the *only* module that imports `anthropic`.
"""
import json
import time
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from . import (config, settings as ai_settings, runs as ai_runs, knowledge,
               workers as ai_workers, feedback as ai_feedback, specialist as ai_specialist,
               fielddefs)
from .capabilities import get_capability
from .handlers import HANDLERS

SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000000"

# Org-chart pseudo entity_types (a worker's "slot").
_MANAGER_ET = "__manager__"
_DIVISION_ET = "__division__"
_CEO_ET = "__ceo__"
_ORG_KEY = "__org__"
_PSEUDO_ETS = {_MANAGER_ET, _DIVISION_ET, _CEO_ET}


def _coerce_uuid(value, fallback: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(value)) if value else uuid.UUID(fallback)
    except (ValueError, TypeError):
        return uuid.UUID(fallback)


async def _acting_worker(db: AsyncSession, module_code: str, entity_type: str):
    """The worker whose persona + trust govern this call, with fallback UP the org
    chain so a higher tier can stand in for a missing lower one. For a real section
    with no specialist: department manager → CEO. This is what lets one engine run
    1-level (CEO does everything), 2-level (manager is its dept's specialist), or
    3-level (a real specialist). Returns (worker_or_None, is_direct)."""
    w = await ai_workers.get_worker(db, module_code, entity_type)
    if w:
        return w, True
    if entity_type not in _PSEUDO_ETS:  # only real sections fall back up the chain
        mgr = await ai_workers.get_worker(db, module_code, _MANAGER_ET)
        if mgr:
            return mgr, False
        ceo = await ai_workers.get_worker(db, _ORG_KEY, _CEO_ET)
        if ceo:
            return ceo, False
    return None, False


async def run_capability(db: AsyncSession, capability_id: str, *, module_code: str,
                         entity_type: str, context: dict, actor_raw=None, org_raw=None,
                         enforce_gate: bool = True, model_override: str | None = None,
                         dry_run: bool = False) -> dict:
    cap = get_capability(capability_id)
    if not cap:
        raise HTTPException(status_code=404, detail=f"Unknown capability '{capability_id}'.")

    if enforce_gate and not await ai_settings.is_capability_enabled(db, module_code, entity_type, capability_id):
        raise HTTPException(
            status_code=403,
            detail=f"AI capability '{capability_id}' is not enabled for {module_code}/{entity_type}. "
                   f"Enable it in nexacore › AI Management.",
        )

    # Governance: master kill switch + monthly budget ceiling (applies to all runs).
    gov = await ai_settings.get_global(db)
    if not gov["enabled"]:
        raise HTTPException(status_code=403, detail="AI is globally disabled (master switch off in AI Management).")
    if gov["monthly_budget_usd"] > 0:
        spent = await ai_runs.month_spend(db)
        if spent >= gov["monthly_budget_usd"]:
            raise HTTPException(
                status_code=429,
                detail=f"Monthly AI budget reached (${spent:.2f} / ${gov['monthly_budget_usd']:.2f}). "
                       f"Raise it in AI Management to continue.",
            )

    # Narrow specialist short-circuit: if a trained classifier is confident, answer
    # without calling Claude (faster + free). Claude is the cold-start fallback.
    if cap.id == "classify" and not dry_run:
        text = context.get("input") or context.get("text") or context.get("question") or ""
        pred = ai_specialist.predict(module_code, entity_type, text)
        if pred:
            actor_p = _coerce_uuid(actor_raw, SYSTEM_USER_ID)
            org_p = _coerce_uuid(org_raw, DEFAULT_ORG_ID)
            run_id = await ai_runs.log_run(
                db, capability_id=cap.id, module_code=module_code, entity_type=entity_type,
                model="specialist-knn", status="success",
                usage={"input_tokens": 0, "output_tokens": 0, "cost_usd": 0}, latency_ms=0,
                actor=actor_p, org=org_p)
            return {
                "capability": cap.id, "run_id": run_id, "worker": None,
                "model": "specialist-knn", "autonomy": cap.autonomy_default, "applied": False,
                "result": {"text": pred["label"]},
                "specialist": pred, "citations": [],
                "usage": {"input_tokens": 0, "output_tokens": 0, "cost_usd": 0}, "latency_ms": 0,
            }

    api_key = config.resolve_api_key()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY is not configured on the backend. Set a real key in .env "
                   "and restart the core-backend service.",
        )

    try:
        import anthropic
    except ImportError:
        raise HTTPException(status_code=500, detail="The 'anthropic' package is not installed in the backend.")

    # Model: explicit override → section/capability tier → capability default tier.
    tier = model_override or await ai_settings.resolved_model_tier(db, module_code, entity_type, capability_id)
    model = config.resolve_model(tier or cap.model_tier)

    actor = _coerce_uuid(actor_raw, SYSTEM_USER_ID)
    org = _coerce_uuid(org_raw, DEFAULT_ORG_ID)

    # Action capabilities need the section's field schema to draft a record.
    if cap.needs_fields:
        fields = await fielddefs.get_fields(db, entity_type)
        context = {**context, "fields_desc": fielddefs.describe_fields(fields)}

    # Retrieval-augmented capabilities are grounded in this section's records.
    # When a single current record is supplied (record-detail Update), skip the
    # search and act on that record directly.
    citations: list[dict] = []
    if context.get("current_record"):
        context = {**context, "data": str(context["current_record"])}
    elif cap.needs_retrieval:
        question = context.get("question") or context.get("input") or context.get("text") or ""
        retrieved, citations = await knowledge.retrieve(
            db, module_code=module_code, entity_type=entity_type, question=question,
        )
        context = {**context, "data": retrieved}

    user_text = cap.render_input(context)

    # Compose the system prompt: worker persona (in-character) + capability prompt
    # + learned golden examples (dynamic few-shot from human feedback).
    system_text = cap.system_prompt
    # Resolve the acting worker with fallback UP the org chain (specialist → manager
    # → CEO), so a higher tier can perform as the specialist when no lower one exists.
    worker, is_direct = await _acting_worker(db, module_code, entity_type)
    # A *direct* worker only acts on the capabilities it owns (curated set; empty =
    # all). A *fallback* stand-in (manager/CEO) is the dept/company catch-all → applies.
    owns = ai_workers.worker_owns(worker, capability_id) if is_direct else bool(worker)
    if worker and owns:
        system_text = ai_workers.persona_preamble(worker) + "\n\n" + system_text
    # Effective autonomy: per-capability section override → acting worker → default.
    section_autonomy = await ai_settings.resolved_autonomy(db, module_code, entity_type, capability_id)
    worker_autonomy = worker.get("autonomy") if (worker and owns) else None
    effective_autonomy = section_autonomy or worker_autonomy or cap.autonomy_default
    examples = await ai_feedback.golden_examples(
        db, capability_id=cap.id, module_code=module_code, entity_type=entity_type, limit=3)
    if examples:
        ex = "\n\n".join(f"Input:\n{e['input']}\n\nGood output:\n{e['output']}" for e in examples)
        system_text += ("\n\nLearned examples — approved or human-corrected outputs for this exact "
                        "task in this organization. Match their style, format, and quality:\n" + ex)

    # Vision: when an image (e.g. a photographed invoice/receipt) is attached,
    # send it as an image content block alongside the text.
    image = context.get("image")
    if isinstance(image, dict) and image.get("data"):
        user_content = [
            {"type": "image", "source": {"type": "base64",
                                         "media_type": image.get("media_type", "image/jpeg"),
                                         "data": image["data"]}},
            {"type": "text", "text": user_text},
        ]
    else:
        user_content = user_text

    kwargs = {
        "model": model,
        "max_tokens": 16000,
        # Cache the (stable) composed system prompt across invocations.
        "system": [{"type": "text", "text": system_text, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": user_content}],
    }
    # Thinking and effort are only valid on certain models (e.g. Haiku supports
    # neither); add them conditionally so the fast tier doesn't 400.
    if config.supports_thinking(model):
        kwargs["thinking"] = {"type": "adaptive"}
    output_config: dict = {}
    if cap.output_schema is not None:
        output_config["format"] = {"type": "json_schema", "schema": cap.output_schema}
    if config.supports_effort(model):
        output_config["effort"] = "high" if cap.output_schema is not None else "medium"
    if output_config:
        kwargs["output_config"] = output_config

    client = anthropic.Anthropic(api_key=api_key)
    started = time.monotonic()
    try:
        resp = client.messages.create(**kwargs)
    except anthropic.APIStatusError as e:
        await _log_error(db, cap.id, module_code, entity_type, model, actor, org, started, e)
        raise HTTPException(status_code=502, detail=f"Claude API error ({e.status_code}): {getattr(e, 'message', str(e))}")
    except Exception as e:
        await _log_error(db, cap.id, module_code, entity_type, model, actor, org, started, e)
        raise HTTPException(status_code=502, detail=f"AI call failed: {e}")

    latency_ms = int((time.monotonic() - started) * 1000)
    text = next((b.text for b in resp.content if b.type == "text"), None)
    if text is None:
        raise HTTPException(status_code=502, detail="The model returned no content.")

    if cap.output_schema is not None:
        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="The model returned malformed structured output.")
    elif cap.is_action:
        result = _parse_json_object(text)  # action capabilities return a record draft
    else:
        result = {"text": text}

    # Update preview → resolve to a concrete {record_id, label, changes} draft.
    if cap.is_update and dry_run:
        ch = (result.get("changes") if isinstance(result, dict) and "changes" in result
              else (result if isinstance(result, dict) else {})) or {}
        if context.get("record_id"):
            # Record-detail mode: the target record is already known.
            result = {"record_id": context["record_id"], "label": context.get("record_label"), "changes": ch}
        else:
            # List mode: map the cited candidate [n] to its record.
            ref = result.get("reference") if isinstance(result, dict) else None
            cit = next((c for c in citations if c.get("ref") == ref), None)
            result = {"record_id": cit["id"] if cit else None,
                      "label": cit["label"] if cit else None, "changes": ch}

    # Persist / post-process if the capability defines a handler — unless this is
    # a dry run (draft-and-review), in which case we return the raw draft to apply later.
    if cap.handler and not dry_run:
        handler = HANDLERS.get(cap.handler)
        if not handler:
            raise HTTPException(status_code=500, detail=f"Handler '{cap.handler}' is not registered.")
        outcome = await handler(db, result=result, context=context, actor=actor, org=org,
                                module_code=module_code, entity_type=entity_type)
    else:
        outcome = result

    u = resp.usage
    usage = {
        "input_tokens": getattr(u, "input_tokens", 0) or 0,
        "output_tokens": getattr(u, "output_tokens", 0) or 0,
        "cache_read_input_tokens": getattr(u, "cache_read_input_tokens", 0) or 0,
        "cache_creation_input_tokens": getattr(u, "cache_creation_input_tokens", 0) or 0,
    }
    usage["cost_usd"] = config.cost_usd(
        model, usage["input_tokens"], usage["output_tokens"],
        usage["cache_read_input_tokens"], usage["cache_creation_input_tokens"],
    )

    run_id = await ai_runs.log_run(
        db, capability_id=cap.id, module_code=module_code, entity_type=entity_type,
        model=model, status="success", usage=usage, latency_ms=latency_ms, actor=actor, org=org,
    )

    return {
        "capability": cap.id,
        "run_id": run_id,
        "worker": worker.get("name") if (worker and owns) else None,
        "model": model,
        "autonomy": effective_autonomy,
        "applied": bool(cap.handler) and not dry_run,
        "result": outcome,
        "citations": citations,
        "usage": usage,
        "latency_ms": latency_ms,
    }


async def apply_capability(db: AsyncSession, capability_id: str, *, module_code: str,
                           entity_type: str, result: dict, context: dict | None = None,
                           actor_raw=None, org_raw=None, enforce_gate: bool = True) -> dict:
    """Apply a previously-previewed draft via the capability's handler — no model call."""
    cap = get_capability(capability_id)
    if not cap:
        raise HTTPException(status_code=404, detail=f"Unknown capability '{capability_id}'.")
    if not cap.handler:
        raise HTTPException(status_code=400, detail=f"Capability '{capability_id}' produces no applyable changes.")
    if enforce_gate and not await ai_settings.is_capability_enabled(db, module_code, entity_type, capability_id):
        raise HTTPException(status_code=403, detail=f"AI capability '{capability_id}' is not enabled for {module_code}/{entity_type}.")
    gov = await ai_settings.get_global(db)
    if not gov["enabled"]:
        raise HTTPException(status_code=403, detail="AI is globally disabled (master switch off in AI Management).")

    handler = HANDLERS.get(cap.handler)
    if not handler:
        raise HTTPException(status_code=500, detail=f"Handler '{cap.handler}' is not registered.")
    actor = _coerce_uuid(actor_raw, SYSTEM_USER_ID)
    org = _coerce_uuid(org_raw, DEFAULT_ORG_ID)
    outcome = await handler(db, result=result, context=context or {}, actor=actor, org=org,
                            module_code=module_code, entity_type=entity_type)

    await ai_runs.log_run(
        db, capability_id=cap.id, module_code=module_code, entity_type=entity_type,
        model="(apply)", status="applied", usage={}, latency_ms=0, actor=actor, org=org,
    )
    return {"capability": cap.id, "applied": True, "result": outcome}


def _parse_json_object(text: str) -> dict:
    """Extract a JSON object from a model reply, tolerating ```json fences / prose."""
    import re
    t = (text or "").strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t).strip()
    try:
        obj = json.loads(t)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", t, re.DOTALL)
        if not m:
            raise HTTPException(status_code=502, detail="The model did not return a record draft.")
        try:
            obj = json.loads(m.group(0))
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="The model returned an unreadable draft.")
    return obj if isinstance(obj, dict) else {}


async def _log_error(db, cap_id, module_code, entity_type, model, actor, org, started, exc):
    try:
        await ai_runs.log_run(
            db, capability_id=cap_id, module_code=module_code, entity_type=entity_type,
            model=model, status="error", usage={}, latency_ms=int((time.monotonic() - started) * 1000),
            actor=actor, org=org, error=str(exc)[:500],
        )
    except Exception:
        pass
