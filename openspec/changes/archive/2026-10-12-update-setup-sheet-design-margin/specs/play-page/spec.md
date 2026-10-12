## MODIFIED Requirements

### Requirement: The setup sheet takes the design's size, place and paint

The setup sheet `[data-section="setup"]` (class `setup-sheet`) SHALL take the size, the place and the paint of the design's sheet (`.setup`, `design/v0/app/binarka.css` lines 386-414, 435-650, 949-1007 and 1049-1072; reference `design/v0-screenshots/review-set-16/*setup*.png`; review-set-14 when this requirement was written, moved by the user to review-set-15 and review-set-16 on 2026-10-12, design iterations 17 and 18), from the page's tokens (FR-96 presentation, FR-65, FR-99, NFR-14, A-60; G2 setup-sheet block, `update-setup-sheet`). It runs after `update-panel-shell`, whose fill, border colour and shadow of the sheet it keeps (see «The panels take the shared surface paint»), and it needs the shell's hook, the root's `data-size` (see «The page root carries the board size»). Wherever the design uses `--cell-border` inside the sheet (the ring, the unavailable card's border, the «Закрити» border), the page uses `--color-control-border`, which has the same values in both sets (`#8c8374` light and `#8a7f71` dark; `--color-cell-border` is darker in light for the board's cells only, A-57).

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

**The level group's bottom margin is 28px at every width, as in the design (A-60 as amended and signed by the user on 2026-10-12; review-set-15, design iteration 17).** With a smaller margin the keyboard focus ring of the last option sits under the footer strip (FR-65, WCAG 2.4.11; «Cells and buttons show a visible, unobscured focus indicator»). Until 2026-10-12 this margin was a departure from the design (SQ-5: the design had 24px above 22.5rem and 1rem at 22.5rem and narrower), and the box test compared the page with the design plus one injected rule; since design iteration 17 the design has the 28px, so the box test compares the page with the design's own boxes and nothing is injected. The rule `.setup-sheet > [data-control='level']` keeps `margin-bottom: 28px` outside any at-rule, and `.setup-sheet:popover-open` keeps `scroll-padding-bottom` of at least `calc(2.75rem + 48px)` (the design's bottom padding is 16px, so the value that covered the page's 24px still covers it; since design iteration 18, review-set-16, the design's open sheet declares the same `calc(2.75rem + 48px)`, so a focused «Почати» scrolls the sheet in both alike). **No motion** is ported (SQ-6): no `.setup-sheet` rule is inside `@media (prefers-reduced-motion: no-preference)` or `@starting-style`, and none declares `transition` or `animation`. The contrast of the new bindings is pinned by «Borders, cues and focus rings have enough contrast» (the ring pairs and the primary pairs), not here.

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) the theme and language options' paint and the settings panel's (delivered by `update-settings-panel`, «The settings panel takes the design's size, place and paint»); (2) the design's mask shadow on «Закрити» and its `pointer-events: none` on the strip; (3) motion of any kind; (4) withdrawn on 2026-10-12 (it was the design's 24px and 1rem margins of the level group; the design has the 28px since iteration 17); (5) a computed-paint comparison of the sheet's cards with the design build in a browser (the stylesheet scenarios and the per-shot gate cover the paint); (6) a pixel floor for any setup shot (they are expected to rise, see `design.md`); (7) the sheet in Safari and Firefox (NFR-7); (8) the `cursor` of the unavailable card (the design's `not-allowed`, the page's `default`); (9) between the sampled viewports the design's own sheet, and so the page's, cuts the idle line's text: at a window 700 px tall from 768 to 1440 px wide (the full cover ends inside the line) and in the 4×4 state at 1024 px tall from 672 to 752 px wide (the bottom sheet's top lies in the line), found by the sweep and left to a later design question (the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/sweep.txt`).

The mechanism is a stylesheet test and a browser test, both test first. `tests/play-page-setup-sheet-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-65`, `@trace FR-96`) reads the parsed `src/ui/style.css`. `e2e/nfr-14-setup-sheet.spec.ts` (`@trace NFR-14`, `@trace FR-96`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the open sheet's box and its first level description's left edge with the cases of the new key `setupSheet` of `quality/design-geometry.json`, frozen by `scripts/freeze-design-geometry.mjs` from the design build served from `design/v0/out` with the browser setup of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, light scheme). Each case records the design's own boxes of the sheet and of the description (`boxes`) and the design's computed `margin-bottom` of the level group (`levelMarginBottom`); the script fails unless that margin is 28px (A-60), so a design that drifts from the signed margin is never frozen, and `scripts/visual-block.mjs` guards its block `setup` the same way. The key records no deviation and no `expected` box (until 2026-10-12 it recorded the SQ-5 departure: an injected rule, `expected` boxes and `expectedDecidedBy`; `update-setup-sheet-design-margin`). The sampling dimensions are declared: the viewports 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900 and the states default (the design's 6×6 fixture, shot `<w>-light-setup`) and `four` (the 4×4 fixture, shot `<w>-light-setup-four`, which checks the board side B), 12 cases; coverage is `sampled`, never continuum. Geometry does not depend on the colour scheme, so the cases are light. The stricter instruments that run before a block-done claim are the per-shot gate `npm run check:visual` and the per-block pixel crop of `scripts/visual-block.mjs` over the 48 setup shots, and a fine-step sweep of the floor and the no-cut checks (the same spec with the environment variable `SETUP_SHEET_SWEEP=1`, off by default: widths 320 to 1440 in steps of 16 px at the heights 568, 650, 700, 768, 900 and 1024, both states); the sweep is a finer sample, not a continuum claim.

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
- **THEN** each of the four edges of the sheet's box is within 0.5 px of the case's `boxes` value (the design's own), and the left edge of the description is within 0.5 px of the case's `boxes` value
- **AND** a miss is reported with the case, the element, the page's box and the design's `boxes` beside it, and the test asserts that the key records no deviation and no `expected` box and that each case's `levelMarginBottom` is `28px` (A-60: the margin is the design's own, so no departure can hide in the fixture)
- **AND** the computed `line-height` of the sheet equals the computed `line-height` of `body`, and a mismatch is reported with the case and both computed line heights, never as a pass
- **AND** the computed `margin-bottom` of `[data-control="level"]` is `28px` at every one of the six viewports (the margin is real in the page, as in the design)

#### Scenario: The sheet ends below the button row and cuts no line of text

- **GIVEN** the same six viewports and the two states, the sheet open
- **WHEN** the test reads the sheet's box S, the bottom of the action button row R (the bottom of `[data-action="hint"]`), the window height H and the ink band I of the idle line `[data-message="idle"]` (visible in these states): from the ink top of its first line to the ink bottom of its last line, measured in the browser from the line boxes of its text (`Range.getClientRects()`) and the font's metrics of the idle text (`CanvasRenderingContext2D.measureText` with the computed font: ink top = first line's top + `fontBoundingBoxAscent` − `actualBoundingBoxAscent`; ink bottom = last line's top + `fontBoundingBoxAscent` + `actualBoundingBoxDescent`)
- **THEN** at 768×1024, 1024×768, 1366×650 and 1440×900, S.bottom is at least `min(R + 8, H - 16)` less 0.5 px (the sheet ends at least 0.5rem below the button row, or at the window's limit when that is higher)
- **AND** at all six viewports neither S.top nor S.bottom lies strictly inside I (more than 0.5 px from I.top and from I.bottom), so no edge of the sheet cuts the idle line's text, which is wholly covered or wholly clear (an edge that lies at the window's limit, within 0.5 px of 0 or of H, is the window's edge, not a cut by the sheet, and is not counted; the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/sweep.txt`); the edge may lie in the line's box above or below the ink (the design's own sheet ends 0.8 px inside the idle line's box at 1024×768, and the page, with its 28px margin, 4.8 px, measured while the design still had 24px; the user's decision of 2026-10-11 to check the ink, not the box, `docs/qa/update-setup-sheet/green-run.txt`, open finding 1); a viewport that fails is a finding, not a licence to loosen the check
- **AND** at 1366×650 the idle line is wholly covered or wholly clear in both states (the case of `docs/qa/update-page-layout-geometry/stills/1366-dark-setup.png`, the cut line under the sheet)

