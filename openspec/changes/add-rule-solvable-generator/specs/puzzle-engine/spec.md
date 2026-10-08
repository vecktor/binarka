## ADDED Requirements

### Requirement: Every generated puzzle is solvable by the three rules alone

The generator SHALL return, for N = 4, 6 and 8, only puzzles that can be solved from their givens using nothing but the pair, sandwich and count rules: starting from the givens and applying the hint engine's fill (FR-19 to FR-21, in the selection order of FR-23 and A-7) repeatedly, every call returns a fill, every fill agrees with the puzzle's solution, and when no empty cell remains the board equals the puzzle's solution (FR-27, A-5, A-31). Stopping happens because the board is full, not because a call returned the no-rule result (FR-25): a hint call on a full board returns that result by definition (every rule needs an empty cell) and is not part of the check. The guarantee SHALL be obtained by construction of the generator: a candidate puzzle is accepted only if this check passes on it (A-31). A consequence, which the requirement also pins, is that a hint is always available on a board whose entries all agree with the solution and that still has an empty cell. The requirement is verified over the fixed seed set (seeds 1 to 20 for each N = 4, 6, 8, see the test conventions); for any other seed it holds by construction and is not checked exhaustively (A-31), and it makes no claim for N = 10 to 16. This requirement SHALL NOT change FR-14, FR-15 or the timing bounds NFR-1 to NFR-3: the generator stays deterministic from the seed (no `Math.random`, no clock), every puzzle keeps exactly one solution, and the bounds are never relaxed.

Traces: FR-27

#### Scenario: Repeated fill reaches the solution over the fixed seed set

- **GIVEN** each N in 4, 6 and 8 and each seed from 1 to 20, and the puzzle `generate(N, seed)`
- **WHEN** the test copies the givens as a board and repeats: ask the hint engine for a hint on the board, and write the hint's value into the hint's cell, until the board has no empty cell
- **THEN** for each of the 60 puzzles every hint call returned `kind: 'fill'`, never `'none'` and never `'broken'`
- **AND** every filled cell was empty before the call and receives the value that the puzzle's `solution` holds for that cell
- **AND** the number of calls equals the number of empty cells of the givens, and the final board equals the puzzle's `solution`

#### Scenario: A board with a unique solution that the rules cannot finish is not a generator output

- **GIVEN** the 4×4 board with rows `. 0 . 0`, `1 0 . .`, `. . 0 .` and `. . . .` (its solver result is 1, and its unique solution is `1 0 1 0`, `1 0 0 1`, `0 1 0 1`, `0 1 1 0`)
- **WHEN** the test repeats: ask the hint engine for a hint on the board, and write the hint's value into the hint's cell, until a call does not return `kind: 'fill'` or no cell is empty
- **THEN** the repetition ends on a call that returns `kind: 'none'` with the no-rule sentence of FR-25 while at least one cell is still empty (on the current engine: 7 fills, then `none` with 4 empty cells left), so the board never reaches its solution and is not solvable by the three rules alone (its first hint is a fill; the stop comes later)
- **AND** its givens are not equal to the givens of `generate(4, seed)` for any seed from 1 to 20

#### Scenario: A hint is always available on a correct partial board

- **GIVEN** each N in 4, 6 and 8, each seed from 1 to 20, and the puzzle `generate(N, seed)` (a sampled check: two boards per puzzle, not every correct board)
- **WHEN** two boards are built from the givens by writing the solution digit into the empty cells taken in row-major order: board E receives the cells with an even position (0, 2, 4, ...) among the empty cells, board O those with an odd position (1, 3, 5, ...)
- **THEN** each of the two boards that still has an empty cell yields a hint of `kind: 'fill'` whose cell is empty and whose value equals the solution digit of that cell
- **AND** at least one of the 120 boards still has an empty cell (the check is not vacuous)

#### Scenario: Determinism, uniqueness and timing still hold

- **GIVEN** the requirements «Same seed and size give the identical puzzle», «Every generated puzzle has exactly one solution» and the three requirements «Generating a 4×4 puzzle is fast», «Generating a 6×6 puzzle is fast» and «Generating an 8×8 puzzle is fast», with their tests unchanged
- **WHEN** the test suite runs against the rule-solvable generator
- **THEN** all of those tests pass with their bounds unchanged: the same puzzle for the same seed and size, a solver result of 1 (and one solution found by the independent oracle) for each of the 60 puzzles, the slowest generation under 200 ms at N = 4, under 500 ms at N = 6 and under 3 seconds at N = 8
- **AND** no source file under `src/engine/` contains `Math.random`
