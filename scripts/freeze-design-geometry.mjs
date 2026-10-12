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
// with both bounds lifted, recorded as contentHeightPx; ties go max-height, min-height, content; no match fails the freeze). The top-level `provenance` and each key's
// own provenance (rulesPanel, setupSheet, confirmDialog, settingsPanel) are kept as recorded while designCommit and designCssSha1 are unchanged
// (designBuildSha1 differs between worktrees) and the run measured the same cases; drifted cases under the same design fail the freeze; a new key
// takes this run's provenance.
//
// The key setupSheet (update-setup-sheet, G2 setup-sheet block): the open setup sheet's box and the left edge of its first level description,
// at the six reference viewports, in the states setup (6×6 fixture) and setup-four (4×4 fixture, which checks the board side B); read by
// e2e/nfr-14-setup-sheet.spec.ts. The design's /setup/ and /setup-four/ routes are open at load (a press would close them); the page side replays
// the recorded afterLoad "open-setup" (press the summary button, wait for :popover-open). Each case records the design's own boxes (`boxes`) and
// the expected product boxes (`expected`): the same design page with the one recorded deviation injected in the browser, the level group's 28px
// bottom margin of A-60 and SQ-5 (nothing is written to design/v0). Sampling: 12 cases, coverage sampled, never continuum.
//
// The key confirmDialog (update-confirm-dialog, G2 dialog block): the open confirmation dialog, its text and its two buttons, at the five confirm
// viewports of review-set-14 (<w>-light-confirm at 320x700, 375x812, 768x1024, 1024x768, 1440x900; the set has no 1366 confirm shot); read by
// e2e/nfr-14-confirm-dialog.spec.ts. The design's /confirm/ route shows the dialog open at load, so the freeze waits for dialog[open] and presses
// nothing; the page side replays the recorded afterLoad "open-confirm" (press «Нова головоломка» on the capture board, which has entries, so it asks
// first; wait for dialog[open]), as the adapter's `confirm` driver does. No deviation: the key holds the design's `boxes` only. Its own provenance.
// Sampling: 5 cases, light scheme, coverage sampled, never continuum.
//
// The key settingsPanel (update-settings-panel, G2 settings block): the open settings panel, its two controls, the chosen option of each and
// «Закрити»; read by e2e/nfr-14-settings-panel.spec.ts. 7 explicit cases: <w>-light-settings at 320, 375, 768, 1024, 1366 and 1440 (the
// design's /settings/ route, «Як у системі» chosen) and 375-light-settings-dark (/settings-dark/, «Темна» chosen, the design's dark tokens under
// the light scheme). The design routes are open at load (a press would close them), so the design side only waits for :popover-open; the page
// side replays the recorded afterLoad "open-settings" (press the settings button, wait for :popover-open) and, for the dark case, the recorded
// storedTheme "dark" (localStorage['binarka.theme'] seeded by an init script before the load, as the capture adapter does for settings-dark).
// Each case records the design's boxes of the six selectors and the design's computed paint of one unchosen and the chosen option of each
// control plus each card's fill (the design's option is transparent over its card). Sampling: 7 cases, coverage sampled, never continuum.
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
import { SETUP_DEVIATION_CSS, SETUP_SELECTORS, designLevelMargin } from './setup-sheet-deviation.mjs';
import { CONFIRM_SELECTORS } from './confirm-dialog.mjs';

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

const SETUP_WIDTHS = [320, 375, 768, 1024, 1366, 1440];
const CONFIRM_WIDTHS = ['320', '375', '768', '1024', '1440'];
const SETUP_STATES = ['setup', 'setup-four'];

const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const cases = config.breakpoints
  .map((b) => ({ ...b, ...parseShot(b.name) }))
  .filter((b) => b.scheme === 'light' && STATES.includes(b.state));

const RULES_CASES = [
  ...['320', '375', '768', '1024', '1366', '1440'].map((w) => ({ shot: `${w}-light-rules`, width: bp(`${w}-light-rules`).width, height: bp(`${w}-light-rules`).height, route: '/rules/', press: false, board: 'rules' })),
  { shot: '768-light-rules-four', width: 768, height: 1024, route: '/four/', press: true, board: 'four' },
  { shot: '800-light-rules-short', width: 800, height: 600, route: '/rules/', press: false, board: 'rules' },
];

