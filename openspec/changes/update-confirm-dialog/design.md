# Design: update-confirm-dialog

## Context

Block C of the second wave of the parallel G2 plan (`docs/handoff/parallel-g2-plan-2026-10-11.md`), implemented by its own session in its own worktree, started from a `main` that holds the three wave-1 blocks and the signed wave-2 amendments. The signed text is FR-65 (the dialog clause), FR-67 (the presentation sentence), NFR-14, A-62 and the A-57 appendix row `--color-violation-ink` in `docs/requirements.md`, and `docs/handoff/dialog-amendment-draft-2026-10-12.md` (DQ-1 to DQ-4 by default, SP-1 A, OQ-1 A; autonomy-log row 193).

Today (`src/ui/style.css` ~612-649): `.confirm` is `width: min(22rem, calc(100vw - 32px))`, `padding: 20px`, radius 12px, with the shell's fill, 1px `--color-control-border` border and panel shadow; `.confirm p` has a 20px bottom margin; `.confirm-buttons` already has `flex-wrap: wrap-reverse` and the design's gap; `.confirm-buttons button` is `flex: 1 1 auto`, `min-height: 2.75rem`, weight 700 and otherwise the base `button` rule (padding `10px 16px`, 1px border, 6px radius, `--color-control-bg` fill), so each button is 46px tall and neither has colours of its own. The design (`design/v0/app/binarka.css` 1338-1395) has 22rem less twice `--page-pad`, 1.5rem padding, `--radius-l`, buttons `padding: 0 1rem` with a 2px border and `--radius-m`, «Скасувати» filled primary and «Так, почати» in the violation colours.

## Goals

- The dialog has the design's size, place and paint at the five confirm widths (320, 375, 768, 1024, 1440), light and dark.
- Every confirm shot of the gate rises against run 12; the four phone shots should pass if the box and the paint match.
- The 44px floor of NFR-12 holds; the shell's tests on `.confirm` stay green without an edit.
- The stylesheet stays inside the colour scan and holds no unused token.

## Non-goals

- Hover, press, the dialog's fade and scale (DQ-3); the settings panel (the other wave-2 block); any DOM change; a refreeze of `quality/design-paint.json`; a pixel floor; Safari and Firefox (NFR-7).
- No edit to `design/v0`, to the locked adapter `scripts/check-visual-parity-adapters.mjs`, to `playwright.config.ts`, to `src/ui/play-page.ts`, or to a requirement other than the six named in `proposal.md` (five MODIFIED, one ADDED).

## Decisions

