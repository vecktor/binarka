## MODIFIED Requirements

### Requirement: Rules panel

The page header SHALL hold a button `[data-action="rules"]` labelled «Правила» whose `popovertarget` attribute names the `id` of the rules panel. The rules panel `[data-section="rules"]` SHALL be an element with the `popover` attribute, opened by that button with no script, and SHALL contain, in this order: the heading «Правила»; the rules list, a `ul` that is a direct child of the panel, with exactly three `li` items in this order: «Не більше двох однакових цифр поспіль у рядку чи стовпці.», «У кожному рядку та стовпці порівну нулів і одиниць.», «Усі рядки різні, і всі стовпці різні.»; the techniques section `[data-section="techniques"]` (FR-93); and one close button «Зрозуміло» with `popovertarget` naming the same `id` and `popovertargetaction="hide"` (FR-57). The techniques section SHALL hold a heading `h3` with the text «Складніші прийоми» and its own `ul` with exactly three `li` items, one sentence each, one for each of the techniques 2, 3 and 4 (FR-74 to FR-76), in this order (wording provisional until the user confirms it in chat during the slice, Q6; a confirmed change edits this table, `src/ui/strings.ts` and the tests together): the table below. The clause «exactly three list items» of FR-57 means the three items of the rules list; the techniques list is a separate list. The techniques items carry no decorative example and no `aria-hidden` descendant, and the techniques section has no `id`. A list item of the rules list MAY carry a decorative example drawn from digits and symbols inside an element with `aria-hidden="true"` (A-26, not pinned); the text of an item is its text content without the descendants that have `aria-hidden="true"`. The panel SHALL be created once at mount, sit inside the page root and outside the element that holds the board, need no new dependency, and stay the same element with the same texts after a new puzzle, a size change, a level change and a win. There SHALL be no rules block below the board and no `<details>` element anywhere on the page. Each mount SHALL give its panel an `id` that is unique in the document, so two mounts on two roots stay independent. The panel SHALL have `role="dialog"` and `aria-labelledby` naming the `id` of its heading «Правила» (also unique per mount), so assistive technology announces it as a named dialog, and the close button «Зрозуміло» SHALL carry the `autofocus` attribute, so that opening the popover moves focus into the panel (A-20); the attribute stays (RQ-1 A), and the sticky button of «The rules panel takes the design's size, place and paint» keeps the browser's focusing from scrolling the panel to it. The texts of the panel follow the page language: the Ukrainian texts of the tables below are those of Ukrainian mode, the English texts are in «English page text» (FR-57, FR-93, FR-111); the structure and the counts are the same in both modes. **Placement (FR-57, A-59):** below 48rem, a bottom sheet up to 55% of the window height; from 48rem to 64rem, a panel the page column's width plus 1rem, 6rem from the top of the window, at most the window height less 7rem, and at least tall enough to cover the page down through the message area (or the window less 7rem, if that is less), with «Зрозуміло» at its bottom; from 64rem, one column 40rem wide (never wider than the window less 2rem), 6rem from the top, as tall as its contents up to the window less 7rem. At every width «Зрозуміло» stays in view at the panel's bottom while the panel scrolls. The values, the paint and the tests of the placement are in «The rules panel takes the design's size, place and paint». **Every time the panel opens, it opens at its top** (its scroll position is 0), with focus on «Зрозуміло» (A-20). Opening and closing stay native (the `popovertarget` buttons) and call no popover method; the page sets the panel's `scrollTop` to 0 when the panel closes (a `beforetoggle` event whose `newState` is `closed`, dispatched while the panel is still shown) and again when it opens (a `toggle` event whose `newState` is `open`), and does nothing else in those two handlers (RQ-1 A, A-59). The look matches NFR-14.

Traces: FR-57, FR-93, NFR-5, FR-111, NFR-14, A-59, A-20

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
- **AND** when the test then dispatches a `beforetoggle` event (`newState` `closed`) and a `toggle` event (`newState` `open`) on the panel, still no spy was called and the panel's attributes and texts are as before: the scroll reset sets `scrollTop` only and is not an opening or a closing

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

#### Scenario: The scroll position is reset when the panel closes and when it opens

