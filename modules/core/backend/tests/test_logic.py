"""
Unit tests for the automation-layer pure logic (no DB needed). Run with:
    cd modules/core/backend && PYTHONPATH=. pytest tests/ -q
"""
from app.services.sales.pricing import compute_totals
from app.services.marketing.scoring import decay_weight, grade_for, normalize_event, DECAY_GRACE_DAYS
from app.services.marketing.segments import parse_criteria, _match
from app.services.analytics.snapshots import _with_conversions
from app.services.ai import policy
from app.services.automation import ledger
from app.services.automation.engine import _truthy
from app.services.ai.jobs import _classify_error, _backoff_seconds, _due


# ── pricing ──────────────────────────────────────────────
def test_compute_totals_basic():
    t = compute_totals([{"quantity": 2, "unit_price": 100, "discount_pct": 10, "tax_rate": 8}])
    assert t["amount"] == 200          # 2 × 100
    assert t["discount_amount"] == 20  # 10%
    assert t["tax"] == 14.4            # 8% of 180
    assert t["total_amount"] == 194.4
    assert t["item_count"] == 1


def test_compute_totals_multi_and_empty():
    t = compute_totals([
        {"quantity": 1, "unit_price": 50, "discount_pct": 0, "tax_rate": 0},
        {"quantity": 3, "unit_price": 10, "discount_pct": 0, "tax_rate": 0},
    ])
    assert t["total_amount"] == 80 and t["item_count"] == 2
    e = compute_totals([])
    assert e["total_amount"] == 0 and e["item_count"] == 0


# ── scoring ──────────────────────────────────────────────
def test_grade_for():
    assert grade_for(0) == "Cold"
    assert grade_for(19) == "Cold"
    assert grade_for(20) == "Warm"
    assert grade_for(49) == "Warm"
    assert grade_for(50) == "Hot"


def test_decay_weight():
    assert decay_weight(0) == 1.0
    assert decay_weight(DECAY_GRACE_DAYS) == 1.0          # full within grace
    assert 0 < decay_weight(1000) < 0.1                   # heavily decayed when old
    assert decay_weight(5) >= decay_weight(60)            # monotonic non-increasing


def test_normalize_event():
    assert normalize_event("Form Submitted") == "form_submitted"
    assert normalize_event("  Link Clicked ") == "link_clicked"
    assert normalize_event(None) == ""


# ── segments ─────────────────────────────────────────────
def test_parse_criteria():
    c = parse_criteria("grade = Hot\nscore > 50")
    assert len(c) == 2 and c[0] == ("grade", "=", "Hot")


def test_match_equality_and_empty():
    conds = parse_criteria("grade = Hot")
    assert _match({"grade": "Hot"}, conds) is True
    assert _match({"grade": "hot"}, conds) is True        # case-insensitive
    assert _match({"grade": "Cold"}, conds) is False
    assert _match({}, []) is False                        # no criteria → no membership


def test_match_numeric_and_contains():
    assert _match({"score": 60}, parse_criteria("score > 50")) is True
    assert _match({"score": 40}, parse_criteria("score > 50")) is False
    assert _match({"source": "Website form"}, parse_criteria("source ~ website")) is True


def test_match_requires_all_conditions():
    conds = parse_criteria("grade = Hot\nscore > 50")
    assert _match({"grade": "Hot", "score": 60}, conds) is True
    assert _match({"grade": "Hot", "score": 10}, conds) is False


# ── analytics conversions ────────────────────────────────
def test_with_conversions():
    s = _with_conversions({"leads": 100, "mql": 50, "sql": 25, "won": 5})
    assert s["conv_lead_mql"] == 50.0
    assert s["conv_mql_sql"] == 50.0
    assert s["conv_sql_won"] == 20.0


def test_with_conversions_zero_safe():
    s = _with_conversions({"leads": 0, "mql": 0, "sql": 0, "won": 0})
    assert s["conv_lead_mql"] == 0.0 and s["conv_mql_sql"] == 0.0


# ── AI policy routing (confidence × risk) ────────────────
def test_policy_risk_of():
    assert policy.risk_of("create_record", has_write=False) == "high"   # is_action cap
    assert policy.risk_of("summarize", has_write=True) == "medium"      # writes a field
    assert policy.risk_of("summarize", has_write=False) == "low"        # read-only


def test_policy_matrix_full():
    # suggest never auto-applies; auto auto-applies up to medium; high always reviews.
    assert policy.decide("suggest", "low")[0] == "review"
    assert policy.decide("suggest", "high")[0] == "block"
    assert policy.decide("review", "medium")[0] == "review"
    assert policy.decide("auto", "low")[0] == "auto"
    assert policy.decide("auto", "medium")[0] == "auto"
    assert policy.decide("auto", "high")[0] == "review"   # high risk overrides trust


def test_policy_global_modes():
    assert policy.decide("suggest", "high", mode="auto_all")[0] == "auto"
    assert policy.decide("auto", "medium", mode="review_all")[0] == "review"
    assert policy.decide("auto", "low", mode="review_all")[0] == "auto"  # nothing to approve
    assert policy.decide("garbage", "weird")[0] in ("review", "block")   # defaults are safe


# ── action ledger idempotency key ────────────────────────
def test_idempotency_key_stable_and_distinct():
    k1 = ledger.idempotency_key("rule1", "rec1", "set_field", "status", "Won")
    k2 = ledger.idempotency_key("rule1", "rec1", "set_field", "status", "Won")
    k3 = ledger.idempotency_key("rule1", "rec1", "set_field", "status", "Lost")
    assert k1 == k2 and k1 != k3


def test_truthy_flag():
    assert all(_truthy(v) for v in ("true", "True", "yes", "1", "on", "Active"))
    assert not any(_truthy(v) for v in ("false", "no", "0", "", None))


# ── AI job durable retry/backoff ─────────────────────────
def test_classify_error():
    assert _classify_error("Monthly AI budget reached") == "budget"
    assert _classify_error("capability 'x' is not enabled for a/b") == "permanent"
    assert _classify_error("trigger record not found") == "permanent"
    assert _classify_error("Claude API error (502)") == "transient"


def test_backoff_grows_and_caps():
    assert _backoff_seconds(1) == 120
    assert _backoff_seconds(2) == 240
    assert _backoff_seconds(3) == 480
    assert _backoff_seconds(50) == 1800   # capped at 30 minutes


def test_due_gating():
    from datetime import datetime, timedelta
    now = datetime(2026, 6, 10, 12, 0, 0)
    assert _due({}, now) is True                                              # no schedule → due
    assert _due({"next_attempt_at": (now - timedelta(minutes=1)).isoformat()}, now) is True
    assert _due({"next_attempt_at": (now + timedelta(minutes=5)).isoformat()}, now) is False
    assert _due({"next_attempt_at": "garbage"}, now) is True                  # unparseable → due
