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
| 12 | note | «Confirmation before discarding player entries» (baseline spec l. 1037) still says the dialog's place is "covered by the held NFR-13 and NFR-14"; both rows are no longer held | **Open for the user** (a change to a behaviour requirement beyond DQ-4's default): default, the dialog folder MODIFIES that one sentence to point at A-62 and NFR-13 / NFR-14 (not held) |
| 13 | note | `.confirm p` `font-size: 1rem` is inherited, not pinned in the stylesheet | No change; the e2e text box catches drift |
