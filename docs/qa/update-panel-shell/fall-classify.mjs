// Run-10 fall explanation (task 6.3): score the HEAD capture and the port capture of each shot against the frozen reference with the
// gate's own call (pixelmatch 8, threshold 0.1), and classify the pixels that pass at HEAD and fail after the port, and the reverse, by
// (reference colour, HEAD colour, port colour), using pixelmatch's own output image. Run: node docs/qa/update-panel-shell/fall-classify.mjs
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
const D = 'docs/qa/update-panel-shell/fall';
const hex = (d, i) => '#' + [0, 1, 2].map((c) => d[i + c].toString(16).padStart(2, '0')).join('');
const opts = { threshold: 0.1, diffColor: [255, 0, 255], aaColor: [0, 255, 255] };
const isDiff = (o, i) => o.data[i] === 255 && o.data[i + 1] === 0 && o.data[i + 2] === 255;
for (const name of ['768-dark-setup-four', '1024-dark-setup', '1366-dark-setup', '320-dark-settings', '1440-dark-rules', '375-dark-confirm', '768-light-setup-marked-four']) {
  const ref = PNG.sync.read(readFileSync(`design/v0-screenshots/review-set-14/${name}.png`));
  const head = PNG.sync.read(readFileSync(`${D}/head/${name}.png`));
  const port = PNG.sync.read(readFileSync(`${D}/port/${name}.png`));
  const W = ref.width, H = ref.height, total = W * H;
  const oh = new PNG({ width: W, height: H }), op = new PNG({ width: W, height: H });
  const mh = pixelmatch(ref.data, head.data, oh.data, W, H, opts), mp = pixelmatch(ref.data, port.data, op.data, W, H, opts);
  const worse = new Map(), better = new Map();
  let nw = 0, nb = 0, ymin = 1e9, ymax = 0, xmin = 1e9, xmax = 0;
  for (let i = 0; i < total * 4; i += 4) {
    const a = isDiff(oh, i), b = isDiff(op, i);
    if (!a && b) { nw++; const k = `ref ${hex(ref.data, i)} | head ${hex(head.data, i)} | port ${hex(port.data, i)}`; worse.set(k, (worse.get(k) ?? 0) + 1);
      const p = i / 4, x = p % W, y = Math.floor(p / W); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
    if (a && !b) { nb++; const k = `ref ${hex(ref.data, i)} | head ${hex(head.data, i)} | port ${hex(port.data, i)}`; better.set(k, (better.get(k) ?? 0) + 1); }
  }
  console.log(`== ${name}: HEAD ${(1 - mh / total).toFixed(4)}, port ${(1 - mp / total).toFixed(4)}; newly failing ${nw} (device px x ${xmin}-${xmax}, y ${ymin}-${ymax}), newly passing ${nb}`);
  for (const [k, v] of [...worse].sort((p, q) => q[1] - p[1]).slice(0, 4)) console.log(`  worse ${v}\t${k}`);
  for (const [k, v] of [...better].sort((p, q) => q[1] - p[1]).slice(0, 3)) console.log(`  better ${v}\t${k}`);
}
