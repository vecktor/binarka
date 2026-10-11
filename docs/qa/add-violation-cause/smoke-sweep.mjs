// Review fix round 1 (2026-10-11): run against `vite preview` of the build on 4173, with the pointer moved off the board after the press.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
const REPO = process.argv[2]; const OUT = process.argv[3];
const require = createRequire(REPO + '/package.json');
const { chromium } = require('@playwright/test');
mkdirSync(OUT, { recursive: true });
const paint = JSON.parse(readFileSync(REPO + '/quality/design-paint.json', 'utf8'));
function value(shot, zeros) {
  const g = paint.cases.find((c) => c.shot === shot).captureBoard.givens;
  const entries = g.map((row) => row.map(() => null));
  for (const [r, c] of zeros) entries[r - 1][c - 1] = 0;
  return { size: g.length, level: 1, givens: g, entries };
}
const B8 = { v: value('1024-dark-eight', [[4, 4], [4, 5]]), target: [4, 6] };
const B6 = { v: value('1024-light-default', [[3, 2], [3, 3]]), target: [3, 4] };
const browser = await chromium.launch();
async function open(b, w, h, scheme, forced = false) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1, forcedColors: forced ? 'active' : 'none' });
  await ctx.addInitScript((v) => { window.__binarkaCaptureBoard = v; }, b.v);
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('.board .cell');
  const n = b.v.size; const idx = (b.target[0] - 1) * n + (b.target[1] - 1);
  const cell = page.locator('.board .cell').nth(idx);
  const before = await cell.evaluate((el) => el.classList.contains('cell-cause'));
  await cell.click();
  await page.mouse.move(0, 0); await page.waitForTimeout(250); // review fix round 1: no hover ring in the stills
  const info = await cell.evaluate((el) => { const a = getComputedStyle(el, '::after'); const r = el.getBoundingClientRect(); return { cause: el.classList.contains('cell-cause'), label: el.getAttribute('aria-label'), leg: a.borderTopWidth, legLeft: a.borderLeftWidth, top: a.borderTopColor, left: a.borderLeftColor, fca: a.forcedColorAdjust, theme: document.documentElement.dataset.theme ?? null, cellW: r.width, rect: [r.x, r.y, r.width, r.height] }; });
  return { ctx, page, cell, before, info };
}
const rows = [];
for (const scheme of ['light', 'dark']) for (const [w, h] of [[320, 640], [375, 812], [768, 1024], [1024, 768], [1440, 900], [844, 390]]) {
  const { ctx, page, cell, before, info } = await open(B8, w, h, scheme);
  rows.push(`8x8 ${scheme} ${w}x${h}: cause before ${before}, after ${info.cause}; ::after border-top-width ${info.leg} (cell ${info.cellW.toFixed(2)} px); label «${info.label}»`);
  if (w === 320 || w === 375) await page.locator('.board').screenshot({ path: `${OUT}/8x8-${scheme}-${w}.png` });
  await ctx.close();
}
for (const scheme of ['light', 'dark']) for (const [w, h] of [[1024, 768], [375, 812]]) {
  const { ctx, page, info } = await open(B6, w, h, scheme);
  rows.push(`6x6 ${scheme} ${w}x${h}: cause ${info.cause}; leg ${info.leg}; top colour ${info.top}`);
  await page.locator('.board').screenshot({ path: `${OUT}/6x6-${scheme}-${w}.png` });
  // hover over the marked cell
  if (w === 1024) { await page.mouse.move(info.rect[0] + info.rect[2] / 2, info.rect[1] + info.rect[3] / 2); await page.waitForTimeout(200); await page.screenshot({ path: `${OUT}/6x6-${scheme}-1024-hover.png`, clip: { x: info.rect[0] - 8, y: info.rect[1] - 8, width: info.rect[2] + 16, height: info.rect[3] + 16 } }); }
  await ctx.close();
}
// focus ring: Tab onto the marked cell (keyboard), 6x6 light 1024
{
  const { ctx, page, cell, info } = await open(B6, 1024, 768, 'light');
  await cell.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  rows.push(`focus: active element «${focused}»`);
  await page.screenshot({ path: `${OUT}/6x6-light-1024-focus.png`, clip: { x: info.rect[0] - 8, y: info.rect[1] - 8, width: info.rect[2] + 16, height: info.rect[3] + 16 } });
  await ctx.close();
}
// forced colours
{
  const { ctx, page, info } = await open(B6, 1024, 768, 'light', true);
  const fc = await page.evaluate(() => matchMedia('(forced-colors: active)').matches);
  rows.push(`forced colours active ${fc}: ::after forced-color-adjust ${info.fca}, top ${info.top}, left ${info.left}, leg ${info.leg}`);
  const [x, y, cw, ch] = info.rect; const leg = parseFloat(info.leg);
  const shot = await page.screenshot({ clip: { x: Math.floor(x), y: Math.floor(y), width: Math.ceil(cw), height: Math.ceil(ch) } });
  const png = require('pngjs');
  await page.screenshot({ path: `${OUT}/6x6-forced-colors-1024.png`, clip: { x: x - 8, y: y - 8, width: cw + 16, height: ch + 16 } });
  rows.push(`forced colours still written (inspect: the mark must be a triangle)`);
  await ctx.close();
}
await browser.close();
console.log(rows.join('\n'));
