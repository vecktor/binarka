# Real-browser check: reconcile-ux-accessibility

Run 2026-10-09, about 01:40 to 01:57 (UTC+5:30), on commit `85485ac` (green), `npm run dev` (Vite, port 5191), in the
Claude desktop app's built-in browser (Chromium), light colour scheme, viewports 375×812 and 1280×800. Facts below come
from DOM script reads and real key presses sent by the browser tool (not synthetic `dispatchEvent`); the screenshots
illustrate them. This is observed evidence for this change, not a pass of the held NFR-10 to NFR-14. Puzzles came from
the page's own random seeds, so boards differ between shots.

| Task | Observed | Evidence |
|---|---|---|
| 5.1 | 375 px: `.board` is `display: grid`, 6 columns of 48 px, 36 button children; no horizontal scroll (scrollWidth 375). Verifies 3.5. | `375-mount-85485ac.jpg`, `1280-mount-3d4e488.jpg` (1280 at mount, taken in the re-run) |
| 5.2 | Violation (row 4, four 0s): six cells `aria-invalid="true"`, border 3 px vs ordinary 1 px and given 2 px, red fill. 8×8 at 375 px: cells 41.1 px, no horizontal scroll. Checked size button distinguishable (bold, blue border). | `375-violation-85485ac.jpg`, `375-8x8-85485ac.jpg`, `1280-8x8-3d4e488.jpg` (re-run: no dialog on an untouched board, no horizontal scroll at 1280); drift notes in `375-drift-notes.md` |
| 5.3 | Board `role="group"` named «Поле 6×6»; a given cell is a button named «Рядок 1, стовпець 4, 0, задано» with `aria-disabled="true"`; size control `radiogroup` «Розмір поля» with three radios (6×6 checked); hint and win `role="status"`, `display: block`, height 0 while empty (FR-63: rendered); idle line has no role; no `tabindex` anywhere; ids exactly `rules-panel-1`, `rules-title-1`, `confirm-text-1`. **Not done as written:** the Chromium DevTools Accessibility pane is not reachable from the built-in browser, so no pane screenshot exists; the facts were read from the DOM instead. | DOM read (this file) |
| 5.4 | 43 real Tab presses from the page: «Правила», «Поле 4×4», «Поле 6×6», «Поле 8×8», cells 1,1 to 6,6 in reading order, «Підказка», «Скинути», «Нова головоломка». On a given cell (1,2): Enter, Space, ArrowRight, Home, End changed no cell, focus stayed, the page did not scroll (scrollY 0). Re-run on 3d4e488: on the empty player cell (1,1), reached by five real Tab presses, ArrowRight, ArrowDown, Home and End changed no cell, focus stayed and matched `:focus-visible`, scrollY 0; 36 more Tab presses reached «Підказка», also `:focus-visible`. | DOM read; `1280-focus-cell-3d4e488.jpg` (ring on cell 1,1), `1280-focus-button-3d4e488.jpg` (ring on «Підказка») |
| 5.4a | Real Enter ×3 then Space ×3 on empty cell 1,1: "" → 0 → 1 → "" → 0 → 1 → "", focus on the cell after every press. Enter on «Поле 8×8» with an entry on the board: the dialog opened with focus on «Скасувати»; Tab to «Так, почати», Enter: board 8×8, named «Поле 8×8», `aria-checked` on 8×8. | DOM read. `1280-enter-space-cell-85485ac.jpg` is too small to read (taken at a 0.6 scale) and is kept only as a record; the ring is legible in `1280-focus-cell-3d4e488.jpg` |
| 5.5 | Idle line visible at mount; after «Підказка» it computes `display: none` (the one `:has(` rule) and the hint message takes 57 px; hinted cell 6,4 labelled «…, 0, підказка» with its dotted marker; focus stayed on «Підказка». «Скинути» with entries: the dialog opened with focus on «Скасувати»; «Так, почати» cleared the entries and every `aria-invalid`. «Правила» by Enter: popover open, focus on «Зрозуміло»; Enter on it closed the popover. | `375-hint-shown-85485ac.jpg` |

Drift from the frozen look (D2, until G2 ports the design palette; reference `design/v0-screenshots/review-set-5/`):
the page still uses the slice-6 grey/blue tokens instead of the design's warm palette, square cells instead of rounded
ones, no striped violation fill, plain button styles, and no logo (phase E). The checked size button is light grey-blue
with a blue border. No layout element is missing.

Re-run (task 6.7) on 3d4e488 between about 02:08 and 02:13: the source had not changed since 85485ac (the fix round touched tests and docs only); the 1280 shots above come from it.

Not observed: real screen-reader output; dark colour scheme; widths other than 375 and 1280 (`sampled`, not continuum).
