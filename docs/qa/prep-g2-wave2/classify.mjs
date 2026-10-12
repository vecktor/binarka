// Wave-2 prep session, 2026-10-12: explain the settings and confirm shots of run 12 with the gate's OWN per-pixel verdict
// (pixelmatch 8, threshold 0.1, as scripts/check-visual-fidelity.mjs) and the boxes of the surfaces on both sides.
//   product pixels   - the locked adapter's own capture() (scripts/check-visual-parity-adapters.mjs), so the score must equal run 12;
//   product boxes    - a second page driven the same way (the adapter's drivers are not exported; the same clicks and focus);
//   design boxes     - the design build (design/v0/out) served locally, its review route (/settings/, /confirm/, ...).
// Diff pixels are bucketed by the design element box they fall in (first match in ELEMENTS order), else "outside", and by the
// (reference colour | product colour) pair. Sampled: the 36 settings and confirm shots of review-set-14; never continuum.
// Run: npm run build && BINARKA_PORT_BASE=6273 node docs/qa/prep-g2-wave2/classify.mjs [--shots a,b] [--save <dir>]
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { capturePorts } from '../../../scripts/capture-ports.mjs';
import { capture, captureBoardFor, close as closeAdapter, parseShot } from '../../../scripts/check-visual-parity-adapters.mjs';

const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const DPR = config.deviceScaleFactor ?? 2;
const { design: DESIGN_PORT } = capturePorts();
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const wanted = arg('--shots')?.split(',');
const saveDir = arg('--save');
if (saveDir) mkdirSync(saveDir, { recursive: true });

const ELEMENTS = {
  settings: [
    ['settings-close', '[data-section="settings"] .settings-close'],
    ['theme-checked', '[data-control="theme"] [aria-checked="true"]'],
    ['theme-control', '[data-control="theme"]'],
    ['language-checked', '[data-control="language"] [aria-checked="true"]'],
    ['language-control', '[data-control="language"]'],
    ['label-theme', '[data-section="settings"] .settings-label'],
    ['panel', '[data-section="settings"]'],
  ],
  confirm: [
    ['yes', '[data-confirm="yes"]'],
    ['no', '[data-confirm="no"]'],
    ['text', 'dialog[data-dialog="confirm"] p'],
    ['dialog', 'dialog[data-dialog="confirm"]'],
  ],
};
const surfaceOf = (state) => (state === 'confirm' ? 'confirm' : 'settings');
const shots = config.breakpoints.filter((b) => {
  if (wanted) return wanted.includes(b.name);
  const { state } = parseShot(b.name);
  return state === 'confirm' || state.startsWith('settings');
});

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.json': 'application/json', '.woff2': 'font/woff2' };
function serveDesign() {
  const rootAbs = resolve('design/v0/out');
  if (!existsSync(join(rootAbs, 'index.html'))) throw new Error('design/v0/out is missing: build the design first');
  const server = createServer((req, res) => {
    let p = resolve(rootAbs, `.${decodeURIComponent(new URL(req.url, 'http://x').pathname)}`);
    if (p !== rootAbs && !p.startsWith(rootAbs + sep)) return res.writeHead(403).end();
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
  });
  return new Promise((r) => server.listen(DESIGN_PORT, '127.0.0.1', () => r(server)));
}

async function newPage(shot) {
  const browser = await chromium.launch({ headless: true, args: ['--hide-scrollbars', `--force-device-scale-factor=${DPR}`, `--window-size=${shot.width},${shot.height}`] });
  const ctx = await browser.newContext({ viewport: null, colorScheme: parseShot(shot.name).scheme, reducedMotion: 'reduce' });
  return { browser, page: await ctx.newPage() };
}

const measure = (page, els) =>
  page.evaluate((els) => Object.fromEntries(els.map(([k, s]) => {
    const el = document.querySelector(s);
    if (!el) return [k, null];
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return [k, { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, color: cs.color, bg: cs.backgroundColor, bc: cs.borderTopColor, bw: cs.borderTopWidth, br: cs.borderTopLeftRadius, pad: cs.padding, pos: cs.position }];
  })), els);

async function designBoxes(shot, els) {
  const { browser, page } = await newPage(shot);
  try {
    const { state } = parseShot(shot.name);
    await page.goto(`http://127.0.0.1:${DESIGN_PORT}/${state}/`, { waitUntil: 'load' });
    await page.locator('[data-board]').waitFor();
    await page.waitForTimeout(300);
    return await measure(page, els);
  } finally { await browser.close(); }
}

