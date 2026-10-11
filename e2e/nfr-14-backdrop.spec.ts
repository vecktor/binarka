// @trace NFR-14
// @trace FR-65
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// update-page-backdrop (NFR-14, FR-65, A-57; G2 block 3, the ADDED requirement «The backdrops take the design's translucent tokens», scenario «An open
// surface dims the page to the composite»): the built page, in Chromium, with the browser setup of playwright.config.ts (Playwright's "Desktop Chrome",
// reduced motion, no stored preference, the colour scheme on the browser context), opens each surface over the design's fixture board (FR-119) and reads
// ONE pixel of a screenshot that no surface and no page content covers. The same pixel is read first with the surface closed: it must be the page colour,
// so a pixel that is under a surface or a card fails the case instead of passing by luck. Then the open pixel must be the composite of the surface's
// token over the page, within 1 per channel: soft over light rgb(208, 198, 186), strong over light rgb(146, 134, 122), soft over dark rgb(18, 15, 12),
// strong over dark rgb(15, 12, 9) (the composites are computed in docs and in tests/play-page-backdrop-stylesheet.test.ts; they are written out here
// because this file runs in Playwright and cannot import the vitest helpers).
//
// Sampling (declared below as SAMPLING): the surfaces (rules, setup sheet, settings, confirmation), the schemes (light, dark) and the viewport widths
// 375x812 (below 64rem) and 1024x768 (from 64rem) for the rules panel, 1024x768 for the other three: 10 cases. Coverage is sampled. Nothing between the
// two widths, no hover, no motion with no reduced-motion preference, and no page content under a surface is looked at; the stricter instruments are the
// per-block pixel crop of scripts/visual-block.mjs and the per-shot gate (npm run check:visual).
//
// `getComputedStyle(el, '::backdrop')` is readable in Chromium for a popover and for a dialog (checked on a spike before this file was written: it returns
// the backdrop's `background-color` and `opacity`), so each case also reads it, as a SECOND assertion: the effective colour (the background's alpha times
// the opacity, laid over the page) must be the same composite. It is never the only check: the pixel is.
//
// The screenshot is decoded here with node:zlib: the project has no PNG type declarations (tsc covers e2e/), and no dependency may be added.

type Scheme = 'light' | 'dark';
type Rgb = readonly [number, number, number];
type Surface = 'rules' | 'setup' | 'settings' | 'confirm';

interface BackdropCase {
  scheme: Scheme;
  surface: Surface;
  width: number;
  height: number;
  /** which token the surface takes at this width: the soft backdrop or the strong one */
  token: 'soft' | 'strong';
}

/** The page colour of each scheme (`--color-page`). */
const PAGE: Record<Scheme, Rgb> = { light: [247, 243, 234], dark: [26, 23, 20] };
/** The composite of each token over the page of each scheme, in sRGB per channel, rounded (the spec's four). */
const COMPOSITE: Record<Scheme, Record<'soft' | 'strong', Rgb>> = {
  light: { soft: [208, 198, 186], strong: [146, 134, 122] },
  dark: { soft: [18, 15, 12], strong: [15, 12, 9] },
};

const SAMPLING = {
  dimensions: ['surface', 'scheme', 'width'],
  surfaces: ['rules', 'setup', 'settings', 'confirm'],
  schemes: ['light', 'dark'],
  widths: [375, 1024],
  coverage: 'sampled',
  cases: 10,
} as const;

const SCHEMES: Scheme[] = ['light', 'dark'];
const CASES: BackdropCase[] = SCHEMES.flatMap((scheme) => [
  { scheme, surface: 'rules' as const, width: 375, height: 812, token: 'soft' as const },
  { scheme, surface: 'rules' as const, width: 1024, height: 768, token: 'strong' as const },
  { scheme, surface: 'setup' as const, width: 1024, height: 768, token: 'soft' as const },
  { scheme, surface: 'settings' as const, width: 1024, height: 768, token: 'soft' as const },
  { scheme, surface: 'confirm' as const, width: 1024, height: 768, token: 'strong' as const },
]);

/** How the capture presses each surface open (scripts/check-visual-parity-adapters.mjs): a script click, then the surface's open state is awaited. */
const OPENER: Record<Surface, { press: string; open: string }> = {
  rules: { press: '[data-action="rules"]', open: '[data-section="rules"]:popover-open' },
  setup: { press: '[data-action="setup"]', open: '[data-section="setup"]:popover-open' },
  settings: { press: '[data-action="settings"]', open: '[data-section="settings"]:popover-open' },
  // the fixture board has entries, so «Нова головоломка» asks first (FR-67)
  confirm: { press: '[data-action="new"]', open: 'dialog[data-dialog="confirm"][open]' },
};

/** The page content that paints: the pixel must lie outside every one of these (and outside the open surface). */
const CONTENT = '.page-header, .setup-button, .board-host, .buttons, .messages';

interface PaintFixture {
  cases: { shot: string; captureBoard: unknown }[];
}
const designFixture = JSON.parse(readFileSync('quality/design-paint.json', 'utf8')) as PaintFixture;

