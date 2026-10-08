# Requirements amendment draft: reconcile the UX line with `main` (2026-10-09)

Status: **DRAFT, not signed.** Written 2026-10-09 about 00:15 (UTC+5:30) on branch `claude/reconcile-ux-main`, during the
open merge of `claude/heuristic-lovelace-5e57b4` (`72c4abd`) into `main` (`cf6ad37`). Basis: the user's decision of
2026-10-09 (autonomy-log row 77 on the UX line): the UX page model wins, and `main`'s accessibility rules that fit it
stay. No code is written before the user signs this in chat.

Ids: `main` still ends at FR-65, NFR-9, A-28, row 49, M17 and plan 4.7, so the UX line's ids (FR-66..73, NFR-10..15,
A-29..32, rows 50..77, M18..M21, plan 4.8) stand; nothing is renumbered again (BC-7: ids are never renumbered, so the
rewritten rows keep FR-59..FR-62).

## 1. Taken as they are

- From the UX line (signed 2026-10-05, row 66): FR-27, FR-39, FR-41, FR-42, FR-43, FR-57 (rules popover), FR-58,
  FR-66 to FR-73, NFR-5, TC-14, A-5, A-24, A-26, A-29 to A-32, the held rows in `docs/requirements-held.md`.
- From `main` (signed 2026-10-06, row 43): **FR-63** (hint and win messages are `role="status"`, present from the
  first render, focus never moves to them) and **FR-64** (a violating cell has a heavier border than an ordinary cell).
  The idle line of FR-71 gets no role (it is fixed text).
- FR-58 keeps the UX wording; row 48's acceptance (the spec's Reset clears only the highlights that do not come from
  the givens) carries over unchanged.

## 2. Rewritten rows (main text → proposed text)

**FR-59** (was: the board is one Tab stop with a roving tabindex; arrows, Home, End, Ctrl+Home, Ctrl+End move focus) →
*Every cell is its own Tab stop: the cells are reached by Tab in reading order (row by row, left to right), after the
size control and before the hint button (FR-68, FR-69); no element of the page has a `tabindex` attribute. Arrow,
Home and End keys are not handled by the page.* Source: the signed UX answer Q5 ("Tab, Enter/Space, no arrow keys").

**FR-60** (was: Enter or Space cycles a non-given cell like a click and does nothing on a given; a click moves the Tab
stop) → *Enter or Space on a focused non-given cell cycles it exactly as a click does (native button activation); on
a given cell (`aria-disabled="true"`) they change nothing; the cell keeps the focus after its value changes.* The clause
"a click moves the board's Tab stop" is **dropped, not re-expressed**: with no roving tabindex it has no object.

**FR-61** (was: `role="grid"` named «Поле N×N», `row` and `gridcell` roles, names «Рядок 2, стовпець 3: порожня»,
`aria-readonly` on givens, `aria-invalid` on violations) → *The board `[data-board]` has `role="group"` and the
Ukrainian `aria-label` «Поле N×N» for the size shown. Each cell's accessible name is its FR-70 label. Given cells carry
`aria-disabled="true"` (FR-69). Cells in a highlighted violation carry `aria-invalid="true"`; no other cell has it.*
Named contradictions resolved: (a) the name format of FR-70 wins over «…: порожня»; (b) `aria-readonly` is not allowed
on a button, so `aria-disabled` replaces it; (c) no `grid`, `row` or `gridcell` roles (the frozen design has the cells
directly inside the board, no row elements).

**FR-62** (was: the size `<select>` has a visible label «Розмір поля») → *The size radiogroup (FR-43) has the
accessible name «Розмір поля» (`aria-label`); each size button is labelled by its own visible text «Поле N×N».*
**Question 1 below**: the frozen design shows no visible «Розмір поля»; a visible label would change the pixels G2 pins to.

