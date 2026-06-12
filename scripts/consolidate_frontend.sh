#!/usr/bin/env bash
# Consolidates each module's frontend code into core-frontend.
# Idempotent: deletes target module subdirs before copying, so re-running
# starts from a clean slate.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE_FE="$ROOT/modules/core/frontend/src"

# format: "<source-module-dir>:<core-app-slug>"
MODULES=(
  "accounting-finance:accounting"
  "administration:administration"
  "crm:crm"
  "customer-service:customer-service"
  "human-resources:hr"
  "inventory-management:inventory"
  "marketing:marketing"
  "production:production"
  "project-management:pm"
  "research-development:rd"
  "sales:sales"
  "supply-chain:scm"
)

rewrite_imports() {
  local slug="$1"
  local target_dir="$2"
  # Rewrite module-internal imports to namespaced paths
  find "$target_dir" \( -name "*.tsx" -o -name "*.ts" \) -type f 2>/dev/null | while read -r f; do
    # @/lib/X  -> @/lib/<slug>/X
    # @/components/X -> @/components/<slug>/X
    # @/types/X -> @/types/<slug>/X
    # @/context/X -> @/context/<slug>/X
    # @/hooks/X -> @/hooks/<slug>/X
    # @/utils/X -> @/utils/<slug>/X
    perl -i -pe "
      s|(from\s+['\"])\@/lib/|\${1}\@/lib/${slug}/|g;
      s|(from\s+['\"])\@/components/|\${1}\@/components/${slug}/|g;
      s|(from\s+['\"])\@/types/|\${1}\@/types/${slug}/|g;
      s|(from\s+['\"])\@/context/|\${1}\@/context/${slug}/|g;
      s|(from\s+['\"])\@/hooks/|\${1}\@/hooks/${slug}/|g;
      s|(from\s+['\"])\@/utils/|\${1}\@/utils/${slug}/|g;
    " "$f"
  done
}

for entry in "${MODULES[@]}"; do
  src_module="${entry%%:*}"
  slug="${entry##*:}"
  module_fe="$ROOT/modules/$src_module/frontend/src"

  if [ ! -d "$module_fe" ]; then
    echo "SKIP $src_module (no frontend src dir)"
    continue
  fi

  echo "==== $src_module → /$slug ===="

  # ---------- 1. App routes ----------
  rm -rf "$CORE_FE/app/$slug"
  mkdir -p "$CORE_FE/app/$slug"

  # Copy each subdirectory under app/ (the actual route folders).
  # Use basename to avoid `cp -R src/ dst/` flattening the contents.
  if [ -d "$module_fe/app" ]; then
    for d in "$module_fe/app"/*/; do
      [ -d "$d" ] || continue
      base="$(basename "$d")"
      cp -R "${d%/}" "$CORE_FE/app/$slug/$base"
    done
    # Copy module root page.tsx as the dashboard at /<slug>/page.tsx
    [ -f "$module_fe/app/page.tsx" ] && cp "$module_fe/app/page.tsx" "$CORE_FE/app/$slug/page.tsx"
    # Convert module layout.tsx to a nested layout (strip html/body, drop globals.css import)
    if [ -f "$module_fe/app/layout.tsx" ]; then
      python3 - "$module_fe/app/layout.tsx" "$CORE_FE/app/$slug/layout.tsx" <<'PY'
import re, sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text()
out = sys.argv[2]
# Drop the "./globals.css" import (root-only)
src = re.sub(r'import\s+["\'](?:\./)?globals\.css["\'];?\s*\n', '', src)
# Replace <html ...><body ...>...</body></html> with just the body's children
# We use a permissive multi-line match.
m = re.search(r'<html\b[^>]*>\s*<body\b[^>]*>(.*)</body>\s*</html>', src, re.DOTALL)
if m:
  inner = m.group(1).strip()
  src = src[:m.start()] + '<>' + inner + '</>' + src[m.end():]
pathlib.Path(out).write_text(src)
PY
    fi
  fi

  # ---------- 2. lib ----------
  rm -rf "$CORE_FE/lib/$slug"
  if [ -d "$module_fe/lib" ]; then
    mkdir -p "$CORE_FE/lib/$slug"
    cp -R "$module_fe/lib/"* "$CORE_FE/lib/$slug/" 2>/dev/null || true
  fi

  # ---------- 3. components ----------
  rm -rf "$CORE_FE/components/$slug"
  if [ -d "$module_fe/components" ] && [ "$(ls -A "$module_fe/components" 2>/dev/null)" ]; then
    mkdir -p "$CORE_FE/components/$slug"
    cp -R "$module_fe/components/"* "$CORE_FE/components/$slug/" 2>/dev/null || true
  fi

  # ---------- 4. types/context/hooks/utils (if module has them) ----------
  for sub in types context hooks utils; do
    rm -rf "$CORE_FE/$sub/$slug"
    if [ -d "$module_fe/$sub" ] && [ "$(ls -A "$module_fe/$sub" 2>/dev/null)" ]; then
      mkdir -p "$CORE_FE/$sub/$slug"
      cp -R "$module_fe/$sub/"* "$CORE_FE/$sub/$slug/" 2>/dev/null || true
    fi
  done

  # ---------- 5. Rewrite imports in everything we just copied ----------
  for sub in app/$slug lib/$slug components/$slug types/$slug context/$slug hooks/$slug utils/$slug; do
    [ -d "$CORE_FE/$sub" ] && rewrite_imports "$slug" "$CORE_FE/$sub"
  done

  echo "  done."
done

# Patch any nested layouts that reference ModuleGuard but never imported it
# (some originals had this bug and we faithfully copied it).
for layout in "$CORE_FE/app"/*/layout.tsx; do
  if grep -q "<ModuleGuard" "$layout" && ! grep -q "import.*ModuleGuard" "$layout"; then
    perl -i -pe '
      if (!$done && /^import /) {
        $first_import_line = $. unless $first_import_line;
      }
      if (!$done && (/^\s*$/ || (!/^import / && $first_import_line))) {
        print "import ModuleGuard from \"\@shared/components/ModuleGuard\";\n";
        $done = 1;
      }
    ' "$layout"
    echo "  patched ModuleGuard import: $layout"
  fi
done

echo
echo "All modules consolidated into core-frontend."
