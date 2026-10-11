# NFR-14 visual parity: per-shot scores

Phase G2. Written by the session `keen-archimedes-c4cd63` on 2026-10-10; run 1 at 13:20 (UTC+5:30), against `main` `a2879b1` plus the uncommitted `fix-size-option-focus-ring` CSS line. That line changes no reference shot, because no shot has a focused size option.

**Latest: run 6** (2026-10-10 22:25, after fix round 1 of G2 block 1): **FAIL**, **1 of 170** at 0.98 (1440-dark-confirm 0.982); table below. Run 5 (21:15, block 1 as first committed): 1 of 170, with a setup-sheet regression that fix round 1 removed. Run 4 (16:49, PD-3 adapter): 0 of 170. Every board shot shows the design's fixture board (FR-119, PD-2), and the capture now reproduces the reference's rendering exactly (PD-3: the design build scores 1.0000 on all 170 shots, `docs/qa/g2/harness-calibration.txt`), so what remains is the port itself.

**Verdict of run 1: FAIL.** 0 of 170 shots reach 0.98. 168 were captured and scored (lowest 0.1218, highest 0.9666). 2 failed with no state driver (`logo-*`). Full output: [`docs/qa/g2/check-visual-run-1.txt`](../g2/check-visual-run-1.txt) (exit 1, `Result: FAIL, 1 warning(s)`). Each shot's `report.json` is in its own folder. The `diff.png` files are not committed (about 19 MB per run; `.gitignore`), and `npm run check:visual` writes them again.

The mean of the 168 scores is 0.8165. **That number is telemetry, not the gate**: the gate is per shot (AGENTS.md, the block-conquest lesson).

## The mechanism

- `npm run check:visual` = `npm run build`, then `scripts/check-visual-fidelity.mjs` (the factory checker, hash-locked in `factory-lock.json`, not edited) with `CHECK_VISUAL_FIDELITY_ADAPTERS=scripts/check-visual-parity-adapters.mjs`.
- **Config:** [`quality/visual-parity.config.json`](../../../quality/visual-parity.config.json). One "breakpoint" per reference shot (170), named as the shot.
  - Threshold **0.98 per shot** (autonomy-log row 68). The checker warns because 0.98 is below its 0.99 default; row 68 expects that warning.
- **Reference:** the frozen PNG `design/v0-screenshots/review-set-14/<shot>.png`. Its `SHA1SUMS` has the SHA-1 `e89badbf4bdbe29478563e9f2edef91fcc5c853f`; the user moved the reference from `review-set-13` (`532e0b78…`, row 134) on 2026-10-10 at about 14:18 (autonomy-log row 142). Run 1 was measured against set 13. The served design is not fetched.
- **Product:** the built page (`vite preview` on `localhost:4174`, started by the adapter; stop any other server on that port first), captured in Chromium (Playwright) under the conditions of the reference (`design/README.md`, decision 25):
  - device scale 2, **a real one** (PD-3, since run 4): one browser per shot, launched with `--force-device-scale-factor=2 --window-size=W,H`, Playwright's viewport emulation off; the shot fails if the window is not exactly W×H at 2. The emulated scale used before rasterised text and fractional edges differently, so even the design build scored only 0.9765 to 0.9993 against its own reference (5 shots below 0.98). With the real scale, it reproduces all 170 exactly;
  - the system scheme from the shot name;
  - reduced motion;
  - `--hide-scrollbars`;
  - viewport-cropped, never full page;
  - no pointer on the page: states are reached by `element.click()` and keyboard focus, never by mouse moves;
  - the page window focused;
  - the same Mac and fonts;
  - seeded `Math.random` (seed 1, as in `e2e/helpers.ts`);
  - **the design's fixture board** of the state (PD-2, since run 3): an init script sets `window.__binarkaCaptureBoard` (FR-119) from `design/v0/lib/boards.json`, as the design route of that state does (the table is in `docs/qa/improvements/PD-2-capture-board-in-adapter.md`). The shot fails if the page does not show that board, because FR-119 ignores an invalid value silently;
  - **only its own preview** (PD-2): the adapter fails if something already answers on port 4174, or if its preview exits before answering.
- **Diff:** the checker's own pixelmatch adapter (per-pixel threshold 0.1). The score is 1 − mismatched / total, rounded to 4 places.
- **Page-height pre-gate:** inert for these shots. Both sides report the viewport height, because the shots are viewport-cropped. A structural mismatch shows in the pixel score instead.

## Sampling declaration (sampled, never continuum)

- **Dimensions:** viewport, colour scheme, page state.
- **Sample points:** the 170 shots of the reference set (`review-set-14`; run 1 used `review-set-13`, same shot list):
  - 6 viewports: 320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, with not every state at every viewport;
  - 2 system schemes;
  - 17 states plus the logo.
- **Coverage:** `sampled`, never continuum. Ukrainian page only (TD-Q10). There are no English shots.
- **Stricter instrument (escalation path), before a definition-of-done is claimed:**
  1. a per-block overlay and onion-skin of each failing shot (difference blend plus a 50% composite), reviewed by eye;
  2. a fine-step width sweep (1 px, 320 to 1440) of the product against the served design (`design/v0/out`) for the default state, at least in the pixel channel;
  3. a computed-style diff of the block's elements.

## Capture determinism

**Since PD-3 (run 4):** 7 of 7 sampled shots byte-identical when captured twice through the adapter (`docs/qa/improvements/PD-3-proof.txt`, section 3). **Harness ceiling:** the design build captured by the PD-3 method scores 1.0000 on all 170 shots against the frozen reference; captured by the old emulated method, 0.9765 to 0.9993 (`docs/qa/g2/harness-calibration.txt`).

Before PD-3 (run 1): 7 product shots captured twice: 7 of 7 byte-identical ([`docs/qa/g2/determinism.txt`](../g2/determinism.txt)). That is a sample of 7 of the 168 drivable shots, not the whole set.

## Known gaps (open, for the convergence sessions)

