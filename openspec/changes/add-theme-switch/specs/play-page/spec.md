## ADDED Requirements

### Requirement: Settings button and panel

The page header SHALL hold, between the title and the button «Правила» (document order: the heading, then `[data-action="settings"]`, then `[data-action="rules"]`), a settings button `[data-action="settings"]` with `type="button"`, whose only child is one decorative inline `svg` (a drawn gear, `aria-hidden="true"`, no text), with the accessible name «Налаштування» given by its `aria-label` and a `popovertarget` equal to the `id` of the settings panel, so that it opens the panel with no script (FR-68, FR-117, signed wireframe Topic 3 B, autonomy-log row 120). The button carries no `aria-haspopup`, `aria-expanded` or `tabindex`. The settings panel `[data-section="settings"]` SHALL be created once at mount, inside the page root and outside the header, the board and the message area; it is an element with the `popover` attribute (`popover="auto"`) and `role="dialog"`, with the `aria-label` «Налаштування», no `aria-labelledby`, and an `id` that ends in a number belonging to the mount (the fifth id of the mount, A-41 amended). It holds, in this order: the visible plain-text label «Тема» and the theme control `[data-control="theme"]` (see «Theme control»), and a close button `[data-action="settings-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the panel's `id` and `popovertargetaction="hide"`. `add-english-version` adds the label «Мова» and the language control between the theme control and the close button. The panel follows the message area in document order and precedes `[data-dialog="confirm"]`; it is outside the sequence of «Page document order». Escape, a click outside the panel (the light dismiss) and the close button close it natively; the page adds no key handler and no focus handling for it (FR-59). The panel is the same element, with the same children, after a hint, a win, a reset, «Нова головоломка», a press of «Почати» and a theme press. Where the button is drawn, the bottom sheet on the phone and the panel under the header at the right on tablet and desktop, the gear's drawing and the 44 px sizes are layout, covered by NFR-12 (see «The theme options meet the touch-target floor») and the held NFR-14 (`review-set-13`). The hooks `[data-action="settings"]`, `[data-section="settings"]` and `[data-action="settings-close"]` are spec-made proxies, to confirm against the signed review set (task 1.4).

Traces: FR-68, FR-102, FR-117, NFR-9

#### Scenario: Settings button and panel at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="settings"]` and `[data-section="settings"]`
- **THEN** exactly one of each exists in the root; the button is a `button` with `type="button"`, `aria-label` equal to «Налаштування», `popovertarget` equal to the panel's `id`, no `aria-haspopup`, `aria-expanded` or `tabindex`, and exactly one child element, an `svg` with `aria-hidden="true"` and no text node
- **AND** the panel has the `popover` attribute, `role="dialog"`, `aria-label` equal to «Налаштування», no `aria-labelledby`, a non-empty `id`, is not inside the `header`, `[data-board]` or the message area, follows the message area and precedes `[data-dialog="confirm"]`
- **AND** its element children, in order, are a plain-text element with the text «Тема», `[data-control="theme"]` and `[data-action="settings-close"]`

#### Scenario: The close button

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="settings-close"]`
- **THEN** it is a `button` with `type="button"`, the text «Закрити», `popovertarget` equal to the panel's `id`, `popovertargetaction="hide"` and no `tabindex`

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
- **WHEN** the player presses «Підказка», reaches a win, presses «Скинути», «Нова головоломка», chooses a size and a level, and presses a theme option (each from a freshly mounted page, confirmed where asked)
- **THEN** after each action there is exactly one `[data-section="settings"]`, it is the same element as at mount, with the same three children

### Requirement: Theme control

The page SHALL offer a theme control `[data-control="theme"]` (FR-102): an element with `role="radiogroup"` and the accessible name «Тема» (`aria-label`), holding exactly three `<button type="button" role="radio">` elements in this order, labelled «Світла», «Темна» and «Як у системі» (Q6), with the attribute `data-theme-option` equal to `light`, `dark` and `auto`. The option that is chosen SHALL have `aria-checked="true"` and the other two `aria-checked="false"`. With nothing valid stored the option «Як у системі» is chosen (Q14, see «Invalid or missing stored values fall back»). Each option is labelled by its own visible text and carries no `aria-label` and no `aria-labelledby` (as FR-62); the group has no `aria-labelledby` and shows no visible label. The control and its options carry no `id`. **The control sits in the settings panel** (Topic 3, option B of the signed wireframe, autonomy-log row 120), directly below a visible plain-text label «Тема» (an element that is not a `label`, with no `for`; the group's name stays its `aria-label`); the panel and the button that opens it are specified by «Settings button and panel». A test finds the control with `root.querySelector('[data-control="theme"]')` and opens the panel first through the stubbed `showPopover()` (A-44). How the panel is drawn is the design's (`review-set-13`, held NFR-14). Its texts are specified by «Texts of the settings button, the settings panel and the theme control».

Traces: FR-102, FR-68, NFR-9

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

#### Scenario: The group is named by its aria-label and no label element exists

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the root
- **THEN** the root contains no `label` element and no `for` attribute, and the group's name is its `aria-label` «Тема»

### Requirement: A theme press acts at once and changes nothing else

A press on a theme option SHALL set the chosen theme, move `aria-checked` to the pressed option, apply the effective theme to the document (see «Effective theme on the document») and store the choice (see «Stored preferences») (FR-103). It takes no seed, calls no generator, asks for no confirmation and leaves the board, the entries, the highlights, `cell-hinted`, the size, the level, the summary, both messages, the marked choice of the setup sheet (FR-100) and DOM focus unchanged. A confirmation dialog is modal (`showModal()`, A-55), so no theme press can happen while a pending action exists. The press itself opens and closes nothing: the settings panel stays open (A-55), and a `popover="auto"` light dismiss caused by a click outside an open sheet or panel is the browser's (FR-97(d), A-55), which discards the marked choice as for any close. A press on the option already chosen changes nothing at all and stores nothing.

Traces: FR-103, FR-118, FR-100

#### Scenario: A theme press changes only the theme

- **GIVEN** a mounted 6×6 board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted` and some cells with `cell-violation`, the sheet marked with «Поле 8×8» and «Мозколамка» (not closed by the test), a counting seed source, a `generate` spy and the `showModal` spy with the counts read now, the settings panel opened, and DOM focus on the option «Темна»
- **WHEN** the player presses «Темна»
- **THEN** `aria-checked="true"` is on «Темна» only, `document.documentElement` has `data-theme="dark"`, and `document.activeElement` is still «Темна»
- **AND** every cell keeps its text and class list, both messages keep their text, the summary reads `6×6 · Розминка`, and `aria-checked="true"` is still on «Поле 8×8» and on «Мозколамка» (the marked choice is unchanged)
- **AND** `showModal` was never called and the seed-source and generator call counts equal the counts read now

#### Scenario: A theme press opens and closes nothing

- **GIVEN** the page with the settings panel opened through the stubbed `showPopover()`
- **WHEN** the player presses «Світла»
- **THEN** the press called neither `showPopover` nor `hidePopover` nor `togglePopover`, and the stub state of the settings panel is still open

#### Scenario: Pressing the chosen option changes nothing

- **GIVEN** a mounted page with `binarka.theme` = `dark` stored, and a `setItem` spy on `localStorage`
- **WHEN** the player presses «Темна»
- **THEN** `setItem` was not called, `aria-checked="true"` is still on «Темна» only and `data-theme` is still `dark`

#### Scenario: Two mounts show one choice

- **GIVEN** the page mounted on two roots in the same document, with `localStorage` empty and a `matchMedia` stub that does not match (added in the second review-gate fix round, autonomy-log row 130: the document has one `data-theme`, so it has one choice)
- **WHEN** the player presses «Темна» on the first root, then «Світла» on the second root
- **THEN** after the first press `aria-checked="true"` is on «Темна» only on both roots
- **AND** after the second press `data-theme` is `light` and `aria-checked="true"` is on «Світла» only on both roots

