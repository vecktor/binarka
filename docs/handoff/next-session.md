# Start prompt for the next session

Each phase of the UX iteration runs in its **own new session** (the user's choice, 2026-10-05 about 23:50). A session runs exactly one phase, then updates this file and `docs/current-state.md`, commits, and leaves a chip for the next phase. The user starts each new session by clicking that chip (or by pasting the block below).

---

You are continuing **Бінарка** (Project Factory; TypeScript, Vite, vanilla DOM, Vitest). The course capstone was delivered on 2026-10-04 (signed tag `submission-2026-10-04`, `main` at `db76f02`). We are in the post-submission UX iteration. The requirements amendment for UX decisions 1–30 was **signed by the user on 2026-10-05 at about 23:31** (autonomy-log rows 66 to 68).

**Where to work.** Your session has its own worktree and branch. First bring it to the previous phase's tip: `git fetch` is not needed (all branches are local); run `git merge --ff-only <previous phase branch>`. The previous phase branch is named in the chip that started you and in `docs/current-state.md` ("Working branch"). If the fast-forward fails, stop and ask the user. Never edit a worktree another session owns (`.claude/worktrees/git-https-to-ssh-ed7693` holds an uncommitted `trace/ledger.jsonl`; leave it alone). Phase 0 (the amendment and the change folders A, B, C, E) is on branch `claude/next-session-handoff-15b81c`.

**Read first, in order:**
1. `AGENTS.md`
2. `docs/current-state.md` (Last Updated, Working branch, Next task)
3. `docs/mvp-capability-plan.md` section 4.8 (slices A to H, order, definition of done)
4. `docs/requirements.md` (the 2026-10-05 amendment) and `docs/requirements-held.md`
5. `docs/autonomy-log.md` rows 32 to 40 (how a slice runs) and 66 to 68 (this amendment and the pre-authorisations), mistakes M12 to M15 and M18 to M19
6. `openspec/specs/play-page/spec.md`, and your phase's change folder under `openspec/changes/`
7. `docs/design/ux-decisions.md`, `design/README.md` ("Pixel reference: frozen")
8. `docs/lessons/factory-enforces-artifacts-not-order.md`

Run `date` first and before every time claim; the user is UTC+5:30 (Kyiv is 2:30 earlier).

## Phases (one per session, in this order)

| Phase | Change | Requirements | Notes |
|---|---|---|---|
| A | `update-page-layout` (folder exists) | FR-57, FR-68, FR-71, A-26, NFR-5 | Creates `src/ui/strings.ts` and moves **every** Ukrainian page text there (user decision, row 67). Rules popover, page order, idle line. |
| B | `add-hinted-cell` (folder exists) | FR-66, FR-39 | |
| C | `update-controls-accessibility` (folder exists) | FR-67, FR-42, FR-43, FR-58, FR-73, FR-69, FR-70, A-20, A-24, NFR-5 | The largest slice; the size-selector and reset tests change on purpose. Rebase any shared delta on the baseline as archived by A, if its tasks.md says so. |
| D | `update-win-apostrophe` — **DONE 2026-10-09** on `claude/ux-phases-d-h` (archived; `docs/current-state.md`) | FR-41 (U+02BC) | Runs after C (done). Task 1.2 re-greps every U+0027 pin in `tests/` first (`tests/play-page-page-text.test.ts:106` is one; C's rewrite already compares to `WIN_MESSAGE`). |
| E | `add-logo` — **DONE 2026-10-09** on `claude/ux-phases-d-h` (archived `2026-10-09-add-logo`; `docs/current-state.md`) | FR-72, TC-14 | Inline SVG from the frozen design. |
| F | `add-rule-solvable-generator` — **DONE 2026-10-09** on `claude/suspicious-lamarr-be0fd0` (archived `2026-10-09-add-rule-solvable-generator`; `docs/current-state.md`; not merged into `main`) | FR-27, A-5, A-31 | Engine only. Timing worst case under 2% of each bound. |
| DL1 | `add-difficulty-engine` — **DONE 2026-10-09** on `claude/suspicious-lamarr-be0fd0` (archived `2026-10-09-add-difficulty-engine`; not merged) | FR-74 to FR-86, FR-25, NFR-16, NFR-17 | Difficulty levels in the engine and CLI (signed amendments, autonomy-log rows 86 to 92). Both review runs not clean, no product defect; see `docs/current-state.md`. |
| DL2 | `add-level-selector` — **DONE 2026-10-09**, committed signed (`92de28f`, `041c183`, `fdfa516`; row 103) and fast-forwarded into `main` at 21:52 (not pushed) | FR-44, FR-87 to FR-99, FR-77 page clause, FR-88 retry | Both review-gate runs not clean, no code defect left; browser check `docs/qa/add-level-selector/README.md`; see `docs/current-state.md`. |
| G1 | browser checks — **DONE 2026-10-09** on `claude/epic-hodgkin-3106f7` (rows 104 to 111; `docs/qa/g1/README.md`) | NFR-7, NFR-10, NFR-12, NFR-13, TC-13, A-14 | `npm run test:e2e` (NFR-7, NFR-10, NFR-12) and `npm run check:a11y` (NFR-13), Chromium only, sampled. All six rows moved into `docs/requirements.md`. **NFR-12 FAILS on today's page** (three action buttons 40 px tall at every viewport): a small fix slice (CSS `min-height`, test-first with the e2e check as the red) is the next step, before or at the start of G2. NFR-10 and NFR-13 pass (moved on the user's decision; seen failing on a probe build). CI does not run the browser checks yet (needs the user's approval). |
| NFR-12 fix | `fix-action-button-targets` — **DONE 2026-10-09** on `claude/friendly-bouman-8d7e45` (row 113; archived `2026-10-09-fix-action-button-targets`; not merged) | NFR-12 | Action buttons 44 px; e2e 41 passed, a11y 32 passed. Confirming review run not clean (5 minor, no product defect). |
| S | `update-setup-sheet-start` — **DONE 2026-10-10** on `claude/cool-blackburn-6a12ef` (rows 116 to 127; archived `2026-10-10-update-setup-sheet-start`; signed). Amendment and wireframe signed (rows 118, 120); design `review-set-13` passed (row 123, NOT the pixel reference); two fix rounds (the second approved by the user, row 125); third review run not clean, no code defect. | FR-43, FR-65, FR-73, FR-88, FR-91, FR-92, FR-96 to FR-101, NFR-12, NFR-13 | Open for the user: «Почати» filled primary; move the pixel reference to `review-set-13`; gear pressed look; size-option inset ring; G2 layout notes in `docs/qa/update-setup-sheet-start/README.md`. |
| T | `add-theme-switch` — **DONE 2026-10-10** on `claude/friendly-dubinsky-5f3d44` (rows 128 to 131; archived `2026-10-10-add-theme-switch`, `3532b42`; every commit signed, re-sign map in row 130). Four review runs: runs 2 and 3 confirmed code defects and stopped the session, the user approved fix rounds 2 and 3, and run 4 has no code defect (7 minor after-run fixes in `8199682`). Battery `docs/qa/add-theme-switch-fix-round-3-green-run.txt`, browser check 62 PASS, header 1 px sweep clean. **Open user question:** the checked theme option's frame and the focus ring share `--color-focus` (`docs/qa/add-theme-switch/README.md`) | FR-65, FR-68, FR-102 to FR-106, FR-113 to FR-118, TC-12, NFR-18 (theme half), A-41 (five ids), A-48 to A-51, A-55 | Not merged into `main`, not pushed. Its fix-round scenarios are carried into `add-english-version`'s MODIFIED blocks. |
| L | `add-english-version` — **DONE 2026-10-10** on `claude/friendly-dubinsky-5f3d44` (row 132; archived `2026-10-10-add-english-version`; signed). ADR-0005; eval `hint-clarity-en` 90 (waiver for `hint-clarity` 94 to 92.7, approved by the user); review run 1 had one minor code defect, fixed in one round; the confirming run had no code defect. English wording confirmed by the user at 12:20 (A-54, row 133) | FR-55, FR-56, FR-107 to FR-112, FR-113 to FR-116 (language parts), NFR-5 per mode, NFR-6 (`hint-clarity-en`), NFR-18 (`en`/`lang` half) | Not merged into `main`, not pushed. The English eval covers pair, sandwich and count only. |
| G2 | design fidelity — **step 1 DONE 2026-10-10** on `claude/keen-archimedes-c4cd63` (rows 137 to 145; not merged): `quality/visual-parity.config.json` + `scripts/check-visual-parity-adapters.mjs`; `npm run check:visual` seen failing (0 of 170 shots at 0.98, `docs/qa/g2/check-visual-run-1.txt`); NFR-14 moved into `docs/requirements.md` | NFR-14 | Reference **`review-set-14`** (170 shots, iteration 16 with valid 6×6 fixtures, moved by the user in row 142; before that `review-set-13`, row 134). Run 2 against it: 0 of 170 (`docs/qa/g2/check-visual-run-2.txt`). Next: **converge block by block** (AGENTS.md lessons: per-block done, overlay and onion-skin, capture determinism), with «Почати» filled and the gear pressed look **as blocks within G2** (the user, row 137). **First blocker, decided by the user (row 140):** a capture-only board (FR-119). Steps: (1) the user signs `docs/handoff/capture-board-amendment-draft-2026-10-10.md`; (2) DONE: the design round (iteration 16, seed 5, `review-set-14`, reviewed, reference moved, row 142); (3) DONE: slice `add-capture-board` (FR-119 signed row 143, archived row 144); (4) **DONE 2026-10-10 on `claude/upbeat-driscoll-079f1a` (row 147; proof `docs/qa/improvements/PD-2-proof.txt`; run 3 `docs/qa/g2/check-visual-run-3.txt`, still 0 of 170):** PD-2, the locked adapter `scripts/check-visual-parity-adapters.mjs` sets `window.__binarkaCaptureBoard` from `design/v0/lib/boards.json` for each board shot (`setup` shots at `level: 2`; `hint`: the hint board without its hinted cell, then one `element.click()` on «Підказка»; `win`: the solved board; `four`, `eight`, `level`: the 4×4 and 8×8 fixtures), with the `Refs: PD-2` commit and a proof as in `docs/qa/improvements/PD-1-proof.txt`; then run 3 of `check:visual`. Also fix the adapter's stale-preview gap (gap 6 of `docs/qa/visual-diff/README.md`). Other open items in `docs/qa/visual-diff/README.md` § Known gaps: logo shots have no state driver; `qa-verify` runs the locked checker without the adapter (a separate PD for the user); artifact mode uses 0.99. Closed: the adapter is under the lock (PD-1). **PD-3 DONE (row 149):** the capture uses a real device scale, and the design build reproduces all 170 shots at 1.0000 under it (`docs/qa/g2/harness-calibration.txt`); run 4 `docs/qa/g2/check-visual-run-4.txt` (0 of 170). Per-block instrument `scripts/visual-block.mjs` (build `design/v0` first). One change folder per block (the user, row 148). **Block 1 `update-page-layout-geometry`: implemented and green, not reviewed or archived (rows 150, 151); run 5: 1 of 170 (`docs/qa/g2/check-visual-run-5.txt`).** Review run 1 and fix round 1 done (row 152; run 6: 1 of 170). Next: the confirming review run, archive, then the palette block (tokens: add the design's colours beside the 13 names, A-51), the backdrop, the setup sheet. A suggested order of blocks: page column width (`#app` 420 px against the design's 34rem, seen in run 3; it moves every block), page palette and header (every shot), the dialog and panel backdrop (the light `confirm` and `rules` shots score 0.12 to 0.36 because the design dims the page), board frame and cells, action buttons, setup sheet, rules panel, settings panel, dialog. Each session ends with run N in `docs/qa/g2/` and the per-shot reports in `docs/qa/visual-diff/`. Also open (the user, row 137 (3)): the rules panel opens scrolled to its bottom; it should open at the top (bug, test first). |
| H | `check:vision` | NFR-11, NFR-15 | Write the script (no package), see it fail, move the two rows. Uses the `vision-verify` skill with a fresh vision-judge. |

D and E may run before C if C is blocked; F may run any time. G1 must come before G2.

## Orchestrator mode (the user's choice, 2026-10-06 about 00:05)

One new session orchestrates every phase in order, A to H, without stopping between phases. It does each phase's steps itself and gives the heavy work to fresh subagents (spec-writer, spec-compliance-auditor, test-engineer, capability-implementer, the review-gate workflow, vision-judge). A subagent cannot start its own subagents or workflows, so the orchestrator never hands a whole phase to one subagent. The user opted into the review-gate workflow for every slice.

- **Start in your own worktree.** A scheduled or fresh session starts in the main checkout on `main` (probe `binarka-autonomy-probe`, 2026-10-05 23:55). Load `EnterWorktree` with ToolSearch and create a worktree first, then `git merge --ff-only claude/next-session-handoff-15b81c` (or the newest "Working branch" in `docs/current-state.md`). Never commit on `main` and never work in the main checkout.
- **After each phase:** commit, update `docs/current-state.md` ("Working branch" = your branch) and the autonomy log, then go on to the next phase. No chip is needed between phases in this mode; leave one chip only when you stop.
- **Stop and leave a chip** (with your branch name and the next phase) when: FR-27 cannot hold NFR-1 to NFR-3; a review-gate confirming run still has a confirmed code defect; a step needs anything that is not pre-authorised (row 68); the battery fails and one fix attempt does not make it green; or G2 has converged as far as it can in this session (report the per-shot scores).
- A scheduled run cannot answer questions. Do not ask; stop at the condition and write why in `docs/current-state.md`.

## How a phase runs (as slices 3 and 4 did)

1. Fast-forward (above). `npm ci` if `node_modules` is missing or stale. Run the battery once: `npm run lint`, `npm run test:run`, `npm run build`, `npx openspec validate --all --strict`, `node scripts/check-eval-ratchet.mjs`.
2. If the phase has no change folder, the spec-writer (Sonnet) writes it from the signed rows. Either way, run one fresh read-only check of the folder (spec-compliance-auditor, Sonnet) before any test; the folders for A, B, C and E were written in one pass (autonomy-log row 69) and have had no independent check yet.
3. Test-engineer (Sonnet) writes the tests first. **Confirm red yourself** in a scratch copy and save the evidence as `docs/qa/<change>-red-run.txt`. Commit the red tests.
4. Capability-implementer (Sonnet) makes them green. **Confirm green yourself** with the full battery.
5. Review-gate workflow (base: the red commit). One fix round and one confirming run; if it is still not clean, report it as not clean instead of looping.
6. A 375 px check in the built-in browser (jsdom cannot see layout, TC-13), screenshots in `docs/qa/<change>/`.
7. Archive (`npx openspec archive <change> --yes`), strict validation, `npm run check:trace`.
8. Update `docs/current-state.md` (Last Updated, Working branch = your branch, Next task = the next phase), this file's table if anything changed, and an autonomy-log row. Commit.
9. Leave a chip for the next phase with `spawn_task`. The chip's prompt must name **your branch** (for the fast-forward) and the phase to run, and say "read `docs/handoff/next-session.md` first". Tell the user the phase is done, with evidence paths, and stop.

Commit trailers: `Slice: <change-name>` and `Refs: FR-x` on every commit touching `src/`. Never `--no-verify`, never squash.

## Pre-authorised by the user (row 68) and what is not

- Moving the held rows into `docs/requirements.md` with the signed wording, once their check is shown running and failing; NFR-14 last.
- NFR-14 pass mark: 0.98 per shot (the checker's default is 0.99; a below-default warning is expected).
- Installing the four approved dev dependencies and the Chromium download.
- If the GPG probe fails: commit with `--no-gpg-sign`, log it, and leave the re-sign (with a backup branch) for when the user is back.
- **Not authorised:** push, PR, merge, any other dependency, hook, settings or `AGENTS.md` change, changing the frozen design or `review-set-5`, relaxing a test or a bound. Stop and ask.

## FIRST: reconcile with `main` and merge (the user's decisions of 2026-10-09, autonomy-log row 77)

**Status 2026-10-09 02:25: DONE.** Reconciled on branch `claude/reconcile-ux-main` (merge `603b631`, slice `reconcile-ux-accessibility` archived, autonomy-log rows 78 to 80); step 4 done too: `main` was fast-forwarded to `68a90c6` and pushed with the user's approval in chat at about 02:20 (autonomy-log row 81). Phases D to H now run in a worktree off `main` (branch `claude/ux-phases-d-h`); the fast-forward instruction at the top of this file means `main` or the newest "Working branch" in `docs/current-state.md`.

Do this before phase D. Phases D to H then run on `main`.

1. Work in a new worktree off `main` (`cf6ad37` or newer); merge `claude/heuristic-lovelace-5e57b4` (pushed, tip `6dd7eb5`, ids already renumbered: FR-66..73, NFR-10..15, A-29..32, rows 50..77, M18..M21, plan 4.8). Expect conflicts in about 18 files. Check `main`'s newest row and M number first; renumber further only if `main` took more ids.
2. Requirements amendment, signed by the user in chat before any code: the **UX page model wins** (every cell a `<button>` with its Ukrainian label, the size radiogroup, the rules popover with ids, the confirmation dialog), and `main`'s accessibility rules that fit it stay (FR-63 status roles, FR-64 non-colour violation border, FR-65 3:1 contrast and `:focus-visible`, NFR-9 WCAG 2.2 AA re-scoped). Rewrite `main`'s FR-59 (one grid Tab stop), FR-60, FR-61 (`role="grid"`), FR-62 (labelled select) and the "no ids under the root" rule so they fit the UX model; reconcile A-20, A-26, A-28 and the UX amendments of FR-57 and FR-58.
3. A reconciliation change folder (spec-writer, independent audit), tests first (the a11y tests of slice 6 that assert grid, select or rules-block behaviour change on purpose and are listed by FR), implementation, review-gate, real-browser check, archive. `eslint.config.js`: keep ADR-0003's `globalIgnores` and add the UX line's `design/` ignore to it.
4. Merge into `main` only after the battery is green and the user approves; push is the user's call.

## State at the 2026-10-06 handoff (session `heuristic-lovelace-5e57b4`)

- Phases A, B and C are archived on branch `claude/heuristic-lovelace-5e57b4`. Fast-forward to it. Next: **D**, then E, F, G1, G2, H.
- Decided by the user: no language switch before G2 (row 71); «Зрозуміло» autofocus and the rules panel `role="dialog"` (row 71); the confirmation dialog opens on «Скасувати» (row 74). These depart from the frozen markup on purpose; a mouse-opened panel or dialog draws no focus ring, so the NFR-14 shots should not change.
- Signing: every commit since `488e0c0` was re-signed at about 13:02 (row 75; backup `backup/ux-unsigned-0e37dd3`). Open for the user: the idle line breaks before the em dash at 375 px (accepted, signed FR-71 text; look at it in G2).
- The user asked why the page colours differ from the design: phases A to C ported only usable CSS; the palette (`design/v0/app/binarka.css` tokens), rounded cells, striped errors and button styles come in **G2** (NFR-14), the logo in **E**. If the user wants the palette earlier, it is a small token port checked by eye only.
- The review-gate's persist step sometimes writes nothing (`reviewEvidence: null`): write `openspec/changes/<change>/review-findings.json` from the run's result by hand, `clean` as the run says, with a `persistedBy` note.

## Rules that bit us (see the autonomy log)

- Do not tick task 3.7 (browser check) until every sub-step has its evidence row; it was caught by a confirming review in B and again in C.
- A browser-pane screenshot can lag the DOM (seen three times): take a second screenshot, and rest state claims on script checks.
- Write times only after running `date` (twice this session a time was written ahead of the clock).

- Probe GPG before each commit: `echo x | gpg --batch --pinentry-mode error -s -o /dev/null; echo $?` (M6, M8, M18).
- Never claim an edit in a commit message unless the edit step exited 0; assert scripted replacements (M13 to M15).
- Tag only after a successful commit (M12). The pre-commit hook runs `check:trace`: a new MVP FR needs a spec that cites it in the same commit.
- Use the dedicated agents (spec-writer, test-engineer, capability-implementer on Sonnet; review-gate workflow). Confirm red and green yourself.
- jsdom has no layout, no popover behaviour, and no `showModal` or `showPopover`: tests assert attributes and stub the methods.
- Every "done" carries an evidence path. Held rows are NOT-EARNED until moved, never PASS.

## Languages

FR-55 and FR-56 stay Future (row 67). The strings module of phase A keeps the door open. Decide on a language switch with the user **before G2**, because G2 pins the page to the frozen reference.
