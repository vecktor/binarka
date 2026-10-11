// Smoke test of update-panel-shell (task 5.1), scripted in Chromium (Playwright). The page preview on 4180, the design build on 4181
// (python3 http.server), neither a capture port. Run: npm run build; npx vite preview --port 4180 --strictPort &
// python3 -m http.server 4181 -d design/v0/out & node docs/qa/update-panel-shell/smoke-test.mjs
import { chromium } from 'playwright';
const PAGE = 'http://localhost:4180/';
const DESIGN = 'http://localhost:4181';
const OUT = 'docs/qa/update-panel-shell/smoke';
const b = await chromium.launch();
const log = (s) => console.log(s);
const PAINT = (el, label) => { const c = getComputedStyle(el); return `${label}: bg ${c.backgroundColor} | border-top ${c.borderTopColor} | shadow ${c.boxShadow}`; };
for (const [w, h] of [[1024, 768], [375, 812]]) {
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const errors = [];
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(PAGE);
    const tag = `${w}-${scheme}`;
    log(`\n== ${tag} (system scheme ${scheme}, no stored theme)`);
    // (2) rules
    await p.click('[data-action="rules"]'); await p.waitForTimeout(150);
    log(await p.locator('[data-section="rules"]').evaluate(PAINT, 'rules'));
    await p.screenshot({ path: `${OUT}/${tag}-rules.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    // (3) settings
    await p.click('[data-action="settings"]'); await p.waitForTimeout(150);
    log(await p.locator('.settings').evaluate(PAINT, 'settings'));
    log(await p.locator('.settings-close').evaluate(PAINT, 'settings «Закрити»'));
    await p.screenshot({ path: `${OUT}/${tag}-settings.png` });
    await p.click('.settings-close'); await p.waitForTimeout(100);
    // (4) setup sheet
    await p.click('[data-action="setup"]'); await p.waitForTimeout(150);
    log(await p.locator('[data-section="setup"]').evaluate(PAINT, 'setup sheet'));
    log(await p.locator('[data-action="setup-close"]').evaluate(PAINT, 'sheet «Закрити»'));
    log(await p.locator('[data-section="setup"]').evaluate((el) => { const c = getComputedStyle(el, '::before'); return `sheet strip: bg-image ${c.backgroundImage} | shadow ${c.boxShadow}`; }));
    await p.locator('[data-section="setup"]').evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await p.screenshot({ path: `${OUT}/${tag}-setup-scrolled.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    // (6) the hook: 6, then 4, 8, 6 through the sheet
    const sizes = async () => p.evaluate(() => `#app ${document.querySelector('#app')?.getAttribute('data-size')} / board ${document.querySelector('[data-board]')?.getAttribute('data-size')}`);
    const boardBox = async () => p.locator('[data-board]').evaluate((el) => { const r = el.getBoundingClientRect(); return `${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`; });
    const hintBox = async () => p.locator('[data-action="hint"]').evaluate((el) => { const r = el.getBoundingClientRect(); return `${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`; });
    log(`hook at mount: ${await sizes()}; board ${await boardBox()}; hint ${await hintBox()}`);
    for (const n of [4, 8, 6]) {
      await p.click('[data-action="setup"]'); await p.waitForTimeout(100);
      await p.click(`[data-size-option="${n}"]`); await p.click('[data-action="setup-start"]'); await p.waitForTimeout(150);
      if (await p.locator('[data-dialog="confirm"][open]').count()) await p.click('[data-confirm="yes"]');
      await p.waitForTimeout(150);
      log(`hook after «Почати» ${n}: ${await sizes()}; board ${await boardBox()}; hint ${await hintBox()}`);
    }
    // (5) dialog: press a non-given cell, then «Нова головоломка»
    await p.locator('[data-board] [data-cell]:not([aria-disabled="true"])').first().click();
    await p.click('[data-action="new"]'); await p.waitForTimeout(150);
    log(await p.locator('[data-dialog="confirm"]').evaluate(PAINT, 'dialog'));
    await p.screenshot({ path: `${OUT}/${tag}-confirm.png` });
    await p.click('[data-confirm="no"]');
    log(`console errors: ${errors.length ? errors.join(' | ') : 'none'}; raw error text on page: ${(await p.locator('body').innerText()).match(/Error|undefined|NaN/) ? 'FOUND' : 'none'}`);
    await ctx.close();
    // (9) the design build, same size and scheme
    const d = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' })).newPage();
    for (const [route, sel] of [['/rules/', '[data-section="rules"]'], ['/settings/', '.settings'], ['/setup/', '[data-section="setup"]'], ['/confirm/', '[data-dialog="confirm"]']]) {
      await d.goto(DESIGN + route); await d.waitForTimeout(300);
      const loc = d.locator(sel);
      log(await (await loc.count() ? loc.first().evaluate(PAINT, `design ${route}`) : Promise.resolve(`design ${route}: ${sel} not found`)));
      await d.screenshot({ path: `${OUT}/${tag}-design-${route.replace(/\//g, '')}.png` });
    }
    await d.close();
  }
}
await b.close();