#### Scenario: The fixture adds one key and changes nothing else

- **GIVEN** `quality/design-geometry.json` after the refreeze
- **WHEN** the test reads its keys
- **THEN** `cases` still holds exactly the 32 shots that `e2e/nfr-14-layout-geometry.spec.ts` pins, `selectors` and `tolerancePx` are unchanged, the top-level `provenance` names the design the fixture is frozen from (its `designCommit` and `designCssSha1`; a design change rewrites every key's provenance, so the guard across design iterations is the SHA-1 of each key's `cases`, and while the design is unchanged the script keeps the recorded provenance), the cases of the key `rulesPanel` (frozen by `update-rules-panel`, which merged first) are unchanged, and the new key `setupSheet` holds `selectors` (`[data-section="setup"]` and the first description), `coverage: "sampled"`, `setupSheet.provenance` recording the `designCommit`, `designCssSha1`, `designBuildSha1` and `browser` of the run that froze it, no deviation, and exactly the 12 cases, each with its `boxes` (the design's), its `levelMarginBottom` (`28px`) and its `layout`: the design sheet's `scrollHeight`, `clientHeight`, resolved `min-height` and `max-height` in px and `decidedBy`, which is `min-height`, `max-height` or `content` according to which of the three equals the box's height,, so the report says which bound each case checks
- **AND** the spec names the viewports and the states as its sampling dimensions, declares `coverage` `sampled`, names `npm run check:visual`, `scripts/visual-block.mjs` and the sweep as the stricter instruments, and claims neither all widths nor a pixel floor
