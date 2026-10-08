# Change: update-controls-accessibility

## Why

The UX amendment signed on 2026-10-05 about 23:31 (autonomy-log row 66, UX decisions 4, 6 and 8) changes how the player operates the page. Three things: starting over must not silently destroy the player's moves (a confirmation dialog, FR-67, with A-29 asking also after a win); the size selector becomes a segmented control of three buttons that works on touch and by keyboard (FR-43 amended, FR-73, A-24); and cells become real buttons with Ukrainian labels so keyboard and screen-reader users can play (FR-69, FR-70, A-20). FR-42, FR-43 and FR-58 are amended to refer to the confirmation. This is slice C of `docs/mvp-capability-plan.md` section 4.8; it builds on slices A (`update-page-layout`) and B (`add-hinted-cell`) and is archived after them.

## What Changes

- Confirmation (FR-67): «Нова головоломка», a change to another size and «Скинути» ask first, in a native `<dialog>` `[data-dialog="confirm"]` opened with `showModal()`, only when the board has player entries (a hint-filled cell counts, A-8; after a win too, A-29). «Так, почати» closes the dialog and then performs the action; «Скасувати» and Escape close it and change nothing; no seed, no generator call.
- Size control (FR-43, FR-73, A-24): `[data-control="size"]` becomes a `role="radiogroup"` named «Розмір поля» with three `<button type="button" role="radio">` («Поле 4×4», «Поле 6×6», «Поле 8×8»), `aria-checked` on the shown size. Pressing the shown size is a no-op. The behaviour «a value outside the three sizes is ignored» is REMOVED (it has no input path any more); the two scenarios that tested it are deleted with it.
- Cells (FR-69, FR-70): every `[data-cell]` is a `<button type="button">`; givens carry `aria-disabled="true"` (not `disabled`); each cell has an `aria-label` «Рядок R, стовпець C, V» with the suffixes «, задано» and «, підказка».
- Marker interplay (FR-66): the cancelled confirmation and the shown-size press keep `cell-hinted`; confirmed new puzzle, size change and reset clear it.
- NFR-5 for the new texts, all defined in `src/ui/strings.ts` (the module created by change A).
- Spec: 5 ADDED requirements and 4 MODIFIED requirements (table below).

Baseline requirements touched by this change (the table of all four changes is in `openspec/changes/update-page-layout/proposal.md`):

| Baseline requirement | Action |
|---|---|
| Grid size selector | MODIFIED (radiogroup, confirmation, marker; the «value outside the three sizes is ignored» behaviour REMOVED) |
| New puzzle button | MODIFIED (confirmation, marker) |
| Reset button | MODIFIED (confirmation, marker) |
| Seed is chosen outside the engine, injectable and not shown | MODIFIED (the ignored-value step is replaced by the shown-size and cancel cases) |
| ADDED | Confirmation before discarding player entries; Pressing the shown size changes nothing; Cells are buttons; Cell labels; Ukrainian texts of the confirmation dialog, size control and cell labels |

Untouched, with the reading rule of the ADDED confirmation requirement: «Board rendering and default size», «Highlighting follows every board change», «Hint message stays until the next hint or a new puzzle», «Win message when solved» and the others (their new-puzzle and size steps take effect when the action is performed).

Out of scope: focus visibility, contrast and any automatic accessibility check (held NFR-13); touch-target size (held NFR-12); where the dialog is drawn (held NFR-14); arrow-key navigation of the radiogroup (A-24: not required); a language switch (FR-55); the win apostrophe (slice D); the logo (change E).

## Impact

- Affected specs: `play-page` (5 ADDED, 4 MODIFIED). Normal merge at archive, followed by the hand edits of non-requirement text listed in `design.md` (including deleting the Exclusions «Keyboard play and screen-reader support have no requirements (A-20)» and «Re-selecting the already selected size ...», which the new rules contradict).
- Affected code: `src/ui/play-page.ts` (size control, dialog, cell elements and labels), `src/ui/strings.ts`, `src/ui/style.css`; many tests (listed in `design.md`). No dependency; `src/engine/` untouched.
- Commits carry `Slice: update-controls-accessibility` and `Refs: FR-67` (or FR-43, FR-42, FR-58, FR-69, FR-70, FR-73, NFR-5).
