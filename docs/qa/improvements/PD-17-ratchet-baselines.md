# PD-17: the coverage and process baselines ratcheted up (stream F)

Status: **APPROVED by the user** in chat on 2026-10-12 at about 21:25 (UTC+5:30), through the question form: «Approve PD-17 (Recommended)» (`docs/qa/final-stream/session-log.md` row F10). Executed in the commit with `Refs: PD-17`; red proof `PD-17-proof.txt`, green proof `PD-17-green-proof.txt`. Drafted and executed by stream F (`claude/friendly-lederberg-final`, port base 6873). Step 4 of the final session (`docs/handoff/delivery-wave3-start-prompts-2026-10-12.md`).

## Defect

- `quality/coverage-baseline.json` held 94 / 91.32 / 92.1 / 87.12 (lines, statements, functions, branches) while the code measures 99.33 / 97.5 / 98.19 / 91.94 (`docs/qa/gate-status-2026-10-12.txt`): a drop of up to 5 points would still pass.
- `quality/process-baseline.json` was still the template (`"_template": true`), so `check-process-ratchet` printed «NOT-EARNED (pending baseline)» and `qa:verify` could not print Overall Pass (`docs/qa/final-stream/qa-verify-1.txt`). Plan section 6 requires the process ratchet earned.

## Precondition (a truthful green run)

Battery at `dcc82c5` all green (`docs/qa/final-stream/battery-1.txt`); gate:status G4 to G8 PASS; `trace/process-health.json` refreshed by `npm run retro:digest` (it was from 2026-10-04): acceptance coverage 134 of 134, vacuousPasses 0, 0 deterministic defects.

## Fix

1. `node scripts/check-coverage-ratchet.mjs --update` (tighten-only guard): 99.33 / 97.5 / 98.19 / 91.94.
2. `node scripts/check-process-ratchet.mjs --update` (tighten-only guard): phase 3, coverage 134 of 134, vacuousPasses 0, warning budgets copied from `quality/telemetry.config.json`.
3. Re-seal: `node scripts/check-factory-integrity.mjs --init-lock --adaptation "PD-17: …"`.

No hand edit of either baseline.

## Consequence to know

The coverage floor now equals today's measurement to two decimals: a later change that lowers any metric by 0.01 fails `check:coverage` until a test covers it or a signed waiver lowers the floor. That is the ratchet's intent.

## Green is earned when

Both ratchets PASS (process ratchet 4 guards), integrity PASS after the re-seal, and `npm run qa:verify` prints Overall Pass (`docs/qa/final-stream/qa-verify-2.txt`).

## Rollback

Revert the `Refs: PD-17` commit; that restores both baselines and PD-16's lock.