### Requirement: Effective theme on the document

The document element `<html>` SHALL always carry the attribute `data-theme` with the effective theme, `light` or `dark`: the manual choice when it is `light` or `dark`, and the system theme while the choice is `auto` (FR-104, see «Auto follows the system»). The CSS property `color-scheme` of the root SHALL equal the effective theme (`light` or `dark`), so that native parts of the page (the dialog backdrop, scrollbars, form controls) match it; the stylesheet owns it (`:root { color-scheme: light }` and `:root[data-theme="dark"] { color-scheme: dark }`) and no script writes `color-scheme`. The palette of each theme is the stylesheet's (see «Borders, cues and focus rings have enough contrast», A-51). A press on a theme option, a change of the system theme while the choice is `auto`, and the head step before the first paint (see «Preferences are applied before the first paint») are the only things that change `data-theme`.

Traces: FR-104, FR-65, A-51

#### Scenario: The attribute follows the choice

- **GIVEN** a page mounted with `localStorage` empty and a `matchMedia` stub whose query `(prefers-color-scheme: dark)` does not match
- **WHEN** the player presses «Темна», then «Світла», then «Як у системі»
- **THEN** `document.documentElement.getAttribute('data-theme')` is `dark`, then `light`, then `light` (the system theme)

#### Scenario: The stylesheet sets color-scheme for each theme

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the `color-scheme` declarations of `:root` and of `:root[data-theme="dark"]`
- **THEN** the top-level `:root` declares `color-scheme: light` and `:root[data-theme="dark"]` declares `color-scheme: dark`

#### Scenario: The rendered colours follow the effective theme

- **GIVEN** the built page open in Chromium on a light system scheme, with `binarka.theme` = `dark` stored (the check lives in `e2e/nfr-13-a11y.spec.ts`, project `a11y`; this scenario is the binding check of `color-scheme`)
- **WHEN** the check reads the computed `background-color` of `body` and the computed `color-scheme` of `<html>`
- **THEN** the background equals the dark `--color-page` and `color-scheme` is `dark`

#### Scenario: In dark every backdrop dims the page

- **GIVEN** the text of `src/ui/style.css` and its dark token set (added in the review-gate fix round, autonomy-log row 129: the backdrops of the rules panel, the setup sheet, the settings panel and the confirmation were the text colour, which is light in dark)
- **WHEN** the test resolves the background colour of `.rules::backdrop`, `.setup-sheet::backdrop`, `.settings::backdrop` and `.confirm::backdrop` under `:root[data-theme="dark"]` (a dark override when one exists, else the plain rule)
- **THEN** each colour is a token of the dark set and is no lighter than the dark `--color-page`, so an open panel never lightens the page

### Requirement: Auto follows the system theme live

While the chosen theme is `auto`, the effective theme SHALL be `dark` when `window.matchMedia('(prefers-color-scheme: dark)').matches` is true and `light` otherwise, and the page SHALL follow a `change` event of that query at once, with no reload: `data-theme` and the browser colour (see «Browser colour follows the theme») update, and `color-scheme` follows from the stylesheet (FR-105). While the chosen theme is `light` or `dark`, a change of the system theme changes nothing. If `window.matchMedia` is missing, `auto` resolves to `light` (A-50). jsdom has no `matchMedia`: tests install a stub on `window` that returns `{ matches, media, addEventListener, removeEventListener }`, records the `change` listeners and lets the test fire them, and remove it after each test, like the popover stubs (A-44).

Traces: FR-105, FR-104, A-50

#### Scenario: Auto resolves to the system theme at mount

- **GIVEN** a `matchMedia` stub whose query matches (a dark system), and `localStorage` empty
- **WHEN** the page is mounted
- **THEN** `data-theme` is `dark`, and with a stub whose query does not match it is `light`

#### Scenario: Auto follows a live change

- **GIVEN** a page mounted with the choice `auto` on a light system stub that recorded its `change` listener
- **WHEN** the test sets the stub to match and fires the recorded `change` listener
- **THEN** `data-theme` is `dark` and the theme-color meta equals the dark `--color-page`; firing it again with the stub not matching gives `light`

#### Scenario: A manual choice ignores the system

- **GIVEN** a page with the choice `light` pressed, on a light system stub
- **WHEN** the test sets the stub to match and fires the recorded `change` listener
- **THEN** `data-theme` is still `light`; the same holds for `dark` pressed and a stub that stops matching

#### Scenario: Auto follows a live change in a real browser

- **GIVEN** the built page open in Chromium with nothing stored (auto) and the system scheme emulated light (`page.emulateMedia({ colorScheme: 'light' })`), in `e2e/nfr-13-a11y.spec.ts`
- **WHEN** the check calls `page.emulateMedia({ colorScheme: 'dark' })` without a reload
- **THEN** `<html data-theme>` is `dark`, the computed `background-color` of `body` equals the dark `--color-page`, and the `content` of `meta[name="theme-color"]` equals it too

#### Scenario: A system change writes nothing

- **GIVEN** a page mounted with the choice `auto` and a `setItem` spy on `localStorage`
- **WHEN** the test fires a `change` listener
- **THEN** `setItem` was not called

#### Scenario: A broken matchMedia does not stop the page

- **GIVEN** `window.matchMedia` that throws when called, and another run with a stub that returns an object without `addEventListener`
- **WHEN** the page is mounted
- **THEN** the mount raises no error, `data-theme` is `light` (the first run) or follows `matches` (the second run), and the board is shown

#### Scenario: Without matchMedia auto is light

- **GIVEN** no `window.matchMedia` and `localStorage` empty
- **WHEN** the page is mounted
- **THEN** `data-theme` is `light` and the mount raises no error

### Requirement: Browser colour follows the theme

`index.html` SHALL hold exactly one `meta[name="theme-color"]`, whose `content` equals the resolved `--color-page` value of the effective theme and which the page updates with every change of the effective theme (a theme press, a system change while the choice is `auto`) (FR-106). `index.html` holds no `meta[name="description"]` and this change adds none (Q12). The two colour values the page and the head step use for the meta are duplicates of `--color-page` of the light and the dark token set; a test asserts that they equal those tokens (see «Preferences are applied before the first paint»).

Traces: FR-106, FR-116

#### Scenario: The meta exists once and has the page colour

- **GIVEN** the text of `index.html` and of `src/ui/style.css`
- **WHEN** the test counts `meta[name="theme-color"]` and `meta[name="description"]` in the head of `index.html`
- **THEN** there is exactly one theme-color meta and no description meta

#### Scenario: A document without the meta does not stop the page

- **GIVEN** a jsdom document that has no `meta[name="theme-color"]`
- **WHEN** the page is mounted and the player presses «Темна»
- **THEN** the page raises no error and `data-theme` is `dark`

#### Scenario: The meta follows every change of the effective theme

- **GIVEN** a jsdom document with the head of `index.html` and a mounted page on a light system stub, with the choice `auto`
- **WHEN** the player presses «Темна», then «Світла», and then «Як у системі» and the test fires a `change` that makes the system dark
- **THEN** the `content` of the meta equals the `--color-page` of the dark set, of the light set, and of the dark set again

### Requirement: Stored preferences

The page SHALL store the theme preference, and no other data, in `localStorage` (FR-113, TC-12): one key, `binarka.theme`, with the value `light`, `dark` or `auto`. The page SHALL write the key only when the player presses a theme option that is not already chosen, and it writes the value of the pressed option, also when that value is the default `auto` (A-48). It SHALL NOT write at the mount, at a reload, on a game action (a cell click, a hint, «Нова головоломка», «Скинути», «Почати», a mark) or on a change of the system theme. It SHALL store nothing else, ever: no game state (the board, the entries, the givens, the size, the level, the seed, the messages, the hinted cell), no marked choice of the setup sheet (FR-100), no cookie, no `sessionStorage` and no IndexedDB (TC-12). Game state is never stored; saved progress is Future (FR-46). A preference is not game state (A-48).