1. **The deltas are written against the post-wave-1 text.** The five MODIFIED blocks reproduce the baseline requirements in full with only this block's edits; the three count-only blocks change a number, the named token or change, and a Traces line each. Trade-off: the full-text copies are long and must be diffed against the baseline at implementation time (task 1.1); the alternative, a MODIFIED block that quotes only the changed sentence, is not valid OpenSpec (a MODIFIED block replaces the requirement). The dialog block merges first, so its baseline is the wave-1 baseline.
2. **The token sits right after `--color-focus` in the spec table and in `TOKEN_NAMES`.** The draft says "appendix order, after `--color-focus`, before `--color-surface-raised`"; in the appendix the two are adjacent, but in the spec table and the helper the two backdrop rows lie between them. The folder puts the row immediately after `--color-focus` (the appendix's own order). Either place keeps `TOKEN_NAMES.at(-1)` equal to `--color-option-border`, which the setup-sheet test pins at line 812, so that line needs no edit. Not ADR-worthy.
3. **`--color-violation-ink` is its own token (DQ-1 A).** Light it equals `--color-violation-text` (`#8f1d17`); dark it differs (`#ffb4ab`, 8.40 on the fill, against `#ff8a7d`, 6.24). Reusing `--color-violation-text` would save a token and a pair and leave a small mismatch in the dark confirm shots' button text. The user signed A. Not ADR-worthy (A-57's reasoning for the palette applies).
4. **The red frame is decoration, not a pair.** «Так, почати» is identified by its text, which is a pair (7.34 / 8.40). Its 2px `--color-violation-border` frame lies on the dialog fill at 6.43 / 6.54, which would pass as a pair; A-60 says nothing in the project requires a border for a text-labelled button, so the frame is left out of `CONTRAST_PAIRS` so that the list keeps only the cues the project relies on. The scenario records the ratios and pins that no pair names `--color-violation-border` with `--color-surface-raised`, so the exception is visible and cannot widen silently. The focus ring of either button spans 5px (2px offset, 3px wide) into an 8px gap in both wrap states, so it lies on the dialog fill only: no new adjacency. Trade-off: the frame is held to no minimum ratio (it is in no pair), as the overlay and option borders; the scenario pins the recorded values (6.43 / 6.54), so a later change of the frame's token fails that test and must be re-recorded on purpose, but no threshold decides whether the new value is acceptable.
5. **The width formula depends on `--page-pad` inherited from `#app`.** `--page-pad` is declared on `#app` only (`src/ui/style.css` 116, 133-137: 1rem, 0.75rem at 22.5rem and narrower). The dialog is a child of the page root (`src/ui/play-page.ts` ~652) and the top layer keeps inheritance, so `.confirm` needs no declaration of it: 296px at 320, 343px at 375, 352px from 768. The stylesheet test pins that `--page-pad` is declared on `#app` and not on `.confirm`; the e2e at 320 catches an unresolved variable (an invalid `width` computes to `auto`). Alternative: a literal `calc(100vw - 1.5rem)` in a 22.5rem media block, which duplicates the breakpoint and drifts from the design. Not ADR-worthy.
6. **The port edits the existing rules in place.** The shell's stylesheet test reads "the rule that is exactly `.confirm`" outside any at-rule and asserts no such rule inside an at-rule declares a fill, border colour or shadow. The port changes `width`, `padding` and `border-radius` in that rule, adds no second `.confirm` rule and no `.confirm` rule in an at-rule. The two `[data-confirm]` rules have their own selectors and do not count as "exactly `.confirm`". `.confirm-buttons button` is edited in place for the same reason. A scenario pins the guard.
7. **The design's inner metrics are part of the requirement; the page's base `button` rule is not the design's.** The base rule gives every button `padding: 10px 16px`, a 1px border, a 6px radius and a 24px line; the design's dialog buttons have `padding: 0 1rem`, a 2px border, `--radius-m` and line height 1.2, so they are 44px tall, not 46 (D3 of the draft). Without them neither the box nor the paint can match. Trade-off: more declarations than the signed sentence lists, all in A-62.
8. **No DOM change.** The DOM order is «Так, почати», then «Скасувати» (`src/ui/play-page.ts` 181-182) and the page already has the design's `flex-wrap: wrap-reverse` with `justify-content: flex-end`, so at 320, where the two 246px buttons do not fit side by side, the last child goes to the upper line: measured in `classify.txt`, «Скасувати» above «Так, почати» on both sides (design y 338 and 390, page 334 and 388); at 375 they are side by side with «Так, почати» on the left.
9. **The geometry cases go under their own key, `confirmDialog`, with no deviation.** `e2e/nfr-14-layout-geometry.spec.ts` pins `fixture.cases` to its 32 shots, and the keys `rulesPanel` and `setupSheet` exist. Unlike the setup sheet there is no departure from the design, so the key holds `boxes` only (no `expected`). It holds `selectors` (`dialog[data-dialog="confirm"]`, its `p`, `[data-confirm="yes"]`, `[data-confirm="no"]`), `coverage: "sampled"`, its own provenance and 5 cases `<w>-light-confirm` at 320×700, 375×812, 768×1024, 1024×768 and 1440×900. The design's `/confirm/` route shows the dialog open at load (a press would do nothing useful); the page side replays the recorded `afterLoad: "open-confirm"` (press `[data-action="new"]` on the capture board, wait for `dialog[open]`, as the adapter's `confirm` driver does). `review-set-14` has no 1366 confirm shot, so there is no 1366 case. The freeze script keeps the top-level `provenance` when `designCommit` and `designCssSha1` are unchanged and writes the fresh build hash and browser into `confirmDialog.provenance`.
10. **The paint is compared live, not frozen.** The computed `color`, `background-color`, `border-top-color` and `border-top-width` of both buttons are read from the design build, which the test serves itself on a port chosen by the operating system (the pattern of `e2e/nfr-14-panel-shell.spec.ts`), in light and dark at 375×812 and 1024×768. `quality/design-paint.json` is not refrozen: it is a frozen file of the main column and the dialog is outside it. Trade-off: the test needs `design/v0/out`; it fails with the build instruction when it is missing, never skips.
11. **This block owns the token and pair pins and merges first (SP-1 A).** See "The split".
12. **No motion and no hover (DQ-3).** A scenario pins that no rule of the dialog declares `transition`, `animation`, `transform` or `opacity`, none is inside `@starting-style` or the reduced-motion `no-preference` block, and none has `:hover` or `:active`.

