# v0 prompt: Бінарка visual design

Paste everything below the line into v0. Notes for us (not for v0) are at the end.

---

Design the visual look of **Бінарка**, a small Takuzu (binary puzzle) web game. The game logic already exists in vanilla TypeScript; I only need the **visual design**, which will later be ported as plain CSS onto my existing HTML. So the structure, class names, data attributes and texts below are fixed: style them, do not rename or reorder them.

## Output I need

1. A **static, deterministic** page (no randomness, no animations, no timers, no data fetching), deployable as a public Vercel preview.
2. Plain **HTML structure + one CSS file** (CSS custom properties for all colours, spacing and radii). If you use React, render exactly the HTML below with `className` and the same data attributes; **no Tailwind utility classes on the elements**: put every style in the CSS file keyed on the existing classes and data attributes, so I can copy the CSS as is.
3. Light and dark themes via `@media (prefers-color-scheme: dark)` on the same custom properties.
4. Five routes (or five clearly separated pages), each a fixed state:
   - `/`: the default state (board below), rules collapsed.
   - `/rules`: the same as `/`, with the rules `<details>` open.
   - `/hint`: the hint state (board below), with the hinted cell marked and the hint message shown.
   - `/win`: a fully solved 6×6 board with the win message.
   - `/confirm`: the same as `/`, with the confirmation dialog open (it appears when the player starts a new puzzle, changes the size or resets while the board has their entries).

## Fixed page structure (keep this DOM order, classes and attributes)

Order on the page, top to bottom: title with logo → size picker → board → message area → buttons → rules (collapsed).

```html
<html lang="uk">
<title>Бінарка</title>
<div id="app">
  <h1><!-- inline SVG logo, see below -->Бінарка</h1>

  <div class="size-picker" data-control="size" role="radiogroup" aria-label="Розмір поля">
    <button type="button" role="radio" aria-checked="false" data-size-option="4">Поле 4×4</button>
    <button type="button" role="radio" aria-checked="true" data-size-option="6">Поле 6×6</button>
    <button type="button" role="radio" aria-checked="false" data-size-option="8">Поле 8×8</button>
  </div>

  <div class="board-host">
    <div class="board" data-board data-size="6">
      <!-- 36 cells, row-major; every cell is a real button (keyboard and screen reader) -->
      <button type="button" class="cell" data-cell data-row="1" data-col="1" data-given="false" aria-label="Рядок 1, стовпець 1, порожньо"></button>
      <button type="button" class="cell cell-given" data-cell data-row="1" data-col="2" data-given="true" aria-disabled="true" aria-label="Рядок 1, стовпець 2, 0, задано">0</button>
      <!-- … -->
    </div>
  </div>

  <div class="messages" aria-live="polite">
    <p class="message" data-message="hint"></p>
    <p class="message message-win" data-message="win"></p>
  </div>

  <div class="buttons">
    <button type="button" data-action="hint">Підказка</button>
    <button type="button" data-action="reset">Скинути</button>
    <button type="button" data-action="new">Нова головоломка</button>
  </div>

  <details class="rules" data-section="rules">
    <summary>Правила</summary>
    <ul>
      <li>Не більше двох однакових цифр поспіль у рядку чи стовпці.</li>
      <li>У кожному рядку та стовпці порівну нулів і одиниць.</li>
      <li>Усі рядки різні, і всі стовпці різні.</li>
    </ul>
  </details>

  <dialog class="confirm" data-dialog="confirm">
    <p>Почати заново? Ваші ходи на цьому полі буде втрачено.</p>
    <div class="confirm-buttons">
      <button type="button" data-confirm="yes">Так, почати</button>
      <button type="button" data-confirm="no">Скасувати</button>
    </div>
  </dialog>
</div>
```

Cell `aria-label` pattern: «Рядок R, стовпець C, <порожньо | 0 | 1>», plus «, задано» for givens and «, підказка» for the hinted cell.

## The fixed 6×6 board for `/`, `/rules` and `/confirm` (use exactly this)

`G` = given (class `cell-given`, `data-given="true"`), `P` = player entry (`data-given="false"`), `.` = empty player cell.

| Row | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| 1 | . | G0 | . | . | G1 | . |
| 2 | P1 | . | . | G0 | . | . |
| 3 | . | P0 | P0 | P0 | . | G1 |
| 4 | G1 | . | . | . | . | . |
| 5 | . | . | G0 | . | . | P1 |
| 6 | . | G1 | . | . | P0 | . |

In row 3, the three cells at columns 2, 3 and 4 also carry the class **`cell-violation`** (three equal digits in a row break a rule). No other cell is highlighted. Both messages are empty.

## The board for `/hint`

