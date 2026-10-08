# Design: add-page-accessibility

## Goals

- Make the play page operable and understandable without a mouse and without sight, as
  NFR-9 and FR-59 to FR-65 require: APG grid pattern, Ukrainian names, one Tab stop,
  labelled select, status regions, a second violation cue, 3:1 contrast, visible focus.
- Verify all of it in jsdom (Vitest) and by tests that read `src/ui/style.css` (A-28).
  Keep every existing `data-*` attribute and class, so slices 2 and 3 stay valid.

## Non-goals

- 44 px phone targets (G7), confirm or Undo and URL state (G8), real browsers, screen
  readers, axe (TC-13, NFR-7), PageUp and PageDown, new dependencies, engine changes.
- Announcing an identical hint sentence twice (a live region announces changes only).

## Key decisions

1. **Rows are their own grids.** `[data-board]` becomes a flex column (`gap: 2px`) of N
   `div.board-row[role="row"]`, each `display: grid` with the template the board used
   before (`repeat(var(--n), minmax(0, var(--cell-max)))`, `gap: 2px`,
   `justify-content: center`). `--n` and `--cell-max` stay on `.board` and are inherited, and
   every row has the board's width, so the columns line up and the picture does not change.
   Rejected: `display: contents` on the rows (keeps one CSS grid, but has a history of
   dropping element semantics from the accessibility tree; row semantics are the point of
   this slice, and a test forbids it); a `<table>` (changes the cell element, which is a
   `div` in the contract); a flat grid with `aria-owns` (fragile). Trade-off: the column
   alignment rests on identical templates, which jsdom cannot see: manual check 6.10.
   Cells move from children to grandchildren of the board; rows carry a class only, no
   `data-row` (so `[data-row]` selectors still mean cells).
