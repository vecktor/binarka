// Scratch: the design's /setup-marked/ at 320x700 captured with the gate's method (flag: real device scale), as is and with the product's
// scroll-padding-bottom injected (focus re-applied), each scored against the page's capture from the locked adapter (compare.mjs output).
const root = process.cwd();
const { chromium } = await import(root + '/node_modules/playwright/index.mjs');
const { PNG } = await import(root + '/node_modules/pngjs/lib/png.js');
const pixelmatch = (await import(root + '/node_modules/pixelmatch/index.js')).default;
import { createServer } from 'node:http'; import { existsSync, readFileSync, statSync } from 'node:fs'; import { join } from 'node:path';
const port = Number(process.env.BINARKA_PORT_BASE) + 4; const out = process.argv[2];
const ct = (p) => p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'text/javascript' : p.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
const srv = createServer((q, s) => { let p = join('design/v0/out', new URL(q.url, 'http://x').pathname); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html'); if (!existsSync(p)) { s.writeHead(404).end(); return; } s.writeHead(200, { 'content-type': ct(p) }).end(readFileSync(p)); }).listen(port);
const score = (a, b) => { const A = PNG.sync.read(a), B = PNG.sync.read(b); if (A.width !== B.width || A.height !== B.height) return 'size'; return (1 - pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.1 }) / (A.width * A.height)).toFixed(4); };
for (const scheme of ['light', 'dark']) {
  const name = `320-${scheme}-setup-marked`;
  const product = readFileSync(`${out}/${name}-product.png`);
  const ref = readFileSync(`design/v0-screenshots/review-set-15/${name}.png`);
  const b = await chromium.launch({ args: ['--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=320,700'] });
  const ctx = await b.newContext({ viewport: null, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/setup-marked/`); await page.waitForTimeout(300);
  const asIs = await page.screenshot({ animations: 'disabled', caret: 'hide' });
  await page.addStyleTag({ content: '.setup:popover-open { scroll-padding-bottom: calc(2.75rem + 48px); }' });
  await page.evaluate(() => { const a = document.activeElement; a.blur(); a.focus(); }); await page.waitForTimeout(100);
  const sim = await page.screenshot({ animations: 'disabled', caret: 'hide' });
  console.log(name, '| design as is vs set-15 ref', score(asIs, ref), '| page vs set-15 ref', score(product, ref), '| page vs design with the scroll-padding', score(product, sim));
  await b.close();
}
srv.close();
