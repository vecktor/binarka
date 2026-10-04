# Бінарка — Requirements

Status: **DRAFT for the user's scope sign-off** (P1, 2026-10-04). Rows marked as pinned defaults depend on the clarification list in the P1 handoff; see `## Assumptions & Notes` (A-x keys). IDs are assigned once and never renumbered; later changes append new IDs and mark changed rows.

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
| FR-18 | Future | Generator | Grid sizes N of 10 and above are supported, tested and offered on the page. | — |

### Hints (hint engine)

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-19 | MVP | Hints | Pair rule («0 0 _»): when two equal digits stand side by side in a line and a cell next to the pair is empty, the hint targets that cell with the opposite digit and explains it in one Ukrainian sentence, e.g. «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця.» | verify: local-verifiable |
| FR-20 | MVP | Hints | Sandwich rule («0 _ 0»): when an empty cell sits between two equal digits in a line, the hint targets that cell with the opposite digit and explains it in one Ukrainian sentence, e.g. «Між двома нулями у стовпці 2 може стояти лише одиниця.» | verify: local-verifiable |
| FR-21 | MVP | Hints | Count rule: when a line already holds N/2 of one digit and has an empty cell, the hint targets one empty cell of that line with the other digit and explains it in one Ukrainian sentence, e.g. «У рядку 5 вже три нулі, тож решта клітинок — одиниці.» | verify: local-verifiable |
| FR-22 | MVP | Hints | Each hint explanation names the line type (рядок or стовпець) and its 1-based number, matching the target cell's line. | verify: local-verifiable |
| FR-23 | MVP | Hints | When several hints apply, the choice is deterministic: repeated calls on the same board return the same cell, value and explanation (selection order pinned in A-7). | verify: local-verifiable |
| FR-24 | MVP | Hints | A hint only ever targets an empty cell; it never changes a given or an already filled cell. | verify: local-verifiable |
| FR-25 | MVP | Hints | When none of the three rules applies, the hint targets no cell and returns one Ukrainian sentence saying so, e.g. «Жодне з трьох правил зараз не підказує наступного ходу.» (pinned default, A-5). | verify: local-verifiable |
| FR-26 | MVP | Hints | When the board currently breaks a rule, the hint targets no cell and returns one Ukrainian sentence asking the player to fix the highlighted rule first, e.g. «Спершу виправте порушення правил, підсвічене на полі.»; this takes precedence over FR-19 to FR-21 and FR-25 (pinned default, A-6). | verify: local-verifiable |
| FR-27 | Future | Hints | The generator guarantees that every puzzle can be solved from its givens using only the pair, sandwich and count rules, so a hint is always available on a correct board. | — |

### CLI

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-28 | MVP | CLI | `npm run cli -- --size 6 --seed 42` prints the puzzle for that size and seed as N lines of N space-separated tokens, `0` or `1` for givens and `.` for empty cells (shape pinned in A-10). | verify: local-verifiable |
| FR-29 | MVP | CLI | When `--size` or `--seed` is omitted, the CLI uses size 6 and seed 1 respectively (pinned in A-10). | verify: local-verifiable |
| FR-30 | MVP | CLI | An invalid size (odd, below 4 or not a number) makes the CLI print a one-sentence Ukrainian error and exit with a non-zero code. | verify: local-verifiable |