**FR-65** (was: …"cells, buttons and the size selector show a `:focus-visible` indicator; the size selector sets its own
text colour"…) → *Cell borders, the violation and given cues and the focus indicators have at least 3:1 contrast with
adjacent colours; every cell, every page button (header «Правила», the three size buttons, «Підказка», «Скинути»,
«Нова головоломка», «Зрозуміло», «Так, почати», «Скасувати») shows a `:focus-visible` indicator; the size buttons set
their own text and background colours; the board sets `touch-action: manipulation`.*

**NFR-9** (re-scoped) → *The play page meets WCAG 2.2 AA for what FR-43, FR-59 to FR-65, FR-67, FR-69 and FR-70 cover:
keyboard operation (2.1.1), name, role and value (4.1.2), labels (3.3.2), status messages (4.1.3), use of colour
(1.4.1), non-text contrast (1.4.11) and visible focus (2.4.7). Checked in jsdom and by stylesheet tests (A-28); the
automated real-browser check is the held NFR-13. Real screen-reader output is not tested.*

**A-20** (merged) → *Keyboard and screen-reader support are MVP: cells are buttons with Ukrainian labels (FR-69,
FR-70), the size control is a radiogroup (FR-43, FR-62), messages are status regions (FR-63), and every control shows
a visible focus indicator (FR-65); NFR-9 sets the WCAG scope; the held NFR-13 adds an automated real-browser check.
Screen-reader output itself is not tested (A-28).* (amended 2026-10-05 by the UX line and 2026-10-06 by `main`;
reconciled 2026-10-09)

**A-28** (rewritten) → *Accessibility (NFR-9, FR-59 to FR-65) is verified in jsdom (roles, names, states, focus
staying on a cell after activation) and by tests that read `src/ui/style.css` (WCAG contrast formula, `:focus-visible`
rules). Real browsers and screen readers are not tested in jsdom (TC-13); the held NFR-10 to NFR-13 add browser
checks in phase G1. The page follows `docs/frontend-conventions.md` (native buttons, radiogroup, native `<dialog>` and
popover), and all accessible names are Ukrainian (NFR-5). Left out by the user's decisions: 44 px phone targets (rows
43 and 66) and puzzle state in the URL (row 43).* The left-out item "confirm or Undo before progress is discarded" is
removed: FR-67 now asks for confirmation.

**Spec rule "no `id` attributes under the root"** (`openspec/specs/play-page/spec.md` DOM contract and two scenarios)
→ *Ids under the root exist only to wire the rules popover and the dialog (`popovertarget`, `aria-labelledby`): the
rules panel, its heading and the confirmation text. Each id ends in a number unique to the mount, so two pages mounted
on two roots in one document share no id. No `for` attribute is used.*

## 3. Other files that follow

- `docs/frontend-conventions.md` rule 1 (select, wrapping label, no ids), §2 "The board is an APG grid" (rules 5 to 9)
  and the gap table rows G1, G2, G9 are rewritten to the model above in the reconciliation change.
- `docs/requirements.md` status line: both lines' histories plus this amendment.

## 4. Tests of slice 6 that change on purpose (listed by FR, in the change folder's tasks)

| FR | Test files on `main` | Change |
|---|---|---|
| FR-59 | `play-page-keyboard`, `play-page-rendering`, `play-page-reset-accessibility` | roving-tabindex and arrow/Home/End tests replaced by "Tab order, no tabindex, keys do nothing" |
| FR-60 | `play-page-keyboard` | Enter/Space kept; "click moves Tab stop" removed; "focus stays" added |
| FR-61 | `play-page-semantics`, `play-page-rendering`, `play-page-page-text`, `play-page-reset-accessibility`, `play-page-stylesheet` | grid/row/gridcell → group; name format → FR-70; `aria-readonly` → `aria-disabled`; `aria-invalid` kept |
| FR-62 | `play-page-semantics`, `play-page-page-text`, `play-page-stylesheet` | select/label → radiogroup name |
| FR-63, FR-64 | `play-page-semantics`, `play-page-stylesheet` | selectors only (cells are buttons) |
| FR-65 | `play-page-stylesheet` | selector list → size buttons, rules and dialog buttons |
| NFR-9 | `play-page-wcag`, `play-page-stylesheet` | "button, select and gridcell" names → buttons and radios; "no positive tabindex" kept |
| (no ids) | `play-page-semantics` | "no id" → "only the three per-mount ids, none shared by two mounts" |

## 5. Questions for the user

1. **FR-62 visible label.** Default: accessible name only (`aria-label`, as the frozen design). Alternative: a visible
   «Розмір поля» text above the size buttons (changes the design G2 compares against, so the frozen reference would
   need an update, which is not pre-authorised).
2. **`aria-invalid` on button cells.** Default: keep it (ARIA 1.2 lists it as a global state; the main line's tests and
   conventions rely on it). Alternative: drop it and rely on the heavier border plus the text of the rule highlight.
3. **Paint.** The frozen design already has the FR-64 cue (2 px violation border plus stripes) and `:focus-visible`
   outlines on every control; its tokens give 3.68:1 (cell border on surface), 3.38:1 (cell border on page
   background) and 5.38:1 (violation border on its fill). So no design change is proposed; the merged stylesheet keeps
   `main`'s passing colours until G2 ports the palette, and G2 keeps the FR-65 test green. Confirm.
