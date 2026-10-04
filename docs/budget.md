# Budget: planned vs actual

Instrument: `get_usage` (Claude desktop app, Max plan). Percentages are of the plan meters, not dollars.
Extra usage is off. Rule: a phase that uses more than 1.5× its planned share stops and is re-planned.
Rule: if the 5-hour meter is above 70% before slice 2's review-gate, skip that slice's confirming run and the global review.

| Phase | Session / model | Planned (weekly, all models) | Planned (5-hour) | Actual | Notes |
|---|---|---|---|---|---|
| P0 setup, through G0 | A: Sonnet 5.5, medium | ~1% | ~3% | weekly 51% → 51% (under 1%); 5-hour 2% → 2% | Instrument: `get_usage`, read at ~14:40 and ~15:00. Scope grew past the ADR stop: scaffold, init and the lock were done after the user approved them. Session context used: about 154k tokens. |
| P1 requirements | B: Opus 5.5, medium | ~3% | ~8% | weekly 51% → 51% (under 1%); 5-hour 3% → 3% (under 1%) | Instrument: `get_usage`, read at ~15:08 and ~16:15. Well under the 1.5× ceiling (4.5% weekly, 12% 5-hour). Session context about 160k tokens; the `requirements-analyst` subagent used about 55k tokens. About 30 min of the phase was a blocked GPG signing wait (autonomy-log M6), which used no meter. No cut lines applied: the phase finished ahead of the 15:30–16:30 slot. |
| P2 specs + P3 plan | B | ~4% | ~10% | weekly 51% → 52% (about 1%); 5-hour 3% → 4% before the 17:50 reset, then 0% → 1% in the new window (about 2% in all) | Instrument: `get_usage`, read at ~16:21, ~16:37, ~18:40, ~18:48 and ~18:54. Deviation: P2 runs in session B to save one handoff. Within the 1.5× ceiling. Subagents: spec-pipeline workflow about 469k tokens (7 agents), requirements amendment about 40k, spec revision about 89k. Session context about 290k tokens. Took about 2.5 hours of wall time instead of 1 hour: user response time, a scope change after sign-off, a requirements amendment and a second spec pass (see Deviations). |
| Slice 1 | C: Sonnet 5.5, medium | ~8% | ~25% | weekly 52% → 52% (under 1%); 5-hour 2% → 3% (about 1%) | Instrument: `get_usage` at 19:05 and 20:20. Far under the 1.5× ceiling (12% weekly, 37% 5-hour). Subagent tokens: spec-writer 60k, test-engineer 119k, capability-implementer 75k, review-gate round 1 987k (17 agents) and confirming run 363k (7 agents). Session context about 216k tokens. Wall time 75 minutes (19:05 to 20:20) against about 2h20 planned; one review-gate, one fix round, one confirming run, as planned. |
| Slice 2 | C | ~8% | ~25% | weekly 52% → 53% (about 1%); 5-hour 3% → 4% (about 1%) | Instrument: `get_usage` at 20:20 and about 20:45. Far under the 1.5× ceiling. Subagent tokens: spec-writer 54k, test-engineer 148k, capability-implementer 53k, review-gate round 1 804k (15 agents) and confirming run 209k (5 agents). Session context about 283k tokens. Wall time about 30 minutes (20:20 to 20:50) against about 2 hours planned. The 70% rule did not trigger (5-hour meter at 4%), so the confirming run was run. |
| Eval, gate:status, retro | C | ~3% | ~8% | | optional eval is first to cut |
| Submission | C or D | ~1% | ~3% | | |

## Meter readings