- **GIVEN** the page has just been mounted, the popover stubs of A-44 and the spies of the previous scenario are installed, and the test has set the panel's `scrollTop` to 120 and read it back as 120 (the premise: jsdom keeps an assigned `scrollTop`; if a jsdom version does not, the test defines an own `scrollTop` accessor on the panel that records the writes)
- **WHEN** the test dispatches on the panel a plain `Event` named `beforetoggle` with `newState` `closed` and `oldState` `open` (the helper added to `tests/helpers/play-page.ts` next to `dispatchToggle`; it does not change the stub's open state)
- **THEN** the panel's `scrollTop` is 0 and no spy was called
- **AND** when the test sets `scrollTop` to 80 and dispatches `toggle` with `newState` `open` and `oldState` `closed` (the existing `dispatchToggle`), it is 0 again
- **AND** with two pages mounted on two roots, both panels at `scrollTop` 50, an event on the first panel leaves the second at 50, so the handlers are per panel
- **AND** the panel's attributes, its texts, its `autofocus` button and the board are unchanged after the events

#### Scenario: The panel opens at its top

- **GIVEN** the built page in Chromium with the browser setup of `playwright.config.ts`, with the design's fixture board (FR-119), at 320×700, 375×812, 768×1024 and 1366×650 (e2e, sampled: 4 viewports; a first opening by the mouse and by the keyboard, and a second opening after closing by «Зрозуміло» and by Escape)
- **WHEN** the player presses «Правила» with a mouse click, and in another run focuses it and presses Enter
- **THEN** the panel is open (`:popover-open`), its `scrollTop` is 0 and the active element is the close button «Зрозуміло» (`.rules-close`)
- **AND** where the panel scrolls (`scrollHeight` greater than `clientHeight`, which the test asserts at 320×700 and 375×812 and asserts is not so at 768×1024 and 1366×650, where the panel fits), the test scrolls it to its end (it sets `scrollTop` to `scrollHeight`, which the browser clamps, and reads back `scrollHeight - clientHeight`, which is greater than 0), closes it by a click on «Зрозуміло» (one run) or by Escape (another run), and presses «Правила» again: the panel is open, its `scrollTop` is 0 (read after the open assertion and one animation frame) and the active element is «Зрозуміло» again
- **AND** the reset is not undone by the open handler: at 320×700 and 375×812 the test opens the panel, waits one animation frame, sets `scrollTop` to `scrollHeight`, waits one more frame and asserts that `scrollTop` is still `scrollHeight - clientHeight` and greater than 0 (the locked `rules-techniques` capture driver scrolls to the end right after `:popover-open`, and a late `toggle` reset must not undo it)
- **AND** at 320×700 and 375×812, while the button is stuck (after the first opening and after scrolling to the end), the focus ring of 3px at a 2px offset (5px in all) lies inside the panel: with `closeRect` and `panelRect` from `getBoundingClientRect()` and the panel's border widths from its computed style, `closeRect.bottom + 5 <= panelRect.bottom - borderBottomWidth`, `closeRect.left - 5 >= panelRect.left + borderLeftWidth` and `closeRect.right + 5 <= panelRect.right - borderRightWidth`; if the bottom check fails, the design's geometry clips the ring, the block stops and reports it, and a fix departs from the design and needs the user
- **AND** at the viewports where the panel does not scroll, the second opening is still made and asserts the same two values, so a layout that makes the panel overflow at 768×1024 or 1366×650 fails the premise instead of passing vacuously
- **AND** before the port this scenario fails at all four viewports on the first opening (`scrollTop` at its end: 399, 292, 144 and 349 px, `docs/qa/prep-g2/rules-open-probe.txt`), and a page with only the sticky button still fails on the second opening where the panel scrolls (`docs/qa/prep-g2/rules-reopen-probe.txt`)


## ADDED Requirements

### Requirement: The rules panel takes the design's size, place and paint

The rules panel `[data-section="rules"]` SHALL take the design's size, place and paint (NFR-14, FR-57, FR-65, A-59; G2 rules-panel block `update-rules-panel`; `design/v0/app/binarka.css` lines 805-962, 1018-1047 and 1122-1152, shown by `design/v0-screenshots/review-set-14/`). The panel's fill, border colour and drop shadow are those of «The panels take the shared surface paint» and are not restated here; the root's `data-size` is that of «The page root carries the board size». This requirement declares no colour token and adds no contrast pair. "The panel's rules" in this requirement means the rules whose selector is `.rules`, starts with `.rules `, `.rules:`, `.rules>`, `.rules >` or `.rules[`, or is `.rules-close`, `.rule-example`, `.mini`, `.mini-answer` or `.mini-sep`; it never means `.rules-button`, the header's «Правила» button, which is outside this block. The shell's bindings of the rules panel (`background-color`, `border-color` and `box-shadow`, each once in its rule) stay exactly as «The panels take the shared surface paint» lists them.

The panel has three regimes. The stylesheet SHALL declare them as follows (a value is the design's; "the page keeps" names what the page already declares and this change does not touch):

| Regime | Rule (selector) and place | Declarations |
|---|---|---|
| Below 48rem: a bottom sheet | `.rules`, the top-level rule | `position: fixed`; `inset: auto 0 0 0`; `width: 100%`; `max-width: none`; `max-height` declared twice, `60vh` first and `55dvh` after it (the fallback); `margin: 0`; `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`; `overflow-y: auto`; `border-radius: 1rem 1rem 0 0`; the page keeps `box-sizing: border-box` and its border widths (1px, none at the bottom) |
| the same, at 22.5rem and below | `.rules` and `.mini` inside `@media (max-width: 22.5rem)`, in a block later in the file than the top-level `.rules` and `.mini` rules (an earlier block would lose to their `padding` and `width` at the same specificity) | `.rules`: `padding-top: 1rem`; `.mini`: `width: 1.5rem`, `height: 1.5rem`, `font-size: 0.875rem` |
| From 48rem to 64rem: a panel the column's width plus 1rem | `.rules` inside `@media (min-width: 48rem)` | `inset: 0`; `width: calc(var(--column) + 1rem)`; `max-width: calc(100% - 2rem)` (today's cap, kept, RQ-2); `height: fit-content`; `max-height: calc(100dvh - 7rem)`; `margin: 6rem auto auto`; `padding-bottom: 1rem`, so the padding is 1.5rem 1rem 1rem and the old `padding: 24px` is gone; 1px border on all four sides; `border-radius: 1rem`; `min-height: min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))` |
| the same | `.rules:popover-open` inside `@media (min-width: 48rem)` | `display: flex`; `flex-direction: column` |
| the same | `.rules > *` and `.rules-close` and the techniques section, inside `@media (min-width: 48rem)`, in a block later in the file than the top-level `.rules-close` and `.rules [data-section='techniques']` rules (an earlier block would lose to the top-level `margin` at the same specificity); `.rules:popover-open` may sit in the same later block | `.rules > *`: `flex-shrink: 0`; `.rules [data-section='techniques']`: `margin-top: 0`; `.rules-close`: `margin-top: auto` (spare height sits above «Зрозуміло», never below it) |
| From 64rem: one column 40rem wide | `.rules` inside `@media (min-width: 64rem)`, after the 48rem block in the file | `width: 40rem`; `height: fit-content`; `min-height: 0`; `padding-top: 1rem`; the cap `max-width: calc(100% - 2rem)` still applies |
| the same | `.rules h2`, `.rules ul`, `.rules li` inside `@media (min-width: 64rem)` | `h2`: `margin-bottom: 0.25rem`; `ul`: `margin-bottom: 0.5rem`; `li`: `padding: 0.3125rem 0` |

Five points of the table are part of the requirement. (1) **The flex column is `.rules:popover-open`, never the bare `.rules`**: a `display` on the bare rule would override the user agent's `display: none` of a closed popover and show the panel at load. No rule whose selector is exactly `.rules` declares `display`. (2) **The `min-height` reads the board side through the root.** B = min(`--board-width`, `--column`): `--board-width` is declared on `#app` by the shell (the root's `data-size`) and `--column` on `#app` from 48rem, and the panel is inside `#app`, so a 4×4 board gives a shorter panel than a 6×6 one and a short window caps it at the window less 7rem. The constant 13.875rem is the design's (the 1rem gap, the board, the 1rem gap, the 2.75rem button row, the 0.5rem gap and the three reserved message lines, down from the summary button's bottom at 9.25rem). It is a floor for the panel's height, not a guarantee: taller contents grow the panel up to its `max-height`, and the panel is not claimed to end in empty page space for every content. (3) **From 64rem the `min-height: 0` wins by source order**: the 64rem block comes after the 48rem block's `.rules` rule, and both selectors are `.rules`. (4) **The 2rem cap is today's rule, not the design's** (the design has no cap): at every width from 48rem the cap is above the column plus 1rem and above 40rem (the window is at least 48rem), so it changes no box; it is kept because the signed FR-57 says "never wider than the window less 2rem" (RQ-2). (5) **The backdrop is not restated**: the `.rules::backdrop` and `.rules:popover-open::backdrop` rules of «The backdrops take the design's translucent tokens» stay as they are.

