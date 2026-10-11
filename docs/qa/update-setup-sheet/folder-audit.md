# Folder audit: `openspec/changes/update-setup-sheet/` (written in the prep session)

- **Auditor:** a fresh spec-compliance-auditor subagent, read-only, 2026-10-11 from about 17:14 to 17:27 (UTC+5:30), prep session `vibrant-tu-434033`. It did not write the folder (a spec-writer did) and edited nothing. `npx openspec validate update-setup-sheet --strict`: valid.
- **Coverage:** 9 requirement blocks: 8 MODIFIED reproduce their sources exactly apart from B's edits (word-diffed against the shell's post-change text for «Borders…», «Main column layout geometry…» and «The panels take the shared surface paint», against the baseline for the rest), 1 ADDED. Counts add up: 41 pairs (the three ring pairs are absent today), 32 tokens, 27 `#rrggbb`; ratios recomputed (3.68 / 4.13, 5.40 / 7.39, 5.40 / 6.82, 1.98 / 1.98, 2.06 / 1.90). Modifying the shell's ADDED requirement is necessary (FR-65 asks 3:1 against the sheet fill; the shell pins "exactly three") and is disclosed for the user. The design's 24px level margin is unconditional (`binarka.css:600-602`; 1rem at 22.5rem and narrower), so the `expected`-box approach for the 28px departure is sound. Impact complete against a grep of `tests/` and `e2e/`. tasks.md carries every parallel-session rule.
- **Result:** 2 major, 11 minor, 4 notes.

| # | Severity | Finding | Disposition |
|---|---|---|---|
| M1 | major | The design's 22.5rem `padding-top: 1rem` for the panels (`binarka.css:931-936`) is missing; the box e2e at 320 cannot pass | Sent to the spec-writer |
| M2 | major | B's copy of «The panels take the shared surface paint» keeps the shell's change-time clauses (not delivered (2) and (3), "today's rules at 64c2d7d", "no edit to design-geometry.json") that B itself violates once archived | Sent: name `update-panel-shell` in each change-time clause; strike or scope (2) and (3) |
| m1 | minor | Stale "supersedes" wording | Sent |
| m2 | minor | The size option's design metrics (weight 500, muted ink, transparent fill) neither ported nor listed | Sent |
| m3 | minor | The freeze script rewrites the top-level provenance; B lacks A's preservation step | Sent |
| m4 | minor | The 28px deviation has no design-value guard and no per-case `decidedBy` | Sent |
| m5 | minor | A's task 10.2 omits the two scripts both blocks edit | Fixed by the parent in `openspec/changes/update-rules-panel/tasks.md` |
| m6 | minor | design.md decision 8 says "24px from 48rem"; the rule is unconditional. The same inaccuracy is in signed A-60 | Decision 8 sent; A-60 put to the user |
| m7 | minor | The «Закрити» border's contrast status unstated | Sent: decoration, like the overlay border |
| m8 | minor | "after the 48rem block" is ambiguous (four such blocks) | Sent |
| m9 | minor | Line drift (`tests/play-page-stylesheet.test.ts:320-326`) | Sent |
| m10 | minor | «Start button» Traces not updated | Sent |
| m11 | minor | A stale code comment above `scroll-padding-bottom` | Sent: named in task 4.3 |
| n1-n4 | note | A GUARD verified; no config edit needed; the merge order handles both orders; the nfr-13 1366×650 premise risk handled (stop and ask) | No change |

## Fold

The spec-writer folded every finding on 2026-10-11 at about 17:30 (UTC+5:30), editing only the folder: M1 `padding-top: 1rem` at 22.5rem (phone row, scenario, decision 4; the nfr-13 premise re-checked at 320×700 and 320×568 in task 4.5); M2 the copy of «The panels take the shared surface paint» scopes every change-time clause to `update-panel-shell` in the past tense; m1 the supersede sentence, open point and task item removed; m2 the unchecked size option gets weight 500 and `--color-text-muted` (the existing pair, 7.17 / 7.54), its fill stays `--color-control-bg` (the design's transparent shows the control's own fill), **beyond the signed text, flagged as open point 1 for the user**; m3 A's provenance step; m4 the design-value guard (24px, 16px at 320) and per-case `layout`/`decidedBy`; m6 decision 8 corrected (signed A-60 corrected separately on the user's word, autonomy-log row 173); m7 «Закрити» border decoration; m8, m9, m10, m11 done.

Validation after the fold (re-run by the parent):
```
Change 'update-setup-sheet' is valid
- Validating...
✓ spec/play-page
✓ spec/puzzle-engine
✓ change/update-panel-shell
✓ change/update-rules-panel
✓ change/update-setup-sheet
Totals: 5 passed, 0 failed (5 items)
```

## Re-read after the shell's merge (task 1.1, session B)

- **Auditor:** a fresh spec-compliance-auditor subagent of session B (`claude/magical-nash-setup`), read-only, 2026-10-11 from about 17:58 to 18:05 (UTC+5:30), at HEAD `ebaf49b`. It did not write the folder and edited no repo file (scratch under `/private/tmp/claude-501/audit-b/`).
- **Why:** the folder was written at `7564ae3`; the shell's review fix `d176042` and archive `defc5e5` came after.

Commands:
```
$ git diff --stat 7564ae3 HEAD -- openspec/specs/play-page/spec.md
 openspec/specs/play-page/spec.md | 208 +++++++++++++++++++++++++++++++++++----
 1 file changed, 188 insertions(+), 20 deletions(-)
$ git diff --stat 7564ae3 HEAD -- docs/requirements.md
 docs/requirements.md | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```
