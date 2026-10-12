# PD-14: the NFR-14 config follows the reference to review-set-16

Status: **PROPOSED**, drafted 2026-10-12 at 17:59 (UTC+5:30) by the design stream DS of wave 3 (`claude/youthful-bhabha-design28`, port base 6773), after PD-13. It waits for the user's approval, asked in the same form as the move of the reference to review-set-16.

## Defect (once the user moves the reference)

- Design iteration 18 (`521ce03`) gives the design the product's `scroll-padding-bottom` on the open setup sheet (A-60). `review-set-16/` (`SHA1SUMS` `80eb8022d84e1962a7203747f13bc75931747da0`) differs from set 15 only in `320-light-setup-marked` and `320-dark-setup-marked`. Against set 15 these two fail NFR-14 at 0.8853 and 0.9069 (`docs/qa/design-stream/check-visual-set15.txt`); the page's capture scores 1.0000 against set 16.
- Once the user moves the reference and the NFR-14 row names set 16, the locked `quality/visual-parity.config.json` still names set 15 (PD-13).

## Red proof (to be run first, after the move)

`PD-13-reference-probe.mjs`, unchanged: with the NFR-14 row on set 16 and the config on set 15 it must FAIL 2 (`referenceDir`, `referenceSha1sums`). Saved as `PD-14-proof.txt`.

## Fix

In `quality/visual-parity.config.json`, change only `referenceDir` to `design/v0-screenshots/review-set-16`, `referenceSha1sums` to `80eb8022…`, and the `$comment` (the move, DS row, PD-14; before that review-set-15, PD-13). The breakpoints stay the same 170 names. Re-seal with `--init-lock --adaptation "PD-14: …"`.

## Green is earned when

The probe passes. Integrity passes after the re-seal. The geometry refreeze names set 16, and all five case hashes are unchanged from the PD-13 refreeze (top `8a24d09f…`, `rulesPanel` `f70bb8c0…`, `setupSheet` `6b0660d4…`, `confirmDialog` `e340c90f…`, `settingsPanel` `f2c108cc…`): the freeze measures no focused sheet, so only provenance moves. The three specs are green with the design hashes re-pinned to iteration 18 (red first). A fresh `check:visual` gives **170 of 170**, with the 168 identical shots unchanged to four decimals from the set-15 run.

## Rollback

Revert the `Refs: PD-14` commit; that restores the config and PD-13's lock.
