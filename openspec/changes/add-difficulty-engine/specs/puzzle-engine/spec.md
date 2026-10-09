## RENAMED Requirements

- FROM: `### Requirement: Every generated puzzle is solvable by the three rules alone`
- TO: `### Requirement: Every generated puzzle is solvable by the techniques of its level`

## MODIFIED Requirements

### Requirement: Generator returns a puzzle of the requested size
The generator SHALL return, for a size N, a seed and a level (an integer from 1 to 4, default 1, FR-81), an N×N puzzle made of givens (0 or 1) and empty cells. With level 1 the puzzle is identical to the one the generator returned before levels existed, for every N and seed (FR-14). The call is `generate(size, seed, level = 1)`; omitting the level and passing `undefined` both mean level 1. The result keeps the shape `{ size, givens, solution }`; the level is not stored in it.

Traces: FR-13, FR-81

#### Scenario: 6×6 puzzle
- **GIVEN** size 6 and seed 42
- **WHEN** the generator runs
- **THEN** the result has 6 rows of 6 cells and every cell is 0, 1 or empty

#### Scenario: Other tested sizes
- **GIVEN** size 4 and size 8, each with seed 1
- **WHEN** the generator runs
- **THEN** the results are 4×4 and 8×8 puzzles whose cells are all 0, 1 or empty

#### Scenario: A level other than 1
- **GIVEN** size 6 with seed 42 and level 3, and separately size 8 with seed 7 and level 4
- **WHEN** the generator runs
- **THEN** the results are 6×6 and 8×8 puzzles whose cells are all 0, 1 or empty, and whose `givens` and `solution` have the same size as the requested N

#### Scenario: The level defaults to 1
- **GIVEN** size 6 and seed 42, once without a level, once with `undefined` as the level and once with level 1
- **WHEN** the generator runs three times
- **THEN** the three results are cell-for-cell identical in `givens` and in `solution`

### Requirement: Same seed and size give the identical puzzle
The generator SHALL produce the identical puzzle for the same seed, the same N and the same level, taking all randomness from a seeded pseudo-random generator. At level 1 the puzzle for any N and seed SHALL be the same, cell for cell, as the puzzle the generator returned before levels existed; this is checked against a golden file of the output of the unchanged generator (the CLI text and the solution) for N = 4, 6 and 8 and seeds 1 to 20, captured before any change of `src/` in this slice (FR-14, FR-85).

Traces: FR-14, FR-83

#### Scenario: Repeated generation
- **GIVEN** size 6 and seed 42
- **WHEN** the generator runs twice
- **THEN** both results are cell-for-cell identical

#### Scenario: Repeated generation at every level
- **GIVEN** each N in 6 and 8, each level from 1 to 4 and seeds 1 to 5
- **WHEN** the generator runs twice for each combination
- **THEN** the two results of each combination are cell-for-cell identical in `givens` and in `solution`

#### Scenario: Seed is the only source of variation
- **GIVEN** size 8 and seed 7 generated in two separate test files or processes
- **WHEN** the results are compared
- **THEN** they are cell-for-cell identical

#### Scenario: Level 1 is byte-identical to the golden file
- **GIVEN** the golden file taken from the unchanged generator for each N in 4, 6, 8 and each seed from 1 to 20 (60 entries; a sampled check of the seed space, not all seeds), each with the CLI stdout text of `npm run --silent cli -- --size N --seed S` and the solution
- **WHEN** the generator runs for each entry without a level, and again with level 1
- **THEN** the givens, rendered as the CLI renders them (one line per row, tokens `0`, `1` or `.` separated by single spaces), equal the golden CLI text exactly in all 60 entries, and the solution equals the golden solution in all 60 entries, for both calls

### Requirement: Every generated puzzle has exactly one solution
The generator SHALL return only puzzles for which the solver reports 1, tested for N = 4 at level 1 and for N = 6 and N = 8 at each level from 1 to 4, over the fixed seed set (seeds 1 to 20 for each combination, see the test conventions): 20 + 160 = 180 puzzles. This holds because every technique of FR-74 to FR-76 is a forced deduction, so a puzzle that the techniques of its level finish has exactly one solution; the tests do not rely on that argument and check the solver result and the independent oracle on every puzzle (FR-15).

Traces: FR-15

#### Scenario: Uniqueness at level 1 for all three sizes
- **GIVEN** each N in 4, 6 and 8 and each seed from 1 to 20
- **WHEN** the puzzle is generated at level 1 and its givens are passed to the solver
- **THEN** the solver reports 1 for each of the 60 puzzles

#### Scenario: Uniqueness at levels 1 to 4 for sizes 6 and 8
- **GIVEN** each N in 6 and 8, each level from 1 to 4 and each seed from 1 to 20
- **WHEN** the puzzle is generated and its givens are passed to the solver and to the independent oracle that counts solutions without the engine's solver
- **THEN** the solver reports 1 and the oracle finds exactly one solution for each of the 160 puzzles, and that solution equals the puzzle's `solution`

### Requirement: Hint explanation names the line type and number
The hint engine SHALL name in each rule explanation the line type («рядок» or «стовпець», in the grammatical case of the sentence) and its 1-based number, matching the line of the target cell. The look-ahead sentence (FR-80) names the target cell by its row and its column instead (FR-22).

Traces: FR-22

#### Scenario: Row hint
- **GIVEN** the row-pair hint derived from row 3 on the board whose only filled cells are 0 at row 3 columns 1 and 2 (target row 3 column 3)
- **WHEN** its sentence is read
- **THEN** it contains «рядку 3» and does not contain «стовп»

#### Scenario: Column hint
- **GIVEN** the column-pair hint derived from column 4 on the board whose only filled cells are 1 at rows 1 and 2 of column 4 (target row 3 column 4)
- **WHEN** its sentence is read
- **THEN** it contains «стовпці 4» and does not contain «рядк»

#### Scenario: Numbering starts at 1 for rows
- **GIVEN** the row-pair hint derived from row 1 on the board whose only filled cells are 0 at row 1 columns 1 and 2 (target row 1 column 3, value 1)
- **WHEN** its sentence is read
- **THEN** the sentence is «Два нулі поспіль у рядку 1, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.» and never contains «рядку 0»

#### Scenario: Numbering starts at 1 for columns
- **GIVEN** the column-sandwich hint derived from column 1 on the board whose only filled cells are 0 at rows 1 and 3 of column 1 (target row 2 column 1, value 1)
- **WHEN** its sentence is read
- **THEN** the sentence is «Між двома нулями у стовпці 1 може стояти лише одиниця, бо три однакові цифри поспіль заборонені.» and never contains «стовпці 0»

#### Scenario: Line-balance and unique-lines sentences name their line
- **GIVEN** the line-balance hint of the row board in «Line balance in a row» (target row 3 column 6) and of the column board in «Line balance in a column» (target row 6 column 2), and the unique-lines hints of the row board in «Unique lines in a row» (target row 2 column 3) and of the column board in «Unique lines in a column» (target row 3 column 2)
- **WHEN** the four sentences are read
- **THEN** the first contains «рядку 3» and no «стовп», the second contains «стовпці 2» and no «рядк», the third starts with «Рядок 2» and the fourth with «Стовпець 2», and each names the target cell's own line first

