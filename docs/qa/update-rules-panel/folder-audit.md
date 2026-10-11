# Folder audit: `openspec/changes/update-rules-panel/` (written in the prep session)

- **Auditor:** a fresh spec-compliance-auditor subagent, read-only, 2026-10-11 from about 16:56 to 17:03 (UTC+5:30), prep session `vibrant-tu-434033`. It did not write the folder (a spec-writer did) and edited nothing. `npx openspec validate update-rules-panel --strict`: valid.
- **Result:** 3 major, 7 minor, 2 notes. The MODIFIED «Rules panel» is a clean diff of the baseline (l. 727-807); every design value of the ADDED requirement equals `design/v0/app/binarka.css` (809-962, 1018-1047, 1133-1152) once the spacing and radius variables are resolved; the folder keeps to the split (only «Rules panel» MODIFIED); `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs` are not locked, the adapter is (unchanged); jsdom keeps an assigned `scrollTop` (checked), so the reset is testable there.

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | «Зрозуміло» inherits the page's base `button { padding: 10px 16px }` (`src/ui/style.css:466-476`) → 48 px; the design has no base button rule → 44 px; the box test cannot pass (worked from the CSS, not measured) | Sent to the spec-writer: state the padding in the requirement; also sent to block B's spec-writer as a note for the sheet's controls |
| 2 | major | Literal 31 tokens / 38 pairs in the spec contradict the split (B moves them to 32 / 41) | Sent: compare with the baseline list, not a number; add the counts and `docs/qa/a11y-report.json` to the expected merge conflicts |
| 3 | major | The freeze script rewrites provenance; in this worktree `designBuildSha1` is `cdf4751f…` against the recorded `feb08415…` (designCommit, designCssSha1 and the browser match), so "provenance byte for byte" fails | Sent: require only `designCommit` and `designCssSha1` unchanged; the fresh build hash and browser go into the new key's own provenance |
| 4 | minor | The "supersedes … paint only" sentence quotes shell text that was reworded | Sent: delete it and its echoes |
| 5 | minor | The ring-clipping mitigation names a check that cannot see clipping | Sent: an e2e geometry assertion while the button is stuck |
| 6 | minor | "scrollTop equal to scrollHeight" is impossible | Sent: read back scrollHeight − clientHeight |
| 7 | minor | A possible race between the open reset and the locked `rules-techniques` driver | Sent: an e2e clause (open, a frame, set the end, a frame, still at the end) |
| 8 | minor | 800×600 checks the max-height cap, not the min-height | Sent: say so; record per case whether min-height decided the box |
| 9 | minor | The ".rules*" scans also catch the header's `.rules-button` | Sent: scope them |
| 10 | minor | Impact gaps (backdrop, theme, palette tests reading `.rules*`; a drifted line) | Sent |
| 11 | note | Owners named for sections 2 and 4 only | Sent: name the rest |
| 12 | note | Verified: the diff, the values, the reset mechanism, the geometry key, the split, the locks, the probe numbers | No change |

## Fold

The spec-writer folded all 11 findings on 2026-10-11 at about 17:04 (UTC+5:30), editing only the folder: (1) `.rules-close` declares `padding: 1px 6px` (the design's effective user-agent padding), the geometry e2e decides; (2) no literal counts, the tests compare the helper lists before and after; the counts and `docs/qa/a11y-report.json` join the expected merge conflicts (task 10.2); (3) the top-level `provenance`, `cases` and `selectors` stay; the freeze script keeps them when `designCommit` and `designCssSha1` are unchanged and writes the fresh build hash and browser into `rulesPanel.provenance`; (4) the supersede sentence and its echoes deleted; (5) an e2e ring-clipping assertion while the button is stuck, at 320×700 and 375×812; (6) read back scrollHeight − clientHeight; (7) an e2e clause for the reset against the end-scroll driver; (8) 800×600 named as the max-height check, the freeze records per case which height decided the box; (9) "the panel's rules" defined, never `.rules-button`; (10) Impact rows added, the helper line 1226; (11) owners named per section.

Validation after the fold (re-run by the parent):
```
Change 'update-rules-panel' is valid
- Validating...
✓ spec/play-page
✓ spec/puzzle-engine
✓ change/update-panel-shell
✓ change/update-rules-panel
Totals: 4 passed, 0 failed (4 items)
```
- 2026-10-11 about 17:28: block B's folder audit (finding m5) noted that task 10.2 omitted the two scripts both blocks edit; the parent added `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs` to its expected conflicts.
