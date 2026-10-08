# Design: update-controls-accessibility

## Goals

- Ask before discarding the player's moves (FR-67): a native confirmation dialog for «Нова головоломка», a size change and «Скинути», only when player entries exist, also after a win (A-29).
- A size control that works by touch and keyboard: a segmented radiogroup of three real buttons (FR-43, A-24), with pressing the shown size a no-op (FR-73).
- Cells that keyboard and screen-reader users can play: `<button type="button">` with Ukrainian `aria-label`s and `aria-disabled` givens (FR-69, FR-70, A-20).
- Keep FR-66's list true when a confirmation is cancelled or the shown size is pressed.
- Every new text lives in `src/ui/strings.ts` (user decision 2026-10-05 about 23:40); no Cyrillic literal elsewhere in `src/ui/` or `src/main.ts` (the source scan of change A stays green).

## Non-goals

- Visible focus, contrast, automatic accessibility checks (held NFR-13), touch-target size (held NFR-12), the dialog's placement and the segmented look (held NFR-14). Not claimed here; jsdom cannot see them.
- Arrow-key navigation of the radiogroup: A-24 says Tab reaches every button and Enter or Space selects, arrow keys are not required. No roving `tabindex`.
- A language switch (FR-55), a user-visible error message for a generator failure (the baseline keeps the previous board silently; adding text would be a new requirement), the win apostrophe (slice D), the logo (change E).
- Authentication: none exists, so no redirect-to-login or forbidden case applies.

## Key decisions

1. **One "pending action" slot and one gate.** `requestAction(action)` runs `action()` at once when `hasEntries()` is false; otherwise it stores `pending = action` and calls `dialog.showModal()` (guarded by `dialog.hasAttribute('open')`). `hasEntries()` scans `board` against `givens`: any non-given cell that is not empty (hint-filled cells included, A-8; a solved board has entries, A-29). «Так, почати»: `const a = pending; pending = null; dialog.close(); a?.()`. «Скасувати»: `pending = null; dialog.close()`. The dialog's `close` event (Escape, and the asynchronous event after `close()`) sets `pending = null`. Because `a` was captured before `close()`, the late `close` event cannot drop a confirmed action. Trade-off: a closure slot is simpler than a state machine; with a modal dialog only one request can be open.
2. **Native `<dialog>` and `showModal()`, no fallback in production code.** The browser gives the focus trap, Escape and the backdrop. The page never feature-detects for jsdom; tests install `showModal`/`close` stubs. **ADR candidate** (not written now): native `dialog` and `popover` as the only modal mechanisms depend on browser support (A-14, held); if slice G finds a browser gap, an ADR is raised then.
3. **Dialog created once at mount**, as the last child of the root after the rules panel, closed, outside the board element and outside the FR-68 sequence. Its text and the two buttons are built from `strings.ts`.
4. **Size control is a radiogroup of three buttons built once.** `setChecked(n)` writes `aria-checked` on all three after a size has actually changed (success only); a failed generation, a cancel and the shown-size press never touch it. A click on the button of the size shown returns first (FR-73), before `requestAction`. This replaces `restoreSelect()`, the free-value `change` handling and every `value` override: the code has no path from a free value to a size. Each button keeps a hook `data-size-option` from the frozen design for the tests; the spec itself identifies buttons by order and label.
5. **Actions are plain functions called through the gate.** `startNewPuzzle()` (current size), `changeSize(n)` and `resetBoard()` hold today's logic (seed, generator, clearing messages, marker). Only the call path changes: new → `requestAction(startNewPuzzle)`, size button → `requestAction(() => changeSize(n))`, reset → `requestAction(resetBoard)`. The seed discipline (one seed per generation attempt) holds because a cancelled action never reaches them.
6. **Cells become buttons; labels come from one builder.** `showPuzzle` creates `button[type=button]` with the same data attributes and classes; `renderCell` sets text, `data-given`, `cell-given`, `aria-disabled` (givens only, never `disabled`) and `aria-label = cellLabel(r + 1, c + 1, value, given, hinted)` from `strings.ts` (pieces «Рядок», «стовпець», «порожньо», «задано», «підказка»). Change B's `setHinted` re-renders the old and the new hinted cell so the suffix follows the marker. A violation adds no suffix (FR-70): `refreshHighlights` does not touch labels. A hinted cell that also violates keeps «, підказка» (judgement call: the FR forbids a suffix for violation, not for the hint). The delegated click listener on `[data-board]` is unchanged (`closest('[data-cell]')`); given cells still return early.
7. **Requirement layout and the conflict rule.** C is the single owner of «Grid size selector», «New puzzle button», «Reset button» and «Seed is chosen outside the engine, injectable and not shown» (the last because its scenario «Seed calls follow the puzzles generated» used the removed ignored-value `change` and its text says "never for an ignored size value"). The confirmation is an ADDED requirement with a **reading rule**: wherever another requirement says a press of «Нова головоломка», a size change or «Скинути» has an effect, the effect happens when the action is performed. This lets «Highlighting follows every board change», «Hint message stays until the next hint or a new puzzle» and «Board rendering and default size» stay unmodified. «Hint message stays...» is a candidate for rewording, but its text "the next press of the new puzzle button" is true under the reading rule, so it is left to avoid a second owner.
8. **Texts.** `strings.ts` gains `SIZE_GROUP` («Розмір поля»), `CONFIRM = { text, yes, no }`, the cell label pieces and `cellLabel(...)`. The «Поле n×n» builder already exists from change A.

