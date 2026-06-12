#!/usr/bin/env python3
"""
After consolidation, each module's pages/components still contain hrefs and
router.push paths assuming the module lives at the root (e.g., href="/customers"
inside sales). Now that the module is mounted under /<slug>/, those paths must
be prefixed with /<slug>/.

This script rewrites:
  href="/something"          -> href="/<slug>/something"
  href={`/something${...}`}  -> href={`/<slug>/something${...}`}
  router.push("/something")  -> router.push("/<slug>/something")
  router.replace("/...")     -> router.replace("/<slug>/...")
  window.location.href = "/" -> window.location.href = "/<slug>"
  Link href="/..."           -> Link href="/<slug>/..."

Skips paths that:
  - point to core routes (login, nexacore, settings, ...)
  - point to /api/...
  - point to another module slug
  - are external (start with http)

Idempotent: a path that already starts with /<slug>/ is not double-prefixed.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORE_FE = ROOT / "modules/core/frontend/src"

# slug -> set of subdirectories that are app routes for that module (so we don't
# accidentally re-prefix a path that is already correctly prefixed).
MODULES = {
    "accounting": "accounting-finance",
    "administration": "administration",
    "crm": "crm",
    "customer-service": "customer-service",
    "hr": "human-resources",
    "inventory": "inventory-management",
    "marketing": "marketing",
    "pm": "project-management",
    "production": "production",
    "rd": "research-development",
    "sales": "sales",
    "scm": "supply-chain",
}

# Top-level core routes that should not be rewritten.
CORE_ROUTES = {
    "api", "branch", "forgot-password", "login", "register",
    "settings", "users", "roles", "notifications",
    "modules", "nexacore", "_next", "favicon.ico",
}

ALL_SLUGS = set(MODULES.keys())

def first_segment(path: str) -> str:
    """Return the first path segment of a path like /foo/bar."""
    p = path.strip().lstrip("/")
    return p.split("/", 1)[0].split("?", 1)[0].split("#", 1)[0]

def needs_prefix(path: str, slug: str) -> bool:
    """True if path should be prefixed with /<slug>/."""
    if not path or not path.startswith("/"):
        return False
    seg = first_segment(path)
    if seg in CORE_ROUTES:
        return False
    if seg in ALL_SLUGS:
        return False  # already mod-prefixed (this slug or another module)
    return True

# Patterns that contain a string-literal route. The capturing group `path`
# contains the raw route (without quotes). Literal-only — we ignore template
# literals with substitutions to avoid breaking them.
LITERAL_PATTERNS = [
    # JSX attribute: href="/customers"
    re.compile(r'(href=)(["\'])(/[^"\']*)(\2)'),
    # JSX attribute: to="/customers" (react-router style, occasionally used)
    re.compile(r'(\sto=)(["\'])(/[^"\']*)(\2)'),
    # Object literal property: href: "/customers"  or  href: '/customers'
    re.compile(r'(\bhref\s*:\s*)(["\'])(/[^"\']*)(\2)'),
    # Object literal property: to: "/customers"
    re.compile(r'(\bto\s*:\s*)(["\'])(/[^"\']*)(\2)'),
    # Object literal property: path: "/customers"
    re.compile(r'(\bpath\s*:\s*)(["\'])(/[^"\']*)(\2)'),
    # router.push("/customers"), router.replace("/foo")
    re.compile(r'(router\.(?:push|replace)\()(["\'])(/[^"\']*)(\2)'),
    # window.location.href = "/foo"
    re.compile(r'(window\.location\.href\s*=\s*)(["\'])(/[^"\']*)(\2)'),
    # redirect("/foo"), notFound is fine to skip
    re.compile(r'(redirect\()(["\'])(/[^"\']*)(\2)'),
    # Link href={"/foo"} (object form, less common)
    re.compile(r'(Link\s+href=\{?\s*)(["\'])(/[^"\']*)(\2)'),
]

# Template literal: href={`/foo${...}`} or router.push(`/foo${...}`)
# We only prefix the literal portion before the first ${, leaving substitutions intact.
TEMPLATE_PATTERN = re.compile(
    r'((?:href=\{`|router\.(?:push|replace)\(`|window\.location\.href\s*=\s*`|redirect\(`))(/[^`$]*)'
)

def rewrite_one(text: str, slug: str) -> tuple[str, int]:
    count = 0

    def repl_literal(m: re.Match) -> str:
        nonlocal count
        prefix, q1, path, q2 = m.group(1), m.group(2), m.group(3), m.group(4)
        if not needs_prefix(path, slug):
            return m.group(0)
        # path of "/" -> "/<slug>"; otherwise "/<slug>/<rest>"
        new_path = f"/{slug}" if path == "/" else f"/{slug}{path}"
        count += 1
        return f"{prefix}{q1}{new_path}{q2}"

    for pat in LITERAL_PATTERNS:
        text = pat.sub(repl_literal, text)

    def repl_template(m: re.Match) -> str:
        nonlocal count
        prefix, path = m.group(1), m.group(2)
        if not needs_prefix(path, slug):
            return m.group(0)
        new_path = f"/{slug}" if path == "/" else f"/{slug}{path}"
        count += 1
        return f"{prefix}{new_path}"

    text = TEMPLATE_PATTERN.sub(repl_template, text)
    return text, count

def process_module(slug: str) -> int:
    total = 0
    targets = [
        CORE_FE / "app" / slug,
        CORE_FE / "components" / slug,
        CORE_FE / "lib" / slug,
        CORE_FE / "context" / slug,
        CORE_FE / "hooks" / slug,
        CORE_FE / "utils" / slug,
        CORE_FE / "types" / slug,
    ]
    for root in targets:
        if not root.exists():
            continue
        for f in root.rglob("*"):
            if f.suffix not in (".tsx", ".ts", ".jsx", ".js"):
                continue
            if not f.is_file():
                continue
            text = f.read_text()
            new_text, n = rewrite_one(text, slug)
            if n:
                f.write_text(new_text)
                total += n
    return total

if __name__ == "__main__":
    grand = 0
    for slug in MODULES:
        n = process_module(slug)
        grand += n
        print(f"  {slug:<20} {n} rewrites")
    print(f"\nTotal: {grand} rewrites")
