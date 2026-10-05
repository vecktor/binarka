# Design review 3: independent `design-reviewer` (2026-10-05)

- **Reviewer:** a fresh Opus agent told to read and follow [`.claude/agents/design-reviewer.md`](../../.claude/agents/design-reviewer.md), read-only, about 327k tokens, 85 tool calls, about 7 minutes.
- **Material:** the 72 shots in `design/v0-screenshots/review-set-3/`: 7 pages (adding 4×4) at 320×700, 375×812, 768×1024, 1024×768 and 1440×900, light and dark, plus the logo. Two capture runs were byte-identical (`SHA1SUMS`). Also the design sources, `design/README.md` iteration 5, the capture harness, and reviews 1 and 2.
- **Design reviewed:** iteration 5 (agent-edited), commit `186b83a`.
- **The report below is verbatim.**

**Orchestrator's spot-check (2026-10-05 about 22:16).** R1 is confirmed by measurement in the built-in browser (each page in an iframe of the given size, scrollbars hidden):

| Window | Board | Cell | Page height |
|---|---|---|---|
| 1366×650 | 6×6 | 33.7 px | |
| 1366×650 | 4×4 | 50.5 px | |
| 1280×600 | 6×6 | 25.3 px | |
| 1280×420 | 6×6 | 2.0 px (board 14 px wide) | |
| 844×390 | 6×6 | 79.7 px | 917 px |

The other findings were not re-measured.

---

# Design review 3: independent `design-reviewer` (iteration 5)

**Material:** I looked at all 72 shots in `design/v0-screenshots/review-set-3/` and compared them across widths, themes and pages. I read `design/v0/app/binarka.css`, `components/binarka-page.tsx`, `lib/boards.ts`, `app/layout.tsx`, `design/README.md` (iteration 5), `docs/design/ux-decisions.md`, `docs/design/review-2-design-reviewer.md`, `design/tools/capture-review-set.sh` and `design/tools/frame.html`. I was read-only. Findings marked "computed" come from the CSS because no shot shows them. Pixel positions are my estimates from the shots at device scale 2.

## 1. Verdict

Iteration 5 fixes everything review 2 raised.
- **Convenience:**
  - On phones the column holds still for every board size.
  - 4×4 has proper shots, and its header and buttons fit on one line.
  - The rules sheet fits at 320 with «Зрозуміло» clear of the edge.
  - Win and hint messages sit right under the buttons.
- **Warmth:** the warm paper and brown-black themes are consistent across all 72 shots. The hint accent is now a clean straight bar, and the dark backdrops dim the page instead of lifting it.

**The design is not quite ready to become the pixel reference, but none of the 72 existing shots needs to change.** One thing blocks it, R1, and fixing it changes no pixel in the current set:
- From 64rem, the height-aware cell size has no lower limit. On a common laptop window about 650 px tall, 6×6 cells shrink to about 34 px. That breaks decision 20, which keeps 4×4 and 6×6 at 44 px everywhere.
- Below a 448 px viewport the board collapses to nothing.
- Landscape phones (48–64rem wide, about 390 px tall) are not height-aware at all.

To unblock: land the clamp in R1 and add one short desktop size (for example 1366×650) to the set. Then the reference can be frozen with the current 72 shots as they are.

## 2. Findings

### Review 2 findings re-checked

