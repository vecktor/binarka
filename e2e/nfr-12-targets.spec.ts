// @trace NFR-12
import { expect, test } from '@playwright/test';
import type { Measured } from './helpers';
import { chooseSize, closeSheet, measure, openConfirm, openPage, openRules, openSheet, sel } from './helpers';

// NFR-12 (sampled): the eight viewports declared in docs/requirements-held.md. Not continuum coverage; the stricter
// instrument is a fine-step width and height sweep of the same measurements.
const VIEWPORTS = [
  [320, 700],
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1366, 650],
  [1440, 900],
  [1280, 420],
  [844, 390],
] as const;

const CONTROL_FLOOR = 44;
const CELL_FLOOR_8 = 24;

function below(items: Measured[], floor: number, where: string): string[] {
  return items.filter((m) => m.width < floor || m.height < floor).map((m) => `${where}: ${m.name} is ${m.width}x${m.height}, floor ${floor}x${floor}`);
}

for (const [width, height] of VIEWPORTS) {
  test(`NFR-12 sampled ${width}x${height}: cells and controls meet their size floors`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openPage(page);
    const misses: string[] = [];

    // 6x6 (the default board) and the page controls.
    misses.push(...below(await measure(page.locator(sel.cell), '6x6 cell'), CONTROL_FLOOR, '6x6'));
    const pageControls = [
      ...(await measure(page.locator(sel.summary), 'summary button')),
      ...(await measure(page.locator(sel.hint), 'button')),
      ...(await measure(page.locator(sel.reset), 'button')),
      ...(await measure(page.locator(sel.newPuzzle), 'button')),
      ...(await measure(page.locator(sel.rules), 'button')),
    ];
    misses.push(...below(pageControls, CONTROL_FLOOR, 'page'));

    await openRules(page);
    misses.push(...below(await measure(page.locator(sel.rulesClose), 'rules close'), CONTROL_FLOOR, 'rules panel'));
    await page.keyboard.press('Escape');

    await openSheet(page);
    const sheetControls = [
      ...(await measure(page.locator(sel.sizeOption), 'size option')),
      ...(await measure(page.locator(sel.levelOption), 'level option')),
      ...(await measure(page.locator(sel.setupStart), 'sheet start')),
      ...(await measure(page.locator(sel.setupClose), 'sheet close')),
    ];
    misses.push(...below(sheetControls, CONTROL_FLOOR, 'setup sheet'));
    await closeSheet(page);

    await openConfirm(page);
    const dialogButtons = [...(await measure(page.locator(sel.confirmYes), 'dialog')), ...(await measure(page.locator(sel.confirmNo), 'dialog'))];
    misses.push(...below(dialogButtons, CONTROL_FLOOR, 'confirmation'));
    await page.locator(sel.confirmYes).click();

    await chooseSize(page, 8);
    misses.push(...below(await measure(page.locator(sel.cell), '8x8 cell'), CELL_FLOOR_8, '8x8'));

    await chooseSize(page, 4);
    misses.push(...below(await measure(page.locator(sel.cell), '4x4 cell'), CONTROL_FLOOR, '4x4'));
    await openSheet(page);
    const sheetControlsAt4 = [
      ...(await measure(page.locator(sel.levelOption), 'level option at 4x4')),
      ...(await measure(page.locator(sel.setupStart), 'sheet start at 4x4')),
    ];
    misses.push(...below(sheetControlsAt4, CONTROL_FLOOR, 'setup sheet at 4x4'));
    await closeSheet(page);

    expect(misses, `${misses.length} element(s) below the floor at ${width}x${height}:\n${misses.join('\n')}`).toEqual([]);
  });
}
