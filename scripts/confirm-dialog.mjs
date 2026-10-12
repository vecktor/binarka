// The confirmation dialog's geometry contract shared by scripts/freeze-design-geometry.mjs (which freezes quality/design-geometry.json
// `confirmDialog`) and scripts/visual-block.mjs (the block `confirm`), so the two cannot drift apart (review gate of update-confirm-dialog,
// fix round 1). Side-effect free. e2e/nfr-14-confirm-dialog.spec.ts asserts that the fixture's `confirmDialog.selectors` equal its own list.

/** The open dialog, its text and its two buttons («Так, почати», «Скасувати»). */
export const CONFIRM_SELECTORS = ['dialog[data-dialog="confirm"]', 'dialog[data-dialog="confirm"] p', '[data-confirm="yes"]', '[data-confirm="no"]'];
