# NFR-14 visual parity: per-shot scores

Phase G2. Written by the session `keen-archimedes-c4cd63` on 2026-10-10; run 1 at 13:20 (UTC+5:30), against `main` `a2879b1` plus the uncommitted `fix-size-option-focus-ring` CSS line. That line changes no reference shot, because no shot has a focused size option.

**Verdict of run 1: FAIL.** 0 of 170 shots reach 0.98. 168 were captured and scored (lowest 0.1218, highest 0.9666). 2 failed with no state driver (`logo-*`). Full output: [`docs/qa/g2/check-visual-run-1.txt`](../g2/check-visual-run-1.txt) (exit 1, `Result: FAIL, 1 warning(s)`). Each shot's `report.json` is in its own folder. The `diff.png` files are not committed (about 19 MB per run; `.gitignore`), and `npm run check:visual` writes them again.

The mean of the 168 scores is 0.8165. **That number is telemetry, not the gate**: the gate is per shot (AGENTS.md, the block-conquest lesson).

## The mechanism

- `npm run check:visual` = `npm run build`, then `scripts/check-visual-fidelity.mjs` (the factory checker, hash-locked in `factory-lock.json`, not edited) with `CHECK_VISUAL_FIDELITY_ADAPTERS=scripts/visual-parity-adapters.mjs`.
- **Config:** [`quality/visual-parity.config.json`](../../../quality/visual-parity.config.json). One "breakpoint" per reference shot (170), named as the shot.
  - Threshold **0.98 per shot** (autonomy-log row 68). The checker warns because 0.98 is below its 0.99 default; row 68 expects that warning.
- **Reference:** the frozen PNG `design/v0-screenshots/review-set-13/<shot>.png`. Its `SHA1SUMS` has the SHA-1 `532e0b78e801944970a9f3fabf5ba148107dbffb` (autonomy-log row 134). The served design is not fetched.
- **Product:** the built page (`vite preview` on `localhost:4174`, started by the adapter), captured in Chromium (Playwright) under the conditions of the reference (`design/README.md`, decision 25):
  - device scale 2;
  - the system scheme from the shot name;
  - reduced motion;
  - `--hide-scrollbars`;
  - viewport-cropped, never full page;
  - no pointer on the page: states are reached by `element.click()` and keyboard focus, never by mouse moves;
  - the page window focused;
  - the same Mac and fonts;
  - seeded `Math.random` (seed 1, as in `e2e/helpers.ts`).
- **Diff:** the checker's own pixelmatch adapter (per-pixel threshold 0.1). The score is 1 − mismatched / total, rounded to 4 places.
- **Page-height pre-gate:** inert for these shots. Both sides report the viewport height, because the shots are viewport-cropped. A structural mismatch shows in the pixel score instead.

## Sampling declaration (sampled, never continuum)

- **Dimensions:** viewport, colour scheme, page state.
- **Sample points:** the 170 shots of `review-set-13`:
  - 6 viewports: 320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, with not every state at every viewport;
  - 2 system schemes;
  - 17 states plus the logo.
- **Coverage:** `sampled`, never continuum. Ukrainian page only (TD-Q10). There are no English shots.
- **Stricter instrument (escalation path), before a definition-of-done is claimed:**
  1. a per-block overlay and onion-skin of each failing shot (difference blend plus a 50% composite), reviewed by eye;
  2. a fine-step width sweep (1 px, 320 to 1440) of the product against the served design (`design/v0/out`) for the default state, at least in the pixel channel;
  3. a computed-style diff of the block's elements.

## Capture determinism

7 product shots captured twice: 7 of 7 byte-identical ([`docs/qa/g2/determinism.txt`](../g2/determinism.txt)). That is a sample of 7 of the 168 drivable shots, not the whole set.

## Known gaps (open, for the convergence sessions)

1. **Board content.** The design shots use fixture boards (`design/v0/lib/boards.ts`). The page draws its puzzle from the seed, so the givens, entries and violations differ in every board shot. Even a perfect port cannot reach 0.98 on board shots until the capture can show the fixture board. This needs a decision from the user, and probably a spec: for example, a capture-only way to load a given board, or new reference shots of the seeded board. It is the first blocker to convergence.
2. **Logo shots** (`logo-light`, `logo-dark`: the logo at 40, 56 and 64 px on the design's `/logo/` route). The page has no such view, so these fail with "no state driver". They are related to NFR-15 (slice H).
3. **`qa-verify` runs the checker without the adapter.** `scripts/qa-verify.mjs` (locked) calls `node scripts/check-visual-fidelity.mjs` directly, without `CHECK_VISUAL_FIDELITY_ADAPTERS`. That run uses the default adapters: it captures the two config URLs full page at device scale 1. It fails while the design is not served on `127.0.0.1:4175`. **Do not read a qa-verify result for visual-fidelity as NFR-14.** The fix is a process change to a locked file: let the checker read the adapter path from the config, or have qa-verify set the variable. That needs the user's approval (`Refs: PD-<n>`).
4. **The adapter is not under the lock.** `scripts/visual-parity-adapters.mjs` decides how the product is captured but is not listed in `factory-lock.json`. Adding it is a lock update for the user.
5. **States the drivers approximate.** `rules-techniques` scrolls the panel to its end, as the design route does. `setup` starts a 6×6 «Задачка» puzzle and then opens the sheet. `setup-marked` marks 8×8 «Головоломка» and puts keyboard focus on «Почати». `settings-light` and `settings-dark` store the manual theme before load.
6. **A stale preview server is measured silently.** `ensureServer` in the adapter spawns `vite preview --port 4174 --strictPort`, but it only checks that the URL answers. If another preview is already on 4174, the spawn fails quietly and the capture measures whatever that server serves, possibly an old build. Run 1 was clean, because the earlier preview was stopped first. Make the adapter fail when its own spawn exits.

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
