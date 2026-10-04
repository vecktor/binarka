# Tasks: add-puzzle-engine

Order of work: section 4 (tests) is written FIRST from the spec and seen red
before sections 1 to 3 are implemented. The sections are numbered by area, not
by time. The test-engineer writes section 4 in parallel and leaves RED-STAGE
stub files under `src/engine/*` and `src/cli.ts` (they type-check, but return
wrong values or throw); the implementer replaces those stubs in sections 1 to 3.
The DB smoke flow of the template maps to the CLI smoke run in 5.9, because no
database exists. Commits carry `Slice: add-puzzle-engine` and `Refs: FR-x`.

## 1. Foundations (types, rng)

- [x] 1.1 Replace the stub `src/engine/types.ts` with `Cell`, `Grid`, `Puzzle`, `Violation` (`rule` 'three' | 'count' | 'duplicate', `axis` 'row' | 'col', 0-based `index`, optional `other`, `cells` as `[row, col]`), `Hint` (fill / none / broken), `InvalidSizeError` and `InvalidSeedError` (subclasses of `RangeError`) and a `TypeError` subclass for non-number arguments; names exactly as pinned in design.md.
- [x] 1.2 Implement `src/engine/rng.ts`: `mulberry32(seed)` returning `() => number` in [0, 1), and a seeded Fisher-Yates `shuffle(items, rng)`; no `Math.random`, no `Date`, no DOM globals (TC-7, TC-8).
- [x] 1.3 Implement `src/engine/index.ts` re-exporting only `findViolations`, `isSolved`, `countSolutions`, `generate`, `hint` and the types.
- [x] 1.4 Node typings: the user approved `@types/node` (exact pin 22.20.5, `npm audit` 0 vulnerabilities) and `tsconfig.json` `types` now lists `node`; no ambient shim is created (autonomy-log row 15).

## 2. Domain logic (rules, solver, generator, hint)

- [x] 2.1 Implement `findViolations` in `src/engine/rules.ts`: one `three` entry per maximal run of 3 or more equal digits with all its cells (FR-1, FR-2); a `count` entry per row or column with more than N/2 of one digit, also when the line is incomplete (FR-3, FR-4); a `duplicate` entry for each pair of identical complete rows or columns, with `index` and `other` (FR-5, FR-6); empty cells never cause a violation (FR-7).
- [x] 2.2 Implement `isSolved` in `src/engine/rules.ts`: every cell filled and no violation (FR-8, FR-9).
- [x] 2.3 Implement `countSolutions` in `src/engine/solver.ts`: return 0 when `findViolations` is non-empty, propagate pair, sandwich and count deductions to a fixed point, branch on the first empty cell, stop at the second solution, return only 0, 1 or 2 (FR-10, FR-11, FR-12). Add the internal node-budgeted variant used by the generator.
- [x] 2.4 Implement size and seed validation in `src/engine/generator.ts`: even integer 4 to 16, seed integer 0 to 2147483647, rejecting odd, below 4, above 16, non-integer, NaN, Infinity, negative and fractional values with the error classes from 1.1 and messages that do not echo the value (FR-16, FR-17, FR-49, FR-50, FR-51).
- [x] 2.5 Implement `generate(size, seed)`: seeded randomised backtracking fill of a complete valid grid with a node budget and deterministic restart, then seeded-order carving that keeps a blank only when the budgeted solver count is exactly 1; return `{size, givens, solution}` as separate arrays (FR-13, FR-14, FR-15, NFR-1 to NFR-3).
- [x] 2.6 Implement `hint` in `src/engine/hint.ts` with the precedence broken, pair, sandwich, count, none; rows before columns, lower line, lower target position; only empty cells targeted; board never mutated; solution never read (FR-19, FR-20, FR-21, FR-23, FR-24, FR-25, FR-26).
- [x] 2.7 Implement the sentence builders in `src/engine/hint.ts`: the Ukrainian templates, the line-type word in the right case («рядку» / «стовпці») with the 1-based number, and the count-word table for k = N/2 (FR-21, FR-22, NFR-4, NFR-5); note in a code comment that k = 5 to 8 is untested.

## 3. CLI

- [x] 3.1 Replace the stub `src/cli.ts`: manual parsing of `--size` and `--seed`, defaults 6 and 1, `^[0-9]+$` grammar with leading zeros accepted, missing value and unknown option rejected, last repeated option wins (FR-29, FR-30, FR-52, FR-53, FR-54).
- [x] 3.2 Print the puzzle as N lines of N space-separated tokens (`0`, `1`, `.`), newline-terminated, built fully before one stdout write; never print the solution; nothing on stderr on success (FR-28).
- [x] 3.3 On any error: catch, write one English sentence (no Cyrillic, no echoed user input, single terminal mark) to stderr, set exit code 1, write nothing to stdout (FR-30, FR-52, FR-54, NFR-4, NFR-8).

## 4. Tests (written FIRST, seen red; one file per area, each test tagged `@trace FR-x` or `@trace NFR-x`)

