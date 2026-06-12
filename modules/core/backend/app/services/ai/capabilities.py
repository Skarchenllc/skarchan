"""Capability registry — the catalog of reusable AI "expert skills".

A capability is a parameterized, module-agnostic skill. The gateway resolves a
capability by id, runs Claude with its system prompt (and optional structured
schema), then hands the result to its output handler (if any).

Adding AI to a new section is mostly: register a capability here + flip its
toggle in ai_settings — no bespoke endpoint per feature.
"""
from dataclasses import dataclass, field
from typing import Callable, Optional


def _default_render(context: dict) -> str:
    """Build the user message from a context dict. Capabilities can override."""
    parts = []
    for key in ("instruction", "input", "text", "question"):
        if context.get(key):
            parts.append(str(context[key]))
    if context.get("data") is not None:
        parts.append("\n\nData:\n" + str(context["data"]))
    return "\n\n".join(parts) or "(no input provided)"


@dataclass
class Capability:
    id: str
    name: str
    description: str
    applies_to: list[str]                 # entity_type codes, or ["*"] for any
    mode: str = "on_demand"               # on_demand | proactive
    model_tier: str = "reasoning"         # reasoning | balanced | fast (config.MODEL_TIERS)
    autonomy_default: str = "suggest"     # suggest | review | auto
    system_prompt: str = ""
    output_schema: Optional[dict] = None  # JSON schema → structured output; None → text
    handler: Optional[str] = None         # name resolved in handlers.HANDLERS
    needs_retrieval: bool = False         # if True, the gateway grounds it in section records (RAG)
    needs_fields: bool = False            # if True, the gateway injects the section's field schema
    is_action: bool = False               # writes a record (draft → review → create/update)
    is_update: bool = False               # edits an existing record (vs create new)
    render_input: Callable[[dict], str] = field(default=_default_render)

    def meta(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "applies_to": self.applies_to,
            "mode": self.mode,
            "model_tier": self.model_tier,
            "autonomy_default": self.autonomy_default,
            "structured": self.output_schema is not None,
            "persists": self.handler is not None,
            "retrieval": self.needs_retrieval,
            "is_action": self.is_action,
            "is_update": self.is_update,
        }


# ---------------------------------------------------------------------------
# Capability: project_auto_plan (structured + persisting)
# ---------------------------------------------------------------------------
_PRIORITY_ENUM = ["low", "medium", "high", "critical"]

_PLAN_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "project_name": {"type": "string"},
        "description": {"type": "string"},
        "project_manager": {"type": "string"},
        "client_name": {"type": "string"},
        "department": {"type": "string"},
        "priority": {"type": "string", "enum": _PRIORITY_ENUM},
        "start_date": {"type": "string", "format": "date"},
        "end_date": {"type": "string", "format": "date"},
        "estimated_budget": {"type": "number"},
        "milestones": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "milestone_name": {"type": "string"},
                    "description": {"type": "string"},
                    "deliverables": {"type": "string"},
                    "due_date": {"type": "string", "format": "date"},
                    "owner": {"type": "string"},
                },
                "required": ["milestone_name", "description", "deliverables", "due_date", "owner"],
            },
        },
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "task_name": {"type": "string"},
                    "description": {"type": "string"},
                    "assigned_to": {"type": "string"},
                    "priority": {"type": "string", "enum": _PRIORITY_ENUM},
                    "estimated_hours": {"type": "number"},
                    "start_date": {"type": "string", "format": "date"},
                    "due_date": {"type": "string", "format": "date"},
                    "milestone_index": {"type": "integer"},
                },
                "required": ["task_name", "description", "assigned_to", "priority",
                             "estimated_hours", "start_date", "due_date", "milestone_index"],
            },
        },
    },
    "required": ["project_name", "description", "project_manager", "client_name",
                 "department", "priority", "start_date", "end_date", "estimated_budget",
                 "milestones", "tasks"],
}

_PLAN_SYSTEM = """You are an expert project planner. Given a short project brief, produce a realistic, well-structured work breakdown for a project-management system.

Rules:
- Produce 3-7 milestones (logical phases, in delivery order) and 8-25 tasks total.
- Every task belongs to exactly one milestone, referenced by its 0-based index in the milestones array via `milestone_index`.
- Schedule everything forward from the supplied "today" date. Milestone due dates and task dates must fall between the project start and end dates and respect a sensible order (early phases first).
- Give each task a realistic `estimated_hours` (a number) and a sensible `priority`.
- Fill `project_manager`, `client_name`, `department`, and task `assigned_to` with plausible role names or placeholders when the brief doesn't specify them (e.g. "TBD", "Engineering Lead").
- `estimated_budget` is a single number in the project's currency.
- Keep names concise and descriptions to one or two sentences.
Return only the structured plan."""


