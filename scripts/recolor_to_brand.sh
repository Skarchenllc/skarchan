#!/usr/bin/env bash
#
# Unify brand colours to the SINGLE SOURCE OF TRUTH:
#   indigo  #5147e6 / #5147E6   ->  navy   #002868   (primary)
#   green   #006600             ->  green  #01411C   (secondary / Pakistan green)
#
# The indigo crept in via the dashboard handoff; the intended brand (and the
# tailwind.config / ThemeContext defaults) is navy + green. This rewrites the
# hard-coded hex literals scattered through component source — inline styles,
# SVG fills, chart palettes, and Tailwind arbitrary classes like bg-[#5147e6].
#
# globals.css is intentionally SKIPPED: this patch already tokenises it to
# var(--color-primary), so it must not be sed-rewritten.
#
# Run from the repo root (the dir containing `modules/` and `shared/`):
#   bash scripts/recolor_to_brand.sh
#
# A .bak copy is written next to each changed file. Review the diff, then:
#   find . -name '*.bak' -delete
#
set -euo pipefail

# Source files only — NOT *.css (the design-system stylesheet is tokenised).
mapfile -d '' FILES < <(
  grep -rlIZ \
    --include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.js' \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=dist \
    -e '#5147e6' -e '#5147E6' -e '#006600' . 2>/dev/null || true
)

if [ ${#FILES[@]} -eq 0 ]; then
  echo "Nothing to recolour — already unified."
  exit 0
fi

printf 'Recolouring %d file(s)…\n' "${#FILES[@]}"
sed -i.bak \
  -e 's/#5147e6/#002868/g' \
  -e 's/#5147E6/#002868/g' \
  -e 's/#006600/#01411C/g' \
  "${FILES[@]}"

echo "Done. Backups written as *.bak."
echo "Review the diff, then remove them with:  find . -name '*.bak' -delete"
