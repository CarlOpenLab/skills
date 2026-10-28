# Components

Atoms only. Compose pages from these; do not add a new widget style for one screen. Sizes below are starter defaults — replace them with values measured from the target app.

## State matrix

| Component | default | hover | active | focus | disabled |
| --- | --- | --- | --- | --- | --- |
| Button | required | required | required | required | required |
| Icon button | required | required | — | required | required |
| Input / Textarea | required | optional | — | required | required |
| Pill / Select | required | required | — | required | — |
| Checkbox / Switch | required | — | — | required | required |
| Menu item | required | required | — | — | — |
| Tab | required | required | — | required | — |

States come from tokens: hover `--state-hover`, pressed `--state-pressed`, selected `--surface-active`, focus 1px `--focus`, disabled opacity 0.45.

## Atoms

| Atom | Spec | Notes |
| --- | --- | --- |
| Button | height 24/28/32, radius 9999 (primary) or 8 (secondary/ghost), font 12/500 | primary uses `--action`; secondary uses `--surface-raised` + border; ghost transparent; danger uses 14% priority-high tint |
| Icon button | 28×28, radius 8 or full | ghost or pill variant |
| Input | height 28/32, radius 8, inset surface, 1px border, padding 10/12 | focus: border `--focus` + 1px ring |
| Textarea | 15px, line-height 1.6, padding 8/10, min-height 76 | vertical resize |
| Pill / Select | height 24, radius 9999, padding 6/9, font 12/500 | leading icon then label |
| Checkbox | 16×16, radius 4, 1px strong border | checked fills `--action` |
| Switch | track 26×16, knob 12 | on: `--action` track, white knob |
| Status | 8px dot + 12px label | five statuses, color tokens only |
| Priority | 3 bars, 3px wide, heights 4/7/10 | level fills bars; urgent uses square glyph |
| Avatar | 16/20/24/28 circle | `--avatar-bg` / `--avatar-fg` |
| Kbd | height 18, min-width 20, padding 5, mono 11 | pill surface, 1px border, tertiary text |
| Tooltip | pill surface, 12px, radius 6 | appears on hover |
| Tabs | height 28, radius 9999, padding 10 | active = `--surface-active` |
| Menu | raised surface, radius 10, shadow-lg, item height 30, padding 8 | items show kbd shortcuts right-aligned |
| Card | raised surface, radius 10, border subtle, padding 16 | one level of nesting max |
| Dialog | raised surface, radius 12, shadow-lg, width ~460, padding 16 | backdrop `--scrim`; layer above menu/drawer |
| Toast | pill surface, radius 8, auto-dismiss ~1.6s | bottom center |

## Composition budgets

1. Surfaces: at most three levels per page (app → base → raised); overlays above.
2. Accent: one primary action per view; everything else secondary/ghost.
3. Borders: 1px subtle for containers, default for popovers; never decorative.
4. Text: at most two levels per line; meta stays at quaternary or above.
5. Density: rows 36/44, pills 24, controls 28, kbd 18. No 26/30-style in-between sizes.
6. New component: compose from existing atoms first; if truly new, reuse existing tokens, radii, and the state matrix.

## Do

- Map every color to a semantic token.
- Use `--space-*` between components and `--pad-*` inside them.
- Cover all five states for interactive atoms.
- Compose lists, forms, and dialogs from the atoms above.

## Don't

- Don't introduce hex/rgb colors, new radii, or new font sizes.
- Don't use the accent as a large background or decoration.
- Don't use borders as decoration or status colors as brand colors.
- Don't add a page-specific button or input style.
- Don't use shadows for hierarchy when a surface level would do.
