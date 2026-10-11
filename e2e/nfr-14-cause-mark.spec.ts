// @trace FR-64
// @trace FR-120
// @trace NFR-14
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { countSolutions, findViolations } from '../src/engine/index';
import type { Cell, Grid } from '../src/engine/index';

// add-violation-cause (FR-64, FR-120, A-58; the scenario «The cause cell shows the mark in a browser (sampled)» of the MODIFIED requirement «A violation
// shows a cue besides colour», openspec/changes/add-violation-cause/specs/play-page/spec.md). The built page in Chromium, with the browser setup of
// playwright.config.ts (Playwright's "Desktop Chrome", device scale 1, reduced motion, no stored preference, the colour scheme on the browser context),
// shows a capture board (FR-119) built on the givens of the design's fixture of the size (quality/design-paint.json) with two adjacent entered 0s and
// an empty non-given cell beside them. The test reads ONE pixel of a screenshot, at (right − 4, top + 4) of that empty cell's border box (the pixel whose
// top-left corner is at x = ⌊right⌋ − 4, y = ⌈top⌉ + 4), before the press (the closed pixel: it must NOT be the border colour, so a pixel that would read
// the border colour by luck fails the case), clicks the cell once so that three 0s stand side by side, and reads the same pixel again (the open pixel:
// `--color-violation-border` of the scheme within 1 per channel), and the same pixel of the adjacent violating cell that is not the cause (not the border
// colour). Four px in from the outer corner is 2px into the padding box: inside the triangle for any leg of 8px or more, and inside the inner arc of the
// cell's 6px corner radius (design.md decision 8).
//
// The click is a script click (`el.click()`), as the capture presses: no pointer over the cell, so the hover ring is not painted, and no focus ring
// (capture determinism).
//
// Sampling (declared below as SAMPLING): the scheme, the board size and the viewport width; two cases, light 6×6 at 1024×768 and dark 8×8 at 320×640 (the
// leg's 0.5rem floor binds there: a quarter of the inner width is about 7.8px and the floor makes the leg 8px). Coverage is sampled. Nothing is said about
// the widths 375, 768 and 1440, landscape (844×390, where the floor binds too), 4×4, or the other theme at each sampled size. The stricter instrument
// before any legibility claim at other widths is the design stills at 320, 375 and 844×390 (docs/design/cause-touch-2026-10-11/) and the width sweep of
// the smoke test (tasks.md 7.1 step 10: the `::after` border-top-width is 8px or more at every width).
//
// `getComputedStyle(cell, '::after')` is readable in Chromium (the spike of docs/qa/add-violation-cause/red-run.txt section D), so each case also reads
// the pseudo-element's `border-top-width` as a SECOND assertion: max(8, (cell width − 4) / 4) px within 0.5px. It is never the only check: the pixel is.
//
// The screenshot is decoded here with node:zlib (the project has no PNG type declarations and no dependency may be added); the decoder is the one of
// e2e/nfr-14-backdrop.spec.ts, copied because a spec file cannot be imported (it would register its tests again).

type Scheme = 'light' | 'dark';
type Rgb = readonly [number, number, number];

interface CauseCase {
  scheme: Scheme;
  size: number;
  width: number;
  height: number;
  /** the design fixture whose givens the capture value takes */
  shot: string;
  /** the two entered 0s (1-based [row, col]) and the empty non-given cell beside them, which the press makes the cause */
  zeros: [[number, number], [number, number]];
  target: [number, number];
}

/** `--color-violation-border` of each scheme (the A-57 appendix; the spec's `#b3261e` and `#ff8a7d`). */
const BORDER: Record<Scheme, Rgb> = { light: [179, 38, 30], dark: [255, 138, 125] };

const SAMPLING = {
  dimensions: ['scheme', 'size', 'width'],
  schemes: ['light', 'dark'],
  sizes: [6, 8],
  widths: [1024, 320],
  coverage: 'sampled',
  cases: 2,
} as const;

// The coordinates were chosen with the engine (red-run.txt section D): each capture value is rule-clean before the press, and the press gives exactly one
// violation, rule `three`, whose cells are the run. The premises are asserted again below, at run time, with the engine.
const CASES: CauseCase[] = [
  { scheme: 'light', size: 6, width: 1024, height: 768, shot: '1024-light-default', zeros: [[3, 2], [3, 3]], target: [3, 4] },
  { scheme: 'dark', size: 8, width: 320, height: 640, shot: '1024-dark-eight', zeros: [[4, 4], [4, 5]], target: [4, 6] },
];

interface PaintFixture {
  cases: { shot: string; captureBoard: { size: number; givens: Grid } }[];
}
const designFixture = JSON.parse(readFileSync('quality/design-paint.json', 'utf8')) as PaintFixture;

