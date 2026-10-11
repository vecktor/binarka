// Freezes the layout geometry of the design build into quality/design-geometry.json, the fixture of the NFR-14 layout
// geometry test (e2e/nfr-14-layout-geometry.spec.ts, change update-page-layout-geometry). Not a gate.
//
// The design build (design/v0/out, `pnpm build` in design/v0, design/README.md) stands in for the frozen reference
// review-set-14: captured at a real device scale it reproduces all 170 reference shots exactly
// (docs/qa/g2/harness-calibration.txt). The boxes are measured with the SAME browser setup as the e2e test that reads
// them (playwright.config.ts: Playwright's "Desktop Chrome" device, the viewport set per case, reduced motion, light
// scheme), so the test compares like with like. Box edges are CSS px as getBoundingClientRect gives them.
//
// Sampling: the light shots of review-set-14 whose state is reached at mount (default, four, eight, level, win) or by one press of the hint
// button (hint), at the reference viewports; geometry does not depend on the scheme. Coverage: sampled, never continuum.
//
// Rules panel (change update-rules-panel, key `rulesPanel`, read by e2e/nfr-14-rules-panel.spec.ts): 8 explicit cases, the open
// panel [data-section="rules"] and its «Зрозуміло» button: the six review-set shots <w>-light-rules (320, 375, 768, 1024, 1366, 1440;
// widths and heights from the config), 768-light-rules-four (768x1024, the 4x4 board) and 800-light-rules-short (800x600, 6x6; in no
// breakpoint of the config). Sampling: those 8 viewports, light scheme; coverage: sampled, never continuum. Design side: the
// /rules/ route is open at load, so the six shots and the short case only wait for :popover-open (a press would CLOSE it); the
// four case loads /four/ and presses the design's «Правила». Every case records afterLoad "open-rules" (the page side presses
// «Правила», waits for :popover-open) and an explicit captureBoard (the synthetic names parse to states with no board). Per case
// `layout` records the design's scrollHeight, clientHeight, resolved min-height and max-height (border-box px) and `decidedBy`:
// which of max-height, min-height, content equals the box height within 0.5 px (content = the panel's border-box height measured
// with both bounds lifted, recorded as contentHeightPx; ties go max-height, min-height, content; no match fails the freeze). rulesPanel.provenance is this run's; the top-level `provenance` is kept as
// recorded while designCommit and designCssSha1 are unchanged (designBuildSha1 differs between worktrees).
//
// Usage: node scripts/freeze-design-geometry.mjs   (design/v0/out must be built; port BINARKA_PORT_BASE + 4 must be free, 4177 by default; scripts/capture-ports.mjs)
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { chromium, devices } from 'playwright';
import { captureBoardFor, parseShot } from './check-visual-parity-adapters.mjs';
import { capturePorts } from './capture-ports.mjs';

export const LAYOUT_SELECTORS = [
  '.page-header',
  '.page-header h1',
  '.page-header .logo',
  '[data-action="settings"]',
  '[data-action="rules"]',
  '[data-action="setup"]',
  '[data-board]',
  '[data-board] [data-cell]:first-child',
  '[data-board] [data-cell]:last-child',
  '[data-action="hint"]',
  '[data-action="reset"]',
  '[data-action="new"]',
  '.messages',
  '[data-message="idle"]',
  '[data-message="hint"]',
  '[data-message="win"]',
];
const STATES = ['default', 'four', 'eight', 'level', 'win', 'hint'];
// The page reaches a state after load with one action, as the capture adapter does: the hint state is the hint board without its hinted cell,
// then one press of the hint button (FR-119 Q4). The e2e test replays it.
const AFTER_LOAD = { hint: 'press-hint' };
const RULES_SELECTORS = ['[data-section="rules"]', '[data-section="rules"] .rules-close'];
const bp = (name) => {
  const b = config.breakpoints.find((x) => x.name === name);
  if (!b) throw new Error(`breakpoint ${name} is missing from quality/visual-parity.config.json`);
  return b;
};
const PORT = capturePorts().design;
const OUT = 'quality/design-geometry.json';