2. **Cell semantics.** `role="gridcell"`, `tabindex`, `aria-label`, `aria-readonly`
   and `aria-invalid` on the same `div`; the text content stays empty, `0` or `1` (FR-34),
   and the `aria-label` replaces it for assistive technology. `renderCell` writes text,
   name and `aria-readonly`; `refreshHighlights` writes the class and `aria-invalid` in
   the one loop, so the two can never disagree. Name: «Рядок R, стовпець C: V» with V =
   «порожня», `0` or `1` (the user's example; digits stay digits). It is rewritten in
   `renderCell`, which every change already calls. `aria-readonly="true"` on givens only
   and `aria-invalid="true"` on violations only; both attributes are removed, not set to
   `"false"`, because absent is the default and a test can say "no cell has it".
   A given's name does not say «задана»: `aria-readonly` carries it (FR-61 example).
3. **Where the Tab stop is.** Exactly one cell has `tabindex="0"` always, and the Tab stop
   follows focus (APG: it is the last focused cell). A `focusin` listener on the board makes
   whichever cell receives focus the Tab stop, so a click, a key move, a mouse focus or a
   programmatic `focus()` can never split the two (jsdom fires `focusin` on `focus()`).

   | Event | Tab stop | DOM focus |
   |---|---|---|
   | mount, new puzzle, accepted size change | cell (1,1) of the new board | not moved (the button or select keeps it) |
   | failed generation | unchanged | unchanged |
   | click on any cell, a given too | the clicked cell | `focus()` on it |
   | Arrow, Home, End, Ctrl+Home, Ctrl+End | destination | `focus()` on it |
   | Enter or Space | unchanged | unchanged |
   | hint, with or without a fill | unchanged | unchanged: the hint button keeps it |

   Reasons: (1,1) is a stable entry point beyond the signed text (FR-59 does not say); a
   rebuild must never steal focus from the control the player just used (a keyboard user
   pressing «Нова головоломка» must stay on it). A hint does not move the Tab stop (the
   orchestrator's decision, 2026-10-06: the Tab stop is the last focused cell, and a hint
   focuses nothing). A click moves the Tab stop to a given too because FR-60 says "a cell"
   and a real browser focuses a clicked `tabindex="-1"` cell; FR-33 still holds (text,
   `data-given`, classes, highlights and messages unchanged). jsdom does not focus on
   `click()`, so the click handler calls `focus()` itself (and `focusin` does the rest).
4. **Keys.** One delegated `keydown` listener per board element (rebuilt with the board,
   like the click listener). The cell is found with `closest('[data-cell]')` from the
   event target and the position is read from its `data-row` and `data-col`, not from
   remembered state (a cell focused by a mouse drag still navigates correctly). Handled:
   Arrow keys, Home, End (Ctrl+Home, Ctrl+End), Enter, Space (`key === ' '`). Modifiers:
   Alt and Shift disable every handled key; Ctrl only gives Home and End their
   board meaning, and disables the rest. Meta combinations are not specified: Meta+Home
   and Meta+End are "not required" (FR-59 names Ctrl; macOS laptops reach Ctrl+Home with
   Ctrl+Fn+Left). The implementation ignores Meta combinations so browser shortcuts keep
   working; no test asserts it. `preventDefault()` is called for every handled press, including an
   Arrow at an edge and Enter or Space on a given (otherwise Space scrolls the page),
   and never for anything else (Tab must not be trapped). A `repeat` press of Enter or
   Space is prevented but does not cycle, so holding a key does not spin a cell.
   Enter, Space and click call the same `cycleCell(r, c)`. Trade-off: handling `keydown`
   (not `keyup`) matches APG grids and lets `repeat` be filtered.
5. **Label without ids.** `<label class="size-label">` holds the text «Розмір поля»
   (in a `span`) and the select. `select.labels` contains it (jsdom 29 checked), and
   two mounts in one document cannot clash because there is no `id` or `for`; a test pins
   "no `id` on a descendant of the root". The select keeps `data-control="size"` and gets no
   `aria-label` (a hidden second name would hide a missing visible one).
   Trade-off: nesting means the label's `textContent` includes the option texts, so
   tests read the label text without the select's subtree.
   **Deviation from `docs/frontend-conventions.md` rule 1** ("a `<label for>` for every form
   control): `for` needs an `id`, and the mount contract allows two independent mounts in
   one document, which would duplicate the id and point the second label at the first
   select. The wrapping label is the id-free form of the same native association. Visible:
   the label is checked by computed `display` and `visibility` (jsdom computes them through
   the cascade) and by a scan of the `size-label` rules for hiding declarations; the
   `.size-label` rule has a `gap` so the text does not touch the select.
6. **Status regions.** `role="status"` is added to the two existing `<p>` elements; the
   page never replaces them, only sets `textContent`, and never focuses them. Known
   limit: a live region announces a change of text, so the same sentence twice in a row
   (for example the "no rule applies" sentence) is not announced again. Not fixed here
   (out of scope; would need clear-then-set with a delay), recorded as a risk.
7. **Colour tokens and the contrast numbers.** All colours are `#rrggbb` custom properties
   in `:root`; rules use only `var(--color-...)` and only the longhands `color`,
   `background-color`, `border-color`, `outline-color`, so a test can resolve every pair
   that ships. Values (WCAG 2 ratios computed 2026-10-06):

   | Token | Value | Checked pairs |
   |---|---|---|
   | `--color-page` | `#f9fafb` | page of every pair below |
   | `--color-text` | `#1f2937` | 14.05 page, 14.68 cell, 11.86 given |
   | `--color-cell-bg` / `--color-control-bg` | `#ffffff` | |
   | `--color-cell-border` / `--color-control-border` | `#6b7280` | 4.63 page, 4.83 cell, 3.90 given (was `#9ca3af`, 2.43) |
   | `--color-given-bg` | `#e5e7eb` | decoration only; `--color-text` 11.86 |
   | `--color-given-border` | `#374151` | 9.86 page, 10.31 cell, 8.33 given |
   | `--color-violation-bg` | `#fecaca` | |
   | `--color-violation-border` | `#b91c1c` | 6.19 page, 6.47 cell, 4.47 violation fill |
   | `--color-violation-text` | `#991b1b` | 5.74 on the violation fill |
   | `--color-focus` | `#1d4ed8` | 6.41 page, 6.70 cell, 5.41 given, 4.63 violation fill |
   | `--color-win-text` | `#166534` | 6.82 page |

   **ADR candidate (for the user, not decided here):** "CSS requirements are verified by
   walking jsdom's parsed stylesheet and by computed style in jsdom". It sets the method
   for every later CSS requirement under TC-13. If the user wants an ADR, it would be
   ADR-0005.
8. **The given cue is a border, not the fill.** Today a given is bold digits on `#d1d5db`,
   whose fill is 1.41:1 against the page: it fails 3:1 and cannot be made to pass without
   a dark cell that hurts the digit contrast. The cue FR-65 measures is therefore the given
   border: 2px in `--color-given-border`, with bold digits; the fill stays as decoration
   (`#e5e7eb`) and the requirement says it is not the cue. Widths: ordinary 1px, given
   2px, violation 3px, so each state is distinguishable without colour. `.cell-violation`
   comes after `.cell-given` in the file (the same specificity), so a given in violation
   shows the violation border; the test does not trust the order but measures the computed
   border of a given-in-violation cell at N = 4, 6, 8, so a later higher-specificity rule
   (such as `.board[data-size='8'] .cell`) or a reordering fails it.
9. **Focus ring outside the cell.** `.cell:focus-visible`: `outline-style: solid`,
   `outline-width: 3px`, `outline-color: var(--color-focus)`, `outline-offset: 2px`,
   `position: relative`, `z-index: 1`. Outside, so the ring does not paint over the 3px
   violation border (an inset ring would hide FR-64's cue while the cell is focused);
   `z-index` so a later neighbour does not cover it (2.4.11). Geometry: the cells are 2px
   apart, so with offset 2px the ring spans 2px to 5px from the cell's border edge: its
   inner side touches the page colour in the gap and its outer edge lands on the neighbour's
   fill (a 1px offset put the outer edge on a violation neighbour's border, 1.04:1 against
   the blue). Hence the checked pairs are the ring against page, cell, given and violation
   fills (6.41, 6.70, 5.41, 4.63). Trade-off: the ring covers the neighbour's border (1px, or
   3px for a violation) on that side while the cell is focused; the neighbour keeps its
   fill, its `aria-invalid` and its other sides. Buttons and the select: `outline-offset:
   2px`. In forced-colors mode outlines survive and border cues stay visible.
10. **Stylesheet reader.** `tests/helpers/css.ts` has a text entry point `parseStyles(text)`
    (and `readStyles()` = `parseStyles` of the file), so the helper self-checks run on literal
    samples and stay green at the red stage. It injects the text into a `<style>` element of
    jsdom and walks the CSSOM, recursing into every rule that has `cssRules` (nested style
    rules with `&` resolved, `@media`, `@supports`, `@layer`, `@container`), so nesting and
    media queries are allowed (convention rule 20) and are judged, not skipped. It throws only
    on rule types it cannot judge (`@import`, `@font-face`, unknown). It resolves ONLY
    `--color-*` custom properties (`.board` declares `--n` and `--cell-max`, which an
    eager resolver would choke on) and gives every effective token set (the top-level one and
    each conditional `:root` override applied over it). Bans kept: `:has(` and `!important`.
    `contrastRatio` is the WCAG 2 formula; its self-check pins white on black 21, white on
    white 1 and the old given fill (`#d1d5db` on `#f9fafb`, 1.41). Cascade checks use
    `getComputedStyle` on mounted cells with the text's `var(--color-x)` replaced by the token
    value (jsdom honours specificity and inheritance, checked 2026-10-06). Limit: jsdom
    applies only top-level style rules to computed style, not `@media` or nested rules, so
    those are checked for tokens and literals but their cascade is only seen in 6.10.
11. **Test strategy.** Keys are `new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true,
    cancelable: true })`; without `cancelable: true`, `defaultPrevented` stays false and a
    `preventDefault` test is vacuous (checked in jsdom 29). Focus checks use real `focus()`
    on nodes attached to `document.body`. jsdom cannot evaluate `:focus-visible`, so rings are
    checked as declarations only.

Decisions 1 to 6 and 8 to 11 are local to `src/ui/` and reversible: not ADR-worthy.

## Data model

No closure state is added for the Tab stop: the one cell with `tabindex="0"` IS the Tab stop
(the DOM is the single source of truth; review round 1, F1). DOM (per board): `[data-board][role=grid][aria-label][data-size]` with N
`.board-row[role=row]`, each with N `[data-cell][role=gridcell][tabindex][aria-label]`
(+ `data-row`, `data-col`, `data-given`, classes, optional `aria-readonly`,
`aria-invalid`). Page: `h1`, `label.size-label > (span + select[data-control=size])`,
`.board-host`, `.buttons`, `p[role=status][data-message=hint]`, `p[role=status][data-message=win]`.

## Error handling

| Situation | Result |
|---|---|
| keydown target not in a cell, `data-row`/`data-col` out of range, or a key the board does not handle (Tab, PageUp, letters, modified combinations) | ignored, not prevented |
| arrow, Home, End at an edge or already at the target | handled: prevented, nothing moves |
| Enter or Space on a given | handled: prevented, nothing changes, no message |
| Enter or Space with `repeat` | prevented, no cycle |
| generation fails (size change or new puzzle) | previous board, Tab stop, names and messages stay |
| stylesheet holds `@import`, `@font-face` or an unknown rule type | the stylesheet test fails with a message naming it |

No server, no network, no persistence, no authorization (no redirects). Nothing here can
produce a raw 500; there is no inline form validation beyond the size select (slice 3).

## Risks and mitigations

- **jsdom is blind to layout, `:focus-visible` and screen readers (TC-13, A-28).**
  Mitigation: CSS read through the CSSOM and computed style; a manual keyboard check in the built-in browser (task 6.10)
  with screenshots under `docs/qa/add-page-accessibility/`; NFR-7 stays Future.
- **Row layout regression.** Rows share a template by construction only. Mitigation: the
  manual check at desktop width and 375 px, sizes 4, 6 and 8: columns aligned, no scroll.
- **Existing tests.** Checked by search on 2026-10-06: no test or helper reads
  `[data-board]` children, `firstElementChild`, `children`, `nextElementSibling`, or the
  child order of the root; they use `querySelector(All)` and `closest`, which still work.
  `snapshot()` reads text, `data-given` and classes only, so no state may be added as a
  class. Deliberate changes are listed in `tasks.md` 5.5 to 5.9.
- **Noisy red stage.** Extending `expectPageStructure` (35 call sites in 8 files; one is
  inside `playedBoard()`, which 5 tests call) turns the tests that use it red by design, as
  slice 3 did; the red-run file counts failing tests, not call sites.
- **Accepted and recorded:** a repeated identical hint is not re-announced (decision 6); the
  Tab stop at (1,1) after a rebuild is beyond the signed text (decision 3); the `#app` id
  selector in `style.css` conflicts with convention rule 3 and is left alone.

## Baseline text edits at archive

The delta merge touches requirements only. Archive with
`npx openspec archive add-page-accessibility --yes` (a normal merge, NOT `--skip-specs`)
and in the SAME commit edit this non-requirement text of `openspec/specs/play-page/spec.md`:

1. **Purpose:** add that the page is keyboard-operable and exposes grid roles, Ukrainian
   names and status regions (WCAG 2.2 AA for FR-59 to FR-65), and that cells are focusable
   grid cells rather than plain clickable ones.
2. **Ownership:** "FR-31 to FR-43" becomes "FR-31 to FR-43 and FR-59 to FR-65, and NFR-9";
   NFR-5 now also traces the accessible names (board, cells, size label).
3. **DOM contract:** board is `role="grid"` with `aria-label` «Поле N×N»; N `role="row"`
   children each holding the N cells of a row; cells are `role="gridcell"` with `tabindex`
   (one `0`, others `-1`), `aria-label` «Рядок R, стовпець C: порожня|0|1», `aria-readonly`
   (givens) and `aria-invalid` (violations); the size select is wrapped in a `label` with the
   text «Розмір поля»; both messages have `role="status"`; no `id` attributes on descendants of the root;
   cells are no longer direct children of `[data-board]`; the label has the class
   `size-label` and its text the class `size-label-text`. Add the key-event test convention
   (bubbling, cancelable `keydown`; `key` names). Also amend the sentence "Scenarios are
   decided from the DOM only (text content, classes, data attributes, element presence)"
   so it also allows roles and ARIA attributes, `tabindex`, `document.activeElement`,
   computed style in jsdom, and the parsed text of `src/ui/style.css` (FR-64, FR-65).
4. **Mount contract:** "the board, the size selector, buttons and both message regions are in
   `root`" stays; add that the label is in `root` too.
5. **Exclusions:** replace "Keyboard play and screen-reader support have no requirements
   (A-20)" by "Keyboard play and the roles, names and states screen readers use are MVP
   requirements (NFR-9, FR-59 to FR-65; A-20 is superseded). Real screen-reader output and
   real-browser rendering are not tested (A-28, TC-13)". Add the three items the user
   declined (autonomy-log row 34): 44 px phone targets (8×8 cells are 41 px at 375 px),
   confirm or Undo before progress is discarded, puzzle state in the URL. Keep "Mobile
   layout and visual polish are not specified (A-14)" as a separate sentence.
   Add: PageUp and PageDown are not handled; a repeated identical hint sentence is not
   announced again.

Afterwards run `npx openspec validate --all --strict`, `npm run check:trace`, and
`grep -nE "A-20|no requirements|direct children|Keyboard play" openspec/specs/play-page/spec.md`:
every hit must be checked by hand (A-20 may only appear as "superseded").