The same board, except row 3 is `P1 P0 P0 . . G1`: column 4 is empty, and the cell at row 3, column 1 holds 1 filled by the hint. That cell carries the class **`cell-hinted`** (it must look different from both givens and the player's own entries, without colour alone). There is no `cell-violation`. `[data-message="hint"]` contains «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.»

## The board for `/win`

A full valid 6×6 grid (any valid Takuzu solution), no `cell-violation`, and `[data-message="win"]` contains «Вітаємо, головоломку розв'язано!» (ASCII apostrophe). Make the solved state feel finished: for example a calm border or background change on `.board` via a `data-solved="true"` attribute. No animation.

## Logo (the one allowed graphic)

Add a small logo as **inline SVG** inside the `<h1>`, before the word «Бінарка» (keep the text in the `<h1>`, and give the SVG `aria-hidden="true"`). The idea is a playful nod to a sun-shaped emblem: a filled circle with the word **БІНАРКА** (Cyrillic, bold condensed capitals) inside it, surrounded by a ring of rays. Make it our own:

- **The rays are the puzzle's digits.** Alternate small "0" rings and short "1" bars around the circle, like a sunburst built from binary digits.
- **Do not copy any existing logo:** use its own proportions, ray count and colour taken from our palette (the primary colour, with the light/dark variants via the same CSS custom properties).
- Inline SVG only, no external file. Simple geometry and no gradients, so it renders identically every time. Around 48–64 px at 375 px wide; it must not push the board below the fold.

## Visual requirements

- **Mobile first.** It must look right at 320, 375, 390, 768 and 1440 px wide, with no horizontal scrolling at any width. The board stays square, and cells are at least 44 px at 375 px wide for 6×6. The same CSS must also fit 4×4 and 8×8 boards: the board reads `data-size`, and cell size scales from it with a CSS variable.
- **The board, the message area and the action buttons must fit on one phone screen (375×812) at 6×6**, so the hint sentence is visible right after pressing «Підказка». The message area reserves room for two lines, so the page does not jump when a message appears.
- **Cells show the digits 0 and 1 as text.** Never use colour alone to mean 0 or 1. Givens, the player's entries and the hinted cell must each look different by more than colour (weight, background, outline). Empty cells look clickable; givens look fixed.
- **`.cell-violation`** must be obvious in both themes without relying on red/green alone. Add a second cue, such as an outline or pattern.
- **Size picker:** a segmented control of three buttons, one tap to switch, the current size clearly selected (`aria-checked="true"`).
- **Buttons:** «Підказка» is the primary action, «Нова головоломка» secondary and «Скинути» the least prominent. They wrap cleanly on narrow screens.
- **Rules:** a `<details>` collapsed by default at the bottom, with a clear «Правила» summary and a disclosure marker. Its open state is left-aligned, readable and calm.
- **Confirmation dialog:** a native `<dialog>`, centred, with a dimmed backdrop. «Скасувати» is the safe default; «Так, почати» is clearly the destructive choice.
- **WCAG 2.1 AA:** text contrast ≥ 4.5:1, UI components ≥ 3:1, visible `:focus-visible` styles on cells, the size picker, buttons, the summary and the dialog, in both themes.
- **No images, icons, illustrations or external assets** apart from the inline SVG logo above. Everything else is CSS. One Google font at most, loaded with `font-display: swap`; system fonts are fine.
- **Ukrainian text exactly as given:** do not translate, shorten or add text. No English anywhere on the page.
- **Mood:** friendly, minimal, puzzle-like. Think of a calm paper logic puzzle, not a casino game.

## Do not

- Change, add or remove elements, classes, data attributes or texts.
- Add animations, transitions, hover-only information, tooltips, a header or footer, or a theme toggle (the system theme is enough). The confirmation `<dialog>` is the only overlay.
- Use randomness, the current date or anything else that changes between page loads.

---

## Notes for us (not for v0)

- **Why it's so strict:** the design becomes the `referenceUrl` for `scripts/check-visual-fidelity.mjs` (pixel diff, page-height pre-gate ≤ 2%). Our page will be compared in the same state, so the reference must be deterministic and use our DOM. Our page needs a matching fixture route that mounts this board through `mountPlayPage(root, { generate })` and fills the player cells with clicks.
- **After v0, before signing a design NFR:** approve Playwright, `pixelmatch` and `pngjs`; write `quality/visual-parity.config.json` (referenceUrl = the v0 preview URL; breakpoints 320, 375, 768, 1440); see `npm run check:visual` fail against today's page. That is the declared-method-needs-mechanism rule.
- **The logo needs a requirements change:** TC-14 currently puts "images and graphics assets" out of scope. Adding the inline SVG logo is an amendment you sign (new FR for the logo, TC-14 narrowed), done in the same restyle slice. It also changes the `<h1>` DOM, so `expectPageStructure` and the page-text tests (no Latin letters in page text) need to account for the SVG: give it `aria-hidden`, and keep the logo word Cyrillic («БІНАРКА»), as the prompt asks. A Latin "BINARKA" in SVG `<text>` would land in the `<h1>` text content and fail the existing no-Latin-letters page-text test (NFR-5); if you want the Latin spelling, it has to be drawn as SVG paths, not text.
- **Brand caution:** Bonarka is a real shopping centre's trademark, and its sun emblem is its logo. A recognisable copy (same shape, ray pattern and blue) could read as imitating their brand, so the prompt asks for an homage built from 0s and 1s in our own colours, not a lookalike. Keep it that way if you iterate in v0.
- **This structure is the target of next week's UX decisions** (user, 2026-10-05; see `docs/design/ux-decisions.md`). Today's page still has the old structure (select, rules section between board and buttons, messages at the end, `div` cells), so the design is ahead of the code until those changes are signed and built.
- **The `/hint` board, checked with our engine:** no violations, and `hint()` returns exactly row 3, column 1, value 1, with the pair sentence above.
- **The fixed board, checked with our engine on 2026-10-05:**
  - `findViolations` on the givens alone returns none.
  - On the full board it returns exactly one violation: three in a row, row 3, columns 2 to 4 (the intended highlight).
  - `countSolutions(givens)` stops at 2, so the board is a visual fixture only, not a valid puzzle for the game. That's fine for the design; never use it in the generator tests.