**«Зрозуміло» is sticky at the panel's bottom and filled with the primary colour, at every width.** The rule `.rules-close` SHALL declare `position: sticky`; `bottom: 0`; `box-shadow: 0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)` (the design's mask: text scrolling under the button is hidden, and the second shadow also covers the panel's bottom padding); `width: 100%`; `min-height: 2.75rem`; `padding: 1px 6px`; `border-width: 2px`, `border-style: solid` and `border-color: var(--color-primary)`; `border-radius: 0.625rem`; `background-color: var(--color-primary)`; `color: var(--color-primary-text)`; `font-weight: 700` (FR-65). The `padding` is the design's effective value, not a design declaration: the design has no base `button` rule, so its `.rules-close` gets the user agent's button padding (`1px 6px` in Chromium) and its `min-height: 2.75rem` decides the 44 px height, whereas the page's base `button` rule (`padding: 10px 16px`) would make the box 48 px tall; the session reads the design's computed `padding` on the frozen build to confirm the value, and the geometry test decides. It keeps the base `button:focus-visible` indicator (3px, 2px offset, `--color-focus`): no focus rule is added, and the ring on the panel fill is the existing pair `--color-focus` on `--color-surface-raised` (15.88 light, 12.79 dark). The text pair `--color-primary-text` on `--color-primary` (5.40 light, 8.55 dark) is already in the list of «Borders, cues and focus rings have enough contrast». The sticky button is in view when the browser focuses it as the popover's `autofocus` target, so the first opening does not scroll the panel to «Зрозуміло» (`docs/qa/prep-g2/rules-open-probe.txt`); the second and later openings are covered by the reset of «Rules panel» (`docs/qa/prep-g2/rules-reopen-probe.txt`).

