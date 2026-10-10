// NFR-14 capture adapters for scripts/check-visual-fidelity.mjs (phase G2), injected through its test hook
// CHECK_VISUAL_FIDELITY_ADAPTERS (`npm run check:visual` sets it). The checker itself is hash-locked (factory-lock.json)
// and its default adapters compare two live URLs full-page at device scale 1; NFR-14 compares the page per shot with
// the FROZEN reference set, viewport-cropped at device scale 2. So:
//
//   reference capture -> reads <referenceDir>/<shot>.png (the frozen set; referenceUrl is not fetched).
//   local capture     -> the built page (`vite preview`, started here on the config's localUrl port), driven into the
//                        shot's state in Chromium, captured under the reference's conditions (design/README.md, decision 25):
//                        device scale 2, the system scheme from the shot name, reduced motion, scrollbars hidden,
//                        viewport-cropped (never full page), no pointer on the page (states are reached by element.click()
//                        and keyboard focus, never by mouse moves), the page's window focused (Playwright's default).
//   diff              -> the checker's default pixelmatch adapter (threshold 0.1 per pixel).
//
// A shot is named <width>-<scheme>-<state> (review-set-14/SHA1SUMS). A state with no driver below throws, so the shot
// FAILS with "capture failed: no state driver"; it is never skipped. pageHeight is the viewport height in CSS px on both
// sides (the reference PNG height / 2), so the checker's page-height pre-gate is inert for viewport-cropped shots: a
// structural mismatch shows up in the pixel score instead.
//
// Board content (PD-2): each board shot shows the design's fixture board (design/v0/lib/boards.json, the same data as
// the design route of that state) through the capture-only board of FR-119: an init script sets
// window.__binarkaCaptureBoard before the page mounts. The page ignores an invalid value silently, so after load the
// adapter checks that the page shows exactly that board and fails the shot when it does not. Math.random stays seeded
// (seed 1, as in e2e/helpers.ts) for anything that still draws from it.
//
// The adapter measures only its own `vite preview`: it fails when something already answers on the config's localUrl
// before it starts one, and when its preview exits before answering (gap 6 of docs/qa/visual-diff/README.md).
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_PATH = process.env.VISUAL_PARITY_CONFIG ?? 'quality/visual-parity.config.json';
const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const referenceDir = raw.referenceDir;
const deviceScaleFactor = raw.deviceScaleFactor ?? 2;
const SEED = raw.seed ?? 1;
const BOARDS_PATH = 'design/v0/lib/boards.json';
const boards = JSON.parse(readFileSync(BOARDS_PATH, 'utf8'));

/**
 * A boards.json fixture as an FR-119 value. Tokens: "." empty, "g0"/"g1" a given, "p0"/"p1" an entry, "h0"/"h1" the
 * hinted entry. withoutHinted drops the hinted entry (the hint shot presses «Підказка» to place it).
 */
function toCaptureBoard(name, { level = 1, withoutHinted = false } = {}) {
  const spec = boards[name];
  if (!spec) throw new Error(`${BOARDS_PATH} has no board "${name}"`);
  const n = spec.size;
  const givens = [];
  const entries = [];
  let hinted;
  spec.rows.forEach((row, r) => {
    const tokens = row.trim().split(/\s+/);
    if (tokens.length !== n) throw new Error(`${BOARDS_PATH} ${name} row ${r} has ${tokens.length} cells, not ${n}`);
    givens.push(tokens.map((t) => (t[0] === 'g' ? Number(t[1]) : null)));
    entries.push(
      tokens.map((t, c) => {
        if (t[0] === 'p') return Number(t[1]);
        if (t[0] !== 'h') return null;
        if (withoutHinted) return null;
        hinted = [r, c];
        return Number(t[1]);
      }),
    );
  });
  return { size: n, level, givens, entries, ...(hinted ? { hinted } : {}) };
}