/** A failed precondition of a case: an assertion that names it (Playwright's expect has no `assert`). */
function must(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** The capture value of a case: the fixture's givens, the two 0s as the only entries, level 1. */
function captureValue(c: CauseCase): { size: number; level: number; givens: Grid; entries: Grid } {
  const fixture = designFixture.cases.find((x) => x.shot === c.shot);
  must(fixture !== undefined, `quality/design-paint.json has the case ${c.shot} (the design's fixture board of size ${c.size})`);
  const givens: Grid = fixture.captureBoard.givens.map((row) => [...row]);
  must(givens.length === c.size, `${c.shot}: the fixture is ${givens.length}x${givens.length}, the case needs ${c.size}x${c.size}`);
  const entries: Grid = givens.map((row) => row.map((): Cell => null));
  for (const [r, col] of c.zeros) {
    must(givens[r - 1]?.[col - 1] === null, `${c.shot}: (${r},${col}) is not a given`);
    const line = entries[r - 1];
    must(line !== undefined, 'the row exists');
    line[col - 1] = 0;
  }
  must(givens[c.target[0] - 1]?.[c.target[1] - 1] === null, `${c.shot}: the target (${c.target.join(',')}) is not a given`);
  return { size: c.size, level: 1, givens, entries };
}

// GUARD (the next test): it describes this file's own matrix and its capture values, not the page, so it is green by construction
// (docs/qa/add-violation-cause/red-run.txt section B/D). It pins the matrix against a silent edit and the premises of each case with the engine.
test('@trace NFR-14 @trace FR-120 the sampling is declared (scheme, size, width; coverage sampled; 2 cases) and each capture value is valid and clean before the press', () => {
  expect(SAMPLING.coverage).toBe('sampled');
  expect(SAMPLING.dimensions).toEqual(['scheme', 'size', 'width']);
  expect(CASES, 'the cases').toHaveLength(SAMPLING.cases);
  expect(CASES.map((c) => `${c.scheme} ${c.size}x${c.size} ${c.width}x${c.height}`)).toEqual(['light 6x6 1024x768', 'dark 8x8 320x640']);
  // the file claims nothing beyond a sample (the phrases are assembled so that this check does not match its own text)
  const claims = new RegExp(['contin' + 'uum', 'all ' + 'widths', 'all ' + 'sizes', 'pixel ' + 'floor', 'every ' + 'width is'].join('|'), 'i');
  expect(readFileSync('e2e/nfr-14-cause-mark.spec.ts', 'utf8'), 'the file claims nothing beyond a sample').not.toMatch(claims);
  for (const c of CASES) {
    const value = captureValue(c);
    expect(countSolutions(value.givens), `${c.shot}: the givens have exactly one solution (a valid capture value, FR-119)`).toBe(1);
    const board: Grid = value.givens.map((row, r) => row.map((cell, k) => cell ?? value.entries[r]?.[k] ?? null));
    expect(findViolations(board), `${c.shot}: no violation before the press`).toEqual([]);
    const after = board.map((row) => [...row]);
    const line = after[c.target[0] - 1];
    must(line !== undefined, 'the target row exists');
    line[c.target[1] - 1] = 0;
    const violations = findViolations(after);
    expect(violations.map((v) => v.rule), `${c.shot}: the press gives exactly one violation, three equal digits`).toEqual(['three']);
    expect(violations[0]?.cells, `${c.shot}: its cells are the run, the target among them (the target is the cause, FR-120)`).toContainEqual([c.target[0] - 1, c.target[1] - 1]);
  }
});

// ---------------------------------------------------------------------------------------------------------
// PNG decoding (8-bit, non-interlaced, RGB or RGBA: what Chromium writes) and the pixel read (copied from e2e/nfr-14-backdrop.spec.ts)
// ---------------------------------------------------------------------------------------------------------

const byteAt = (bytes: Uint8Array, index: number): number => bytes[index] ?? 0;

/** The first pixel of a PNG screenshot as `[r, g, b]` (the screenshot of a 1x1 clip). */
function firstPixel(png: Buffer): Rgb {
  if (!png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) throw new Error('the screenshot is not a PNG');
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
  if (raw.length !== height * (stride + 1)) throw new Error(`PNG data is ${raw.length} bytes, expected ${height * (stride + 1)}`);
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = byteAt(raw, y * (stride + 1));
    if (filter > 4) throw new Error(`PNG row ${y} has the unknown filter type ${filter}`);
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

const css = (rgb: Rgb): string => `rgb(${rgb.join(', ')})`;
const within = (have: Rgb, want: Rgb, tolerance: number): boolean => have.every((channel, i) => Math.abs(channel - (want[i] ?? 0)) <= tolerance);

const cellSelector = ([r, c]: [number, number]): string => `[data-board] [data-cell][data-row="${r}"][data-col="${c}"]`;

/** The pixel of a cell that the scenario defines: top-left corner at x = ⌊right⌋ − 4, y = ⌈top⌉ + 4 of its border box. */
async function cornerPixel(page: Page, cell: [number, number]): Promise<{ x: number; y: number; width: number }> {
  const rect = await page.locator(cellSelector(cell)).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { right: r.right, top: r.top, width: r.width };
  });
  return { x: Math.floor(rect.right) - 4, y: Math.ceil(rect.top) + 4, width: rect.width };
}

