## ADDED Requirements

### Requirement: Rules panel

The page header SHALL hold a button `[data-action="rules"]` labelled «Правила» whose `popovertarget` attribute names the `id` of the rules panel. The rules panel `[data-section="rules"]` SHALL be an element with the `popover` attribute, opened by that button with no script, and SHALL contain the heading «Правила», exactly three `li` items in this order: «Не більше двох однакових цифр поспіль у рядку чи стовпці.», «У кожному рядку та стовпці порівну нулів і одиниць.», «Усі рядки різні, і всі стовпці різні.», and one close button «Зрозуміло» with `popovertarget` naming the same `id` and `popovertargetaction="hide"` (FR-57). A list item MAY carry a decorative example drawn from digits and symbols inside an element with `aria-hidden="true"` (A-26, not pinned); the text of an item is its text content without the descendants that have `aria-hidden="true"`. The panel SHALL be created once at mount, sit inside the page root and outside the element that holds the board, need no new dependency, and stay the same element with the same texts after a new puzzle, a size change and a win. There SHALL be no rules block below the board and no `<details>` element anywhere on the page. Each mount SHALL give its panel an `id` that is unique in the document, so two mounts on two roots stay independent. Where the panel is drawn (bottom sheet on phones, centred panel from 48rem) is layout and is not claimed here: it is covered by the held NFR-13 (or NFR-9 / NFR-14), see `docs/requirements-held.md`.

Traces: FR-57, NFR-5

#### Scenario: Rules button in the header

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `header` element of the root
- **THEN** it contains exactly one `[data-action="rules"]`, a `button` whose text is «Правила»
- **AND** its `popovertarget` attribute is non-empty and equals the `id` of the one element `[data-section="rules"]` in the root

#### Scenario: Rules panel structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** exactly one such element exists inside the root, it has the `popover` attribute, and it is not inside `[data-board]` or inside the board host
- **AND** it contains a heading with the text «Правила» and exactly three `li` items whose texts, in order, are those of this table
- **AND** it contains exactly one `button`, with the text «Зрозуміло», `popovertarget` equal to the panel's `id` and `popovertargetaction="hide"`

| Item | Text |
|------|------|
| 1 | Не більше двох однакових цифр поспіль у рядку чи стовпці. |
| 2 | У кожному рядку та стовпці порівну нулів і одиниць. |
| 3 | Усі рядки різні, і всі стовпці різні. |

#### Scenario: No rules block under the board and no details element

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the whole root
- **THEN** the root contains no `details` element
- **AND** every `li` element of the root is inside `[data-section="rules"]`, and the root contains exactly three `li` elements

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
| reaches a win |

- **THEN** after each action there is exactly one `[data-section="rules"]`, it is the same element as at mount, it has the same heading and the same three `li` texts, and the rules button still names its `id`

### Requirement: Page document order

In document order the page root SHALL hold: a `header` (the title, a heading with the text «Бінарка», then the `[data-action="rules"]` button), the size control `[data-control="size"]`, the board `[data-board]`, the buttons `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]` in this order, then the message area holding `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]` in this order (FR-61). The rules panel (FR-57) SHALL be outside this sequence and outside the board element. The message area SHALL always be present in the DOM, with all three message elements, also while a message is shown and after every board change. The reserved height of the message area is layout and is not claimed here: it is covered by the held NFR-13 (or NFR-9 / NFR-14), see `docs/requirements-held.md`. This requirement names the size control by its hook `[data-control="size"]` and does not depend on the element type of the control.

Traces: FR-61

#### Scenario: Order at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test compares document positions of these elements with `compareDocumentPosition`: the `header`, `[data-control="size"]`, `[data-board]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, `[data-message="idle"]`, `[data-message="hint"]`, `[data-message="win"]`
- **THEN** each element follows the previous one in this order
- **AND** the `header` contains a heading with the text «Бінарка» followed by the `[data-action="rules"]` button, and the heading precedes the button

#### Scenario: The message area holds the three messages

- **GIVEN** the page has just been mounted
- **WHEN** the test takes the parent element of `[data-message="idle"]`
- **THEN** that element contains exactly the three elements `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]`, in this order, and no other `[data-message]` element
- **AND** that element follows the three action buttons in document order

#### Scenario: The panel is outside the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-section="rules"]` sits
- **THEN** it is not inside the `header`, not inside the message area, not inside `[data-board]`, and it follows the message area in document order

#### Scenario: The order and the message area survive every board change

- **GIVEN** a mounted page with a fixture puzzle
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page, with a hint pressed first so that the hint message has text

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 or to 8 (one run for each) |
| presses «Скинути» |
| reaches a win |

- **THEN** after each action the nine elements of the first scenario still exist exactly once, in the same document order, and the three message elements are still in the same message area

### Requirement: Idle line

