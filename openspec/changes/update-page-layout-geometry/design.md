# Design: update-page-layout-geometry

## Context

G2 block 1 (autonomy-log row 148). The page and the design share the markup of the main column (`.page-header`, `.setup-button`, `.board-host`, `.board`, `.cell`, `.buttons`, `.messages` and the `data-*` contract), so the design's layout rules port almost verbatim.

## Decisions

1. **Port the formulas, do not re-derive.** The design's sizes are formulas (`--column`, `--cell-max` with `clamp(…dvh…)`, `--board-width`, the cell digit from `100cqi`). The fixture holds the fractional results (for example a 35.25 px 8×8 cell at 320), and they only match if the formula is the same.
2. **Geometry only.** Ported: `box-sizing`, `display`, flex and grid, `width`/`height`/`min-*`/`max-*`, `margin`, `padding`, `gap`, `border-width` and `border-style`, `border-radius` where it is part of a ported shorthand, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `aspect-ratio`, `container-type`. Not ported: colours, backgrounds, shadows, backdrops, text decoration and hover/active feedback. Borders take their colour from an existing token (`--color-cell-border`, `--color-control-border`, `--color-given-border`, `--color-focus`).
3. **Token names are kept.** The 13 `--color-*` tokens of A-51 keep their names and values. The new layout variables (`--space-*`, `--radius-*`, `--page-pad`, `--page-max`, `--column`, `--cell-max`, `--board-gap`, `--board-pad`, `--board-width`, `--gap`, `--message-*`) are not colour tokens; the stylesheet helpers resolve only `--color-*`.
4. **The win state keeps its geometry.** After a win the new-puzzle button takes the bold weight from the hint button (geometry: the text widths). The design's solved board also adds a 1 px ring as a box shadow, which is paint, not geometry; it comes with the palette block.
5. **No has-selector outside the idle line.** The design reads the board size and the solved state with `:has()`, which the build target does not allow outside the idle-line rule (FR-65, A-14; the user's decision D1, autonomy-log row 79). The size-dependent variables are declared on `.board[data-size]` itself, the 8×8 bleed on phones moves onto the board (negative inline margins, the same boxes), and the board host carries `data-solved="true"` while the board is solved (set by the page with the win line), read by a sibling selector for the button weights.
6. **Empty messages stay rendered.** The design hides an empty hint or win line with `display: none`; FR-63 keeps them rendered as live regions. They leave the flow instead (`position: absolute`, no padding or border, so 0×0), which takes no gap. The geometry test treats two 0×0 boxes as matching wherever they are: they paint nothing.
7. **The settings panel moves with the column.** Its 48rem placement was written against the 420 px column (`calc(50% + 210px - 22rem)`); the design's placement (`width: min(22rem, var(--column))`, top 6rem, right edge on the column's right edge) is ported, so the panel stays under the header.

## Instruments

- **Geometry (the gate of this block):** `e2e/nfr-14-layout-geometry.spec.ts` against `quality/design-geometry.json`, tolerance 0.5 px. Sampling dimension: viewport and state. Sample points: the 27 light reference shots of the states default (6 viewports), four, eight, level, win (eight at 6, the others at 5). Coverage: `sampled`.
- **Cross-check:** `scripts/visual-block.mjs --block layout` (real device scale, the gate's own capture for pixels): geometry off 0, unpaired 0 on the same states.
- **Stricter instrument before a definition-of-done is claimed:** a 1 px width sweep (320 to 1440 px) of the same boxes against the design build at the default state (README escalation step 2). Pixel scores stay telemetry for this block; the per-block pixel floor is claimed after the palette block.

## Risks

- `line-height: 1.5` on the body and `box-sizing: border-box` change every text and box on the page, including the sheet, the panels and the dialog. NFR-10, NFR-12 and NFR-13 run right after the port, not at the end.
- The 8×8 board bleeds into the page padding on phones (`.board-host` with `--bleed`); the page has `.board-host` already.
- Run 5 of `check:visual` may barely move or dip on some shots (colours dominate; the panels move with the box model). That is expected and is reported as such.
