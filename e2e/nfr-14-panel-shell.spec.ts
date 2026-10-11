// @trace NFR-14
// @trace FR-65
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, resolve, sep } from 'node:path';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { sel } from './helpers';

// update-panel-shell (NFR-14, FR-65, A-57; G2 panel shell, the ADDED requirements «The panels take the shared surface paint» and «The page root carries
// the board size»). Written FIRST (red) from openspec/changes/update-panel-shell/specs/play-page/spec.md, before the port.
//
// Part 1, the paint: the built page (Playwright's webServer, baseURL) and the DESIGN build, served by this file from design/v0/out, open the same surface
// and the test compares, for the surface element, getComputedStyle `background-color`, `border-top-color` and `box-shadow` (layer by layer: the same colour
// with each channel within 1 and the alpha within 0.005, the same offsets, blur and spread in px); and, in the setup sheet and the settings panel, the fill
// of «Закрити» and, for the setup sheet, the box-shadow of the footer strip (`::before`). The other `nfr-14-*` tests read frozen files; this one reads the
// design live because the shell adds no freeze case (decision 9 of design.md). The design server listens on a port chosen by the operating system (never
// 4173, 4174, 4176 or 4177, which the page preview and the capture tools bind) and serves nothing outside the build folder (the path guard of
// scripts/freeze-design-geometry.mjs). A missing design/v0/out/index.html FAILS the test with the build instruction; it is never skipped.
//
// Part 2, the hook: the built page, with the design's 4x4, 6x6 and 8x8 fixture boards (FR-119), shows the five size-dependent layout variables
// (--n, --cell-max, --board-gap, --board-pad, --board-width) with the same non-empty value on [data-board] and on the settings panel (an element outside the
// board, inside the root), and --n equal to the board's size.
//
// Both sides use the browser setup of playwright.config.ts (Desktop Chrome, reduced motion, the colour scheme on the browser context, no stored preference).
// A surface is opened and asserted open (the popover is `:popover-open`, the dialog has `open`) BEFORE it is read, so a closed surface never yields the
// `display: none` values; the test never passes on a surface it did not open.
//
// Sampling (declared below as SAMPLING): the surfaces (rules, setup sheet, settings, confirmation), the schemes (light, dark) and the viewports 375x812 and
// 1024x768, 16 cases of the paint; and the board sizes (4, 6, 8) by the two viewports, 6 cases of the hook. Coverage is sampled. Nothing between the two
// viewports, no hover, no focus state and no other board is looked at. The stricter instruments that run before a block-done claim are the per-block pixel
// crop of scripts/visual-block.mjs and the per-shot gate (npm run check:visual), and then the full computed-style diff of every element of the surfaces
// (docs/qa/visual-diff/README.md). This test claims no pixel score for any shot.

type Scheme = 'light' | 'dark';
type Surface = 'rules' | 'setup' | 'settings' | 'confirm';

const SCHEMES: Scheme[] = ['light', 'dark'];
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1024, height: 768 },
] as const;
const SURFACES: Surface[] = ['rules', 'setup', 'settings', 'confirm'];
const SIZES = [4, 6, 8] as const;

const SAMPLING = {
  dimensions: ['surface', 'scheme', 'viewport'],
  surfaces: SURFACES,
  schemes: SCHEMES,
  viewports: ['375x812', '1024x768'],
  paintCases: 16,
  hookDimensions: ['board size', 'viewport'],
  hookCases: 6,
  coverage: 'sampled',
  stricterInstruments: ['scripts/visual-block.mjs', 'npm run check:visual'],
} as const;

/** The ports the page preview and the capture tools bind: the design server must never use one of them. */
const FORBIDDEN_PORTS = [4173, 4174, 4176, 4177];

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
// Reading and comparing computed paint
// ---------------------------------------------------------------------------------------------------------

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
interface ShadowLayer {
  colour: Rgba;
  inset: boolean;
  /** x offset, y offset, blur, spread in px */
  lengths: [number, number, number, number];
  text: string;
}

function parseColour(text: string): Rgba {
  const m = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/.exec(text);
  if (m?.[1] === undefined || m[2] === undefined || m[3] === undefined) throw new Error(`not an rgb(a) colour: "${text}"`);
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
}

