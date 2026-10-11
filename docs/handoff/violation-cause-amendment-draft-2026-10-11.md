# Requirements amendment draft: mark the cell that caused a violation (2026-10-11)

Status: **DRAFT, audited, not signed.** Written by the session `jolly-gauss-eb0bb7` on 2026-10-11 from about 07:20 (UTC+5:30). A fresh independent auditor read it from about 07:29 to 07:41; every finding is folded in (section 10). Nothing under `src/` changes before the signature.

## Basis

- **The user's request** (autonomy-log row 159, in chat on 2026-10-11 at about 00:20): mark the cell that caused a violation, so the player can tell which press broke a rule. The user chose «After block 2 (Recommended)». Row 159 records it as «a small amendment (FR-64 plus a design touch) for a cue on the last-changed cell», drafted after block 2 and signed before any code. Row 160 confirms the order.
- **Two departures from row 159, said plainly:**
  - **The scope is larger than "FR-64 plus a design touch".** A cue needs rules for its life (when it appears and goes) and a screen-reader counterpart. So this draft adds FR-120 and A-58 and amends FR-65 and FR-70 (or FR-61 and FR-68), besides FR-64.
  - **The default of CQ-3 narrows "the last-changed cell".** Under the default, the last-changed cell is marked only when it is part of the violation as the rule checker reports it. For a line with too many of one digit, that means only when it holds the excess digit. Row 159's wording, any highlighted last-changed cell, is CQ-3 A.
- **Today all cells of a broken group look the same.** `refreshHighlights` (`src/ui/play-page.ts:249-269`) gives every cell of every violation the class `cell-violation` and `aria-invalid="true"`. For the count rule it marks the whole line (6 or 8 cells). Nothing records which change made the violation.
- **The signed rules that this touches:**
  - FR-64: «a heavier border than an ordinary cell», the only cue rule for a violation.
  - The spec requirement «A violation shows a cue besides colour» (`openspec/specs/play-page/spec.md:1390`) ends with «The cue is applied through the existing class `cell-violation` (no new class)». The widths scenario (`spec.md:1396`) pins 1, 1, 2 and 2 px.
  - FR-70: «a violating cell has no suffix».
    - That clause is signed (FR-70, UX decision 8, signed 2026-10-05, row 66).
    - The user kept `aria-invalid` as the violation's non-visual counterpart in the row 78 answers («keep `aria-invalid`», about 00:14 on 2026-10-09).
    - It is pinned by the spec scenario «A violation adds no suffix» (`spec.md:1240`), by `tests/play-page-cells.test.ts:336-373`, and by the label helper `expectedCellLabel` (`tests/helpers/play-page.ts:719-728`), which six test files use.
  - FR-65: «the violation cue … at least 3:1 contrast with adjacent colours».
  - FR-61: `aria-invalid="true"` on exactly the cells with `cell-violation`.
- **The pixel reference does not move.** No NFR-14 shot shows the new cue (section 7; `docs/qa/violation-cause-amendment/hint-shot-check.txt`).
- **Contrast figures** are WCAG 2 ratios from the A-57 literals, computed with the formula of `tests/helpers/css.ts`. The scripts ran in the session scratchpad and are not committed. The auditor recomputed every figure and found none wrong.

## Ids

Checked by grep in `docs/requirements.md` and `docs/requirements-held.md` on 2026-10-11: the highest ids in use are **FR-119** and **A-57**. This draft adds **FR-120** and **A-58**. It amends **FR-64**, **FR-65** (one clause) and **FR-70** (under CQ-1 A) or **FR-61** and **FR-68** (under CQ-1 B). It renumbers nothing.

FR-34, FR-38, FR-42, FR-58, FR-101 and FR-119 are **not** amended. FR-120 owns the marker's life in full, as FR-66 does for `cell-hinted`, and names those rows.

## 1. What changes for the player

