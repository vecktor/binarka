# puzzle-engine Specification

## Purpose

The puzzle engine is the pure TypeScript core of Бінарка (a Takuzu 0/1 puzzle): a rule checker, a solution counter, a seeded puzzle generator and a hint engine, all in `src/engine/`, plus the command-line printer `src/cli.ts` run through `tsx`. Grid size N is always a parameter (even, minimum 4; tested at 4, 6 and 8) and every puzzle is reproducible from a seed. The page (`src/main.ts`, `src/ui/`) uses this same engine but its behaviour belongs to the separate play-page capability.

Conventions: a "line" is a row or a column; rows and columns are numbered from 1 in all user-facing text and in the scenarios below; a cell is empty, 0 or 1; "givens" are the cells filled by the generator. Boards in scenarios are written one row per line, cells separated by spaces, `.` for an empty cell. Unless a scenario states a size, the board is 6×6 and every cell not listed is empty.

Pinned test conventions:

- **Solver result.** The solver returns a number that is 0, 1 or 2, where 2 stands for "2 or more"; a value above 2 is never returned. Scenarios write the value 2 as "2 or more".
- **Fixed seed set.** The "fixed seed set" used by FR-15 and NFR-1 to NFR-3 is the integer seeds 1 to 20 inclusive, used for each of N = 4, 6 and 8 (20 seeds per size).
- **Engine interface (spec-made contract).** `generate(size: number, seed: number): Puzzle`, where `Puzzle` has `size`, `givens` (an N×N grid of 0, 1 or null) and `solution` (an N×N grid of 0 and 1). `hint(board)` takes a board shaped like `givens` and returns either `{ kind: 'fill', row, col, value, rule, sentence }` or `{ kind: 'none' | 'broken', sentence }`; `rule` is 'pair', 'sandwich' or 'count'. `row` and `col` are 0-based indices, while sentences number lines from 1; rule-checker violations also use 0-based indices. Scenarios below write 1-based numbers, so scenario row 3 column 3 is `row` 2, `col` 2 in the interface. The play-page capability refers to this contract; the change design may rename these names only together with this spec.
- **CLI invocation.** Tests call the CLI as `npm run --silent cli -- <arguments>` (npm's own banner lines are suppressed; this runs the same `tsx src/cli.ts <arguments>`), and "no arguments" means `npm run --silent cli`. "Prints" means stdout unless a scenario says stderr. On success the CLI writes the puzzle to stdout and nothing to stderr; on an error it writes the error sentence to stderr and nothing to stdout.
## Requirements
### Requirement: Three equal digits in a row are flagged
The rule checker SHALL flag three or more equal digits side by side in a row and report the row number and the cells involved.

Traces: FR-1

#### Scenario: Run of three ones in a row
- **GIVEN** a 6×6 board whose row 1 is `0 1 1 1 0 .`
- **WHEN** the rule checker runs
- **THEN** it reports a three-in-a-row violation for row 1 whose cells are the ones at columns 2, 3 and 4

#### Scenario: Longer run is flagged with all its cells
- **GIVEN** a 6×6 board whose row 2 is `0 0 0 0 1 .`
- **WHEN** the rule checker runs
- **THEN** it reports a three-in-a-row violation for row 2 whose cells are exactly the ones at columns 1, 2, 3 and 4 (not column 5)

#### Scenario: Two equal digits are not a violation
- **GIVEN** a 6×6 board whose row 3 is `0 0 1 . . .` and whose other cells are empty
- **WHEN** the rule checker runs
- **THEN** no three-in-a-row violation is reported for row 3

#### Scenario: Equal digits separated by another digit are not a run
- **GIVEN** a 6×6 board whose row 4 is `1 1 0 1 1 .`
- **WHEN** the rule checker runs
- **THEN** no three-in-a-row violation is reported for row 4

### Requirement: Three equal digits in a column are flagged
The rule checker SHALL flag three or more equal digits side by side in a column and report the column number and the cells involved.

Traces: FR-2

#### Scenario: Run of three zeros in a column
- **GIVEN** a 6×6 board with 0 at rows 2, 3 and 4 of column 3 and all other cells empty
- **WHEN** the rule checker runs
- **THEN** it reports a three-in-a-row violation for column 3 whose cells are the ones at rows 2, 3 and 4

#### Scenario: Two equal digits in a column are not a violation
- **GIVEN** a 6×6 board with 1 at rows 1 and 2 of column 5 and all other cells empty
- **WHEN** the rule checker runs
- **THEN** no violation is reported

### Requirement: A row with too many of one digit is flagged
The rule checker SHALL flag a row as soon as it holds more than N/2 zeros or more than N/2 ones, and report the row number; a row with at most N/2 of each digit MUST NOT be flagged even if it is incomplete.

Traces: FR-3

#### Scenario: Four ones in a 6-wide row
- **GIVEN** a 6×6 board whose row 1 is `1 1 0 1 1 .`
- **WHEN** the rule checker runs
- **THEN** it reports a digit-count violation for row 1

#### Scenario: Exactly N/2 of a digit in an incomplete row is allowed
- **GIVEN** a 6×6 board whose row 2 is `1 0 1 0 1 .`
- **WHEN** the rule checker runs
- **THEN** no digit-count violation is reported for row 2

#### Scenario: Threshold follows N
- **GIVEN** an 8×8 board whose row 1 holds five zeros and no three side by side, such as `0 0 1 0 0 1 0 .`
- **WHEN** the rule checker runs
- **THEN** it reports a digit-count violation for row 1, while the row `0 0 1 0 0 1 1 .` (four zeros, three ones) reports none

### Requirement: A column with too many of one digit is flagged
The rule checker SHALL flag a column as soon as it holds more than N/2 zeros or more than N/2 ones, and report the column number; a column with at most N/2 of each digit MUST NOT be flagged even if it is incomplete.

Traces: FR-4

#### Scenario: Four zeros in a 6-high column
- **GIVEN** a 6×6 board whose column 2 reads top to bottom `0 0 1 0 0 .`
- **WHEN** the rule checker runs
- **THEN** it reports a digit-count violation for column 2

#### Scenario: Exactly N/2 of a digit in an incomplete column is allowed
- **GIVEN** a 6×6 board whose column 4 reads top to bottom `0 1 0 1 0 .`
- **WHEN** the rule checker runs
- **THEN** no digit-count violation is reported for column 4

### Requirement: Identical complete rows are flagged
The rule checker SHALL flag two rows that are both complete and identical and report both row numbers; a row with any empty cell MUST NOT be compared.

Traces: FR-5

#### Scenario: Two identical complete rows
- **GIVEN** a 4×4 board whose rows 1 and 3 are both `0 1 1 0`
- **WHEN** the rule checker runs
- **THEN** it reports a duplicate-row violation naming rows 1 and 3

#### Scenario: An incomplete row is never compared
- **GIVEN** a 4×4 board whose row 1 is `0 1 1 0` and whose row 3 is `0 1 1 .`
- **WHEN** the rule checker runs
- **THEN** no duplicate-row violation is reported

### Requirement: Identical complete columns are flagged
The rule checker SHALL flag two columns that are both complete and identical and report both column numbers; a column with any empty cell MUST NOT be compared.

Traces: FR-6

#### Scenario: Two identical complete columns
- **GIVEN** a 4×4 board whose columns 2 and 4 both read top to bottom `1 0 0 1`
- **WHEN** the rule checker runs
- **THEN** it reports a duplicate-column violation naming columns 2 and 4

#### Scenario: An incomplete column is never compared
- **GIVEN** a 4×4 board whose column 2 reads `1 0 0 1` and whose column 4 reads `1 0 0 .`
- **WHEN** the rule checker runs
- **THEN** no duplicate-column violation is reported

### Requirement: Empty cells never cause violations
The rule checker SHALL treat an empty cell as no digit, so that a partially filled board that breaks none of the three rules yields no violations.

Traces: FR-7

#### Scenario: Sparse partial board
- **GIVEN** a 4×4 board whose only filled cells are a 0 at row 1 column 1, a 1 at row 2 column 2 and a 1 at row 4 column 4
- **WHEN** the rule checker runs
- **THEN** it returns an empty list of violations

#### Scenario: Empty board
- **GIVEN** a board of any tested size (4, 6 or 8) with every cell empty
- **WHEN** the rule checker runs
- **THEN** it returns an empty list of violations

### Requirement: A correct full grid is recognised as solved
The engine SHALL recognise as solved a grid with every cell filled and no violation.

Traces: FR-8

#### Scenario: Valid full 4×4 grid
- **GIVEN** the 4×4 grid with rows `0 0 1 1`, `1 1 0 0`, `0 1 1 0` and `1 0 0 1`
- **WHEN** the solved check runs
- **THEN** the grid is recognised as solved

### Requirement: Incomplete or rule-breaking grids are not recognised as solved
The engine SHALL NOT recognise as solved a grid that has any empty cell or any violation.

Traces: FR-9

#### Scenario: One empty cell
- **GIVEN** the valid full 4×4 grid from the solved scenario with the cell at row 4 column 4 emptied
- **WHEN** the solved check runs
- **THEN** the grid is not recognised as solved

#### Scenario: Full grid with a violation
- **GIVEN** the full 4×4 grid with rows `0 1 1 0`, `0 1 1 0`, `1 0 0 1` and `1 0 0 1`
- **WHEN** the solved check runs
- **THEN** the grid is not recognised as solved

### Requirement: Solver reports zero solutions
The solver SHALL report 0 when a partially filled grid has no valid completion.

Traces: FR-10

#### Scenario: Board that already breaks a rule
- **GIVEN** a 4×4 board whose row 1 is `0 0 0 .`
- **WHEN** the solver counts solutions
- **THEN** it reports 0

#### Scenario: Board with no rule violation yet and no completion
- **GIVEN** a 4×4 board whose row 1 is `0 0 . .` and whose row 2 is `0 0 . .`
- **WHEN** the solver counts solutions
- **THEN** it reports 0 because rows 1 and 2 would both be forced to `0 0 1 1`, which makes them identical

### Requirement: Solver reports exactly one solution
The solver SHALL report 1 when a partially filled grid has exactly one valid completion.

Traces: FR-11

#### Scenario: Single empty cell with a forced value
- **GIVEN** the valid full 4×4 grid from the solved scenario with the cell at row 4 column 4 emptied
- **WHEN** the solver counts solutions
- **THEN** it reports 1

#### Scenario: Already complete valid grid
- **GIVEN** the valid full 4×4 grid from the solved scenario
- **WHEN** the solver counts solutions
- **THEN** it reports 1

### Requirement: Solver stops at the second solution
The solver SHALL stop searching at the second solution found and report "2 or more" instead of an exact count.

Traces: FR-12

#### Scenario: Empty board has many completions
- **GIVEN** a 4×4 board with every cell empty
- **WHEN** the solver counts solutions
- **THEN** it reports "2 or more"

#### Scenario: Result is capped
- **GIVEN** an 8×8 board with every cell empty
- **WHEN** the solver counts solutions
- **THEN** the returned value is 2 ("2 or more") and the call returns; no value above 2 is ever returned (the stop at the second solution is observed through this cap, not through internal counters)

### Requirement: Generator returns a puzzle of the requested size
The generator SHALL return, for a size N and a seed, an N×N puzzle made of givens (0 or 1) and empty cells.

Traces: FR-13

#### Scenario: 6×6 puzzle
- **GIVEN** size 6 and seed 42
- **WHEN** the generator runs
- **THEN** the result has 6 rows of 6 cells and every cell is 0, 1 or empty

#### Scenario: Other tested sizes
- **GIVEN** size 4 and size 8, each with seed 1
- **WHEN** the generator runs
- **THEN** the results are 4×4 and 8×8 puzzles whose cells are all 0, 1 or empty

### Requirement: Same seed and size give the identical puzzle
The generator SHALL produce the identical puzzle for the same seed and the same N, taking all randomness from a seeded pseudo-random generator.

Traces: FR-14

#### Scenario: Repeated generation
- **GIVEN** size 6 and seed 42
- **WHEN** the generator runs twice
- **THEN** both results are cell-for-cell identical

#### Scenario: Seed is the only source of variation
- **GIVEN** size 8 and seed 7 generated in two separate test files or processes
- **WHEN** the results are compared
- **THEN** they are cell-for-cell identical

### Requirement: Every generated puzzle has exactly one solution
The generator SHALL return only puzzles for which the solver reports 1, tested for N = 4, 6 and 8 over the fixed seed set (seeds 1 to 20 for each N, see the test conventions).

Traces: FR-15

#### Scenario: Uniqueness over the fixed seed set
- **GIVEN** each N in 4, 6 and 8 and each seed from 1 to 20
- **WHEN** the puzzle is generated and its givens are passed to the solver
- **THEN** the solver reports 1 for each of the 60 puzzles

### Requirement: Odd size is rejected
The generator SHALL reject an odd N with an error and return no puzzle.

Traces: FR-16

#### Scenario: Odd size 5
- **GIVEN** size 5 and any seed
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

#### Scenario: Odd size 7
- **GIVEN** size 7 and any seed
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

### Requirement: Size below the minimum is rejected
The generator SHALL reject an N below 4 (zero and negative values included) with an error and return no puzzle; the minimum is pinned to 4.

Traces: FR-17

#### Scenario: Even size below 4
- **GIVEN** size 2 and any seed
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

#### Scenario: Zero, negative and odd sizes below 4
- **GIVEN** size 0, separately size 3, and separately size -2
- **WHEN** the generator runs
- **THEN** each raises an error and returns no puzzle

#### Scenario: Minimum size is accepted
- **GIVEN** size 4 and any seed
- **WHEN** the generator runs
- **THEN** a 4×4 puzzle is returned

### Requirement: Size above the maximum is rejected
The generator SHALL reject an N above 16 with an error and return no puzzle; the maximum is pinned to 16 (A-9). An even N from 10 to 16 passes size validation but is untested and not offered.

Traces: FR-49

#### Scenario: Even size above 16
- **GIVEN** size 18 and any valid seed
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

#### Scenario: Very large size
- **GIVEN** size 1000 and any valid seed
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

#### Scenario: Largest tested size is still accepted
- **GIVEN** size 8 and any valid seed
- **WHEN** the generator runs
- **THEN** an 8×8 puzzle is returned (sizes 10 to 16 are accepted by validation but no scenario generates at them)

### Requirement: A size that is not an integer is rejected
The generator SHALL reject a size that is not an integer (for example 4.5, NaN or Infinity) with an error and return no puzzle.

Traces: FR-50

#### Scenario: Fractional size
- **GIVEN** size 4.5 and any valid seed
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

#### Scenario: NaN and infinite sizes
- **GIVEN** size NaN, separately size Infinity, and separately size -Infinity, each with any valid seed
- **WHEN** the generator runs
- **THEN** each raises an error and returns no puzzle

#### Scenario: Whole-number size is accepted
- **GIVEN** size 6 and any valid seed
- **WHEN** the generator runs
- **THEN** a 6×6 puzzle is returned

### Requirement: A seed outside the seed domain is rejected
The generator SHALL reject a seed that is not an integer from 0 to 2147483647 (2^31 - 1) with an error and return no puzzle; the seed domain applies to the generator, the CLI and the page (A-25).

Traces: FR-51

#### Scenario: Lowest and highest valid seeds
- **GIVEN** size 4 with seed 0, and separately size 4 with seed 2147483647
- **WHEN** the generator runs
- **THEN** each returns a 4×4 puzzle

#### Scenario: Negative seed
- **GIVEN** size 4 and seed -1
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

#### Scenario: Seed above the domain
- **GIVEN** size 4 and seed 2147483648
- **WHEN** the generator runs
- **THEN** it raises an error and returns no puzzle

#### Scenario: Fractional, NaN and infinite seeds
- **GIVEN** size 4 with seed 1.5, separately with seed NaN, and separately with seed Infinity
- **WHEN** the generator runs
- **THEN** each raises an error and returns no puzzle

### Requirement: Pair hint
The hint engine SHALL, when two equal digits stand side by side in a line and a cell next to the pair is empty, target that cell with the opposite digit and explain it in one Ukrainian sentence that names the pair, the line, the digit that may stand next to it and the reason, which is that three equal digits in a row are forbidden. The sentence is «<Два нулі|Дві одиниці> поспіль у <рядку|стовпці> K, тож поруч може стояти лише <одиниця|нуль>, бо три однакові цифри поспіль заборонені.» with K the 1-based line number.

Traces: FR-19, NFR-4, NFR-5, NFR-6

#### Scenario: Pair of zeros in a row
- **GIVEN** a 6×6 board whose only filled cells are 0 at row 3 columns 1 and 2
- **WHEN** a hint is requested
- **THEN** the hint targets row 3 column 3 with value 1 and the sentence is «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.»

#### Scenario: Pair of ones in a column
- **GIVEN** a 6×6 board whose only filled cells are 1 at rows 1 and 2 of column 4
- **WHEN** a hint is requested
- **THEN** the hint targets row 3 column 4 with value 0 and the sentence is «Дві одиниці поспіль у стовпці 4, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.»

#### Scenario: Pair of ones in a row
- **GIVEN** a 6×6 board whose only filled cells are 1 at row 2 columns 4 and 5
- **WHEN** a hint is requested
- **THEN** the hint targets row 2 column 3 with value 0 and the sentence is «Дві одиниці поспіль у рядку 2, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.»

#### Scenario: Pair of zeros in a column
- **GIVEN** a 6×6 board whose only filled cells are 0 at rows 4 and 5 of column 6
- **WHEN** a hint is requested
- **THEN** the hint targets row 3 column 6 with value 1 and the sentence is «Два нулі поспіль у стовпці 6, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.»

### Requirement: Sandwich hint
The hint engine SHALL, when an empty cell sits between two equal digits in a line, target that cell with the opposite digit and explain it in one Ukrainian sentence that names the two equal digits, the line, the digit that may stand between them and the reason, which is that three equal digits in a row are forbidden. The sentence is «Між двома <нулями|одиницями> у <рядку|стовпці> K може стояти лише <одиниця|нуль>, бо три однакові цифри поспіль заборонені.» with K the 1-based line number.

Traces: FR-20, NFR-4, NFR-5, NFR-6

#### Scenario: Zeros around a gap in a column
- **GIVEN** a 6×6 board whose only filled cells are 0 at rows 1 and 3 of column 2
- **WHEN** a hint is requested
- **THEN** the hint targets row 2 column 2 with value 1 and the sentence is «Між двома нулями у стовпці 2 може стояти лише одиниця, бо три однакові цифри поспіль заборонені.»

#### Scenario: Ones around a gap in a row
- **GIVEN** a 6×6 board whose only filled cells are 1 at row 1 columns 1 and 3
- **WHEN** a hint is requested
- **THEN** the hint targets row 1 column 2 with value 0 and the sentence is «Між двома одиницями у рядку 1 може стояти лише нуль, бо три однакові цифри поспіль заборонені.»

### Requirement: Count hint
The hint engine SHALL, when a line already holds N/2 of one digit and has an empty cell, target the first empty cell of that line with the other digit and explain it in one Ukrainian sentence whose number word follows N/2 and agrees in gender with the digit word, and that gives the reason, which is that a line must hold as many zeros as ones. The ending depends on the number of empty cells in that line when the hint is requested. With 2 or more empty cells the sentence is «У <рядку|стовпці> K вже <count phrase>, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — <одиниці|нулі>.» With exactly 1 empty cell it is «У <рядку|стовпці> K вже <count phrase>, а нулів і одиниць має бути порівну, тож остання порожня клітинка — <одиниця|нуль>.» Here K is the 1-based line number and the count phrase is the number word with the digit word, for example «три нулі» or «дві одиниці».

Traces: FR-21, NFR-4, NFR-5, NFR-6

#### Scenario: Three zeros in a 6-wide row, one empty cell
- **GIVEN** a 6×6 board whose only filled cells are row 5 `0 1 0 1 . 0`
- **WHEN** a hint is requested
- **THEN** the hint targets row 5 column 5 with value 1 and the sentence is «У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.»

#### Scenario: Three ones in a column, one empty cell
- **GIVEN** a 6×6 board whose only filled cells are column 2 reading top to bottom `1 0 1 0 . 1`
- **WHEN** a hint is requested
- **THEN** the hint targets row 5 column 2 with value 0 and the sentence is «У стовпці 2 вже три одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.»

#### Scenario: Number word for N = 4, one empty cell
- **GIVEN** a 4×4 board whose only filled cells are row 2 `0 1 0 .`, and separately one whose only filled cells are row 2 `1 0 1 .`
- **WHEN** a hint is requested for each
- **THEN** the sentences are «У рядку 2 вже два нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.» and «У рядку 2 вже дві одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.»

#### Scenario: Number word for N = 8, one empty cell
- **GIVEN** an 8×8 board whose only filled cells are row 1 `0 1 0 1 0 1 0 .`, and separately one whose only filled cells are row 1 `1 0 1 0 1 0 1 .`
- **WHEN** a hint is requested for each
- **THEN** the sentences are «У рядку 1 вже чотири нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.» and «У рядку 1 вже чотири одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.»

#### Scenario: One hint fills one cell, the first empty one
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 1 0 . . 0`
- **WHEN** a hint is requested
- **THEN** the hint targets row 2 column 4 only (not column 5) with value 1

#### Scenario: Two empty cells in the line use the plural ending
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 1 0 . . 0` (the row has 2 empty cells)
- **WHEN** a hint is requested
- **THEN** the hint targets row 2 column 4 with value 1 and the sentence is «У рядку 2 вже три нулі, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — одиниці.»

### Requirement: Hint explanation names the line type and number
The hint engine SHALL name in each rule explanation the line type («рядок» or «стовпець», in the grammatical case of the sentence) and its 1-based number, matching the line of the target cell.

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

### Requirement: Hint choice is deterministic
The hint engine SHALL, when several hints apply, choose by this order: rule order pair, then sandwich, then count; within a rule rows before columns; then lower line number; then lower cell position in the line; repeated calls on the same board MUST return the same cell, value and sentence.

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
The hint engine SHALL only ever target an empty cell and MUST NOT change a given or an already filled cell, nor modify the board it is given.

Traces: FR-24

#### Scenario: Filled cell beside a pair is not targeted
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 0 1 . . .`
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the no-rule sentence is returned

#### Scenario: Board is left unchanged
- **GIVEN** a board on which a hint applies
- **WHEN** a hint is requested
- **THEN** the board's cells, including givens, are identical before and after the call and the target cell was empty before the call

### Requirement: No-rule hint
The hint engine SHALL, when none of the pair, sandwich and count rules applies and the board breaks no rule, target no cell and return one Ukrainian sentence saying so.

Traces: FR-25

#### Scenario: Sparse board with no deduction
- **GIVEN** a 6×6 board whose only filled cell is 0 at row 1 column 1
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the sentence is «Жодне з трьох правил зараз не підказує наступного ходу.»

#### Scenario: Empty board
- **GIVEN** a 6×6 board with every cell empty
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the same sentence is returned

#### Scenario: Complete valid board
- **GIVEN** the valid full 4×4 grid from the solved scenario
- **WHEN** a hint is requested
- **THEN** no cell is targeted (every rule needs an empty cell) and the same sentence is returned

### Requirement: Broken-board hint
The hint engine SHALL, when the board currently breaks a rule, target no cell and return one Ukrainian sentence asking the player to fix the highlighted rule first; this MUST take precedence over the pair, sandwich, count and no-rule outcomes. Every hint SHALL be derived from the board as it stands (givens plus the player's entries) and the engine MUST NOT consult the puzzle's solution (A-6).

Traces: FR-26

#### Scenario: Three in a row on the board
- **GIVEN** a 6×6 board whose row 1 is `0 0 0 . . .`
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the sentence is «Спершу виправте порушення правил, підсвічене на полі.»

#### Scenario: Broken rule wins over an available hint
- **GIVEN** a 6×6 board whose row 1 is `0 0 0 . . .` and whose row 3 is `1 1 . . . .` (a pair that would otherwise give a hint)
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the broken-rule sentence is returned

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

### Requirement: CLI prints the puzzle for a size and seed
The CLI (`npm run cli -- --size <N> --seed <integer>`, implemented in `src/cli.ts` and run through `tsx`) SHALL print the puzzle of that size and seed to stdout as N lines of N space-separated tokens, `0` or `1` for givens and `.` for empty cells, and print nothing else to stdout or stderr; it MUST NOT print the solution. Tests call it as pinned in the test conventions.

Traces: FR-28

#### Scenario: Size 6 seed 42
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed 42`
- **WHEN** it runs
- **THEN** it exits with code 0, stdout is exactly 6 newline-terminated lines each with 6 tokens separated by single spaces and each token being `0`, `1` or `.`, and stderr is empty

#### Scenario: Output matches the engine
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed 42` and the engine generator called with size 6 and seed 42
- **WHEN** both run
- **THEN** the printed tokens equal the generated puzzle cell for cell, with `.` standing for an empty cell

#### Scenario: Same arguments, same output
- **GIVEN** the command `npm run --silent cli -- --size 4 --seed 9`
- **WHEN** it runs twice
- **THEN** the two stdout outputs are identical

### Requirement: CLI defaults
The CLI SHALL use size 6 when `--size` is omitted and seed 1 when `--seed` is omitted.

Traces: FR-29

#### Scenario: No arguments
- **GIVEN** the command `npm run --silent cli`
- **WHEN** it runs
- **THEN** its stdout equals the stdout of `npm run --silent cli -- --size 6 --seed 1`

#### Scenario: Only the seed given
- **GIVEN** the command `npm run --silent cli -- --seed 5`
- **WHEN** it runs
- **THEN** its stdout is a 6×6 puzzle equal to the stdout of `npm run --silent cli -- --size 6 --seed 5`

#### Scenario: Only the size given
- **GIVEN** the command `npm run --silent cli -- --size 4`
- **WHEN** it runs
- **THEN** its stdout is a 4×4 puzzle equal to the stdout of `npm run --silent cli -- --size 4 --seed 1`

### Requirement: CLI rejects an invalid size
The CLI SHALL, for an invalid size (odd, below 4, above 16, or not a number by the grammar in FR-53), write a one-sentence English error to stderr, exit with a non-zero code, and write nothing to stdout (so no puzzle line is printed).

Traces: FR-30

#### Scenario: Odd size
- **GIVEN** the command `npm run --silent cli -- --size 5`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Size below 4
- **GIVEN** the command `npm run --silent cli -- --size 2`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Size above 16
- **GIVEN** the command `npm run --silent cli -- --size 18`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Non-numeric size
- **GIVEN** the command `npm run --silent cli -- --size abc`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Size that breaks the number grammar
- **GIVEN** the command `npm run --silent cli -- --size 6.5`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

### Requirement: CLI rejects an invalid seed
The CLI SHALL, for an invalid seed (not valid by the grammar in FR-53, or above 2147483647), write a one-sentence English error to stderr, exit with a non-zero code, and write nothing to stdout.

Traces: FR-52

#### Scenario: Non-numeric seed
- **GIVEN** the command `npm run --silent cli -- --seed abc`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Seed above the domain
- **GIVEN** the command `npm run --silent cli -- --seed 2147483648`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Negative and fractional seeds
- **GIVEN** the commands `npm run --silent cli -- --seed -1` and `npm run --silent cli -- --seed 1.5`
- **WHEN** each runs
- **THEN** for each, stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Lowest and highest valid seeds
- **GIVEN** the commands `npm run --silent cli -- --size 4 --seed 0` and `npm run --silent cli -- --size 4 --seed 2147483647`
- **WHEN** each runs
- **THEN** each exits with code 0, prints a 4×4 puzzle to stdout and writes nothing to stderr

### Requirement: CLI number grammar
The CLI SHALL accept a `--size` or `--seed` value only when the whole value matches `^[0-9]+$` (ASCII digits only); leading zeros are allowed and `06` means 6; any other value, including `6.5`, `+6`, `-2`, `1e1`, `0x6` and an empty value, MUST be rejected as invalid with the error behaviour of FR-30 (size) or FR-52 (seed).

Traces: FR-53

#### Scenario: Leading zeros are accepted
- **GIVEN** the commands `npm run --silent cli -- --size 06 --seed 7` and `npm run --silent cli -- --size 6 --seed 7`
- **WHEN** each runs
- **THEN** both exit with code 0 and their stdout outputs are identical

#### Scenario: Leading zeros in the seed
- **GIVEN** the commands `npm run --silent cli -- --size 4 --seed 007` and `npm run --silent cli -- --size 4 --seed 7`
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

### Requirement: CLI rejects a missing option value and an unknown option
The CLI SHALL, for an option given without a value (for example `--size` as the last argument) or for an unknown option, write a one-sentence English error to stderr and exit with a non-zero code.

Traces: FR-54

#### Scenario: Size without a value
- **GIVEN** the command `npm run --silent cli -- --size`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Seed without a value after another option
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Unknown option
- **GIVEN** the command `npm run --silent cli -- --level 3`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

#### Scenario: Unknown option next to valid ones
- **GIVEN** the command `npm run --silent cli -- --size 6 --seed 1 --verbose`
- **WHEN** it runs
- **THEN** stderr holds one English error sentence, the exit code is non-zero and stdout is empty

### Requirement: Generating a 4×4 puzzle is fast
The generator SHALL produce one 4×4 puzzle in under 200 ms, worst case over the fixed seed set (seeds 1 to 20) used for the uniqueness requirement, measured in Vitest on the test machine.

Traces: NFR-1

#### Scenario: Worst case over the seed set at N = 4
- **GIVEN** seeds 1 to 20 and size 4
- **WHEN** Vitest times the generation of each puzzle
- **THEN** the slowest generation takes under 200 ms

### Requirement: Generating a 6×6 puzzle is fast
The generator SHALL produce one 6×6 puzzle in under 500 ms, worst case over the fixed seed set (seeds 1 to 20) used for the uniqueness requirement, measured in Vitest on the test machine.

Traces: NFR-2

#### Scenario: Worst case over the seed set at N = 6
- **GIVEN** seeds 1 to 20 and size 6
- **WHEN** Vitest times the generation of each puzzle
- **THEN** the slowest generation takes under 500 ms

### Requirement: Generating an 8×8 puzzle is fast
The generator SHALL produce one 8×8 puzzle in under 3 seconds, worst case over the fixed seed set (seeds 1 to 20) used for the uniqueness requirement, measured in Vitest on the test machine.

Traces: NFR-3

#### Scenario: Worst case over the seed set at N = 8
- **GIVEN** seeds 1 to 20 and size 8
- **WHEN** Vitest times the generation of each puzzle
- **THEN** the slowest generation takes under 3 seconds

### Requirement: Every hint sentence is exactly one sentence
The hint engine SHALL return only sentences that are exactly one sentence: one terminal mark at the end and no other sentence break. This covers the rule explanations, the no-rule sentence and the broken-rule sentence, and the same one-sentence definition applies to each CLI error sentence (FR-30).

Traces: NFR-4

#### Scenario: Each kind of sentence
- **GIVEN** one sentence of each kind: pair, sandwich, count, no-rule and broken-rule, each for a row and for a column where the kind has both
- **WHEN** the sentence is inspected
- **THEN** it ends with a single terminal mark and contains no earlier full stop, exclamation mark or question mark

#### Scenario: CLI error sentences
- **GIVEN** the CLI error text written to stderr for an odd size, for a size below 4 and for a non-numeric size
- **WHEN** each is inspected
- **THEN** each is a single line ending with a single terminal mark and contains no earlier full stop, exclamation mark or question mark

#### Scenario: Number words, dashes and reason clauses are not breaks
- **GIVEN** a count sentence such as «У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.» and a pair sentence such as «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.»
- **WHEN** the sentence is inspected
- **THEN** the dash and the commas, including the one before «бо» and the one before «а», are not sentence breaks and each sentence counts as one

### Requirement: Hint sentences are Ukrainian
The hint engine SHALL write every hint sentence in Ukrainian: the text contains Cyrillic and no Latin letters (digits are allowed). CLI errors are English (NFR-8) and are not covered here. Page text belongs to the play-page capability and is out of scope here.

Traces: NFR-5

#### Scenario: Hint sentences
- **GIVEN** the pair, sandwich, count, no-rule and broken-rule sentences
- **WHEN** each is inspected
- **THEN** each contains Cyrillic letters and no Latin letters (digits for line numbers are allowed)

### Requirement: CLI errors are English
The CLI SHALL write every error as one English sentence that contains no Cyrillic letters; the exact wording is not pinned (A-22).

Traces: NFR-8

#### Scenario: Every kind of CLI error
- **GIVEN** the CLI errors for an odd size, a size above 16, a non-numeric seed, a seed above 2147483647, a `--size` option without a value and an unknown option
- **WHEN** each stderr text is inspected
- **THEN** each is a single line that contains Latin letters, does not match `/\p{Script=Cyrillic}/u`, and ends with a single terminal mark with no earlier full stop, exclamation mark or question mark

#### Scenario: Wording is not asserted
- **GIVEN** any CLI error
- **WHEN** a test inspects its text
- **THEN** it checks only the language and one-sentence shape above, never specific words

### Requirement: Hint explanations are clear and correct for a player
The hint engine SHALL give explanations that a player finds clear and correct: the sentence states the rule that applies, names the right line, and agrees with the board and the target cell and value. This quality is graded by an eval-judge on a 0 to 100 scale against a rubric on 2 to 3 Ukrainian hint sentences (pair, sandwich and count), each case must score at least 80 out of 100, and the grading is optional (cut line 2 of the cut order); if it is cut, this requirement is reported NOT-EARNED, not passed.

Traces: NFR-6

#### Scenario: Pair, sandwich and count cases are graded
- **GIVEN** one hint case each for the pair, sandwich and count rules, with the board, the target and the sentence
- **WHEN** the eval-judge scores each case against the rubric
- **THEN** a score from 0 to 100 is recorded for each case, with the rubric items scored being: the sentence names the rule, names the correct line type and number, names the correct digit, and is understandable to a player without game knowledge
- **AND** each recorded score is at least 80 out of 100

#### Scenario: Grading is not run
- **GIVEN** the eval is dropped under the cut order
- **WHEN** the status of this requirement is reported
- **THEN** it is reported NOT-EARNED

## Exclusions

These are intentional and are not defects:

- There is no server, no authentication, no accounts, no persistence and no network. The engine and CLI have no unauthorized, forbidden or permission paths, so no such scenarios exist. The specified error paths are: odd N, N below 4 (including 0 and negative N), N above 16, a size that is not an integer, a seed outside 0 to 2147483647, an invalid CLI size or seed (odd, below 4, above 16, above the seed domain, or a value outside the number grammar), a CLI option without a value, an unknown CLI option, a hint on a board that already breaks a rule, a hint when no rule applies, and a solver result of 0 on a board with no completion. All other malformed input is excluded below.
- FR-18 (grid sizes 10 to 16 tested and offered on the page) is Future. The engine accepts an even N from 10 to 16 (FR-49), but such sizes are untested, carry no time bound and are not offered anywhere; an N above 16 is rejected (FR-49).
- FR-56 (English hint sentences) is Future; hint sentences are Ukrainian only.
- FR-27 (a guarantee that every puzzle is solvable from its givens by the pair, sandwich and count rules alone, so that a hint is always available on a correct board) is Future. Until then the no-rule hint (FR-25) is the defined outcome when no rule applies.
- All play-page behaviour (FR-31 to FR-48: rendering, clicking, highlighting, the hint button, the win message, new puzzle, and the size selector, which is cut) belongs to the play-page capability. This capability supplies the engine results the page uses, not the page itself.
- Difficulty grading, a timer, saved progress, undo and a daily puzzle (Future) are not part of this capability. The generator takes no difficulty parameter.
- The CLI never prints the solution and has no options other than the size and the seed.
- Different seeds are expected, not guaranteed, to give different puzzles (A-18); no requirement or scenario asserts that two seeds differ.
- The engine-purity constraints TC-7 (no DOM imports or browser globals in `src/engine/`) and TC-8 (no `Math.random`) are constraints, not traced behaviours (A-21). A test that scans `src/engine/` sources for them may exist, but it carries no `@trace FR-x` tag and does not count as evidence for any FR.
- Even N from 10 to 16 is accepted by size validation (A-9, FR-49), but generation time, uniqueness and page support at those sizes are not claimed, no time bound exists, and no scenario generates at N = 10 or above.
- Malformed engine input is assumed well-formed and its behaviour is unspecified: a board that is not square, whose side differs from N, or that holds a cell value other than 0, 1 or empty, passed to the rule checker, solver or hint engine.
- The exact wording of the CLI error sentences is not pinned (A-22) and no scenario asserts specific words; only the language (English, NFR-8) and the one-sentence shape are asserted.
- The timing bounds of NFR-1 to NFR-3 are generous first guesses (A-13) and may need margin on shared CI machines; changing a bound is a change-control decision, not a tested behaviour.
