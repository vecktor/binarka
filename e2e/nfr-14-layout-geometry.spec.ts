// @trace NFR-14
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// update-page-layout-geometry (NFR-14, G2 block 1): the boxes of the page's main column equal the design reference's, within the fixture's
// tolerance. The fixture quality/design-geometry.json is frozen from the design build (scripts/freeze-design-geometry.mjs), which stands in for
// review-set-14 (docs/qa/g2/harness-calibration.txt), with the same browser setup as this test. Each case shows the design's fixture board through
// the capture-only board (FR-119), as the pixel capture does. Sampling: the light reference shots of the states reached at mount (default, four,
// eight, level, win) at the reference viewports; geometry does not depend on the scheme. Coverage: sampled, never continuum; the stricter
// instrument before a definition-of-done is the 1 px width sweep of docs/qa/visual-diff/README.md.

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface GeometryCase {
  shot: string;
  width: number;
  height: number;
  state: string;
  captureBoard: unknown;
  boxes: Record<string, Box | null>;
}
interface Fixture {
  tolerancePx: number;
  selectors: string[];
  cases: GeometryCase[];
}

const fixture = JSON.parse(readFileSync('quality/design-geometry.json', 'utf8')) as Fixture;

// The sampled cases of the spec, per state (review run 1, fix round 1: the matrix is pinned, not only the count).
const ALL = ['320', '375', '768', '1024', '1366', '1440'];
const NO_1366 = ['320', '375', '768', '1024', '1440'];
const EXPECTED_SHOTS = [
  ...ALL.map((w) => `${w}-light-default`),
  ...ALL.map((w) => `${w}-light-eight`),
  ...NO_1366.map((w) => `${w}-light-four`),
  ...NO_1366.map((w) => `${w}-light-level`),
  ...NO_1366.map((w) => `${w}-light-win`),
].sort();

test('@trace NFR-14 the fixture covers exactly the sampled layout cases of the spec', () => {
  expect(fixture.cases.map((c) => c.shot).sort(), 'the shots of quality/design-geometry.json').toEqual(EXPECTED_SHOTS);
  expect(fixture.tolerancePx).toBe(0.5);
});

for (const c of fixture.cases) {
  test(`@trace NFR-14 ${c.shot}: the main column's boxes match the design within ${fixture.tolerancePx}px`, async ({ page }) => {
    await page.setViewportSize({ width: c.width, height: c.height });
    await page.addInitScript((board: unknown) => {
      (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = board;
    }, c.captureBoard);
    await page.goto('/');
    await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
    const actual = await page.evaluate((sels: string[]) => sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }), fixture.selectors);
    const misses: string[] = [];
    fixture.selectors.forEach((sel, i) => {
      const want = c.boxes[sel] ?? null;
      const got = actual[i] ?? null;
      if (want === null || got === null) {
        if (want !== got) misses.push(`${sel}: ${want === null ? 'absent in the design' : 'missing on the page'}`);
        return;
      }
      // A box of zero width and zero height paints nothing, so its position is not geometry: the design hides an empty win line with
      // display: none (0,0 0x0), the page keeps it rendered as a live region (FR-63) at its place in the column, also 0x0. Any box with area
      // must match within the tolerance.
      if (want.w === 0 && want.h === 0 && got.w === 0 && got.h === 0) return;
      const delta = Math.max(Math.abs(want.x - got.x), Math.abs(want.y - got.y), Math.abs(want.x + want.w - got.x - got.w), Math.abs(want.y + want.h - got.y - got.h));
      if (delta > fixture.tolerancePx) {
        const f = (b: Box): string => `${b.x.toFixed(2)},${b.y.toFixed(2)} ${b.w.toFixed(2)}x${b.h.toFixed(2)}`;
        misses.push(`${sel}: page ${f(got)}, design ${f(want)} (off by ${delta.toFixed(2)}px)`);
      }
    });
    expect(misses, `${c.shot}: ${misses.length} of ${fixture.selectors.length} boxes off`).toEqual([]);
  });
}

// Review run 1 (wf_1c7326da-0c4), fix round 1: «The settings panel stays under the header, its right edge on the column's right edge from 48rem,
// as the column changes.» The panel's own geometry (its height and contents) is outside this block; its placement is checked against the header,
// whose box the cases above pin to the design. Sampled: the reference viewports from 48rem.
for (const [width, height] of [
  [768, 1024],
  [1024, 768],
  [1366, 650],
  [1440, 900],
] as const) {
  test(`@trace NFR-14 ${width}x${height}: the open settings panel sits under the header, its right edge on the column's right edge`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
    await page.locator('[data-action="settings"]').click();
    await expect(page.locator('[data-section="settings"]')).toBeVisible();
    const m = await page.evaluate(() => {
      const panel = document.querySelector('[data-section="settings"]')?.getBoundingClientRect();
      const header = document.querySelector('.page-header')?.getBoundingClientRect();
      return panel && header ? { panel: { left: panel.left, right: panel.right, top: panel.top, width: panel.width }, header: { left: header.left, right: header.right, bottom: header.bottom, width: header.width } } : null;
    });
    expect.soft(m, 'the panel and the header exist').not.toBeNull();
    if (m === null) return;
    expect(Math.abs(m.panel.right - m.header.right), `panel right ${m.panel.right} vs column right ${m.header.right}`).toBeLessThanOrEqual(0.5);
    expect(m.panel.top, `panel top ${m.panel.top} at or below the header bottom ${m.header.bottom}`).toBeGreaterThanOrEqual(m.header.bottom);
    expect(m.panel.left, `panel left ${m.panel.left} inside the column (from ${m.header.left})`).toBeGreaterThanOrEqual(m.header.left - 0.5);
  });
}
