# PD-16: the NFR-14 config follows the reference to review-set-17

Status: **APPROVED by the user** in chat on 2026-10-12 at about 20:16 (UTC+5:30): «move the reference to review-set-17» (`docs/qa/update-logo-legibility/session-log.md` row 28); moving the reference includes the locked config that names it (the PD-13 and PD-14 pattern). Executed in the commit with `Refs: PD-16`; red proof `PD-16-proof.txt`, green proof `PD-16-green-proof.txt`. Drafted and executed by the logo-fix session (`claude/logo-legibility`, port base 6873).

## Defect (once the user moves the reference)

- Design iteration 20 (`design/README.md`): iteration 18 with the logo of FR-72 as amended 2026-10-12 (drawing G, change `update-logo-legibility`). `review-set-17/` (`SHA1SUMS` `a33d4af34cf0282fd7087062bfd45ce629554424`) differs from set 16 in every shot, only inside the logo's box (`review-set-17/CHANGES`). Against set 16 the page fails NFR-14 on the two logo shots (0.9426, 0.9427; `docs/qa/update-logo-legibility/check-visual-merge-main.txt`).
- Once the NFR-14 row names set 17, the locked `quality/visual-parity.config.json` still names set 16, and `scripts/reference-calibration.mjs` has no calibration for set 17, so a refreeze throws.

## Red proof (first, after the move)

`PD-13-reference-probe.mjs`, unchanged: with the row on set 17 and the config on set 16 it must FAIL 2. `tests/nfr-14-reference-pins.test.ts` must fail the same way. Saved as `PD-16-proof.txt`.

## Fix

1. Calibrate the harness against set 17 (`docs/qa/g2/calibrate-harness.mjs` as a scratch copy: port 4178 -> 6877, reference dir set 17): `docs/qa/update-logo-legibility/harness-calibration-set17.txt`, 170 of 170 at exactly 1.0000 (flag), or stop.
2. `scripts/reference-calibration.mjs`: add `'review-set-17'` -> that file.
3. `quality/visual-parity.config.json`: only `referenceDir`, `referenceSha1sums` and the `$comment`. Re-seal with `--init-lock --adaptation "PD-16: …"`.
4. Re-freeze geometry and paint from the design at the set's commit; the e2e specs' design-provenance pins follow (red first).

## Green is earned when

The probe and the pin test pass; integrity passes after the re-seal; `npm run check:visual` reaches 170 of 170; the NFR-14 e2e specs pass.

## Rollback

Revert the `Refs: PD-16` commits; that restores the config, the calibration map and PD-15's lock.
