"""Narrow specialist model — learns a classification task from feedback labels.

This is the one place literal ML training fits. It's an instance-based learner
(k-NN over embeddings): every approved/corrected label becomes a training point,
and prediction is a nearest-neighbour vote. As labels accumulate it sharpens, and
once confident it answers a narrow `classify` task WITHOUT calling Claude —
faster and cheaper — with Claude as the cold-start / low-confidence fallback.

No heavy ML deps: embeddings (OpenAI) + vector search (ChromaDB), both already
in the stack. Training data lives in a per-section ChromaDB collection.
"""
import hashlib

from . import vectorstore

K = 5
CONFIDENCE_MIN = 0.6      # fraction of neighbours agreeing
MIN_NEIGHBOURS = 3        # need at least this many examples nearby to trust it


def _coll(module_code: str, entity_type: str) -> str:
    return f"clf__{module_code}__{entity_type}"[:500]


def _id(text: str) -> str:
    return hashlib.sha1((text or "").encode("utf-8")).hexdigest()[:24]


def available() -> bool:
    return vectorstore.semantic_available()


def add_example(module_code: str, entity_type: str, text: str, label: str) -> bool:
    """Add/replace one labelled training point. Returns True on success."""
    text, label = (text or "").strip(), (label or "").strip()
    if not text or not label or not available():
        return False
    emb = vectorstore.embed([text])[0]
    vectorstore.upsert_named(_coll(module_code, entity_type), [_id(text)], [emb], [text], [{"label": label}])
    return True


def predict(module_code: str, entity_type: str, text: str) -> dict | None:
    """k-NN label prediction. None when not trained / not confident enough."""
    if not text or not available():
        return None
    try:
        emb = vectorstore.embed([text])[0]
        hits = vectorstore.query_named(_coll(module_code, entity_type), emb, n=K)
    except Exception:
        return None
    labels = [h["metadata"].get("label") for h in hits if h["metadata"].get("label")]
    if len(labels) < MIN_NEIGHBOURS:
        return None
    counts: dict[str, int] = {}
    for lab in labels:
        counts[lab] = counts.get(lab, 0) + 1
    label, votes = max(counts.items(), key=lambda kv: kv[1])
    confidence = round(votes / len(labels), 3)
    if confidence < CONFIDENCE_MIN:
        return None
    return {"label": label, "confidence": confidence, "neighbours": len(labels), "source": "specialist-knn"}


def status(module_code: str, entity_type: str) -> dict:
    if not available():
        return {"available": False, "examples": 0}
    return {"available": True, "examples": vectorstore.count_named(_coll(module_code, entity_type))}