**The paint of the list and the examples** is this, each with the longhand the colour scan reads: the separator of each item of the rules panel (`.rules li`) has `border-top-color: var(--color-line)` (it was `--color-given-bg`); the decorative example cell `.mini` (`aria-hidden`, A-26) has `border-color: var(--color-control-border)`, `background-color: var(--color-page)` and `color: var(--color-entry-text)`; the answer cell `.mini-answer` has a 2px dashed border in `--color-primary` (it was `--color-focus`), `background-color: var(--color-primary-soft)` and `color: var(--color-text)`, italic, weight 700; the separator sign `.mini-sep` keeps `--color-text-muted`. The example cell's border is `--color-control-border`, not `--color-cell-border`: the design's `--cell-border` has the values of the page's `--color-control-border` (light `#8c8374`, dark `#8a7f71`), and `--color-cell-border` is the light `#847b6d` that A-57 darkened for the board's cells only. The examples are decoration and in no contrast pair; for the record `--color-entry-text` on `--color-page` is 5.57 (light) and 8.90 (dark), and `--color-text` on `--color-primary-soft` is 12.96 and 11.50. After the port none of the panel's rules declares `--color-given-bg`, and none declares a colour other than a `var(--color-...)` token.

**The inner metrics are the design's, because from 64rem the panel is as tall as its contents** and so the box test below compares them: `.rules h2` 1.125rem, weight 700, margin `0 0 0.5rem`; `.rules ul` margin `0 0 1rem`, `padding: 0`, `list-style: none`; `.rules li` `display: flex`, `flex-direction: column`, `gap: 0.5rem`, padding `0.5rem 0`, `font-size: 0.9375rem`, `line-height: 1.45`; `.rules [data-section='techniques']` margin `0.5rem 0 0`; `.rules h3` 1rem, weight 700, margin `0 0 0.5rem`; `.rule-example` `display: flex`, `align-items: center`, `gap: 0.1875rem`; `.mini` `width: 1.75rem`, `height: 1.75rem`, `font-size: 0.9375rem`, `font-weight: 500`, `font-variant-numeric: tabular-nums`, `border-radius: 0.375rem`; `.mini-sep` padding `0 0.5rem`. (The page's heading is 1.1rem, its items have a 6px gap and line height 1.4, and it has no rule for the techniques section or for `h3`, so these are changes; the task that ports them checks each against the geometry cases.)

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) the panel's motion, the slide and fade of `binarka.css` lines 1508-1560 (RQ-4): the gate captures with reduced motion, and the page animates no panel; no rule of the panel sits in `@media (prefers-reduced-motion: no-preference)` or in `@starting-style`; (2) the setup sheet, the settings panel and the confirmation dialog, whose size, place and paint are other blocks'; (3) the design's mask shadow on «Закрити» (the shell does not deliver it either); (4) a new colour token or a new contrast pair; (5) Safari and Firefox, which are not tested (NFR-7), so whether they scroll a stuck sticky button into view is unverified; (6) a pixel floor for any shot: the rules shots are expected to rise, not to reach 0.98 (see the mechanism below); (7) the geometry of the panel in the dark scheme (geometry does not depend on the scheme; the dark paint is checked by the pixel instruments).

