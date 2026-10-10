# Бінарка

A 0/1 grid puzzle (Takuzu rules) built with TypeScript, Vite and vanilla DOM. The engine is pure TypeScript; the page text is Ukrainian, CLI output and errors are English.

## Play the page

```bash
npm run dev
```

Opens a 6×6 puzzle in the browser: click a cell to cycle empty, 0, 1; rule violations turn red; «Підказка» fills one cell, marks it with a dashed border and an italic digit until your next move, and explains the rule; «Нова головоломка» starts another puzzle of the same size and level. The summary button above the board (for example «6×6 · Задачка ▾») opens a setup sheet (a bottom sheet on phones, a centred panel from 48rem) with the size buttons («Поле 4×4», «Поле 6×6», «Поле 8×8») and four levels, each with its description: «Розминка», «Задачка», «Головоломка», «Мозколамка». A press on a size or a level only marks it (the sheet stays open and the board does not change); «Почати» then starts one new puzzle with the marked size and level and closes the sheet, also when the marked choice equals the board shown; «Закрити», Escape or a click outside close the sheet and drop the marked choice, so the next opening shows the board shown again. At 4×4 only «Розминка» exists: the other three levels stay visible but unavailable (dashed, with a one-line reason) and pressing them does nothing; marking 4×4 marks «Розминка». If the generator runs out of attempts, the page tries up to three seeds before it keeps the old board (any other error keeps it at once, with no message). The choice is not remembered; a reload starts at 6×6 «Розминка». «Скинути» clears your entries and keeps the same puzzle, size and level; once you have made moves, «Нова головоломка», «Почати» and «Скинути» first ask «Почати заново?» (focus starts on «Скасувати»); every cell is a button with a Ukrainian label, so the board can be played with Tab, Enter and Space; the «Правила» button in the header opens the three rules and a second section «Складніші прийоми» (line balance, unique lines, look-ahead) in a popover, closed with «Зрозуміло» or Escape; a short line under the buttons says what to do until a hint or the win message replaces it. Page text is Ukrainian by default or English, and lives in one module, `src/ui/strings.ts` (the Ukrainian exports and an English table of the same shape). The engine writes the hint sentences in either language: `hint(board, ceiling = 1, language = 'uk')`, and the pure `hintSentence(hint, language)` rebuilds a hint's sentence in the other language (ADR-0005); the CLI stays English and unchanged. The gear button in the header, between the title and «Правила», opens a settings panel (a bottom sheet on phones, a panel under the header from 48rem) with the theme control «Тема»: «Світла», «Темна» or «Як у системі» (the default, which follows the system's light or dark setting live). A press applies the theme at once and changes nothing else. The choice is remembered in `localStorage` (`binarka.theme`, the only stored data) and applied by a small script in the page head before the first paint, so a reload never flashes the wrong theme; if storage is blocked, the choice still holds until the page is reloaded. The same panel holds the language control «Мова»: «Українська» (the default) or "English". A press re-renders every text and accessible name in place (the board, your entries, the focus and a hint on screen stay; the hint is shown again in the other language), sets `<html lang>` and the tab title ("Binarka"), and is remembered as `binarka.language`, applied before the first paint like the theme. The header logo, a 2×2 mini board «1 0 / 0 1» in a circle with 0/1 rays, is an inline SVG built from shapes in `src/ui/logo.ts`; the page uses no image files.

Keyboard: Tab reaches the gear button «Налаштування» (inside its panel, the three theme options and «Закрити»), the «Правила» button, the summary button (Enter opens the sheet; inside it, the size radiogroup «Розмір поля», the level radiogroup «Складність», «Почати» and «Закрити»), every cell of the board in reading order (each cell is a button labelled with its row, column and value), then «Підказка», «Скинути» and «Нова головоломка». Enter or Space cycles the focused cell, like a click; arrow, Home and End keys are not used. A violating cell has a heavier border and is marked invalid for screen readers; hint and win messages are announced as status updates. Colours are CSS custom properties in `:root` of `src/ui/style.css`, with a dark set in `:root[data-theme="dark"]`; the UI rules are in `docs/frontend-conventions.md`.

## Print a puzzle from the command line

```bash
npm run --silent cli -- --size 6 --seed 42 --level 3
```

Prints N lines of N space-separated tokens: `0` or `1` for givens, `.` for an empty cell. `--size` defaults to 6, `--seed` to 1 and `--level` to 1; a seed from 0 to 2147483647 always gives the same puzzle for a size and level, and the solution of a seed is the same at every level. Every puzzle has exactly one solution. The four levels need these techniques: 1 (the default, unchanged output) the pair, sandwich and count rules; 2 adds line balance; 3 adds unique lines (no two equal rows or columns); 4 adds a look-ahead of at most four forced steps. A level-L puzzle can be finished with the techniques up to L but not with those up to L−1 (FR-27, FR-82). Levels 2 to 4 need a size of 6 or more (tested and timed at 6 and 8; larger sizes are accepted but not claimed, FR-18); `--size 4 --level 2` is an error. Generation makes at most 100 attempts per puzzle; if they run out the CLI reports it as an error (FR-84, FR-86); none runs out over the tested seeds. Since this change (2026-10-09) the printed givens for a seed differ from earlier versions; the solution for a seed does not. Errors (a bad size, seed or level, an unknown option, a run-out) go to stderr as one English sentence with exit code 1. The engine's hint function takes a ceiling (`hint(board, ceiling = 1)`); the page asks with ceiling 4 at every level, so a hint may use any of the four techniques (slice DL2), and the no-rule sentence now reads «Жодне з правил зараз не підказує наступного ходу.».

## Develop

```bash
npm run lint
npm run test:run
npm run build
npx openspec validate --all --strict
```

See `docs/current-state.md` for the current state and `docs/mvp-capability-plan.md` for the plan.