/** The layers of a computed `box-shadow`, split on the top-level commas. `none` gives no layer. */
function parseShadow(text: string): ShadowLayer[] {
  if (text.trim() === 'none' || text.trim() === '') return [];
  const layers: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      layers.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  layers.push(current.trim());
  return layers.map((layer) => {
    const colourMatch = /rgba?\([^)]*\)/.exec(layer);
    if (colourMatch === null) throw new Error(`a shadow layer with no rgb(a) colour: "${layer}"`);
    const rest = layer.replace(colourMatch[0], ' ');
    const lengths = (rest.match(/-?[\d.]+px|(?<![\d.])-?0(?![\d.])/g) ?? []).map((v) => Number.parseFloat(v));
    while (lengths.length < 4) lengths.push(0);
    return { colour: parseColour(colourMatch[0]), inset: /\binset\b/.test(rest), lengths: [lengths[0] ?? 0, lengths[1] ?? 0, lengths[2] ?? 0, lengths[3] ?? 0], text: layer };
  });
}

/** Colours equal with every channel within 1 (the alpha within 0.005); returns the difference or null. */
function colourDifference(page: string, design: string): string | null {
  const [a, b] = [parseColour(page), parseColour(design)];
  const channelsOk = Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1;
  const alphaOk = Math.abs(a.a - b.a) <= 0.005;
  return channelsOk && alphaOk ? null : `page ${page} against design ${design}`;
}

/** Shadows equal layer by layer: the same colour (alpha within 0.005, channels within 1) and the same offsets, blur and spread in px. */
function shadowDifference(page: string, design: string): string | null {
  const [a, b] = [parseShadow(page), parseShadow(design)];
  if (a.length !== b.length) return `page has ${a.length} shadow layer(s) "${page}", design has ${b.length} "${design}"`;
  for (let i = 0; i < a.length; i += 1) {
    const [pa, pb] = [a[i], b[i]];
    if (pa === undefined || pb === undefined) continue;
    const colour = colourDifference(`rgba(${pa.colour.r}, ${pa.colour.g}, ${pa.colour.b}, ${pa.colour.a})`, `rgba(${pb.colour.r}, ${pb.colour.g}, ${pb.colour.b}, ${pb.colour.a})`);
    if (colour !== null) return `layer ${i + 1} colour: ${colour} (page "${pa.text}", design "${pb.text}")`;
    if (pa.inset !== pb.inset || pa.lengths.some((v, k) => Math.abs(v - (pb.lengths[k] ?? 0)) > 0.01)) {
      return `layer ${i + 1} geometry: page "${pa.text}", design "${pb.text}"`;
    }
  }
  return null;
}

interface Paint {
  fill: string;
  border: string;
  shadow: string;
}

const SELECTORS: Record<Surface, string> = {
  rules: '[data-section="rules"]',
  setup: '[data-section="setup"]',
  settings: '[data-section="settings"]',
  confirm: 'dialog[data-dialog="confirm"]',
};
/** The open state of each surface (a popover is `:popover-open`, the dialog has `open`). */
const OPEN: Record<Surface, string> = {
  rules: `${SELECTORS.rules}:popover-open`,
  setup: `${SELECTORS.setup}:popover-open`,
  settings: `${SELECTORS.settings}:popover-open`,
  confirm: `${SELECTORS.confirm}[open]`,
};
/** The design's routes, which show each surface open at load. */
const ROUTES: Record<Surface, string> = { rules: '/rules/', setup: '/setup/', settings: '/settings/', confirm: '/confirm/' };
const CLOSE_BUTTON: Partial<Record<Surface, string>> = { setup: '[data-action="setup-close"]', settings: '[data-action="settings-close"]' };

/** What a case reads from one side: the surface, then (setup, settings) the close button's fill, and (setup) the strip's shadow. */
interface Reading {
  surface: Paint;
  closeFill: string | null;
  stripShadow: string | null;
}

async function read(page: Page, surface: Surface): Promise<Reading> {
  const open = page.locator(OPEN[surface]);
  await expect(open, `${surface}: the surface is open before it is read`).toBeVisible();
  const paintOf = (selector: string, pseudo: string | null): Promise<Paint> =>
    page.locator(selector).evaluate(
      (el, p) => {
        const s = getComputedStyle(el, p);
        return { fill: s.backgroundColor, border: s.borderTopColor, shadow: s.boxShadow };
      },
      pseudo,
    );
  const surfacePaint = await paintOf(OPEN[surface], null);
  const closeSelector = CLOSE_BUTTON[surface];
  const closeFill = closeSelector === undefined ? null : (await paintOf(`${OPEN[surface]} ${closeSelector}`, null)).fill;
  const stripShadow = surface === 'setup' ? (await paintOf(OPEN[surface], '::before')).shadow : null;
  return { surface: surfacePaint, closeFill, stripShadow };
}

/** The design's fixture board of the scheme and state, as the page's capture-only board (FR-119). */
interface PaintFixture {
  cases: { shot: string; captureBoard: unknown }[];
}
const designFixture = JSON.parse(readFileSync('quality/design-paint.json', 'utf8')) as PaintFixture;