| # | Today | After the amendment (defaults) |
|---|---|---|
| P1 | A press makes three 0s side by side. The three cells are red and striped, with a 2px border. | Same, and the pressed cell also shows a corner mark. A screen reader reads the pressed cell's name with «, спричиняє порушення» (under CQ-1 A). |
| P2 | A press makes a row hold four 1s of six. All six cells of the row are highlighted. | Same, and the pressed cell, which holds the fourth 1, shows the mark. |
| P3 | The row already holds four 1s; the player puts a 0 in its last empty cell. The row stays highlighted. | No mark. That 0 is not part of the problem (CQ-3 default B). Under CQ-3 A, it is marked. |
| P4 | The row already holds four 1s; the player adds a fifth 1. | The mark is on the fifth 1: the press made the violation worse. |
| P5 | The board loads with a violation (a capture fixture, or a test fixture whose givens break a rule). | No mark. No press caused it. |
| P6 | A hint fill breaks a rule. This is reachable in play when earlier player entries are wrong. The test fixture `HINT_BREAKS` (`tests/helpers/play-page.ts:1393`) reaches it with deliberately inconsistent givens instead. | The filled cell keeps its hinted look (dashed border) and also shows the mark. Its name ends «, підказка, спричиняє порушення» (under CQ-1 A). The next press of «Підказка» refuses (FR-26) and changes nothing, so the mark stays. |
| P7 | The player presses another cell. | The mark moves to that cell if it is part of a violation after its press. Otherwise the mark is gone, **even if the earlier violation is still there**: the mark shows the last press only. At most one cell carries it. |
| P8 | The board is solved. | No mark: a solved board has no violation. The win state and the mark never show together. |

## 2. Proposed rows

### FR-120 (new)

