# Folder audit: `openspec/changes/update-confirm-dialog/` (wave-2 prep session)

- **Who:** a fresh spec-compliance-auditor subagent, read-only (maker ≠ checker: the folder was written by a separate spec-writer subagent), dispatched by the wave-2 prep session `vigorous-darwin-94147c` on 2026-10-12, from about 12:13 to 12:23 (UTC+5:30).
- **Tree:** `claude/vigorous-darwin-wave2-prep` at `019808f` plus the two untracked change folders.
- **Sources it checked the folder against:** the SIGNED `docs/handoff/dialog-amendment-draft-2026-10-12.md` (row 193), the split of `docs/handoff/settings-panel-amendment-draft-2026-10-12.md` section 9, `docs/requirements.md` (A-62, FR-67, FR-65, A-57 appendix, NFR-14), the baseline `openspec/specs/play-page/spec.md`, the start prompt `docs/handoff/parallel-g2-wave2-start-prompts-2026-10-12.md`, the design `design/v0/app/binarka.css` 1338-1395, `docs/qa/prep-g2-wave2/classify.txt`, the test files.
- **Result:** 1 major (in the settings folder), 9 minor, 3 notes. `npx openspec validate update-confirm-dialog --strict`: valid (before and after the fold).

## Verified as correct (by the auditor)

- The MODIFIED «Borders, cues and focus rings have enough contrast» changes only what the draft's sections 5 and 9 demand (counts 32 → 33, 27 → 28, 41 → 42, 16 → 17; the token row after `--color-focus`; the role column; the "later" sentence becomes the binding; Traces), plus three additions already flagged in `design.md` open point 2; no text dropped. The three count-only deltas change only the number and the Traces.
- Every baseline token or pair count is moved in this folder; the settings delta carries none.
- The ADDED requirement's values equal A-62 and the design; the computed `rgb()` strings match the tokens; the contrast figures recompute; the boxes match `classify.txt`; sampling and escalation are declared.
- Every pin line of tasks 2.2 checks out; `TOKEN_NAMES.at(-1)` stays `--color-option-border`; red before port; merge first; signing and trailers.
- No requirement is modified by both folders; no test line is edited by both.

## Findings and disposition (folded by the parent, 2026-10-12 about 12:27)

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | The settings folder's `tasks.md:8` named 6373 for the settings session (the reverse of the start prompt), so both sessions could bind 6373-6377 | Fixed in the settings folder's fold (`docs/qa/update-settings-panel/folder-audit.md`); this folder's task 0.2 now says `BINARKA_PORT_BASE=6373` outright |
| 2 | minor | The ADDED scenario «Every confirm shot rises in the per-shot gate» pins run 12 permanently | Marked a change-time check of this change (tasks 7.2, 7.3), not a lasting test, as the setup-sheet archive does |
| 3 | minor | Comments `tests/helpers/css.ts:448` and `tests/play-page-rules-panel-stylesheet.test.ts:476-481` say 32/41 | Added to task 2.2 |
| 4 | minor | The message of `tests/play-page-setup-sheet-stylesheet.test.ts:812` ('the 32nd name') becomes false | Task 2.2: the message becomes 'the 33rd name'; the assertion is unchanged |
| 5 | minor | The new pair's position in `CONTRAST_PAIRS` was not stated (the rules-panel guard compares ordered lists) | Task 2.2: after the `violation-text` pairs, before `primary-text`, in the helper and in `BASELINE_PAIRS` |
| 6 | minor | `e2e/nfr-12-targets.spec.ts` 80-81 should be 78-80 | Fixed in `proposal.md` and tasks 4.4 |
| 7 | minor | The 4.3 diff filter left out `trace/ledger.jsonl` and the new e2e file | Added |
| 8 | minor | The ledger rule lacked "commit it" | Added to task 0.2 |
| 9 | minor | Branch `-confirm` against the start prompt's `-dialog` | `claude/<name>-dialog` |
| 10 | minor | The smoke test opened the dialog from «Нова головоломка» only | Task 6.1 gains «Скинути» and «Почати» (steps 5a, 5b) |
| 11 | note | "before `--color-surface-raised`" (draft, start prompt) and "before `--color-backdrop-soft`" (folder) name the same place | No change; `design.md` open point 1 says so |
| 12 | note | «Confirmation before discarding player entries» (baseline spec l. 1037) still says the dialog's place is "covered by the held NFR-13 and NFR-14"; both rows are no longer held | Put to the user (a change to a behaviour requirement beyond DQ-4's default); the user chose «Fix the sentence» in chat on 2026-10-12 at about 12:30: the folder MODIFIES that one sentence (A-62; NFR-13 and NFR-14 not held), nothing else of the requirement changes |
| 13 | note | `.confirm p` `font-size: 1rem` is inherited, not pinned in the stylesheet | No change; the e2e text box catches drift |

