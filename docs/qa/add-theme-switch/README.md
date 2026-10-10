# add-theme-switch: browser check and observations

Status: the slice is **NOT archived**. The session stopped at the review gate on 2026-10-10 at about 08:04 (UTC+5:30) under autonomy-log row 119. The confirming run `wf_6e154572-16a` confirmed a code defect, which is a regression from the fix round (see `openspec/changes/add-theme-switch/review-findings.json` and autonomy-log row 129).

## Browser check (task 6.1, run at `5c6281b`)

- **Setup:** Chromium (Playwright), `vite preview` serving the built page, system scheme light, reduced motion.
- **Script:** `browser-check.mjs.txt`. **Output:** `browser-check-run.txt`.
- **Result:** 62 PASS, 0 FAIL. Steps (a) to (k2) of task 6.1 ran at 375×812 and at 1280×800.
- **Sampled, not continuum:** the check runs at two viewports and in two themes only.

What it checks:
- (a), (b): the header order is title, gear, «Правила». The panel shows «Тема», three options with «Як у системі» checked, and «Закрити». On the phone the panel is a bottom sheet.
- (c): «Темна» acts at once. Focus stays on the option, the board is unchanged, `binarka.theme` is `dark` and the meta is `#1a1714`.
- (d): after a reload the page is dark. With the bundle aborted, `data-theme` is still `dark` and the background is `rgb(26, 23, 20)` before any board is built.
- (e), (f), (g): «Світла» is kept across a reload. «Як у системі» follows `emulateMedia` live, with no reload. A stored `Dark` gives auto and is not rewritten.
- (h): the gear closes the setup sheet, and the marked 8×8 is discarded.
- (i): Escape, a click outside and «Закрити» each close the panel.
- (j): Tab goes to the gear, then «Правила». Every focused control has a solid ring of 3 px, in both themes, including a theme option reached by Tab inside the panel.
- (k): at 1280 the panel sits under the header, with its right edge on the header's right edge.
- (k2): with `light` stored on a dark system, the page is light. A press with the sheet opened first works. A click on a cell closes the panel and keeps the choice.

Screenshots in this folder:
- `375-*.png` and `1280-*.png`: mount, panel light and dark, bundle blocked, focused option in each theme.
- `1280-panel-dark-desktop.png`
- `320-header-light.png`, `320-header-dark.png` and `320-panel-dark.png`

## Observed, not verified: the header overflows on small phones

The gear (44 px plus a gap) was added to the header. The product never had the design's phone rule, which shrinks the logo to 2.75rem and the title to 1.75rem up to 30rem (`design/v0/app/binarka.css`, about line 1357). Without it, title, gear and «Правила» need more than the header's width.

| Variant | Widths with overflow | Worst |
|---|---|---|
| The page at `5c6281b` | 40 widths: 320 to 334, and 361 to 385 | 14.8 px at 320, 24.6 px at 361 |
| With the phone rule ported | 3 widths: 320 to 322 | 2.8 px at 320 |

- **How measured:** `header-sweep.mjs.txt`, 1 px steps from 320 to 800, rightmost header child against the header's right edge.
- **Visible effect:** «Правила» runs into the 16 px side gutter. At 361 to 369 px the page itself scrolls sideways (marked "S" in `header-sweep-run.txt`), which breaks the no-horizontal-scroll rule; at the other widths only the gutter is lost.
- **Candidate fix (not applied):** port the phone rule. The remaining 2.8 px at 320 to 322 needs a little more, such as a 0.375rem header gap at 22.5rem.
- **Status:** no test covers this. It is a layout note for the next session and for G2; nothing above is claimed as fixed.

## Open defect from the review gate (not fixed)

Run-1 finding 3 was fixed by one module-level `documentTheme` shared by every mount. The confirming run found the gap in that fix:
- `applyTheme()` updates only the pressing mount's options, so a second mount keeps a stale `aria-checked`.
- A press on that stale option returns early and does nothing.
- Each new mount runs `documentTheme = readTheme()`, which resets a session-only choice when `setItem` throws (FR-115).

Production mounts once (`src/main.ts`), so a player cannot reach this today. It is still a code defect, and that triggers the stop rule.

Suggested fix: keep a module-level set of every mount's sync function, so a press refreshes `aria-checked` everywhere. Do not re-read storage on later mounts once a session choice exists. Extend the two-mount test to check the second mount's `aria-checked` and a press there.
