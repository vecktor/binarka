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
// A shot is named <width>-<scheme>-<state> (review-set-13/SHA1SUMS). A state with no driver below throws, so the shot
// FAILS with "capture failed: no state driver"; it is never skipped. pageHeight is the viewport height in CSS px on both
// sides (the reference PNG height / 2), so the checker's page-height pre-gate is inert for viewport-cropped shots: a
// structural mismatch shows up in the pixel score instead. Puzzles come from a seeded Math.random (seed 1, as in
// e2e/helpers.ts), so a re-run captures the same page; the design shots use fixture boards (design/v0/lib/boards.ts),
// which the page cannot show yet (docs/qa/visual-diff/README.md, "Board content").
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_PATH = process.env.VISUAL_PARITY_CONFIG ?? 'quality/visual-parity.config.json';
const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const referenceDir = raw.referenceDir;
const deviceScaleFactor = raw.deviceScaleFactor ?? 2;
const SEED = raw.seed ?? 1;

const sel = {
  board: '[data-board] [data-cell]',
  emptyCell: '[data-board] [data-cell][data-given="false"]',
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

/** Start a new puzzle of size n and level (1 to 4) through the sheet, on a board without entries (no confirmation). */
async function startPuzzle(page, n, level) {
  await openSheet(page);
  await press(page, sel.size(n));
  await press(page, sel.level, level - 1);
  await press(page, sel.start);
  await page.waitForFunction((s) => !document.querySelector(s), `${sel.sheet}:popover-open`);
  await page.waitForFunction(([cells, count]) => document.querySelectorAll(cells).length === count, [sel.board, n * n]);
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
  hint: async (page) => {
    await press(page, sel.hint);
    await notEmpty(sel.hintMessage)(page);
  },
  win: async (page) => {
    for (let i = 0; i < 100; i++) {
      if (((await page.locator(sel.winMessage).textContent()) ?? '') !== '') return;
      await press(page, sel.hint);
    }
    await notEmpty(sel.winMessage)(page);
  },
  confirm: async (page) => {
    await press(page, sel.emptyCell);
    await press(page, sel.newPuzzle);
    await page.locator(`${sel.dialog}[open]`).waitFor();
  },
  four: (page) => startPuzzle(page, 4, 1),
  eight: (page) => startPuzzle(page, 8, 1),
  level: (page) => startPuzzle(page, 8, 4),
  setup: async (page) => {
    await startPuzzle(page, 6, 2);
    await openSheet(page);
  },
  'setup-four': async (page) => {
    await startPuzzle(page, 4, 1);
    await openSheet(page);
  },
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

async function ensureServer(localUrl) {
  if (server) return;
  const port = new URL(localUrl).port;
  server = spawn('npx', ['vite', 'preview', '--port', port, '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(localUrl);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite preview did not answer on ${localUrl} within 30 s (run "npm run build" first)`);
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
    await page.addInitScript(
      ({ start, theme }) => {
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
      { start: SEED, theme: manual ?? null },
    );
    await page.goto(url, { waitUntil: 'load' });
    await page.locator(sel.board).first().waitFor();
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
