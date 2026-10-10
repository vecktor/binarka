// Harness ceiling: the design build (design/v0/out) captured two ways and scored against its own frozen reference.
// emulated = today's adapter method (context deviceScaleFactor 2); flag = viewport null + --force-device-scale-factor=2 --window-size.
const root = process.argv[2]; process.chdir(root);
const { chromium } = await import(`${root}/node_modules/playwright/index.mjs`);
const { PNG } = await import(`${root}/node_modules/pngjs/lib/png.js`);
const pixelmatch = (await import(`${root}/node_modules/pixelmatch/index.js`)).default;
import { createServer } from 'node:http'; import { readFileSync, existsSync, statSync } from 'node:fs'; import { join } from 'node:path';
const cfg = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const ct = (p) => p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'text/javascript' : p.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
const srv = createServer((q, s) => { let p = join('design/v0/out', new URL(q.url, 'http://x').pathname); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html'); if (!existsSync(p)) { s.writeHead(404).end(); return; } s.writeHead(200, { 'content-type': ct(p) }).end(readFileSync(p)); }).listen(4178);
const emu = await chromium.launch({ args: ['--hide-scrollbars'] });
const rows = [];
for (const bp of cfg.breakpoints) {
  const m = /^(\d+)-(light|dark)-(.+)$/.exec(bp.name) ?? [null, null, /logo-(light|dark)/.exec(bp.name)[1], 'logo'];
  const scheme = m[2], state = m[3]; const route = state === 'default' ? '/' : `/${state}/`;
  const ref = PNG.sync.read(readFileSync(`${cfg.referenceDir}/${bp.name}.png`));
  const W = ref.width / 2, H = ref.height / 2;
  const sc = (png) => { const l = PNG.sync.read(png); if (l.width !== ref.width || l.height !== ref.height) return 'size'; return 1 - pixelmatch(ref.data, l.data, null, ref.width, ref.height, { threshold: 0.1 }) / (ref.width * ref.height); };
  const c1 = await emu.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce' }); const p1 = await c1.newPage();
  await p1.goto('http://127.0.0.1:4178' + route); await p1.waitForTimeout(300); const a = sc(await p1.screenshot({ animations: 'disabled', caret: 'hide' })); await c1.close();
  const fb = await chromium.launch({ args: ['--hide-scrollbars', '--force-device-scale-factor=2', `--window-size=${W},${H}`] });
  const c2 = await fb.newContext({ viewport: null, colorScheme: scheme, reducedMotion: 'reduce' }); const p2 = await c2.newPage();
  await p2.goto('http://127.0.0.1:4178' + route); await p2.waitForTimeout(300); const b = sc(await p2.screenshot({ animations: 'disabled', caret: 'hide' })); await fb.close();
  rows.push([bp.name, a, b]);
}
await emu.close(); srv.close();
const f = (x) => typeof x === 'number' ? x.toFixed(4) : x;
for (const r of rows) console.log(r[0].padEnd(32), 'emulated', f(r[1]), 'flag', f(r[2]));
const num = (i) => rows.map((r) => r[i]).filter((x) => typeof x === 'number');
for (const [i, n] of [[1, 'emulated'], [2, 'flag']]) { const v = num(i); console.log(`${n}: ${v.length} scored, min ${Math.min(...v).toFixed(4)}, below 0.98: ${v.filter((x) => x < 0.98).length}, exactly 1: ${v.filter((x) => x === 1).length}`); }
