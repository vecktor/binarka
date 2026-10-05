# Design review 2: independent `design-reviewer` (2026-10-05)

- **Reviewer:** a fresh Opus agent following [`.claude/agents/design-reviewer.md`](../../.claude/agents/design-reviewer.md), read-only, about 250k tokens, 63 tool calls, about 8 minutes. The agent file is not loaded as a named agent in this session (it was added after the session started), so a general-purpose Opus agent was told to read and follow it, as in review 1.
- **Material:** the 50 shots in `design/v0-screenshots/review-set-2/` (6 pages at 320/375/768/1440, light and dark, plus the logo at 40/56/64 px; two capture runs byte-identical, `SHA1SUMS`), the design sources, the capture harness, and `docs/design/ux-decisions.md`. The brief gave the game context, the constraints, what changed since review 1 and the author's measurements.
- **Design reviewed:** iteration 4 (agent-edited), commit `4b62294`.
- **The report below is verbatim.**

**Orchestrator's spot-checks (2026-10-05 about 21:45):**
- N3 is confirmed by eye: in `320-light-rules.png`, «Зрозуміло» sits on the bottom edge of the screen with no padding below it.
- N4 is confirmed by measurement in the built-in browser. At 375×812 the header, picker and buttons start at x = 16 on `/` and at x = 8 (picker 12) on `/eight/`. At 1440×900 they start at x = 488 and x = 480.
- #14 (crescent) was not checked by eye; my crop missed the hint box.
- N1 and N2 are computed by the reviewer; no 4×4 or 1024×768 shot exists to confirm them. The 43.7 px 6×6 cell at 1024×768 matches my own measurement (`design/README.md`, iteration 4, known limits).

---

# Design review 2: independent `design-reviewer` (iteration 4)

Material: all 50 shots in `design/v0-screenshots/review-set-2/`, compared with `review-set/` where it helped. Sources: `design/v0/app/binarka.css`, `components/binarka-page.tsx`, `app/layout.tsx`, `lib/boards.ts`, `design/tools/capture-review-set.sh`, `design/tools/frame.html` and `docs/design/ux-decisions.md`. I was read-only. Findings marked "computed" come from the CSS because no shot shows them. Contrast ratios are my estimates; `check-a11y` has not been run.

## 1. Verdict

Iteration 4 is a clear step up on both lenses:
- The warm brown-black dark theme now matches the light paper theme. Givens, the rules sheet and the dialog no longer look like steel.
- Touch targets meet 44 px for the picker and for 6×6 cells at 320.
- The buttons fit in two rows at 320, so the hint and win messages are on screen.
- The win state now promotes «Нова головоломка».
- The column is aligned with the board on tablet and desktop.

**The design is not ready to become the pixel reference yet.** Four things block it:
1. The set has no 4×4 shots. The new column rule makes the column only 312–344 px wide at 4×4 on tablet and desktop, and on desktop the header is wider than that (computed).
2. A regression from finding 8: «Зрозуміло» is clipped at 320×700.
3. The hint accent still bends into a crescent at the corners in every `*-hint` shot.
4. Switching to 8×8 on phones moves the header, picker and buttons sideways. Fixing this changes every phone `eight` shot.

The motion and hover items can land after the reference is frozen, because they do not change a settled frame.

## 2. Findings

### Review 1 findings re-checked