def _render_plan_input(context: dict) -> str:
    return f"Today is {context.get('today', '')}.\n\nProject brief:\n{context.get('brief', '')}"


# ---------------------------------------------------------------------------
# Capability: manager_delegate (planner — turns a goal into expert tasks)
# ---------------------------------------------------------------------------
_DELEGATE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "plan": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "section": {"type": "string"},
                    "capability": {"type": "string"},
                    "instruction": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["section", "capability", "instruction", "reason"],
            },
        },
    },
    "required": ["summary", "plan"],
}

_DELEGATE_SYSTEM = """You are a unit manager who gets work done through your section experts.
You are given a goal and a roster: each section, its expert, and the capabilities that expert can run.
Break the goal into concrete tasks and assign each to ONE section + ONE capability that appears in the roster.

Rules:
- Use ONLY (section, capability) pairs that appear in the roster — never invent a section or a capability it doesn't have.
- Prefer the fewest tasks that accomplish the goal (1-6 total).
- Give each task a specific, actionable `instruction` the expert can carry out, plus a one-line `reason`.
- Read tasks (summarize, extract, ask, risk_scan, classify) gather or analyze information.
- Write tasks (create, update) change data and will be routed for human approval by policy.
- If the goal can't be served by the roster, return an empty plan and say why in the summary.
Return the plan only."""


def _render_delegate(context: dict) -> str:
    return f"Goal:\n{context.get('goal', '')}\n\nYour roster:\n{context.get('roster', '(no experts available)')}"


# ---------------------------------------------------------------------------
# Capability: manager_dispatch (division head — assigns work to unit managers)
# ---------------------------------------------------------------------------
_DISPATCH_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "assignments": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "module": {"type": "string"},
                    "instruction": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["module", "instruction", "reason"],
            },
        },
    },
    "required": ["summary", "assignments"],
}

_DISPATCH_SYSTEM = """You are a division head. You do not do the work yourself — you direct the unit managers who report to you, and each of them runs their own section experts.
You are given a goal and a roster of your units (each unit = a module, its manager, and the kinds of work it covers).

Rules:
- Assign work ONLY to units (`module`) that appear in the roster — never invent one.
- Route each part of the goal to the unit best suited to it. Assign to the FEWEST units that can accomplish the goal (often just 1-2).
- For each assigned unit, write a clear `instruction` for its manager (it will be delegated down to that unit's experts), plus a one-line `reason`.
- If a unit is irrelevant to the goal, don't assign it anything.
Return the assignments only."""


def _render_dispatch(context: dict) -> str:
    return f"Goal:\n{context.get('goal', '')}\n\nYour units:\n{context.get('roster', '(no units available)')}"


# ---------------------------------------------------------------------------
# Capability: manager_ceo (org-wide — assigns work to department managers)
# ---------------------------------------------------------------------------
_CEO_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "assignments": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "department": {"type": "string"},
                    "instruction": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["department", "instruction", "reason"],
            },
        },
    },
    "required": ["summary", "assignments"],
}

_CEO_SYSTEM = """You are the CEO. You set direction and delegate to your department managers — each of them runs their section specialists. You never do the work yourself.
You are given a company goal and a roster of your departments (each = a business area with the sections it covers).

Rules:
- Assign work ONLY to departments (`department`) that appear in the roster — never invent one.
- Route each part of the goal to the department responsible for it. Assign to the FEWEST departments that can accomplish the goal (often just 1-2).
- For each assigned department, write a clear `instruction` for its manager (it cascades down to that department's specialists), plus a one-line `reason`.
- Leave out departments irrelevant to the goal.
Return the assignments only."""


def _render_ceo(context: dict) -> str:
    return f"Company goal:\n{context.get('goal', '')}\n\nYour departments:\n{context.get('roster', '(no departments available)')}"


# ---------------------------------------------------------------------------
# Capability: synthesize (turns the team's raw reports into one decision note)
# ---------------------------------------------------------------------------
_SYNTH_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "key_findings": {"type": "array", "items": {"type": "string"}},
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {"action": {"type": "string"}, "why": {"type": "string"}},
                "required": ["action", "why"],
            },
        },
        "data_gaps": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["title", "summary", "key_findings", "recommendations", "data_gaps"],
}

