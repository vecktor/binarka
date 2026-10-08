# Бінарка — Requirements

Status: **SIGNED OFF 2026-10-04 16:13, AMENDED 2026-10-04 18:41 after a scope change** (autonomy-log rows 9 and 10); amended rows are marked "(amended 2026-10-04: …)"; **the amendment was re-signed by the user on 2026-10-04 at 18:45 (UTC+5:30)** (autonomy-log row 11); **FR-43 was restored by the user on 2026-10-04 at about 21:00 (UTC+5:30) after both slices were archived early, and the restoring amendment was signed off by the user in chat at that time** (autonomy-log rows 22 and 24); **the accessibility amendment (NFR-9, FR-57 to FR-63, A-26) was signed by the user on 2026-10-06 at about 16:05 (UTC+5:30)** (autonomy-log row 34).

Narrative: `docs/product-brief.md`. Stack: `docs/adr/0001-stack.md`.

Conventions used below: N is the grid size (even); "line" means a row or a column; rows and columns are numbered from 1 in all user-facing text; a cell is empty, 0 or 1; "givens" are the cells filled by the generator.

## Functional Requirements (FR)

### Rules (rule checker)

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-1 | MVP | Rules | The checker flags three or more equal digits side by side in a row, and reports the row number and the cells involved. | verify: local-verifiable |
| FR-2 | MVP | Rules | The checker flags three or more equal digits side by side in a column, and reports the column number and the cells involved. | verify: local-verifiable |
| FR-3 | MVP | Rules | The checker flags a row as soon as it holds more than N/2 zeros or more than N/2 ones, and reports the row number; a row with at most N/2 of each digit is not flagged even if it is incomplete. | verify: local-verifiable |
| FR-4 | MVP | Rules | The checker flags a column as soon as it holds more than N/2 zeros or more than N/2 ones, and reports the column number; a column with at most N/2 of each digit is not flagged even if it is incomplete. | verify: local-verifiable |
| FR-5 | MVP | Rules | The checker flags two rows that are both complete and identical, and reports both row numbers; a row with any empty cell is never compared. | verify: local-verifiable |
| FR-6 | MVP | Rules | The checker flags two columns that are both complete and identical, and reports both column numbers; a column with any empty cell is never compared. | verify: local-verifiable |
| FR-7 | MVP | Rules | Empty cells never count as a digit: a partially filled grid that breaks none of the three rules yields no violations (no false positives). | verify: local-verifiable |
| FR-8 | MVP | Rules | A grid with every cell filled and no violation is recognised as solved. | verify: local-verifiable |
| FR-9 | MVP | Rules | A grid with any empty cell, or with any violation, is not recognised as solved. | verify: local-verifiable |

### Solver

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-10 | MVP | Solver | Given a partially filled grid, the solver reports 0 when no valid completion exists. | verify: local-verifiable |
| FR-11 | MVP | Solver | Given a partially filled grid with exactly one valid completion, the solver reports 1. | verify: local-verifiable |
| FR-12 | MVP | Solver | Given a partially filled grid with more than one valid completion, the solver stops searching at the second solution and reports "2 or more". | verify: local-verifiable |

### Generator

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-13 | MVP | Generator | Given a size N and a seed, the generator returns an N×N puzzle made of givens (0 or 1) and empty cells. | verify: local-verifiable |
| FR-14 | MVP | Generator | The same seed and the same N always produce the identical puzzle. | verify: local-verifiable |
| FR-15 | MVP | Generator | Every generated puzzle has exactly one solution (the solver reports 1), tested for N = 4, 6 and 8 over a fixed set of seeds. | verify: local-verifiable |
| FR-16 | MVP | Generator | An odd N is rejected with an error and no puzzle is returned. | verify: local-verifiable |
| FR-17 | MVP | Generator | An N below 4 is rejected with an error and no puzzle is returned (minimum pinned to 4, see A-9). | verify: local-verifiable |
| FR-18 | Future | Generator | Grid sizes 10 to 16 are tested and offered on the page. (amended 2026-10-04: was "N of 10 and above are supported, tested and offered"; sizes are capped at 16 by FR-49) | — |
| FR-49 | MVP | Generator | An N above 16 is rejected with an error and no puzzle is returned (maximum pinned to 16, see A-9). | verify: local-verifiable |
| FR-50 | MVP | Generator | A size that is not an integer (for example 4.5, NaN, Infinity) is rejected with an error and no puzzle is returned. | verify: local-verifiable |
| FR-51 | MVP | Generator | A seed that is not an integer from 0 to 2147483647 (2^31 − 1) is rejected with an error and no puzzle is returned. | verify: local-verifiable |