The mechanism is stylesheet and jsdom tests, test first, and a browser test. `tests/play-page-rules-panel-stylesheet.test.ts` (`@trace FR-57`, `@trace FR-65`, `@trace NFR-14`) reads the parsed `src/ui/style.css` and, with the injected stylesheet, jsdom's computed style. `e2e/nfr-14-rules-panel.spec.ts` (`@trace NFR-14`, `@trace FR-57`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the open panel's box and «Зрозуміло»'s box with the design's, frozen in the top-level key `rulesPanel` of `quality/design-geometry.json` (the existing key `cases`, the 16 `selectors` and the 32 cases of `e2e/nfr-14-layout-geometry.spec.ts` are not touched). The freeze script `scripts/freeze-design-geometry.mjs` gains an explicit list of the rules cases, each with its own capture board; the script keeps the recorded top-level `provenance` when `designCommit` and `designCssSha1` are unchanged (today it rewrites the block on every run, and `designBuildSha1` differs between worktrees), and records the build SHA-1 and the browser of this run in `rulesPanel.provenance`; this is an edit of the script, not of the design. On the design side the panel is reached by the design's own route where there is one: the design's `/rules/` route opens the panel at load (a press there would close it), so the six review-set cases and the 800×600 case load `/rules/` and wait for `:popover-open`; the 4×4 case has no route with the panel open, so it loads `/four/` and presses «Правила». On the page side every case loads the page with the case's capture board and presses «Правила» (the recorded `afterLoad` is `open-rules`). The sampled cases are 8: the light shots of `review-set-14` at 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900 with the design's 6×6 fixture board; one viewport where the board is narrower than the column (the 4×4 fixture board at 768×1024); and one short window from 48rem to 64rem (800×600, 6×6), where the window less 7rem caps the panel: that case checks the cap (`max-height`, which equals the cap term of the `min-height` there), not the board-side term. The board-side term is checked by the cases whose recorded `decidedBy` is `min-height`; the freeze records it, and if the 4×4 case turns out to be decided by the content height, it checks that box and not the formula. The browser setup is that of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, light scheme). Coverage is `sampled`, never continuum: the sampling dimensions are the viewport (8 points) and the board size (6×6 and 4×4); nothing between the viewports, no dark scheme, no other board, no hover or focus state is looked at. The stricter instrument that runs before a block-done claim is the per-block pixel crop of `scripts/visual-block.mjs` with a block `rules` (the panel and its close button; it opens the panel on both sides for the geometry channel), over the 20 rules and rules-techniques shots, and then the per-shot gate `npm run check:visual`, and then the full computed-style diff of every element of the panel (the escalation path of `docs/qa/visual-diff/README.md`). This requirement claims no pixel floor for any shot.

