# Change: update-setup-sheet-design-margin

## Why

The user moved the design to the product's signed 28px level margin (delivery plan `docs/handoff/delivery-plan-2026-10-12.md` §7 Q1; units DS-1 and DS-2). Design iteration 17 (`review-set-15`) gave the design's level group 28px at every width, and A-60 was amended and signed on 2026-10-12: the 28px is no longer a departure. A fresh NFR-14 run then found the two `320-*-setup-marked` shots failing, because the design lacked the page's `scroll-padding-bottom`. Design iteration 18 (`review-set-16`) added it, and the user moved the reference to set 16. NFR-14 is 170 of 170 against set 16 (`docs/qa/design-stream/check-visual-set16.txt`).

The tools and tests were changed with it (the recorded deviation removed, the fixture refrozen, the specs re-pinned). But the living requirement «The setup sheet takes the design's size, place and paint» in `openspec/specs/play-page/spec.md` still described the 28px as a departure, with an injected rule, `expected` boxes and `expectedDecidedBy`. The review gate of the design stream (run `wf_b4f0e083-6e6`, `docs/qa/design-stream/review-findings.json`) confirmed that contradiction. This change brings the requirement in line with the signed A-60 wording.

## What Changes

- **`play-page` spec, MODIFIED (1):** «The setup sheet takes the design's size, place and paint». The 28px is the design's own, so no rule is injected. The fixture key `setupSheet` records no deviation, no `expected` box and no `expectedDecidedBy`; each case records `levelMarginBottom` (`28px`, guarded by the freeze and by `visual-block.mjs`). The box test compares the page with the design's own `boxes`. The design's open sheet declares the page's `scroll-padding-bottom` since iteration 18. The reference is `review-set-16`. Item (4) of the not-delivered list is withdrawn. The fixture scenario says that a design change rewrites every key's provenance and that the guard across iterations is the SHA-1 of each key's `cases`.
- No `src/` change and no new requirement id. The signed texts are `docs/requirements.md` A-60 (signed 2026-10-12) and NFR-14 (the reference identifier, moved by the user).

## Impact

- Code and tests already changed on the branch `claude/youthful-bhabha-design28` (session log `docs/qa/design-stream/session-log.md` rows DS9 to DS15): `scripts/setup-sheet.mjs` (replaces `scripts/setup-sheet-deviation.mjs`), `scripts/freeze-design-geometry.mjs`, `scripts/visual-block.mjs`, `quality/design-geometry.json`, `e2e/nfr-14-setup-sheet.spec.ts`, `e2e/nfr-14-settings-panel.spec.ts`, `e2e/nfr-14-confirm-dialog.spec.ts`, `quality/visual-parity.config.json` (PD-13, PD-14). Each test change traces to the signed A-60 wording and to the user's reference moves; red runs are in `docs/qa/design-stream/red-run.txt` and `red-run-set16.txt`.