Traces: FR-113, FR-100, TC-12

#### Scenario: A press writes the pressed value once

- **GIVEN** `localStorage` empty and a `setItem` spy
- **WHEN** the player presses «Темна», and then «Як у системі»
- **THEN** `setItem` was called twice, with `binarka.theme` and `dark`, then with `binarka.theme` and `auto` (the default value is written too, A-48), and `localStorage` holds no other key

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

### Requirement: Invalid or missing stored values fall back

At load the page SHALL ignore a missing key, an empty value and a value outside the list of «Stored preferences» (for example `Dark`, `system`, `ru`, `{}`) and use the default: the theme `auto` (FR-114, Q14). The page SHALL NOT rewrite or remove a bad value until the player presses an option.

Traces: FR-114, FR-113

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

### Requirement: Failing storage does not stop the page

When reading or writing `localStorage` throws (the access to `window.localStorage` throws, as in some private modes or with storage blocked, or `getItem` or `setItem` throws, for example on a quota error), the page SHALL still mount and play with no uncaught error and no message (FR-115): at load it uses the defaults of «Invalid or missing stored values fall back»; a press still applies the chosen theme for the rest of the session; nothing is retried.

Traces: FR-115, FR-113

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

#### Scenario: A later mount keeps a session-only choice

- **GIVEN** `Storage.prototype.setItem` throws, counted by a spy, a mounted page on which the player pressed «Темна», and `localStorage` holding no `binarka.theme` (added in the second review-gate fix round, autonomy-log row 130)
- **WHEN** the page is mounted on a second root in the same document while the first is still mounted
- **THEN** no error reached the page, `aria-checked="true"` is on «Темна» only on the second root, `data-theme` is still `dark`, and `setItem` was still called once

### Requirement: Preferences are applied before the first paint

The stored theme (or the default) SHALL be applied to `<html>` (`data-theme`; `color-scheme` follows from the stylesheet) and to the theme-color meta by a classic inline script in the document head of `index.html` that runs before the body is parsed, not by the page module (FR-116). The page then mounts with `aria-checked` already on the stored option. The step follows «Invalid or missing stored values fall back» and «Failing storage does not stop the page». It is the one deliberate duplicate outside `src/ui/strings.ts` and the storage module: it holds the key name `binarka.theme` and the two theme-color values; a test asserts that the name equals the module's value and that the two theme-color values equal `--color-page` of the light and of the dark token set. The inline script lives in `index.html`, so lint and `tsc` do not see it; its tests are its only check. The built file SHALL keep the inline classic script ahead of the module script and the stylesheet link that Vite injects into `<head>`; the test makes the build itself (`vite build` into a temporary output directory) so a stale `dist/` can never give a green result.

Traces: FR-116, FR-114, FR-115, FR-104, FR-106

#### Scenario: The head step is a classic inline script in the head

- **GIVEN** the text of `index.html`
- **WHEN** the test parses it
- **THEN** the `head` holds an inline `script` without `src`, without `type="module"`, without `defer` and without `async`, and the `body` holds no such script that sets the theme

#### Scenario: The head step sets the attributes

- **GIVEN** a jsdom document built from `index.html` and a storage stub with `binarka.theme` = `dark`, then `light`, then `auto` with a dark system stub, in separate runs
- **WHEN** the test runs the inline script
- **THEN** `data-theme` is `dark`, then `light`, then `dark`, and the theme-color `content` equals the `--color-page` of the matching token set

#### Scenario: The head step survives bad and throwing storage

- **GIVEN** the same document with a bad stored value, and with storage whose access throws
- **WHEN** the test runs the inline script
- **THEN** it raises no error and `data-theme` is the system theme (light without `matchMedia`)

#### Scenario: The duplicated names and colours equal the module and the tokens

- **GIVEN** the inline script text, the storage module, and the tokens of `src/ui/style.css`
- **WHEN** the test compares them
- **THEN** the key name equals the module's, and the two theme-color values equal `--color-page` of the top-level `:root` and of `:root[data-theme="dark"]`

#### Scenario: The built file keeps the order

- **GIVEN** the `index.html` of a build that the test makes itself (`vite build --outDir <a temporary directory>`; the test fails with a clear message if the build fails or the file is absent, and never skips)
- **WHEN** the test reads the order of its head children
- **THEN** the inline classic script precedes the `script type="module"` and the stylesheet `link` that Vite injected

### Requirement: No flash of the wrong theme on reload

With `dark` stored on a light system and with `light` stored on a dark system, the head step alone SHALL put the page in the stored theme before the page bundle runs (NFR-18, held until its e2e spec is seen failing against the page). **Variant 1:** the test aborts the page bundle (`page.route('**/assets/*.js', r => r.abort())`; the stylesheet stays a `<link>` and loads) and asserts that `<html>` has the stored `data-theme` and that the computed `background-color` of `body` equals the `--color-page` of the stored theme. **Variant 2** (bundle loaded): an `addInitScript` `MutationObserver` with `attributes`, `attributeFilter: ['data-theme']` and `attributeOldValue: true` records the changes of `<html>` and the first child added to `<body>`; only records whose `oldValue` differs from the new value count, so a mount that rewrites an equal value is not a change. There is at least one counted record, the last value is the stored one, every counted record comes before that first child, and none follows during the mount; a run with no counted record fails (it must not pass vacuously). The paint itself is not measured. Sampled: 375×812 and 1280×800; the coverage is `sampled`, never continuum. Storage is set by `addInitScript` per test in a fresh browser context (no `storageState`). The spec file is `e2e/nfr-18-*.spec.ts` and `playwright.config.ts` gains one `testMatch` pattern for it (approved, autonomy-log row 117). NFR-18 is held (autonomy-log row 118) and moves into `docs/requirements.md` on the pattern of row 68 (1) once the spec is seen failing against the page without the head step (the red run is a task, not a scenario).

Traces: NFR-18, FR-116

#### Scenario: Variant 1, the head step alone sets the theme

- **GIVEN** the built page open in Chromium with `binarka.theme` = `dark` set by `addInitScript` on a light system scheme, and the page bundle aborted, at 375×812 and at 1280×800
- **WHEN** the check reads `<html>` and the computed `background-color` of `body`
- **THEN** `<html>` has `data-theme="dark"` and the background equals the dark `--color-page`; with `light` stored on a dark system scheme the page is light in the same way

#### Scenario: Variant 2, the attribute is set before the body gets a child

- **GIVEN** the built page with the bundle loaded and an `addInitScript` observer that records `<html>` attribute changes and the first child added to `<body>`
- **WHEN** the page loads with `dark` stored on a light system scheme
- **THEN** there is at least one counted `data-theme` record, the last value is `dark`, every counted record precedes the first child of `<body>`, and no counted record follows; without a head step this scenario fails too (no record before the first child)

### Requirement: The theme options set their own colours

The stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule that styles the theme options (`.theme-control button`) and in the rule of the chosen option (`.theme-control button[aria-checked='true']`), so that the colours do not depend on the browser, the operating system or the effective theme (FR-65, FR-117). For each state and for each token set (light and dark) the text colour against the background colour SHALL have at least 4.5:1 contrast (the WCAG 2 formula on the resolved tokens). The three options are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator. The element `[data-control="theme"]` carries the class `theme-control` (a spec-made proxy, to confirm against the signed review set). A chosen option differs from an unchosen one by more than colour (a ring or a mark drawn by the stylesheet, WCAG 1.4.1), as for the level buttons. How the control is laid out is the signed design's (held NFR-14).

Traces: FR-65, FR-117, NFR-9

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

### Requirement: Texts of the settings button, the settings panel and the theme control

Every text that the settings button, the settings panel and the theme control show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5, FR-94): the accessible name «Налаштування» of the button and of the panel, the visible label and group name «Тема», the three option texts «Світла», «Темна» and «Як у системі», the close text «Закрити», and any `aria-label`, `title`, `alt` or `label` attribute among them. The gear is a drawn `svg` (not a text glyph) and has no text. By the user's code-organisation decision of 2026-10-05 these texts are kept in `src/ui/strings.ts`, and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it. This requirement is generalised to both modes by `add-english-version`.