/** Two animation frames, so a class change has been painted before the screenshot. */
async function painted(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => { requestAnimationFrame(() => { resolve(); }); })));
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });

    for (const c of CASES.filter((x) => x.scheme === scheme)) {
      const name = `${c.scheme} ${c.size}x${c.size} at ${c.width}x${c.height}`;
      test(`@trace FR-64 @trace FR-120 @trace NFR-14 ${name}: the closed pixel is not the border colour, the cause cell's corner pixel is --color-violation-border after the press, the neighbour's is not`, async ({ page }, testInfo) => {
        const value = captureValue(c);
        await page.setViewportSize({ width: c.width, height: c.height });
        await page.addInitScript((board: unknown) => {
          (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = board;
        }, value);
        await page.goto('/');
        await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), `${name}: the page resolved the colour scheme`).toBe(c.scheme);
        await expect(page.locator('[data-board]'), `${name}: the capture board of size ${c.size} is shown`).toHaveAttribute('data-size', String(c.size));
        for (const zero of c.zeros) await expect(page.locator(cellSelector(zero)), `${name}: the entered 0 at (${zero.join(',')})`).toHaveText('0');
        await expect(page.locator(cellSelector(c.target)), `${name}: the target (${c.target.join(',')}) is empty before the press`).toHaveText('');
        await expect(page.locator('[data-board] [data-cell].cell-violation'), `${name}: no violation before the press`).toHaveCount(0);

        const want = BORDER[c.scheme];
        const target = await cornerPixel(page, c.target);
        const closed = await pixelAt(page, target.x, target.y);
        expect
          .soft(within(closed, want, 1), `${name}: the closed pixel (${target.x}, ${target.y}) is ${css(closed)}, which must not be the border colour ${css(want)}`)
          .toBe(false);

        // the press: a script click, as the capture presses (no hover ring, no focus ring)
        await page.locator(cellSelector(c.target)).evaluate((el: HTMLElement) => {
          el.click();
        });
        await expect(page.locator(cellSelector(c.target)), `${name}: the press put a 0`).toHaveText('0');
        await expect(page.locator(cellSelector(c.target)), `${name}: the target is in the violation`).toHaveClass(/\bcell-violation\b/);
        await painted(page);

        const after = await cornerPixel(page, c.target);
        expect(after, `${name}: the cell did not move with the press`).toEqual(target);
        const open = await pixelAt(page, after.x, after.y);
        const neighbourCell: [number, number] = c.zeros[1];
        const neighbour = await cornerPixel(page, neighbourCell);
        const neighbourPixel = await pixelAt(page, neighbour.x, neighbour.y);
        const pseudo = await page.locator(cellSelector(c.target)).evaluate((el) => {
          const s = getComputedStyle(el, '::after');
          return { borderTopWidth: s.borderTopWidth, content: s.content };
        });
        const leg = Math.max(8, (target.width - 4) / 4);
        testInfo.annotations.push({
          type: 'pixels',
          description: `${name}: target (${c.target.join(',')}) pixel (${target.x}, ${target.y}): closed ${css(closed)}, open ${css(open)}, want ${css(want)}; neighbour (${neighbourCell.join(',')}) pixel (${neighbour.x}, ${neighbour.y}) ${css(neighbourPixel)}; ::after border-top-width ${pseudo.borderTopWidth} (content ${pseudo.content}), want ${leg.toFixed(2)}px (cell width ${target.width.toFixed(2)}px)`,
        });

        expect
          .soft(within(open, want, 1), `${name}: the cause cell's pixel (${after.x}, ${after.y}) is ${css(open)}, the mark is ${css(want)} within 1 per channel (the closed pixel was ${css(closed)})`)
          .toBe(true);
        expect
          .soft(within(neighbourPixel, want, 1), `${name}: the adjacent violating cell (${neighbourCell.join(',')}), not the cause, reads ${css(neighbourPixel)} at (${neighbour.x}, ${neighbour.y}), which must not be the mark ${css(want)}`)
          .toBe(false);
        // the second assertion, never the only one: the pseudo-element's leg is the quarter of the inner width with the 8px floor
        const width = Number.parseFloat(pseudo.borderTopWidth);
        expect
          .soft(Number.isFinite(width) && Math.abs(width - leg) <= 0.5, `${name}: getComputedStyle(cell, '::after').borderTopWidth is ${pseudo.borderTopWidth}, wanted ${leg.toFixed(2)}px within 0.5px`)
          .toBe(true);
      });
    }
  });
}