### Hints (hint engine)

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-19 | MVP | Hints | Pair rule («0 0 _»): when two equal digits stand side by side in a line and a cell next to the pair is empty, the hint targets that cell with the opposite digit and explains it in one Ukrainian sentence, e.g. «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця.» | verify: local-verifiable |
| FR-20 | MVP | Hints | Sandwich rule («0 _ 0»): when an empty cell sits between two equal digits in a line, the hint targets that cell with the opposite digit and explains it in one Ukrainian sentence, e.g. «Між двома нулями у стовпці 2 може стояти лише одиниця.» | verify: local-verifiable |
| FR-21 | MVP | Hints | Count rule: when a line already holds N/2 of one digit and has an empty cell, the hint targets one empty cell of that line with the other digit and explains it in one Ukrainian sentence, e.g. «У рядку 5 вже три нулі, тож решта клітинок — одиниці.» | verify: local-verifiable |
| FR-22 | MVP | Hints | Each hint explanation names the line type (рядок or стовпець) and its 1-based number, matching the target cell's line. | verify: local-verifiable |
| FR-23 | MVP | Hints | When several hints apply, the choice is deterministic: repeated calls on the same board return the same cell, value and explanation (selection order pinned in A-7). | verify: local-verifiable |
| FR-24 | MVP | Hints | A hint only ever targets an empty cell; it never changes a given or an already filled cell. | verify: local-verifiable |
| FR-25 | MVP | Hints | When none of the three rules applies, the hint targets no cell and returns one Ukrainian sentence saying so, e.g. «Жодне з трьох правил зараз не підказує наступного ходу.» (user decision, A-5). | verify: local-verifiable |
| FR-26 | MVP | Hints | When the board currently breaks a rule, the hint targets no cell and returns one Ukrainian sentence asking the player to fix the highlighted rule first, e.g. «Спершу виправте порушення правил, підсвічене на полі.»; this takes precedence over FR-19 to FR-21 and FR-25 (user decision, A-6). | verify: local-verifiable |
| FR-27 | Future | Hints | The generator guarantees that every puzzle can be solved from its givens using only the pair, sandwich and count rules, so a hint is always available on a correct board. | — |
| FR-56 | Future | Hints | Hint sentences are also available in English. | — |

### CLI

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-28 | MVP | CLI | `npm run cli -- --size 6 --seed 42` prints the puzzle for that size and seed as N lines of N space-separated tokens, `0` or `1` for givens and `.` for empty cells (shape pinned in A-10). | verify: local-verifiable |
| FR-29 | MVP | CLI | When `--size` or `--seed` is omitted, the CLI uses size 6 and seed 1 respectively (pinned in A-10). | verify: local-verifiable |
| FR-30 | MVP | CLI | An invalid size (odd, below 4, above 16, or not a number by the grammar in FR-53) makes the CLI print a one-sentence English error to stderr and exit with a non-zero code. (amended 2026-10-04: error is English and goes to stderr; above 16 added; "not a number" follows FR-53) | verify: local-verifiable |
| FR-52 | MVP | CLI | An invalid seed (not valid by the grammar in FR-53, or above 2147483647) makes the CLI print a one-sentence English error to stderr, exit with a non-zero code and print nothing on stdout. | verify: local-verifiable |
| FR-53 | MVP | CLI | The CLI accepts a `--size` or `--seed` value only when the whole value is ASCII digits (`^[0-9]+$`); leading zeros are allowed (`06` means 6); anything else (`6.5`, `+6`, `-2`, `1e1`, `0x6`, an empty value) is invalid. | verify: local-verifiable |
| FR-54 | MVP | CLI | A CLI option given without a value (for example `--size` as the last argument) or an unknown option makes the CLI print a one-sentence English error to stderr and exit with a non-zero code. | verify: local-verifiable |

