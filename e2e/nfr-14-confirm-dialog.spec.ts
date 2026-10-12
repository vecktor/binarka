// @trace NFR-14
// @trace FR-67
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, resolve, sep } from 'node:path';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { sel } from './helpers';

// update-confirm-dialog (NFR-14, FR-67, FR-65, A-62; G2 dialog block, the ADDED requirement «The confirmation dialog takes the design's size, place and paint»,
// its scenarios «The dialog's boxes equal the design's at the five confirm widths», «The buttons' computed paint equals the design's in light and dark»,
// «Both buttons are at least 44 px tall and wide» and «The sampled coverage and the design build are declared and required»). Written FIRST (red) from
// openspec/changes/update-confirm-dialog/specs/play-page/spec.md, before the port.
//
// Part 1, the fixture and the boxes: quality/design-geometry.json holds the key `confirmDialog` (scripts/freeze-design-geometry.mjs, task 3.1) with 5 cases.
// While the key is absent the tests FAIL with the freeze instruction; they are never skipped. Each case opens the page at the case's viewport with the case's
// capture board (FR-119, as the pixel capture does), presses «Нова головоломка» (the board has entries, so it asks first, FR-67), asserts the dialog is `[open]`,
// and compares every edge of the boxes of the dialog, of its text `p`, of «Так, почати» and of «Скасувати» with the case's recorded design boxes within the
// fixture's tolerance. A miss prints the case, the element and both boxes. The recorded structure is asserted too: 296x218 at 320, 343x166 at 375, 352x166 from
// 768; «Скасувати» above «Так, почати» (both 246x44) at 320, side by side with «Так, почати» on the left elsewhere.
//
// Part 2, the paint: the built page (Playwright's webServer, baseURL) and the DESIGN build, served by this file from design/v0/out, open the dialog (the design's
// route /confirm/ shows it open at load; the page presses «Нова головоломка» on the fixture board) and the test compares, for both buttons, getComputedStyle
// `color`, `background-color`, `border-top-color` (each channel within 1) and `border-top-width` (`2px` on both sides), in the light and the dark scheme at
// 375x812 and 1024x768. The design side is also pinned to the spec's literal rgb() strings, so a drift of the design shows up here. The design server listens on
// a port chosen by the operating system (never one of the session's capture ports, BINARKA_PORT_BASE + 0, 1, 3 or 4) and serves nothing outside the build folder
// (the path guard of scripts/freeze-design-geometry.mjs). A missing design/v0/out/index.html FAILS with the build instruction; it is never skipped. The dialog is
// asserted open BEFORE it is read, on both sides, so the test never passes on a dialog it did not open.
//
// Part 3, the targets: at the five viewports of Part 1 both buttons are at least 44 px wide and 44 px tall (within the tolerance), read from the page alone (no
// fixture, no design build), so the old 46px height fails here even while the other parts wait for their inputs.
//
// Both sides use the browser setup of playwright.config.ts (Desktop Chrome, reduced motion, the colour scheme on the browser context, no stored preference).
//
// Sampling dimensions (declared below as SAMPLING): for the boxes, the viewport (the five confirm widths of review-set-14: 320x700, 375x812, 768x1024, 1024x768,
// 1440x900; the set has no 1366 confirm shot) in the light scheme; for the paint, the colour scheme (light, dark) and the viewport (375x812, 1024x768), four
// cases; for the targets, the same five viewports. Coverage is `sampled`. Nothing between those viewports, no hover or press state, no other board and no other
// dialog is looked at. The stricter instruments, to run before a block-done claim, are the per-block pixel crop and geometry channel of
// scripts/visual-block.mjs (block `confirm`) and the per-shot gate (npm run check:visual), and after those the full computed-style diff of every element of the
// dialog (docs/qa/visual-diff/README.md). This file asserts no pixel score for any shot.

type Scheme = 'light' | 'dark';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface ConfirmCase {
  shot: string;
  width: number;
  height: number;
  state: string;
  captureBoard: unknown;
  afterLoad?: string;
  boxes: Record<string, Box | null>;
}
interface ConfirmKey {
  selectors: string[];
  coverage: string;
  provenance: Record<string, unknown>;
  cases: ConfirmCase[];
}
interface Fixture {
  provenance: { designCommit: string; designCssSha1: string };
  tolerancePx: number;
  selectors: string[];
  cases: { shot: string; state: string; captureBoard: unknown }[];
  rulesPanel?: { cases: unknown[] };
  setupSheet?: { cases: unknown[] };
  confirmDialog?: ConfirmKey;
}

