## ADDED Requirements

### Requirement: Language control

The settings panel SHALL hold, below the theme control and above its close button, a visible plain-text label «Мова» (an element that is not a `label`, with no `for`) and a language control `[data-control="language"]` (FR-107, FR-55): an element with `role="radiogroup"` and the accessible name «Мова» ("Language" in English mode, `aria-label`), holding exactly two `<button type="button" role="radio">` elements in this order: «Українська» with `lang="uk"` and "English" with `lang="en"`, each named in its own language in both modes (Q5), with the attribute `data-language-option` equal to `uk` and `en`. The option of the page language SHALL have `aria-checked="true"` and the other `aria-checked="false"`. With nothing valid stored the page language is Ukrainian and «Українська» is checked (FR-114). The page never reads `navigator.language`, `navigator.languages` or `Accept-Language`: it is Ukrainian unless `en` is stored (A-49). The control and its options carry no `id`. The rules of «Common rules for the theme and language options» apply to its options.

Traces: FR-107, FR-55, FR-117, NFR-9

#### Scenario: Language control structure and default

- **GIVEN** the page has just been mounted with `localStorage` empty and `navigator.language` stubbed to `en-US`
- **WHEN** the test reads `[data-control="language"]`
- **THEN** exactly one such element exists, inside `[data-section="settings"]` after `[data-control="theme"]`, it has `role="radiogroup"` and `aria-label` equal to «Мова», no `aria-labelledby` and no `id`, and it contains exactly two `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Українська» and "English", with `lang` `uk` and `en` and `data-language-option` `uk` and `en`
- **AND** the first button has `aria-checked="true"` and the second `aria-checked="false"`, and a plain-text element «Мова» that is not a `label` element immediately precedes the control

#### Scenario: Each language is named in its own language in both modes

- **GIVEN** the page in Ukrainian mode, and again after the player presses "English"
- **WHEN** the test reads the texts of the two options
- **THEN** they are «Українська» and "English" in both modes, and the group name is «Мова» in Ukrainian mode and "Language" in English mode

#### Scenario: The stored language is checked at mount

- **GIVEN** `localStorage` holds `binarka.language` = `en` before the page is mounted
- **WHEN** the page is mounted
- **THEN** `aria-checked="true"` is on "English" only, and `<html>` has `lang="en"`

### Requirement: A language press re-renders in place and changes nothing else

A press on the language option that is not shown SHALL set the page language, store it (see «Stored preferences») and re-render every page text and accessible name in the new language, in place (FR-108): the header title, every button label, the summary text and its hidden prefix, the sheet's label, the group names and the visible labels, the size labels, the level names and descriptions, the 4×4 reason, the rules and the techniques, the idle line, the confirmation texts, the board's `aria-label`, every cell's `aria-label`, the theme and language texts, the settings texts, a hint message on screen (see «A hint message on screen re-renders as the same hint») and a win message on screen. The board, the givens, the entries, the highlights, `cell-hinted`, the size, the level, the marked choice of the setup sheet (FR-100) and DOM focus (FR-59) stay; after the switch the focused element is the same element as before. It takes no seed, calls no generator and asks for no confirmation. A confirmation dialog is modal, so no language press can happen while a pending action exists (A-55). The press itself opens and closes nothing; a `popover="auto"` light dismiss caused by a click outside an open sheet or panel is the browser's (A-55). A press on the language already shown changes nothing and stores nothing. A re-render may change the text of a non-empty `role="status"` region, so a screen reader may announce it again in the new language; this is accepted and not tested (A-53, A-28).

Traces: FR-108, FR-118, FR-100, FR-59, FR-55

#### Scenario: A language press re-renders every text

- **GIVEN** a mounted 6×6 board in Ukrainian mode with player entries, the sheet and the settings panel not open, and the test focus on the option "English" after the settings panel is opened through the stubbed `showPopover()`
- **WHEN** the player presses "English"
- **THEN** the texts of the table of «English page text» appear in place of the Ukrainian ones, the board's `aria-label` is "Grid 6×6" and the first cell's is "Row 1, column 1, empty" (or the digit form), `document.title` is "Binarka", and `aria-checked="true"` is on "English" only
- **AND** `document.activeElement` is still the option "English"

#### Scenario: A language press changes nothing else

- **GIVEN** a mounted 6×6 board at «Задачка» with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted`, some cells with `cell-violation`, the sheet marked with «Поле 8×8» and «Мозколамка», a counting seed source, a `generate` spy and the `showModal` spy with the counts read now
- **WHEN** the player presses "English"
- **THEN** every cell keeps its text, its `data-given` and its class list (`cell-violation` and `cell-hinted` included), the size and the level are unchanged (the summary reads `6×6 · Teaser`), and `aria-checked="true"` is still on «Поле 8×8» and «Мозколамка» as "Grid 8×8" and "Brain-twister"
- **AND** `showModal` was never called and the seed-source and generator call counts equal the counts read now

#### Scenario: A switch never brings back a cleared message

- **GIVEN** a hint shown on a board, then «Нова головоломка» confirmed (the hint region is empty), and in another run a win shown, then a click on a non-given cell (the win region is empty)
- **WHEN** the player presses "English"
- **THEN** both regions are still empty after the switch

#### Scenario: The 4×4 state survives a switch

- **GIVEN** the sheet opened with «Поле 4×4» marked, so the three levels 2 to 4 have `aria-disabled="true"` and the reason is shown
- **WHEN** the player presses "English" in the settings panel
- **THEN** the reason reads `The 4×4 grid has only the “Warm-up” level.`, the three levels still have `aria-disabled="true"`, and `aria-checked="true"` is still on "Grid 4×4" and "Warm-up"; at a marked size of 6×6 or 8×8 the reason is still hidden with empty text

#### Scenario: Pressing the language already shown changes nothing

- **GIVEN** a mounted page with `binarka.language` = `en` stored, and a `setItem` spy
- **WHEN** the player presses "English"
- **THEN** `setItem` was not called and the texts are unchanged

#### Scenario: Switching back restores the Ukrainian texts byte for byte

- **GIVEN** the Ukrainian texts of the page read at mount
- **WHEN** the player presses "English" and then «Українська»
- **THEN** every text and accessible name equals the one read at mount

### Requirement: Document language and title

`<html lang>` SHALL be `"uk"` in Ukrainian mode and `"en"` in English mode, set at load (see «Preferences are applied before the first paint») and on every language switch (FR-109, NFR-9: WCAG 3.1.1 Language of Page). `document.title` SHALL be «Бінарка» in Ukrainian mode and "Binarka" in English mode (Q3), and the heading in the header follows the same choice. The two language options carry their own `lang` (WCAG 3.1.2 Language of Parts, A-52); no other element carries a `lang` different from `<html lang>`.

Traces: FR-109, NFR-9, NFR-5

#### Scenario: The attribute and the title follow the language

- **GIVEN** a page mounted with `localStorage` empty
- **WHEN** the test reads `<html lang>`, `document.title` and the heading in the header, then the player presses "English" and the test reads them again
- **THEN** they are `uk`, «Бінарка», «Бінарка», and then `en`, "Binarka", "Binarka"

#### Scenario: The value is one of the two codes

- **GIVEN** a page mounted with each of `localStorage` empty, `binarka.language` = `en`, `uk` and a bad value
- **WHEN** the test reads `<html lang>`
- **THEN** it is `uk`, `en`, `uk` and `uk`, and in every run it matches the page language

#### Scenario: Only the two language options carry a different lang

- **GIVEN** the page in each mode
- **WHEN** the test lists the elements of the root with a `lang` attribute different from `<html lang>`
- **THEN** they are exactly the language option of the other language

### Requirement: A hint message on screen re-renders as the same hint

After a language switch, a hint message on screen SHALL show the sentence of the **same** hint (the same technique, line, digit and cell, or the same no-rule or broken-rule sentence) in the new language (FR-110, FR-56). The page SHALL NOT compute a new hint against the current board: the hint already filled its cell, and the message stays across cell clicks (see «Hint message stays until the next hint or a new puzzle»). The page therefore keeps the data of the hint on screen (or both sentences) until the message is cleared. How the page gets the other sentence is left to the design (`design.md`); the engine stays DOM-free (TC-7) and never reads storage. A win message on screen re-renders in the new language too (see «Win message when solved»). An empty message region stays empty.

Traces: FR-110, FR-56, FR-40, FR-41

#### Scenario: A hint sentence switches language and stays the same hint

- **GIVEN** a fixture board on which `hint(board, 4, 'uk')` fills a cell with a pair sentence, the player pressed «Підказка», and `[data-message="hint"]` shows that Ukrainian sentence
- **WHEN** the player presses "English"
- **THEN** `[data-message="hint"]` shows exactly the English sentence the engine returns for that same hint on the board as it was before the fill (`hint(boardBefore, 4, 'en')`), the filled cell keeps its text and `cell-hinted`, and no other cell changed

#### Scenario: It survives a cell click and a second switch

- **GIVEN** the page of the previous scenario in English mode
- **WHEN** the player clicks a non-given cell, and then presses «Українська»
- **THEN** after the click `[data-message="hint"]` kept its English sentence, and after the switch it shows the original Ukrainian sentence byte for byte

#### Scenario: The no-rule and broken-rule sentences switch too

- **GIVEN** a board on which the hint is the no-rule sentence, and another on which it is the broken-rule sentence, each shown after a hint press
- **WHEN** the player presses "English"
- **THEN** the region shows "None of the rules points to a next move right now." and "First fix the rule break highlighted on the board." respectively, and no cell changed

#### Scenario: The win message and empty regions

- **GIVEN** a fixture board solved so that `[data-message="win"]` shows the win text, and `[data-message="hint"]` empty
- **WHEN** the player presses "English"
- **THEN** the win region shows exactly "Congratulations, puzzle solved!" and the hint region is still empty

### Requirement: Page text is per mode

In Ukrainian mode every text the page shows or exposes SHALL contain Cyrillic letters and no Latin letters, and in English mode every such text SHALL contain Latin letters and no Cyrillic letters (NFR-5 per mode, FR-111): the title in the header, every label and button (the start button, the settings button and every text of the theme and language controls included), the size, level, summary and sheet texts, the rules and the idle line, the confirmation texts, the win message, `document.title` ("Binarka" in English mode) and every `aria-label`, `title`, `placeholder`, `alt` and `label` attribute. Hint sentences follow the same rule for their language. **One exception:** each language option is named in its own language and carries its own `lang` attribute; the scan skips the text and the attributes of an element whose own `lang` differs from `<html lang>`, and nothing else is exempt (A-52). Digits, «×», «·» and «▾» are letters of neither script. Text inside an element with `aria-hidden="true"` stays out of the scan and holds no letter at all. The digits shown in the cells are puzzle content and are not collected.

Traces: NFR-5, FR-111, FR-107, FR-109

#### Scenario: English mode has Latin texts and no Cyrillic

- **GIVEN** the page mounted with `binarka.language` = `en`
- **WHEN** the test collects every non-whitespace text node under the root (not the text of `[data-cell]` elements and not the text of `aria-hidden` elements), `document.title`, and the values of `aria-label`, `title`, `placeholder` and `alt` on every element and of `label` on every `option` and `optgroup`, and skips the elements whose own `lang` differs from `<html lang>`
- **THEN** every collected text matches `/[A-Za-z]/` or consists of digits and the signs «×» and «·» only, and none matches `/\p{Script=Cyrillic}/u`
- **AND** the only skipped element is the option «Українська» (in Ukrainian mode the only skipped element is the option "English", see the next scenario)

#### Scenario: Ukrainian mode keeps Cyrillic texts and no Latin

- **GIVEN** the page mounted with `localStorage` empty
- **WHEN** the test collects the same texts with the same exception
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` or consists of digits and the signs «×», «·» and «▾» only, and none matches `/[A-Za-z]/`

#### Scenario: Both modes at every size and after a switch

- **GIVEN** a page that shows 4×4, 6×6 and 8×8 boards in turn in each mode, and a page switched from one mode to the other with the settings panel
- **WHEN** the test collects the board names and the 4×4, 6×6 and 8×8 cell names
- **THEN** each name matches `/^Grid [468]×[468]$/` and `/^Row [1-8], column [1-8], (empty|0|1)(, given|, hinted)?$/` in English mode and the Ukrainian forms in Ukrainian mode, and none contains a letter of the other script

### Requirement: English page text

Every Ukrainian page string of `src/ui/strings.ts` SHALL have an English counterpart in the table below (FR-111, FR-94, A-54: the wording is the appendix of the signed amendment, taken as final by autonomy-log row 119 and refined only by the eval judge and the reviewers). `src/ui/strings.ts` keeps its existing Ukrainian export names and shapes unchanged (named constants, arrays, nested objects and the functions `sizeLabel`, `cellLabel` and `summaryText`); the English texts are a second table of the same shape (for example `EN`) with the same functions, and a language-keyed accessor picks one of the two. A parity test flattens the string leaves of both tables, compares the two key sets, and calls every format function with sample arguments in both languages. No file under `src/ui/` other than `src/ui/strings.ts`, and no `src/main.ts`, holds a Cyrillic character. No English page text or English hint sentence contains U+0027 or U+02BC; if an English text ever needs an apostrophe it uses U+2019 (Q4). The U+02BC rule of FR-41 is a Ukrainian spelling rule and applies to the Ukrainian text only. **Reading rule:** wherever another requirement or scenario of this capability quotes a Ukrainian text, it describes Ukrainian mode, the default, and the English counterpart of the table applies in English mode; a scenario that says "English mode" sets the language by pressing "English" in the settings panel or by storing `binarka.language` = `en` before the mount. Digits, «×», «·» and the ordinary spaces are the same in both modes.

| Ukrainian | English |
|---|---|
| Бінарка | Binarka |
| Підказка / Скинути / Нова головоломка | Hint / Reset / New puzzle |
| Правила / Зрозуміло | Rules / Got it |
| Розмір поля / Поле N×N | Grid size / Grid N×N |
| Почати заново? Ваші ходи на цьому полі буде втрачено. | Start over? Your moves on this board will be lost. |
| Так, почати / Скасувати | Yes, start over / Cancel |
| Рядок R, стовпець C, порожньо / , задано / , підказка | Row R, column C, empty / , given / , hinted |
| Не більше двох однакових цифр поспіль у рядку чи стовпці. | No more than two equal digits side by side in a row or column. |
| У кожному рядку та стовпці порівну нулів і одиниць. | Every row and every column has as many zeros as ones. |
| Усі рядки різні, і всі стовпці різні. | All rows are different, and all columns are different. |
| Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі. | Press the cells to place 0 and 1. For the rules, use the “Rules” button at the top. |
| Вітаємо, головоломку розвʼязано! | Congratulations, puzzle solved! |
| Поле і складність: / Поле і складність / Закрити / Почати | Grid and difficulty: / Grid and difficulty / Close / Start |
| Складність | Difficulty |
| Розминка / Задачка / Головоломка / Мозколамка | Warm-up / Teaser / Puzzler / Brain-twister |
| Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр. | Three simple rules are enough: pairs, gaps between equal digits and counting. |
| Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць. | Also count where the remaining zeros or ones can still fit in a line. |
| Додатково треба порівнювати рядки і стовпці: двох однакових не буває. | Also compare rows and columns: no two of them can be the same. |
| Додатково треба пробувати хід наперед: якщо правило порушиться, тут інша цифра. | Also try a move ahead: if a rule breaks, the other digit goes here. |
| Для поля 4×4 є лише рівень «Розминка». | The 4×4 grid has only the “Warm-up” level. |
| Складніші прийоми | Harder techniques |
| Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра. | Line balance: if a line has room for only one more 0 or only one more 1, and putting it in a cell would make three equal digits side by side, that cell holds the other digit. |
| Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього. | Matching lines: if a line matches a complete line everywhere except two cells, those two cells are the opposite of it. |
| Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша. | Look ahead: imagine a digit in a cell; if a rule breaks within a few steps, the cell holds the other digit. |
| Налаштування / Тема / Світла / Темна / Як у системі | Settings / Theme / Light / Dark / System |
| Мова / Українська / English | Language / Українська / English (each option in its own language) |

Traces: FR-111, FR-94, FR-55, NFR-5

#### Scenario: Every Ukrainian string has an English counterpart with the same key

- **GIVEN** the exports of `src/ui/strings.ts`
- **WHEN** the test flattens the string leaves of the Ukrainian and the English table, compares the two key sets, and calls `sizeLabel`, `cellLabel` and `summaryText` with sample arguments in both languages
- **THEN** the two key sets are equal, the Ukrainian outputs equal those of the existing exports, and every English value is a non-empty string that matches `/[A-Za-z]/` and not `/\p{Script=Cyrillic}/u`, except the option name «Українська»

#### Scenario: The English page at mount

- **GIVEN** the page mounted with `binarka.language` = `en`
- **WHEN** the test reads the header, the buttons, the idle line, the rules panel, the sheet and the settings panel
- **THEN** their texts are those of the English column of the table: the title "Binarka", the buttons "Rules", "Hint", "Reset", "New puzzle", "Start", the sheet label "Grid and difficulty", the summary `Grid and difficulty: 6×6 · Warm-up` (the hidden prefix, then the visible text), the group names "Grid size", "Difficulty", "Theme", "Language", the options "Grid 4×4", "Grid 6×6", "Grid 8×8", the four level names and descriptions, the rules and techniques texts, and the close texts "Close" and "Got it"

#### Scenario: The English idle line keeps its non-breaking spaces

- **GIVEN** the page in English mode
- **WHEN** the test reads the text content of `[data-message="idle"]`
- **THEN** it equals the JavaScript string `'Press the cells to place 0\u00A0and\u00A01. For the rules, use the “Rules” button at the top.'`, and it contains exactly two U+00A0 characters

#### Scenario: The English win message and the confirmation

- **GIVEN** the page in English mode, a solved board, and a board with player entries
- **WHEN** the test reads the win message and presses "New puzzle"
- **THEN** the win text is exactly "Congratulations, puzzle solved!", the dialog text is "Start over? Your moves on this board will be lost.", and its buttons read "Yes, start over" and "Cancel"

#### Scenario: No English text contains an apostrophe

- **GIVEN** every English value of `src/ui/strings.ts`
- **WHEN** the test searches them for U+0027 and U+02BC
- **THEN** there is no match

### Requirement: English mode keeps the phone page on one screen

The built page in English mode SHALL fit the board, the buttons and the message area on one screen at 375×812 and 6×6 in the default, hint and win states without vertical scroll (NFR-10, FR-108), where the hint state shows the longest English hint sentence, a line-balance fill of about 140 characters, on a board that the test reaches by a seed and level that a search step finds (the page seeds `Math.random`, `e2e/helpers.ts`, so the seed is fixed there) and that the test asserts to be a balance fill. The real-browser check `e2e/nfr-10-fit.spec.ts` (`npm run test:e2e`) gains these English samples; the coverage is `sampled` (one viewport, three states), never continuum, and the Ukrainian samples stay as they are.

Traces: NFR-10, FR-108

#### Scenario: Default, hint and win states fit in English

- **GIVEN** the built page open in Chromium at 375×812 with `binarka.language` = `en` set by `addInitScript`, at 6×6, in the default state, after a hint press on the board of the searched seed and level whose first hint at ceiling 4 is a line-balance fill (the test asserts that the shown sentence contains "has room for only one more"), and after a win
- **WHEN** `e2e/nfr-10-fit.spec.ts` measures the page
- **THEN** in all three states the board, the buttons and the message area fit without vertical scroll, and the buttons hold still when a message appears

### Requirement: English labels meet the touch-target floor

In English mode the touch-target floor of NFR-12 SHALL hold for every control the probe `e2e/nfr-12-targets.spec.ts` measures: at all eight sampled viewports, with the longer English labels (they may wrap at 320 px), every control is at least 44×44 CSS px, and so are the language options with the settings panel open (NFR-12, FR-107, FR-117). The stylesheet gives the language options the `min-height` of at least `2.75rem` that the theme options have (see «The theme options meet the touch-target floor»). The sampled viewports are not continuum coverage.

Traces: NFR-12, FR-107, FR-117

#### Scenario: The language options declare a 44 px minimum height

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of the two language options
- **THEN** each value is at least 44 px

#### Scenario: Measured in a real browser in English

- **GIVEN** the built page in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts` with `binarka.language` = `en` set by `addInitScript`, and the settings panel open
- **WHEN** the probe measures the controls of the page, the sheet and the panel
- **THEN** each is at least 44 px wide and at least 44 px tall, and the spec reports no line for a measured control below 44×44