// GUARD (the next test): it describes this file's own matrix, not the page, so it is green by construction (docs/qa/update-page-backdrop/red-run.txt,
// section B). It pins the matrix against a silent edit: 10 cases, the declared dimensions, no claim beyond a sample.
test('@trace NFR-14 the sampling is declared: surfaces, schemes and widths; coverage sampled, with the 10 cases of the spec', () => {
  expect(SAMPLING.coverage).toBe('sampled');
  expect(SAMPLING.dimensions).toEqual(['surface', 'scheme', 'width']);
  expect(CASES, 'the cases').toHaveLength(SAMPLING.cases);
  expect(
    CASES.map((c) => `${c.scheme} ${c.surface} ${c.width} ${c.token}`).sort(),
    'the matrix: the rules panel at both widths, the other three at 1024, each in light and dark',
  ).toEqual(
    SCHEMES.flatMap((scheme) => [
      `${scheme} confirm 1024 strong`,
      `${scheme} rules 1024 strong`,
      `${scheme} rules 375 soft`,
      `${scheme} settings 1024 soft`,
      `${scheme} setup 1024 soft`,
    ]).sort(),
  );
  expect([...new Set(CASES.map((c) => c.surface))].sort()).toEqual([...SAMPLING.surfaces].sort());
  expect([...new Set(CASES.map((c) => c.width))].sort((a, b) => a - b)).toEqual([...SAMPLING.widths]);
  // the file claims nothing beyond a sample (the phrases are assembled so that this check does not match its own text)
  const claims = new RegExp(['contin' + 'uum', 'all ' + 'widths', 'all ' + 'surfaces', 'pixel ' + 'floor'].join('|'), 'i');
  expect(readFileSync('e2e/nfr-14-backdrop.spec.ts', 'utf8'), 'the file claims nothing beyond a sample of the surfaces, schemes and widths, and no per-shot score').not.toMatch(claims);
});

// ---------------------------------------------------------------------------------------------------------
// PNG decoding (8-bit, non-interlaced, RGB or RGBA: what Chromium writes) and the pixel read
// ---------------------------------------------------------------------------------------------------------

const byteAt = (bytes: Uint8Array, index: number): number => bytes[index] ?? 0;

/** The first pixel of a PNG screenshot as `[r, g, b]` (the screenshot of a 1x1 clip). */
function firstPixel(png: Buffer): Rgb {
  if (png.toString('latin1', 1, 4) !== 'PNG') throw new Error('the screenshot is not a PNG');
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const data: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('latin1', offset + 4, offset + 8);
    const chunk = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      const [depth, colourType, interlace] = [byteAt(chunk, 8), byteAt(chunk, 9), byteAt(chunk, 12)];
      if (depth !== 8 || interlace !== 0 || (colourType !== 2 && colourType !== 6)) {
        throw new Error(`unsupported PNG: bit depth ${depth}, colour type ${colourType}, interlace ${interlace}`);
      }
      channels = colourType === 6 ? 4 : 3;
    } else if (type === 'IDAT') {
      data.push(chunk);
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = byteAt(raw, y * (stride + 1));
    for (let x = 0; x < stride; x += 1) {
      const v = byteAt(raw, y * (stride + 1) + 1 + x);
      const a = x >= channels ? byteAt(out, y * stride + x - channels) : 0;
      const b = y > 0 ? byteAt(out, (y - 1) * stride + x) : 0;
      const c = x >= channels && y > 0 ? byteAt(out, (y - 1) * stride + x - channels) : 0;
      let value: number;
      if (filter === 0) value = v;
      else if (filter === 1) value = v + a;
      else if (filter === 2) value = v + b;
      else if (filter === 3) value = v + ((a + b) >> 1);
      else {
        const p = a + b - c;
        const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
        value = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[y * stride + x] = value & 255;
    }
  }
  return [byteAt(out, 0), byteAt(out, 1), byteAt(out, 2)];
}

/** One pixel of the viewport (CSS px = image px: Desktop Chrome has a device scale factor of 1). */
async function pixelAt(page: Page, x: number, y: number): Promise<Rgb> {
  return firstPixel(await page.screenshot({ clip: { x, y, width: 1, height: 1 } }));
}