Traces: NFR-5, FR-94, FR-102, FR-68

#### Scenario: The theme texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text nodes and the `aria-label`, `title`, `alt` and `label` attributes of `[data-action="settings"]` and of `[data-section="settings"]` with everything inside it
- **THEN** the collection contains «Налаштування», «Тема», «Світла», «Темна», «Як у системі» and «Закрити»
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The settings and theme texts live in the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads `src/ui/strings.ts` and every other `.ts` or `.css` file under `src/ui/` and `src/main.ts`
- **THEN** `src/ui/strings.ts` contains the six texts, and no other file contains a character matching `/\p{Script=Cyrillic}/u`

### Requirement: Common rules for the theme and language options

Every option of the theme control SHALL be a `<button type="button" role="radio">` labelled by its own visible text, with no `aria-label` (as FR-62); the group name is an `aria-label` (FR-117). Every option is a Tab stop in reading order, activated by Enter and Space as a native button; the page adds no key handler and no `tabindex` (FR-59, FR-60). Every option shows the `:focus-visible` indicator (FR-65, NFR-13) and is at least 44×44 CSS px (NFR-12, see «The theme options meet the touch-target floor»). The options set their own text and background colours from the tokens with at least 4.5:1 in both themes (see «The theme options set their own colours»). The control adds no `id` (the settings panel that holds it has the fifth id of the mount, see «Settings button and panel»). This requirement is generalised to the language control by `add-english-version`; the name says "theme and language" so that its later MODIFIED block matches.

Traces: FR-117, FR-59, FR-60, FR-62, FR-65

#### Scenario: The options are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three theme options
- **THEN** each is a `button` with `type="button"` and `role="radio"`, none has `tabindex`, `aria-label` or `disabled`, and no key event dispatched on the options has `defaultPrevented` true

#### Scenario: No id is added

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the ids under the root
- **THEN** neither the theme group nor an option has an `id`, and the only new id of the mount is the settings panel's (five ids per mount in all, see «The board is a labelled group of cell buttons»)

### Requirement: The option controls are not part of the marked choice

The theme control sits in the settings panel, not in the setup sheet, so its options SHALL never be marked, need no «Почати», and a press on them SHALL leave the marked size and the marked level unchanged (FR-118, FR-100, FR-103). Opening the settings panel while the setup sheet is open closes the sheet natively (opening another `popover="auto"` closes an open one; the signed wireframe notes it for Topic 3), and the closing of the sheet then discards the marked choice as for any close (FR-97(d), FR-100). This requirement is generalised to the language control by `add-english-version`.

Traces: FR-118, FR-100, FR-103

#### Scenario: A press leaves the marked choice alone

- **GIVEN** the sheet marked with «Поле 8×8» and «Мозколамка» and not yet closed, and the settings panel opened through the stubbed `showPopover()` with the closing `toggle` event of the sheet not yet dispatched
- **WHEN** the player presses «Темна»
- **THEN** `aria-checked="true"` is still on «Поле 8×8» and on «Мозколамка», and `hidePopover` was not called by the press

#### Scenario: Opening the panel closes the sheet and discards the marked choice

- **GIVEN** the setup sheet opened with «Поле 8×8» and «Мозколамка» marked
- **WHEN** the test opens the settings panel through the stubbed `showPopover()` on it and dispatches a `toggle` event with `newState` `closed` on the sheet (what the browser does)
- **THEN** `aria-checked="true"` is on the size and the level of the board shown in both groups, the board, the messages and the summary are unchanged, and `document.activeElement` is not moved to the summary button (focus is outside the sheet)
- **AND** `aria-checked="true"` is still on the chosen theme option

### Requirement: The theme options meet the touch-target floor

The three theme options, the settings button `[data-action="settings"]` and the settings panel's close button `[data-action="settings-close"]` SHALL each be at least 44×44 CSS px (NFR-12, FR-117). The stylesheet `src/ui/style.css` SHALL give each of them a `min-height` of at least `2.75rem` as an ordinary declaration: no `!important`, not inside a media query. The probe `e2e/nfr-12-targets.spec.ts` SHALL measure the settings button and, with the settings panel open, the options and its close button at its eight sampled viewports; the sampled viewports are not continuum coverage. jsdom has no layout (TC-13), so the unit test decides the declaration and the real-browser run decides the measured size.

Traces: NFR-12, FR-117

#### Scenario: The stylesheet declares a 44 px minimum height for the settings controls

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of the three theme options, `[data-action="settings"]` and `[data-action="settings-close"]`
- **THEN** each value is at least 44 px, no declaring rule is inside an at-rule such as `@media`, and no `min-height` declaration has the priority `important`

#### Scenario: Measured in a real browser the settings controls are at least 44 px in both directions

- **GIVEN** the built page in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts`, with the settings panel opened by the settings button
- **WHEN** the probe measures the settings button, the three options and the panel's close button
- **THEN** each is at least 44 px wide and at least 44 px tall, and the spec reports no line for a measured control below 44×44

### Requirement: The accessibility sweep covers the manual themes

The real-browser accessibility sweep `e2e/nfr-13-a11y.spec.ts` (`npm run check:a11y`) SHALL include the states "manual dark on a light system" and "manual light on a dark system" (the sweep until now only emulates the system scheme, so a manual override would never be checked), and the state "the theme control focused from the keyboard" (NFR-13, FR-102, FR-105). In every state axe-core SHALL report no violation (text contrast 1.4.3 included); axe does not test non-text contrast (1.4.11), which rests on the stylesheet tests of «Borders, cues and focus rings have enough contrast». The coverage is `sampled`, never continuum.

Traces: NFR-13, FR-102, FR-105

#### Scenario: Manual themes pass the sweep

- **GIVEN** the built page in Chromium with `binarka.theme` = `dark` set by `addInitScript` on a light system scheme, and again with `light` on a dark system scheme
- **WHEN** the sweep runs axe-core, with the settings panel closed and with it open
- **THEN** axe reports no violation in either state

#### Scenario: A manual theme resolves the same tokens as auto on that system

- **GIVEN** (in `e2e/nfr-13-a11y.spec.ts`, project `a11y`) the page with `dark` stored on a light system scheme, and the page with `auto` on a dark system scheme
- **WHEN** the check reads the computed colours of `body`, a cell and a button in both
- **THEN** the two pages compute the same colours

#### Scenario: The focused theme option shows an indicator

- **GIVEN** (in the keyboard focus sweep of `e2e/nfr-13-a11y.spec.ts`) the page with focus moved to a theme option by Tab
- **WHEN** the sweep reads the computed outline of the focused option
- **THEN** its outline style is not `none` and its outline width is at least 2px

## MODIFIED Requirements

### Requirement: Page document order

In document order the page root SHALL hold: a `header` (the title, a heading with the text «Бінарка», then the settings button `[data-action="settings"]`, then the `[data-action="rules"]` button), the summary button `[data-action="setup"]` (FR-95), the board `[data-board]`, the buttons `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]` in this order, then the message area holding `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]` in this order (FR-68). The size control, the level control and the level options are not in this sequence: they sit inside the setup sheet (FR-96). The setup sheet, the rules panel (FR-57), the settings panel (FR-117) and the confirmation dialog SHALL be outside this sequence and outside the board element. The message area SHALL always be present in the DOM, with all three message elements, also while a message is shown and after every board change. The reserved height of the message area is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`. This requirement names the summary button by its hook `[data-action="setup"]` and does not depend on the element type of the control.

Traces: FR-68, FR-95, FR-96, FR-117, FR-102

