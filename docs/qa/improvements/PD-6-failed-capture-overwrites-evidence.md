# PD-6: a failed capture overwrites a scored NFR-14 report

Status: **PROPOSED, awaiting the user's approval.** Drafted 2026-10-11 from 21:27 (UTC+5:30) by session C of the parallel G2 plan, on the user's «Overwrite fix as PD-6 (Recommended)» (session log `docs/qa/process-stream/session-log.md`, row C7). No locked file changes before the yes; the edit goes in a commit with `Refs: PD-6`.

## Defect

- `scripts/check-visual-fidelity.mjs` (locked) writes `docs/qa/visual-diff/<shot>/report.json` for every shot as it goes, a failed capture included (`runVisualFidelity`, `failWithReport` and `writeReport`, ~lines 266 to 275).
- When the capture cannot run (a busy port, a dead preview, a crashed browser, a wrong adapter), the run measures nothing, but it still replaces each scored report with `score: null, pass: false, reason: "capture failed: …"`.
- Seen: the first attempt at run 7 (an orphaned preview on 4174, all 168 captures refused, autonomy-log row 159), and the `gate:status` rewrite of the 170 reports (row 170, PD-5). PD-4 and PD-5 remove those two causes. This mechanism remains for any future cause, and it turns a harness failure into lost evidence in the working tree.

## Red proof (`PD-6-proof.txt`, 2026-10-11 21:27, no port bound)

- A temporary config with two real shots (`1024-dark-default` at 1, `1440-light-default` at 0.9993, both passing) names a stub adapter whose `capture` throws. The stub is two lines: `export async function capture({ role, name }) { throw new Error(\`stub adapter reached (${role}, ${name})\`); }`.
- After the run, both committed reports read `score: null, pass: false, reason: "capture failed: stub adapter reached …"`. Restored with `git checkout`; the temporary config was removed.

## Fix options (all edit the locked checker)

- **A, complete runs only** (recommended). The checker writes the run into a temporary folder, and copies the reports into `docs/qa/visual-diff/` only when every shot was captured and scored (pass or fail). A run with any capture failure leaves the committed reports untouched, exits FAIL, prints each failure, and names the folder that holds that run's reports. The committed reports then always describe the last complete measurement, and `check-acceptance-methods`' freshness window (168 hours) still ages them out.
- **B, never overwrite a scored report with a capture failure**, shot by shot: a capture failure goes to a side file (`capture-failure.json`) next to the old report. Smaller change, but a partial run then leaves a mix of new scores and old ones, from two builds.
- **C, no checker change:** a rule to restore `docs/qa/visual-diff` after any failed run (today's interim rule). It depends on someone remembering it.

Trade-off for A and B: the checker is the factory's reference implementation, and either departs from it. Under A, a run whose every capture fails no longer shows those failures in the committed tree, only in the run's output and its folder. That is the intent: a harness failure is not a product measurement (AGENTS.md, capture-determinism).

## Green is earned when (after the yes)

The same stub run leaves both committed reports byte-identical, exits FAIL with both failures printed, and names the run folder. A complete run with the parity adapter (under the lock) still writes all 170 reports. `check-factory-integrity` passes after the re-seal.

## Rollback

Revert the `Refs: PD-6` commit; that restores the PD-5 checker and lock.
