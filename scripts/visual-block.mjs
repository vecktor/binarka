// Per-block instrument for NFR-14 convergence (phase G2; the escalation path of docs/qa/visual-diff/README.md, step 1).
// Not a gate: `npm run check:visual` (the locked checker + adapter) decides NFR-14 per shot. This tool localises a residual
// to one block so it can be taken to zero (AGENTS.md, block-conquest lesson):
//
//   geometry channel - the boxes of the block's elements on the served design build (design/v0/out) against the built page,
//                      paired by the shared data-* selectors, in CSS px; a pair is off when any edge differs by more than
//                      TOLERANCE_PX. An element present on one side only is "unpaired".
//   pixel channel    - the block's region (the union of its design boxes, device px) cut from the FROZEN reference PNG and
//                      from the gate's own product capture (scripts/check-visual-parity-adapters.mjs capture()), scored with
//                      pixelmatch at the checker's per-pixel threshold 0.1; plus diff.png (difference overlay) and onion.png
//                      (a 50% onion-skin of the two crops).
//   calibration      - with --calibrate, the design build captured under the gate's conditions (a real device scale, PD-3)
//                      is scored against its own frozen reference (whole shot): the harness ceiling, 1.0 since PD-3
//                      (docs/qa/g2/harness-calibration.txt).
//
// The product side shows the design's fixture board through FR-119 (captureBoardFor, exported by the adapter). Geometry is
// measured only for states whose look is reached at mount (GEOMETRY_STATES); other states have the pixel channel only.
// Sampling: the shots given (default: the default state at every reference viewport and scheme); coverage is `sampled`.
//
// Usage: npm run build && node scripts/visual-block.mjs --block layout [--shots a,b] [--states default,four] [--calibrate]
//        [--out docs/qa/g2/blocks/<block>]
// Ports: the design build on 4177, the page preview on 4176 (geometry), the adapter's own preview on 4174 (pixels).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { capture, captureBoardFor, close as closeAdapter, parseShot } from './check-visual-parity-adapters.mjs';

const TOLERANCE_PX = 0.5;
const PIXEL_THRESHOLD = 0.1;
const DESIGN_PORT = 4177;
const PAGE_PORT = 4176;
const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const DPR = config.deviceScaleFactor ?? 2;
const SEED = config.seed ?? 1;

/** Each block names the elements it owns; one selector serves both sides (the design keeps the page's data-* contract). */
const BLOCKS = {
  layout: [
    '.page-header',
    '[data-action="settings"]',
    '[data-action="rules"]',
    '[data-action="setup"]',
    '[data-board]',
    '[data-board] [data-cell]:first-child',
    '[data-board] [data-cell]:last-child',
    '[data-action="hint"]',
    '[data-action="reset"]',
    '[data-action="new"]',
    '[data-message="idle"]',
  ],
};
const GEOMETRY_STATES = new Set(['default', 'four', 'eight', 'level', 'win']);

const args = process.argv.slice(2);
const flag = (name, d) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : d;
};
const blockName = flag('--block', 'layout');
const selectors = BLOCKS[blockName];
if (!selectors) throw new Error(`unknown block "${blockName}" (known: ${Object.keys(BLOCKS).join(', ')})`);
const calibrate = args.includes('--calibrate');
const outDir = flag('--out', `docs/qa/g2/blocks/${blockName}`);
const states = (flag('--states', 'default')).split(',');
const allShots = config.breakpoints.map((b) => b);
const wanted = flag('--shots', null)?.split(',');
const shots = allShots.filter((b) => (wanted ? wanted.includes(b.name) : states.includes(parseShot(b.name).state)));
if (shots.length === 0) throw new Error('no shots selected');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.json': 'application/json', '.woff2': 'font/woff2' };
function serveDesign() {
  const root = 'design/v0/out';
  if (!existsSync(join(root, 'index.html'))) throw new Error('design/v0/out is missing: build the design first (design/README.md)');
  const server = createServer((req, res) => {
    let p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
  });
  return new Promise((resolve) => server.listen(DESIGN_PORT, '127.0.0.1', () => resolve(server)));
}

