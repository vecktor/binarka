# Design: add-puzzle-engine

## Goals

- A pure TypeScript engine (TC-7, TC-8) that the CLI and, later, the page share.
- Exact rule checks, a solver that stops at 2, a seeded generator whose puzzles
  always have exactly one solution, a deterministic one-sentence hint engine.
- 8x8 generation under 3 s worst case over seeds 1 to 20 (NFR-3).

## Non-goals

- Sizes 10 to 16 tested, timed or offered (FR-18); the size check only admits them (FR-49).
- Rule-solvable guarantee (FR-27), difficulty, English hints (FR-56), any page code.
- New dependencies beyond the user-approved `@types/node` (TC-10).

## Archive note

The baseline `openspec/specs/puzzle-engine/spec.md` already holds these
requirements and the delta here is a faithful copy as `## ADDED Requirements`.
Archiving with a normal spec merge would collide with the baseline, so the
change is archived with `npx openspec archive add-puzzle-engine --skip-specs --yes`.
This slice changes no spec text; any later spec edit goes to both files together.

## Module layout

| File | Responsibility |
|---|---|
| `src/engine/types.ts` | `Cell = 0 \| 1 \| null`, `Grid = Cell[][]`, `Puzzle {size, givens, solution}`, `Violation`, `Hint`, error classes |
| `src/engine/rules.ts` | `findViolations(board): Violation[]`, `isSolved(board)` |
| `src/engine/solver.ts` | `countSolutions(board): 0 \| 1 \| 2` (plus an internal node-budgeted variant for the generator) |
| `src/engine/rng.ts` | `mulberry32(seed)` returning `() => number` in [0, 1), plus a seeded shuffle |
| `src/engine/generator.ts` | `generate(size, seed): Puzzle`, size and seed validation |
| `src/engine/hint.ts` | `hint(board): Hint`, Ukrainian sentence builders |
| `src/engine/index.ts` | re-exports the public API only: `findViolations`, `isSolved`, `countSolutions`, `generate`, `hint` and the types |
| `src/cli.ts` | argument parsing, printing, error exit |

Pinned shapes (spec-made contract, names not to be changed here):
`Violation = {rule: 'three' | 'count' | 'duplicate', axis: 'row' | 'col', index, other?, cells: [row, col][]}`
with 0-based `index`, `other` (second line of a `duplicate`) and cell coordinates.
`Hint = {kind: 'fill', row, col, value, rule: 'pair' | 'sandwich' | 'count', sentence} | {kind: 'none' | 'broken', sentence}`.
`hint` and `findViolations` never mutate their argument.

## Key decisions

1. **Seeded PRNG: mulberry32.** 32-bit state from the seed, a few lines, no
   dependency, good enough for shuffling. Seed 0 is valid (state 0 still advances).
   `Math.random` and `Date` are never used in `src/engine/` (TC-8); a source-scan
   test enforces it (no `@trace`, A-21). Trade-off: not cryptographic, irrelevant here.
2. **Generator: full grid, then carve.** (a) Fill a complete valid grid cell by
   cell in row-major order by randomised backtracking (digit order from the seeded
   RNG), checking triple, count and duplicate rules incrementally. (b) Shuffle all
   N*N cell positions with the RNG, then for each position blank it and ask the
   solver; keep the blank only when the count is exactly 1, otherwise restore the
   digit. Every returned puzzle therefore has exactly one solution by
   construction; the test over seeds 1 to 20 checks it independently of the
   generator. Trade-off: the result is irredundant (no given can be dropped), so
   some puzzles may have no pair, sandwich or count move and `hint` returns the
   no-rule sentence (FR-25); FR-27 is Future.
3. **Time bound by work, not by clock.** A wall-clock cutoff would make the output
   depend on machine speed and break FR-14 (same seed, same puzzle). The fill uses a
   node budget; if it is exceeded the fill restarts from the continued RNG stream
   (still deterministic). Each carving check uses a node budget too; a check that
   exhausts it counts as "not removable", which keeps the digit and so stays correct.
   Expected cost for N = 8: 64 solver calls on a small grid with propagation, far below
   3 s; timing tests (NFR-1 to NFR-3) measure the worst case over seeds 1 to 20.
4. **Solver: backtracking with propagation, stops at 2.** Reject immediately
   (result 0) if `findViolations` is non-empty. Propagate forced moves (pair,
   sandwich and count deductions) to a fixed point; a contradiction means 0.
   Then pick the first empty cell, try 0 and 1, add up completions and stop as
   soon as the total reaches 2. A complete valid grid returns 1. Propagation is
   sound (every forced move is implied by the rules), so counts stay exact. The
   public function can only return 0, 1 or 2.
5. **Hint precedence.** (1) if `findViolations` is non-empty, `broken`; (2) rule
   order pair, sandwich, count; within a rule rows before columns, lower line first,
   lower target-cell position first; (3) otherwise `none`. The hint reads only the
   board it is given, never `Puzzle.solution` (A-6). Pair: two equal neighbours and
   an empty cell directly beside the pair, target the opposite digit; when both
   neighbours are empty the lower position wins. Sandwich: an empty cell between two
   equal digits. Count: a line holding N/2 of one digit and at least one empty cell,
   target its first empty cell with the other digit. Only empty cells are targeted
   (FR-24).
