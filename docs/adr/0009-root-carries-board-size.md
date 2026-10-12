# ADR-0009: The page root carries the board size as `data-size`, instead of a `:has(` selector

Status: **ACCEPTED by the user** in chat on 2026-10-12 at about 16:45 (UTC+5:30), through the question form: «Accept all four (Recommended)» (stream P of wave 3, `docs/qa/process-stream/session-log.md` row P13; line pointers refreshed to `2762e31` before the review). Before that: **PROPOSED, for the user's review.** Written 2026-10-11 by session C of the parallel G2 plan. The decision was the user's: XQ-1 «data-size on the page root», signed on 2026-10-11 at about 16:13 (autonomy-log row 172). Implemented and archived (`openspec/changes/archive/2026-10-11-update-panel-shell/design.md`, decision 2). The ADR was left to stream C as 0009 (autonomy-log row 173).

## Context

- The rules panel and the setup sheet size themselves from the board's side (A-60: `B + 4.75rem` anchored, `B + 8.5rem` full cover, from 48rem). Both run in parallel blocks (A and B), so the hook had to exist once, before them.
- The design reads the size with `#app:has(.board[data-size='…'])` and declares `--board-width` on `#app`.
- FR-65 allows `:has(` in exactly one rule, the one that hides the idle line.
- The page declared `--board-width` and its inputs on `.board`. A custom property that holds `var()` is resolved on the element that declares it, and the panels are not inside the board, so they could not read it.

## Decision

1. **The root carries the size:** `#app` gets `data-size` `4`, `6` or `8`, set in the same step that creates the board (`src/ui/play-page.ts:344`), and at mount before any generation (`:189`). With no board (FR-88, FR-101) it says `6`. It is never stored (TC-12).
2. **The five variables move from `.board` to `#app`:** `--n`, `--cell-max`, `--board-gap`, `--board-pad` and `--board-width`, with their 30rem and 48rem rules, keyed on `#app[data-size='…']` (`src/ui/style.css:251-281`, and the 8×8 phone rule at `:1206`). Each rule stays where the `.board` rule it replaces was, so order and relative specificity are kept. The board keeps what is its own: the grid, `width`, padding, and the 8×8 phone bleed.
3. **The selector is `#app[data-size='…']`, not a bare `[data-size='…']`.** The board carries `data-size` too, and a bare selector would give it its own copy of the variables.
4. An unknown or missing value falls back to the plain `#app` rule, which has the 6×6 values.

## Alternatives rejected

Both were offered to the user with XQ-1:

- **XQ-1 B, the panels use `--column` for the board side.** Exact only when the board fills the column. It is too tall for 4×4 and for short windows, with an unmeasured pixel cost in the `four` setup shots.
- **XQ-1 C, no `min-height` from 48rem.** The 768 rules shot would show the board under the panel's bottom edge.
- **A second `:has(`.** It contradicts FR-65's one-`:has(` rule.

## Consequences

- One attribute is added to the DOM contract of the root, and the shell slice was no longer paint-only, so its red tests and geometry guard were heavier.
- The selector differs from the design's; the computed variables are the same, which the layout e2e checks.
- A later change that reads the board size elsewhere should read the root's attribute, not add a `:has(`.