function captureBoardOf(shot: string): unknown {
  const found = designFixture.cases.find((c) => c.shot === shot);
  if (found === undefined) throw new Error(`quality/design-paint.json has no case ${shot} (the design's fixture board)`);
  return found.captureBoard;
}

async function openPageWithBoard(page: Page, scheme: Scheme, width: number, height: number, shot: string): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.addInitScript((board: unknown) => {
    (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = board;
  }, captureBoardOf(shot));
  await page.goto('/');
  await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
  // the scheme reached the page: with no stored preference the head step resolves the system scheme (a dark case must not run on the light page)
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), `${scheme}: the page resolved the colour scheme`).toBe(scheme);
}

/** Open a surface of the built page by the press the capture uses (e2e/nfr-14-backdrop.spec.ts). */
async function openPageSurface(page: Page, surface: Surface): Promise<void> {
  const press: Record<Surface, string> = { rules: sel.rules, setup: sel.summary, settings: sel.settings, confirm: sel.newPuzzle };
  // a script click, as the capture adapter does; the fixture board has entries, so «Нова головоломка» asks first (FR-67)
  await page.locator(press[surface]).first().evaluate((el: HTMLElement) => {
    el.click();
  });
  await page.locator(OPEN[surface]).waitFor();
}

// ---------------------------------------------------------------------------------------------------------
// The spec's literal expectations (the design's values, written out so that a change of the design build surfaces here too)
// ---------------------------------------------------------------------------------------------------------

const FILL: Record<Scheme, string> = { light: 'rgb(255, 253, 248)', dark: 'rgb(44, 38, 32)' };
const PANEL_BORDER: Record<Scheme, string> = { light: 'rgb(226, 219, 204)', dark: 'rgb(138, 127, 113)' };
const DIALOG_BORDER: Record<Scheme, string> = { light: 'rgb(140, 131, 116)', dark: 'rgb(138, 127, 113)' };

// ---------------------------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------------------------

// GUARD: describes this file's own matrix and the design build, not the page, so the matrix part is green by construction; it fails (it does not skip)
// when design/v0/out is missing, with the build instruction.
test('@trace NFR-14 the design build is required and the coverage is declared: sampling dimensions, coverage sampled, the stricter instruments named', () => {
  requireDesignBuild();
  expect(SAMPLING.coverage).toBe('sampled');
  expect(SAMPLING.dimensions).toEqual(['surface', 'scheme', 'viewport']);
  expect(SURFACES.length * SCHEMES.length * VIEWPORTS.length, 'the paint cases').toBe(SAMPLING.paintCases);
  expect(SIZES.length * VIEWPORTS.length, 'the hook cases').toBe(SAMPLING.hookCases);
  expect(SAMPLING.stricterInstruments).toEqual(['scripts/visual-block.mjs', 'npm run check:visual']);
  const text = readFileSync('e2e/nfr-14-panel-shell.spec.ts', 'utf8');
  expect(text, 'the file names the stricter instruments').toContain('scripts/visual-block.mjs');
  expect(text).toContain('npm run check:visual');
  // the file claims nothing beyond a sample (the phrases are assembled so that this check does not match its own text)
  const claims = new RegExp(['contin' + 'uum', 'all ' + 'widths', 'all ' + 'surfaces', 'pixel ' + 'floor'].join('|'), 'i');
  expect(text, 'the file claims nothing beyond a sample of the surfaces, schemes and viewports').not.toMatch(claims);
});

