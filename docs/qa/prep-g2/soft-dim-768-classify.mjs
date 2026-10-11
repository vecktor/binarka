// Prep session, 2026-10-11 (after the rules-panel audit, finding 1): classify the pixels of the two 768 soft-dim shots with the
// gate's OWN per-pixel verdict (pixelmatch 8, its output image), not a hand-written colour delta. Reads the product captures that
// docs/qa/prep-g2/soft-dim-768.mjs saved (copied next to this file) and the surface boxes it printed; rebuilds the run-7 dim outside the
// surface as that script does. Run: node docs/qa/prep-g2/soft-dim-768-classify.mjs
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const PAGE = [0x1a, 0x17, 0x14];
const SOFT = [8, 5, 2];
const A = 0x73 / 255;
const hex = (d, i) => '#' + [0, 1, 2].map((c) => d[i + c].toString(16).padStart(2, '0')).join('');
const SHOTS = [
  ['768-dark-rules', { x: 160, y: 230.4, w: 448, h: 563.2 }],
  ['768-dark-setup-four', { x: 160, y: 229.8, w: 448, h: 564.4 }],
];
for (const [name, rect] of SHOTS) {
  const ref = PNG.sync.read(readFileSync(`design/v0-screenshots/review-set-14/${name}.png`));
  const now = PNG.sync.read(readFileSync(`docs/qa/prep-g2/${name}-product.png`));
  const old = PNG.sync.read(readFileSync(`docs/qa/prep-g2/${name}-product.png`));
  const inSurface = (x, y) => x / 2 >= rect.x && x / 2 < rect.x + rect.w && y / 2 >= rect.y && y / 2 < rect.y + rect.h;
  for (let y = 0; y < now.height; y++) for (let x = 0; x < now.width; x++) {
    if (inSurface(x, y)) continue;
    const i = (y * now.width + x) * 4;
    for (let c = 0; c < 3; c++) old.data[i + c] = Math.round(0.6 * PAGE[c] + 0.4 * Math.min(255, Math.max(0, (now.data[i + c] - A * SOFT[c]) / (1 - A))));
  }
  const W = ref.width, H = ref.height, total = W * H;
  const opts = { threshold: 0.1, diffColor: [255, 0, 255], aaColor: [0, 255, 255] };
  const outNow = new PNG({ width: W, height: H }), outOld = new PNG({ width: W, height: H });
  const mNow = pixelmatch(ref.data, now.data, outNow.data, W, H, opts);
  const mOld = pixelmatch(ref.data, old.data, outOld.data, W, H, opts);
  const isDiff = (o, i) => o.data[i] === 255 && o.data[i + 1] === 0 && o.data[i + 2] === 255;
  const pairs = new Map();
  let fresh = 0, freshOutside = 0, healed = 0;
  for (let i = 0; i < total * 4; i += 4) {
    const dNow = isDiff(outNow, i), dOld = isDiff(outOld, i);
    if (dNow && !dOld) {
      fresh++;
      const p = i / 4, x = p % W, y = Math.floor(p / W);
      if (!inSurface(x, y)) freshOutside++;
      const k = `ref ${hex(ref.data, i)} | now ${hex(now.data, i)} | old ${hex(old.data, i)}`;
      pairs.set(k, (pairs.get(k) ?? 0) + 1);
    }
    if (dOld && !dNow) healed++;
  }
  console.log(`== ${name}: pixelmatch ${(1 - mNow / total).toFixed(4)} now, ${(1 - mOld / total).toFixed(4)} with the old dim rebuilt`);
  console.log(`diff pixels now ${mNow}, old ${mOld}; newly failing ${fresh} (outside the surface ${freshOutside}); newly passing ${healed}`);
  for (const [k, v] of [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`  ${v}\t${k}`);
}