### Requirement: The accessibility sweep covers English mode

The real-browser accessibility sweep `e2e/nfr-13-a11y.spec.ts` (`npm run check:a11y`) SHALL include English mode (the default state and the hint state) and the language control focused from the keyboard (NFR-13, FR-107, FR-109). In every state axe-core SHALL report no violation, and the rules `html-has-lang`, `html-lang-valid` and `valid-lang` SHALL be among the rules that run and pass. The coverage is `sampled`, never continuum; the escalation path for English labels at 320 px is a 1 px-step width sweep from 320 to 400 px in English with the settings panel open, run before G2.

Traces: NFR-13, FR-107, FR-109

#### Scenario: English states pass the sweep

- **GIVEN** the built page in Chromium with `binarka.language` = `en` set by `addInitScript`, in the default state and after a hint press
- **WHEN** the sweep runs axe-core
- **THEN** axe reports no violation, and `html-has-lang`, `html-lang-valid` and `valid-lang` are in the list of passed rules

#### Scenario: The focused language option shows an indicator

- **GIVEN** the page with focus moved to a language option by Tab with the settings panel open
- **WHEN** the sweep reads the computed outline of the focused option
- **THEN** its outline style is not `none` and its outline width is at least 2px

## MODIFIED Requirements

### Requirement: Win message when solved

In Ukrainian mode the page SHALL show the win message «Вітаємо, головоломку розвʼязано!» in `[data-message="win"]` when the rule checker recognises the board as solved after a board change, whether the change is a click or a hint fill. The apostrophe in «розвʼязано» SHALL be the modifier letter ʼ (U+02BC), not the ASCII apostrophe U+0027 and not the right single quotation mark U+2019; an equality check on the win message compares against the code point U+02BC exactly (FR-41). In English mode the win message SHALL be exactly "Congratulations, puzzle solved!" (FR-41, Q4): the U+02BC rule is a Ukrainian spelling rule and applies to the Ukrainian text only, and no English page text or hint sentence contains U+0027 or U+02BC. While the board is not solved the win region SHALL have empty text content.

Traces: FR-41, FR-111

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

#### Scenario: The English win message

- **GIVEN** a fixture puzzle whose solution the test knows, with every cell filled with the solution except one non-given cell, and the page in English mode
- **WHEN** the player clicks that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text "Congratulations, puzzle solved!", it contains Latin letters and no Cyrillic letter, and no U+0027, U+02BC or U+2019

### Requirement: Hint button shows the engine's sentence

The page SHALL, when the hint button is pressed, show the sentence the hint engine returns in the page language (`hint(board, 4, language)`, FR-112) in `[data-message="hint"]`, including the sentence for "no rule applies" and the sentence for "the board breaks a rule", in which cases no cell is filled. The page SHALL NOT alter or rephrase the sentence.

Traces: FR-40, FR-56, FR-110

#### Scenario: Sentence shown with a fill

- **GIVEN** a board on which the hint engine returns a target cell and a sentence
- **WHEN** the player presses the hint button
- **THEN** the text content of `[data-message="hint"]` equals that sentence

#### Scenario: Sentence in English mode

- **GIVEN** a board on which the hint engine returns a target cell, and the page in English mode
- **WHEN** the player presses the hint button
- **THEN** the text content of `[data-message="hint"]` equals the English sentence of `hint(board, 4, 'en')` for that board, unchanged, and contains no Cyrillic letter

#### Scenario: Board breaks a rule

- **GIVEN** a board where at least one cell has `cell-violation`
- **WHEN** the player presses the hint button
- **THEN** `[data-message="hint"]` shows the sentence the hint engine returns for a board that breaks a rule
- **AND** no cell changed text

#### Scenario: No rule applies

- **GIVEN** a rule-clean board on which the hint engine returns the "no rule applies" sentence
- **WHEN** the player presses the hint button
- **THEN** `[data-message="hint"]` shows that sentence and no cell changed text

#### Scenario: Second press replaces the sentence

- **GIVEN** `[data-message="hint"]` shows the sentence from a first press
- **WHEN** the player presses the hint button again
- **THEN** `[data-message="hint"]` shows only the sentence for the second press, not both

#### Scenario: Initial state has no hint message

- **GIVEN** the page has just been mounted
- **WHEN** no button has been pressed
- **THEN** `[data-message="hint"]` has empty text content

### Requirement: Seed is chosen outside the engine, injectable and not shown

The page SHALL obtain the seed for each puzzle from a seed source outside `src/engine/`, calling it exactly once for each generation attempt (the mount, each performed press of the new puzzle button and each performed press of «Почати», including an attempt whose generator call throws), and at no other time. One performed action makes one attempt, or up to three when each earlier attempt of it ended in a run-out of the generator (FR-88, A-38, see «Page retry on a run-out»), so «one seed per action» holds only when the first seed succeeds. A seed is never taken for a press that only marks a size or a level (FR-73, FR-100), for a press of a level that is unavailable at 4×4 (FR-91), for a requested action that the player cancelled (FR-67) and never for reset; «Почати» is never a no-op (FR-101), so even a press of «Почати» with the marked choice equal to the board shown takes a seed. It SHALL accept an injected seed source (contract in the DOM contract section) so tests are deterministic, and MUST NOT display the seed anywhere on the page, including in locale-formatted or separator-split form (in either language). When no seed source is injected, the default source SHALL give a different seed on each call (no two consecutive calls return the same seed) and every seed it returns SHALL be an integer from 0 to 2^31 - 1 inclusive. That range is the seed domain pinned by FR-51 and A-25.

Traces: FR-31, FR-42, FR-43, FR-51, FR-67, FR-73, FR-88, FR-100, FR-101

#### Scenario: Injected seed gives a reproducible page

- **GIVEN** two pages mounted with seed sources that both return 42, using the real engine generator
- **WHEN** both have rendered
- **THEN** their cells have identical `data-given` values and identical text

#### Scenario: Default seed source gives new seeds in its domain

- **GIVEN** the page is mounted without an injected seed source and with an injected `generate` spy that records each seed and returns a fixture puzzle
- **WHEN** the new puzzle button is pressed 9 times (the boards have no entries), so the spy has recorded 10 seeds in all
- **THEN** every recorded seed is an integer from 0 to 2147483647 inclusive
- **AND** no two consecutive recorded seeds are equal (so a constant default source such as always 1 fails)
- **AND** no error is thrown

#### Scenario: Default seed source with the real generator

- **GIVEN** the page is mounted without an injected seed source and without an injected `generate`
- **WHEN** the page has rendered
- **THEN** a 6×6 board is rendered and no error is thrown

#### Scenario: Seed is not shown

- **GIVEN** the page is mounted with a seed source returning 987654
- **WHEN** the test inspects every text node under the page root, `document.title`, and every attribute value of every element in the root, each as a separate string
- **THEN** none of those strings contains `987654`, none contains `Intl.NumberFormat('uk-UA').format(987654)` or `Intl.NumberFormat('en').format(987654)`, and none matches `/9\D?8\D?7\D?6\D?5\D?4/` (this covers `987 654` with a space, NBSP or narrow NBSP, `987,654` and `987.654`)

#### Scenario: Seed is not shown in English mode

- **GIVEN** the page in English mode mounted with a seed source returning 987654
- **WHEN** the test inspects every text node, `document.title` and every attribute value of every element in the root, each as a separate string
- **THEN** none of those strings contains `987654`, `987,654` or `987 654`, and none matches `/9\D?8\D?7\D?6\D?5\D?4/`

#### Scenario: Seed calls follow the puzzles generated

- **GIVEN** a counting seed source returning 1, 2, 3 and so on, and a `generate` spy
- **WHEN** the page is mounted, the new puzzle button is pressed once, the player chooses «Поле 4×4», opens the sheet and presses «Поле 4×4» again (a marking press of the size already marked, then «Закрити»), and chooses «Поле 8×8» (every board has no entries)
- **THEN** the seed source was called exactly four times and the spy recorded the seeds 1, 2, 3 and 4 in this order, paired with the sizes 6, 6, 4 and 8

#### Scenario: A cancelled or no-op action takes no seed

- **GIVEN** a counting seed source and a `generate` spy, and a mounted board with player entries, with the counts read now
- **WHEN** the player presses «Нова головоломка» and then `[data-confirm="no"]`, chooses «Поле 8×8» (the confirmation is asked) and presses `[data-confirm="no"]`, chooses «Задачка» and presses `[data-confirm="no"]`, presses «Скинути» and then `[data-confirm="yes"]`, and, with the sheet open, presses the size button of the size shown, the level button of the level shown, «Поле 8×8» and «Задачка» as marking presses (no «Почати») and then «Закрити»
- **THEN** the seed-source call count and the generator call count equal the counts read now

#### Scenario: A level change takes exactly one seed and passes the chosen level

- **GIVEN** a seed source returning 1, 2, 3 and so on, counting its calls, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the page is mounted, then the player chooses «Задачка», then «Мозколамка», then «Поле 8×8» (each board has no player entries and every generation succeeds on its first seed)
- **THEN** the spy recorded `(6, 1, 1)`, `(6, 2, 2)`, `(6, 3, 4)` and `(8, 4, 4)` in this order and the seed source was called exactly four times

### Requirement: Ukrainian page text

In Ukrainian mode (the default) the page SHALL show all of its own text (the title in the header, labels, buttons including «Правила» and «Зрозуміло», the size control labels, the rules texts, the idle line, the win message, `document.title` and any user-visible attribute such as `aria-label`, `title`, `placeholder`, `alt` and the `label` attribute of `option` and `optgroup` elements, which a browser shows instead of the option text) in Ukrainian: each such text contains Cyrillic letters and no Latin letters. The digits and the sign × inside a size label such as «Поле 4×4» are not Latin letters. The digits shown in the cells of the board are puzzle content, not page text, and are not collected. Text inside an element with `aria-hidden="true"` (the decorative examples of the rules panel, A-26) is decoration made of digits and symbols, not page text, and is not collected; it holds no letter at all (see «Ukrainian texts of the header, rules panel and idle line»). Text inside an element whose own `lang` differs from `<html lang>` (the option "English", A-52) is skipped by this scan. Hint sentences are owned by the puzzle-engine capability and are only displayed here. English mode is specified by «Page text is per mode» and «English page text».

Traces: NFR-5, FR-43, FR-57, FR-71, FR-111

#### Scenario: Static page text

- **GIVEN** the page has just been mounted
- **WHEN** the test collects every non-whitespace text node under the page root (including the buttons, the size control labels and the header, the rules panel and the idle line, but not the text of `[data-cell]` elements, which is puzzle content, and not the text of elements with `aria-hidden="true"`, which is decoration), `document.title`, and the values of the attributes `aria-label`, `title`, `placeholder` and `alt` on every element in the root and of the attribute `label` on every `option` and `optgroup` element; `data-*` attributes, `class` and option `value` attributes are not user-visible and are not collected; the elements whose own `lang` differs from `<html lang>` (the option "English", A-52) are skipped
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`
- **AND** the collected texts include «Поле 4×4», «Поле 6×6» and «Поле 8×8»
- **AND** the collected texts include «Розмір поля», the board name «Поле 6×6» as an `aria-label` value, and the 36 cell names

#### Scenario: Accessible names at every size

- **GIVEN** a mounted page on which the player selects 4×4, then 8×8
- **WHEN** the test collects the `aria-label` of `[data-board]` and of every cell after each board is shown
- **THEN** the board names are «Поле 4×4» and «Поле 8×8», each cell name matches `/^Рядок [1-8], стовпець [1-8], (порожньо|0|1)(, задано|, підказка)?$/`, and every collected name contains Cyrillic letters and no Latin letters

#### Scenario: Win message text

- **GIVEN** a solved board
- **WHEN** the win message is shown
- **THEN** its text is the one required by «Win message when solved» (FR-41), and it contains Cyrillic letters and no Latin letters

### Requirement: Ukrainian texts of the header, rules panel and idle line

In Ukrainian mode every text that the header, the rules panel and the idle line show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5); in English mode each is the English counterpart of «English page text» and contains Latin letters and no Cyrillic letters (NFR-5 per mode). This covers the title «Бінарка», the button «Правила», the panel heading «Правила», the three rules texts of «Rules panel», the close button «Зрозуміло», the idle line and any `aria-label`, `title`, `alt` or `label` attribute in them. Decorative examples inside the panel (A-26) are inside elements with `aria-hidden="true"` and hold digits and symbols but no letter of any alphabet. By the user's code-organisation decision of 2026-10-05 (not a requirement) these texts are kept, in both languages, in the single module `src/ui/strings.ts` and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the last scenario below guards it as a source scan.

Traces: NFR-5, FR-111, FR-55

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the texts of the header, of the rules panel (without `aria-hidden` descendants) and of the idle line, and the values of `aria-label`, `title`, `alt` and `label` attributes inside them
- **THEN** the collection contains «Бінарка», «Правила», «Зрозуміло», the three rules texts of the table in «Rules panel» and the idle line, each at least once
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The English texts of the header, rules panel and idle line

- **GIVEN** the page in English mode
- **WHEN** the test collects the texts of the header, of the rules panel (without `aria-hidden` descendants) and of the idle line, and the values of `aria-label`, `title`, `alt` and `label` attributes inside them
- **THEN** the collection contains "Binarka", "Rules", "Got it", the three English rules texts of «English page text» and the English idle line, each at least once
- **AND** every collected text matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

#### Scenario: Decorative examples hold no letters

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text content of every element of the root that has `aria-hidden="true"`
- **THEN** none of these texts matches `/\p{L}/u`

#### Scenario: No Cyrillic text outside the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads every file under `src/ui/` with the extension `.ts` or `.css`, except `src/ui/strings.ts`, and `src/main.ts`
- **THEN** none of them contains a character matching `/\p{Script=Cyrillic}/u` (comments in these files are written in English)
- **AND** `src/ui/strings.ts` exists and contains the title, the idle line and the three rules texts

### Requirement: Ukrainian texts of the confirmation dialog, size control and cell labels

In Ukrainian mode every text that the confirmation dialog, the size control and the cells expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5); in English mode each is the English counterpart of «English page text» ("Grid size", "Grid 4×4", "Start over? Your moves on this board will be lost.", "Yes, start over", "Cancel", "Row R, column C, empty") and contains Latin letters and no Cyrillic letters. This covers the group name «Розмір поля», the labels «Поле 4×4», «Поле 6×6» and «Поле 8×8», the confirmation text «Почати заново? Ваші ходи на цьому полі буде втрачено.», «Так, почати», «Скасувати», every cell label of «Cell labels», and any `aria-label`, `title`, `alt` or `label` attribute among them. Digits, «×» and the cell digits are not Latin letters. By the user's code-organisation decision of 2026-10-05 (not a requirement) these texts are kept in `src/ui/strings.ts`, the single module created by `update-page-layout`; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, FR-43, FR-67, FR-70, FR-111

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text nodes of the size control, of the confirmation dialog, the `aria-label` of the size control and of every `[data-cell]`, and every `title`, `alt` and `label` attribute inside them
- **THEN** the collection contains «Розмір поля», «Поле 4×4», «Поле 6×6», «Поле 8×8», «Почати заново? Ваші ходи на цьому полі буде втрачено.», «Так, почати» and «Скасувати»
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`
- **AND** the source scan of `update-page-layout` (no Cyrillic outside `src/ui/strings.ts`) still finds nothing

#### Scenario: The English texts of the dialog, the size control and the cells

- **GIVEN** the page in English mode
- **WHEN** the test collects the text nodes of the size control, of the confirmation dialog, the `aria-label` of the size control and of every `[data-cell]`
- **THEN** the collection contains "Grid size", "Grid 4×4", "Grid 6×6", "Grid 8×8", "Start over? Your moves on this board will be lost.", "Yes, start over" and "Cancel"
- **AND** every collected text matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

### Requirement: Cells expose a Ukrainian name and their state

The page SHALL give every `[data-cell]` an `aria-label` that is its label as «Cell labels» defines it, «Рядок R, стовпець C, V» with the optional suffix «, задано» or «, підказка» (FR-70; in English mode "Row R, column C, V" with the suffix ", given" or ", hinted"), so that the accessible name of a cell is its FR-70 label (FR-61). The label SHALL match the cell's text content, which stays empty, `0` or `1` (FR-34), and SHALL be rewritten whenever the cell changes (a click, a hint fill, a reset, a new board). The page SHALL set `aria-disabled="true"` on every given cell (FR-69) and on no other cell, and SHALL NOT set `aria-readonly` on any element, because that attribute is not allowed on a button. The page SHALL set `aria-invalid="true"` on exactly the cells that carry the class `cell-violation` (the same set, including every cell of a line highlighted for too many of one digit) and SHALL remove the attribute from every other cell, with the attribute absent rather than `"false"`. A given cell in a violation carries both `aria-disabled="true"` and `aria-invalid="true"`.

Traces: FR-61, FR-70, FR-69, FR-35, FR-36, FR-37, FR-38, FR-111

#### Scenario: Names of a fresh board