### Play page

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-31 | MVP | Play page | The page renders an N×N grid of a generated puzzle; N is 6 by default. | verify: local-verifiable |
| FR-32 | MVP | Play page | Given cells are rendered distinctly from player cells (a distinct marker on the cell element). | verify: local-verifiable |
| FR-33 | MVP | Play page | Clicking a given cell does not change it (pinned default, A-11). | verify: local-verifiable |
| FR-34 | MVP | Play page | Clicking a non-given cell cycles its shown text empty → «0» → «1» → empty; cells show the digits 0 and 1, not colours. | verify: local-verifiable |
| FR-35 | MVP | Play page | Cells that form three or more equal digits side by side in a row or column are highlighted. | verify: local-verifiable |
| FR-36 | MVP | Play page | A row or column holding more than N/2 of one digit is highlighted. | verify: local-verifiable |
| FR-37 | MVP | Play page | Two identical complete rows, or two identical complete columns, are highlighted. | verify: local-verifiable |
| FR-38 | MVP | Play page | Highlighting is recomputed after every board change (a cell click or a hint fill): a broken rule is highlighted immediately and its highlight disappears once the rule is no longer broken (timing pinned in A-12). | verify: local-verifiable |
| FR-39 | MVP | Play page | Pressing the hint button fills the cell the hint engine targets with its value. | verify: local-verifiable |
| FR-40 | MVP | Play page | Pressing the hint button shows the hint engine's sentence on the page, including the no-hint and broken-rule sentences when no cell is filled. | verify: local-verifiable |
| FR-41 | MVP | Play page | When the grid becomes solved, the page shows a Ukrainian win message, e.g. «Вітаємо, головоломку розв'язано!» | verify: local-verifiable |
| FR-42 | MVP | Play page | The «Нова головоломка» button replaces the board with a newly generated puzzle of the current size and clears the hint and win messages. | verify: local-verifiable |
| FR-43 | MVP | Play page | A size selector offers 4×4, 6×6 and 8×8; choosing a size starts a new puzzle of that size (first item cut if the schedule slips, see Cut order). | verify: local-verifiable |
| FR-44 | Future | Play page | Difficulty grading of puzzles. | — |
| FR-45 | Future | Play page | A timer. | — |
| FR-46 | Future | Play page | Saved progress across page reloads. | — |
| FR-47 | Future | Play page | Undo of the player's moves. | — |
| FR-48 | Future | Play page | A daily puzzle. | — |

## Non-Functional Requirements (NFR)

All MVP NFRs are measured in Vitest (unit or jsdom). No server, accounts, hosting or uptime exist, so there are no session, availability or page-speed NFRs.

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| NFR-1 | MVP | Performance | Generating one 4×4 puzzle takes under 200 ms, worst case over the fixed seed set, measured in Vitest on the test machine (bound pinned in A-13). | verify: local-verifiable |
| NFR-2 | MVP | Performance | Generating one 6×6 puzzle takes under 500 ms, worst case over the fixed seed set, measured in Vitest on the test machine (bound pinned in A-13). | verify: local-verifiable |
| NFR-3 | MVP | Performance | Generating one 8×8 puzzle takes under 3 s, worst case over the fixed seed set, measured in Vitest on the test machine (bound pinned in A-13). | verify: local-verifiable |
| NFR-4 | MVP | Usability | Every sentence the hint engine returns (rule explanations, the no-hint sentence and the broken-rule sentence) is exactly one sentence: one terminal mark at the end and no other sentence break. | verify: local-verifiable |
| NFR-5 | MVP | Localization | All user-facing text (page labels and buttons, hint sentences, win message, CLI errors) is Ukrainian: it contains Cyrillic and no Latin letters. | verify: local-verifiable |
| NFR-6 | MVP | Usability | Hint explanations are clear and correct for a player: an eval-judge grades 2–3 hint cases (pair, sandwich, count) against a rubric (optional, cut line 2). | verify: eval |
| NFR-7 | Future | Compatibility | Playwright end-to-end browser tests of the play page in a real browser. | — |

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
| BC-3 | MVP | When the build is more than 30 minutes behind, the pre-agreed cut lines are applied in order (see Cut order) and logged in `docs/autonomy-log.md` without asking the user. |
| BC-4 | MVP | The user's older puzzle project and the playable preview shown while choosing the game are off-limits; nothing is read, copied or reused. |
| BC-5 | MVP | Phases run in order: requirements, specs, plan, build; the user signs off at scope (end of P1) and at the plan. |
| BC-6 | MVP | Anything unfinished at the deadline is reported NOT-EARNED or FAIL, never silently dropped or reported as passing. |
| BC-7 | MVP | Change control: requirement IDs are never renumbered; scope changes and conflicts between artifacts wait for the user (autonomy-log Lowering L1). |
| BC-8 | MVP | Deliverables are the public repository github.com/vecktor/binarka and a video; pushing to the remote is the user's call. |