| # | Status | Evidence |
|---|---|---|
| N1 | fixed | `768-*-four.png`, `1024-*-four.png`, `1440-*-four.png`. The header, picker, buttons and idle line share one column: 512 px at 768, about 416 px at 1024 and about 466 px at 1440. «Правила» and the three buttons sit on one line, and the 4×4 board is centred (decision 21). CSS: `#app { --column: max(26rem, …6×6 width…) }`, applied as `max-width` on `.page-header, .size-picker, .buttons, .messages`. |
| N2 | fixed | `--board-width` now ends with `+ 2px`. The solved board is `border: 1px` plus `box-shadow: 0 0 0 1px var(--success)`. In `768-light-default.png` and `768-light-win.png` the cell columns are at identical x, and only the ring sits 1 px outside. The 31.5rem short-screen rule is gone. At 1024×768, 6×6 cells are about 53 px (`1024-*-default.png`), meeting 44. The 79.7 px cells at 768 are not left over from N2; see R6. |
| N3 | fixed | `320-light-rules.png`, `320-dark-rules.png`. «Зрозуміло» ends at about y = 683 of 700, with visible bottom padding. Board rows 1–3, including the violation row, stay visible above the sheet. |
| N4 | fixed | Compare `320-*-default.png` with `320-*-eight.png` (header and picker at x = 12) and `375-*-default.png` with `375-*-eight.png` (x = 16). Nothing but the board moves; only `.board-host` bleeds 4 and 8 px. On desktop one `--column` serves all sizes (`1440-*-eight.png` against `1440-*-default.png`). |
| N5 | fixed (source) | `.rules:not(:popover-open) { transform: translateY(100%) }` sits inside `prefers-reduced-motion: no-preference`. At ≥48rem it is `opacity: 0; transform: translateY(0.5rem)`. A closed popover is `display: none`, so no settled frame changes. The backdrop still pops; see R4. |
| N6 | fixed | `*-win.png` and `*-hint.png` at every width. The message starts about 16 px under the buttons (`.messages { justify-content: flex-start }`). The idle line stays centred in the reserve (`.message-idle { margin-block: auto }`, `*-default.png`). |
| N7 | fixed | `*-dark-confirm.png` and `*-dark-rules.png`. With the dark `--backdrop-strong: rgba(8,5,2,0.6)` and `--backdrop-soft: rgba(8,5,2,0.45)`, the page dims to near black. The `#2c2620` dialog and panel now stand clearly apart from it. The light values are unchanged. |
| 8 | fixed | Same evidence as N3. |
| 9 | fixed (source) | `.cell:not(.cell-given):hover { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 60%, transparent) }` under `@media (hover: hover)`. I estimate it at about 2.5:1 on `--surface` in light, visible but soft. No shot can show hover. |
| 14 | fixed | Every `*-hint.png`, clearest in `768-*-hint.png` and `1024-*-hint.png`. The 4 px left bar is straight from top to bottom with squared left corners (`border-left: 4px solid var(--primary); border-radius: 0.125rem var(--radius-m) var(--radius-m) 0.125rem`). The crescent is gone. |

### New findings

"Blocker" means the issue changes pixels in the reference set or concerns a state the set lacks. "After" means it can land after the reference is frozen.

