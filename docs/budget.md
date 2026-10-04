# Budget: planned vs actual

Instrument: `get_usage` (Claude desktop app, Max plan). Percentages are of the plan meters, not dollars.
Extra usage is off. Rule: a phase that uses more than 1.5× its planned share stops and is re-planned.
Rule: if the 5-hour meter is above 70% before slice 2's review-gate, skip that slice's confirming run and the global review.

| Phase | Session / model | Planned (weekly, all models) | Planned (5-hour) | Actual | Notes |
|---|---|---|---|---|---|
| P0 setup, through G0 | A: Sonnet 5.5, medium | ~1% | ~3% | weekly 51% → 51% (under 1%); 5-hour 2% → 2% | Instrument: `get_usage`, read at ~14:40 and ~15:00. Scope grew past the ADR stop: scaffold, init and the lock were done after the user approved them. Session context used: about 154k tokens. |
| P1 requirements | B: Opus 5.5, medium | ~3% | ~8% | weekly 51% → 51% (under 1%); 5-hour 3% → 3% (under 1%) | Instrument: `get_usage`, read at ~15:08 and ~16:15. Well under the 1.5× ceiling (4.5% weekly, 12% 5-hour). Session context about 160k tokens; the `requirements-analyst` subagent used about 55k tokens. About 30 min of the phase was a blocked GPG signing wait (autonomy-log M6), which used no meter. No cut lines applied: the phase finished ahead of the 15:30–16:30 slot. |
| P2 specs + P3 plan | B | ~4% | ~10% | | Deviation: P2 runs in session B to save one handoff |
| Slice 1 | C: Sonnet 5.5, medium | ~8% | ~25% | | one review-gate, one fix round, one confirming run |
| Slice 2 | C | ~8% | ~25% | | same limits |
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

## Deviations and cuts

None yet. Every cut line applied is logged here and in `docs/autonomy-log.md`.