1. **Board content.** The design shots use fixture boards (`design/v0/lib/boards.ts`). The page draws its puzzle from the seed, so the givens, entries and violations differ in every board shot. Even a perfect port cannot reach 0.98 on board shots until the capture can show the fixture board. This needs a decision from the user, and probably a spec: for example, a capture-only way to load a given board, or new reference shots of the seeded board. It is the first blocker to convergence. **Decided (rows 140 and 142):** a capture-only board (FR-119); the 6×6 fixtures were made valid puzzles (iteration 16), and the reference moved to `review-set-14`. **Closed by PD-2 (autonomy-log row 147):** the adapter sets the fixture board for each shot and checks that the page shows it (`docs/qa/improvements/PD-2-proof.txt`, section 1).
2. **Logo shots** (`logo-light`, `logo-dark`: the logo at 40, 56 and 64 px on the design's `/logo/` route). The page has no such view, so these fail with "no state driver". They are related to NFR-15 (slice H).
3. **`qa-verify` runs the checker without the adapter.** `scripts/qa-verify.mjs` (locked) calls `node scripts/check-visual-fidelity.mjs` directly, without `CHECK_VISUAL_FIDELITY_ADAPTERS`. That run uses the default adapters: it captures the two config URLs full page at device scale 1. It fails while the design is not served on `127.0.0.1:4175`. **Do not read a qa-verify result for visual-fidelity as NFR-14.** The fix is a process change to a locked file: let the checker read the adapter path from the config, or have qa-verify set the variable. That needs the user's approval (`Refs: PD-<n>`). **Closed by PD-5 (2026-10-11, session C; `docs/qa/improvements/PD-5-gate-runs-visual-without-adapter.md`):** the checker reads the adapter from the config's `"adapters"`, so `qa-verify` and `gate:status` now run the real NFR-14 capture (build first; take the capture lock or your own `BINARKA_PORT_BASE`). Green proof complete: the full run on base 6173 reproduced run 10 byte for byte (`PD-5-green-proof.txt`).
4. **The adapter is under the lock (closed by PD-1, autonomy-log row 140).** It was renamed to `scripts/check-visual-parity-adapters.mjs`, so the lock pattern `check-*.mjs` covers it, and the lock was re-sealed (`docs/qa/improvements/PD-1-lock-visual-parity-adapters.md`).
5. **States the drivers approximate.** `rules-techniques` scrolls the panel to its end, as the design route does. `setup` shows the fixture at level 2 («Задачка») and opens the sheet. `setup-marked` marks 8×8 «Головоломка» on the fixture and puts keyboard focus on «Почати». `hint` shows the hint board without its hinted cell and presses «Підказка» once. `settings-light` and `settings-dark` store the manual theme before load.
6. **A stale preview server is measured silently.** `ensureServer` in the adapter spawns `vite preview --port 4174 --strictPort`, but it only checks that the URL answers. If another preview is already on 4174, the spawn fails quietly and the capture measures whatever that server serves, possibly an old build. Run 1 was clean, because the earlier preview was stopped first. Make the adapter fail when its own spawn exits. **Closed by PD-2:** it fails when something already answers on the port, and when its own preview exits before answering (`PD-2-proof.txt`, section 3: before, a stale copy on 4174 was scored 0.9125 without a word; after, "something already answers on http://localhost:4174/").
7. **Orphaned previews (PD-4, 2026-10-11, session C).** A capture stopped by a signal, or dying before `close()`, left its `vite preview` listening (the clean close never leaked). Since PD-4 the adapter and `scripts/visual-block.mjs` run `vite` under `node` and stop it on exit and on SIGINT, SIGTERM and SIGHUP; SIGKILL leftovers and Playwright's preview: `node scripts/capture-ports.mjs --stop` (this worktree's only). The ports come from `BINARKA_PORT_BASE` (default 4173: e2e +0, gate +1, page +3, design +4).
8. **A failed capture overwrites a scored report** (`score: null`), with any adapter. **Closed by PD-6** (`docs/qa/improvements/PD-6-failed-capture-overwrites-evidence.md`): the checker stages each run and copies it here unless a capture or diff failure would replace a scored report; such a run FAILS and names its folder. Shots that never had a score (the logo shots) do not block the copy.

## Session B's pre-rebase run (update-setup-sheet; numbered run 11 before block A merged, superseded by run 12)

`docs/qa/update-setup-sheet/check-visual-prerebase.txt` (written as `docs/qa/g2/check-visual-run-11.txt` before the rebase onto block A), 2026-10-11 20:44 to 20:46 (UTC+5:30), exit 1: **122 of 170 at 0.98** (run 10: 86). Session B of the parallel G2 plan, branch `claude/magical-nash-setup` on `ebaf49b` plus the uncommitted block (block A merged first and took run 11; this run stays as the pre-rebase evidence); the capture lock was held and nothing listened on 4173, 4174, 4176 or 4177 before or after.

- **All 48 setup shots rose** (`setup`, `setup-four`, `setup-marked`, `setup-marked-four`, light and dark, six viewports), the smallest rise +0.0498; 36 of them reach 0.98. **No shot of any state fell, and no shot of another state changed.**
- **The residual is the signed 28px departure (SQ-5, A-60), measured per block** (`docs/qa/update-setup-sheet/blocks/setup/summary.json`, `docs/qa/update-setup-sheet/run-vs-previous.txt`): the sheet's crop scores exactly 1 wherever the floor or the cap decides its height (the margin does not move the box) and below 1 where the content decides it, 4 px off the design (2.22 px at 320). The 12 shots under 0.98 are phone shots (375 in all four states; 320 in `setup` and `setup-marked`, where the content decides; the 320 `four` states meet the cap and pass), because the bottom sheet grows upward and its whole content shifts by those 4 px.
- **`768-dark-setup-four`** 0.8349 → 0.9915: the soft-dim drop of run 8 (Correction of Run 8 below) was the sheet's placement; the sheet now hangs where the design's does.
- **Between the samples** the fine-step sweep of `e2e/nfr-14-setup-sheet.spec.ts` (`docs/qa/update-setup-sheet/sweep.txt`) finds the design's own sheet cutting the idle line's text at a window 700 px tall (768 to 1440 wide) and in the 4×4 state at 1024 px tall (672 to 752 wide); the page inherits it. Recorded as not delivered on the user's decision; not a gate shot.

By state (the last two columns are the mean change against run 10 and the number of shots that fell):

| State | Scheme | Run 10 at 0.98 | Pre-rebase at 0.98 | Lowest pre-rebase | Highest pre-rebase | Mean change | Fell |
|---|---|---|---|---|---|---|---|
| confirm | dark | 3 of 5 | 3 of 5 | 0.9180 | 0.9904 | +0.0000 | 0 |
| confirm | light | 3 of 5 | 3 of 5 | 0.9194 | 0.9901 | +0.0000 | 0 |
| default | dark | 6 of 6 | 6 of 6 | 1.0000 | 1.0000 | +0.0000 | 0 |
| default | light | 6 of 6 | 6 of 6 | 0.9985 | 0.9996 | +0.0000 | 0 |
| eight | dark | 6 of 6 | 6 of 6 | 1.0000 | 1.0000 | +0.0000 | 0 |
| eight | light | 6 of 6 | 6 of 6 | 1.0000 | 1.0000 | +0.0000 | 0 |
| four | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| four | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| hint | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| hint | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| level | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| level | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| rules | dark | 0 of 6 | 0 of 6 | 0.8133 | 0.9069 | +0.0000 | 0 |
| rules | light | 0 of 6 | 0 of 6 | 0.7822 | 0.9010 | +0.0000 | 0 |
| rules-techniques | dark | 0 of 4 | 0 of 4 | 0.8133 | 0.9018 | +0.0000 | 0 |
| rules-techniques | light | 0 of 4 | 0 of 4 | 0.7882 | 0.8980 | +0.0000 | 0 |
| settings | dark | 4 of 6 | 4 of 6 | 0.9117 | 0.9880 | +0.0000 | 0 |
| settings | light | 4 of 6 | 4 of 6 | 0.9430 | 0.9946 | +0.0000 | 0 |
| settings-dark | light | 3 of 5 | 3 of 5 | 0.9195 | 0.9894 | +0.0000 | 0 |
| settings-focus | dark | 1 of 2 | 1 of 2 | 0.9077 | 0.9821 | +0.0000 | 0 |
| settings-focus | light | 1 of 2 | 1 of 2 | 0.9390 | 0.9919 | +0.0000 | 0 |
| settings-light | dark | 3 of 5 | 3 of 5 | 0.9458 | 0.9950 | +0.0000 | 0 |
| setup | dark | 0 of 6 | 4 of 6 | 0.9238 | 1.0000 | +0.1179 | 0 |
| setup | light | 0 of 6 | 4 of 6 | 0.9218 | 1.0000 | +0.1168 | 0 |
| setup-four | dark | 0 of 6 | 5 of 6 | 0.9388 | 1.0000 | +0.1403 | 0 |
| setup-four | light | 0 of 6 | 5 of 6 | 0.9306 | 1.0000 | +0.1222 | 0 |
| setup-marked | dark | 0 of 6 | 4 of 6 | 0.9054 | 1.0000 | +0.1121 | 0 |
| setup-marked | light | 0 of 6 | 4 of 6 | 0.8755 | 1.0000 | +0.1177 | 0 |
| setup-marked-four | dark | 0 of 6 | 5 of 6 | 0.9387 | 1.0000 | +0.1334 | 0 |
| setup-marked-four | light | 0 of 6 | 5 of 6 | 0.9311 | 1.0000 | +0.1202 | 0 |
| win | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| win | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
## Run 11 (after update-rules-panel, G2 block A; parallel session A, branch `claude/peaceful-nash-rules`, not yet merged)