const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const cases = config.breakpoints
  .map((b) => ({ ...b, ...parseShot(b.name) }))
  .filter((b) => b.scheme === 'light' && STATES.includes(b.state));

const RULES_CASES = [
  ...['320', '375', '768', '1024', '1366', '1440'].map((w) => ({ shot: `${w}-light-rules`, width: bp(`${w}-light-rules`).width, height: bp(`${w}-light-rules`).height, route: '/rules/', press: false, board: 'rules' })),
  { shot: '768-light-rules-four', width: 768, height: 1024, route: '/four/', press: true, board: 'four' },
  { shot: '800-light-rules-short', width: 800, height: 600, route: '/rules/', press: false, board: 'rules' },
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };
const root = 'design/v0/out';
if (!existsSync(join(root, 'index.html'))) throw new Error('design/v0/out is missing: build the design first (design/README.md)');
const rootAbs = resolve(root);
const server = createServer((req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end(); // a malformed escape must not end the run (review run 2)
    return;
  }
  let p = resolve(rootAbs, `.${path}`);
  if (p !== rootAbs && !p.startsWith(rootAbs + sep)) {
    res.writeHead(403).end(); // never serve outside the build folder
    return;
  }
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch();
const out = [];
const rulesOut = [];
try {
  for (const c of cases) {
    const ctx = await browser.newContext({ ...devices['Desktop Chrome'], viewport: { width: c.width, height: c.height }, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${c.state === 'default' ? '/' : `/${c.state}/`}`, { waitUntil: 'load' });
    await page.locator('[data-board]').waitFor();
    const boxes = await page.evaluate((sels) => Object.fromEntries(sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return [s, null];
      const r = el.getBoundingClientRect();
      return [s, { x: r.x, y: r.y, w: r.width, h: r.height }];
    })), LAYOUT_SELECTORS);
    out.push({ shot: c.name, width: c.width, height: c.height, state: c.state, captureBoard: captureBoardFor(c.state), ...(AFTER_LOAD[c.state] ? { afterLoad: AFTER_LOAD[c.state] } : {}), boxes });
    await ctx.close();
  }
  for (const c of RULES_CASES) {
    const ctx = await browser.newContext({ ...devices['Desktop Chrome'], viewport: { width: c.width, height: c.height }, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${c.route}`, { waitUntil: 'load' });
    await page.locator('[data-board]').waitFor();
    if (c.press) await page.locator('[data-action="rules"]').click(); // /four/ is not open at load; on /rules/ a press would close the panel
    await page.waitForSelector('[data-section="rules"]:popover-open');
    const { boxes, layout } = await page.evaluate((sels) => {
      const boxes = Object.fromEntries(sels.map((s) => {
        const el = document.querySelector(s);
        if (!el) return [s, null];
        const r = el.getBoundingClientRect();
        return [s, { x: r.x, y: r.y, w: r.width, h: r.height }];
      }));
      const el = document.querySelector(sels[0]);
      const cs = getComputedStyle(el);
      const px = (v) => (v.endsWith('px') ? parseFloat(v) : null);
      const borders = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      // min-height / max-height bound the box named by box-sizing; convert to border-box px to compare with the box height.
      const extra = cs.boxSizing === 'content-box' ? borders + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
      const minH = px(cs.minHeight);
      const maxH = px(cs.maxHeight);
      const boxH = el.getBoundingClientRect().height;
      // The content height is measured, not inferred: the panel's border-box height with both bounds lifted (review finding 1).
      const saved = [el.style.minHeight, el.style.maxHeight];
      el.style.minHeight = '0px';
      el.style.maxHeight = 'none';
      const contentH = el.getBoundingClientRect().height;
      [el.style.minHeight, el.style.maxHeight] = saved;
      const near = (v) => v !== null && Math.abs(v - boxH) <= 0.5;
      const decidedBy = near(maxH === null ? null : maxH + extra) ? 'max-height' : near(minH === null ? null : minH + extra) ? 'min-height' : near(contentH) ? 'content' : null;
      return { boxes, layout: { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, minHeightPx: minH, maxHeightPx: maxH, contentHeightPx: contentH, decidedBy } };
    }, RULES_SELECTORS);
    // No bound and no content height equals the box: fail loudly instead of labelling the case (review finding 1).
    if (layout.decidedBy === null) throw new Error(`${c.shot}: the panel's height matches neither max-height, min-height nor its content height (layout ${JSON.stringify(layout)})`);
    rulesOut.push({ shot: c.shot, width: c.width, height: c.height, state: 'rules', captureBoard: captureBoardFor(c.board), afterLoad: 'open-rules', boxes, layout });
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

const css = readFileSync('design/v0/app/binarka.css');
/** SHA-1 over every file of the build (path and bytes, in path order): identifies the exact build measured. */
function buildSha1(dir) {
  const hash = createHash('sha1');
  const walk = (d) => readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else hash.update(relative(dir, p)).update('\0').update(readFileSync(p)).update('\0');
  });
  walk(dir);
  return hash.digest('hex');
}
const freshProvenance = {
    designCommit: execSync('git log -1 --format=%H -- design/v0').toString().trim(),
    designCssSha1: createHash('sha1').update(css).digest('hex'),
    designBuildSha1: buildSha1(root),
    designBuild: 'design/v0/out from `pnpm build` in design/v0 (design/README.md), not committed; designBuildSha1 covers every file of it',
    reference: config.referenceDir,
    referenceSha1sums: config.referenceSha1sums,
    standIn: 'docs/qa/g2/harness-calibration.txt (the design build reproduces all 170 reference shots at 1.0000)',
    browser: `Playwright chromium ${browser.version()}, devices["Desktop Chrome"], reducedMotion reduce, colorScheme light`,
  };
// Keep the recorded provenance while the design is unchanged (designBuildSha1 differs between worktrees); otherwise write this run's.
let provenance = freshProvenance;
if (existsSync(OUT)) {
  const recorded = JSON.parse(readFileSync(OUT, 'utf8')).provenance;
  if (recorded?.designCommit === freshProvenance.designCommit && recorded?.designCssSha1 === freshProvenance.designCssSha1) {
    provenance = recorded;
    // The layout cases are measured again on every run, so a different browser is said out loud (review finding 3); the box values
    // of `cases` then come from this run's browser, which rulesPanel.provenance records.
    if (recorded.browser !== freshProvenance.browser) console.warn(`WARNING: the recorded provenance names "${recorded.browser}", this run used "${freshProvenance.browser}"; check that \`cases\` did not change before committing`);
  } else console.warn('WARNING: the design changed since the recorded provenance (designCommit or designCssSha1 differ); writing the fresh provenance');
}
const fixture = {
  $comment: 'Layout geometry of the design build, the stand-in for review-set-14 (NFR-14). Generated by scripts/freeze-design-geometry.mjs; do not edit by hand. Read by e2e/nfr-14-layout-geometry.spec.ts.',
  provenance: provenance,
  tolerancePx: 0.5,
  selectors: LAYOUT_SELECTORS,
  coverage: 'sampled',
  cases: out,
  rulesPanel: {
    selectors: RULES_SELECTORS,
    coverage: 'sampled',
    provenance: {
      designCommit: freshProvenance.designCommit,
      designCssSha1: freshProvenance.designCssSha1,
      designBuildSha1: freshProvenance.designBuildSha1,
      browser: freshProvenance.browser,
    },
    cases: rulesOut,
  },
};
writeFileSync(OUT, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`wrote ${OUT}: ${out.length} cases x ${LAYOUT_SELECTORS.length} selectors, rulesPanel: ${rulesOut.length} cases x ${RULES_SELECTORS.length} selectors`);
