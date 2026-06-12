"""
Lightweight in-memory rate limiter for public (unauthenticated) endpoints.

A sliding window per client IP, per limiter instance. Good enough to blunt abuse
of the public form/tracking endpoints on a single instance; for multi-instance
deployments swap the bucket store for Redis.
"""
import time
from collections import defaultdict, deque

from fastapi import Request, HTTPException


def rate_limited(max_requests: int = 30, window_seconds: int = 60):
    """FastAPI dependency factory — instantiate once per endpoint at import time."""
    buckets: dict[str, deque] = defaultdict(deque)

    async def dependency(request: Request):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        dq = buckets[ip]
        cutoff = now - window_seconds
        while dq and dq[0] <= cutoff:
            dq.popleft()
        if len(dq) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many requests — slow down.")
        dq.append(now)

    return dependency