`docs/qa/g2/check-visual-run-11.txt`, 2026-10-11 19:09 to 19:12 (UTC+5:30), exit 1: **106 of 170 at 0.98** (run 10: 86). The capture lock was held by session A, and nothing listened on 4173, 4174, 4176 or 4177 before or after the run. The run rewrote the per-shot `report.json` files and they were reverted, so they still hold run 10; the run file is the evidence.

- **All 20 rules and rules-techniques shots rose and now pass**: 0.9913 to 0.9970, up from 0.7822 to 0.9069 in run 10. **No other shot moved**, to 4 places. Comparison: `docs/qa/update-rules-panel/run-vs-previous.txt`.
- **The dark shots from 64rem and `768-dark-rules`** (§ Correction of Run 8): the masking pair was the design's panel fill `#2c2620` where the page showed its dimmed bare page. It is gone, because the panel now has the design's size and place.
- **Residual:** the only difference inside the panel crop is the focus ring on «Зрозуміло». The page shows it because the locked adapter opens the panel with a script click, after which `:focus-visible` matches the autofocused button. The design reference shows no ring. This is why light equals dark, and `rules` equals `rules-techniques`, at each width. The text, the separators, the example cells, the fill and the mask are pixel-equal (`docs/qa/update-rules-panel/blocks/rules/<shot>/diff.png`). The scrolled `rules-techniques` shots match the design's end, so the reset on open does not undo the driver's scroll.

| State | Scheme | Run 10 at 0.98 | Run 11 at 0.98 | Lowest run 11 | Highest run 11 |
|---|---|---|---|---|---|
| rules | dark | 0 of 6 | 6 of 6 | 0.9913 | 0.9970 |
| rules | light | 0 of 6 | 6 of 6 | 0.9913 | 0.9970 |
| rules-techniques | dark | 0 of 4 | 4 of 4 | 0.9913 | 0.9970 |
| rules-techniques | light | 0 of 4 | 4 of 4 | 0.9913 | 0.9970 |
| every other state (incl. the 2 logo shots without a driver) | both | 86 of 150 | 86 of 150 | unchanged | unchanged |


## Run 10 (after update-panel-shell, the shared panel shell)

`docs/qa/g2/check-visual-run-10.txt`, 2026-10-11 17:16 to 17:19 (UTC+5:30), exit 1: **86 of 170 at 0.98** (run 9: 84). The capture lock was held and nothing listened on 4173, 4174, 4176 or 4177 before or after. The per-shot `report.json` files now hold run 10.

- **New passes:** `768-dark-settings` and `1024-dark-settings`. No shot newly fails. The hoped-for rise of the `confirm` shots did not happen (3 of 5 in both schemes, as in run 9).
- **The main column did not move:** every default, four, eight, hint, level and win shot is unchanged to 4 places, so the board-size hook (the page root's `data-size`) moved no box.
- **42 shots fell** (largest `768-dark-setup-four` 0.8674 to 0.8349; light falls at most 0.0047). They are explained by a per-pixel classification with the gate's own pixelmatch on a SAMPLE of 7 of the 42 (the largest fall of each surface and scheme, and one light setup shot; the rest attributed by surface and scheme, not measured), against HEAD and port captures that reproduce runs 9 and 10 to 4 places (`docs/qa/update-panel-shell/run10-vs-run9.txt`): the shell's paint equals the design's, but the surfaces are still in their pre-G2 size and place, so where the page shows a surface and the design does not, the right dark fill `#2c2620` (formerly `#24201b`, which happened to pass against the design's dimmed page) and the new shadows now differ more. It is the masking of § Correction of Run 8 in reverse. The rules panel (block A), the setup sheet (block B), and the settings panel and the dialog (second wave) own the placement.

By state (the last two columns are the mean change against run 9 and the number of shots that fell):

