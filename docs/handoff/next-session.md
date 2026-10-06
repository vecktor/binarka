# Start prompt for the next session

Each phase of the UX iteration runs in its **own new session** (the user's choice, 2026-10-05 about 23:50). A session runs exactly one phase, then updates this file and `docs/current-state.md`, commits, and leaves a chip for the next phase. The user starts each new session by clicking that chip (or by pasting the block below).

---

You are continuing **Бінарка** (Project Factory; TypeScript, Vite, vanilla DOM, Vitest). The course capstone was delivered on 2026-10-04 (signed tag `submission-2026-10-04`, `main` at `db76f02`). We are in the post-submission UX iteration. The requirements amendment for UX decisions 1–30 was **signed by the user on 2026-10-05 at about 23:31** (autonomy-log rows 57 to 59).

**Where to work.** Your session has its own worktree and branch. First bring it to the previous phase's tip: `git fetch` is not needed (all branches are local); run `git merge --ff-only <previous phase branch>`. The previous phase branch is named in the chip that started you and in `docs/current-state.md` ("Working branch"). If the fast-forward fails, stop and ask the user. Never edit a worktree another session owns (`.claude/worktrees/git-https-to-ssh-ed7693` holds an uncommitted `trace/ledger.jsonl`; leave it alone). Phase 0 (the amendment and the change folders A, B, C, E) is on branch `claude/next-session-handoff-15b81c`.

**Read first, in order:**
1. `AGENTS.md`
2. `docs/current-state.md` (Last Updated, Working branch, Next task)
3. `docs/mvp-capability-plan.md` section 4.7 (slices A to H, order, definition of done)
4. `docs/requirements.md` (the 2026-10-05 amendment) and `docs/requirements-held.md`
5. `docs/autonomy-log.md` rows 32 to 40 (how a slice runs) and 57 to 59 (this amendment and the pre-authorisations), mistakes M12 to M17
6. `openspec/specs/play-page/spec.md`, and your phase's change folder under `openspec/changes/`
7. `docs/design/ux-decisions.md`, `design/README.md` ("Pixel reference: frozen")
8. `docs/lessons/factory-enforces-artifacts-not-order.md`

Run `date` first and before every time claim; the user is UTC+5:30 (Kyiv is 2:30 earlier).

## Phases (one per session, in this order)

| Phase | Change | Requirements | Notes |
|---|---|---|---|
| A | `update-page-layout` (folder exists) | FR-57, FR-61, FR-64, A-26, NFR-5 | Creates `src/ui/strings.ts` and moves **every** Ukrainian page text there (user decision, row 58). Rules popover, page order, idle line. |
| B | `add-hinted-cell` (folder exists) | FR-59, FR-39 | |
| C | `update-controls-accessibility` (folder exists) | FR-60, FR-42, FR-43, FR-58, FR-66, FR-62, FR-63, A-20, A-24, NFR-5 | The largest slice; the size-selector and reset tests change on purpose. Rebase any shared delta on the baseline as archived by A, if its tasks.md says so. |
| D | `update-win-apostrophe` (folder exists, audited and fixed `a7ddd9e`) | FR-41 (U+02BC) | Runs after C (done). Task 1.2 re-greps every U+0027 pin in `tests/` first (`tests/play-page-page-text.test.ts:106` is one; C's rewrite already compares to `WIN_MESSAGE`). |
| E | `add-logo` (folder exists) | FR-65, TC-14 | Inline SVG from the frozen design. |
| F | `add-rule-solvable-generator` (folder exists, audited and fixed `6d2bd79`; scenario 2 corrected against the engine) | FR-27, A-5, A-30 | Engine only. NFR-1 to NFR-3 must hold; if they cannot, **stop and ask the user** (never relax a bound). |
| G1 | browser checks | NFR-7, NFR-9, NFR-11, NFR-12, TC-13, A-14 | Install the four approved dev dependencies (`@playwright/test`, `pixelmatch`, `pngjs`, `@axe-core/playwright`) and run `npx playwright install chromium` (pre-authorised, row 59). Build `check:a11y` (exists, needs the packages) and Playwright tests for NFR-9 and NFR-11 at the viewports declared in the held rows (`sampled`, not continuum). Show each check **running and failing** against today's page first (save the output under `docs/qa/`), then move the held rows into `docs/requirements.md` with the signed wording (pre-authorised, row 59), one logged commit per move. |
| G2 | design fidelity | NFR-13 | Write `quality/visual-parity.config.json` (reference: served `design/v0/out`, or the frozen `review-set-5` shots; product: the built page), with decision 25's capture conditions and **0.98 per shot** (row 59). Show `npm run check:visual` running and failing, then move NFR-13 into `docs/requirements.md`. Then converge the page **block by block** (AGENTS.md lessons: per-block done, overlay and onion-skin, capture determinism). Likely more than one session; each session ends with the per-shot scores in `docs/qa/visual-diff/`. |
| H | `check:vision` | NFR-10, NFR-14 | Write the script (no package), see it fail, move the two rows. Uses the `vision-verify` skill with a fresh vision-judge. |

D and E may run before C if C is blocked; F may run any time. G1 must come before G2.

## Orchestrator mode (the user's choice, 2026-10-06 about 00:05)

One new session orchestrates every phase in order, A to H, without stopping between phases. It does each phase's steps itself and gives the heavy work to fresh subagents (spec-writer, spec-compliance-auditor, test-engineer, capability-implementer, the review-gate workflow, vision-judge). A subagent cannot start its own subagents or workflows, so the orchestrator never hands a whole phase to one subagent. The user opted into the review-gate workflow for every slice.

- **Start in your own worktree.** A scheduled or fresh session starts in the main checkout on `main` (probe `binarka-autonomy-probe`, 2026-10-05 23:55). Load `EnterWorktree` with ToolSearch and create a worktree first, then `git merge --ff-only claude/next-session-handoff-15b81c` (or the newest "Working branch" in `docs/current-state.md`). Never commit on `main` and never work in the main checkout.
- **After each phase:** commit, update `docs/current-state.md` ("Working branch" = your branch) and the autonomy log, then go on to the next phase. No chip is needed between phases in this mode; leave one chip only when you stop.
- **Stop and leave a chip** (with your branch name and the next phase) when: FR-27 cannot hold NFR-1 to NFR-3; a review-gate confirming run still has a confirmed code defect; a step needs anything that is not pre-authorised (row 59); the battery fails and one fix attempt does not make it green; or G2 has converged as far as it can in this session (report the per-shot scores).
- A scheduled run cannot answer questions. Do not ask; stop at the condition and write why in `docs/current-state.md`.

## How a phase runs (as slices 3 and 4 did)

1. Fast-forward (above). `npm ci` if `node_modules` is missing or stale. Run the battery once: `npm run lint`, `npm run test:run`, `npm run build`, `npx openspec validate --all --strict`, `node scripts/check-eval-ratchet.mjs`.
2. If the phase has no change folder, the spec-writer (Sonnet) writes it from the signed rows. Either way, run one fresh read-only check of the folder (spec-compliance-auditor, Sonnet) before any test; the folders for A, B, C and E were written in one pass (autonomy-log row 60) and have had no independent check yet.
3. Test-engineer (Sonnet) writes the tests first. **Confirm red yourself** in a scratch copy and save the evidence as `docs/qa/<change>-red-run.txt`. Commit the red tests.
4. Capability-implementer (Sonnet) makes them green. **Confirm green yourself** with the full battery.
5. Review-gate workflow (base: the red commit). One fix round and one confirming run; if it is still not clean, report it as not clean instead of looping.
6. A 375 px check in the built-in browser (jsdom cannot see layout, TC-13), screenshots in `docs/qa/<change>/`.
7. Archive (`npx openspec archive <change> --yes`), strict validation, `npm run check:trace`.
8. Update `docs/current-state.md` (Last Updated, Working branch = your branch, Next task = the next phase), this file's table if anything changed, and an autonomy-log row. Commit.
9. Leave a chip for the next phase with `spawn_task`. The chip's prompt must name **your branch** (for the fast-forward) and the phase to run, and say "read `docs/handoff/next-session.md` first". Tell the user the phase is done, with evidence paths, and stop.

Commit trailers: `Slice: <change-name>` and `Refs: FR-x` on every commit touching `src/`. Never `--no-verify`, never squash.

## Pre-authorised by the user (row 59) and what is not

- Moving the held rows into `docs/requirements.md` with the signed wording, once their check is shown running and failing; NFR-13 last.
- NFR-13 pass mark: 0.98 per shot (the checker's default is 0.99; a below-default warning is expected).
- Installing the four approved dev dependencies and the Chromium download.
- If the GPG probe fails: commit with `--no-gpg-sign`, log it, and leave the re-sign (with a backup branch) for when the user is back.
- **Not authorised:** push, PR, merge, any other dependency, hook, settings or `AGENTS.md` change, changing the frozen design or `review-set-5`, relaxing a test or a bound. Stop and ask.

## State at the 2026-10-06 handoff (session `heuristic-lovelace-5e57b4`)

- Phases A, B and C are archived on branch `claude/heuristic-lovelace-5e57b4`. Fast-forward to it. Next: **D**, then E, F, G1, G2, H.
- Decided by the user: no language switch before G2 (row 62); «Зрозуміло» autofocus and the rules panel `role="dialog"` (row 62); the confirmation dialog opens on «Скасувати» (row 65). These depart from the frozen markup on purpose; a mouse-opened panel or dialog draws no focus ring, so the NFR-13 shots should not change.
- Open for the user: **re-sign** every commit since `488e0c0` (all unsigned, GPG probe exit 2; backup branch, `git rebase -f -S 488e0c0`, `git diff` against the backup empty). The idle line breaks before the em dash at 375 px (accepted, signed FR-64 text; look at it in G2).
- The user asked why the page colours differ from the design: phases A to C ported only usable CSS; the palette (`design/v0/app/binarka.css` tokens), rounded cells, striped errors and button styles come in **G2** (NFR-13), the logo in **E**. If the user wants the palette earlier, it is a small token port checked by eye only.
- The review-gate's persist step sometimes writes nothing (`reviewEvidence: null`): write `openspec/changes/<change>/review-findings.json` from the run's result by hand, `clean` as the run says, with a `persistedBy` note.

## Rules that bit us (see the autonomy log)

- Do not tick task 3.7 (browser check) until every sub-step has its evidence row; it was caught by a confirming review in B and again in C.
- A browser-pane screenshot can lag the DOM (seen three times): take a second screenshot, and rest state claims on script checks.
- Write times only after running `date` (twice this session a time was written ahead of the clock).

- Probe GPG before each commit: `echo x | gpg --batch --pinentry-mode error -s -o /dev/null; echo $?` (M6, M8, M16).
- Never claim an edit in a commit message unless the edit step exited 0; assert scripted replacements (M13 to M15).
- Tag only after a successful commit (M12). The pre-commit hook runs `check:trace`: a new MVP FR needs a spec that cites it in the same commit.
- Use the dedicated agents (spec-writer, test-engineer, capability-implementer on Sonnet; review-gate workflow). Confirm red and green yourself.
- jsdom has no layout, no popover behaviour, and no `showModal` or `showPopover`: tests assert attributes and stub the methods.
- Every "done" carries an evidence path. Held rows are NOT-EARNED until moved, never PASS.

## Languages

FR-55 and FR-56 stay Future (row 58). The strings module of phase A keeps the door open. Decide on a language switch with the user **before G2**, because G2 pins the page to the frozen reference.
