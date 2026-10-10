// @trace NFR-18
// @trace FR-116
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openPage, readPageColours, seedTheme, sel } from './helpers';
import type { ThemeChoice } from './helpers';

// NFR-18 (sampled): no flash of the wrong theme on reload (spec openspec/changes/add-theme-switch/specs/play-page/spec.md, requirement «No flash of the
// wrong theme on reload»). With `dark` stored on a light system and with `light` stored on a dark system, the head step of index.html alone puts the
// page in the stored theme before the page bundle runs. Two variants, each at 375x812 and 1280x800 (coverage is `sampled`, never continuum; the paint
// itself is not measured):
//  - Variant 1: the page bundle is aborted (`page.route('**/assets/*.js', r => r.abort())`; the stylesheet stays a <link> and loads), and the test asserts
//    that <html> has the stored data-theme and that the body background equals the --color-page of the stored theme. The board must be absent, so the
//    result cannot come from the bundle.
//  - Variant 2 (bundle loaded): an addInitScript MutationObserver (attributes, attributeFilter ['data-theme'], attributeOldValue) records the changes of
//    <html> and the first child added to <body>. Only records whose old value differs from the new one count (a mount that rewrites an equal value is
//    not a change). The test needs at least one counted record (a run with none fails: it must not pass vacuously), the last value is the stored one, and
//    every counted record comes before the first child of <body>; none follows during the mount.
// Storage is set by addInitScript per test in a fresh browser context (no storageState), through the once-only guard of e2e/helpers.ts.
// NFR-18 is held (autonomy-log row 118) until this spec has been seen failing against the page without the head step (tasks.md 2.6, 2.7).
const VIEWPORTS = [
  [375, 812],
  [1280, 800],
] as const;

const PAIRS: readonly { stored: Exclude<ThemeChoice, 'auto'>; system: 'light' | 'dark' }[] = [
  { stored: 'dark', system: 'light' },
  { stored: 'light', system: 'dark' },
];

interface FlashEvent {
  kind: 'theme' | 'body-child';
  oldValue: string | null;
  newValue: string | null;
  counted: boolean;
}

/** An observer that exists before the document is parsed: <html data-theme> changes and the first child added to <body>, in order. */
async function installFlashObserver(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const events: FlashEvent[] = [];
    interface FlashEvent {
      kind: 'theme' | 'body-child';
      oldValue: string | null;
      newValue: string | null;
      counted: boolean;
    }
    let bodyChildSeen = false;
    const observer = new MutationObserver((records) => {
      const themeRecords = records.filter((r) => r.type === 'attributes' && r.attributeName === 'data-theme');
      records.forEach((record) => {
        if (record.type === 'attributes' && record.attributeName === 'data-theme') {
          // the value this record wrote is the old value of the next theme record, or the current value for the last one
          const at = themeRecords.indexOf(record);
          const next = themeRecords[at + 1];
          const target = record.target as Element;
          const newValue = next !== undefined ? next.oldValue : target.getAttribute('data-theme');
          events.push({ kind: 'theme', oldValue: record.oldValue, newValue, counted: record.oldValue !== newValue });
        } else if (record.type === 'childList' && record.target.nodeName === 'BODY' && record.addedNodes.length > 0 && !bodyChildSeen) {
          bodyChildSeen = true;
          events.push({ kind: 'body-child', oldValue: null, newValue: null, counted: false });
        }
      });
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-theme'], attributeOldValue: true });
    (window as unknown as { __flashEvents: FlashEvent[] }).__flashEvents = events;
  });
}

for (const [width, height] of VIEWPORTS) {
  for (const { stored, system } of PAIRS) {
    test.describe(`${width}x${height} ${stored} stored on a ${system} system`, () => {
      test.use({ viewport: { width, height }, colorScheme: system });

      test(`NFR-18 variant 1: the head step alone sets data-theme ${stored} and the background (bundle aborted)`, async ({ page }) => {
        await seedTheme(page, stored);
        await page.route('**/assets/*.js', (route) => route.abort());
        await page.goto('/');
        await expect(page.locator(sel.cell), 'premise: the page bundle did not run, so the board is not built').toHaveCount(0);
        await expect(page.locator('html'), `<html> has data-theme="${stored}" before the bundle runs`).toHaveAttribute('data-theme', stored);
        const colours = await readPageColours(page);
        const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        expect(background, `the body background equals the ${stored} --color-page`).toBe(colours[stored]);
      });

      test(`NFR-18 variant 2: data-theme ${stored} is set before the body gets a child, and not changed after`, async ({ page }) => {
        await seedTheme(page, stored);
        await installFlashObserver(page);
        await openPage(page); // waits for the board: the bundle has mounted
        const events = await page.evaluate(() => (window as unknown as { __flashEvents: FlashEvent[] }).__flashEvents.slice());
        const counted = events.filter((e) => e.kind === 'theme' && e.counted);
        expect(counted.length, `at least one counted data-theme record (events: ${JSON.stringify(events)})`).toBeGreaterThanOrEqual(1);
        expect(counted[counted.length - 1]?.newValue, 'the last value is the stored one').toBe(stored);
        const firstBodyChild = events.findIndex((e) => e.kind === 'body-child');
        expect(firstBodyChild, 'the observer saw the first child added to <body>').toBeGreaterThanOrEqual(0);
        const late = events.filter((e, i) => e.kind === 'theme' && e.counted && i > firstBodyChild);
        expect(late, 'no counted data-theme record follows the first child of <body>').toEqual([]);
        expect(
          events.findIndex((e) => e.kind === 'theme' && e.counted),
          'a counted record comes before the first child of <body>',
        ).toBeLessThan(firstBodyChild);
      });
    });
  }
}