| # | Lens | Severity | Where | What you see | Proposed change |
|---|---|---|---|---|---|
| R1 | convenience | **high (blocker: a state the set lacks; breaks decision 20)** | **Computed.** `@media (min-width: 64rem) { #app { --cell-max: min(4.5rem, calc((100dvh - 28rem) / var(--n))) } }` and the `--column` formula beside it. Tablet range: `@media (min-width: 48rem) { #app { --cell-max: 5rem } }`. | **Desktop, short windows.** Nothing stops the cell size from shrinking.<br>• A 1366×768 laptop has about a 650 px viewport in a browser. 6×6 cells are (650 − 448) / 6 ≈ 34 px, and 4×4 cells are about 50 px. At 1280×720 (about 600 px viewport) they are 25 px and 38 px. Decision 20 says 4×4 and 6×6 keep 44 px everywhere.<br>• Below a 448 px viewport the formula goes negative, `width: min(100%, negative, …)` clamps to 0, and the board disappears (only its padding remains).<br>**Landscape phones and short tablet windows** (e.g. 844×390, 932×430) are ≥48rem wide. They get fixed 80 px cells: a 6×6 board about 514 px tall on a 390 px screen, so the board, buttons and message are never on screen together.<br>The shortest size in the set, 1024×768, is above every threshold, so no shot shows any of this. | Make the size height-aware from 48rem, with a floor per board size. The page then scrolls only when even the floor does not fit, which is what decision 20 asks for.<br>`@media (min-width: 48rem) { #app { --cell-max: clamp(2.75rem, calc((100dvh - 28rem) / var(--n)), 5rem); --column: max(26rem, calc(6 * clamp(2.75rem, calc((100dvh - 28rem) / 6), 5rem) + 5 * 0.25rem + 2 * 0.375rem + 2px)); } #app:has(.board[data-size='8']) { --cell-max: clamp(1.5rem, calc((100dvh - 28rem) / 8), 5rem); } }`<br>At `min-width: 64rem`, repeat both rules with `4.5rem` as the upper bound. The `:has(…8)` rule must be repeated there, because its higher specificity would otherwise keep the 5rem cap.<br>**Pixel check:**<br>• 1024×768 still computes 72 / 53.3 / 40 px.<br>• 1440×900 still computes 72 / 72 / 54.4 px.<br>• 768×1024: 6×6 gives (1024 − 448) / 6 = 96, so the 5rem cap wins; 8×8 is still capped by the column.<br>**None of the 72 shots changes.** Add one short desktop shot (e.g. 1366×650, `default` and `eight`, both themes) to prove the floor. A landscape phone shot (844×390) is optional. |
| R2 | convenience | low (blocker only if you choose to change it; recommend accept) | `768-*-default.png` against `768-*-win.png`, and the same pair at 1024 and 1440. `.buttons button { flex: 1 1 auto }` plus the win state moving `font-weight: 700` from «Підказка» to «Нова головоломка». | Between play and win the button row reflows. At 768, «Підказка» narrows by about 5 px and «Скинути» moves about 5 px left; at 1440 the shift is about 7 px. It is not under the thumb (the player just tapped a cell), but it is a visible jiggle. | Either accept it, or at ≥30rem give the two outer buttons equal bases: `.buttons button[data-action='hint'], .buttons button[data-action='new'] { flex: 1 1 0 }`. The second option changes **both** the default and the win shots at ≥30rem, so decide before freezing (see Questions). |
| R3 | warmth | low (recommend leave) | `1024-light-rules.png`, `1024-dark-rules.png`. `.rules` at ≥48rem: `inset: 0; margin: auto`. | The centred rules panel's bottom edge lands exactly on the top edge of the button row. The panel looks docked onto «Підказка» and «Нова головоломка». This is a coincidence of centring at a 768 px height; it does not happen at 768×1024 or 1440×900. | Leave it: the backdrop separates the layers, and any change alters the 1024 rules shots. If you want air, `.rules { margin-block: 12vh auto }` from 64rem anchors the panel higher. |
| R4 | warmth | low (after) | **Source.** `.rules::backdrop`, `.confirm::backdrop` and `.confirm` have no transitions. | The sheet slides for 220 ms, but its backdrop appears and disappears in one frame. During the closing transition the backdrop stays at full strength for 220 ms and then vanishes. The confirm dialog pops in with no motion. | Inside the no-preference block: `.rules::backdrop, .confirm::backdrop { transition: background-color 220ms ease-out, overlay 220ms allow-discrete, display 220ms allow-discrete } @starting-style { .rules:popover-open::backdrop, .confirm[open]::backdrop { background-color: transparent } }`. For the dialog, use `opacity` 0→1 and `scale(0.98)`→1 over 160 ms via `@starting-style`, plus a matching closing state. Settled frames do not change. |
| R5 | convenience | low (after) | **Harness or product.** `@media (hover: hover)` rules now exist on cells and every button. | A parity capture that leaves the pointer over the page (Playwright's default mouse at 0,0 is safe; a later click is not) would paint a hover ring or `filter` on one element and fail the diff as a "design" difference. | In the parity config, move the mouse off the page (e.g. to -1,-1) before every shot, and record this beside the reduced-motion and window-focus requirements. |
| R6 | both | low (after, or accept) | **Computed.** `--page-max: 34rem` with `--page-pad: 1rem`, against `--column` at 768. | The content box is 544 − 32 = 512 px, but the 6×6 column computes to 514 px. At 768, 6×6 cells are therefore 79.7 px, not 80 (the author's table agrees), and the 8×8 cap is 512, not 514. Not visible. | Accept it, or set `--page-max: calc(var(--column, 32rem) + 2 * var(--page-pad))` from 48rem. That changes the 768 shots by 2 px, so do it now or never. |

Not a finding, but record it for the parity check: at 1024×768 every board (4×4 about 314 px, 6×6 about 354 px, 8×8 about 351 px) is narrower than the 416 px column, because review 2's 26rem floor is what keeps the header and buttons on one line. The shared board-and-column edge from finding 10 exists at 768 and 1440 but not at 1024. This is expected, not a defect.

Known limit, already acknowledged by the author: at 320×700 the hint wraps to 4 lines and the page scrolls 5–27 px. That width is outside the fit NFR (375×812).

## 3. Visual direction

**Palette.** Keep both themes exactly as built:
- Light: `--bg #f7f3ea`, `--surface #fffdf8`, `--ink #1e2126`, `--primary #b4460d`, `--primary-soft #f6e3d4`, `--given-bg #ddd3be`, `--violation #b3261e`, `--success #2f6b3a`, `--backdrop-soft rgba(70,40,15,.22)`, `--backdrop-strong rgba(45,25,10,.5)`.
- Dark: `--bg #1a1714`, `--surface #24201b`, `--surface-raised #2c2620`, `--ink #f1ede4`, `--primary #f39a5b`, `--given-bg #4d4438`, `--violation #ff8a7d`, `--success #8fd19a`, `--backdrop-soft rgba(8,5,2,.45)`, `--backdrop-strong rgba(8,5,2,.6)`.
- No token changes are proposed.

**Type.** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`, as built:
- Title 2rem/700, 2.5rem from 48rem.
- Buttons 1rem/500; the filled primary 700.
- Picker 0.9375rem/500, the selected option 700.
- Messages 0.9375rem/1.45; the idle line 0.875rem, balanced; the win line 1.0625rem/700.
- Cell digits `calc(100cqi / n × 0.46)` from the board's own width: givens 800, entries 500, hinted 700 italic.

**Components.** Keep them all:
- **Buttons:** one filled button per state.
- **Cells:** four non-colour cues (given tile and weight, entry colour, dashed italic hinted cell, striped underlined violation), and the 60% primary hover ring.
- **Size picker:** a 44 px segmented control.
- **Rules:** a bottom sheet on phones, a 26rem panel from 48rem.
- **Dialog:** «Скасувати» filled and focused.
- **Hint:** a straight 4 px bar.
- **Win:** a green box right under the buttons.
- **Change only:** the cell-size floor (R1); optionally equal button bases (R2).

**Shape.** `--radius-s` 0.375rem, `--radius-m` 0.625rem, `--radius-l` 1rem. The hint box's left corners are 0.125rem.

**Motion.** All of it under `prefers-reduced-motion: no-preference`, with no fill mode, ending exactly at the static style (verified in the CSS):
- Sheet: 220 ms `cubic-bezier(.2,.8,.2,1)`, in and out; from 48rem a fade plus a 0.5rem rise.
- Hinted cell: pops from `scale(.92)` in 160 ms ease-out.
- Win: a 600 ms glow that keeps the 1 px ring at both keyframes.
- Buttons: 120 ms background and filter, 80 ms press.
- Add later: backdrop fades and a dialog entry (R4).
- Reduced motion: nothing moves. The reference set is a reduced-motion render.

## 4. Layout per screen size

- **Phone (≤ 480 px).** One column: header → picker → board → buttons → messages.
  - Padding is constant (0.75rem at ≤ 22.5rem, 1rem above). 8×8 gets its extra width from a 4–8 px board bleed only.
  - 4×4 uses 64 px cells, centred and slightly narrower than the column.
  - Buttons take two rows: «Підказка» full width, then «Скинути» beside «Нова головоломка».
  - The rules open as a 55dvh bottom sheet that keeps the top board rows visible.
  - Why: nothing the thumb just touched moves, and at 375×812 the board, buttons and message fit on one screen for every size.
- **Tablet (481–1023 px).**
  - From 48rem: the column is `max(26rem, 6×6 width)`, the buttons sit on one row, and the rules become a centred 26rem panel.
  - Cells are about 5rem on a portrait tablet. **Change (R1):** make the cell size height-aware from 48rem with floors (2.75rem for 4×4 and 6×6, 1.5rem for 8×8), so landscape phones and short windows shrink the board instead of hiding the buttons. 768×1024 is unchanged.
  - Why: decision 16 (a bigger board on tablet) holds, without the board outgrowing a short screen.
- **Desktop (≥ 1024 px).**
  - Height-aware cells up to 4.5rem, with the same floors (R1). Below the floor the page scrolls; 4×4 and 6×6 never drop under 44 px (decision 20).
  - At 1024×768 the boards sit centred in the 416 px column; at 1440×900 the 6×6 board fills the 466 px column.
  - Why: height is the real limit on laptops; the floor protects the touch-target decision on touch laptops and iPads.
- **Harness, for the parity check:**
  - Same `--force-prefers-reduced-motion`.
  - The same `frame.html` window focus, so the confirm focus ring paints.
  - Pointer off the page (R5).
  - Same machine and fonts (system-ui).
  - Add one short desktop size, e.g. 1366×650 (R1), before freezing.

## 5. What already works (keep)

- One stable column on phones for all three sizes. The picker no longer moves when tapped.
- 4×4 on tablet and desktop: centred, roomy 72–80 px cells, and a header and button row that fit.
- The warm dark theme with dimming backdrops. The dialog and the rules panel read as warm raised cards in both themes.
- The win state: green board with a ring that does not shift the cells, a filled «Нова головоломка», a quiet «Підказка», and the message right under the buttons.
- The hint: a dashed italic cell plus a straight-bar explanation directly under the buttons.
- 320×700: 44 px picker, 45 px 6×6 cells, a rules sheet that fits with padding, and 35 px 8×8 cells (decision 13).
- The logo at 40, 56 and 64 px in both themes (`logo-light.png`, `logo-dark.png`). The 2×2 «1 0 / 0 1» reads at 40 px.
- Determinism: byte-identical double capture, and the focus ring on «Скасувати» in all ten confirm shots.

## 6. Questions for the user

1. Should the cell size get the floor in R1 (4×4 and 6×6 at least 44 px, 8×8 at least 24 px, with the page scrolling below that), and should a short desktop size such as 1366×650 join the review set? I recommend yes to both. It changes none of the 72 existing shots.
2. The button row shifts about 5–7 px between play and win on tablet and desktop (R2). Accept it, or give «Підказка» and «Нова головоломка» equal widths now, which changes the default and win shots at ≥30rem? I recommend accept.
3. Still open from review 2: should the product's parity capture also force reduced motion and keep the pointer off the page, matching the design capture? I recommend yes.
