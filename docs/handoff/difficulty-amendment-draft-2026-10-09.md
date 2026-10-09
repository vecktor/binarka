# Requirements amendment draft: difficulty levels (2026-10-09)

Status: **DRAFT, not signed.** Nothing in `docs/requirements.md`, `docs/requirements-held.md` or any spec has been edited. No code is written before the user signs this in chat. Page text is Ukrainian; everything else is English. Wording marked **(to confirm)** is a proposal.

Basis:

- The user's decisions of 2026-10-09 in chat: four levels, one per technique of the measurement, with the page names «Розминка», «Задачка», «Головоломка», «Мозколамка» (levels 1 to 4); each level carries a short description of what it needs.
- The measurement `docs/qa/difficulty-measurement/README.md`. It is a scratch prototype and **not acceptance evidence**. It informs the numbers below and nothing more.

Ids: checked by grep, the next free ids are FR-74 (the file ends at FR-73, plus the older FR-44 to FR-56), NFR-16, A-33 and TC-15. No existing id is renumbered (BC-7). New rows are FR-74 to FR-94, NFR-16, NFR-17 and A-33 to A-39. No new TC row is needed.

Note on a reference: the confirmation rule that a level change follows is **FR-67** (the dialog); FR-58 is the reset button and only uses it. FR-58 is cited below only where reset is concerned.

Level names used below: 1 Basic = «Розминка», 2 = «Задачка», 3 = «Головоломка», 4 = «Мозколамка».

## 1. Amended rows (existing id, new text)

