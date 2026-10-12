# Design: update-logo-legibility

## Context

At 40×40 CSS px one unit of the 64-unit `viewBox` is 0.625 CSS px. Today's board: cells 11 units (6.9 px), bars 2.6 × 7.2 (1.6 × 4.5 px), rings `rx` 2.2, `ry` 3.1, `stroke-width` 1.8 (stroke 1.1 px, hole 2.6 × 4.4 units, 1.6 × 2.8 px). Two fresh vision-judges could not tell bars from rings. The rays take the outer 12 units of each side, and the circle (`r` 19.5) leaves the board 24 of 64 units.

## Goals

- The four digits are large enough that a fresh vision-judge tells 1 0 / 0 1 apart at 40×40 CSS px, ratio 2.
- The text of FR-72 and NFR-15 does not change (board, circle, 0/1 rays, no text).
- The design source and the page draw the same logo, so a new review set can become the NFR-14 reference.

## Non-goals

- The «01» fallback; a new colour or token; a size-dependent drawing (one drawing at every size); changing the logo's CSS size.

## Decisions

The user chose option B on 2026-10-12. Coordinates (viewBox units):

| Shape | Today | New |
|---|---|---|
| circle | `r` 19.5 at (32, 32) | `r` 24 at (32, 32) |
| cells | 11 × 11, `rx` 2, at x, y ∈ {20.5, 32.5} | 16 × 16, `rx` 3, at x, y ∈ {15, 33} |
| bar (1) | 2.6 × 7.2, `rx` 1.3, centred | 4.5 × 11, `rx` 2.25, centred |
| ring (0) | `rx` 2.2, `ry` 3.1, `stroke-width` 1.8 | `rx` 3.5, `ry` 5, `stroke-width` 3 |
| bar ray | x 30.6, y 2.5, 2.8 × 8, `rx` 1.4 | x 30.4, y 0.5, 3.2 × 6, `rx` 1.6 |
| ring ray | `cx` 32, `cy` 6.5, `rx` 2.3, `ry` 3.2, `stroke-width` 1.8 | `cx` 32, `cy` 3.6, `rx` 2.1, `ry` 2.7, `stroke-width` 1.6 |

Checks of the new drawing against the spec floors: cell 16 ≥ 15; bar 4.5 ≥ 4 and 11 ≥ 10; ring stroke 3 ≥ 2.8, hole 2 × (3.5 − 1.5) = 4 ≥ 3.2 and 2 × (5 − 1.5) = 7 ≥ 5.6, outer ± 5 by ± 6.5 inside the ± 8 cell; corner centres at (18, 18) etc., 19.80 from the centre ≤ 24 − 3 = 21; bar ray inner edge 6.5 ≤ 32 − 24 − 0.5 = 7.5; ring ray inner edge 3.6 + 2.7 + 0.8 = 7.1 ≤ 7.5, top 0.1 ≥ 0. Today's drawing fails the cell, bar, stroke and hole floors (red) and passes the inside-the-circle and ray checks (GUARD).

Why these floors: they sit just under the chosen drawing, so the test fails on today's logo and on a regression towards it, without pinning exact coordinates. They are proxies; the vision check of NFR-15 is the judge.

## Pixel expectations (NFR-14)

- The logo's box (CSS size) and the logo shapes' `fill`, `stroke` and `color` do not change, so `quality/design-geometry.json` and `quality/design-paint.json` hold; `e2e/nfr-14-*` browser tests that read them should not move.
- Pixels: every shot with the header shows the new logo. Against `review-set-14` these shots differ in the logo's area only (at most 64 × 64 CSS px, 128 × 128 device px, of a shot of at least 320 × 700); the two `logo-*` shots differ entirely in the logo marks. The new set `review-set-15` is captured from the mirrored design; its prediction: every shot that shows the header or the logo sheet changes, every other shot is byte-identical. Only the user moves the reference.

## Sequencing

1. Spec and red tests on this branch (base `claude/wilbur-recordings` at `496c0a9`).
2. Drawing (`src/ui/logo.ts`) to green; design mirror and `review-set-15`.
3. Rebase onto `claude/wilbur-recordings` after its held-clip work is committed (ledger merged as a union).
4. Record `16-logo-40` (`--only`), one vision-verify run with a fresh vision-judge; no re-runs to shop for a pass.
5. If met: remove `held`, move NFR-15 (one logged commit), run the checks.

## Risks

- The vision-judge still fails it: then NFR-15 stays held, the verdict is recorded, and the user decides (the «01» fallback or a further change). No second judge run on the same still.
- The sibling work is not committed in this session: steps 4 and 5 wait; the handoff says so.
