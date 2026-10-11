# Design: update-panel-shell

## Context

G2 serial slice, run in the prep session before the parallel rules-panel block (A) and setup-sheet block (B) (`docs/handoff/parallel-g2-plan-2026-10-11.md`, section P; autonomy-log row 172: PQ-1 and XQ-1 signed). Blocks 1 to 3 and `add-violation-cause` are archived. The signed text is section 6 and section 9 of `docs/handoff/setup-sheet-amendment-draft-2026-10-11.md`, A-57 and its appendix, FR-65, A-59, A-60 and the 2026-10-11 note in `docs/requirements.md`.

Today's page paints each surface with `--color-control-bg`, a `--color-given-bg` border (the rules panel states it twice: in its base rule and again in its 48rem block, `src/ui/style.css` ~643 and ~669) and no shadow. The design (`design/v0/app/binarka.css` lines 809-829, 949-962, 1103-1117, 1337-1349) uses `--surface-raised`, `--overlay-border` and two drop shadows. Neither the page nor the baseline spec has a token for them: the appendix lists them as "later".

## Goals

- The four surfaces take the design's fill, border colour and shadow, from tokens, in light and in dark.
- The three panels can be read as one shell by blocks A and B: the tokens, their pairs and the board-size hook exist once, before A and B start.
- The stylesheet stays inside the colour scan (tokens only, no `color-mix(`, no `!important`, one `:has(`).
- The page geometry does not change.

## Non-goals

- Anything that is not fill, border colour or shadow of the four surfaces (the list is in `proposal.md`, "Scope NOT delivered"). No pixel floor for any shot.
- The motion of the surfaces, the design's mask shadow on «Закрити», `--color-option-border`, `--color-violation-ink`.
- No edit to `design/v0`, to `quality/*.json` (the shell adds no freeze case), to `docs/requirements.md` or to `playwright.config.ts`.

## Decisions

