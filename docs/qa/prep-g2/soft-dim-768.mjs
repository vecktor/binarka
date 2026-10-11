// Scratch: explain the 768 soft-dim drops (run 7 -> run 8). Run from the worktree root:
//   node docs/qa/prep-g2/soft-dim-768.mjs <out-dir>   (needs npm run build; takes /tmp/binarka-capture.lock first)
// Captures the product shot with the gate's own adapter, reads the product surface rect, then rebuilds the run-7 look of
// every pixel outside the surface (old dark dim = --color-page at opacity 0.6 over the underlying pixel) by inverting the
// current soft composite (rgba(8,5,2,0.45)), and scores both against the frozen reference with the checker's pixelmatch call.
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { capture, captureBoardFor, close } from '../../../scripts/check-visual-parity-adapters.mjs';

const OUT = process.argv[2];
const URL = 'http://localhost:4174/';
const PAGE = [0x1a, 0x17, 0x14];
const SOFT = [8, 5, 2];
const A = 0x73 / 255;

function yiq(r, g, b) {
  return [r * 0.29889531 + g * 0.58662247 + b * 0.11448223, r * 0.59597799 - g * 0.2741761 - b * 0.32180189, r * 0.21147017 - g * 0.52261711 + b * 0.31114694];
}
function delta(p, q) {
  const [y1, i1, q1] = yiq(...p);
  const [y2, i2, q2] = yiq(...q);
  return 0.5053 * (y1 - y2) ** 2 + 0.299 * (i1 - i2) ** 2 + 0.1957 * (q1 - q2) ** 2;
}
const hex = (p) => '#' + p.map((v) => v.toString(16).padStart(2, '0')).join('');

for (const [name, state, surface, opener] of [
  ['768-dark-rules', 'rules', '[data-section="rules"]', '[data-action="rules"]'],
  ['768-dark-setup-four', 'setup-four', '[data-section="setup"]', '[data-action="setup"]'],
]) {
  const local = await capture({ role: 'local', url: URL, name, width: 768, height: 1024, settleMs: 300 });
  writeFileSync(`${OUT}/${name}-product.png`, local.png);
  // the surface rect, in CSS px, the same way the adapter opens it
  const browser = await chromium.launch({ headless: true, args: ['--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=768,1024'] });
  const page = await (await browser.newContext({ viewport: null, colorScheme: 'dark', reducedMotion: 'reduce' })).newPage();
  const board = captureBoardFor(state);
  await page.addInitScript((b) => { if (b) window.__binarkaCaptureBoard = b; }, board);
  await page.goto(URL);
  await page.locator(opener).click();
  await page.locator(`${surface}:popover-open`).waitFor();
  const rect = await page.locator(surface).evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await browser.close();

  const ref = PNG.sync.read(readFileSync(`design/v0-screenshots/review-set-14/${name}.png`));
  const now = PNG.sync.read(local.png);
  const old = PNG.sync.read(local.png);
  const inSurface = (x, y) => x / 2 >= rect.x && x / 2 < rect.x + rect.w && y / 2 >= rect.y && y / 2 < rect.y + rect.h;
  for (let y = 0; y < now.height; y++) for (let x = 0; x < now.width; x++) {
    if (inSurface(x, y)) continue;
    const i = (y * now.width + x) * 4;
    for (let c = 0; c < 3; c++) {
      const under = Math.min(255, Math.max(0, (now.data[i + c] - A * SOFT[c]) / (1 - A)));
      old.data[i + c] = Math.round(0.6 * PAGE[c] + 0.4 * under);
    }
  }
  const total = ref.width * ref.height;
  const mNow = pixelmatch(ref.data, now.data, null, ref.width, ref.height, { threshold: 0.1 });
  const mOld = pixelmatch(ref.data, old.data, null, ref.width, ref.height, { threshold: 0.1 });
  // classify the pixels that pass with the old dim and fail with the new one, by (reference colour, product colour now)
  const LIM = 35215 * 0.01;
  const pairs = new Map();
  let newlyFailing = 0, insideFail = 0, rowsMin = 1e9, rowsMax = 0;
  for (let y = 0; y < now.height; y++) for (let x = 0; x < now.width; x++) {
    const i = (y * now.width + x) * 4;
    const r = [ref.data[i], ref.data[i + 1], ref.data[i + 2]];
    const n = [now.data[i], now.data[i + 1], now.data[i + 2]];
    const o = [old.data[i], old.data[i + 1], old.data[i + 2]];
    if (inSurface(x, y)) { if (delta(r, n) > LIM) insideFail++; continue; }
    if (delta(r, n) > LIM && delta(r, o) <= LIM) {
      newlyFailing++;
      rowsMin = Math.min(rowsMin, y / 2); rowsMax = Math.max(rowsMax, y / 2);
      const k = `ref ${hex(r)} | now ${hex(n)} | old ${hex(o)}`;
      pairs.set(k, (pairs.get(k) ?? 0) + 1);
    }
  }
  const top = [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log(`== ${name}`);
  console.log(`surface rect (CSS px): x ${rect.x.toFixed(1)} y ${rect.y.toFixed(1)} w ${rect.w.toFixed(1)} h ${rect.h.toFixed(1)}`);
  console.log(`score now ${(1 - mNow / total).toFixed(4)} (gate run 9 says ${name === '768-dark-rules' ? '0.8882' : '0.8674'})`);
  console.log(`score with the old dim rebuilt outside the surface ${(1 - mOld / total).toFixed(4)} (gate run 7 said ${name === '768-dark-rules' ? '0.9314' : '0.9004'})`);
  console.log(`pixels that pass with the old dim and fail with the new one (raw YIQ, no AA rule): ${newlyFailing}, CSS rows ${rowsMin} to ${rowsMax}`);
  console.log(`pixels inside the product surface that fail (raw YIQ): ${insideFail}`);
  for (const [k, v] of top) console.log(`  ${v}\t${k}`);
}
await close();