## Data model

New closure state: `pending: (() => void) | null`. Existing: `size`, `givens`, `board`, `cellEls`, `hinted` (B). New DOM: the radiogroup and its three buttons replace the `select`; cells are `button`s; one `dialog`. Nothing is stored (TC-12).

## Error handling strategy

- No free-text input exists, so there is no inline validation message to write; the only failure is the generator. A failed or wrong-size generation after «Так, почати» keeps the previous board, messages, `cell-hinted` and size, leaves `aria-checked` on the shown size, closes the dialog and throws nothing to the user (scenarios «A generator error keeps the previous board», «A generator result of the wrong size ...»). The baseline pins no error text; none is added (GAP noted, a new text would need a requirement).
- `showModal()` on an already open dialog would throw; the page guards it (a modal blocks the page, so it is unreachable in practice).
- Authentication does not exist: no redirect-to-login, no forbidden case (play-page Exclusions).

## jsdom limits (TC-13)

jsdom 29 here has `HTMLDialogElement` but no `showModal`, `show` or `close`, no `showPopover`, no popover behaviour and no layout (verified). Tests: install spies in `installPageLifecycle` that define `showModal` (sets `open`) and `close` (removes it) on `HTMLDialogElement.prototype` and remove them after each test; simulate Escape by dispatching `cancel` then `close` on the dialog; assert `aria-checked`, `role`, `type`, `tabindex`, `disabled` and `aria-disabled` as attributes. Enter and Space are native button activation and jsdom does not turn a keydown into a click, so FR-69 is covered by the element type and attributes. Tab order, focus rings, contrast, touch targets and pixels are the held NFR-12, NFR-13, NFR-14 and are not claimed.

## Tests that change deliberately (by FR)

Listed in the test commit message; none is weakened, each is re-expressed for the new control and the confirmation:

