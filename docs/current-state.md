# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-10-04 18:56:00 (UTC+5:30; Kyiv 16:26)
- **Current phase:** Phase 3
- **Last completed gate:** G3
- **Active change:** none
- **Progress:** P1–P3 are finished in session B.
  - Requirements were signed off at 16:13. After a scope change, the amendment was re-signed at 18:45 (FR-49 to FR-56, NFR-8; autonomy-log rows 9–11).
  - Baseline specs `openspec/specs/puzzle-engine/spec.md` and `openspec/specs/play-page/spec.md` are written and revised.
  - The capability plan `docs/mvp-capability-plan.md` was signed off at 18:54.
  - **Cut 0 is applied** (the size selector FR-43 is out, reported NOT-EARNED).
  - The schedule is re-baselined: slice 1 is due about 21:25, with a **hard limit of 22:00** (cut line 4); slice 2 about 23:25; feature freeze 00:00 user time (21:30 Kyiv).
  - No product code yet.
- **Next task:** session C (Sonnet 5.5, medium). Read the usage meters and record them in `docs/budget.md`, then build slice 1 `add-puzzle-engine` per `docs/mvp-capability-plan.md` section 4.1:
  1. Create the OpenSpec change `openspec/changes/add-puzzle-engine/` (proposal, design, tasks).
  2. Have `test-engineer` write the tests first and confirm they are red; the first is "every generated puzzle has exactly one solution" over seeds 1–20 at N = 4, 6, 8.
  3. Have `capability-implementer` take them to green.
  4. Run the per-slice `review-gate`, one fix round and one confirming run.
  5. Archive the change.

  Commits touching `src/` carry `Slice: add-puzzle-engine` and `Refs: FR-x`. Ask the user to cache the GPG passphrase before each signed commit (the cache lasts about 10 minutes; autonomy-log M6). Read the clock before any time claim (M7). Then slice 2 `add-play-page` (plan 4.2).
- **Claims:**
  - G0 passes: lint, build, hooks fire, `core.hooksPath` is `.githooks` — evidence: `npm run gate:status`, commits `cbc84fa` and `4ed10a8`, tag `step-02-factory-init`
  - Factory integrity lock holds 23 gate-bearing files with 6 recorded adaptations — evidence: `factory-lock.json`
  - G1: requirements signed off by the user, amendment re-signed — evidence: `docs/autonomy-log.md` rows 7 and 11, tags `step-07-p1-signoff` and `step-09-p1-amend` (`gate:status` prints "needs sign-off" because it cannot see a human sign-off)
  - G2: both baseline specs pass `npx openspec validate --all --strict`, and every one of the 46 MVP FRs is cited by a spec (traceability: 0 failures) — evidence: `docs/qa/traceability-report.md`, tag `step-10-p2-specs`, workflow run `wf_4388e25c-d35` (coverage check: no gaps, no duplicates)
  - G3: capability plan signed off by the user, and every MVP FR/NFR row declares a real mechanism (`npm run check:acceptance`: 53 tagged rows, 0 failures) — evidence: `docs/mvp-capability-plan.md` Status line, `docs/autonomy-log.md` row 12, tag `step-11-p3-signoff`, `trace/acceptance-contracts.json`
  - Not claimed: G4–G8 (no product code). **G7 will report FAIL tonight by the user's decision** (no Playwright; `--strict-recordings` needs a recording for every MVP FR, see plan 4.3).

> This header is machine-read: keep the exact formats `Phase <N>` and `G<N>`,
> and give every done/verified claim an evidence path — `gate-status`
> hard-fails on divergence between this header and computed gate status.

## Source Of Truth

1. `AGENTS.md` — project agent rules.
2. `docs/current-state.md` — this handoff.
3. `docs/requirements.md` — canonical FR/NFR/TC/BC requirements (signed off 2026-10-04 16:13, amendment re-signed 18:45).
4. `docs/product-brief.md` — product narrative (signed off 2026-10-04).
5. `docs/mvp-capability-plan.md` — change sequence and scope (signed off 2026-10-04 18:54).
6. `openspec/config.yaml` + `openspec/specs/` — accepted behavior (`puzzle-engine`, `play-page`).
7. `docs/adr/` — ADR-0001 stack, ADR-0002 context architecture.
8. `docs/qa/` — QA proof pack and recordings.
9. `docs/autonomy-log.md` and `docs/budget.md` — kept live; update them at every phase.

## OpenSpec Status

```bash
npx openspec validate --all --strict   # 2 specs, both pass
npx openspec list                      # expected: No active changes
```

Archived changes: none.

## Open items and risks

- `npm audit`: 0 vulnerabilities after the user-approved downgrade of OpenSpec to 0.17.2 (exact pin; the 1.x line pulled in a vulnerable `braces`). OpenSpec 0.17.2 is older than the version `init` created `openspec/config.yaml` with; `validate` and `list` run, but re-check scenario and delta-spec behaviour when the first spec is written.
- `@vitest/coverage-v8@5.0.3` is installed and `npm run test:coverage` is real (json-summary reporter, `src/**`). CI does not run it yet: adding it to the locked `ci.yml` needs a re-lock or a `Refs: PD-x` commit once the first tests exist (slice 1). G5 is "try to fit in", not promised.
- `recordings`, `visual-fidelity` and `eval-ratchet` remain in the battery and will show NOT-EARNED.
- The branch has not been pushed. Pushing to the public remote is the user's call.
- P0–P3 commits live on the worktree branch `claude/binarka-p1-requirements-45688c` (tags `step-06` to `step-11`); `main` does not have them yet. Session C must start from this branch (or the user merges it into `main` first). Merging and pushing are the user's call.
- Process-defect candidate (for the retro, not fixed: the scripts are locked harness files): `gate-status` counts G1 "needs sign-off" as earned for the frontier and prints G2 PASS over zero specs, so the computed frontier reads G2 with no sign-off and no specs behind it.
- G7 will report FAIL: it runs `traceability --release --strict-recordings`, which needs a recording manifest for every MVP FR and takes no waiver. The user decided at the plan sign-off not to add Playwright (autonomy-log row 12).
- NFR-1 to NFR-3 timing bounds may be flaky in CI; NFR-5 forbids Latin letters in all user-facing text, CLI errors included.
- Hooks are per clone: `git config core.hooksPath .githooks`.
