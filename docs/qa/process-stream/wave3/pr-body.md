Draft, opened on the user's word («A + push + draft PR (Recommended)», 2026-10-12) so `ci.yml` runs the new browser job once (PD-11's green). Not for merging yet: merging is the user's word.

Process stream P of wave 3 (`docs/handoff/delivery-wave3-start-prompts-2026-10-12.md`). No file under `src/`, `tests/` or `e2e/` changed. Each PD has a red proof, the user's approval, a `Refs: PD-<n>` commit and a lock re-seal.

| Commit | What | Evidence |
|---|---|---|
| `c57d927` PD-8 | The acceptance check reads 0.98 for NFR-14 pixel-diff (`acceptance.tokens` in `quality/telemetry.config.json`; the unread `acceptanceArtifacts` removed) | `docs/qa/improvements/PD-8-*` |
| `6fef448` PD-9 | A `logo` driver in the capture adapter: logo-dark 1, logo-light 1 (base 6573) | `docs/qa/improvements/PD-9-*` |
| `110699d` PD-10 | `check-trajectory` accepts signed review dispositions and `design.md` waivers; 24 dispositions signed by the user; `--release` exits 0 | `docs/qa/improvements/PD-10-*`, `docs/qa/review-dispositions/` |
| `3489935` PD-11 | CI `browser` job: `check:a11y` + the six font-independent e2e files (93 tests); the seven geometry and fit files (163 tests) stay local | `docs/qa/improvements/PD-11-*` |
| `7cdeb8b` | ADRs 0006 to 0009 accepted by the user | `docs/adr/` |

Session log: `docs/qa/process-stream/session-log.md` (rows P1 to P15).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
