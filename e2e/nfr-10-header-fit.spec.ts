// @trace FR-68
import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

// The header (FR-68: the title, the settings button and «Правила») fits its column on phones, and the page never scrolls sideways
// (docs/frontend-conventions.md rule 18; A-14: phones from 320 px). Added in the second review-gate fix round of add-theme-switch
// (autonomy-log row 130): the gear made the header overflow at 320 to 334 and 361 to 385 px, and the page scrolled sideways at 361 to 369
// (docs/qa/add-theme-switch/header-sweep-run.txt). This is not an NFR-10 mechanism; the file sits with the fit checks of the `layout`
// project. Sampled, not continuum: the widths below take the two ends of each overflow band, its worst points and two wide controls. The
// stricter instrument is the 1 px sweep of 320 to 800 px (docs/qa/add-theme-switch/header-sweep.mjs.txt).
const WIDTHS = [320, 322, 334, 361, 369, 375, 385, 768, 1280] as const;

interface HeaderFit {
  header: { left: number; right: number };
  children: { name: string; left: number; right: number }[];
  scrollWidth: number;
  innerWidth: number;
}

for (const width of WIDTHS) {
  test(`header sampled at ${width} px: every header child inside the header, no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await openPage(page);

    const fit = await page.evaluate((): HeaderFit => {
      const header = document.querySelector('header');
      if (header === null) throw new Error('the page has no header');
      const box = header.getBoundingClientRect();
      return {
        header: { left: box.left, right: box.right },
        children: [...header.children].map((child) => {
          const r = child.getBoundingClientRect();
          return { name: child.getAttribute('data-action') ?? child.tagName.toLowerCase(), left: r.left, right: r.right };
        }),
        scrollWidth: document.scrollingElement?.scrollWidth ?? Number.NaN,
        innerWidth: window.innerWidth,
      };
    });

    expect(fit.children.length, 'premise: the header holds the title, the settings button and «Правила»').toBe(3);
    for (const child of fit.children) {
      expect(child.left, `${child.name} starts ${(fit.header.left - child.left).toFixed(1)} px left of the header`).toBeGreaterThanOrEqual(fit.header.left - 0.5);
      expect(child.right, `${child.name} ends ${(child.right - fit.header.right).toFixed(1)} px right of the header`).toBeLessThanOrEqual(fit.header.right + 0.5);
    }
    expect(fit.scrollWidth, `the page is ${fit.scrollWidth} px wide in a ${fit.innerWidth} px viewport (sideways scroll)`).toBeLessThanOrEqual(fit.innerWidth);
  });
}
