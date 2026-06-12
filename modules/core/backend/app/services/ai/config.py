"""AI runtime config: API key resolution, model catalog, and cost accounting."""
import os

# Default to the latest, most capable model. Capabilities may override per call.
DEFAULT_MODEL = "claude-opus-4-8"

# Tier aliases the control plane can expose without hardcoding model IDs in the UI.
MODEL_TIERS = {
    "reasoning": "claude-opus-4-8",   # deep planning / analysis
    "balanced": "claude-sonnet-4-6",  # general
    "fast": "claude-haiku-4-5",       # cheap, high-volume classify/summarize
}

# USD per 1,000,000 tokens: (input, output).
MODEL_PRICES = {
    "claude-opus-4-8": (5.0, 25.0),
    "claude-opus-4-7": (5.0, 25.0),
    "claude-sonnet-4-6": (3.0, 15.0),
    "claude-haiku-4-5": (1.0, 5.0),
}


def resolve_api_key() -> str | None:
    """Return a usable Anthropic key, or None if unset/placeholder."""
    key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if not key or key.lower().startswith("your-") or key.lower() in {"changeme", "placeholder"}:
        return None
    return key


def key_status() -> dict:
    key = resolve_api_key()
    return {
        "configured": key is not None,
        "masked": (key[:7] + "…" + key[-4:]) if key and len(key) > 14 else None,
    }


def resolve_model(tier_or_id: str | None) -> str:
    if not tier_or_id:
        return DEFAULT_MODEL
    return MODEL_TIERS.get(tier_or_id, tier_or_id)


# Adaptive thinking: Opus 4.6/4.7/4.8 and Sonnet 4.6 only (not Haiku/older).
_THINKING_MODELS = {"claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6"}
# Effort: the thinking models plus Opus 4.5 — not Haiku 4.5 or Sonnet 4.5.
_EFFORT_MODELS = _THINKING_MODELS | {"claude-opus-4-5"}


def supports_thinking(model: str) -> bool:
    return model in _THINKING_MODELS


def supports_effort(model: str) -> bool:
    return model in _EFFORT_MODELS


def cost_usd(model: str, input_tokens: int, output_tokens: int,
             cache_read_tokens: int = 0, cache_write_tokens: int = 0) -> float:
    """Approximate cost. Cache reads ~0.1x input, writes ~1.25x input."""
    in_price, out_price = MODEL_PRICES.get(model, (5.0, 25.0))
    return round(
        (input_tokens * in_price
         + cache_read_tokens * in_price * 0.1
         + cache_write_tokens * in_price * 1.25
         + output_tokens * out_price) / 1_000_000,
        6,
    )