#### Scenario: Order at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test compares document positions of these elements with `compareDocumentPosition`: the `header`, `[data-action="setup"]`, `[data-board]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, `[data-message="idle"]`, `[data-message="hint"]`, `[data-message="win"]`
- **THEN** each element follows the previous one in this order
- **AND** the `header` contains a heading with the text «Бінарка», then the `[data-action="settings"]` button, then the `[data-action="rules"]` button, in this order

#### Scenario: The message area holds the three messages

- **GIVEN** the page has just been mounted
- **WHEN** the test takes the parent element of `[data-message="idle"]`
- **THEN** that element contains exactly the three elements `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]`, in this order, and no other `[data-message]` element
- **AND** that element follows the three action buttons in document order

#### Scenario: The panel is outside the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-section="rules"]` sits
- **THEN** it is not inside the `header`, not inside the message area, not inside `[data-board]`, and it follows the message area in document order

#### Scenario: The settings panel is outside the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-section="settings"]` sits
- **THEN** it is not inside the `header`, not inside the message area, not inside `[data-board]`, and it follows the message area in document order

#### Scenario: The size and level controls are not in the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-control="size"]`, `[data-control="level"]` and `[data-section="setup"]` sit
- **THEN** the two controls are inside `[data-section="setup"]`, which is not inside the `header`, not inside the message area and not inside `[data-board]`, and which follows the message area in document order

#### Scenario: The order and the message area survive every board change

- **GIVEN** a mounted page with a fixture puzzle
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page, with a hint pressed first so that the hint message has text

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 or to 8 (one run for each) |
| changes the level to «Задачка» (one run) |
| presses «Скинути» |
| reaches a win |

- **THEN** after each action the nine elements of the first scenario still exist exactly once, in the same document order, and the three message elements are still in the same message area

### Requirement: Logo

The page header SHALL show exactly one inline `<svg>` logo inside its heading, drawn as shapes in the page source: a 2×2 mini board with the digits «1 0 / 0 1» in a circle with 0/1 rays, and no text (FR-72). The mini board SHALL be four cell shapes `.logo-cell` (`rect`) in a 2×2 arrangement, each holding one digit shape: a bar for 1 (a `rect` with the class `logo-digit`) and a ring for 0 (an `ellipse` with the class `logo-digit-ring`), so that in reading order (top-left, top-right, bottom-left, bottom-right) the four digits are 1, 0, 0, 1. The circle SHALL be a `circle` element and the rays SHALL be shapes around it: bars (`rect`) for 1 and rings (`ellipse`) for 0, at least one of each. The SVG SHALL hold no `<text>` element, no `<title>`, no `<desc>`, no `<foreignObject>`, no text node of any kind (not even whitespace) and no word; its text content is empty. It SHALL be decorative: `aria-hidden="true"`; the title in the header remains the page's text heading, with the text «Бінарка». It SHALL NOT use an image file: no `<img>`, no `<image>`, no `<use>` and no `href` or `xlink:href` on any element of the SVG, no `src` attribute anywhere on the page (TC-14). The logo SHALL be created once at mount with the header, so a new puzzle, a size change and a win leave exactly one logo, the same element. The logo adds no page text, so NFR-5 is unaffected. The header holds one more inline `svg`, the drawn gear inside the settings button `[data-action="settings"]` (see «Settings button and panel»): it has `aria-hidden="true"`, no `<text>`, `<title>`, `<desc>`, `<foreignObject>`, `<use>`, `href` or `xlink:href` and no text node, and it is not the logo; these two are the only `svg` elements of the root (TC-14 and FR-72, amended 2026-10-10, autonomy-log rows 120 and 121: the logo and the gear are the two inline graphics allowed, and FR-72 describes the logo only). In the rest of this requirement «the svg» means the logo. Legibility of the four digits at 40 px and the look of the mark are covered by the held NFR-15 (and NFR-14), see `docs/requirements-held.md`; the classes, the tag choices and "the same element after a board change" above are spec-made proxies for FR-72 and TC-14, taken from the frozen design (`design/v0/components/binarka-page.tsx`, the source of A-30) and the mount-once structure of the page so that the shapes are checkable in jsdom; they are not requirements of FR-72 itself.

Traces: FR-72, TC-14, FR-117

#### Scenario: One decorative inline logo in the header

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `header` element of the root
- **THEN** the heading in the header contains exactly one `svg` element (the logo), and the root contains exactly one other `svg`, the gear inside `[data-action="settings"]`, and no third
- **AND** both have `aria-hidden="true"`
- **AND** the heading in the header has the exact text content «Бінарка» (the logo adds no text to it)

#### Scenario: The logo holds no text

- **GIVEN** the page has just been mounted
- **WHEN** the test walks every node under the `svg`
- **THEN** there is no `text`, `title`, `desc` or `foreignObject` element and no text node (a `TreeWalker` over `SHOW_TEXT` finds none)
- **AND** the `svg`'s `textContent` is the empty string

#### Scenario: The gear holds no text and no reference

- **GIVEN** the page has just been mounted
- **WHEN** the test walks every node under the gear `svg`
- **THEN** there is no `text`, `title`, `desc`, `foreignObject` or `use` element, no text node, and no element has an `href` or `xlink:href` attribute

#### Scenario: The mini board shows 1 0 / 0 1

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the shapes of the `svg` with the classes `logo-cell`, `logo-digit` and `logo-digit-ring`
- **THEN** there are exactly four `rect` elements with the class `logo-cell`, with two distinct `x` values and two distinct `y` values, each of the four (x, y) combinations occurring once
- **AND** there are exactly four digit shapes, one in each cell, and in reading order of the cells they are: a `rect.logo-digit` (1), an `ellipse.logo-digit-ring` (0), an `ellipse.logo-digit-ring` (0), a `rect.logo-digit` (1)
- **AND** reading order means the cells ordered by (`y`, then `x`) ascending, the values read with `getAttribute` and compared as numbers
- **AND** each digit shape lies inside its cell: for a `rect.logo-digit` its `x` and `y` (and for an `ellipse.logo-digit-ring` its `cx` and `cy`) are within the cell's `x` to `x` + `width` and `y` to `y` + `height`, and exactly one digit shape lies in each cell

#### Scenario: Circle and 0/1 rays

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `svg`
- **THEN** it contains exactly one `circle` element
- **AND** it contains at least one `rect` and at least one `ellipse` that carry none of the classes `logo-cell`, `logo-digit` and `logo-digit-ring` (the rays: bars for 1, rings for 0)

#### Scenario: No image file is used

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the whole root
- **THEN** the root contains no `img`, `image`, `use`, `picture`, `object`, `embed` or `canvas` element
- **AND** no element of the root has a `src` attribute, and no element of the `svg` has an `href` or `xlink:href` attribute

#### Scenario: The repository holds no image asset

- **GIVEN** the source tree
- **WHEN** the test lists every file under `src/` (and under `public/` if that directory exists; it does not exist today), and reads `index.html` and `src/ui/style.css`
- **THEN** no file under `src/` (or `public/`) has the extension `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico` or `.svg`
- **AND** `index.html` has no `<link>` element whose `rel` contains `icon` and no `<img>` element, and `src/ui/style.css` contains no `url(`

#### Scenario: The logo survives every board change

- **GIVEN** a mounted page with a fixture puzzle and the logo element read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 (one run) and to 8 (one run) |
| reaches a win |

- **THEN** after each action the heading in the header still holds exactly one `svg`, it is the same element as at mount, and it still holds no text node, and the root still holds exactly two `svg` elements (the logo and the gear)

#### Scenario: The logo does not leak the seed

- **GIVEN** the page is mounted with a seed source returning 987654 and the logo present
- **WHEN** the test inspects every text node under the page root, `document.title` and every attribute value of every element in the root, including those of the `svg` and its shapes, each as a separate string
- **THEN** none of those strings contains `987654` and none matches `/9\D?8\D?7\D?6\D?5\D?4/` (so no shape coordinate or `viewBox` accidentally spells the seed)

### Requirement: The board is a labelled group of cell buttons