const fixture = JSON.parse(readFileSync('quality/design-geometry.json', 'utf8')) as Fixture;

const DIALOG = 'dialog[data-dialog="confirm"]';
const TEXT = 'dialog[data-dialog="confirm"] p';
const YES = '[data-confirm="yes"]';
const NO = '[data-confirm="no"]';
const SELECTORS = [DIALOG, TEXT, YES, NO];
const ELEMENT_NAME: Record<string, string> = { [DIALOG]: 'the dialog', [TEXT]: 'its text', [YES]: '«Так, почати»', [NO]: '«Скасувати»' };
const OPEN = `${DIALOG}[open]`;
const FREEZE =
  'run `BINARKA_PORT_BASE=<your base> node scripts/freeze-design-geometry.mjs` (task 3.1 of openspec/changes/update-confirm-dialog/tasks.md; design/v0/out must be built) to add the key confirmDialog to quality/design-geometry.json';

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;
const PAINT_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1024, height: 768 },
] as const;
const SCHEMES: Scheme[] = ['light', 'dark'];
const shotOf = (width: number): string => `${width}-light-confirm`;
const EXPECTED_SHOTS = VIEWPORTS.map((v) => shotOf(v.width)).sort();

const SAMPLING = {
  dimensions: ['viewport', 'colour scheme'],
  boxViewports: VIEWPORTS.map((v) => `${v.width}x${v.height}`),
  boxScheme: 'light',
  paintSchemes: SCHEMES,
  paintViewports: PAINT_VIEWPORTS.map((v) => `${v.width}x${v.height}`),
  paintCases: 4,
  targetViewports: VIEWPORTS.map((v) => `${v.width}x${v.height}`),
  coverage: 'sampled',
  stricterInstruments: ['scripts/visual-block.mjs', 'npm run check:visual'],
} as const;

/** The ports the page preview and the capture tools bind (scripts/capture-ports.mjs, PD-4): the design server must never use one of them. */
const PORT_BASE = process.env.BINARKA_PORT_BASE ? Number(process.env.BINARKA_PORT_BASE) : 4173;
const FORBIDDEN_PORTS = [0, 1, 3, 4].map((offset) => PORT_BASE + offset);

// The top-level fixture as it stood before this change: the key is ADDED, nothing else moves (tasks.md 3.1).
const TOP_LEVEL_DESIGN_COMMIT = '5e61bfd14de56bff4b3726db4ddd624fcd3c2e04';
const TOP_LEVEL_DESIGN_CSS_SHA1 = 'd1b1255f4dff205d15d64850096429cd377e5fbf';
// SHA-1 of JSON.stringify of the keys rulesPanel and setupSheet as main 18e5f3f records them (cases, selectors, provenance, deviations): the
// refreeze that adds confirmDialog must leave both byte-identical, provenance included (review gate of update-confirm-dialog, fix round 1).
const UNCHANGED_KEY_SHA1: Record<'rulesPanel' | 'setupSheet', string> = {
  rulesPanel: '0f2164d58abec6e740d6da18d987dbc787c722ad',
  setupSheet: '6dc8dda1101585031e93471a6d5f1fa885ebf32c',
};

const isBox = (v: unknown): v is Box => {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Record<string, unknown>;
  return ['x', 'y', 'w', 'h'].every((k) => typeof b[k] === 'number' && Number.isFinite(b[k]));
};
const fmt = (b: Box | null | undefined): string => (b ? `${b.x.toFixed(2)},${b.y.toFixed(2)} ${b.w.toFixed(2)}x${b.h.toFixed(2)}` : 'absent');
const close = (a: number, b: number, tolerance = fixture.tolerancePx): boolean => Math.abs(a - b) <= tolerance;

// ---------------------------------------------------------------------------------------------------------
// The design server (path guard of scripts/freeze-design-geometry.mjs)
// ---------------------------------------------------------------------------------------------------------