1. **Paint only, plus the one hook, and the folder says so.** Everything the user listed is a colour or a shadow, bound to rules that already exist, except the two new `background-color` declarations on `.setup-close` and `.settings-close` (today they inherit the base `button` fill, so the shell adds a declaration; it does not change one). The board-size hook is the only thing beyond paint: one attribute and a move of five variables. It is in the shell because A and B both need the board side outside the board and run in parallel (XQ-1 A). Trade-off: the slice is no longer purely visual, so its red tests and its geometry guard are heavier than a paint slice.
2. **The hook is an attribute on the root, not `:has(` (ADR-worthy: a DOM-contract addition; propose to the user at the review gate, write only on the user's word).** The design reads the size with `#app:has(.board[data-size='…'])`. FR-65 allows `:has(` in the idle-line rule only, so the page sets `data-size` on the root in the same step that creates the board (`showPuzzle` and the mount) and the stylesheet keys on `#app[data-size='…']`. Alternatives, both offered to the user and not taken: XQ-1 B (the panels use `--column` for the board side: exact only when the board fills the column, too tall for 4×4 and for short windows, with an unmeasured pixel cost in the `four` setup shots) and XQ-1 C (no `min-height` from 48rem, so the 768 rules shot would show the board under the panel's bottom edge). Cost of A: one attribute of contract and one assignment. The selector is `#app[data-size='4']`, not a bare `[data-size='4']`: the board carries `data-size` too, so a bare selector would also give the board its own copy of the variables and hide where the declaration lives.
3. **Why the five variables move together.** `--board-width` is `calc(var(--n) * var(--cell-max) + (var(--n) - 1) * var(--board-gap) + 2 * var(--board-pad) + 2px)`. A custom property that holds `var()` is substituted on the element that declares it, so `--board-width` on `#app` sees only the `--n`, `--cell-max`, `--board-gap` and `--board-pad` that `#app` has. All five (and the `--cell-max` rules of the 30rem and 48rem blocks, which read `--n`, `--cell-cap` and `--reserve`) must be on `#app`. Units such as `dvh` and `svh` stay unresolved in a custom property until used, so the board resolves them as before. The `.board` rules keep what is the board's own: the grid, `width`, the padding, and for 8×8 on phones `--bleed`, `width` and `margin-inline`. Each variable rule stays at the place of the `.board` rule it replaces, so the order and the relative specificity are kept (`#app[data-size]` over `#app`, as `.board[data-size]` was over `.board`). When `data-size` is missing or unknown, the plain `#app` rule gives the 6×6 values, a safe layout.
4. **The no-board case.** FR-88 and FR-101 allow a mount with no board (all three seeds ran out). `size` starts at 6 (`src/ui/play-page.ts:181`) and nothing changes it until a board is shown, so the root says `6`. The attribute is set at mount before any generation, so a failed generation never leaves it unset or stale, and a mount on a root that held another mount starts from 6.
5. **The dialog keeps `--color-control-border`.** The brief's "overlay-border on … the dialog" is off by one surface (setup-sheet draft section 6): the design's `.confirm` border is `--cell-border` (line 1343), which has the page's `--color-control-border` values in both sets (`#8c8374` light, `#8a7f71` dark). The e2e reads the dialog's border against the design to prove it.
6. **Shadow geometry in the rule, colour in a token (FR-65).** Two tokens split by regime, as the design does: `--color-shadow-sheet` for the bottom sheets below 48rem, `--color-shadow-panel` for the panels from 48rem and for the dialog at every width. They are translucent (`#0000002e`, `#00000040`: the design's alphas 0.18 and 0.25 at 8 bits, 0.1804 and 0.2510), so the e2e allows 0.005 on alpha and 1 on each channel. A shadow paints no text and marks no component, so it is in no pair. This extends the palette amendment's rule "translucent colours are tokens" (the palette change's decision 7); if the user asks for an ADR on it, the shadows are one more case.
7. **The strip and «Закрити» take the surface fill.** In dark `--color-control-bg` is `#24201b` and the raised fill is `#2c2620`: a strip or a button in the old fill would show as a darker band on the panel. The design binds them too (lines 543-552, 642-643).
8. **The pairs.** The raised fill is a background that no existing pair covers. Text, muted text and the focus ring are drawn on it: `--color-text` 15.88 / 12.79, `--color-text-muted` 7.17 / 6.96, `--color-focus` 15.88 / 12.79 (recomputed with the WCAG formula of `tests/helpers/css.ts`). 35 pairs become 38 (`text` 14 to 16, `focus-ring` 8 to 9). **The overlay border is signed decoration, in no pair:** the rules-panel amendment (`docs/handoff/rules-panel-amendment-draft-2026-10-11.md`, section 4) says "the border is not a pair (1.24 light against the page; decoration, the backdrop already separates the panel)", ratified at autonomy-log row 172. Its ratios, for the record: 1.24 on the page and 1.36 on the raised fill in light, 4.55 and 3.81 in dark. Secondary support: the reasoning of A-60 for the available level card's border (WCAG 1.4.11 asks 3:1 for what is needed to identify a component, and a text-labelled surface does not need its edge). The shadows are translucent, so they are in no pair.
9. **The e2e reads the design build live, which the other `nfr-14-*` tests do not.** The brief says "served from `design/v0/out` the way the other nfr-14 e2e tests do". Those tests read frozen files (`quality/design-geometry.json`, `quality/design-paint.json`); only `scripts/freeze-design-*.mjs` and `scripts/visual-block.mjs` serve the build. The signed text (section 9: "its e2e reads the design build live") decides: the new test starts a small static server with the path guard of `scripts/freeze-design-geometry.mjs`, on a port chosen by the operating system (the fixed ports 4173, 4174, 4176 and 4177 belong to the page preview and the capture tools, and the Playwright project runs files in parallel). Trade-off: `design/v0/out` is not committed (`design/v0/.gitignore`), so the test needs a built design; CI does not run Playwright (`.github/workflows/ci.yml`), so CI is unaffected, and a missing build FAILS the test with the build instruction, never a skip (AGENTS.md: a missing mechanism fails). The alternative, a new frozen file, was not taken because the signed text says the shell adds no freeze case, and a freeze touches `quality/design-paint.json`, which one stream at a time may refreeze.
10. **Longhands where the colour scan reads them.** `background-color` and `border-color` (the scan checks those properties as single `var()` values), and the allowed shorthands only with a token colour for `background` (the strip) and `box-shadow`.

## Data model

Tokens (31): the 27 of the baseline plus

| Token | Light | Dark | Translucent | In a pair |
|---|---|---|---|---|
| `--color-surface-raised` | `#fffdf8` | `#2c2620` | no | as background: text, muted text, focus |
| `--color-overlay-border` | `#e2dbcc` | `#8a7f71` | no | none (signed decoration, decision 8) |
| `--color-shadow-panel` | `#00000040` | `#00000040` | yes | never |
| `--color-shadow-sheet` | `#0000002e` | `#0000002e` | yes | never |

Bindings (the full table is in the ADDED requirement). Every rule that paints a surface's own fill with `--color-control-bg` today, checked by grep of `src/ui/style.css`: `.confirm` (~603), `.rules` (~645), `.setup-sheet` (~798), `.settings` (~1085) and the strip `.setup-sheet:popover-open::before` (~918-919, the only sticky mask in the file). These five change. The other `--color-control-bg` rules are controls inside a surface and stay: the base `button` (~474), `.buttons button[data-action='new']` (~416), `.size-control` and its options (~564, ~575), `.setup-button` (~759), `.level-control button` (~843), `.setup-start` (~965), `.settings-button .gear-hole` (~989), `.theme-control` and `.language-control` with their options (~1128-1184). In dark they sit at `#24201b` on the raised `#2c2620`; the design's `.language-control` is also `--surface` (line 386). Which of them the design paints differently is for blocks A, B and the second wave.

Variables moved (decision 3): `--n`, `--cell-max`, `--board-gap`, `--board-pad`, `--board-width`, from `.board`, `.board[data-size='4'|'8']`, the 22.5rem `.board[data-size='6']`, the 30rem `.board` and `.board[data-size='8']`, and the 48rem `.board` and `.board[data-size='8']`, to `#app` and `#app[data-size='4'|'8']` (and `'6'` at 22.5rem) with the same values. The root's attribute: `data-size` is `4`, `6` or `8`, one value per mount, never stored (TC-12).

## Error handling strategy

- The slice has no new runtime error path. The attribute assignment cannot fail; a generation that throws never reaches the step that sets it (decision 4). A wrong token or a stray old binding surfaces as a stylesheet test failure that names the rule and the token.
- The design-side e2e fails, with the surface, scheme, viewport and both computed strings, on any difference; it asserts that the surface is open before it reads (a closed `<dialog>` or an unopened popover would return `display: none` values). A missing `design/v0/out` fails with the build instruction. A capture-unstable run is a harness defect to file, not a finding (AGENTS.md, capture determinism).
- Capture discipline for task 6: take the lock with `mkdir /tmp/binarka-capture.lock` (write the session name into it; remove it after the run and the port check; never delete another session's lock); before and after, `lsof -nP -iTCP:<port> -sTCP:LISTEN` for 4173, 4174, 4176 and 4177 must show no orphaned `vite preview` of this worktree.

## What should move (expected, not measured)

The shell binds the fill, border and shadow that the design has on the four surfaces, so the settings and confirmation shots, whose remaining gap is mostly those three, should rise. Run 9 by state (`docs/qa/g2/check-visual-run-9.txt`, counted from the file): `-dark-settings*` 6 of 13 at 0.98, `-light-settings*` 8 of 13, `confirm` dark 3 of 5, light 3 of 5; the plain `settings` state is dark 2 of 6 and light 4 of 6. The rules and setup shots move a little (their own size, place and paint stay with A and B). This folder claims no pixel floor.

**Stop rule (signed): if any shot falls, the slice stops and explains it before the review gate.** Task 6 compares run 10 with run 9 shot by shot, by state; a shot that was at 0.98 and is not, or a score that is lower, is listed with its cause. A fall is reported as measured, never argued away.

## The split with blocks A and B

Reproduced, with two shell-side clarifications marked, from section 9 of `docs/handoff/setup-sheet-amendment-draft-2026-10-11.md` (signed on 2026-10-11, row 172). The same text is repeated in the `design.md` of blocks A and B.

- **Tokens.**
  - The shell (`update-panel-shell`): `--color-surface-raised`, `--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet`; the three pairs on `--color-surface-raised`; the root's `data-size` and the size variables (XQ-1 A).
  - A (rules panel): none.
  - B (setup sheet): `--color-option-border`; the three ring pairs; `--color-shadow-sunken` withdrawn (SQ-2).
  - `--color-violation-ink` («Так, почати»): the dialog block, second wave.
  - **Shell-side clarification 1:** the shell also writes the withdrawal of `--color-shadow-sunken` (the already folded A-57 appendix, `docs/requirements.md` ~351) into «Borders, cues and focus rings have enough contrast» (the paragraph after the token table) and into the "not delivered" item (2) of «The backdrops…», so block B does not restate it; B's token is `--color-option-border` only.
  - Under PQ-1 B (not chosen) A would declare and bind the four shell tokens, their pairs and the hook, and own the shell's MODIFIED requirements below, and B would start after A merges.
- **Requirements of `openspec/specs/play-page/spec.md`, each MODIFIED by exactly one folder at a time:**

  | Requirement | Owner (in order) |
  |---|---|
  | «Borders, cues and focus rings have enough contrast» | the shell (four tokens, three pairs), then B (one token, three pairs); not A |
  | «The main column takes the design palette» | the shell |
  | «The backdrops take the design's translucent tokens» | the shell |
  | «Main column layout geometry follows the design reference» | the shell (its token-count scenario only), then B (the line-height sentence) |
  | «Rules panel» | A |
  | «Setup sheet» | B |
  | «The summary and level buttons set their own colours» | B |
  | «Cells and buttons show a visible, unobscured focus indicator» | B, if its text changes; not A |
  | «The size buttons set their own colours and the board disables double-tap zoom» | B, if its text changes |
  | «The start button and the sheet buttons meet the touch-target floor» | B (the stale "held" word) |
  | ADDED «The panels take the shared surface paint», «The page root carries the board size» | the shell |
  | ADDED «The rules panel takes the design's size, place and paint» | A |
  | ADDED «The setup sheet takes the design's size, place and paint» | B |

  The shell is archived before A and B start, so its MODIFIED requirements are baseline text for them; "then B" means B writes its delta against the post-shell text.
- **Design freezes.** `quality/design-geometry.json` and `quality/design-paint.json` are refrozen by one stream at a time: A adds its cases first; B adds its cases after rebasing onto A's merge (if B is ready first, B waits for A, or the user decides the order). The shell adds no freeze case (its e2e reads the design build live, decision 9).
- **Shared files.** `src/ui/style.css`: A edits the `.rules` rules, `.rules-close` and the example cells; B edits `.setup-sheet`, `.level-control`, `.size-control` (inside the sheet), `.setup-start`, `.setup-close` and the reason line; neither edits the other's rules or the `:root` blocks (except B's one token). **Shell-side clarification 2:** `.setup-close` and `.settings-close` already have rules of their own; the shell adds one `background-color` line to each, and B edits the rest of `.setup-close` after it. The shell, which goes first, touches in those rules only the lines of this change: the fill, border colour and shadow of `.rules` and `.setup-sheet`, one `background-color` in `.setup-close`, the strip, and the variable rules (`.board` to `#app`). The token and pair pins: only B (after the shell). `src/ui/play-page.ts`: A only (the scroll reset) after the shell's one assignment of the root's `data-size`; B none.

## What was checked

Read for text that the four tokens or the root attribute would contradict, with no delta needed:

- «Page document order» and the DOM-contract list at the top of the spec: they pin the root's children and the board's `data-size` (line 25), not the root's attributes. Scenarios that say "no element of the root has `tabindex`", "has `role=\"grid\"`", "has an `id`" read descendants or other attributes.
- `tests/helpers/play-page.ts`: `snapshot` records cells only; `collectEverything` and `collectPageText` walk the root as well (`elementsOf` includes it) and read attribute values, and `data-size="6"` is already the board's value.
- «Effective theme on the document» and «The backdrops…»: they pin the backdrop tokens and the page colour, not the panels' fill.
- Every requirement that mentions `--color-control-bg`, `--color-given-bg` or a box shadow (grep of the spec): only the colour-scan lists of «Borders…», the cause mark's no-shadow clause, the checked-level dot and the segmented options pin them; none pins a panel's fill, border or shadow.
- «Main column layout geometry…»: its token-count scenario changes (27 to 31); its line-height sentence about the setup sheet stays for B. The variable move changes no box in it.
- FR-65's "one `:has(`" and the palette guard (`tests/play-page-palette-stylesheet.test.ts:228-233`): the hook adds none.

## Risks and mitigations

- **The hook moves a box.** The variable move touches the 8×8 phone bleed and the 4×4 cell size. Mitigation: the 32 geometry cases (default, `four`, `eight`, level 4 eight, solved, hint at six viewports) run unchanged; the new e2e compares the five variables on the board and on a panel at 4×4, 6×6 and 8×8; `scripts/visual-block.mjs --block layout` in task 6.
- **Shell and A or B conflict.** The shell edits lines of rules that A and B also edit. Mitigation: it merges first; A and B rebase; the folder lists the lines it touches.
- **The e2e is flaky against a live design server.** Mitigation: an ephemeral port, the closed server after the run, the reduced-motion setup of the other tests, an open-state assertion before every read.
- **Alpha rounding.** `#0000002e` is 0.1804, the design's 0.18. Mitigation: the 0.005 tolerance on alpha, 1 per channel on colours.
- **Dark bands.** Controls inside the panels stay `#24201b` on `#2c2620`. Not a defect (decision "Bindings"), but the review gate's vision judge may mention it; the answer is that the design does the same.
- **Safari and Firefox are untested** (NFR-7), so a shadow or a popover top-layer difference there is not caught.
- **A shot falls** (see "What should move"): the slice stops and explains it.

## Open questions

1. **ADR for the hook** (decision 2). Default: propose at the review gate; write only on the user's word.
2. **The design's mask shadow on «Закрити»** (`binarka.css` lines 543-545) is not ported. Default: not in this slice (the page's strip does the job; the settings panel's close button is not sticky); the second wave decides.
