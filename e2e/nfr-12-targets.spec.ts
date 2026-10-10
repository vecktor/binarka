// @trace NFR-12
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { LanguageChoice, Measured } from './helpers';
import { chooseSize, closeSheet, closeSettings, expectLanguage, measure, openConfirm, openPage, openRules, openSettings, openSheet, sel } from './helpers';

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

// add-english-version (NFR-12, FR-107; delta «English labels meet the touch-target floor»): the same probe runs in English at the same eight viewports,
// with the longer English labels (they may wrap at 320 px), and with the settings panel open the two language options are measured too (in both
// languages). The Ukrainian test keeps its name and its measurements; the language options join it. Coverage is `sampled`, never continuum.
const CONTROL_FLOOR = 44;
const CELL_FLOOR_8 = 24;

function below(items: Measured[], floor: number, where: string): string[] {
  return items.filter((m) => m.width < floor || m.height < floor).map((m) => `${where}: ${m.name} is ${m.width}x${m.height}, floor ${floor}x${floor}`);
}

async function probe(page: Page, width: number, height: number, language: LanguageChoice): Promise<void> {
  {
    await page.setViewportSize({ width, height });
    await openPage(page, 1, language === 'en' ? { language } : {});
    await expectLanguage(page, language);
    const misses: string[] = [];

    // 6x6 (the default board) and the page controls.
    misses.push(...below(await measure(page.locator(sel.cell), '6x6 cell'), CONTROL_FLOOR, '6x6'));
    // add-theme-switch (NFR-12, FR-117): the settings button joins the page controls. The count line makes a page without it fail on an
    // assertion, not on "no element matched".
    await expect(page.locator(sel.settings), 'the page has the settings button').toHaveCount(1);
    const pageControls = [
      ...(await measure(page.locator(sel.summary), 'summary button')),
      ...(await measure(page.locator(sel.settings), 'settings button')),
      ...(await measure(page.locator(sel.hint), 'button')),
      ...(await measure(page.locator(sel.reset), 'button')),
      ...(await measure(page.locator(sel.newPuzzle), 'button')),
      ...(await measure(page.locator(sel.rules), 'button')),
    ];
    misses.push(...below(pageControls, CONTROL_FLOOR, 'page'));

    await openRules(page);
    misses.push(...below(await measure(page.locator(sel.rulesClose), 'rules close'), CONTROL_FLOOR, 'rules panel'));
    await page.keyboard.press('Escape');

    // add-theme-switch (NFR-12, FR-117; delta «Measured in a real browser the settings controls are at least 44 px in both directions»):
    // with the settings panel opened by the settings button, the three theme options and the panel's «Закрити» are measured.
    await openSettings(page);
    await expect(page.locator(sel.themeOption), 'the settings panel holds the three theme options').toHaveCount(3);
    await expect(page.locator(sel.languageOption), 'the settings panel holds the two language options').toHaveCount(2);
    const settingsControls = [
      ...(await measure(page.locator(sel.themeOption), 'theme option')),
      ...(await measure(page.locator(sel.languageOption), 'language option')),
      ...(await measure(page.locator(sel.settingsClose), 'settings close')),
    ];
    misses.push(...below(settingsControls, CONTROL_FLOOR, 'settings panel'));
    await closeSettings(page);

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

    expect(misses, `${misses.length} element(s) below the floor at ${width}x${height} (${language}):\n${misses.join('\n')}`).toEqual([]);
  }
}

for (const [width, height] of VIEWPORTS) {
  test(`NFR-12 sampled ${width}x${height}: cells and controls meet their size floors`, async ({ page }) => {
    await probe(page, width, height, 'uk');
  });

  test(`NFR-12 English sampled ${width}x${height}: cells and controls meet their size floors`, async ({ page }) => {
    await probe(page, width, height, 'en');
  });
}
