# PD-5: `qa-verify` and `gate:status` run the visual checker without the NFR-14 adapter and overwrite its evidence

Status: **PROPOSED, awaiting the user's approval.** Drafted 2026-10-11 from 18:00 (UTC+5:30) by session C of the parallel G2 plan (`claude/modest-darwin-process`; the user's «Draft both», autonomy-log row 170). This is gap 3 of `docs/qa/visual-diff/README.md` § Known gaps, now with a measured cost. No locked file changes before the yes; the edit goes in a commit with `Refs: PD-5`.

## Defect

- NFR-14 is decided by `npm run check:visual`, which sets `CHECK_VISUAL_FIDELITY_ADAPTERS=scripts/check-visual-parity-adapters.mjs` for the locked checker `scripts/check-visual-fidelity.mjs`.
- The two locked callers do not set it: `scripts/qa-verify.mjs:77` runs `node scripts/check-visual-fidelity.mjs`, and `scripts/gate-status.mjs:67` runs the same with no arguments. Without the variable the checker falls back to its default URL-to-URL adapters: it loads the config's `referenceUrl` (`127.0.0.1:4175`, which nothing serves) and `localUrl` (4174), full page, at device scale 1. That is not NFR-14.
- **It also writes its results over the committed NFR-14 evidence.** The checker writes `docs/qa/visual-diff/<shot>/report.json` for every shot, a failed capture included.

## Red proof (`PD-5-proof.txt`, 2026-10-11 18:02, lock held, ports free before and after)

- The callers' exact command line, run once: exit 1 in 8 s, «Scope: 170», «Result: FAIL»; the first failure is `ERR_CONNECTION_REFUSED at http://127.0.0.1:4175/`.
- **All 170 committed reports were rewritten; 86 verdicts flipped from pass to fail** (86 of 170 passing at 0.98 before, 0 after). A report such as `1024-dark-default` went from `score: 1, pass: true` to `score: null, pass: false, reason: "capture failed: …"`.
- Restored with `git checkout -- docs/qa/visual-diff` by the probe; `git status --porcelain docs/qa/visual-diff` is empty after.
- Not measured: if a parallel session's preview had been on 4174 at that moment, the default adapter would have scored that session's page. Unlike the parity adapter (PD-2), it has no own-server guard.

## Fix options (both edit locked files)

- **A, the callers set the variable.** `qa-verify.mjs` passes `CHECK_VISUAL_FIDELITY_ADAPTERS=scripts/check-visual-parity-adapters.mjs` in the environment of its visual-fidelity step, and `gate-status.mjs` in its `spawnSync` for `visual`. Two locked edits; the project's adapter path is written into two factory scripts.
- **B, the checker reads the adapter from its config** (recommended). `quality/visual-parity.config.json` gains `"adapters": "scripts/check-visual-parity-adapters.mjs"`; the checker uses it when the variable is unset (the variable still wins, so the checker's documented test hook keeps working; the `tests/visual.test.mjs` its header names does not exist in this project). One locked edit; every caller, present or future, measures NFR-14. The config is not locked, so the lock must be extended to it, or the adapter path could be changed there without a trace. Trade-off: the checker is the factory's reference implementation, and this departs from it (A departs too, in two files).

**Under A and B alike,** `qa-verify` and `gate:status` then run the real 170-shot capture: several minutes, a fresh `npm run build` first, and port 4174, which means the capture lock (or PD-4's per-session ports). A `gate:status` run then rewrites the reports with the page's current scores. That is honest, but it dirties the tree whenever a score moves.

## Interim rule, until the yes

- Do not read the visual-fidelity line of `qa-verify` or `gate:status` as NFR-14 (README gap 3).
- After any `qa-verify` or `gate:status` run, run `git status --porcelain docs/qa/visual-diff` and restore with `git checkout -- docs/qa/visual-diff`.
- Both callers pass their environment on to the checker (`qa-verify` with `env: process.env`, `gate-status` by `spawnSync`'s default), so `CHECK_VISUAL_FIDELITY_ADAPTERS=scripts/check-visual-parity-adapters.mjs npm run gate:status` measures NFR-14 today. It needs a fresh build and the capture lock, like `check:visual`.

## A related mechanism, for the user to place

A failed capture overwrites a committed report with `score: null`. That happens with the right adapter too: a busy port made the first attempt at run 7 fail all 168 captures (autonomy-log row 159). PD-5's fix makes the callers measure the right thing. It does not stop a failed run from writing over good evidence. Possible fix: the checker writes to a run folder and copies into `docs/qa/visual-diff/` only when the run completed, or never overwrites a scored report with a capture failure. That is the checker's output policy, so either inside PD-5 or as a separate PD-6.

## Green is earned when (after the yes; not run yet)

The same probe with the fix: the adapter line must read `(adapters injected from scripts/check-visual-parity-adapters.mjs)`, and the rewritten reports must carry the parity adapter's scores (a full run under the lock, compared with the last committed `check:visual` run). `check-factory-integrity` must pass after the re-seal.

## Rollback

Revert the `Refs: PD-5` commit; that restores the current callers, checker and lock.