#### Scenario: The look-ahead sentence names the cell by row and column
- **GIVEN** the look-ahead hint of the board in «Look-ahead of two steps beats an earlier cell of four» (target row 6 column 5)
- **WHEN** its sentence is read
- **THEN** it contains «у рядку 6, стовпці 5»

### Requirement: Hint choice is deterministic
The hint engine SHALL, when several hints apply, choose by this order: rule order pair, then sandwich, then count; within a rule rows before columns; then lower line number; then lower cell position in the line; repeated calls on the same board MUST return the same cell, value and sentence. This is the order of the first three techniques; the order across all four techniques, and the order inside techniques 2 to 4, is pinned in «Hint order and ceiling» (FR-77, A-7), which keeps this order for the first three.

Traces: FR-23

#### Scenario: Repeated calls
- **GIVEN** any board on which at least one hint applies
- **WHEN** a hint is requested twice
- **THEN** both results have the same target cell, value and sentence

#### Scenario: Pair beats sandwich
- **GIVEN** a 6×6 board whose only filled cells are row 1 `1 . 1 . . .` (a sandwich) and row 5 `0 0 . . . .` (a pair)
- **WHEN** a hint is requested
- **THEN** the hint targets row 5 column 3 with value 1 (the pair), although the sandwich is on a lower row

#### Scenario: Sandwich beats count
- **GIVEN** a 6×6 board whose only filled cells are row 1 `0 1 0 . . 0` (a count case) and row 6 `1 . 1 . . .` (a sandwich)
- **WHEN** a hint is requested
- **THEN** the hint targets row 6 column 2 with value 0 (the sandwich)

#### Scenario: Rows before columns
- **GIVEN** a 6×6 board whose only filled cells are 1 at row 4 columns 5 and 6, and 0 at rows 1 and 2 of column 2
- **WHEN** a hint is requested
- **THEN** the hint targets row 4 column 4 with value 0 (the row pair), although the column pair has the lower line number

#### Scenario: Lower line number first
- **GIVEN** a 6×6 board whose only filled cells are row 2 `1 1 . . . .` and row 5 `0 0 . . . .`
- **WHEN** a hint is requested
- **THEN** the hint targets row 2 column 3 with value 0

#### Scenario: Lower cell position first
- **GIVEN** a 6×6 board whose only filled cells are row 3 `. 0 0 . . .`, where both cells beside the pair are empty
- **WHEN** a hint is requested
- **THEN** the hint targets row 3 column 1 with value 1

### Requirement: A hint targets only empty cells
The hint engine SHALL only ever target an empty cell and MUST NOT change a given or an already filled cell, nor modify the board it is given. This holds at every ceiling (FR-77). The requirement is MODIFIED only to extend it to the techniques above level 1 (design: «Modified requirements and why»).

Traces: FR-24

#### Scenario: Filled cell beside a pair is not targeted
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 0 1 . . .`
- **WHEN** a hint is requested without a ceiling (the default ceiling 1)
- **THEN** no cell is targeted and the no-rule sentence is returned

#### Scenario: Filled cell beside a pair is not targeted at ceiling 4
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 0 1 . . .`
- **WHEN** a hint is requested with ceiling 4
- **THEN** the hint targets row 3 column 6 (an empty cell, with value 1, the line-balance fill of FR-74) and does not target row 3 column 3, which holds a 1

#### Scenario: Board is left unchanged
- **GIVEN** a board on which a hint applies, and separately a board on which only a technique above level 1 applies (the row board of «Line balance in a row»), each requested with ceiling 4
- **WHEN** a hint is requested
- **THEN** the board's cells, including givens, are identical before and after the call and the target cell was empty before the call

### Requirement: No-rule hint
The hint engine SHALL, when no technique allowed to the hint applies (FR-77; at ceiling 1, the default: none of the pair, sandwich and count rules; at ceiling 4: none of the four techniques of FR-19 to FR-21 and FR-74 to FR-76) and the board breaks no rule, target no cell and return one Ukrainian sentence saying so: «Жодне з правил зараз не підказує наступного ходу.» The sentence is the same at every ceiling (FR-25, as amended 2026-10-09, autonomy-log row 87: it was «Жодне з трьох правил зараз не підказує наступного ходу.»).

Traces: FR-25

#### Scenario: Sparse board with no deduction
- **GIVEN** a 6×6 board whose only filled cell is 0 at row 1 column 1
- **WHEN** a hint is requested without a ceiling, and again with ceiling 4
- **THEN** no cell is targeted and the sentence is «Жодне з правил зараз не підказує наступного ходу.» and does not contain «трьох»

#### Scenario: Empty board
- **GIVEN** a board of size 4, 6 and 8 with every cell empty
- **WHEN** a hint is requested without a ceiling
- **THEN** no cell is targeted and the same sentence is returned

#### Scenario: Complete valid board
- **GIVEN** the valid full 4×4 grid from the solved scenario
- **WHEN** a hint is requested without a ceiling
- **THEN** no cell is targeted (every technique needs an empty cell) and the same sentence is returned

#### Scenario: A deduction above the ceiling is not offered
- **GIVEN** the 6×6 board whose only filled cells are row 3 `0 0 1 . . .`
- **WHEN** a hint is requested with ceiling 1
- **THEN** no cell is targeted and the same sentence is returned, although ceiling 2 or more would find the fill at row 3 column 6

#### Scenario: A contradiction that needs five forced steps is not offered
- **GIVEN** the board of «A contradiction that needs 5 forced steps is not a deduction»
- **WHEN** a hint is requested with ceiling 4
- **THEN** no cell is targeted and the same sentence is returned