| State | Scheme | Run 9 at 0.98 | Run 10 at 0.98 | Lowest run 10 | Highest run 10 | Mean change | Fell |
|---|---|---|---|---|---|---|---|
| confirm | dark | 3 of 5 | 3 of 5 | 0.9180 | 0.9904 | -0.0013 | 5 |
| confirm | light | 3 of 5 | 3 of 5 | 0.9194 | 0.9901 | +0.0010 | 0 |
| default | dark | 6 of 6 | 6 of 6 | 1.0000 | 1.0000 | +0.0000 | 0 |
| default | light | 6 of 6 | 6 of 6 | 0.9985 | 0.9996 | +0.0000 | 0 |
| eight | dark | 6 of 6 | 6 of 6 | 1.0000 | 1.0000 | +0.0000 | 0 |
| eight | light | 6 of 6 | 6 of 6 | 1.0000 | 1.0000 | +0.0000 | 0 |
| four | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| four | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| hint | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| hint | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| level | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| level | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| rules | dark | 0 of 6 | 0 of 6 | 0.8133 | 0.9069 | -0.0010 | 4 |
| rules | light | 0 of 6 | 0 of 6 | 0.7822 | 0.9010 | +0.0024 | 0 |
| rules-techniques | dark | 0 of 4 | 0 of 4 | 0.8133 | 0.9018 | -0.0006 | 2 |
| rules-techniques | light | 0 of 4 | 0 of 4 | 0.7882 | 0.8980 | +0.0007 | 0 |
| settings | dark | 2 of 6 | 4 of 6 | 0.9117 | 0.9880 | -0.0019 | 2 |
| settings | light | 4 of 6 | 4 of 6 | 0.9430 | 0.9946 | +0.0017 | 0 |
| settings-dark | light | 3 of 5 | 3 of 5 | 0.9195 | 0.9894 | -0.0023 | 2 |
| settings-focus | dark | 1 of 2 | 1 of 2 | 0.9077 | 0.9821 | -0.0056 | 1 |
| settings-focus | light | 1 of 2 | 1 of 2 | 0.9390 | 0.9919 | +0.0014 | 1 |
| settings-light | dark | 3 of 5 | 3 of 5 | 0.9458 | 0.9950 | +0.0015 | 0 |
| setup | dark | 0 of 6 | 0 of 6 | 0.7566 | 0.9335 | -0.0089 | 4 |
| setup | light | 0 of 6 | 0 of 6 | 0.7696 | 0.9277 | +0.0018 | 2 |
| setup-four | dark | 0 of 6 | 0 of 6 | 0.7800 | 0.9292 | -0.0128 | 5 |
| setup-four | light | 0 of 6 | 0 of 6 | 0.7647 | 0.9454 | +0.0004 | 2 |
| setup-marked | dark | 0 of 6 | 0 of 6 | 0.7627 | 0.9318 | -0.0078 | 4 |
| setup-marked | light | 0 of 6 | 0 of 6 | 0.7663 | 0.9248 | +0.0017 | 2 |
| setup-marked-four | dark | 0 of 6 | 0 of 6 | 0.7801 | 0.9350 | -0.0095 | 4 |
| setup-marked-four | light | 0 of 6 | 0 of 6 | 0.7835 | 0.9455 | +0.0000 | 2 |
| win | dark | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |
| win | light | 5 of 5 | 5 of 5 | 1.0000 | 1.0000 | +0.0000 | 0 |

## Correction of Run 8 (COR-4, 2026-10-11, prep session of the parallel G2 plan, autonomy-log row 172)

The YIQ deltas of § Run 8 (125, 359 and 283 against the limit 352) used a hand-written colour formula. The gate runs pixelmatch 8.0.0, whose per-pixel delta is different, so those figures do not describe the gate, and the claim that the soft-dim drops "cannot" come from the masking is wrong. By the gate's own per-pixel verdict (pixelmatch's output image), with the run-7 dim rebuilt pixel by pixel (both scores reproduced to 4 places): in `768-dark-rules` 135,776 of the 135,961 newly failing pixels, and in `768-dark-setup-four` 103,380 of 103,696, are one pair, **the design's panel fill `#2c2620` where the page shows its soft-dimmed bare page** (`#120f0c`; `#1a1714` with the old dim, which passed). So the soft-dim drops are the same masking as the strong-dim drops: the design's surface covers pixels that the page's 28rem surface does not. They belong to the rules-panel and setup-sheet blocks. Evidence: `docs/qa/prep-g2/soft-dim-768-classify.txt` (script `soft-dim-768-classify.mjs`; captures from `soft-dim-768.mjs`). The text of § Run 8 below is kept as written; read its YIQ figures and its "Not explained yet" bullet with this correction. Recorded as `retro/corrections/004-*` (COR-4), dispositioned `resolved` by the user's choice.

## Run 9 (after add-violation-cause, not a G2 block)

`docs/qa/g2/check-visual-run-9.txt`, 2026-10-11 14:38 to 14:41 (UTC+5:30), exit 1: 84 of 170 at 0.98, the same as run 8. Every PASS/FAIL line, each with its score, is identical to run 8's (`docs/qa/add-violation-cause/run9-vs-run8.txt`): the cause mark (FR-120) shows in no reference shot, as A-58 expects (no shot has a press that makes a violation). The by-state table of run 8 below holds for run 9 unchanged. The soft-dim drops at 768 noted for run 8 are explained in § Correction of Run 8 (COR-4).

## Run 8 (after block 3, update-page-backdrop): by state

Run 8, 2026-10-11 08:24 to 08:26 (UTC+5:30), after the backdrops were ported (the change `update-page-backdrop`: the translucent tokens `--color-backdrop-soft` and `--color-backdrop-strong` of the A-57 appendix; its browser check `e2e/nfr-14-backdrop.spec.ts` passes 11 of 11, `docs/qa/update-page-backdrop/green-run.txt`, and the full e2e run passes 192, `battery.txt`): **FAIL**, exit 1, **84 of 170 at 0.98** (run 7: 82). 168 scored 0.7527 to 1.0000 (mean 0.9359, telemetry; run 7: 0.9208). The 2 logo shots still have no state driver. Output: [`docs/qa/g2/check-visual-run-8.txt`](../g2/check-visual-run-8.txt). The per-shot `report.json` and `diff.png` files now hold run 8. Before the run, nothing listened on 4173, 4174, 4176 or 4177 (the check is recorded in the header of the run file, added in fix round 1); the per-block tool left no orphan this time (`docs/qa/update-page-backdrop/block-backdrop.txt`).

- **Main column:** every main-column state is unchanged, as expected; the block touches only the backdrops.
- **Light rules panel:** the light `rules` and `rules-techniques` shots rose sharply, for example 1440 from 0.1333 to 0.8404 and 1024 from 0.2216 to 0.7767. The light confirm shots rose slightly; two more pass (3 of 5).
- **Dark rules panel: these shots fell**, for example 1366 from 0.9427 to 0.8178 and 1024 from 0.9324 to 0.8168. This is not a backdrop error: the browser check reads the design's composites in all 10 sampled cases. **For the strong-dim shots (64rem and wider: 1024, 1366, 1440), the cause is masking.**
  - The old dark backdrop was the page colour over the page, so over the bare page there was no dim. (It did darken the board cells, which are lighter than the page.)
  - The design's desktop rules panel is a 40rem column in a different place from the page's panel. Where the design shows its panel fill `#2c2620` and the page shows the bare page `#1a1714`, the gate's per-pixel YIQ delta was 125, under its limit of 352. So those pixels counted as equal.
  - Against the new strong composite `rgb(15,12,9)` the delta is 359, over the limit; against the soft one `rgb(18,15,12)` it is 283.
  - So, for the strong-dim shots, the panel mismatch, which was always there, now shows in the dark score. It belongs to the rules-panel block (its placement and paint), not to this one.
  - **Not explained yet: the soft-dim drops.** 768-dark-rules fell from 0.9314 to 0.8882, and 768-dark-setup-four from 0.9004 to 0.8674 (below 64rem, so the soft dim). The mechanism above cannot cause them, because 283 is under the limit. A first version of this section blamed "the same masking effect under the soft dim"; review run `wf_4151f42d-f49` showed that its own numbers contradict that, and the claim is withdrawn. The cause needs a per-pixel look at those shots, for example which colours differ in their `diff.png`. The candidates are the cells and other lighter pixels that the old dim darkened differently, but this is not measured. It is left to the rules-panel and setup-sheet blocks.
- **Setup sheet, settings panel, dialog:** within about 0.01 of run 7, except 768-dark-setup-four (above, not explained yet). Their own paint and placement are later blocks.

