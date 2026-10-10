# Tasks: add-capture-board

Order of work: section 1 (tests) is written FIRST and seen red before section 2. Every new test is tagged `@trace FR-119`. Commits are GPG-signed (probe right before each), with no `--no-verify` and no squash. Trailers on every commit: `Slice: add-capture-board` and `Refs: FR-119`.

## 1. Failing tests first (red)

- [x] 1.1 Create `tests/capture-fixtures.test.ts`, for the scenario «The fixture boards are valid capture values».
  - It reads `design/v0/lib/boards.json`, which does not exist yet: the red is a clear assertion that the file exists, never a crash in an import.
  - Data notation: each board is `{ "size": n, "rows": ["g1 .  .", ...], "violations"?: [[r, c], ...] }` (1-based violations; cells `gD` given, `pD` entry, `hD` hinted entry, `.` empty), as in `boards.ts` today.
  - The test owns the conversion to a capture value and asserts the claims of `review-set-14/ENGINE-CHECK.txt`.
- [x] 1.2 Create `tests/play-page-capture-board.test.ts`, one test or more per remaining scenario of «Capture-only board».
  - Mount with a counting seed source and generator (helpers of `tests/helpers/play-page.ts`).
  - Set and delete `window.__binarkaCaptureBoard` around each test.
  - Assert no console output with a spy for the invalid cases.
- [x] 1.3 Run `npm run test:run` and confirm the new tests fail on assertions, for the right reason. Save the output in `docs/qa/add-capture-board/red-run.txt`.

## 2. Implementation

- [x] 2.1 `design/v0/lib/boards.json`: the five boards of `design/v0/lib/boards.ts` at commit `0d5491b`, as data. `boards.ts` imports it and builds the same `BoardSpec` values.
  - Prove the data is identical: the parsed boards from the JSON equal the parsed boards of `boards.ts` at `0d5491b`, by a scratch comparison saved as `docs/qa/add-capture-board/boards-json-equal.txt`.
  - Run `pnpm build` in `design/v0` with `npm_config_manage_package_manager_versions=false`. It must pass.
- [x] 2.2 `src/ui/`: read and validate `window.__binarkaCaptureBoard` at mount (a small module, for example `src/ui/capture-board.ts`, holding the validation; `countSolutions` from `src/engine/index.ts`).
  - When valid, show the board through the same rendering path as a generated puzzle: givens, entries, size and level state, the summary, violations (`refreshHighlights`), the hinted marker (`setHinted`) and the win state (`updateWin`).
  - When absent or invalid, change nothing.
  - No new text in `src/ui/strings.ts`; no `Math.random`; no storage; `src/engine/` untouched.
- [x] 2.3 Run `npm run test:run`: every test is green.

## 3. Battery

- [x] 3.1 `npm run lint`, `npm run test:run`, `npm run build`, `npx openspec validate --all --strict`, `node scripts/check-eval-ratchet.mjs`.
- [x] 3.2 `npm run test:e2e` and `npm run check:a11y`; the mount path changed, so the browser checks must stay green.
- [x] 3.3 A real-browser look: the dev page with the 6×6 fixture set by an init script shows the fixture board, the violation and the summary. Save one shot in `docs/qa/add-capture-board/`.
- [x] 3.4 Save the battery output as `docs/qa/add-capture-board/green-run.txt`.

## 4. Review and archive

- [x] 4.1 Run the review gate (`review-gate` workflow) on the slice's commits. Fix confirmed code defects in a fix round, with the user's approval.
- [x] 4.2 Archive (`npx openspec archive add-capture-board --yes`), validate, then update `docs/current-state.md`, `docs/handoff/next-session.md` and an autonomy-log row.
