# Cause-mark design touch: review record (CQ-4 A of the violation-cause amendment)

Recorded by the parent session on 2026-10-11 10:19 +0530. The designer and the reviewers were separate subagents (maker ≠ checker). Two iterations were made, which is the budget.

## Iteration 1 (designer)
- **What was added:** `.cell-cause` and `.cell-cause::after` in `design/v0/app/binarka.css`, a review-only route `/cause/` with two marks (P1 and P6), and 4 stills at 375 and 1024, light and dark.
- **Reference check:** all 170 review-set-14 shots are byte-identical.
- **Review 1** (a fresh design-reviewer): **ready with polish at 6×6**; 8×8 on phones not shown. It asked for:
  - longhands in `.cell-violation`;
  - a 0.5rem minimum leg;
  - one-mark evidence routes at 8×8 (a full highlighted row) and 4×4 (a hinted cause);
  - an optional 4 px radius on the mark;
  - a forced-colours check.
  - An optional appearance animation was proposed; it was not adopted, because the signed amendment has no motion.

## Iteration 2 (designer)
- **What changed:**
  - Longhands; the override rule is gone.
  - A `max(0.5rem, …)` minimum leg.
  - The routes `/cause-eight/` (P2, the fifth 1 in a row of 8) and `/cause-four/` (P6).
  - Stills at 320 and 375 (8×8, both themes), 375 (4×4, both themes), 844×390 light (where the minimum applies), and forced colours at 1024.
- **The radius was skipped:** it adds a seam (`radius-check/`).
- **Reference check:** all 170 review-set-14 shots are still byte-identical, checked twice. The `/cause/` stills are unchanged. Two capture runs gave the same bytes.
- **Measured legs:**

| Board and width | Leg |
|---|---|
| 8×8 at 320 | 7.5 CSS px of fully covered pixels (the 8 px minimum applies) |
| 8×8 at 375 | 9.0 CSS px |
| 8×8 at 844×390 | 7 CSS px of fully covered pixels (the minimum applies; 40% of the inner width; about 4 to 5 px from the digit) |

- **Forced colours:** the mark becomes a filled square.

## Review 2 (a fresh design-reviewer): ready with polish
**Recommendations:**
- **Keep the 0.5rem minimum.** Lowering it to 0.4375rem gains only about 0.7 px of clearance.
- **Adopt a forced-colours rule in a corrected form:** scoped inside `@media (forced-colors: active)` and using `ButtonText`. The unscoped `CanvasText` version would break normal paint. The rule: `.cell-cause::after { forced-color-adjust: none; border-top-color: ButtonText; border-left-color: transparent; }`. It can go in during implementation, mirrored into the design at the refreeze.
- **Agrees with skipping the radius.**

**Findings:**
- At 320 light, the 8×8 mark is findable after a short scan, not at a glance. A larger mark would contradict A-58's "about a quarter", so it is a question for the user.
- The two-mark `/cause/` stills are not a product oracle (FR-120 allows at most one mark).
- Evidence gaps: 844 dark is not captured; forced colours was checked in the default emulation only.

**Out of scope:** 8×8 cells of 24 px in landscape are below the 44 px touch target. That comes from an earlier decision.

## Open for the user
- Forced-colours rule: adopt the corrected rule, or keep it as a note.
- The 320-light findability at 8×8: keep "about a quarter", or allow a third round.

## The user's answers (in chat, 2026-10-11 about 10:30 UTC+5:30, through the question form)
- Forced colours: **«Adopt the rule (Recommended)»**: the corrected rule (scoped, `ButtonText`) goes into `src/ui/style.css` during implementation and is mirrored into `design/v0/app/binarka.css` before the refreeze.
- Mark size: **«Keep as signed (Recommended)»**: legs about a quarter of the cell with a 0.5rem minimum; no third design round.
