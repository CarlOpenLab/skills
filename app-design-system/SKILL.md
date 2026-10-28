---
name: app-design-system
description: Capture an app's visual language from a web URL, screenshots, or a running desktop app, then turn it into a reusable design system with semantic tokens, type/space/radius scales, component atoms, rules, and a verifier. Use when the user wants to extract or clone an existing app's design, build design tokens or a design system from a reference product, capture colors and components from screenshots, restyle UI to match a given app, or audit UI against extracted tokens.
---

# App Design System

## Overview

Turn any app into a reusable design system: measure it, distill it into semantic tokens and a small atom set, then build new UI from those tokens only. The target can be a web app (URL), a desktop app (running window), or screenshots the user provides.

## Hard rules

1. Extract before designing. Every token value must come from a measurement (computed style, CSS variable, or pixel sample) — never invented.
2. Define each scale once (type, space, radius, control height), then use only values from those scales.
3. Components reference semantic tokens only: `--surface-*`, `--border-*`, `--fg-*`, `--action*`, `--focus`, `--status-*`, `--priority-*`.
4. Every interactive atom covers default / hover / active / focus / disabled. If a state is not observable, derive it from the system's overlay rule and say so.
5. One primary action per view; accent is only for primary action, selection, and key status.
6. Borders separate, never decorate. States use overlays, not new colors.
7. Compose from existing atoms first. Add a new atom only by reusing the token contract and state matrix.

## Workflow A — extract a design system from an app

1. **Identify the target**: web URL, desktop window, or image files. Ask only if ambiguous.
2. **Capture** (see `references/extraction.md`):
   - Web: open with ego-browser; screenshot viewport and full page; collect all CSS custom properties, fonts, and computed styles of key components; trigger hover/focus/open-menu/open-dialog and capture each.
   - Desktop: run `scripts/capture-window.ps1` against the foreground window; ask the user to show dialogs, menus, and disabled states; capture each.
   - Images: use them directly.
3. **Sample colors**: prefer computed styles. For canvas/WebGL/desktop, run `node scripts/palette.mjs <png> --top 16` and map clusters to roles.
4. **Inventory atoms and states**: list every visible control and record size, padding, radius, colors, and states in a scratch table.
5. **Synthesize** (see `references/synthesis.md`): cluster colors into 6 surfaces / 3 borders / 5 text levels / 1 accent / status colors; define scales; build atoms.
6. **Emit the bundle** into the user's project:
   - `tokens.css` from `assets/starter/tokens.css` with extracted values
   - `system.css` from `assets/starter/system.css` (atom styles)
   - `gallery.html` + `gallery.js` from `assets/starter/`
   - `DESIGN.md` with measured evidence, scales, and rules
   - `scripts/verify.mjs` copied in
7. **Validate**: `node scripts/verify.mjs <project>`; open `gallery.html` in both themes; compare screenshots against the source in one line per difference.

## Workflow B — build new UI with a system

1. Copy `tokens.css` (and `system.css` when using `.ds-*` atoms) into the project.
2. Inventory the request; list the atoms needed.
3. Copy matching files from `snippets/`.
4. Lay out with `--space-*` between components and `--pad-*` inside them.
5. Run `verify.mjs`; fix errors; check both themes.

## Workflow C — port an existing page/component into a system

1. Inventory elements and classify surface / border / text / accent / status.
2. Map each element to the closest atom; compose from atoms when nothing fits.
3. Rebuild with `.ds-*` classes and semantic tokens; snap spacing, radii, and type to the scales.
4. Keep original metrics only where the system has no equivalent (page widths, chart geometry).
5. Verify and report intentional deviations in one line.

## Resources

- `references/extraction.md` — capture recipes for web, desktop, and images; what to measure and how to trigger states.
- `references/synthesis.md` — clustering colors, deriving scales, atom inventory, output contract.
- `references/components.md` — atom specs, state matrix, composition budgets.
- `assets/starter/` — neutral tokens template, atom CSS, dynamic gallery.
- `assets/examples/linear/` — a complete worked example (tokens, atoms, gallery) for reference.
- `snippets/` — copy-paste markup: button, input, pill/kbd, controls, menu/tabs, card/dialog/toast.
- `scripts/verify.mjs` — validates declarations against the project's own token scales; exit 1 on errors.
- `scripts/palette.mjs` — PNG color sampler with role hints.
- `scripts/capture-window.ps1` — Windows screenshot of the foreground window.

## Checklist

- [ ] Every token traces to a measurement; evidence recorded in DESIGN.md.
- [ ] Scales defined once; no off-scale values in authored CSS.
- [ ] Atoms cover all five states.
- [ ] One primary action; accent not decorative.
- [ ] `verify.mjs` exits 0 (warnings reviewed).
- [ ] Gallery renders both themes; screenshots compared with the source.
