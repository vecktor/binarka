## ADDED Requirements

### Requirement: Hint language is an engine input

The hint engine SHALL take the language of its sentences as an input: `hint(board, ceiling = 1, language = 'uk')`, where `language` is `'uk'` or `'en'` (FR-112, FR-56). With `'uk'`, and with no third argument, every result is byte-identical to the result before the language existed, so every existing caller (the generator, the CLI, the eval cases and the engine tests) gets the same Ukrainian sentences. With `'en'` the result has the same kind, cell, value and rule and an English sentence. The language changes only the `sentence`: the choice of the hint (FR-23, FR-77) never depends on it. A `language` other than `'uk'` or `'en'` is a malformed call and is unspecified. The engine stays pure TypeScript with no DOM import or browser global (TC-7), never reads storage, and never reads a locale: the language is a plain value passed by the caller.

Traces: FR-112, FR-56, FR-23, NFR-5

#### Scenario: The default language is Ukrainian and unchanged

- **GIVEN** the boards of «Pair hint», «Sandwich hint», «Count hint», «Line balance hint», «Unique lines hint», «Look-ahead hint», «No-rule hint» and «Broken-board hint»
- **WHEN** a hint is requested on each without a third argument, with `'uk'`, and (for the old two-argument form) with the ceiling only
- **THEN** the three results are identical, and each sentence equals the Ukrainian sentence pinned in the named requirement

#### Scenario: English changes only the sentence

- **GIVEN** the same boards
- **WHEN** a hint is requested with `'uk'` and with `'en'` at the same ceiling
- **THEN** `kind`, `row`, `col`, `value`, `rule` and `steps` are equal in the two results and only `sentence` differs

#### Scenario: The engine stays pure

- **GIVEN** the source files under `src/engine/`
- **WHEN** a test scans them for DOM imports and browser globals (`document`, `window`, `localStorage`, `navigator`)
- **THEN** there is no match, and no file under `src/engine/` reads `Math.random`

### Requirement: A hint exposes the data of its sentence

A hint of `kind` `'fill'` SHALL carry, besides `row`, `col`, `value`, `rule` and `sentence`, the data its sentence is built from (FR-110, Q8): `axis` (`'row'` or `'col'`, the type of the line the sentence names), `line` (the 0-based index of that line), `digit` (the digit the sentence names: the pair, the sandwiching digit, the counted digit or the digit that has room for one more), `empties` (the number of empty cells of the line when the hint is requested), `other` (the 0-based index of the complete line named), `steps` (as before) and `size` (the side of the board), as the table below says. The fields present for each rule are exactly these, and every other field is absent (not `undefined`-valued, not null):

| `rule` | `axis` | `line` | `digit` | `empties` | `other` | `steps` | `size` |
|---|---|---|---|---|---|---|---|
| `pair` | yes | yes | yes | no | no | no | yes |
| `sandwich` | yes | yes | yes | no | no | no | yes |
| `count` | yes | yes | yes | yes | no | no | yes |
| `balance` | yes | yes | yes | no | no | no | yes |
| `unique` | yes | yes | no | no | yes | no | yes |
| `lookahead` | no | no | no | no | no | yes | yes |

`row`, `col`, `value`, `rule` and `sentence` are present for every fill, as before. The module `src/engine/index.ts` SHALL export a pure function `hintSentence(hint, language = 'uk')` that returns the sentence of a hint already made, in the given language, from that data (and from `kind` alone for `'none'` and `'broken'`). For every board, ceiling and language, `hint(board, ceiling, language).sentence` equals `hintSentence(hint(board, ceiling, 'uk'), language)`. The function reads no board, no DOM and no storage. The page keeps the result of the hint on screen and calls the function when the language changes (FR-110).

Traces: FR-110, FR-112

#### Scenario: Each rule carries its data

- **GIVEN** the boards of the scenarios «Pair of zeros in a row», «Zeros around a gap in a column», «Three zeros in a 6-wide row, one empty cell», «Two empty cells in the line use the plural ending», «Line balance in a row», «Unique lines in a column» and «Look-ahead of two steps beats an earlier cell of four»
- **WHEN** a hint is requested with ceiling 4
- **THEN** the results carry, in this order, `axis` `'row'`, `line` 2, `digit` 0; `axis` `'col'`, `line` 1, `digit` 0; `axis` `'row'`, `line` 4, `digit` 0, `empties` 1, `size` 6; `axis` `'row'`, `line` 1, `digit` 0, `empties` 2; `axis` `'row'`, `line` 2, `digit` 0; `axis` `'col'`, `line` 1, `other` 4; and for the look-ahead `steps` 2 with no `axis`
- **AND** every result carries `size` equal to the side of its board, and no result carries a field that the table marks absent for its rule (`Object.keys` of each result equals the keys of the table row plus `kind`, `row`, `col`, `value`, `rule` and `sentence`)

