# Change: add-difficulty-engine

## Why

The difficulty amendment signed on 2026-10-09 about 12:27 (autonomy-log row 86, «signed, use defaults») gives the game four difficulty levels (FR-44, FR-74 to FR-94). This slice, DL1 of `docs/mvp-capability-plan.md` section 4.10, is the engine half: three new hint techniques (line balance, unique lines, look-ahead; FR-74 to FR-77) with their Ukrainian sentences (FR-78 to FR-80, provisional wording, Q6), a level parameter and an exact-level generator (FR-81 to FR-84), and `--level` in the CLI (FR-85, FR-86). The page half (the level control, descriptions, the rules panel section) is DL2 `add-level-selector` and waits for this slice. A puzzle of level L must be finishable with techniques 1 to L and not with 1 to L − 1, deterministic from (N, seed, level), unique, and level 1 must stay byte-identical to what the game produced before this slice (FR-14, FR-85).

## What Changes

- Hint engine: `hint(board, ceiling = 1)` (default: today's three rules; the page asks for 4 in DL2, user decision row 88); techniques 2 to 4 added in the order of FR-77, each a forced deduction (design decision 1); look-ahead capped at 4 forced steps (A-37); three new sentence templates (FR-78 to FR-80); the no-rule sentence becomes «Жодне з правил зараз не підказує наступного ходу.» (FR-25 as amended, row 87); `rule` gains `balance`, `unique`, `lookahead`, and a look-ahead hint carries `steps`.
- Generator: `generate(size, seed, level = 1)`; the fill phase and the first shuffle are unchanged; for levels 2 to 4 an attempt carves with the predicate «solvable with techniques 1 to L» and is accepted only if the result is not solvable with 1 to L − 1; at most 100 attempts (FR-84, A-35 as amended, row 91), then a distinct `GenerationRunOutError` (A-35, A-38). A new `InvalidLevelError` covers a bad level and a level above 1 at N = 4 (A-34).
- CLI: `--level` (digits-only grammar of FR-53), level errors and run-out as one English sentence on stderr.
- Spec (`puzzle-engine`): 13 ADDED requirements (techniques with their sentences, order and ceiling, level, exact level, same solution, attempts, the public exports, CLI level and its errors, NFR-16, NFR-17) and 17 MODIFIED (FR-13, FR-14, FR-15, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27 renamed, FR-53, FR-54, NFR-1 to NFR-5, NFR-8). See `design.md` for why each is modified.
- Starts with two things before any code: a level-1 golden file taken from the unchanged engine, and a timing spike for a fast level-4 check with a stop rule (A-36). If the 50% margin cannot be reached the slice stops and asks; nothing is relaxed.

Out of scope: every page behaviour (DL2; the page keeps calling `hint(board)`, which means ceiling 1, see design decision 2), N = 4 above level 1, changing FR-25's sentence, relaxing a bound, a `level` field on `Puzzle`, English sentences (FR-56), the held rows NFR-10 to NFR-14.

## Impact

- Affected specs: `puzzle-engine` (ADDED, MODIFIED, one RENAMED). Archived normally, then the non-requirement text of the baseline is edited by hand (listed in `design.md`).
- Affected code: `src/engine/hint.ts` (split), new `src/engine/techniques.ts`, `src/engine/generator.ts`, `src/engine/rule-solve.ts` (a ceiling parameter), `src/engine/types.ts` (errors, hint rule), `src/engine/index.ts` (exports), `src/cli.ts`. `src/ui/` and `src/main.ts` are not touched. No dependency is added.
- Affected tests: eleven new test files plus a typed shim helper, and existing files changed deliberately, each with its source in `design.md` («Tests that change deliberately»): the old no-rule sentence in `tests/hint.test.ts`, `tests/play-page-hint.test.ts`, `tests/helpers/play-page.ts` and `tests/generator-rule-solvable.test.ts` (FR-25 as amended, row 87), and the unknown-option example in `tests/cli.test.ts` (FR-85). `tests/generator-timing.test.ts`, `tests/generator-unique.test.ts`, `tests/generator.test.ts` and the FR-24, FR-27 and FR-66 tests stay unchanged (the FR-66 page test changes in DL2).
- Observable change: the page's no-rule hint sentence reads «Жодне з правил…»; generated puzzles at level 1 and the page's hints are otherwise unchanged.
- New evidence files under `docs/qa/`: golden provenance, spike, red run, timing table, battery. Commits that touch `src/` carry `Slice: add-difficulty-engine` and `Refs: FR-x` trailers.
