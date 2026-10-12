// Freezes the computed paint of the main column of the design build into quality/design-paint.json, the fixture of the NFR-14 palette test
// (e2e/nfr-14-palette.spec.ts, change update-page-palette, G2 block 2). Not a gate.
//
// The design build (design/v0/out, `pnpm build` in design/v0, design/README.md) stands in for the frozen reference review-set-14: captured at a
// real device scale it reproduces all 170 reference shots exactly (docs/qa/g2/harness-calibration.txt). This script reads COMPUTED STYLE, not
// pixels, with the SAME browser setup as the e2e test that reads the fixture (playwright.config.ts: Playwright's "Desktop Chrome" device,
// reduced motion, no stored preference), the viewport 1024x768 and the colour scheme set on the browser context (the design's head script then
// resolves the system theme, as the page's does).
//
// Sampling: the schemes light and dark x the states default, hint, win, four and eight x the viewport 1024x768 = 10 cases. Paint does not depend
// on the width. Coverage: sampled, never continuum. What it cannot see: the translucent stripe stops (only the PRESENCE of a gradient is frozen,
// because the design's stripe is a translucent colour and the page's the opaque composite of it), hover and active feedback, the win glow (reduced
// motion), and any element or state outside the 10 cases (the pixel crops of scripts/visual-block.mjs are the independent second instrument).
//
// The three deviations of the product from the design (A-57, change update-page-palette) are recorded as GROUPS: the design value (checked against
// what this script measures, so a changed design fails loudly), the expected product value and the reason. The e2e test compares the page with the
// expected value there.
//
// Errors are loud: a missing build, an element the spec expects and a case does not show, a design value that differs from the one a deviation
// records, a port that is busy, or two measurements of the same build that differ (the run measures every case twice, in two fresh browser
// contexts, and the two must be byte-identical). Nothing is written unless every check passed.
//
// Usage: node scripts/freeze-design-paint.mjs   (design/v0/out must be built; port BINARKA_PORT_BASE + 4 must be free, 4177 by default; scripts/capture-ports.mjs)
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { chromium, devices } from 'playwright';
import { captureBoardFor, parseShot } from './check-visual-parity-adapters.mjs';
import { capturePorts } from './capture-ports.mjs';

const PORT = capturePorts().design;
const OUT = 'quality/design-paint.json';
const VIEWPORT = { width: 1024, height: 768 };
const SCHEMES = ['light', 'dark'];
const STATES = ['default', 'hint', 'win', 'four', 'eight'];
// The page reaches the hint state after load with one press of the hint button, as the capture adapter does (FR-119 Q4); the e2e test replays it.
const AFTER_LOAD = { hint: 'press-hint' };

/** An element of the main column: how to find it, and which property group to freeze (`html`, `svg` shapes or the `svg-root`). */
const ELEMENTS = {
  body: { selector: 'body', group: 'html' },
  title: { selector: '.page-header h1', group: 'html' },
  logo: { selector: '.page-header .logo', group: 'svg-root' },
  // The logo's tile replaced its rays and disc (FR-72 amended 2026-10-12, drawing G, change update-logo-legibility).
  'logo-tile': { selector: '.page-header .logo .logo-tile', group: 'svg' },
  'logo-cell': { selector: '.page-header .logo .logo-cell', group: 'svg' },
  'logo-digit': { selector: '.page-header .logo .logo-digit', group: 'svg' },
  'logo-ring': { selector: '.page-header .logo .logo-digit-ring', group: 'svg' },
  'settings-button': { selector: '[data-action="settings"]', group: 'html' },
  'gear-tooth': { selector: '[data-action="settings"] .gear rect', group: 'svg' },
  'gear-hole': { selector: '[data-action="settings"] .gear-hole', group: 'svg' },
  'rules-button': { selector: '[data-action="rules"]', group: 'html' },
  'summary-button': { selector: '[data-action="setup"]', group: 'html' },
  'summary-cue': { selector: '[data-action="setup"] .setup-cue', group: 'html' },
  board: { selector: '[data-board]', group: 'html' },
  // The cell kinds are found by their classes and by the digit: the first cell of the board of that kind.
  'cell-ordinary': { selector: '[data-board] [data-cell]', filter: 'ordinary', group: 'html' },
  'cell-entry': { selector: '[data-board] [data-cell]', filter: 'entry', group: 'html' },
  'cell-given': { selector: '[data-board] [data-cell]', filter: 'given', group: 'html' },
  'cell-hinted': { selector: '[data-board] [data-cell]', filter: 'hinted', group: 'html' },
  'cell-violation': { selector: '[data-board] [data-cell]', filter: 'violation', group: 'html' },
  'hint-button': { selector: '[data-action="hint"]', group: 'html' },
  'reset-button': { selector: '[data-action="reset"]', group: 'html' },
  'new-button': { selector: '[data-action="new"]', group: 'html' },
  'message-idle': { selector: '[data-message="idle"]', group: 'html' },
  'message-hint': { selector: '[data-message="hint"]', group: 'html' },
  'message-win': { selector: '[data-message="win"]', group: 'html' },
};
const PROPERTIES = {
  html: [
    'color',
    'background-color',
    'background-image',
    ...['top', 'right', 'bottom', 'left'].flatMap((side) => [`border-${side}-color`, `border-${side}-width`, `border-${side}-style`]),
    'box-shadow',
    'font-weight',
    'font-style',
    'text-decoration-line',
  ],
  svg: ['fill', 'stroke'],
  'svg-root': ['color'],
};
const FOCUS_PROPERTIES = ['outline-color', 'outline-width', 'outline-style', 'outline-offset'];
// The focus targets: the first non-given cell and «Підказка», focused by script after a key press (so that :focus-visible applies, as in the
// capture adapter's keyboardFocus).
const FOCUS_TARGETS = { cell: '[data-board] [data-cell][data-given="false"]', button: '[data-action="hint"]' };

