## MODIFIED Requirements

### Requirement: Reset button

The page SHALL offer a button `[data-action="reset"]` labelled «Скинути» (NFR-5). When the board has player entries, pressing it SHALL first ask for confirmation (FR-67) and reset only after «Так, почати»; on an untouched board it SHALL act at once, with no dialog, and change no cell text, no class and no message (FR-58). A board is untouched when no non-given cell holds a digit: none was ever entered, or every entry was cleared again by clicks, including a cell a hint filled and the player clicked back to empty (the hint sentence then stays, see «Hint message stays until the next hint or a new puzzle»). Resetting a board with entries SHALL set every non-given cell to empty, including cells filled by a hint, keep every given cell's text and `data-given` value, keep the current size (any of 4, 6 and 8) in `[data-board]`'s `data-size` and in the size control (`aria-checked` unchanged), keep the current level in the level control (`aria-checked` unchanged) and the summary button unchanged (FR-58, FR-92, FR-95), remove every `cell-violation` class that does not come from the givens themselves (the highlights are recomputed for the reset board), empty `[data-message="hint"]` and `[data-message="win"]`, remove `cell-hinted` (FR-66), and keep the board editable. Reset SHALL NOT call the seed source or the generator. It works after a win (the solved board has entries, so the confirmation is asked, A-29). Reset is size-independent: the scenarios that touch the board are run for each N in the table below, each with a fixture puzzle of size N. Undo and restoring a saved state are not part of reset (FR-47 and FR-46 are Future).

| N |
|---|
| 4 |
| 6 |
| 8 |

Traces: FR-58, FR-67, FR-66, FR-92, NFR-5

#### Scenario: Reset empties player cells and keeps givens and size

- **GIVEN** a mounted page with a fixture puzzle of size N, and the player has clicked several non-given cells and pressed the hint button once so that a hint filled a cell
- **WHEN** the player presses `[data-action="reset"]` and then `[data-confirm="yes"]`
- **THEN** every cell with `data-given="false"` shows empty text, and every cell with `data-given="true"` shows the same text and the same `data-given` value as before
- **AND** `[data-board]` has `data-size` equal to N, `aria-checked="true"` is still on the button of size N only, and no cell has `cell-hinted`

#### Scenario: Reset keeps the level

- **GIVEN** a mounted page with a fixture puzzle at the size and level of the row below, the level reached by a level press, and the player has made entries and pressed the hint button once so that a hint filled a cell

| Size | Level pressed before play |
|------|---------------------------|
| 4 | «Розминка» (the only level) |
| 6 | «Головоломка» |
| 8 | «Мозколамка» |

- **WHEN** the player presses `[data-action="reset"]` and then `[data-confirm="yes"]`
- **THEN** `aria-checked="true"` is still on the same level button only and on the same size button only, the summary has the same text as before the reset, and every non-given cell shows empty text
- **AND** no seed was taken and no generator call was made for the reset

#### Scenario: Reset clears highlights and the hint message

- **GIVEN** a mounted page with a fixture puzzle of size N where at least one cell has the class `cell-violation` because of the player's entries (the givens alone report no violation), and `[data-message="hint"]` shows a sentence
- **WHEN** the player presses `[data-action="reset"]` and then `[data-confirm="yes"]`
- **THEN** no cell has the class `cell-violation` and `[data-message="hint"]` has empty text content

#### Scenario: Reset after a win

- **GIVEN** a mounted page with a fixture puzzle of size N whose board the player has solved, so that `[data-message="win"]` shows the win text
- **WHEN** the player presses `[data-action="reset"]`, then `[data-confirm="yes"]`, and then clicks a non-given cell once
- **THEN** after the confirmation `[data-message="win"]` has empty text content
- **AND** after the click that cell shows «0»

#### Scenario: Reset takes no seed and calls no generator

- **GIVEN** a mounted page with a fixture puzzle of size N, an injected seed source and an injected generator that count their calls, with the counts read after mount
- **WHEN** the player presses `[data-action="reset"]` on the untouched board, then makes an entry and presses `[data-action="reset"]` and `[data-confirm="yes"]`, and then repeats the entry, the press and the confirmation once more
- **THEN** after each step the seed-source call count and the generator call count equal the counts read after mount

#### Scenario: Reset on an untouched board changes nothing and asks nothing

- **GIVEN** a mounted page with a fixture puzzle of size N and no player action, with the text and class list of every cell and the text of both message regions recorded
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** every cell has the same text and the same class list as recorded, and both message regions have the same text as recorded
- **AND** `showModal` was never called

#### Scenario: Reset on a board emptied again after a hint keeps the hint sentence

- **GIVEN** a mounted page with a fixture puzzle of size N on which the player pressed the hint button, the hint filled one cell, and the player clicked that cell back to empty, so no non-given cell holds a digit and `[data-message="hint"]` holds the hint sentence
- **AND** the text and class list of every cell and the text of both message regions are recorded
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** every cell has the same text and the same class list as recorded, and `[data-message="hint"]` still holds the same hint sentence
- **AND** `showModal` was never called

