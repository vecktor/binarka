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

## Re-audit after the shell (task 1.1, session A)

- **Trigger:** the baseline changed after the folder was written. Folder commit `7564ae3` (17:34); shell archive `defc5e5` (17:52). `git diff --stat 7564ae3 ebaf49b -- openspec/specs/play-page/spec.md docs/requirements.md src/ tests/ e2e/ scripts/ quality/` gives `openspec/specs/play-page/spec.md` +208/−23, `docs/requirements.md` 2 lines, `e2e/nfr-14-panel-shell.spec.ts` +6, `tests/play-page-root-size.test.ts` 8 lines, and **no change under `src/`**.
- **Auditor:** a fresh spec-compliance-auditor subagent, read-only, 2026-10-11 from about 17:57 to 18:03 (UTC+5:30), session A, worktree `peaceful-nash-a513f8` at `ebaf49b`. It did not write the folder. Its scratch files were in the session scratchpad, outside the repo, and it deleted them.
- **The diff of item 1:** the baseline «Rules panel» (spec l. 727) is byte-identical at `7564ae3` and at `ebaf49b`, so the shell's archive did not touch it and the delta reverts no shell edit. `diff -u` of the baseline block against the folder's MODIFIED block gives four hunks, and each is an edit `proposal.md` names:
  - (a) `autofocus` stays, with the sticky clause;
  - (b) the placement sentence of FR-57 replaces "held NFR-14";
  - (c) the scroll-reset sentence, and the Traces line gaining NFR-14, A-59, A-20;
  - (d) the new AND clause of «The panel opens with no script», and the two new scenarios.
  
  No hunk is un-named.
- **Shell requirements:** «The panels take the shared surface paint» (spec l. 4290) and «The page root carries the board size» (l. 4376) exist. Every sentence the folder cites from them matches the baseline and `src/ui/style.css`:
  - the top-level `.rules` (647-665) binds the raised fill, the overlay border and the sheet shadow;
  - the 48rem `.rules` (677-689) binds the overlay border and the panel shadow;
  - `--board-width` is declared on `#app` (214), and `--column` on `#app` from 48rem (1053).
- **Requirements text:** FR-57 (l. 109), A-59 (l. 353) and NFR-14 (l. 184) equal the folder's text. The only change to requirements.md since the folder is the A-60 line (setup sheet), which the folder does not quote.
- **Shell tests against the port:** none break as long as findings 2 and 3 are followed.
  - `panel-shell-stylesheet:63` wants one top-level `.rules`.
  - `:84` and `:94-98` want one exact `.rules` with `box-shadow` and `border-color` across the 48rem blocks.
  - `:153` counts 7 shadow rules over exact panel selectors, which excludes `.rules-close`.
  - `:158` only wants each token used more than zero times; nothing counts the bindings of `--color-surface-raised`.
  - The colour scan accepts multi-layer shadows (`tests/helpers/css.ts:347`).
- **Validate:** `npx openspec validate update-rules-panel --strict` → `Change 'update-rules-panel' is valid`.

| # | Severity | Finding | Disposition (folded by the parent, session A, 2026-10-11 ~18:06) |
|---|---|---|---|
| R1 | major | The scenario «Below 48rem … bottom sheet» cannot be checked from the parsed CSS. jsdom 29.1.1 keeps only the last `max-height` and drops a `padding` shorthand that holds `env()` (the auditor probed this). | Fixed. The scenario reads the raw text of the top-level rule for the `max-height` order and the padding, as the shell's raw counts do. |
| R2 | major | The 22.5rem `.rules`/`.mini` rules have no fixed place. The existing 22.5rem block (`style.css:451`) is before the panel, so (a) the shell's raw count, which reads the first `.rules {` block, would turn red, and (b) the top-level `padding` and `.mini` `width` would win. | Fixed. The table row and the scenario require a later block and the top-level rule as the first `.rules` of the raw text, with the order asserted. design.md decision 10 is new; tasks 4.2 updated. |
| R3 | major | The 48rem techniques `margin-top: 0` (and `.rules-close` `margin-top: auto`) lose to the later top-level rules if they are put in the 48rem block at 671. | Fixed. The table row and the «flex column» scenario require a later block and assert the order. Decision 10 and task 4.2. |
| R4 | minor | jsdom serialises a zero length as `0px`; "whitespace aside" does not cover that. | Fixed. A global comparison sentence was added before the ADDED Traces line. |
| R5 | minor | The inner-metrics paragraph uses inexact words. | Fixed. Each is now named as a declaration (`display: flex`, `flex-direction: column`, `align-items: center`, `font-variant-numeric: tabular-nums`, `width`/`height: 1.75rem`, `list-style: none`, `padding: 0`), in the paragraph and in the scenario. |
| R6 | note | Predicted from the box model, not measured: a stuck sticky button sits at the padding-box edge, so the ring check would fail at 320/375. | **Refuted by measurement.** `docs/qa/update-rules-panel/sticky-ring-probe.txt`: on the design build, Chromium keeps the stuck button 16 px above the inner bottom edge (the panel's 1rem bottom padding) and 16 px from the left and right, at 4 viewports, first opening and end. The 5 px ring fits. The same probe confirms `.rules-close` computes `padding: 1px 6px`, height 44 px. Recorded in design.md (Risks, and decision 8). The e2e still measures it on the page. |
| R7 | minor | `decidedBy` has no tie rule. "Compared with the values before the change" needs a literal copy. | Fixed. Ties are within 0.5 px, with the order `max-height`, `min-height`, `content`. The tests hold literal copies of `TOKEN_NAMES` and `CONTRAST_PAIRS`. |
| R8 | minor | "The panel's creation at line 138": line 121 creates the panel, 138 is the close button, 150 is the append. | Fixed in proposal.md and tasks 4.1. |
| R9 | note | Some line numbers drifted (style.css 647-751, the freeze script 112-127/114-123, nfr-12 l. 53, layout test 203-212 / 228-276). | Fixed. The Impact preamble of proposal.md lists the re-grepped numbers. |

Validation after the fold (task 1.2), re-run by the parent at 18:07:
```
$ npx openspec validate update-rules-panel --strict
Change 'update-rules-panel' is valid
```