const BORDER_COLOURS = ['top', 'right', 'bottom', 'left'].map((side) => `border-${side}-color`);
const rgb = (r, g, b) => `rgb(${r}, ${g}, ${b})`;
/** The three recorded deviations of the product from the design (A-57). `cases` of the first two are found by the run, not typed. */
const DEVIATIONS = [
  {
    id: 'light-cell-border',
    clause: 'A-57, PA-Q2 A',
    elements: ['cell-ordinary', 'cell-entry', 'cell-given'],
    properties: BORDER_COLOURS,
    scheme: 'light',
    design: rgb(140, 131, 116),
    designHex: '#8c8374',
    expected: rgb(132, 123, 109),
    expectedHex: '#847b6d',
    reason: 'The design border is 2.71:1 against the board plate (--color-line), below the 3:1 of FR-65; #847b6d is the first value at 3:1 on a uniform darkening of the design colour (3.03:1). The given border equals the cell border at 1px (PA-Q1 A).',
  },
  {
    id: 'light-violating-digit',
    clause: 'A-57, PA-Q3 A',
    elements: ['cell-violation'],
    properties: ['color'],
    scheme: 'light',
    design: rgb(179, 38, 30),
    designHex: '#b3261e',
    expected: rgb(143, 29, 23),
    expectedHex: '#8f1d17',
    reason: 'The design digit is 4.33:1 on the darkest band of the stripe, below the 4.5:1 of an 8x8 digit on a 320 px phone; #8f1d17 is the design\'s own --violation-ink. The dark digit keeps the design\'s #ff8a7d (4.61:1), so it is not a deviation.',
  },
  {
    id: 'given-in-violation-weight',
    clause: 'A-57, PA-Q1 A',
    elements: ['cell-given-violation'],
    properties: ['font-weight'],
    scheme: 'both',
    design: '700',
    expected: '800',
    reason: 'The design\'s violation rule sets weight 700 over the given 800, which would remove the only cue of a given cell (a given cell is told by weight, PA-Q1 A). The design build shows no given cell in a violation (its fixture\'s violating cells are all player cells), so this deviation is not sampled: it records the value of the design\'s rule and is checked in the stylesheet (.cell-given.cell-violation { font-weight: 800 }).',
    sampled: false,
  },
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };
const root = 'design/v0/out';
if (!existsSync(join(root, 'index.html'))) throw new Error('design/v0/out is missing: build the design first (design/README.md)');
const rootAbs = resolve(root);

const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const known = new Set(config.breakpoints.map((b) => b.name));
const cases = SCHEMES.flatMap((scheme) =>
  STATES.map((state) => {
    const shot = `${VIEWPORT.width}-${scheme}-${state}`;
    if (!known.has(shot)) throw new Error(`the shot ${shot} is not in quality/visual-parity.config.json (the reference set has no such shot)`);
    return { shot, ...parseShot(shot), state };
  }),
);

