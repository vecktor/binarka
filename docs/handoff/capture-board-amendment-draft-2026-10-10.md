# Requirements amendment draft: a capture-only board for the pixel check (2026-10-10)

Status: **SIGNED** by the user in chat on 2026-10-10 at about 14:24 (UTC+5:30), «signed, use defaults» (autonomy-log row 143). FR-119 and A-56 are in `docs/requirements.md`, with the defaults of section 4 folded in. The text below is kept as the record of what was signed.

## Basis

- **NFR-14** (moved into `docs/requirements.md` on 2026-10-10, autonomy-log row 138) compares the page with `review-set-13` per shot at 0.98.
  - The design shots show fixture boards (`design/v0/lib/boards.ts`). The page shows a puzzle generated from a seed.
  - So no board shot can reach 0.98, even after a perfect port (`docs/qa/visual-diff/README.md`, gap 1).
- **The user's decisions in chat on 2026-10-10, about 13:37 to 13:45 (UTC+5:30), autonomy-log row 140:**
  - (1) "capture only way": the capture loads the design's board into the page.
  - (2) **"fix design fixtures"**: the engine check found the 6×6 fixtures invalid (`docs/qa/g2/fixture-boards-check.txt`):
    - `fixtureBoard`, `hintBoard` and `solvedBoard` share givens that have at least two solutions. That breaks the rule that a puzzle is valid only if its solution is unique (AGENTS.md, Correctness rules).
    - `fourBoard` and `eightBoard` have exactly one solution, because they come from `generate(4, 3)` and `generate(8, 7)`.
    - The designer changes only the 6×6 givens, to a puzzle with exactly one solution. The look stays: the triple violation, the hinted cell, a solved board for `win`.
    - This makes a new review set, and the user moves the reference.
    - The loader rejects any board that does not have exactly one solution.

## Ids

Checked by grep in `docs/requirements.md` and `docs/requirements-held.md`. The highest ids in use are FR-118, NFR-18, A-55, TC-14 and BC-8. This draft takes **FR-119** and **A-56**. It adds no NFR, TC or BC row and renumbers nothing.

## 1. New rows

| ID | Phase | Area | Proposed text | Verification |
|---|---|---|---|---|
| FR-119 | MVP | Play page | **Capture-only board.** Before the page mounts, a capture harness MAY set one global value, `window.__binarkaCaptureBoard` (Q1), holding a board for the mount to show instead of a generated puzzle. The page reads it once, at mount. When it is absent, nothing changes: the mount generates as today and takes a seed. When it is present and valid, the page takes no seed for this mount, calls no generator, and shows that board as the board shown. The board's size is 4, 6 or 8, and its level is 1 to 4 (level 1 at 4×4, FR-91). The value holds the givens, the player entries and, optionally, the hinted cell. The summary, the size and level controls, the highlights (violations), the idle line and the win state follow from the board exactly as for a generated puzzle; a hint pressed later works as on any board. **The value is valid only if:** the size and level are allowed; the rows are size × size with digits 0 and 1 or empty; the givens alone have exactly one solution (`countSolutions` = 1); and no entry sits on a given. An invalid value is ignored: the page generates as if the value were absent, with no uncaught error (Q2). The page never writes the value, never stores it (TC-12), never reads it again after mount, and offers no control or URL that sets it. «Нова головоломка», «Почати» and a reload behave as today. (added 2026-10-10, G2) | verify: local-verifiable (jsdom: the board shown equals the value; an invalid value falls back to generation; no seed is taken when the value is valid); the pixel use is NFR-14 |
| A-56 | — | Assumption | The capture-only board is for the pixel check (NFR-14) and for tests. It is not a feature: no player can reach it from the page. It is not a back door around the uniqueness rule, because an invalid board is ignored. | — |

## 2. Rows touched (no text change, noted)

- **TC-12:** unchanged. The value is read and never stored.
- **FR-88 and FR-100:** unchanged. A press of «Почати» after a capture board makes a new puzzle as usual.
- **NFR-14:** unchanged. The pixel check uses FR-119 for every board shot. `scripts/visual-parity-adapters.mjs` sets the value from the shot's fixture board.

## 3. Work that follows the signature (proposed order)

1. **Design round, outside the iteration budget, with the user's yes in row 140:**
   - The designer changes the 6×6 givens of `fixtureBoard`, `hintBoard` and `solvedBoard` to one valid puzzle, chosen with the engine; for example `generate(6, s)` with a seed whose solution allows the look.
   - The look stays: the triple violation, the hinted cell «1» with its hint sentence, and the solved board.
   - The designer captures `review-set-14`. Every shot with a 6×6 board changes; no other shot should.
   - The design-reviewer confirms. The user moves the reference.
2. **OpenSpec slice `add-capture-board`:** the ADDED requirement for FR-119, tests first (red), then implementation, the battery and the review gate.
3. **G2 adapter:** the adapter sets `window.__binarkaCaptureBoard` from the shot's fixture board. Fixtures are copied from `design/v0/lib/boards.ts` into one JSON file that both the design and the adapter read (Q3).

## 3a. Since this draft was written (rows 141 and 142)

- Iteration 16 made the 6×6 fixtures valid (seed 5, kept by the user). The user moved the pixel reference to `review-set-14` (row 142).
- The design review of set 14 named three capture needs. The draft's FR-119 already allows each; the slice must prove them:
  - the `setup` shots show the fixture at **level 2**, so the capture value carries `level: 2` and the driver opens the sheet without «Почати»;
  - a **solved capture board shows the win state at mount**, with a jsdom assertion;
  - the `hint` shots press «Підказка» once on the fixture without the wrong entry.

## 4. Open questions, with defaults

- **Q1, the name and shape of the value.** Default: `window.__binarkaCaptureBoard = { size, level, givens: (0|1|null)[][], entries: (0|1|null)[][], hinted?: [row, col] }`.
- **Q2, an invalid value.** Default: ignore it silently and generate. Alternative: log one English `console.warn` line.
- **Q3, where the fixtures live. DECIDED by the user (row 142):** `design/v0/lib/boards.json`, read by the design's `boards.ts` and by the adapter, moved inside the slice `add-capture-board`, with a committed test asserting what `review-set-14/ENGINE-CHECK.txt` records (exactly one solution; exactly one `three` violation on the fixture; the first hint and its sentence on the hint board; the solved board solved).
- **Q4, the hint and win shots.** Default: the `hint` shot sets the fixture with no hinted cell and presses «Підказка». The design's hint must then be the page's first hint on that board, so the designer chooses the board to make it so. The `win` shot sets the solved fixture: the page shows the win state at mount, because the board is solved.