// The board of each state, as on the design's route of that state (design/v0/app/<state>/page.tsx; the root route for
// default). The level is the route's level prop (1 when it has none); setup-marked and setup-marked-four mark their
// choices in the sheet through the drivers, on the fixture board, as their routes do.
const fixture = () => toCaptureBoard('fixtureBoard');
const boardOfState = {
  default: fixture,
  confirm: fixture,
  rules: fixture,
  'rules-techniques': fixture,
  settings: fixture,
  'settings-light': fixture,
  'settings-dark': fixture,
  'settings-focus': fixture,
  setup: () => toCaptureBoard('fixtureBoard', { level: 2 }),
  'setup-marked': fixture,
  'setup-marked-four': fixture,
  hint: () => toCaptureBoard('hintBoard', { withoutHinted: true }),
  win: () => toCaptureBoard('solvedBoard'),
  four: () => toCaptureBoard('fourBoard'),
  'setup-four': () => toCaptureBoard('fourBoard'),
  eight: () => toCaptureBoard('eightBoard'),
  level: () => toCaptureBoard('eightBoard', { level: 4 }),
};

/** The FR-119 value the capture sets for a state; null for a state with no board (logo). */
export function captureBoardFor(state) {
  return boardOfState[state]?.() ?? null;
}

const sel = {
  board: '[data-board] [data-cell]',
  summary: '[data-action="setup"]',
  hint: '[data-action="hint"]',
  newPuzzle: '[data-action="new"]',
  rules: '[data-action="rules"]',
  rulesPanel: '[data-section="rules"]',
  settings: '[data-action="settings"]',
  settingsPanel: '[data-section="settings"]',
  sheet: '[data-section="setup"]',
  size: (n) => `[data-size-option="${n}"]`,
  level: '[data-control="level"] [role="radio"]',
  start: '[data-action="setup-start"]',
  dialog: 'dialog[data-dialog="confirm"]',
  hintMessage: '[data-message="hint"]',
  winMessage: '[data-message="win"]',
  theme: (v) => `[data-theme-option="${v}"]`,
};

const press = (page, selector, nth = 0) => page.locator(selector).nth(nth).evaluate((el) => el.click());

async function openSheet(page) {
  await press(page, sel.summary);
  await page.locator(`${sel.sheet}:popover-open`).waitFor();
}

async function openSettings(page) {
  await press(page, sel.settings);
  await page.locator(`${sel.settingsPanel}:popover-open`).waitFor();
}

/** Keyboard modality first, so a script focus paints :focus-visible as in the reference. */
async function keyboardFocus(page, selector) {
  await page.keyboard.press('Shift');
  await page.locator(selector).focus();
}

const notEmpty = (selector) => (page) => page.waitForFunction((s) => (document.querySelector(s)?.textContent ?? '') !== '', selector);

const drivers = {
  default: async () => {},
  rules: async (page) => {
    await press(page, sel.rules);
    await page.locator(`${sel.rulesPanel}:popover-open`).waitFor();
  },
  'rules-techniques': async (page) => {
    await drivers.rules(page);
    // As the design's /rules-techniques/ route: the panel scrolled to its end.
    await page.locator(sel.rulesPanel).evaluate((p) => { p.scrollTop = p.scrollHeight; });
  },
  // The hint board without its hinted cell; one press of «Підказка» places it (FR-119 Q4).
  hint: async (page) => {
    await press(page, sel.hint);
    await notEmpty(sel.hintMessage)(page);
  },
  // The solved board shows the win state at mount (FR-119).
  win: notEmpty(sel.winMessage),
  // The fixture board has entries, so «Нова головоломка» asks first (FR-67).
  confirm: async (page) => {
    await press(page, sel.newPuzzle);
    await page.locator(`${sel.dialog}[open]`).waitFor();
  },
  four: async () => {},
  eight: async () => {},
  level: async () => {},
  setup: openSheet,
  'setup-four': openSheet,
  'setup-marked': async (page) => {
    await openSheet(page);
    await press(page, sel.size(8));
    await press(page, sel.level, 2);
    await keyboardFocus(page, sel.start);
  },
  'setup-marked-four': async (page) => {
    await openSheet(page);
    await press(page, sel.size(4));
  },
  settings: openSettings,
  'settings-light': openSettings,
  'settings-dark': openSettings,
  'settings-focus': async (page) => {
    await openSettings(page);
    await keyboardFocus(page, sel.theme('dark'));
  },
};

/** "320-dark-settings-light" -> { width: 320, scheme: 'dark', state: 'settings-light' }; "logo-dark" -> state 'logo'. */
export function parseShot(name) {
  const m = /^(\d+)-(light|dark)-(.+)$/.exec(name);
  if (m) return { width: Number(m[1]), scheme: m[2], state: m[3] };
  const logo = /^logo-(light|dark)$/.exec(name);
  if (logo) return { width: null, scheme: logo[1], state: 'logo' };
  throw new Error(`shot name "${name}" is not <width>-<light|dark>-<state>`);
}

