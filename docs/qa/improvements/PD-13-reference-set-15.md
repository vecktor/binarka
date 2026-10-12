# PD-13: the NFR-14 config still names review-set-14 after the user moved the reference to review-set-15

Status: **APPROVED by the user** in the question form on 2026-10-12 at about 17:36 (UTC+5:30): «Approve (Recommended)» (session log DS10). Executed in the commit with `Refs: PD-13`; green proof in `PD-13-green-proof.txt`. Drafted 2026-10-12 from 17:34 (UTC+5:30) by the design stream DS of wave 3 (`claude/youthful-bhabha-design28`, port base 6773), unit DS-2 of `docs/handoff/delivery-plan-2026-10-12.md`. Waits for the user's approval. The next free number after stream P's PD-8 to PD-12 (rows 211 to 217).

## Defect

- The user moved the NFR-14 pixel reference from `review-set-14/` to `review-set-15/` on 2026-10-12 at about 16:18, in the question form: «Yes, move to set 15 (Recommended)» (`docs/qa/design-stream/session-log.md` row DS6; `design/README.md` § «Pixel reference: moved to review-set-15»). The set is design iteration 17, the level group's 28px bottom margin at every width. A-60 was amended and signed in the same form.
- `docs/requirements.md` NFR-14 now names `review-set-15/` with `SHA1SUMS` `c561f87dd67aba246e1f2dbd1014561b26f6ff0a` (this branch).
- `quality/visual-parity.config.json` (locked, quality tier) still has `referenceDir` `design/v0-screenshots/review-set-14` and `referenceSha1sums` `e89badbf…`, and its `$comment` says the same. The adapter, `check:visual`, `qa:verify`, `gate:status`, the freeze scripts (`provenance.reference`) and `visual-block.mjs` all read it. So every gate still measures against the old design. There, the 12 phone setup shots fail at 0.8755 to 0.9388, because the product's signed 28px was a departure from the old design.
- No checker compares `referenceSha1sums` with the set's `SHA1SUMS` (grep of `scripts/`: only the two freeze scripts copy it into provenance). The value is documentation, so a stale one passes silently. This PD only re-points the config. It does not add that check; see Not proposed.

## Red proof (`PD-13-proof.txt`, 2026-10-12 17:34, no port, nothing written)

`PD-13-reference-probe.mjs` compares the NFR-14 row, the config and the SHA-1 of `<referenceDir>/SHA1SUMS` on disk, and checks that SHA1SUMS lists the config's 170 breakpoints.

| Where | Result |
|---|---|
| this branch (row: set 15; config: set 14) | **FAIL 2**: `referenceDir` and `referenceSha1sums` are not the row's |
| control: `origin/main`'s row (set 14) with the same config | PASS (the probe is not vacuous) |

The measured consequence (committed run-14 reports, product against set 14): `320-*-setup` and `320-*-setup-marked` at 0.8755 to 0.9238; all eight 375 setup shots at 0.9230 to 0.9388.

## Fix (one option; it follows the user's move)

In `quality/visual-parity.config.json` (locked, quality tier), change only these:
- `referenceDir`: `design/v0-screenshots/review-set-15`;
- `referenceSha1sums`: `c561f87dd67aba246e1f2dbd1014561b26f6ff0a`;
- `$comment`: name review-set-15, «moved by the user 2026-10-12, design stream DS row DS6; before that review-set-14, row 142». Nothing else changes: the breakpoints are the same 170 names (the probe checks the list), and so are the threshold, adapter, seed and ports.

Re-seal: `node scripts/check-factory-integrity.mjs --init-lock --adaptation "PD-13: …"`, after stream P's PD-12 re-seal, which is on `main` (`d25ca3c`).

Not proposed here: a checker that verifies `referenceSha1sums` against the set (a new gate mechanism, its own PD if the user wants it), and `quality/design-paint.json`, which is not refrozen. Its provenance names set 14, and no colour changed between sets 14 and 15 (122 non-setup shots byte-identical; the setup shots differ only in the margin's geometry).

## Green is earned when (after the yes)

1. The probe prints PASS (row, config and disk agree on `review-set-15` / `c561f87d…`).
2. `check-factory-integrity` shows quality-tier drift before the re-seal and PASS after.
3. The geometry refreeze writes `provenance.reference` review-set-15, and the three changed e2e specs are green (`docs/qa/design-stream/green-run.txt`).
4. A fresh `check:visual` on base 6773 against set 15 (`docs/qa/design-stream/check-visual-set15.txt`, read against the expectation written first in session log row DS7):
   - the 12 phone setup shots reach at least 0.98;
   - the 18 other changed setup shots move up from 0.990 to 0.995;
   - the 140 byte-identical shots keep their run-14 score to four decimals.
   The 170 reports are restored afterwards; only F commits them.

## Rollback

Revert the `Refs: PD-13` commit; that restores the config and P's PD-12 lock.