const CONFIRM_CASES = CONFIRM_WIDTHS.map((w) => ({ shot: `${w}-light-confirm`, width: bp(`${w}-light-confirm`).width, height: bp(`${w}-light-confirm`).height }));
const SETTINGS_SELECTORS = [
  '[data-section="settings"]',
  '[data-control="theme"]',
  '[data-control="language"]',
  '[data-control="theme"] button[aria-checked="true"]',
  '[data-control="language"] button[aria-checked="true"]',
  '[data-action="settings-close"]',
];
const SETTINGS_CASES = [
  ...['320', '375', '768', '1024', '1366', '1440'].map((w) => ({ shot: `${w}-light-settings`, width: bp(`${w}-light-settings`).width, height: bp(`${w}-light-settings`).height, state: 'settings', route: '/settings/' })),
  { shot: '375-light-settings-dark', width: bp('375-light-settings-dark').width, height: bp('375-light-settings-dark').height, state: 'settings-dark', route: '/settings-dark/', storedTheme: 'dark' },
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
const setupOut = [];
const confirmOut = [];
const settingsOut = [];
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
  for (const state of SETUP_STATES) {
    for (const w of SETUP_WIDTHS) {
      const name = `${w}-light-${state}`;
      const bp = config.breakpoints.find((b) => b.name === name);
      if (!bp) throw new Error(`quality/visual-parity.config.json has no breakpoint ${name}`);
      const ctx = await browser.newContext({ ...devices['Desktop Chrome'], viewport: { width: bp.width, height: bp.height }, reducedMotion: 'reduce', colorScheme: 'light' });
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/${state}/`, { waitUntil: 'load' });
      await page.locator('[data-board]').waitFor();
      await page.locator(`${SETUP_SELECTORS[0]}:popover-open`).waitFor();
      const measure = () => page.evaluate((sels) => {
        const sheet = document.querySelector(sels[0]);
        const text = document.querySelector(sels[1]);
        const level = sheet?.querySelector('[data-control="level"]');
        if (!sheet || !text || !level) return null;
        const cs = getComputedStyle(sheet);
        const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
        return {
          boxes: { [sels[0]]: r(sheet), [sels[1]]: r(text) },
          levelMarginBottom: getComputedStyle(level).marginBottom,
          scrollHeight: sheet.scrollHeight,
          clientHeight: sheet.clientHeight,
          minHeight: cs.minHeight,
          maxHeight: cs.maxHeight,
        };
      }, SETUP_SELECTORS);
      const design = await measure();
      if (!design) throw new Error(`${name}: the design page lacks ${SETUP_SELECTORS.join(' or ')}`);
      // Guard the injection (as e2e/nfr-14-palette.spec.ts guards its deviations): the override must replace the design value the key records.
      const designMargin = designLevelMargin(bp.width);
      if (design.levelMarginBottom !== designMargin) throw new Error(`${name}: the design's level margin-bottom is ${design.levelMarginBottom}, not ${designMargin}; the recorded deviation is stale`);
      await page.evaluate((css) => {
        const el = document.createElement('style');
        el.textContent = css;
        document.head.append(el);
      }, SETUP_DEVIATION_CSS);
      const product = await measure();
      if (product?.levelMarginBottom !== '28px') throw new Error(`${name}: the injected deviation did not apply (${product?.levelMarginBottom})`);
      const sheetH = design.boxes[SETUP_SELECTORS[0]].h;
      const minHeightPx = Number.parseFloat(design.minHeight) || 0;
      const maxHeightPx = design.maxHeight === 'none' ? null : Number.parseFloat(design.maxHeight);
      const decide = (h) => (maxHeightPx !== null && Math.abs(h - maxHeightPx) <= 0.5 ? 'max-height' : Math.abs(h - minHeightPx) <= 0.5 ? 'min-height' : 'content');
      const decidedBy = decide(sheetH);
      // Which bound decides the expected (product) box: the margin's growth stops at max-height (320x700, 6x6: content in the design, the cap
      // in the expected box; review gate fix round 1).
      const expectedDecidedBy = decide(product.boxes[SETUP_SELECTORS[0]].h);
      setupOut.push({
        shot: name,
        width: bp.width,
        height: bp.height,
        state,
        captureBoard: captureBoardFor(state),
        afterLoad: 'open-setup',
        boxes: design.boxes,
        expected: product.boxes,
        layout: { scrollHeight: design.scrollHeight, clientHeight: design.clientHeight, minHeightPx, maxHeightPx, decidedBy, expectedDecidedBy },
      });
      await ctx.close();
    }
  }
  for (const c of CONFIRM_CASES) {
    const ctx = await browser.newContext({ ...devices['Desktop Chrome'], viewport: { width: c.width, height: c.height }, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/confirm/`, { waitUntil: 'load' });
    await page.locator('[data-board]').waitFor();
    await page.locator(`${CONFIRM_SELECTORS[0]}[open]`).waitFor(); // open at load; press nothing
    const boxes = await page.evaluate((sels) => Object.fromEntries(sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return [s, null];
      const r = el.getBoundingClientRect();
      return [s, { x: r.x, y: r.y, w: r.width, h: r.height }];
    })), CONFIRM_SELECTORS);
    const missing = CONFIRM_SELECTORS.filter((s) => !boxes[s]);
    if (missing.length) throw new Error(`${c.shot}: the design page lacks ${missing.join(', ')}`);
    confirmOut.push({ shot: c.shot, width: c.width, height: c.height, state: 'confirm', captureBoard: captureBoardFor('confirm'), afterLoad: 'open-confirm', boxes });
    await ctx.close();
  }
  for (const c of SETTINGS_CASES) {
    const ctx = await browser.newContext({ ...devices['Desktop Chrome'], viewport: { width: c.width, height: c.height }, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${c.route}`, { waitUntil: 'load' });
    await page.locator('[data-board]').waitFor();
    await page.locator(`${SETTINGS_SELECTORS[0]}:popover-open`).waitFor(); // open at load; never press
    const measured = await page.evaluate((sels) => {
      const boxes = Object.fromEntries(sels.map((s) => {
        const el = document.querySelector(s);
        if (!el) return [s, null];
        const r = el.getBoundingClientRect();
        return [s, { x: r.x, y: r.y, w: r.width, h: r.height }];
      }));
      const paintOf = (s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { color: cs.color, backgroundColor: cs.backgroundColor, borderTopColor: cs.borderTopColor, borderTopWidth: cs.borderTopWidth, fontWeight: cs.fontWeight, fontSize: cs.fontSize };
      };
      const fill = (s) => {
        const el = document.querySelector(s);
        return el ? { backgroundColor: getComputedStyle(el).backgroundColor } : null;
      };
      const paint = {
        card: { theme: fill('[data-control="theme"]'), language: fill('[data-control="language"]') },
        theme: { unchosen: paintOf('[data-control="theme"] button[aria-checked="false"]'), chosen: paintOf('[data-control="theme"] button[aria-checked="true"]') },
        language: { unchosen: paintOf('[data-control="language"] button[aria-checked="false"]'), chosen: paintOf('[data-control="language"] button[aria-checked="true"]') },
        theme_: document.documentElement.dataset.theme ?? null,
      };
      return { boxes, paint };
    }, SETTINGS_SELECTORS);
    const missing = SETTINGS_SELECTORS.filter((s) => measured.boxes[s] === null);
    if (missing.length > 0) throw new Error(`${c.shot}: the design page lacks ${missing.join(', ')}`);
    const { theme_: designTheme, ...paint } = measured.paint;
    // The dark case must measure the design's dark tokens (the route sets them under the light scheme); a light page would freeze light paint.
    if (designTheme !== (c.storedTheme ?? 'light')) throw new Error(`${c.shot}: the design page's theme is ${designTheme}, not ${c.storedTheme ?? 'light'}`);
    settingsOut.push({
      shot: c.shot,
      width: c.width,
      height: c.height,
      state: c.state,
      captureBoard: captureBoardFor(c.state),
      afterLoad: 'open-settings',
      ...(c.storedTheme ? { storedTheme: c.storedTheme } : {}),
      boxes: measured.boxes,
      paint,
    });
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
    // Keeping the recorded provenance is honest only if this run measured the same top-level boxes (update-setup-sheet review gate fix round 1):
    // a different local build or browser that moved a box must not be written under the old provenance.
    const recordedCases = JSON.parse(readFileSync(OUT, 'utf8')).cases;
    if (JSON.stringify(recordedCases) !== JSON.stringify(out)) {
      throw new Error(`the top-level cases differ from the recorded ones under the same designCommit and designCssSha1 (this run: ${freshProvenance.browser}; recorded: ${recorded.browser}); check the build (design/README.md) and the browser before refreezing`);
    }
    // The layout cases are measured again on every run, so a different browser is said out loud (review finding 3); the box values
    // of `cases` then come from this run's browser, which rulesPanel.provenance records.
    if (recorded.browser !== freshProvenance.browser) console.warn(`WARNING: the recorded provenance names "${recorded.browser}", this run used "${freshProvenance.browser}"; check that \`cases\` did not change before committing`);
  } else console.warn('WARNING: the design changed since the recorded provenance (designCommit or designCssSha1 differ); writing the fresh provenance');
}
// Each key's own provenance is kept as recorded while the design is unchanged and the key's measured cases are byte-identical, as the top-level
// provenance is above: designBuildSha1 differs between worktrees, so a refreeze that adds one key must not rewrite the others (review gate of
// update-confirm-dialog, fix round 1). A key whose cases drifted under the same design fails the freeze instead of being rewritten under a fresh
// provenance (review gate of update-settings-panel, finding A); a key the file does not hold yet (a block adding its key) takes this run's.
const recordedFile = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const keyProvenance = (key, cases) => {
  const fresh = { designCommit: freshProvenance.designCommit, designCssSha1: freshProvenance.designCssSha1, designBuildSha1: freshProvenance.designBuildSha1, browser: freshProvenance.browser };
  const recorded = recordedFile[key];
  if (!recorded?.provenance || recorded.provenance.designCommit !== fresh.designCommit || recorded.provenance.designCssSha1 !== fresh.designCssSha1) return fresh;
  if (JSON.stringify(recorded.cases) !== JSON.stringify(cases)) {
    throw new Error(`the ${key} cases differ from the recorded ones under the same designCommit and designCssSha1 (this run: ${fresh.browser}; recorded: ${recorded.provenance.browser}); check the build (design/README.md) and the browser before refreezing`);
  }
  return recorded.provenance;
};
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
    provenance: keyProvenance('rulesPanel', rulesOut),
    cases: rulesOut,
  },
  setupSheet: {
    selectors: SETUP_SELECTORS,
    coverage: 'sampled',
    provenance: keyProvenance('setupSheet', setupOut),
    deviations: [
      {
        rule: '.setup .level-control { margin-bottom }',
        design: '24px; 1rem at 22.5rem and narrower',
        product: '28px',
        reason: 'A-60, SQ-5: the focus ring of the last option under the footer strip',
        contentDecidedCases: setupOut.filter((c) => c.layout.decidedBy === 'content').map((c) => c.shot),
      },
    ],
    cases: setupOut,
  },
  confirmDialog: {
    selectors: CONFIRM_SELECTORS,
    coverage: 'sampled',
    provenance: keyProvenance('confirmDialog', confirmOut),
    cases: confirmOut,
  },
  settingsPanel: {
    selectors: SETTINGS_SELECTORS,
    coverage: 'sampled',
    provenance: keyProvenance('settingsPanel', settingsOut),
    cases: settingsOut,
  },
};
writeFileSync(OUT, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`wrote ${OUT}: ${out.length} cases x ${LAYOUT_SELECTORS.length} selectors, rulesPanel: ${rulesOut.length} cases x ${RULES_SELECTORS.length} selectors; setupSheet ${setupOut.length} cases (content-decided: ${fixture.setupSheet.deviations[0].contentDecidedCases.join(', ') || 'none'}); confirmDialog ${confirmOut.length} cases x ${CONFIRM_SELECTORS.length} selectors; settingsPanel ${settingsOut.length} cases x ${SETTINGS_SELECTORS.length} selectors`);
