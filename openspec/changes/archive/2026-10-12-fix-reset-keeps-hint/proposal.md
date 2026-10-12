# Change: fix-reset-keeps-hint

## Why

The Phase 7 global review gate (run `wf_9bab3694-f50`, `docs/qa/final-stream/review-findings.json`) confirmed a defect against FR-58: after a hint fills a cell and the player clicks that cell back to empty, the board has no entries again, so «Скинути» acts at once (no dialog), and `resetBoard()` empties the hint sentence. FR-58 says an untouched board «changes nothing», and the Reset requirement says the same («change no cell text, no class and no message»), but the same requirement also says that resetting empties `[data-message="hint"]`, so the spec contradicted itself for this path, and the one scenario for an untouched board only covered a page with no player action at all.

The user decided on 2026-10-12 at about 21:50 (UTC+5:30), in the question form: «Keep the message (Recommended)»: with no entries, Reset changes nothing (`docs/qa/final-stream/session-log.md`). FR-58's signed wording already says this; no requirement text changes.

## What Changes

- **`play-page` spec, MODIFIED (1): «Reset button».** It defines an untouched board (no non-given cell holds a digit, including a hint-filled cell clicked back to empty) and scopes the clearing duties to a board with entries. One scenario added: «Reset on a board emptied again after a hint keeps the hint sentence».
- **`play-page` spec, MODIFIED (2): «Confirmation before discarding player entries»** (review fix round 1, run `wf_2b1c80fe-f30`): «Так, почати» performs the pending action with its full effect (no longer «exactly as it would on an untouched board», which for Reset now means no change), and the reading rule notes that «Скинути» on a board without entries is no change.
- **`src/ui/play-page.ts`:** the reset handler does nothing on a board without entries (it already asked nothing there).
- **`tests/play-page-rules-and-reset.test.ts`:** one test per N for the new scenario, written first (red).

## Impact

- FR-58 (no wording change). No other requirement id, no engine change, no CSS change, so no NFR-14 shot changes.
