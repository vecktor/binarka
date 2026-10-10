// PD-2 proof probe (scratch). For each board state: does the page show the fixture of boards.json?
// "seed only" = the page as the adapter before PD-2 loaded it; "PD-2 init" = with window.__binarkaCaptureBoard set.
const { chromium } = await import(`${process.argv[2]}/node_modules/playwright/index.mjs`);
import { spawn } from 'node:child_process';
const root = process.argv[2];
process.chdir(root);
const { captureBoardFor } = await import(`${root}/scripts/check-visual-parity-adapters.mjs`);
const states = ['default', 'confirm', 'setup', 'hint', 'win', 'four', 'eight', 'level'];
const url = 'http://localhost:4179/';
const srv = spawn('npx', ['vite', 'preview', '--port', '4179', '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }
const browser = await chromium.launch();
const read = (page) => page.locator('[data-board] [data-cell]').evaluateAll((cs) => cs.map((c) => [c.getAttribute('data-given') === 'true', c.textContent ?? '']));
let fails = 0;
for (const st of states) {
  const b = captureBoardFor(st);
  const want = JSON.stringify(b.givens.flatMap((row, r) => row.map((g, c) => [g !== null, String(g ?? b.entries[r][c] ?? '')])));
  const out = [];
  for (const mode of ['seed only', 'PD-2 init']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript((board) => { if (board) window.__binarkaCaptureBoard = board; }, mode === 'PD-2 init' ? b : null);
    await page.goto(url); await page.locator('[data-board] [data-cell]').first().waitFor();
    const same = JSON.stringify(await read(page)) === want;
    const summary = await page.locator('[data-action="setup"]').textContent();
    out.push(`${mode}: ${same ? 'fixture shown' : 'NOT the fixture'} (summary «${summary.trim()}»)`);
    if (mode === 'PD-2 init' && !same) fails++;
    await ctx.close();
  }
  console.log(`${st.padEnd(8)} ${b.size}x${b.size} level ${b.level}${b.hinted ? ' hinted' : ''} | ${out.join(' | ')}`);
}
await browser.close(); srv.kill();
console.log(fails ? `RESULT: FAIL (${fails})` : 'RESULT: PASS, every board state shows its fixture with the PD-2 init');
process.exit(fails ? 1 : 0);