#### Scenario: hintSentence rebuilds every sentence in both languages

- **GIVEN** the hints of the previous scenario and the hints of «Pair of ones in a column», «Ones around a gap in a row», «Number word for N = 8, one empty cell», «Line balance in a column» and «Unique lines in a row»
- **WHEN** the test calls `hintSentence(h, 'uk')` and `hintSentence(h, 'en')` for each hint `h` made with the default language
- **THEN** the first equals `h.sentence` and the second equals `hint(board, 4, 'en').sentence` for the same board

#### Scenario: The no-rule and broken-rule sentences need no data

- **GIVEN** the results `{ kind: 'none', sentence }` and `{ kind: 'broken', sentence }` of «No-rule hint» and «Broken-board hint»
- **WHEN** the test calls `hintSentence` on each with `'uk'` and `'en'`
- **THEN** it returns the Ukrainian and the English sentence of that kind, and the input object is not modified

## MODIFIED Requirements

### Requirement: Pair hint

The hint engine SHALL, when two equal digits stand side by side in a line and a cell next to the pair is empty, target that cell with the opposite digit and explain it in one Ukrainian sentence that names the pair, the line, the digit that may stand next to it and the reason, which is that three equal digits in a row are forbidden. The sentence is «<Два нулі|Дві одиниці> поспіль у <рядку|стовпці> K, тож поруч може стояти лише <одиниця|нуль>, бо три однакові цифри поспіль заборонені.» with K the 1-based line number. In English mode (FR-112) it is "<Two zeros|Two ones> side by side in <row|column> K, so only <a one|a zero> can go next to them, because three equal digits side by side are not allowed."

Traces: FR-19, NFR-4, NFR-5, NFR-6, FR-112

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

#### Scenario: Pair hints in English

- **GIVEN** the boards of «Pair of zeros in a row» and «Pair of ones in a column»
- **WHEN** a hint is requested with the language `'en'`
- **THEN** the sentences are "Two zeros side by side in row 3, so only a one can go next to them, because three equal digits side by side are not allowed." and "Two ones side by side in column 4, so only a zero can go next to them, because three equal digits side by side are not allowed.", with the same targets and values as in Ukrainian

### Requirement: Sandwich hint

The hint engine SHALL, when an empty cell sits between two equal digits in a line, target that cell with the opposite digit and explain it in one Ukrainian sentence that names the two equal digits, the line, the digit that may stand between them and the reason, which is that three equal digits in a row are forbidden. The sentence is «Між двома <нулями|одиницями> у <рядку|стовпці> K може стояти лише <одиниця|нуль>, бо три однакові цифри поспіль заборонені.» with K the 1-based line number. In English mode (FR-112) it is "Only <a one|a zero> can go between the two <zeros|ones> in <row|column> K, because three equal digits side by side are not allowed."

Traces: FR-20, NFR-4, NFR-5, NFR-6, FR-112

#### Scenario: Zeros around a gap in a column
- **GIVEN** a 6×6 board whose only filled cells are 0 at rows 1 and 3 of column 2
- **WHEN** a hint is requested
- **THEN** the hint targets row 2 column 2 with value 1 and the sentence is «Між двома нулями у стовпці 2 може стояти лише одиниця, бо три однакові цифри поспіль заборонені.»

#### Scenario: Ones around a gap in a row
- **GIVEN** a 6×6 board whose only filled cells are 1 at row 1 columns 1 and 3
- **WHEN** a hint is requested
- **THEN** the hint targets row 1 column 2 with value 0 and the sentence is «Між двома одиницями у рядку 1 може стояти лише нуль, бо три однакові цифри поспіль заборонені.»

#### Scenario: Sandwich hints in English

