## MODIFIED Requirements

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила» and the settings button, the summary button, the three size buttons, the four level buttons, the three theme options, the two language options, the close button «Закрити» of the settings panel, the start button «Почати» and the close button «Закрити» of the setup sheet, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the inner side of the ring, over the gap between cells, shows the board plate `--color-line` and not the page (the board's gaps are 4, 3 and 2px with the size and the width; the pair `--color-focus` against the plate is 11.72 in light and 10.65 in dark, A-57), the ring's outer edge lands on a neighbour's border and fill (the pairs `--color-focus` against the cell, given, violation, hinted-soft and success fills are 10.87 or more in light and 8.17 or more in dark, and against the cell border 3.87 and 3.36) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. Three adjacencies are accepted below 3:1 (A-57, PA-Q8 of the palette amendment): the ring against a neighbour's violation border (2.47 light, 1.96 dark), against a hinted neighbour's primary border (2.94, 1.88) and against the success border at the edge of a solved 8×8 board (2.53, 1.53); in each case the inner band of the ring stays on the plate at 10.65:1 or more. A fourth place of the second pair is accepted the same way (A-61, autonomy-log row 193): the keyboard ring of a chosen segmented option (the size, theme or language option, `outline-offset: -1px`) covers the outer pixel of the option's 2px `--color-primary` frame, so its inner side touches that frame at 2.94 light and 1.88 dark, while its outer band lies on the card fill `--color-control-bg` at 15.88 light and 13.85 dark (at least 13.85 in either set). No pair is added for it: `--color-cell-bg`, which has the same value as `--color-control-bg` in both sets, is already paired with the ring. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all. The open setup sheet SHALL keep a keyboard-focused control clear of its sticky footer row (FR-65 "unobscured", WCAG 2.4.11): the open sheet declares a `scroll-padding-bottom` of at least the footer height, so the browser's own focus scrolling brings a focused option above the footer (second review-gate fix round, 2026-10-10, autonomy-log row 126). The open settings panel SHALL do the same for its sticky «Закрити» (A-61): `.settings:popover-open` declares a `scroll-padding-bottom` of at least `calc(2.75rem + 2rem + 2px + env(safe-area-inset-bottom))` (the panel's 1rem bottom padding under the stuck button, the button's height, its 1rem mask and the 2px the focus ring reaches below an option), so a focused option on a short window scrolls clear of the button; the scenarios are in «The settings panel takes the design's size, place and paint».

Traces: FR-65, FR-87, FR-95, FR-97, FR-101, FR-102, FR-117, FR-107, NFR-13, A-61, A-57

#### Scenario: Focus-visible rules exist for the cell and the button

- **GIVEN** the parsed `src/ui/style.css` (jsdom never matches `:focus-visible`, so these rules are checked as declarations)
- **WHEN** the test looks for the rules whose selector list contains `.cell:focus-visible` or `button:focus-visible`
- **THEN** each of the two exists, declares `outline-style: solid`, an `outline-width` of at least 2px and `outline-color: var(--color-focus)`

#### Scenario: The cell ring is outside the border and above the neighbours

- **GIVEN** the `.cell:focus-visible` rule
- **WHEN** the test reads its declarations
- **THEN** `outline-offset` is `2px`, `position` is `relative` and `z-index` is an integer of at least 1
- **AND** the `button:focus-visible` rule declares an `outline-offset` greater than 0

#### Scenario: The ring's accepted adjacencies are recorded

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-focus` against `--color-line`, `--color-violation-border`, `--color-primary` and `--color-success`, rounded to two decimals
- **THEN** the first is at least 10.65 and the other three equal 2.47, 2.94 and 2.53 in light and 1.96, 1.88 and 1.53 in dark, so a change of a value that moves an accepted adjacency is deliberate and not silent
- **AND** none of those three ratios is listed as a contrast pair of «Borders, cues and focus rings have enough contrast»
- **AND** the ratio of `--color-focus` against `--color-control-bg`, the card fill that the outer band of the ring of a chosen segmented option lies on, is at least 13.85 in each set (15.88 light, 13.85 dark), `--color-control-bg` and `--color-cell-bg` resolve to the same value in each set, and no pair of «Borders, cues and focus rings have enough contrast» names `--color-focus` against `--color-control-bg`

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
- **THEN** it declares `scroll-padding-bottom` with a length of at least `calc(2.75rem + 48px)` (the strip of `2.75rem + 16px`, the sheet's bottom padding of up to 24px and the 5px ring, the need measured in `docs/qa/update-setup-sheet-start/focus-obscured-repro.txt`); the e2e walk decides the fit

#### Scenario: A focused option in a scrolling sheet is not covered by the footer

- **GIVEN** a real browser at 320×700, 1366×650, 320×568 and 375×600 (e2e, `e2e/nfr-13-a11y.spec.ts`; sampled; the 375-wide case is 375×600 since `update-setup-sheet`: with the design's sheet metrics the sheet with «Поле 4×4» marked fits at 375×667 and does not scroll), the setup sheet open with «Поле 4×4» marked, so the sheet scrolls inside itself, which the walk asserts at each viewport
- **WHEN** the keyboard moves the focus with Tab from «Поле 4×4» through the size options and the four level options, with no scrolling by script
- **THEN** for each focused option the bottom of its focus ring (its rect bottom plus the outline offset and width) is at or above the top of the footer strip behind «Почати» and «Закрити»

### Requirement: Settings button and panel

The page header SHALL hold, between the title and the button «Правила» (document order: the heading, then `[data-action="settings"]`, then `[data-action="rules"]`), a settings button `[data-action="settings"]` with `type="button"`, whose only child is one decorative inline `svg` (a drawn gear, `aria-hidden="true"`, no text), with the accessible name «Налаштування» ("Settings" in English mode) given by its `aria-label` and a `popovertarget` equal to the `id` of the settings panel, so that it opens the panel with no script (FR-68, FR-117, signed wireframe Topic 3 B, autonomy-log row 120). The button carries no `aria-haspopup`, `aria-expanded` or `tabindex`. The settings panel `[data-section="settings"]` SHALL be created once at mount, inside the page root and outside the header, the board and the message area; it is an element with the `popover` attribute (`popover="auto"`) and `role="dialog"`, with the `aria-label` «Налаштування» ("Settings" in English mode), no `aria-labelledby`, and an `id` that ends in a number belonging to the mount (the fifth id of the mount, A-41 amended). It holds, in this order: the visible plain-text label «Тема» and the theme control `[data-control="theme"]` (see «Theme control»), the visible plain-text label «Мова» and the language control `[data-control="language"]` (see «Language control»), and a close button `[data-action="settings-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the panel's `id` and `popovertargetaction="hide"`. The panel follows the message area in document order and precedes `[data-dialog="confirm"]`; it is outside the sequence of «Page document order». Escape, a click outside the panel (the light dismiss) and the close button close it natively; the page adds no key handler and no focus handling for it (FR-59). The panel is the same element, with the same children, after a hint, a win, a reset, «Нова головоломка», a press of «Почати», a theme press and a language press. Where the button is drawn, the gear's drawing and the 44 px sizes are layout, covered by NFR-12 (see «The theme options meet the touch-target floor») and by NFR-14, which is not held (`review-set-14`). The panel's size, place and paint are A-61's regimes: the bottom sheet below 48rem, and from 48rem the panel under the header at the right, its right edge on the column's right edge; the values and their checks are in «The settings panel takes the design's size, place and paint». The hooks `[data-action="settings"]`, `[data-section="settings"]` and `[data-action="settings-close"]` are spec-made proxies, to confirm against the signed review set (task 1.4).

Traces: FR-68, FR-102, FR-117, NFR-9, FR-107, NFR-12, NFR-14, A-61, FR-111

#### Scenario: Settings button and panel at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="settings"]` and `[data-section="settings"]`
- **THEN** exactly one of each exists in the root; the button is a `button` with `type="button"`, `aria-label` equal to «Налаштування», `popovertarget` equal to the panel's `id`, no `aria-haspopup`, `aria-expanded` or `tabindex`, and exactly one child element, an `svg` with `aria-hidden="true"` and no text node
- **AND** the panel has the `popover` attribute, `role="dialog"`, `aria-label` equal to «Налаштування», no `aria-labelledby`, a non-empty `id`, is not inside the `header`, `[data-board]` or the message area, follows the message area and precedes `[data-dialog="confirm"]`
- **AND** its element children, in order, are a plain-text element with the text «Тема», `[data-control="theme"]`, a plain-text element with the text «Мова», `[data-control="language"]` and `[data-action="settings-close"]`

#### Scenario: The header fits its column on phones

- **GIVEN** the built page open in Chromium at each sampled width 320, 322, 334, 361, 369, 375, 385, 768 and 1280 px, 812 px high (the check lives in `e2e/nfr-10-header-fit.spec.ts`, project `layout`; added in the second review-gate fix round, autonomy-log row 130, after the gear made the header overflow at 320 to 334 and 361 to 385 px)
- **WHEN** the check reads the boxes of the header and of its three children (the heading, the settings button, «Правила») and the page's scroll width
- **THEN** every child lies inside the header (within 0.5 px) and the scroll width is at most the viewport width (no sideways scroll, `docs/frontend-conventions.md` rule 18, A-14)
- **AND** coverage is sampled; the stricter instrument is the 1 px sweep of 320 to 800 px (`docs/qa/add-theme-switch/header-sweep-run.txt`). Up to 30rem the title is 1.75rem and the logo 2.75rem (the design's phone rule); up to 22.5rem the title is 1.5rem, the «Правила» padding `0 0.625rem` (both the design's small-phone rule) and the gaps 0.375rem, a deliberate step under the design's 0.5rem: with 0.5rem gaps «Правила» still overflowed by up to 2.8 px at 320 to 322 px

#### Scenario: A remount on the same root replaces the previous mount

- **GIVEN** a `matchMedia` stub that does not match and a page mounted on a root (added in the first review-gate fix round of `add-english-version`: the page attaches its content to the root last, so the previous mount's controls are still connected while a remount runs)
- **WHEN** the page is mounted again on the same root and the player presses "English"
- **THEN** the stub holds one `change` listener (the replaced mount's listener was removed at the remount), and the replaced mount's language control is not rendered again (its "English" option keeps `aria-checked="false"`)

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

### Requirement: The theme options set their own colours

The stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule that styles the theme options (`.theme-control button`) and in the rule of the chosen option (`.theme-control button[aria-checked='true']`), so that the colours do not depend on the browser, the operating system or the effective theme (FR-65, FR-117). For each state and for each token set (light and dark) the text colour against the background colour SHALL have at least 4.5:1 contrast (the WCAG 2 formula on the resolved tokens). The three options are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator. The element `[data-control="theme"]` carries the class `theme-control`, and `[data-control="language"]` carries the class `language-control` with the same pair of rules (`.language-control button` and `.language-control button[aria-checked='true']`). A chosen option differs from an unchosen one by more than colour (WCAG 1.4.1): by its weight (700 against 500) and by its frame (a transparent border becomes `--color-primary`), the design's cues (A-61). How the control is laid out and painted is A-61's and NFR-14's, which is not held (`review-set-14`); the values are in «The settings panel takes the design's size, place and paint».

Traces: FR-65, FR-117, NFR-9, FR-107, NFR-14, A-61

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
- **THEN** the checked rule declares a `font-weight` of at least 700 and a `border-color` other than the plain rule's, and the plain rule declares a `font-weight` of at most 500 and a transparent `border-color`

#### Scenario: The language options declare their colours and a cue

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.language-control button` and `.language-control button[aria-checked='true']`
- **THEN** each rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a declared token, neither declares `opacity`, the ratio of text to background is at least 4.5 in each state in the light and in the dark token set, the checked rule declares a `font-weight` of at least 700 and a `border-color` other than the plain rule's, and the plain rule declares a `font-weight` of at most 500 and a transparent `border-color`

### Requirement: The setup sheet takes the design's size, place and paint

The setup sheet `[data-section="setup"]` (class `setup-sheet`) SHALL take the size, the place and the paint of the design's sheet (`.setup`, `design/v0/app/binarka.css` lines 386-414, 435-650, 949-1007 and 1049-1072; reference `design/v0-screenshots/review-set-14/*setup*.png`), from the page's tokens (FR-96 presentation, FR-65, FR-99, NFR-14, A-60; G2 setup-sheet block, `update-setup-sheet`). It runs after `update-panel-shell`, whose fill, border colour and shadow of the sheet it keeps (see «The panels take the shared surface paint»), and it needs the shell's hook, the root's `data-size` (see «The page root carries the board size»). Wherever the design uses `--cell-border` inside the sheet (the ring, the unavailable card's border, the «Закрити» border), the page uses `--color-control-border`, which has the same values in both sets (`#8c8374` light and `#8a7f71` dark; `--color-cell-border` is darker in light for the board's cells only, A-57).

**Size and place.** The sheet is a popover in the top layer. Its rules are these (every length is the design's; `B` is the board side `min(var(--board-width), var(--column))`, read from the root through the shell's hook, never through `:has(`):

| Regime | Where | Declarations of the rule that is exactly `.setup-sheet` |
|---|---|---|
| Phone | a top-level rule outside any at-rule | `position: fixed`, `inset: auto 0 0 0`, `width: 100%`, `max-width: none`, `margin: 0`, `max-height` declared twice, in this order, `90vh` and then `88dvh` (the fallback first), `box-sizing: border-box`, `overflow-y: auto`, `border-width: 1px 1px 0 1px`, `border-radius: var(--radius-l) var(--radius-l) 0 0`, `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))` |
| Small phone | `@media (max-width: 22.5rem)` | `max-height: calc(100dvh - 9rem)`, `padding-top: 1rem` (the design's `.setup { padding-top: var(--space-4) }` at 22.5rem and narrower) |
| From 48rem, any height (full cover) | `@media (min-width: 48rem)`, one rule | `inset: 0`, `width: calc(var(--column) + 1rem)`, `max-width: calc(100% - 2rem)` (kept from the page; from 48rem it is never the smaller of the two, so it changes no box), `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `min-height: min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 8.5rem))`, `margin: 6rem auto auto`, `padding-bottom: 1rem`, `border-width: 1px`, `border-radius: var(--radius-l)` |
| From 48rem, window at least 44rem tall (anchored) | `@media (min-width: 48rem) and (min-height: 44rem)`, one rule | `inset: 0 0 auto 0`, `width: var(--column)`, `max-height: calc(100dvh - 10.75rem)`, `min-height: min(calc(100dvh - 10.75rem), calc(min(var(--board-width), var(--column)) + 4.75rem))`, `margin: 9.75rem auto 0` |

So on a phone the sheet is a bottom sheet up to 88% of the window height (up to the window less 9rem at 22.5rem and narrower). From 48rem on a window shorter than 44rem (for example 1366×650) it covers the page from 6rem, one rem wider than the column. From 48rem on a window at least 44rem tall (768×1024, 1024×768, 1440×900) it hangs under the summary button, as wide as the column, 0.5rem below the summary (the header and the 1rem gap and the 2.75rem summary end at 9.25rem). In both desktop regimes the `min-height` makes the sheet end at least 0.5rem below the button row (the row ends at `B + 14rem`; the sheet starts at 6rem or 9.75rem), or at the window's limit when that is higher (the `max-height` ends it 1rem above the window's bottom); the sheet grows with its contents up to the window, scrolls inside only when the window is too short, and taller contents cover the messages while the sheet is open. The rules `.setup-sheet:popover-open` (the grid of Footer-1, the strip, the sticky row) keep their layout and their `display`; no rule that is exactly `.setup-sheet` declares `display`, so the closed sheet stays hidden by the user agent. The sheet declares no `line-height`: the placeholder `line-height: normal` of the layout-geometry block is gone, and the sheet keeps the body's line height (A-60).

**Inner metrics, the design's** (the e2e geometry below cannot pass without them; they go beyond the amendment's list, see `design.md`, open point 1). The base `button` rule of the page (`padding: 10px 16px`, a 6px radius, a 1px border) is not the design's, so each control of the sheet states its own padding where the design does: the size options `padding: 0 0.5rem`, 2px border, font size `0.9375rem`, line height 1.2, `font-weight: 500`, radius `calc(var(--radius-m) - 0.1875rem)`; the size control `width: 100%` with no `max-width`, `margin: 0`, radius `var(--radius-m)`, 1px border, padding and gap `0.1875rem`; the level group `gap: 0.5rem`, `margin-top: 0.75rem`; the level cards `padding: 0.5rem 0.75rem`, `gap: 0.125rem`, `min-height: 2.75rem`, 2px border, `border-radius: var(--radius-m)`; the card name `font-size: 1rem`, `font-weight: 700`, `line-height: 1.25`, `gap: 0.5rem`; the card description `font-size: 0.875rem`, `font-weight: 400`, `line-height: 1.35`; the reason line `[data-level-reason]` `margin: 0`, `padding: 0.25rem 0 0.25rem 0.75rem`, `font-size: 0.875rem`, `line-height: 1.35`; «Почати» `padding: 0 0.75rem`, 2px border, `border-radius: var(--radius-m)`, `font-weight: 700`, `line-height: 1.2`, `min-height: 2.75rem`; «Закрити» `padding: 0 0.5rem`, 2px border, `border-radius: var(--radius-m)`, `font-weight: 600`, `min-height: 2.75rem`. At 22.5rem and narrower the level group has `gap: 0.375rem` and the level cards `padding: 0.375rem 0.625rem`, in `@media (max-width: 22.5rem)`; the `min-height` of the buttons stays outside any at-rule (see «The start button and the sheet buttons meet the touch-target floor»).

**The description indent.** Each level card's description starts under the name, not under the radio ring: the description has `padding-left: calc(0.875rem + 0.5rem)`, the ring's width plus the name's gap.

**Paint** (every colour a token; wherever a state rule does not repeat a declaration, the plain rule's applies):

| Element | Declarations |
|---|---|
| Available level card (`.level-control button`) | `border-color: var(--color-option-border)` (decoration, A-60: in no contrast pair), `background-color: var(--color-control-bg)`, `color: var(--color-text)` |
| Radio ring (`.level-control button .level-name::before`) | `0.875rem` square, `border: 2px solid var(--color-control-border)`, `border-radius: 50%`, `background-color: var(--color-control-bg)`; no `box-shadow` |
| Description | `color: var(--color-text-muted)`; in the checked card `color: var(--color-text)` |
| Checked card (`[aria-checked='true']`) | `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)` |
| Checked ring (`[aria-checked='true'] .level-name::before`) | `border-color: var(--color-primary)` and `background-image: radial-gradient(circle, var(--color-primary) 0 40%, var(--color-control-bg) 45%)` (the dot); no `box-shadow` (the `inset` shadow of the review-gate fix round is replaced, SQ-3 A) |
| Unavailable card (`[aria-disabled='true']`) | `border-style: dashed`, `border-color: var(--color-control-border)`, `background-color: var(--color-page)`, `color: var(--color-text-muted)`, no `opacity`, no `box-shadow` |
| Unavailable ring | `border-style: dashed`, `background-color: transparent`, no `background-image`, no `box-shadow` |
| Reason line | `border-left: 3px solid var(--color-primary)`, `color: var(--color-text)` |
| Unchecked size option (`.size-control button`) | `color: var(--color-text-muted)` (the design's `--ink-muted`; muted text on the control fill is already a pair, 7.17 / 7.54), `background-color: var(--color-control-bg)` (the design's `transparent` shows the size control's own `--color-control-bg` fill, and «The size buttons set their own colours…» asks for a token, not `transparent`) |
| Checked size option (`.size-control button[aria-checked='true']`) | `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)`, `font-weight: 700` |
| «Почати» (`.setup-start`) | `background-color: var(--color-primary)`, `border-color: var(--color-primary)`, `color: var(--color-primary-text)` |
| «Закрити» (`.setup-close`) | `border-color: var(--color-control-border)` (2px, solid); its fill is the shell's `--color-surface-raised` |

«Закрити»'s 2px `--color-control-border` border lies on the sheet's `--color-surface-raised` at 3.68 / 3.81; like the overlay border and the available card's border it is decoration and in no pair, because the text «Закрити» identifies the control. The theme options and the language options take the same segmented paint in the settings-panel block (A-61; see «The settings panel takes the design's size, place and paint»): the three checked rules, `.size-control button[aria-checked='true']`, `.theme-control button[aria-checked='true']` and `.language-control button[aria-checked='true']`, agree. The summary button `.setup-button` is not changed.

**The level group's bottom margin stays 28px at every width, a departure from the design, said plainly (A-60, SQ-5).** The design has 24px at every width above 22.5rem (A-60, corrected at autonomy-log row 173) and 1rem at 22.5rem and narrower; with a smaller margin the keyboard focus ring of the last option sits under the footer strip (FR-65, WCAG 2.4.11; «Cells and buttons show a visible, unobscured focus indicator»). Because the sheet is `fit-content` between its floor and its cap, the departure makes the sheet 4px taller than the design's (12px at 320) wherever its content decides the height, never past its `max-height` (at 320×700 in the 6×6 state the expected sheet meets the cap, 2.31px taller); the box test therefore compares the page with the design plus this one recorded deviation (see below), not with the unmodified design. The rule `.setup-sheet > [data-control='level']` keeps `margin-bottom: 28px` outside any at-rule, and `.setup-sheet:popover-open` keeps `scroll-padding-bottom` of at least `calc(2.75rem + 48px)` (the design's bottom padding is 16px, so the value that covered the page's 24px still covers it). **No motion** is ported (SQ-6): no `.setup-sheet` rule is inside `@media (prefers-reduced-motion: no-preference)` or `@starting-style`, and none declares `transition` or `animation`. The contrast of the new bindings is pinned by «Borders, cues and focus rings have enough contrast» (the ring pairs and the primary pairs), not here.

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) the theme and language options' paint and the settings panel's (delivered by `update-settings-panel`, «The settings panel takes the design's size, place and paint»); (2) the design's mask shadow on «Закрити» and its `pointer-events: none` on the strip; (3) motion of any kind; (4) the design's 24px and 1rem margins of the level group (the 28px departure above); (5) a computed-paint comparison of the sheet's cards with the design build in a browser (the stylesheet scenarios and the per-shot gate cover the paint); (6) a pixel floor for any setup shot (they are expected to rise, see `design.md`); (7) the sheet in Safari and Firefox (NFR-7); (8) the `cursor` of the unavailable card (the design's `not-allowed`, the page's `default`); (9) between the sampled viewports the design's own sheet, and so the page's, cuts the idle line's text: at a window 700 px tall from 768 to 1440 px wide (the full cover ends inside the line) and in the 4×4 state at 1024 px tall from 672 to 752 px wide (the bottom sheet's top lies in the line), found by the sweep and left to a later design question (the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/sweep.txt`).

The mechanism is a stylesheet test and a browser test, both test first. `tests/play-page-setup-sheet-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-65`, `@trace FR-96`) reads the parsed `src/ui/style.css`. `e2e/nfr-14-setup-sheet.spec.ts` (`@trace NFR-14`, `@trace FR-96`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the open sheet's box and its first level description's left edge with the cases of the new key `setupSheet` of `quality/design-geometry.json`, frozen by `scripts/freeze-design-geometry.mjs` from the design build served from `design/v0/out` with the browser setup of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, light scheme). Each case records two boxes of the sheet: the design's own (`boxes`) and the expected product box (`expected`), which the script captures by loading the same design page a second time with one rule injected into the design page in the browser, `.setup .level-control { margin-bottom: 28px }` appended after the design's stylesheet (the one deviation, the 28px margin of A-60 and SQ-5); where the floor or the cap decides the sheet's height the two boxes are equal. The key records the deviation with the rule, the design's value (24px, and 1rem at 22.5rem and narrower), the product value (28px), the reason (A-60, SQ-5: the focus ring of the last option under the footer strip) and the cases whose height the content decides, as «The main column takes the design palette» records the A-57 deviations. The script guards the injection as `e2e/nfr-14-palette.spec.ts` guards its deviations: it reads the design's computed `margin-bottom` of the level group before injecting and fails unless it is 24px (16px at 22.5rem and narrower), so the override never hides a different design value. The description's left edge is not affected by it. The sampling dimensions are declared: the viewports 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900 and the states default (the design's 6×6 fixture, shot `<w>-light-setup`) and `four` (the 4×4 fixture, shot `<w>-light-setup-four`, which checks the board side B), 12 cases; coverage is `sampled`, never continuum. Geometry does not depend on the colour scheme, so the cases are light. The stricter instruments that run before a block-done claim are the per-shot gate `npm run check:visual` and the per-block pixel crop of `scripts/visual-block.mjs` over the 48 setup shots, and a fine-step sweep of the floor and the no-cut checks (the same spec with the environment variable `SETUP_SHEET_SWEEP=1`, off by default: widths 320 to 1440 in steps of 16 px at the heights 568, 650, 700, 768, 900 and 1024, both states); the sweep is a finer sample, not a continuum claim.

Traces: FR-96, FR-65, FR-99, NFR-14, NFR-12, A-60, A-57, A-61

#### Scenario: The phone regime

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the rule that is exactly `.setup-sheet` outside any at-rule
- **THEN** it declares `position: fixed`, `inset: auto 0 0 0`, `width: 100%`, `max-width: none`, `margin: 0`, `overflow-y: auto`, `border-radius: var(--radius-l) var(--radius-l) 0 0` and `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`
- **AND** it declares `max-height` exactly twice, `90vh` first and `88dvh` second, so the browser that does not know `dvh` keeps `90vh`
- **AND** the rule that is exactly `.setup-sheet` inside `@media (max-width: 22.5rem)` declares `max-height: calc(100dvh - 9rem)` and `padding-top: 1rem`, and the base rule's `padding-top` is `1.5rem` (through the `padding` shorthand)

#### Scenario: The small phone tightens the cards

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules `.level-control` and `.level-control button` inside `@media (max-width: 22.5rem)`
- **THEN** the first declares `gap: 0.375rem` and the second `padding: 0.375rem 0.625rem`, and the same rules outside any at-rule declare `gap: 0.5rem` and `padding: 0.5rem 0.75rem`
- **AND** no `min-height` of `.setup-start`, `.setup-close` or `.level-control button` is declared inside an at-rule

#### Scenario: From 48rem the sheet covers the page from 6rem

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule that is exactly `.setup-sheet` inside `@media (min-width: 48rem)` (there is exactly one)
- **THEN** it declares `inset: 0`, `width: calc(var(--column) + 1rem)`, `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `min-height: min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 8.5rem))`, `margin: 6rem auto auto`, `padding-bottom: 1rem`, `border-width: 1px` and `border-radius: var(--radius-l)`
- **AND** it declares no `box-shadow` other than `0 1rem 2.5rem var(--color-shadow-panel)`, no `border-color` other than `var(--color-overlay-border)` and no `background-color` other than `var(--color-surface-raised)` (the shell's bindings, which the rule keeps), each at most once

#### Scenario: On a tall window the sheet hangs under the summary button

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule that is exactly `.setup-sheet` inside `@media (min-width: 48rem) and (min-height: 44rem)` (there is exactly one)
- **THEN** it declares `inset: 0 0 auto 0`, `width: var(--column)`, `max-height: calc(100dvh - 10.75rem)`, `min-height: min(calc(100dvh - 10.75rem), calc(min(var(--board-width), var(--column)) + 4.75rem))` and `margin: 9.75rem auto 0`
- **AND** the block comes after the `@media (min-width: 48rem)` block that holds the `.setup-sheet` rule (the stylesheet has several 48rem blocks), so it wins by source order, and it declares no `box-shadow`, `border-color` or `background-color`

#### Scenario: The sheet reads the board side through the root

- **GIVEN** the parsed `src/ui/style.css` and its raw text
- **WHEN** the test reads the two `min-height` values above and counts `:has(`
- **THEN** each reads `var(--board-width)` and `var(--column)`, the raw text contains `:has(` exactly once (the idle-line rule), and no rule whose selector begins with `.board` declares `--board-width`
- **AND** no rule that is exactly `.setup-sheet` declares `display`, and no rule that is exactly `.setup-sheet` declares `line-height` (the placeholder `line-height: normal` is gone), at any width

#### Scenario: The description starts under the name

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule for `.level-text`, the ring rule `.level-control button .level-name::before` and the rule `.level-control .level-name`
- **THEN** the description declares `padding-left: calc(0.875rem + 0.5rem)`, the ring declares `width: 0.875rem` and `height: 0.875rem`, and the name declares `gap: 0.5rem`, so the indent equals the ring's width plus the gap

#### Scenario: The cards are painted as the design paints them

- **GIVEN** the parsed `src/ui/style.css` and the mounted page
- **WHEN** the test reads the rules `.level-control button`, `.level-control button[aria-checked='true']`, `.level-control button[aria-disabled='true']`, `.level-control button .level-name::before`, `.level-control button[aria-checked='true'] .level-name::before` and `.level-control button[aria-disabled='true'] .level-name::before`
- **THEN** the plain card declares `border-color: var(--color-option-border)`, `background-color: var(--color-control-bg)` and `color: var(--color-text)`, and a 2px solid border; the checked card `border-color: var(--color-primary)` and `background-color: var(--color-primary-soft)`; the unavailable card `border-style: dashed`, `border-color: var(--color-control-border)`, `background-color: var(--color-page)` and `color: var(--color-text-muted)`
- **AND** the plain ring declares `border-color: var(--color-control-border)` at 2px and `background-color: var(--color-control-bg)`; the checked ring declares `border-color: var(--color-primary)` and a `background-image` equal to `radial-gradient(circle, var(--color-primary) 0 40%, var(--color-control-bg) 45%)` (whitespace aside); the unavailable ring declares `border-style: dashed` and `background-color: transparent`
- **AND** none of the six rules declares `box-shadow`, so the unavailable card has no inset shadow (SQ-2) and the checked ring no inset dot (SQ-3 A), and the rule `.level-text` declares `color: var(--color-text-muted)` while the rule `.level-control button[aria-checked='true'] .level-text` declares `color: var(--color-text)`

#### Scenario: The reason line has its accent

- **GIVEN** the parsed `src/ui/style.css` and the mounted page (the rule that matches `[data-level-reason]` is found by matching the element against the selectors)
- **WHEN** the test reads its declarations
- **THEN** `border-left` is `3px solid var(--color-primary)`, `color` is `var(--color-text)`, `font-size` is `0.875rem` and `line-height` is `1.35`

#### Scenario: The size options in the sheet take the primary paint and the other two segmented controls agree

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads `.size-control button[aria-checked='true']`, `.theme-control button[aria-checked='true']` and `.language-control button[aria-checked='true']`
- **THEN** the first declares `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)` and `font-weight: 700`, and the rule `.size-control button` declares `color: var(--color-text-muted)`, `background-color: var(--color-control-bg)` and `font-weight: 500`
- **AND** the three checked rules agree: the rules for the theme and language options declare the same `border-color`, `background-color`, `color` and `font-weight` as the size option's (A-61, the settings-panel block)

#### Scenario: «Почати» is filled and «Закрити» has a border

- **GIVEN** the parsed `src/ui/style.css` and the mounted page
- **WHEN** the test reads the rule that matches `[data-action="setup-start"]` and not `[data-action="setup-close"]`, and the rules `.setup-close`
- **THEN** «Почати» declares `background-color: var(--color-primary)`, `border-color: var(--color-primary)`, `color: var(--color-primary-text)`, `padding: 0 0.75rem` and `font-weight: 700`
- **AND** «Закрити» declares `border-color: var(--color-control-border)`, a 2px border width and `padding: 0 0.5rem`, and its `background-color` is still `var(--color-surface-raised)`

#### Scenario: The level margin and the scroll padding keep the focus ring clear

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads `.setup-sheet > [data-control='level']` and `.setup-sheet:popover-open`
- **THEN** the first declares `margin-bottom: 28px` outside any at-rule (no media rule changes it), and the second declares a `scroll-padding-bottom` of at least `calc(2.75rem + 48px)`
- **AND** the e2e walk of «Cells and buttons show a visible, unobscured focus indicator» (320×700, 1366×650, 320×568, 375×600) stays green, and the walk asserts its premise (the sheet scrolls with «Поле 4×4» marked) at each of the four viewports (the 375-wide case moved from 375×667, where the sheet now fits and does not scroll; the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/green-run.txt`, open finding 2)

#### Scenario: The sheet has no motion and no new colour literal

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test collects the rules whose selector begins with `.setup-sheet` or `.level-control`, and applies the colour scan of «Borders, cues and focus rings have enough contrast» to them
- **THEN** none is inside `@media (prefers-reduced-motion: no-preference)` or an `@starting-style` rule, none declares `transition` or `animation`, and the scan finds no colour literal, no named colour and no `color-mix(`
- **AND** the gradient of the checked ring has its colours as `var(--color-...)` tokens

#### Scenario: The sheet matches the design's box in a real browser

- **GIVEN** the built page in Chromium with the browser setup of `playwright.config.ts`, the design's capture board of the case (FR-119: the 6×6 fixture, or the 4×4 fixture for the `four` states), and the 12 cases of the key `setupSheet` of `quality/design-geometry.json` (320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900, each in the default and the `four` state; e2e, sampled)
- **WHEN** the test opens the sheet with the summary button, asserts that it is `:popover-open`, and reads `getBoundingClientRect()` of `[data-section="setup"]` and of the description of the first level button (`[data-section="setup"] [data-control="level"] button:first-of-type .level-text`, found by this selector on both sides)
- **THEN** each of the four edges of the sheet's box is within 0.5 px of the case's `expected` box, and the left edge of the description is within 0.5 px of the case's `boxes` value (the design's own)
- **AND** a miss is reported with the case, the element, the page's box, the `expected` box and the design's own `boxes` beside them, and the test asserts that the key records the 28px deviation with its reason (A-60, SQ-5), so the departure is visible in the fixture and cannot widen silently
- **AND** the computed `line-height` of the sheet equals the computed `line-height` of `body`, and a mismatch is reported with the case and both computed line heights, never as a pass
- **AND** the computed `margin-bottom` of `[data-control="level"]` is `28px` at every one of the six viewports (the departure is real in the page, not only recorded)

#### Scenario: The sheet ends below the button row and cuts no line of text

- **GIVEN** the same six viewports and the two states, the sheet open
- **WHEN** the test reads the sheet's box S, the bottom of the action button row R (the bottom of `[data-action="hint"]`), the window height H and the ink band I of the idle line `[data-message="idle"]` (visible in these states): from the ink top of its first line to the ink bottom of its last line, measured in the browser from the line boxes of its text (`Range.getClientRects()`) and the font's metrics of the idle text (`CanvasRenderingContext2D.measureText` with the computed font: ink top = first line's top + `fontBoundingBoxAscent` − `actualBoundingBoxAscent`; ink bottom = last line's top + `fontBoundingBoxAscent` + `actualBoundingBoxDescent`)
- **THEN** at 768×1024, 1024×768, 1366×650 and 1440×900, S.bottom is at least `min(R + 8, H - 16)` less 0.5 px (the sheet ends at least 0.5rem below the button row, or at the window's limit when that is higher)
- **AND** at all six viewports neither S.top nor S.bottom lies strictly inside I (more than 0.5 px from I.top and from I.bottom), so no edge of the sheet cuts the idle line's text, which is wholly covered or wholly clear (an edge that lies at the window's limit, within 0.5 px of 0 or of H, is the window's edge, not a cut by the sheet, and is not counted; the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/sweep.txt`); the edge may lie in the line's box above or below the ink (the design's own sheet ends 0.8 px inside the idle line's box at 1024×768, and the page, with the 28px departure, 4.8 px; the user's decision of 2026-10-11 to check the ink, not the box, `docs/qa/update-setup-sheet/green-run.txt`, open finding 1); a viewport that fails is a finding, not a licence to loosen the check
- **AND** at 1366×650 the idle line is wholly covered or wholly clear in both states (the case of `docs/qa/update-page-layout-geometry/stills/1366-dark-setup.png`, the cut line under the sheet)

#### Scenario: The fixture adds one key and changes nothing else

- **GIVEN** `quality/design-geometry.json` after the refreeze
- **WHEN** the test reads its keys
- **THEN** `cases` still holds exactly the 32 shots that `e2e/nfr-14-layout-geometry.spec.ts` pins, `selectors` and `tolerancePx` are unchanged, the top-level `provenance` has the same `designCommit` and `designCssSha1` as before (its `designBuildSha1` and `browser` are the recorded ones, kept by the script), the key `rulesPanel` (frozen by `update-rules-panel`, which merged first) is unchanged, and the new key `setupSheet` holds `selectors` (`[data-section="setup"]` and the first description), `coverage: "sampled"`, `setupSheet.provenance` recording the `designCommit`, `designCssSha1`, `designBuildSha1` and `browser` of the run that froze it, the recorded deviation (rule, design value, product value, reason, and the cases whose `decidedBy` is `content`) and exactly the 12 cases, each with its `boxes` (the design's), its `expected` boxes (the design with the 28px margin) and its `layout`: the design sheet's `scrollHeight`, `clientHeight`, resolved `min-height` and `max-height` in px and `decidedBy`, which is `min-height`, `max-height` or `content` according to which of the three equals the box's height, and `expectedDecidedBy`, the same for the `expected` box (the margin's growth stops at the cap), so the report says which bound each case checks
- **AND** the spec names the viewports and the states as its sampling dimensions, declares `coverage` `sampled`, names `npm run check:visual`, `scripts/visual-block.mjs` and the sweep as the stricter instruments, and claims neither all widths nor a pixel floor

## ADDED Requirements

### Requirement: The settings panel takes the design's size, place and paint

The settings panel `[data-section="settings"]` (class `settings`) SHALL take the size, the place and the paint of the design's settings panel (`.settings`, `design/v0/app/binarka.css` lines 377-433, 537-563, 809-829, 931-937 and 1080-1117; reference `design/v0-screenshots/review-set-14/*settings*.png`), from the page's tokens (FR-68, FR-65, FR-117, NFR-14, A-61, A-57; G2 settings-panel block, `update-settings-panel`). It runs after `update-panel-shell`, whose fill, border colour and shadow of the panel it keeps (see «The panels take the shared surface paint»), and after `update-setup-sheet`, whose size options it takes as the model for the theme and language options. It adds no colour token and no contrast pair: every colour below is an existing token and every text and frame pair it uses is already in the pair list of «Borders, cues and focus rings have enough contrast». Where the design has a transparent option over the card's `--surface`, the page states the card's fill `--color-control-bg`, because «The theme options set their own colours» asks each option rule for a `var(--color-...)` fill.

**Size and place.** The panel is a popover in the top layer. Its rules are these (every length is the design's; the rule that is exactly `.settings` is the one whose selector list is `.settings` alone):

| Regime | Where | Declarations of the rule that is exactly `.settings` |
|---|---|---|
| Phone | the one top-level rule outside any at-rule | `max-height` declared twice, in this order, `60vh` and then `55dvh` (the fallback first), `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`; the rest of the rule (`position: fixed`, `inset: auto 0 0 0`, `width: 100%`, `max-width: none`, `margin: 0`, `box-sizing: border-box`, `overflow-y: auto`, the shell's fill, border colour and shadow) is as it is today |
| Small phone | `@media (max-width: 22.5rem)` | `padding-top: 1rem` (the design's `.settings { padding-top: var(--space-4) }` at 22.5rem and narrower) |
| From 48rem | `@media (min-width: 48rem)`, the one rule that is exactly `.settings` | not edited: the dropdown the page already has, `inset: 0`, `width: min(22rem, var(--column))`, `max-width: calc(100% - 2rem)` (the page's cap, not in the design text; no shot reaches it), `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `margin: 6rem 0 auto calc(50% + var(--column) / 2 - min(22rem, var(--column)))`, `padding: 16px` (the design's `1rem`), `border-width: 1px`, `border-radius: 16px` and the panel shadow |

So on a phone the panel is a bottom sheet up to 55% of the window height. Before this change it was 4px taller than the design's, through «Закрити» (48px, not 44px), and 12px taller at 22.5rem and narrower, through the missing 1rem top padding as well (8px); below 48rem the panel grows upward from the window's bottom, so those pixels move every line of it. From 48rem it hangs under the header at the right, as wide as `min(22rem, column)`, its right edge on the column's right edge and its top 0.5rem below the header; a taller or shorter «Закрити» moves nothing above it there. No rule that is exactly `.settings` declares `display`, so the closed panel stays hidden by the user agent. The label rule `.settings-label` and the two control cards `.theme-control` and `.language-control` (3px padding and gap, 1px `--color-control-border`, 10px radius, `--color-control-bg` fill, `margin: 0 0 16px`) already are the design's and are not edited.

**The options** (rules `.theme-control button`, `.language-control button` and their `[aria-checked='true']` rules; the page keeps one rule per control and does not copy the design's shared selector list, so the tests of `.size-control` stay as they are). Each plain option rule declares, in the same literal forms as `.size-control button`: `min-width: 0`, `min-height: 2.75rem`, `padding: 0 0.5rem`, `border-width: 2px`, `border-style: solid`, `border-color: transparent`, `border-radius: calc(var(--radius-m) - 0.1875rem)`, `background-color: var(--color-control-bg)`, `color: var(--color-text-muted)`, `font-size: 0.9375rem`, `font-weight: 500`, `line-height: 1.2` and `white-space: nowrap`. Each checked rule declares `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)` and `font-weight: 700`, and no `box-shadow` (the inner 1px ring of the page's earlier paint goes). The theme options declare `flex: 1 1 auto`, so «Як у системі» never truncates (the design's exception); the language options declare `flex: 1 1 0`, two equal halves, as the size options. The ratios of the paint are the pairs already listed: `--color-text-muted` on `--color-control-bg` 7.17 light and 7.54 dark, `--color-text` on `--color-primary-soft` 12.96 and 11.50, the frame `--color-primary` on `--color-primary-soft` 4.41 and 6.13 and on `--color-control-bg` 5.40 and 7.39. The chosen option differs from an unchosen one by its weight (700 against 500) and by its frame (a transparent 2px border becomes `--color-primary`), the design's cues (A-61; the signed default of OQ-2 of the amendment draft). The keyboard ring of a chosen option (size, theme or language, `outline-offset: -1px`) over its `--color-primary` frame is an accepted adjacency recorded in «Cells and buttons show a visible, unobscured focus indicator».

**«Закрити»** (`.settings-close`, the design's shared `.setup-close, .settings-close` rule). The one top-level rule that is exactly `.settings-close` declares `position: sticky`, `bottom: 0`, the mask `box-shadow: 0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)` (the two spread shadows of the page's `.rules-close`), `width: 100%`, `min-height: 2.75rem`, `margin-top: 0.5rem`, `padding: 0 0.5rem` (the page's `.setup-close` form), `border-width: 2px`, `border-style: solid`, `border-color: var(--color-control-border)`, `border-radius: var(--radius-m)`, `background-color: var(--color-surface-raised)` (the shell's fill) and `font-weight: 600`, so the button is 44px tall. The rule `.settings:popover-open` declares `scroll-padding-bottom` of at least `calc(2.75rem + 2rem + 2px + env(safe-area-inset-bottom))` (the stuck button sits on the panel's 1rem bottom padding: the padding, the button and its 1rem mask, plus the 2px the focus ring reaches below an option), so the browser's own focus scrolling keeps a focused option clear of the button on a short window (FR-65 "unobscured", WCAG 2.4.11); the panel scrolls only when the window is short (the sheet under about 505px tall, the dropdown under about 383px), and no shot of the gate scrolls it. The setup sheet's «Закрити» stays unmasked (its footer strip masks, A-60).

**Not ported:** hover and press feedback on the options and «Закрити» and the panel's slide; no rule of the panel (`.settings*`, `.theme-control*`, `.language-control*`) declares `transition` or `animation`, is inside `@starting-style`, or has a `:hover` or `:active` selector.

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) hover, press and the slide of the panel; (2) the design's `pointer-events: none` on the mask; (3) the panel in Safari and Firefox (NFR-7); (4) a pixel floor of 0.98 promised for any settings shot (the 10 phone shots are expected to rise, see `design.md`); (5) between the sampled viewports and short windows the panel's fit is not proven (the sampled windows below are samples, never continuum); (6) the confirmation dialog, which has its own block (`update-confirm-dialog`); (7) the sentence of «The panels take the shared surface paint» that says «Закрити» of the settings panel is not sticky is a historical sentence about what the shell change did, not a statement about this panel now.

The mechanism is a stylesheet test, a browser test against the design build and the per-shot gate, all test first. `tests/play-page-settings-panel-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-68`, `@trace FR-65`, `@trace FR-117`) reads the parsed `src/ui/style.css`. `e2e/nfr-14-settings-panel.spec.ts` (`@trace NFR-14`, `@trace FR-68`, `@trace FR-65`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the open panel with the cases of the new key `settingsPanel` of `quality/design-geometry.json`, frozen by `scripts/freeze-design-geometry.mjs` from the design build served from `design/v0/out` with the browser setup of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, light scheme). The sampling dimensions are declared: the viewports 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900, light, the design's route `/settings/` (shot `<w>-light-settings`, «Як у системі» chosen), and one case `375-light-settings-dark`, the route `/settings-dark/` at 375×812, in which «Темна» is chosen, so a chosen option other than the first is measured: 7 cases; coverage is `sampled`, never continuum. The stricter instruments that run before a block-done claim are the per-block pixel crop `scripts/visual-block.mjs --block settings` over the 26 settings shots and the per-shot gate `npm run check:visual`; the short-window focus walk is sampled at three windows and its escalation is the same walk at more heights.

Traces: FR-68, FR-65, FR-117, NFR-14, NFR-12, NFR-13, A-61, A-57

#### Scenario: The phone regime and the small-phone padding

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the rule that is exactly `.settings` outside any at-rule (there is exactly one)
- **THEN** it declares `max-height` exactly twice, `60vh` first and `55dvh` second, so the browser that does not know `dvh` keeps `60vh`, and `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`, which gives a `padding-top` of `1.5rem`
- **AND** the rule that is exactly `.settings` inside `@media (max-width: 22.5rem)` declares `padding-top: 1rem`, and that block comes after the top-level rule in the file, so it wins by source order
- **AND** no rule that is exactly `.settings` declares `display`, and the shell's three declarations (`background-color`, `border-color`, `box-shadow`) are each written once in the top-level rule

#### Scenario: From 48rem the dropdown keeps its place

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule that is exactly `.settings` inside `@media (min-width: 48rem)` (there is exactly one)
- **THEN** it declares `width: min(22rem, var(--column))`, `max-width: calc(100% - 2rem)`, `max-height: calc(100dvh - 7rem)`, `margin: 6rem 0 auto calc(50% + var(--column) / 2 - min(22rem, var(--column)))` and `padding: 16px`, as before this change
- **AND** the scenario «The settings panel follows the column from 48rem» of «Main column layout geometry follows the design reference» stays green: the panel's right edge is within 0.5 px of the header's right edge and its top 0.5rem below the header's bottom

#### Scenario: The theme and language options take the segmented paint

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads `.theme-control button`, `.theme-control button[aria-checked='true']`, `.language-control button` and `.language-control button[aria-checked='true']`
- **THEN** each plain rule declares `min-width: 0`, `min-height: 2.75rem`, `padding: 0 0.5rem`, `border-width: 2px`, `border-style: solid`, `border-color: transparent`, `border-radius: calc(var(--radius-m) - 0.1875rem)`, `background-color: var(--color-control-bg)`, `color: var(--color-text-muted)`, `font-size: 0.9375rem`, `font-weight: 500`, `line-height: 1.2` and `white-space: nowrap`
- **AND** each checked rule declares `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)` and `font-weight: 700`
- **AND** neither checked rule declares `box-shadow`, and no rule of the two controls declares `--color-focus` or `--color-given-bg` as a fill or a border colour

#### Scenario: The three segmented option rules agree

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads `.size-control button`, `.theme-control button` and `.language-control button`, and their three `[aria-checked='true']` rules
- **THEN** the three plain rules declare the same value, written the same way, for `min-height`, `padding`, `border-width`, `border-radius`, `font-size`, `font-weight`, `line-height`, `color` and `background-color`
- **AND** the three checked rules declare the same value for `border-color`, `background-color`, `color` and `font-weight`, so a change in one of the three rules that the other two do not follow fails this test

#### Scenario: The theme options grow by content and the language options are equal halves

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads `.theme-control button` and `.language-control button`
- **THEN** the first declares `flex: 1 1 auto` and the second `flex: 1 1 0`
- **AND** in a real browser (the stylesheet cannot see it) the two language options of the open panel have widths equal within 0.5 px at every sampled viewport of the key `settingsPanel`

#### Scenario: «Закрити» is sticky with the mask

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules that are exactly `.settings-close` (there is exactly one, outside any at-rule)
- **THEN** it declares `position: sticky`, `bottom: 0`, `box-shadow: 0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)` (whitespace aside), `width: 100%`, `min-height: 2.75rem`, `margin-top: 0.5rem`, `padding: 0 0.5rem`, `border-width: 2px`, `border-style: solid`, `border-color: var(--color-control-border)`, `border-radius: var(--radius-m)`, `background-color: var(--color-surface-raised)` and `font-weight: 600`
- **AND** the rule that is exactly `.setup-close` still declares no `box-shadow` (the sheet's «Закрити» stays unmasked)

#### Scenario: The open panel reserves «Закрити» in its scroll padding

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule that is exactly `.settings:popover-open`
- **THEN** it declares `scroll-padding-bottom` with a length of at least `calc(2.75rem + 2rem + 2px + env(safe-area-inset-bottom))`, and declares no `display`

#### Scenario: The settings paint adds no colour literal, token or pair

- **GIVEN** the parsed `src/ui/style.css` and the lists `TOKEN_NAMES` and `CONTRAST_PAIRS` of `tests/helpers/css.ts`
- **WHEN** the test scans the rules `.settings`, `.settings:popover-open`, `.settings-label`, `.settings-close`, `.theme-control*` and `.language-control*` (each with its state and pseudo rules), and compares the lists with the baseline copies kept in the test (refreshed at the rebase onto `main` from `main`'s `tests/helpers/css.ts`, never from the change's own branch)
- **THEN** it finds no colour literal, no named colour other than `transparent`, no `color-mix(` and no `!important`, and every `box-shadow` colour is a `var(--color-...)` token
- **AND** `TOKEN_NAMES` and `CONTRAST_PAIRS` equal the baseline copies as lists, not as counts (the confirmation dialog's block moves the counts and merges first; the copies are taken after it), so this block adds no token and no pair, and every `var(--color-...)` the scanned rules use names a token declared in `:root`

#### Scenario: Hover, press and motion are not ported

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test collects the rules whose selector is `.settings`, `.settings:popover-open` or `.settings-close`, or contains `.theme-control` or `.language-control`
- **THEN** none declares `transition` or `animation`, none has a selector containing `:hover` or `:active`, and none is inside `@starting-style` or `@media (prefers-reduced-motion: no-preference)`

#### Scenario: The panel, the controls and «Закрити» match the design build's boxes

- **GIVEN** the built page open in Chromium, the key `settingsPanel` of `quality/design-geometry.json` (7 cases, the six viewports 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900 on `/settings/`, and `/settings-dark/` at 375×812), and the panel opened with the settings button; for `375-light-settings-dark` the page's stored theme is set to dark before the load, as the capture adapter does (`localStorage['binarka.theme']`)
- **WHEN** the test reads the boxes of `[data-section="settings"]`, `[data-control="theme"]`, `[data-control="language"]`, the chosen option of each control and `[data-action="settings-close"]`, after the panel is `:popover-open`
- **THEN** every box is within 0.5 px of the case's recorded design box, in x, y, width and height, and a miss prints the case, the element and both boxes
- **AND** the test fails, never skips, with the freeze instruction if the key is absent, and the key records `coverage: "sampled"`, its own provenance and the seven cases, and no existing case, selector or provenance field of the file is changed by adding it

#### Scenario: An unchosen and a chosen option have the design's computed paint

- **GIVEN** the cases `375-light-settings` (light) and `375-light-settings-dark` (dark) of the key `settingsPanel`, each recording the design's computed `color`, `background-color`, `border-top-color`, `border-top-width`, `font-weight` and `font-size` of one unchosen and one chosen theme option and one unchosen and one chosen language option
- **WHEN** the test reads the same values from the page with the same theme
- **THEN** `color`, `border-top-color`, `border-top-width`, `font-weight` and `font-size` equal the recorded values, for the chosen and the unchosen option in light and in dark
- **AND** the page's `background-color` of an unchosen option equals the design card's `background-color` (the design's option is transparent over its card), and of a chosen option equals the recorded value

#### Scenario: On a short window a focused option stays clear of «Закрити»

- **GIVEN** a real browser at 667×375 and 568×320 (the bottom sheet) and 1024×360 (the dropdown), the settings panel open (e2e; sampled; the walk asserts at each window the premise that the panel scrolls, its `scrollHeight` greater than its `clientHeight`)
- **WHEN** the keyboard moves the focus with Tab through the panel's focusable controls in order (the three theme options, the two language options, «Закрити»), with no scrolling by script
- **THEN** for each focused option the bottom of its focus ring (its rect bottom plus 2px, the ring of `outline-offset: -1px` and `outline-width: 3px`) is at or above the top of «Закрити»'s mask (the button's top less 1rem)
- **AND** at every step «Закрити»'s box lies inside the panel's box and its bottom edge is at most 17.5px (the panel's 1rem bottom padding and its 1px border, plus half a pixel for subpixel layout) above the panel's bottom edge, so the button is stuck at the bottom and not scrolled away, and the check above cannot pass because the button left the view
- **AND** the walk fails on a premise that does not hold at a window, and a failure is a finding for the user, not a licence to loosen the check

#### Scenario: The settings shots of the gate rise

- **GIVEN** run 12 of the per-shot gate (`docs/qa/g2/check-visual-run-12.txt`: the 10 phone settings shots `320-*` and `375-*` score 0.9077 to 0.9626, the 16 from 768 score 0.9802 to 0.9950) and a fresh run of `npm run check:visual` after the port
- **WHEN** the scores of the 26 settings shots (the 26 settings shots of `review-set-14`: the states settings, settings-light, settings-dark and settings-focus) are compared shot by shot
- **THEN** each of the 10 phone shots scores higher than in run 12 and no other shot of the gate scores lower than in its latest run on `main`
- **AND** if a settings shot does not rise, the block stops and explains it before the review gate, and no 0.98 score is claimed for a shot that the run does not show