| # | Status | Evidence |
|---|---|---|
| 1 | fixed | `.size-picker button { min-height: 2.75rem }`. The picker is about 51 px tall in every `*-default.png`. |
| 2 | fixed | `320-*-default.png`. Cells are 45.2 px (the author's measurement; the CSS gives 45.17). |
| 3 | fixed | `320-*-eight.png`, `375-*-eight.png`. Cells are 35.3 and 42.1 px, which meets decision 13. The way it was done causes new finding N4. |
| 4 | fixed | `320-*-hint.png`, `320-*-win.png`. The buttons take two rows and the hint ends at y ≈ 695. |
| 5 | fixed | `*-win.png`. «Нова головоломка» is filled and «Підказка» is quiet, in both themes. |
| 6 | fixed | every `*-dark-*.png`. Warm brown-black, and the givens `#4d4438` read as warm tiles. |
| 7 | fixed | all 8 `*-confirm.png` show the ring on «Скасувати» (`frame.html` focuses the framed page's window). |
| 8 | partly | `320-*-rules.png`. Board rows 1–3, including the violation row, are now visible above the sheet. But «Зрозуміло» is clipped at the bottom edge with no bottom padding (see N3). |
| 9 | partly | Source only. The `:hover`/`:active` rules exist, but the cell hover ring `inset 0 0 0 2px var(--primary-soft)` is about 1.2:1 against `--surface` in both themes, so it is practically invisible. My review 1 proposal was too weak. Use `box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 60%, transparent)`. |
| 10 | fixed | `768-*` and `1440-*`. Header, picker, board, buttons and messages share one edge for 6×6 and 8×8. For 4×4, see N1. |
| 11 | fixed | every `*-default.png`. «…ставити 0 і 1. / Правила — кнопка «Правила» вгорі.» breaks cleanly at 320, 375, 768 and 1440. |
| 12 | fixed | `*-light-rules.png`, `*-light-confirm.png`. The backdrops are a warm taupe now, not grey. Dark is covered in N7. |
| 13 | fixed | `768-dark-rules.png`, `1440-dark-rules.png`, `*-dark-confirm.png`. The `#2c2620` panel has a visible `#8a7f71` edge. |
| 14 | not fixed | every `*-hint.png` (clearest in `375-light-hint.png` and `768-*-hint.png`). An inset box-shadow follows the inner border radius, so the 4 px bar still tapers into a crescent at the top and bottom. My review 1 proposal could not work. Square the bar's corners: `.message[data-message='hint'] { box-shadow: none; border-left: 4px solid var(--primary); border-radius: 0.125rem var(--radius-m) var(--radius-m) 0.125rem; }`. Alternatively, a `::before` bar with `position: absolute; left: 0; top: var(--radius-m); bottom: var(--radius-m); width: 4px; border-radius: 2px` plus `position: relative` on the message. |
| 15 | fixed | the confirm shots. The ring is `--ink` in both themes, 3 px with a 2 px offset; it is warm and clear. |

### New findings (including regressions)

"Blocker" means the issue changes pixels in the reference set or concerns a state the set does not cover. "After" means it can land after the reference is frozen.

| # | Lens | Severity | Where | What you see | Proposed change |
|---|---|---|---|---|---|
| N1 | both | high (blocker) | **Computed, no shot.** `#app { --board-width }` and, at ≥48rem, `.page-header, .size-picker, .buttons, .messages { max-width: var(--board-width) }` | For 4×4, the column becomes the 4×4 board width: 4×72 + 3×4 + 12 = **312 px at 1440×900** and 4×80 + 12 + 12 = **344 px at 768**. Measured from `1440-light-default.png`, the header needs about 336 px (logo, title, gap, «Правила»). So at desktop 4×4 «Правила» overflows the column by about 24 px; at 768 it fits with 8 px to spare. The three buttons need about 400 px, so they wrap at both widths. The hint text wraps to 4–5 lines, beyond the 3-line reserve. There is no 4×4 shot anywhere in the set, so a third of the picker's states is unreviewed. | Give the column a floor, `--column: max(var(--board-width), 26rem)`, and use it for those four `max-width`s. 6×6 and 8×8 at 768 and 1440 are unchanged, because their boards are 464–512 px wide. Optional: let 4×4 fill the column at ≥48rem with `#app:has(.board[data-size='4']) { --cell-max: 6rem }` (height-aware on desktop: `min(6rem, calc((100dvh - 28rem) / 4))`). **Add 4×4 shots at all four widths to the set.** |
| N2 | convenience | medium (blocker for 1024) | **Computed.** `.board { width: min(100%, calc(n·cell-max + (n−1)·gap + 2·pad)) }` and `--board-width`, together with the `(min-width: 64rem) and (max-height: 50rem)` rule | The width formulas leave out the board's 1 px border on a border-box element, so every cell is `--cell-max − 2/n`. The author's numbers confirm it: 71.7 instead of 72 at 1440, and 43.7 instead of 44 at 1024×768. **6×6 at 1024×768 (iPad landscape) is therefore 43.7 px, which breaks decision 13** (6×6 keeps 44). 8×8 there is about 32.7 px on a touch tablet, while decision 13's exception covers phones only. The 31.5rem reserve exists only because the 298 px column wraps the buttons. Also, `[data-solved='true']` sets a 2 px border, so the cells shrink by another 2/n px on a win. | Add `+ 2px` in both width calculations, and keep the board border 1 px when solved (draw the second pixel as `box-shadow: 0 0 0 1px var(--success)`) so the grid does not shift on a win. With N1's 26rem column the buttons stay on one row at 1024, so the 50rem-tall rule can be dropped or reset to about 28rem. That gives about 53 px cells for 6×6 and about 40 px for 8×8. **Add 1024×768 to the set.** On 8×8 at 1024×768, see Questions. |
| N3 | convenience | medium (blocker) | `320-light-rules.png`, `320-dark-rules.png` (compare `review-set/320-light-rules.png`). `.rules { max-height: 55dvh }` | A regression from finding 8. At 700 px, 55dvh is 385 px, but the content is about 403 px (24 top padding + 35 heading + 96 + 96 + 75 for the three rules + 16 + 44 button + 16 bottom padding). The sheet scrolls, «Зрозуміло» sits flush with the screen edge and about 3 px of it is cut. Raising the cap is not the answer: the sheet top is only about 5 px below the violation row. | At `max-width: 22.5rem` only: `.rules { padding-top: var(--space-4) } .mini { width: 1.5rem; height: 1.5rem; font-size: 0.875rem }`. That recovers about 20 px, so the sheet fits in 385 px with its bottom padding and the board stays visible. |
| N4 | convenience | medium (blocker) | `375-light-default.png` and `375-light-eight.png` (also the 320 pair, and `1440-*-default` against `1440-*-eight`). `#app:has(.board[data-size='8']) { --page-pad: 0.5rem }` | On phones, choosing «Поле 8×8» moves the header, the picker (the control just tapped) and the buttons outward by 8 px per side at 375 and 4 px at 320. On desktop the column grows from 464 to 481 px, so everything shifts about 8 px. The layout jumps under the thumb, and the reference differs per size. | Keep `#app` padding constant and let only the board bleed: at `max-width: 30rem`, `#app:has(.board[data-size='8']) .board-host { --bleed: calc(var(--page-pad) - 0.5rem); margin-inline: calc(-1 * var(--bleed)); width: calc(100% + 2 * var(--bleed)); }`. The cell sizes stay 35.3 and 42.1 px. Base `--cell-font` on the host width (`.board-host { container-type: inline-size }`, then `calc(100cqi / var(--n) * 0.46)`) rather than `100vw − 2·page-pad`. On desktop, optionally keep one column width for all sizes (N1's floor, or `--column` computed with n = 6). |
| N5 | convenience | medium (after) | **Source.** The Motion block: `.rules { transition: …, overlay 220ms allow-discrete, display 220ms allow-discrete }`, with `@starting-style` for entry only | Entry slides in, but nothing defines the closed state. On close, `display`/`overlay` with `allow-discrete` keep the sheet (and its backdrop) visible and frozen for 220 ms, then it disappears with no movement. Tapping «Зрозуміло» feels laggy. | Inside `@media (prefers-reduced-motion: no-preference)`, add `.rules:not(:popover-open) { transform: translateY(100%) }`, and at ≥48rem `.rules:not(:popover-open) { opacity: 0; transform: translateY(0.5rem) }`. A closed popover is `display: none`, so no settled frame changes. The other option is to drop `display` and `overlay` from the transition, so the sheet closes instantly. |
| N6 | warmth | low (blocker: changes the win shots) | `375-*-win.png`, `768-*-win.png`, `1440-*-win.png`. `.messages { justify-content: center }` | The one-line win box floats in the middle of the 3-line reserve. The gap above it is about 36 px, against 16 px above the hint. The win box looks detached from the action that caused it. | `.messages { justify-content: flex-start }` and `.message-idle { margin-block: auto }`, so the placeholder stays centred while the hint and win sit 16 px under the buttons. |
| N7 | warmth | low (blocker: changes the dark confirm shots) | `375-dark-confirm.png` against `375-dark-default.png`, `768-dark-confirm.png`. `.confirm::backdrop { rgba(45,25,10,0.5) }` | In dark, the brown backdrop over `#1a1714` lifts the page to about `#231810` instead of dimming it. The `#2c2620` dialog separates only by its border; the panel-to-page contrast is about 1.2:1. | Dark only: `.confirm::backdrop { background: rgba(8, 5, 2, 0.6) }` (and `rgba(8,5,2,0.45)` for `.rules::backdrop`). Use a token such as `--backdrop-strong`/`--backdrop-soft` so the light values stay as they are. |

## 3. Visual direction

**Palette.** Keep both themes as built. Only changes:
- `--backdrop-soft`: light `rgba(70,40,15,0.22)`, dark **`rgba(8,5,2,0.45)`**.
- `--backdrop-strong`: light `rgba(45,25,10,0.5)`, dark **`rgba(8,5,2,0.6)`** (N7).
- Cell hover ring: `color-mix(in srgb, var(--primary) 60%, transparent)` in both themes (#9). That is about 2.5:1 in light and about 4:1 in dark, enough to see, still soft.

**Type.** As built: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- Title 2rem/700, 2.5rem from 48rem.
- Buttons 1rem/500; the primary is 700.
- Messages 0.9375rem/1.45; the idle line 0.875rem, balanced.
- Cell digits: derive from the board host's width (`cqi`), not from `100vw`, so a board bleed (N4) or a column floor (N1) cannot drift the digit size.

**Components.**
- **Buttons:** keep. One filled button per state.
- **Cells:** keep all four non-colour cues. Make the hover ring visible (#9). Keep the 1 px board border on a win and draw the extra pixel as an outer shadow (N2).
- **Size picker:** keep. It must not move when tapped (N4).
- **Rules sheet:** tighter on 320 (N3), with an exit state (N5).
- **Dialog:** keep; darker backdrop in dark (N7).
- **Hint message:** a straight 4 px bar with squared left corners (#14).
- **Win message:** sits right under the buttons (N6).

**Shape.** Keep `--radius-s` 0.375rem, `-m` 0.625rem and `-l` 1rem. The one exception is the hint box's left corners, which drop to 0.125rem.

**Motion.** All of it inside `prefers-reduced-motion: no-preference`, with no `animation-fill-mode`, ending at the static style. The current CSS meets this.
- Sheet: 220 ms `cubic-bezier(.2,.8,.2,1)` both in and out (N5). From 48rem, a fade plus a 0.5rem rise, both ways.
- Hinted cell: pop from `scale(.92)` in 160 ms ease-out (keep).
- Win: a 600 ms `--success` glow ending at no shadow (keep; it reads warm in both themes).
- Buttons: 120 ms background and filter, 80 ms press (keep).
- Reduced motion: nothing moves. Note that the reference set is a reduced-motion render (see §4, harness).

## 4. Layout per screen size

- **Phone (≤ 480 px).** One column, as now: header → picker → board → buttons → messages.
  - Padding stays constant across sizes. 8×8 gets its extra width from a board bleed, not from a smaller `--page-pad` (N4).
  - At ≤ 22.5rem, keep the tighter 6×6 gutters and button padding. Tighten the rules sheet (N3).
  - 4×4 is narrower than the column here, which is fine.
  - Why: nothing the thumb just touched should move, and everything fits in 700 px.
- **Tablet (481–1023 px).**
  - From 48rem the column is `max(board width, 26rem)` (N1), so 4×4 keeps a usable header and a one-row button bar. 6×6 and 8×8 stay 512 px wide at 768, as now.
  - Rules become a centred 26rem panel.
  - Why: use the space for bigger cells without letting the smallest board shrink the controls.
- **Desktop (≥ 1024 px).**
  - The board is height-aware, as built, with the border-corrected width (N2) and the 26rem column floor. The buttons then stay on one row at 1024×768, the 31.5rem reserve can return to about 28rem, and 6×6 there gets about 53 px cells instead of 43.7 px.
  - The 1440 column (464 px) being narrower than the 768 column (512 px) is acceptable: 900 px of height is the real limit.
  - Hover states visible (#9).
- **Harness, for the parity check that will use this set:**
  - The reference is captured with `--force-prefers-reduced-motion`, so the product capture must use the same flag.
  - The confirm focus ring depends on `frame.html` focusing the framed page's window, so the product capture must do the same.
  - The pointer must stay off the page, because hover rules now exist.
  - Add 4×4 at all widths and 1024×768 to the set before freezing it.

## 5. What already works (keep)

- The warm dark theme. Givens, the rules panel and the dialog all feel like one family with the light paper theme.
- The win state: green board, filled «Нова головоломка», quiet «Підказка», a short green message.
- At 320×700 everything fits: 44 px picker, 45 px 6×6 cells, two-row buttons, the hint visible.
- The rules sheet on phones keeps the violation row in view; the mini examples reuse the hinted-cell marker.
- The ink-coloured focus ring; it is warm and has high contrast.
- The logo at 40, 56 and 64 px in both themes. The 2×2 mini board reads as «1 0 / 0 1» even at 40 px (`logo-light.png`, `logo-dark.png`).
- Determinism: two byte-identical runs, and every confirm shot shows the same focus.

## 6. Questions for the user

1. On 1024×768 (iPad landscape), 8×8 cells are at best about 40 px (about 33 px today). Should decision 13's under-44 exception for 8×8 extend to short tablet and desktop screens, or should 8×8 keep 44 px there and scroll?
2. At 4×4 on tablet and desktop, should the board grow to fill a 26rem column (about 96 px cells), or stay smaller and centred inside it?
3. Should 4×4 (all widths) and 1024×768 be added to the review set before it becomes the pixel reference? I recommend yes.
4. Should the product's parity capture force reduced motion like the design capture, or should both be captured after the motion has finished?