### Requirement: Confirmation before discarding player entries

«Нова головоломка», «Почати» and «Скинути» SHALL ask for confirmation only when the board has player entries (FR-67). A change of size or level is no longer an action of its own: it happens only through «Почати» (FR-101), and marking a size or a level asks for nothing (FR-100). A player entry is a non-given cell that is not empty; a cell filled by a hint counts as one (A-8); a board that was just solved has entries, so the confirmation is also asked after a win (A-29). The confirmation SHALL be a native `<dialog>` `[data-dialog="confirm"]`, created once at mount inside the page root, outside the board element and outside the sequence of «Page document order» (it follows the rules panel), closed at mount, and opened with `showModal()`. It SHALL hold the text «Почати заново? Ваші ходи на цьому полі буде втрачено.» ("Start over? Your moves on this board will be lost." in English mode, with the buttons "Yes, start over" and "Cancel", FR-111) and exactly two `<button type="button">`: `[data-confirm="yes"]` with the text «Так, почати» and `[data-confirm="no"]` with the text «Скасувати». «Так, почати» SHALL close the dialog (calling `close()`) and then perform the pending action with its full effect (for «Скинути», the reset of «Reset button» on a board with entries; for «Нова головоломка» and «Почати», the new puzzle). «Скасувати», and Escape (the dialog's `cancel` and `close` events with no button pressed), SHALL close the dialog and leave unchanged the board, the size and the level (`aria-checked`), the summary, the hint message, the win message, the highlights and `cell-hinted`; no seed is taken and the generator is not called. A cancelled action is dropped: it is never performed later. On a board with no player entries the action happens at once and `showModal()` is never called. When the pending action is the press of «Почати», the sheet is closed first and then the dialog opens, and «Скасувати» (which drops the pending action), Escape and «Так, почати» end with focus on the summary button (FR-98, see «Sheet and confirmation»). The pending action is the marked size and level taken at the press of «Почати». Reading rule: wherever another requirement of this capability says that pressing «Нова головоломка», changing the size, changing the level or pressing «Скинути» has an effect (for example «Highlighting follows every board change», «Hint message stays until the next hint or a new puzzle» and the size steps of «Board rendering and default size»), the effect happens when the action is performed: at once on a board without player entries, after «Так, почати» on a board with entries (except that «Скинути» on a board without player entries is performed as no change at all, see «Reset button»); a requested but unperformed action has no effect. The dialog SHALL have `aria-labelledby` naming the `id` of the element that holds its text (unique per mount), so assistive technology announces the question (A-20). When the page opens the dialog it SHALL move focus to «Скасувати» (after `showModal()`), so that the safe choice is the default and two key presses cannot discard the player's moves (A-20; the user's decision of 2026-10-06, review round 1). Where the dialog is drawn and its look are the design's (A-62; see «The confirmation dialog takes the design's size, place and paint»); its focus ring is NFR-13 and its pixels NFR-14 (neither is held any more; the user's word on the wave-2 folder audit, 2026-10-12).

Traces: FR-67, FR-42, FR-43, FR-58, FR-66, FR-90, FR-98, FR-100, FR-101, FR-111

#### Scenario: The dialog at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-dialog="confirm"]`
- **THEN** exactly one such `dialog` element exists in the root, it has no `open` attribute, it is not inside `[data-board]` or the header or the message area, and it follows the rules panel in document order
- **AND** its text includes «Почати заново? Ваші ходи на цьому полі буде втрачено.»
- **AND** it contains exactly two `button` elements of `type="button"`: `[data-confirm="yes"]` with the text «Так, почати» and `[data-confirm="no"]` with the text «Скасувати»
- **AND** the `showModal` spy has not been called

#### Scenario: The dialog is named by its question and opens on «Скасувати»

- **GIVEN** a mounted page with a fixture puzzle on which the player has clicked one non-given cell
- **WHEN** the test reads the dialog, and then the player presses «Нова головоломка»
- **THEN** the dialog's `aria-labelledby` names an element inside the dialog whose text is «Почати заново? Ваші ходи на цьому полі буде втрачено.», and two mounts give two different ids
- **AND** after the press the dialog is open and the focused element of the document is `[data-confirm="no"]`

#### Scenario: No player entries means no dialog

- **GIVEN** a mounted 6x6 fixture board with no player entries (only givens), the `showModal` and `close` methods of `HTMLDialogElement.prototype` installed as spies that set and remove the `open` attribute (jsdom has neither), and a counting seed source and a `generate` spy
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action | Expected effect at once |
|--------|-------------------------|
| presses «Нова головоломка» | a new puzzle of size 6 from the next seed |
| chooses «Поле 4×4» | a 4x4 board from the next seed, `aria-checked="true"` on «Поле 4×4» |
| chooses «Задачка» | a 6x6 board of level 2 from the next seed, `aria-checked="true"` on «Задачка» |
| presses «Скинути» | no cell, class or message changes |

- **THEN** the `showModal` spy was never called, the dialog has no `open` attribute, and the expected effect of the row happened

#### Scenario: A board with entries asks first and changes nothing yet

- **GIVEN** a mounted 6x6 fixture board on which the player has clicked one non-given cell to `1`, has pressed «Підказка» so that a hint filled another cell (`cell-hinted`) and a hint sentence is shown, with cells carrying `cell-violation`, and a counting seed source and a `generate` spy whose counts are read now
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| presses «Нова головоломка» |
| chooses «Поле 8×8» (the injected generator returns an 8x8 fixture) |
| chooses «Задачка» (the injected generator returns a 6x6 fixture) |
| presses «Скинути» |

- **THEN** `showModal` was called exactly once and the dialog has the `open` attribute
- **AND** every cell keeps its text, `[data-board]` keeps `data-size="6"`, `aria-checked="true"` stays on «Поле 6×6» and on «Розминка», `[data-message="hint"]` and `[data-message="win"]` keep their text, the set of `cell-violation` cells and the `cell-hinted` cell are unchanged
- **AND** the seed-source call count and the generator call count equal the counts read before the press

#### Scenario: «Так, почати» closes the dialog and then performs the action

- **GIVEN** the page of the previous scenario with the dialog open for each action of the table
- **WHEN** the player presses `[data-confirm="yes"]`

| Action pending | Expected effect |
|----------------|-----------------|
| «Нова головоломка» | a 6x6 board generated from the next seed (one seed taken, one generator call), no player entries |
| «Поле 8×8» | an 8x8 board (`data-size="8"`, 64 cells), `aria-checked="true"` on «Поле 8×8» only, one seed taken |
| «Задачка» | a 6x6 board generated from the next seed with level 2 (one seed taken, one generator call with level 2), `aria-checked="true"` on «Задачка» only, the summary reads `6×6 · Задачка` |
| «Скинути» | every non-given cell empty, every given kept, `data-size="6"`, no seed taken, no generator call |

- **THEN** the `close` spy was called once and the dialog has no `open` attribute
- **AND** the expected effect of the row happened, `[data-message="hint"]` and `[data-message="win"]` have empty text content, no cell has `cell-hinted`, and the `cell-violation` cells are exactly those the rule checker reports for the board shown

#### Scenario: «Скасувати» leaves everything unchanged

- **GIVEN** the page of the scenario «A board with entries asks first and changes nothing yet» with the dialog open for each action of that table
- **WHEN** the player presses `[data-confirm="no"]`
- **THEN** the `close` spy was called once and the dialog has no `open` attribute
- **AND** every cell keeps its text, `[data-board]` keeps `data-size="6"`, `aria-checked="true"` stays on «Поле 6×6» and on «Розминка», both messages keep their text, the set of `cell-violation` cells and the `cell-hinted` cell are unchanged
- **AND** the seed-source call count and the generator call count equal the counts read before the press, and `showModal` was called exactly once in all

#### Scenario: Escape leaves everything unchanged and drops the action

- **GIVEN** the page of the previous scenario with the dialog open after pressing «Нова головоломка»
- **WHEN** the test dispatches a `cancel` event and then a `close` event on the dialog (what a browser does for Escape), pressing no button
- **THEN** the board, the size, the messages, the highlights and `cell-hinted` are unchanged, and neither the seed source nor the generator was called again
- **AND** pressing «Нова головоломка» again opens the dialog a second time (`showModal` called twice in all) and pressing `[data-confirm="yes"]` then performs exactly one new puzzle (one seed taken)

#### Scenario: A hint-filled cell counts as a player entry

- **GIVEN** a mounted fixture board on which the player has only pressed «Підказка» once, so the one non-empty non-given cell was filled by the hint
- **WHEN** the player presses «Нова головоломка»
- **THEN** `showModal` was called once and the board is unchanged until `[data-confirm="yes"]` is pressed

#### Scenario: A solved board still asks (A-29)

- **GIVEN** a fixture puzzle whose solution the test knows, solved by clicks so that the win message is shown
- **WHEN** the player presses «Скинути», and in separate runs «Нова головоломка», the button of another size and the button of another level
- **THEN** each time `showModal` was called once, and the board and the win message are unchanged until `[data-confirm="yes"]` is pressed

#### Scenario: Entries that were cleared again do not count

- **GIVEN** a mounted fixture board on which the player clicked a non-given cell three times (it shows empty again) and clicked a given cell
- **WHEN** the player presses «Нова головоломка»
- **THEN** `showModal` was never called and a new puzzle was generated at once

#### Scenario: «Почати» asks, marking does not

- **GIVEN** a mounted 6x6 fixture board with player entries, the `showModal` spy, a counting seed source and a `generate` spy with the counts read now, and the sheet opened
- **WHEN** the player marks «Поле 8×8» and «Задачка» (two marking presses), and then presses «Почати»
- **THEN** after the two marking presses `showModal` was never called and the counts equal the counts read now
- **AND** after «Почати» `showModal` was called once, the dialog has the `open` attribute and the board is still 6x6 with its cell texts
- **AND** after `[data-confirm="yes"]` exactly one seed was taken and the generator was called once, with size 8 and level 2
