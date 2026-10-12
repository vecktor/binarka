# Delivery plan: the rest of Бінарка (2026-10-12)

Written by the planning session `peaceful-dijkstra-2dc39e` (branch `claude/peaceful-dijkstra-delivery-plan`, from `origin/main` `9304d2c`), 2026-10-12 from 13:07 to 13:38 (UTC+5:30; autonomy-log rows 196 to 198). No file under `src/`, `tests/`, `e2e/`, `scripts/` or `openspec/` changed. AGENTS.md and the rules of `docs/handoff/parallel-g2-plan-2026-10-11.md` («Rules for the parallel sessions», with own ports instead of the lock) still apply.

**The user's decisions:** asked in the question form on 2026-10-12 and folded into section 7: move the design to 28px; a PD for signed review dispositions; acceptance at 0.98, a logo driver, the ADR review (not PD-7); e2e and a11y in CI.

## 1. Measured state (not estimated)

Every check was run one by one on `9304d2c`; the outputs are in `docs/qa/delivery-plan/`. The 170-shot capture was NOT run (PD-5; the dialog and settings sessions capture on 6373 and 6473); the visual state is run 12 (`docs/qa/g2/check-visual-run-12.txt`).

| Check (as the gates run it) | Result | Evidence | Gate it feeds |
|---|---|---|---|
| `check-acceptance-methods --mode=artifact` | **FAIL**, 2 failures (NFR-14, TC-13 pixel-diff) | `acceptance-artifact.txt` | G4, G6, G7 |
| `check-acceptance-methods --mode=existence` | PASS, 132 contracts | `acceptance-existence.txt` | G3 |
| `check-recordings` | **NOT-EARNED**, Scope 0 clips | `recordings.txt` | G6, G7 |
| `check-coverage-ratchet` (as `gate:status` runs it) | SKIP-pending → **NOT-EARNED** in the gate (no `coverage/`) | `coverage-ratchet.txt` | G5 |
| the same, after `npm run test:coverage` | PASS (lines 99.33, statements 97.51, functions 98.19, branches 91.96; all above the baseline) | `test-coverage.txt`, `coverage-ratchet-after-coverage.txt` | G5 |
| `check-traceability` (default) | PASS, 0 failures, 117 warnings | `traceability-default.txt` | G2, G4, G8 |
| `check-traceability --release --strict-tests --strict-recordings` | **FAIL**, 117 failures | `traceability-release.txt` | G7 |
| `check-trajectory` (default) | PASS, 27 warnings | `trajectory-default.txt` | G4 |
| `check-trajectory --release --check-fresh` | **FAIL**, 27 failures | `trajectory-release.txt` | G7 |
| `check-factory-integrity` | PASS, 27 locked files, 1 warning (hooksPath is the main checkout's `.githooks`, absolute) | `factory-integrity.txt` | G4, G7 |
| `check-process-ratchet` | NOT-EARNED (pending baseline), exit 0 | `process-ratchet.txt` | no gate; `qa-verify` Overall |
| `check-eval-ratchet` | PASS, 6 cases | `eval-ratchet.txt` | G6 |
| `correct --check` | PASS, 5 correction signals, 0 open | `correct-check.txt` | every gate (red line if open) |
| CI on `main` (`.github/workflows/ci.yml` lines 28-35), run locally | **red**: `check-traceability --release` 2 failures, `check-trajectory --release` 26 failures | `ci-main-equivalent.txt` | — (the GitHub run itself was not read) |

So, by `scripts/gate-status.mjs` (lines 196-206), without running it: **G4 FAIL** only through the acceptance artifact check; **G5** passes when `npm run test:coverage` runs in the same shell first; **G6 FAIL** through recordings, acceptance artifact and visual; **G7 FAIL** through all five constituents except integrity. G0, G2, G8 PASS; G1 and G3 are signed (`docs/qa/sign-offs/`).

## 2. What is missing, per failing check

### 2.1 Acceptance artifact (G4, G6, G7): two independent defects

1. **The threshold it enforces is 0.99, not the signed 0.98.** `parseThreshold` (`scripts/check-acceptance-methods.mjs:250`) needs a `%` or `score >=`; NFR-14 says «scoring at least 0.98», so it falls back to the token default 0.99 (line 114). The config route is dead: the script reads `cfg.acceptance.tokens` (line 173), while `quality/telemetry.config.json` has the key `acceptanceArtifacts` (whose `visual-diff` entry even says `gte 0.99`). Measured on run 12: 130 of 170 reports are at 0.99 or more, **12 sit between 0.98 and 0.99** (all confirm and settings: `1024-dark-confirm` 0.985, `1440-light-settings-dark` 0.9894, …), 28 under 0.98. Even with every shot at 0.98, G4 stays red unless those 12 reach 0.99. The script names only the first failing report per requirement.
   - Mechanism: a PD (locked file either way): add `"acceptance": {"tokens": {"pixel-diff": {"threshold": 0.98}}}` to `quality/telemetry.config.json` (soft tier; the script prints its below-default WARN, which row 68 expected: «NFR-14 pass mark 0.98 per shot (the checker's default is 0.99; a below-default warning is expected)»), or reword the NFR-14 verify cell with «score ≥ 0.98» (a signed text). **Needs the user** (a locked-file change).
2. **The two logo reports have `score: null`** («no state driver for "logo"»), so they fail at any threshold. Mechanism: a state driver in the locked adapter `scripts/check-visual-parity-adapters.mjs` that shows the page's own logo at 40, 56 and 64 px in the design's `/logo/` sheet layout (`design/v0/app/logo/page.tsx`), or a cut of the two shots from NFR-14 (a signed text and the locked config). **Needs the user.**
3. Below 0.98 (28 shots): 4 confirm and 10 settings (wave 2, running), 12 phone setup (SQ-5, below), 2 logo (above).
4. Noted, not proposed: «fresh» is the report's file mtime within 168 h, and a checkout rewrites mtimes, so old reports look fresh after a clone.

### 2.2 Visual (G6): run 12, 142 of 170

`check-visual-fidelity.mjs` has one global threshold and **no per-shot waiver**; an acceptance waiver (`docs/qa/waivers/`) is per requirement id, so a waiver naming NFR-14 would blank the whole pixel gate. A «waiver» of the 12 phone setup shots therefore has no mechanism today (lesson declared-method-needs-mechanism). Real options: fix the product (the SQ-5 alternative: the design's margins and another fix for the focus ring), move the design to 28px (the designer, a new review set, the user moves the reference, as rows 134 and 142), a PD that adds visible per-shot waivers to two locked checkers, or leave G6 not PASS and name it under «Scope NOT delivered».

**What the 28px changes, seen** (`docs/qa/delivery-plan/sq5/`, made with `compare.mjs` there through the locked adapter's own `capture()` on port base 6873: score 0.9230, equal to run 12). `375-light-setup-design-product-diff.png` puts the design, the product and the gate's diff side by side; `375-light-setup-bottom-zoom.png` shows the last level card and the footer, design above product. The only difference is the gap between «Мозколамка» and the «Почати» / «Закрити» row: 24px in the design, 28px in the product (`src/ui/style.css`, `.setup-sheet > [data-control='level']`, `margin-bottom: 28px`, kept so the focus ring of the last level is not hidden under the footer, `docs/qa/update-page-layout-geometry/nfr-13-red-after-port.txt`). On a phone the sheet is pinned to the bottom and grows upward, so the extra 4px lifts everything above the footer: the size strip, the four cards and their text are all 4px higher, and the diff marks every edge and letter as a mismatch. The footer and the page behind are identical. From 48rem the sheet grows downward, so only the footer moves and those shots pass.

### 2.3 Recordings (G6, G7): 0 clips

- `scripts/record-demos.mjs` is still the factory template (BASE_URL `localhost:3000`, one placeholder clip «01-home-loads» for FR-1). It is not locked.
- `check-traceability --strict-recordings` needs every one of the **115 MVP FRs** in some manifest: 62 belong to `play-page` only, 16 to both specs, **37 to `puzzle-engine` only** (rules, solver, generator, CLI: FR-1 to FR-12, FR-14 to FR-17, FR-19 to FR-24, FR-27 to FR-30, FR-49, FR-50, FR-52 to FR-54, FR-75, FR-78, FR-79, FR-82, FR-83, FR-85).
- Mechanism: adapt `record-demos.mjs` (ports from `BINARKA_PORT_BASE`, page port +3, starting its own `vite preview` as the adapter does); one clip per capability, each driving the flow and asserting the FRs in its `proof`. The page FRs through the page; the engine FRs through the page on FR-119 capture boards where the page shows them (violations, win, uniqueness of the shown solution), and one CLI clip that runs `src/cli.ts`, asserts its text and shows it. Then `check-recordings --require-vision` once H exists. No user decision needed except the CLI-clip shape if the user objects.

### 2.4 Trajectory, release mode (G7): 26 real failures, plus freshness

- **23 review-evidence:** 20 archived slices with `review-findings.json` `clean: false` (the sessions honestly reported «not clean, no product defect»), 2 without a `clean` field (`2026-10-10-update-page-palette`, `2026-10-11-update-page-backdrop`), 1 without the file (`2026-10-10-update-segmented-focus-ring-wording`).
- **3 process:** archived folders without `design.md` (each has `proposal.md`, `tasks.md` and specs; OpenSpec treats `design.md` as optional for small changes, the check does not): `2026-10-10-add-capture-board`, `2026-10-10-fix-size-option-focus-ring`, `2026-10-10-update-segmented-focus-ring-wording`.

**Why the 23 fail, in detail.** `check-trajectory.mjs` (lines 75-86) accepts a slice only if its `review-findings.json` has `clean: true`. The review-gate workflow writes `clean: true` only when its run confirms **zero findings of any severity**. This project's practice has been different: one fix round, one confirming run, and if that run still confirms findings, the session reports «not clean» rather than looping (`docs/handoff/next-session.md`, «How a phase runs», step 5). Nearly every confirming run confirmed something minor, such as docs wording, evidence paths or test fixtures. So the sessions wrote `clean: false` honestly, and the check reads that as «review did not pass». In default mode it is a warning (so G4 passes). Only `--release` (G7, and CI on `main`) makes it a failure. Per slice (from the files):

| Kind | Slices | What the file says |
|---|---|---|
| Confirmed findings, no product-code defect recorded, no disposition list | 2026-10-04 add-puzzle-engine (1), add-rules-and-reset (1); 2026-10-06 add-hinted-cell (2), update-controls-accessibility (6), update-page-layout (5) | `clean: false`, `confirmedTitles` only. The early format, with no per-finding disposition |
| Confirmed findings with dispositions | reconcile-ux-accessibility (11, 3 dispositions), add-difficulty-engine (11, 6), add-logo (1, 2), add-rule-solvable-generator (3, 7), fix-action-button-targets (8 dispositions), add-capture-board (2 code defects, fixed; 10 dispositions), fix-size-option-focus-ring (0 code defects, 8), update-page-layout-geometry (1 code defect, fixed in fix round 1; 15) | `clean: false` with a disposition per finding |
| Passed at a confirming run «with no code defect», minor findings left | add-level-selector, add-english-version, add-theme-switch (run 4), update-setup-sheet-start (run 3), add-violation-cause, update-panel-shell, update-rules-panel | `clean: false` and a verdict text saying so |
| Persisted by hand, no `clean` field | update-page-palette (`wf_42e6a5ef-152`), update-page-backdrop (`wf_4151f42d-f49`): the workflow wrote no file; the user chose «Fix all, then archive» (row 160) | `runs[]` only, so the check reads «unclean» |
| No file | update-segmented-focus-ring-wording (a wording-only change) | missing |

**The two hand-saved files, rechecked (the user's request, 2026-10-12).** Why by hand: the review-gate workflow's persist step sometimes writes no file (`docs/handoff/next-session.md`: «write `review-findings.json` … by hand, `clean` as the run says, with a `persistedBy` note»). These two were written by hand in a different shape (`slice` and `runs[]`), and the top-level `clean` was left out. That is a schema slip, not a hidden result. Written correctly, both would say `clean: false`, because both runs confirmed findings and neither had a confirming run (the user's choice).
- **`update-page-palette`**, run `wf_42e6a5ef-152` on `51a0830..0f5f706`: 8 confirmed, 2 contested, 3 rejected, no product-code defect.
  - The two majors are the same defect: the committed per-block evidence `block-palette.txt` was a crash log (the re-run hit an orphaned preview on 4174), so the per-block pixel claim was unbacked and overstated. It was filed as correction COR-2 (`retro/corrections/002-…`, since dispositioned; `correct --check`: 0 open).
  - The six minors: a stale CSS comment, a duplicate button colour rule, task 3.3 ticked without its artifact, a smoke test that departed from its written steps, a stale default colour in a test helper, and the same crash-log evidence seen by the visual reviewer.
  - Fixed in fix round 1 on «Fix all, then archive» (row 160): `2fc41d5` (deviation check, helper default) and `faf0b91` (comment, duplicate rule, real per-block evidence); vision 8 of 8.
  - The file does not record the fix per finding; the dispositions must map them from row 160 and these two commits.
- **`update-page-backdrop`**, run `wf_4151f42d-f49` on `fb03fdb..bf74837`: 8 confirmed, 4 contested, 5 rejected, no defect in this change's product code. Each finding carries its outcome in the file:
  - Three «major» entries are one defect: the Run 8 masking explanation did not explain the soft-dim drops at 768. The claim was withdrawn.
  - One major is out of scope: the rules panel opened at its bottom, the known bug of row 137, later fixed by block A `update-rules-panel`.
  - The rest are evidence and wording, each «fixed». Fix round 1 on «Fix all, then archive» (row 163); vision 16 of 16.

**The three folders without `design.md`, and why.** All three are small. OpenSpec asks for `design.md` only when a change needs design decisions (`openspec/config.yaml` does not require it). `check-trajectory.mjs` requires it for every archived slice.
- `2026-10-10-add-capture-board` (FR-119, the capture-only board): `proposal.md`, `tasks.md`, spec. Its design was decided in the signed amendment `docs/handoff/capture-board-amendment-draft-2026-10-10.md` (row 143). It is the one of the three that changed real mount behaviour; its waiver should point at that draft rather than a `design.md` written into the archive afterwards (no archived folder is edited).
- `2026-10-10-fix-size-option-focus-ring`: one CSS rule (`.size-control button:focus-visible { outline-offset: -1px }`) and one stylesheet test. Nothing to design.
- `2026-10-10-update-segmented-focus-ring-wording`: wording only, a follow-up that closed a finding of the previous slice's review (`wf_a93ad2d1-bf4`): the spec said the ring sits inside the option, but it runs 1px inside to 2px outside. One assertion was added; no CSS changed. It has **no `review-findings.json` either**, because it was not re-reviewed (row 141: «The follow-up was not re-reviewed»).

**Ways to fix it, and what each costs.** The fix that is NOT allowed is editing `clean` to `true` by hand: that would launder a red into a green.
1. **PD: a signed disposition counts as clean.** The locked check accepts `clean: true`, OR a `disposition` block in which every confirmed finding has a fix commit (one that exists in git) or a waiver signed by the user, and no product-code defect is open. The 23 files are not edited. A new `docs/qa/review-dispositions/<slice>.json` per slice, compiled from the existing files, is what the user signs (one table, one sitting). The 5 early files have no per-finding data; for those the stream lists the confirmed titles and their later fate (a fixing commit or a later slice). For the 3 folders, the same PD lets a signed waiver stand for `design.md` (no archived folder is edited). Cost: about 1 session in the process stream plus one signing sitting. Effect: G7 trajectory and CI on `main` can turn green, and the bar stays computable.
2. **A signed G7 waiver, no script change.** The user signs one waiver listing the 26 items. The check, G7 and CI on `main` stay red, and the handoff names the waiver. Cost: under 1 hour.
3. **Re-run the review gate on each slice.** 23 runs at 6 to 18 minutes each, each on an old diff against today's tree, where later slices rewrote much of that code. A run would most likely confirm new minor findings again, so `clean: true` is not guaranteed. Cost: 3 to 7 hours of runs plus fix rounds, each run on the user's yes.
4. **Stop at G6.** G7 is recorded as not delivered.

- **1 freshness:** the committed `docs/qa/trajectory-report.md` is the default-mode one; the release-mode report differs only by the 26 failures (`Result: FAIL (26 failures)` and the list under «Failures»), so it becomes fresh by itself when the 26 are gone. **Do not commit a release-mode report:** CI runs `--check-fresh` in default mode (`ci.yml` lines 32-35).
- **Guardrail: nobody flips `clean` by hand** in an archived file. `check-trajectory.mjs` has no waiver or disposition support.
- Mechanisms: the four ways above (1 to 4). **Needs the user.**

### 2.5 Traceability, release mode (G7): 117 failures

- 115 `recording-evidence` (2.3) and 2 `active-changes` (`update-confirm-dialog`, `update-settings-panel`: they clear when the two sessions archive).

### 2.6 Process ratchet (no gate; blocks `qa-verify` Overall Pass)

- NOT-EARNED until `node scripts/check-process-ratchet.mjs --update` writes `quality/process-baseline.json` after a truthful green run (soft-tier locked file; WARN and a ledger event). Last in the chain.

### 2.7 Held rows (Phase H)

- NFR-11 (four cell states told apart without colour) and NFR-15 (logo legible at 40 px) are held (`docs/requirements-held.md`). Mechanism: `scripts/check-vision.mjs` plus the npm script `check:vision`, reading the vision verdicts written by the `vision-verify` workflow (a fresh vision-judge) over recorded stills; seen failing first (for example against a probe still with the non-colour cue removed), then the two rows move (pre-authorised by row 68). A new `scripts/check-*.mjs` is gate-bearing: the lock must be re-sealed under a `Refs: PD-<n>` commit (**needs the user**). Its stills come from the recordings (2.3): the four-state board in both schemes, the header logo at 40 px.

### 2.8 Process items for the user (no gate)

- ADRs 0006 to 0009 PROPOSED (`docs/adr/`).
- Candidate PD-7: the rules drivers' script click leaves the ring on «Зрозуміло» (`docs/qa/update-rules-panel/session-log.md` 20:23). Cosmetic: the 20 rules shots pass (0.9913 to 0.9970).
- CI runs no browser check (`ci.yml`: lint, tsc, trace, trajectory, strict, audit, unit, build). `ci.yml` is locked.

## 3. Work units and dependencies

User decisions are their own nodes (◆). Decided ones are marked ✓ (section 7). Sizes are from this repo's own sessions (basis in section 5).

```
running ─ W2-D dialog (merges 1st) ─► W2-S settings (rebases, merges 2nd) ──────────┬──────────────┐
                                                                                   ▼              │
✓Q1 28px ─► DS-1 design 28px + new review set ─► ◆user moves NFR-14 reference ─► DS-2 re-point,  │
                                                     + signs A-60 wording           drop deviation,│
                                                                                    fresh run      │
✓Q2,✓Q3,✓Q4 ─► P process stream: P-THR ─► P-LOGO ─► P-TRAJ ─► P-CI ─► ADR review                  │
                (each PD: ◆user approves + re-seal) │ merges before DS-2, R's re-seal, F           │
                                                    ▼                                              ▼
            R recordings (script now; final take after W2-S and DS-2) ─► H check:vision, NFR-11/15 moved
                                                                                    │
                                                                                    ▼
                                         F final gate run ─► ◆review-gate yes ─► ◆sign-offs G4-G7 ─► ◆merge, push
```

| Unit | What | Blocked by | Owns | Needs the user | Size |
|---|---|---|---|---|---|
| W2-D | dialog block (running) | — | its folder, `.confirm*` | merge, review gate | running |
| W2-S | settings block (running) | W2-D merge (rebase) | its folder, `.settings*` | merge, review gate | running |
| DS-1 | the designer sets the design's level-group bottom margin to 28px at every width (`design/v0/app/binarka.css`: the base `.setup .level-control` rule and the 320 rule at about line 991, now 1rem); a fresh design-reviewer; capture `review-set-15` (170 shots); prove every shot outside the setup state byte-identical to `review-set-14` (SHA1 per file) | — (design only) | `design/v0/`, `design/v0-screenshots/review-set-15/`, `design/README.md` | the user moves the reference in chat and signs the A-60 wording (the 28px stops being a departure) | 0.5 to 1 session |
| DS-2 | re-point NFR-14 (`docs/requirements.md` row: set id and SHA1) and `quality/visual-parity.config.json` (`referenceDir`, `referenceSha1sums`; locked: re-seal under `Refs: PD-<n>`); remove the recorded deviation (`scripts/setup-sheet-deviation.mjs`, its use in `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs`, the guard tests), refreeze `setupSheet`; battery; fresh `check:visual` (expected: the 12 phone setup shots reach 0.98, no other shot changes) | DS-1 and the user's move; W2-S merged (it edits the freeze script and file); P merged (lock) | the files named | the re-seal | 0.5 session |
| P-THR | PD: the acceptance check reads 0.98 for pixel-diff (`quality/telemetry.config.json`, key `acceptance.tokens["pixel-diff"].threshold`; red proof: today's FAIL at 0.99 over a 0.98-0.99 report) | — | `docs/qa/improvements/PD-8-*`, the config, `factory-lock.json` | approve the PD | 1 to 2 h |
| P-LOGO | PD: a `logo` state driver in the locked adapter: the page's own header logo SVG at 40, 56 and 64 px in the design's `/logo/` sheet layout (`design/v0/app/logo/page.tsx`); no `src/` change; red proof: today's `score: null` | — | `scripts/check-visual-parity-adapters.mjs`, `factory-lock.json` | approve the PD | 2 to 3 h |
| P-TRAJ | PD: `check-trajectory.mjs` accepts `clean: true` OR a signed disposition `docs/qa/review-dispositions/<slice>.json` (every confirmed finding with an existing fix commit or the user's waiver; no open product-code defect), and a signed waiver for a missing `design.md`; compile the 23 dispositions from the archived files (no archived file edited; palette's fixes mapped from row 160, `2fc41d5`, `faf0b91`); `update-segmented-focus-ring-wording` was never reviewed, so it gets one review-gate run on its range (the user's yes) instead of a waiver; the three folders without `design.md` get a signed waiver each (for `add-capture-board` the waiver points at its signed amendment draft, which holds its design); red proof: today's 26 failures | — | the script, `docs/qa/review-dispositions/`, `factory-lock.json` | approve the PD; sign the compiled table in one sitting | 3 to 4 h |
| P-CI | PD: a Chromium job in `.github/workflows/ci.yml` for `npm run test:e2e` and `npm run check:a11y` (not `check:visual`: NFR-14 needs the same machine and fonts); first measure which specs fail on Linux fonts and report before the user approves | P-TRAJ (so CI on `main` can be green) | `ci.yml`, `factory-lock.json` | approve the PD; a push for a branch CI run | 1 to 2 h + one CI run |
| P-ADR | prepare ADRs 0006 to 0009 for the user's accept, change or reject in one sitting; fold the answers | — | `docs/adr/0006-0009` | the decisions | 0.5 h + the sitting |
| R | recordings: adapt `scripts/record-demos.mjs` (ports from `BINARKA_PORT_BASE`, its own `vite preview`); 12 to 16 clips whose `proof` lists cover the 115 MVP FRs (page FRs through the page; engine FRs through FR-119 capture boards where the page shows them, and one CLI clip that runs `src/cli.ts`, asserts its text and shows it); commit the manifest, webm and png | script: none; final take: W2-S and DS-2 merged | `scripts/record-demos.mjs`, `docs/qa/demo-recordings/` | none | 1 to 1.5 sessions |
| H | `scripts/check-vision.mjs` and `npm run check:vision` (reads the vision verdicts in the manifests and `docs/qa/vision-report.json`); the `vision-verify` workflow with a fresh vision-judge over R's stills (the four cell states in both schemes for NFR-11; the header logo at 40 px for NFR-15); seen failing first on a probe still without the non-colour cue; then NFR-11 and NFR-15 move (pre-authorised, row 68); `check-recordings --require-vision` | R; P merged (H's new `check-*.mjs` needs a re-seal after P's) | the script, `package.json` script line, `docs/qa/vision-report.json`, the two rows | the re-seal | 0.5 to 1 session |
| F | final, serial: on its own port base `npm run test:coverage && npm run gate:status`; `npm run qa:verify`; coverage `--update` and process ratchet `--update` (soft tier); trajectory-eval (the LLM half); the global review gate (Phase 7); at most one fix round; the handoff | every unit above | generated reports, `quality/*-baseline.json` | review-gate yes, soft-tier baselines, sign-offs G4 to G7, merge, push | 0.5 to 1 session + the user's sign-offs |

Not planned (declined by the user on 2026-10-12): candidate PD-7 (the rules drivers' focus ring on «Зрозуміло»; cosmetic, the 20 rules shots pass). It stays a candidate in `docs/qa/update-rules-panel/session-log.md` 20:23.

## 4. Parallel streams

Wave 3 can start now, beside wave 2. Each session works in its own worktree from `origin/main`, on a branch `claude/<name>-<stream>`, with its own `BINARKA_PORT_BASE` (five ports from the base: e2e +0, gate +1, page +3, design +4; `node scripts/capture-ports.mjs`). Start prompts: `docs/handoff/delivery-wave3-start-prompts-2026-10-12.md`.

| Stream | Session | Port base | Owns | Must not touch | Merge position |
|---|---|---|---|---|---|
| D | dialog (running) | 6373 | as its prompt | — | 1 |
| S | settings (running) | 6473 | as its prompt | — | 2 |
| P | process (P-THR, P-LOGO, P-TRAJ, P-CI, P-ADR, in this order) | 6573 | `docs/qa/improvements/PD-8` and later, `docs/qa/review-dispositions/`, `docs/adr/0006-0009`, `quality/telemetry.config.json`, `scripts/check-visual-parity-adapters.mjs`, `scripts/check-trajectory.mjs`, `.github/workflows/ci.yml`, `factory-lock.json` | `src/`, `tests/`, `e2e/`, `scripts/visual-block.mjs`, `scripts/freeze-*`, `quality/design-*.json`, `quality/visual-parity.config.json`, `docs/qa/visual-diff/*/report.json` (commit proofs only), archived change folders | 3 (no product code; may merge before S if ready, then S needs no rebase for it: no shared file) |
| DS | design 28px (DS-1 now, DS-2 after S, P and the user's move) | 6773 | `design/v0/`, `design/v0-screenshots/review-set-15/`, `design/README.md`; in DS-2 the files named in section 3 | `src/`, the frozen sets 1 to 14, the other streams' files | 4 |
| R | recordings and H | 6673 | `scripts/record-demos.mjs`, `scripts/check-vision.mjs`, its `package.json` line, `docs/qa/demo-recordings/`, `docs/qa/vision-report.*`, the NFR-11 and NFR-15 rows | `src/`, any locked file before P merges | 5 (re-record after DS-2 if the setup shots' page changed; it does not: DS-2 changes no `src/`) |
| F | final (serial) | 6873 | generated reports, baselines, sign-off records | — | last |

Rules (as wave 2):
- Only one stream at a time edits `factory-lock.json`. P goes first; DS-2 and H re-seal after rebasing onto P.
- Only F commits a full run's 170 `docs/qa/visual-diff/*/report.json`. A stream commits its own proofs elsewhere.
- A parallel session keeps `docs/qa/<stream>/session-log.md` and does not edit `docs/autonomy-log.md`, `docs/current-state.md` or `docs/handoff/next-session.md` until it merges. The merging session numbers its rows after the last row on `main` at that moment.
- Never revert `trace/ledger.jsonl`; commit it, and before a rebase commit it rather than discard it.
- The user is shared with five sessions: batch questions, prefer the question form.

**This planning branch** adds autonomy rows 196 to 198. If the dialog or settings session merges first and takes those numbers, this branch renumbers on its rebase (row 76 is the precedent). It has no product code and may merge at any position; it should merge before wave 3 starts, so the prompts are on `main`.

## 5. Critical path and sizes

Critical path: **W2-D → W2-S → DS-2 (after DS-1 and the user's move; P merged) → R final take → H → F → the user's sign-offs.** P runs beside wave 2 and must merge before DS-2. DS-1 runs beside wave 2.

| Unit | Size | Basis |
|---|---|---|
| a G2 block | 1 session, 3.5 to 4.5 h | block A `update-rules-panel`: 17:55 to 21:31 to green plus review (`docs/qa/update-rules-panel/session-log.md`); block B ran 17:55 to 08:07 next day with two rebases and the night between |
| DS-1 | 0.5 to 1 session | the G2 reference moves of rows 134 and 142 (one session each, with the user's move); here one CSS value |
| DS-2 | 0.5 session | a re-point plus one refreeze; the refreezes of block B (`docs/qa/update-setup-sheet/refreeze.txt`) |
| P | 1.5 to 2 sessions, 7 to 10 h | session C: PD-4 and PD-5 drafted with red proofs 17:55 to 18:18, PD-4 to PD-6 implemented and re-sealed by 21:56, plus four ADRs (`docs/qa/process-stream/session-log.md` C1 to C17); here four PDs, one of them with 23 compiled dispositions |
| R | 1 to 1.5 sessions | G1: twelve e2e specs and six row moves in one session (rows 104 to 111); R needs 12 to 16 clips |
| H | 0.5 to 1 session | one script on the `check-recordings` pattern, one vision-verify run (as the 24-still verdict `docs/qa/update-setup-sheet/stills/vision-verdict.txt`), two row moves (as rows 105 to 110) |
| a review-gate run | 6 to 18 minutes | `wf_05b54e15-01b` (21:20 to 21:26), `wf_96f2007e-603` (20:55 to 21:13, 32 agents) |
| a full 170-shot capture | about 2 to 3 minutes | run 12, 07:57 to 07:59 |
| F | 0.5 to 1 session | the gate run, one global review gate, one fix round at most, the handoff |

After wave 2 merges, about 3 to 4 sessions on the critical path (about 10 to 15 hours of session time), plus the user's turnaround for signatures, GPG, the reference move and merges. P (7 to 10 h) runs beside wave 2 and is not on the path, provided it merges before DS-2.

## 6. What «delivered» means, and Scope NOT delivered

**Delivered** means all of the following on the final `main`, each with its evidence path:
- `npm run test:coverage && npm run gate:status` on F's own port base shows **G4, G5, G6 and G7 PASS** (G7 through the signed dispositions of P-TRAJ, not by any hand-flipped `clean`).
- `npm run qa:verify` prints Overall Pass, with the process ratchet earned.
- **NFR-14: all 170 shots at 0.98** against `review-set-15` (the 28px design, moved by the user). The logo shots are measured through the P-LOGO driver, and the acceptance check reads 0.98 (P-THR).
- NFR-11 and NFR-15 are moved into `docs/requirements.md` and met by a fresh vision-judge (`check:vision`).
- CI on `main` is green, with e2e and a11y in it (P-CI).
- ADRs 0006 to 0009 are decided.
- G4 to G7 are signed by the user in `docs/qa/sign-offs/`.

No gate is waived. The one waiver class is P-TRAJ's per-finding waivers, each signed and visible in the dispositions.

**Scope NOT delivered** (the user's choices):
- FR-18 and FR-45 to FR-48 (Future).
- Safari and Firefox: untested (NFR-7 is Chromium; A-14 «supported by design, untested»).
- `check:visual` in CI (NFR-14 needs the same machine and fonts; it stays local).
- Candidate PD-7 (declined 2026-10-12).
- The hover, press and motion of the settings panel and the dialog (DQ-3, OQ-5), the setup sheet's motion (SQ-6), the design's mask shadow on «Закрити» (block B).
- The idle-line cuts between the sampled viewports (accepted, row 194).
- Continuum coverage: NFR-14 and the sweeps are sampled (170 shots), never continuum.
- Test-first order and review independence: no check verifies them (`docs/lessons/factory-enforces-artifacts-not-order.md`); trajectory-eval grades them by judgment only.

## 7. The user's decisions (2026-10-12, in the question form; folded above)

| # | Question | Answer | Effect |
|---|---|---|---|
| Q1 | The 12 phone setup shots (the 28px level margin) | First «show me this difference visually so I understand what is changing» (answered with `docs/qa/delivery-plan/sq5/`, section 2.2), then **«Move design to 28px (Recommended)»** | Units DS-1 and DS-2; the user moves the reference and signs the A-60 wording |
| Q2 | G7 history (23 not-clean reviews, 3 folders without `design.md`) | First «again, explain in details why it fails and how could be fixed» (answered in section 2.4), then **«PD: signed dispositions (Recommended)»** | Unit P-TRAJ; the user signs one compiled table |
| Q3 | Process items (multi-select) | **«Acceptance reads 0.98»**, **«Logo state driver»**, **«Review ADRs 0006-0009»**; PD-7 not chosen | Units P-THR, P-LOGO, P-ADR; PD-7 under Scope NOT delivered |
| Q4 | CI browser checks | **«Add e2e + a11y to CI (Recommended)»** | Unit P-CI |
| — | Safari and Firefox, stream order | not asked: Safari and Firefox stay out (the user's earlier choice, A-14); the order is section 5's | — |
