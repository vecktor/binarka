# Change: update-page-layout-geometry

## Why

NFR-14 compares the page with the frozen reference `design/v0-screenshots/review-set-14/` per shot, at 0.98. Run 4 of `npm run check:visual` scores 0 of 170 (`docs/qa/g2/check-visual-run-4.txt`). The capture is now trustworthy: it shows the design's fixture boards (PD-2), and at a real device scale the design build reproduces every reference shot exactly (PD-3, `docs/qa/g2/harness-calibration.txt`).

The largest residual is geometry. The page column is 420 px wide with 48 px cells and 2 px gaps, while the design's column follows the 6×6 board, with height-aware cells of up to 4 to 5rem, a framed board, a 44 px summary card, a full-width «Підказка» on phones and a reserved message area. Every block of every shot is displaced (the per-block tool, `scripts/visual-block.mjs --block layout`: up to 249 px off).

The user chose one OpenSpec change folder per G2 block (autonomy-log row 148). This is block 1, the layout geometry, chosen first because it moves every other block (row 148).

## What Changes

- **`play-page` spec:** ADDED «Main column layout geometry follows the design reference» (NFR-14).
- **`src/ui/style.css`:** the geometry of the main column is ported from `design/v0/app/binarka.css`, with the same formulas, so fractional sizes match:
  - the box model (`box-sizing: border-box` everywhere) and the body's line height (1.5);
  - `#app` (a flex column, gap, padding, `--page-max`, `--column`, the height-aware `--cell-max`, `--board-width`, and their 22.5rem, 30rem, 48rem and 64rem rules);
  - the header (title size, logo sizes, gaps; the settings and «Правила» buttons' sizes, borders and padding);
  - the summary button;
  - `.board-host`, `.board` and `.cell` geometry (grid, gap, padding, border widths, aspect ratio, digit size from the board width);
  - the action buttons row (wrap, gaps, «Підказка» full width below 30rem, «Скинути» not growing);
  - the message area (reserved height, offsets, padding, font sizes and line heights);
  - the settings panel's placement from 48rem, which was tied to the 420 px column.
- **Colours stay as they are.** The 13 colour tokens keep their names and values; no colour, shadow or backdrop is ported here (later blocks). Where a ported border needs a colour, it uses an existing token.
- **`e2e/nfr-14-layout-geometry.spec.ts`:** the boxes of 15 main-column elements equal the design's within 0.5 px, at the 27 sampled cases of `quality/design-geometry.json`.
- **`quality/design-geometry.json`:** the fixture, frozen from the design build by `scripts/freeze-design-geometry.mjs` with the e2e browser setup, with its provenance.
- **`playwright.config.ts`:** one more `testMatch` pattern in the `layout` project (`nfr-14-*`), approved by the user (autonomy-log row 150).

## Baseline requirements touched

| Baseline requirement | Action |
|---|---|
| none | ADDED «Main column layout geometry follows the design reference» only |

## Impact

- NFR-14: this change makes the layout geometry channel of the main column exact at the sampled cases. Pixel scores move little, because colours still dominate (the palette is a later block). The gate for this block is the geometry test and the tool's geometry channel.
- NFR-10 (one screen at 375×812, the header fits from 320 px), NFR-12 (44 px targets) and NFR-13 must keep passing; the design was built to satisfy them.
- Not in this change: colours and the palette, the panels' and the dialog's own geometry (except the settings placement), the backdrop, the logo route, the pressed gear and the filled «Почати».
