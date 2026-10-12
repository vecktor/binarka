// Scratch probe: scroll position of the setup sheet at 320x700 in the design's /setup-marked/ route, as is and with the product's
// scroll-padding-bottom injected and focus re-applied to the focused element. Design served on BINARKA_PORT_BASE + 4.
const { chromium } = await import(process.cwd() + '/node_modules/playwright/index.mjs');
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const port = Number(process.env.BINARKA_PORT_BASE) + 4;
const ct = (p) => p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'text/javascript' : p.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
const srv = createServer((q, s) => { let p = join('design/v0/out', new URL(q.url, 'http://x').pathname); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html'); if (!existsSync(p)) { s.writeHead(404).end(); return; } s.writeHead(200, { 'content-type': ct(p) }).end(readFileSync(p)); }).listen(port);
const b = await chromium.launch({ args: ['--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=320,700'] });
for (const route of ['setup', 'setup-marked', 'setup-marked-four']) {
  const ctx = await b.newContext({ viewport: null, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/${route}/`);
  await page.waitForTimeout(400);
  const read = () => page.evaluate(() => { const s = document.querySelector('[data-section="setup"]'); const a = document.activeElement; return { scrollTop: s.scrollTop, scrollHeight: s.scrollHeight, clientHeight: s.clientHeight, active: a ? (a.getAttribute('data-action') ?? a.tagName) : null }; });
  const asIs = await read();
  await page.addStyleTag({ content: '.setup:popover-open { scroll-padding-bottom: calc(2.75rem + 48px); }' });
  await page.evaluate(() => { const a = document.activeElement; if (a && a !== document.body) { a.blur(); a.focus(); } });
  const withPad = await read();
  console.log(route.padEnd(18), 'as is', JSON.stringify(asIs), '| with the product scroll-padding and focus re-applied', JSON.stringify(withPad));
  await ctx.close();
}
await b.close(); srv.close();