test.describe('paint: the four surfaces against the design build', () => {
  let design: { server: Server; url: string; port: number } | null = null;

  test.beforeAll(async () => {
    design = await startDesignServer(); // throws with the build instruction when design/v0/out is missing
  });

  test.afterAll(async () => {
    await stopDesignServer(design?.server ?? null);
    design = null;
  });

  test('@trace NFR-14 the design server listens on a port chosen by the operating system, not on one the page preview or the capture tools bind', () => {
    expect(design, 'the design server started').not.toBeNull();
    expect(design?.server.listening, 'the design server is listening').toBe(true);
    expect(design?.port ?? 0, 'an ephemeral port').toBeGreaterThan(1023);
    expect(FORBIDDEN_PORTS, 'not 4173, 4174, 4176 or 4177').not.toContain(design?.port);
  });

  for (const scheme of SCHEMES) {
    test.describe(`${scheme} scheme`, () => {
      test.use({ colorScheme: scheme });

      for (const viewport of VIEWPORTS) {
        for (const surface of SURFACES) {
          const name = `${scheme} ${surface} ${viewport.width}x${viewport.height}`;
          test(`@trace NFR-14 @trace FR-65 ${name}: the fill, the border colour and the shadow equal the design's`, async ({ page, browser }) => {
            expect(design, 'the design server started').not.toBeNull();
            const designUrl = design?.url ?? '';

            // the design side, in its own page of the same context settings
            const context = await browser.newContext({ colorScheme: scheme, reducedMotion: 'reduce', viewport });
            let want: Reading;
            try {
              const designPage = await context.newPage();
              await designPage.goto(`${designUrl}${ROUTES[surface]}`);
              want = await read(designPage, surface);
            } finally {
              await context.close();
            }

            // the page side
            await openPageWithBoard(page, scheme, viewport.width, viewport.height, `1024-${scheme}-default`);
            await openPageSurface(page, surface);
            const have = await read(page, surface);

            // the spec's literals, so that a design that drifted shows up here and not only as an equal pair
            expect(want.surface.fill, `${name}: the design's fill is the spec's`).toBe(FILL[scheme]);
            expect(want.surface.border, `${name}: the design's border colour is the spec's`).toBe((surface === 'confirm' ? DIALOG_BORDER : PANEL_BORDER)[scheme]);
            // Review fix round 1 (wf_6f799240-65c, contested finding): the design's shadow is anchored to the spec's literals too, so a drift
            // in the design shows up here: the panels below 48rem take 0 -8px 32px 0 at 0.18, the panels from 48rem and the dialog 0 16px 40px 0 at 0.25.
            const sheetShadow = surface !== 'confirm' && viewport.width < 768;
            expect(want.surface.shadow.replace(/\s+/g, ' ').trim(), `${name}: the design's shadow is the spec's`).toBe(
              sheetShadow ? 'rgba(0, 0, 0, 0.18) 0px -8px 32px 0px' : 'rgba(0, 0, 0, 0.25) 0px 16px 40px 0px',
            );

            // the compared values, each reported with the surface, the scheme, the viewport and both strings
            const differences: string[] = [];
            const note = (label: string, difference: string | null): void => {
              if (difference !== null) differences.push(`${label}: ${difference}`);
            };
            note('fill', colourDifference(have.surface.fill, want.surface.fill));
            note('border-top-color', colourDifference(have.surface.border, want.surface.border));
            note('box-shadow', shadowDifference(have.surface.shadow, want.surface.shadow));
            if (want.closeFill !== null) note('«Закрити» fill', colourDifference(have.closeFill ?? 'none', want.closeFill));
            if (want.stripShadow !== null) note('footer strip box-shadow', shadowDifference(have.stripShadow ?? 'none', want.stripShadow));
            expect(differences, `${name}: the surface paint differs from the design`).toEqual([]);
          });
        }
      }
    });
  }
});

test.describe('hook: a panel outside the board reads the board\'s variables', () => {
  const VARIABLES = ['--n', '--cell-max', '--board-gap', '--board-pad', '--board-width'] as const;
  const SHOT: Record<(typeof SIZES)[number], string> = { 4: '1024-light-four', 6: '1024-light-default', 8: '1024-light-eight' };

  for (const viewport of VIEWPORTS) {
    for (const size of SIZES) {
      test(`@trace FR-43 @trace FR-57 @trace FR-96 ${size}x${size} at ${viewport.width}x${viewport.height}: the five variables are equal on the board and on the settings panel, and --n is the board's size`, async ({ page }) => {
        await openPageWithBoard(page, 'light', viewport.width, viewport.height, SHOT[size]);
        await expect(page.locator(`${sel.board}[data-size="${size}"]`), `premise: the ${size}x${size} fixture board is shown`).toBeVisible();
        // open the panel so that the element is rendered, as in the scenario ("an element outside the board, inside the root")
        await openPageSurface(page, 'settings');
        const values = await page.evaluate(
          ({ names, board, panel }) => {
            const read = (selector: string): Record<string, string> => {
              const el = document.querySelector(selector);
              if (el === null) throw new Error(`no element matches ${selector}`);
              const style = getComputedStyle(el);
              return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]));
            };
            return { board: read(board), panel: read(panel) };
          },
          { names: [...VARIABLES], board: sel.board, panel: SELECTORS.settings },
        );
        for (const name of VARIABLES) {
          expect(values.board[name], `${name} is non-empty on the board`).not.toBe('');
          expect(values.panel[name], `${name} is non-empty on the settings panel`).not.toBe('');
          expect(values.panel[name], `${name} is equal on the settings panel and on the board`).toBe(values.board[name]);
        }
        expect(values.panel['--n'], '--n is the size of the board').toBe(String(size));
      });
    }
  }
});
