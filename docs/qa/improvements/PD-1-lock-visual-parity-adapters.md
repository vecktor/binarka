# PD-1: the NFR-14 capture adapter decides a gate verdict but is not tamper-evident

Status: **APPROVED by the user** in chat on 2026-10-10 at about 13:37 (UTC+5:30): "Adapter under lock" (autonomy-log row 140). Executed in the commit with `Refs: PD-1`.

This is the first process improvement of the project. It lives here, not in `openspec/changes/improve-PD-1/`: a change folder without spec deltas fails `npx openspec validate --all --strict` (tried on 2026-10-10), and this change touches no product spec.

## Defect

- `npm run check:visual` decides NFR-14 through `scripts/visual-parity-adapters.mjs`, injected into the locked checker `scripts/check-visual-fidelity.mjs` through `CHECK_VISUAL_FIDELITY_ADAPTERS`.
- The adapter chooses what each side captures: the frozen reference PNG, the capture conditions and the state drivers. A quiet edit can therefore change the NFR-14 verdict.
- `factory-lock.json` locks only `scripts/check-*.mjs`, `qa-verify`, `gate-status`, hooks, workflows and the quality baselines (`collectLockTargets`), so the adapter was outside the lock. Gap 4 of `docs/qa/visual-diff/README.md`.

## Fix (no locked file edited)

1. Rename the adapter to `scripts/check-visual-parity-adapters.mjs`. The lock's own pattern `^check-.*\.mjs$` then covers it. Update the references to it: `package.json` `check:visual`, the config's `$comment`, NFR-14's verification column, the README and the handoff. The run-1 evidence files keep the old name; they record what ran.
2. Re-seal the lock with `node scripts/check-factory-integrity.mjs --init-lock --adaptation "PD-1: …"`, which also adds the two quality baselines it warned about.

## Red to green proof (`docs/qa/improvements/PD-1-proof.txt`)

- **Before**, with the renamed file unlocked, `check-factory-integrity` warns: "gate-bearing file exists but is NOT in factory-lock.json".
- **After the re-seal**, it passes, and the adapter is in `factory-lock.json`.
- **Tamper probe** (scratch, restored): one line appended to the adapter makes `check-factory-integrity` FAIL with gate-bearing drift and no `Refs: PD-<n>` commit. Restored, it passes.
  - Caveat: the check looks for any commit message touching the file that holds `Refs: PD-<n>`. Once this PD-1 commit exists, it accepts later drift of the same file too. That weakness is the checker's design, outside this PD; it is noted, not fixed.

## Not in this PD (still open, gap 3)

`scripts/qa-verify.mjs` (locked) calls the checker without `CHECK_VISUAL_FIDELITY_ADAPTERS`, so its visual-fidelity line runs the default URL-to-URL adapters and is not NFR-14. Fixing it means editing a locked script, which needs a separate PD and the user's approval.

## Rollback

Revert the `Refs: PD-1` commit: that restores the old name and the old lock.