---

# Re-audit at the session's `main` (task 1.1, the dialog session, 2026-10-12)

- **Who:** a fresh spec-compliance-auditor subagent, read-only, dispatched by the dialog session (`laughing-snyder-018976`, branch `claude/laughing-snyder-dialog`) on 2026-10-12 from about 12:59 to 13:07 (UTC+5:30). Not the author of the folder, not the prep auditor.
- **Tree:** `18e5f3f` (`main`). `git diff --stat 019808f HEAD` over `openspec/specs`, `docs/requirements.md`, `tests`, `e2e`, `src`, `scripts`, `design/v0/app` and `playwright.config.ts` is empty, so every baseline and pin line is the same text as at the prep audit; the folder itself changed after the prep audit (the «Confirmation before discarding…» delta).
- **Result:** 0 major, 7 minor, 6 notes. The pair diffs are kept in `docs/qa/update-confirm-dialog/folder-audit-diffs/` (`pair1.diff` to `pair5.diff`: `diff -u` of each baseline requirement, extracted by `extract.awk`, against its MODIFIED block; `pair1-word-diff.txt`: the auditor's word diff of «Borders…»; `apply.mjs`: the hand application of item 4). The applied 4895-line spec copy stayed in the session scratchpad (outside the repo).

## Item 1: each MODIFIED pair against the baseline

Scenario counts equal for pairs 2 to 5 (8/8, 9/9, 13/13, 11/11); pair 1 has 20 in the baseline and 21 in the delta (one added, none dropped).

- **«Main column layout geometry…»** (baseline l. 3919): Traces + A-62; the token scenario "the 32 tokens … and the 1 setup-sheet token … that the last three changes bind" → "the 33 tokens … the 1 setup-sheet token and the 1 dialog token `--color-violation-ink` … that the last four changes bind".
- **«The panels take the shared surface paint»** (l. 4327): Traces + A-62; "the list holds 41 pairs" → "42 pairs".
- **«The rules panel takes…»** (l. 4484): Traces + A-62; "(32 tokens and 41 pairs since `update-setup-sheet`" → "(33 tokens and 42 pairs since `update-confirm-dialog`".
- **«Confirmation before discarding player entries»** (l. 1035): sentence 15 only: "… covered by the held NFR-13 and NFR-14, see `docs/requirements-held.md`." → "… are the design's (A-62; see «The confirmation dialog takes …»); its focus ring is NFR-13 and its pixels NFR-14 (neither is held any more; …)". NFR-13 and NFR-14 are in `docs/requirements.md:183-184`.
- **«Borders, cues and focus rings…»** (l. 1510), word diff: text deleted only where replaced (the counts, three connective words, the old "later" sentence). Intro 32 → 33 and the dialog token; six role cells suffixed (`--color-text-muted`, `--color-primary`, `--color-primary-text`, `--color-primary-soft`, `--color-violation-bg`, `--color-violation-border`); the new row after `--color-focus`; the sources paragraph; the "later" sentence becomes the binding; the frame-is-decoration sentence (finding 5); the 4.5:1 list gains the pair; Traces + FR-67, A-62, NFR-14; scenarios 32 → 33, 27 → 28, 41 → 42, 16 → 17, the 4.5:1 WHEN gains the pair; the new scenario «The dialog's warning text has 4.5:1 and its frame is decoration».

## Item 2: signed text

All values match `docs/requirements.md` (appendix row l. 342, A-62 l. 356, FR-65 l. 117, FR-67 l. 119, NFR-14 l. 184); contrast recomputed (7.34 / 8.40, 5.40 / 8.55, 6.43 / 6.54, 15.88 / 12.79, 6.24); the ten `rgb()` strings equal their hex; boxes equal `classify.txt`; run-12 scores equal `check-visual-run-12.txt`.

## Item 3: pin lines re-grepped (unchanged from `proposal.md` Impact)

`tests/helpers/css.ts` comments 402, 409, 448, 647; `TOKEN_NAMES` 412-444 (`--color-focus` 437, `--color-option-border` 444); `PALETTE_LIGHT` 458-491; `PALETTE_DARK` 493-526; `TRANSLUCENT_TOKENS` 535-541; `CONTRAST_PAIRS` 664-678 (violation-text 675, primary-text 676). `tests/play-page-helpers.test.ts` `DESIGN_TOKENS` 404-437, 483, 491, 492, `DARK_SAMPLE` 1503-1536, 1551. Theme 168, 171, 180. Cause 216, 217. Level 236, 246. Palette 75. Layout geometry `LIGHT` 27-60, `DARK` 61-94, 97, 101. Stylesheet 99, 101, 112. Panel shell 182, 189. Setup sheet 807, 812. Rules panel comment 476-481, `BASELINE_TOKEN_NAMES` 482-489, `BASELINE_PAIRS` 490-532 (violation-text 527-528, primary-text 529), 560-561. No unlisted pin of 32 tokens, 41 pairs, 16 text pairs or 27 `#rrggbb` in `tests/`, `e2e/`, `scripts/` or `evals/` (false positives: `play-page-cells.test.ts:131`, `play-page-win.test.ts:79`, `e2e/nfr-14-setup-sheet.spec.ts:139`).

## Item 4: the baseline with the deltas applied

`grep -n "32 token\|the 32\b\|41 pairs\|27 of\|16 text\|32 names\|32)"` on the applied copy: six hits, none a token, pair or `#rrggbb` count (two colour strings `rgb(44, 38, 32)` and `rgb(63, 35, 32)`, four mentions of the 32 geometry cases).

## Items 5 to 7

Every scenario is objectively checkable (notes 11 and 12). No requirement is modified by both folders; the settings folder has not merged. `npx openspec validate update-confirm-dialog --strict`: `Change 'update-confirm-dialog' is valid` (exit 0).

## Findings and disposition (folded by the dialog session, 2026-10-12 about 13:08)

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | minor | `proposal.md:35` lists «Confirmation before discarding…» as not modified | Removed from that list |
| 2 | minor | `design.md:87` (the split) gives that requirement the owner "nobody" | Owner: this folder (one sentence, open point 6) |
| 3 | minor | `design.md:23` and `tasks.md:13` say "four MODIFIED"; `design.md:20` "the five named" | "five MODIFIED"; "the six named in `proposal.md` (five MODIFIED, one ADDED)" |
| 4 | minor | `design.md:121` open point 3 says the behaviour requirement is unchanged | "… apart from the one stale sentence of open point 6" |
| 5 | minor | The frame-is-decoration sentence after the token table is not in `proposal.md`'s list of edits | Added to the «Borders…» row of `proposal.md` |
| 6 | minor | `e2e/nfr-12-targets.spec.ts` "78-80" is wrong; the dialog buttons are at 79-81 | "79-81" in `proposal.md` and `tasks.md` 4.4 |
| 7 | minor | `proposal.md` Impact leaves out the comments `tests/helpers/css.ts:448` and `tests/play-page-rules-panel-stylesheet.test.ts:476-481` | Added |
| 8 | note | The count-only blocks also change the named token or change, not only a number | `design.md:23` and `tasks.md:13` reworded ("a number, the named token or change, and a Traces line") |
| 9 | note | «Confirmation…» Traces unchanged although the new sentence cites A-62 | Kept: the user's word was one sentence only |
| 10 | note | The A-61 role wording of the settings panel lands in the baseline with this folder, before the settings port | No change (owner assigned in both `design.md`s; no test reads the role column) |
| 11 | note | The scenario says a selector "contains `[data-confirm='yes']`"; a port in double quotes would fail a literal test | The new stylesheet test normalises the quote style (brief of task 2.3) |
| 12 | note | «Every confirm shot rises…» has a judgment clause | Accepted (a change-time check, tasks 7.2 and 7.3) |
| 13 | note | Two baseline statements still call `--color-violation-ink` a later block's | No change (they describe the backdrop and shell changes) |

`npx openspec validate update-confirm-dialog --strict` after the fold: `Change 'update-confirm-dialog' is valid`.
