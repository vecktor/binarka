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
