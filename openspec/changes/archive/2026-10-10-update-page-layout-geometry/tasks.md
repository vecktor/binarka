# Tasks: update-page-layout-geometry

Order of work: section 1 (the failing test) is written FIRST and seen red before section 2. Commits are GPG-signed (probe right before each), with no `--no-verify` and no squash. Trailers on every commit touching `src/`: `Slice: update-page-layout-geometry` and `Refs: NFR-14`.

## 1. Failing test first (red)

- [x] 1.1 `scripts/freeze-design-geometry.mjs` freezes the boxes of 15 main-column elements of the design build (`design/v0/out`) into `quality/design-geometry.json`, with the e2e browser setup, for the 27 light reference shots of default, four, eight, level and win, with provenance (design commit, CSS SHA-1, reference SHA1SUMS, browser).
- [x] 1.2 `e2e/nfr-14-layout-geometry.spec.ts` (`@trace NFR-14`): each case sets the case's capture board (FR-119), loads the page at the case's viewport and asserts every box within 0.5 px; one test asserts the fixture's coverage.
- [x] 1.3 `playwright.config.ts`: the `nfr-14-*` pattern in the `layout` project (the user's approval, autonomy-log row 150).
- [x] 1.4 Run the test against today's page and confirm it fails on assertions. Save the output in `docs/qa/update-page-layout-geometry/red-run.txt`.

## 2. Implementation

- [x] 2.1 `src/ui/style.css`: port the geometry of the main column from `design/v0/app/binarka.css` (design.md, decisions 1 to 5). Colours unchanged; the 13 token names kept.
- [x] 2.2 Run the geometry test: every case green.
- [x] 2.3 Without a has-selector (FR-65, D1): the size variables on `.board[data-size]`, the 8×8 bleed on the board, and the board host's `data-solved` hook (`src/ui/play-page.ts`), test first: `tests/play-page-layout-geometry.test.ts` red on assertions (`docs/qa/update-page-layout-geometry/red-run-2.txt`), then green.
- [x] 2.4 The sheet's level group keeps the last ring above the footer strip under the new box model (`margin-bottom` 24px → 28px; NFR-13 focus check red at 4 viewports by up to 1.8 px, then green).

## 3. Battery

- [x] 3.1 `npm run lint`, `npm run test:run`, `npm run build`, `npx openspec validate --all --strict`, `node scripts/check-eval-ratchet.mjs`.
- [x] 3.2 `npm run test:e2e` (NFR-10, NFR-12, NFR-14 geometry, NFR-18) and `npm run check:a11y` (NFR-13).
- [x] 3.3 `node scripts/visual-block.mjs --block layout --states default,four,eight,level,win`: geometry off 0 and unpaired 0; save the output in `docs/qa/update-page-layout-geometry/`.
- [x] 3.4 Run 5 of `npm run check:visual` → `docs/qa/g2/check-visual-run-5.txt`; update `docs/qa/visual-diff/README.md`. (Run against the uncommitted port; the evidence landed in `b342d87`, one commit after the ticked task at `b883f36`: review run 1.)

## 4. Fix round 1 (review run `wf_1c7326da-0c4`, approved by the user: autonomy-log row 152)

- [x] 4.1 Tests: the click solve, the click that un-solves and the new size and level clear `data-solved` (mutation check, 3 of 3 killed: `fix-round-1-mutation.txt`); the settings placement check (red against the old 420 px placement: `fix-round-1-settings-red.txt`); the fixture's case list pinned; the hint line as a 16th fixture element (red at 4×0: `fix-round-1-hint-red.txt`).
- [x] 4.2 Fixes: the hint's 4px accent only on a shown hint; the column formula reads `--board-gap-6`/`--board-pad-6` (the unused `#app` copies removed); a path guard in the dev-only servers of `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs` (`fix-round-1-path-guard.txt`); the fixture's provenance names the build (`designBuildSha1`).
- [x] 4.3 Docs: design.md (the bleed on the board, the full list of ported properties, the side effects and the setup-sheet regression with numbers), proposal.md, this file.
- [x] 4.4 Rendered stills of the page after the change, light and dark (`docs/qa/update-page-layout-geometry/stills/`), looked at by a fresh vision judge: no regression in the main column; it found the setup sheet's fourth level under the footer at 1366×650, a regression from block 1 (checked against `6ccaf8c`), fixed with `line-height: normal` on the sheet (`fix-round-1-sheet.txt`).
- [x] 4.5 Battery again (ticked with the fix commit `4cc25dd`; run 6 and its README landed in `389080b`: review run 2) (`fix-round-1-green-run.txt`: lint, 1727 tests, build, strict, ratchet, e2e 148, a11y 67); per-block tool 54 of 54 shots with 0 boxes off (`fix-round-1-block-layout.txt`); run 6 `docs/qa/g2/check-visual-run-6.txt` (1 of 170; the setup sheet above run 4).
- [x] 4.6 A confirming review run: `wf_aa7e0963-7b7`, 11 confirmed and 2 contested, no product-code defect, every run-1 finding fixed; one minor defect in the dev servers (a malformed escape ended the run).
- [x] 4.7 After the confirming run (the user: «Fix minors, then archive», autonomy-log row 153): the dev servers answer 400 to a malformed escape (`review-2-escape.txt`); the spec text names 16 elements and both live regions; 5 shown-hint cases in the fixture (32), replayed by the e2e test; the settings top pinned to 0.5rem under the header; an e2e guard of the sheet fix (red without it: `review-2-sheet-guard-red.txt`); the cross-check tool measures the same 16 elements; `--cell-cap` written once; design.md notes on `transparent` borders and the idle-line peek; battery `review-2-green-run.txt`.

## 5. Review and archive

- [x] 5.1 Review gate on the slice's commits; fix rounds need the user's approval (run 1: 14 confirmed, one minor code defect; fix round 1 above).
- [x] 5.2 Archive the change; update `docs/current-state.md`, `docs/handoff/next-session.md` and the autonomy log.