- FR-43: `tests/play-page-size-selector.test.ts` is rewritten for the radiogroup (structure, default, choose 4×4, choose 8×8 after play with the dialog, after a win, going back, one seed per change, not remembered, generator error, wrong-size result, hint and win at 4 and 8, violations in givens). Deleted on purpose with the behaviour: «Value outside the offered sizes is ignored», «... with no option selected», «an ignored value leaves the page working» and the ignored-value half of «the selector always shows the size of the board that is shown». In `tests/helpers/play-page.ts`: `sizeSelect` becomes `sizeControl`/`sizeButton`, `selectSize` presses the button and confirms when the dialog opened, `changeWithReportedValue` and `ReportedValueResult` are deleted; `installPageLifecycle` installs the dialog stubs.
- FR-42: `tests/play-page-new-puzzle-and-seed.test.ts`: «New puzzle after play» and «mid-game removes highlights» confirm with `[data-confirm="yes"]`; «keeps the chosen size» reads `aria-checked` instead of the select.
- FR-43, FR-51: the same file: «Seed calls follow the puzzles generated» replaces the ignored-value step with the shown-size press (seeds 1 to 4, sizes 6, 6, 4, 8 unchanged); «Hint message cleared by a size change» confirms.
- FR-58: `tests/play-page-rules-and-reset.test.ts` reset tests confirm after entries; «Reset takes no seed» checks the untouched, confirmed and cancelled paths; the size assertions read `aria-checked`.
- FR-38: `tests/play-page-highlighting.test.ts` «A size change recomputes the highlights» presses the size button (and confirms when entries exist).
- FR-66: `tests/play-page-hinted-cell.test.ts` (change B): removal by «Нова головоломка», size change and «Скинути» goes through the dialog; two cases are added there for cancelled confirmation and the shown size (in the C tests below).
- FR-68: `tests/play-page-layout.test.ts` (change A): the order scenario's «Скинути» run confirms.
- NFR-5: `tests/play-page-page-text.test.ts` reads the size labels from the buttons instead of `option` elements; the `label`-attribute collection test builds its own `select` element since the page has none.
- FR-31, FR-39, FR-40 and the win tests that call `selectSize` keep their assertions; they only use the new helper.
- New: `tests/play-page-confirm.test.ts` (FR-67, FR-66, FR-42, FR-43, FR-58, A-29), `tests/play-page-size-control.test.ts` (FR-43, FR-73), `tests/play-page-cells.test.ts` (FR-69, FR-70), `tests/play-page-controls-text.test.ts` (NFR-5).

## Risks and mitigations

- **A confirmed action dropped by the late `close` event**: the action is captured before `close()`; scenario «Escape ... drops the action» plus the confirmed scenarios.
- **Entries miscounted** (a given counted, a hint-filled cell missed, a cleared cell counted): scenarios «A hint-filled cell counts», «Entries that were cleared again do not count», «A solved board still asks».
- **Marker or `aria-checked` changed by a cancelled request**: scenarios «Скасувати leaves everything unchanged» and «aria-checked stays on the shown size until the confirmation».
- **Seed taken for a cancelled or shown-size press**: scenarios «A cancelled or no-op action takes no seed» and «The shown size is a no-op at every size».
- **Cell buttons submit or scroll** (form defaults): `type="button"` on every cell, tested.
- **Stale labels after B's marker moves**: `setHinted` re-renders both cells; scenario «Labels follow every change».
- **Visible behaviour jsdom cannot see** (focus ring, dialog placement): not claimed; held NFR-13 and NFR-14, reported NOT-EARNED.

## Baseline text edits at archive

Archive normally (not `--skip-specs`) and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`, rebased on the baseline as archived by A and B:

1. **Purpose:** "a grid size selector (4×4, 6×6, 8×8; 6×6 at start)" becomes "a segmented size control"; mention the confirmation dialog and the cell buttons.
2. **Ownership:** add FR-67, FR-69, FR-70, FR-73 (FR-42, FR-43, FR-58 amended); NFR-5 text covers "dialog, size control, cell labels".
3. **DOM contract:** replace "Size selector: ... a select with options 4, 6 and 8" with the radiogroup and its three buttons; "Cell element" is a `button`; add `[data-dialog="confirm"]`, `[data-confirm="yes"|"no"]`; the seed-source sentence "each accepted size change" becomes "each performed size change" and mentions the confirmation; the mounting sentence lists the radiogroup and the dialog; the fixtures paragraph adds the `showModal` and `close` stubs.
4. **Exclusions:** DELETE "Keyboard play and screen-reader support have no requirements (A-20)" (A-20 now requires them; focus and automatic checks stay held) and DELETE "Re-selecting the already selected size: browsers fire no `change`, so no scenario asserts it" (FR-73 specifies it). Add "Arrow-key navigation of the size control is not required (A-24)."
5. The phrase "size selector option labels" in the requirement «Ukrainian page text» (owned by A) is left as it is: it stays true for a control with no options.

Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`; grep the baseline for "select" and "Keyboard play": no stale sentence may remain.