async function startPreview() {
  const url = `http://localhost:${PAGE_PORT}/`;
  const proc = spawn('npx', ['vite', 'preview', '--port', String(PAGE_PORT), '--strictPort'], { stdio: 'ignore' });
  let exited = false;
  proc.on('exit', () => { exited = true; });
  for (let i = 0; i < 120; i++) {
    if (exited) throw new Error(`vite preview on ${PAGE_PORT} exited (port busy?)`);
    try {
      if ((await fetch(url)).ok) return { proc, url };
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite preview did not answer on ${url}`);
}

const designRoute = (state) => (state === 'default' ? '/' : `/${state}/`);

/** A real device scale, as the gate's adapter since PD-3: one browser per page, the window at the shot's size. */
async function newPage(shot) {
  const { scheme } = parseShot(shot.name);
  const browser = await chromium.launch({ headless: true, args: ['--hide-scrollbars', `--force-device-scale-factor=${DPR}`, `--window-size=${shot.width},${shot.height}`] });
  const ctx = await browser.newContext({ viewport: null, colorScheme: scheme, reducedMotion: 'reduce' });
  return { ctx: browser, page: await ctx.newPage() };
}

const boxes = (page) =>
  page.evaluate((sels) => sels.map((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }), selectors);

async function designBoxes(shot) {
  const { ctx, page } = await newPage(shot);
  try {
    await page.goto(`http://127.0.0.1:${DESIGN_PORT}${designRoute(parseShot(shot.name).state)}`, { waitUntil: 'load' });
    await page.locator('[data-board]').waitFor();
    return { boxes: await boxes(page), png: calibrate ? await page.screenshot({ animations: 'disabled', caret: 'hide' }) : null };
  } finally {
    await ctx.close();
  }
}

async function pageBoxes(shot, url) {
  const { state } = parseShot(shot.name);
  const { ctx, page } = await newPage(shot);
  try {
    await page.addInitScript(({ start, board }) => {
      let a = start >>> 0;
      Math.random = () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      if (board) window.__binarkaCaptureBoard = board;
    }, { start: SEED, board: captureBoardFor(state) });
    await page.goto(url, { waitUntil: 'load' });
    await page.locator('[data-board] [data-cell]').first().waitFor();
    return await boxes(page);
  } finally {
    await ctx.close();
  }
}

function geometry(design, product) {
  return selectors.map((sel, i) => {
    const d = design[i];
    const p = product[i];
    if (!d || !p) return { sel, unpaired: true, design: d, product: p };
    const delta = Math.max(Math.abs(d.x - p.x), Math.abs(d.y - p.y), Math.abs(d.x + d.w - p.x - p.w), Math.abs(d.y + d.h - p.y - p.h));
    return { sel, delta: Math.round(delta * 100) / 100, off: delta > TOLERANCE_PX, design: d, product: p };
  });
}

function region(designBoxList, shot) {
  const present = designBoxList.filter(Boolean);
  if (present.length === 0) return null;
  const x0 = Math.max(0, Math.floor(Math.min(...present.map((b) => b.x)) * DPR));
  const y0 = Math.max(0, Math.floor(Math.min(...present.map((b) => b.y)) * DPR));
  const x1 = Math.min(shot.width * DPR, Math.ceil(Math.max(...present.map((b) => b.x + b.w)) * DPR));
  const y1 = Math.min(shot.height * DPR, Math.ceil(Math.max(...present.map((b) => b.y + b.h)) * DPR));
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

function crop(png, r) {
  const out = new PNG({ width: r.w, height: r.h });
  PNG.bitblt(png, out, r.x, r.y, r.w, r.h, 0, 0);
  return out;
}

function score(a, b, diffOut) {
  const n = a.width * a.height;
  const bad = pixelmatch(a.data, b.data, diffOut ? diffOut.data : null, a.width, a.height, { threshold: PIXEL_THRESHOLD });
  return Math.round((1 - bad / n) * 10000) / 10000;
}

function onion(a, b) {
  const out = new PNG({ width: a.width, height: a.height });
  for (let i = 0; i < a.data.length; i++) out.data[i] = (a.data[i] + b.data[i]) >> 1;
  return out;
}

const server = await serveDesign();
const preview = await startPreview();
const { chromium } = await import('playwright');
const results = [];
try {
  for (const shot of shots) {
    const { state } = parseShot(shot.name);
    const ref = PNG.sync.read(readFileSync(join(config.referenceDir, `${shot.name}.png`)));
    const d = await designBoxes(shot);
    const entry = { shot: shot.name, block: blockName };
    if (calibrate) {
      const live = PNG.sync.read(d.png);
      entry.calibration = live.width === ref.width && live.height === ref.height ? score(ref, live) : 'size differs';
    }
    if (GEOMETRY_STATES.has(state)) {
      entry.geometry = geometry(d.boxes, await pageBoxes(shot, preview.url));
      entry.geometryOff = entry.geometry.filter((g) => g.off).length;
      entry.unpaired = entry.geometry.filter((g) => g.unpaired).length;
      entry.maxDelta = Math.max(0, ...entry.geometry.filter((g) => !g.unpaired).map((g) => g.delta));
    }
    const r = region(d.boxes, shot);
    if (r) {
      const prod = PNG.sync.read((await capture({ role: 'local', url: config.localUrl, name: shot.name, width: shot.width, height: shot.height, settleMs: config.settleMs ?? 300 })).png);
      const a = crop(ref, r);
      const b = crop(prod, r);
      const diff = new PNG({ width: r.w, height: r.h });
      entry.region = r;
      entry.pixel = score(a, b, diff);
      const dir = join(outDir, shot.name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'reference.png'), PNG.sync.write(a));
      writeFileSync(join(dir, 'product.png'), PNG.sync.write(b));
      writeFileSync(join(dir, 'diff.png'), PNG.sync.write(diff));
      writeFileSync(join(dir, 'onion.png'), PNG.sync.write(onion(a, b)));
      writeFileSync(join(dir, 'report.json'), `${JSON.stringify(entry, null, 2)}\n`);
    }
    results.push(entry);
    const geo = entry.geometry ? ` geometry off ${entry.geometryOff}/${selectors.length}, unpaired ${entry.unpaired}, max delta ${entry.maxDelta}px` : ' geometry n/a (state reached by a driver)';
    console.log(`${shot.name.padEnd(30)} pixel ${entry.pixel ?? 'n/a'}${geo}${calibrate ? ` calibration ${entry.calibration}` : ''}`);
  }
} finally {
  await closeAdapter();
  preview.proc.kill();
  server.close();
}
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'summary.json'), `${JSON.stringify({ block: blockName, tolerancePx: TOLERANCE_PX, pixelThreshold: PIXEL_THRESHOLD, coverage: 'sampled', shots: results.map(({ geometry: _g, ...rest }) => rest) }, null, 2)}\n`);
const done = results.every((e) => (e.geometry ? e.geometryOff === 0 && e.unpaired === 0 : true));
console.log(`\nBlock ${blockName}: ${results.length} shot(s), geometry ${done ? 'within' : 'NOT within'} ${TOLERANCE_PX}px (coverage: sampled)`);
process.exit(done ? 0 : 1);