let browserPromise = null;
let server = null;
let serverReady = null;

const answers = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

/** Start this adapter's own `vite preview`; fail rather than measure a server it did not start (gap 6). */
function ensureServer(localUrl) {
  serverReady ??= startServer(localUrl);
  return serverReady;
}

async function startServer(localUrl) {
  if (await answers(localUrl)) {
    throw new Error(`something already answers on ${localUrl}; stop it first (the capture measures only the preview it starts itself)`);
  }
  const port = new URL(localUrl).port;
  let exit = null;
  let stderr = '';
  server = spawn('npx', ['vite', 'preview', '--port', port, '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', (chunk) => { stderr += chunk; });
  server.on('error', (err) => { exit ??= `failed to start: ${err.message}`; });
  server.on('exit', (code, signal) => { exit ??= `exited with ${signal ?? `code ${code}`}`; });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (exit) throw new Error(`vite preview on ${localUrl} ${exit} before it answered${stderr ? `: ${stderr.trim().slice(-300)}` : ''}`);
    if (await answers(localUrl)) {
      if (exit) continue; // the answer came from another server while ours was dying; report the exit instead
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite preview did not answer on ${localUrl} within 30 s (run "npm run build" first)`);
}

/** Fail the shot unless the page shows the capture board: the page ignores an invalid FR-119 value silently. */
async function expectBoardShown(page, board, name) {
  const shown = await page.locator(sel.board).evaluateAll((cells) => cells.map((c) => [c.getAttribute('data-given') === 'true', c.textContent ?? '']));
  const want = board.givens.flatMap((row, r) => row.map((g, c) => [g !== null, String(g ?? board.entries[r][c] ?? '')]));
  if (JSON.stringify(shown) !== JSON.stringify(want)) {
    throw new Error(`the page does not show the capture board of shot ${name} (FR-119 value rejected or ignored)`);
  }
}

async function getBrowser() {
  let pw;
  try {
    pw = await import('playwright');
  } catch (cause) {
    const err = new Error('required dependency "playwright" is not installed');
    err.dependency = 'playwright';
    err.cause = cause;
    throw err;
  }
  browserPromise ??= pw.chromium.launch({ headless: true, args: ['--hide-scrollbars'] });
  return browserPromise;
}

async function captureReference({ name }) {
  const png = readFileSync(join(referenceDir, `${name}.png`));
  const cssHeight = png.readUInt32BE(20) / deviceScaleFactor; // PNG IHDR height
  return { png, pageHeight: cssHeight, maskRects: [] };
}

async function captureLocal({ url, name, width, height, settleMs }) {
  const shot = parseShot(name);
  const driver = drivers[shot.state];
  if (!driver) throw new Error(`no state driver for "${shot.state}" (shot ${name}); the page has no such state yet`);
  await ensureServer(url);
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, colorScheme: shot.scheme, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    const manual = { 'settings-light': 'light', 'settings-dark': 'dark' }[shot.state];
    const board = captureBoardFor(shot.state);
    await page.addInitScript(
      ({ start, theme, board }) => {
        if (board) window.__binarkaCaptureBoard = board;
        let a = start >>> 0;
        Math.random = () => {
          a = (a + 0x6d2b79f5) >>> 0;
          let t = a;
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        if (theme && window.sessionStorage.getItem('visual-seeded') === null) {
          window.sessionStorage.setItem('visual-seeded', '1');
          window.localStorage.setItem('binarka.theme', theme);
        }
      },
      { start: SEED, theme: manual ?? null, board },
    );
    await page.goto(url, { waitUntil: 'load' });
    await page.locator(sel.board).first().waitFor();
    if (board) await expectBoardShown(page, board, name);
    await driver(page);
    await page.waitForTimeout(settleMs);
    const png = await page.screenshot({ fullPage: false, animations: 'disabled', caret: 'hide' });
    return { png, pageHeight: height, maskRects: [] };
  } finally {
    await context.close();
  }
}

export async function capture(args) {
  return args.role === 'reference' ? captureReference(args) : captureLocal(args);
}

export async function close() {
  if (browserPromise) await (await browserPromise).close();
  if (server) server.kill();
}
