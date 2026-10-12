# PD-12: the trajectory report depends on the local branches, so CI finds it stale

Status: **APPROVED by the user** in chat on 2026-10-12 at about 17:02 (UTC+5:30): «approve PD-12 and push», after asking for a detailed explanation (session log `docs/qa/process-stream/session-log.md`, rows P16 and P17). Executed in the commit with `Refs: PD-12`; **green earned**: a clean clone passes, and CI run `38243572936` on `cf3e7dc` passed both jobs (`PD-12-proof.txt` § 6). Drafted from 16:55 by stream P of wave 3 (`claude/feynman-process`), found by the first branch CI run of PD-11 (draft PR 1).

## Defect

- `scripts/check-trajectory.mjs` (locked) counts each slice's `Slice:` trailer commits with `git log --all` (line 199) and writes the count into the committed `docs/qa/trajectory-report.md`. CI's first check is `--check-fresh`, which regenerates the report and compares it with the committed one.
- `--all` reads every ref. This machine has 75 local branches (`backup/*`, other worktrees' branches, rebased copies of the same commits); a CI clone has only the remote's. So the report written here never equals the one CI computes, and the step fails whatever the slices did.
- It is older than stream P: a clean clone of `origin/main` `2762e31` fails the same step (`PD-12-proof.txt` § 2). CI on `main` was already red there.

## Red proof (`PD-12-proof.txt`)

CI run `38242058245`, job `verify`: FAILURE at «Trajectory process audit (and freshness)». Reproduced in a clean clone, at the PR merge commit and at `origin/main`: `FAIL [freshness]`; only the «Trailer commits» column differs (10 slices, e.g. 20 → 11, 56 → 28).

## Fix (proposed)

Count trailers on the history of `HEAD`: `git log HEAD --grep=…` instead of `git log --all --grep=…`. The commits that count are the ones the checked-out tree is built from; copies on side branches (rebased or backup) no longer count twice, and the trailer-scope domains come from the same commits. Pre-measured with a scratch copy: the report written here equals the one written in a clean clone at the branch head and at the PR merge commit, byte for byte; no slice drops to 0 trailer commits.

Regenerate and commit the default-mode report and `trace/trajectory.json` in the same commit; re-seal the lock.

## Green is earned when (after the yes)

In a clean clone at the new head, `--check-fresh` and `--release --check-fresh` PASS; the next CI run's `verify` job passes the trajectory step (and the steps after it, which did not run in run `38242058245`). Integrity passes after the re-seal.

## As executed

- `scripts/check-trajectory.mjs` (locked) line 199: `git log HEAD` instead of `git log --all`, with a comment naming this PD. The regenerated report equals the pre-measured one byte for byte; `--release --check-fresh` PASS here. Integrity WARN before (the script already has a `Refs: PD-10` commit), PASS after the re-seal.
- Green: a clean clone at `cf3e7dc` passes `--check-fresh` and `--release --check-fresh`; CI run `38243572936` passed `verify` (all steps) and `browser` (`PD-12-proof.txt` § 6).

## Rollback

Revert the `Refs: PD-12` commit.
