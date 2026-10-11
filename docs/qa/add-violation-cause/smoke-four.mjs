// Review fix round 1 (2026-10-11): run against `vite preview` of the build on 4173, with the pointer moved off the board after the press.
import { createRequire } from 'node:module';
const REPO = process.argv[2], OUT = process.argv[3];
const require = createRequire(REPO + '/package.json');
const { chromium } = require('@playwright/test');
const givens = [[1,null,null,null],[1,null,1,null],[null,1,null,1],[null,1,null,null]];
const b = await chromium.launch();
for (const [scheme, w, h] of [['light', 375, 812], ['dark', 1024, 768]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  await ctx.addInitScript((v) => { window.__binarkaCaptureBoard = v; }, { size: 4, level: 1, givens, entries: givens.map((r) => r.map(() => null)) });
  const page = await ctx.newPage(); await page.goto('http://localhost:4173/'); await page.waitForSelector('.board .cell');
  const cell = page.locator('.board .cell').nth(8);
  await cell.click(); const mid = await cell.evaluate((e) => e.classList.contains('cell-cause'));
  await cell.click();
  await page.mouse.move(0, 0); await page.waitForTimeout(250); // review fix round 1: no hover ring in the stills
  const r = await cell.evaluate((e) => ({ cause: e.classList.contains('cell-cause'), label: e.getAttribute('aria-label'), leg: getComputedStyle(e, '::after').borderTopWidth, n: document.querySelectorAll('.board .cell-cause').length }));
  console.log(`4x4 ${scheme} ${w}x${h}: after one press (a 0) cause ${mid}; after the second (a 1, column 1 reads 1 1 1) ${JSON.stringify(r)}`);
  await page.locator('.board').screenshot({ path: `${OUT}/4x4-${scheme}-${w}.png` });
  await ctx.close();
}
await b.close();