- **GIVEN** a 6x6 fixture board whose only givens are `0` at row 3 columns 1 and 2
- **WHEN** the test reads `aria-label` of the cells at row 2 column 3, row 3 column 1 and row 6 column 6
- **THEN** they are «Рядок 2, стовпець 3, порожньо», «Рядок 3, стовпець 1, 0, задано» and «Рядок 6, стовпець 6, порожньо»
- **AND** for every cell the name equals the FR-70 label built from its `data-row`, `data-col`, text content, `data-given` and `cell-hinted`

#### Scenario: Names in English mode

- **GIVEN** a 6x6 fixture board whose only givens are `0` at row 3 columns 1 and 2, and the page in English mode
- **WHEN** the test reads `aria-label` of the cells at row 2 column 3, row 3 column 1 and row 6 column 6
- **THEN** they are "Row 2, column 3, empty", "Row 3, column 1, 0, given" and "Row 6, column 6, empty"

#### Scenario: The name follows a click and a hint

- **GIVEN** a rendered board with an empty non-given cell at row 2 column 3
- **WHEN** the player clicks it three times, one click at a time
- **THEN** its `aria-label` is «Рядок 2, стовпець 3, 0», then «Рядок 2, стовпець 3, 1», then «Рядок 2, стовпець 3, порожньо»
- **AND** after a hint press that fills a cell, that cell's `aria-label` is «Рядок R, стовпець C, V, підказка» with V the filled digit

#### Scenario: A new board has fresh names

- **GIVEN** a board with player entries
- **WHEN** the player presses the new puzzle button or selects another size, and confirms
- **THEN** for every cell of the new board the `aria-label` equals the FR-70 label for the new cell's position, text and state

#### Scenario: Givens are aria-disabled and nothing is aria-readonly

- **GIVEN** a rendered board with givens and player cells
- **WHEN** the test reads `aria-disabled` and `aria-readonly` of every cell
- **THEN** `aria-disabled` is `"true"` on every cell with `data-given="true"` and absent on every other cell, also after a click or a hint fill that fills a player cell
- **AND** no element of the root has the attribute `aria-readonly`

#### Scenario: A violation is exposed to assistive technology

- **GIVEN** a rendered board in which two adjacent cells show `0` and the next cell is an empty non-given cell, and no cell has `cell-violation`
- **WHEN** the player clicks that cell once so it shows `0`
- **THEN** the three cells of the run have the class `cell-violation` and `aria-invalid="true"`
- **AND** no other cell has the attribute `aria-invalid`

#### Scenario: The invalid state is removed with the highlight

- **GIVEN** a board where exactly three cells carry `cell-violation` and `aria-invalid="true"`
- **WHEN** the player clicks the third cell until it shows empty
- **THEN** no cell has `cell-violation` and no cell has the attribute `aria-invalid`

#### Scenario: A line with too many of one digit is invalid as a whole

- **GIVEN** a rendered 6x6 board on which the player places a fourth `0` in one row, with no three equal digits side by side and no other rule broken
- **WHEN** the fourth `0` is placed
- **THEN** all six cells of that row have `cell-violation` and `aria-invalid="true"`, and no cell outside the row has `aria-invalid`

#### Scenario: Violating givens are invalid at once

- **GIVEN** the fixture `DIRTY_GIVENS` (givens `0` at row 1 columns 1 to 3)
- **WHEN** the page has just been mounted
- **THEN** exactly the cells at row 1 columns 1 to 3 have `aria-invalid="true"`, and each of them also has `aria-disabled="true"`

### Requirement: Cell labels

Every cell SHALL have an `aria-label` in the page language, in Ukrainian mode of the form «Рядок R, стовпець C, V» and in English mode of the form "Row R, column C, V", followed by an optional suffix, where R and C are the 1-based row and column and V is «порожньо» ("empty" in English mode) for an empty cell, «0» for a zero and «1» for a one (FR-70). A given cell appends «, задано» (", given"); the cell that a hint filled (FR-66) appends «, підказка» (", hinted"); any other cell has no suffix, and a cell does not get a suffix for being in violation. The label SHALL be updated after every change of the cell (a click, a hint, reset, a new puzzle, a size change). A label contains no Latin letters (NFR-5).

Traces: FR-70, FR-66, NFR-5, FR-111

#### Scenario: The four label forms

- **GIVEN** a mounted 6x6 fixture board whose givens are `1` at (1, 4), `0` at (5, 3), `1` at (5, 4) and `1` at (5, 5), so that the hint engine returns row 5, column 6, value 0 (the pair rule)
- **WHEN** the player presses «Підказка», and the test reads the labels of the cells (3, 2), (1, 4) and (5, 6), after clicking (3, 2) once for the digit form
- **THEN** the label of (3, 2) before the click is «Рядок 3, стовпець 2, порожньо» and after one click is «Рядок 3, стовпець 2, 0»
- **AND** the label of (1, 4) is «Рядок 1, стовпець 4, 1, задано»
- **AND** the label of (5, 6) is «Рядок 5, стовпець 6, 0, підказка»

#### Scenario: The four label forms in English

- **GIVEN** a mounted 6x6 fixture board whose givens are `1` at (1, 4), `0` at (5, 3), `1` at (5, 4) and `1` at (5, 5), the page in English mode
- **WHEN** the player presses "Hint", and the test reads the labels of the cells (3, 2), (1, 4) and (5, 6), after clicking (3, 2) once for the digit form
- **THEN** the label of (3, 2) before the click is "Row 3, column 2, empty" and after one click is "Row 3, column 2, 0"
- **AND** the label of (1, 4) is "Row 1, column 4, 1, given" and the label of (5, 6) is "Row 5, column 6, 0, hinted"

#### Scenario: Labels follow every change of the cell

- **GIVEN** a mounted fixture board and a non-given cell (R, C) that is empty
- **WHEN** the player clicks it three times, one click at a time
- **THEN** its label reads «…, 0», «…, 1» and «…, порожньо» in turn, with the same R and C each time
- **AND** after a hint has filled a cell its label gains «, підказка», and after a click on that cell the suffix is gone and the digit has moved on in the cycle
- **AND** after «Скинути» (confirmed when entries exist) every non-given cell reads «…, порожньо» and every given keeps its «, задано» label

#### Scenario: A violation adds no suffix

- **GIVEN** a mounted fixture board on which the player made three equal digits side by side in a row of non-given cells, so the three cells carry `cell-violation`
- **WHEN** the test reads their labels
- **THEN** each label is «Рядок R, стовпець C, V» with V the digit and nothing after it
- **AND** a given cell that is part of a violation keeps exactly the suffix «, задано»

#### Scenario: Labels use the size of the board

- **GIVEN** a mounted page showing a board of size N from the table below, with a fixture puzzle

| N | Label of the last cell when it is an empty non-given cell |
|---|-----------------------------------------------------------|
| 4 | Рядок 4, стовпець 4, порожньо |
| 6 | Рядок 6, стовпець 6, порожньо |
| 8 | Рядок 8, стовпець 8, порожньо |

- **WHEN** the test reads the `aria-label` of the cell at `data-row` N and `data-col` N
- **THEN** it equals the label of the row of the table

### Requirement: The size radiogroup has an accessible name

The size radiogroup `[data-control="size"]` (FR-43) SHALL have the accessible name «Розмір поля», given by its `aria-label`, and each of its three size buttons SHALL be labelled by its own visible text «Поле N×N»: a size button SHALL NOT carry `aria-label` or `aria-labelledby` (FR-62). No text of the page SHALL show «Розмір поля», and the page SHALL contain no `label` element and no `select`: the frozen design has no visible label for the control (FR-62). The name has Cyrillic letters and no Latin letters in Ukrainian mode (NFR-5); in English mode the group name is "Grid size" and the buttons are labelled "Grid 4×4", "Grid 6×6" and "Grid 8×8" (FR-43, FR-111), with Latin letters and no Cyrillic letters.

Traces: FR-62, FR-43, NFR-5, FR-111

#### Scenario: The radiogroup is named by its aria-label

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="size"]`
- **THEN** it has `role="radiogroup"` and `aria-label` equal to «Розмір поля», and no `aria-labelledby`
- **AND** the root contains no `label` element, no `select` element and no `for` attribute, and no text node of the root has the trimmed text «Розмір поля»

#### Scenario: Each size button is named by its own text

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three `button[role="radio"]` of the size control
- **THEN** their texts are «Поле 4×4», «Поле 6×6» and «Поле 8×8» in this order, and none has `aria-label` or `aria-labelledby`
- **AND** each text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The size group is named in English

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-control="size"]` and its three buttons
- **THEN** the `aria-label` is "Grid size", the button texts are "Grid 4×4", "Grid 6×6" and "Grid 8×8" in this order, none of the buttons has `aria-label` or `aria-labelledby`, and no text matches `/\p{Script=Cyrillic}/u`

### Requirement: Idle line

The message area SHALL hold an idle line `[data-message="idle"]` with the text «Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.» in Ukrainian mode and `Press the cells to place 0 and 1. For the rules, use the “Rules” button at the top.` in English mode (FR-71, FR-111). The two spaces inside «0 і 1» SHALL be non-breaking spaces U+00A0, one between «0» and «і» and one between «і» and «1»; every other space of the sentence is an ordinary space U+0020; the «і» is the Cyrillic letter U+0456. In English mode the two spaces inside "0 and 1" are U+00A0 as well, one between "0" and "and" and one between "and" and "1", and the quotes around Rules are U+201C and U+201D. The line SHALL always be in the DOM. It is visible only while `[data-message="hint"]` and `[data-message="win"]` both have empty text content, and this SHALL be done by CSS only: the page code never removes the line, never sets `hidden` or an inline `style` on it and never changes its text except on a language switch (FR-108). The visibility itself is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`.

Traces: FR-71, FR-111, FR-108

#### Scenario: Idle line text, code point by code point

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the text content of `[data-message="idle"]`
- **THEN** it equals the JavaScript string `'Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.'`
- **AND** it contains exactly two U+00A0 characters, and the character after the first one is U+0456

#### Scenario: The English idle line, code point by code point

- **GIVEN** the page in English mode
- **WHEN** the test reads the text content of `[data-message="idle"]`
- **THEN** it equals the JavaScript string `'Press the cells to place 0\u00A0and\u00A01. For the rules, use the \u201CRules\u201D button at the top.'`
- **AND** it contains exactly two U+00A0 characters

#### Scenario: The idle line stays in the DOM and untouched

- **GIVEN** a mounted page, with the text, the `hidden` attribute and the `style` attribute of `[data-message="idle"]` read at mount (no `hidden`, no `style`)
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Підказка» so that the hint message has text |
| reaches a win so that the win message has text |
| presses «Нова головоломка» |
| presses «Скинути» |

- **THEN** after each action `[data-message="idle"]` is still in the DOM exactly once, with the same text, without a `hidden` attribute and without a `style` attribute (so only CSS can hide it)

#### Scenario: A language switch keeps the idle line in the DOM and untouched in kind

- **GIVEN** a mounted page, with the element `[data-message="idle"]` read at mount
- **WHEN** the player presses "English"
- **THEN** it is the same element, without a `hidden` or `style` attribute, and its text is the English idle line

#### Scenario: The hint and win messages are empty at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="hint"]` and `[data-message="win"]`
- **THEN** both have empty text content and no child node (so the CSS rule that shows the idle line while both are empty can match)

### Requirement: Rules panel

The page header SHALL hold a button `[data-action="rules"]` labelled «Правила» whose `popovertarget` attribute names the `id` of the rules panel. The rules panel `[data-section="rules"]` SHALL be an element with the `popover` attribute, opened by that button with no script, and SHALL contain, in this order: the heading «Правила»; the rules list, a `ul` that is a direct child of the panel, with exactly three `li` items in this order: «Не більше двох однакових цифр поспіль у рядку чи стовпці.», «У кожному рядку та стовпці порівну нулів і одиниць.», «Усі рядки різні, і всі стовпці різні.»; the techniques section `[data-section="techniques"]` (FR-93); and one close button «Зрозуміло» with `popovertarget` naming the same `id` and `popovertargetaction="hide"` (FR-57). The techniques section SHALL hold a heading `h3` with the text «Складніші прийоми» and its own `ul` with exactly three `li` items, one sentence each, one for each of the techniques 2, 3 and 4 (FR-74 to FR-76), in this order (wording provisional until the user confirms it in chat during the slice, Q6; a confirmed change edits this table, `src/ui/strings.ts` and the tests together): the table below. The clause «exactly three list items» of FR-57 means the three items of the rules list; the techniques list is a separate list. The techniques items carry no decorative example and no `aria-hidden` descendant, and the techniques section has no `id`. A list item of the rules list MAY carry a decorative example drawn from digits and symbols inside an element with `aria-hidden="true"` (A-26, not pinned); the text of an item is its text content without the descendants that have `aria-hidden="true"`. The panel SHALL be created once at mount, sit inside the page root and outside the element that holds the board, need no new dependency, and stay the same element with the same texts after a new puzzle, a size change, a level change and a win. There SHALL be no rules block below the board and no `<details>` element anywhere on the page. Each mount SHALL give its panel an `id` that is unique in the document, so two mounts on two roots stay independent. The panel SHALL have `role="dialog"` and `aria-labelledby` naming the `id` of its heading «Правила» (also unique per mount), so assistive technology announces it as a named dialog, and the close button «Зрозуміло» SHALL carry the `autofocus` attribute, so that opening the popover moves focus into the panel (A-20). The texts of the panel follow the page language: the Ukrainian texts of the tables below are those of Ukrainian mode, the English texts are in «English page text» (FR-57, FR-93, FR-111); the structure and the counts are the same in both modes. Where the panel is drawn (bottom sheet on phones, centred panel from 48rem) is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`.

Traces: FR-57, FR-93, NFR-5, FR-111

#### Scenario: Rules button in the header

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `header` element of the root
- **THEN** it contains exactly one `[data-action="rules"]`, a `button` whose text is «Правила»
- **AND** its `popovertarget` attribute is non-empty and equals the `id` of the one element `[data-section="rules"]` in the root

#### Scenario: Rules panel structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** exactly one such element exists inside the root, it has the `popover` attribute, and it is not inside `[data-board]` or inside the board host
- **AND** its headings, in document order, are an `h2` with the text «Правила» and an `h3` with the text «Складніші прийоми»
- **AND** its rules list (the `ul` that is a direct child of the panel) has exactly three `li` items whose texts, in order, are those of the first table
- **AND** its techniques section `[data-section="techniques"]` is inside the panel, follows the rules list, holds the `h3` and exactly one `ul` with exactly three `li` items whose texts, in order, are those of the second table, and no `aria-hidden` element and no `id`
- **AND** it contains exactly one `button`, with the text «Зрозуміло», `popovertarget` equal to the panel's `id` and `popovertargetaction="hide"`, and this button follows the techniques section

| Item | Text of the rules list |
|------|------------------------|
| 1 | Не більше двох однакових цифр поспіль у рядку чи стовпці. |
| 2 | У кожному рядку та стовпці порівну нулів і одиниць. |
| 3 | Усі рядки різні, і всі стовпці різні. |

| Item | Text of the techniques list (provisional, Q6) |
|------|-----------------------------------------------|
| 1 | `Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра.` |
| 2 | `Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього.` |
| 3 | `Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша.` |

#### Scenario: The rules panel in English mode

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** its headings are an `h2` "Rules" and an `h3` "Harder techniques", the three rules texts and the three techniques texts are the English ones of «English page text», its close button reads "Got it", and the panel has the same structure and six `li` elements

#### Scenario: The panel is a named dialog and takes focus when opened

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** it has `role="dialog"`, and its `aria-labelledby` names an `h2` inside the panel whose text is «Правила»
- **AND** the close button «Зрозуміло» has the `autofocus` attribute, and no other element of the root has it

#### Scenario: No rules block under the board and no details element

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the whole root
- **THEN** the root contains no `details` element
- **AND** every `li` element of the root is inside `[data-section="rules"]`, and the root contains exactly six `li` elements: three in the rules list and three in the techniques section

#### Scenario: The panel opens with no script

- **GIVEN** the page has just been mounted, and the methods `showPopover`, `hidePopover` and `togglePopover` are installed on `HTMLElement.prototype` as spies (jsdom has none of them)
- **WHEN** the test clicks `[data-action="rules"]` and then the close button «Зрозуміло»
- **THEN** no spy was called
- **AND** the panel keeps the same attributes and the same texts, and the board, the messages and every cell are unchanged

#### Scenario: Two mounts stay independent

- **GIVEN** the page is mounted on two different roots in the same document
- **WHEN** the test reads the `popovertarget` of each root's rules button
- **THEN** the two panels have different `id` values, and each button names the panel of its own root

#### Scenario: The panel survives every board change

- **GIVEN** a mounted page with a fixture puzzle, the panel element and its texts read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 (one run) and to 8 (one run) |
| changes the level to «Задачка» (one run) |
| reaches a win |

- **THEN** after each action there is exactly one `[data-section="rules"]`, it is the same element as at mount, it has the same two headings and the same six `li` texts (three in each list), and the rules button still names its `id`

### Requirement: Confirmation before discarding player entries

«Нова головоломка», «Почати» and «Скинути» SHALL ask for confirmation only when the board has player entries (FR-67). A change of size or level is no longer an action of its own: it happens only through «Почати» (FR-101), and marking a size or a level asks for nothing (FR-100). A player entry is a non-given cell that is not empty; a cell filled by a hint counts as one (A-8); a board that was just solved has entries, so the confirmation is also asked after a win (A-29). The confirmation SHALL be a native `<dialog>` `[data-dialog="confirm"]`, created once at mount inside the page root, outside the board element and outside the sequence of «Page document order» (it follows the rules panel), closed at mount, and opened with `showModal()`. It SHALL hold the text «Почати заново? Ваші ходи на цьому полі буде втрачено.» ("Start over? Your moves on this board will be lost." in English mode, with the buttons "Yes, start over" and "Cancel", FR-111) and exactly two `<button type="button">`: `[data-confirm="yes"]` with the text «Так, почати» and `[data-confirm="no"]` with the text «Скасувати». «Так, почати» SHALL close the dialog (calling `close()`) and then perform the pending action exactly as it would on an untouched board. «Скасувати», and Escape (the dialog's `cancel` and `close` events with no button pressed), SHALL close the dialog and leave unchanged the board, the size and the level (`aria-checked`), the summary, the hint message, the win message, the highlights and `cell-hinted`; no seed is taken and the generator is not called. A cancelled action is dropped: it is never performed later. On a board with no player entries the action happens at once and `showModal()` is never called. When the pending action is the press of «Почати», the sheet is closed first and then the dialog opens, and «Скасувати» (which drops the pending action), Escape and «Так, почати» end with focus on the summary button (FR-98, see «Sheet and confirmation»). The pending action is the marked size and level taken at the press of «Почати». Reading rule: wherever another requirement of this capability says that pressing «Нова головоломка», changing the size, changing the level or pressing «Скинути» has an effect (for example «Highlighting follows every board change», «Hint message stays until the next hint or a new puzzle» and the size steps of «Board rendering and default size»), the effect happens when the action is performed: at once on a board without player entries, after «Так, почати» on a board with entries; a requested but unperformed action has no effect. The dialog SHALL have `aria-labelledby` naming the `id` of the element that holds its text (unique per mount), so assistive technology announces the question (A-20). When the page opens the dialog it SHALL move focus to «Скасувати» (after `showModal()`), so that the safe choice is the default and two key presses cannot discard the player's moves (A-20; the user's decision of 2026-10-06, review round 1). Where the dialog is drawn and its focus ring are layout and are covered by the held NFR-13 and NFR-14, see `docs/requirements-held.md`.

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

### Requirement: Summary button

The page SHALL show, in the place of the size control in the page order (FR-68), one button `[data-action="setup"]` with `type="button"` and a `popovertarget` attribute equal to the `id` of the setup sheet, so that it opens the sheet with no script (FR-95, A-40). The button SHALL hold three children in this order: a visually hidden prefix span with the text `Поле і складність: ` (ending in one ordinary space), a text span with the visible text `N×N · Name` for the size and the level of the board shown (the separator is « · », an ordinary space, U+00B7 and an ordinary space), for example `6×6 · Задачка`, and a decorative span `aria-hidden="true"` with the cue `▾`. At mount the visible text is `6×6 · Розминка`. The visible text SHALL be rewritten after every board that is shown (the mount, a performed «Почати», «Нова головоломка»; a reset shows the same size and level and leaves the text as it is, as «Reset button» says) and after nothing else except a language switch (FR-108), which changes its text, never its size or level: marking a size or a level (FR-100), a cancelled confirmation, a failed generation, the press of an unavailable level and the opening or closing of the sheet leave it as it was. The summary shows the board shown, never the marked choice (FR-95). The accessible name of the button is its text content without `aria-hidden` descendants, that is the prefix followed by the visible text, for example `Поле і складність: 6×6 · Задачка`; the button SHALL NOT carry `aria-label`, `aria-labelledby`, `aria-haspopup`, `aria-expanded` or `tabindex` (A-41, A-43: browsers expose the open state of a `popovertarget` button natively). The height of the button (44 CSS px) and the look of the cue are layout and are covered by the held NFR-12 and NFR-14, see `docs/requirements-held.md`. The names of the size and the level in the text come from `src/ui/strings.ts`. In English mode the hidden prefix is `Grid and difficulty: ` and the visible text uses the English level names, for example `6×6 · Teaser` (FR-111); the text and the accessible name follow the page language.

Traces: FR-95, NFR-5, NFR-9, FR-100, FR-101, FR-108, FR-111

#### Scenario: Summary button structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="setup"]`
- **THEN** exactly one such element exists in the root, it is a `button` with `type="button"`, and its `popovertarget` equals the `id` of the one element `[data-section="setup"]`
- **AND** it has exactly three child elements: a span with the text `Поле і складність: `, a span with the text `6×6 · Розминка`, and a span with `aria-hidden="true"` and the text `▾`
- **AND** it has no `aria-label`, `aria-labelledby`, `aria-haspopup`, `aria-expanded` or `tabindex` attribute

