# Change: add-puzzle-engine

## Why

Бінарка needs a pure TypeScript core before any page exists: a rule checker, a
solution counter, a seeded generator that only returns puzzles with exactly one
solution, and a hint engine that explains each move in one Ukrainian sentence.
The play-page slice (`add-play-page`) consumes this engine and must not restate
its rules. A command-line printer (`src/cli.ts`) gives a no-browser way to see
and verify the engine, and it is the demo fallback if slice 2 is cut
(`docs/mvp-capability-plan.md` section 4.1, cut line 4). Deadline: 22:00 user
time.

## What Changes

- Add `src/engine/` (`types`, `rules`, `solver`, `rng`, `generator`, `hint`,
  `index`): rule checker, solved check, solver returning 0, 1 or 2, seeded
  generator `generate(size, seed): Puzzle`, hint engine `hint(board)`.
- Add `src/cli.ts`: `npm run --silent cli -- --size <N> --seed <integer>`
  prints the puzzle; English one-sentence errors on stderr with exit code 1.
- Add tests under `tests/` for every area, tagged `@trace FR-x`, written first
  and seen red.
- No new dependencies (TC-10); the existing `cli` script (`tsx src/cli.ts`) is
  reused.

Scope in: FR-1 to FR-17, FR-19 to FR-26, FR-28 to FR-30, FR-49 to FR-54,
NFR-1 to NFR-5, NFR-8.

Scope out: FR-18 (sizes 10 to 16 tested or offered), FR-27 (rule-solvable
guarantee), FR-56 (English hints), all page behaviour (FR-31 to FR-48). NFR-6
(hint-quality eval) is graded after slice 2 and reported NOT-EARNED until then;
the requirement text stays in the spec.

## Impact

- Affected specs: `puzzle-engine`. The delta in
  `specs/puzzle-engine/spec.md` is a faithful `## ADDED Requirements` copy of
  the baseline already in `openspec/specs/puzzle-engine/spec.md`, so this change
  is archived with `--skip-specs` (the baseline already holds the requirements).
  No spec text changes in this slice, and the engine interface contract is
  unchanged.
- Affected code: new `src/engine/*`, new `src/cli.ts`, new `tests/*`.
  `src/main.ts` is untouched.
- Downstream: `add-play-page` imports from `src/engine/index.ts` only.
- Risks: 8x8 generation speed (NFR-3), hint precedence, NFR-5 strictness,
  Ukrainian number agreement. See `design.md`.
- Commits carry trailers `Slice: add-puzzle-engine` and `Refs: FR-x`.