## Data model

No stored data (TC-12). One token in both sets, one pair:

| Token | Light | Dark | Translucent | In a pair |
|---|---|---|---|---|
| `--color-violation-ink` | `#8f1d17` | `#ffb4ab` | no | `--color-violation-ink` on `--color-violation-bg`, group `text`, 4.5:1: 7.34 light, 8.40 dark |

Other ratios used by the paint, all already pairs or recorded: `--color-primary-text` on `--color-primary` 5.40 / 8.55 (group `text`), `--color-focus` on `--color-surface-raised` 15.88 / 12.79 (group `focus-ring`), the red frame on the dialog fill 6.43 / 6.54 (decoration, in no pair). The computed values the e2e expects are in the ADDED requirement. The fixture key:

```json
"confirmDialog": {
  "selectors": ["dialog[data-dialog=\"confirm\"]", "dialog[data-dialog=\"confirm\"] p", "[data-confirm=\"yes\"]", "[data-confirm=\"no\"]"],
  "coverage": "sampled",
  "provenance": { "designCommit": "", "designCssSha1": "", "designBuildSha1": "", "browser": "" },
  "cases": [{ "shot": "320-light-confirm", "width": 320, "height": 700, "state": "confirm", "captureBoard": { }, "afterLoad": "open-confirm", "boxes": { } }]
}
```

## Error handling strategy

- The page has no new runtime error path: the change is stylesheet-only. A wrong token, a stray old binding or a second `.confirm` rule is a stylesheet test failure that names the rule and the declaration.
- The e2e fails (never skips) with the case, the element and both boxes (or both colour strings, with the button, scheme and viewport) on any difference; it asserts the dialog is `[open]` before it reads, and fails with the freeze instruction if the key `confirmDialog` is absent, and with the `pnpm build` instruction of `design/README.md` if `design/v0/out/index.html` is missing.
- A capture-unstable run is a harness defect to file, not a pixel finding (AGENTS.md, capture determinism). Captures run on this session's own `BINARKA_PORT_BASE`.

## Pixel expectations

Measured in `docs/qa/prep-g2-wave2/classify.txt` (device pixels; sampled; every score equals run 12 to four places).

| Shot | Run 12 | What the failing pixels are |
|---|---|---|
| `320-light-confirm`, `320-dark-confirm` | 0.9194, 0.9180 | «Скасувати» unpainted: 42,755 px light and 42,759 dark (the design's `#b4460d` and `#f39a5b` where the page shows the base button fill); the dialog 8px narrower (288 against 296) and 8px shorter (210 against 218: padding +8, the text's bottom margin +4, the two 46px buttons −4), so its edge, its corners (12 against 16px) and the backdrop band differ (22,858 / 24,133 px); «Так, почати» unpainted (6561 / 6555 px). The text box is the same (37,266 246×48 on both: 16 + 1 + 20 = 12 + 1 + 24) |
| `375-light-confirm`, `375-dark-confirm` | 0.9582, 0.9590 | «Скасувати» unpainted (22,652 / 22,664 px); the dialog 10px shorter (156 against 166: padding +8, text margin +4, the 46px buttons in one row −2), its text 8px wider and 4px further left (301 against 293), so the lines start at another pixel (4156 / 4122 px); «Так, почати» unpainted (5316 / 5321 px) |

The shots from 768 pass today (0.9836 to 0.9904) because the paint and height causes act there too (`1024-light-confirm`: «Скасувати» 23,486 px, the dialog 18,558, «Так, почати» 5397, the text 4298) but the shots are 2.6 to 5.8 times larger than the phone shots, so the share is 0.96 to 1.64% instead of 4.1 to 8.2%; the width cause is 320's alone, from 768 both dialogs are 352 wide.

**Expected, not measured: every one of the ten confirm shots rises against run 12.** The four phone shots should pass if the box and the paint match; the per-block tool decides, and there is no 0.98 claim per shot. `node scripts/visual-block.mjs --block confirm --states confirm` localises any residual. **If a confirm shot does not rise, the block stops and explains it before the review gate.** A fall is reported as measured, never argued away.

## The split

