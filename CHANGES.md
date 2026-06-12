# UI Patch 1 — Print + Readability pass

> **Patch 2 (Colour consolidation) is documented at the bottom of this file.**

Goal: **minimal · easy to read · print-friendly**, with no change to the existing
flat/square aesthetic. Three low-risk, self-contained changes.

## Files in this patch (drop into the matching paths in `systems/`)

| This bundle | → Goes to |
|---|---|
| `modules/core/frontend/src/app/globals.css` | `systems/modules/core/frontend/src/app/globals.css` |
| `shared/components/DashboardCard.tsx` | `systems/shared/components/DashboardCard.tsx` |
| `shared/components/ModuleKpis.tsx` | `systems/shared/components/ModuleKpis.tsx` |

> `globals.css` is per-module. After updating the core copy, re-run your
> `scripts/consolidate_frontend.sh` (or copy it into each module's
> `frontend/src/app/`) so every module picks up the change. The two shared
> components are bind-mounted, so they propagate automatically.

## What changed

### 1. `globals.css` — appended one block at the very end
Added last so it wins the cascade over the existing flatten-everything rules.
It introduces three things and **touches nothing above it**:

- **Protected status palette.** `.status-success / -warning / -danger / -info`
  (text) and `.status-bg-*` (tinted surface) plus a `.status-badge` pill.
  These survive the global colour-flatten, so status meaning no longer has to
  be re-hacked with inline styles on every page. The badge carries a 1px
  outline in its own colour, so it still reads when fills are dropped on print.
- **Hairline card borders.** A 1px `#e5e7eb` border on `.surface / .card /
  .kpi-card / .dashboard-card` and the existing rounded-lg+padding "card"
  heuristic. Borders read better on screen than the old background-tint
  separation — and unlike tints, they survive printing.
- **Global print stylesheet (`@media print`).** Every screen now prints
  cleanly: hides the sidebar, top bar, search and buttons; expands `main` to
  full width; forces black-on-white; borders cards; repeats `<thead>` on each
  page; prevents rows/cards from splitting across pages; sets a 14 mm page
  margin. (The bespoke `EntityList` print window still works and is unaffected.)

### 2. `DashboardCard.tsx` & `ModuleKpis.tsx`
Swapped the inline `box-shadow` (which the global rules strip anyway, so it
never rendered) for a real `1px solid #e5e7eb` border, and added the
`surface` + `dashboard-card` / `kpi-card` classes so the new CSS and the print
rules can target them. No API/prop changes.

## How to verify
1. Open any module dashboard or list → cards now have a clean hairline border.
2. **Cmd/Ctrl-P** on any page → print preview shows full-width, black-on-white,
   bordered tables/cards with no sidebar/top bar; table headers repeat per page.

## Using the status palette (optional, where you want status to read)
```tsx
<span className="status-badge status-danger">Overdue</span>
<span className="status-badge status-success">Paid</span>
<td className="status-warning">Due soon</td>
```

## Status of the review list
All items from the original review are now addressed across Patches 1–4
(print, borders, status palette, colour unification, reading width, sticky
headers, radius/flat declaration, chart palette). Per-module UI polish is the
next phase, handled module by module.

---

# UI Patch 2 — Colour: one source of truth

Goal: collapse the **three divergent colour definitions** into one.
Before this patch: `tailwind.config.js` said navy `#002868` / green `#006600`,
the CSS variables said indigo `#5147e6` / green `#01411C`, and ~250 component
literals hard-coded indigo `#5147e6`. The indigo crept in via the dashboard
handoff; the *intended* brand (and the existing config + ThemeContext defaults)
is **navy + green**.

**Canonical palette (now matched everywhere):**
- `--color-primary: #002868`  — USA Old-Glory navy (primary / actions / links)
- `--color-secondary: #01411C` — Pakistan flag green (secondary / success)
- dark variants `#001845` (navy) and `#012E14` (green)

## Files in this patch
| This bundle | → Goes to |
|---|---|
| `modules/core/frontend/src/app/globals.css` | same as Patch 1 (now also colour-tokenised) |
| `modules/core/frontend/tailwind.config.js` | `systems/modules/core/frontend/tailwind.config.js` |
| `scripts/recolor_to_brand.sh` | `systems/scripts/recolor_to_brand.sh` (run once) |