- **GIVEN** the boards of «Zeros around a gap in a column» and «Ones around a gap in a row»
- **WHEN** a hint is requested with the language `'en'`
- **THEN** the sentences are "Only a one can go between the two zeros in column 2, because three equal digits side by side are not allowed." and "Only a zero can go between the two ones in row 1, because three equal digits side by side are not allowed.", with the same targets and values as in Ukrainian

### Requirement: Count hint

The hint engine SHALL, when a line already holds N/2 of one digit and has an empty cell, target the first empty cell of that line with the other digit and explain it in one Ukrainian sentence whose number word follows N/2 and agrees in gender with the digit word, and that gives the reason, which is that a line must hold as many zeros as ones. The ending depends on the number of empty cells in that line when the hint is requested. With 2 or more empty cells the sentence is «У <рядку|стовпці> K вже <count phrase>, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — <одиниці|нулі>.» With exactly 1 empty cell it is «У <рядку|стовпці> K вже <count phrase>, а нулів і одиниць має бути порівну, тож остання порожня клітинка — <одиниця|нуль>.» Here K is the 1-based line number and the count phrase is the number word with the digit word, for example «три нулі» or «дві одиниці». In English mode (FR-112) the sentence is "<Row|Column> K already has <count phrase>, and a line needs as many zeros as ones, so the remaining empty cells are <ones|zeros>." with 2 or more empty cells, and "<Row|Column> K already has <count phrase>, and a line needs as many zeros as ones, so the last empty cell is <a one|a zero>." with exactly 1; the count phrase is "two", "three" or "four" with "zeros" or "ones", and the number word agrees with N/2.

Traces: FR-21, NFR-4, NFR-5, NFR-6, FR-112

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

#### Scenario: Count hints in English

- **GIVEN** the boards of «Three zeros in a 6-wide row, one empty cell», «Three ones in a column, one empty cell», «Number word for N = 4, one empty cell», «Number word for N = 8, one empty cell» and «Two empty cells in the line use the plural ending»
- **WHEN** a hint is requested with the language `'en'`
- **THEN** the sentences are "Row 5 already has three zeros, and a line needs as many zeros as ones, so the last empty cell is a one.", "Column 2 already has three ones, and a line needs as many zeros as ones, so the last empty cell is a zero.", "Row 2 already has two zeros, and a line needs as many zeros as ones, so the last empty cell is a one." and "Row 2 already has two ones, and a line needs as many zeros as ones, so the last empty cell is a zero.", "Row 1 already has four zeros, and a line needs as many zeros as ones, so the last empty cell is a one." and "Row 1 already has four ones, and a line needs as many zeros as ones, so the last empty cell is a zero.", and "Row 2 already has three zeros, and a line needs as many zeros as ones, so the remaining empty cells are ones."

### Requirement: Hint explanation names the line type and number

The hint engine SHALL name in each rule explanation the line type («рядок» or «стовпець», in the grammatical case of the sentence) and its 1-based number, matching the line of the target cell. The look-ahead sentence (FR-80) names the target cell by its row and its column instead (FR-22). In English mode the line types are "row" and "column" (FR-22, FR-112).

Traces: FR-22, FR-112

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

#### Scenario: English line types and numbering

- **GIVEN** the row-pair hint of «Row hint», the column-pair hint of «Column hint», and the look-ahead hint of «The look-ahead sentence names the cell by row and column», each requested with the language `'en'`
- **WHEN** the sentences are read
- **THEN** the first contains "row 3" and not "column", the second contains "column 4" and not "row", the third contains "row 6, column 5", and none contains "row 0" or "column 0"

### Requirement: No-rule hint

The hint engine SHALL, when no technique allowed to the hint applies (FR-77; at ceiling 1, the default: none of the pair, sandwich and count rules; at ceiling 4: none of the four techniques of FR-19 to FR-21 and FR-74 to FR-76) and the board breaks no rule, target no cell and return one Ukrainian sentence saying so: «Жодне з правил зараз не підказує наступного ходу.» The sentence is the same at every ceiling (FR-25, as amended 2026-10-09, autonomy-log row 87: it was «Жодне з трьох правил зараз не підказує наступного ходу.»). In English mode the sentence is "None of the rules points to a next move right now." (FR-112), the same at every ceiling.

Traces: FR-25, FR-112

#### Scenario: Sparse board with no deduction
- **GIVEN** a 6×6 board whose only filled cell is 0 at row 1 column 1
- **WHEN** a hint is requested without a ceiling, and again with ceiling 4
- **THEN** no cell is targeted and the sentence is «Жодне з правил зараз не підказує наступного ходу.» and does not contain «трьох»

