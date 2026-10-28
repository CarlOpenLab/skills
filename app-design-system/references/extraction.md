# Extraction

Goal: collect measurable evidence, not impressions. Record numbers and screenshots before inventing anything.

## 1. Pick the capture path

| Target | Path |
| --- | --- |
| Web app (URL) | ego-browser: DOM + computed styles + screenshots |
| Desktop app | `scripts/capture-window.ps1` on the foreground window + palette sampling |
| Screenshots only | `scripts/palette.mjs` + visual measurement |

## 2. Web capture

Open the app with ego-browser and run one inspection pass. Collect in a single `page.evaluate`:

- `getComputedStyle(document.documentElement)` custom properties (filter `--`).
- `[...document.fonts]` families and weights.
- Computed styles for representative elements: `body`, `h1`–`h3`, buttons (each variant), inputs, links, nav items, cards, tabs, menu items, table rows, badges, avatars.
- For each element return: `color`, `backgroundColor`, `border`, `borderRadius`, `boxShadow`, `padding`, `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, and its bounding box.

Then capture states:

1. default screenshot;
2. hover (`mouse.move` over a primary button, nav item, list row), screenshot;
3. focus (`keyboard.press("Tab")` until the control is focused), screenshot;
4. open a menu and a dialog (click, screenshot, then `Escape`);
5. disabled state if one exists on screen; otherwise record "not observable".

Also record: viewport size, devicePixelRatio, theme (`data-theme`/class), and whether the app has a light mode (try toggling if visible).

For canvas/WebGL apps (chart editors, design tools) the DOM is opaque: fall back to screenshots + `palette.mjs`, and measure geometry from pixels.

## 3. Desktop capture

On Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/capture-window.ps1 -Out C:\tmp\app-default.png
```

The script captures the foreground window. Ask the user to bring the app forward and, one by one, show:

- default list/detail screen
- a menu open
- a dialog open
- an input focused
- a disabled control, if any

Capture each state, then sample colors with `palette.mjs`.

If the window has a 1x/2x display scale, note the DPR so measured pixels map to CSS pixels.

## 4. Color sampling

Prefer computed styles. Use pixel sampling for screenshots:

```bash
node scripts/palette.mjs shot.png --top 16
```

Output: hex, share of sampled pixels, luminance, chroma, and a role hint (`surface`, `border`, `text`, `accent`, `status`). Treat hints as suggestions; confirm against the screenshot.

Crop or sample UI regions only: exclude illustrations, photos, avatars, and wallpapers, which otherwise dominate the histogram.

## 5. Record sheet

Keep a scratch table while measuring. One row per element/state:

| element | size | padding | radius | bg | border | text | font | states seen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| primary button | 28h | 10 | 9999 | accent | none | #fff | 12/500 | hover, active, focus, disabled |
| input | 28h | 10 | 8 | inset | 1px subtle | secondary | 13/450 | focus |
| list row | 44h | 8/10 | 8 | transparent | none | primary | 13/500 | hover, selected |

This table becomes the evidence section of `DESIGN.md`.

## 6. Pitfalls

- **Animations**: wait for transitions to settle before screenshots; sample after 300ms.
- **Themes**: extract the theme the user actually sees first; only derive the other theme if the app exposes it.
- **Transparency**: `rgba()` surfaces stack; composite them mentally or sample the rendered screenshot instead of reading the declaration.
- **Sticky chrome**: full-page screenshots repeat headers; sample the viewport screenshot for colors.
- **Gradients and images**: do not turn them into tokens; record the base color and keep the gradient as an asset.
- **Accent overload**: a brand color used across charts is not automatically the action color; check buttons and selection.
- **Unobservable states**: if hover/disabled cannot be triggered, derive them from the state overlay rule and mark them as derived in `DESIGN.md`.