| ID | Phase | Area | Proposed text | Verification |
|---|---|---|---|---|
| FR-44 | Future -> **MVP** | Generator, Play page | Difficulty levels. A puzzle has a level from 1 to 4 (FR-81). Levels 2 to 4 exist for N = 6 and N = 8; N = 4 has only level 1 (A-34). The page offers the levels as FR-87 to FR-94 say. (amended 2026-10-09: was «Future … Difficulty grading of puzzles.»; user decision in chat 2026-10-09) | verify: local-verifiable |
| FR-13 | MVP | Generator | Given a size N, a seed and a level (default 1), the generator returns an N×N puzzle made of givens and empty cells. (amended: «and a level (default 1)» added; with level 1 the puzzle is identical to today's for every seed, FR-14) | verify: local-verifiable |
| FR-14 | MVP | Generator | The same N, the same seed and the same level always produce the identical puzzle. At level 1 the puzzle for any (N, seed) is the same as before this amendment. (amended: «and the same level», and the level 1 sentence added) | verify: local-verifiable |
| FR-15 | MVP | Generator | Every generated puzzle has exactly one solution (the solver reports 1), tested for N = 4 at level 1 and for N = 6 and 8 at levels 1 to 4, over a fixed set of seeds. This still holds because every technique of FR-74 to FR-76 is a **forced deduction**: it never fixes a cell to a value that a valid completion does not have. Level 4 is forced because it rests on a contradiction, and a contradiction of findViolations excludes that value in every completion. (amended: was «tested for N = 4, 6 and 8 over a fixed set of seeds») | verify: local-verifiable |
| FR-27 | MVP | Hints | The generator guarantees that every puzzle it returns can be solved from its givens using only the techniques of its level (FR-82): starting from the givens and applying the hint engine's fill, restricted to the techniques of levels 1 to L (FR-77), repeatedly reaches the full solution, and no step returns the «no rule applies» result (FR-25). Level 1 is today's wording: pair, sandwich and count (FR-19 to FR-21, in the order of A-7). Verified over the fixed seed set of FR-15 for every valid (N, level). FR-15, FR-14 and the bounds NFR-1 to NFR-3 still hold. (amended: «the three rules» became «the techniques of its level»; level 1 unchanged) | verify: local-verifiable |
| FR-25 | MVP | Hints | **Unchanged.** Note: the stored sentence says «трьох правил»; on a board where four techniques are in play the sentence is still shown only when none of the four applies. Kept as signed; see Q6. | verify: local-verifiable |
| FR-26 | MVP | Hints | **Unchanged.** | verify: local-verifiable |
| FR-22 | MVP | Hints | Each hint explanation names the line type and its 1-based number, matching the target cell's line. For a look-ahead hint (FR-80) the sentence names the cell by its row and its column. (amended: look-ahead clause added) | verify: local-verifiable |
| FR-30 | MVP | CLI | Unchanged; the new level errors are FR-86. | verify: local-verifiable |
| FR-42 | MVP | Play page | «Нова головоломка» replaces the board with a newly generated puzzle of the current size **and level**, and clears the messages and the hinted-cell marker; confirmation as FR-67. (amended: «and level») | verify: local-verifiable |
| FR-43 | MVP | Play page | **Text unchanged.** The size control still has exactly three buttons. The size/level interplay is FR-92. | verify: local-verifiable |
| FR-57 | MVP | Play page | The rules panel keeps its heading «Правила», the three rule items in the order signed, and the close button «Зрозуміло». **It additionally holds a second section on techniques 2 to 4 (FR-93).** The clause «exactly three list items» now means: exactly three items in the rules list; the techniques section is a separate list (FR-93). (amended: second section) | verify: local-verifiable |
| FR-58 | MVP | Play page | Unchanged except: reset keeps the current size **and level**. (amended: «and level») | verify: local-verifiable |
| FR-67 | MVP | Play page | The words «a change to another size» become «a change to another size or to another level». Nothing else changes. (amended) | verify: local-verifiable |
| FR-68 | MVP | Play page | In document order the page root holds: the header, the size control, **the level control `[data-control="level"]`, the level description `[data-level-description]`**, the board, the buttons, the message area. (amended: two items inserted after the size control) | verify: local-verifiable |
| FR-73 | MVP | Play page | Also: pressing the level button already shown is a no-op with the same list of non-effects as pressing the shown size. (amended) | verify: local-verifiable |
| NFR-1 | MVP | Performance | Generating one 4×4 puzzle (level 1) takes under 200 ms, worst case over the fixed seed set (A-13). Wording unchanged. | verify: local-verifiable |
| NFR-2 | MVP | Performance | Generating one 6×6 puzzle **at any level 1 to 4** takes under 500 ms, worst case over the fixed seed set, per level (NFR-16). (amended) | verify: local-verifiable |
| NFR-3 | MVP | Performance | Generating one 8×8 puzzle **at any level 1 to 4** takes under 3 s, worst case over the fixed seed set, per level (NFR-16). (amended) | verify: local-verifiable |
| NFR-4 | MVP | Usability | Scope extended to the sentences of FR-78 to FR-80: exactly one sentence each. (amended) | verify: local-verifiable |
| NFR-5 | MVP | Localization | Scope extended: the level group name «Складність», the four level names, the four description lines (FR-89) and the techniques section of the rules panel (FR-93) contain Cyrillic and no Latin letters; this includes every `aria-label`. (amended) | verify: local-verifiable |
| NFR-9 | MVP | Accessibility | Scope extended to the level radiogroup (FR-87, FR-88). (amended) | verify: local-verifiable |
| A-3 | MVP | Note | **Superseded** by FR-44: «no levels; a new puzzle button only» no longer holds. |  |
| A-7 | MVP | Note | Extended: see FR-77. |  |

## 2. New functional requirements

### Techniques (hint engine)

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-74 | MVP | Hints | **Line balance (technique 2).** A line holds exactly N/2 − 1 of a digit d and has at least two empty cells. For an empty cell e of that line, suppose e takes d and every other empty cell of the line takes the other digit. If that assignment puts three equal digits side by side anywhere in the line, e cannot be d, so the hint targets e with the other digit. | verify: local-verifiable |
| FR-75 | MVP | Hints | **Unique lines (technique 3).** A line has exactly two empty cells, and on every filled cell it agrees with a **complete** line of the same direction (no empty cell). Then each of its two empty cells takes the opposite of that complete line's digit in the same position, because otherwise the two lines would be identical. The hint targets one such cell. | verify: local-verifiable |
| FR-76 | MVP | Hints | **Look-ahead (technique 4).** For an empty cell and a value v: place v, then apply techniques 1 to 3 repeatedly, for **at most 4 forced steps** (a step is one forced cell). If the board then breaks a rule, that is, `findViolations` reports at least one violation (FR-1 to FR-6), the cell cannot hold v and the hint targets it with the other value. Among all such cells the hint uses the one whose contradiction is found in the fewest steps, then the order of FR-77. A contradiction that needs more than 4 forced steps is not a technique-4 deduction. | verify: local-verifiable |
| FR-77 | MVP | Hints | **Order and ceiling.** The hint engine picks the lowest technique that applies: pair, sandwich, count (A-7), then line balance, then unique lines, then look-ahead; within a technique the A-7 tie-breaks (rows before columns, lower line, lower cell); within look-ahead the shortest contradiction first. Selection stays deterministic (FR-23). On the page the hint engine may use **all four** techniques whatever the board's level (Q2). The generator calls it with the ceiling L of the puzzle being built. | verify: local-verifiable |

### Hint sentences (Ukrainian, one sentence each, NFR-4, NFR-5; all wording to confirm)

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-78 | MVP | Hints | Line balance. Example: «У рядку 3 є місце лише для одного нуля, і якщо поставити його сюди, решта клітинок дасть три однакові цифри поспіль, тож тут одиниця.» (to confirm) | verify: local-verifiable |
| FR-79 | MVP | Hints | Unique lines. Example: «Рядок 2 збігається з повним рядком 5 усюди, крім двох порожніх клітинок, тож тут має бути 1, інакше ці рядки були б однакові.» (to confirm) | verify: local-verifiable |
| FR-80 | MVP | Hints | Look-ahead. Example: «Якщо поставити 1 у рядку 3, стовпці 4, за кілька кроків порушиться правило, тож тут 0.» (to confirm; the example is the user's) | verify: local-verifiable |

### Generator and levels

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-81 | MVP | Generator | The level is an integer from 1 to 4 and defaults to 1. Anything else (0, 5, 2.5, NaN, a string) is rejected with an error and no puzzle is returned. A level above 1 with N = 4 is rejected the same way (A-34). N = 6 and 8 accept all four levels. | verify: local-verifiable |
| FR-82 | MVP | Generator | **Exact level.** A level-L puzzle (L from 1 to 4) is solvable with techniques 1 to L (FR-27) and is **not** solvable with techniques 1 to L − 1. For L = 1 only the first half applies. | verify: local-verifiable |
| FR-83 | MVP | Generator | The puzzle is deterministic from (N, seed, level) (FR-14), and **the solution for (N, seed) is the same at every level**: the fill phase does not depend on the level. A retry reshuffles from the continued random stream of the same seed (no `Math.random`, TC-8). | verify: local-verifiable |
| FR-84 | MVP | Generator | Generation makes a bounded number of attempts (proposed: 30, A-35). If they run out, the generator throws a distinct error and returns no puzzle; it **never returns a puzzle of the wrong level** and never loosens the level test. Over the fixed seed set of FR-15 the tests must show **0 run-outs** for every valid (N, level). | verify: local-verifiable |

### CLI

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-85 | MVP | CLI | `npm run cli -- --size 6 --seed 42 --level 3` prints the puzzle of that level, in the same shape as FR-28. Without `--level` the level is 1, and the output is byte-identical to today's. The value follows the digits-only grammar of FR-53. | verify: local-verifiable |
| FR-86 | MVP | CLI | A level that is not 1 to 4 (including `0`, `5`, `1.5`, an empty value or a missing value), and a level above 1 with `--size 4`, each makes the CLI print a one-sentence English error to stderr, exit non-zero and print nothing on stdout (NFR-8). A generator run-out (FR-84) does the same. | verify: local-verifiable |

### Play page

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-87 | MVP | Play page | The level control `[data-control="level"]` follows the size control. It is a `role="radiogroup"` with the accessible name «Складність» (`aria-label`, no visible label, as FR-62), holding exactly four `<button type="button" role="radio">` labelled «Розминка», «Задачка», «Головоломка», «Мозколамка», in this order. The button of the level shown has `aria-checked="true"`, the other three `"false"`. | verify: local-verifiable |
| FR-88 | MVP | Play page | «Розминка» is selected at start. The choice is not remembered on reload (TC-12), exactly like the size. One press of a button of another level starts a new puzzle of the current size and that level, and clears the messages and the hinted-cell marker. If the generator fails (including a run-out, FR-84), the previous board, messages, size and level are kept and `aria-checked` stays on the level shown. | verify: local-verifiable |
| FR-89 | MVP | Play page | Under the level control, a description line `[data-level-description]` shows one Ukrainian line for the selected level (it follows the level shown, not a pending press), plain text with no role and no id. Draft lines (to confirm): 1 «Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр у рядку.» 2 «Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць.» 3 «Додатково треба порівнювати рядки між собою і стовпці між собою: однакових не буває.» 4 «Додатково треба пробувати хід наперед: якщо за кілька кроків правило порушиться, тут інша цифра.» | verify: local-verifiable |
| FR-90 | MVP | Play page | A change to another level asks for confirmation under FR-67 when the board has player entries, and acts at once otherwise. Until «Так, почати», and after «Скасувати», the level, the size, the board and every message stay unchanged and no seed is taken. | verify: local-verifiable |
| FR-91 | MVP | Play page | **At size 4×4** only level 1 exists (A-34). **Open choice Q1:** (a, recommended) the level control stays visible, «Розminка» stays selected, the buttons for levels 2 to 4 carry `aria-disabled="true"` (focusable and readable, as FR-69), pressing them does nothing, and the description line shows «Для поля 4×4 є лише рівень «Розминка».» (to confirm); (b) the level control is hidden at 4×4. | verify: local-verifiable |
| FR-92 | MVP | Play page | Size and level interplay: «Нова головоломка» and «Скинути» keep the level (FR-42, FR-58). A size change to 6 or 8 keeps the level; a size change to 4 sets the level to 1 in the same single new puzzle and, if the board has player entries, one confirmation covers it (FR-67). Changing from level 2 to 4 at 6×6 does not change the size. | verify: local-verifiable |
| FR-93 | MVP | Play page | The rules panel (FR-57) holds, after the three rules, a second heading «Складніші прийоми» and exactly three one-sentence items, one each for techniques 2, 3 and 4. Draft (to confirm): «Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра.» / «Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього.» / «Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша.» The panel is unchanged after a level change. | verify: local-verifiable |
| FR-94 | MVP | Play page | All new page text lives in `src/ui/strings.ts` (the level group name, four names, four description lines, the 4×4 reason, the techniques heading and items); no Cyrillic elsewhere under `src/ui/` or `src/main.ts` (the existing spec rule). | verify: local-verifiable |

## 3. New non-functional requirements

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| NFR-16 | MVP | Performance | NFR-1 to NFR-3 apply **to every valid (N, level)**: (4, 1), (6, 1..4), (8, 1..4), each measured separately, worst case over the fixed seed set, on the test machine. The bounds are not relaxed (A-13, A-36). | verify: local-verifiable |
| NFR-17 | MVP | Performance | One hint computation, at any level, takes under 100 ms worst case over a fixed set of boards (N = 8, empty-ish boards included), because look-ahead runs on the player's click. **The number 100 ms is a proposal (to confirm), not measured.** | verify: local-verifiable |

## 4. New assumptions and notes

- **A-33:** the four techniques and their names are the user's decision of 2026-10-09; FR-74 to FR-76 turn the measurement's table into rule text. The text of FR-75 relies on the balance rule (a complete line has N/2 of each digit) to make the two empty cells opposite; the tests pin it with the prototype's cases. **ASSUMPTION: the prototype's definitions are the intended ones; the human ratifies.**
- **A-34:** 4×4 has only level 1 because the measurement found level 2 impossible (0/20 seeds) and level 4 possible for 1 seed in 20 (level 3 exists, but is not offered alone). The user was unsure 4×4 needs levels; this amendment takes the measurement's answer. Re-open if the user wants level 3 at 4×4.
- **A-35:** the attempt bound of 30 is the prototype's. At 6×6 level 4 with the 4-step cap the prototype needed up to 20 of 30 attempts over only 20 seeds, so the margin on a bigger fixed seed set is thin; the bound may need raising, which costs time (A-36).
- **A-36:** timing risk, recorded as the measurement found it: level 4 at 6×6 measured **359 ms (72% of NFR-2's 500 ms)** in an unoptimised prototype; level 4 at 8×8 746 ms (25% of 3 s); levels 2 and 3 36 ms or less. Stop condition in the style of A-31: if level 4 cannot hold NFR-2 and NFR-3 with margin, the slice stops and raises an amendment; the bounds are never relaxed silently. Proposed margin: worst case at most 50% of the bound on the test machine (the phase F tripwire). The implementation needs a faster level-4 check than the prototype's full rescan per carving step, or a different construction.
- **A-37:** the look-ahead cap is 4 forced steps. Uncapped, chains reach 25 steps, which no one-sentence hint can explain; a cap of 2 loses one 6×6 seed and is slower (measurement). Contradiction means a rule violation of `findViolations`, not "a line can no longer be completed".
- **A-38:** a run-out on the page is treated as a generator failure (FR-88): the old board stays and no automatic retry with a new seed is made. Page seeds are random (A-4), so this is possible in principle. **ASSUMPTION (to confirm).** NFR-6's eval may add the three new sentences as optional cases; not proposed as a requirement.
- **A-39:** the description line is plain text, not a status region and not linked by `aria-describedby`, because the play-page spec allows ids only for the popover and the dialog. The selected level is exposed by `aria-checked`.
- FR-69 style (`aria-disabled`, not `disabled`) is reused for the unavailable levels at 4×4 in option (a).

## 5. Held rows touched (docs/requirements-held.md)

The page rows add a control and a description line to a page whose design is frozen at `design/v0-screenshots/review-set-5/` (78 shots, no level control).

- **NFR-14 (design fidelity, per-shot 0.98): OPEN CONFLICT.** Every shot with the page body now differs by the level control and its description line, and the rules-panel shots differ by the techniques section. NFR-14 is still pending (not declared), so nothing fails today, but the reference would fail on day one of `check:visual`. Q3.
- **NFR-10** (6×6 on 375×812 fits without scrolling): the level control adds height; the sampled check may no longer pass.
- **NFR-12** (44×44 targets): the four level buttons and 4×4 disabled ones must meet it; four buttons with «Головоломка» and «Мозколамка» on a 320 px viewport may not fit on one row.
- **NFR-13** (focus and axe): extended to the level group.
- **NFR-11, NFR-15, TC-13, A-14:** not affected.
- **G1 and G2** (the gap-table phases): G1 browser checks must include the level control; G2 (the palette port) must style it. Both stay held and NOT-EARNED; this amendment makes no claim about them.

## 6. Verification per row

| Rows | How |
|---|---|
| FR-74 to FR-77 | Vitest unit tests in `tests/` with `@trace`, one case per technique (positive and near-miss), a contradiction case for the cap (a 5-step contradiction is not found), determinism, order. Boards written by hand. |
| FR-78 to FR-80 | Unit tests: one sentence, Ukrainian, row and column named; examples are pinned only after the user confirms the wording. |
| FR-81 to FR-84, FR-13 to FR-15, FR-27 | Unit tests over the fixed seed set for every valid (N, level): exact level (solve with 1..L, fail with 1..L−1), uniqueness, same solution across levels, determinism, 0 run-outs, level 1 identical to the pre-amendment output (golden file taken before the change). |
| FR-85, FR-86 | CLI tests, as FR-28 to FR-30 and FR-52 to FR-54. |
| FR-87 to FR-94 | jsdom tests, as FR-43, FR-62, FR-67 and FR-73; stylesheet tests for focus and contrast of the new buttons. |
| NFR-16, NFR-17 | Vitest timing tests per (N, level); noisy in CI (A-13); the 50% tripwire (A-36) is a review check on the measured numbers. |
| NFR-4, NFR-5, NFR-9 | extension of the existing tests. |

Each test is written first and seen failing (red) before the implementation. Mechanisms: all are existing Vitest tests; no new tool or dependency is needed.

## 7. Open questions for the user (each with a recommended default; "use defaults" answers all)

1. **4×4 UI (FR-91).** Default: option (a), the level control stays visible with levels 2 to 4 `aria-disabled` and a one-line reason. Alternative: hide it at 4×4. Why: a stable layout, and the player sees why.
2. **Hint ceiling (FR-77).** Default: on the page the hint may use all four techniques whatever the board's level, so a hint is never weaker than the puzzle. Alternative: only up to the board's level.
3. **Frozen design vs NFR-14 (section 5).** Default: the user first updates the design reference (adds the level control, the description line and the techniques section) and the page slice starts after that; the engine slice does not wait. Alternatives: waive NFR-14 for the changed shots; or ship the control without design approval and mark the page rows NOT-EARNED against NFR-14.
4. **Run-out and attempts (FR-84, A-35, A-38).** Default: 30 attempts, error on run-out, the page keeps the old board, no auto-retry; raise the bound only by a signed change.
5. **Level 4 timing (A-36).** Default: the engine slice starts with a spike for a fast level-4 check; target at most 50% of the bounds; if it cannot be reached, stop and ask, never relax. Also confirm the 4-step cap (A-37) and the proposed 100 ms hint budget (NFR-17).
6. **Ukrainian wording (FR-78 to FR-80, FR-89, FR-91, FR-93) and FR-25.** Default: accept the drafts and refine them during the page slice, with you confirming the final strings in chat; keep FR-25's «трьох правил» sentence unchanged for now (alternative: amend it to «Жодне з правил…»).

## 8. Slices proposal (each test-first; the order matters)

1. **`add-difficulty-engine`** (FR-74 to FR-77, FR-81 to FR-86, FR-13 to FR-15, FR-22, FR-27, NFR-16, NFR-17; sentences FR-78 to FR-80 once Q6 is answered): techniques in the hint engine, level parameter and exact-level generator, CLI `--level`. Starts with the level-1 golden file and the timing spike (Q5). Reports the measured numbers per (N, level) in `docs/qa/`.
2. **`add-level-selector`** (FR-87 to FR-94, FR-42, FR-57, FR-58, FR-67, FR-68, FR-73, NFR-4, NFR-5, NFR-9): the control, the description line, the 4×4 behaviour, the rules section, strings. Starts after Q3 is settled.
3. Follow-ups after both: update `docs/product-brief.md`, `openspec/specs/puzzle-engine/spec.md` and `openspec/specs/play-page/spec.md` in the slices' own changes; and mark FR-44 MVP and A-3 superseded in `docs/requirements.md` when this is signed.
