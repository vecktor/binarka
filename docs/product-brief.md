# Бінарка — Product Brief

Status: **DRAFT for the user's scope sign-off** (P1, 2026-10-04). Pinned defaults are listed as assumptions in `docs/requirements.md` and as clarifications in the P1 handoff; nothing here is settled until the user signs off.

## What it is

Бінарка is a logic puzzle on an N×N grid (6×6 by default). The player fills every empty cell with 0 or 1 so that:

- there are never three of the same digit side by side in a row or a column;
- every row and every column has as many 0s as 1s;
- no two rows and no two columns are identical.

Every puzzle has exactly one solution. This is the classic Takuzu ruleset, presented in Ukrainian with the digits 0 and 1 (not colours).

## Why it exists

Бінарка is a course capstone: a small but real product built from scratch in one day to demonstrate agentic engineering with **Project Factory** (spec-driven, multi-agent, gated delivery with traceability from requirement to test). The product is deliberately small so that the process can be shown end to end: requirements, OpenSpec specs, a plan, test-first slices, reviews and an honest release gate. The deliverables are the public repository (github.com/vecktor/binarka) and a video. There is no hosting tonight.

Nothing is reused from the user's older puzzle project or from the playable preview shown while choosing the game; both are off-limits.

## Who uses it

| Actor | Goal |
|---|---|
| **Player** | Open the page, solve a fresh puzzle, see immediately when a rule is broken, ask for a hint that explains itself in one Ukrainian sentence, and start another puzzle. |
| **Developer** (running the CLI) | Print a puzzle as text for a chosen size and seed, to inspect the engine and reproduce a puzzle without the page. |

## Key workflows

**Start a puzzle.** The page opens with a generated 6×6 puzzle. Given cells are shown distinctly and cannot be changed. Puzzles are generated in the browser from a seed, so the same seed and size always give the same puzzle. If the size selector survives the schedule, the player can switch to 4×4 or 8×8, which starts a new puzzle of that size.

**Fill cells.** Clicking an empty cell cycles it empty → 0 → 1 → empty.

**See broken rules.** After every change the page highlights broken rules: three equal digits side by side, a row or column with more than half of one digit, and two identical complete rows or columns. Partially filled lines are never flagged falsely.

**Ask for a hint.** The hint button fills one cell and shows why, in one Ukrainian sentence, using one of three rules: Pair («0 0 _»), Sandwich («0 _ 0») or Count (half of the line is already one digit). If no rule applies, the hint says so and fills nothing (pinned default, to be confirmed).

**Win.** When the grid is full and breaks no rule, the page shows a win message.

**New puzzle.** The "new puzzle" button replaces the board with a freshly generated puzzle. There are no levels.

**CLI.** The developer runs the CLI with a size and a seed and gets the puzzle printed as text, one line per row, with a dot for each empty cell.

## MVP tonight vs Future

**MVP (tonight, deadline 23:59 Kyiv, feature freeze 21:30 Kyiv):**

- Slice 1 `add-puzzle-engine`: rule checker, solver that counts solutions and stops at 2, seeded generator of uniquely solvable puzzles (N = 4, 6, 8 tested), hint engine with Ukrainian explanations, CLI.
- Slice 2 `add-play-page`: one page with the grid, click cycling, rule highlighting, hint button, win message, "new puzzle" button, and a size selector (the first thing cut if the schedule slips).

Pre-agreed cut lines shrink this in a fixed order if the build runs more than 30 minutes behind; anything unfinished is reported NOT-EARNED or FAIL, never silently dropped.

**Future (not tonight):** grid sizes N ≥ 10, difficulty grading, a timer, saved progress, undo, a daily puzzle, Playwright end-to-end browser tests, and a guarantee that every puzzle can be solved by the three hint rules alone.

## How quality is shown

Every requirement in `docs/requirements.md` is checked locally: Vitest unit tests for the engine and Vitest jsdom DOM tests for the page, each tagged `@trace FR-x`. The first red test is "every generated puzzle has exactly one solution", which a naive generator fails for the right reason. Optionally, an `eval-judge` grades whether 2–3 hint explanations are clear and correct; that eval is the first thing cut after the global review. No real-browser, hosting or uptime claims are made.