_SYNTH_SYSTEM = """You are an executive chief of staff writing a concise decision note from your team's inputs.
You are given the leader's goal and the raw reports each specialist filed. Synthesize them into ONE coherent note.

Rules:
- `title`: a short, specific headline for the note.
- `summary`: 2-4 sentences that DIRECTLY answer the leader's goal. If the inputs don't support a strong answer, say so plainly.
- `key_findings`: the most important facts/signals across the reports (short strings). Cross-reference and reconcile where they relate; don't just repeat each report.
- `recommendations`: concrete, PRIORITISED actions, each with a one-line `why`. Be specific and practical, not generic.
- `data_gaps`: anything the reports flagged as missing/unavailable that limits confidence (so the leader knows what to fix to get a better answer).
- If a refinement is requested, follow it.
Return the note only."""


def _render_synth(context: dict) -> str:
    base = f"Leader's goal:\n{context.get('goal', '')}\n\nTeam reports:\n{context.get('reports', '(none)')}"
    if context.get("refinement"):
        base += f"\n\nRefinement requested by the leader: {context['refinement']}"
    return base


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------
CAPABILITIES: dict[str, Capability] = {
    "project_auto_plan": Capability(
        id="project_auto_plan",
        name="Project Auto-Planner",
        description="Turn a free-text brief into a project with phased milestones and scheduled tasks.",
        applies_to=["pm_projects"],
        model_tier="reasoning",
        autonomy_default="auto",
        system_prompt=_PLAN_SYSTEM,
        output_schema=_PLAN_SCHEMA,
        handler="persist_project_plan",
        render_input=_render_plan_input,
    ),
    "summarize": Capability(
        id="summarize",
        name="Summarize",
        description="Produce a concise summary of the provided record or text.",
        applies_to=["*"],
        model_tier="fast",
        autonomy_default="suggest",
        system_prompt=("You are a precise business analyst. Summarize the provided content in 3-5 "
                       "tight bullet points, surfacing what a busy manager needs to know. No preamble."),
    ),
    "extract": Capability(
        id="extract",
        name="Extract Action Items",
        description="Pull action items, owners, and due dates from notes or free text.",
        applies_to=["*"],
        model_tier="fast",
        autonomy_default="suggest",
        system_prompt=("You extract concrete action items from notes. For each item give: the task, a "
                       "likely owner (or 'TBD'), and a due date if stated. Return a short markdown list."),
    ),
    "propose_changes": Capability(
        id="propose_changes",
        name="Proposer",
        description="Proactively review records and propose high-confidence data-quality fixes for approval.",
        applies_to=["*"],
        mode="proposer",
        model_tier="balanced",
        autonomy_default="review",
        needs_fields=True,
        output_schema={
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "proposals": {
                    "type": "array",
                    "items": {
                        "type": "object", "additionalProperties": False,
                        "properties": {
                            "reference": {"type": "integer"},
                            "field": {"type": "string"},
                            "value": {"type": "string"},
                            "reason": {"type": "string"},
                        },
                        "required": ["reference", "field", "value", "reason"],
                    },
                },
            },
            "required": ["proposals"],
        },
        system_prompt=("You review records (each referenced by [n]) and propose ONLY safe, high-confidence "
                       "corrections to CATEGORICAL fields (status, priority, type, category, stage). "
                       "Good example: a status 'In Progress' that should be 'in_progress' to match the "
                       "allowed options. For each change return {reference, field, value, reason}, using the "
                       "allowed options EXACTLY. NEVER propose values for code / id / number / name / "
                       "description fields. NEVER use placeholder or guessed values like 'REQUIRED', "
                       "'UNKNOWN', 'TBD', 'N/A', or 'Missing'. If you cannot determine a concrete, correct "
                       "value from the record itself, propose nothing. Most records need NO changes — return "
                       "an empty proposals list unless a value is clearly wrong."),
        render_input=lambda ctx: (f"Fields:\n{ctx.get('fields_desc', '')}\n\n"
                                  f"Records:\n{ctx.get('data', '')}\n\nPropose only high-confidence corrections."),
    ),
    "manager_brief": Capability(
        id="manager_brief",
        name="Manager Briefing",
        description="A manager that reviews its section specialists' reports and produces an executive briefing.",
        applies_to=["*"],
        mode="manager",
        model_tier="balanced",
        autonomy_default="suggest",
        output_schema={
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "summary": {"type": "string"},
                "priorities": {"type": "array", "items": {"type": "string"}},
                "risks": {
                    "type": "array",
                    "items": {
                        "type": "object", "additionalProperties": False,
                        "properties": {
                            "title": {"type": "string"},
                            "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                            "section": {"type": "string"},
                        },
                        "required": ["title", "severity", "section"],
                    },
                },
                "delegations": {
                    "type": "array",
                    "items": {
                        "type": "object", "additionalProperties": False,
                        "properties": {"section": {"type": "string"}, "action": {"type": "string"}},
                        "required": ["section", "action"],
                    },
                },
            },
            "required": ["summary", "priorities", "risks", "delegations"],
        },
        system_prompt=("You are a department manager. You are given short status reports from the "
                       "specialists of each section you oversee. Synthesize an executive briefing: an "
                       "overall summary, the top cross-section priorities, the key risks (with the "
                       "section they belong to), and concrete delegations (which section should do what "
                       "next). Be specific and decisive."),
        render_input=lambda ctx: (f"Goal: {ctx.get('goal') or 'Give me a current operations briefing.'}\n\n"
                                  f"Specialist reports:\n{ctx.get('data', '')}"),
    ),
    "risk_scan": Capability(
        id="risk_scan",
        name="Risk Scan",
        description="Proactively scan a section's records for risks (overdue, blocked, stalled, over-budget) and report findings.",
        applies_to=["*"],
        mode="proactive",
        model_tier="balanced",  # Sonnet — strong at risk-finding and far faster than Opus across many sections
        autonomy_default="review",
        needs_retrieval=True,
        output_schema={
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "summary": {"type": "string"},
                "findings": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "title": {"type": "string"},
                            "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                            "reference": {"type": "integer"},
                            "recommendation": {"type": "string"},
                        },
                        "required": ["title", "severity", "reference", "recommendation"],
                    },
                },
            },
            "required": ["summary", "findings"],
        },
        system_prompt=("You are a risk analyst. From the supplied [n]-referenced records, identify the "
                       "most important risks or issues — overdue dates, blocked/stalled items, missing "
                       "owners, over-budget signals, anomalies. Return concise findings with a severity "
                       "and a one-line recommendation each, citing the record's [n] reference. If nothing "
                       "is concerning, return an empty findings list and say so in the summary."),
    ),
    "create_record": Capability(
        id="create_record",
        name="Create",
        description="Create a new record here from a plain-language description — drafted for you to review and save.",
        applies_to=["*"],
        mode="on_demand",
        model_tier="balanced",
        autonomy_default="review",
        needs_fields=True,
        is_action=True,
        handler="persist_entity_record",
        system_prompt=("You convert a description and/or an attached image into ONE new record for this "
                       "section. You are given the section's fields (name, type, allowed options). If an "
                       "image of an invoice, bill or receipt is attached, read it carefully and extract: "
                       "vendor/payee, total amount, tax, date, and a short description of what was purchased. "
                       "Return ONLY a JSON object mapping field_name to value for the fields you can fill. "
                       "Use the allowed options exactly when provided. Use YYYY-MM-DD for dates and plain "
                       "numbers (no currency symbols) for amounts. Omit any field you cannot determine. "
                       "Output only the JSON object — no prose, no code fences."),
        render_input=lambda ctx: (f"Fields:\n{ctx.get('fields_desc', '')}\n\n"
                                  f"Description:\n{ctx.get('input') or ctx.get('text') or '(extract the record from the attached image)'}"),
    ),
    "update_record": Capability(
        id="update_record",
        name="Update",
        description="Change an existing record from a plain-language request — drafted for you to review and save.",
        applies_to=["*"],
        mode="on_demand",
        model_tier="balanced",
        autonomy_default="review",
        needs_fields=True,
        needs_retrieval=True,
        is_action=True,
        is_update=True,
        handler="update_entity_record",
        system_prompt=("You update ONE existing record. You are given the section's fields and either a "
                       "single current record OR a list of [n]-referenced candidate records. "
                       "If candidates are listed, identify which to change by its [n] and return "
                       '{"reference": <n>, "changes": {field_name: new_value, ...}}. '
                       "If a single current record is given (no [n]), return just "
                       '{"changes": {field_name: new_value, ...}}. '
                       "Use allowed options exactly when provided; YYYY-MM-DD for dates; plain numbers for "
                       "amounts. Include only the fields that change. Output only the JSON object — no prose, no code fences."),
        render_input=lambda ctx: (f"Fields:\n{ctx.get('fields_desc', '')}\n\n"
                                  f"Records:\n{ctx.get('data', '')}\n\n"
                                  f"Change request:\n{ctx.get('input') or ctx.get('text') or ''}"),
    ),
    "classify": Capability(
        id="classify",
        name="Train",
        description="Tag/classify an item — and teach the AI your categories so it improves over time.",
        applies_to=["*"],
        model_tier="fast",
        autonomy_default="suggest",
        system_prompt=("You are a classifier. Assign the single best short label/category to the input. "
                       "If a list of allowed labels is given, choose exactly one of them. "
                       "Reply with ONLY the label — no punctuation, no explanation."),
        render_input=lambda ctx: (
            (f"Allowed labels: {', '.join(ctx['labels'])}\n\n" if ctx.get("labels") else "")
            + "Item to classify:\n" + str(ctx.get("input") or ctx.get("text") or "")
        ),
    ),
    "ask": Capability(
        id="ask",
        name="Ask",
        description="Ask a question about this section's existing data — answers cite the records.",
        applies_to=["*"],
        model_tier="balanced",
        autonomy_default="suggest",
        needs_retrieval=True,
        system_prompt=("You answer questions ONLY from the supplied records below (each prefixed with a [n] "
                       "reference). Answer DIRECTLY and BRIEFLY, matched to what was asked:\n"
                       "- Lead with the answer in the first sentence. For a 'total'/'how much'/'how many', give the "
                       "single figure (and the count it's based on) up front.\n"
                       "- Keep it short — a sentence or two, or a few bullets at most. Do NOT print record-by-record "
                       "tables or list every record UNLESS the user explicitly asks to 'list', 'break down', or 'show each'.\n"
                       "- Cite the references you relied on like [1][3]; you need not cite every record.\n"
                       "- Use ONLY the supplied records, never outside/general knowledge. If the records don't contain "
                       "the answer, say so plainly in one line.\n"
                       "A simple question gets a simple, short answer; only go longer if the question genuinely needs it."),
    ),
    "manager_delegate": Capability(
        id="manager_delegate",
        name="Manager Delegate",
        description="A unit manager that turns your instruction into tasks and assigns them to its section experts.",
        applies_to=["*"],
        mode="manager",
        model_tier="fast",  # routing/decomposition — fast model is plenty and much quicker
        autonomy_default="review",
        output_schema=_DELEGATE_SCHEMA,
        system_prompt=_DELEGATE_SYSTEM,
        render_input=_render_delegate,
    ),
    "manager_dispatch": Capability(
        id="manager_dispatch",
        name="Division Dispatch",
        description="A division head that routes your instruction to the right unit managers, who run their experts.",
        applies_to=["*"],
        mode="manager",
        model_tier="fast",  # routing only
        autonomy_default="review",
        output_schema=_DISPATCH_SCHEMA,
        system_prompt=_DISPATCH_SYSTEM,
        render_input=_render_dispatch,
    ),
    "manager_ceo": Capability(
        id="manager_ceo",
        name="CEO Direction",
        description="A company-wide CEO that sets direction and delegates to its division heads.",
        applies_to=["*"],
        mode="manager",
        model_tier="fast",  # routing only
        autonomy_default="review",
        output_schema=_CEO_SCHEMA,
        system_prompt=_CEO_SYSTEM,
        render_input=_render_ceo,
    ),
    "synthesize": Capability(
        id="synthesize",
        name="Synthesise Report",
        description="Turns the team's raw reports into one executive decision note (findings + recommendations).",
        applies_to=["*"],
        mode="manager",
        model_tier="balanced",  # one synthesis call — worth the better model
        autonomy_default="review",
        output_schema=_SYNTH_SCHEMA,
        system_prompt=_SYNTH_SYSTEM,
        render_input=_render_synth,
    ),
    "manager_instruct": Capability(
        id="manager_instruct",
        name="Manager Instruction",
        description="A manager writes a clear, specific order for one of its specialists to carry out.",
        applies_to=["*"],
        mode="manager",
        model_tier="fast",
        autonomy_default="auto",
        system_prompt=("You are a manager directing one of your specialists on a single task. Given the task and "
                       "the context, write a SHORT, specific, actionable instruction (2-4 sentences) telling that "
                       "specialist exactly what to produce and what to prioritise. Address them directly. Do NOT do "
                       "the work yourself — just give the order. Return only the instruction text."),
    ),
}


def get_capability(capability_id: str) -> Optional[Capability]:
    return CAPABILITIES.get(capability_id)