- [ ] 4.1 `tests/rules.test.ts` for FR-1 to FR-9: every scenario of the three-in-a-row, count, duplicate-row, duplicate-column, empty-cell, solved and not-solved requirements, including N = 4, 6, 8 empty boards.
- [ ] 4.2 `tests/solver.test.ts` for FR-10 to FR-12: the 0, 1 and "2 or more" scenarios, the 8x8 empty board returning exactly 2, no value above 2.
- [ ] 4.3 `tests/generator.test.ts` for FR-13, FR-14, FR-16, FR-17, FR-49, FR-50, FR-51: shape at N = 4, 6, 8; same seed identical; odd, below-4, zero, negative, above-16, 1000, 4.5, NaN, +/-Infinity sizes throw; seeds 0 and 2147483647 accepted; -1, 2147483648, 1.5, NaN, Infinity rejected; no puzzle returned on error.
- [ ] 4.4 `tests/generator-unique.test.ts` for FR-15: for N = 4, 6, 8 and seeds 1 to 20 (60 puzzles) the solver reports 1 on `givens`, and `solution` is a solved grid that agrees with every given. Confirm it is RED against a naive generator (digits placed with no uniqueness check, for example a stub that keeps all givens blank or a random fill) before the real generator lands; keep that naive stub only in the red-stage commit.
- [ ] 4.5 `tests/hint.test.ts` for FR-19 to FR-26: all pair, sandwich, count, no-rule and broken scenarios with exact sentences, the precedence scenarios (pair over sandwich, sandwich over count, rows before columns, lower line, lower position), repeated-call determinism, board unchanged, filled cell beside a pair not targeted, and the "legal entry that differs from the solution is followed" scenario.
- [ ] 4.6 `tests/hint-sentences.test.ts` for NFR-4 and NFR-5: for each sentence kind (row and column where both exist) and N = 4, 6, 8, exactly one terminal mark at the end and no earlier `.`, `!` or `?`; at least one Cyrillic letter and no Latin letter.
- [ ] 4.7 `tests/cli.test.ts` for FR-28 to FR-30, FR-52 to FR-54, NFR-4 (CLI part), NFR-8: runs `npm run --silent cli -- <args>` as a child process with an explicit per-test timeout; covers success, engine match, defaults, every invalid size and seed token (`6.5`, `+6`, `-2`, `1e1`, `0x6`, empty), leading zeros, missing values, unknown options, stdout empty on error, one-line English errors without Cyrillic; asserts shape only, never wording (A-22). Includes the cross-process determinism scenario for N = 8, seed 7.
- [ ] 4.8 `tests/generator-timing.test.ts` for NFR-1 to NFR-3: after one warm-up call, time each of seeds 1 to 20 with `performance.now()` and assert the slowest is under 200 ms (N = 4), 500 ms (N = 6), 3000 ms (N = 8).
- [ ] 4.9 `tests/engine-purity.test.ts` (NO `@trace` tag, A-21): scan `src/engine/**/*.ts` for `Math.random`, `document`, `window`, `localStorage` and imports of DOM modules (TC-7, TC-8).
- [ ] 4.10 Run `npm run test:run` against the red-stage stubs and save the failing output to `docs/qa/add-puzzle-engine-red-run.txt` as evidence that the tests were red first (including the FR-15 test red against the naive generator). After sections 1 to 3 land, every test is green and no stub or naive code remains in `src/`.
- [ ] 4.11 Run `npm run check:trace` and confirm every in-scope FR and NFR (all except NFR-6) has at least one tagged test.

## 5. Validation, docs and archive prep

- [ ] 5.1 Run `npm run lint`.
- [ ] 5.2 Run `npm run test:run` (all green, including the timing tests).
- [ ] 5.3 Run `npm run build` (`tsc --noEmit` covers `tests/` and `src/node-env.d.ts`).
- [ ] 5.4 Run `npx openspec validate add-puzzle-engine --strict`.
- [ ] 5.5 Run `npx openspec validate --all --strict`.
- [ ] 5.6 Review-gate for this slice (correctness and spec-compliance on Opus medium, security on Sonnet medium, verifiers on Sonnet medium, focus "return only defects"): one run, one fix round for confirmed defects, one confirming run; no open confirmed defect remains. Save the report path in `docs/current-state.md`.
- [ ] 5.7 Update `docs/current-state.md`: last update date and time (UTC+5:30, Kyiv is +2:30), phase, slice status, the red-run evidence path from 4.10, the test and validation evidence, and "Scope NOT delivered": NFR-6 eval (NOT-EARNED until graded), FR-18, FR-27, FR-56. Update `README.md` with the CLI usage (`npm run --silent cli -- --size 6 --seed 42`).
- [ ] 5.8 Confirm the only new dependency is the user-approved `@types/node` (`git diff package.json` shows that one line).
- [ ] 5.9 Manual CLI smoke run (stands in for the DB smoke flow; no database exists): (a) run `npm run --silent cli -- --size 6 --seed 42` and check stdout is 6 lines of 6 tokens from `0`, `1`, `.`, exit code 0 (`echo $?`), nothing on stderr; (b) run it again and diff the two outputs, they must be identical; (c) run `npm run --silent cli` and compare with `--size 6 --seed 1`; (d) run `npm run --silent cli -- --size 5` and check one English sentence on stderr, exit code 1, stdout empty (`2>/dev/null` prints nothing); (e) run `--size 06 --seed 7` and `--size 6 --seed 7` and diff; (f) run `--size 8 --seed 20` and note the time (under 3 s); (g) run `--size 6 --seed` and `--level 3` and check one English error each with exit code 1. Record the outcome and the date in `docs/current-state.md`.
- [ ] 5.10 Archive, only after 5.1 to 5.9 all passed and the review-gate in 5.6 has no open confirmed defect: run `npx openspec archive add-puzzle-engine --skip-specs --yes` (the baseline spec already holds the requirements), then run `npx openspec validate --all --strict` again.
