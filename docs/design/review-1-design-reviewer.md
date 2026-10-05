# Design review 1: independent `design-reviewer` (2026-10-05)

- **Reviewer:** a fresh Opus agent following [`.claude/agents/design-reviewer.md`](../../.claude/agents/design-reviewer.md) (the user's designer prompt, adapted), read-only, about 204k tokens, 48 tool calls.
- **Material:** the 40 shots in `design/v0-screenshots/review-set/` (5 pages, 320/375/768/1440, light and dark), `design/v0/app/binarka.css`, `components/binarka-page.tsx`, `lib/boards.ts`, `docs/design/ux-decisions.md`.
- **Design reviewed:** iteration 3 (agent-edited), commit `faeb7cf`.
- **The report below is verbatim.**

**Orchestrator's spot-checks:**
- Finding 7 is confirmed by eye: `375-dark-confirm.png` shows no focus ring, while `1440-dark-confirm.png` does.
- Finding 1 matches the source: `binarka.css:186` has `min-height: 2.5rem`.
- The contrast ratios are the reviewer's estimates; `check-a11y` has not been run.

---

## 1. Verdict

The design is calm and mostly easy to use. The paper-cream light theme, rounded cells and orange accents give it the right "cozy logic puzzle" feel. Givens, entries, the hinted cell and violations each have a cue besides colour, and at 375×812 everything needed fits on one screen.

Three convenience problems are real:
- The size picker is shorter than 44 px.
- On phones, cells fall below 44 px at 320 (6×6) and at 8×8.
- At 320×700 the action buttons wrap to three rows, which pushes the hint and win messages below the fold.

On warmth, the dark theme is a cool blue-grey slate rather than warm. The page has no motion at all. Winning feels flat, because «Підказка» stays the main button after the puzzle is solved.

## 2. Findings

Contrast ratios below are my estimates from the token values. The real check is `check-a11y` (axe), which has not been run.

| # | Lens | Severity | Where | What you see | Proposed change |
|---|---|---|---|---|---|
| 1 | convenience | high | every `*-default.png`, `*-hint.png`, `*-win.png`. `.size-picker button { min-height: 2.5rem }` (binarka.css:186) | The size buttons are 40 CSS px tall, below the 44×44 rule. | `min-height: 2.75rem`. Keep the 3 px inner padding, so the picker becomes about 50 px tall. |
| 2 | convenience | high | `320-*-default/hint/win.png`. Board formula binarka.css:40–44, 226–234 | Computed from the source; the set has no measurement for this. At 320 the 6×6 cell is (288 − 12 pad − 20 gaps − 2 border) / 6 ≈ **42 px**, under 44. | At ≤ 22.5rem: `--page-pad: 0.75rem`. On `.board[data-size='6']`: `--board-gap: 0.1875rem; --board-pad: 0.25rem`. That gives (296 − 8 − 15 − 2) / 6 ≈ 45 px. |
| 3 | convenience | high | No 8×8 screenshot exists. `.board[data-size='8']` (binarka.css:245–249) | Computed only. 8×8 cells are about 39 px at 375 and about 32 px at 320. At 320, 44 px cannot be reached at all: 320 / 8 = 40 px before any gutter. | Make the 8×8 cells as large as possible (`--board-gap: 0.125rem`, `--board-pad: 0.1875rem`, `--page-pad: 0.5rem` for 8×8 on phones). This needs an explicit waiver for 8×8 on phones; WCAG 2.5.8 sets 24 px as the AA minimum (see Questions). |
| 4 | convenience | high | `320-light-hint.png`, `320-dark-hint.png`, `320-*-win.png`. `.buttons button { padding: 0 var(--space-4) }` (binarka.css:454), `.buttons` wrap | At 320×700 «Скинути» and «Нова головоломка» miss fitting on one line by about 4 px. The buttons take three rows, and the hint (and the win message) is cut off at the bottom of the screen. The point of decisions 2 and 12 is lost at this width. This is outside decision 12's NFR, which names only 375×812, so it is a phone-first recommendation, not a breach of that decision. | At ≤ 22.5rem: `.buttons button { padding: 0 var(--space-3) }` together with `--page-pad: 0.75rem` from #2. The row becomes about 264 px of buttons in a 296 px row, which saves about 52 px; the hint then ends about y = 660 of 700. |
| 5 | both | medium | `*-win.png`. `.buttons button[data-action='hint']` (binarka.css:465) | On a solved board, «Підказка» is still the big filled orange button and «Нова головоломка» is secondary. The natural next step gets the least emphasis. | CSS only, no DOM change: `#app:has(.board[data-solved='true']) .buttons button[data-action='new'] { background: var(--primary); color: var(--primary-ink); font-weight: 700 }` and `…[data-action='hint'] { background: var(--surface); border-color: var(--cell-border); color: var(--ink-muted); font-weight: 500 }`. `:has()` is already used at line 536. |
| 6 | warmth | medium | all `*-dark-*.png`. Dark tokens (binarka.css:48–67): `--bg #16171a`, `--surface #212328`, `--line #2b2d33`, `--given-bg #4a4e58` | Dark mode is a cool blue-grey slate. Givens look like grey steel tiles, and the rules sheet and dialog look like a coding tool. The orange accents fight the cold base. | Use warm brown-blacks (values in §3). Every changed pair stays ≥ 4.5:1 for text and ≥ 3:1 for borders. |
| 7 | process | medium | `375-dark-confirm.png` compared with `375-light-confirm.png`, `320-*-confirm.png`, `768-*-confirm.png`, `1440-*-confirm.png` | Only one of the 8 confirm shots shows no focus ring on «Скасувати»; the other 7 do. The set is meant to become the pixel reference, so this is a capture-determinism defect: file it against the harness, not the design. | Make the focus state deterministic in the capture: always focus with the keyboard, or always blur before the shot. Then recapture `375-dark-confirm`. |
| 8 | convenience | medium | `320-light-rules.png`, `320-dark-rules.png`. `.rules { max-height: 60vh }` (binarka.css:338) | At 320×700 the sheet covers board rows 3–6, including the violation row. Decision 1 ("board stays visible") is only partly met. | `max-height: 60vh; max-height: 55dvh;`. Tighten `.rules li` padding to `var(--space-2) 0` and `.rules h2` margin to `var(--space-2)`. Add `padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom))`, which does nothing unless the viewport meta gains `viewport-fit=cover` (a `<head>` change). |
| 9 | convenience | medium | 768 and 1440 shots. No `:hover` or `:active` rules anywhere in binarka.css | On desktop, nothing reacts under the pointer, and on touch nothing shows a pressed state. Cells feel inert. | `@media (hover:hover) { .cell:not(.cell-given):hover { box-shadow: inset 0 0 0 2px var(--primary-soft) } .buttons button:hover, .size-picker button:hover, .rules-button:hover { filter: brightness(0.96) } }` plus `:active { transform: translateY(1px) }`. Settled screenshots have no pointer over the page, so they do not change. |
| 10 | warmth | low | `768-*-default.png`, `1440-*-default.png`. `.page-header`, `.buttons`, `.messages` are 34rem wide; the size picker is 22rem; the board is about 26.5rem | Three different column widths. On desktop the logo and «Правила» sit far outside the board edges, so the header looks detached. | At ≥ 48rem: `.page-header, .buttons, .messages { max-width: <board width> }`. Simplest: give `#app` a `--column: 30rem` and apply it to all four. |
| 11 | warmth | low | `320-*-default.png` («0 і / 1.» break), `768-*` and `1440-*-default.png` (orphan «вгорі.»). `.message-idle` (binarka.css:527) | The placeholder line breaks badly at every width except 375. | `.message-idle { text-wrap: balance; }`. CSS only; the text stays unchanged. |
| 12 | warmth | low | `*-light-rules.png`, `*-light-confirm.png`. `.rules::backdrop rgba(20,18,14,0.3)`, `.confirm::backdrop rgba(20,18,14,0.55)` | The backdrops turn the cream page a muddy grey-taupe, which loses the warmth exactly when the user needs help. | Rules: `rgba(70,40,15,0.22)`. Confirm: `rgba(45,25,10,0.5)`. Same purpose, warmer tint. |
| 13 | warmth | low | `768-dark-rules.png`, `1440-dark-rules.png`, `*-dark-confirm.png`. `.rules { border: 1px solid var(--line) }` | In dark mode the panel (`#212328`) hardly separates from the dimmed page; the `--line` border is about 1.3:1. | Add a dark-only `--surface-raised: #2c2620` for `.rules` and `.confirm`, and give both `border-color: var(--cell-border)`. |
| 14 | warmth | low | `375-light-hint.png`, `768-*-hint.png`. `.message[data-message='hint'] { border-left: 4px }` with radius (binarka.css:540) | The 4 px left border bends around the rounded corners into a crescent. | `border-left: none; box-shadow: inset 4px 0 0 var(--primary);`. The corners stay clean. |
| 15 | warmth | low | the confirm shots. `--focus: #1d4ed8` / `#93b4ff` | The blue focus ring is the only cold colour in a warm UI. Its contrast is good (≥ 3:1). | Optional: `--focus: var(--ink)` in both themes, with a 3 px ring and 2 px offset. That is about 15:1 on `--bg`/`--surface` in light and about 14:1 in dark. Keep blue if you prefer the familiar convention. |

## 3. Visual direction

**Palette.** Keep the light theme. The dark theme becomes warm. Ratios are estimates.

| Token | Light (keep) | Dark (proposed) | Pair and estimated ratio |
|---|---|---|---|
| `--bg` | #f7f3ea | **#1a1714** | — |
| `--surface` | #fffdf8 | **#24201b** | — |
| `--surface-raised` (new, overlays) | #fffdf8 | **#2c2620** | — |
| `--ink` | #1e2126 | #f1ede4 | on bg: L ≈ 15:1, D ≈ 15:1 |
| `--ink-muted` | #565a61 | **#b8b0a4** | on bg: L ≈ 6.3, D ≈ 8.3 |
| `--line` | #e2dbcc | **#3a332b** | decorative |
| `--cell-border` | #8c8374 | **#8a7f71** | on surface: L ≈ 3.7, D ≈ 4.1 (≥ 3) |
| `--given-bg` / `--given-ink` | #ddd3be / #1e2126 | **#4d4438** / #f7f3ea | L ≈ 10.9, D ≈ 8.6 |
| `--entry-ink` | #a8400c | #f7a46a | on surface: L ≈ 6.1, D ≈ 8.1 |
| `--primary` / `--primary-ink` | #b4460d / #fffdf8 | #f39a5b / #1a1007 | L ≈ 5.4, D ≈ 8.5 |
| `--primary-soft` | #f6e3d4 | **#3d2b1e** | ink on it: D ≈ 11 |
| `--violation` / `--violation-bg` | #b3261e / #fbe4e1 | #ff8a7d / **#3f2320** | L ≈ 5.4, D ≈ 6.2 |
| `--success` / `--success-bg` | #2f6b3a / #e2efdf | #8fd19a / #1f3324 | unchanged |

**Type.** Use `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` throughout.
- Title: 2rem/700 on phones, 2.5rem from 48rem.
- Buttons: 1rem/500; the primary button is 700.
- Cells: as now (`--cell-font` 0.46× the cell). Entries 500, givens 800, hinted 700 italic.
- Messages: 0.9375rem/1.45. The idle line: 0.875rem with `text-wrap: balance`.

**Components.**
- **Buttons:** 44 px minimum height, `--radius-m`. One filled primary per state: «Підказка» while playing, «Нова головоломка» after a win (#5). «Скинути» stays an underlined quiet text button, which is a good de-emphasis of a destructive action.
- **Cells:** keep all four cues: givens are filled and heavy, entries thin and orange, the hinted cell has a dashed border and italic, a violation has a 2 px border, stripes and an underline. Add a hover ring (#9).
- **Size picker:** 44 px buttons (#1). The selected state keeps its border, fill and bold.
- **Rules sheet:** `--surface-raised` and a `--cell-border` border in dark mode, a warmer backdrop, a tighter list on 320, 55dvh.
- **Dialog:** keep the layout and the red-tinted «Так, почати». Use the warmer backdrop and a raised surface in dark.
- **Messages:** hint accent as an inset shadow (#14). Keep the win box.

**Shape.** Keep `--radius-s` 0.375rem (cells), `-m` 0.625rem (buttons, messages) and `-l` 1rem (board, sheet, dialog). They are soft and consistent.

**Motion.** None exists today. Each item below is wrapped in `@media (prefers-reduced-motion: no-preference)`, uses no `animation-fill-mode`, and ends exactly at the static style, so a settled frame is byte-identical. Under reduced motion, nothing moves.
- Rules sheet entrance: CSS only, using `@starting-style { .rules:popover-open { transform: translateY(100%) } }` + `transition: transform 220ms cubic-bezier(.2,.8,.2,1), overlay 220ms allow-discrete, display 220ms allow-discrete`. From 48rem, use a fade plus a 0.5rem rise.
- Cell value change and the hinted cell: `.cell-hinted { animation: pop 160ms ease-out }`, with `@keyframes pop { from { transform: scale(.92) } }`.
- Win: `.board[data-solved='true'] { animation: glow 600ms ease-out }`, a one-time box-shadow pulse in `--success` that ends at no shadow.
- Buttons: `transition: background-color 120ms, transform 80ms`.

## 4. Layout per screen size

- **Phone (≤ 480 px).** One column, in decision 12's order: header with «Правила» → picker → board → buttons → messages.
  - At ≤ 22.5rem (320): `--page-pad: 0.75rem`, tighter 6×6 gaps and padding (#2), narrower button padding (#4). The two secondary buttons share a row, so the hint and win message fit in 700 px.
  - 8×8 gets the minimum gutters (#3).
  - Rules open as a bottom sheet capped at 55dvh.
  - Why: thumb reach, and the board, controls and feedback on one screen.
- **Tablet (481–1023 px).**
  - From 30rem, «Підказка» shares the button row, as now.
  - From 48rem: the rules become a centred panel, as now. Raise `--cell-max` to 5rem: a 6×6 board of about 514 px fits 768×1024 with room to spare, and `768-*-default.png` shows about 40% of the screen empty below the content.
  - Align the header, buttons and messages to the board width (#10).
  - Why: use the larger screen for bigger targets instead of empty space.
- **Desktop (≥ 1024 px).**
  - Keep the single column; it respects decision 12 and stays calm.
  - Make the board height-aware: on `.board`, `--cell-max: min(4.5rem, calc((100dvh - 24rem) / var(--n)))`. At 1440×900 that gives 72 px cells for 6×6 and about 64 px for 8×8, so 8×8 still fits.
  - Add hover states (#9). Use the same column alignment as tablet.
  - Why: the mouse needs feedback, and the board should dominate without scrolling.

## 5. What already works (keep)

- The warm light palette, the cream paper background and the soft rounded cells.
- The non-colour cues: given = fill and weight 800; hinted = dashed border and italic; violation = border, stripes and underline. They are clear in both themes (`*-default`, `*-hint`).
- The header «Правила» popover with mini examples that reuse the hinted-cell marker.
- The hint text box directly under the buttons. At 375 the board, buttons and hint fit on one screen (`375-*-hint.png`).
- The confirm dialog: a calm red tint for «Так, почати», and «Скасувати» as the filled, focused default.
- The logo with the 2×2 mini board reads at 56–64 px.

## 6. Questions for the user

1. On phones, 8×8 cells cannot reach 44 px (at most about 40 px at 320, about 43 px at 375 with zero padding). Do you waive this down to WCAG 2.5.8's 24 px minimum for 8×8, and keep 44 px for 4×4 and 6×6?
2. «Вітаємо, головоломку розв'язано!» uses an ASCII apostrophe. May the fixed text switch to the Ukrainian apostrophe ʼ (U+02BC)?
3. Decision 10 asks for the logo to stay legible at 40 px, but no 40 px capture exists. Should one be added to the review set?
4. May the board grow beyond `--cell-max: 4rem` on tablet and desktop (5rem / height-aware 4.5rem)?
5. Is a warm brown-black dark theme acceptable instead of the current neutral slate?