## What changed
1. **`globals.css`** — `--color-primary` is now `#002868` (was `#5147e6`), and
   all 23 hard-coded indigo *values* inside the file were replaced with
   `var(--color-primary)`, so the stylesheet is token-driven. The brand-colour
   selectors now match **both** the legacy `bg-[#5147e6]` and the canonical
   `bg-[#002868]` arbitrary classes. A "SINGLE SOURCE OF TRUTH" comment marks
   the `:root` palette.
2. **`tailwind.config.js`** — `secondary` unified to `#01411C` (was `#006600`),
   added the dark variant, and a header comment tying it to the CSS vars.
3. **`scripts/recolor_to_brand.sh`** — a one-shot codemod for the literals I
   can't reach component-by-component. It rewrites, across `*.tsx/.ts/.jsx/.js`
   (NOT `*.css`): `#5147e6 → #002868` and `#006600 → #01411C`. This also fixes
   `ThemeContext.tsx` (its green default + selector list) automatically.

## How to apply (order matters)
1. Drop in the updated `globals.css` + `tailwind.config.js`.
2. From the repo root: `bash scripts/recolor_to_brand.sh`
3. Review the diff (`.bak` files are written next to each change), then
   `find . -name '*.bak' -delete`.
4. Re-run `scripts/consolidate_frontend.sh` so every module gets the updated
   `globals.css`. Rebuild.

## Result
One navy + one green, defined in three lockstep places (CSS vars · tailwind
theme · ThemeContext defaults). Changing the brand later is a one-line edit per
place; components should reference `var(--color-primary)` / `bg-primary` going
forward rather than new raw hexes. The theme switcher in Settings now also
recolours the previously-indigo arbitrary classes.

---

# UI Patch 3 — Reading width + sticky table headers

Goal: easier reading of long data screens (your stated priority), with no
visual-style change. Two additions, both opt-in so nothing else moves.

## Files in this patch
| This bundle | → Goes to |
|---|---|
| `modules/core/frontend/src/app/globals.css` | same file as Patches 1–2 (one more appended block) |
| `shared/components/EntityList.tsx` | `systems/shared/components/EntityList.tsx` |
| `shared/components/DynamicEntityForm.tsx` | `systems/shared/components/DynamicEntityForm.tsx` |

## What changed
1. **Reading measure (`.measure` / `.measure-wide`).** The global reset strips
   Tailwind's `max-w-*`, so single-column forms and detail text were spanning
   the full ~1500px content width (90+ char lines). New opt-in utilities cap a
   column to a comfortable width — `.measure` = 44rem (forms/detail),
   `.measure-wide` = 72rem (prose-heavy pages). Data **tables stay full-bleed**.
   - Applied to `DynamicEntityForm`'s root `<form>`, so **every module's
     create/edit form** now reads at a sane width automatically.
   - Verified: form column renders at 704px instead of full-bleed.
2. **Sticky table headers (`.table-scroll`).** Add `table-scroll` to the
   element that directly wraps a `<table>` and the header stays frozen while
   rows scroll (max-height ≈ viewport − 16rem). A pseudo-element redraws the
   header's bottom border, which `border-collapse` otherwise drops when stuck.
   - Applied to the shared `EntityList` table wrapper (swapped its
     `overflow-hidden` for `table-scroll`), so **every list view** in every
     module gets a frozen header on long lists.
   - Verified in-browser: `thead` is `position: sticky` and stays pinned to the
     container top after scrolling.

## How to apply
Drop the three files in, re-run `scripts/consolidate_frontend.sh`, rebuild.
No prop or API changes; both features are additive/opt-in.

## Using the utilities on bespoke pages
```tsx
{/* cap a detail/read pane to a readable column */}
<div className="measure"> … </div>

{/* freeze the header on any custom table */}
<div className="table-scroll"><table> … </table></div>
```

---

# UI Patch 4 — Flat/square declaration + chart palette

Goal: tidy the two leftover items from the review.

## Files in this patch
| This bundle | → Goes to |
|---|---|
| `modules/core/frontend/src/app/globals.css` | same file as Patches 1–3 (one token changed) |
| `shared/components/chartColors.ts` | `systems/shared/components/chartColors.ts` (new) |
| `modules/core/frontend/src/app/hr/page.tsx` | `systems/modules/core/frontend/src/app/hr/page.tsx` |

