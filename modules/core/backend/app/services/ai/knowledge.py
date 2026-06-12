"""Knowledge / retrieval layer for grounded answers.

Given a question and a section, fetch the most relevant records from the
`entity_records` store and format them as compact, citable context. This keeps
"Ask your data" answers grounded in real data.

Retrieval here is keyword + recency scoring over the structured store — robust
and dependency-free. A vector backend (ChromaDB) can slot in behind the same
`retrieve()` signature later for semantic search at larger scale.
"""
import json
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord
from . import vectorstore

_LABEL_FIELDS = ["name", "project_name", "task_name", "title", "subject",
                 "account_name", "company_name", "milestone_name", "full_name",
                 "transaction_number", "invoice_number", "bill_number", "order_number",
                 "reference", "code", "number", "description"]
_STOPWORDS = {"the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is",
              "are", "what", "which", "who", "how", "many", "show", "list", "me",
              "our", "my", "all", "with", "by", "this"}


def _label(data: dict) -> str:
    for f in _LABEL_FIELDS:
        if data.get(f):
            return str(data[f])
    return next((str(v) for v in data.values() if v), "(record)")


def _flat_text(data: dict) -> str:
    return " ".join(f"{k}={v}" for k, v in data.items() if v not in (None, "", [], {}))


async def index_section(db: AsyncSession, *, module_code: str, entity_type: str, scan: int = 1000) -> dict:
    """Embed a section's records into ChromaDB for semantic search."""
    if not vectorstore.semantic_available():
        return {"indexed": 0, "reason": "semantic backend unavailable (embeddings key or ChromaDB)"}
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == entity_type, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc()).limit(scan))
    rows = list((await db.execute(q)).scalars().all())
    if not rows:
        return {"indexed": 0}
    ids, docs, metas = [], [], []
    for r in rows:
        data = r.data or {}
        ids.append(str(r.id))
        docs.append(f"{_label(data)} :: {_flat_text(data)}"[:2000])
        metas.append({"record_id": str(r.id), "label": _label(data)})
    embeddings = vectorstore.embed(docs)
    vectorstore.upsert(module_code, entity_type, ids, embeddings, docs, metas)
    return {"indexed": len(ids)}


async def _semantic_retrieve(db: AsyncSession, *, module_code: str, entity_type: str,
                             question: str, limit: int) -> tuple[str, list[dict]] | None:
    """Vector retrieval; returns None to signal fallback (no index/empty/error)."""
    try:
        qvec = vectorstore.embed([question or ""])[0]
        hits = vectorstore.query(module_code, entity_type, qvec, n=limit)
    except Exception:
        return None
    if not hits:
        return None
    # Fetch fresh records by id so the answer reflects current data, not the index.
    by_id = {h["metadata"].get("record_id", h["id"]): h for h in hits}
    rows = list((await db.execute(
        select(EntityRecord).where(EntityRecord.id.in_([uuid.UUID(i) for i in by_id.keys() if _is_uuid(i)]),
                                   EntityRecord.is_deleted == "N"))).scalars().all())
    rows_by_id = {str(r.id): r for r in rows}
    lines, citations = [], []
    i = 0
    for rid in by_id.keys():
        r = rows_by_id.get(rid)
        if not r:
            continue
        i += 1
        data = r.data or {}
        label = _label(data)
        lines.append(f"[{i}] {label} :: {json.dumps(data, default=str)[:600]}")
        citations.append({"ref": i, "id": rid, "label": label})
    if not lines:
        return None
    header = f"{len(lines)} most semantically relevant {entity_type} records:"
    return (header + "\n" + "\n".join(lines), citations)


def _is_uuid(v) -> bool:
    try:
        uuid.UUID(str(v)); return True
    except (ValueError, TypeError):
        return False


import uuid  # noqa: E402  (used by _semantic_retrieve / _is_uuid)


async def retrieve(db: AsyncSession, *, module_code: str, entity_type: str,
                   question: str, limit: int = 25, scan: int = 600) -> tuple[str, list[dict]]:
    """Return (context_text, citations) of the most relevant records for the question.

    Prefers semantic (ChromaDB) retrieval when available + indexed; otherwise
    falls back to keyword + recency scoring over the structured store.
    """
    if vectorstore.semantic_available():
        sem = await _semantic_retrieve(db, module_code=module_code, entity_type=entity_type,
                                       question=question, limit=limit)
        if sem is not None:
            return sem

    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == entity_type, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc())
         .limit(scan))
    rows = list((await db.execute(q)).scalars().all())
    if not rows:
        return ("(no records found for this section)", [])

    terms = [t for t in re.findall(r"[a-z0-9]+", (question or "").lower())
             if t not in _STOPWORDS and len(t) > 2]

    scored = []
    for idx, r in enumerate(rows):
        data = r.data or {}
        blob = _flat_text(data).lower()
        score = sum(blob.count(t) for t in terms) if terms else 0
        # recency tiebreak: earlier rows (newer) get a tiny boost
        scored.append((score, -idx, r, data))

    scored.sort(reverse=True)
    if terms and scored[0][0] == 0:
        # nothing matched the question — fall back to most recent
        top = scored[:limit]
    else:
        top = [s for s in scored if s[0] > 0][:limit] or scored[:limit]

    lines, citations = [], []
    for i, (_, _, r, data) in enumerate(top, start=1):
        label = _label(data)
        compact = json.dumps(data, default=str)[:600]
        lines.append(f"[{i}] {label} :: {compact}")
        citations.append({"ref": i, "id": str(r.id), "label": label})

    header = f"{len(top)} most relevant {entity_type} records:"
    return (header + "\n" + "\n".join(lines), citations)
