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

test('@trace NFR-14 the fixture covers the sampled layout cases', () => {
  expect(fixture.cases.length, 'cases in quality/design-geometry.json').toBeGreaterThanOrEqual(27);
  expect(new Set(fixture.cases.map((c) => c.state))).toEqual(new Set(['default', 'four', 'eight', 'level', 'win']));
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
      const delta = Math.max(Math.abs(want.x - got.x), Math.abs(want.y - got.y), Math.abs(want.x + want.w - got.x - got.w), Math.abs(want.y + want.h - got.y - got.h));
      if (delta > fixture.tolerancePx) {
        const f = (b: Box): string => `${b.x.toFixed(2)},${b.y.toFixed(2)} ${b.w.toFixed(2)}x${b.h.toFixed(2)}`;
        misses.push(`${sel}: page ${f(got)}, design ${f(want)} (off by ${delta.toFixed(2)}px)`);
      }
    });
    expect(misses, `${c.shot}: ${misses.length} of ${fixture.selectors.length} boxes off`).toEqual([]);
  });
}
