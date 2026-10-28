# Synthesis

Turn evidence into the token contract, atoms, and rules. Do this after capture; do not skip straight to markup.

## 1. Cluster colors

1. Collect candidates from computed styles and `palette.mjs`; merge near-duplicates (within ~3% per channel).
2. Sort by luminance and area share. Assign roles:

| Role | How to pick |
| --- | --- |
| `--surface-app` | largest low-chroma area (window chrome, sidebar) |
| `--surface-base` | main content background |
| `--surface-raised` | cards, popovers, dialogs |
| `--surface-inset` | inputs/wells (often darker than base) |
| `--surface-active` | selected row/tab background |
| `--surface-pill` | pills, secondary buttons |
| `--border-subtle/default/strong` | 1px separators, three contrast steps |
| `--fg-primary/secondary/tertiary/quaternary` | text by contrast against its surface |
| `--fg-placeholder` | lowest-contrast text still readable |
| `--action` | highest-chroma color used on primary buttons or selection |
| `--action-hover/pressed` | ±6–8% lightness from `--action` |
| `--focus` | accent, or slightly desaturated accent |
| `--status-*` | semantic hues (gray, amber, green/blue, red) used on badges |
| `--scrim` | dialog backdrop (usually black 35–55%) |

3. If the app exposes a second theme, extract it; otherwise derive it by inverting surface luminance and re-checking contrast. Mark derived values in `DESIGN.md`.
4. Validate contrast: body text ≥ 4.5:1, large text and UI ≥ 3:1. Adjust the text level, not the brand accent, when a check fails.

## 2. Define scales

- **Spacing**: collect paddings, gaps, and margins; snap to a 4px grid (2/4/6/8/12/16/24/32/48) unless the app clearly uses another grid. Define `--space-*` once.
- **Radius**: cluster measured radii into 3–6 values; keep a full-pill value (9999) if pills exist.
- **Type**: record size/weight/line-height per role; build an ascending scale (commonly 11/12/13/15/18/20/24/36) and use it everywhere.
- **Controls**: button/input heights (commonly 24/28/32/36) and row heights (28/36/44).
- **Padding**: split layout spacing (`--space-*`) from component padding (`--pad-*`); see the table in `references/components.md`.

Snap values only after measuring. If the app's real value is 7px, decide whether it belongs to the scale; if it is a genuine one-off (chart geometry, avatars), keep it out of the component system.

## 3. Build atoms

For each measured control, pick the closest atom in `references/components.md` and set its size, padding, radius, and colors from evidence. Do not invent variants the app does not have; do cover the five states using the app's overlay behavior. If no state is observable, derive it:

- hover = +4% white overlay (dark) / +4% black (light)
- pressed = +8% overlay
- focus = 1px accent ring
- disabled = 45% opacity

## 4. Write the rules

Produce `DESIGN.md` with:

1. Evidence table: element → measured size/padding/radius/colors/states.
2. Token tables: dark and light values with usage.
3. Scales: type, space, radius, control, padding.
4. Composition budgets: ≤3 surface levels per page; one primary action; borders separate; ≤2 text levels per line; no new atoms without the state matrix.
5. Do / Don't, in concrete terms.

## 5. Emit the bundle

```
tokens.css      # contract + extracted values (start from assets/starter/tokens.css)
system.css      # atoms (start from assets/starter/system.css)
gallery.html    # dynamic gallery (start from assets/starter/)
gallery.js
DESIGN.md
verify.mjs      # copy from scripts/
```

Keep token names exactly as in the starter contract; anything else breaks the atoms and the gallery.

## 6. Verify

1. `node verify.mjs <project>` — validates authored CSS/HTML against the project's own scales (parsed from `tokens.css`). Exit 1 means off-system values.
2. Open `gallery.html`; check dark and light; click swatches, menus, dialog, toast.
3. Compare screenshots side by side with the source: surfaces, text hierarchy, accent usage, density.
4. Fix deviations or list them explicitly, one line each, with the reason.