Estimate against measurement (the estimate is in `openspec/changes/update-page-backdrop/design.md`): it was right for the light rules shots from 64rem and for the small movement of most soft shots. It missed the dark rules drop from 64rem, because it compared the dim with the bare page only, never with the design's panel fill where the two panels do not overlap. It also missed the two soft-dim drops at 768 (not explained yet, above).

The last column is the mean change against run 7.

| State | Scheme | Shots at 0.98 | Lowest | Highest | Mean change |
|---|---|---|---|---|---|
| confirm | dark | 3 of 5 | 0.9191 | 0.9915 | -0.0009 |
| confirm | light | 3 of 5 | 0.9180 | 0.9892 | +0.0149 |
| default | dark | 6 of 6 | 1.0000 | 1.0000 | +0.0000 |
| default | light | 6 of 6 | 0.9985 | 0.9996 | +0.0000 |
| eight | dark | 6 of 6 | 1.0000 | 1.0000 | +0.0000 |
| eight | light | 6 of 6 | 1.0000 | 1.0000 | +0.0000 |
| four | dark | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |
| four | light | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |
| hint | dark | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |
| hint | light | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |
| level | dark | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |
| level | light | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |
| rules | dark | 0 of 6 | 0.8168 | 0.9029 | -0.0577 |
| rules | light | 0 of 6 | 0.7767 | 0.9010 | +0.3114 |
| rules-techniques | dark | 0 of 4 | 0.8178 | 0.8978 | -0.0468 |
| rules-techniques | light | 0 of 4 | 0.7858 | 0.8980 | +0.3294 |
| settings | dark | 2 of 6 | 0.9230 | 0.9877 | +0.0000 |
| settings | light | 4 of 6 | 0.9430 | 0.9928 | -0.0009 |
| settings-dark | light | 3 of 5 | 0.9308 | 0.9891 | +0.0000 |
| settings-focus | dark | 1 of 2 | 0.9190 | 0.9819 | +0.0000 |
| settings-focus | light | 1 of 2 | 0.9391 | 0.9890 | -0.0007 |
| settings-light | dark | 3 of 5 | 0.9458 | 0.9931 | -0.0006 |
| setup | dark | 0 of 6 | 0.7527 | 0.9399 | -0.0047 |
| setup | light | 0 of 6 | 0.7708 | 0.9264 | -0.0006 |
| setup-four | dark | 0 of 6 | 0.7757 | 0.9370 | -0.0112 |
| setup-four | light | 0 of 6 | 0.7668 | 0.9447 | -0.0014 |
| setup-marked | dark | 0 of 6 | 0.7587 | 0.9383 | -0.0042 |
| setup-marked | light | 0 of 6 | 0.7680 | 0.9235 | -0.0010 |
| setup-marked-four | dark | 0 of 6 | 0.7756 | 0.9425 | -0.0056 |
| setup-marked-four | light | 0 of 6 | 0.7882 | 0.9441 | -0.0008 |
| win | dark | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |
| win | light | 5 of 5 | 1.0000 | 1.0000 | +0.0000 |

## Run 7 (after block 2, update-page-palette): by state

Run 7, 2026-10-11 00:39 to 00:41, after the main column's palette was ported (the change `update-page-palette`, port `676ee03`; its paint test `e2e/nfr-14-palette.spec.ts` passes 27 of 27, and the per-block tool reads pixel 1 on the main-column crops of 64 shots except the 6 light default shots, 0.998 to 0.9994, with geometry measured on 54 of them (0 boxes off; the hint shots are pixel only), `docs/qa/update-page-palette/block-palette.txt`, re-run after review run `wf_42e6a5ef-152` found the first copy was a crash log, COR-2): **FAIL**, exit 1, **82 of 170 at 0.98** (run 6: 1). 168 scored 0.1333 to 1.0000 (mean 0.9208, telemetry; run 6: 0.8499). 2 logo shots have no state driver. Output: [`docs/qa/g2/check-visual-run-7.txt`](../g2/check-visual-run-7.txt). The per-shot `report.json` files now hold run 7.

