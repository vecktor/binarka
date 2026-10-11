// Probe (prep session, 2026-10-11 about 15:50 UTC+5:30, main 2e19235): where the rules panel is scrolled right after it opens, with the
// page as built (sticky=false) and with the design's sticky «Зрозуміло» injected (sticky=true). Chromium (Playwright), mouse click on
// «Правила», reduced motion. Run: npm run build; npx vite preview --port 4180 --strictPort & node docs/qa/prep-g2/rules-open-probe.mjs

import { chromium } from 'playwright';
const url = 'http://localhost:4180/';
const b = await chromium.launch();
for (const [w, h] of [[375, 812], [320, 700], [768, 1024], [1366, 650]]) {
  for (const sticky of [false, true]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })).newPage();
    await p.goto(url);
    if (sticky) await p.addStyleTag({ content: '.rules-close{position:sticky;bottom:0}' });
    await p.locator('[data-action="rules"]').click();
    await p.locator('[data-section="rules"]:popover-open').waitFor();
    await p.waitForTimeout(200);
    const r = await p.locator('[data-section="rules"]').evaluate((el) => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight, focus: document.activeElement?.className }));
    console.log(`${w}x${h} sticky=${sticky}: scrollTop ${r.top} of ${r.max}, focus .${r.focus}`);
    await p.close();
  }
}
await b.close();