In the stylesheet scenarios below, a declared value is compared with whitespace removed and with a bare zero equal to `0px` (jsdom serialises a zero length as `0px`, so `inset: 0` reads `0px` and `padding: 0.3125rem 0` reads `0.3125rem 0px`).

Traces: NFR-14, FR-57, FR-65, A-59, A-26, A-20

#### Scenario: Below 48rem the panel is a bottom sheet with the design's size

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules, and the raw text of the file (jsdom's CSSOM keeps only the last of two `max-height` declarations and drops a `padding` shorthand that holds `env()`, so those two checks read the raw text of the top-level rule, as the shell's tests do with their raw declaration counts)
- **WHEN** the test reads the top-level rule that is exactly `.rules`
- **THEN** its raw text contains, in this order, `max-height: 60vh` and later `max-height: 55dvh`, and `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))` (whitespace aside); its parsed declarations have `border-radius` equal to `1rem 1rem 0 0`, `position: fixed`, `inset: auto 0 0 0` and `width: 100%`
- **AND** the rule `.rules` inside `@media (max-width: 22.5rem)` declares `padding-top: 1rem`, and the rule `.mini` inside the same block declares `width` and `height` of `1.5rem` and `font-size` `0.875rem`
- **AND** that 22.5rem `.rules` rule and that `.mini` rule come later in the file than the top-level `.rules` and `.mini` rules, and the first rule of the raw text whose selector is exactly `.rules` is still the top-level one (the shell's raw counts read it)

#### Scenario: From 48rem the open panel is a flex column and «Зрозуміло» takes the spare height

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules that are exactly `.rules`, `.rules:popover-open`, `.rules-close` and the techniques section inside `@media (min-width: 48rem)`
- **THEN** `.rules:popover-open` declares `display: flex` and `flex-direction: column`, and `.rules > *` declares `flex-shrink: 0`
- **AND** no rule whose selector is exactly `.rules` declares `display`, at any width and in any at-rule, so a closed panel keeps the user agent's `display: none`
- **AND** the `.rules-close` rule of this block declares `margin-top: auto`, and `.rules [data-section='techniques']` declares `margin-top: 0`
- **AND** those two 48rem rules come later in the file than the top-level `.rules-close` and `.rules [data-section='techniques']` rules, so they win at the same specificity

#### Scenario: From 48rem the panel takes the column's width plus 1rem, 6rem from the top

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule `.rules` inside `@media (min-width: 48rem)` (the single rule the shell's tests read for its `box-shadow`; the declarations of this scenario are merged into it, not put into a second `.rules` rule of the block)
- **THEN** it declares `inset: 0`, `width: calc(var(--column) + 1rem)`, `max-width: calc(100% - 2rem)`, `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `margin: 6rem auto auto`, `padding-bottom: 1rem`, `border-radius: 1rem` and the `min-height` of the table, and it declares no `padding` shorthand (the old `padding: 24px` is gone)
- **AND** the same rule still declares `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)` once and `border-color: var(--color-overlay-border)`, as «The panels take the shared surface paint» says

#### Scenario: The min-height reads the board side through the root

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the `min-height` declarations of the rules that are exactly `.rules` and the rules that declare `--board-width` or `--column`
- **THEN** the `min-height` of the 48rem rule is `min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))` (whitespace aside), no rule whose selector starts with `.rules` declares `--board-width`, `--column`, `--n`, `--cell-max`, `--board-gap` or `--board-pad`, and the rules that declare `--board-width` and `--column` have selectors that begin with `#app` (the shell's hook), so the panel inside the root reads the same values as the board
- **AND** the browser check that the variable reaches the panel is the box scenario below, at the cases whose recorded `decidedBy` is `min-height` (at 768×1024 the 4×4 panel is shorter than the 6×6 panel if the 4×4 case is one of them; if it is decided by the content height, the report says so and the 6×6 cases carry the check)

