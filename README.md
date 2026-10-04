# Бінарка

A 0/1 grid puzzle (Takuzu rules) built with TypeScript, Vite and vanilla DOM. The engine is pure TypeScript; the page text is Ukrainian, CLI output and errors are English.

## Play the page

```bash
npm run dev
```

Opens a 6×6 puzzle in the browser: click a cell to cycle empty, 0, 1; rule violations turn red; «Підказка» fills one cell and explains the rule; «Нова головоломка» starts another puzzle of the same size. The size selector above the board («Поле 4×4», «Поле 6×6», «Поле 8×8») starts a new puzzle of the chosen size; the choice is not remembered, a reload starts at 6×6. Page text is Ukrainian.

## Print a puzzle from the command line

```bash
npm run --silent cli -- --size 6 --seed 42
```

Prints N lines of N space-separated tokens: `0` or `1` for givens, `.` for an empty cell. `--size` defaults to 6 and `--seed` to 1; a seed from 0 to 2147483647 always gives the same puzzle. Errors go to stderr as one English sentence with exit code 1.

## Develop

```bash
npm run lint
npm run test:run
npm run build
npx openspec validate --all --strict
```

See `docs/current-state.md` for the current state and `docs/mvp-capability-plan.md` for the plan.
