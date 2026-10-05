## MODIFIED Requirements

### Requirement: Win message when solved

The page SHALL show the Ukrainian win message «Вітаємо, головоломку розвʼязано!» in `[data-message="win"]` when the rule checker recognises the board as solved after a board change, whether the change is a click or a hint fill. The apostrophe in «розвʼязано» SHALL be the modifier letter ʼ (U+02BC), not the ASCII apostrophe U+0027 and not the right single quotation mark U+2019; an equality check on the win message compares against the code point U+02BC exactly (FR-41). While the board is not solved the win region SHALL have empty text content.

Traces: FR-41

#### Scenario: Final click solves the board

- **GIVEN** a fixture puzzle whose solution the test knows, with every cell filled with the solution except one non-given cell that shows another value (or is empty)
- **WHEN** the player clicks that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розвʼязано!» (apostrophe U+02BC)

#### Scenario: Final hint solves the board

- **GIVEN** a fixture puzzle whose solution the test knows, with exactly one cell empty, every other cell holding the solution digit, and the hint engine targeting that cell with the solution digit
- **WHEN** the player presses the hint button
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розвʼязано!» (apostrophe U+02BC)

#### Scenario: The apostrophe is U+02BC and no other character

- **GIVEN** a solved board with the win message shown
- **WHEN** the test reads the text of `[data-message="win"]` code point by code point
- **THEN** the text equals `Вітаємо, головоломку розв` + U+02BC + `язано!`
- **AND** the code point right after «розв» is U+02BC (its length in UTF-16 code units is 1)
- **AND** the text contains no U+0027 and no U+2019 anywhere
- **AND** the text contains Cyrillic letters and no Latin letter (`/[A-Za-z]/` and `/\p{Script=Latin}/u` do not match it), so NFR-5 still holds

#### Scenario: Full board with a violation is not a win

- **GIVEN** a board with every cell filled and at least one `cell-violation` cell
- **WHEN** the board is read
- **THEN** `[data-message="win"]` has empty text content

#### Scenario: Board stays editable after a win

- **GIVEN** `[data-message="win"]` shows the win message
- **WHEN** the player clicks a non-given cell
- **THEN** the cell changes to the next value in the cycle (the board is not locked)
- **AND** `[data-message="win"]` has empty text content, because the board is no longer solved (the puzzle has exactly one solution, so any changed cell leaves the board unsolved)
