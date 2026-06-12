#!/usr/bin/env python3
"""
Removes the descriptive <p> sub-heading that appears directly after a page
<h1> in module pages. Common pattern:

    <h1 className="text-3xl font-bold ...">Customers</h1>
    <p className="text-sm text-gray-600 mt-1">Manage your customers...</p>

After this script:

    <h1 className="text-3xl font-bold ...">Customers</h1>

Only matches <p> with description-style classes (text-gray-* / text-sm / mt-*)
to avoid removing real content paragraphs that happen to follow a heading.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "modules/core/frontend/src/app"

# Match: closing </h1>, </h2>, or </h3> followed by whitespace and a <p>
# with description-ish classes. The <p> must be self-contained (no nested
# tags) and have a class that looks like description styling.
H_THEN_P = re.compile(
    r"(</h[1-3]>)\s*\n\s*"
    r"<p\b[^>]*"
    # Class must include at least one description-typical token. This keeps
    # us from removing arbitrary paragraphs.
    r"className=[\"']\s*[^\"']*"
    r"(?:text-gray-|text-sm|text-xs|text-muted|mt-1|mt-2)"
    r"[^\"']*[\"']"
    r"[^>]*>"
    # Body: any content that doesn't contain a tag-opening <
    r"[^<]{0,500}"
    r"</p>",
    re.MULTILINE,
)
# Backwards-compat name kept so other places in this module still work
H1_THEN_P = H_THEN_P

count_total = 0
files_changed = 0

# Search both pages (app/) and components/ since some sub-headings live in
# Modal/Dialog components rather than page files.
SEARCH_ROOTS = [
    ROOT / "modules/core/frontend/src/app",
    ROOT / "modules/core/frontend/src/components",
]

for search_root in SEARCH_ROOTS:
    for f in search_root.rglob("*.tsx"):
        text = f.read_text()
        new_text, n = H_THEN_P.subn(r"\1", text)
        if n:
            f.write_text(new_text)
            count_total += n
            files_changed += 1
            rel = f.relative_to(ROOT)
            print(f"  {n}x  {rel}")

print(f"\nRemoved {count_total} sub-heading paragraphs across {files_changed} files.")
