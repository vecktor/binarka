// Planning session 2026-10-12: show the user the SQ-5 (28px level margin) difference on one phone setup shot.
// Product pixels come from the locked adapter's own capture() (so the score equals run 12); the reference is review-set-14.
// Run from the repo root: BINARKA_PORT_BASE=6873 node <this> <outDir> [shot]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = process.cwd();
const req = createRequire(join(repo, 'package.json'));
const { PNG } = req('pngjs');
const pixelmatch = (await import(pathToFileURL(req.resolve('pixelmatch')).href)).default;
const adapter = await import(pathToFileURL(resolve(repo, 'scripts/check-visual-parity-adapters.mjs')).href);
const { capturePorts } = await import(pathToFileURL(resolve(repo, 'scripts/capture-ports.mjs')).href);

const out = process.argv[2];
const name = process.argv[3] ?? '375-light-setup';
mkdirSync(out, { recursive: true });
const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const bp = config.breakpoints.find((b) => b.name === name);
const { page: pagePort } = capturePorts();
const localUrl = `http://localhost:${pagePort}/`;

const refPng = PNG.sync.read(readFileSync(join(config.referenceDir, `${name}.png`)));
try {
  const local = await adapter.capture({ url: localUrl, name, width: bp.width, height: bp.height, settleMs: config.settleMs, selectorMasks: [], role: 'local' });
  const loc = PNG.sync.read(local.png);
  writeFileSync(join(out, `${name}-product.png`), local.png);
  const w = refPng.width, h = refPng.height;
  if (loc.width !== w || loc.height !== h) throw new Error(`size differs: ref ${w}x${h}, product ${loc.width}x${loc.height}`);
  const diff = new PNG({ width: w, height: h });
  const bad = pixelmatch(refPng.data, loc.data, diff.data, w, h, { threshold: 0.1 });
  console.log(`${name}: score ${(1 - bad / (w * h)).toFixed(4)} (${bad} of ${w * h} pixels differ)`);

  // Three panels: design | product | diff, with a 24px gutter.
  const gap = 24, W = w * 3 + gap * 2;
  const sheet = new PNG({ width: W, height: h });
  sheet.data.fill(255);
  const blit = (src, dx) => { for (let y = 0; y < h; y++) src.data.copy(sheet.data, (y * W + dx) * 4, y * w * 4, (y + 1) * w * 4); };
  blit(refPng, 0); blit(loc, w + gap); blit(diff, 2 * (w + gap));
  writeFileSync(join(out, `${name}-design-product-diff.png`), PNG.sync.write(sheet));

  // Zoom: the band from the last level card to the footer, design above product, 2x.
  const y0 = Math.round(h * 0.76), y1 = h, bandH = y1 - y0, Z = 2;
  const zoom = new PNG({ width: w * Z, height: (bandH * 2 + gap) * Z });
  zoom.data.fill(255);
  const put = (src, oy) => {
    for (let y = 0; y < bandH; y++) for (let x = 0; x < w; x++) {
      const s = ((y0 + y) * w + x) * 4;
      for (let dy = 0; dy < Z; dy++) for (let dx = 0; dx < Z; dx++) src.data.copy(zoom.data, (((oy + y) * Z + dy) * w * Z + x * Z + dx) * 4, s, s + 4);
    }
  };
  put(refPng, 0); put(loc, bandH + gap);
  writeFileSync(join(out, `${name}-bottom-zoom.png`), PNG.sync.write(zoom));
} finally {
  await adapter.close();
}
