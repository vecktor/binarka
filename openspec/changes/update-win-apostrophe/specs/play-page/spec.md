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

- **GIVEN** a solved board with the win message shown, reached by either route: the final click of the scenario «Final click solves the board», or the final hint of the scenario «Final hint solves the board» (the checks below hold for both)
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

### Requirement: The hint and win messages are status regions

The page SHALL give `[data-message="hint"]` and `[data-message="win"]` `role="status"`, SHALL have both elements in the root from the first render with empty text content until they have a message, and SHALL change only their text content afterwards: the same two elements stay in the page across hint presses, new puzzles, size changes and wins (a live region that is replaced is not announced) (FR-63). The page SHALL NOT move DOM focus to either region, and SHALL NOT give them a `tabindex`. There are exactly two elements with `role="status"` in the page: the idle line `[data-message="idle"]` has no `role` attribute, because it is fixed text (FR-71). While the two regions are empty they SHALL stay rendered: no rule gives a message region `display: none` or `visibility: hidden`, so that a screen reader announces the first message that arrives (FR-63). The announcement itself is a screen-reader behaviour that is not tested (A-28).

Traces: FR-63, FR-40, FR-41, FR-71

#### Scenario: Present, empty and typed at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="hint"]` and `[data-message="win"]`
- **THEN** both exist, have `role="status"`, have empty text content and no `tabindex` attribute
- **AND** the root holds exactly two elements with `role="status"`

#### Scenario: The same elements carry every message

- **GIVEN** a mounted page, with the two region elements remembered by the test
- **WHEN** the player presses the hint button, then clicks a cell, then presses the new puzzle button and confirms «Так, почати» (the board has entries, FR-67), then selects 4×4, then solves a fixture board so the win message shows
- **THEN** after each step `[data-message="hint"]` and `[data-message="win"]` are the same element objects as at mount, still connected to the root, still `role="status"`, and the hint region shows the engine sentence and the win region shows «Вітаємо, головоломку розвʼязано!» (apostrophe U+02BC) when the earlier requirements say so

#### Scenario: Focus never moves to a message

- **GIVEN** a mounted page where the test gave DOM focus to `[data-action="hint"]`
- **WHEN** the player presses the hint button and the hint text appears
- **THEN** `document.activeElement` is still `[data-action="hint"]` and is not a status region
- **AND** on a fixture board whose single hint fill solves it, after that hint press the win message appears and `document.activeElement` is still `[data-action="hint"]`

#### Scenario: The idle line has no role

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="idle"]`
- **THEN** it has no `role` attribute, and still holds the idle text of «Idle line»

#### Scenario: Empty status regions stay rendered

- **GIVEN** the text of `src/ui/style.css` with every `var(--color-x)` replaced by its `:root` value, injected into a `<style>` element of the jsdom document, and the page just mounted, so that `[data-message="hint"]` and `[data-message="win"]` are empty
- **WHEN** the test reads `getComputedStyle` of each of the two regions, and the declarations of every rule in the file whose selector subject (its last compound selector) is `.message`, `.message-win`, `[data-message='hint']` or `[data-message='win']`, with or without a pseudo-class such as `:empty`
- **THEN** neither region computes `display: none`, and neither computes `visibility` `hidden` or `collapse`
- **AND** none of those rules declares `display: none` or `visibility: hidden`

#### Scenario: A click that wins leaves the focus on the cell that had it

- **GIVEN** a fixture board with every cell holding the solution except one non-given cell, and the test has given DOM focus to that cell
- **WHEN** the player clicks that cell until it shows the solution digit and the win message appears
- **THEN** `document.activeElement` is still that cell (FR-60), not a status region
