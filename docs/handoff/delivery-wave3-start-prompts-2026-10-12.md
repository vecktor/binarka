# Start prompts: wave 3 of the delivery plan (2026-10-12)

Written by the planning session `peaceful-dijkstra-2dc39e` (branch `claude/peaceful-dijkstra-delivery-plan`) on 2026-10-12, autonomy-log rows 196 to 198. The plan is `docs/handoff/delivery-plan-2026-10-12.md` (measured state, units, dependencies, the user's decisions in section 7). Paste each prompt into its own new session.

**Order.**
1. The user merges `claude/peaceful-dijkstra-delivery-plan` into `main` and pushes, so these prompts are on `main`.
2. **Now, beside wave 2:** the process session (P) and the design session (DS, part 1). They share no file with the dialog and settings sessions.
3. **After the settings session merges:** the recordings session (R). It can write its script earlier, but its final take needs the final page.
4. **Last, serial:** the final session (F), after D, S, P, DS and R have merged.

Merge order: dialog, settings, P, DS, R, F. P has no product code and may merge earlier. Whoever merges after P rebases and re-seals the lock for their own locked-file change.

**Shared rules (every prompt below includes them by reference; read them).**
- Work in your own worktree on a branch named `claude/<name>-<stream>`. `git fetch origin`, `git merge --ff-only origin/main`, confirm with `git log -1 --format=%h`. `npm ci` if node_modules is missing. If you capture the design: in `design/v0`, `npm_config_manage_package_manager_versions=false pnpm install --frozen-lockfile`, then `npm_config_manage_package_manager_versions=false pnpm build`.
- **Ports.** `export BINARKA_PORT_BASE=<your base>` in every shell that captures, and check it with `node scripts/capture-ports.mjs`. The bases: dialog 6373, settings 6473, P 6573, R 6673, DS 6773, F 6873. Never capture on another session's base. `npm run qa:verify` and `npm run gate:status` run the full 170-shot capture (PD-5): use them only when needed, and only on your own base.
- **Logs.** Keep `docs/qa/<stream>/session-log.md` (date, time UTC+5:30 from `date`, what happened, the user's words, evidence). Do NOT edit `docs/autonomy-log.md`, `docs/current-state.md` or `docs/handoff/next-session.md` until you merge. Then copy your log into autonomy-log rows numbered after the last row on `main` at that moment, and update current-state and next-session.
- **The lock.** Only one stream edits `factory-lock.json` at a time; P goes first. Every locked-file change is a PD (`docs/qa/improvements/PD-<n>-<slug>.md`, a red proof, the user's approval, a `Refs: PD-<n>` commit, the re-seal), as PD-1 to PD-6 were.
- Only F commits a full run's 170 `docs/qa/visual-diff/*/report.json`. Commit your own proofs elsewhere and revert the rest.
- Never revert `trace/ledger.jsonl`; commit it, and before a rebase commit it rather than discard it (M23, M24, M27, M28). In zsh write `${REV}:path`, never `$REV:path` (M30). Run `date` before writing any time (M22, M26, M29, M31).
- Signed commits only: probe with `echo probe | gpg --batch --pinentry-mode error --clearsign >/dev/null 2>&1 && git commit -S …` (chain with `&&`, never `;`). If locked, ask the user and batch. Use the `Slice:` and `Refs:` trailers on commits touching `src/`. Never `--no-verify`, never squash.
- Parallel subagents share one session scratchpad: give each its own subdirectory, and have a writer re-verify its output after a sibling finishes. Every done claim needs an evidence path. Absence of evidence is NOT-EARNED, never PASS.
- Not authorised without the user: merging, pushing, CI changes, new dependencies, locked files, the review gate, signatures, moving the pixel reference. The user is shared with up to five sessions: batch your questions and prefer the question form.

---

## P: the process session (now; merges any time, before DS part 2 and R's re-seal)

```text
You are continuing Бінарка (Project Factory). AGENTS.md applies. You are the PROCESS SESSION (stream P) of wave 3 of the delivery plan. You change no file under `src/`, `tests/` or `e2e/`.

Read first: `docs/handoff/delivery-wave3-start-prompts-2026-10-12.md` (order and shared rules; your port base is 6573) and `docs/handoff/delivery-plan-2026-10-12.md` (sections 2.1, 2.4, 3 and 7: the measured failures and the user's decisions). Then the model for a PD: `docs/qa/improvements/PD-4-capture-preview-cleanup.md`, `PD-5-…`, `PD-6-…` and `docs/qa/process-stream/session-log.md`. Measured state: `docs/qa/delivery-plan/*.txt`.

Your work, in this order. Each item is one PD with a red proof, the user's approval, a `Refs: PD-<n>` commit and a re-seal of `factory-lock.json`. Take the next free PD number (PD-7 is a declined candidate; start at PD-8).
1. P-THR: the acceptance check enforces 0.99 for NFR-14 (it can't parse «at least 0.98», and its config key is dead: the script reads `acceptance.tokens`, the config has `acceptanceArtifacts`). Make it read 0.98 for pixel-diff, preferably with `"acceptance": {"tokens": {"pixel-diff": {"threshold": 0.98}}}` in `quality/telemetry.config.json` (its below-default WARN is expected, row 68). Red: a report between 0.98 and 0.99 fails today; green: it passes and one under 0.98 still fails.
2. P-LOGO: a `logo` state driver in `scripts/check-visual-parity-adapters.mjs`. It shows the page's own header logo SVG at 40, 56 and 64 px in the layout of the design's `/logo/` sheet (`design/v0/app/logo/page.tsx` and its CSS). No `src/` change. Red: today's `score: null` on `logo-light` and `logo-dark`. Green: both shots scored on your own base. Report their scores; do not commit `docs/qa/visual-diff/` reports.
3. P-TRAJ: `scripts/check-trajectory.mjs` accepts `clean: true`, OR a signed disposition `docs/qa/review-dispositions/<slice>.json` where every confirmed finding has a fix commit that exists in git or a waiver signed by the user, and no product-code defect is open. It also accepts a signed waiver for a missing `design.md`.
   - NEVER flip `clean` by hand and never edit an archived change folder.
   - Compile the 23 dispositions from the archived `review-findings.json` files. The plan's section 2.4 has the per-slice table; the palette's fixes are mapped from autonomy-log row 160, `2fc41d5` and `faf0b91`.
   - `update-segmented-focus-ring-wording` was never reviewed: ask the user for one review-gate run on its range, instead of a waiver.
   - Give the user ONE table to sign, in one sitting.
   - Red: today's 26 release failures. Green: `node scripts/check-trajectory.mjs --release` exits 0 after the signatures.
   - Keep the committed `docs/qa/trajectory-report.md` the default-mode one: CI runs `--check-fresh` in default mode.
4. P-CI: a Chromium job in `.github/workflows/ci.yml` for `npm run test:e2e` and `npm run check:a11y` (never `check:visual`). First measure locally which specs could depend on fonts (the `nfr-14-*` geometry specs), and report before the user approves. A branch CI run needs a push: ask.
5. P-ADR: prepare ADRs 0006 to 0009 (`docs/adr/`) for the user's accept, change or reject in one sitting, then fold the answers.

Not in your scope: PD-7 (declined by the user on 2026-10-12), any `src/` change, the visual-diff reports, the design.
```

---

## DS: the design session, the 28px level margin (part 1 now; part 2 after the settings session and P merge, and after the user moves the reference)

```text
You are continuing Бінарка (Project Factory). AGENTS.md applies. You are the DESIGN SESSION (stream DS) of wave 3 of the delivery plan: you move the design to the product's signed 28px level margin, so the 12 phone setup shots can pass NFR-14.

Read first: `docs/handoff/delivery-wave3-start-prompts-2026-10-12.md` (order and shared rules; your port base is 6773) and `docs/handoff/delivery-plan-2026-10-12.md` (section 2.2 with the pictures in `docs/qa/delivery-plan/sq5/`, sections 3 and 7). Then `design/README.md` («Pixel reference: frozen»), A-60 and SQ-5 (`docs/requirements.md`, `docs/handoff/setup-sheet-amendment-draft-2026-10-11.md`), `src/ui/style.css` (`.setup-sheet > [data-control='level']`, `margin-bottom: 28px`), `scripts/setup-sheet-deviation.mjs`, and how the reference was moved before (autonomy-log rows 134 and 142).

Part 1 (now; touches `design/` only):
1. A designer subagent sets the design's level-group bottom margin to 28px at every width in `design/v0/app/binarka.css`: the base `.setup .level-control` rule and the 22.5rem rule near line 991, which is now `1rem`. Nothing else changes.
2. A fresh design-reviewer reviews it (maker≠checker).
3. Capture a new set `design/v0-screenshots/review-set-15/` (170 shots, same conditions, with `SHA1SUMS`). Prove that every shot outside the setup states is byte-identical to `review-set-14` (per-file SHA1). List the setup shots that changed. An unstable re-capture is a harness defect: stop and report it.
4. Ask the user, in one question form: move the NFR-14 reference to `review-set-15`, and sign the A-60 wording (the 28px stops being a departure from the design). Do not move it yourself.

Part 2 (after the settings session and P have merged, and after the user's move): rebase onto `main`.
1. Re-point the NFR-14 row (set id and SHA1) and `quality/visual-parity.config.json` (`referenceDir`, `referenceSha1sums`). The config is locked: this is a PD with a re-seal, after P's re-seal.
2. Remove the recorded deviation (`scripts/setup-sheet-deviation.mjs`, its use in `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs`, and the guard tests). Red first for any test that changes, with each change traced to the signed A-60 wording.
3. Refreeze `setupSheet` with the freeze script (never hand-merge `quality/design-geometry.json`).
4. Run the battery and a fresh `check:visual` on your own base. Expected: the 12 phone setup shots reach 0.98 and no other shot changes. Report per shot.
5. The review gate only on the user's yes. Commit only your own proofs, not the 170 reports.
```

---

## R: the recordings and vision session (script now; final take after the settings session merges; H after P merges)

```text
You are continuing Бінарка (Project Factory). AGENTS.md applies. You are the RECORDINGS SESSION (stream R) of wave 3 of the delivery plan: the recorded proofs (G6, G7) and Phase H (`check:vision`, NFR-11 and NFR-15).

Read first: `docs/handoff/delivery-wave3-start-prompts-2026-10-12.md` (order and shared rules; your port base is 6673) and `docs/handoff/delivery-plan-2026-10-12.md` (sections 2.3, 2.7, 3). Then `scripts/record-demos.mjs` (still the factory template), `scripts/check-recordings.mjs` (the manifest contract), `scripts/check-traceability.mjs` (`--strict-recordings`), `docs/requirements-held.md` (NFR-11, NFR-15, and why they are held), FR-119 (the capture-only board), `scripts/check-visual-parity-adapters.mjs` (how it starts its own `vite preview` and sets the capture board; read only, it is locked), and the `vision-verify` skill.

Your work:
1. Adapt `scripts/record-demos.mjs` (not locked). Ports come from `BINARKA_PORT_BASE` (page +3). It starts and stops its own `vite preview`, as the adapter does, and fails if something already answers on the port.
   - Write 12 to 16 clips, one per capability. Each clip drives the real flow and asserts the FRs in its `proof`, and together the clips cover all 115 MVP FRs (`trace/trace.json`).
   - Page FRs go through the page. Engine FRs go through FR-119 capture boards where the page shows them (violations, the win, the hint). Add one CLI clip: it runs `src/cli.ts`, asserts its English text, and shows that output in the clip.
   - Settle before every still. Commit `docs/qa/demo-recordings/` (manifest, webm, png, md).
   - Green: `node scripts/check-recordings.mjs` PASS and `node scripts/check-traceability.mjs --release --strict-tests --strict-recordings` with 0 `recording-evidence` failures.
   - Take the final recording only after the settings session has merged. DS changes no `src/`, so no re-take is needed after it.
2. Phase H.
   - Write `scripts/check-vision.mjs` and the npm script `check:vision`. They read the vision verdicts in the manifests and `docs/qa/vision-report.json`, and must never print a PASS over Scope 0.
   - Run the `vision-verify` workflow with a fresh vision-judge over the stills: the four cell states (violation, given, player entry, hinted) in both schemes for NFR-11, and the header logo at 40 px for NFR-15.
   - See it fail first on a probe still with the non-colour cue removed (`docs/qa/vision-red-run.txt`).
   - Move NFR-11 and NFR-15 from `docs/requirements-held.md` into `docs/requirements.md` with the signed wording (pre-authorised, row 68).
   - Green: `check:acceptance` and `check:acceptance:artifact` see `vision-verify` met, and `node scripts/check-recordings.mjs --require-vision` passes.
   - The new `scripts/check-vision.mjs` is gate-bearing: add it to the lock with a PD and a re-seal, after P has merged and you have rebased.

Not in your scope: `src/` changes. If a clip cannot assert an FR without one, stop and ask.
```

---

## F: the final session (serial, last)

```text
You are continuing Бінарка (Project Factory). AGENTS.md applies. You are the FINAL SESSION (stream F) of wave 3 of the delivery plan. You run the release battery and hand the gates to the user.

Start only when the dialog, settings, P, DS and R branches are merged into `main` (check `docs/current-state.md`). If one is missing, stop and ask.

Read first: `docs/handoff/delivery-wave3-start-prompts-2026-10-12.md` (shared rules; your port base is 6873), `docs/handoff/delivery-plan-2026-10-12.md` (section 6: what «delivered» means and Scope NOT delivered), `scripts/gate-status.mjs`, `scripts/qa-verify.mjs`, and `docs/qa/sign-offs/G1.md`, `G3.md` (the model).

Your work:
1. Run the battery: lint, unit, build, strict, the eval ratchet, e2e and a11y on your own base.
2. Run `npm run test:coverage && BINARKA_PORT_BASE=6873 npm run gate:status` in one shell (`coverage/` is gitignored, so `gate:status` alone shows G5 NOT-EARNED). Save the output as `docs/qa/gate-status-<date>.txt`.
3. Run `npm run qa:verify`.
4. Ratchet the baselines up. `node scripts/check-coverage-ratchet.mjs --update` and, after a truthful green run, `node scripts/check-process-ratchet.mjs --update`. Both are soft-tier locked files: ask the user.
5. Run the `trajectory-eval` workflow (the LLM half) and the global review gate (Phase 7, on the user's yes), with at most one fix round.
6. Commit the full run's 170 visual-diff reports.
7. Compare every gate with section 6 of the plan. Anything short of PASS is reported as it is, never folded into Pass.
8. Ask the user for the G4 to G7 sign-offs in one question form, and record them in `docs/qa/sign-offs/`.
9. Update current-state, next-session and the autonomy log. Merging and pushing happen only on the user's word.
```