async function productBoxes(shot, els) {
  const { browser, page } = await newPage(shot);
  const port = Number(process.env.BINARKA_PORT_BASE) + 1;
  try {
    const { state } = parseShot(shot.name);
    const theme = { 'settings-light': 'light', 'settings-dark': 'dark' }[state] ?? null;
    await page.addInitScript(({ board, theme }) => {
      if (board) window.__binarkaCaptureBoard = board;
      if (theme) window.localStorage.setItem('binarka.theme', theme);
    }, { board: captureBoardFor(state), theme });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
    await page.locator('[data-board] [data-cell]').first().waitFor();
    if (state === 'confirm') {
      await page.locator('[data-action="new"]').evaluate((el) => el.click());
      await page.locator('dialog[data-dialog="confirm"][open]').waitFor();
    } else {
      await page.locator('[data-action="settings"]').evaluate((el) => el.click());
      await page.locator('[data-section="settings"]:popover-open').waitFor();
      if (state === 'settings-focus') { await page.keyboard.press('Shift'); await page.locator('[data-theme-option="dark"]').focus(); }
    }
    await page.waitForTimeout(300);
    return await measure(page, els);
  } finally { await browser.close(); }
}

const hex = (d, i) => '#' + [0, 1, 2].map((c) => d[i + c].toString(16).padStart(2, '0')).join('');
const fmt = (b) => (b ? `${b.x},${b.y} ${b.w}x${b.h}` : 'absent');
const server = await serveDesign();
const run12 = Object.fromEntries([...readFileSync('docs/qa/g2/check-visual-run-12.txt', 'utf8').matchAll(/\[([^\]]+)\][^\n]*?score (\d\.\d+|1)\b/g)].map((m) => [m[1], Number(m[2])]));
try {
  for (const shot of shots) {
    const { state } = parseShot(shot.name);
    const els = ELEMENTS[surfaceOf(state)];
    const ref = PNG.sync.read(readFileSync(join(config.referenceDir, `${shot.name}.png`)));
    const local = await capture({ role: 'local', url: config.localUrl, name: shot.name, width: shot.width, height: shot.height, settleMs: config.settleMs });
    const now = PNG.sync.read(local.png);
    const W = ref.width, H = ref.height, total = W * H;
    const out = new PNG({ width: W, height: H });
    const m = pixelmatch(ref.data, now.data, out.data, W, H, { threshold: 0.1, diffColor: [255, 0, 255], aaColor: [0, 255, 255] });
    const score = Math.round((1 - m / total) * 10000) / 10000;
    const dBox = await designBoxes(shot, els);
    const pBox = await productBoxes(shot, els);
    const inBox = (b, x, y) => b && x / DPR >= b.x && x / DPR < b.x + b.w && y / DPR >= b.y && y / DPR < b.y + b.h;
    const byEl = new Map(), pairs = new Map();
    for (let i = 0; i < total * 4; i += 4) {
      if (!(out.data[i] === 255 && out.data[i + 1] === 0 && out.data[i + 2] === 255)) continue;
      const p = i / 4, x = p % W, y = Math.floor(p / W);
      const el = els.find(([k]) => inBox(dBox[k], x, y) || inBox(pBox[k], x, y))?.[0] ?? 'outside';
      byEl.set(el, (byEl.get(el) ?? 0) + 1);
      const k = `${el}: ref ${hex(ref.data, i)} | page ${hex(now.data, i)}`;
      pairs.set(k, (pairs.get(k) ?? 0) + 1);
    }
    console.log(`== ${shot.name}: score ${score} (run 12: ${run12[shot.name] ?? '?'}), diff pixels ${m} of ${total}`);
    console.log(`   by element (device px): ${[...byEl].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    for (const [k] of els) {
      const d = dBox[k], p = pBox[k];
      const same = d && p && ['x', 'y', 'w', 'h'].every((f) => Math.abs(d[f] - p[f]) <= 0.5);
      console.log(`   ${k.padEnd(17)} design ${fmt(d)} | page ${fmt(p)}${same ? '  (within 0.5px)' : ''}`);
      if (d && p) {
        const diffs = ['fs', 'fw', 'lh', 'color', 'bg', 'bc', 'bw', 'br', 'pad', 'pos'].filter((f) => d[f] !== p[f]).map((f) => `${f} ${d[f]} -> ${p[f]}`);
        if (diffs.length) console.log(`   ${''.padEnd(17)} style: ${diffs.join('; ')}`);
      }
    }
    for (const [k, v] of [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`     ${v}\t${k}`);
    if (saveDir) {
      writeFileSync(join(saveDir, `${shot.name}-page.png`), local.png);
      writeFileSync(join(saveDir, `${shot.name}-diff.png`), PNG.sync.write(out));
    }
  }
} finally {
  await closeAdapter();
  server.close();
}
