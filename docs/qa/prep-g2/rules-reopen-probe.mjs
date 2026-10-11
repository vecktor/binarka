// Prep session, 2026-10-11 (after the rules-panel audit, finding 2): does the panel open at its top on a SECOND opening, after the player
// scrolled it and closed it? Variants: the design's sticky «Зрозуміло» only; sticky + reset on `toggle` (open); sticky + reset on
// `beforetoggle` (closing, while still shown). Closing by «Зрозуміло» and by Escape. Chromium, 375x812.
// Run: npm run build; npx vite preview --port 4180 --strictPort & node docs/qa/prep-g2/rules-reopen-probe.mjs
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const variant of ['sticky only', 'sticky + reset on open (toggle)', 'sticky + reset on close (beforetoggle)']) {
  for (const close of ['button', 'Escape']) {
    const p = await (await b.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' })).newPage();
    await p.goto('http://localhost:4180/');
    await p.addStyleTag({ content: '.rules-close{position:sticky;bottom:0}' });
    await p.evaluate((v) => {
      const panel = document.querySelector('[data-section="rules"]');
      if (v.includes('toggle)')) panel.addEventListener('toggle', (e) => { if (e.newState === 'open') panel.scrollTop = 0; });
      if (v.includes('beforetoggle')) panel.addEventListener('beforetoggle', (e) => { if (e.newState === 'closed') panel.scrollTop = 0; });
    }, variant);
    const panel = p.locator('[data-section="rules"]');
    const read = () => panel.evaluate((el) => `${el.scrollTop} of ${el.scrollHeight - el.clientHeight}, focus .${document.activeElement?.className}`);
    await p.locator('[data-action="rules"]').click();
    await panel.locator(':scope:popover-open').waitFor().catch(() => {});
    await p.waitForTimeout(150);
    const first = await read();
    await panel.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    if (close === 'button') await p.locator('.rules-close').click(); else await p.keyboard.press('Escape');
    await p.waitForTimeout(150);
    await p.locator('[data-action="rules"]').click();
    await p.waitForTimeout(150);
    console.log(`${variant}, closed by ${close}: first open ${first}; second open ${await read()}`);
    await p.close();
  }
}
await b.close();
