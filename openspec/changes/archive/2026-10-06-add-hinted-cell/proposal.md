# Change: add-hinted-cell

## Why

Today a hint fills a cell and the player can no longer tell which cell the hint just filled: it looks like any other player entry. UX decision 3 of the amendment signed on 2026-10-05 about 23:31 (autonomy-log row 66) asks for a marker on the cell that a hint filled, kept until the next board change, so the hint sentence ("Між двома нулями у стовпці 2 ...") can be matched with the cell. Requirements: FR-66 (new) and FR-39 (amended). This is slice B of `docs/mvp-capability-plan.md` section 4.8; it builds on slice A (`update-page-layout`) and is archived after it.

## What Changes

- The cell that the hint button filled carries the class `cell-hinted` (FR-39, FR-66). At most one cell carries it at any time. A given never carries it.
- Removal and keeping are pinned exactly (FR-66). The marker is removed by a click on a non-given cell (including the hinted cell itself), by a hint that fills another cell (the marker moves to it), by «Нова головоломка», by a size change and by «Скинути». It is kept by a click on a given cell, by a hint that fills no cell, and by opening or closing the rules panel. A failed generation (the previous board is kept) also keeps it.
- No new page text: B adds nothing to `src/ui/strings.ts`. The label suffix «, підказка» that reads this marker belongs to change C (FR-70).
- Spec: MODIFIED «Hint button fills one cell» (FR-39) and ADDED «Hinted cell marker» (FR-66). No other baseline requirement is touched.

Baseline requirements touched by this change (the table of all four changes is in `openspec/changes/update-page-layout/proposal.md`):

| Baseline requirement | Action |
|---|---|
| Hint button fills one cell | MODIFIED (owner: this change) |
| none other | new ADDED requirement «Hinted cell marker» |

Out of scope: how the cue looks (weight, border, marker shape, not colour alone) is held NFR-11 and NFR-14; the confirmation dialog and the shown-size press, whose «keeps the marker» cases belong to change C (they need the dialog and the radiogroup); the accessibility label suffix (C); FR-27 (slice F).

## Impact

- Affected specs: `play-page` (1 MODIFIED, 1 ADDED). Normal merge at archive.
- Affected code: `src/ui/play-page.ts` (one state field and a class toggle), `src/ui/style.css` (a non-colour cue, minimal), `tests/`. No dependency; `src/engine/`, `src/ui/strings.ts` untouched.
- Ordering: archived after A. B's removal-by-«Скинути», «Нова головоломка» and size-change tests run without a dialog; change C lists them as deliberately changed (they now go through the confirmation).
- Commits carry `Slice: add-hinted-cell` and `Refs: FR-66` (or FR-39).