6. **Ukrainian wording.** Templates (line number is 1-based; apostrophe in
   «п'ять» is the typographic character, not a sentence break):
   - pair: «{Два нулі | Дві одиниці} поспіль у {рядку | стовпці} L, тож поруч може стояти лише {одиниця | нуль}.»
   - sandwich: «Між двома {нулями | одиницями} у {рядку | стовпці} L може стояти лише {одиниця | нуль}.»
   - count: «У {рядку | стовпці} L вже {число + слово}, тож решта клітинок — {одиниці | нулі}.»
   - none: «Жодне з трьох правил зараз не підказує наступного ходу.»
   - broken: «Спершу виправте порушення правил, підсвічене на полі.»

   Count-word table, keyed by k = N/2 (digit word is masculine for нуль, feminine for одиниця):

   | k | нулі | одиниці |
   |---|---|---|
   | 2 (N=4) | два нулі | дві одиниці |
   | 3 (N=6) | три нулі | три одиниці |
   | 4 (N=8) | чотири нулі | чотири одиниці |
   | 5 to 8 (N=10 to 16) | п'ять / шість / сім / вісім нулів | п'ять / шість / сім / вісім одиниць |

   Rows 2 to 4 are tested; the plural genitive forms for k = 5 to 8 follow the
   regular rule but are untested above N = 8 (A-9, FR-18). The same table is the
   only source of number words; no string is built from the digit value anywhere else.
7. **Errors.** Size and seed validation lives in `generator.ts`. `generate` throws
   `InvalidSizeError` or `InvalidSeedError`, both subclasses of `RangeError`, with
   a one-sentence English message that does not echo the offending value; a
   non-number argument throws a `TypeError` subclass. No puzzle is ever returned
   alongside an error. The CLI parses first, then calls `generate`, catches, writes
   `message + "\n"` to stderr, sets exit code 1 and writes nothing to stdout. Output
   is built fully before the first stdout write so a late failure cannot leave
   partial output.
8. **CLI grammar and parsing.** Manual parsing of `process.argv` (no library). Only
   `--size` and `--seed` exist; a value is the next argument verbatim, and a
   missing next argument is a missing-value error (FR-54); any other token, including
   `--size=6`, is an unknown-option error. A value is accepted only when it matches
   `^[0-9]+$` (FR-53); `06` is 6; the accepted digits go through `Number`, then
   range checks come from `generate` (a digit string too long to be finite becomes
   `Infinity` and is rejected). Defaults: size 6, seed 1 (FR-29). A repeated option
   takes the last value (unspecified in the spec, untested).
9. **Node types for the CLI and the tests.** `src/cli.ts` needs `process` and the CLI tests need `node:child_process` and `node:fs`. The user approved `@types/node` (exact pin 22.20.5, matching Node 22) as a devDependency and `tsconfig.json` `types` now lists `node`. The ambient-shim fallback proposed earlier is not used.

None of these decisions is ADR-worthy: all are local and reversible inside
`src/engine/`, and the stack itself is already ADR-0001.

## Data model

`Grid` is `Cell[][]`, row-major, `board[row][col]`. `Puzzle.givens` is the carved
grid, `Puzzle.solution` the complete grid; the two are separate arrays (no
aliasing). `findViolations` returns one `three` entry per maximal run of 3 or
more (all its cells), one `count` entry per line over N/2, and one `duplicate`
entry per pair of identical complete lines (`index` the lower line, `other` the
higher).

## Error handling

| Input | Result |
|---|---|
| odd N, N below 4, N above 16, non-integer, NaN, infinite N | `InvalidSizeError` (RangeError) |
| seed not an integer in 0..2147483647 | `InvalidSeedError` (RangeError) |
| CLI value outside `^[0-9]+$`, missing value, unknown option | one English sentence on stderr, exit 1, stdout empty |
| malformed boards passed to engine functions | unspecified (spec exclusion), no validation added |

Every CLI error is a single line ending in one terminal mark, with no Cyrillic
and no earlier full stop, exclamation or question mark (NFR-4, NFR-8).

## Risks and mitigations

- **8x8 generation speed (NFR-3).** Mitigation: propagation in the solver, node
  budgets, 64 solver calls only; timing test over seeds 1 to 20 is part of slice
  exit. If the fill backtracks too much, add propagation to the fill before
  touching the bound (the bound is change-control, A-13).
- **NFR-5, no Latin letters.** Sentences are assembled from Cyrillic templates and
  digits only; a test applies `/\p{Script=Latin}/u` to every sentence kind and
  every N tested.
- **One-sentence check (NFR-4).** The em dash and comma are not breaks. The test
  asserts exactly one terminal mark, at the end; CLI messages must not embed
  numbers with decimal points or abbreviations.
- **Number agreement (A-15).** Covered for N = 4, 6, 8 by scenarios; above 8
  untested and documented in decision 6.
- **Determinism (FR-14).** No clock, no `Math.random`, no iteration over unordered
  structures; verified by repeated and cross-process generation tests.
- **Timing flakiness on shared machines (A-13).** Bounds are fixed by the spec;
  the test measures the worst case of 20 runs after one warm-up call.
- **Red-stage stubs.** Parallel test-writing uses stub files under `src/engine/*`
  and `src/cli.ts` that throw or return wrong values; they are replaced, not
  extended, and none may survive into the final diff (see tasks 2.x and 3.x).
