# Tasks: update-page-layout-geometry

Order of work: section 1 (the failing test) is written FIRST and seen red before section 2. Commits are GPG-signed (probe right before each), with no `--no-verify` and no squash. Trailers on every commit touching `src/`: `Slice: update-page-layout-geometry` and `Refs: NFR-14`.

## 1. Failing test first (red)

- [x] 1.1 `scripts/freeze-design-geometry.mjs` freezes the boxes of 15 main-column elements of the design build (`design/v0/out`) into `quality/design-geometry.json`, with the e2e browser setup, for the 27 light reference shots of default, four, eight, level and win, with provenance (design commit, CSS SHA-1, reference SHA1SUMS, browser).
- [x] 1.2 `e2e/nfr-14-layout-geometry.spec.ts` (`@trace NFR-14`): each case sets the case's capture board (FR-119), loads the page at the case's viewport and asserts every box within 0.5 px; one test asserts the fixture's coverage.
- [x] 1.3 `playwright.config.ts`: the `nfr-14-*` pattern in the `layout` project (the user's approval, autonomy-log row 150).
- [x] 1.4 Run the test against today's page and confirm it fails on assertions. Save the output in `docs/qa/update-page-layout-geometry/red-run.txt`.

## 2. Implementation

- [ ] 2.1 `src/ui/style.css`: port the geometry of the main column from `design/v0/app/binarka.css` (design.md, decisions 1 to 5). Colours unchanged; the 13 token names kept.
- [ ] 2.2 Run the geometry test: every case green.

## 3. Battery

- [ ] 3.1 `npm run lint`, `npm run test:run`, `npm run build`, `npx openspec validate --all --strict`, `node scripts/check-eval-ratchet.mjs`.
- [ ] 3.2 `npm run test:e2e` (NFR-10, NFR-12, NFR-14 geometry, NFR-18) and `npm run check:a11y` (NFR-13).
- [ ] 3.3 `node scripts/visual-block.mjs --block layout --states default,four,eight,level,win`: geometry off 0 and unpaired 0; save the output in `docs/qa/update-page-layout-geometry/`.
- [ ] 3.4 Run 5 of `npm run check:visual` → `docs/qa/g2/check-visual-run-5.txt`; update `docs/qa/visual-diff/README.md`.

## 4. Review and archive

- [ ] 4.1 Review gate on the slice's commits; fix rounds need the user's approval.
- [ ] 4.2 Archive the change; update `docs/current-state.md`, `docs/handoff/next-session.md` and the autonomy log.