The page SHALL give `[data-board]` `role="group"` and the Ukrainian `aria-label` «Поле N×N» for the size N of the board shown (digits and the sign × U+00D7, no Latin letters), and the children of the board SHALL be exactly its N×N `[data-cell]` buttons, in reading order (FR-61, FR-69). No element of the page SHALL have `role="grid"`, `role="row"` or `role="gridcell"`, and no `[data-cell]` SHALL carry a `role` attribute (a button keeps its own role). The attributes and classes of the DOM contract on cells (`data-cell`, `data-row`, `data-col`, `data-given`, `cell-given`, `cell-violation`) are unchanged. The page SHALL put an `id` on a descendant of its root only to wire the rules popover, the setup sheet, the settings panel and the confirmation dialog: the rules panel, the heading inside it, the setup sheet, the settings panel and the element that holds the confirmation text (FR-57, FR-96, FR-117, FR-67). Each of these five ids ends in a number that belongs to the mount, so two pages mounted on two roots of one document share no id, and no other descendant of the root has an `id`. The page SHALL NOT use a `for` attribute. The stylesheet SHALL NOT use `display: contents` on any rule, because that has a history of dropping the semantics of the element it is applied to (here the board group and the cell buttons).

Traces: FR-61, FR-43, FR-57, FR-67, FR-69, FR-96, FR-117

#### Scenario: Role and name of the default board

- **GIVEN** the page is mounted with the default size
- **WHEN** the test reads `[data-board]`
- **THEN** it has `role="group"` and `aria-label` equal to «Поле 6×6»
- **AND** it has exactly 36 children, and they are exactly the 36 `[data-cell]` buttons, with `data-row` and `data-col` running row by row and left to right from (1, 1) to (6, 6)
- **AND** no element of the root has `role="grid"`, `role="row"` or `role="gridcell"`, and no cell has a `role` attribute

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

### Requirement: Hinted cell marker

The cell that the hint button filled SHALL carry the class `cell-hinted` until the next board change, and at most one cell SHALL carry it at any time (FR-66). The marker SHALL be removed by any later board change: a click on a non-given cell (including the hinted cell itself), a hint that fills another cell (the marker then moves to that new cell), «Нова головоломка», a press of «Почати» (at once, or after «Так, почати») and «Скинути». The marker SHALL NOT be removed by an action that changes no cell: a click on a given cell (FR-33), a hint that fills no cell (FR-25, FR-26), opening or closing the rules panel (FR-57), opening or closing the setup sheet (FR-96), marking a size or a level in the setup sheet (FR-100), a theme switch (FR-103), a failed generation that keeps the previous board (FR-43), a cancelled confirmation (FR-67) and a press of the already selected size (FR-73; that press now only marks). An action that needs confirmation (FR-67) removes the marker when it is performed, not when it is requested. A given cell SHALL never carry the marker, and no cell carries it at mount. Which cue the marker draws (a cue that is not colour alone) is rendering and is covered by the held NFR-11 and NFR-14, see `docs/requirements-held.md`; this requirement pins the class only.

Traces: FR-66, FR-39, FR-88, FR-96, FR-100, FR-101, FR-103

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

The page SHALL make every `[data-cell]` of the board shown its own Tab stop: the cells are reached by Tab in reading order (row by row, left to right), after the summary button and before the hint button (FR-59, FR-68, FR-69, FR-95), and the page SHALL NOT put a `tabindex` attribute on any element of its root, at mount and after every board change. The page SHALL NOT handle the Arrow, Home and End keys, with or without Ctrl, Shift or Alt: it handles no key event on the board or its cells, so no key event on the board or a cell is default-prevented (Tab, Shift+Tab, PageUp, PageDown, Escape and letters included), no key moves DOM focus, and no key changes a cell (FR-59). Showing a board (the mount, a performed new puzzle, a performed «Почати», a reset) SHALL NOT move DOM focus, with one exception: «Почати» and the close button «Закрити» of the setup sheet return DOM focus to the summary button (FR-97, FR-101, see «Choosing and closing the sheet»); when «Почати» needs the confirmation, DOM focus goes to «Скасувати» while the dialog is open and then to the summary button (FR-98). A press on a size button or a level button inside the sheet moves no focus: it stays on the pressed button. A press on a theme option leaves DOM focus on the pressed option (it shows no board, FR-103, FR-117). A hint, whether or not it fills a cell, SHALL leave DOM focus on the hint button. Tab and Shift+Tab are the browser's. A new puzzle or «Почати» whose generation fails keeps the previous board and its cells.

Traces: FR-59, FR-43, FR-68, FR-69, FR-95, FR-97, FR-100, FR-101, FR-103, FR-117

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

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила» and the settings button, the summary button, the three size buttons, the four level buttons, the three theme options, the close button «Закрити» of the settings panel, the start button «Почати» and the close button «Закрити» of the setup sheet, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the 2px gap between cells shows the page colour on the ring's inner side, the ring's outer edge lands on a neighbour's fill (the pairs `--color-focus` against cell, given and violation fills, 6.70, 5.41 and 4.63 with the design's values) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all. The open setup sheet SHALL keep a keyboard-focused control clear of its sticky footer row (FR-65 "unobscured", WCAG 2.4.11): the open sheet declares a `scroll-padding-bottom` of at least the footer height, so the browser's own focus scrolling brings a focused option above the footer (second review-gate fix round, 2026-10-10, autonomy-log row 126).

Traces: FR-65, FR-87, FR-95, FR-97, FR-101, FR-102, FR-117

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
- **WHEN** the test reads `[data-action="rules"]`, the summary button `[data-action="setup"]`, the three size `button[role="radio"]` and the four level `button[role="radio"]` (FR-87), the three theme `button[role="radio"]` (FR-102), the settings button `[data-action="settings"]`, the close button `[data-action="settings-close"]`, the start button `[data-action="setup-start"]`, the close button `[data-action="setup-close"]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, the close button of `[data-section="rules"]`, `[data-confirm="yes"]`, `[data-confirm="no"]` and every `[data-cell]`
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
- **THEN** it declares `scroll-padding-bottom` with a length of at least `calc(2.75rem + 48px)` (the strip of `2.75rem + 16px`, the sheet's bottom padding of up to 24px and the 5px ring, the need measured in `docs/qa/update-setup-sheet-start/focus-obscured-repro.txt`); the e2e walk decides the fit

#### Scenario: A focused option in a scrolling sheet is not covered by the footer

- **GIVEN** a real browser at 320×700, 1366×650, 320×568 and 375×667 (e2e, `e2e/nfr-13-a11y.spec.ts`; sampled), the setup sheet open with «Поле 4×4» marked, so the sheet scrolls inside itself
- **WHEN** the keyboard moves the focus with Tab from «Поле 4×4» through the size options and the four level options, with no scrolling by script
- **THEN** for each focused option the bottom of its focus ring (its rect bottom plus the outline offset and width) is at or above the top of the footer strip behind «Почати» and «Закрити»

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule with literal `#rrggbb` values, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65). The tokens are `--color-page`, `--color-text`, `--color-cell-bg`, `--color-cell-border`, `--color-given-bg`, `--color-given-border`, `--color-violation-bg`, `--color-violation-border`, `--color-violation-text`, `--color-focus`, `--color-control-bg`, `--color-control-border` and `--color-win-text`. The colour scan applies to every declaration outside a `:root` rule, wherever it is in the file (top level, nested rules, `@media`, `@supports`, `@layer`): its value SHALL NOT match `/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i` and SHALL NOT contain a CSS named colour (the full CSS Color 4 list); the keywords `transparent`, `currentcolor`, `inherit`, `initial`, `unset` and `revert` are allowed because they introduce no colour; the colour-bearing shorthands `background`, `border`, `border-top`, `border-right`, `border-bottom`, `border-left`, `outline`, `box-shadow`, `text-decoration` and `column-rule` are allowed only when their colour is a `var(--color-...)` token (or the value is `none` or `0`); and no `--color-*` property is declared outside a `:root` rule. Selectors such as `#app` are not declaration values and are not affected. The rules `body`, `.cell`, `.cell-given`, `.cell-violation`, `button`, `.message-win` and the `:focus-visible` rules SHALL take their `color`, `background-color`, `border-color` and `outline-color` from these tokens, declared with those longhand properties. The dark palette is one more `:root` rule in the same file, `:root[data-theme="dark"]`, which redefines every one of the tokens with a `#rrggbb` value (A-51): each token therefore has exactly two value sets, light in the top-level `:root` and dark in that block. The page always sets `data-theme` on `<html>` (FR-104, FR-116), so the stylesheet has no `prefers-color-scheme` block (Q13). The colour scan counts `:root[data-theme="dark"]` as a `:root` rule: `--color-*` properties and `#rrggbb` literals are allowed in it and nowhere else. The 13 tokens above are those of the baseline; a token that the signed design adds for «Почати» (S, FR-101) joins the list and is declared in both value sets. A `:root` rule inside `@media`, `@supports` or `@layer` may redefine tokens too, and then every resulting token set (the top-level set, the top-level set with the overrides of `:root[data-theme="dark"]` applied, and the top-level set with each conditional block's overrides applied) SHALL satisfy every pair below: **every contrast pair holds for each token set, light and dark** (FR-65). The shipped stylesheet has exactly the two value sets and no conditional `:root` block; the clause about conditional blocks is the generality of the test helper, not a feature of the stylesheet. The WCAG 2 contrast ratio, computed from relative luminance, SHALL be at least 3:1 for these pairs: the cell border `--color-cell-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the violation cue `--color-violation-border` against `--color-page`, `--color-cell-bg` and `--color-violation-bg`; the given cue against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the focus ring `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-violation-bg`; and the control border `--color-control-border` against `--color-page`. The given cue is the border of a given cell: 2px wide, in `--color-given-border` (the colour of `.cell-given`'s `border-color`), together with the bold digits (`font-weight: 700`); the fill `--color-given-bg` is a redundant decoration and is not the cue, because a pale fill cannot reach 3:1 against the page and the cell colour and keep the digit readable. The text SHALL have at least 4.5:1: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-control-bg`, `--color-violation-text` against `--color-violation-bg`, and `--color-win-text` against `--color-page`.

