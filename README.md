# Бінарка

A 0/1 grid puzzle (Takuzu rules) built with TypeScript, Vite and vanilla DOM. The engine is pure TypeScript; the page text is Ukrainian, CLI output and errors are English.

## Play the page

```bash
npm run dev
```

Opens a 6×6 puzzle in the browser: click a cell to cycle empty, 0, 1; rule violations turn red; «Підказка» fills one cell, marks it with a dashed border and an italic digit until your next move, and explains the rule; «Нова головоломка» starts another puzzle of the same size. The size buttons above the board («Поле 4×4», «Поле 6×6», «Поле 8×8») start a new puzzle of the chosen size; pressing the size already shown does nothing; the choice is not remembered, a reload starts at 6×6. «Скинути» clears your entries and keeps the same puzzle and size; once you have made moves, a new puzzle, a size change and «Скинути» first ask «Почати заново?» (focus starts on «Скасувати»); every cell is a button with a Ukrainian label, so the board can be played with Tab, Enter and Space; the «Правила» button in the header opens the three rules in a popover, closed with «Зрозуміло» or Escape; a short line under the buttons says what to do until a hint or the win message replaces it. Page text is Ukrainian and lives in one module, `src/ui/strings.ts`. The header logo, a 2×2 mini board «1 0 / 0 1» in a circle with 0/1 rays, is an inline SVG built from shapes in `src/ui/logo.ts`; the page uses no image files.

Keyboard: Tab reaches the «Правила» button, the three size buttons (a radiogroup named «Розмір поля»), every cell of the board in reading order (each cell is a button labelled with its row, column and value), then «Підказка», «Скинути» and «Нова головоломка». Enter or Space cycles the focused cell, like a click; arrow, Home and End keys are not used. A violating cell has a heavier border and is marked invalid for screen readers; hint and win messages are announced as status updates. Colours are CSS custom properties in `:root` of `src/ui/style.css`; the UI rules are in `docs/frontend-conventions.md`.

## Print a puzzle from the command line

```bash
npm run --silent cli -- --size 6 --seed 42
```

Prints N lines of N space-separated tokens: `0` or `1` for givens, `.` for an empty cell. `--size` defaults to 6 and `--seed` to 1; a seed from 0 to 2147483647 always gives the same puzzle. Every puzzle has exactly one solution and, for sizes 4, 6 and 8, can be finished with the pair, sandwich and count rules alone, so «Підказка» always has a next move while your entries are correct (FR-27). Since this change (2026-10-09) the printed givens for a seed differ from earlier versions; the solution for a seed does not. Errors go to stderr as one English sentence with exit code 1.

## Develop

```bash
npm run lint
npm run test:run
npm run build
npx openspec validate --all --strict
```

See `docs/current-state.md` for the current state and `docs/mvp-capability-plan.md` for the plan.