#### Scenario: From 64rem the panel is one 40rem column with tighter spacing

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules inside `@media (min-width: 64rem)` whose selector is exactly `.rules`, `.rules h2`, `.rules ul` and `.rules li`
- **THEN** `.rules` declares `width: 40rem`, `height: fit-content`, `min-height: 0` and `padding-top: 1rem`; `.rules h2` declares `margin-bottom: 0.25rem`; `.rules ul` declares `margin-bottom: 0.5rem`; `.rules li` declares `padding: 0.3125rem 0`
- **AND** the `.rules` rule of the 64rem block is later in the file than the `.rules` rule of the 48rem block that declares `min-height`, and the `max-width: calc(100% - 2rem)` cap is declared in the 48rem block (so it applies from 64rem as well) and in no rule below 48rem
- **AND** `.rules:popover-open::backdrop` is still declared exactly once inside `@media (min-width: 64rem)`, with `--color-backdrop-strong`

#### Scenario: «Зрозуміло» is sticky and filled, with the design's mask

- **GIVEN** the parsed `src/ui/style.css` and the injected stylesheet with the light token values substituted, and then the dark values
- **WHEN** the test reads the top-level rule `.rules-close` and `getComputedStyle` of the panel's close button
- **THEN** the rule declares `position: sticky`, `bottom: 0`, `width: 100%`, `min-height: 2.75rem`, `padding: 1px 6px`, `border-width: 2px`, `border-style: solid`, `border-color: var(--color-primary)`, `border-radius: 0.625rem`, `background-color: var(--color-primary)`, `color: var(--color-primary-text)`, `font-weight: 700` and `box-shadow: 0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)` (whitespace aside)
- **AND** the computed `position` is `sticky`, `color` is the `--color-primary-text` value and `background-color` and `border-top-color` are the `--color-primary` value, in each token set
- **AND** the stylesheet has no new `:focus-visible` rule for `.rules-close`, the text pair `--color-primary-text` on `--color-primary` is in `CONTRAST_PAIRS` and holds in each token set, and the list is equal to the one the baseline requirement «Borders, cues and focus rings have enough contrast» lists (the test holds a literal copy of `CONTRAST_PAIRS` as it stood before the change and compares with it, not with a number, because the setup-sheet block may add pairs)

#### Scenario: The separators and the example cells take the design's tokens

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules `.rules li`, `.mini`, `.mini-answer` and `.mini-sep`
- **THEN** `.rules li` declares `border-top-color: var(--color-line)`; `.mini` declares `border-color: var(--color-control-border)`, `background-color: var(--color-page)` and `color: var(--color-entry-text)`; `.mini-answer` declares `border-style: dashed`, `border-width: 2px`, `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)` and `color: var(--color-text)`; `.mini-sep` declares `color: var(--color-text-muted)`
- **AND** none of the panel's rules contains `--color-given-bg`, `--color-cell-border` or `--color-focus` in any declaration

#### Scenario: The inner metrics are the design's

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the top-level rules `.rules h2`, `.rules ul`, `.rules li`, `.rules [data-section='techniques']`, `.rules h3`, `.rule-example` and `.mini`
- **THEN** they declare the values of the paragraph «The inner metrics are the design's» above (heading 1.125rem/700 with `margin: 0 0 0.5rem`; list `margin: 0 0 1rem`; item `gap: 0.5rem`, `padding: 0.5rem 0`, `font-size: 0.9375rem`, `line-height: 1.45`; techniques `margin: 0.5rem 0 0`; `h3` 1rem/700 with `margin: 0 0 0.5rem`; example `display: flex`, `align-items: center`, `gap: 0.1875rem`; cell `width` and `height` `1.75rem`, `font-size: 0.9375rem`, `font-weight: 500`, `font-variant-numeric: tabular-nums`, `border-radius: 0.375rem`; list `padding: 0`, `list-style: none`; item `display: flex`, `flex-direction: column`)

#### Scenario: The panel adds no token, no pair and no colour literal

