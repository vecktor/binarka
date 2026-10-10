# add-theme-switch: browser check and observations

Status: the slice is **NOT archived**. It stopped at the review gate twice under autonomy-log row 119: at about 08:04 (UTC+5:30) after `wf_6e154572-16a` (row 129), and at about 09:58 after `wf_aa7a4a9e-9da`, the confirming run of the second fix round (row 130). The second stop is a remount on the same root that drops a session-only choice, plus a test that no longer reaches storage. See `openspec/changes/add-theme-switch/review-findings.json`.

The sections below describe the page at `f74022c` (before the second fix round). Each one ends with a note saying what the second fix round (`1446856`) changed.

## Browser check (task 6.1, run at `f74022c`)

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
- `320-header-light.png`, `320-header-dark.png` and `320-panel-dark.png`: **before the fix** (`f74022c`). In these stills «Правила» runs into the side gutter.

**Re-run after the second fix round** (at `65a0f11`): `browser-check-run-fix-round-2.txt` is 62 PASS, 0 FAIL. The current 320 px stills are `320-header-light-fix-round-2.png`, `320-header-dark-fix-round-2.png` and `320-panel-dark-fix-round-2.png`, plus `375-header-fix-round-2.png` and `320-header-fix-round-2.png` from the sweep. The other stills in this folder still come from `f74022c`.

## Observed, not verified: the header overflows on small phones

The gear (44 px plus a gap) was added to the header. The product never had the design's phone rule, which shrinks the logo to 2.75rem and the title to 1.75rem up to 30rem (`design/v0/app/binarka.css`, about line 1357). Without it, title, gear and «Правила» need more than the header's width.

| Variant | Widths with overflow | Worst |
|---|---|---|
| The page at `f74022c` | 40 widths: 320 to 334, and 361 to 385 | 14.8 px at 320, 24.6 px at 361 |
| With the phone rule ported | 3 widths: 320 to 322 | 2.8 px at 320 |

- **How measured:** `header-sweep.mjs.txt`, 1 px steps from 320 to 800, rightmost header child against the header's right edge.
- **Visible effect:** «Правила» runs into the 16 px side gutter. At 361 to 369 px the page itself scrolls sideways (marked "S" in `header-sweep-run.txt`), which breaks the no-horizontal-scroll rule; at the other widths only the gutter is lost.
- **Candidate fix (not applied):** port the phone rule. The remaining 2.8 px at 320 to 322 needs a little more, such as a 0.375rem header gap at 22.5rem.
- **Status at `f74022c`:** no test covered this.
- **Fixed in `1446856`** (the second fix round, approved by the user in chat at about 09:37): the phone rule is ported, and the 22.5rem gaps are 0.375rem, a deliberate step under the design's 0.5rem. The new `e2e/nfr-10-header-fit.spec.ts` checks 9 sampled widths. It was red at the 7 widths inside the bands (`fix-round-2-red.txt`) and is green now (`../add-theme-switch-fix-round-2-green-run.txt`). The 1 px sweep of 320 to 800 px finds no overflow (`header-sweep-run.txt`). This is sampled, not continuum. No requirement row states the header fit yet; this was a confirmed minor finding of `wf_aa7a4a9e-9da`.

## Defect from the review gate run `wf_6e154572-16a` (fixed in `1446856`; a follow-on defect is open)

Run-1 finding 3 was fixed by one module-level `documentTheme` shared by every mount. The confirming run found the gap in that fix:
- `applyTheme()` updates only the pressing mount's options, so a second mount keeps a stale `aria-checked`.
- A press on that stale option returns early and does nothing.
- Each new mount runs `documentTheme = readTheme()`, which resets a session-only choice when `setItem` throws (FR-115).

Production mounts once (`src/main.ts`), so a player cannot reach this today. It is still a code defect, and that triggers the stop rule.

Suggested fix: keep a module-level set of every mount's sync function, so a press refreshes `aria-checked` everywhere. Do not re-read storage on later mounts once a session choice exists. Extend the two-mount test to check the second mount's `aria-checked` and a press there.

**Second fix round (`1446856`):** a module-level set of live mounts. A press refreshes `aria-checked` on every mount, and a later mount keeps the session choice while another mount is alive. The tests «Two mounts show one choice» and «A later mount keeps a session-only choice» were red first and are green now. **Still open** (`wf_aa7a4a9e-9da`): a remount on the same root, or a mount after every mount is gone, still re-reads storage. Also, «The stored choice survives a remount» now passes from memory and no longer reaches storage.