const DESIGN_ROOT = 'design/v0/out';
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain',
};

/** FAIL (never skip) with the build instruction when the design build is absent. */
function requireDesignBuild(): void {
  if (!existsSync(join(DESIGN_ROOT, 'index.html'))) {
    throw new Error(
      `${DESIGN_ROOT}/index.html is missing: build the design first. Run \`pnpm build\` in design/v0 (design/README.md: corepack enable, pnpm install --frozen-lockfile, pnpm build), then run this test again.`,
    );
  }
}

/** A static file server on `127.0.0.1` and a port chosen by the operating system; nothing outside the build folder is served. */
async function startDesignServer(): Promise<{ server: Server; url: string; port: number }> {
  requireDesignBuild();
  const rootAbs = resolve(DESIGN_ROOT);
  const server = createServer((req, res) => {
    let path: string;
    try {
      path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
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
  await new Promise<void>((done, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', done);
  });
  const port = (server.address() as AddressInfo).port;
  return { server, url: `http://127.0.0.1:${port}`, port };
}

async function stopDesignServer(server: Server | null): Promise<void> {
  if (server === null) return;
  server.closeAllConnections();
  await new Promise<void>((done) => {
    server.close(() => {
      done();
    });
  });
}

// ---------------------------------------------------------------------------------------------------------
// The page side
// ---------------------------------------------------------------------------------------------------------

/** The capture board when the fixture key has no case for the shot: the design's default fixture board of the same width (the adapter's `confirm` state uses the same fixture, FR-119). */
function fallbackBoard(width: number): unknown {
  const found = fixture.cases.find((c) => c.shot === `${width}-light-default`);
  if (found === undefined) throw new Error(`quality/design-geometry.json has no top-level case ${width}-light-default to take the fixture board from`);
  return found.captureBoard;
}

async function loadPage(page: Page, width: number, height: number, board: unknown): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.addInitScript((b: unknown) => {
    (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = b;
  }, board);
  await page.goto('/');
  await expect(page.locator('[data-board] [data-cell]').first(), 'premise: the fixture board is shown').toBeVisible();
}

/** Press «Нова головоломка» (a script click, as the capture adapter does) and assert that the dialog is open: the fixture board has entries, so it asks first (FR-67). */
async function openDialog(page: Page): Promise<void> {
  await page.locator(sel.newPuzzle).evaluate((el: HTMLElement) => {
    el.click();
  });
  await expect(page.locator(OPEN), 'the confirmation dialog is open ([open]) before it is read').toHaveCount(1);
}

async function readBoxes(page: Page): Promise<(Box | null)[]> {
  return page.evaluate(
    (selectors: string[]) =>
      selectors.map((s) => {
        const el = document.querySelector(s);
        if (el === null) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    SELECTORS,
  );
}

// ---------------------------------------------------------------------------------------------------------
// The sampling and the build are declared (scenario «The sampled coverage and the design build are declared and required»)
// ---------------------------------------------------------------------------------------------------------

// GUARD: this test describes the file itself (and the design build), so the matrix part is green by construction; it fails (it does not skip) when
// design/v0/out is missing, with the build instruction.
test('@trace NFR-14 the design build is required and the coverage is declared: sampling dimensions, coverage sampled, the stricter instruments named, nothing beyond a sample claimed', () => {
  requireDesignBuild();
  expect(SAMPLING.coverage).toBe('sampled');
  expect(SAMPLING.dimensions).toEqual(['viewport', 'colour scheme']);
  expect(SAMPLING.boxViewports, 'the five confirm widths of review-set-14').toEqual(['320x700', '375x812', '768x1024', '1024x768', '1440x900']);
  expect(SAMPLING.paintViewports).toEqual(['375x812', '1024x768']);
  expect(SAMPLING.paintSchemes.length * SAMPLING.paintViewports.length, 'the paint cases').toBe(SAMPLING.paintCases);
  expect(SAMPLING.stricterInstruments).toEqual(['scripts/visual-block.mjs', 'npm run check:visual']);
  const text = readFileSync('e2e/nfr-14-confirm-dialog.spec.ts', 'utf8');
  expect(text, 'the file names the stricter instruments').toContain('scripts/visual-block.mjs');
  expect(text).toContain('npm run check:visual');
  expect(text, 'the file names the block of the per-block tool').toContain('block `confirm`');
  // the file claims nothing beyond a sample (the phrases are assembled so that this check does not match its own text)
  const claims = new RegExp(['contin' + 'uum', 'all ' + 'widths', 'every ' + 'width', 'pixel ' + 'floor'].join('|'), 'i');
  expect(text, 'the file claims nothing beyond a sample of the viewports and schemes, and no pixel score').not.toMatch(claims);
});

// ---------------------------------------------------------------------------------------------------------
// Part 1: the fixture
// ---------------------------------------------------------------------------------------------------------

// GUARD: green today. The key is ADDED; the 32 top-level shots, the selectors, the tolerance, the design hashes and the other two keys do not move.
test('@trace NFR-14 @trace FR-67 the fixture keeps its 32 top-level shots, tolerance, design hashes and the keys rulesPanel (8 cases) and setupSheet (12 cases): the key is ADDED, nothing else changes', () => {
  expect(fixture.cases, 'the top-level cases of quality/design-geometry.json').toHaveLength(32);
  expect(fixture.cases.some((c) => c.shot.includes('confirm')), 'no confirm shot is among the top-level cases').toBe(false);
  expect(fixture.tolerancePx).toBe(0.5);
  expect(fixture.provenance.designCommit, 'the top-level provenance keeps the design commit').toBe(TOP_LEVEL_DESIGN_COMMIT);
  expect(fixture.provenance.designCssSha1, 'the top-level provenance keeps the design CSS hash').toBe(TOP_LEVEL_DESIGN_CSS_SHA1);
  expect(fixture.rulesPanel?.cases, 'rulesPanel keeps its 8 cases').toHaveLength(8);
  expect(fixture.setupSheet?.cases, 'setupSheet keeps its 12 cases').toHaveLength(12);
  for (const key of ['rulesPanel', 'setupSheet'] as const) {
    const sha1 = createHash('sha1').update(JSON.stringify(fixture[key])).digest('hex');
    expect(sha1, `${key} is byte-identical to main 18e5f3f, provenance included (a refreeze keeps a key's recorded provenance while its cases are unchanged)`).toBe(UNCHANGED_KEY_SHA1[key]);
  }
  expect(fixture.selectors, 'the top-level selectors name no confirm element').not.toContain(DIALOG);
});

// Red today: the key is absent.
test('@trace NFR-14 @trace FR-67 the fixture holds the key confirmDialog: the four selectors, sampled coverage, its own provenance and the 5 cases with the recorded structure', () => {
  const key = fixture.confirmDialog;
  expect(key, `quality/design-geometry.json has no key "confirmDialog": ${FREEZE}`).toBeDefined();
  if (key === undefined) return;

  expect(key.coverage, 'the key declares sampled coverage').toBe('sampled');
  expect(key.selectors, 'the key names the dialog, its text and the two buttons').toEqual(SELECTORS);
  for (const field of ['designCommit', 'designCssSha1', 'designBuildSha1', 'browser']) {
    const value = key.provenance[field];
    expect(typeof value === 'string' && value !== '', `confirmDialog.provenance.${field} is a non-empty string (got ${JSON.stringify(value)})`).toBe(true);
  }
  expect([key.provenance.designCommit, key.provenance.designCssSha1], 'the key names the same design as the top-level provenance').toEqual([
    fixture.provenance.designCommit,
    fixture.provenance.designCssSha1,
  ]);
  expect(key.cases.map((c) => c.shot).sort(), 'the shots of confirmDialog.cases').toEqual(EXPECTED_SHOTS);

  const problems: string[] = [];
  const dialogSize: Record<number, [number, number]> = { 320: [296, 218], 375: [343, 166], 768: [352, 166], 1024: [352, 166], 1440: [352, 166] };
  for (const v of VIEWPORTS) {
    const shot = shotOf(v.width);
    const c = key.cases.find((x) => x.shot === shot);
    if (c === undefined) {
      problems.push(`${shot}: no such case`);
      continue;
    }
    if (c.width !== v.width || c.height !== v.height) problems.push(`${shot}: viewport ${c.width}x${c.height}, expected ${v.width}x${v.height}`);
    if (c.state !== 'confirm') problems.push(`${shot}: state "${c.state}", expected "confirm"`);
    if (c.afterLoad !== 'open-confirm') problems.push(`${shot}: afterLoad "${String(c.afterLoad)}", expected the recorded action "open-confirm"`);
    if (!c.captureBoard) problems.push(`${shot}: the case holds no capture board`);
    const boxes = SELECTORS.map((s) => c.boxes[s]);
    SELECTORS.forEach((s, i) => {
      if (!isBox(boxes[i])) problems.push(`${shot}: boxes holds no box for ${s} (got ${JSON.stringify(boxes[i])})`);
    });
    const [dialog, , yes, no] = boxes;
    if (!isBox(dialog) || !isBox(yes) || !isBox(no)) continue;
    const [w, h] = dialogSize[v.width] ?? [0, 0];
    if (!close(dialog.w, w) || !close(dialog.h, h)) problems.push(`${shot}: the dialog is ${fmt(dialog)}, expected ${w}x${h}`);
    if (!close(yes.h, 44) || !close(no.h, 44)) problems.push(`${shot}: the buttons are ${fmt(yes)} and ${fmt(no)}, expected 44 tall`);
    if (v.width === 320) {
      if (!(no.y + no.h <= yes.y + fixture.tolerancePx)) problems.push(`${shot}: «Скасувати» ${fmt(no)} is not above «Так, почати» ${fmt(yes)}`);
      if (!close(yes.w, 246) || !close(no.w, 246)) problems.push(`${shot}: the buttons are ${fmt(yes)} and ${fmt(no)}, expected 246 wide`);
    } else {
      if (!close(yes.y, no.y)) problems.push(`${shot}: the buttons are not on one row: «Так, почати» ${fmt(yes)}, «Скасувати» ${fmt(no)}`);
      if (!(yes.x < no.x)) problems.push(`${shot}: «Так, почати» ${fmt(yes)} is not left of «Скасувати» ${fmt(no)}`);
    }
  }
  expect(problems, `confirmDialog: ${problems.length} problem(s) in the recorded cases`).toEqual([]);
});

// ---------------------------------------------------------------------------------------------------------
// Part 1: the boxes against the fixture, 5 cases (generated from the expected shot names, not from the fixture)
// ---------------------------------------------------------------------------------------------------------

for (const v of VIEWPORTS) {
  const shot = shotOf(v.width);
  test(`@trace NFR-14 @trace FR-67 ${shot} (${v.width}x${v.height}): the open dialog, its text and its two buttons match the design's boxes within the fixture's tolerance`, async ({ page }) => {
    const c = fixture.confirmDialog?.cases.find((x) => x.shot === shot);
    await loadPage(page, v.width, v.height, c?.captureBoard ?? fallbackBoard(v.width));
    await openDialog(page);
    const actual = await readBoxes(page);
    const problems: string[] = [];
    if (c === undefined) {
      problems.push(`quality/design-geometry.json has no confirmDialog case ${shot}: ${FREEZE}`);
    } else {
      SELECTORS.forEach((selector, i) => {
        const want = c.boxes[selector] ?? null;
        const got = actual[i] ?? null;
        if (want === null || got === null) {
          problems.push(`${shot} ${ELEMENT_NAME[selector]} (${selector}): ${want === null ? 'absent in the design' : 'missing on the page'}`);
          return;
        }
        const edges: [string, number, number][] = [
          ['left', got.x, want.x],
          ['top', got.y, want.y],
          ['right', got.x + got.w, want.x + want.w],
          ['bottom', got.y + got.h, want.y + want.h],
        ];
        const off = edges.filter(([, a, b]) => !close(a, b)).map(([name, a, b]) => `${name} ${a.toFixed(2)} vs ${b.toFixed(2)}`);
        if (off.length > 0) problems.push(`${shot} ${ELEMENT_NAME[selector]} (${selector}): page ${fmt(got)}, design ${fmt(want)} (${off.join('; ')})`);
      });
    }
    expect(problems, `${shot}: ${problems.length} problem(s)`).toEqual([]);
  });
}

// ---------------------------------------------------------------------------------------------------------
// Part 2: the paint against the design build
// ---------------------------------------------------------------------------------------------------------

interface Rgb {
  r: number;
  g: number;
  b: number;
}
function parseRgb(text: string): Rgb {
  const m = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/.exec(text.trim());
  if (m?.[1] === undefined || m[2] === undefined || m[3] === undefined) throw new Error(`not an rgb(a) colour: "${text}"`);
  if (m[4] !== undefined && Number(m[4]) !== 1) throw new Error(`a translucent colour where an opaque one is expected: "${text}"`);
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}
/** Colours equal with every channel within 1; returns the difference or null. */
function colourDifference(page: string, design: string): string | null {
  const [a, b] = [parseRgb(page), parseRgb(design)];
  return Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1 ? null : `page ${page} against design ${design}`;
}

interface ButtonPaint {
  color: string;
  background: string;
  border: string;
  borderWidth: string;
}
type ButtonName = 'yes' | 'no';
const BUTTON_SELECTOR: Record<ButtonName, string> = { yes: YES, no: NO };
const BUTTON_LABEL: Record<ButtonName, string> = { yes: '«Так, почати»', no: '«Скасувати»' };

async function readPaint(page: Page): Promise<Record<ButtonName, ButtonPaint>> {
  await expect(page.locator(OPEN), 'the dialog is open before it is read').toHaveCount(1);
  const read = (selector: string): Promise<ButtonPaint> =>
    page.locator(`${OPEN} ${selector}`).evaluate((el) => {
      const s = getComputedStyle(el);
      return { color: s.color, background: s.backgroundColor, border: s.borderTopColor, borderWidth: s.borderTopWidth };
    });
  return { yes: await read(YES), no: await read(NO) };
}

// The spec's literal expectations (the design's values, written out so that a change of the design build surfaces here too).
const LITERAL: Record<Scheme, Record<ButtonName, ButtonPaint>> = {
  light: {
    no: { color: 'rgb(255, 253, 248)', background: 'rgb(180, 70, 13)', border: 'rgb(180, 70, 13)', borderWidth: '2px' },
    yes: { color: 'rgb(143, 29, 23)', background: 'rgb(251, 228, 225)', border: 'rgb(179, 38, 30)', borderWidth: '2px' },
  },
  dark: {
    no: { color: 'rgb(26, 16, 7)', background: 'rgb(243, 154, 91)', border: 'rgb(243, 154, 91)', borderWidth: '2px' },
    yes: { color: 'rgb(255, 180, 171)', background: 'rgb(63, 35, 32)', border: 'rgb(255, 138, 125)', borderWidth: '2px' },
  },
};

interface PaintFixture {
  cases: { shot: string; captureBoard: unknown }[];
}
const designPaintFixture = JSON.parse(readFileSync('quality/design-paint.json', 'utf8')) as PaintFixture;
function paintBoard(shot: string): unknown {
  const found = designPaintFixture.cases.find((c) => c.shot === shot);
  if (found === undefined) throw new Error(`quality/design-paint.json has no case ${shot} (the design's fixture board)`);
  return found.captureBoard;
}

test.describe('paint: both buttons against the design build', () => {
  let design: { server: Server; url: string; port: number } | null = null;

  test.beforeAll(async () => {
    design = await startDesignServer(); // throws with the build instruction when design/v0/out is missing
  });

  test.afterAll(async () => {
    const server = design?.server ?? null;
    await stopDesignServer(server);
    // The scenario's clause "closed after the run" is checked, not assumed (review gate of update-confirm-dialog, fix round 1).
    if (server !== null) expect(server.listening, 'the design server is closed after the run').toBe(false);
    design = null;
  });

  test('@trace NFR-14 the design server listens on a port chosen by the operating system, not on one the page preview or the capture tools bind', () => {
    expect(design, 'the design server started').not.toBeNull();
    expect(design?.server.listening, 'the design server is listening').toBe(true);
    expect(design?.port ?? 0, 'an ephemeral port').toBeGreaterThan(1023);
    expect(FORBIDDEN_PORTS, `not ${FORBIDDEN_PORTS.join(', ')}`).not.toContain(design?.port);
  });

  for (const scheme of SCHEMES) {
    test.describe(`${scheme} scheme`, () => {
      test.use({ colorScheme: scheme });

      for (const viewport of PAINT_VIEWPORTS) {
        const name = `${scheme} ${viewport.width}x${viewport.height}`;
        test(`@trace NFR-14 @trace FR-67 @trace FR-65 ${name}: «Так, почати» and «Скасувати» take the design's color, background-color, border-top-color and 2px border`, async ({ page, browser }) => {
          expect(design, 'the design server started').not.toBeNull();

          // the design side, in its own context of the same settings; the route shows the dialog open at load, nothing is pressed
          const context = await browser.newContext({ colorScheme: scheme, reducedMotion: 'reduce', viewport });
          let want: Record<ButtonName, ButtonPaint>;
          try {
            const designPage = await context.newPage();
            await designPage.goto(`${design?.url ?? ''}/confirm/`);
            await designPage.locator(OPEN).waitFor();
            want = await readPaint(designPage);
          } finally {
            await context.close();
          }

          // the page side
          await loadPage(page, viewport.width, viewport.height, paintBoard(`1024-${scheme}-default`));
          // the scheme reached the page: with no stored preference the head step resolves the system scheme (a dark case must not run on the light page)
          expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), `${name}: the page resolved the colour scheme`).toBe(scheme);
          await openDialog(page);
          const have = await readPaint(page);

          const differences: string[] = [];
          for (const button of ['yes', 'no'] as const) {
            const label = `${BUTTON_LABEL[button]} (${BUTTON_SELECTOR[button]}) ${scheme} ${viewport.width}x${viewport.height}`;
            // the design side is the spec's literals, so that a design that drifted shows up here and not only as an equal pair
            for (const [property, key] of [['color', 'color'], ['background-color', 'background'], ['border-top-color', 'border'], ['border-top-width', 'borderWidth']] as const) {
              if (want[button][key] !== LITERAL[scheme][button][key]) {
                differences.push(`${label} ${property}: the design's ${want[button][key]} is not the spec's ${LITERAL[scheme][button][key]}`);
              }
            }
            // the compared values: page against design
            for (const [property, key] of [['color', 'color'], ['background-color', 'background'], ['border-top-color', 'border']] as const) {
              const difference = colourDifference(have[button][key], want[button][key]);
              if (difference !== null) differences.push(`${label} ${property}: ${difference}`);
            }
            if (have[button].borderWidth !== '2px' || want[button].borderWidth !== '2px') {
              differences.push(`${label} border-top-width: page ${have[button].borderWidth} against design ${want[button].borderWidth}, both must be 2px`);
            }
          }
          expect(differences, `${name}: the buttons' paint differs from the design`).toEqual([]);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------------------------------------
// Part 3: both buttons are at least 44 px wide and 44 px tall (page alone)
// ---------------------------------------------------------------------------------------------------------

for (const v of VIEWPORTS) {
  test(`@trace NFR-14 @trace FR-67 @trace NFR-12 ${v.width}x${v.height}: both dialog buttons are at least 44 px wide and 44 px tall (within the tolerance)`, async ({ page }) => {
    await loadPage(page, v.width, v.height, fixture.confirmDialog?.cases.find((x) => x.shot === shotOf(v.width))?.captureBoard ?? fallbackBoard(v.width));
    await openDialog(page);
    const boxes = await readBoxes(page);
    const problems: string[] = [];
    for (const [selector, name] of [[YES, '«Так, почати»'], [NO, '«Скасувати»']] as const) {
      const box = boxes[SELECTORS.indexOf(selector)] ?? null;
      if (box === null) {
        problems.push(`${v.width}x${v.height} ${name} (${selector}): missing on the page`);
        continue;
      }
      if (box.w < 44 - fixture.tolerancePx) problems.push(`${v.width}x${v.height} ${name}: ${box.w.toFixed(2)} px wide, at least 44 required (box ${fmt(box)})`);
      if (!close(box.h, 44)) problems.push(`${v.width}x${v.height} ${name}: ${box.h.toFixed(2)} px tall, 44 required within ${fixture.tolerancePx} px (box ${fmt(box)}; the old base-button padding made it 46)`);
    }
    expect(problems, `${v.width}x${v.height}: ${problems.length} problem(s)`).toEqual([]);
  });
}
