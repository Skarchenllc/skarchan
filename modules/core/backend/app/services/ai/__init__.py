"""Centralized AI service layer.

One engine (`gateway.run_capability`) is the only code that talks to Claude.
Modules invoke reusable "expert" capabilities through it; what runs where is
gated by `ai_settings`, and every call is metered into `ai_runs`.
"""
