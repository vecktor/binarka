# Tasks: update-logo-legibility

Order of work: section 1 (tests) is written FIRST from the delta spec and seen red on assertions before section 2. The project has no database (TC-12), so the "real-DB smoke test" of the template is the vision-verified recording of section 4. Commits that touch `src/` carry `Slice: update-logo-legibility` and `Refs: FR-72, NFR-15`; commits are GPG-signed, no `--no-verify`, no squash. Every ticked task names an evidence file that exists; evidence lives in `docs/qa/update-logo-legibility/` unless the task names another path. Port base for every capture: `BINARKA_PORT_BASE=6873`. Nothing is merged or pushed without the user's word. Run `date` before writing a time (UTC+5:30).

## 0. Decisions

- [x] 0.1 The user's three answers of 2026-10-12 (drawing B, mirror in `design/v0` with a new review set, wait for the recordings commit then rebase) and the comparison still. Evidence: `docs/qa/update-logo-legibility/session-log.md`, `docs/qa/update-logo-legibility/options-40px-dpr2.png`.

## 1. Red first

- [x] 1.1 In `tests/play-page-logo.test.ts` add one test per new scenario («The digits are large enough to read at 40 px», «The board sits inside the circle and the rays outside it»), tagged `@trace FR-72`, with a `DELIBERATE CHANGE` comment naming this change. No existing assertion changes. Evidence: `tests/play-page-logo.test.ts`.
- [x] 1.2 `npx openspec validate update-logo-legibility --strict` passes. Evidence: `session-log.md` row 4.
- [x] 1.3 Run `npx vitest run tests/play-page-logo.test.ts` against today's drawing: the floors test fails on assertions (cell 11 < 15, bar 2.6 < 4, ring stroke 1.8 < 2.8, hole 2.6 < 3.2); the circle-and-rays test passes and is marked GUARD. Evidence: `docs/qa/update-logo-legibility/red-run.txt`.

## 2. Drawing

- [x] 2.1 `src/ui/logo.ts`: the coordinates of `design.md` (Decisions). Structure, classes, attributes and order unchanged; no colour, no `id`, no text. Evidence: `src/ui/logo.ts` (commit `74ac3a4`).
- [x] 2.2 `npm run lint`, `npm run test:run`, `npm run build` pass. Evidence: `docs/qa/update-logo-legibility/green-run.txt`.

## 3. Design mirror (the user's yes of 2026-10-12)

- [x] 3.1 `design/v0/components/binarka-page.tsx`: `Logo` and `LogoDigit` get the same coordinates; nothing else changes. `design/README.md` gains the iteration entry. Evidence: commit `04b3036`.
- [x] 3.2 Build the design (`design/v0`, `pnpm build`), serve `out/` on 127.0.0.1:4173, write the prediction (every shot with the header or the logo sheet changes; every other shot is byte-identical), capture `design/v0-screenshots/logo-drawing-b/` twice with `design/tools/capture-review-set.sh` and compare (`SHA1SUMS`, `run-2.SHA1SUMS`, `CHANGES` against `review-set-14`). Evidence: `design/v0-screenshots/logo-drawing-b/PREDICTION.txt`, `CHANGES`.
- [ ] 3.3 Ask the user whether to move the NFR-14 reference to a new set that carries drawing G (`design/v0-screenshots/logo-drawing-g/`) together with the DS stream's 28px design (`review-set-15`); only the user moves it. Open; until then the logo shots stay NOT-EARNED and the page differs from `review-set-14` in the logo's box (`battery-2.txt`).

## 4. Recording and vision (after the rebase)

