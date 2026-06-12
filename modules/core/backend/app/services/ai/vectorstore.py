"""Vector store + embeddings for semantic retrieval.

Embeddings: OpenAI text-embedding-3-small (the LLM stays Claude; Anthropic has
no embeddings endpoint). Vector DB: the ChromaDB service already in the stack,
via its v2 HTTP API (no heavy client dep — just httpx).

Everything here is best-effort: callers fall back to keyword retrieval when
`semantic_available()` is False or any call raises.
"""
import os

import httpx

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536
_CHROMA = os.getenv("CHROMA_URL", "http://chromadb:8000").rstrip("/")
_TENANT, _DATABASE = "default_tenant", "default_database"
_BASE = f"{_CHROMA}/api/v2/tenants/{_TENANT}/databases/{_DATABASE}"


def _openai_key() -> str | None:
    k = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not k or k.lower().startswith("your-") or k.lower() in {"changeme", "placeholder"}:
        return None
    return k


def embedder_available() -> bool:
    return _openai_key() is not None


def chroma_available() -> bool:
    try:
        return httpx.get(f"{_CHROMA}/api/v2/heartbeat", timeout=4).status_code == 200
    except Exception:
        return False


def semantic_available() -> bool:
    return embedder_available() and chroma_available()


def embed(texts: list[str]) -> list[list[float]]:
    key = _openai_key()
    if not key:
        raise RuntimeError("No embeddings key configured")
    out: list[list[float]] = []
    with httpx.Client(timeout=30) as c:
        for i in range(0, len(texts), 100):
            batch = texts[i:i + 100]
            r = c.post("https://api.openai.com/v1/embeddings",
                       headers={"Authorization": f"Bearer {key}"},
                       json={"model": EMBED_MODEL, "input": batch})
            r.raise_for_status()
            out.extend(d["embedding"] for d in r.json()["data"])
    return out


def collection_name(module_code: str, entity_type: str) -> str:
    return f"sec__{module_code}__{entity_type}"[:500]


def _get_or_create(client: httpx.Client, name: str) -> str:
    r = client.post(f"{_BASE}/collections", json={"name": name, "get_or_create": True})
    r.raise_for_status()
    return r.json()["id"]


def upsert_named(name: str, ids: list[str], embeddings: list[list[float]],
                 documents: list[str], metadatas: list[dict]) -> None:
    with httpx.Client(timeout=30) as c:
        cid = _get_or_create(c, name)
        r = c.post(f"{_BASE}/collections/{cid}/upsert",
                   json={"ids": ids, "embeddings": embeddings, "documents": documents, "metadatas": metadatas})
        r.raise_for_status()


def query_named(name: str, embedding: list[float], n: int = 25) -> list[dict]:
    with httpx.Client(timeout=20) as c:
        cid = _get_or_create(c, name)
        r = c.post(f"{_BASE}/collections/{cid}/query",
                   json={"query_embeddings": [embedding], "n_results": n,
                         "include": ["metadatas", "documents", "distances"]})
        r.raise_for_status()
        data = r.json()
        ids = (data.get("ids") or [[]])[0]
        docs = (data.get("documents") or [[]])[0]
        metas = (data.get("metadatas") or [[]])[0]
        dists = (data.get("distances") or [[]])[0]
        return [{"id": ids[i], "document": docs[i] if i < len(docs) else "",
                 "metadata": metas[i] if i < len(metas) else {},
                 "distance": dists[i] if i < len(dists) else None}
                for i in range(len(ids))]


def count_named(name: str) -> int:
    try:
        with httpx.Client(timeout=10) as c:
            cid = _get_or_create(c, name)
            r = c.get(f"{_BASE}/collections/{cid}/count")
            r.raise_for_status()
            return int(r.json())
    except Exception:
        return 0


def upsert(module_code: str, entity_type: str, ids: list[str],
           embeddings: list[list[float]], documents: list[str], metadatas: list[dict]) -> None:
    upsert_named(collection_name(module_code, entity_type), ids, embeddings, documents, metadatas)


def query(module_code: str, entity_type: str, embedding: list[float], n: int = 25) -> list[dict]:
    """Return [{id, document, metadata, distance}] best matches, or [] if none/empty."""
    with httpx.Client(timeout=20) as c:
        cid = _get_or_create(c, collection_name(module_code, entity_type))
        r = c.post(f"{_BASE}/collections/{cid}/query",
                   json={"query_embeddings": [embedding], "n_results": n,
                         "include": ["metadatas", "documents", "distances"]})
        r.raise_for_status()
        data = r.json()
        ids = (data.get("ids") or [[]])[0]
        docs = (data.get("documents") or [[]])[0]
        metas = (data.get("metadatas") or [[]])[0]
        dists = (data.get("distances") or [[]])[0]
        return [{"id": ids[i], "document": docs[i] if i < len(docs) else "",
                 "metadata": metas[i] if i < len(metas) else {},
                 "distance": dists[i] if i < len(dists) else None}
                for i in range(len(ids))]
