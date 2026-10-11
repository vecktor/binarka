// Smoke harness of add-violation-cause (tasks.md 3.6 (b); used by the manual smoke test, tasks.md 7.1, steps 4 to 7).
//
// Opens the BUILT page in a headed Chromium with one board of docs/qa/add-violation-cause/smoke-boards.json shown at mount: an init script sets
// `window.__binarkaCaptureBoard` (FR-119) before the page runs, then the page is paused (Playwright Inspector) so the tester can follow the recipe
// printed in the terminal. It does not start a server: run `npm run build && npx vite preview` first (port 4173). It starts no `vite` process, so it
// cannot leave an orphaned preview behind; stop the preview yourself when done and check `lsof -nP -iTCP:4173 -sTCP:LISTEN`.
//
// Usage:
//   node docs/qa/add-violation-cause/smoke-harness.mjs <p2|p6|p8|mount> [--check]
//   BINARKA_URL=http://localhost:4173/ (default) selects the preview URL.
//   --check: headless, no pause; loads the board, prints the board read from the DOM and whether it equals the capture value, and exits non-zero
//            when the page did not take the board (a harness self-check, not a smoke result).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const boards = JSON.parse(readFileSync(join(here, 'smoke-boards.json'), 'utf8'));
const name = process.argv[2];
const check = process.argv.includes('--check');
const url = process.env.BINARKA_URL ?? 'http://localhost:4173/';

if (name === undefined || name.startsWith('$') || boards[name] === undefined) {
  console.error(`usage: node docs/qa/add-violation-cause/smoke-harness.mjs <${Object.keys(boards).filter((k) => !k.startsWith('$')).join('|')}> [--check]`);
  process.exit(2);
}
const entry = boards[name];
const value = entry.captureBoard;

console.log(`board ${name}: ${entry.purpose}`);
console.log(`source: ${entry.source}`);
for (const [i, step] of entry.recipe.entries()) {
  const what = step.cell !== undefined ? `click (${step.cell.join(',')}) x${step.clicks}` : step.press !== undefined ? `press «${step.press}»` : 'look';
  console.log(`  ${i + 1}. ${what}: ${step.then ?? step.look}`);
}

const browser = await chromium.launch({ headless: check });
try {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, colorScheme: 'light' });
  const page = await context.newPage();
  await page.addInitScript((board) => {
    window.__binarkaCaptureBoard = board;
  }, value);
  try {
    await page.goto(url);
  } catch (error) {
    console.error(`could not open ${url}: is \`npx vite preview\` running? (${error instanceof Error ? error.message : String(error)})`);
    process.exitCode = 1;
    throw error;
  }
  await page.locator('[data-board] [data-cell]').first().waitFor();
  const shown = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('[data-board] [data-cell]'));
    const n = Math.round(Math.sqrt(cells.length));
    return Array.from({ length: n }, (_, r) => cells.slice(r * n, r * n + n).map((el) => (el.textContent === '' ? null : Number(el.textContent))));
  });
  const expected = value.givens.map((row, r) => row.map((cell, c) => cell ?? value.entries[r][c]));
  const same = JSON.stringify(shown) === JSON.stringify(expected);
  console.log(`the page shows the capture board: ${same ? 'yes' : 'NO'}`);
  if (check) {
    for (const row of shown) console.log(`  ${row.map((cell) => (cell === null ? '.' : String(cell))).join(' ')}`);
    if (!same) process.exitCode = 1;
  } else {
    await page.pause();
  }
} finally {
  await browser.close();
}
