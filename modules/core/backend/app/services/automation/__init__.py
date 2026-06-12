"""Shared automation engine: trigger → conditions → actions over entity_records."""
from .engine import fire_event, run_automation, ACTION_TYPES, TRIGGER_EVENTS, CONDITION_OPS

__all__ = ["fire_event", "run_automation", "ACTION_TYPES", "TRIGGER_EVENTS", "CONDITION_OPS"]