- The shell's delta at `7564ae3` is byte-equal to its archived delta (`d176042` changed no spec text); «Borders…», «Main column…» and «The panels…» in the baseline equal the archived shell blocks (empty diffs); the other five MODIFIED blocks' baseline is unchanged between `7564ae3` and HEAD. The only `docs/requirements.md` change is A-60's margin parenthetical (row 173). FR-65, FR-96, FR-99 and the A-57 appendix are unchanged. «The page root carries the board size» is in the baseline (`openspec/specs/play-page/spec.md:4376`). Block A has not merged; B's folder touches none of A's requirement headers.
- **Result: 0 critical, 0 major, 10 minor, 5 notes; no hunk is a stale copy of the shell's text** (word diffs of all 8 MODIFIED pairs; every hunk is a named edit or an unnamed edit of this folder).

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | minor | spec.md:687 and design.md:30 still argue against A-60's old "24px from 48rem" (corrected, row 173) | Fixed: «24px at every width above 22.5rem (A-60, corrected at autonomy-log row 173)»; design.md «A-60 says so since its correction» |
| 2 | minor | proposal row «The panels…» omits its past-tense rewrites and Traces | Fixed (row text extended) |
| 3 | minor | proposal row «Borders…» omits the role-column edits, decoration sentence, ring bullets, two added scenarios, Traces | Fixed |
| 4 | minor | proposal row «Main column…» omits Traces + A-60 | Fixed |
| 5 | minor | proposal rows of the five sheet requirements omit their Traces edits (and row «summary and level buttons» its parenthetical and look sentence) | Fixed |
| 6 | note | The setup-sheet token is "assigned to the setup sheet" in the appendix, not marked "later" (3 places) | Fixed for the setup-sheet mentions; the inherited backdrop and shell wording is the baseline's and left |
| 7 | minor | `tests/play-page-panel-shell-stylesheet.test.ts:44-48` reads the first `.setup-sheet {` block in the file; a 22.5rem rule placed in an earlier 22.5rem block would break it; `.setup-close` keeps one top-level rule (:139-141) | Fixed: design.md decision 2 and task 4.2 say the 22.5rem rule comes after the base rule and `.setup-close`'s padding and border go into its one top-level rule |
| 8 | minor | spec.md:770 and :794 are process/narrative clauses | Fixed: "the walk asserts its premise at each of the four viewports"; "at 1366×650 the idle line is wholly covered or wholly clear in both states" |
| 9 | minor | spec.md:783 missing noun; :785 "both boxes" for a line height | Fixed: «the case's `boxes` value (the design's own)»; «the case and both computed line heights» |
| 10 | minor | proposal.md:38 says "uncommitted edits … re-greps after the merge"; design.md:23 cites the pre-archive path | Fixed: «re-grepped at `ebaf49b`»; the archive path |
| 11 | minor | Impact line numbers drifted; some count-bearing comments and titles missing | Fixed: the table carries the re-grepped numbers below |
| 12 | note | `d176042`'s new assertions (`e2e/nfr-14-panel-shell.spec.ts:362-367`, `tests/play-page-root-size.test.ts:156-157, 252-256`) are not broken by the planned port if decisions 2, 4 and finding 7 hold | None |
| 13 | note | Counts where the table says; every ratio recomputed (3.68/4.13, 5.40/7.39, 5.40/6.82, 4.41/6.13, 1.98/2.06, 1.98/1.90, 3.38/4.55, 12.96/11.50, 5.40/8.55, 6.58/8.32, 7.17/7.54); 4+4+1+5+9+2+16 = 41 | None |
| 14 | note | A not merged; no A text touched | None |
| 15 | note | `--column` is declared only in `@media (min-width: 48rem)` (`src/ui/style.css:1053`), consistent with the from-48rem formulas | None |

Re-grepped Impact lines at `ebaf49b`: `tests/helpers/css.ts` TOKEN_NAMES 410-442, PALETTE_LIGHT 453-485, PALETTE_DARK 487-519, CONTRAST_PAIRS 653-667 (hinted-cue :657, control-border :659), PairGroup 627, TRANSLUCENT_TOKENS 528; `tests/play-page-helpers.test.ts` DESIGN_TOKENS 400-432, 474, 480-481 (comment 470-471), 506-510, 526-530, DARK_SAMPLE 1444-1476, 1490; `tests/play-page-cause-stylesheet.test.ts` 212-213 (comments 12, 209); `tests/play-page-theme-stylesheet.test.ts` 168, 177 (comment 164, title 165); `tests/play-page-level-stylesheet.test.ts` 220, 230, 188, :15 (stale held comment), describe 122-175; `tests/play-page-layout-geometry.test.ts` 22-23, 24, 57, 92, 96; `tests/play-page-stylesheet.test.ts` 98, 109 (comment 94, title 96), 322-336, 419-422; `tests/play-page-palette-stylesheet.test.ts` 73; `tests/play-page-panel-shell-stylesheet.test.ts` it 178-195; `e2e/nfr-13-a11y.spec.ts` 177-233 (premise at 194, 231); `e2e/nfr-14-layout-geometry.spec.ts` 49, 124-126, 127-146; `src/ui/style.css` base `.setup-sheet` 798, 48rem rule 826-827, `.setup-close` 906.

Fold by the parent (session B), 2026-10-11 about 18:06 (UTC+5:30), folder text only. Validation after the fold (task 1.2):
```
$ npx openspec validate update-setup-sheet --strict
Change 'update-setup-sheet' is valid
$ npx openspec validate --all --strict
Totals: 4 passed, 0 failed (4 items)
```