| When (user time, UTC+5:30) | 5-hour | Weekly, all | Weekly, Fable | Phase |
|---|---|---|---|---|
| 2026-10-04 ~14:40, before P0 | 2% (resets 17:50) | 51% (resets Wed 7 Oct 20:30) | 23% | P0 start |
| 2026-10-04 ~15:00, after P0 | 2% (resets 17:50) | 51% | 23% | P0 end (readings are whole percents, so P0 cost is under 1%) |
| 2026-10-04 ~15:08, before P1 | 3% (resets 17:50) | 51% (resets Wed 7 Oct 20:30) | 23% | P1 start, session B (Opus 5.5). The 5-hour meter moved 2% → 3% between sessions (session B start-up and reading). P1 ceiling at 1.5×: 4.5% weekly, 12% 5-hour. |
| 2026-10-04 ~16:15, after P1 sign-off | 3% (resets 17:50) | 51% (resets Wed 7 Oct 20:30) | 23% | P1 end. Whole-percent readings, so P1 cost is under 1% on both meters. |
| 2026-10-04 ~16:21, before P2 | 3% (resets 17:50) | 51% (resets Wed 7 Oct 20:30) | 23% | P2 start, session B. P2+P3 ceiling at 1.5×: 6% weekly, 15% 5-hour. |
| 2026-10-04 ~16:37, P2 specs drafted | 4% (resets 17:50) | 52% | 23% | After the spec-pipeline workflow (7 agents, about 469k subagent tokens). |
| 2026-10-04 ~18:40, P2 open points | 0% (new window, resets 23:30) | 52% (resets Wed 7 Oct 20:30) | 23% | The 5-hour window reset at 17:50; the build now falls in the 18:30–23:30 window. |
| 2026-10-04 ~18:54, after P3 plan sign-off | 1% (resets 23:30) | 52% (resets Wed 7 Oct 20:30) | 23% | P2+P3 end, session B handoff to session C. |
| 2026-10-04 19:05, before slice 1 | 2% (resets 23:30 user time) | 52% (resets Wed 7 Oct 20:30) | 23% | Slice 1 start, session C (Sonnet 5.5). Context 86k tokens at read. Slice 1 ceiling at 1.5x: 12% weekly, 37% 5-hour. |
| 2026-10-04 20:20, after slice 1 archived | 3% (resets 23:30) | 52% (resets Wed 7 Oct 20:30) | 23% | Slice 1 end and slice 2 start (the rule: above 70% on the 5-hour meter before slice 2's review-gate skips its confirming run; at 3% it does not). Slice 2 ceiling at 1.5×: 12% weekly, 37% 5-hour. |
| 2026-10-04 ~20:45, before slice 2's confirming review run | 4% (resets 23:30) | 53% (resets Wed 7 Oct 20:30) | 23% | Slice 2 end. Rule check for the confirming run: 4% is below 70%, so it was not skipped. |

## Deviations and cuts

Every cut line applied is logged here and in `docs/autonomy-log.md`.

| When (user time) | Deviation or cut | Why | Decided by |
|---|---|---|---|
| 2026-10-04 (P0 plan) | P2 runs in session B with P3, saving one handoff | brief | User (brief) |
| 2026-10-04 18:40 | **Cut 0 applied:** the size selector (FR-43) leaves tonight's plan; reported NOT-EARNED | About 70 minutes behind the brief's schedule (slice 1 was due at 17:30; P2 was still open). Causes: about 30 minutes of a blocked GPG signing wait (M6), the user's response time, a 14-minute spec workflow, and a scope change after sign-off. | Pre-agreed cut line, applied by the agent and reported to the user |
| 2026-10-04 18:40 | Schedule re-baselined (option A): P3 ends about 19:25, slice 1 about 21:25, slice 2 about 23:25; freeze 00:00 unchanged | The earlier 45-minute shift was approved on a wrong clock reading (M7) and is withdrawn. | User |
| 2026-10-04 18:45 | Cut line 4 deadline moved from 20:30 to 22:00 user time (18:00 → 19:30 Kyiv) | Under the re-baselined schedule the old time would drop slice 2 automatically; 22:00 is the latest point where slice 2's two hours still fit before the 00:00 freeze. | User |

