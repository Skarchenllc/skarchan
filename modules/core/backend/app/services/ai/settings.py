"""AI settings — the per-(module, section) toggles that gate capabilities.

Stored as entity_records of type 'ai_settings'. One row per (module_code,
entity_type):

    {
      "module_code": "pm",
      "entity_type": "pm_projects",
      "enabled": true,
      "model_tier": "reasoning",            # optional override
      "capabilities": {                      # optional per-capability overrides
        "project_auto_plan": {"enabled": true, "autonomy": "auto"}
      }
    }

If a capability has no explicit entry, it inherits the section's `enabled`.
"""
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SETTINGS_ENTITY = "ai_settings"
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")


async def _all_rows(db: AsyncSession) -> list[EntityRecord]:
    q = select(EntityRecord).where(
        EntityRecord.entity_type == SETTINGS_ENTITY,
        EntityRecord.is_deleted == "N",
    )
    return list((await db.execute(q)).scalars().all())


async def list_settings(db: AsyncSession, module_code: str | None = None) -> list[dict]:
    rows = await _all_rows(db)
    out = []
    for r in rows:
        d = r.data or {}
        if module_code and d.get("module_code") != module_code:
            continue
        out.append({"id": str(r.id), **d})
    return out


async def get_setting(db: AsyncSession, module_code: str, entity_type: str) -> EntityRecord | None:
    for r in await _all_rows(db):
        d = r.data or {}
        if d.get("module_code") == module_code and d.get("entity_type") == entity_type:
            return r
    return None


