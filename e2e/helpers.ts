import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

// The page draws its seed from Math.random (src/ui/seed.ts). A seeded Math.random makes every run show the same
// puzzles, so a re-run of a check measures the same page (capture determinism).
export async function openPage(page: Page, seed = 1): Promise<void> {
  await page.addInitScript((start: number) => {
    let a = start >>> 0;
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, seed);
  await page.goto('/');
  await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
}

export const sel = {
  board: '[data-board]',
  cell: '[data-board] [data-cell]',
  emptyCell: '[data-board] [data-cell][data-given="false"]',
  summary: '[data-action="setup"]',
  hint: '[data-action="hint"]',
  reset: '[data-action="reset"]',
  newPuzzle: '[data-action="new"]',
  rules: '[data-action="rules"]',
  rulesPanel: '[data-section="rules"]',
  rulesClose: '.rules-close',
  sheet: '[data-section="setup"]',
  sizeOption: '[data-size-option]',
  levelOption: '[data-control="level"] [role="radio"]',
  setupStart: '[data-action="setup-start"]',
  setupClose: '[data-action="setup-close"]',
  dialog: 'dialog[data-dialog="confirm"]',
  confirmYes: '[data-confirm="yes"]',
  confirmNo: '[data-confirm="no"]',
  hintMessage: '[data-message="hint"]',
  winMessage: '[data-message="win"]',
  buttons: '.buttons',
  messages: '.messages',
} as const;

export async function showHint(page: Page): Promise<void> {
  await page.locator(sel.hint).click();
  await expect(page.locator(sel.hintMessage)).not.toBeEmpty();
}

/** Press «Підказка» until the win message shows (level 1 boards are solvable by hints alone). */
export async function solveByHints(page: Page): Promise<void> {
  const win = page.locator(sel.winMessage);
  for (let i = 0; i < 100 && (await win.textContent()) === ''; i++) await page.locator(sel.hint).click();
  await expect(win).not.toBeEmpty();
}

export async function openRules(page: Page): Promise<void> {
  await page.locator(sel.rules).click();
  await expect(page.locator(`${sel.rulesPanel}:popover-open`)).toBeVisible();
}

export async function openSheet(page: Page): Promise<void> {
  await page.locator(sel.summary).click();
  await expect(page.locator(`${sel.sheet}:popover-open`)).toBeVisible();
}

export async function closeSheet(page: Page): Promise<void> {
  await page.locator(sel.setupClose).click();
  await expect(page.locator(`${sel.sheet}:popover-open`)).toHaveCount(0);
}

/** Enter one digit, then press «Скинути»: the confirmation dialog opens. */
export async function openConfirm(page: Page): Promise<void> {
  await page.locator(sel.emptyCell).first().click();
  await page.locator(sel.reset).click();
  await expect(page.locator(`${sel.dialog}[open]`)).toBeVisible();
}

/** Open the setup sheet unless it is open: a click on the summary button of an open `popover="auto"` sheet closes it again. */
export async function openSheetIfClosed(page: Page): Promise<void> {
  if ((await page.locator(`${sel.sheet}:popover-open`).count()) === 0) await openSheet(page);
}

/**
 * A MARKING press on a size option (update-setup-sheet-start, FR-100): the sheet opens if it is closed, the option is clicked, and the
 * sheet MUST still be open with the option checked. Without «Почати» nothing else may happen; the open-sheet line is what makes a page
 * that still starts a puzzle at the press (and closes the sheet) fail here, instead of passing a state check on a closed sheet.
 */
export async function markSize(page: Page, n: number): Promise<void> {
  await openSheetIfClosed(page);
  const option = page.locator(`${sel.sizeOption}[data-size-option="${n}"]`);
  await option.click();
  await expect(page.locator(`${sel.sheet}:popover-open`), 'a marking press keeps the sheet open').toBeVisible();
  await expect(option).toHaveAttribute('aria-checked', 'true');
}

/** A MARKING press on a level option (level 1 to 4), with the same rule: the sheet stays open and the option is checked. */
export async function markLevel(page: Page, level: number): Promise<void> {
  await openSheetIfClosed(page);
  const option = page.locator(sel.levelOption).nth(level - 1);
  await option.click();
  await expect(page.locator(`${sel.sheet}:popover-open`), 'a marking press keeps the sheet open').toBeVisible();
  await expect(option).toHaveAttribute('aria-checked', 'true');
}

/** Choose a board size in the setup sheet: mark it, press «Почати» (confirming if the board has entries), wait for the board. */
export async function chooseSize(page: Page, n: number): Promise<void> {
  await markSize(page, n);
  await page.locator(sel.setupStart).click();
  const dialog = page.locator(`${sel.dialog}[open]`);
  if ((await dialog.count()) > 0) await page.locator(sel.confirmYes).click();
  await expect(page.locator(`${sel.board}[data-size="${n}"]`)).toBeVisible();
}

export interface Measured {
  name: string;
  width: number;
  height: number;
}

/** Width and height in CSS px of every element the locator matches. */
export async function measure(locator: Locator, name: string): Promise<Measured[]> {
  const out: Measured[] = [];
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    const box = await locator.nth(i).boundingBox();
    if (box === null) throw new Error(`${name} #${i + 1} has no layout box`);
    const label = (await locator.nth(i).getAttribute('aria-label')) ?? (await locator.nth(i).innerText()).trim().split('\n')[0] ?? '';
    out.push({ name: `${name} «${label}»`, width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 });
  }
  if (out.length === 0) throw new Error(`${name}: no element matched`);
  return out;
}
