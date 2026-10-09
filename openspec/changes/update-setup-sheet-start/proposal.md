# Change: update-setup-sheet-start

> **Slice S of three, archived first.** Order: `update-setup-sheet-start` (this folder), then `add-theme-switch`, then `add-english-version`, then G2 (NFR-14). The later two write their MODIFIED blocks against the play-page spec as it will be after this folder is archived. Do not start section 2 of `tasks.md` (tests) or write `src/` code before task 1.1 to 1.3 pass (the design round: build against the new review set, `review-set-12`, once the design-reviewer's confirming run has no blocking finding, without declaring it the pixel reference, autonomy-log row 119).

## Why

The user tested the page and found that a press on a size or level button starts a puzzle at once and closes the sheet, so size and level cannot be chosen together and a size change keeps the earlier level (autonomy-log row 114, FR-97(a), FR-92). He chose **"Select, then «Почати»"**. The amendment was signed in chat on 2026-10-10 about 00:03 (UTC+5:30) with all defaults (autonomy-log row 118; draft `docs/handoff/setup-sheet-start-amendment-draft-2026-10-09.md`, Q1 to Q10, A-45 to A-47). This slice builds the page side of it: FR-100 (marked choice), FR-101 («Почати») and the amended rows FR-43, FR-59, FR-65 to FR-67, FR-73, FR-87, FR-88, FR-90 to FR-92, FR-94 to FR-99 and NFR-5, NFR-9, NFR-12, NFR-13.

## What Changes

- A size or level press only **marks** the choice (`aria-checked` moves, the sheet stays open, focus stays on the pressed button, no seed, no generator call, no dialog). The summary keeps showing the board shown (FR-73, FR-95, FR-100).
- A new button `[data-action="setup-start"]` «Почати» in the sheet, after the level control and before «Закрити». One press makes **one** puzzle with the marked size and level, with one confirmation when the board has entries; it is never a no-op (FR-101, Q2). Closing by «Закрити», Escape or light dismiss discards the marked choice (FR-100, FR-97(d)); a cancelled confirmation drops the pending action (FR-98, A-45).
- Marking 4×4 sets the marked level to «Розминка» and shows the 4×4 state; marking 6×6 or 8×8 keeps «Розминка» (FR-91, Q1).
- Focus: «Почати» and «Закрити» return it to the summary button; a marking press moves none (FR-59, FR-97). `aria-checked` now means the marked choice while the sheet is open (A-47).
- NFR-12 gains «Почати» (and the cleanup for the summary button and «Закрити»); NFR-13 gains the marked state; the label «Почати» is a `src/ui/strings.ts` entry (FR-94, NFR-5).
- **Footer-1** (wireframe signed 2026-10-10, autonomy-log row 120, completing the placeholder of TD-Q15): «Почати» (primary) and «Закрити» (secondary) form one sticky footer row, both direct children of the sheet. The requirements pin the DOM order only; the drawing is built against `review-set-12` (being made) and stays held NFR-14. Still open and left to that set: whether FR-65 gains a primary colour token (the requirement allows one); see `design.md`.

Baseline `play-page` requirements touched (4 ADDED, 21 MODIFIED, 0 REMOVED):

| Requirement | Action | FR |
|---|---|---|
| Marked choice, Start button | ADDED | FR-100, FR-101 |
| The start button and the sheet buttons meet the touch-target floor | ADDED | NFR-12, FR-101 |
| The accessibility sweep covers a marked choice that differs from the board | ADDED | NFR-13, FR-100, FR-101 |
| Grid size selector, Level selector, Only the first level exists at 4x4, Size and level interplay | MODIFIED | FR-43, FR-73, FR-87, FR-91, FR-92, FR-100 |
| Pressing the shown size changes nothing (name kept), A level change follows the confirmation rule (name kept) | MODIFIED | FR-73, FR-90, FR-101 |
| Summary button, Setup sheet, Choosing and closing the sheet, Sheet and confirmation | MODIFIED | FR-95 to FR-98, FR-100, FR-101 |
| Confirmation before discarding player entries, Page retry on a run-out, Seed is chosen outside the engine… | MODIFIED | FR-67, FR-88, FR-101 |
| Hint message stays…, Highlighting follows every board change, Hinted cell marker | MODIFIED | FR-66, FR-101 |
| Every cell is its own Tab stop, Cells and buttons show a visible, unobscured focus indicator, The summary and level buttons set their own colours | MODIFIED | FR-59, FR-65, FR-101 |
| The page meets the WCAG 2.2 AA criteria…, Ukrainian texts of the summary, the setup sheet… | MODIFIED | NFR-9, NFR-5, FR-94, FR-101 |

Out of scope: how «Почати» and the footer are drawn, the primary fill, inner scroll of the taller sheet, and the desktop rules panel (signed R3: one column of about 40rem, height fits the content; design only, no FR; held NFR-14, NFR-10); the theme and language controls (the next two folders); an error text for a failed generation (A-38); the engine; the pixel reference (the user moves it).

## Impact

- Affected specs: `play-page` (4 ADDED, 21 MODIFIED; `openspec archive` warns about more than 10 deltas, which is non-blocking). Archive normally, then make the baseline text edits listed in `design.md`.
- Affected code: `src/ui/play-page.ts`, `src/ui/strings.ts`, `src/ui/style.css`; tests under `tests/` and `e2e/` (the deliberate changes are in `design.md` and `tasks.md` 1.2). No dependency; `src/engine/` untouched.
- Commits that touch `src/` carry `Slice: update-setup-sheet-start` and `Refs:` with the FR ids touched (FR-43, FR-100, FR-101 and the amended rows).
