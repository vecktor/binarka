# Design: add-hinted-cell

## Goals

- Mark the cell that a hint filled with the class `cell-hinted` until the next board change (FR-39, FR-66), with the exact add / remove / keep list of FR-66, so a player can match the hint sentence to the cell.
- Keep the page code small: one piece of state and one toggle, reusing the existing `renderCell` and handlers.

## Non-goals

- How the cue looks (weight, border, marker, not colour alone): held NFR-11 and NFR-14 (`docs/requirements-held.md`), perception is a rendering fact, not claimed here. This slice pins the class and removes it in the right places; the CSS gives it a minimal non-colour cue only so the class is not invisible.
- The label suffix «, підказка» (FR-70) and the cases «cancelled confirmation» and «pressing the shown size» (FR-67, FR-73): change C. B's requirement text names them so the list is complete; their scenarios are written in C because B cannot test a dialog that does not exist yet.
- Any new page text: none (`src/ui/strings.ts` gets nothing from B).
- Authentication: none exists, so no redirect-to-login or forbidden case applies.

## Key decisions

1. **State is coordinates, not an element.** The page keeps `hinted: [row, col] | null` in the closure next to `board`. `setHinted(next)` removes the class from the previous cell (looked up in `cellEls`) and adds it to the new one, so "at most one cell" holds by construction. Trade-off: one more field to keep consistent versus scanning the DOM for the class on every change; the field is cheaper and testable. An element reference would dangle after `showPuzzle` rebuilds the board.
2. **Removal is attached to the existing mutation points, nowhere else.** `onBoardClick` (after the early return for a given cell, so a given click keeps the marker), the hint handler (after the early return for `kind !== 'fill'`, so a no-fill hint keeps it; a fill calls `setHinted(target)`, which moves it), the reset handler, and `showPuzzle` (after its size check, before it touches state). Because `showPuzzle` throws on a wrong-size puzzle before touching state, a failed generation keeps the marker without extra code. The rules panel and its buttons never reach the page code (native popover, change A), so they keep it trivially.
3. **Marker is independent of the win and violation states.** A hint that wins still marks its cell; a violating cell can also be hinted. No code couples the class to `refreshHighlights` or `updateWin`.
4. **Confirmation (change C) needs no change here.** C performs the action only after «Так, почати»; since the marker is removed inside the mutation points, a cancelled prompt never reaches them. C's tests add the two cases FR-66 lists (cancelled confirmation, shown size).
5. **Requirement layout.** FR-39's own text is MODIFIED in «Hint button fills one cell» (single owner B; the baseline text is kept and the marker added, with one new scenario «The filled cell carries the marker»). FR-66 is a new ADDED requirement, so B never touches «New puzzle button», «Reset button» or «Grid size selector» (owned by C): the removal by those actions is stated and tested under «Hinted cell marker».

None of these decisions is ADR-worthy: they add no dependency, storage or module contract.

## Data model

One new closure field: `hinted: [number, number] | null`, starting `null`, reset to `null` by `showPuzzle` and the reset handler, replaced by the hint handler. One new CSS class `cell-hinted` (no data attribute). No persistence (TC-12).

## Error handling strategy

No input and no failing call is added. The hint handler's existing paths (no board, `kind` 'none' or 'broken') return before touching the marker. A generator failure keeps the board and so the marker (scenario). Nothing can surface a raw exception.

## jsdom limits (TC-13)

jsdom has no layout and no popover behaviour, and lacks `showPopover`, `HTMLDialogElement.prototype.showModal` and `close` (verified). B's tests only read classes and text. The scenario «clicks `[data-action="rules"]` and then «Зрозуміло»» therefore proves only that the page code does not touch the marker; the real open-and-close happens in the browser and is part of the manual smoke step. Visibility of the cue and its distinguishability are held (NFR-11, NFR-14), reported NOT-EARNED.

## Tests that change deliberately (by FR)

- FR-39: in `tests/play-page-hint.test.ts` the scenarios «Hint fills the targeted cell», «Zero-based target maps to the one-based cell», «Count rule fills only one cell», «Hint-filled cell stays editable» and «No fill when the hint engine has no target» gain assertions about `cell-hinted` (added assertions, none weakened). The new file `tests/play-page-hinted-cell.test.ts` holds the FR-66 scenarios.
- No test of another FR changes. `snapshot()` in `tests/helpers/play-page.ts` already records the sorted class list; any existing hint test that compares snapshots of the target cell before and after a hint and now differs in `cell-hinted` is listed in the test commit and re-expressed (the added class is the point of the change); none is expected to be weakened.

For change C (recorded here so it is not forgotten): the B tests that press «Нова головоломка», change the size or press «Скинути» on a board holding a hint-filled cell (a player entry) will meet the confirmation dialog once C is in force; C lists them as deliberately changed and adds the confirmation step through its helper.

## Risks and mitigations

- **Two cells marked** (a forgotten removal): the scenario «A second hint moves the marker» and every table scenario assert "exactly one" or "none".
- **Marker removed by a given click or a no-fill hint**: the «keeps the marker» table.
- **Marker survives a new puzzle** (stale coordinates): `showPuzzle` resets `hinted`; the removal table covers new, size change and reset.
- **Marker lost on a failed generation**: the dedicated scenario.
- **Colour-only cue** (accessibility): out of this slice's claim; held NFR-11.

## Baseline text edits at archive

Archive normally (not `--skip-specs`) and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`, rebased on the baseline as archived by `update-page-layout`:

1. **Ownership:** add FR-66 to the owned list (and "FR-39 amended").
2. **DOM contract:** the cell element line gains "A cell that a hint filled carries the class `cell-hinted` (FR-66)".
3. **Purpose / Exclusions:** no change by B.

Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.
