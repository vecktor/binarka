## ADDED Requirements

### Requirement: Rules block

The page SHALL show a rules block `[data-section="rules"]` inside the root, after `[data-board]` in document order, with the heading text «Правила» and exactly three `li` items, in this order: «Не більше двох однакових цифр поспіль у рядку чи стовпці.», «У кожному рядку та стовпці порівну нулів і одиниць.» and «Усі рядки різні, і всі стовпці різні.» (FR-57). The block is created once at mount outside the element that holds the board, so a new puzzle, a size change and a win leave exactly one block with the same heading and the same three texts. The texts are Ukrainian and contain no Latin letters (NFR-5). The block needs no script behaviour.

Traces: FR-57, NFR-5

#### Scenario: Rules block at mount

- **GIVEN** the page has just been mounted with a fixture puzzle
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** exactly one such element exists inside the root and it follows `[data-board]` in document order
- **AND** its heading text is «Правила» and it contains exactly three `li` items whose texts, in order, are those of this table, none of which contains a Latin letter

| Item | Text |
|------|------|
| 1 | Не більше двох однакових цифр поспіль у рядку чи стовпці. |
| 2 | У кожному рядку та стовпці порівну нулів і одиниць. |
| 3 | Усі рядки різні, і всі стовпці різні. |

#### Scenario: Rules block survives every board change

- **GIVEN** a mounted page with a fixture puzzle and the rules block read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 or to 8 (one run for each) |
| reaches a win |

- **THEN** after each action there is still exactly one `[data-section="rules"]`, it follows `[data-board]` in document order, and it has the same heading and the same three `li` texts as at mount

### Requirement: Reset button

The page SHALL offer a button `[data-action="reset"]` labelled «Скинути» (NFR-5). Pressing it SHALL set every non-given cell to empty, including cells filled by a hint, keep every given cell's text and `data-given` value, keep the current size (any of 4, 6 and 8) in `[data-board]`'s `data-size` and in the size selector, remove every `cell-violation` class that does not come from the givens themselves (the highlights are recomputed for the reset board), empty `[data-message="hint"]` and `[data-message="win"]`, and keep the board editable (FR-58). Reset SHALL NOT call the seed source or the generator. It works after a win and, on an untouched board, changes no cell text, no class and no message. Reset is size-independent: the scenarios that touch the board are run for each N in the table below, each with a fixture puzzle of size N. Undo and restoring a saved state are not part of reset (FR-47 and FR-46 are Future).

| N |
|---|
| 4 |
| 6 |
| 8 |

Traces: FR-58, NFR-5

#### Scenario: Reset empties player cells and keeps givens and size

- **GIVEN** a mounted page with a fixture puzzle of size N, and the player has clicked several non-given cells and pressed the hint button once so that a hint filled a cell
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** every cell with `data-given="false"` shows empty text, and every cell with `data-given="true"` shows the same text and the same `data-given` value as before
- **AND** `[data-board]` has `data-size` equal to N and the size selector still shows N

#### Scenario: Reset clears highlights and the hint message

- **GIVEN** a mounted page with a fixture puzzle of size N where at least one cell has the class `cell-violation` because of the player's entries (the givens alone report no violation), and `[data-message="hint"]` shows a sentence
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** no cell has the class `cell-violation` and `[data-message="hint"]` has empty text content

#### Scenario: Reset after a win

- **GIVEN** a mounted page with a fixture puzzle of size N whose board the player has solved, so that `[data-message="win"]` shows the win text
- **WHEN** the player presses `[data-action="reset"]`, and then clicks a non-given cell once
- **THEN** after the press `[data-message="win"]` has empty text content
- **AND** after the click that cell shows «0»

#### Scenario: Reset takes no seed and calls no generator

- **GIVEN** a mounted page with a fixture puzzle of size N, an injected seed source and an injected generator that count their calls, with the counts read after mount
- **WHEN** the player presses `[data-action="reset"]` once, and then two more times
- **THEN** after each press the seed-source call count and the generator call count equal the counts read after mount

#### Scenario: Reset on an untouched board changes nothing

- **GIVEN** a mounted page with a fixture puzzle of size N and no player action, with the text and class list of every cell and the text of both message regions recorded
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** every cell has the same text and the same class list as recorded, and both message regions have the same text as recorded
