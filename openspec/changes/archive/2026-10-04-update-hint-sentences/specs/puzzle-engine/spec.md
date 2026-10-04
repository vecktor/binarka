## MODIFIED Requirements

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