Every main-column state passes in both schemes (default, four, eight, level, hint, win). The light default shots score 0.9985 to 0.9996 in the gate, not 1, because of the A-57 deviation of the light violating digit (`#8f1d17` against the design's `#b3261e`); the light cell border deviation (`#847b6d`) does not register. The remaining failures are later blocks: the rules panel (light 0.13 to 0.90: the design dims the page, the page does not yet), the setup sheet (0.75 to 0.95, slightly lower in light than run 6 because its shared tokens changed value while its own paint is not ported), and part of the confirm and settings shots.

An earlier attempt at run 7 (00:38) was invalid and is not kept here: an orphaned `vite preview` on port 4174, left by the per-block tool's capture (the capture kills `npx` but not its `vite` child), answered first, and the gate refused all 168 captures ("something already answers on http://localhost:4174/"), as PD-2's guard intends. The orphan was stopped and the run repeated on a free port. The leak is a harness note for the user (a PD).

The last column is the mean change against run 6.

| State | Scheme | Shots at 0.98 | Lowest | Highest | Mean change |
|---|---|---|---|---|---|
| confirm | dark | 3 of 5 | 0.9236 | 0.9915 | +0.0234 |
| confirm | light | 1 of 5 | 0.8885 | 0.9814 | +0.6863 |
| default | dark | 6 of 6 | 1.0000 | 1.0000 | +0.0849 |
| default | light | 6 of 6 | 0.9985 | 0.9996 | +0.1417 |
| eight | dark | 6 of 6 | 1.0000 | 1.0000 | +0.0735 |
| eight | light | 6 of 6 | 1.0000 | 1.0000 | +0.1322 |
| four | dark | 5 of 5 | 1.0000 | 1.0000 | +0.0708 |
| four | light | 5 of 5 | 1.0000 | 1.0000 | +0.1343 |
| hint | dark | 5 of 5 | 1.0000 | 1.0000 | +0.1494 |
| hint | light | 5 of 5 | 1.0000 | 1.0000 | +0.1656 |
| level | dark | 5 of 5 | 1.0000 | 1.0000 | +0.0817 |
| level | light | 5 of 5 | 1.0000 | 1.0000 | +0.1478 |
| rules | dark | 0 of 6 | 0.8948 | 0.9549 | +0.0045 |
| rules | light | 0 of 6 | 0.1333 | 0.8995 | +0.0132 |
| rules-techniques | dark | 0 of 4 | 0.8902 | 0.9549 | +0.0071 |
| rules-techniques | light | 0 of 4 | 0.1333 | 0.8965 | +0.0193 |
| settings | dark | 2 of 6 | 0.9230 | 0.9877 | +0.0218 |
| settings | light | 4 of 6 | 0.9415 | 0.9944 | +0.0401 |
| settings-dark | light | 3 of 5 | 0.9308 | 0.9891 | +0.0247 |
| settings-focus | dark | 1 of 2 | 0.9190 | 0.9819 | +0.0134 |
| settings-focus | light | 1 of 2 | 0.9376 | 0.9919 | +0.0333 |
| settings-light | dark | 3 of 5 | 0.9444 | 0.9947 | +0.0451 |
| setup | dark | 0 of 6 | 0.7527 | 0.9429 | +0.0004 |
| setup | light | 0 of 6 | 0.7642 | 0.9262 | -0.0084 |
| setup-four | dark | 0 of 6 | 0.7757 | 0.9463 | -0.0005 |
| setup-four | light | 0 of 6 | 0.7655 | 0.9438 | -0.0090 |
| setup-marked | dark | 0 of 6 | 0.7587 | 0.9413 | +0.0017 |
| setup-marked | light | 0 of 6 | 0.7637 | 0.9233 | -0.0098 |
| setup-marked-four | dark | 0 of 6 | 0.7756 | 0.9456 | -0.0002 |
| setup-marked-four | light | 0 of 6 | 0.7823 | 0.9439 | -0.0087 |
| win | dark | 5 of 5 | 1.0000 | 1.0000 | +0.1263 |
| win | light | 5 of 5 | 1.0000 | 1.0000 | +0.1160 |

## Run 6 (after block 1, fix round 1): by state

Run 6, 2026-10-10 22:25 to 22:28, after fix round 1 of `update-page-layout-geometry` (review run `wf_1c7326da-0c4`): the setup sheet keeps the browser's normal line height until its own block, the hint's accent applies only to a shown hint, and the column formula reads named variables. **FAIL**, exit 1, **1 of 170 at 0.98** (1440-dark-confirm 0.982). 168 scored 0.1274 to 0.982 (mean 0.8499, telemetry; run 5 0.8458, run 4 0.8214). 2 logo shots have no state driver. Output: [`docs/qa/g2/check-visual-run-6.txt`](../g2/check-visual-run-6.txt). The per-shot `report.json` files now hold run 6.

Only the setup sheet moves against run 5 (+0.014 on average for each of its four states); it is now above run 4 as well (375-light-setup 0.8087 → 0.7240 → 0.8254, 375-light-setup-marked 0.8039 → 0.7291 → 0.8214, 375-light-setup-four 0.8273 → 0.7846 → 0.8445, 375-light-setup-marked-four 0.8292 → 0.7849 → 0.8439; run 4 → run 5 → run 6). Every other shot is unchanged.

| State | Shots | Lowest | Highest |
|---|---|---|---|
| confirm | 10 | 0.1274 | 0.9820 |
| default | 12 | 0.7610 | 0.9634 |
| eight | 12 | 0.7641 | 0.9673 |
| four | 10 | 0.7436 | 0.9782 |
| hint | 10 | 0.7297 | 0.9449 |
| level | 10 | 0.7641 | 0.9669 |
| rules | 12 | 0.1340 | 0.9534 |
| rules-techniques | 8 | 0.1340 | 0.9534 |
| settings | 12 | 0.8662 | 0.9778 |
| settings-dark | 5 | 0.8774 | 0.9791 |
| settings-focus | 4 | 0.8877 | 0.9753 |
| settings-light | 5 | 0.8682 | 0.9758 |
| setup | 12 | 0.7557 | 0.9422 |
| setup-four | 12 | 0.7817 | 0.9462 |
| setup-marked | 12 | 0.7555 | 0.9413 |
| setup-marked-four | 12 | 0.7815 | 0.9452 |
| win | 10 | 0.7843 | 0.9448 |

## Run 5 (after block 1, update-page-layout-geometry): by state

Run 5, 2026-10-10 21:15 to 21:18, after the main column's layout geometry was ported (the change `update-page-layout-geometry`; its geometry test passes at all 27 sampled cases, and the per-block tool reads 0 boxes off in 54 shots at the gate's real scale): **FAIL**, exit 1, **1 of 170 at 0.98** (1440-dark-confirm 0.982). 168 scored 0.1274 to 0.982 (mean 0.8458, telemetry; run 4: 0.8214). 2 logo shots have no state driver. Output: [`docs/qa/g2/check-visual-run-5.txt`](../g2/check-visual-run-5.txt). 

The last column is the mean change against run 4. Every state moves up except the setup sheet (its own block: the box model and line height also changed the sheet; 375-light-setup dropped most, 0.8087 → 0.7240). The palette still dominates the remaining residual.

| State | Shots | Lowest | Highest | Mean change |
|---|---|---|---|---|
| confirm | 10 | 0.1274 | 0.9820 | +0.03 |
| default | 12 | 0.7610 | 0.9634 | +0.04 |
| eight | 12 | 0.7641 | 0.9673 | +0.03 |
| four | 10 | 0.7436 | 0.9782 | +0.04 |
| hint | 10 | 0.7297 | 0.9449 | +0.04 |
| level | 10 | 0.7641 | 0.9669 | +0.04 |
| rules | 12 | 0.1340 | 0.9534 | +0.02 |
| rules-techniques | 8 | 0.1340 | 0.9534 | +0.03 |
| settings | 12 | 0.8662 | 0.9778 | +0.03 |
| settings-dark | 5 | 0.8774 | 0.9791 | +0.03 |
| settings-focus | 4 | 0.8877 | 0.9753 | +0.03 |
| settings-light | 5 | 0.8682 | 0.9758 | +0.04 |
| setup | 12 | 0.7240 | 0.9381 | -0.00 |
| setup-four | 12 | 0.7311 | 0.9413 | -0.00 |
| setup-marked | 12 | 0.7291 | 0.9371 | -0.00 |
| setup-marked-four | 12 | 0.7291 | 0.9400 | -0.00 |
| win | 10 | 0.7843 | 0.9448 | +0.05 |

## Run 4 (against review-set-14, PD-3 adapter): by state

Run 4, 2026-10-10 16:49 to 16:51, with the real device scale of PD-3: **FAIL**, exit 1, 0 of 170 at 0.98. 168 scored 0.1188 to 0.9662 (mean 0.8214, telemetry). 2 logo shots have no state driver. Output: [`docs/qa/g2/check-visual-run-4.txt`](../g2/check-visual-run-4.txt). Against run 3, the phone setup-sheet shots drop by up to 0.018 (375-light-setup-marked-four 0.8477 → 0.8292): with a real scale, the page's text lays out a few pixels taller. Every other shot moves by less than 0.004.

| State | Shots | Lowest | Highest |
|---|---|---|---|
| confirm | 10 | 0.1188 | 0.9662 |
| default | 12 | 0.7270 | 0.9584 |
| eight | 12 | 0.7258 | 0.9324 |
| four | 10 | 0.7207 | 0.9511 |
| hint | 10 | 0.6885 | 0.9137 |
| level | 10 | 0.7250 | 0.9320 |
| rules | 12 | 0.1320 | 0.9496 |
| rules-techniques | 8 | 0.1320 | 0.9496 |
| settings | 12 | 0.8280 | 0.9612 |
| settings-dark | 5 | 0.8336 | 0.9626 |
| settings-focus | 4 | 0.8433 | 0.9556 |
| settings-light | 5 | 0.8388 | 0.9507 |
| setup | 12 | 0.7248 | 0.9369 |
| setup-four | 12 | 0.7515 | 0.9394 |
| setup-marked | 12 | 0.7175 | 0.9359 |
| setup-marked-four | 12 | 0.7516 | 0.9388 |
| win | 10 | 0.7256 | 0.9309 |

