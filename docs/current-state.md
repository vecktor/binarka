# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-10-04 16:16:00 (UTC+5:30; Kyiv 13:46)
- **Current phase:** Phase 1
- **Last completed gate:** G1
- **Active change:** none
- **Progress:** P1 is finished: the user signed off on scope at 16:13, answering all 14 clarifications (`docs/autonomy-log.md` row 7). `docs/requirements.md` holds FR-1 to FR-48 (41 MVP, 7 Future), NFR-1 to NFR-7 (6 MVP, including NFR-6, the hint-clarity eval, kept), TC-1 to TC-14, BC-1 to BC-8, decisions A-1 to A-21 and the confirmed cut order (size selector first; the "new puzzle" button stays if slice 2 shrinks). Grid size re-confirmed: engine takes even N ≥ 4, tested at 4/6/8; page defaults to 6×6; N ≥ 10 Future. No product code yet.
- **Next task:** P2 specs, then P3 plan, both in session B (Opus 5.5, medium; deviation already in `docs/budget.md`). Read the usage meters first. Run the `spec-pipeline` workflow (spec-writer on Sonnet, high) over two capabilities matching the draft slices: `puzzle-engine` (FR-1 to FR-17, FR-19 to FR-26, FR-28 to FR-30, NFR-1 to NFR-5) and `play-page` (FR-31 to FR-43, NFR-4/NFR-5 where they touch the page, NFR-6). Confirm that split with the user before running it (L1). Then the plan, `docs/mvp-capability-plan.md`, ending at the user's plan sign-off. Ask the user to cache the GPG passphrase before each signed commit (M6).
- **Claims:**
  - G0 passes: lint, build, hooks fire (empty commit ran them), `core.hooksPath` is `.githooks` — evidence: `npm run gate:status`, commits `cbc84fa` and `4ed10a8`, tag `step-02-factory-init`
  - Factory integrity lock holds 23 gate-bearing files with 6 recorded adaptations — evidence: `factory-lock.json`
  - G1 signed off by the user (`gate:status` shows "needs sign-off"; the sign-off is a human judgment) — evidence: `docs/autonomy-log.md` row 7, `docs/requirements.md` Status line, tag `step-07-p1-signoff` (diff against `step-06-p1-draft`)
  - Every MVP FR/NFR row declares a real mechanism (47 rows, 0 failures; existence only, no artifacts yet) — evidence: `npm run check:acceptance`, `trace/acceptance-contracts.json`
  - Not claimed: G2 (`gate:status` prints PASS over zero specs; vacuous), G3 (no capability plan), G4–G8 (no product code; G4/G6 now compute FAIL because 47 contracts have no artifacts).

> This header is machine-read: keep the exact formats `Phase <N>` and `G<N>`,
> and give every done/verified claim an evidence path — `gate-status`
> hard-fails on divergence between this header and computed gate status.

## Source Of Truth

1. `AGENTS.md` — project agent rules.
2. `docs/current-state.md` — this handoff.
3. `docs/requirements.md` — canonical FR/NFR/TC/BC requirements (signed off 2026-10-04).
4. `docs/product-brief.md` — product narrative (signed off 2026-10-04).
5. `docs/mvp-capability-plan.md` — change sequence and scope (not written yet).
6. `openspec/config.yaml` + `openspec/specs/` — accepted behavior (no specs yet).
7. `docs/adr/` — ADR-0001 stack, ADR-0002 context architecture.
8. `docs/qa/` — QA proof pack and recordings.
9. `docs/autonomy-log.md` and `docs/budget.md` — kept live; update them at every phase.

## OpenSpec Status

```bash
npx openspec validate --all --strict   # no specs yet
npx openspec list                      # expected: No active changes
```

Archived changes: none.

## Open items and risks

- `npm audit`: 0 vulnerabilities after the user-approved downgrade of OpenSpec to 0.17.2 (exact pin; the 1.x line pulled in a vulnerable `braces`). OpenSpec 0.17.2 is older than the version `init` created `openspec/config.yaml` with; `validate` and `list` run, but re-check scenario and delta-spec behaviour when the first spec is written.
- `@vitest/coverage-v8@5.0.3` is installed and `npm run test:coverage` is real (json-summary reporter, `src/**`). CI does not run it yet: adding it to the locked `ci.yml` needs a re-lock or a `Refs: PD-x` commit once the first tests exist (slice 1). G5 is "try to fit in", not promised.
- `recordings`, `visual-fidelity` and `eval-ratchet` remain in the battery and will show NOT-EARNED.
- The branch has not been pushed. Pushing to the public remote is the user's call.
- P1 commits live on the worktree branch `claude/binarka-p1-requirements-45688c` (tags `step-06-p1-draft`, `step-07-p1-signoff`); `main` does not have them yet. Merging and pushing are the user's call.
- Process-defect candidate (for the retro, not fixed: the scripts are locked harness files): `gate-status` counts G1 "needs sign-off" as earned for the frontier and prints G2 PASS over zero specs, so the computed frontier reads G2 with no sign-off and no specs behind it.
- Release risk: G7 runs `traceability --release --strict-recordings`, and traceability warns that no FR has a recording manifest. No requirement declares a recording, so this needs a decision in P3 (waiver or a recording) before G7 can pass.
- NFR-1 to NFR-3 timing bounds may be flaky in CI; NFR-5 forbids Latin letters in all user-facing text, CLI errors included.
- Hooks are per clone: `git config core.hooksPath .githooks`.