#### Scenario: The accessible name says what the button opens

- **GIVEN** the page has just been mounted
- **WHEN** the test computes the text content of the button without its `aria-hidden` descendants
- **THEN** it equals `Поле і складність: 6×6 · Розминка`, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`

#### Scenario: The summary in English mode and across a switch

- **GIVEN** a mounted 6×6 board at «Задачка» in Ukrainian mode whose summary reads `6×6 · Задачка`
- **WHEN** the player presses "English"
- **THEN** the hidden prefix is `Grid and difficulty: `, the visible text is `6×6 · Teaser`, the accessible name is `Grid and difficulty: 6×6 · Teaser`, and the board, the size and the level are unchanged

#### Scenario: The summary follows every shown board

- **GIVEN** a mounted page with the real engine generator and no player entries
- **WHEN** the player chooses, in turn, «Задачка», «Поле 8×8», «Мозколамка», «Поле 4×4», «Поле 6×6» (each from the open sheet)
- **THEN** after each choice the visible text of the summary is `6×6 · Задачка`, `8×8 · Задачка`, `8×8 · Мозколамка`, `4×4 · Розминка` and `6×6 · Розминка` in this order

#### Scenario: The summary follows «Нова головоломка» and keeps its text after a reset

- **GIVEN** a 6×6 board at the level «Головоломка» whose summary reads `6×6 · Головоломка`, with player entries
- **WHEN** the player presses «Скинути» and `[data-confirm="yes"]`, then «Нова головоломка» and `[data-confirm="yes"]`
- **THEN** after each step the visible text of the summary is still `6×6 · Головоломка`

#### Scenario: The summary stays when nothing was shown

- **GIVEN** a 6×6 board at the level «Розминка» with player entries and the summary `6×6 · Розминка`
- **WHEN** the player chooses «Задачка» and presses `[data-confirm="no"]`, then chooses «Поле 8×8» with an injected `generate` that throws an ordinary error and presses `[data-confirm="yes"]`, then opens the sheet at 4×4 on another page and presses an unavailable level
- **THEN** in the first two cases the visible text of the summary is still `6×6 · Розминка`, and in the third it is still `4×4 · Розминка`

#### Scenario: Marking leaves the summary alone

- **GIVEN** a mounted 6×6 board at «Розминка» whose summary reads `6×6 · Розминка`, and the sheet opened
- **WHEN** the player marks «Поле 8×8» and «Мозколамка» (two marking presses), and then presses «Почати»
- **THEN** after the two marking presses the visible text of the summary is still `6×6 · Розминка`, and after «Почати» it is `8×8 · Мозколамка`

#### Scenario: The summary button is in the page order and the tab order

- **GIVEN** the page has just been mounted at 6×6
- **WHEN** the test reads the document order of the elements
- **THEN** the summary button follows the `header` and precedes `[data-board]`, and it precedes the cell with `data-row="1"` and `data-col="1"`

### Requirement: Setup sheet

The page SHALL contain, created once at mount, a setup sheet `[data-section="setup"]` (FR-96, A-40): an element with the `popover` attribute and `role="dialog"`, with the `aria-label` «Поле і складність» ("Grid and difficulty" in English mode, FR-111), with an `id` that is unique in the document (it ends in a number that belongs to the mount, like the other ids), and with no `aria-labelledby` and no heading element (A-41). It SHALL sit inside the page root and outside the element that holds the board, follow the rules panel in document order and precede the confirmation dialog, need no new dependency and hold, in this order: the size control `[data-control="size"]` (see «Grid size selector»), the level control `[data-control="level"]` (see «Level selector»; it contains the reason line `[data-level-reason]` first, see «Only the first level exists at 4x4»), the start button `[data-action="setup-start"]` «Почати» (see «Start button») and the close button `[data-action="setup-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the sheet's `id` and `popovertargetaction="hide"`. The sheet SHALL be the same element, with the same children, after a hint, a win, a reset, «Нова головоломка» and a press of «Почати» (only the attributes and texts that those requirements define change). Where the sheet is drawn (a bottom sheet on phones, a centred panel from 48rem), the footer drawing and the 44 px targets and its look are layout and are covered by the held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`; nothing here claims them.

Reading rule and test contract (A-44). jsdom has no `popover` support: tests install stubs for `showPopover`, `hidePopover` and `togglePopover` on `HTMLElement.prototype` that record each call and keep an open or closed state per element, and remove them after each test; the stub of `hidePopover` closes the state and dispatches no event, and a `toggle` event is dispatched by the test itself (an `Event` of type `toggle` with a `newState` property set to `closed` or `open`). The opening of the sheet by the summary button is native and not tested in jsdom: a test opens the sheet by calling the stubbed `showPopover()` on it. **Reading rule for choices (A-44, A-47).** The verb **«chooses»** (in a requirement this change does not modify also «presses», «selects», «changes the size to N» or «changes the level to X» followed by an effect on the board, the seed source, the generator, the dialog, the messages or the summary; the list is in `design.md`) means a **choice**: the test first opens the sheet this way, presses the option (which only marks, FR-100), presses «Почати», and, where the scenario confirms, `[data-confirm="yes"]`. «A size change» and «a level change» mean a board shown by such a choice. A choice of the size and level already shown is therefore not a no-op: it makes one new puzzle like «Нова головоломка». The verbs «marks» and «makes a marking press», and every use of «presses» that carries the note «(a marking press)» or «(marking presses)», mean one press on the option and no «Почати»; so do the scenarios that say a press «does nothing». `aria-checked` read after a choice is read with the sheet closed, that is on the board shown (A-47). A generator that "throws" in a scenario throws an ordinary `Error`, not the run-out error of the engine, unless the scenario says run-out.

Traces: FR-96, FR-95, FR-97, FR-94, NFR-5, NFR-9, FR-100, FR-101, FR-111

#### Scenario: Sheet structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-section="setup"]`
- **THEN** exactly one such element exists in the root, it has the `popover` attribute and `role="dialog"`, `aria-label` equal to «Поле і складність», no `aria-labelledby`, and a non-empty `id`
- **AND** it contains no heading element (`h1` to `h6`), and it is not inside `[data-board]`, the board host, the header or the message area
- **AND** its element children, in order, are `[data-control="size"]`, `[data-control="level"]`, `[data-action="setup-start"]` and `[data-action="setup-close"]`

#### Scenario: Sheet position in the document

- **GIVEN** the page has just been mounted
- **WHEN** the test compares document positions with `compareDocumentPosition`
- **THEN** the sheet follows the message area and the rules panel `[data-section="rules"]`, and it precedes `[data-dialog="confirm"]`

#### Scenario: The close button

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="setup-close"]`
- **THEN** it is a `button` with `type="button"`, the text «Закрити», `popovertarget` equal to the sheet's `id` and `popovertargetaction="hide"`, and no `tabindex`
- **AND** the sheet holds exactly nine buttons in all: the three size buttons, the four level buttons, «Почати» and the close button

#### Scenario: The sheet is named in the page language

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-section="setup"]` and `[data-action="setup-start"]` and `[data-action="setup-close"]`
- **THEN** the sheet's `aria-label` is "Grid and difficulty", the texts are "Start" and "Close", and the sheet has no `aria-labelledby`

#### Scenario: The sheet opens and closes with no script

- **GIVEN** the page has just been mounted, and `showPopover`, `hidePopover` and `togglePopover` are installed as spies
- **WHEN** the test clicks `[data-action="setup"]` and then `[data-action="setup-close"]`
- **THEN** no spy was called
- **AND** the board, the messages, the summary text, `aria-checked` of both groups and every cell are unchanged

#### Scenario: Two mounts stay independent

- **GIVEN** the page is mounted on two roots in the same document
- **WHEN** the test reads the `popovertarget` of each root's summary button and of each root's close button
- **THEN** the two sheets have different `id` values, and each button names the sheet of its own root

#### Scenario: Other actions leave the sheet alone

- **GIVEN** a mounted page with a fixture puzzle, the sheet element and its children read at mount
- **WHEN** the player presses «Підказка», reaches a win, presses «Скинути» and «Нова головоломка», marks a size and a level, and chooses a size and a level (each from a freshly mounted page, confirmed where asked)
- **THEN** after each action there is exactly one `[data-section="setup"]`, it is the same element as at mount, with the same four children, and `hidePopover` was called only by the press of «Почати» of a choice (once each), never by a marking press

### Requirement: Level option content

Each level button inside the sheet SHALL be one `button[role="radio"]` whose content is two spans separated by one ordinary space (a text node): a name span with the level name and a description span with the level description (FR-99, FR-89). There is no persistent description line on the page body, no `[data-level-description]` and no toast: the descriptions live only in the buttons. Each span is plain text with no `id`, and the button has no other child element: the radio ring that marks the checked state is drawn by the stylesheet (a pseudo-element), not by an extra element. The accessible name of a level button is therefore its name followed by one space and its description (A-42). Each description SHALL be one sentence (exactly one terminal mark at the end, no other sentence break) of at most 80 characters, and is the final wording of the user (autonomy-log rows 89 and 90); the English descriptions of «English page text» are subject to the same limits (one sentence, at most 80 characters, measured by a test; FR-89, FR-111). The Ukrainian descriptions are:

| Level | Name | Description |
|-------|------|-------------|
| 1 | `Розминка` | `Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр.` |
| 2 | `Задачка` | `Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць.` |
| 3 | `Головоломка` | `Додатково треба порівнювати рядки і стовпці: двох однакових не буває.` |
| 4 | `Мозколамка` | `Додатково треба пробувати хід наперед: якщо правило порушиться, тут інша цифра.` |

Traces: FR-99, FR-89, FR-87, FR-94, NFR-4, NFR-5, FR-111

#### Scenario: Name and description in each button

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the four level buttons
- **THEN** each has exactly two child elements, both `span`, with an ordinary space text node between them, and the texts of the first and second span are the name and the description of the row of the table, in order
- **AND** the text content of each button equals its name, one space and its description, and neither span has an `id`

#### Scenario: No description line on the page body

- **GIVEN** the page has just been mounted, and again after each level is chosen in turn
- **WHEN** the test reads the root
- **THEN** no element has the attribute `data-level-description`, and no text node outside `[data-section="setup"]` and `[data-section="rules"]` contains any of the four descriptions

#### Scenario: Every description is one sentence of at most 80 characters

- **GIVEN** the four descriptions of the table
- **WHEN** the test measures each (`string.length`) and applies `/^[^.!?…]+\.$/`, the Cyrillic check and the Latin check
- **THEN** every description has at most 80 characters, matches the pattern and the Cyrillic check, and does not match `/[A-Za-z]/`

#### Scenario: Every English description is one sentence of at most 80 characters

- **GIVEN** the four English level names and descriptions of «English page text» (Warm-up, Teaser, Puzzler, Brain-twister)
- **WHEN** the test measures each description (`string.length`) and applies `/^[^.!?…]+\.$/` and the Latin and Cyrillic checks
- **THEN** every description has at most 80 characters, matches the pattern and `/[A-Za-z]/`, and does not match `/\p{Script=Cyrillic}/u`
- **AND** in English mode each level button holds a name span and a description span with one ordinary space between them, with these texts

#### Scenario: The description does not move with a pending press

- **GIVEN** a 6×6 board with player entries and the level «Розминка»
- **WHEN** the player chooses «Задачка» (the dialog opens) and the test reads `aria-checked` of the four level buttons, then presses `[data-confirm="no"]` and reads them again
- **THEN** both times `aria-checked="true"` is on «Розминка» only, and the four buttons hold the same texts as at mount

### Requirement: Ukrainian texts of the summary, the setup sheet, the level control and the techniques section

In Ukrainian mode every text that the summary button, the setup sheet, the level control and the techniques section of the rules panel show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5, FR-94); in English mode each is the English counterpart of «English page text» and contains Latin letters and no Cyrillic letters. This covers the summary's visible text and its accessible name, the visually hidden prefix, the sheet's `aria-label` «Поле і складність», the start button «Почати», the close button «Закрити», the group name «Складність», the four level names and four descriptions of «Level option content», the 4×4 reason of «Only the first level exists at 4x4», the techniques heading «Складніші прийоми», the three techniques items of «Rules panel» and any `aria-label`, `title`, `alt` or `label` attribute among them. «×», «·», «▾» and digits are not Latin letters. The 4×4 reason and the techniques items are each exactly one sentence (NFR-4, by analogy; the signed NFR-4 covers hint sentences only). By the user's code-organisation decision of 2026-10-05 these texts (the summary format parts, the visually hidden prefix, the sheet's label, the start label, the close label, the group name, the four names, the four descriptions, the 4×4 reason, the techniques heading and its three items) are kept in `src/ui/strings.ts`, and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, NFR-4, FR-94, FR-95, FR-96, FR-87, FR-89, FR-91, FR-93, FR-101, FR-111

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted at 6×6, and the same page after «Поле 4×4»
- **WHEN** the test collects the text nodes of the summary button (without `aria-hidden` descendants), of the sheet and of the techniques section, the `aria-label` of the sheet and of the level control, and every `title`, `alt` and `label` attribute inside them
- **THEN** the collection contains `Поле і складність: `, `6×6 · Розминка`, «Поле і складність», «Почати», «Закрити», «Складність», the four level names, the four descriptions, `Для поля 4×4 є лише рівень «Розминка».`, «Складніші прийоми» and the three techniques items of «Rules panel»
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The English texts of the summary, the sheet, the levels and the techniques

- **GIVEN** the page in English mode at 6×6, and the same page after the board 4×4 is shown
- **WHEN** the test collects the text nodes of the summary button (without `aria-hidden` descendants), of the sheet and of the techniques section, and the `aria-label` of the sheet and of the level control
- **THEN** the collection contains `Grid and difficulty: `, `6×6 · Warm-up`, "Grid and difficulty", "Start", "Close", "Difficulty", the four level names and descriptions, `The 4×4 grid has only the “Warm-up” level.`, "Harder techniques" and the three English techniques items
- **AND** every collected text matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

#### Scenario: The techniques items and the reason are one sentence each

- **GIVEN** the three techniques items of «Rules panel» and the 4×4 reason
- **WHEN** the test applies `/^[^.!?…]+\.$/` to each
- **THEN** every text matches it

#### Scenario: The strings live in the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads `src/ui/strings.ts` and every other `.ts` or `.css` file under `src/ui/` and `src/main.ts`
- **THEN** `src/ui/strings.ts` contains the visually hidden prefix, the sheet's label, the start label «Почати», the close label, the group name «Складність», the four level names, the four descriptions, the 4×4 reason, the techniques heading and the three techniques items
- **AND** no other file contains a character matching `/\p{Script=Cyrillic}/u`

### Requirement: Level selector

The setup sheet SHALL contain a level control `[data-control="level"]` after the size control (FR-44, FR-87): an element with `role="radiogroup"` and the accessible name «Складність» (`aria-label`, no visible label, as FR-62), holding exactly four `<button type="button" role="radio">` elements for the levels 1, 2, 3 and 4, in this order, with the names «Розминка», «Задачка», «Головоломка» and «Мозколамка» ("Warm-up", "Teaser", "Puzzler", "Brain-twister" in English mode, FR-111); the group name «Складність» is "Difficulty" in English mode. While the sheet is open the button of the **marked** level SHALL have `aria-checked="true"` and the other three `aria-checked="false"`; while the sheet is closed `aria-checked="true"` is on the level of the board shown (FR-87, FR-100, A-47); «Розминка» is selected when the page is mounted (FR-88). A level button SHALL NOT carry `aria-label`, `aria-labelledby` or `aria-describedby`, SHALL NOT have the `disabled` attribute or a `tabindex` attribute, and is operated by a click (the native activation of Enter and Space); arrow keys are not required and not handled (A-24, FR-59). No text of the page shows «Складність», and the page has no `label` element for the control. The page reads a level only from the four buttons, never from a free value. The content of a level button is specified by «Level option content».

