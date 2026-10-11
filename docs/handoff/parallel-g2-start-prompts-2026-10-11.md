# Start prompts: sessions A, B and C of the parallel G2 plan (2026-10-11)

Written by the prep session `vibrant-tu-434033` at about 17:35 (UTC+5:30), autonomy-log row 173, and updated at about 17:52 after the shell's archive (row 174). The brief is `docs/handoff/parallel-g2-plan-2026-10-11.md`. Paste each prompt into its own new session.

**Order.** P2 is no longer needed: the prep session ran the shell's review gate, its fix round and its archive itself (autonomy-log row 174; `openspec/changes/archive/2026-10-11-update-panel-shell/`). The user merges `claude/vibrant-tu-434033` into `main` and pushes; then A, B and C start from `main` in parallel. (C has no product code and could start earlier if the user wishes.)

---

## A: the rules panel (parallel)

```text
You are continuing Бінарка (Project Factory). AGENTS.md applies. You are SESSION A of the parallel G2 plan: the rules panel.

Start point: `main` after the shell slice `update-panel-shell` is archived and merged (check: `openspec/changes/archive/*-update-panel-shell/` exists on `main`; if not, stop and ask the user). Work in your own worktree on a branch named `claude/<name>-rules`. Fast-forward it to `main` (`git merge --ff-only main`) and confirm with `git log -1 --format=%h`. `npm ci` if node_modules is missing. Build the design reference: in `design/v0`, `npm_config_manage_package_manager_versions=false pnpm install --frozen-lockfile`, then `npm_config_manage_package_manager_versions=false pnpm build`.

Read first: `docs/handoff/parallel-g2-plan-2026-10-11.md` («Rules for the parallel sessions»), `docs/handoff/rules-panel-amendment-draft-2026-10-11.md` (SIGNED; RQ-1 A: sticky «Зрозуміло» plus a scroll reset on close and on open; XQ-1 A: the root's `data-size`), `docs/requirements.md` (FR-57, FR-65, NFR-14, A-59), and your change folder `openspec/changes/update-rules-panel/` (proposal, design, tasks, delta spec; audited, `docs/qa/update-rules-panel/folder-audit.md`). Evidence: `docs/qa/prep-g2/rules-open-probe.txt`, `rules-reopen-probe.txt`, `soft-dim-768-classify.txt`; `docs/qa/visual-diff/README.md` § Run 10 and § Correction of Run 8.

Your work: `openspec/changes/update-rules-panel/tasks.md`, section 0 onward. In short: task 1 (a fresh auditor re-reads the folder if the baseline changed since it was written, which it did: the shell is archived); red tests first (a test-engineer; you confirm red yourself); the freeze of the `rulesPanel` geometry cases (keep the top-level provenance when `designCommit` and `designCssSha1` are unchanged); the port (only `.rules*`, `.rules-close`, the example cells in `src/ui/style.css`, and the scroll reset in `src/ui/play-page.ts`); the battery; a smoke test in a real browser (phone, 768, 1366×650, 1440×900, light and dark; open, scroll, close, reopen; keyboard; the stuck button's focus ring not clipped); the per-block tool and a `check:visual` run (the run number: the next free number on `main` at that time); the review gate ONLY with the user's yes; the archive; the merge only on the user's word.

Rules for this parallel session:
- Captures take turns: before any `check:visual`, `scripts/visual-block.mjs`, freeze script or Playwright run, `mkdir /tmp/binarka-capture.lock` (fails if it exists) and write your session name into it; if it exists, wait, never delete another session's lock, ask the user if it is older than 30 minutes. Check `lsof -nP -iTCP:<port> -sTCP:LISTEN` for 4173, 4174, 4176, 4177 before and after; stop only orphans of your own worktree (check the process's working directory). Remove the lock after the run and the port check.
- Logs: keep `docs/qa/update-rules-panel/session-log.md` (date, time UTC+5:30, what happened, the user's words, evidence). Do NOT edit `docs/autonomy-log.md`, `docs/current-state.md` or `docs/handoff/next-session.md`. Only when you merge into `main` do you copy your log into autonomy-log rows numbered after the last row on `main` at that moment, and update current-state and next-session.
- Merging: the first of A and B to finish merges into `main` on the user's word. If B merged first, rebase onto `main` (expected conflicts: `src/ui/style.css`, the baseline spec after B's archive, `quality/design-geometry.json`, `scripts/freeze-design-geometry.mjs`, `scripts/visual-block.mjs`, `README.md`, the token and pair lists, `docs/qa/a11y-report.json`), re-run the whole battery and a fresh `check:visual`, and merge only on the user's word.
- Signed commits only (probe GPG right before each commit; if locked, ask the user and batch). `-m` subject first; `Slice: update-rules-panel` and `Refs:` trailers on commits touching `src/`. Never `--no-verify`, never squash. `date` before writing any time. Revert tool-rewritten reports unless evidence. Subagents leave no scratch files under `tests/`. Every done claim needs an evidence path.
- Not authorised without the user: merging, pushing, CI changes, new dependencies, locked files (`factory-lock.json`), the review gate.
- The user is shared with sessions B and C: batch your questions; prefer the question form.
```

---

## B: the setup sheet (parallel)

```text
You are continuing Бінарка (Project Factory). AGENTS.md applies. You are SESSION B of the parallel G2 plan: the setup sheet.

Start point: `main` after the shell slice `update-panel-shell` is archived and merged (check: `openspec/changes/archive/*-update-panel-shell/` exists on `main`; if not, stop and ask the user). Work in your own worktree on a branch named `claude/<name>-setup`. Fast-forward it to `main` (`git merge --ff-only main`) and confirm with `git log -1 --format=%h`. `npm ci` if node_modules is missing. Build the design reference: in `design/v0`, `npm_config_manage_package_manager_versions=false pnpm install --frozen-lockfile`, then `npm_config_manage_package_manager_versions=false pnpm build`.

Read first: `docs/handoff/parallel-g2-plan-2026-10-11.md` («Rules for the parallel sessions»), `docs/handoff/setup-sheet-amendment-draft-2026-10-11.md` (SIGNED; SQ-1 A: the option border is decoration; SQ-2: `--color-shadow-sunken` withdrawn; SQ-3 A: the radial-gradient dot; SQ-5: keep the 28px level margin; XQ-1 A: the root's `data-size`), `docs/requirements.md` (FR-65, FR-96, FR-99, A-57 appendix, A-60), and your change folder `openspec/changes/update-setup-sheet/` (audited, `docs/qa/update-setup-sheet/folder-audit.md`). Evidence: `docs/qa/prep-g2/soft-dim-768-classify.txt`; `docs/qa/visual-diff/README.md` § Run 10.

Open point for the user before the port (ask early, in one question round with any others): the folder's open point 1 gives the UNCHECKED size options the design's muted text at weight 500, which goes beyond the signed text (the amendment signed only the checked option's paint). Default: include it (it is the design's look; the pair already exists).

Your work: `openspec/changes/update-setup-sheet/tasks.md`, section 0 onward. In short: task 1 (a fresh auditor re-reads the folder against the post-shell baseline, and again if A merged first); red tests first (a test-engineer; you confirm red yourself); the freeze of the `setupSheet` geometry cases (after rebasing onto A if A merged; keep the top-level provenance when `designCommit` and `designCssSha1` are unchanged; the 28px deviation recorded with its design-value guard); the port (only `.setup-sheet*`, `.level-control*`, `.size-control` in the sheet, `.setup-start`, `.setup-close`, the reason line and the one `:root` token in `src/ui/style.css`; never `.rules*` or `src/ui/play-page.ts`); the battery; a smoke test in a real browser (320, 375, 768, 1024×768, 1366×650, 1440×900; light and dark; the 4×4 unavailable levels; keyboard focus not obscured by the footer); the per-block tool and a `check:visual` run (the next free run number on `main` at that time); the review gate ONLY with the user's yes; the archive; the merge only on the user's word.

Rules for this parallel session:
- Captures take turns: before any `check:visual`, `scripts/visual-block.mjs`, freeze script or Playwright run, `mkdir /tmp/binarka-capture.lock` (fails if it exists) and write your session name into it; if it exists, wait, never delete another session's lock, ask the user if it is older than 30 minutes. Check `lsof -nP -iTCP:<port> -sTCP:LISTEN` for 4173, 4174, 4176, 4177 before and after; stop only orphans of your own worktree. Remove the lock after the run and the port check.
- Logs: keep `docs/qa/update-setup-sheet/session-log.md` (date, time UTC+5:30, what happened, the user's words, evidence). Do NOT edit `docs/autonomy-log.md`, `docs/current-state.md` or `docs/handoff/next-session.md`. Only when you merge into `main` do you copy your log into autonomy-log rows numbered after the last row on `main` at that moment, and update current-state and next-session.
- Merging: the first of A and B to finish merges into `main` on the user's word. If A merged first, rebase onto `main` (expected conflicts: `src/ui/style.css`, the baseline spec after A's archive, `quality/design-geometry.json`, `scripts/freeze-design-geometry.mjs`, `scripts/visual-block.mjs`, `README.md`, `docs/qa/a11y-report.json`), re-run the folder audit if the baseline moved, the whole battery and a fresh `check:visual`, and merge only on the user's word.
- Signed commits only (probe GPG right before each commit; if locked, ask the user and batch). `-m` subject first; `Slice: update-setup-sheet` and `Refs:` trailers on commits touching `src/`. Never `--no-verify`, never squash. `date` before writing any time. Revert tool-rewritten reports unless evidence. Subagents leave no scratch files under `tests/`. Every done claim needs an evidence path.
- Not authorised without the user: merging, pushing, CI changes, new dependencies, locked files (`factory-lock.json`), the review gate.
- The user is shared with sessions A and C: batch your questions; prefer the question form.
```

---

## C: the process stream (parallel; no product code)

```text
You are continuing Бінарка (Project Factory). AGENTS.md applies. You are SESSION C of the parallel G2 plan: the process stream. You change no `src/` file.

Start point: `main` (after the user merged the prep branch `claude/vibrant-tu-434033`, or as the user says). Work in your own worktree on a branch named `claude/<name>-process`. Fast-forward it to `main` and confirm with `git log -1 --format=%h`. `npm ci` if node_modules is missing.

Read first: `docs/handoff/parallel-g2-plan-2026-10-11.md` (section «C: the process stream» and «Rules for the parallel sessions»), `docs/autonomy-log.md` rows 170 to 173, `docs/qa/improvements/PD-1-*` to `PD-3-*` (the format of a PD proposal and its red proof), `docs/qa/visual-diff/README.md` § Known gaps.

Your work:
1. PD-4: the capture path (`scripts/check-visual-parity-adapters.mjs`, locked; `scripts/visual-block.mjs`) leaves orphaned `vite preview` children on 4173 to 4177. Propose killing the process group; consider making the ports configurable by an environment variable so parallel sessions need no lock (a design choice for the user). `docs/qa/improvements/PD-4-<slug>.md` with a red proof.
2. PD-5: `qa-verify` and `gate:status` run `scripts/check-visual-fidelity.mjs` without `CHECK_VISUAL_FIDELITY_ADAPTERS=scripts/check-visual-parity-adapters.mjs` and rewrite the 170 `docs/qa/visual-diff/*/report.json` with a different verdict. `docs/qa/improvements/PD-5-<slug>.md` with a red proof. Revert the 170 reports after any run that rewrites them.
3. The locked files (`factory-lock.json`) change only after the user approves each PD, with a `Refs: PD-<n>` commit.
4. ADRs for the user's review, from the archived `design.md` of `2026-10-10-update-page-palette` and `2026-10-11-update-page-backdrop`, and of `update-panel-shell` once archived: 0006 the given cue is font weight (palette decision 4); 0007 translucent colours as tokens (palette decision 7); 0008 a backdrop is checked as a composite (backdrop decision 2); 0009 the page root carries the board size as `data-size` instead of a has-selector (the shell's design decision 2; the user's choice, row 173). Not palette decision 11.

Rules for this parallel session:
- Your PD proofs run captures: take `mkdir /tmp/binarka-capture.lock` (write your session name into it; wait if it exists; never delete another session's lock; ask the user if it is older than 30 minutes), check the ports before and after, stop only orphans of your own worktree, remove the lock after.
- Logs: keep `docs/qa/process-stream/session-log.md`. Do NOT edit `docs/autonomy-log.md`, `docs/current-state.md` or `docs/handoff/next-session.md` until you merge; then copy your log into autonomy-log rows numbered after the last row on `main` at that moment.
- You may merge into `main` at any time, on the user's word (no product code).
- Signed commits only (probe GPG right before each commit; if locked, ask the user and batch). `-m` subject first. Never `--no-verify`, never squash. `date` before writing any time. Every done claim needs an evidence path.
- Not authorised without the user: merging, pushing, CI changes, new dependencies, locked-file edits without an approved `Refs: PD-<n>`.
- The user is shared with sessions A and B: batch your questions; prefer the question form.
```