- [x] 4.1 Rebase onto `claude/wilbur-recordings` once its held-clip work (`held: true` on `16-logo-40`, the NFR-15 held note, `docs/qa/vision-probe/logo-40-*`) is committed; merge `trace/ledger.jsonl` as a union. Evidence: `session-log.md` (the `git log -1` of the base). Done: base `3ac284b`.
- [x] 4.2 `BINARKA_PORT_BASE=6873 node scripts/record-demos.mjs --only 16-logo-40`: both assertions pass. Evidence: `docs/qa/demo-recordings/16-logo-40.{png,webm,md}`. Evidence: `docs/qa/vision-probe/logo-40-drawB-dpr2.{png,webm,md}` (moved there after the verdict, task 4.4).
- [x] 4.3 One vision-verify run on `docs/qa/demo-recordings/16-logo-40.png` with a fresh vision-judge (never re-run to shop for a pass). Evidence: the verdict in `docs/qa/demo-recordings/manifest.json` and `docs/qa/vision-report.md`. Result: NOT MET (run `wf_ae715072-b48`); evidence `docs/qa/vision-probe/logo-40-verdicts.json` (`16-logo-40-drawB`).
- [x] 4.4 Round 1, drawing B: not met (run `wf_ae715072-b48`), so the clip and NFR-15 stayed held and the verdict was recorded (`docs/qa/vision-probe/logo-40-verdicts.json`). Superseded by 6.5: drawing G passed, `held` was removed and NFR-15 moved (commit `016414b`).
- [x] 4.5 Round 1 battery (drawing B): check:vision and check-recordings --require-vision PASS on what was in force; traceability --release failed only on the active change (`battery.txt`). Superseded by 6.5 and 5.3.

## 5. Review and archive

- [x] 5.1 Review-gate on the slice diff: run 1 `wf_991ccf83-223` (13 confirmed, 4 contested, 2 rejected), fix round 1 (`566e8b7`), confirming run `wf_597cee36-2dc` (8 confirmed, 1 contested, all minor wording), fix round 2; no product defect. Evidence: `openspec/changes/update-logo-legibility/review-findings.json`.
- [ ] 5.2 `npm run lint`, `npm run test:run`, `npm run build`, `npx openspec validate --all --strict`.
- [ ] 5.3 Archive only after 4, 5.1 and 6 pass: `npx openspec archive update-logo-legibility --yes`; in the same commit fix the baseline Exclusions bullet that still says «Legibility of the logo at 40 px and its look are not specified (held NFR-15, NFR-14)»; then `node scripts/check-traceability.mjs --release --strict-tests --strict-recordings`, `npm run check:vision`, `node scripts/check-recordings.mjs --require-vision`; update `docs/current-state.md` with evidence paths.

## 6. Round 2: drawing G (the user's choice and signed FR-72 amendment of 2026-10-12)

- [x] 6.1 FR-72 amended in `docs/requirements.md` (signed in chat). Evidence: commit `e8bc370`, `session-log.md` row 13.
- [x] 6.2 Delta re-cut for G; `npx openspec validate update-logo-legibility --strict` passes; tests changed (tile scenario, floors, board inside the tile) and seen red on drawing B. Evidence: `docs/qa/update-logo-legibility/red-run-2.txt`.
- [x] 6.3 `src/ui/logo.ts` drawing G; lint, tests, build. Evidence: `green-run-2.txt` (commit `4c35f24`).
- [x] 6.4 Design mirror (`5fcd76c`, `ea96c82`, `5d33392`); `scripts/freeze-design-paint.mjs` (`logo-tile` replaces `logo-tooth` and `logo-disc`) and the re-frozen `quality/design-paint.json`; working set `design/v0-screenshots/logo-drawing-g/` (two captures, `CHANGES`); NFR-14 measured (check:visual, e2e). Evidence: `battery-2.txt`.
- [x] 6.5 Record `16-logo-40` (`--only`), one vision-verify run with a fresh vision-judge; met: remove `held`, move NFR-15 (one logged commit); check:vision and check-recordings --require-vision PASS. Evidence: `battery-2.txt`; verdict met in run `wf_a5ad04e1-c59`; move commit `016414b`. The traceability --release check moves to 5.3 (it passes only after the archive).