#### Scenario: The no-rule sentence in English

- **GIVEN** the board of «Sparse board with no deduction»
- **WHEN** a hint is requested with the language `'en'`, without a ceiling and with ceiling 4
- **THEN** no cell is targeted and the sentence is "None of the rules points to a next move right now."

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

The hint engine SHALL, when the board currently breaks a rule, target no cell and return one Ukrainian sentence («Спершу виправте порушення правил, підсвічене на полі.»), or in English mode (FR-112) the sentence "First fix the rule break highlighted on the board.", asking the player to fix the highlighted rule first; this MUST take precedence over the pair, sandwich, count, line-balance, unique-lines, look-ahead and no-rule outcomes at every ceiling. Every hint SHALL be derived from the board as it stands (givens plus the player's entries) and the engine MUST NOT consult the puzzle's solution (A-6).

Traces: FR-26, FR-77, FR-112

#### Scenario: Three in a row on the board
- **GIVEN** a 6×6 board whose row 1 is `0 0 0 . . .`
- **WHEN** a hint is requested
- **THEN** no cell is targeted and the sentence is «Спершу виправте порушення правил, підсвічене на полі.»

#### Scenario: The broken-rule sentence in English

- **GIVEN** the board of «Three in a row on the board»
- **WHEN** a hint is requested with the language `'en'`
- **THEN** no cell is targeted and the sentence is "First fix the rule break highlighted on the board."

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

### Requirement: Line balance hint

The hint engine SHALL, at a ceiling of 2 or more, apply technique 2, line balance (FR-74): when a line holds exactly N/2 − 1 of a digit d and has at least two empty cells, then for an empty cell e of that line suppose e takes d and every other empty cell of the line takes the other digit; if that assignment puts three equal digits side by side anywhere in the line, e cannot be d, and the hint targets e with the other digit. Scan order: rows before columns, lower line first, then lower cell position e, then d = 0 before d = 1 (A-7, FR-77). The sentence (FR-78, provisional wording, to be confirmed in the page slice, Q6) is «У <рядку|стовпці> K є місце лише для <одного нуля|однієї одиниці>, і якщо поставити <його|її> сюди, решта клітинок дасть три однакові цифри поспіль, тож тут <одиниця|нуль>.» with K the 1-based line number, the first alternative of each pair for d = 0 and the second for d = 1. In English mode (FR-112) the sentence is "<Row|Column> K has room for only one more <zero|one>, and putting it here would leave three equal digits side by side in the other cells, so this is <a one|a zero>." The rule name of the hint is `balance`.

Traces: FR-74, FR-78, NFR-4, NFR-5, FR-112

#### Scenario: Line balance in a row
- **GIVEN** a 6×6 board whose only filled cells are row 3 `0 0 1 . . .` (the row holds 2 = N/2 − 1 zeros and 3 empty cells; only putting the missing zero at column 6 forces `0 0 1 1 1 0`, three ones in a row)
- **WHEN** a hint is requested with ceiling 2
- **THEN** the hint targets row 3 column 6 with value 1, its rule is `balance` and the sentence is «У рядку 3 є місце лише для одного нуля, і якщо поставити його сюди, решта клітинок дасть три однакові цифри поспіль, тож тут одиниця.»
- **AND** the same board with ceiling 1 yields no target and the no-rule sentence

#### Scenario: Line balance in a column
- **GIVEN** a 6×6 board whose only filled cells are column 2 reading top to bottom `1 1 0 . . .` (2 = N/2 − 1 ones; putting the missing one at row 6 forces `1 1 0 0 0 1`, three zeros in a row)
- **WHEN** a hint is requested with ceiling 2
- **THEN** the hint targets row 6 column 2 with value 0, its rule is `balance` and the sentence is «У стовпці 2 є місце лише для однієї одиниці, і якщо поставити її сюди, решта клітинок дасть три однакові цифри поспіль, тож тут нуль.»

#### Scenario: Line balance in English

- **GIVEN** the boards of «Line balance in a row» and «Line balance in a column»
- **WHEN** a hint is requested with ceiling 2 and the language `'en'`
- **THEN** the sentences are "Row 3 has room for only one more zero, and putting it here would leave three equal digits side by side in the other cells, so this is a one." and "Column 2 has room for only one more one, and putting it here would leave three equal digits side by side in the other cells, so this is a zero."

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

The hint engine SHALL, at a ceiling of 3 or more, apply technique 3, unique lines (FR-75): when a line has exactly two empty cells and agrees, on every filled cell of the line, with a complete line of the same direction (a line with no empty cell), each of its two empty cells takes the opposite of that complete line's digit in the same position, because otherwise the two lines would be identical; the hint targets the first (lower position) empty cell of the line. Scan order: rows before columns, lower line first; when several complete lines agree, the one with the lower line number is named. The sentence (FR-79, provisional wording, to be confirmed in the page slice, Q6) is «<Рядок|Стовпець> K збігається з повним <рядком|стовпцем> M усюди, крім двох порожніх клітинок, тож тут має бути V, інакше ці <рядки|стовпці> були б однакові.» with K the 1-based number of the target's line, M the 1-based number of the complete line and V the digit 0 or 1. In English mode (FR-112) the sentence is "<Row|Column> K matches the complete <row|column> M everywhere except two empty cells, so this must be V, or the two <rows|columns> would be the same." The rule name of the hint is `unique`.

Traces: FR-75, FR-79, NFR-4, NFR-5, FR-112

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

#### Scenario: Unique lines in English

- **GIVEN** the boards of «Unique lines in a row» and «Unique lines in a column»
- **WHEN** a hint is requested with ceiling 3 and the language `'en'`
- **THEN** the sentences are "Row 2 matches the complete row 5 everywhere except two empty cells, so this must be 1, or the two rows would be the same." and "Column 2 matches the complete column 5 everywhere except two empty cells, so this must be 1, or the two columns would be the same."

#### Scenario: Near miss, the complete line differs on a filled cell
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 1 . . 1 0` and the complete row 5 `1 1 0 0 1 0` (it differs from row 2 on column 1)
- **WHEN** a hint is requested with ceiling 3
- **THEN** no cell is targeted and the no-rule sentence is returned

#### Scenario: Near miss, the other line is not complete
- **GIVEN** a 6×6 board whose only filled cells are row 2 `0 1 . . 1 0` and row 5 `0 1 . . 1 0`
- **WHEN** a hint is requested with ceiling 3
- **THEN** no cell is targeted and the no-rule sentence is returned

### Requirement: Look-ahead hint

The hint engine SHALL, at a ceiling of 4, apply technique 4, look-ahead (FR-76): for an empty cell and a value v, place v on a copy of the board and apply techniques 1 to 3 repeatedly in the order of FR-77, each application filling one forced cell (a step), for **at most 4 steps**; if after 0 to 4 steps `findViolations` reports at least one violation (FR-1 to FR-6), the cell cannot hold v and the hint targets it with the other value. A contradiction that needs 5 or more steps is not a technique-4 deduction, and a line that merely can no longer be completed, without a reported violation, is not a contradiction (A-37). Among all such cells and values the hint uses the one with the fewest steps, then the lower row, then the lower column, then v = 0 before v = 1. The hint also carries `steps`, the number of steps of the contradiction. The sentence (FR-80, provisional wording, to be confirmed in the page slice, Q6) is «Якщо поставити W у рядку R, стовпці C, за кілька кроків порушиться правило, тож тут V.» with R and C the 1-based row and column of the target, W the refuted value and V the hint's value. In English mode (FR-112) the sentence is "If you put W in row R, column C, a rule breaks within a few steps, so this is V." The rule name of the hint is `lookahead`.

Traces: FR-76, FR-80, NFR-4, NFR-5, FR-112

#### Scenario: Look-ahead of two steps beats an earlier cell of four
- **GIVEN** the 6×6 board with rows `. 1 . . . .`, `. . 0 . . 0`, `0 0 1 0 1 1`, `. . . . 0 .`, `1 . . . . 0` and `0 . 1 . . 1` (techniques 1 to 3 find nothing, so ceiling 3 yields no target)
- **WHEN** a hint is requested with ceiling 4
- **THEN** the hint targets row 6 column 5 with value 0, its rule is `lookahead`, its `steps` is 2 and the sentence is «Якщо поставити 1 у рядку 6, стовпці 5, за кілька кроків порушиться правило, тож тут 0.»
- **AND** the chain is: put 1 at row 6 column 5; the pair rule fills row 6 column 4 with 0; the count rule fills row 6 column 2 with 0; rows 3 and 6 are now both `0 0 1 0 1 1`, a duplicate-row violation
- **AND** the cell at row 5 column 5 (earlier in row-major order) is not chosen: putting 0 there needs 4 steps

#### Scenario: Look-ahead in English

- **GIVEN** the board of «Look-ahead of two steps beats an earlier cell of four»
- **WHEN** a hint is requested with ceiling 4 and the language `'en'`
- **THEN** the hint targets row 6 column 5 with value 0, its `steps` is 2 and the sentence is "If you put 1 in row 6, column 5, a rule breaks within a few steps, so this is 0."

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

### Requirement: Every hint sentence is exactly one sentence

The hint engine SHALL return only sentences that are exactly one sentence: one terminal mark at the end and no other sentence break. This holds in Ukrainian and in English (FR-112, NFR-4). This covers the rule explanations, the line-balance, unique-lines and look-ahead sentences (FR-78 to FR-80), the no-rule sentence and the broken-rule sentence, and the same one-sentence definition applies to each CLI error sentence (FR-30, FR-86).

Traces: NFR-4, FR-78, FR-79, FR-80, FR-112

#### Scenario: Each kind of sentence
- **GIVEN** one sentence of each kind: pair, sandwich, count, line balance, unique lines, look-ahead, no-rule and broken-rule, each for a row and for a column where the kind has both
- **WHEN** the sentence is inspected
- **THEN** it ends with a single terminal mark and contains no earlier full stop, exclamation mark or question mark

#### Scenario: Each kind of English sentence

- **GIVEN** one English sentence of each kind: pair, sandwich, count (both endings), line balance, unique lines, look-ahead, no-rule and broken-rule, each for a row and for a column where the kind has both
- **WHEN** the sentence is inspected
- **THEN** it ends with a single terminal mark and contains no earlier full stop, exclamation mark or question mark, and no U+0027 or U+02BC

#### Scenario: CLI error sentences
- **GIVEN** the CLI error text written to stderr for an odd size, for a size below 4, for a non-numeric size, for a level of 5 and for a level of 2 with size 4
- **WHEN** each is inspected
- **THEN** each is a single line ending with a single terminal mark and contains no earlier full stop, exclamation mark or question mark

#### Scenario: Number words, dashes and reason clauses are not breaks
- **GIVEN** a count sentence such as «У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.», a pair sentence such as «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.» and a look-ahead sentence such as «Якщо поставити 1 у рядку 6, стовпці 5, за кілька кроків порушиться правило, тож тут 0.»
- **WHEN** the sentence is inspected
- **THEN** the dash and the commas, including the one before «бо», the one before «а» and the one after the column number, are not sentence breaks and each sentence counts as one

### Requirement: Hint sentences are Ukrainian

The hint engine SHALL write every hint sentence in the requested language (FR-112, NFR-5 per mode): in Ukrainian (the default) the text contains Cyrillic and no Latin letters, and in English the text contains Latin letters and no Cyrillic (digits are allowed in both). This covers the sentences of FR-78 to FR-80. The name of this requirement is kept from the time when only Ukrainian existed, so that the archive matches. CLI errors are English (NFR-8) and are not covered here. Page text belongs to the play-page capability and is out of scope here.

Traces: NFR-5, FR-78, FR-79, FR-80, FR-112, FR-56

#### Scenario: Hint sentences
- **GIVEN** the pair, sandwich, count, line-balance, unique-lines, look-ahead, no-rule and broken-rule sentences
- **WHEN** each is inspected
- **THEN** each contains Cyrillic letters and no Latin letters (digits for line numbers, cell coordinates and the digits 0 and 1 are allowed)

#### Scenario: English hint sentences

- **GIVEN** the pair, sandwich, count, line-balance, unique-lines, look-ahead, no-rule and broken-rule sentences requested with the language `'en'`
- **WHEN** each is inspected
- **THEN** each contains Latin letters and no Cyrillic letters (digits for line numbers, cell coordinates and the digits 0 and 1 are allowed), each names "row" or "column" with a 1-based number or the look-ahead pair "row R, column C", and "zero"/"one" agree with the count ("two zeros", "three ones")

### Requirement: Hint explanations are clear and correct for a player

The hint engine SHALL give explanations that a player finds clear and correct: the sentence states the rule that applies, names the right line, and agrees with the board and the target cell and value. This quality is graded by an eval-judge on a 0 to 100 scale against a rubric on 2 to 3 Ukrainian hint sentences (pair, sandwich and count), each case must score at least 80 out of 100, and the same rubric grades three English hint sentences (pair, sandwich and count) in a separate dimension `hint-clarity-en` (Q9), each case at least 80 out of 100 (the Ukrainian dimension `hint-clarity` is unchanged; a baseline for the new dimension is minted only after a passing run), and the grading is optional (cut line 2 of the cut order); if it is cut, this requirement is reported NOT-EARNED, not passed.

Traces: NFR-6

#### Scenario: Pair, sandwich and count cases are graded
- **GIVEN** one hint case each for the pair, sandwich and count rules, with the board, the target and the sentence
- **WHEN** the eval-judge scores each case against the rubric
- **THEN** a score from 0 to 100 is recorded for each case, with the rubric items scored being: the sentence names the rule, names the correct line type and number, names the correct digit, and is understandable to a player without game knowledge
- **AND** each recorded score is at least 80 out of 100

#### Scenario: The English cases are graded

- **GIVEN** one English hint case each for the pair, sandwich and count rules (`evals/cases/`, dimension `hint-clarity-en`), with the board, the target and the sentence
- **WHEN** the eval-judge scores each case against the rubric
- **THEN** a score from 0 to 100 is recorded for each case, and each recorded score is at least 80 out of 100
- **AND** `node scripts/check-eval-ratchet.mjs` guards the committed score of the new dimension once its baseline is minted

#### Scenario: Grading is not run
- **GIVEN** the eval is dropped under the cut order
- **WHEN** the status of this requirement is reported
- **THEN** it is reported NOT-EARNED

### Requirement: The public engine interface exports the level API

The module `src/engine/index.ts` SHALL export `generate`, `hint`, `hintSentence`, `InvalidLevelError` and `GenerationRunOutError` (besides the existing exports), so that the page (the play-page capability, FR-88, A-38) can tell a run-out from every other error by `instanceof` on classes imported from `../engine/index`. The public signatures are `generate(size, seed, level = 1)` (FR-81) and `hint(board, ceiling = 1, language = 'uk')` (FR-77, FR-112) and `hintSentence(hint, language = 'uk')` (FR-110). `buildPuzzle`, `MAX_ATTEMPTS` and `solveByRules` are internal test seams and SHALL NOT be exported from `index.ts`. `GenerationRunOutError` and `InvalidLevelError` are distinct from each other and from `InvalidSizeError`, `InvalidSeedError` and `InvalidArgumentTypeError`; each message is one English sentence.

Traces: FR-81, FR-84, FR-77, FR-112, FR-110

#### Scenario: The classes and functions are imported from the index
- **GIVEN** the module `src/engine/index.ts`
- **WHEN** a test imports `generate`, `hint`, `InvalidLevelError` and `GenerationRunOutError` from it
- **THEN** each import is defined, `generate` accepts a third argument (a level) and `hint` a second one (a ceiling), and none of `buildPuzzle`, `MAX_ATTEMPTS` and `solveByRules` is a property of the module

#### Scenario: The sentence function is imported from the index

- **GIVEN** the module `src/engine/index.ts`
- **WHEN** a test imports `hintSentence` from it
- **THEN** it is a function, `hint` accepts a third argument, and a fill result carries the fields of «A hint exposes the data of its sentence»

#### Scenario: A forced run-out is recognised by the exported class
- **GIVEN** a combination of N in 6 and 8, a level from 2 to 4 and a seed that needs more than one attempt (the search of «Running out raises the distinct error»), and the internal `buildPuzzle` with `maxAttempts` 1
- **WHEN** the builder runs and the caught error is tested against the classes imported from `src/engine/index.ts`
- **THEN** the error is an instance of the imported `GenerationRunOutError` and not an instance of the imported `InvalidLevelError`, `InvalidSizeError`, `InvalidSeedError` or `InvalidArgumentTypeError`

#### Scenario: A level error is recognised by the exported class
- **GIVEN** `generate(4, 1, 2)` and `generate(6, 1, 5)` called through the function imported from `src/engine/index.ts`
- **WHEN** each throws
- **THEN** each error is an instance of the imported `InvalidLevelError` and not of the imported `GenerationRunOutError`