The message area SHALL hold an idle line `[data-message="idle"]` with the text «Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.» (FR-64). The two spaces inside «0 і 1» SHALL be non-breaking spaces U+00A0, one between «0» and «і» and one between «і» and «1»; every other space of the sentence is an ordinary space U+0020; the «і» is the Cyrillic letter U+0456. The line SHALL always be in the DOM. It is visible only while `[data-message="hint"]` and `[data-message="win"]` both have empty text content, and this SHALL be done by CSS only: the page code never removes the line, never sets `hidden` or an inline `style` on it and never changes its text. The visibility itself is layout and is not claimed here: it is covered by the held NFR-13 (or NFR-9 / NFR-14), see `docs/requirements-held.md`.

Traces: FR-64

#### Scenario: Idle line text, code point by code point

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the text content of `[data-message="idle"]`
- **THEN** it equals the JavaScript string `'Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.'`
- **AND** it contains exactly two U+00A0 characters, and the character after the first one is U+0456

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

#### Scenario: The hint and win messages are empty at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="hint"]` and `[data-message="win"]`
- **THEN** both have empty text content and no child node (so the CSS rule that shows the idle line while both are empty can match)

### Requirement: Ukrainian texts of the header, rules panel and idle line

Every text that the header, the rules panel and the idle line show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5). This covers the title «Бінарка», the button «Правила», the panel heading «Правила», the three rules texts of «Rules panel», the close button «Зрозуміло», the idle line and any `aria-label`, `title`, `alt` or `label` attribute in them. Decorative examples inside the panel (A-26) are inside elements with `aria-hidden="true"` and hold digits and symbols but no letter of any alphabet. By the user's code-organisation decision of 2026-10-05 (not a requirement; languages stay Future, FR-55 and FR-56) these texts are kept in the single module `src/ui/strings.ts` and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the last scenario below guards it as a source scan.

Traces: NFR-5

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the texts of the header, of the rules panel (without `aria-hidden` descendants) and of the idle line, and the values of `aria-label`, `title`, `alt` and `label` attributes inside them
- **THEN** the collection contains «Бінарка», «Правила», «Зрозуміло», the three rules texts of the table in «Rules panel» and the idle line, each at least once
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: Decorative examples hold no letters

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text content of every element of the root that has `aria-hidden="true"`
- **THEN** none of these texts matches `/\p{L}/u`

#### Scenario: No Cyrillic text outside the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads every file under `src/ui/` with the extension `.ts` or `.css`, except `src/ui/strings.ts`, and `src/main.ts`
- **THEN** none of them contains a character matching `/\p{Script=Cyrillic}/u` (comments in these files are written in English)
- **AND** `src/ui/strings.ts` exists and contains the title, the idle line and the three rules texts

## MODIFIED Requirements

### Requirement: Ukrainian page text

The page SHALL show all of its own text (the title in the header, labels, buttons including «Правила» and «Зрозуміло», the size control labels, the rules texts, the idle line, the win message, `document.title` and any user-visible attribute such as `aria-label`, `title`, `placeholder`, `alt` and the `label` attribute of `option` and `optgroup` elements, which a browser shows instead of the option text) in Ukrainian: each such text contains Cyrillic letters and no Latin letters. The digits and the sign × inside a size label such as «Поле 4×4» are not Latin letters. The digits shown in the cells of the board are puzzle content, not page text, and are not collected. Text inside an element with `aria-hidden="true"` (the decorative examples of the rules panel, A-26) is decoration made of digits and symbols, not page text, and is not collected; it holds no letter at all (see «Ukrainian texts of the header, rules panel and idle line»). Hint sentences are owned by the puzzle-engine capability and are only displayed here.

Traces: NFR-5, FR-43, FR-57, FR-64

#### Scenario: Static page text

- **GIVEN** the page has just been mounted
- **WHEN** the test collects every non-whitespace text node under the page root (including the buttons, the size control labels and the header, the rules panel and the idle line, but not the text of `[data-cell]` elements, which is puzzle content, and not the text of elements with `aria-hidden="true"`, which is decoration), `document.title`, and the values of the attributes `aria-label`, `title`, `placeholder` and `alt` on every element in the root and of the attribute `label` on every `option` and `optgroup` element; `data-*` attributes, `class` and option `value` attributes are not user-visible and are not collected
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`
- **AND** the collected texts include «Поле 4×4», «Поле 6×6» and «Поле 8×8»

#### Scenario: Win message text

- **GIVEN** a solved board
- **WHEN** the win message is shown
- **THEN** its text is the one required by «Win message when solved» (FR-41), and it contains Cyrillic letters and no Latin letters

## REMOVED Requirements

### Requirement: Rules block

**Reason**: FR-57 was amended on 2026-10-05 (UX decision 1): the rules are no longer a block under the board; they are a popover panel opened from the header. The new behaviour is the ADDED requirement «Rules panel», because a renamed behaviour should not keep the misleading name «Rules block».

**Migration**: the three rules texts, the heading «Правила», the survival after a new puzzle, a size change and a win, and the Latin-letter check all move to «Rules panel» and «Ukrainian texts of the header, rules panel and idle line». The scenario «Rules block at mount» (rules block follows `[data-board]`) is dropped on purpose: its place is now outside the sequence, after the message area.