Repeated from section 9 of `docs/handoff/settings-panel-amendment-draft-2026-10-12.md` (signed on 2026-10-12, row 193: SP-1 A, no shared slice, the dialog first; OQ-1 A, so the settings block adds no token). The same text is in the `design.md` of the settings block.

**What the two blocks share.** Nothing that is used by both: no token (the dialog block declares `--color-violation-ink` and its one pair; the settings block declares none), and no geometry or paint rule of `src/ui/style.css` (this block edits `.confirm`, `.confirm p`, `.confirm-buttons`, `.confirm-buttons button`, the two `[data-confirm]` rules and the `:root` token; the settings block edits `.settings`, `.theme-control`, `.language-control`, `.settings-close`). Both add cases to `quality/design-geometry.json` (keys `confirmDialog` and `settingsPanel`) and a block to `scripts/visual-block.mjs` (`confirm`, `settings`): a mechanical conflict for whichever merges second. The two sessions start at once from `main`; there is no shared serial slice (wave 1 had one because its four shell tokens and the board-size hook were used by every surface).

**Requirements of `openspec/specs/play-page/spec.md`, each MODIFIED by exactly one folder:**

| Requirement | Owner |
|---|---|
| «Borders, cues and focus rings have enough contrast» (the token table, the pair list, the counts, and the role column, including the roles of `--color-text-muted`, `--color-primary` and `--color-primary-soft` in the theme and language options, which this folder words from A-61) | **this folder** (`--color-violation-ink`, one pair) |
| The token and pair counts in «Main column layout geometry follows the design reference», «The panels take the shared surface paint» and «The rules panel takes the design's size, place and paint» | **this folder** (count-only deltas) |
| ADDED «The confirmation dialog takes the design's size, place and paint» | **this folder** |
| «Confirmation before discarding player entries» | **this folder** (one sentence only, open point 6; DQ-4: the presentation sentence is in FR-67 and the ADDED requirement) |
| «Cells and buttons show a visible, unobscured focus indicator», «Settings button and panel», «The setup sheet takes the design's size, place and paint» (its guard sentence on the theme and language options), «The theme options set their own colours», ADDED «The settings panel takes the design's size, place and paint» | the settings block |
| «The main column takes the design palette», «The backdrops take the design's translucent tokens», «Segmented options keep the focus ring inside the card» | nobody: their text stays true after both blocks |

**Tokens.** This block declares `--color-violation-ink` (light `#8f1d17`, dark `#ffb4ab`) and the pair `--color-violation-ink` on `--color-violation-bg`; the token and pair pins are this block's alone. The settings block adds no token and no pair.

**Design freezes.** `quality/design-geometry.json` is refrozen by one stream at a time: **this block refreezes first, under the key `confirmDialog`** (task 3), before its port; the design does not change, so the refreeze adds cases and changes no existing case (the provenance guard of `scripts/freeze-design-geometry.mjs`). The settings block adds its key after rebasing onto this block's merge, or the user decides the order. `quality/design-paint.json` is not refrozen by this block.

**Shared files and the second block's expected rebase conflicts.** `src/ui/style.css`: each block edits only its own rules; the `:root` blocks (this block's one token line) and any neighbouring lines may conflict textually. `src/ui/play-page.ts`: neither block. Three test files are edited by both blocks at different lines (textual conflicts only, no semantic dependency), and are in the second block's expected conflicts:

| File | This block (token and pair pins) | The settings block |
|---|---|---|
| `tests/play-page-theme-stylesheet.test.ts` | l. 168, 171, 180 (32 to 33) | its cue tests at l. 228-288 |
| `tests/play-page-setup-sheet-stylesheet.test.ts` | l. 807 (`'41 pairs'`; 812 unchanged) | its guard at l. 600 |
| `tests/play-page-palette-stylesheet.test.ts` | l. 75 (title) | its adjacency test at l. 97 |

Also expected to conflict for the second block: `quality/design-geometry.json`, `scripts/visual-block.mjs`, `scripts/freeze-design-geometry.mjs`, `README.md` and the baseline spec after the first archive. **Captures.** Each session sets its own `BINARKA_PORT_BASE` (for example 6373 for this block and 6473 for the settings block; `node scripts/capture-ports.mjs` lists the roles), so no lock is needed.

**Merge order.** This block merges first on the user's word (it is smaller and owns the token pins). The settings block rebases, re-runs its whole battery and a fresh `check:visual`, and merges on the user's word. If the settings block is ready first, it may merge first on the user's word instead; then this block rebases onto it, redoes task 3 on top of its key and re-runs the battery.

