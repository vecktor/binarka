// The setup sheet's geometry contract shared by scripts/freeze-design-geometry.mjs (which freezes quality/design-geometry.json `setupSheet`) and
// scripts/visual-block.mjs (the block `setup`), so the two cannot drift apart (review gate of update-setup-sheet, fix round 1). Side-effect free.
// e2e/nfr-14-setup-sheet.spec.ts reads the same selectors from the fixture and asserts them.
// It replaces scripts/setup-sheet-deviation.mjs (design stream DS of wave 3, 2026-10-12): the level group's 28px bottom margin was a recorded
// deviation (SQ-5) injected into the design page; since design iteration 17 the design has it at every width (A-60 as amended and signed;
// the NFR-14 reference is review-set-15), so nothing is injected and the value is a guard.

/** The sheet and the left edge of its first level description. */
export const SETUP_SELECTORS = ['[data-section="setup"]', '[data-section="setup"] [data-control="level"] button:first-of-type .level-text'];

/** The level group's bottom margin at every width, in the design and on the page (A-60). A design with another value is not the reference. */
export const LEVEL_MARGIN = '28px';