## What changed
1. **Flat/square is now declared, not just enforced.** `--border-radius` is set
   to `0` with a comment (was `0.375rem`, which the "90s MINIMAL" block already
   overrode to 0 — so the token now matches reality instead of contradicting
   it). Shadows were already resolved in Patch 1 (borders). This closes the
   "components-vs-override" conflict: square + flat is the documented system;
   components should stop hand-rolling radius/shadow that the system strips.
2. **Chart colour: single source of truth.** New `shared/components/chartColors.ts`
   exports a curated **categorical** palette (`CHART_COLORS`, `chartColor(i)`,
   `CHART_SEMANTIC`) — brand-led, high-contrast, solid (flat) hues. After the
   colour unification, monochrome "navy ramp" palettes made adjacent
   pie/bar slices nearly identical; this fixes that.
3. **Applied to the HR dashboard** (`hr/page.tsx`): its donut palette was a
   navy-only ramp → swapped for the distinct categorical set, and its remaining
   indigo chart strokes/links were converted to navy. Other modules' charts get
   `chartColors.ts` adopted during the per-module UI pass.

## How to adopt in other charts (per-module pass)
```tsx
import { chartColor, CHART_SEMANTIC } from '@shared/components/chartColors';
// pie/bar series:        fill={chartColor(i)}
// single-series brand:   stroke={CHART_SEMANTIC.primary}
// up/down P&L:           color={v >= 0 ? CHART_SEMANTIC.positive : CHART_SEMANTIC.negative}
```

## Apply
Drop the files in, run the Patch 2 codemod if not already, re-run
`consolidate_frontend.sh`, rebuild.

---

# UI Patch 5 — Public landing page ("/") rebuild

Goal: fix the marketing landing at `/` (`src/app/page.tsx`). It renders WITHOUT
the AppShell but still inherits the global app-chrome reset, which was breaking
it badly.

## File
| This bundle | → Goes to |
|---|---|
| `modules/core/frontend/src/app/page.tsx` | `systems/modules/core/frontend/src/app/page.tsx` |

## Bugs fixed (all caused by the global reset hitting an un-shelled page)
- **CTA band text was invisible** — navy section (inline) + `text-white` headings
  flattened to navy → navy-on-navy. Now white via a scoped dark scope.
- **Footer was broken** — `bg-gray-900` flattened to white with miscoloured
  text. Now a proper dark footer.
- **Sections blended together** — `bg-gray-50` flattened to white. Restored
  with an explicit tint surface.
- **Cards had no definition** — reset stripped `shadow` *and* `border-2`. Now
  bordered.
- **Icons mis-coloured** — every SVG forced slate, so the logo on navy was
  low-contrast and check marks turned grey. Now white-on-chip / green checks.
- **Filled buttons** — `html a{color:navy!important}` made the green "Get
  Started" read navy-on-green. Now correct white labels.
- **Weak hero** — headline was size-capped + forced black; added a real hero
  scale (`.text-hero`), a sub-headline, an eyebrow, and a tricolour brand stripe.

## Approach
Rather than fight the global reset rule-by-rule, the page now ships a **scoped
`lp-*` style block** (specificity-boosted `html …` + `!important`) that
re-asserts an intentional flat, navy + green marketing look for this one public
route. Brand colours still come from the white-label theme
(`theme.primaryColor` / `secondaryColor`), so re-skinning per tenant still works.
Content (features, modules, pricing, CTA, footer) and the active-module /
auth-redirect logic are unchanged. Verified by rendering the markup under a
replica of the harshest reset rules — all sections legible and on-brand.

## Elegance refinement
Hero tuned for "minimal but prominent": removed the tricolour stripe, turned the
filled eyebrow pill into a quiet letter-spaced kicker (a short navy rule + label),
enlarged the headline (`clamp(2.4rem, 6vw, 4rem)`), and replaced the heavy second
button with a clean navy text-link. One solid primary action; everything else
restrained.

## Apply
Drop the file in, rebuild. No new dependencies; module list + auth behaviour
unchanged.
