# PD-8: the acceptance check enforces 0.99 for NFR-14, not the signed 0.98

Status: **APPROVED by the user** in chat on 2026-10-12 at about 16:05 (UTC+5:30), through the question form: «A: add + drop dead key (Recommended)» (session log `docs/qa/process-stream/session-log.md`, row P5). Executed in the commit with `Refs: PD-8`; **green proof complete** (`PD-8-green-proof.txt`, 16:07). Drafted from 15:59 by stream P of wave 3 (`claude/feynman-process`). Unit P-THR of `docs/handoff/delivery-plan-2026-10-12.md` (section 2.1, item 1); the user chose «Acceptance reads 0.98» on 2026-10-12 (plan section 7, Q3).

## Defect

- NFR-14 says each shot scores «at least 0.98» (threshold set by the user 2026-10-05, autonomy-log row 68). `check-visual-fidelity.mjs` uses 0.98, but `check-acceptance-methods.mjs --mode=artifact` (G4, G6, G7 and every `qa-verify` run) enforces **0.99**.
- Why: `thresholdFor` (`scripts/check-acceptance-methods.mjs:398-402`) takes `parseThreshold(text) ?? spec.threshold ?? 0.99`. `parseThreshold` (line 250) needs a `%` or `score >=`; «at least 0.98» has neither, so it returns null and the token default `pixel-diff.threshold: 0.99` (line 114) applies. TC-13 also declares pixel-diff (its text names NFR-14), so it gets the same 0.99.
- The config route the script offers is dead in this repo: it reads `cfg.acceptance.tokens` (line 173), while `quality/telemetry.config.json` has only `acceptanceArtifacts`, which no script reads (grep over `scripts/`, `tests/`, `.claude/`: no hit). Its `_comment` claims «Consumed by: … check-acceptance-methods.mjs (acceptanceArtifacts)», and its `visual-diff` entry says `gte 0.99`. Both are false documentation.

## Red proof (`PD-8-proof.txt`, 2026-10-12 15:59, no port, nothing left changed)

`PD-8-threshold-probe.mjs` sets the first report the checker walks (`1024-dark-confirm`, 1.0 on `main`) to a probe score, runs `--mode=artifact`, prints the NFR-14 and TC-13 lines, and restores the report and `trace/acceptance-contracts.json` with `git checkout`.

| Probe score | Today's verdict for NFR-14 and TC-13 |
|---|---|
| 1 (as on `main`) | FAIL on `320-dark-setup` 0.9238 «below threshold 0.99» |
| **0.985** (between 0.98 and 0.99) | **FAIL**: «1024-dark-confirm … score 0.985 is below threshold 0.99» |
| 0.975 | FAIL: «… 0.975 is below threshold 0.99» |

A pre-measure of the proposed config (a scratch copy of the checker pointed at a scratch copy of the config; no repo file changed) prints `WARN [config] token "pixel-diff": config lowers threshold 0.99 -> 0.98` and «below threshold 0.98» on `320-dark-setup`, so the 0.99 comes from the token default, not from any requirement or spec text.

## Fix options (both edit the locked `quality/telemetry.config.json`, soft tier)

- **A (recommended): add the live key and remove the dead one.** Add `"acceptance": {"tokens": {"pixel-diff": {"threshold": 0.98}}}` with a `_comment` naming NFR-14 and row 68; delete the unread `acceptanceArtifacts` block and correct the top `_comment`'s «Consumed by» line. The file then says only what a script reads.
- **B: add the live key only.** Leave `acceptanceArtifacts` (and its false `gte 0.99`) as it is. Smaller diff, but the file keeps two contradictory thresholds.
- Not proposed: rewording NFR-14 to «score ≥ 0.98» so `parseThreshold` reads it. That changes signed text to fit a parser.

Expected and accepted: the checker prints one `WARN [config]` line on every run (row 68: «the checker's default is 0.99; a below-default warning is expected»). It is a `config`-class warning; `check-process-ratchet` budgets unknown classes with `*` (strictest band 5).

## Green is earned when (after the yes)

The same probe, with the real checker and the changed config: 0.985 is **not** named (the run names `320-dark-setup … below threshold 0.98`, the next failing report), and 0.975 **is** named «below threshold 0.98». `check-factory-integrity` passes after the re-seal (`--init-lock --adaptation "PD-8: …"`). TC-13 follows NFR-14 (same token).

## As executed

- `quality/telemetry.config.json` (locked, quality tier): new `acceptance` block (`tokens.pixel-diff.threshold` 0.98, with a `_comment` naming NFR-14, row 68 and this PD); the unread `acceptanceArtifacts` block removed; the top `_comment` now says the acceptance check reads `acceptance`.
- Green (`PD-8-green-proof.txt`): probe 0.985 is no longer named (the run names `320-dark-setup` 0.9238 «below threshold 0.98»); probe 0.975 is named «below threshold 0.98»; TC-13 follows. Each run prints the expected `WARN [config]`. `--mode=existence` still PASS (132 contracts). Integrity: WARN quality-tier drift before the re-seal, PASS after (27 locked files; the `core.hooksPath` warning is pre-existing).

## Rollback

Revert the `Refs: PD-8` commit; that restores the config and the PD-6 lock.
