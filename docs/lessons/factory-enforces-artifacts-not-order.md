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

## Sign-offs are judgment gates, by design

Recorded 2026-10-05 about 00:30 (UTC+5:30) at the user's request.

- **Where a sign-off lives:** the Status line of `docs/requirements.md` and `docs/mvp-capability-plan.md`, a row in `docs/autonomy-log.md` quoting the user's words and time, and a commit plus tag (e.g. `step-30-s4-change`). All are text and git history; there is no machine-readable sign-off record.
- **What the gates check:** `scripts/gate-status.mjs` line 191 (G1) and line 193 (G3) only check that the document exists and then print "needs sign-off"; they never read it, so they can never show PASS. Line 264 counts "needs sign-off" as earned, so later gates are not blocked; line 476 says sign-offs are confirmed by hand.
- **Why:** every place a sign-off is stored can be written by the agent being judged (the Status line, the log row, the tag). Even GPG signatures prove nothing about a human once the passphrase is cached: the agent signs with the user's key, as it did when it re-signed the slice 4 commits. A script that trusted any of these would let the maker pass its own gate.
- **What would make it checkable:** an artifact only the human can produce, e.g. a signed tag (`git tag -s signoff-requirements-<date>`) made with a key or passphrase the agent session never has cached, checked by `git tag -v` and by matching the tagged `docs/requirements.md` against HEAD; or an approval from the user's own account (a PR approval) that the agent's tools cannot make in the user's name. Either needs a credential the agent cannot use.
- **How to apply:** treat G1 and G3 as "confirmed by reading the evidence", never as passed; do not cache the signing passphrase for an agent session if signatures are meant to prove a human decision. Changing `gate-status.mjs` is a harness change and needs the user's approval.
