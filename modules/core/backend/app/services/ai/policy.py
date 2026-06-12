"""Confidence × risk policy routing — roadmap step #4.

Decides whether an AI-proposed action is applied automatically, queued for human
review, or blocked. Two inputs:

  RISK     — how damaging the action is if wrong:
               low    : read-only / informational (a summary stored on the job)
               medium : writes one field on an existing record (the ai_run write-back)
               high   : creates or restructures records (is_action capabilities)
  AUTONOMY — the acting worker/capability's earned trust: suggest < review < auto
             (from the gateway result; a promoted worker raises it — see promotion.py).

Decision matrix (autonomy × risk):

              low        medium      high
    suggest   review     review      block
    review    review     review      review
    auto      auto       auto        review

A global policy mode (ai_settings __global__ `policy_mode`) overrides the matrix:
    "trust"      — use the matrix (DEFAULT)
    "review_all" — force every action to review (max human-in-loop)
    "auto_all"   — apply everything (governance gate off; still ledgered)
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from . import settings as ai_settings

# Capabilities that create/restructure records (gateway persists them) → high risk.
ACTION_CAPS = {"create_record", "update_record", "project_auto_plan"}

_MATRIX = {
    ("suggest", "low"): "review", ("suggest", "medium"): "review", ("suggest", "high"): "block",
    ("review",  "low"): "review", ("review",  "medium"): "review", ("review",  "high"): "review",
    ("auto",    "low"): "auto",   ("auto",    "medium"): "auto",   ("auto",    "high"): "review",
}

VALID_MODES = ("trust", "review_all", "auto_all")


def risk_of(capability_id: str, *, has_write: bool) -> str:
    """Classify an AI action's risk from the capability + whether it writes a field."""
    if capability_id in ACTION_CAPS:
        return "high"
    return "medium" if has_write else "low"


def decide(autonomy: str, risk: str, mode: str = "trust") -> tuple[str, str]:
    """Return (decision, reason) where decision ∈ {auto, review, block}."""
    autonomy = (autonomy or "suggest").lower()
    if autonomy not in ("suggest", "review", "auto"):
        autonomy = "suggest"
    risk = risk if risk in ("low", "medium", "high") else "medium"

    if mode == "auto_all":
        return "auto", "policy mode auto_all (governance gate off)"
    if mode == "review_all":
        # Even review_all auto-applies genuine no-risk reads (nothing to approve).
        if risk == "low":
            return "auto", "review_all: low-risk read auto-applied"
        return "review", "policy mode review_all"

    decision = _MATRIX.get((autonomy, risk), "review")
    return decision, f"matrix: autonomy={autonomy} × risk={risk}"


async def global_mode(db: AsyncSession) -> str:
    """Read the global policy mode (defaults to 'trust')."""
    gov = await ai_settings.get_global(db)
    mode = gov.get("policy_mode") or "trust"
    return mode if mode in VALID_MODES else "trust"