**One press of an available level button only marks that level** (FR-73, FR-100): it starts no puzzle, takes no seed, calls no generator, opens no dialog and does not close the sheet. A new puzzle of the marked size and the marked level is started only by «Почати» (FR-101): the page SHALL take a new seed from the seed source, call the generator as `generate(size, seed, level)`, the three-argument form of the engine generator (FR-13, FR-81), render the new board, update the summary, and clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker. When the board has player entries the page SHALL first close the sheet and ask for confirmation and start the new puzzle only after «Так, почати» (FR-90, FR-98). A level choice SHALL NOT change the size. A run-out of the generator is retried with the next seed (FR-88, see «Page retry on a run-out»). If the generator fails in any other way, or the returned `puzzle.givens` is not n rows of n cells, or every retry ran out, the page SHALL keep the previous board, messages, highlights, `cell-hinted`, size and level, with `aria-checked` and the summary unchanged and no uncaught error; the page shows no error text for it, and the sheet is closed (FR-97). The page MUST NOT remember the level: a reload or a new mount starts at «Розминка» (TC-12, FR-88). Pressing the button of the level already shown or already marked is specified by «Pressing the shown size changes nothing» (FR-73); whether the pressed level exists at the size shown by «Only the first level exists at 4x4». Layout of the control, wrapping, 44 px targets and the one-screen fit are not claimed here: held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`.

Traces: FR-44, FR-87, FR-88, FR-97, NFR-9, NFR-5, FR-73, FR-100, FR-101, FR-111

#### Scenario: Level control structure and default

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="level"]`
- **THEN** it is inside `[data-section="setup"]`, follows `[data-control="size"]`, has `role="radiogroup"` and `aria-label` equal to «Складність», no `aria-labelledby`, and its element children are the reason line `[data-level-reason]` (a `p` without a `role`, first, see «Only the first level exists at 4x4») followed by exactly four `button` elements, each with `type="button"` and `role="radio"`, whose names (the text of their first span) are «Розминка», «Задачка», «Головоломка» and «Мозколамка», in this order
- **AND** the first button has `aria-checked="true"` and the other three have `aria-checked="false"`
- **AND** no level button has `aria-label`, `aria-labelledby`, `aria-describedby`, `disabled` or `tabindex`

#### Scenario: The level group has a name and no visible label

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the root
- **THEN** no text node of the root has the trimmed text «Складність», the root contains no `label` element and no `for` attribute

#### Scenario: A level press only marks

- **GIVEN** a 6×6 fixture board with player entries, the sheet opened, a counting seed source, a `generate` spy and the `showModal` spy with the counts read now
- **WHEN** the player presses the button «Головоломка» (a marking press)
- **THEN** `aria-checked="true"` is on «Головоломка» only in the level control, `[data-board]` keeps `data-size="6"` with its cell texts, the summary reads `6×6 · Розминка`, and the sheet's stub state is open
- **AND** `showModal` was never called and the seed-source and generator call counts equal the counts read now

#### Scenario: Choose a level on a board without entries

- **GIVEN** the default 6×6 board with no player entries, a counting seed source returning 1, 2 and so on, a `generate` spy recording `(size, seed, level)`, and the sheet opened
- **WHEN** the player chooses «Задачка» (marks it, then presses «Почати»)
- **THEN** `showModal` was never called, one more seed was taken (the second) and the spy's last call is `(6, 2, 2)`
- **AND** `aria-checked="true"` is on «Задачка» only, `aria-checked="true"` in the size control is still on «Поле 6×6» only, and `[data-board]` has `data-size="6"` and 36 cells

#### Scenario: The level reaches the generator at 8x8

- **GIVEN** the page shows an 8×8 board reached by choosing «Поле 8×8» on an untouched 6×6 board, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the player chooses «Мозколамка»
- **THEN** the spy's last call is `(8, seed, 4)` with the seed just taken, `[data-board]` has `data-size="8"` and 64 cells, and `aria-checked="true"` is on «Мозколамка» only

#### Scenario: Board content comes from the generator at the chosen level

- **GIVEN** a mounted page with the real engine generator and a seed source returning 1 and then 5
- **WHEN** the player chooses «Задачка»
- **THEN** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 6, seed 5 and level 2, and each given cell shows the digit the generator returns for it

#### Scenario: A level change after play asks first, then replaces the board

- **GIVEN** a 6×6 fixture board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted`, some cells with `cell-violation`, and an injected `generate` that returns a 6×6 fixture puzzle for level 3
- **WHEN** the player chooses «Головоломка», and then presses `[data-confirm="yes"]`
- **THEN** after the choice (the press of «Почати») the dialog is open and the board, the messages and `cell-hinted` are unchanged, and `aria-checked="true"` is still on «Розминка» only
- **AND** after the confirmation `aria-checked="true"` is on «Головоломка» only, the summary reads `6×6 · Головоломка`, the board has no player entries, `[data-message="hint"]` and `[data-message="win"]` have empty text content, no cell has `cell-hinted`, and the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: A level change after a win asks first

- **GIVEN** a 6×6 fixture board on which the win message is shown
- **WHEN** the player chooses «Задачка» and then presses `[data-confirm="yes"]` (a solved board has entries, A-29)
- **THEN** `[data-message="win"]` has empty text content and `aria-checked="true"` is on «Задачка» only

#### Scenario: The size is untouched by a level change

- **GIVEN** a page showing 8×8 at the level «Розминка», a board without entries
- **WHEN** the player chooses «Задачка», then «Мозколамка», then «Задачка» (each at once)
- **THEN** each time `[data-board]` has `data-size="8"`, `aria-checked="true"` is on «Поле 8×8» only in the size control, and the level control shows the pressed level

#### Scenario: A generator error keeps the previous board

- **GIVEN** a 6×6 fixture board with player entries, a hint sentence shown and a hint-filled cell, a counting seed source, a `window` `error` listener, and an injected `generate` that throws an ordinary error for level 3
- **WHEN** the player chooses «Головоломка» and then presses `[data-confirm="yes"]`
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"` with the same cell texts and highlights, both message regions keep their text, and the hint-filled cell keeps `cell-hinted`
- **AND** `aria-checked="true"` is on «Розминка» only, the summary reads `6×6 · Розминка`, and the dialog and the sheet are closed
- **AND** the seed source was called exactly once for the failed change (an ordinary error is not retried) and no second generator call was made

#### Scenario: A generator result of the wrong size keeps the previous board

- **GIVEN** a 6×6 fixture board with player entries and a hint sentence shown, and an injected `generate` that returns a 4×4 fixture puzzle for level 2
- **WHEN** the player chooses «Задачка» and then presses `[data-confirm="yes"]`
- **THEN** `[data-board]` keeps `data-size="6"` with 36 cells and the same cell texts, both message regions keep their text, and `aria-checked="true"` is on «Розминка» only

#### Scenario: The level is not remembered

- **GIVEN** a page on which the player chose «Головоломка», and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page's level control has `aria-checked="true"` on «Розминка» only and its first generator call carried level 1
- **AND** `localStorage` and `sessionStorage` still hold no entry

### Requirement: Only the first level exists at 4x4

The page SHALL, while the **marked size** is 4×4 (while the sheet is closed, the size of the board shown), keep the level control visible inside the sheet with «Розминка» marked and SHALL give the buttons «Задачка», «Головоломка» and «Мозколамка» `aria-checked="false"` and `aria-disabled="true"` (FR-91, FR-44, A-34, FR-100): they are focusable and readable like the given cells (FR-69), so they have no `disabled` attribute and no `tabindex`. «Розминка» has no `aria-disabled` attribute. Pressing an unavailable level button SHALL do nothing at all (FR-73, FR-97): no dialog, no new puzzle, no seed taken, no generator call, the sheet stays open, focus stays on the button, and the board, both messages, the highlights, `aria-checked` of both groups, the summary and `cell-hinted` are unchanged. The level control SHALL hold a reason line `[data-level-reason]` as its first child, before the four buttons (FR-91 "in the level group"; the designer's iteration 10 puts it there): a `p` of plain text with no `role` and no `id`, present at every size, which while the marked size is 4×4 has no `hidden` attribute and the text `Для поля 4×4 є лише рівень «Розминка».` (in English mode the text is `The 4×4 grid has only the “Warm-up” level.`; the guillemets inside the code span are part of the text; signed wording, autonomy-log row 101; one sentence, NFR-4), and which at 6×6 and 8×8 has the `hidden` attribute and empty text content (the `hidden` mechanism is spec-made). The reason is not on the page body. The radiogroup thus holds one non-radio child; the four radio buttons are still exactly four, and the arrangement is confirmed against the signed review set in task 1.4 of this change. Marking 4×4 sets the marked level to «Розминка». As soon as the marked size is 6×6 or 8×8 (a 6×6 or 8×8 board is shown, or the sheet marks one of them), the three buttons lose `aria-disabled` and the reason is hidden, and «Розминка» stays the marked level: the page does not restore an earlier marked level. `aria-disabled` is set only on the buttons of levels the shown size does not offer. After a «Почати» whose generation fails the previous board stays, the sheet is closed, and the state of the buttons is that of the board shown. An unavailable level is marked by a cue that is not colour alone (FR-91; the stylesheet requirement «The summary and level buttons set their own colours» pins a non-colour declaration).

Traces: FR-91, FR-44, FR-97, FR-99, NFR-9, NFR-5, FR-100, FR-111

#### Scenario: The 4x4 state of the level control follows the marked size

- **GIVEN** a 6×6 board without entries shown at «Розминка», and the sheet opened
- **WHEN** the player presses «Поле 4×4» (a marking press, no «Почати»)
- **THEN** `[data-control="level"]` is still in the sheet with no `hidden` attribute on it or on a level button, and «Розминка» has `aria-checked="true"` and no `aria-disabled`
- **AND** «Задачка», «Головоломка» and «Мозколамка» each have `aria-checked="false"` and `aria-disabled="true"`, and none of the four has the `disabled` attribute or a `tabindex`
- **AND** `[data-level-reason]` has no `hidden` attribute and the text `Для поля 4×4 є лише рівень «Розминка».`, the summary still reads `6×6 · Розминка`, and no seed was taken

#### Scenario: The 4x4 state after «Почати»

- **GIVEN** a 6×6 board without entries and an injected `generate` that returns a 4×4 fixture puzzle for size 4
- **WHEN** the player chooses «Поле 4×4» (marks it and presses «Почати») and opens the sheet again
- **THEN** «Розминка» has `aria-checked="true"`, «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`, `[data-level-reason]` shows its text, and the summary reads `4×4 · Розминка`

#### Scenario: The reason is hidden at 6x6 and 8x8

- **GIVEN** a page mounted at 6×6, and the same page after «Поле 8×8»
- **WHEN** the test reads `[data-level-reason]`
- **THEN** at both sizes it exists, has the `hidden` attribute and empty text content, and no text outside the sheet contains the reason

#### Scenario: An unavailable level is focusable

- **GIVEN** the page shows a 4×4 board
- **WHEN** the test gives DOM focus to «Мозколамка»
- **THEN** `document.activeElement` is that button

#### Scenario: Pressing an unavailable level changes nothing

- **GIVEN** a page showing a 4×4 board with player entries, a hint sentence shown, a hint-filled cell and some cells with `cell-violation`, the sheet opened, with a counting seed source, a `generate` spy and the `showModal` spy, the counts read now
- **WHEN** the player presses «Задачка», then «Головоломка», then «Мозколамка» (three marking presses on unavailable levels)
- **THEN** `showModal` and `hidePopover` were never called, the seed-source and generator call counts equal the counts read now, every cell keeps its text and class list, both messages keep their text, and `aria-checked="true"` is on «Поле 4×4» only in the size control and on «Розминка» only in the level control
- **AND** the sheet's stub state is still open and the summary still reads `4×4 · Розминка`

#### Scenario: The buttons are available again at 6x6 and 8x8

- **GIVEN** the sheet opened with a marked size of 4×4 (reached by a press on «Поле 4×4» on a 6×6 board without entries)
- **WHEN** the player presses «Поле 6×6», and later «Поле 8×8» (marking presses)
- **THEN** after each press no level button has `aria-disabled`, «Розминка» has `aria-checked="true"` (the earlier marked level is not restored), and `[data-level-reason]` has the `hidden` attribute

#### Scenario: A failed change to 4x4 keeps the available levels

- **GIVEN** a 6×6 fixture board at level «Головоломка» with player entries, and an injected `generate` that throws an ordinary error for size 4
- **WHEN** the player chooses «Поле 4×4» (marks it and presses «Почати») and then presses `[data-confirm="yes"]`
- **THEN** the board is still 6×6, the sheet is closed, and when it is opened again `aria-checked="true"` is on «Головоломка» only, no level button has `aria-disabled`, `[data-level-reason]` is hidden, and the summary reads `6×6 · Головоломка`

### Requirement: Grid size selector

The page SHALL offer a size control `[data-control="size"]` inside the setup sheet (FR-96; it is not in the page body), a segmented control: an element with `role="radiogroup"` and the accessible name «Розмір поля» (`aria-label`), holding exactly three `<button type="button" role="radio">` elements labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8» (sizes 4, 6, 8, in this order) (FR-43, A-24). The group name «Розмір поля» and the labels «Поле N×N» follow the page language ("Grid size" and "Grid N×N" in English mode, FR-111). While the sheet is open the button of the **marked** size SHALL have `aria-checked="true"` and the other two `aria-checked="false"`; while the sheet is closed `aria-checked="true"` is on the size of the board shown (FR-100, A-47); 6×6 is selected when the page is mounted. **One press of a size button only marks that size** (FR-43, FR-73, FR-100): it starts no puzzle, takes no seed, calls no generator, opens no dialog and does not close the sheet. A new puzzle of the marked size and the marked level is started only by «Почати» (FR-101, see «Start button»): it takes a new seed from the seed source (one seed per generation attempt; a run-out of the generator is retried, FR-88), renders a board of that size and level, updates the summary, and clears the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker; when the board has player entries the page SHALL first ask for confirmation (FR-67, FR-98) and start the new puzzle only after «Так, почати». The size marked at the press of «Почати» is the size performed. Until the confirmation, and after «Скасувати», `aria-checked` is on the size of the board shown (the sheet is already closed). The page calls `generate(n, seed, level)` and assumes that it returns an n×n puzzle: if the generator throws, or the returned `puzzle.givens` is not n rows of n cells, the page SHALL treat it as a generator failure and keep the previous board, the previous messages and highlights, `cell-hinted` and the previous size, and `aria-checked` SHALL stay on the size of the board that is shown, with no uncaught error (an ordinary failure is not retried; only a run-out is, see «Page retry on a run-out»). A performed and a failed «Почати» close the sheet and move focus to the summary button (FR-97, FR-101), and when the change needs the confirmation the sheet is closed first (FR-98). The page reads a size only from the three buttons, never from a free value: the behaviour «a changed value that is not exactly 4, 6 or 8 is ignored» of the earlier select-based control is REMOVED, because with three fixed buttons no free value can be submitted; the invariant that exactly three sizes exist is carried by «exactly three buttons». A press of the size button of the size already shown or already marked is specified by «Pressing the shown size changes nothing». Marking 6 or 8 keeps the marked level and marking 4 sets the marked level to 1, and one «Почати» makes one new puzzle with both, as «Size and level interplay» says. Rules, hint and win message work at the chosen size exactly as at 6. The page MUST NOT remember the choice: a reload or a new mount starts at 6 (TC-12, FR-100).

Traces: FR-43, FR-67, FR-66, FR-92, FR-97, FR-98, FR-73, FR-100, FR-101, FR-111

#### Scenario: Size control structure and default

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="size"]`
- **THEN** it has `role="radiogroup"` and `aria-label` equal to «Розмір поля», and it contains exactly three `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Поле 4×4», «Поле 6×6» and «Поле 8×8», in this order
- **AND** the second button has `aria-checked="true"` and the other two have `aria-checked="false"`

#### Scenario: Size buttons are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three size buttons
- **THEN** none has the `disabled` attribute and none has a negative `tabindex`, so Tab reaches each one, and a click on each (the activation that Enter and Space perform on a native button) marks its size (arrow keys are not required, A-24)

#### Scenario: A size press only marks

- **GIVEN** a 6x6 fixture board with player entries, the sheet opened through the stubbed `showPopover()`, a counting seed source, a `generate` spy and the `showModal` spy with the counts read now
- **WHEN** the player presses «Поле 8×8» (a marking press, no «Почати»)
- **THEN** `aria-checked="true"` is on «Поле 8×8» only, `[data-board]` keeps `data-size="6"` and its cell texts, the summary reads `6×6 · Розминка`, and the sheet's stub state is still open
- **AND** `showModal` and `hidePopover` were never called, and the seed-source and generator call counts equal the counts read now

#### Scenario: Choose 4x4 on a board without entries

- **GIVEN** the default 6x6 board with no player entries, a seed source returning 1 and then 2, and the real engine generator
- **WHEN** the player chooses «Поле 4×4» (marks it, then presses «Почати»)
- **THEN** `[data-board]` has `data-size="4"` and contains exactly 16 `[data-cell]` elements with `data-row` and `data-col` values 1 to 4, each pair appearing exactly once
- **AND** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 4 and seed 2, and each given cell shows the digit the generator returns for it
- **AND** `aria-checked="true"` is on «Поле 4×4» only

#### Scenario: Choose 8x8 after play

- **GIVEN** a 6x6 fixture board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted` and some cells with `cell-violation`, and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати»), and then presses `[data-confirm="yes"]`
- **THEN** after «Почати» the dialog is open and the board is still 6x6 with `aria-checked="true"` on «Поле 6×6»
- **AND** after the confirmation `[data-board]` has `data-size="8"` and contains exactly 64 `[data-cell]` elements with no player entries (a non-given cell shows empty text), and `aria-checked="true"` is on «Поле 8×8» only
- **AND** `[data-message="hint"]` has empty text content and no cell has `cell-hinted`
- **AND** the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: Choose 8x8 after a win

- **GIVEN** a 6x6 fixture board on which the win message is shown (the board is solved, so no cell has `cell-violation`), and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and then presses `[data-confirm="yes"]` (a solved board has entries, A-29)
- **THEN** `[data-message="win"]` has empty text content and `[data-board]` has `data-size="8"` and 64 cells