### Play page

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-31 | MVP | Play page | The page renders an N×N grid of a generated puzzle; N is 6 by default. | verify: local-verifiable |
| FR-32 | MVP | Play page | Given cells are rendered distinctly from player cells (a distinct marker on the cell element). | verify: local-verifiable |
| FR-33 | MVP | Play page | Clicking a given cell does not change it (user decision, A-11). | verify: local-verifiable |
| FR-34 | MVP | Play page | Clicking a non-given cell cycles its shown text empty → «0» → «1» → empty; cells show the digits 0 and 1, not colours. | verify: local-verifiable |
| FR-35 | MVP | Play page | Cells that form three or more equal digits side by side in a row or column are highlighted. | verify: local-verifiable |
| FR-36 | MVP | Play page | A row or column holding more than N/2 of one digit is highlighted. | verify: local-verifiable |
| FR-37 | MVP | Play page | Two identical complete rows, or two identical complete columns, are highlighted. | verify: local-verifiable |
| FR-38 | MVP | Play page | Highlighting is recomputed after every board change (a cell click or a hint fill): a broken rule is highlighted immediately and its highlight disappears once the rule is no longer broken (timing pinned in A-12). | verify: local-verifiable |
| FR-39 | MVP | Play page | Pressing the hint button fills the cell the hint engine targets with its value. | verify: local-verifiable |
| FR-40 | MVP | Play page | Pressing the hint button shows the hint engine's sentence on the page, including the no-hint and broken-rule sentences when no cell is filled. | verify: local-verifiable |
| FR-41 | MVP | Play page | When the grid becomes solved, the page shows a Ukrainian win message, e.g. «Вітаємо, головоломку розв'язано!» | verify: local-verifiable |
| FR-42 | MVP | Play page | The «Нова головоломка» button replaces the board with a newly generated puzzle of the current size and clears the hint and win messages. | verify: local-verifiable |
| FR-43 | MVP | Play page | A size selector offers 4×4, 6×6 and 8×8 with the labels «Поле 4×4», «Поле 6×6» and «Поле 8×8»; 6×6 is selected at start; choosing a size starts a new puzzle of that size and clears the hint and win messages; a value outside the three sizes is ignored; the choice is not remembered on reload (TC-12). (amended 2026-10-04: cut 0 applied at 18:40, then RESTORED at about 21:00 by the user's decision, autonomy-log row 22) | verify: local-verifiable |
| FR-57 | MVP | Play page | The board is a single Tab stop: exactly one cell has `tabindex="0"` and every other cell has `-1`. Arrow keys move the focus one cell and stop at the board's edges; Home and End move it to the first and last cell of the row; Ctrl+Home and Ctrl+End move it to the first and last cell of the board. (amended 2026-10-06, A-26) | verify: local-verifiable |
| FR-58 | MVP | Play page | Enter or Space on a focused non-given cell cycles it exactly as a click does; on a given cell they change nothing. Clicking a cell moves the board's Tab stop to that cell. (amended 2026-10-06) | verify: local-verifiable |
| FR-59 | MVP | Play page | The board has `role="grid"` and the Ukrainian accessible name «Поле N×N» for its size; each row has `role="row"` and each cell `role="gridcell"`. Each cell's Ukrainian accessible name states its row, column and value (for example «Рядок 2, стовпець 3: порожня»); given cells carry `aria-readonly="true"`, and cells in a highlighted violation carry `aria-invalid="true"`. (amended 2026-10-06) | verify: local-verifiable |
| FR-60 | MVP | Play page | The size selector has a visible Ukrainian label, «Розмір поля», associated with it. (amended 2026-10-06) | verify: local-verifiable |
| FR-61 | MVP | Play page | The hint and win message elements have `role="status"`, are present from the first render (empty until they have text), and focus never moves to them. (amended 2026-10-06) | verify: local-verifiable |
| FR-62 | MVP | Play page | A cell in a highlighted violation shows a cue besides colour: a heavier border than an ordinary cell. (amended 2026-10-06) | verify: local-verifiable |
| FR-63 | MVP | Play page | Cell borders, the violation and given cues and the focus indicators have at least 3:1 contrast with adjacent colours; cells, buttons and the size selector show a `:focus-visible` indicator; the size selector sets its own text colour; the board sets `touch-action: manipulation`. (amended 2026-10-06) | verify: local-verifiable |
| FR-44 | Future | Play page | Difficulty grading of puzzles. | — |
| FR-45 | Future | Play page | A timer. | — |
| FR-46 | Future | Play page | Saved progress across page reloads. | — |
| FR-47 | Future | Play page | Undo of the player's moves. | — |
| FR-48 | Future | Play page | A daily puzzle. | — |
| FR-55 | Future | Play page | The page offers Ukrainian (default) and English, with a language switch. | — |

## Non-Functional Requirements (NFR)

All MVP NFRs are measured in Vitest (unit or jsdom). No server, accounts, hosting or uptime exist, so there are no session, availability or page-speed NFRs.

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| NFR-1 | MVP | Performance | Generating one 4×4 puzzle takes under 200 ms, worst case over the fixed seed set, measured in Vitest on the test machine (bound pinned in A-13). | verify: local-verifiable |
| NFR-2 | MVP | Performance | Generating one 6×6 puzzle takes under 500 ms, worst case over the fixed seed set, measured in Vitest on the test machine (bound pinned in A-13). | verify: local-verifiable |
| NFR-3 | MVP | Performance | Generating one 8×8 puzzle takes under 3 s, worst case over the fixed seed set, measured in Vitest on the test machine (bound pinned in A-13). | verify: local-verifiable |
| NFR-4 | MVP | Usability | Every sentence the hint engine returns (rule explanations, the no-hint sentence and the broken-rule sentence) is exactly one sentence: one terminal mark at the end and no other sentence break. | verify: local-verifiable |
| NFR-5 | MVP | Localization | Page text (labels and buttons, win message) and hint sentences are Ukrainian: they contain Cyrillic and no Latin letters. (amended 2026-10-04: CLI errors removed; they are English, NFR-8) | verify: local-verifiable |
| NFR-6 | MVP | Usability | Hint explanations are clear and correct for a player: an eval-judge grades 2–3 Ukrainian hint sentences (pair, sandwich, count) against a rubric, and each graded case must score at least 80 out of 100 (optional, cut line 2). (amended 2026-10-04: pass bar of at least 80 out of 100 per case; the eval grades the Ukrainian hint sentences) | verify: eval |
| NFR-7 | Future | Compatibility | Playwright end-to-end browser tests of the play page in a real browser. | — |
| NFR-8 | MVP | Localization | Every CLI error is one English sentence containing no Cyrillic letters. | verify: local-verifiable |
| NFR-9 | MVP | Accessibility | The play page meets WCAG 2.2 AA for what FR-57 to FR-63 cover: keyboard operation (2.1.1), name, role and value (4.1.2), labels (3.3.2), status messages (4.1.3), use of colour (1.4.1), non-text contrast (1.4.11) and visible focus (2.4.7). Real screen-reader output is not tested (A-26). (amended 2026-10-06) | verify: local-verifiable |

## Constraints

### Technical (TC)

| ID | Phase | Description |
|---|---|---|
| TC-1 | MVP | Language is TypeScript in strict mode (ADR-0001). |
| TC-2 | MVP | The page is built with Vite and vanilla TypeScript DOM code, one static page, no UI framework (ADR-0001). |
| TC-3 | MVP | Tests use Vitest; page tests run in jsdom. Tests live in `tests/`, are named `*.test.ts` and carry `@trace` tags with plain IDs (e.g. `@trace FR-15`). |
| TC-4 | MVP | Lint is ESLint (flat config) plus `tsc --noEmit`, run by the pre-commit hook. |
| TC-5 | MVP | Specs use OpenSpec pinned to 0.17.2, run through `npx`. |
| TC-6 | MVP | Package manager is npm. |
| TC-7 | MVP | The engine (rule checker, solver, generator, hint engine) lives in `src/engine/` as pure TypeScript with no DOM imports or browser globals; grid size N is always a parameter. |
| TC-8 | MVP | The engine never uses `Math.random`; all randomness comes from a seeded generator so puzzles are reproducible from a seed. |
| TC-9 | MVP | The CLI is `src/cli.ts`, run through `tsx`; the CLI and the page (`src/main.ts`, `src/ui/`) use the same engine. |
| TC-10 | MVP | No new dependencies without the user's approval (level 1). |
| TC-11 | MVP | No server, no database, no accounts, no network calls; puzzles are generated in the browser; the app is not hosted tonight. |
| TC-12 | MVP | No persistence of game state (no local storage) in MVP; saved progress is Future (FR-46). |
| TC-13 | MVP | The page is tested in jsdom only; no real-browser testing tonight, so rendering defects jsdom cannot see are not caught. Browser and device support is not claimed (see A-14). |
| TC-14 | MVP | Out of scope: images and graphics assets, importing puzzles from files or other sources, Playwright end-to-end browser tests (Future, NFR-7). |

### Business (BC)

| ID | Phase | Description |
|---|---|---|
| BC-1 | MVP | Deadline: 2026-10-04 23:59 Kyiv time (EEST, UTC+3). |
| BC-2 | MVP | Hard freeze for feature work at 21:30 Kyiv time; after it only reporting, fixes to the proof pack and the video. |
| BC-3 | MVP | When the build is more than 30 minutes behind, the pre-agreed cut lines are applied in order (see Cut order) without waiting for approval; each cut is logged in `docs/autonomy-log.md` and `docs/budget.md`, and the user is told. |
| BC-4 | MVP | The user's older puzzle project and the playable preview shown while choosing the game are off-limits; nothing is read, copied or reused. |
| BC-5 | MVP | Phases run in order: requirements, specs, plan, build; the user signs off at scope (end of P1) and at the plan. |
| BC-6 | MVP | Anything unfinished at the deadline is reported NOT-EARNED or FAIL, never silently dropped or reported as passing. |
| BC-7 | MVP | Change control: requirement IDs are never renumbered; scope changes and conflicts between artifacts wait for the user (autonomy-log Lowering L1). |
| BC-8 | MVP | Deliverables are the public repository github.com/vecktor/binarka and a video; pushing to the remote is the user's call. |

## Cut order

Applied in this order when the build is more than 30 minutes behind (BC-3). Cut rows move to Future or are reported NOT-EARNED; their IDs stay. The user confirmed this order at sign-off: the size selector is cut 0 (clarification 13), and the "new puzzle" button stays in the shrunken slice 2 (clarification 14).

0. **Before cut line 1 (autonomy-log row 2a; confirmed at sign-off, clarification 13): APPLIED 2026-10-04 18:40** (about 70 minutes behind; autonomy-log row 10): drop the size selector, FR-43. The engine stays generic (FR-13 to FR-17, FR-15 still tested for N = 4, 6, 8); the page stays at 6×6. **RESTORED 2026-10-04 about 21:00 by the user's decision** (autonomy-log row 22), because both slices were archived about 2.5 hours ahead of the plan: FR-43 is MVP again, owned by the slice `add-size-selector`.
1. **Skip the global review-gate.** Process only; no FR or NFR removed. Per-slice reviews stay.
2. **Drop the eval.** NFR-6 is reported NOT-EARNED.
3. **Shrink slice 2 to the grid, rule highlighting, the win message and the "new puzzle" button.** FR-39 and FR-40 (page hint button) move to Future. FR-42 ("new puzzle" button) stays in the shrunken slice (user decision, clarification 14); FR-43 is already gone at cut 0. The hint engine (FR-19 to FR-26) stays in slice 1.
4. **If slice 1 (`add-puzzle-engine`) is not archived by 22:00 user time (19:30 Kyiv), drop slice 2.** (Deadline moved from 20:30 user time / 18:00 Kyiv by the user at the re-sign-off, autonomy-log row 11.) All Play page rows FR-31 to FR-43 are reported NOT-EARNED; the video shows the CLI (FR-28 to FR-30).

Schedule re-baselined 2026-10-04 18:40 (autonomy-log row 10): P3 ends about 19:25, slice 1 about 21:25, slice 2 about 23:25 (all user time, UTC+5:30); the feature freeze stays at 00:00 user time, which is 21:30 Kyiv (BC-2), and the deadline stays 23:59 Kyiv (BC-1). The cut line 4 deadline is 22:00 user time, decided by the user at the re-sign-off.

## Assumptions & Notes

Each item is keyed to its clarification number. At the P1 sign-off (2026-10-04) the user accepted every default as written below, with these notes: clarification 1, Ukrainian (the user first wrote "US language" and then confirmed Ukrainian); clarification 3, "new puzzle for now" (difficulty grading stays Future, FR-44); clarification 9, keep the eval. These items are now decisions, not assumptions.

- **A-1 (clarification 1):** page text and hint sentences are Ukrainian (NFR-5); CLI output and errors are English (NFR-8); a bilingual page is Future (FR-55, FR-56). (amended 2026-10-04: was "UI language is Ukrainian")
- **A-2 (clarification 2):** cells show the digits 0 and 1, not colours (FR-34).
- **A-3 (clarification 3):** no levels; a "new puzzle" button only (FR-42).
- **A-4 (clarification 4):** puzzles are generated in the browser from a seed; the seed is not shown on the page in MVP. The page chooses a new seed outside the engine (the `Math.random` ban in TC-8 applies only to `src/engine/`), and the page code accepts an injected seed so jsdom tests are deterministic.
- **A-5 (clarification 6):** uniqueness of the solution does not guarantee that the three hint rules can solve a puzzle. Decided (option a): when no rule applies, the hint says so in one sentence and fills nothing (FR-25); the rule-solvable guarantee is Future (FR-27).
- **A-6 (clarification 7):** the hint engine reasons from the board as it is (givens plus the player's entries) and does not consult the solution. If the board currently breaks a rule, the hint fills nothing (FR-26). A wrong entry that breaks no rule yet can still lead to a correct-looking rule deduction that is not part of the solution. FR-26 is removable if the user chooses another option.
- **A-7 (clarification 10):** hint selection order when several apply (FR-23): rule order pair, then sandwich, then count; within a rule, rows before columns; then lower line number; then lower cell position in the line.
- **A-8 (clarification 5):** a hint fills the cell and shows the explanation (FR-39, FR-40). For the count rule the explanation speaks of "the rest of the cells", but one hint fills one cell (the first empty one in the line). A hint-filled cell behaves like a player entry (it can be changed by clicking).
- **A-9:** the minimum grid size is 4 (FR-17) and the maximum is 16 (FR-49). An even N from 10 to 16 is accepted by the engine but untested and not offered on the page (FR-18 is Future). (amended 2026-10-04: maximum 16 added; was "N ≥ 10 is not rejected")
- **A-10 (clarification 10):** CLI shape (FR-28, FR-29): `npm run cli -- --size <N> --seed <integer>`, defaults size 6 and seed 1, output N lines of N space-separated tokens with `.` for empty cells, nothing else printed. The CLI does not print the solution.
- **A-11 (clarification 10):** given cells are locked on the page (FR-33).
- **A-12 (clarification 10):** rule highlighting is immediate after every board change, a click or a hint fill (FR-38), not on demand.
- **A-13 (clarification 10):** generation time bounds (NFR-1 to NFR-3) are generous first guesses: under 200 ms for 4×4, 500 ms for 6×6, 3 s for 8×8, worst case over the fixed seed set used by FR-15. Timing tests can be noisy in CI; the bound may need margin there.
- **A-14:** target browsers are current desktop evergreen browsers; mobile layout and visual polish are not specified and not verified tonight (TC-13).
- **A-15:** hint wording for the other digit and for columns mirrors the brief's examples with the words swapped, e.g. «Дві одиниці поспіль у стовпці 4, тож поруч може стояти лише нуль.», «Між двома одиницями у рядку 1 може стояти лише нуль.», «У стовпці 2 вже три одиниці, тож решта клітинок — нулі.» The number word in the count rule follows N/2 and agrees in gender: «два нулі» / «дві одиниці», «три нулі» / «три одиниці», «чотири нулі» / «чотири одиниці».
- **A-16:** the brief's examples are kept verbatim in FR-19, FR-20 and FR-21; the sentences in FR-25, FR-26 and FR-41 are draft wording, not from the brief.
- **A-17:** the rule checker's location data (line numbers and cells per violation, FR-1 to FR-6) is what the page highlights (FR-35 to FR-37). The win check uses the rule checker (FR-8); because the solution is unique, a full valid grid that keeps the givens is the solution.
- **A-18:** different seeds are expected, but not guaranteed, to give different puzzles; "new puzzle" (FR-42) is only required to generate from a new seed.
- **A-19:** after the win message the board is not locked; the player can start a new puzzle.
- **A-20:** no keyboard play or screen-reader requirements are set for MVP; none were in the brief. (amended 2026-10-06: superseded by NFR-9 and FR-57 to FR-63. Keyboard play, and the names, roles and states that screen readers use, are now MVP requirements. Screen-reader output itself is still not tested, A-26.)
- **A-21:** the engine-purity constraints TC-7 and TC-8 may be enforced by a Vitest test that scans `src/engine/` sources, but they are constraints, not traced behaviours.
- **A-22:** CLI error wording is chosen during the build; each error is one English sentence (FR-30, FR-52, FR-54, NFR-8).
- **A-23:** the hint message on the page stays until the next hint or a new puzzle (FR-40, FR-42).
- **A-24:** FR-43 is restored (autonomy-log row 22): its option labels are «Поле 4×4», «Поле 6×6», «Поле 8×8»; the selector is a select with the options 4, 6 and 8, 6 is selected at start, a value outside 4, 6 and 8 is ignored (no change to the board or the messages), re-selecting the current size is not specified (browsers fire no change event), and the choice is not remembered on reload (TC-12).
- **A-25:** the seed domain, integers from 0 to 2147483647 (2^31 − 1), applies to the generator (FR-51), the CLI (FR-52) and the page (the page picks its new seeds in that range, A-4).
- **A-26:** accessibility (NFR-9, FR-57 to FR-63) is verified in jsdom and by tests that read `src/ui/style.css`:
  - jsdom checks roles, names, states, and focus movement on key events.
  - The stylesheet tests compute contrast ratios with the WCAG formula and check for the `:focus-visible` rules.
  - Real browsers and screen readers are not tested (TC-13; NFR-7 is Future).
  - The design follows `docs/frontend-conventions.md` (WAI-ARIA APG grid pattern), and all new accessible names are Ukrainian (NFR-5).
  - Left out by the user's decision (autonomy-log row 34): 44 px phone targets (8×8 cells are 41 px at 375 px), confirm or Undo before progress is discarded, and puzzle state in the URL.
- **Note (2026-10-04 amendment):** the size cap of 16, English CLI errors, the seed domain, the CLI number grammar, the CLI option errors, the eval pass bar, the bilingual page as Future, and cut 0 came from the user on 2026-10-04 (autonomy-log rows 9 and 10). New IDs: FR-49 to FR-56, NFR-8. Amended: FR-18, FR-30, FR-43, NFR-5, NFR-6, A-1, A-9. Amended again 2026-10-04 about 21:00: FR-43 restored to MVP, A-24 (autonomy-log row 22).
- **Note:** verification tags are only those built tonight: `local-verifiable` (Vitest unit and jsdom tests with `@trace`), plus `eval` for NFR-6 if kept. No real-browser, hosting or uptime checks are declared.
