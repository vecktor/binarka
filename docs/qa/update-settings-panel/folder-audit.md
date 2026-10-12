# Folder audit: `openspec/changes/update-settings-panel/` (wave-2 prep session)

- **Who:** a fresh spec-compliance-auditor subagent, read-only (maker ≠ checker: the folder was written by a separate spec-writer subagent), dispatched by the wave-2 prep session `vigorous-darwin-94147c` on 2026-10-12, from about 12:13 to 12:24 (UTC+5:30).
- **Tree:** `claude/vigorous-darwin-wave2-prep` at `019808f` plus the two untracked change folders.
- **Sources it checked the folder against:** the SIGNED `docs/handoff/settings-panel-amendment-draft-2026-10-12.md` (row 193; OQ-1 A, SP-1 A, defaults OQ-2 to OQ-6), `docs/requirements.md` (A-61, FR-65, FR-117, FR-68, A-57, NFR-14), the baseline `openspec/specs/play-page/spec.md`, the start prompt `docs/handoff/parallel-g2-wave2-start-prompts-2026-10-12.md`, the design `design/v0/app/binarka.css` (377-433, 537-563, 809-837, 931-943, 1073-1117), `docs/qa/prep-g2-wave2/classify.txt`, the test files, the OpenSpec archive code (`node_modules/@fission-ai/openspec/dist/core/archive.js:444-454`).
- **Result:** 2 major, 6 minor, 5 notes. `npx openspec validate update-settings-panel --strict`: valid (before and after the fold; `--all --strict` 4 of 4 after).

## Verified as correct (by the auditor)

- The four MODIFIED deltas against the baseline: every change is one the draft's section 5 asks for; nothing dropped ("as for the level buttons" dropped from the theme-colour requirement, acceptable).
- No overlap with the dialog folder's four MODIFIED requirements; nothing here touches the token or pair counts or «Borders…».
- The changed tests stay in this folder's share; the panel-shell test counts exact selectors, so a `box-shadow` on `.settings-close` keeps its count of 7.
- The ADDED values match the design; the A-61 fold in `docs/requirements.md` is faithful.
- The short-window walk's premises hold from the `classify.txt` boxes: the sheet's content is 277.5px (caps 206.25px at 667×375, 176px at 568×320), the dropdown's 270.5px (cap 248px at 1024×360), so each scrolls; the "about 505px" and "about 383px" thresholds are right.
- Sampling, `coverage: sampled`, the escalation paths, red first, evidence paths, the backup branch with `range-diff`, ledger, GPG and trailers.
- The scenario rename in «The setup sheet takes the design's size, place and paint» is safe for the archive tool (MODIFIED blocks are matched by the requirement header only and replaced whole).

## Findings and disposition (folded by the parent, 2026-10-12 about 12:28)

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | The port bases were reversed (`tasks.md:8`, `design.md:82`: settings 6373, dialog 6473), so both sessions could bind 6373 | Settings 6473, dialog 6373, in both folders and the start prompt |
| 2 | major | A `scroll-padding-bottom` of `calc(2.75rem + 1rem)` (60px) fails the folder's own walk: the stuck «Закрити» sits on the 16px bottom padding, so its mask's top is 76px above the scrollport's bottom, and the ring reaches 2px below the option | The minimum is now `calc(2.75rem + 2rem + 2px + env(safe-area-inset-bottom))` in the spec (the requirement text and the scenario), `design.md` (with the arithmetic) and task 4.3; the walk decides the fit; A-61's "at least the height plus its mask" is met by the larger value |
| 3 | minor | Task 3.1 held the freeze and the port until the dialog merged, against the start prompt; "the same red as 2.5" and "keep `confirmDialog`" cannot apply before the merge | 3.1: freeze and port in parallel; only the final refreeze, archive and merge wait (10.1); "the same state as before the rebase"; 3.2 "keep every existing key" |
| 4 | minor | The list-copy test only checks against itself; a copy refreshed from the branch would take in a mistaken token | Refreshed from `git show main:tests/helpers/css.ts`; marked a GUARD; the real guards named |
| 5 | minor | The setup-sheet requirement's not-delivered item (1) ("the second wave") is copied unchanged into a block this folder rewrites | Reworded: delivered by `update-settings-panel` |
| 6 | minor | «The panels take the shared surface paint» items (1) and (2) still say the settings «Закрити» is not sticky and its paint is "the second wave"; the dialog folder carries that requirement (counts only) | Kept as historical sentences about the shell change, as the signed draft says (its section 5); recorded in both folders' `design.md` open points; no folder rewords them |
| 7 | minor | `tests/play-page-setup-sheet-stylesheet.test.ts:584` also cites the renamed scenario | Added to task 2.2(c) |
| 8 | minor | The conflict lists of the folder and the start prompt differed | One union list in both (the freeze script merged by hand, then the freeze re-run) |
| 9 | note | The scenario rename («Only the size options in the sheet take the primary paint» → «The size options in the sheet take the primary paint and the other two segmented controls agree») is safe for the tool but beyond the signed edits | Put to the user with the detail; the user chose «Rename as written» in chat on 2026-10-12 at about 12:33; flagged in `proposal.md` and `design.md` open point 5 |
| 10 | note | «Settings button and panel» Traces gain NFR-12, NFR-14, A-61 | Kept; defensible |
| 11 | note | The walk's "at most 17px" is the exact stuck value; a subpixel position could fail it | 17.5px |
| 12 | note | "selector contains `.settings`" also matches `.settings-button` and `::backdrop`; "six viewports, both schemes" suggests 48 shots, there are 26 | Exact selectors; "the 26 settings shots of `review-set-14`" |
| 13 | note | `min-width: 0` in the prose but not in the scenario; the ADDED requirement traces NFR-12 and NFR-13 with no new test carrying those tags | `min-width: 0` added to the scenario; the Traces kept (the existing NFR-12 and NFR-13 e2e must stay green, task 4.4) |