#### Scenario: Going back to 6x6

- **GIVEN** the page shows an 8×8 board reached by pressing «Поле 8×8» on an untouched 6x6 board
- **WHEN** the player chooses «Поле 6×6» (marks it, then presses «Почати»)
- **THEN** `[data-board]` has `data-size="6"` and contains exactly 36 cells, and `aria-checked="true"` is on «Поле 6×6» only

#### Scenario: aria-checked stays on the shown size until the confirmation

- **GIVEN** a 6x6 board with player entries
- **WHEN** the player chooses «Поле 4×4», the test reads the buttons, and then presses `[data-confirm="no"]` and reads them again
- **THEN** both times `aria-checked="true"` is on «Поле 6×6» only and the board is still 6x6

#### Scenario: A change takes exactly one seed and passes the chosen size

- **GIVEN** a seed source returning 1, 2, 3 and so on, counting its calls, and a `generate` spy recording `(size, seed)`
- **WHEN** the page is mounted, then the player chooses «Поле 4×4», then «Поле 8×8» (each board has no player entries)
- **THEN** the spy recorded `(6, 1)`, `(4, 2)` and `(8, 3)` in this order and the seed source was called exactly three times

#### Scenario: A generator error keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries, a hint sentence shown and a hint-filled cell, a counting seed source, a `window` `error` listener, and an injected `generate` that throws for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and then presses `[data-confirm="yes"]`
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"` with the same cell texts and highlights, both message regions keep their text, and the hint-filled cell keeps `cell-hinted`
- **AND** `aria-checked="true"` is on «Поле 6×6» only and the dialog is closed
- **AND** the seed source was called exactly once for the failed change (one seed per generation attempt)

#### Scenario: A generator result of the wrong size keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries and a hint sentence shown, and an injected `generate` that returns a 6x6 fixture puzzle for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and then presses `[data-confirm="yes"]`
- **THEN** `[data-board]` keeps `data-size="6"` with 36 cells and the same cell texts, both message regions keep their text, and `aria-checked="true"` is on «Поле 6×6» only

#### Scenario: Hint and win at the chosen size

- **GIVEN** the player has pressed the size button of the row below on an untouched 6x6 board, and the injected `generate` returned the fixture of that row

| N | Fixture | Hint action | Expected hint | Win action |
|---|---------|-------------|---------------|------------|
| 4 | only givens `0` at `data-row` 2 with `data-col` 1 and 2 | press `[data-action="hint"]` | engine returns `{ kind: 'fill', row: 1, col: 2, value: 1, rule: 'pair' }`: cell `data-row="2"` `data-col="3"` shows `1` | a second fixture of size 4 with an explicit solution whose givens are every cell except one non-given cell: click that cell until it shows the solution digit |
| 8 | only givens `0` at `data-row` 8 with `data-col` 7 and 8 | press `[data-action="hint"]` | engine returns `{ kind: 'fill', row: 7, col: 5, value: 1, rule: 'pair' }`: cell `data-row="8"` `data-col="6"` shows `1` | a second fixture of size 8 with an explicit solution (a valid solved 8x8 grid written in the test) whose givens are every cell except the one at `data-row` 8 and `data-col` 8: click it until it shows the solution digit |

- **WHEN** the player does the hint action, and on the second fixture the win action
- **THEN** after the hint action the expected cell shows `1`, has `cell-hinted`, every other cell has the same text as before, and `[data-message="hint"]` shows the engine's sentence
- **AND** after the win action `[data-message="win"]` shows the win message required by «Win message when solved»

#### Scenario: Violations in the givens of a new board show at once

- **GIVEN** a 6x6 board with no player entries and an injected `generate` that returns, for size 8, the fixture of the row below

| Fixture (8x8, only these givens) | Cells that have `cell-violation` right after the change |
|----------------------------------|----------------------------------------------------------|
| `0` at `data-row` 8 with `data-col` 1, 2 and 3 (an inconsistent fixture) | exactly (8, 1), (8, 2), (8, 3) |
| `1` at `data-col` 8 with `data-row` 1, 2, 4, 6 and 7 (five `1` in the column, no three side by side) | all eight cells with `data-col="8"` and no cell outside that column |

- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and presses nothing else
- **THEN** the cells with `cell-violation` are exactly those of the row

#### Scenario: The choice is not remembered

- **GIVEN** a page on which the player pressed «Поле 8×8», and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page's `aria-checked="true"` is on «Поле 6×6» only and its `[data-board]` has `data-size="6"` and 36 cells
- **AND** `localStorage` and `sessionStorage` still hold no entry

### Requirement: The board is a labelled group of cell buttons

The page SHALL give `[data-board]` `role="group"` and the `aria-label` «Поле N×N» in Ukrainian mode or "Grid N×N" in English mode for the size N of the board shown (digits and the sign × U+00D7, no letter of the other script), and the children of the board SHALL be exactly its N×N `[data-cell]` buttons, in reading order (FR-61, FR-69). No element of the page SHALL have `role="grid"`, `role="row"` or `role="gridcell"`, and no `[data-cell]` SHALL carry a `role` attribute (a button keeps its own role). The attributes and classes of the DOM contract on cells (`data-cell`, `data-row`, `data-col`, `data-given`, `cell-given`, `cell-violation`) are unchanged. The page SHALL put an `id` on a descendant of its root only to wire the rules popover, the setup sheet, the settings panel and the confirmation dialog: the rules panel, the heading inside it, the setup sheet, the settings panel and the element that holds the confirmation text (FR-57, FR-96, FR-117, FR-67). Each of these five ids ends in a number that belongs to the mount, so two pages mounted on two roots of one document share no id, and no other descendant of the root has an `id`. The page SHALL NOT use a `for` attribute. The stylesheet SHALL NOT use `display: contents` on any rule, because that has a history of dropping the semantics of the element it is applied to (here the board group and the cell buttons).

Traces: FR-61, FR-43, FR-57, FR-67, FR-69, FR-96, FR-117, FR-111

#### Scenario: Role and name of the default board

- **GIVEN** the page is mounted with the default size
- **WHEN** the test reads `[data-board]`
- **THEN** it has `role="group"` and `aria-label` equal to «Поле 6×6»
- **AND** it has exactly 36 children, and they are exactly the 36 `[data-cell]` buttons, with `data-row` and `data-col` running row by row and left to right from (1, 1) to (6, 6)
- **AND** no element of the root has `role="grid"`, `role="row"` or `role="gridcell"`, and no cell has a `role` attribute

#### Scenario: The group name in English mode

- **GIVEN** the page in English mode with the default size
- **WHEN** the test reads `[data-board]`
- **THEN** it has `role="group"` and `aria-label` equal to "Grid 6×6", and after the board 4×4 and the board 8×8 are shown the names are "Grid 4×4" and "Grid 8×8"

#### Scenario: The group name follows the size

- **GIVEN** a mounted page with the real engine generator
- **WHEN** the player selects 4×4 and then 8×8
- **THEN** after 4×4 the board has `aria-label` «Поле 4×4», `role="group"` and 16 cell children; after 8×8 it has «Поле 8×8», `role="group"` and 64 cell children

#### Scenario: A failed size change keeps the board and its name

- **GIVEN** a 6x6 fixture page and an injected `generate` that throws for size 8
- **WHEN** the player selects 8×8
- **THEN** the board keeps `aria-label` «Поле 6×6», `role="group"` and its 36 cells

#### Scenario: The cell contract is unchanged and only five elements have ids

- **GIVEN** a rendered board
- **WHEN** the test reads every cell and every element of the root
- **THEN** every cell still has `data-cell`, `data-row`, `data-col` and `data-given`, `cell-given` exactly on the givens, and the text content empty, `0` or `1`
- **AND** exactly five descendants of the root have an `id`: the element `[data-section="rules"]`, the heading inside it, the element `[data-section="setup"]`, the element `[data-section="settings"]` and the element that holds the confirmation text; each id ends in digits, and no element has a `for` attribute
- **AND** after a click, a hint, a size change, a level change, a theme press and a new puzzle the same five elements are the only ones with an `id`

#### Scenario: Two mounts share no id

- **GIVEN** the page is mounted on two roots in the same document
- **WHEN** the test reads the ids under each root
- **THEN** each root has five ids, the ten ids are pairwise different, and `document.querySelectorAll('[id]')` finds exactly those ten elements

#### Scenario: No rule drops semantics with display: contents

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches it for `display: contents` (any spacing)
- **THEN** there is no match

### Requirement: The page meets the WCAG 2.2 AA criteria of the accessibility requirements

The page SHALL meet WCAG 2.2 AA for what FR-43, FR-59 to FR-65, FR-67, FR-69, FR-70 and FR-87 to FR-101, FR-102, FR-107 to FR-109 and FR-117 cover (NFR-9): language of page 3.1.1 (`<html lang>` is "uk" or "en" and matches the page language, FR-109) and language of parts 3.1.2 (the two language options carry their own `lang`, A-52), keyboard operation 2.1.1 (every cell and every control reached by Tab in reading order and operated by Enter and Space as a native button, FR-59 and FR-60), name, role and value 4.1.2 (the role and name of the board group, of the four radiogroups, of the summary button, of the settings button, of the start button «Почати», of the setup sheet and of the settings panel, the cell names, `aria-checked` (the marked state in the two radiogroups while the sheet is open, FR-100), `aria-disabled`, `aria-invalid`), labels 3.3.2 (the accessible names «Розмір поля», «Складність», «Тема», «Мова» and «Налаштування» and the visible text of each size button, each level button, each theme option, each language option and the summary button), status messages 4.1.3 (the two `role="status"` regions), use of colour 1.4.1 (the heavier violation border and `aria-invalid`) and non-text contrast 1.4.11 (the 3:1 pairs) and visible focus 2.4.7 (the `:focus-visible` rules). Every button of the page (the cell buttons, the size radio buttons, the level radio buttons, the summary button, the start button, the settings button and the close buttons of the sheet and of the settings panel included; the name of a button without `aria-label` is its text content without `aria-hidden` descendants) SHALL have a non-empty accessible name in the page language: its `aria-label` when it has one (every cell), otherwise its text; the board group, the four radiogroups, the setup sheet and the settings panel SHALL have a non-empty `aria-label` in the page language (the option of the other language keeps its own language, A-52). No element of the page SHALL have a `tabindex` attribute, before or after play. Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).

Traces: NFR-9, NFR-5, FR-43, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, FR-67, FR-69, FR-70, FR-87, FR-88, FR-91, FR-95, FR-96, FR-97, FR-98, FR-99, FR-100, FR-101, FR-102, FR-117, FR-107, FR-108, FR-109

