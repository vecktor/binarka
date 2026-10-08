# Change: reconcile-ux-accessibility

## Why

`main` (slice 6, `add-page-accessibility`) and the UX line (slices A to C) were built on two page models. `main` makes the board an APG grid (`role="grid"`, rows, a roving `tabindex`, arrow keys, a `<select>` with a label, cell names «Рядок R, стовпець C: V», `aria-readonly`, no `id`). The UX line makes every cell a `<button>` with an FR-70 label, the size control a radiogroup, and adds the rules popover and the confirmation dialog, which need ids. Both cannot hold.

On 2026-10-09 the user decided (autonomy-log row 77) to keep the UX model, which matches the frozen design, and `main`'s accessibility rules that fit it. The user signed the rewritten FR-59, FR-60, FR-61, FR-62, FR-65, NFR-9, A-20, A-28 and the id rule at about 00:14 (row 78); FR-63 and FR-64 were kept, and after the audit the user signed four additions at about 01:20 (row 79): strict key handling and the focus sentences (FR-59, FR-60), the DOM rules of FR-61 and FR-62, and status regions that stay rendered while empty (FR-63). The merge is committed (signed) as `603b631` on `claude/reconcile-ux-main` with 81 failing tests (`docs/qa/reconcile-ux-main-merge-run.txt`).

## What Changes

- Spec (`play-page`): `main`'s accessibility requirements, appended unchanged by the merge, are rewritten to the signed text. Six requirements are renamed (their names described the grid model); fourteen are MODIFIED in all (the six renamed ones and the four UX-side ones below among them); «Arrow, Home and End keys move the focus» is REMOVED. The four UX-side requirements that repeated or contradicted `main`'s model are: «Given cells are locked», «Highlighting follows every board change», «Ukrainian page text», «Cells are buttons» (one sentence). Nothing is ADDED.
- Preamble edits (Purpose/DOM contract/Exclusions) cannot be made by a delta; `design.md` holds the exact replacement text and `tasks.md` applies it at archive.
- Code: `src/ui/play-page.ts` gains `role="group"` and `aria-label` on the board, `aria-invalid` on highlighted cells, `role="status"` on the hint and win messages. `src/ui/style.css` loses its dead select rules, keeps empty status regions rendered (FR-63), and meets the FR-65 colour scan. `src/ui/grid.ts` (Cyrillic outside `strings.ts`, unused by the UX page) is deleted. `docs/frontend-conventions.md` is rewritten to the button-cell model.
- Tests: written first from the delta. A test is added, changed or removed only when a changed requirement, spec sentence or project rule demands it; every other test stays untouched. `tasks.md` section 1 lists each one by FR with the sentence it derives from.
- Two points the signed text did not decide were taken by the user on 2026-10-09 (`design.md` «Decisions taken by the user»): `:has(` is allowed in the one idle-line selector (FR-65 focus requirement changed, rule 20 gets a row), and the UX colour literals are mapped onto the existing 13 tokens (no spec change; a small visual drift until G2).

Baseline requirements touched by this change:

| Baseline requirement (as merged) | Action | FR |
|---|---|---|
| The board is a single Tab stop | RENAMED «Every cell is its own Tab stop», MODIFIED | FR-59 |
| Arrow, Home and End keys move the focus | REMOVED (the absence is stated in FR-59) | FR-59 |
| Enter and Space cycle the focused cell and a click moves the Tab stop | RENAMED «Enter and Space activate a cell like a click», MODIFIED | FR-60 |
| The board, rows and cells have grid roles | RENAMED «The board is a labelled group of cell buttons», MODIFIED | FR-61 |
| Cells expose a Ukrainian name and their state | MODIFIED | FR-61 |
| The size selector has a visible Ukrainian label | RENAMED «The size radiogroup has an accessible name», MODIFIED | FR-62 |
| The hint and win messages are status regions | MODIFIED (the idle line has no role; empty regions stay rendered; one focus scenario) | FR-63 |
| A violation shows a cue besides colour | unchanged (checked) | FR-64 |
| Borders, cues and focus rings have enough contrast | MODIFIED (`button`, not `button, select`) | FR-65 |
| Cells, buttons and the selector show a visible, unobscured focus indicator | RENAMED «Cells and buttons show …», MODIFIED | FR-65 |
| The selector sets its own colours and the board disables double-tap zoom | RENAMED «The size buttons set their own colours …», MODIFIED | FR-65 |
| The page meets the WCAG 2.2 AA criteria of the accessibility requirements | MODIFIED | NFR-9 |
| Given cells are locked | MODIFIED | FR-33, FR-60 |
| Cells are buttons | MODIFIED (one sentence: arrow keys are not handled) | FR-69, FR-59 |
| Highlighting follows every board change | MODIFIED (one scenario deleted) | FR-38, FR-60 |
| Ukrainian page text | MODIFIED (cell-name pattern) | NFR-5 |

Out of scope: any change to the frozen design (answer to question 3); a visible «Розмір поля» label; 44 px phone targets and puzzle state in the URL (declined, rows 43 and 66); real screen-reader output (A-28); the browser checks of phase G1 (held NFR-10 to NFR-13) and the palette port of G2 (NFR-14).

## Impact

- Affected specs: `play-page` (6 RENAMED, 14 MODIFIED, 1 REMOVED). Normal merge at archive, then the preamble edit of `design.md` in the same commit.
- Affected code: `src/ui/play-page.ts`, `src/ui/style.css`, `src/ui/grid.ts` (deleted), `docs/frontend-conventions.md`; tests listed in `tasks.md`; no dependency; `src/engine/` untouched.
- Commits carry `Slice: reconcile-ux-accessibility` and `Refs: FR-59` (or FR-60, FR-61, FR-62, FR-63, FR-65, NFR-9).

Traces: FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, NFR-9, NFR-5, FR-33, FR-38, FR-43, FR-57, FR-58, FR-67, FR-69, FR-70, FR-71