### Requirement: Broken-board hint
The hint engine SHALL, when the board currently breaks a rule, target no cell and return one Ukrainian sentence asking the player to fix the highlighted rule first; this MUST take precedence over the pair, sandwich, count, line-balance, unique-lines, look-ahead and no-rule outcomes at every ceiling. Every hint SHALL be derived from the board as it stands (givens plus the player's entries) and the engine MUST NOT consult the puzzle's solution (A-6).

Traces: FR-26, FR-77

#### Scenario: Three in a row on the board
- **GIVEN** a 6×6 board whose row 1 is `0 0 0 . . .`
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the sentence is «Спершу виправте порушення правил, підсвічене на полі.»

#### Scenario: Broken rule wins over an available hint
- **GIVEN** a 6×6 board whose row 1 is `0 0 0 . . .` and whose row 3 is `1 1 . . . .` (a pair that would otherwise give a hint)
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the broken-rule sentence is returned

#### Scenario: Broken rule wins over a line-balance fill
- **GIVEN** a 6×6 board whose row 1 is `0 0 0 . . .` and whose row 4 is `0 0 1 . . .` (a line-balance fill that would otherwise be available)
- **WHEN** a hint is requested at ceiling 4 and at ceiling 2
- **THEN** both calls target no cell and return the broken-rule sentence

#### Scenario: Digit-count violation
- **GIVEN** a 6×6 board whose row 2 is `1 1 0 1 1 .`
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the broken-rule sentence is returned

#### Scenario: Duplicate complete rows
- **GIVEN** the full 4×4 grid with rows `0 1 1 0`, `0 1 1 0`, `1 0 0 1` and `1 0 0 1`
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the broken-rule sentence is returned

#### Scenario: A legal entry that differs from the solution is followed, not corrected
- **GIVEN** a 4×4 puzzle whose unique solution is the valid full 4×4 grid from the solved scenario, and a board of it whose only filled cells are the player entries 1 at row 1 columns 1 and 2 (both differ from the solution's `0 0` and break no rule)
- **WHEN** a hint is requested
- **THEN** the hint targets row 1 column 3 with value 0 and the sentence is «Дві одиниці поспіль у рядку 1, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.», although the solution holds 1 at that cell

### Requirement: Every generated puzzle is solvable by the techniques of its level
The generator SHALL return only puzzles that can be solved from their givens using nothing but the techniques of their level: starting from the givens and applying the hint engine's fill with the ceiling set to the level L (FR-77) repeatedly, every call returns a fill, every fill agrees with the puzzle's solution, and when no empty cell remains the board equals the puzzle's solution (FR-27, A-5, A-31). Level 1 is the pair, sandwich and count rules (FR-19 to FR-21, in the selection order of FR-23 and A-7); levels 2 to 4 add the techniques of FR-74 to FR-76 in the order of FR-77. Stopping happens because the board is full, not because a call returned the no-rule result (FR-25). "Solvable with the techniques 1 to L" means exactly this walk reaches the solution; it is an operational definition, the same function that the generator uses to carve and to reject (FR-82). The guarantee SHALL be obtained by construction of the generator: a candidate puzzle is accepted only if this check passes on it (A-31). A consequence is that a hint is available on a board whose entries all agree with the solution and that still has an empty cell; at level 1 this follows because the closure of the three rules only grows with the known cells, and at levels 2 to 4 it is verified over a sampled set of boards only (A-31), a failing sample being a reason for an amendment, never for loosening the test. The requirement is verified over the fixed seed set for N = 4 at level 1 and for N = 6 and 8 at levels 1 to 4 (seeds 1 to 20, see the test conventions); for any other seed it holds by construction and is not checked exhaustively (A-31), and it makes no claim for N = 10 to 16. This requirement SHALL NOT change FR-14, FR-15 or the timing bounds NFR-1 to NFR-3 and NFR-16: the generator stays deterministic from the seed (no `Math.random`, no clock), every puzzle keeps exactly one solution, and the bounds are never relaxed.

Traces: FR-27, FR-82

#### Scenario: Repeated fill reaches the solution over the fixed seed set
- **GIVEN** each valid combination of N and level (4 with level 1; 6 and 8 with levels 1 to 4) and each seed from 1 to 20, and the puzzle `generate(N, seed, level)`
- **WHEN** the test copies the givens as a board and repeats: ask the hint engine for a hint with the ceiling set to the puzzle's level on the board, and write the hint's value into the hint's cell, until the board has no empty cell
- **THEN** for each of the 180 puzzles every hint call returned `kind: 'fill'`, never `'none'` and never `'broken'`
- **AND** every filled cell was empty before the call and receives the value that the puzzle's `solution` holds for that cell
- **AND** the number of calls equals the number of empty cells of the givens, and the final board equals the puzzle's `solution`

#### Scenario: A board with a unique solution that the three rules cannot finish is not a level-1 output
- **GIVEN** the 4×4 board with rows `. 0 . 0`, `1 0 . .`, `. . 0 .` and `. . . .` (its solver result is 1, and its unique solution is `1 0 1 0`, `1 0 0 1`, `0 1 0 1`, `0 1 1 0`)
- **WHEN** the test repeats: ask the hint engine for a hint with ceiling 1 on the board, and write the hint's value into the hint's cell, until a call does not return `kind: 'fill'` or no cell is empty
- **THEN** the repetition ends on a call that returns `kind: 'none'` with the no-rule sentence of FR-25 while at least one cell is still empty (on the current engine: 7 fills, then `none` with 4 empty cells left), so the board never reaches its solution with the three rules alone
- **AND** its givens are not equal to the givens of `generate(4, seed)` for any seed from 1 to 20

#### Scenario: A hint is available on a correct partial board
- **GIVEN** each valid combination of N and level and each seed from 1 to 20, and the puzzle `generate(N, seed, level)` (a sampled check: two boards per puzzle, not every correct board)
- **WHEN** two boards are built from the givens by writing the solution digit into the empty cells taken in row-major order: board E receives the cells with an even position (0, 2, 4, ...) among the empty cells, board O those with an odd position (1, 3, 5, ...)
- **THEN** each of the two boards that still has an empty cell yields a hint of `kind: 'fill'` with the ceiling set to the puzzle's level, whose cell is empty and whose value equals the solution digit of that cell
- **AND** the same boards, requested with ceiling 4, also yield a fill on an empty cell with the solution digit
- **AND** at least one of the 360 boards still has an empty cell (the check is not vacuous)

#### Scenario: Determinism, uniqueness and timing still hold
- **GIVEN** the requirements «Same seed and size give the identical puzzle», «Every generated puzzle has exactly one solution» and the requirements «Generating a 4×4 puzzle is fast», «Generating a 6×6 puzzle is fast» and «Generating an 8×8 puzzle is fast»
- **WHEN** the test suite runs against the leveled generator
- **THEN** all of those tests pass with their bounds unchanged: the same puzzle for the same seed, size and level, a solver result of 1 for each puzzle, the slowest generation under 200 ms at N = 4, under 500 ms at N = 6 and under 3 seconds at N = 8
- **AND** no source file under `src/engine/` contains `Math.random`

### Requirement: CLI number grammar
The CLI SHALL accept a `--size`, `--seed` or `--level` value only when the whole value matches `^[0-9]+$` (ASCII digits only); leading zeros are allowed and `06` means 6; any other value, including `6.5`, `+6`, `-2`, `1e1`, `0x6` and an empty value, MUST be rejected as invalid with the error behaviour of FR-30 (size), FR-52 (seed) or FR-86 (level).

Traces: FR-53, FR-85

#### Scenario: Leading zeros are accepted
- **GIVEN** the commands `npm run --silent cli -- --size 06 --seed 7` and `npm run --silent cli -- --size 6 --seed 7`
- **WHEN** each runs
- **THEN** both exit with code 0 and their stdout outputs are identical

#### Scenario: Leading zeros in the seed
- **GIVEN** the commands `npm run --silent cli -- --size 4 --seed 007` and `npm run --silent cli -- --size 4 --seed 7`
- **WHEN** each runs
- **THEN** both exit with code 0 and their stdout outputs are identical

#### Scenario: Leading zeros in the level
- **GIVEN** the commands `npm run --silent cli -- --size 6 --seed 7 --level 03` and `npm run --silent cli -- --size 6 --seed 7 --level 3`
- **WHEN** each runs
- **THEN** both exit with code 0 and their stdout outputs are identical

#### Scenario: Invalid size tokens
- **GIVEN** the size values `6.5`, `+6`, `-2`, `1e1`, `0x6` and the empty value (passed as `--size ""`), each tried in turn
- **WHEN** the CLI runs with each
- **THEN** for each, stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Invalid seed tokens
- **GIVEN** the seed values `6.5`, `+6`, `-2`, `1e1`, `0x6` and the empty value (passed as `--seed ""`), each tried in turn
- **WHEN** the CLI runs with each
- **THEN** for each, stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Invalid level tokens
- **GIVEN** the level values `1.5`, `+2`, `-2`, `1e1`, `0x3` and the empty value (passed as `--level ""`), each tried in turn together with `--size 6`
- **WHEN** the CLI runs with each
- **THEN** for each, stderr holds one English error sentence, the exit code is non-zero and stdout is empty

### Requirement: CLI rejects a missing option value and an unknown option
The CLI SHALL, for an option given without a value (for example `--size` or `--level` as the last argument) or for an unknown option, write a one-sentence English error to stderr and exit with a non-zero code. The options `--size`, `--seed` and `--level` are known (FR-85); any other option is unknown.

Traces: FR-54, FR-85

#### Scenario: Size without a value
- **GIVEN** the command `npm run --silent cli -- --size`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Seed without a value after another option
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Level without a value
- **GIVEN** the command `npm run --silent cli -- --size 6 --level`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Unknown option
- **GIVEN** the command `npm run --silent cli -- --depth 3`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Unknown option next to valid ones
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed 1 --verbose`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: The level option is no longer unknown
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed 1 --level 3`
- **WHEN** it runs
- **THEN** it exits with code 0, prints a 6×6 puzzle to stdout and writes nothing to stderr

### Requirement: Generating a 4×4 puzzle is fast
The generator SHALL produce one 4×4 puzzle at level 1 in under 200 ms, worst case over the fixed seed set (seeds 1 to 20) used for the uniqueness requirement, measured in Vitest on the test machine. Levels 2 to 4 do not exist at N = 4 (FR-81), so no other level is timed.

Traces: NFR-1, NFR-16

#### Scenario: Worst case over the seed set at N = 4
- **GIVEN** seeds 1 to 20, size 4 and level 1
- **WHEN** Vitest times the generation of each puzzle
- **THEN** the slowest generation takes under 200 ms

### Requirement: Generating a 6×6 puzzle is fast
The generator SHALL produce one 6×6 puzzle at any level from 1 to 4 in under 500 ms, worst case over the fixed seed set (seeds 1 to 20) used for the uniqueness requirement, measured per level (NFR-16) in Vitest on the test machine. The bound is not relaxed (A-13, A-36).

Traces: NFR-2, NFR-16

#### Scenario: Worst case over the seed set at N = 6, per level
- **GIVEN** seeds 1 to 20, size 6, and each level from 1 to 4 measured separately
- **WHEN** Vitest times the generation of each puzzle
- **THEN** for each of the four levels the slowest generation takes under 500 ms

### Requirement: Generating an 8×8 puzzle is fast
The generator SHALL produce one 8×8 puzzle at any level from 1 to 4 in under 3 seconds, worst case over the fixed seed set (seeds 1 to 20) used for the uniqueness requirement, measured per level (NFR-16) in Vitest on the test machine. The bound is not relaxed (A-13, A-36).

Traces: NFR-3, NFR-16

#### Scenario: Worst case over the seed set at N = 8, per level
- **GIVEN** seeds 1 to 20, size 8, and each level from 1 to 4 measured separately
- **WHEN** Vitest times the generation of each puzzle
- **THEN** for each of the four levels the slowest generation takes under 3 seconds

### Requirement: Every hint sentence is exactly one sentence
The hint engine SHALL return only sentences that are exactly one sentence: one terminal mark at the end and no other sentence break. This covers the rule explanations, the line-balance, unique-lines and look-ahead sentences (FR-78 to FR-80), the no-rule sentence and the broken-rule sentence, and the same one-sentence definition applies to each CLI error sentence (FR-30, FR-86).

Traces: NFR-4, FR-78, FR-79, FR-80

#### Scenario: Each kind of sentence
- **GIVEN** one sentence of each kind: pair, sandwich, count, line balance, unique lines, look-ahead, no-rule and broken-rule, each for a row and for a column where the kind has both
- **WHEN** the sentence is inspected
- **THEN** it ends with a single terminal mark and contains no earlier full stop, exclamation mark or question mark

#### Scenario: CLI error sentences
- **GIVEN** the CLI error text written to stderr for an odd size, for a size below 4, for a non-numeric size, for a level of 5 and for a level of 2 with size 4
- **WHEN** each is inspected
- **THEN** each is a single line ending with a single terminal mark and contains no earlier full stop, exclamation mark or question mark

#### Scenario: Number words, dashes and reason clauses are not breaks
- **GIVEN** a count sentence such as «У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.», a pair sentence such as «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.» and a look-ahead sentence such as «Якщо поставити 1 у рядку 6, стовпці 5, за кілька кроків порушиться правило, тож тут 0.»
- **WHEN** the sentence is inspected
- **THEN** the dash and the commas, including the one before «бо», the one before «а» and the one after the column number, are not sentence breaks and each sentence counts as one

### Requirement: Hint sentences are Ukrainian
The hint engine SHALL write every hint sentence in Ukrainian: the text contains Cyrillic and no Latin letters (digits are allowed). This covers the sentences of FR-78 to FR-80. CLI errors are English (NFR-8) and are not covered here. Page text belongs to the play-page capability and is out of scope here.

Traces: NFR-5, FR-78, FR-79, FR-80

#### Scenario: Hint sentences
- **GIVEN** the pair, sandwich, count, line-balance, unique-lines, look-ahead, no-rule and broken-rule sentences
- **WHEN** each is inspected
- **THEN** each contains Cyrillic letters and no Latin letters (digits for line numbers, cell coordinates and the digits 0 and 1 are allowed)

### Requirement: CLI errors are English
The CLI SHALL write every error as one English sentence that contains no Cyrillic letters; the exact wording is not pinned (A-22). This includes the level errors and the generator run-out error (FR-86).

Traces: NFR-8, FR-86

#### Scenario: Every kind of CLI error
- **GIVEN** the CLI errors for an odd size, a size above 16, a non-numeric seed, a seed above 2147483647, a `--size` option without a value, an unknown option, a level of 5, a level of 2 with size 4 and a `--level` option without a value
- **WHEN** each stderr text is inspected
- **THEN** each is a single line that contains Latin letters, does not match `/\p{Script=Cyrillic}/u`, and ends with a single terminal mark with no earlier full stop, exclamation mark or question mark

#### Scenario: Wording is not asserted
- **GIVEN** any CLI error
- **WHEN** a test inspects its text
- **THEN** it checks only the language and one-sentence shape above, never specific words

## ADDED Requirements

### Requirement: Line balance hint
The hint engine SHALL, at a ceiling of 2 or more, apply technique 2, line balance (FR-74): when a line holds exactly N/2 − 1 of a digit d and has at least two empty cells, then for an empty cell e of that line suppose e takes d and every other empty cell of the line takes the other digit; if that assignment puts three equal digits side by side anywhere in the line, e cannot be d, and the hint targets e with the other digit. Scan order: rows before columns, lower line first, then lower cell position e, then d = 0 before d = 1 (A-7, FR-77). The sentence (FR-78, provisional wording, to be confirmed in the page slice, Q6) is «У <рядку|стовпці> K є місце лише для <одного нуля|однієї одиниці>, і якщо поставити <його|її> сюди, решта клітинок дасть три однакові цифри поспіль, тож тут <одиниця|нуль>.» with K the 1-based line number, the first alternative of each pair for d = 0 and the second for d = 1. The rule name of the hint is `balance`.

Traces: FR-74, FR-78, NFR-4, NFR-5

#### Scenario: Line balance in a row
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 0 1 . . .` (the row holds 2 = N/2 − 1 zeros and 3 empty cells; only putting the missing zero at column 6 forces `0 0 1 1 1 0`, three ones in a row)
- **WHEN** a hint is requested with ceiling 2
- **THEN** the hint targets row 3 column 6 with value 1, its rule is `balance` and the sentence is «У рядку 3 є місце лише для одного нуля, і якщо поставити його сюди, решта клітинок дасть три однакові цифри поспіль, тож тут одиниця.»
- **AND** the same board with ceiling 1 yields no target and the no-rule sentence

#### Scenario: Line balance in a column
- **GIVEN** a 6×6 board whose only filled cells are column 2 reading top to bottom `1 1 0 . . .` (2 = N/2 − 1 ones; putting the missing one at row 6 forces `1 1 0 0 0 1`, three zeros in a row)
- **WHEN** a hint is requested with ceiling 2
- **THEN** the hint targets row 6 column 2 with value 0, its rule is `balance` and the sentence is «У стовпці 2 є місце лише для однієї одиниці, і якщо поставити її сюди, решта клітинок дасть три однакові цифри поспіль, тож тут нуль.»

#### Scenario: Two cells qualify, the lower position first
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 . . . . 0`, and separately one whose only filled cells are row 3 `1 . . . . 1` (both cells at column 2 and column 5 qualify: a zero at either forces three ones in a row)
- **WHEN** a hint is requested with ceiling 2 for each
- **THEN** the hints target row 3 column 2, with value 1 for the first board and value 0 for the second, and the first sentence is «У рядку 3 є місце лише для одного нуля, і якщо поставити його сюди, решта клітинок дасть три однакові цифри поспіль, тож тут одиниця.»

#### Scenario: The threshold follows N
- **GIVEN** an 8×8 board whose only filled cells are row 1 `0 0 1 0 . . . .` (3 = N/2 − 1 zeros)
- **WHEN** a hint is requested with ceiling 2
- **THEN** the hint targets row 1 column 5 with value 1 and its rule is `balance`

#### Scenario: Rows before columns
- **GIVEN** a 6×6 board whose only filled cells are 1 at rows 1 and 2 of column 6, 0 at row 3 of column 6, and row 5 `0 0 1 . . .` (column 6 alone would give the fill at row 6 column 6 with value 0)
- **WHEN** a hint is requested with ceiling 2
- **THEN** the hint targets row 5 column 6 with value 1 (the row) and not row 6 column 6

#### Scenario: Lower line first
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 0 1 . . .` and row 5 `1 1 0 . . .`
- **WHEN** a hint is requested with ceiling 2
- **THEN** the hint targets row 2 column 6 with value 1

#### Scenario: Near miss, no assignment gives three in a row
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 1 0 . . .` (2 = N/2 − 1 zeros, 3 empty cells, but every way to place the missing zero gives no three in a row)
- **WHEN** a hint is requested with ceiling 4
- **THEN** no cell is targeted and the no-rule sentence is returned

#### Scenario: Near miss, the line holds N/2 − 2 of the digit
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 1 . . . .`
- **WHEN** a hint is requested with ceiling 4
- **THEN** no cell is targeted and the no-rule sentence is returned

### Requirement: Unique lines hint
The hint engine SHALL, at a ceiling of 3 or more, apply technique 3, unique lines (FR-75): when a line has exactly two empty cells and agrees, on every filled cell of the line, with a complete line of the same direction (a line with no empty cell), each of its two empty cells takes the opposite of that complete line's digit in the same position, because otherwise the two lines would be identical; the hint targets the first (lower position) empty cell of the line. Scan order: rows before columns, lower line first; when several complete lines agree, the one with the lower line number is named. The sentence (FR-79, provisional wording, to be confirmed in the page slice, Q6) is «<Рядок|Стовпець> K збігається з повним <рядком|стовпцем> M усюди, крім двох порожніх клітинок, тож тут має бути V, інакше ці <рядки|стовпці> були б однакові.» with K the 1-based number of the target's line, M the 1-based number of the complete line and V the digit 0 or 1. The rule name of the hint is `unique`.

Traces: FR-75, FR-79, NFR-4, NFR-5

#### Scenario: Unique lines in a row
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 1 . . 1 0` and row 5 `0 1 0 1 1 0` (row 5 is complete; row 2 agrees with it on its four filled cells)
- **WHEN** a hint is requested with ceiling 3
- **THEN** the hint targets row 2 column 3 with value 1, its rule is `unique` and the sentence is «Рядок 2 збігається з повним рядком 5 усюди, крім двох порожніх клітинок, тож тут має бути 1, інакше ці рядки були б однакові.»
- **AND** the same board with ceiling 2 yields no target and the no-rule sentence
- **AND** after the hint's value is written, the next hint with ceiling 3 targets row 2 column 4 with value 0, with the pair rule (row 2 now reads `0 1 1 . 1 0`; the count rule would give the same cell and value)

#### Scenario: Unique lines in a column
- **GIVEN** a 6×6 board whose only filled cells are column 2 reading top to bottom `0 1 . . 1 0` and column 5 reading `0 1 0 1 1 0`
- **WHEN** a hint is requested with ceiling 3
- **THEN** the hint targets row 3 column 2 with value 1, its rule is `unique` and the sentence is «Стовпець 2 збігається з повним стовпцем 5 усюди, крім двох порожніх клітинок, тож тут має бути 1, інакше ці стовпці були б однакові.»

#### Scenario: Near miss, the complete line differs on a filled cell
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 1 . . 1 0` and the complete row 5 `1 1 0 0 1 0` (it differs from row 2 on column 1)
- **WHEN** a hint is requested with ceiling 3
- **THEN** no cell is targeted and the no-rule sentence is returned

#### Scenario: Near miss, the other line is not complete
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 1 . . 1 0` and row 5 `0 1 . . 1 0`
- **WHEN** a hint is requested with ceiling 3
- **THEN** no cell is targeted and the no-rule sentence is returned

### Requirement: Look-ahead hint
The hint engine SHALL, at a ceiling of 4, apply technique 4, look-ahead (FR-76): for an empty cell and a value v, place v on a copy of the board and apply techniques 1 to 3 repeatedly in the order of FR-77, each application filling one forced cell (a step), for **at most 4 steps**; if after 0 to 4 steps `findViolations` reports at least one violation (FR-1 to FR-6), the cell cannot hold v and the hint targets it with the other value. A contradiction that needs 5 or more steps is not a technique-4 deduction, and a line that merely can no longer be completed, without a reported violation, is not a contradiction (A-37). Among all such cells and values the hint uses the one with the fewest steps, then the lower row, then the lower column, then v = 0 before v = 1. The hint also carries `steps`, the number of steps of the contradiction. The sentence (FR-80, provisional wording, to be confirmed in the page slice, Q6) is «Якщо поставити W у рядку R, стовпці C, за кілька кроків порушиться правило, тож тут V.» with R and C the 1-based row and column of the target, W the refuted value and V the hint's value. The rule name of the hint is `lookahead`.

Traces: FR-76, FR-80, NFR-4, NFR-5

#### Scenario: Look-ahead of two steps beats an earlier cell of four
- **GIVEN** the 6×6 board with rows `. 1 . . . .`, `. . 0 . . 0`, `0 0 1 0 1 1`, `. . . . 0 .`, `1 . . . . 0` and `0 . 1 . . 1` (techniques 1 to 3 find nothing, so ceiling 3 yields no target)
- **WHEN** a hint is requested with ceiling 4
- **THEN** the hint targets row 6 column 5 with value 0, its rule is `lookahead`, its `steps` is 2 and the sentence is «Якщо поставити 1 у рядку 6, стовпці 5, за кілька кроків порушиться правило, тож тут 0.»
- **AND** the chain is: put 1 at row 6 column 5; the pair rule fills row 6 column 4 with 0; the count rule fills row 6 column 2 with 0; rows 3 and 6 are now both `0 0 1 0 1 1`, a duplicate-row violation
- **AND** the cell at row 5 column 5 (earlier in row-major order) is not chosen: putting 0 there needs 4 steps

#### Scenario: A contradiction at exactly 4 steps is found
- **GIVEN** the 6×6 board with rows `. . . . 1 .`, `. 0 1 1 0 .`, `. 1 . . . .`, `0 1 . . 1 .`, `. 0 . 1 0 .` and `. . . . . 1` (techniques 1 to 3 find nothing)
- **WHEN** a hint is requested with ceiling 4
- **THEN** the hint targets row 6 column 1 with value 0, its rule is `lookahead`, its `steps` is 4 and the sentence is «Якщо поставити 1 у рядку 6, стовпці 1, за кілька кроків порушиться правило, тож тут 0.»
- **AND** the chain is: put 1 at row 6 column 1; line balance fills row 6 column 2 with 0; the count rule fills row 1 column 2 with 1; line balance fills row 6 column 5 with 0; the count rule fills row 3 column 5 with 1; columns 2 and 5 are now equal, a duplicate-column violation

#### Scenario: A contradiction that needs 5 forced steps is not a deduction
- **GIVEN** the 6×6 board with rows `. 0 1 . . .`, `1 . . 1 . .`, `. . . . . 0`, `0 1 . . 1 .`, `. . . . . .` and `. . . . 0 .` (techniques 1 to 3 find nothing; putting 1 at row 1 column 4 leads, by the pair rule at row 1 column 5 with 0, the pair rule at row 3 column 4 with 0, the sandwich rule at row 3 column 5 with 1, the pair rule at row 2 column 5 with 0 and the pair rule at row 5 column 5 with 0, to a digit-count violation in column 5 only after the fifth step)
- **WHEN** a hint is requested with ceiling 4
- **THEN** no cell is targeted and the no-rule sentence is returned
- **AND** the solver reports 0 for the same board with 1 at row 1 column 4 (the refutation is true, but it needs five steps, so it is not a technique-4 deduction) and 2 for the board itself

#### Scenario: Propagation that stalls without a violation is not a contradiction
- **GIVEN** a 6×6 board whose only filled cell is 0 at row 1 column 1, and an 8×8 board with every cell empty
- **WHEN** a hint is requested with ceiling 4
- **THEN** no cell is targeted and the no-rule sentence is returned, because for every cell and value the propagation of techniques 1 to 3 stops with no further fill and no reported violation (A-37)

#### Scenario: Equal steps, the lower row first
- **GIVEN** the 6×6 board with rows `. 0 1 . . 1`, `1 . . 1 . 0`, `. . . . . 1`, `. 1 0 . . 0`, `1 . . 1 . 0` and `. . . . . 1` (techniques 1 to 3 find nothing; putting 0 at row 5 column 3 and putting 1 at row 6 column 3 both end in a violation after 3 steps)
- **WHEN** a hint is requested with ceiling 4
- **THEN** the hint targets row 5 column 3 with value 1, its `steps` is 3 and the sentence is «Якщо поставити 0 у рядку 5, стовпці 3, за кілька кроків порушиться правило, тож тут 1.»
- **AND** the chain is: put 0 at row 5 column 3; the pair rule fills row 3 column 3 with 1; the pair rule fills row 6 column 3 with 1; the sandwich rule fills row 2 column 3 with 0; columns 3 and 6 are now equal, a duplicate-column violation

#### Scenario: Look-ahead is off below ceiling 4
- **GIVEN** the board of «Look-ahead of two steps beats an earlier cell of four»
- **WHEN** a hint is requested with ceiling 3
- **THEN** no cell is targeted and the no-rule sentence is returned

### Requirement: Hint order and ceiling
The hint engine SHALL take the board and a ceiling, `hint(board, ceiling = 1)`, where the ceiling is an integer from 1 to 4 and techniques 1 to ceiling are allowed: 1 pair, sandwich and count; 2 line balance (FR-74); 3 unique lines (FR-75); 4 look-ahead (FR-76). It SHALL pick the lowest technique that applies: pair, sandwich, count (A-7), then line balance, then unique lines, then look-ahead; within a technique the A-7 tie-breaks (rows before columns, lower line, lower cell) and the tie-breaks pinned in FR-74 to FR-76; selection stays deterministic (FR-23). A broken board is reported before any technique (FR-26). The default ceiling is 1, today's three basic rules (decided by the user, autonomy-log row 88: option B), so every existing caller keeps its behaviour. The page asks for ceiling 4 (FR-77: the page uses all four techniques whatever the board's level); that page clause is delivered and verified by the play-page change `add-level-selector` (DL2), not here. The generator and the level checks call it with the ceiling L of the puzzle in question. The `rule` of a fill is one of `pair`, `sandwich`, `count`, `balance`, `unique`, `lookahead`. A ceiling outside 1 to 4 is a malformed call, not specified here.

Traces: FR-77, FR-23

#### Scenario: The default ceiling is 1
- **GIVEN** the row board of «Line balance in a row», the row board of «Unique lines in a row» and the board of «Look-ahead of two steps beats an earlier cell of four», and the boards of «Pair hint» and «Count hint»
- **WHEN** a hint is requested on each without a ceiling, with ceiling 1 and with ceiling 4
- **THEN** for each board the results without a ceiling and with ceiling 1 are identical; for the first three boards they are the no-rule result, while ceiling 4 gives the fills with rules `balance`, `unique` and `lookahead`; for the pair and count boards all three results are identical

#### Scenario: Each ceiling allows exactly its techniques
- **GIVEN** the three boards of the previous scenario
- **WHEN** a hint is requested with ceilings 1, 2, 3 and 4 on each
- **THEN** the line-balance board yields no target at ceiling 1 and the balance fill at ceilings 2, 3 and 4; the unique-lines board yields no target at ceilings 1 and 2 and the unique fill at ceilings 3 and 4; the look-ahead board yields no target at ceilings 1, 2 and 3 and the look-ahead fill at ceiling 4

#### Scenario: A lower technique wins over a higher one on a lower line
- **GIVEN** the 6×6 board with rows `. . . . . .`, `0 1 . . 1 0`, `. . . . . .`, `. . . . . .`, `0 1 0 1 1 0` and `1 . . . . 1` (unique lines applies at row 2; line balance applies at row 6)
- **WHEN** a hint is requested with ceiling 3 and with ceiling 4
- **THEN** both hints target row 6 column 2 with value 0 and their rule is `balance`, although the unique-lines fill at row 2 column 3 is on a lower line
- **AND** the same board without row 6 yields the unique-lines fill at row 2 column 3 with value 1 at ceiling 3

#### Scenario: The first three techniques keep their order
- **GIVEN** the 6×6 board whose only filled cells are row 3 `0 0 . . . .` (a pair)
- **WHEN** a hint is requested with ceiling 4, its value is written, and a hint is requested again with ceiling 4
- **THEN** the first hint is the pair fill at row 3 column 3 with value 1 and the second is the line-balance fill at row 3 column 6 with value 1

#### Scenario: Repeated calls at every ceiling
- **GIVEN** the three boards of the first scenario and each ceiling from 1 to 4
- **WHEN** a hint is requested twice for each combination
- **THEN** both results of each combination have the same kind, cell, value, rule and sentence

### Requirement: The level is an integer from 1 to 4
The generator SHALL accept as the level an integer from 1 to 4, default 1, and reject anything else (0, 5, 2.5, -1, NaN, Infinity, a string, `null`) with an error and return no puzzle (FR-81). A level above 1 with N = 4 SHALL be rejected the same way (A-34); N = 6 and N = 8 accept all four levels. The checks run in this order: the types, the size (FR-16, FR-17, FR-49, FR-50), the seed (FR-51), the level, then the size and level together; so an invalid size or seed is reported as before even when the level is also invalid. The level errors are an `InvalidLevelError` whose message is one English sentence.

Traces: FR-81, FR-13

#### Scenario: All four levels at the sizes that offer them
- **GIVEN** size 6 and size 8, each with seed 1 and each level from 1 to 4
- **WHEN** the generator runs for the eight combinations
- **THEN** each returns an N×N puzzle

#### Scenario: Levels above 1 at size 4
- **GIVEN** size 4, seed 1 and each of the levels 2, 3 and 4
- **WHEN** the generator runs
- **THEN** each raises an `InvalidLevelError` and returns no puzzle

#### Scenario: Level 1 at size 4
- **GIVEN** size 4, seed 1 and level 1
- **WHEN** the generator runs
- **THEN** a 4×4 puzzle is returned

#### Scenario: Levels outside 1 to 4 and values that are not integers
- **GIVEN** size 6, seed 1 and, in turn, the levels 0, 5, -1, 2.5, NaN, Infinity, `'2'` (a string) and `null`
- **WHEN** the generator runs
- **THEN** each raises an `InvalidLevelError` and returns no puzzle

#### Scenario: Size and seed errors come first
- **GIVEN** size 5 with level 9, and separately size 6 with seed -1 and level 9
- **WHEN** the generator runs
- **THEN** the first raises the same error as size 5 alone (`InvalidSizeError`) and the second the same error as seed -1 alone (`InvalidSeedError`)

### Requirement: A level-L puzzle is exactly level L
The generator SHALL return, for a level L from 1 to 4, a puzzle that is solvable with techniques 1 to L (FR-27) and is not solvable with techniques 1 to L − 1; for L = 1 only the first half applies (FR-82). "Solvable with techniques 1 to c" means the walk of «Every generated puzzle is solvable by the techniques of its level» with the ceiling set to c reaches the solution. The generator SHALL use the same walk to decide, so the level is exact by construction (A-31), and it SHALL NOT accept a puzzle that fails either half.

Traces: FR-82

#### Scenario: Exact level over the fixed seed set
- **GIVEN** each N in 6 and 8, each level L from 1 to 4 and each seed from 1 to 20 (160 puzzles)
- **WHEN** the test walks the givens with a hint ceiling of L, and for L of 2 or more also with a ceiling of L − 1
- **THEN** the walk with ceiling L reaches the solution in every one of the 160 puzzles
- **AND** for each of the 120 puzzles with L from 2 to 4 the walk with ceiling L − 1 ends on a call that returns `kind: 'none'` while at least one cell is empty, and never returns `'broken'`

### Requirement: The solution does not depend on the level
The generator SHALL produce, for an N and a seed, the same solution at every level: the fill phase takes no part of its input from the level and consumes the same random draws (FR-83). A retry in the search for a puzzle of the level reshuffles the order of the removals from the continued random stream of the same seed, and never fills a new grid; no `Math.random` is used (TC-8). The puzzle is deterministic from N, seed and level (FR-14).

Traces: FR-83, FR-14

#### Scenario: One solution for four levels
- **GIVEN** each N in 6 and 8 and each seed from 1 to 20
- **WHEN** the puzzle is generated at levels 1, 2, 3 and 4
- **THEN** the four `solution` grids are cell-for-cell identical, and the level-1 solution equals the golden solution (see «Same seed and size give the identical puzzle»)

#### Scenario: A retry does not change the solution
- **GIVEN** a combination of N in 6 and 8, a level from 2 to 4 and a seed from 1 to 200 that the test finds to need more than one attempt (the internal builder with a limit of 1 attempt raises the run-out error for it); the test fails loudly, naming this premise, if the search finds none
- **WHEN** the puzzle is generated with the normal limit
- **THEN** its `solution` equals the solution of the level-1 puzzle of the same N and seed

#### Scenario: The engine stays free of Math.random
- **GIVEN** the sources under `src/engine/`
- **WHEN** they are scanned for `Math.random`
- **THEN** none contains it

### Requirement: Generation makes at most 30 attempts
The generator SHALL make at most 30 attempts to build a puzzle of the requested level, where an attempt is one shuffle of the removal order from the continued random stream, one carving pass and one level test (A-35). If all attempts fail, the generator SHALL throw a `GenerationRunOutError`, distinct from every validation error, whose message is one English sentence, and SHALL return no puzzle: it never returns a puzzle of the wrong level and never loosens the level test (FR-84). Over the fixed seed set, for every valid combination of N and level, the run-out error SHALL NOT occur (0 run-outs in 180 generations). Raising the bound of 30 needs a signed change. Level 1 accepts the first attempt without a level test, so it never runs out.

Traces: FR-84

#### Scenario: No run-out over the fixed seed set
- **GIVEN** each valid combination of N and level (4 with level 1; 6 and 8 with levels 1 to 4) and each seed from 1 to 20
- **WHEN** the generator runs for the 180 combinations
- **THEN** none raises a `GenerationRunOutError`, and the attempt bound `MAX_ATTEMPTS` exported by the generator module (not by `index.ts`) equals 30; `generate` takes this bound and no other

#### Scenario: Running out raises the distinct error
- **GIVEN** the internal builder `buildPuzzle(size, seed, level, maxAttempts)` with a limit of 1 attempt, and a combination of N in 6 and 8, a level from 2 to 4 and a seed from 1 to 200 that needs more than one attempt (the test searches; it fails loudly, naming this premise, if none is found)
- **WHEN** the builder runs for that combination with the limit of 1
- **THEN** it raises a `GenerationRunOutError`, which is not an `InvalidLevelError`, `InvalidSizeError` or `InvalidSeedError`, and returns no puzzle
- **AND** the builder with the limit of 30 for the same combination returns a puzzle that is exactly its level (solvable with that ceiling, not with the ceiling below)

### Requirement: CLI prints the puzzle of a level
The CLI (`npm run cli -- --size <N> --seed <integer> --level <1 to 4>`) SHALL print the puzzle of that size, seed and level in the same shape as FR-28 (N lines of N space-separated tokens, `0` or `1` for givens and `.` for empty cells). Without `--level` the level is 1 and the output is byte-identical to the output before levels existed. The value follows the digits-only grammar of FR-53 (FR-85). The options may be given in any order.

Traces: FR-85, FR-28, FR-14

#### Scenario: Size 6 seed 42 level 3
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed 42 --level 3`
- **WHEN** it runs
- **THEN** it exits with code 0, stdout is exactly 6 newline-terminated lines each with 6 tokens separated by single spaces and each token being `0`, `1` or `.`, and stderr is empty
- **AND** the printed tokens equal the givens of `generate(6, 42, 3)` cell for cell, with `.` standing for an empty cell

#### Scenario: No level means level 1, byte for byte
- **GIVEN** the command `npm run --silent cli -- --size N --seed S` for each N in 4, 6, 8 and each seed from 1 to 20 (60 pairs), and the command `npm run --silent cli -- --size N --seed S --level 1` for the sampled seeds 1, 10 and 20 of each N (9 pairs; the engine call with level 1 is checked for all 60 pairs in «Same seed and size give the identical puzzle»)
- **WHEN** each runs
- **THEN** each stdout text equals the CLI text stored in the golden file for that N and seed, byte for byte, and the exit code is 0

#### Scenario: Option order does not matter
- **GIVEN** the commands `npm run --silent cli -- --level 2 --seed 9 --size 6` and `npm run --silent cli -- --size 6 --seed 9 --level 2`
- **WHEN** each runs
- **THEN** both exit with code 0 and their stdout outputs are identical

#### Scenario: Same arguments, same output
- **GIVEN** the command `npm run --silent cli -- --size 8 --seed 3 --level 4`
- **WHEN** it runs twice
- **THEN** the two stdout outputs are identical

### Requirement: CLI rejects an invalid level and reports a run-out
The CLI SHALL, for a level that is not 1 to 4 (including `0`, `5`, `1.5`, an empty value and a missing value), for a level above 1 together with `--size 4`, and for a generator run-out (FR-84), write a one-sentence English error to stderr, exit with a non-zero code, and write nothing to stdout (FR-86, NFR-8).

Traces: FR-86, FR-84, NFR-8

#### Scenario: Level out of range
- **GIVEN** the commands `npm run --silent cli -- --size 6 --level 0` and `npm run --silent cli -- --size 6 --level 5`
- **WHEN** each runs
- **THEN** for each, stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Level that breaks the grammar or is missing
- **GIVEN** the commands `npm run --silent cli -- --size 6 --level 1.5`, `npm run --silent cli -- --size 6 --level ""`, `npm run --silent cli -- --size 6 --level abc` and `npm run --silent cli -- --size 6 --level`
- **WHEN** each runs
- **THEN** for each, stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: A level above 1 at size 4
- **GIVEN** the commands `npm run --silent cli -- --size 4 --level 2` and `npm run --silent cli -- --size 4 --level 4`
- **WHEN** each runs
- **THEN** for each, stderr holds one English error sentence, the exit code is non-zero and stdout is empty
- **AND** `npm run --silent cli -- --size 4 --level 1` exits with code 0 and prints a 4×4 puzzle

#### Scenario: A generator run-out
- **GIVEN** the CLI module run in the test process with a mocked engine whose `generate` throws a `GenerationRunOutError`, and the arguments `--size 6 --level 4`
- **WHEN** the CLI runs
- **THEN** one English sentence without Cyrillic letters is written to stderr, the exit code is set to 1 and nothing is written to stdout

### Requirement: Generating at any level is fast
The generator SHALL meet the bounds of NFR-1 to NFR-3 for every valid combination of N and level, each measured separately: (4, 1) under 200 ms, (6, 1) to (6, 4) under 500 ms each, (8, 1) to (8, 4) under 3 s each, worst case over the fixed seed set (seeds 1 to 20), on the test machine (NFR-16). The bounds are never relaxed (A-13, A-36). The measured worst case per combination, and its share of the bound, is recorded in `docs/qa/`; a share above 50% stops the slice (A-36, tasks 0.3 and 2.10). The 50% margin is a manual review gate on the recorded table, not a traced test; the test checks the bounds.

Traces: NFR-16, NFR-1, NFR-2, NFR-3

#### Scenario: Nine combinations, each under its bound
- **GIVEN** the nine valid combinations of N and level, seeds 1 to 20, one warm-up call per combination
- **WHEN** Vitest times the generation of each puzzle
- **THEN** the slowest generation of each combination is under the bound of its N, and the test names the combination and the seed that was slowest when it fails


### Requirement: One hint is fast
The hint engine SHALL compute one hint at any ceiling in under 100 ms, worst case over a fixed set of boards, because look-ahead runs on the player's click (NFR-17). The set is: the empty boards of size 4, 6 and 8; the givens of every puzzle `generate(N, seed, level)` over the 180 combinations of the fixed seed set; the two partial boards E and O of each of those puzzles (the construction of «A hint is available on a correct partial board»); the boards of the look-ahead scenarios of this specification; and the two 8×8 boards that are stalled at ceiling 4, pinned in «The worst-case boards are in the set». The generated and partial boards finish early, because a simple technique always fires; the stalled 8×8 boards are the declared worst case, where every empty cell is tried with both values and nothing is found. Each board is timed with the ceilings 1 to 4 after a warm-up.

Traces: NFR-17, FR-76, FR-77

#### Scenario: Worst case over the set
- **GIVEN** the fixed set of boards defined above
- **WHEN** Vitest times `hint(board, ceiling)` for each board and each ceiling from 1 to 4
- **THEN** the slowest call is under 100 ms, and the test names the board and the ceiling that were slowest when it fails

#### Scenario: The worst-case boards are in the set
- **GIVEN** the 8×8 board A with rows `. . . . . . . 1`, `. . . . 0 . 1 .`, `0 . 1 0 . . . .`, `. . . 1 . . . .`, `. . . . . . . .`, `. . . . . 0 1 .`, `1 0 . . . . . 1`, `. 1 . . . 1 . .` and the 8×8 board B with rows `. . . . . . . .`, `0 . . 0 . . 1 .`, `. . . 1 0 1 0 1`, `. . . . 1 . . .`, `. . . . . 0 . .`, `. . . . 0 . 1 .`, `0 . . 0 1 . . .`, `. 1 . . . . 0 .`
- **WHEN** a hint is requested for each with ceiling 3 and with ceiling 4
- **THEN** all four calls return no target and the no-rule sentence, so a call at ceiling 4 has tried every empty cell with both values; both boards are part of the timed set

#### Scenario: The set exercises look-ahead
- **GIVEN** the same set at ceiling 4
- **WHEN** the results are counted
- **THEN** at least the boards of the look-ahead scenarios return a `lookahead` fill and the board of «A contradiction that needs 5 forced steps is not a deduction» and the two 8×8 boards above return the no-rule result, so the timing covers the full scan of every cell (the check is not vacuous)
