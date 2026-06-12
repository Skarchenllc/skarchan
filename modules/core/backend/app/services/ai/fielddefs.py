"""Field-schema helpers for action capabilities (create_record).

Reads a section's custom field definitions so the model knows which fields a
new record should have, their types, and any allowed options.
"""
import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custom_field import CustomFieldDefinition
from app.models.entity_record import EntityRecord

_REF_LABEL_FIELDS = ["name", "account_name", "company_name", "title", "code",
                     "account_code", "full_name", "project_name", "reference", "number"]

# Never let the model fill these — they're system/audit fields.
_SYSTEM = {"id", "created_at", "created_by", "updated_at", "last_modified_at",
           "last_modified_by", "is_deleted", "deleted_at", "deleted_by", "organization_id"}


async def get_fields(db: AsyncSession, entity_type: str) -> list[dict]:
    q = (select(CustomFieldDefinition)
         .where(CustomFieldDefinition.entity_type == entity_type)
         .order_by(CustomFieldDefinition.display_order))
    rows = (await db.execute(q)).scalars().all()
    out = []
    for f in rows:
        if f.field_name in _SYSTEM or f.field_type in ("file", "image"):
            continue
        pv = f.picklist_values
        options = pv if isinstance(pv, list) else (pv.get("options") if isinstance(pv, dict) else None)
        ref_target = pv.get("ref_target") if isinstance(pv, dict) else None
        out.append({"field_name": f.field_name, "field_label": f.field_label,
                    "field_type": f.field_type, "required": bool(f.is_required),
                    "options": options, "ref_target": ref_target})
    return out


def _is_uuid(v) -> bool:
    try:
        uuid.UUID(str(v)); return True
    except (ValueError, TypeError):
        return False


def _ref_label(data: dict) -> str:
    for f in _REF_LABEL_FIELDS:
        if data.get(f):
            return str(data[f])
    return next((str(v) for v in data.values() if v), "")


async def _match_reference(db: AsyncSession, target_entity: str, text: str) -> str | None:
    """Find the id of a `target_entity` record whose label matches the text."""
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == target_entity, EntityRecord.is_deleted == "N")
         .limit(500))
    rows = (await db.execute(q)).scalars().all()
    t = text.strip().lower()
    exact, contains = None, None
    for r in rows:
        label = _ref_label(r.data or {}).strip().lower()
        if not label:
            continue
        if label == t:
            exact = str(r.id); break
        if contains is None and (t in label or label in t):
            contains = str(r.id)
    return exact or contains


def _infer_targets(field_name: str, module_code: str | None) -> list[str]:
    """Candidate target entity_types for a reference field with no explicit ref_target."""
    base = re.sub(r"_(id|ref|reference)$", "", field_name)
    cands = [base + "s", base]
    if module_code:
        cands += [f"{base}s_{module_code}", f"{base}_{module_code}", f"{module_code}_{base}s", f"{module_code}_{base}"]
    seen, out = set(), []
    for c in cands:
        if c and c not in seen:
            seen.add(c); out.append(c)
    return out


async def resolve_references(db: AsyncSession, entity_type: str, data: dict,
                             module_code: str | None = None) -> dict:
    """Map text values in entity_reference fields (e.g. "Cash account") to real record ids.

    Uses the field's ref_target when set; otherwise infers candidate targets from the
    field name + module (e.g. account_id in crm → accounts / sales_accounts).
    """
    fields = await get_fields(db, entity_type)
    ref_fields = [f for f in fields if f["field_type"] == "entity_reference"]
    if not ref_fields:
        return data
    out = dict(data)
    for f in ref_fields:
        fname, val = f["field_name"], out.get(f["field_name"])
        if not isinstance(val, str) or not val.strip() or _is_uuid(val):
            continue
        targets = [f["ref_target"]] if f.get("ref_target") else _infer_targets(fname, module_code)
        for tgt in targets:
            rid = await _match_reference(db, tgt, val) if tgt else None
            if rid:
                out[fname] = rid
                break
    return out


def describe_fields(fields: list[dict]) -> str:
    """A compact field list for the prompt."""
    lines = []
    for f in fields:
        bits = [f"- {f['field_name']} ({f['field_type']})"]
        if f.get("required"):
            bits.append("[required]")
        if f["field_type"] == "entity_reference":
            label = (f.get("field_label") or f["field_name"]).lower()
            bits.append(f"— provide the related {label} by NAME (it will be linked automatically)")
        if f.get("options"):
            bits.append("allowed: " + ", ".join(str(o) for o in f["options"][:20]))
        lines.append(" ".join(bits))
    return "\n".join(lines)


def allowed_names(fields: list[dict]) -> set:
    return {f["field_name"] for f in fields}