#### Scenario: Every button, the radiogroups, the sheet and the board have a Ukrainian name

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test computes the accessible name of each `button` (its `aria-label` when present, else its text content without `aria-hidden` descendants) and of each `[role="radiogroup"]`, of `[data-section="setup"]` and of `[data-board]` (their `aria-label`)
- **THEN** there are 60 buttons (36 cells and 24 others: the two language options, «Правила», the settings button, the summary button, three size buttons, four level buttons, three theme options, «Почати», «Закрити», the settings panel's «Закрити», «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати»), four radiogroups, the setup sheet, the settings panel and the board, every name is non-empty, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/` (except the name of the option "English", whose own `lang` differs from `<html lang>`, A-52)
- **AND** the names include «Підказка», «Скинути», «Нова головоломка», «Розмір поля», «Поле 6×6», «Складність», «Поле і складність», «Налаштування», «Тема», «Світла», «Темна», «Як у системі», «Мова», «Українська», "English", «Почати», «Закрити», `Поле і складність: 6×6 · Розминка`, the four level buttons as name, space and description, and the 36 cell names

#### Scenario: No element of the page has a tabindex, before and after play

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test reads every element of the root at mount, and again after a click on a cell and a hint press
- **THEN** no element of the root has a `tabindex` attribute at either moment

#### Scenario: The level radiogroup exposes its state

- **GIVEN** a mounted page, and the same page after «Поле 4×4»
- **WHEN** the test reads the `aria-checked` and `aria-disabled` attributes of the four level buttons
- **THEN** at 6x6 exactly one button has `aria-checked="true"`, none has `aria-disabled`, and at 4x4 exactly one has `aria-checked="true"` and three have `aria-disabled="true"`, so the state of the group is exposed by attributes and not by colour alone

#### Scenario: The theme radiogroup exposes its state

- **GIVEN** a mounted page with `localStorage` empty, and the same page after «Темна» is pressed
- **WHEN** the test reads `aria-checked` of the three theme options
- **THEN** exactly one option has `aria-checked="true"` («Як у системі» at first, «Темна» after the press), the others `"false"`, and none has `aria-disabled`

#### Scenario: The language radiogroup exposes its state

- **GIVEN** a mounted page with `localStorage` empty, and the same page after "English" is pressed
- **WHEN** the test reads `aria-checked` of the two language options
- **THEN** exactly one has `aria-checked="true"` («Українська» at first, "English" after the press), and `<html lang>` and the `lang` of each option are as in «Document language and title»

#### Scenario: The radiogroups expose the marked state while the sheet is open

- **GIVEN** a mounted 6×6 page at «Розминка», the sheet opened, and «Поле 4×4» marked
- **WHEN** the test reads `aria-checked` and `aria-disabled` of the three size buttons and the four level buttons
- **THEN** `aria-checked="true"` is on «Поле 4×4» only and on «Розминка» only, and «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`
- **AND** after the sheet is closed by a `toggle` event with `newState` `closed`, `aria-checked="true"` is on «Поле 6×6» only and no level button has `aria-disabled`

#### Scenario: English mode names every control

- **GIVEN** a mounted page on a 6x6 fixture in English mode
- **WHEN** the test computes the accessible name of each `button` and of each `[role="radiogroup"]`, of `[data-section="setup"]`, of `[data-section="settings"]` and of `[data-board]`
- **THEN** there are the same 60 buttons, four radiogroups, the sheet, the settings panel and the board, every name is non-empty, matches `/[A-Za-z]/` and does not match `/\p{Script=Cyrillic}/u` except the name of the option «Українська» (its own `lang` differs)
- **AND** `<html lang>` is `en`

### Requirement: Hinted cell marker

The cell that the hint button filled SHALL carry the class `cell-hinted` until the next board change, and at most one cell SHALL carry it at any time (FR-66). The marker SHALL be removed by any later board change: a click on a non-given cell (including the hinted cell itself), a hint that fills another cell (the marker then moves to that new cell), «Нова головоломка», a press of «Почати» (at once, or after «Так, почати») and «Скинути». The marker SHALL NOT be removed by an action that changes no cell: a click on a given cell (FR-33), a hint that fills no cell (FR-25, FR-26), opening or closing the rules panel (FR-57), opening or closing the setup sheet (FR-96), marking a size or a level in the setup sheet (FR-100), a theme or language switch (FR-103, FR-108), a failed generation that keeps the previous board (FR-43), a cancelled confirmation (FR-67) and a press of the already selected size (FR-73; that press now only marks). An action that needs confirmation (FR-67) removes the marker when it is performed, not when it is requested. A given cell SHALL never carry the marker, and no cell carries it at mount. Which cue the marker draws (a cue that is not colour alone) is rendering and is covered by the held NFR-11 and NFR-14, see `docs/requirements-held.md`; this requirement pins the class only.

Traces: FR-66, FR-39, FR-88, FR-96, FR-100, FR-101, FR-103, FR-108

#### Scenario: No cell carries the marker at mount

- **GIVEN** the page has just been mounted with a fixture puzzle that has givens
- **WHEN** the test reads every `[data-cell]`
- **THEN** no cell has the class `cell-hinted`
- **AND** after a hint press on that page no cell with `data-given="true"` has the class `cell-hinted`

#### Scenario: A second hint moves the marker

- **GIVEN** a fixture puzzle on which a first press of the hint button fills cell X, and a second press fills another cell Y (the first fill breaks no rule)
- **WHEN** the player presses `[data-action="hint"]` twice
- **THEN** after the first press exactly one cell, X, has the class `cell-hinted`
- **AND** after the second press exactly one cell, Y, has it and X no longer has it

#### Scenario: Later board changes remove the marker

- **GIVEN** a fixture puzzle on which the hint button has filled cell X, so X carries `cell-hinted`
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| clicks a non-given cell other than X |
| clicks X itself |
| presses «Нова головоломка» |
| changes the size to 4 (one run) or to 8 (one run) by a choice (mark and «Почати»), the injected generator returning a fixture of that size |
| changes the level to «Задачка» (one run) by a choice |
| presses «Почати» with the marked choice equal to the board shown (one run) |
| presses «Скинути» |

- **THEN** after each action no cell of the board shown has the class `cell-hinted`

#### Scenario: Actions that change no cell keep the marker

- **GIVEN** a fixture puzzle with at least one given cell, on which the hint button has filled cell X, so X carries `cell-hinted`
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| clicks a given cell (once, and again twice) |
| presses «Підказка» on a board where the hint engine returns no cell (the board breaks a rule, reachable only when the hint's own fill broke one, since a click on a non-given cell removes the marker; or no rule applies) |
| clicks `[data-action="rules"]` and then the close button «Зрозуміло» |
| opens the setup sheet through the stubbed `showPopover()`, then clicks `[data-action="setup-close"]` |
| opens the setup sheet, presses «Поле 8×8» and «Задачка» (marking presses, no «Почати»), then clicks `[data-action="setup-close"]` |
| opens the settings panel through the stubbed `showPopover()` and presses a theme option |
| opens the settings panel and presses the language option that is not shown |

- **THEN** after each action exactly one cell has the class `cell-hinted`, it is X, and X still shows the digit the hint wrote

#### Scenario: A failed generation keeps the marker

- **GIVEN** a 6x6 fixture board on which a hint filled cell X, and an injected `generate` that throws for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати»)
- **THEN** `[data-board]` keeps `data-size="6"` and the same texts, and X still has the class `cell-hinted`

#### Scenario: A hint that wins keeps the marker on the filled cell

- **GIVEN** a fixture puzzle with exactly one cell empty, every other cell holding the solution digit, and the hint engine targeting that cell
- **WHEN** the player presses the hint button
- **THEN** `[data-message="win"]` shows the win message (see «Win message when solved»)
- **AND** exactly one cell has the class `cell-hinted`, the filled one

#### Scenario: Two mounts are independent

- **GIVEN** two pages mounted on two roots, a hint pressed on the first
- **WHEN** the test reads the second page
- **THEN** no cell of the second page has the class `cell-hinted`

### Requirement: Every cell is its own Tab stop

The page SHALL make every `[data-cell]` of the board shown its own Tab stop: the cells are reached by Tab in reading order (row by row, left to right), after the summary button and before the hint button (FR-59, FR-68, FR-69, FR-95), and the page SHALL NOT put a `tabindex` attribute on any element of its root, at mount and after every board change. The page SHALL NOT handle the Arrow, Home and End keys, with or without Ctrl, Shift or Alt: it handles no key event on the board or its cells, so no key event on the board or a cell is default-prevented (Tab, Shift+Tab, PageUp, PageDown, Escape and letters included), no key moves DOM focus, and no key changes a cell (FR-59). Showing a board (the mount, a performed new puzzle, a performed «Почати», a reset) SHALL NOT move DOM focus, with one exception: «Почати» and the close button «Закрити» of the setup sheet return DOM focus to the summary button (FR-97, FR-101, see «Choosing and closing the sheet»); when «Почати» needs the confirmation, DOM focus goes to «Скасувати» while the dialog is open and then to the summary button (FR-98). A press on a size button or a level button inside the sheet moves no focus: it stays on the pressed button. A press on a theme option or a language option leaves DOM focus on the pressed option (it shows no board, FR-103, FR-108, FR-117); after a language switch the focused element is the same element as before the switch. A hint, whether or not it fills a cell, SHALL leave DOM focus on the hint button. Tab and Shift+Tab are the browser's. A new puzzle or «Почати» whose generation fails keeps the previous board and its cells.

Traces: FR-59, FR-43, FR-68, FR-69, FR-95, FR-97, FR-100, FR-101, FR-103, FR-117, FR-108

#### Scenario: Every cell is a Tab stop in reading order

- **GIVEN** the page is mounted on a fixture puzzle (6x6)
- **WHEN** the test reads the elements of the root in document order
- **THEN** no element of the root has a `tabindex` attribute
- **AND** the summary button `[data-action="setup"]` precedes the cell with `data-row="1"` and `data-col="1"`, the 36 cells follow in reading order up to `data-row="6"` and `data-col="6"`, and that last cell precedes `[data-action="hint"]`

#### Scenario: Arrow, Home and End keys are not handled

- **GIVEN** a mounted board of each size N in 4, 6 and 8, and the test has given DOM focus to the non-given cell at `data-row="2"` and `data-col="2"`
- **WHEN** the test dispatches ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, End, Ctrl+Home, Ctrl+End, Shift+ArrowRight and Alt+ArrowRight on that cell, one after the other, and then Arrow, Enter and space keys on `[data-board]` itself
- **THEN** every dispatched event has `defaultPrevented` false and `document.activeElement` is still that cell after each
- **AND** no cell changed its text, its `data-given` value or its classes

#### Scenario: Keys on a given cell change nothing and move nothing

- **GIVEN** a mounted board whose cell at row 1 column 3 is a given showing `0` and has DOM focus
- **WHEN** the test dispatches ArrowDown, ArrowUp, End and Home on it
- **THEN** no cell changes its text, its `data-given` or its classes, none of the events has `defaultPrevented` true, and `document.activeElement` is still that cell

#### Scenario: Other keys are not prevented

- **GIVEN** a mounted 6x6 page and the cell at row 3 column 3 has DOM focus
- **WHEN** the test dispatches Tab, Shift+Tab, PageDown, PageUp, Escape and `a` on it
- **THEN** every dispatched event has `defaultPrevented` false and the focus stays on that cell

#### Scenario: Showing a board does not move the focus

- **GIVEN** a button outside the page root has DOM focus, and the page is then mounted on a new root with an injected `generate` that returns a fixture for sizes 6 and 4
- **WHEN** the mount returns, and then the test gives DOM focus to `[data-action="new"]` and presses it, and gives DOM focus to `[data-action="reset"]` and presses it (the boards have no entries, so each action is performed at once)
- **THEN** after the mount the outside button still has the focus, and after each press `document.activeElement` is the button that was pressed

#### Scenario: «Почати» returns the focus to the summary button

- **GIVEN** the page of the previous scenario, the sheet opened through the stubbed `showPopover()`, DOM focus on the button «Поле 4×4», and «Поле 4×4» marked by a press
- **WHEN** the player presses «Почати» (the board has no entries, so at once)
- **THEN** a 4×4 board is shown and `document.activeElement` is the summary button, not the option or «Почати»

#### Scenario: Marking leaves the focus on the pressed button

- **GIVEN** the page of the previous scenario, the sheet opened through the stubbed `showPopover()`, and DOM focus on the button «Поле 4×4»
- **WHEN** the player presses «Поле 4×4» (a marking press)
- **THEN** `document.activeElement` is still the button «Поле 4×4», and no board was shown

#### Scenario: A hint leaves the focus on the hint button

- **GIVEN** two mounted pages, one on the fixture `PAIR_ROW` (the hint fills a cell) and one on a fixture on which `hint(board, 4)`, the call the page makes, fills nothing (the suite asserts this premise by calling the engine on the fixture; the earlier fixture `ISOLATED` fills nothing only at the engine's default ceiling and is not used unless the assertion holds), with DOM focus on `[data-action="hint"]` in each
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** on both pages `document.activeElement` is still `[data-action="hint"]`

#### Scenario: A theme press leaves the focus on the option

- **GIVEN** the settings panel opened through the stubbed `showPopover()` and the test focus on the option «Темна»
- **WHEN** the player presses «Темна»
- **THEN** `document.activeElement` is still the option «Темна», and the page has added no `tabindex` to any element

#### Scenario: A language press leaves the focus on the option

- **GIVEN** the settings panel opened through the stubbed `showPopover()` and the test focus on the option "English"
- **WHEN** the player presses "English"
- **THEN** `document.activeElement` is still that option element (the same element object), and the page has added no `tabindex` and no key handler

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила» and the settings button, the summary button, the three size buttons, the four level buttons, the three theme options, the two language options, the close button «Закрити» of the settings panel, the start button «Почати» and the close button «Закрити» of the setup sheet, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the 2px gap between cells shows the page colour on the ring's inner side, the ring's outer edge lands on a neighbour's fill (the pairs `--color-focus` against cell, given and violation fills, 6.70, 5.41 and 4.63 with the design's values) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all. The open setup sheet SHALL keep a keyboard-focused control clear of its sticky footer row (FR-65 "unobscured", WCAG 2.4.11): the open sheet declares a `scroll-padding-bottom` of at least the footer height, so the browser's own focus scrolling brings a focused option above the footer (second review-gate fix round, 2026-10-10, autonomy-log row 126).

Traces: FR-65, FR-87, FR-95, FR-97, FR-101, FR-102, FR-117, FR-107

#### Scenario: Focus-visible rules exist for the cell and the button

- **GIVEN** the parsed `src/ui/style.css` (jsdom never matches `:focus-visible`, so these rules are checked as declarations)
- **WHEN** the test looks for the rules whose selector list contains `.cell:focus-visible` or `button:focus-visible`
- **THEN** each of the two exists, declares `outline-style: solid`, an `outline-width` of at least 2px and `outline-color: var(--color-focus)`

#### Scenario: The cell ring is outside the border and above the neighbours

- **GIVEN** the `.cell:focus-visible` rule
- **WHEN** the test reads its declarations
- **THEN** `outline-offset` is `2px`, `position` is `relative` and `z-index` is an integer of at least 1
- **AND** the `button:focus-visible` rule declares an `outline-offset` greater than 0

#### Scenario: Every page button is a button element

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="rules"]`, the summary button `[data-action="setup"]`, the three size `button[role="radio"]` and the four level `button[role="radio"]` (FR-87), the three theme `button[role="radio"]` (FR-102), the two language `button[role="radio"]` (FR-107), the settings button `[data-action="settings"]`, the close button `[data-action="settings-close"]`, the start button `[data-action="setup-start"]`, the close button `[data-action="setup-close"]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, the close button of `[data-section="rules"]`, `[data-confirm="yes"]`, `[data-confirm="no"]` and every `[data-cell]`
- **THEN** each of them is a `button` element, so `button:focus-visible` (and `.cell:focus-visible` for the cells) applies to it

#### Scenario: Nothing removes the outline

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches for `outline: none`, `outline: 0`, `outline-style: none` and `outline-width: 0` (any spacing)
- **THEN** there is no match

#### Scenario: The stylesheet stays inside the build target, with one `:has(` exception

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test searches the text for `!important` and collects the rules whose selector contains `:has(`
- **THEN** there is no `!important`, anywhere
- **AND** exactly one rule contains `:has(`, the subject of its selector (its last compound selector) is `.message-idle`, and its only declaration is `display: none`
- **AND** the raw text of the file contains `:has(` exactly once, so no rule the parser drops and no at-rule prelude holds another

#### Scenario: The open sheet reserves the footer in its scroll padding

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule for the open setup sheet (`.setup-sheet:popover-open`)
- **THEN** it declares `scroll-padding-bottom` with a length of at least `2.75rem` plus the strip (`calc(2.75rem + 16px)` or more)

#### Scenario: A focused option in a scrolling sheet is not covered by the footer

- **GIVEN** a real browser at 320×700 and at 1366×650 (e2e, `e2e/nfr-13-a11y.spec.ts`), the setup sheet open with «Поле 4×4» marked, so the sheet scrolls inside itself
- **WHEN** the keyboard moves the focus with Tab from «Поле 4×4» through the size options and the four level options, with no scrolling by script
- **THEN** for each focused option the bottom of its focus ring (its rect bottom plus the outline offset and width) is at or above the top of the footer strip behind «Почати» and «Закрити»

### Requirement: Settings button and panel

The page header SHALL hold, between the title and the button «Правила» (document order: the heading, then `[data-action="settings"]`, then `[data-action="rules"]`), a settings button `[data-action="settings"]` with `type="button"`, whose only child is one decorative inline `svg` (a drawn gear, `aria-hidden="true"`, no text), with the accessible name «Налаштування» ("Settings" in English mode) given by its `aria-label` and a `popovertarget` equal to the `id` of the settings panel, so that it opens the panel with no script (FR-68, FR-117, signed wireframe Topic 3 B, autonomy-log row 120). The button carries no `aria-haspopup`, `aria-expanded` or `tabindex`. The settings panel `[data-section="settings"]` SHALL be created once at mount, inside the page root and outside the header, the board and the message area; it is an element with the `popover` attribute (`popover="auto"`) and `role="dialog"`, with the `aria-label` «Налаштування» ("Settings" in English mode), no `aria-labelledby`, and an `id` that ends in a number belonging to the mount (the fifth id of the mount, A-41 amended). It holds, in this order: the visible plain-text label «Тема» and the theme control `[data-control="theme"]` (see «Theme control»), the visible plain-text label «Мова» and the language control `[data-control="language"]` (see «Language control»), and a close button `[data-action="settings-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the panel's `id` and `popovertargetaction="hide"`. The panel follows the message area in document order and precedes `[data-dialog="confirm"]`; it is outside the sequence of «Page document order». Escape, a click outside the panel (the light dismiss) and the close button close it natively; the page adds no key handler and no focus handling for it (FR-59). The panel is the same element, with the same children, after a hint, a win, a reset, «Нова головоломка», a press of «Почати», a theme press and a language press. Where the button is drawn, the bottom sheet on the phone and the panel under the header at the right on tablet and desktop, the gear's drawing and the 44 px sizes are layout, covered by NFR-12 (see «The theme options meet the touch-target floor») and the held NFR-14 (`review-set-13`). The hooks `[data-action="settings"]`, `[data-section="settings"]` and `[data-action="settings-close"]` are spec-made proxies, to confirm against the signed review set (task 1.4).

Traces: FR-68, FR-102, FR-117, NFR-9, FR-107, FR-111

#### Scenario: Settings button and panel at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="settings"]` and `[data-section="settings"]`
- **THEN** exactly one of each exists in the root; the button is a `button` with `type="button"`, `aria-label` equal to «Налаштування», `popovertarget` equal to the panel's `id`, no `aria-haspopup`, `aria-expanded` or `tabindex`, and exactly one child element, an `svg` with `aria-hidden="true"` and no text node
- **AND** the panel has the `popover` attribute, `role="dialog"`, `aria-label` equal to «Налаштування», no `aria-labelledby`, a non-empty `id`, is not inside the `header`, `[data-board]` or the message area, follows the message area and precedes `[data-dialog="confirm"]`
- **AND** its element children, in order, are a plain-text element with the text «Тема», `[data-control="theme"]`, a plain-text element with the text «Мова», `[data-control="language"]` and `[data-action="settings-close"]`

#### Scenario: The close button

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="settings-close"]`
- **THEN** it is a `button` with `type="button"`, the text «Закрити», `popovertarget` equal to the panel's `id`, `popovertargetaction="hide"` and no `tabindex`

#### Scenario: The settings button and panel are named in English

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-action="settings"]`, `[data-section="settings"]` and the labels in the panel
- **THEN** the button's and the panel's `aria-label` are "Settings", the labels read "Theme" and "Language", and the close button reads "Close"

#### Scenario: The panel opens and closes with no script

- **GIVEN** the page has just been mounted, and `showPopover`, `hidePopover` and `togglePopover` are installed as spies
- **WHEN** the test clicks `[data-action="settings"]` and then `[data-action="settings-close"]`
- **THEN** no spy was called, and the board, the messages, the summary, `aria-checked` of every group and every cell are unchanged

#### Scenario: The header order is the title, the settings button, «Правила»

- **GIVEN** the page has just been mounted
- **WHEN** the test compares the document positions of the heading «Бінарка», `[data-action="settings"]` and `[data-action="rules"]`
- **THEN** each follows the previous one, and all three are inside the `header`

#### Scenario: Two mounts stay independent

- **GIVEN** the page is mounted on two roots in the same document
- **WHEN** the test reads the `popovertarget` of each root's settings button and settings close button
- **THEN** the two panels have different `id` values, and each button names the panel of its own root

#### Scenario: The panel survives every action

- **GIVEN** a mounted page with a fixture puzzle, the panel element and its children read at mount
- **WHEN** the player presses «Підказка», reaches a win, presses «Скинути», «Нова головоломка», chooses a size and a level, presses a theme option and presses the language option that is not shown (each from a freshly mounted page, confirmed where asked)
- **THEN** after each action there is exactly one `[data-section="settings"]`, it is the same element as at mount, with the same five children

### Requirement: Theme control

The page SHALL offer a theme control `[data-control="theme"]` (FR-102): an element with `role="radiogroup"` and the accessible name «Тема» ("Theme" in English mode, `aria-label`), holding exactly three `<button type="button" role="radio">` elements in this order, labelled «Світла», «Темна» and «Як у системі» ("Light", "Dark", "System" in English mode, Q6, FR-111), with the attribute `data-theme-option` equal to `light`, `dark` and `auto`. The option that is chosen SHALL have `aria-checked="true"` and the other two `aria-checked="false"`. With nothing valid stored the option «Як у системі» is chosen (Q14, see «Invalid or missing stored values fall back»). Each option is labelled by its own visible text and carries no `aria-label` and no `aria-labelledby` (as FR-62); the group has no `aria-labelledby` and shows no visible label. The control and its options carry no `id`. **The control sits in the settings panel** (Topic 3, option B of the signed wireframe, autonomy-log row 120), directly below a visible plain-text label «Тема» (an element that is not a `label`, with no `for`; the group's name stays its `aria-label`); the panel and the button that opens it are specified by «Settings button and panel». A test finds the control with `root.querySelector('[data-control="theme"]')` and opens the panel first through the stubbed `showPopover()` (A-44). How the panel is drawn is the design's (`review-set-13`, held NFR-14). Its texts are specified by «Texts of the settings button, the settings panel and the theme control».

Traces: FR-102, FR-68, NFR-9, FR-111

#### Scenario: Theme control structure and default

- **GIVEN** the page has just been mounted with `localStorage` empty and no `matchMedia`
- **WHEN** the test reads `[data-control="theme"]`
- **THEN** exactly one such element exists in the root, inside `[data-section="settings"]`, it has `role="radiogroup"` and `aria-label` equal to «Тема», no `aria-labelledby`, no `id`, and it contains exactly three `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Світла», «Темна» and «Як у системі» in this order, with `data-theme-option` `light`, `dark` and `auto`
- **AND** the third button has `aria-checked="true"` and the other two have `aria-checked="false"`, and no option has `aria-label`, `aria-labelledby`, `tabindex` or `disabled`

#### Scenario: The control follows its visible label in the settings panel

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the children of `[data-section="settings"]`
- **THEN** a plain-text element with the text «Тема» that is not a `label` element immediately precedes `[data-control="theme"]`, and the control is not inside `[data-board]`, the message area or the header

#### Scenario: The stored choice is checked at mount

- **GIVEN** `localStorage` holds `binarka.theme` = `dark` before the page is mounted
- **WHEN** the page is mounted
- **THEN** `aria-checked="true"` is on «Темна» only, and `localStorage` still holds exactly the same value

#### Scenario: The theme control in English mode

- **GIVEN** the page mounted with `binarka.language` = `en`
- **WHEN** the test reads `[data-control="theme"]` and its options
- **THEN** the group's `aria-label` is "Theme", the option texts are "Light", "Dark" and "System" in this order, `data-theme-option` is still `light`, `dark` and `auto`, and the visible label above the group reads "Theme"

#### Scenario: The group is named by its aria-label and no label element exists

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the root
- **THEN** the root contains no `label` element and no `for` attribute, and the group's name is its `aria-label` «Тема»

### Requirement: Stored preferences

The page SHALL store the two preferences, and no other data, in `localStorage` (FR-113, TC-12): `binarka.theme` with the value `light`, `dark` or `auto`, and `binarka.language` with the value `uk` or `en`. The page SHALL write a key only when the player presses an option of that control that is not already chosen, and it writes the value of the pressed option, also when that value is the default (`auto`, `uk`; A-48). It SHALL NOT write at the mount, at a reload, on a game action (a cell click, a hint, «Нова головоломка», «Скинути», «Почати», a mark) or on a change of the system theme. It SHALL store nothing else, ever: no game state (the board, the entries, the givens, the size, the level, the seed, the messages, the hinted cell), no marked choice of the setup sheet (FR-100), no cookie, no `sessionStorage` and no IndexedDB (TC-12). Game state is never stored; saved progress is Future (FR-46). A preference is not game state (A-48).

Traces: FR-113, FR-100, TC-12, FR-108

#### Scenario: A press writes the pressed value once

- **GIVEN** `localStorage` empty and a `setItem` spy
- **WHEN** the player presses «Темна», and then «Як у системі»
- **THEN** `setItem` was called twice, with `binarka.theme` and `dark`, then with `binarka.theme` and `auto` (the default value is written too, A-48), and `localStorage` holds no other key

#### Scenario: A language press writes the pressed value once

- **GIVEN** `localStorage` empty and a `setItem` spy
- **WHEN** the player presses "English", and then «Українська»
- **THEN** `setItem` was called twice, with `binarka.language` and `en`, then with `binarka.language` and `uk` (the default value is written too, A-48), and `localStorage` holds no other key than `binarka.language`
- **AND** a press on the option already chosen, in a separate run, calls `setItem` zero times

#### Scenario: Pressing the default option on a fresh page writes nothing

- **GIVEN** `localStorage` empty and a `setItem` spy (the option «Як у системі» is checked by default)
- **WHEN** the player presses «Як у системі»
- **THEN** `setItem` was not called: the option is already chosen, and the default is written only when the player presses it while another option is chosen (A-48), as in the scenario above

#### Scenario: Nothing else writes

- **GIVEN** a page mounted with `localStorage` empty, a `setItem` spy and a system `change` listener
- **WHEN** the player clicks cells, presses «Підказка», «Нова головоломка» (confirmed), «Скинути», marks a size and a level, presses «Почати», and the test fires the system `change`
- **THEN** `setItem` was never called, `localStorage` and `sessionStorage` hold no entry, and `document.cookie` is empty

#### Scenario: The page source names no other store

- **GIVEN** the source files under `src/` and the text of `index.html` (the head step included)
- **WHEN** the test searches them for `sessionStorage`, `document.cookie` and `indexedDB`
- **THEN** none of them matches in any file

#### Scenario: The stored choice survives a remount

- **GIVEN** a page on which the player pressed «Темна», and a new root
- **WHEN** the page is mounted again on the new root
- **THEN** `aria-checked="true"` is on «Темна» only and `data-theme` is `dark`

#### Scenario: The stored language survives a remount

- **GIVEN** a page on which the player pressed "English", and a new root
- **WHEN** the page is mounted again on the new root
- **THEN** `aria-checked="true"` is on "English" only, `<html lang>` is `en` and the texts are English

### Requirement: Invalid or missing stored values fall back

At load the page SHALL ignore a missing key, an empty value and a value outside the list of «Stored preferences» (for example `Dark`, `system`, `ru`, `{}`) and use the default: the theme `auto` (Q14) and the language Ukrainian (FR-114). The page SHALL NOT rewrite or remove a bad value until the player presses an option.

Traces: FR-114, FR-113, FR-107

#### Scenario: Each bad theme value gives auto

- **GIVEN** `localStorage` holds `binarka.theme` = each of the values of the table below, in separate runs
- **WHEN** the page is mounted

| Stored value |
|--------------|
| (key missing) |
| (empty string) |
| `Dark` |
| `system` |
| `ru` |
| `{}` |

- **THEN** in every run `aria-checked="true"` is on «Як у системі» only, and the effective theme is the system theme
- **AND** the stored value is exactly as before the mount (no `setItem` and no `removeItem` call)

#### Scenario: Each bad language value gives Ukrainian

- **GIVEN** `localStorage` holds `binarka.language` = each of the values of the table below, in separate runs
- **WHEN** the page is mounted

| Stored value |
|--------------|
| (key missing) |
| (empty string) |
| `EN` |
| `english` |
| `de` |
| `{}` |

- **THEN** in every run `aria-checked="true"` is on «Українська» only, `<html lang>` is `uk`, and the texts are Ukrainian
- **AND** the stored value is exactly as before the mount (no `setItem` and no `removeItem` call)

### Requirement: Failing storage does not stop the page

When reading or writing `localStorage` throws (the access to `window.localStorage` throws, as in some private modes or with storage blocked, or `getItem` or `setItem` throws, for example on a quota error), the page SHALL still mount and play with no uncaught error and no message (FR-115): at load it uses the defaults of «Invalid or missing stored values fall back»; a press still applies the chosen theme or language for the rest of the session; nothing is retried.

Traces: FR-115, FR-113, FR-107

#### Scenario: The access to localStorage throws

- **GIVEN** `window.localStorage` is replaced by a getter that throws, and a `window` `error` listener
- **WHEN** the page is mounted and the player presses «Темна»
- **THEN** the `error` listener recorded nothing, the page shows its board, `aria-checked="true"` is on «Темна» only and `data-theme` is `dark`, and no text was added to the page

#### Scenario: getItem throws

- **GIVEN** `Storage.prototype.getItem` throws and a `window` `error` listener
- **WHEN** the page is mounted
- **THEN** the `error` listener recorded nothing, the theme is `auto` and the board is shown

#### Scenario: setItem throws and is not retried

- **GIVEN** `Storage.prototype.setItem` throws, counted by a spy
- **WHEN** the player presses «Темна»
- **THEN** `setItem` was called once, no error reached the page, `data-theme` is `dark`, and a second press on the same option does not call `setItem` again

#### Scenario: A language press still applies when storage throws

- **GIVEN** `Storage.prototype.setItem` throws and a `window` `error` listener
- **WHEN** the player presses "English"
- **THEN** the `error` listener recorded nothing, the texts are English, `<html lang>` is `en`, and `setItem` was called once

### Requirement: Preferences are applied before the first paint

The stored theme and the stored language (or the defaults) SHALL be applied to `<html>` (`data-theme` and `lang`; `color-scheme` follows from the stylesheet), to the theme-color meta and to `document.title` by a classic inline script in the document head of `index.html` that runs before the body is parsed, not by the page module (FR-116). The static `<title>` of `index.html` stays «Бінарка»; with `en` stored the step replaces it with "Binarka". The page then mounts directly in the stored language, with `aria-checked` already on the stored options. The step follows «Invalid or missing stored values fall back» and «Failing storage does not stop the page». It is the one deliberate duplicate outside `src/ui/strings.ts` and the storage module: it holds the two key names, the two titles and the two theme-color values; a test asserts that the names and the titles equal the module's values and that the two theme-color values equal `--color-page` of the light and of the dark token set. The inline script lives in `index.html`, so lint and `tsc` do not see it; its tests are its only check. The built file SHALL keep the inline classic script ahead of the module script and the stylesheet link that Vite injects into `<head>`; the test makes the build itself (`vite build` into a temporary output directory) so a stale `dist/` can never give a green result.

Traces: FR-116, FR-114, FR-115, FR-104, FR-106, FR-109, FR-107, FR-55

#### Scenario: The head step is a classic inline script in the head

- **GIVEN** the text of `index.html`
- **WHEN** the test parses it
- **THEN** the `head` holds an inline `script` without `src`, without `type="module"`, without `defer` and without `async`, and the `body` holds no such script that sets the theme

#### Scenario: The head step sets the attributes

- **GIVEN** a jsdom document built from `index.html` and a storage stub with `binarka.theme` = `dark`, then `light`, then `auto` with a dark system stub, in separate runs
- **WHEN** the test runs the inline script
- **THEN** `data-theme` is `dark`, then `light`, then `dark`, and the theme-color `content` equals the `--color-page` of the matching token set

#### Scenario: The head step sets the language and the title

- **GIVEN** a jsdom document built from `index.html` and a storage stub with `binarka.language` = `en`, then `uk`, then a bad value, in separate runs
- **WHEN** the test runs the inline script
- **THEN** `<html lang>` is `en`, `uk` and `uk`, and `document.title` is "Binarka", «Бінарка» and «Бінарка»

#### Scenario: The head step survives bad and throwing storage

- **GIVEN** the same document with a bad stored value, and with storage whose access throws
- **WHEN** the test runs the inline script
- **THEN** it raises no error, `data-theme` is the system theme (light without `matchMedia`), `<html lang>` is `uk` and `document.title` is «Бінарка»

#### Scenario: The duplicated names and colours equal the module and the tokens

- **GIVEN** the inline script text, the storage module, and the tokens of `src/ui/style.css`
- **WHEN** the test compares them
- **THEN** both key names (`binarka.theme` and `binarka.language`) and both titles equal the module's, and the two theme-color values equal `--color-page` of the top-level `:root` and of `:root[data-theme="dark"]`

#### Scenario: The built file keeps the order

- **GIVEN** the `index.html` of a build that the test makes itself (`vite build --outDir <a temporary directory>`; the test fails with a clear message if the build fails or the file is absent, and never skips)
- **WHEN** the test reads the order of its head children
- **THEN** the inline classic script precedes the `script type="module"` and the stylesheet `link` that Vite injected

#### Scenario: An English mount shows no Cyrillic text

- **GIVEN** `binarka.language` = `en` stored, the head step run, and a `MutationObserver` on the mount root with `childList`, `subtree`, `characterData` and `characterDataOldValue`
- **WHEN** the page is mounted
- **THEN** the observer sees no Cyrillic text in an added node, a removed node or an old character value, outside an element whose `lang` differs from `<html lang>` (A-52)

### Requirement: No flash of the wrong theme on reload

With `dark` stored on a light system, with `light` stored on a dark system and with `en` stored, the head step alone SHALL put the page in the stored theme and language before the page bundle runs (NFR-18, held until its e2e spec is seen failing against the page). **Variant 1:** the test aborts the page bundle (`page.route('**/assets/*.js', r => r.abort())`; the stylesheet stays a `<link>` and loads) and asserts that `<html>` has the stored `data-theme` and `lang` and that the computed `background-color` of `body` equals the `--color-page` of the stored theme. **Variant 2** (bundle loaded): an `addInitScript` `MutationObserver` with `attributes`, `attributeFilter: ['data-theme', 'lang']` and `attributeOldValue: true` records the changes of `<html>` and the first child added to `<body>`; only records whose `oldValue` differs from the new value count, so a mount that rewrites an equal value is not a change. There is at least one counted record, the last value is the stored one, every counted record of `data-theme` and `lang` comes before that first child, and none follows during the mount; a run with no counted record fails (it must not pass vacuously). The paint itself is not measured. Sampled: 375×812 and 1280×800; the coverage is `sampled`, never continuum. Storage is set by `addInitScript` per test in a fresh browser context (no `storageState`). The spec file is `e2e/nfr-18-*.spec.ts` and `playwright.config.ts` gains one `testMatch` pattern for it (approved, autonomy-log row 117). NFR-18 is held (autonomy-log row 118) and moves into `docs/requirements.md` on the pattern of row 68 (1) once the spec is seen failing against the page without the head step (the red run is a task, not a scenario).

Traces: NFR-18, FR-116, FR-109

#### Scenario: Variant 1, the head step alone sets the theme

- **GIVEN** the built page open in Chromium with `binarka.theme` = `dark` set by `addInitScript` on a light system scheme, and the page bundle aborted, at 375×812 and at 1280×800
- **WHEN** the check reads `<html>` and the computed `background-color` of `body`
- **THEN** `<html>` has `data-theme="dark"` and the background equals the dark `--color-page`; with `light` stored on a dark system scheme the page is light in the same way

#### Scenario: Variant 2, the attribute is set before the body gets a child

- **GIVEN** the built page with the bundle loaded and an `addInitScript` observer that records `<html>` attribute changes and the first child added to `<body>`
- **WHEN** the page loads with `dark` stored on a light system scheme
- **THEN** there is at least one counted `data-theme` record, the last value is `dark`, every counted record precedes the first child of `<body>`, and no counted record follows; without a head step this scenario fails too (no record before the first child)

#### Scenario: Variant 1 and 2 for the language

- **GIVEN** the built page in Chromium with `binarka.language` = `en` set by `addInitScript`, once with the bundle aborted and once with the bundle loaded and the observer of Variant 2
- **WHEN** the check reads `<html>`
- **THEN** `lang` is `en` with the bundle aborted, and with the bundle loaded the `lang` change precedes the first child of `<body>` and none follows

### Requirement: Common rules for the theme and language options

Every option of the theme control and of the language control SHALL be a `<button type="button" role="radio">` labelled by its own visible text, with no `aria-label` (as FR-62); the group names are `aria-label`s in the page language (FR-117); the two language options also carry their own `lang` (FR-107, A-52). Every option is a Tab stop in reading order, activated by Enter and Space as a native button; the page adds no key handler and no `tabindex` (FR-59, FR-60). Every option shows the `:focus-visible` indicator (FR-65, NFR-13) and is at least 44×44 CSS px (NFR-12, see «The theme options meet the touch-target floor»). The options set their own text and background colours from the tokens with at least 4.5:1 in both themes (see «The theme options set their own colours»). The control adds no `id` (the settings panel that holds it has the fifth id of the mount, see «Settings button and panel»). The language control follows the same rules.

Traces: FR-117, FR-59, FR-60, FR-62, FR-65, FR-107

#### Scenario: The options are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three theme options
- **THEN** each is a `button` with `type="button"` and `role="radio"`, none has `tabindex`, `aria-label` or `disabled`, and no key event dispatched on the options has `defaultPrevented` true

#### Scenario: The language options are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the two language options
- **THEN** each is a `button` with `type="button"` and `role="radio"`, none has `tabindex`, `aria-label` or `disabled`, each has its own `lang`, and no key event dispatched on them has `defaultPrevented` true

#### Scenario: No id is added

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the ids under the root
- **THEN** neither the theme group nor an option has an `id`, and the only new id of the mount is the settings panel's (five ids per mount in all, see «The board is a labelled group of cell buttons»)

### Requirement: The option controls are not part of the marked choice

The theme control and the language control sit in the settings panel, not in the setup sheet, so their options SHALL never be marked, need no «Почати», and a press on them SHALL leave the marked size and the marked level unchanged (FR-118, FR-100, FR-103). Opening the settings panel while the setup sheet is open closes the sheet natively (opening another `popover="auto"` closes an open one; the signed wireframe notes it for Topic 3), and the closing of the sheet then discards the marked choice as for any close (FR-97(d), FR-100). A language press behaves like a theme press (FR-108).

Traces: FR-118, FR-100, FR-103, FR-108

#### Scenario: A press leaves the marked choice alone

- **GIVEN** the sheet marked with «Поле 8×8» and «Мозколамка» and not yet closed, and the settings panel opened through the stubbed `showPopover()` with the closing `toggle` event of the sheet not yet dispatched
- **WHEN** the player presses «Темна»
- **THEN** `aria-checked="true"` is still on «Поле 8×8» and on «Мозколамка», and `hidePopover` was not called by the press

#### Scenario: A language press leaves the marked choice alone

- **GIVEN** the sheet marked with «Поле 8×8» and «Мозколамка» and not yet closed, and the settings panel opened through the stubbed `showPopover()`
- **WHEN** the player presses "English"
- **THEN** `aria-checked="true"` is still on "Grid 8×8" and on "Brain-twister" (the page is now in English), `hidePopover` was not called by the press, and a later "Start" uses `(8, 4)`

#### Scenario: Opening the panel closes the sheet and discards the marked choice

- **GIVEN** the setup sheet opened with «Поле 8×8» and «Мозколамка» marked
- **WHEN** the test opens the settings panel through the stubbed `showPopover()` on it and dispatches a `toggle` event with `newState` `closed` on the sheet (what the browser does)
- **THEN** `aria-checked="true"` is on the size and the level of the board shown in both groups, the board, the messages and the summary are unchanged, and `document.activeElement` is not moved to the summary button (focus is outside the sheet)
- **AND** `aria-checked="true"` is still on the chosen theme option

### Requirement: Texts of the settings button, the settings panel and the theme control

In Ukrainian mode every text that the settings button, the settings panel, the theme control and the language control show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5, FR-94), with the one exception that the option "English" is named in its own language and carries `lang="en"` (A-52); in English mode each is the English counterpart of «English page text» ("Settings", "Theme", "Light", "Dark", "System", "Language", "Close") and contains Latin letters and no Cyrillic letters, with the one exception of the option «Українська». In Ukrainian mode the texts are: the accessible name «Налаштування» of the button and of the panel, the visible label and group name «Тема», the three option texts «Світла», «Темна» and «Як у системі», the visible label and group name «Мова», the two option names «Українська» and "English", the close text «Закрити», and any `aria-label`, `title`, `alt` or `label` attribute among them. The gear is a drawn `svg` (not a text glyph) and has no text. By the user's code-organisation decision of 2026-10-05 these texts are kept in `src/ui/strings.ts`, and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, FR-94, FR-102, FR-68, FR-111, FR-107

#### Scenario: The theme texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text nodes and the `aria-label`, `title`, `alt` and `label` attributes of `[data-action="settings"]` and of `[data-section="settings"]` with everything inside it
- **THEN** the collection contains «Налаштування», «Тема», «Світла», «Темна», «Як у системі», «Мова», «Українська», "English" and «Закрити»
- **AND** every collected text, except the text and the attributes of the element with `lang="en"`, matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The settings and language texts in English mode

- **GIVEN** the page in English mode
- **WHEN** the test collects the same texts
- **THEN** the collection contains "Settings", "Theme", "Light", "Dark", "System", "Language", «Українська», "English" and "Close"
- **AND** every collected text, except the text and the attributes of the element with `lang="uk"`, matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

#### Scenario: The settings and theme texts live in the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads `src/ui/strings.ts` and every other `.ts` or `.css` file under `src/ui/` and `src/main.ts`
- **THEN** `src/ui/strings.ts` contains the Ukrainian texts of the table and the English ones of «English page text», and no other file contains a character matching `/\p{Script=Cyrillic}/u`

### Requirement: The theme options set their own colours

The stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule that styles the theme options (`.theme-control button`) and in the rule of the chosen option (`.theme-control button[aria-checked='true']`), so that the colours do not depend on the browser, the operating system or the effective theme (FR-65, FR-117). For each state and for each token set (light and dark) the text colour against the background colour SHALL have at least 4.5:1 contrast (the WCAG 2 formula on the resolved tokens). The three options are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator. The element `[data-control="theme"]` carries the class `theme-control`, and `[data-control="language"]` carries the class `language-control` with the same pair of rules (`.language-control button` and `.language-control button[aria-checked='true']`). A chosen option differs from an unchosen one by more than colour (a ring or a mark drawn by the stylesheet, WCAG 1.4.1), as for the level buttons. How the control is laid out is the signed design's (held NFR-14).

Traces: FR-65, FR-117, NFR-9, FR-107

#### Scenario: The theme options declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.theme-control button` and `.theme-control button[aria-checked='true']`
- **THEN** each rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`, and neither declares `opacity`

#### Scenario: Each state has 4.5:1 text in both themes

- **GIVEN** the light token set and the dark token set resolved from `src/ui/style.css`
- **WHEN** the test lays the checked rule over the plain rule and computes the text to background ratio for the plain and the checked state in each set
- **THEN** all four ratios are at least 4.5

#### Scenario: The chosen option has a cue besides colour

- **GIVEN** the rules `.theme-control button` and `.theme-control button[aria-checked='true']`
- **WHEN** the test compares their declarations
- **THEN** the checked rule declares a `border-style`, `border-width`, `box-shadow` or `text-decoration` that the plain rule does not

#### Scenario: The language options declare their colours and a cue

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.language-control button` and `.language-control button[aria-checked='true']`
- **THEN** each rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a declared token, neither declares `opacity`, the ratio of text to background is at least 4.5 in each state in the light and in the dark token set, and the checked rule declares a cue the plain rule does not