## Run 3 (against review-set-14, PD-2 adapter): by state

Run 3, 2026-10-10 15:43 to 15:46, against `review-set-14`, with the adapter of PD-2 (the fixture boards; own preview only): **FAIL**, exit 1, 0 of 170 at 0.98. 168 scored 0.1187 to 0.9661 (mean 0.8224, telemetry). 2 logo shots have no state driver. Output: [`docs/qa/g2/check-visual-run-3.txt`](../g2/check-visual-run-3.txt). Run 2 is in git history.

The board shots barely moved (hint lowest 0.6182 → 0.6907, win 0.6546 → 0.7277; the rest within about 0.02): the palette, header, type and button styles dominate every shot. The very low `confirm` and `rules` light shots (0.12 to 0.36) are mostly the backdrop: the design dims the whole page behind the dialog and the panel, and the page does not, so almost every pixel differs (seen in `1440-light-confirm/diff.png`). The page column is also narrower than the design's (`#app` 420 px against the design's `--page-max: 34rem`), which moves every block.

| State | Shots | Lowest | Highest |
|---|---|---|---|
| confirm | 10 | 0.1187 | 0.9661 |
| default | 12 | 0.7280 | 0.9583 |
| eight | 12 | 0.7258 | 0.9324 |
| four | 10 | 0.7208 | 0.9511 |
| hint | 10 | 0.6907 | 0.9138 |
| level | 10 | 0.7251 | 0.9320 |
| rules | 12 | 0.1315 | 0.9496 |
| rules-techniques | 8 | 0.1315 | 0.9496 |
| settings | 12 | 0.8280 | 0.9612 |
| settings-dark | 5 | 0.8335 | 0.9626 |
| settings-focus | 4 | 0.8465 | 0.9554 |
| settings-light | 5 | 0.8382 | 0.9506 |
| setup | 12 | 0.7269 | 0.9373 |
| setup-four | 12 | 0.7516 | 0.9410 |
| setup-marked | 12 | 0.7209 | 0.9362 |
| setup-marked-four | 12 | 0.7517 | 0.9403 |
| win | 10 | 0.7277 | 0.9309 |

## Run 2 (against review-set-14): by state

Run 2, 2026-10-10 about 14:20, against the new reference (row 142): **FAIL**, exit 1, 0 of 170 at 0.98. 168 scored 0.1178 to 0.9663 (mean 0.8141, telemetry). 2 logo shots have no state driver. Output: [`docs/qa/g2/check-visual-run-2.txt`](../g2/check-visual-run-2.txt). The per-shot `report.json` files now hold run 2; run 1 is in the tables below and in git history (`cdab28b`).

| State | Shots | Lowest | Highest |
|---|---|---|---|
| confirm | 10 | 0.1178 | 0.9663 |
| default | 12 | 0.7185 | 0.9345 |
| eight | 12 | 0.7189 | 0.9278 |
| four | 10 | 0.7131 | 0.9520 |
| hint | 10 | 0.6182 | 0.9135 |
| level | 10 | 0.7151 | 0.9205 |
| rules | 12 | 0.1315 | 0.9497 |
| rules-techniques | 8 | 0.1315 | 0.9497 |
| settings | 12 | 0.8168 | 0.9613 |
| settings-dark | 5 | 0.8356 | 0.9627 |
| settings-focus | 4 | 0.8210 | 0.9529 |
| settings-light | 5 | 0.8184 | 0.9493 |
| setup | 12 | 0.7189 | 0.9355 |
| setup-four | 12 | 0.7436 | 0.9392 |
| setup-marked | 12 | 0.7209 | 0.9362 |
| setup-marked-four | 12 | 0.7517 | 0.9403 |
| win | 10 | 0.6546 | 0.9300 |

## Run 1: by state

| State | Shots | Lowest | Highest |
|---|---|---|---|
| confirm | 10 | 0.1218 | 0.9666 |
| default | 12 | 0.7311 | 0.9364 |
| eight | 12 | 0.7189 | 0.9278 |
| four | 10 | 0.7131 | 0.9520 |
| hint | 10 | 0.6312 | 0.9223 |
| level | 10 | 0.7151 | 0.9205 |
| rules | 12 | 0.1315 | 0.9497 |
| rules-techniques | 8 | 0.1315 | 0.9497 |
| settings | 12 | 0.8143 | 0.9622 |
| settings-dark | 5 | 0.8367 | 0.9636 |
| settings-focus | 4 | 0.8175 | 0.9529 |
| settings-light | 5 | 0.8159 | 0.9515 |
| setup | 12 | 0.7189 | 0.9355 |
| setup-four | 12 | 0.7436 | 0.9392 |
| setup-marked | 12 | 0.7209 | 0.9362 |
| setup-marked-four | 12 | 0.7517 | 0.9403 |
| win | 10 | 0.6669 | 0.9369 |

## Run 1: every shot