async def upsert_setting(db: AsyncSession, payload: dict, actor: uuid.UUID | None = None) -> dict:
    actor = actor or SYSTEM_USER_ID
    module_code = payload.get("module_code")
    entity_type = payload.get("entity_type")
    if not module_code or not entity_type:
        raise ValueError("module_code and entity_type are required")

    data = {
        "module_code": module_code,
        "entity_type": entity_type,
        "enabled": bool(payload.get("enabled", False)),
        "model_tier": payload.get("model_tier"),
        "capabilities": payload.get("capabilities", {}) or {},
    }

    existing = await get_setting(db, module_code, entity_type)
    if existing:
        existing.data = data
        existing.last_modified_by = actor
        existing.last_modified_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return {"id": str(existing.id), **data}

    rec = EntityRecord(
        entity_type=SETTINGS_ENTITY, module_code="core", data=data,
        organization_id=DEFAULT_ORG_ID, created_by=actor, last_modified_by=actor,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return {"id": str(rec.id), **data}


async def bulk_set(db: AsyncSession, module_code: str, entity_types: list[str],
                   enabled: bool, actor: uuid.UUID | None = None) -> int:
    """Enable/disable AI for many sections of a module at once. Returns count changed."""
    n = 0
    for et in entity_types:
        await upsert_setting(db, {"module_code": module_code, "entity_type": et, "enabled": enabled}, actor)
        n += 1
    return n


def variant_keys(module_code: str, entity_type: str) -> list[str]:
    """Section identifiers that refer to the same section across naming conventions.

    Pages and the registry sometimes name the same section differently
    (e.g. 'sales_accounts' ↔ 'accounts', 'pm_projects' ↔ 'projects'), and toggles
    are stored inconsistently — some prefixed ('marketing_leads'), some bare
    ('contents'). Matching is therefore symmetric: we both STRIP the module
    prefix/suffix to the bare name AND re-ADD it, so a bare query matches a stored
    prefixed toggle and vice-versa. It stays section-specific (the caller also
    pins d.module_code == module_code), so there is no module-wide spill.
    """
    suffix = f"_{module_code}"
    prefix = f"{module_code}_"
    forms = {entity_type}
    # Strip the module prefix/suffix to a bare section name.
    if entity_type.endswith(suffix) and len(entity_type) > len(suffix):
        forms.add(entity_type[: -len(suffix)])
    if entity_type.startswith(prefix) and len(entity_type) > len(prefix):
        forms.add(entity_type[len(prefix):])
    # Re-add the prefixed/suffixed forms of every bare candidate (e.g. 'leads' →
    # 'marketing_leads') so either storage convention resolves to the same toggle.
    for f in list(forms):
        forms.add(f"{prefix}{f}")
        forms.add(f"{f}{suffix}")
    return list(forms)


async def _enabled_row_for(db: AsyncSession, module_code: str, entity_type: str) -> dict | None:
    variants = set(variant_keys(module_code, entity_type))
    for r in await _all_rows(db):
        d = r.data or {}
        if d.get("module_code") == module_code and d.get("entity_type") in variants and d.get("enabled"):
            return d
    return None


async def is_capability_enabled(db: AsyncSession, module_code: str, entity_type: str,
                                capability_id: str) -> bool:
    d = await _enabled_row_for(db, module_code, entity_type)
    if not d:
        return False
    cap_cfg = (d.get("capabilities") or {}).get(capability_id)
    if cap_cfg is not None and "enabled" in cap_cfg:
        return bool(cap_cfg["enabled"])
    return True  # inherit section-level enabled


# --- Global governance config (master switch + monthly budget) -------------
GLOBAL_MODULE = "__global__"

DEFAULT_STANDUP = ("Run a company-wide standup: surface the most urgent risks and issues across the "
                   "business right now, and queue any tracking records or follow-ups that need attention.")


async def get_global(db: AsyncSession) -> dict:
    row = await get_setting(db, GLOBAL_MODULE, GLOBAL_MODULE)
    d = (row.data if row else {}) or {}
    return {
        "enabled": d.get("enabled", True),               # master kill switch (default on)
        "monthly_budget_usd": float(d.get("monthly_budget_usd", 0) or 0),  # 0 = unlimited
        # Access policy: who may run write actions / approve+admin. 'any_user' | 'admin'.
        "writes_require": d.get("writes_require", "any_user"),
        "approvals_require": d.get("approvals_require", "admin"),
        # Confidence×risk routing for AI actions: 'trust' | 'review_all' | 'auto_all'.
        "policy_mode": d.get("policy_mode", "trust"),
        # Whether the background scheduler drains the ai_jobs queue automatically.
        "ai_jobs_auto": bool(d.get("ai_jobs_auto", False)),
        # Daily CEO standup: the scheduler runs an org-wide CEO instruction on a cadence.
        "ceo_standup_enabled": bool(d.get("ceo_standup_enabled", False)),
        "ceo_standup_instruction": d.get("ceo_standup_instruction") or DEFAULT_STANDUP,
        "ceo_standup_interval_hours": float(d.get("ceo_standup_interval_hours", 24) or 24),
    }


async def update_global(db: AsyncSession, patch: dict, actor: uuid.UUID | None = None) -> dict:
    """Read-modify-write the single global config row (preserves other keys)."""
    actor = actor or SYSTEM_USER_ID
    existing = await get_setting(db, GLOBAL_MODULE, GLOBAL_MODULE)
    data = dict((existing.data if existing else {}) or {})
    data.update({"module_code": GLOBAL_MODULE, "entity_type": GLOBAL_MODULE})
    data.update(patch)
    if existing:
        existing.data = data
        existing.last_modified_by = actor
        existing.last_modified_at = datetime.utcnow()
    else:
        db.add(EntityRecord(
            entity_type=SETTINGS_ENTITY, module_code="core", data=data,
            organization_id=DEFAULT_ORG_ID, created_by=actor, last_modified_by=actor,
        ))
    await db.commit()
    return await get_global(db)


async def set_global(db: AsyncSession, payload: dict, actor: uuid.UUID | None = None) -> dict:
    return await update_global(db, {
        "enabled": bool(payload.get("enabled", True)),
        "monthly_budget_usd": float(payload.get("monthly_budget_usd", 0) or 0),
    }, actor)


async def set_access(db: AsyncSession, payload: dict, actor: uuid.UUID | None = None) -> dict:
    patch = {}
    if payload.get("writes_require") in ("any_user", "admin"):
        patch["writes_require"] = payload["writes_require"]
    if payload.get("approvals_require") in ("any_user", "admin"):
        patch["approvals_require"] = payload["approvals_require"]
    return await update_global(db, patch, actor)


async def set_policy_mode(db: AsyncSession, mode: str, actor: uuid.UUID | None = None) -> dict:
    """Set the confidence×risk routing mode: 'trust' | 'review_all' | 'auto_all'."""
    if mode not in ("trust", "review_all", "auto_all"):
        raise ValueError("mode must be trust | review_all | auto_all")
    return await update_global(db, {"policy_mode": mode}, actor)


async def set_jobs_auto(db: AsyncSession, enabled: bool, actor: uuid.UUID | None = None) -> dict:
    """Turn automatic draining of the ai_jobs queue (by the scheduler) on/off."""
    return await update_global(db, {"ai_jobs_auto": bool(enabled)}, actor)


async def set_ceo_standup(db: AsyncSession, payload: dict, actor: uuid.UUID | None = None) -> dict:
    """Configure the scheduled daily CEO standup (enabled / instruction / interval)."""
    patch: dict = {}
    if "enabled" in payload:
        patch["ceo_standup_enabled"] = bool(payload["enabled"])
    if payload.get("instruction"):
        patch["ceo_standup_instruction"] = str(payload["instruction"])[:1000]
    if payload.get("interval_hours"):
        patch["ceo_standup_interval_hours"] = max(1.0, float(payload["interval_hours"]))
    return await update_global(db, patch, actor)


async def resolved_model_tier(db: AsyncSession, module_code: str, entity_type: str,
                              capability_id: str) -> str | None:
    d = await _enabled_row_for(db, module_code, entity_type)
    if not d:
        return None
    cap_cfg = (d.get("capabilities") or {}).get(capability_id) or {}
    return cap_cfg.get("model_tier") or d.get("model_tier")


async def resolved_autonomy(db: AsyncSession, module_code: str, entity_type: str,
                            capability_id: str) -> str | None:
    """The per-capability autonomy override set on the Sections page, if any.
    Highest precedence in the chain section-override → worker → capability default."""
    d = await _enabled_row_for(db, module_code, entity_type)
    if not d:
        return None
    a = ((d.get("capabilities") or {}).get(capability_id) or {}).get("autonomy")
    return a if a in ("suggest", "review", "auto") else None
