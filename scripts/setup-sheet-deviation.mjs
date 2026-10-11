// The setup sheet's geometry contract shared by scripts/freeze-design-geometry.mjs (which freezes quality/design-geometry.json `setupSheet`) and
// scripts/visual-block.mjs (the block `setup`), so the two cannot drift apart (review gate of update-setup-sheet, fix round 1). Side-effect free.
// e2e/nfr-14-setup-sheet.spec.ts reads the same selectors from the fixture and asserts them.

/** The sheet and the left edge of its first level description. */
export const SETUP_SELECTORS = ['[data-section="setup"]', '[data-section="setup"] [data-control="level"] button:first-of-type .level-text'];

/** The one recorded deviation (A-60, SQ-5): the product keeps the level group's 28px bottom margin. Appended after the design's stylesheet, it
 * wins over the design's `.setup .level-control` rules by source order. */
export const SETUP_DEVIATION_CSS = '.setup .level-control { margin-bottom: 28px }';

/** The design's own value the deviation replaces: 24px, and 1rem (16px) at 22.5rem and narrower. Injecting over any other value would hide it. */
export const designLevelMargin = (width) => (width <= 360 ? '16px' : '24px');