## Risks and mitigations

- **A count pin is missed.** Three requirements outside «Borders…» pin the counts and line 1591 of the baseline ("the same 32 names") is easy to miss. Mitigation: `grep -n "32 token\|the 32\b\|41 pairs\|32nd\|32)" tests/ openspec/specs/` before the red run and after the port (task 2.2); the list in `proposal.md` is the audit's.
- **The inherited `--page-pad` does not reach the dialog** (decision 5). Mitigation: the e2e at 320 compares the width with 296; the stylesheet test pins the declaration on `#app`.
- **A second `.confirm` rule breaks the shell's tests** (decision 6). Mitigation: the guard scenario; a shell test that fails is a finding for the user, not a test to edit.
- **The 320 wrap order changes with the new metrics.** The two buttons are 246px wide at 320 and wrap; the e2e compares both buttons' boxes, so a swap shows. The focus ring (5px) in the 8px gap is checked by the NFR-13 sweep and the smoke test.
- **A confirm shot falls or does not rise.** The block stops and explains it (the classify buckets and `diff.png`). The dark shots differ from the light ones only by colour; `375-dark-confirm` and `320-dark-confirm` are checked by eye on the stills.
- **Dark bands.** `--color-violation-bg` `#3f2320` on the dialog's `#2c2620` is a soft band as in the design. Not a defect.
- **Safari and Firefox are untested** (NFR-7).

## Open points

1. **Token placement.** The draft's "after `--color-focus` and before `--color-surface-raised`" is ambiguous where the backdrops lie between; decision 2 picks "immediately after `--color-focus`". The user may place it elsewhere (a pin edit only).
2. **Beyond the draft's literal list but demanded by it.** The 4.5:1 text bullet list and the scenario «The control border has 3:1 and the text has 4.5:1» enumerate "the 4.5:1 list", so both gain the new pair, and line 1591 of the baseline ("the same 32 names") changes with the other counts; one new scenario records the pair and the frame's decoration status; the role column also names «Скасувати» and «Так, почати» on `--color-primary-text` and `--color-violation-bg`.
3. **DQ-4 alternative.** The presentation sentence could also be put in «Confirmation before discarding player entries»; the default (signed) leaves that behaviour requirement unchanged, apart from the one stale sentence of open point 6.
4. **No focus-ring wording change.** The focus-ring bullet of «Borders…» says the panels' and the dialog's fill is "where the ring of «Зрозуміло», «Закрити» and the options is drawn"; the dialog buttons' rings lie on the same fill and the pair already exists. The bullet is left as it is.
5. **Historical sentences carried verbatim.** The count-only delta of «The panels take the shared surface paint» copies its not-delivered items (1) and (2) unchanged: they say the settings panel's «Закрити» is not sticky and its paint is "the second wave". They describe what the shell change did and are read as history (the settings draft, section 5; `docs/qa/update-settings-panel/folder-audit.md` finding 6); this folder does not reword the settings block's work.
6. **A stale "held" in a behaviour requirement** (dialog folder audit, finding 12): «Confirmation before discarding player entries» says the dialog's place is "covered by the held NFR-13 and NFR-14". The user chose «Fix the sentence» (2026-10-12, about 12:30): the folder MODIFIES that one sentence of «Confirmation before discarding player entries»; nothing else of that requirement changes (`docs/qa/update-confirm-dialog/folder-audit.md`).

## What was checked

- The baseline spec for every count: `grep -n -o` of "32 token", "the 32", "41 pairs", "27 of", "16 text", `violation-ink`; the places are `1512`, `1549`, `1590-1592`, `1597`, `1646-1647`, `1687`, `3978`, `4391`, `4580` of the baseline at `019808f`, plus `1679` and the 4.5:1 list `1576-1582`. «The backdrops take the design's translucent tokens» (item (2), l. 4099) and the "not delivered" list of «The panels take the shared surface paint» (l. 4343) name the dialog's token as a later block's; they describe those requirements and stay true.
- The appendix still marks six bound rows "later" (`--color-surface-raised`, `--color-overlay-border`, the two backdrops, the two shadows); `--color-violation-ink` was the last row no block had bound.
- `tests/helpers/css.ts` `TOKEN_NAMES`, `CONTRAST_PAIRS` and the pin files, by grep at `019808f`: the line numbers of the draft hold within a few lines (the level test's "no 33rd" message is at 246, its `toHaveLength` at 236).
