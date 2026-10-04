# Lesson: the factory scripts enforce artifacts, not order or agent roles

Recorded 2026-10-04 about 23:35 (UTC+5:30) at the user's request (autonomy-log row 34).

## Finding

Project Factory's deterministic checks inspect what ends up in the repo, never how it got there.

| Enforced by a script (exit code) | Not enforced by any script |
|---|---|
| `.githooks/commit-msg`: a `Slice:` or `Refs:` trailer on every commit | Test-first order: tests committed and seen red before the implementation |
| `.githooks/pre-commit`: no secrets or `.env` files; staged code passes ESLint | Which agent did each step (requirements-analyst, spec-writer, test-engineer, capability-implementer); git only records the human author |
| `check-traceability`: every MVP FR has a test tagged `@trace FR-x` | That no test was weakened to go green |
| `check-trajectory`: archived change has `design.md` and `tasks.md`, a clean `review-findings.json`, and `Slice:` trailers | That `review-findings.json` came from fresh reviewers and was not hand-edited |

`scripts/check-trajectory.mjs` (lines 13 to 16) states the boundary itself: it does not verify test-first ordering or that no test was weakened.

## Where the order is evidenced instead

- Git history: separate commits and tags per step (change, red, green, fix, archive), e.g. slice 3 tags `step-25` to `step-29`.
- A red-run file written by the orchestrator's own run, e.g. `docs/qa/add-size-selector-red-run.txt`.
- `docs/autonomy-log.md`: which agent did each step, with token counts.
- The `trajectory-eval` workflow: a fresh LLM judge grades process order and test integrity from that evidence. It is a graded judgment, not a hard gate.

## How to apply

- Treat the playbook's agent roles and step order as discipline, not as something a check will catch.
- Keep one commit (and tag) per step, confirm red yourself in a scratch copy, and log the agent per step, so the order can be audited afterwards.
- Never hand-edit `review-findings.json`; nothing but the rule prevents it.
