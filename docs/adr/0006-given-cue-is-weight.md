# ADR-0006: A given cell is told apart by its weight, not by a border

Status: **PROPOSED, for the user's review.** Written 2026-10-11 by session C of the parallel G2 plan, on the user's word (autonomy-log row 170: «write palette decision 4»). The decision itself was signed on 2026-10-10 at about 23:27 (PA-Q1 «A: the design's cue», autonomy-log row 157) and is implemented and archived (`openspec/changes/archive/2026-10-10-update-page-palette/design.md`, decision 4). This ADR records it. It changes nothing.

## Context

- Before G2 block 2, the spec's given cue was a 2px border in its own colour, at 3:1 against the cell, the page and the given fill, with bold digits (700). FR-65 asked 3:1 for every cell cue.
- The design (`review-set-14`) draws a given cell with a 1px border in the ordinary cell-border colour, the given fill, a darker ink and weight 800. None of these is a 3:1 non-text cue: the fill is 1.46:1 (light) and 1.70:1 (dark) against an ordinary cell.
- Keeping the 2px border would have kept the board shots below NFR-14's 0.98 until a design round drew that border and the user moved the reference (palette amendment, PA-Q1 B).
- A given cell is `aria-disabled` (FR-69; `src/ui/play-page.ts:260`). WCAG 1.4.11 does not ask 3:1 of an inactive user-interface component.

## Decision

1. **The cue that tells a given cell from a player's cell is weight:** 800 against 500. A given cell in a violation keeps 800: the rule `.cell-given.cell-violation { font-weight: 800 }` overrides the 700 of `.cell-violation`, which in the design would erase the only cue.
2. **The border, fill, darker ink and the missing inset line are decoration.** `--color-given-border` equals `--color-cell-border` and is 1px wide. The violation widths are 1 (ordinary), 1 (given), 2 (violation) and 2 (given in a violation).
3. **The given digit keeps at least 4.5:1** against its fill (text contrast is not exempt).
4. `aria-disabled` is the non-visual counterpart of the cue.

The rule is FR-65 («A given cell is an inactive control … told from a player's cell by weight, not by colour alone») and A-57 in `docs/requirements.md`, and «Borders, cues and focus rings have enough contrast» in `openspec/specs/play-page/spec.md`.

## Alternatives rejected

- **PA-Q1 B, keep a 2px border in its own colour at 3:1, weight 700.** It keeps a stronger cue, but the light cell border would have to darken to about `#7f7667`, the violation would stay 3px, and the board shots could not reach 0.98 without a design round and a new reference.
- **The fill as the cue.** It is 1.46:1 and 1.70:1, a colour-only cue below any non-text floor.

## Consequences

- The cue is weaker than a 3:1 border. The user accepted that with the signature.
- The tests that pinned the 2px given border, its 3:1 pair and the 1, 2, 3, 3 widths were replaced deliberately, not weakened: the palette amendment named each one (`docs/handoff/palette-amendment-draft-2026-10-10.md`, line 15).
- A later change that brings back a given border, or drops the weight in a violation, contradicts this ADR and needs a new signature.