> **FR-120 | MVP | Play page | Cause marker.**
> - **When it is set.** After every board change of one cell X, X carries the class `cell-cause` exactly when the rule checker (`findViolations`) reports, on the new board, a violation whose cells include X. A board change of one cell is a click on a non-given cell (FR-34; Enter or Space, FR-60) or a hint fill (FR-39).
> - **The checker's cells** are those of FR-35 to FR-37: for three or more equal digits, the run; for too many of one digit, only the cells of that digit; for identical lines, both lines.
> - **Otherwise no cell carries it.** At most one cell carries it at any time, and that cell always carries `cell-violation` too. A given never carries it (a given never changes). An empty cell never carries it (the checker's cells always hold a digit).
> - **When it is recomputed.** In the same handling as the highlights (FR-38).
> - **What removes it.** Every later board change that does not set it again: a click on a non-given cell (including X itself), a hint fill, «Нова головоломка», «Почати», «Скинути». An action that needs confirmation (FR-67) removes it when it is performed, not when it is requested.
> - **What does not remove it.** Any action that changes no cell:
>   - a click on a given cell (FR-33);
>   - a hint that fills no cell (FR-25, FR-26);
>   - opening or closing the rules panel, the setup sheet or the settings panel;
>   - marking a size or level, including a press of the size or level already selected (FR-73);
>   - a theme or language switch;
>   - a failed generation that keeps the board (FR-88);
>   - a cancelled confirmation (FR-67).
> - **No cell carries it after a board is shown:** at mount (including a capture board, FR-119), after a new puzzle, after «Почати», after «Скинути».
> - It is never stored (TC-12). Two mounts are independent.
> - Its visual cue is FR-64. Its screen-reader counterpart is FR-70 (CQ-1 A) or FR-61 (CQ-1 B).
>
> | verify: local-verifiable |

Under CQ-3 A, the first clause reads instead: «… X carries the class `cell-cause` exactly when X holds a digit and carries `cell-violation` after the change.»

*Why the definition needs no "before and after" comparison* (the auditor's finding 2): X's value has just changed, so no violation that contains X can be one that was already there. A run with X's new digit is a new set of cells. The count rule's cells switch to the cells of the other digit. A pair of identical lines now differs at X. The auditor checked this on 1.2 million random one-cell changes at N = 4, 6 and 8 and found no case where the two definitions disagree.

### FR-64 (amended)

> A cell in a highlighted violation shows a cue besides colour: a heavier border than an ordinary cell. **The cell that carries `cell-cause` (FR-120) shows one more cue besides colour: a filled corner mark in its top-right inner corner, in the violation border colour (A-58).** (amended 2026-10-06; numbered FR-62 until 2026-10-08) **(amended 2026-10-11: the cause cue added; violation-cause amendment, autonomy-log row <n>)**

Under CQ-2 B, the bold sentence ends «… one more cue besides colour: a 3px border, against the violation's 2px (A-58).» Under CQ-2 C, it names both.

### FR-65 (amended, one clause)

> Cell borders (against the cell, the page, the board plate and the solved board's plate), the violation cue, **the cause cue (FR-64; against the violation fill and stripe),** the hinted-cell cue and the focus indicators have at least 3:1 contrast with adjacent colours. … **(amended 2026-10-11: «the cause cue» added; violation-cause amendment, autonomy-log row <n>)**

Everything else in FR-65 is unchanged. The cause cue uses the existing token `--color-violation-border`. No token is added, so the A-57 appendix is unchanged.

### FR-70 (amended, under CQ-1 A)

> … a given cell appends «, задано»; the cell that a hint filled (FR-66) appends «, підказка»; **the cell that carries `cell-cause` (FR-120) appends «, спричиняє порушення», after «, підказка» when it has both; any other violating cell has no suffix. The suffix follows the marker: when the marker moves or goes, the cell that lost it is relabelled at once, although its value did not change (as for «, підказка»).** … The English format is "Row R, column C, V" with V "empty", "0" or "1", suffix ", given" or ", hint"**, and ", causes a violation" for the cause cell**. … **(amended 2026-10-11: the cause suffix added; was «a violating cell has no suffix»; violation-cause amendment, autonomy-log row <n>)**

The English suffix wording is proposed for the user to confirm (FR-111; the TD-Q2 precedent). FR-70's English text says ", hint", but the code and the spec say ", hinted" (`src/ui/strings.ts:151`, spec «Cell labels»). Row 133 confirmed ", hinted" as built, so FR-70's text is stale. This draft leaves that alone and flags it (CQ-6).

### FR-61 and FR-68 (amended, under CQ-1 B only)

- **FR-61 gains:** «The cell that carries `cell-cause` (FR-120) has `aria-describedby` naming one element `[data-cause-note]` with the `hidden` attribute, whose text is «Ця клітинка спричинила порушення.» ("This cell caused the violation."). No other cell has `aria-describedby`.»
  - A description is computed from a `hidden` element. So browse mode never reads the note on its own, even when no cell is marked.
- **FR-68 gains** `[data-cause-note]` in the page root, outside the board (FR-61: the board's children are exactly its cells).

## 3. New assumption

- **A-58 (2026-10-11), the cause cue.**
  - **Why "part of the violation as the checker reports it".** The pressed cell is the cause when the checker counts it in a violation after the press. This marks P1, P2 and P4 and leaves P3 unmarked. For the count rule, the checker's cells are those of the excess digit (`src/engine/rules.ts:35-44`). So a correct digit in an overfull line is never in them, although the page highlights the whole line.
  - **Why no mark at mount.** No press caused a violation that is already there. This also keeps every NFR-14 reference shot unchanged (section 7).
  - **Why one cell.** Only one cell changes per board change (a click or a hint fill), so only that cell can be the cause.
  - **Why the mark shows the last press only (P7).** It answers "what did my last press do". A violation left from earlier keeps its highlight and `aria-invalid`.
  - **The look** (CQ-2 default A).
    - A filled right triangle in the top-right inner corner, legs about a quarter of the cell's inner width, in `--color-violation-border`.
    - It sits on the violation fill and stripe, and touches the cell's own border in the same colour.
    - The digit (centred, `0.46` of the cell) and its underline do not reach the corner.
    - The violation border stays 2px, so the widths scenario keeps 1, 1, 2 and 2 px.
    - A hinted cause keeps its dashed 2px border (`.cell-violation` sets the width and colour, not the style) and gains the mark.
  - **How it is drawn.** The design touch chooses the technique.
    - Recommended: a `::after` triangle made with borders, so it survives forced-colours mode, where background images are dropped. Forced colours is not a signed requirement and is not tested; this is a note.
    - `position: relative` then goes on `.cell-cause` only, not on `.cell`.
    - jsdom does not compute pseudo-element styles, so the CSS test parses the stylesheet text.
  - **ASSUMPTION; ratified by the signature.**

## 4. Cue rules, with the reasoning

| Cue | Kept or new | Contrast (light / dark) | Reasoning |
|---|---|---|---|
| Violation: 2px `--color-violation-border` border, fill, stripe, underlined digit at 700 | Kept | Signed pairs unchanged | The group stays one visible group. |
| Cause, CQ-2 A (default): corner mark in `--color-violation-border` | New | 5.38 / 6.24 against `--color-violation-bg`; 4.33 / 4.61 against `--color-violation-stripe` | A shape that the other cells of the group lack. It reads at a glance on a full-line count violation (6 or 8 cells). The mark's corner lies inside the curve of the 2px border, which has the same colour, so the board plate does not touch it. |
| Cause, CQ-2 B: a 3px border instead of 2px | Alternative | Same token and pairs as the violation border | It uses the spec's own vocabulary (width), and jsdom measures it with `getComputedStyle`. But it is one pixel wider than its seven highlighted neighbours on an 8×8 phone board, which is hard to see at a glance. |
| Screen reader, CQ-1 A: the name suffix | New | Not applicable | The same form as «, підказка». It is read with the name every time the cell gets focus. |
| Screen reader, CQ-1 B: `aria-describedby` | Alternative | Not applicable | FR-70 stays as signed. A description is read after a pause, and some screen readers skip it in quick navigation. It needs a new element outside the board. |
| `aria-invalid="true"` | Kept on every violating cell | Not applicable | FR-61 is unchanged. |

**Adjacencies under 3:1, for acceptance (CQ-7):**
- **The hover ring.** With a mouse, the pointer is still over the cell right after the press, so this is the usual state. The hover ring (`src/ui/style.css:424-426`, a 2px inset `--color-hover-ring` inside the border) runs under the mark's two legs. It meets the mark at 2.45 light and 2.00 dark. The mark's hypotenuse stays on the fill and stripe at 4.33 or more. The hover ring is not captured (NFR-14), so the mark's shape stays readable along that edge.
- **A focused neighbour's ring.** On 8×8 boards the gaps are 2 to 3px, so a focused neighbour's 3px ring can overlap this cell's edge. The palette amendment accepted that for borders (PA-Q8). The cell's own focus ring is an outline outside the cell and never covers its mark. The 3px border of CQ-2 B does not move the ring.

## 5. Impact: spec, tests and files (the change folder, after the signature)

The change folder is `openspec/changes/add-violation-cause/`. The source of each test change is named, as the project rule asks.

**Spec deltas** (`openspec/specs/play-page/spec.md`):

| Delta | Requirement | Source |
|---|---|---|
| ADDED | «Cause marker» (FR-120). Scenarios: P1 to P8; the removing and non-removing tables (as «Hinted cell marker», `spec.md:941`), including the confirmation timing; none at mount (a fixture with `DIRTY_GIVENS`, and a capture board with a violation); two mounts independent; at most one cell, always also `cell-violation`, never a given, never empty | FR-120 |
| MODIFIED | «A violation shows a cue besides colour» (`spec.md:1390`): drop «(no new class)»; add the cause cue. Under CQ-2 B or C, the widths scenario gains a fifth cell at 3px | FR-64 |
| MODIFIED | «Cell labels» (`spec.md:1211`) and its scenario «A violation adds no suffix» (`spec.md:1240`): the cause cell gets the suffix and the other cells of the group get none; the suffix follows the marker | FR-70 (CQ-1 A) |
| MODIFIED | «Cells expose a Ukrainian name and their state» (`spec.md:1281`): the name lists the cause suffix | FR-70, FR-61 |
| MODIFIED | «Borders, cues and focus rings have enough contrast» (`spec.md:1423`): the cause cue's pairs | FR-65 |

**Tests that change** (each because a changed row demands it):

| File and line | Change | Source |
|---|---|---|
| `tests/helpers/play-page.ts:719-728` `expectedCellLabel` | Read `cell-cause` and append the suffix after «, підказка» | FR-70 (CQ-1 A) |
| `tests/play-page-helpers.test.ts:824-838` | The helper's self-test gains a cause-cell case | FR-70 |
| `tests/play-page-cells.test.ts:336-373` | (2,3), the third press, gets the suffix; (2,1) and (2,2) keep the plain label. The given-in-violation case: (3,3) gets the suffix, the givens keep «, задано». The hint-breaks case: «…, 0, підказка, спричиняє порушення» | FR-70, FR-120 |
| `tests/play-page-english-text.test.ts:140-141` | The two label regexes gain the cause suffix | FR-70 (CQ-1 A) |
| `tests/play-page-english-text.test.ts:208-210, 233-235` | The direct calls to `cellLabel` follow its new signature | FR-70 (CQ-1 A) |
| `tests/play-page-stylesheet.test.ts:489-496` | Unchanged under CQ-2 A. Under B or C, a fifth cell at 3px | FR-64 |
| `snapshot()` (`tests/helpers/play-page.ts:546-556`; 84 uses in 18 files) | It includes each cell's class list. A task sweeps every comparison that spans a press creating a violation. A comparison that changes is changed only where FR-120 demands it, and listed | FR-120 |

**New tests:**
- `tests/play-page-violation-cause.test.ts` (jsdom): P1 to P8; the two tables; mount; the language switch keeps the marker and re-renders the suffix; an oracle from `findViolations` after each press at N = 4, 6 and 8.
- A CSS test of the `.cell-cause` rule: the token, the corner, no colour literal; the stylesheet text is parsed.
- A capture-board case in `tests/play-page-capture-board.test.ts`: no `cell-cause` at mount on a board with a violation.
- An e2e probe at one size per theme that reads the mark's pixel colour in the corner.

**Files:**
- `src/ui/play-page.ts`: the marker beside `refreshHighlights`, with the relabel of the cell that loses it.
- `src/ui/strings.ts`: the suffix, in both languages.
- `src/ui/style.css`: the `.cell-cause` rule.
- `design/v0/app/binarka.css`: the same rule, by the design touch.
- `quality/design-paint.json` and `quality/design-geometry.json` record the SHA-1 of `design/v0/app/binarka.css` (`designCssSha1`). Under CQ-4 A they go stale, so they are refrozen with their scripts (`scripts/freeze-design-paint.mjs`, `scripts/freeze-design-geometry.mjs`), and the diff must show only the provenance changing.

## 6. The design touch

The rule goes into the design source, so the design stays the single source of the page's paint.

- **Default (CQ-4 A):**
  - The designer agent adds `.cell-cause` to `design/v0/app/binarka.css`.
  - It adds a review-only route `/cause/` that shows P1 and P6 in both themes at 375 and 1024.
  - A fresh design-reviewer judges the stills.
  - The NFR-14 shot list (`quality/visual-parity.config.json`, 170 shots) does not change, and the reference set `review-set-14` does not move.
- **B:** no design round. The rule goes straight into `src/ui/style.css` from A-58, and a fresh vision judge checks product stills.

## 7. Pixel cost

**Zero for NFR-14.** Evidence:

- **The capture drivers** (`scripts/check-visual-parity-adapters.mjs:138-183`) change a cell in one shot only: `hint` presses «Підказка» once on `hintBoard` without its hinted cell. Every other driver opens a panel, the sheet or the dialog, or marks a size or level.
- **The engine on `design/v0/lib/boards.json`:**
  - The `hint` fill is (3,3) = 1 at every level ceiling 1 to 4, and the board has **0 violations after it**.
  - `fixtureBoard` has 1 violation at mount, which FR-120 does not mark.
  - Output: `docs/qa/violation-cause-amendment/hint-shot-check.txt` (first run 2026-10-11 at about 07:26; the repeat at about 07:27 is recorded in the same file).

## 8. Questions for the user (defaults for "signed, use defaults", except CQ-1)

- **CQ-1, the screen-reader counterpart. No default: an explicit answer is required.** FR-70's «a violating cell has no suffix» is signed (UX decision 8). In row 78 you kept `aria-invalid` as the violation's counterpart. A visual-only cue is not offered, because it would fail WCAG 1.3.1.
  - **A:** a name suffix «, спричиняє порушення» (", causes a violation"), after «, підказка».
    - Cost: FR-70 changes.
    - The label helper, three test files and `cellLabel`'s signature change (section 5).
  - **B:** `aria-describedby` to a `hidden` note outside the board. FR-70 stays.
    - Cost: a new element in FR-68's page root, and FR-61 grows.
    - The tests that pin the page root's children and the axe sweep change.
    - Some screen readers do not read descriptions in quick navigation.
- **CQ-2, the visual cue.**
  - **Default A:** a corner mark (A-58). The shape tells it apart at a glance from a whole highlighted line.
  - **B:** a 3px border against 2px. This was your first example. It is simple and measured in jsdom, but a 1px step is hard to see.
  - **C:** both.
- **CQ-3, what counts as the cause.**
  - **Default B:** the last-changed cell, when the checker counts it in a violation (FR-120 as written). A correct digit in a line that was already broken is not marked (P3). **This narrows row 159's "last-changed cell".**
  - **A:** row 159's wording: the last-changed cell while it holds a digit and is highlighted. It is simpler, but it marks a correct 0 in an overfull row as the cause.
- **CQ-4, the design touch.**
  - **Default A:** the designer adds the rule and a review-only route, and a design-reviewer judges it. The reference does not move; the two design freezes are refrozen for their provenance.
  - **B:** no design round.
- **CQ-5, the Ukrainian wording** (under CQ-1 A).
  - **Default:** «, спричиняє порушення».
  - **Alternative:** «, порушує правило» ("breaks a rule").
- **CQ-6, the ", hint" / ", hinted" mismatch** between FR-70's English text and the code and spec.
  - **Default:** leave it for a separate fix; this change does not touch it.
  - **Alternative:** fix FR-70's text to ", hinted" in this amendment. It changes no code.
- **CQ-7, the adjacencies under 3:1** (section 4: the hover ring under the mark, 2.45 / 2.00; a focused neighbour's ring on 8×8).
  - **Default:** accept them, as PA-Q8 did for the focus ring.
  - **Alternative:** the design touch moves the mark or the ring, for example by dropping the hover ring on `.cell-cause`.

## 9. Work that follows the signature (proposed order)

1. Fold the signed text into `docs/requirements.md` (FR-120, FR-64, FR-65, FR-70 or FR-61 and FR-68, A-58), with an autonomy-log row.
2. The design touch (CQ-4), and the refreeze of the two design files.
3. The change folder `add-violation-cause`, strict-valid, read by a fresh spec-compliance-auditor.
4. Red tests first (test-engineer), confirmed red by the parent, saved as `docs/qa/add-violation-cause/red-run.txt`.
5. Implement (capability-implementer), then the battery; a fresh vision judge reviews the stills.
6. `check:visual`, to show that no shot moved (the next free run number).
7. The review gate, with your yes; then the archive.

## 10. Auditor findings: disposition

**The audit.** A fresh general-purpose subagent, read-only, audited the draft on 2026-10-11 from about 07:29 to 07:41. It recomputed all six contrast figures (none wrong) and checked every citation. It checked that FR-120 and A-58 are free. It checked that the capture drivers change a cell in the `hint` shot only. It tested FR-120's definition on 1.2 million random one-cell changes. It returned 1 major, 8 minor and 4 note findings. All are folded in.

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | CQ-3's default narrows row 159's "last-changed cell" without saying so; the scope is larger than "FR-64 plus a design touch" | Basis states both departures; CQ-3 says it; P3 names the A reading |
| 2 | minor | The "not reported before" clause is redundant (0 disagreements in 1.2M random changes) | FR-120 simplified; the reason is under FR-120; the invariant "always also `cell-violation`" added; A-58 reworded |
| 3 | minor | "Keep `aria-invalid`" is row 78, not row 79 | Basis and CQ-1 cite row 78 |
| 4 | minor | "Repeated with identical output" was not in the evidence file | The repeat is now recorded in `hint-shot-check.txt`; §7 gives both times |
| 5 | minor | The hover ring under the mark (2.45 / 2.00) was missing; the plate pair does not occur; a neighbour's ring can overlap on 8×8 | §4 lists the adjacencies; CQ-7 added; the plate pair dropped |
| 6 | minor | Tests missing: the English-text regexes and calls, the `snapshot()` uses, the design freezes' CSS SHA-1 | §5 rows added; the refreeze is in §5 and §9 |
| 7 | minor | FR-120: FR-34 for the click; the confirmation timing; two mounts independent; the already-selected size | All four are in FR-120 |
| 8 | minor | Under CQ-1 A the label must follow the marker, not only cell changes | FR-70 amendment and the «Cell labels» delta say so |
| 9 | minor | CQ-1 B's always-present note would be read in browse mode; its test costs were understated | The note has the `hidden` attribute; CQ-1 B lists the costs |
| 10 | note | `HINT_BREAKS` uses inconsistent givens | P6 says how play reaches the case |
| 11 | note | Unstated interactions: win, the hint refusal after P6, an unrelated press clears the mark | P6, P7 and P8; A-58 «Why the mark shows the last press only» |
| 12 | note | `position: relative` belongs on `.cell-cause`; jsdom does not compute pseudo-elements; forced colours is untested | A-58 «How it is drawn» |
| 13 | note | The §8 heading; the `refreshHighlights` range is 249-269 | Both fixed |