/** A failed precondition of a case: an assertion that names it (Playwright's expect has no `assert`). */
function must(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const css = (rgb: Rgb): string => `rgb(${rgb.join(', ')})`;
const within = (have: Rgb, want: Rgb, tolerance: number): boolean => have.every((channel, i) => Math.abs(channel - (want[i] ?? 0)) <= tolerance);

/** The effective colour of the backdrop read from the computed style: its alpha times the element's `opacity`, laid over the page colour. */
async function backdropFromComputedStyle(page: Page, selector: string, pageColour: Rgb): Promise<{ text: string; composite: Rgb | null }> {
  const style = await page.locator(selector).evaluate((el) => {
    const s = getComputedStyle(el, '::backdrop');
    return { background: s.backgroundColor, opacity: s.opacity };
  });
  const text = `${style.background}, opacity ${style.opacity}`;
  const m = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/.exec(style.background);
  if (m?.[1] === undefined || m[2] === undefined || m[3] === undefined) return { text, composite: null };
  const alpha = (m[4] === undefined ? 1 : Number(m[4])) * Number(style.opacity);
  const own: Rgb = [Number(m[1]), Number(m[2]), Number(m[3])];
  const mix = (i: 0 | 1 | 2): number => Math.round(alpha * own[i] + (1 - alpha) * pageColour[i]);
  return { text, composite: [mix(0), mix(1), mix(2)] };
}

async function showFixtureBoard(page: Page, c: BackdropCase): Promise<void> {
  const fixtureCase = designFixture.cases.find((x) => x.shot === `1024-${c.scheme}-default`);
  must(fixtureCase !== undefined, `quality/design-paint.json has the 1024-${c.scheme}-default case (the design's fixture board)`);
  await page.setViewportSize({ width: c.width, height: c.height });
  await page.addInitScript((board: unknown) => {
    (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = board;
  }, fixtureCase.captureBoard);
  await page.goto('/');
  await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
  // the scheme reached the page: with no stored preference the head step resolves the system scheme (a dark case must not run on the light page)
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), `${c.scheme}: the page resolved the colour scheme`).toBe(c.scheme);
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
const inside = (x: number, y: number, b: Box): boolean => x >= b.left && x < b.right && y >= b.top && y < b.bottom;

for (const scheme of SCHEMES) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });

    for (const c of CASES.filter((x) => x.scheme === scheme)) {
      const name = `${c.scheme} ${c.surface} ${c.width}x${c.height}`;
      test(`@trace NFR-14 @trace FR-65 ${name}: the closed pixel is the page colour and the open pixel is the ${c.token} backdrop composited over it`, async ({ page }, testInfo) => {
        await showFixtureBoard(page, c);
        const pageColour = PAGE[c.scheme];
        const want = COMPOSITE[c.scheme][c.token];

        // the pixel: the first corner of the viewport that no page content covers (fail, never skip, when there is none)
        const contentBoxes: Box[] = await page.evaluate((selector) => {
          return Array.from(document.querySelectorAll(selector))
            .map((el) => el.getBoundingClientRect())
            .filter((r) => r.width > 0 && r.height > 0)
            .map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom }));
        }, CONTENT);
        expect(contentBoxes.length, `${name}: the page content was found`).toBeGreaterThan(0);
        const corners: [number, number][] = [
          [2, 2],
          [c.width - 3, 2],
          [2, c.height - 3],
          [c.width - 3, c.height - 3],
        ];
        const corner = corners.find(([x, y]) => !contentBoxes.some((box) => inside(x, y, box)));
        must(corner !== undefined, `${name}: a pixel that no page content covers exists`);
        const [x, y] = corner;

        // the same pixel with the surface closed: the page colour
        const closed = await pixelAt(page, x, y);
        expect.soft(css(closed), `${name}: the closed pixel (${x}, ${y}) is the ${c.scheme} page colour ${css(pageColour)}`).toBe(css(pageColour));

        // open the surface as the capture does
        const opener = OPENER[c.surface];
        await page.locator(opener.press).first().evaluate((el: HTMLElement) => {
          el.click();
        });
        await page.locator(opener.open).waitFor();
        const surfaceBox = await page.locator(opener.open).evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        });
        expect.soft(inside(x, y, surfaceBox), `${name}: the pixel (${x}, ${y}) is outside the open surface ${JSON.stringify(surfaceBox)}`).toBe(false);

        const open = await pixelAt(page, x, y);
        const fromStyle = await backdropFromComputedStyle(page, opener.open, pageColour);
        testInfo.annotations.push({
          type: 'pixels',
          description: `${name}: pixel (${x}, ${y}); closed ${css(closed)}; open ${css(open)}; want ${css(want)} (the ${c.token} backdrop over the page ${css(pageColour)}); ::backdrop ${fromStyle.text} -> ${fromStyle.composite === null ? 'unreadable' : css(fromStyle.composite)}`,
        });

        expect
          .soft(within(open, want, 1), `${name}: the open pixel (${x}, ${y}) is ${css(open)}, the ${c.token} backdrop over ${css(pageColour)} is ${css(want)} within 1 per channel (the closed pixel was ${css(closed)})`)
          .toBe(true);
        // the second assertion, never the only one: the computed style of the backdrop gives the same composite
        must(fromStyle.composite !== null, `${name}: the computed ::backdrop background-color is readable as a colour, got ${fromStyle.text}`);
        expect
          .soft(within(fromStyle.composite, want, 1), `${name}: the computed ::backdrop (${fromStyle.text}) over ${css(pageColour)} is ${css(fromStyle.composite)}, wanted ${css(want)} within 1 per channel`)
          .toBe(true);
      });
    }
  });
}
