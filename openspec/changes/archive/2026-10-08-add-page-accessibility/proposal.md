# Change: add-page-accessibility

## Why

Slices 2 and 3 (archived) delivered a page that a mouse user can play and a keyboard or
screen-reader user cannot: cells are `<div>`s with a click handler only, the size
`<select>` has no label, the hint and win paragraphs are not live regions, a violation
is shown by colour alone and the cell border is 2.43:1 against the page
(`docs/frontend-conventions.md` section 9, gaps G1 to G6 and G9). The user signed the
accessibility amendment on 2026-10-06 at about 16:05 (UTC+5:30), autonomy-log row 34:
NFR-9, FR-59 to FR-65, A-26, A-20 superseded, and slice 4 in
`docs/mvp-capability-plan.md` section 4.5. This change implements it.

## What Changes

- Board as a WAI-ARIA grid: `role="grid"` and the name «Поле N×N»; cells move into N row
  wrappers (`role="row"`, each a `display: grid` sharing the board's column template) and
  get `role="gridcell"`. Every `data-*` attribute and the classes `cell-given` and
  `cell-violation` stay (FR-61).
- Keyboard: one Tab stop (roving `tabindex`), Arrow keys that stop at edges, Home and End,
  Ctrl+Home and Ctrl+End; Enter and Space cycle a cell through the click's code path; a
  click moves the Tab stop (FR-59, FR-60).
- Names and states: «Рядок R, стовпець C: порожня|0|1», `aria-readonly` on givens,
  `aria-invalid` on violations (FR-61); a visible «Розмір поля» label wrapping the select,
  no ids (FR-62); `role="status"` on the two messages (FR-63).
- CSS: colour tokens in `:root`; a 3px violation border (ordinary 1px, given 2px) as the
  second cue (FR-64); 3:1 contrast for borders, cues and rings; flat `:focus-visible` rules
  for cells, buttons and select; explicit select colour; `touch-action: manipulation` on
  the board (FR-65).
- Spec: a delta with twelve ADDED requirements and three MODIFIED (Given cells are locked,
  Highlighting follows every board change, Ukrainian page text, now also accessible names). Non-requirement baseline text is edited by hand at archive
  (see `design.md`).
- Tests: four new files, an extended `expectPageStructure`, a small CSS reader and a
  contrast function. No new dependencies, no Playwright, no screen-reader test (A-26).

Scope in: NFR-9, FR-59 to FR-65, accessible names of NFR-5. Scope out: 44 px phone targets
(G7), confirm or Undo and URL state (G8), real browsers and screen readers (TC-13,
NFR-7), `check:a11y` (needs Playwright), PageUp and PageDown, re-announcing an identical
hint sentence, the `#app` id selector in the stylesheet.

## Impact

- Affected specs: `play-page`. ADDED twelve requirements (Tab stop; Arrow, Home and End
  keys; Enter, Space and click; grid roles; names and states; label; status regions;
  violation cue; contrast; focus indicator; selector colours and touch-action; WCAG
  umbrella). MODIFIED: Given cells are locked, Highlighting follows every board change, Ukrainian
  page text. A normal merge, then the manual edits in
  `design.md`.
- Affected code: `src/ui/play-page.ts`, `src/ui/style.css`, new `src/ui/grid.ts`; tests
  under `tests/` and `tests/helpers/`. `index.html`, `src/main.ts`, `src/engine/` unchanged.
- Risks: jsdom cannot see layout or `:focus-visible` (TC-13), so a manual keyboard check
  covers them (task 6.10); the CSS reader understands flat rules only; the red stage is
  noisy because `expectPageStructure` has 35 call sites (the red-run file counts failing tests). See `design.md`.
- Commits carry `Slice: add-page-accessibility` and `Refs: FR-59` (and other ids touched).