Traces: FR-65, FR-64, NFR-9, FR-104

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 13 token names listed above is declared once with a `#rrggbb` value
- **AND** the rule `:root[data-theme="dark"]` declares each of the same names once with a `#rrggbb` value, so each token has exactly two value sets

#### Scenario: Rules use the tokens and no colour literal is left

- **GIVEN** every declaration of `src/ui/style.css` outside the `:root` rules (the top-level one and `:root[data-theme="dark"]`), found by walking the parsed stylesheet through nested rules and at-rules
- **WHEN** the test applies the colour scan above to each value
- **THEN** none matches the literal pattern or contains a named colour, every colour-bearing shorthand has a `var(--color-...)` colour or the value `none` or `0`, every `color`, `background-color`, `border-color` and `outline-color` value is a single `var(--color-...)` of a declared token or an allowed keyword, and no `--color-*` property is declared outside `:root`
- **AND** `body` declares `background-color` `var(--color-page)` and `color` `var(--color-text)`; `.cell` declares `border-color` `var(--color-cell-border)` and `background-color` `var(--color-cell-bg)`; `.cell-given` declares `border-color` `var(--color-given-border)` and `background-color` `var(--color-given-bg)`; `.cell-violation` declares `border-color` `var(--color-violation-border)`, `background-color` `var(--color-violation-bg)` and `color` `var(--color-violation-text)`

#### Scenario: A token redefined in a conditional block is checked too

- **GIVEN** the top-level token set, the dark set (the top-level set with the overrides of `:root[data-theme="dark"]` applied) and every `:root` rule found inside `@media`, `@supports` or `@layer` in `src/ui/style.css`
- **WHEN** the test builds each resulting token set and computes every pair of this requirement for it
- **THEN** every pair of every set meets its threshold (the light and the dark set always exist; a conditional block adds sets only if the file has one)

#### Scenario: The page has no prefers-color-scheme block

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches it for `prefers-color-scheme`
- **THEN** there is no match

#### Scenario: Cell borders have 3:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the WCAG contrast ratio of `--color-cell-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`
- **THEN** each ratio is at least 3

#### Scenario: The given cue has 3:1 and is not the fill

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and the declarations of `.cell-given`
- **WHEN** the test computes the ratio of `--color-given-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`
- **THEN** each ratio is at least 3
- **AND** `.cell-given` declares `border-width` 2px, `border-color` `var(--color-given-border)` and `font-weight` 700
- **AND** the cue distinguishes a given cell from an ordinary one without the fill: `--color-given-border` differs from `--color-cell-border` and the given `border-width` (2px) is greater than the ordinary one (1px)

#### Scenario: The violation cue has 3:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-violation-border` against `--color-page`, `--color-cell-bg` and `--color-violation-bg`
- **THEN** each ratio is at least 3

#### Scenario: The focus ring has 3:1 against every cell background

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-violation-bg`
- **THEN** each ratio is at least 3

#### Scenario: The control border has 3:1 and the text has 4.5:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-page`, of `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-control-bg`, of `--color-violation-text` against `--color-violation-bg`, and of `--color-win-text` against `--color-page`
- **THEN** the first ratio is at least 3 and the others are at least 4.5

#### Scenario: The cascade gives each cell state the colours whose contrast is checked

- **GIVEN** the injected stylesheet and the four cell kinds at N = 4, 6 and 8 of "The computed border is heavier for a violation at every size", and the token values converted to `rgb(r, g, b)` strings, once with the light values and once with the dark values (the test injects the stylesheet with the values of the set substituted)
- **WHEN** the test reads `getComputedStyle(cell)` `borderTopColor`, `backgroundColor` and `color` of each kind
- **THEN** an ordinary cell has `--color-cell-border`, `--color-cell-bg` and `--color-text`; a given cell has `--color-given-border`, `--color-given-bg` and `--color-text`; a violating cell and a given cell in a violation both have `--color-violation-border`, `--color-violation-bg` and `--color-violation-text`
- **AND** the page (`body`) computes `background-color` `--color-page`

#### Scenario: The contrast helper is not vacuous

- **GIVEN** the contrast function of the test helpers
- **WHEN** it is called for `#ffffff` against `#000000`, for `#ffffff` against `#ffffff` and for the pair `#d1d5db` and `#f9fafb`
- **THEN** it returns 21, 1 and a value below 3 respectively

### Requirement: The size buttons set their own colours and the board disables double-tap zoom

The stylesheet SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule that styles the size buttons (`.size-control button`) and in the rule of the checked button (`.size-control button[aria-checked='true']`), so that the colours of the size buttons do not depend on the browser or the operating system (FR-65). For each state, the declarations of the rule for the unchecked button, with those of the rule for the checked button laid over them for the checked state, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens), for each token set, light and dark (A-51, FR-65). The stylesheet SHALL set `touch-action: manipulation` in the rule of the class `board`. The element `[data-board]` SHALL carry the class `board`.

Traces: FR-65, NFR-9