const server = createServer((req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end(); // a malformed escape must not end the run
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
await new Promise((resolveListen, rejectListen) => {
  server.once('error', (err) => rejectListen(new Error(err.code === 'EADDRINUSE' ? `port ${PORT} is busy: stop whatever answers there, then run again` : `the server failed: ${err.message}`)));
  server.listen(PORT, '127.0.0.1', resolveListen);
});

/** Runs in the page: the paint of every element of ELEMENTS in the current document. */
function readPaint({ elements, properties }) {
  const kindOf = (cell) => {
    const has = (c) => cell.classList.contains(c);
    if (has('cell-given')) return 'given';
    if (has('cell-hinted')) return 'hinted';
    if (has('cell-violation')) return 'violation';
    return (cell.textContent ?? '').trim() === '' ? 'ordinary' : 'entry';
  };
  const find = (spec) => {
    const all = Array.from(document.querySelectorAll(spec.selector));
    return (spec.filter ? all.filter((el) => kindOf(el) === spec.filter) : all)[0] ?? null;
  };
  const out = {};
  for (const [key, spec] of Object.entries(elements)) {
    const el = find(spec);
    if (el === null) {
      out[key] = null;
      continue;
    }
    const r = el.getBoundingClientRect();
    const visible = r.width > 0 && r.height > 0;
    if (!visible) {
      out[key] = { visible: false };
      continue;
    }
    const style = getComputedStyle(el);
    const values = {};
    for (const property of properties[spec.group]) {
      const v = style.getPropertyValue(property);
      values[property] = property === 'background-image' ? (/gradient\(/.test(v) ? 'gradient' : v === 'none' ? 'none' : `other: ${v}`) : v;
    }
    // The colour of a border that is not drawn (style none or hidden, or width 0) paints nothing: a computed `currentcolor` there is no palette
    // value, so it is frozen as 'unpainted' (the e2e test applies the same rule to the page).
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const drawn = !['none', 'hidden'].includes(values[`border-${side}-style`]) && values[`border-${side}-width`] !== '0px';
      if (!drawn && `border-${side}-color` in values) values[`border-${side}-color`] = 'unpainted';
    }
    out[key] = { visible: true, values };
  }
  return out;
}

/** Runs in the page: the outline of an element, after the caller pressed a key and focused it. */
function readOutline({ selector, properties }) {
  const el = document.querySelector(selector);
  if (el === null) return null;
  if (document.activeElement !== el) return { focused: false };
  const style = getComputedStyle(el);
  return { focused: true, values: Object.fromEntries(properties.map((p) => [p, style.getPropertyValue(p)])) };
}

async function measureAll(browser) {
  const out = [];
  for (const c of cases) {
    const ctx = await browser.newContext({ ...devices['Desktop Chrome'], viewport: VIEWPORT, reducedMotion: 'reduce', colorScheme: c.scheme });
    try {
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:${PORT}${c.state === 'default' ? '/' : `/${c.state}/`}`, { waitUntil: 'load' });
      await page.locator('[data-board]').waitFor();
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (theme !== c.scheme) throw new Error(`${c.shot}: the design resolved data-theme="${theme}", expected "${c.scheme}"`);
      const paint = await page.evaluate(readPaint, { elements: ELEMENTS, properties: PROPERTIES });
      // Focus last: a focus ring does not change the paint read above.
      await page.keyboard.press('Shift');
      const focus = {};
      for (const [name, selector] of Object.entries(FOCUS_TARGETS)) {
        await page.locator(selector).first().focus();
        focus[name] = await page.evaluate(readOutline, { selector, properties: FOCUS_PROPERTIES });
      }
      out.push({ shot: c.shot, scheme: c.scheme, state: c.state, width: VIEWPORT.width, height: VIEWPORT.height, captureBoard: captureBoardFor(c.state), ...(AFTER_LOAD[c.state] ? { afterLoad: AFTER_LOAD[c.state] } : {}), paint, focus });
    } finally {
      await ctx.close();
    }
  }
  return out;
}

const fail = (message) => {
  throw new Error(`freeze-design-paint: ${message}`);
};

let browserVersion = '';
let measured;
try {
  const browser = await chromium.launch();
  try {
    browserVersion = browser.version();
    const first = await measureAll(browser);
    const second = await measureAll(browser);
    if (JSON.stringify(first) !== JSON.stringify(second)) fail('two measurements of the same build differ: the capture is not deterministic (a harness defect, not a design finding)');
    measured = first;
  } finally {
    await browser.close();
  }
} finally {
  server.close();
}

// ---- Checks the spec expects, then the deviation groups ----
const must = {
  default: ['body', 'title', 'logo', 'settings-button', 'rules-button', 'summary-button', 'summary-cue', 'board', 'cell-ordinary', 'cell-entry', 'cell-given', 'cell-violation', 'hint-button', 'reset-button', 'new-button', 'message-idle'],
  hint: ['board', 'cell-ordinary', 'cell-entry', 'cell-given', 'cell-hinted', 'hint-button', 'reset-button', 'new-button', 'message-hint'],
  win: ['board', 'cell-entry', 'cell-given', 'hint-button', 'reset-button', 'new-button', 'message-win'],
  four: ['board', 'cell-ordinary', 'cell-given'],
  eight: ['board', 'cell-ordinary', 'cell-given'],
};
for (const c of measured) {
  for (const key of must[c.state]) {
    const entry = c.paint[key];
    if (entry === null || entry.visible === false) fail(`${c.shot}: the design case shows no ${key} (the spec expects it)`);
  }
  for (const target of ['cell', 'button']) {
    if (c.focus[target]?.focused !== true) fail(`${c.shot}: the ${target} focus target did not take the focus`);
  }
}

const deviations = DEVIATIONS.map((group) => {
  if (group.sampled === false) return { ...group, cases: [] };
  const found = [];
  for (const c of measured) {
    if (group.scheme !== 'both' && c.scheme !== group.scheme) continue;
    let hit = false;
    for (const key of group.elements) {
      const entry = c.paint[key];
      if (entry === null || entry.visible !== true) continue;
      hit = true;
      for (const property of group.properties) {
        if (entry.values[property] !== group.design) fail(`${c.shot}: ${key} ${property} is ${entry.values[property]} in the design, the deviation ${group.id} records ${group.design}`);
      }
    }
    if (hit) found.push(c.shot);
  }
  if (found.length === 0) fail(`the deviation ${group.id} matches no case: the design shows none of its elements`);
  return { ...group, cases: found };
});
// The violating digit must NOT differ in the dark scheme (A-57: the dark digit keeps the design's value).
const violatingDark = measured.filter((c) => c.scheme === 'dark').map((c) => c.paint['cell-violation']?.values?.color).filter(Boolean);
if (violatingDark.some((v) => v !== rgb(255, 138, 125))) fail(`the design's dark violating digit is not rgb(255, 138, 125): ${violatingDark.join(', ')}`);
// The dark cell border must equal the page's #8a7f71 (no deviation in dark).
for (const c of measured.filter((m) => m.scheme === 'dark')) {
  for (const key of ['cell-ordinary', 'cell-entry', 'cell-given']) {
    const v = c.paint[key]?.values?.['border-top-color'];
    if (v !== undefined && v !== rgb(138, 127, 113)) fail(`${c.shot}: the design's dark ${key} border is ${v}, not rgb(138, 127, 113)`);
  }
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

const fixture = {
  $comment: 'Computed paint of the main column of the design build, the stand-in for review-set-14 (NFR-14, G2 block 2). Generated by scripts/freeze-design-paint.mjs; do not edit by hand. Read by e2e/nfr-14-palette.spec.ts and tests/play-page-palette-stylesheet.test.ts.',
  provenance: {
    script: 'scripts/freeze-design-paint.mjs',
    designCommit: execSync('git log -1 --format=%H -- design/v0').toString().trim(),
    designCssSha1: createHash('sha1').update(css).digest('hex'),
    designBuildSha1: buildSha1(root),
    designBuild: 'design/v0/out from `pnpm build` in design/v0 (design/README.md), not committed; designBuildSha1 covers every file of it',
    reference: config.referenceDir,
    referenceSha1sums: config.referenceSha1sums,
    standIn: 'docs/qa/g2/harness-calibration.txt (the design build reproduces all 170 reference shots at 1.0000)',
    browser: `Playwright chromium ${browserVersion}, devices["Desktop Chrome"], viewport ${VIEWPORT.width}x${VIEWPORT.height}, reducedMotion reduce, colorScheme set per case on the context, no stored preference`,
    determinism: 'every case is measured twice in two fresh contexts and the two must be identical before this file is written',
  },
  coverage: 'sampled',
  sampling: {
    dimensions: ['scheme', 'state', 'viewport'],
    schemes: SCHEMES,
    states: STATES,
    viewports: [VIEWPORT],
    cases: cases.length,
    notStrictlyCovered: 'the stripe colour stops (only the presence of a gradient is frozen), hover and active feedback, the win glow (reduced motion), a given cell in a violation (the design shows none), any element or state outside the 10 cases',
  },
  elements: ELEMENTS,
  properties: PROPERTIES,
  readingRules: [
    'background-image is frozen as "gradient", "none" or "other: <value>", never as colour stops',
    'the colour of a border that is not drawn (style none or hidden, or width 0px) is frozen as "unpainted"',
    'an element with a zero-size box is frozen as { visible: false }: it paints nothing, and the page may keep it rendered at zero size (FR-63)',
    'an element absent from a case is frozen as null',
  ],
  focus: { targets: FOCUS_TARGETS, properties: FOCUS_PROPERTIES, how: 'a key press (Shift), then a script focus, so that :focus-visible applies (the capture adapter\'s keyboardFocus)' },
  deviations,
  cases: measured,
};
writeFileSync(OUT, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`wrote ${OUT}: ${measured.length} cases x ${Object.keys(ELEMENTS).length} elements, ${deviations.length} deviation groups`);