| Shot | Score | Pass |
|---|---|---|
| 1024-dark-confirm | 0.9530 | no |
| 1024-dark-default | 0.8998 | no |
| 1024-dark-eight | 0.8931 | no |
| 1024-dark-four | 0.9240 | no |
| 1024-dark-hint | 0.8553 | no |
| 1024-dark-level | 0.8889 | no |
| 1024-dark-rules | 0.9278 | no |
| 1024-dark-settings-light | 0.9467 | no |
| 1024-dark-settings | 0.9433 | no |
| 1024-dark-setup-four | 0.8879 | no |
| 1024-dark-setup-marked-four | 0.8892 | no |
| 1024-dark-setup-marked | 0.9009 | no |
| 1024-dark-setup | 0.9013 | no |
| 1024-dark-win | 0.8695 | no |
| 1024-light-confirm | 0.1611 | no |
| 1024-light-default | 0.8888 | no |
| 1024-light-eight | 0.8910 | no |
| 1024-light-four | 0.9140 | no |
| 1024-light-hint | 0.8912 | no |
| 1024-light-level | 0.8913 | no |
| 1024-light-rules | 0.2184 | no |
| 1024-light-settings-dark | 0.9456 | no |
| 1024-light-settings | 0.9457 | no |
| 1024-light-setup-four | 0.8741 | no |
| 1024-light-setup-marked-four | 0.8755 | no |
| 1024-light-setup-marked | 0.8725 | no |
| 1024-light-setup | 0.8740 | no |
| 1024-light-win | 0.9127 | no |
| 1366-dark-default | 0.9364 | no |
| 1366-dark-eight | 0.9244 | no |
| 1366-dark-rules-techniques | 0.9357 | no |
| 1366-dark-rules | 0.9357 | no |
| 1366-dark-settings-focus | 0.9529 | no |
| 1366-dark-settings | 0.9543 | no |
| 1366-dark-setup-four | 0.9077 | no |
| 1366-dark-setup-marked-four | 0.9077 | no |
| 1366-dark-setup-marked | 0.9146 | no |
| 1366-dark-setup | 0.9168 | no |
| 1366-light-default | 0.9353 | no |
| 1366-light-eight | 0.9278 | no |
| 1366-light-rules-techniques | 0.1767 | no |
| 1366-light-rules | 0.1767 | no |
| 1366-light-settings-focus | 0.9516 | no |
| 1366-light-settings | 0.9530 | no |
| 1366-light-setup-four | 0.9098 | no |
| 1366-light-setup-marked-four | 0.9098 | no |
| 1366-light-setup-marked | 0.8972 | no |
| 1366-light-setup | 0.8995 | no |
| 1440-dark-confirm | 0.9666 | no |
| 1440-dark-default | 0.9215 | no |
| 1440-dark-eight | 0.9187 | no |
| 1440-dark-four | 0.9520 | no |
| 1440-dark-hint | 0.8986 | no |
| 1440-dark-level | 0.9172 | no |
| 1440-dark-rules-techniques | 0.9497 | no |
| 1440-dark-rules | 0.9497 | no |
| 1440-dark-settings-light | 0.9515 | no |
| 1440-dark-settings | 0.9622 | no |
| 1440-dark-setup-four | 0.9392 | no |
| 1440-dark-setup-marked-four | 0.9403 | no |
| 1440-dark-setup-marked | 0.9362 | no |
| 1440-dark-setup | 0.9355 | no |
| 1440-dark-win | 0.9022 | no |
| 1440-light-confirm | 0.1218 | no |
| 1440-light-default | 0.9198 | no |
| 1440-light-eight | 0.9203 | no |
| 1440-light-four | 0.9460 | no |
| 1440-light-hint | 0.9223 | no |
| 1440-light-level | 0.9205 | no |
| 1440-light-rules-techniques | 0.1315 | no |
| 1440-light-rules | 0.1315 | no |
| 1440-light-settings-dark | 0.9636 | no |
| 1440-light-settings | 0.9510 | no |
| 1440-light-setup-four | 0.9342 | no |
| 1440-light-setup-marked-four | 0.9353 | no |
| 1440-light-setup-marked | 0.9241 | no |
| 1440-light-setup | 0.9241 | no |
| 1440-light-win | 0.9369 | no |
| 320-dark-confirm | 0.8337 | no |
| 320-dark-default | 0.7327 | no |
| 320-dark-eight | 0.7249 | no |
| 320-dark-four | 0.7291 | no |
| 320-dark-hint | 0.6312 | no |
| 320-dark-level | 0.7151 | no |
| 320-dark-rules-techniques | 0.8101 | no |
| 320-dark-rules | 0.8096 | no |
| 320-dark-settings-focus | 0.8500 | no |
| 320-dark-settings-light | 0.8227 | no |
| 320-dark-settings | 0.8532 | no |
| 320-dark-setup-four | 0.7436 | no |
| 320-dark-setup-marked-four | 0.7517 | no |
| 320-dark-setup-marked | 0.7209 | no |
| 320-dark-setup | 0.7189 | no |
| 320-dark-win | 0.6669 | no |
| 320-light-confirm | 0.3640 | no |
| 320-light-default | 0.7311 | no |
| 320-light-eight | 0.7189 | no |
| 320-light-four | 0.7131 | no |
| 320-light-hint | 0.7241 | no |
| 320-light-level | 0.7182 | no |
| 320-light-rules-techniques | 0.7854 | no |
| 320-light-rules | 0.7815 | no |
| 320-light-settings-dark | 0.8606 | no |
| 320-light-settings-focus | 0.8175 | no |
| 320-light-settings | 0.8207 | no |
| 320-light-setup-four | 0.8324 | no |
| 320-light-setup-marked-four | 0.8398 | no |
| 320-light-setup-marked | 0.7937 | no |
| 320-light-setup | 0.8132 | no |
| 320-light-win | 0.7819 | no |
| 375-dark-confirm | 0.8554 | no |
| 375-dark-default | 0.7436 | no |
| 375-dark-eight | 0.7432 | no |
| 375-dark-four | 0.7868 | no |
| 375-dark-hint | 0.6654 | no |
| 375-dark-level | 0.7332 | no |
| 375-dark-rules-techniques | 0.8334 | no |
| 375-dark-rules | 0.8314 | no |
| 375-dark-settings-light | 0.8159 | no |
| 375-dark-settings | 0.8312 | no |
| 375-dark-setup-four | 0.7601 | no |
| 375-dark-setup-marked-four | 0.7600 | no |
| 375-dark-setup-marked | 0.7572 | no |
| 375-dark-setup | 0.7593 | no |
| 375-dark-win | 0.7128 | no |
| 375-light-confirm | 0.3282 | no |
| 375-light-default | 0.7396 | no |
| 375-light-eight | 0.7461 | no |
| 375-light-four | 0.7741 | no |
| 375-light-hint | 0.7415 | no |
| 375-light-level | 0.7455 | no |
| 375-light-rules-techniques | 0.7985 | no |
| 375-light-rules | 0.7938 | no |
| 375-light-settings-dark | 0.8367 | no |
| 375-light-settings | 0.8143 | no |
| 375-light-setup-four | 0.8321 | no |
| 375-light-setup-marked-four | 0.8355 | no |
| 375-light-setup-marked | 0.8024 | no |
| 375-light-setup | 0.8087 | no |
| 375-light-win | 0.8118 | no |
| 768-dark-confirm | 0.9385 | no |
| 768-dark-default | 0.8502 | no |
| 768-dark-eight | 0.8474 | no |
| 768-dark-four | 0.9044 | no |
| 768-dark-hint | 0.8099 | no |
| 768-dark-level | 0.8518 | no |
| 768-dark-rules | 0.9254 | no |
| 768-dark-settings-light | 0.8994 | no |
| 768-dark-settings | 0.9319 | no |
| 768-dark-setup-four | 0.8852 | no |
| 768-dark-setup-marked-four | 0.8859 | no |
| 768-dark-setup-marked | 0.8789 | no |
| 768-dark-setup | 0.8800 | no |
| 768-dark-win | 0.8164 | no |
| 768-light-confirm | 0.2343 | no |
| 768-light-default | 0.8476 | no |
| 768-light-eight | 0.8508 | no |
| 768-light-four | 0.8971 | no |
| 768-light-hint | 0.8531 | no |
| 768-light-level | 0.8516 | no |
| 768-light-rules | 0.7764 | no |
| 768-light-settings-dark | 0.9353 | no |
| 768-light-settings | 0.8993 | no |
| 768-light-setup-four | 0.7776 | no |
| 768-light-setup-marked-four | 0.7952 | no |
| 768-light-setup-marked | 0.7873 | no |
| 768-light-setup | 0.7874 | no |
| 768-light-win | 0.8802 | no |
| logo-dark | — (no state driver for "logo" (shot logo-dark)) | no |
| logo-light | — (no state driver for "logo" (shot logo-light)) | no |