#### Scenario: The size buttons declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.size-control button` and of `.size-control button[aria-checked='true']`
- **THEN** `.size-control button` declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`
- **AND** the checked state, with its own declarations laid over the unchecked ones, has a `color` and a `background-color` that are such tokens
- **AND** the ratio of the text colour to the background colour is at least 4.5 in each of the two states in the light token set and in the dark token set

#### Scenario: The board sets touch-action

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test reads the declarations of the `.board` rule and the classes of `[data-board]`
- **THEN** `touch-action` is `manipulation` and `[data-board]` has the class `board`

### Requirement: The summary and level buttons set their own colours

The summary button SHALL carry the class `setup-button` (its text span carries `setup-summary` and its cue span `setup-cue`, as in the design reference `review-set-11`), the level control the class `level-control`, and the stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule `.setup-button`, in the rule `.level-control button`, in the rule `.level-control button[aria-checked='true']` and in the rule `.level-control button[aria-disabled='true']` (FR-65, NFR-9). For each of the four states, the declarations of the plain rule, with those of the state rule laid over them, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens) in each token set, light and dark (A-51, FR-65), and the unavailable state SHALL NOT be drawn with `opacity`. The rule `.level-control button[aria-disabled='true']` SHALL also declare a cue that is not colour alone (FR-91): a `border-style` that differs from the plain rule's, or a `text-decoration` other than `none`; which cue is used follows the user's updated design (the design reference `review-set-11` uses a dashed border and a dashed radio ring and no strike-through, autonomy-log row 93). No colour literal is added, and no `--color-*` token is added unless the signed design adds one for «Почати» (the 13 tokens of «Borders, cues and focus rings have enough contrast» stay declared). The summary button, the level buttons and the close button are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator of FR-65, and the rules of the sheet obey the existing stylesheet scans (no `!important`, no `:has(` besides the idle-line rule, no `display: contents`, no removed outline). The start button `[data-action="setup-start"]` SHALL set its own explicit `color` and `background-color`, each a single `var(--color-...)` token, in one rule that matches it (found by matching the mounted element against the selectors of the stylesheet), with at least 4.5:1 contrast between the two on the resolved tokens of each token set, in the plain state and in the hover and focus-visible states if the rule has them, and without `opacity` (FR-65, FR-101). Whether the tokens of the baseline suffice for «Почати» or the signed design adds one token for it (for example a primary fill) is the design's call; a token that the design adds is declared once in `:root` with a `#rrggbb` value and satisfies the pairs of «Borders, cues and focus rings have enough contrast». The `.size-control` rules are not changed by this requirement. The look of the buttons (the ring, the sunken look of the unavailable state, the colours beyond the pairs above) is covered by the held NFR-14, see `docs/requirements-held.md`, and is not claimed here.

Traces: FR-65, NFR-9, FR-87, FR-91, FR-95, FR-97, FR-101

#### Scenario: The summary and level buttons declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.setup-button`, `.level-control button`, `.level-control button[aria-checked='true']` and `.level-control button[aria-disabled='true']`
- **THEN** each of the four rules exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`
- **AND** none of the four declares `opacity`

#### Scenario: Each state has 4.5:1 text

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and the four rules above
- **WHEN** the test lays the checked rule and the aria-disabled rule over the plain level rule, and computes the ratio of the text colour to the background colour for the summary, plain, checked and unavailable states
- **THEN** each of the four ratios is at least 4.5 in each token set

#### Scenario: The unavailable level has a cue besides colour

- **GIVEN** the rules `.level-control button` and `.level-control button[aria-disabled='true']`
- **WHEN** the test compares their `border-style` and `text-decoration` declarations
- **THEN** the aria-disabled rule declares a `border-style` different from the plain rule's, or a `text-decoration` value other than `none`

#### Scenario: The checked level has a cue besides colour

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test reads the name span of each level button and the rules `.level-control button .level-name::before` and `.level-control button[aria-checked='true'] .level-name::before`
- **THEN** each name span has the class `level-name`, the first rule declares `content` and a `border-radius` (the radio ring), and the second declares a `box-shadow` whose value contains `inset` (the dot inside the ring), so the checked level differs from the others in shape and not by colour alone (WCAG 1.4.1; review-gate fix round, 2026-10-09)

#### Scenario: The classes are on the elements and the buttons are buttons

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="setup"]`, `[data-control="level"]`, its four radio buttons and `[data-action="setup-close"]`
- **THEN** the summary has the class `setup-button`, the control has the class `level-control`, and each of the six buttons is a `button` element, so `button:focus-visible` applies to it

#### Scenario: The start button declares its colours

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test finds the rule that matches `[data-action="setup-start"]` and reads its declarations
- **THEN** the rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`, and no `opacity`
- **AND** the ratio of the text colour to the background colour is at least 4.5 in each token set

#### Scenario: The existing stylesheet scans still pass

- **GIVEN** the stylesheet with the sheet, summary and level rules
- **WHEN** the existing scans of «Rules use the tokens and no colour literal is left», «Nothing removes the outline» and «The stylesheet stays inside the build target, with one `:has(` exception» run
- **THEN** each passes unchanged, and each of the 13 token names of the baseline is still declared in `:root`

### Requirement: The page meets the WCAG 2.2 AA criteria of the accessibility requirements

The page SHALL meet WCAG 2.2 AA for what FR-43, FR-59 to FR-65, FR-67, FR-69, FR-70 and FR-87 to FR-101, FR-102 and FR-117 cover (NFR-9): keyboard operation 2.1.1 (every cell and every control reached by Tab in reading order and operated by Enter and Space as a native button, FR-59 and FR-60), name, role and value 4.1.2 (the role and name of the board group, of the three radiogroups, of the summary button, of the settings button, of the start button «Почати», of the setup sheet and of the settings panel, the cell names, `aria-checked` (the marked state in the two radiogroups while the sheet is open, FR-100), `aria-disabled`, `aria-invalid`), labels 3.3.2 (the accessible names «Розмір поля», «Складність», «Тема» and «Налаштування» and the visible text of each size button, each level button, each theme option and the summary button), status messages 4.1.3 (the two `role="status"` regions), use of colour 1.4.1 (the heavier violation border and `aria-invalid`) and non-text contrast 1.4.11 (the 3:1 pairs) and visible focus 2.4.7 (the `:focus-visible` rules). Every button of the page (the cell buttons, the size radio buttons, the level radio buttons, the summary button, the start button, the settings button and the close buttons of the sheet and of the settings panel included; the name of a button without `aria-label` is its text content without `aria-hidden` descendants) SHALL have a non-empty accessible name in Ukrainian: its `aria-label` when it has one (every cell), otherwise its text; the board group, the three radiogroups, the setup sheet and the settings panel SHALL have a non-empty Ukrainian `aria-label`. No element of the page SHALL have a `tabindex` attribute, before or after play. Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).

Traces: NFR-9, NFR-5, FR-43, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, FR-67, FR-69, FR-70, FR-87, FR-88, FR-91, FR-95, FR-96, FR-97, FR-98, FR-99, FR-100, FR-101, FR-102, FR-117

#### Scenario: Every button, the radiogroups, the sheet and the board have a Ukrainian name

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test computes the accessible name of each `button` (its `aria-label` when present, else its text content without `aria-hidden` descendants) and of each `[role="radiogroup"]`, of `[data-section="setup"]` and of `[data-board]` (their `aria-label`)
- **THEN** there are 58 buttons (36 cells and 22 others: «Правила», the settings button, the summary button, three size buttons, four level buttons, three theme options, «Почати», «Закрити», the settings panel's «Закрити», «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати»), three radiogroups, the setup sheet, the settings panel and the board, every name is non-empty, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`
- **AND** the names include «Підказка», «Скинути», «Нова головоломка», «Розмір поля», «Поле 6×6», «Складність», «Поле і складність», «Налаштування», «Тема», «Світла», «Темна», «Як у системі», «Почати», «Закрити», `Поле і складність: 6×6 · Розминка`, the four level buttons as name, space and description, and the 36 cell names

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

#### Scenario: The radiogroups expose the marked state while the sheet is open

- **GIVEN** a mounted 6×6 page at «Розминка», the sheet opened, and «Поле 4×4» marked
- **WHEN** the test reads `aria-checked` and `aria-disabled` of the three size buttons and the four level buttons
- **THEN** `aria-checked="true"` is on «Поле 4×4» only and on «Розминка» only, and «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`
- **AND** after the sheet is closed by a `toggle` event with `newState` `closed`, `aria-checked="true"` is on «Поле 6×6» only and no level button has `aria-disabled`
