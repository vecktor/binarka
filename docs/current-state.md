# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-10-04 15:20:00 (UTC+5:30; Kyiv 12:50)
- **Current phase:** Phase 1
- **Last completed gate:** G0
- **Active change:** none
- **Progress:** P1 draft written, **waiting for the user's answers to the clarification list and the scope sign-off**. The `requirements-analyst` (Opus, medium) drafted `docs/product-brief.md` and `docs/requirements.md`: FR-1 to FR-48 (41 MVP, 7 Future), NFR-1 to NFR-7 (6 MVP, 1 Future), TC-1 to TC-14, BC-1 to BC-8, assumptions A-1 to A-21, and a Cut order section. Pinned defaults are assumptions until the user signs off. `gate:status` now shows G1 "needs sign-off"; its computed frontier counts that as earned and G2 is still a vacuous PASS (no specs), so neither G1 nor G2 is claimed here.
- **Next task:** the user answers the 14-item clarification list (relayed in session B's chat, keyed to A-x in `docs/requirements.md`) and signs off on scope, re-confirming grid size (autonomy-log row 2a) and the cut order. Then revise the two docs, re-run `npm run check:acceptance` and `npm run gate:status`, commit, tag `step-07-p1-signoff`, record the meter reading in `docs/budget.md`. No P2 before the sign-off.
- **Claims:**
  - G0 passes: lint, build, hooks fire (empty commit ran them), `core.hooksPath` is `.githooks` — evidence: `npm run gate:status`, commits `cbc84fa` and `4ed10a8`, tag `step-02-factory-init`
  - Factory integrity lock holds 23 gate-bearing files with 6 recorded adaptations — evidence: `factory-lock.json`
  - Draft requirements declare a real mechanism for every tagged row (47 MVP FR/NFR rows, 0 failures; existence only, no artifacts yet) — evidence: `npm run check:acceptance`, `trace/acceptance-contracts.json`
  - Not claimed: G1 (no user sign-off yet), G2 (PASS over zero specs is vacuous), G3 (no capability plan).

> This header is machine-read: keep the exact formats `Phase <N>` and `G<N>`,
> and give every done/verified claim an evidence path — `gate-status`
> hard-fails on divergence between this header and computed gate status.

## Source Of Truth

1. `AGENTS.md` — project agent rules.
2. `docs/current-state.md` — this handoff.
3. `docs/requirements.md` — canonical FR/NFR/TC/BC requirements (P1 draft, awaiting sign-off).
4. `docs/product-brief.md` — product narrative (P1 draft, awaiting sign-off).
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
- Hooks are per clone: `git config core.hooksPath .githooks`.