## Cut order

Applied in this order when the build is more than 30 minutes behind (BC-3). Cut rows move to Future or are reported NOT-EARNED; their IDs stay.

0. **Before cut line 1 (autonomy-log row 2a):** drop the size selector, FR-43. The engine stays generic (FR-13 to FR-17, FR-15 still tested for N = 4, 6, 8); the page stays at 6×6.
1. **Skip the global review-gate.** Process only; no FR or NFR removed. Per-slice reviews stay.
2. **Drop the eval.** NFR-6 is reported NOT-EARNED.
3. **Shrink slice 2 to the grid, rule highlighting and the win message.** FR-39 and FR-40 (page hint button) move to Future; FR-42 ("new puzzle" button) and FR-43 are not in the shrunken slice either and would be reported NOT-EARNED unless kept (to confirm, see handoff). The hint engine (FR-19 to FR-26) stays in slice 1.
4. **If slice 1 (`add-puzzle-engine`) is not archived by 18:00 Kyiv, drop slice 2.** All Play page rows FR-31 to FR-43 are reported NOT-EARNED; the video shows the CLI (FR-28 to FR-30).

## Assumptions & Notes

Each pinned default is keyed to the clarification number in the P1 handoff so the user can flip it at sign-off.

- **A-1 (clarification 1):** UI language is Ukrainian (NFR-5).
- **A-2 (clarification 2):** cells show the digits 0 and 1, not colours (FR-34).
- **A-3 (clarification 3):** no levels; a "new puzzle" button only (FR-42).
- **A-4 (clarification 4):** puzzles are generated in the browser from a seed; the seed is not shown on the page in MVP. The page chooses a new seed outside the engine (the `Math.random` ban in TC-8 applies only to `src/engine/`), and the page code accepts an injected seed so jsdom tests are deterministic.
- **A-5 (clarification 6):** uniqueness of the solution does not guarantee that the three hint rules can solve a puzzle. Pinned default: when no rule applies, the hint says so in one sentence and fills nothing (FR-25); the rule-solvable guarantee is Future (FR-27).
- **A-6 (clarification 7):** the hint engine reasons from the board as it is (givens plus the player's entries) and does not consult the solution. If the board currently breaks a rule, the hint fills nothing (FR-26). A wrong entry that breaks no rule yet can still lead to a correct-looking rule deduction that is not part of the solution. FR-26 is removable if the user chooses another option.
- **A-7 (clarification 10):** hint selection order when several apply (FR-23): rule order pair, then sandwich, then count; within a rule, rows before columns; then lower line number; then lower cell position in the line.
- **A-8 (clarification 5):** a hint fills the cell and shows the explanation (FR-39, FR-40). For the count rule the explanation speaks of "the rest of the cells", but one hint fills one cell (the first empty one in the line). A hint-filled cell behaves like a player entry (it can be changed by clicking).
- **A-9:** the minimum grid size is 4 (FR-17). N ≥ 10 is not rejected by the engine in MVP; it is simply untested and not offered on the page (FR-18 is Future).
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
- **A-20:** no keyboard play or screen-reader requirements are set for MVP; none were in the brief.
- **A-21:** the engine-purity constraints TC-7 and TC-8 may be enforced by a Vitest test that scans `src/engine/` sources, but they are constraints, not traced behaviours.
- **Note:** verification tags are only those built tonight: `local-verifiable` (Vitest unit and jsdom tests with `@trace`), plus `eval` for NFR-6 if kept. No real-browser, hosting or uptime checks are declared.
