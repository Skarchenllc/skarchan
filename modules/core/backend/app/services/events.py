"""
Central write-event chokepoint.

Every entity-record write — through ANY path (the `/development/entity-records`
endpoints AND the per-module routers built by `create_entity_router`) — calls
`emit_write()` exactly once, after commit. This is the single seam through which
the automation engine and (later) the AI-governance layer observe data changes.

Design notes:
- `data` / `prev_data` MUST be plaintext. Automation rule conditions compare raw
  field values, so callers pass the pre-encryption dict (or decrypt first via the
  marker-tolerant `core.crypto.decrypt`).
- Fully defensive: never raises into the originating write. `fire_event` already
  does its own commit + rollback; we only add a recursion guard on top.
- A `contextvars` depth counter caps re-entrancy. Engine-internal action writes
  currently bypass this seam (they write directly), so no cascade exists today —
  the guard is a safety net for when rule-chaining routes those writes back here.
"""
from __future__ import annotations

import contextvars
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger(__name__)

# Re-entrancy guard: if an emitted event causes another write that emits again,
# stop the chain after a few hops so a misconfigured rule can't loop forever.
_emit_depth: contextvars.ContextVar[int] = contextvars.ContextVar("emit_depth", default=0)
MAX_DEPTH = 3


async def emit_write(
    db: AsyncSession,
    *,
    event: str,                 # "created" | "updated" | "deleted"
    entity_type: str,
    record_id,
    data: dict,                 # PLAINTEXT current field values
    prev_data: Optional[dict] = None,  # PLAINTEXT previous values (updates)
    module_code: Optional[str] = None,
    actor=None,
) -> None:
    """Fan a single write out to every event subscriber. Never raises."""
    depth = _emit_depth.get()
    if depth >= MAX_DEPTH:
        log.warning("emit_write depth limit (%d) hit for %s/%s — skipping", MAX_DEPTH, entity_type, event)
        return
    token = _emit_depth.set(depth + 1)
    try:
        # 1) Deterministic automation rules (trigger → condition → action).
        try:
            from app.services.automation.engine import fire_event
            await fire_event(db, event, entity_type, record_id, data or {}, prev_data)
        except Exception:  # fire_event is already defensive; belt-and-suspenders
            log.exception("automation fire_event failed for %s/%s", entity_type, event)

        # 2) Marketing lead-scoring side-effect. Previously inlined in the
        #    /development create endpoint; centralized here so module-router
        #    writes get it too.
        if event == "created" and entity_type == "lead_activities":
            try:
                from app.services.marketing.scoring import apply_event
                d = data or {}
                await apply_event(
                    db,
                    d.get("activity_type"),
                    lead_id=d.get("lead_id"),
                    lead_email=d.get("lead_email") or d.get("subject_email"),
                )
            except Exception:
                log.exception("lead scoring failed for record %s", record_id)

        # 3) FUTURE HOOKS — remaining AI-governance steps attach here, in order:
        #    - Action ledger:  append before/after for reversibility + idempotency
        #    - Policy routing: confidence × risk → auto / review / block
        #    Keeping them behind this one seam is the point of this module.
        #
        #    DONE (step 2): AI evaluation now runs as an automation *action* — the
        #    engine's `ai_run` action enqueues an `ai_jobs` record that the AI job
        #    runner (`app.services.ai.jobs.process_ai_jobs`) drains through the
        #    gateway (section-toggle + budget gated) and writes the result back.
        #    It's a rule action (trigger→condition→ai_run), not a blanket seam
        #    dispatch, so each AI call is explicit and conditional. The pending
        #    review gate (auto/review/block) lands with policy routing above.
    finally:
        _emit_depth.reset(token)
