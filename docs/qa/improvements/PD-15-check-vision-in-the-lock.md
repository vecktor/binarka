# PD-15: `scripts/check-vision.mjs` is gate-bearing but not in the lock

**Number:** drafted and executed as «PD-13» (execution commit `b227131`, trailer `Refs: PD-13`); stream DS had taken PD-13 and PD-14 in parallel, so it was renumbered PD-15 when this branch merged `origin/main` after DS (autonomy-log rows 228, 229, M42). Its proofs are `PD-15-proof.txt` and `PD-15-green-proof.txt` (their text says PD-13); DS's `PD-13-*` files are a different PD.

Status: **APPROVED by the user** in chat on 2026-10-12 at about 17:15 (UTC+5:30): «P merged, rebase and do the check-vision PD». Planned in `docs/handoff/delivery-plan-2026-10-12.md` section 2.7 and the wave-3 start prompt for stream R («The new `scripts/check-vision.mjs` is gate-bearing: add it to the lock with a PD and a re-seal, after the process session P has merged and you have rebased»). Drafted and executed by stream R of wave 3 (`claude/wilbur-recordings`, rebased onto `origin/main` `d25ca3c`, after P's PD-8 to PD-12).

## Defect

- `scripts/check-vision.mjs` (Phase H, stream R) is the mechanism of every `vision-verify` row in force (NFR-11 since 2026-10-12; NFR-15 when it moves). `check-acceptance-methods` resolves the method to `npm:check:vision`, and its report `docs/qa/vision-report.*` is the artifact G4, G6 and G7 read.
- `scripts/check-factory-integrity.mjs` names it a gate-bearing file (`scripts/check-*`) but it is not in `factory-lock.json`, so a change to it is not tamper-evident: the integrity check prints a WARN and passes.

## Red proof (`PD-15-proof.txt`)

On `5262ab5`: integrity PASS with the WARN «gate-bearing file exists but is NOT in factory-lock.json». A tamper probe turned the gate's FAIL verdict into PASS (uncommitted): over the red-run probe (`docs/qa/vision-red-run.txt` § 2) it printed `Result: PASS`, exit 0, and the integrity check still exited 0 with only the same WARN. The file was restored with `git checkout`.

## Fix

Re-seal the lock with `node scripts/check-factory-integrity.mjs --init-lock --adaptation "PD-13: …"` in a commit with `Refs: PD-13` (now PD-15), so `scripts/check-vision.mjs` joins the 27 locked files. No script changes.

## Green is earned when

Integrity PASS with 28 locked files and no «not in factory-lock.json» warning; the same tamper probe makes the integrity check report drift on `scripts/check-vision.mjs` (exit 1); `npm run check:vision` PASS on the committed verdicts.

## As executed

- `node scripts/check-factory-integrity.mjs --init-lock --adaptation "PD-13: …"` on `5262ab5`: 28 locked files. The lock diff adds only `scripts/check-vision.mjs` and changes `createdAt`, `gitHead` and the adaptation line; every other hash equals P's PD-12 seal.
- **Green earned** (`PD-15-green-proof.txt`): integrity PASS, 28 files, no «not in factory-lock.json» warning (the one warning left is the shared `core.hooksPath`, pre-existing); the same tamper probe now FAILs with «gate-bearing file drift (hash drift) … with NO commit touching it whose message contains "Refs: PD-<n>"», exit 1; restored, `npm run check:vision` PASS and the red-run probe still FAIL.
- Battery on the rebased tree: `docs/qa/recordings-stream/battery-after-rebase.txt` (lint, unit 1993 of 1993, build, strict, eval, recordings with vision, vision, strict traceability, trajectory release, acceptance existence: all PASS; acceptance artifact FAILs only on NFR-14 and TC-13 pixel-diff, the design session's 28px unit).

- Re-sealed again in the merge with `origin/main` after DS (`Refs: PD-15`): the lock holds DS's PD-13 and PD-14 hashes and `scripts/check-vision.mjs`.

## Rollback

Remove `scripts/check-vision.mjs` from the lock by a re-seal in an approved PD commit (a plain revert of `b227131` would also drop DS's later seals).