- **GIVEN** the parsed `src/ui/style.css` and the colour scan of «Borders, cues and focus rings have enough contrast»
- **WHEN** the test applies the scan to every declaration of the panel's rules
- **THEN** it finds no colour literal, no named colour and no `color-mix(`; every `box-shadow` colour is a `var(--color-...)` token; `TOKEN_NAMES` and `CONTRAST_PAIRS` of `tests/helpers/css.ts` are unchanged by this change (equal to the baseline list of «Borders, cues and focus rings have enough contrast»; the test holds literal copies of the two lists as they stood before the change and compares the exported lists with them, not with numbers, because the setup-sheet block moves the counts)
- **AND** the stylesheet has no `!important`, the raw text contains `:has(` exactly once (the idle-line rule), and no rule of the panel is inside `@media (prefers-reduced-motion: no-preference)` or `@starting-style`

#### Scenario: The rules panel in a real browser has the design's box at the sampled viewports

- **GIVEN** `quality/design-geometry.json` with the key `rulesPanel` frozen from the design build, and the built page in Chromium with the browser setup of `playwright.config.ts`, with the design's fixture board of each case (FR-119)
- **WHEN** the test opens the panel with a press on «Правила» at each of the 8 cases (320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, the 4×4 board at 768×1024, and 800×600) and reads the `getBoundingClientRect()` of `[data-section="rules"]` and of its close button
- **THEN** the panel is open (`:popover-open`), and each of the four edges of both boxes is within 0.5 px of the frozen box of the case
- **AND** «Зрозуміло» lies inside the panel's box at every case, and the panel's bottom edge less «Зрозуміло»'s bottom edge is at most 17 px (the 1px border and the 1rem padding) at every case
- **AND** a case that differs is reported with the case, the element, the frozen box and the page's box

#### Scenario: The frozen fixture holds exactly the rules cases and the layout cases are untouched

- **GIVEN** `quality/design-geometry.json` after the refreeze
- **WHEN** the e2e test reads it
- **THEN** `rulesPanel.cases` has exactly the 8 shots `320-light-rules`, `375-light-rules`, `768-light-rules`, `1024-light-rules`, `1366-light-rules`, `1440-light-rules`, `768-light-rules-four` and `800-light-rules-short`, its `coverage` is `sampled`, and its `selectors` are `[data-section="rules"]` and `[data-section="rules"] .rules-close`
- **AND** the existing `cases` (the 32 of «Main column layout geometry follows the design reference») and `selectors` (the 16) are byte-for-byte as before, the top-level `provenance` has the same `designCommit` and `designCssSha1` as before (its `designBuildSha1` and `browser` are the recorded ones, kept by the script), `rulesPanel.provenance` records the `designCommit`, `designCssSha1`, `designBuildSha1` and `browser` of the run that froze it, and `e2e/nfr-14-layout-geometry.spec.ts` passes without an edit
- **AND** every case of `rulesPanel` records the design panel's `scrollHeight`, `clientHeight`, resolved `min-height` and `max-height` in px, and `decidedBy`, which is `min-height`, `max-height` or `content` according to which of the three equals the box's height (within 0.5 px; on a tie, `max-height` first, then `min-height`, then `content`), so the report says which bound each case checks

#### Scenario: The filled button keeps its floor, its contrast and the other surfaces

- **GIVEN** the built page, and `e2e/nfr-12-targets.spec.ts` (which measures the rules close button), `e2e/nfr-13-a11y.spec.ts` (its `rules` state, light and dark, at 375×812 and 1280×800), `e2e/nfr-14-backdrop.spec.ts`, `e2e/nfr-14-panel-shell.spec.ts` and `e2e/nfr-14-palette.spec.ts` as they stand before this change
- **WHEN** they run after the port
- **THEN** they pass, and `git diff` of this change shows no edit to those files

#### Scenario: The sampled coverage is declared

- **GIVEN** `e2e/nfr-14-rules-panel.spec.ts`
- **WHEN** a reader looks for the sampling dimensions
- **THEN** the file names the viewports (the 8 cases) and the board sizes as its sampling dimensions, declares coverage `sampled`, names `scripts/visual-block.mjs` (block `rules`) and `npm run check:visual` as the stricter instruments, and claims neither all widths, all board sizes nor a pixel floor
