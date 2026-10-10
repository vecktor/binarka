// @trace NFR-13
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { ElementHandle, Page } from '@playwright/test';
import { chooseSize, markLevel, markSize, openConfirm, openPage, openRules, openSheet, sel, showHint, solveByHints } from './helpers';

// NFR-13 (sampled): two viewports x two colour schemes. axe runs in the default, hint, win, rules and confirmation
// states at 6x6, plus the setup sheet open at 6x6 and at 4x4 and open with a marked choice that differs from the board shown
// (update-setup-sheet-start, FR-100); any violation of any impact fails. The focus sweep
// reaches every control by the keyboard and asks for a visible indicator that differs from the unfocused look.
// This spec replaces the route-only reference script scripts/check-a11y.mjs (integrity-locked, kept unchanged).
const VIEWPORTS = [
  [375, 812],
  [1280, 800],
] as const;
const SCHEMES = ['light', 'dark'] as const;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const STATES: readonly [string, (page: Page) => Promise<void>][] = [
  ['default', async () => { /* as mounted */ }],
  ['hint', showHint],
  ['win', solveByHints],
  ['rules', openRules],
  ['confirmation', openConfirm],
  ['setup sheet', openSheet],
  ['setup sheet at 4x4', async (page) => { await chooseSize(page, 4); await openSheet(page); }],
  // «Поле 8×8» and «Мозколамка» marked by clicks, «Почати» not pressed: the sheet stays open on a 6×6 · «Розминка» board
  ['setup sheet with a marked choice that differs from the board', async (page) => { await markSize(page, 8); await markLevel(page, 4); }],
];

for (const [width, height] of VIEWPORTS) {
  for (const colorScheme of SCHEMES) {
    test.describe(`${width}x${height} ${colorScheme}`, () => {
      test.use({ viewport: { width, height }, colorScheme });

      for (const [state, enter] of STATES) {
        test(`NFR-13 axe: no violation in the ${state} state`, async ({ page }) => {
          await openPage(page);
          await enter(page);
          const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
          const lines = violations.map((v) => `${v.id} (${v.impact ?? 'n/a'}, ${v.nodes.length} node(s)): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('; ')}`);
          expect(lines, `${lines.length} axe violation(s) in the ${state} state:\n${lines.join('\n')}`).toEqual([]);
        });
      }

      test('NFR-13 focus: every control shows a visible focus indicator from the keyboard', async ({ page }) => {
        await openPage(page);
        const seen = new Map<string, string>(); // control kind -> first failure, or '' when fine

        // Default state: Tab through the whole page.
        await sweep(page, seen);
        // Rules panel, opened by the keyboard («Зрозуміло» takes focus).
        await page.locator(sel.rules).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator(`${sel.rulesPanel}:popover-open`)).toBeVisible();
        await record(page, seen);
        await page.keyboard.press('Escape');
        // Setup sheet, opened by the keyboard; Tab walks into it.
        await page.locator(sel.summary).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator(`${sel.sheet}:popover-open`)).toBeVisible();
        await sweep(page, seen);
        await page.keyboard.press('Escape');
        // Setup sheet with a marked choice (update-setup-sheet-start, FR-65 «Почати» shows a focus indicator in the marked state; review-gate
        // second fix round, finding 2): «Поле 8×8» and «Мозколамка» marked by clicks, then Tab from the last level option reaches «Почати».
        await markSize(page, 8);
        await markLevel(page, 4);
        await page.locator(sel.levelOption).nth(3).focus();
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => document.activeElement?.getAttribute('data-action') ?? ''), 'Tab from «Мозколамка» reaches «Почати»').toBe('setup-start');
        await record(page, seen, ' (sheet with a marked choice)');
        await page.keyboard.press('Escape');
        await expect(page.locator(`${sel.sheet}:popover-open`)).toHaveCount(0);
        // Confirmation dialog, opened by the keyboard; it opens on «Скасувати».
        await page.locator(sel.emptyCell).first().focus();
        await page.keyboard.press('Enter');
        await page.locator(sel.reset).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator(`${sel.dialog}[open]`)).toBeVisible();
        await sweep(page, seen);

        const expected = ['cell', 'hint', 'reset', 'new', 'rules', 'setup', 'size option', 'level option', 'setup-start', 'setup-close', 'rules-close', 'confirm yes', 'confirm no'];
        const misses = [
          ...expected.filter((k) => !seen.has(k)).map((k) => `${k}: never reached by the keyboard`),
          ...[...seen.values()].filter((v) => v !== ''),
        ];
        expect(misses, `${misses.length} focus problem(s):\n${misses.join('\n')}`).toEqual([]);
      });
    });
  }
}

// update-setup-sheet-start, review-gate second fix round (finding 1, FR-65, WCAG 2.4.11): with «Поле 4×4» marked the sheet scrolls inside
// itself, and the sticky footer strip (the ::before of the open sheet, calc(2.75rem + 16px) tall, bottom-aligned with «Почати» and
// «Закрити») must not cover the focus ring of an option the keyboard reaches. Sampled: two viewports, light scheme, Chromium.
for (const [width, height] of [
  [320, 700],
  [1366, 650],
] as const) {
  test.describe(`${width}x${height} focus not obscured by the sheet footer`, () => {
    test.use({ viewport: { width, height } });

    test('NFR-13 focus: with «Поле 4×4» marked, no focused option has its ring under the footer strip', async ({ page }) => {
      await openPage(page);
      await markSize(page, 4);
      // Premise: the sheet scrolls inside itself; without it the check would pass vacuously.
      const box = await page.locator(sel.sheet).evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
      expect(box.scrollHeight, `premise: the sheet scrolls (scrollHeight ${box.scrollHeight} > clientHeight ${box.clientHeight})`).toBeGreaterThan(box.clientHeight);

      // The start is a script focus after a mouse click: ask for the keyboard-style ring (:focus-visible) like record() does; every later stop is a Tab.
      await page.locator(`${sel.sizeOption}[data-size-option="4"]`).evaluate((el) => {
        el.blur(); // the click left it focused, so a plain focus() would be a no-op
        el.focus({ focusVisible: true });
      });
      const measureFocus = (): Promise<{ name: string; ringBottom: number; stripTop: number; ringWidth: number; scrollTop: number } | null> =>
        page.evaluate(() => {
          const el = document.activeElement;
          const start = document.querySelector('[data-action="setup-start"]');
          const sheet = document.querySelector('[data-section="setup"]');
          if (el === null || start === null || sheet === null || !el.matches('[data-size-option], [data-control="level"] [role="radio"]')) return null;
          const s = getComputedStyle(el);
          const ringWidth = s.outlineStyle === 'none' ? 0 : parseFloat(s.outlineWidth);
          return {
            name: el.textContent.trim().slice(0, 40),
            ringBottom: el.getBoundingClientRect().bottom + parseFloat(s.outlineOffset) + ringWidth,
            stripTop: start.getBoundingClientRect().top - 16,
            ringWidth,
            scrollTop: sheet.scrollTop,
          };
        });

      const problems: string[] = [];
      const visited: string[] = [];
      let levels = 0;
      for (let i = 0; i < 12 && levels < 4; i++) {
        const m = await measureFocus();
        if (m !== null) {
          visited.push(m.name);
          if (m.ringWidth <= 0) problems.push(`«${m.name}»: no focus ring was measured (outline width ${m.ringWidth})`);
          if (m.ringBottom > m.stripTop) problems.push(`«${m.name}»: ring bottom ${m.ringBottom} is below the strip top ${m.stripTop} (scrollTop ${m.scrollTop})`);
          if (await page.evaluate(() => document.activeElement?.matches('[data-control="level"] [role="radio"]') ?? false)) levels += 1;
        }
        await page.keyboard.press('Tab');
      }
      expect(levels, `premise: Tab reached the four level options (visited ${visited.join(', ')})`).toBe(4);
      expect(problems, `${problems.length} option(s) with the focus ring under the footer strip:\n${problems.join('\n')}`).toEqual([]);
    });
  });
}

/**
 * Record the focused control, then press Tab until focus returns to a control already seen in this sweep (or 120
 * presses), recording each one. A Tab that leaves the document (from the last control of a modal dialog, focus goes
 * to the browser and the next Tab comes back) is stepped over; two in a row end the sweep.
 */
async function sweep(page: Page, seen: Map<string, string>): Promise<void> {
  const keys = new Set<string>();
  const current = (): Promise<string> =>
    page.evaluate(() => {
      const el = document.activeElement;
      if (el === null || el === document.body) return '';
      if (!el.hasAttribute('data-g1-id')) el.setAttribute('data-g1-id', String(document.querySelectorAll('[data-g1-id]').length));
      return el.getAttribute('data-g1-id') ?? '';
    });
  const first = await current();
  if (first !== '') {
    keys.add(first);
    await record(page, seen);
  }
  let outside = 0;
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    const id = await current();
    if (id === '') {
      outside += 1;
      if (outside > 1) break;
      continue;
    }
    outside = 0;
    if (keys.has(id)) break;
    keys.add(id);
    await record(page, seen);
  }
}

interface Look {
  kind: string;
  name: string;
  focusVisible: boolean;
  outline: string;
  shadow: string;
}

/** Record the focused control's look, then compare it with its unfocused look. */
async function record(page: Page, seen: Map<string, string>, context = ''): Promise<void> {
  const handle = (await page.evaluateHandle(() => document.activeElement)).asElement() as ElementHandle<HTMLElement> | null;
  if (handle === null) return;
  const focused = await handle.evaluate(look);
  if (focused.kind === '') return; // not one of the page's controls
  // The unfocused look: the same element after focus moves to the document body.
  await handle.evaluate((el) => {
    el.blur();
  });
  const plain = await handle.evaluate(look);
  await handle.evaluate((el) => {
    el.focus({ focusVisible: true });
  });

  const indicator = (focused.outline !== '' || focused.shadow !== 'none') && (focused.outline !== plain.outline || focused.shadow !== plain.shadow);
  const problem = !focused.focusVisible
    ? `${focused.kind} «${focused.name}»${context}: :focus-visible does not match after a keyboard move`
    : !indicator
      ? `${focused.kind} «${focused.name}»${context}: no visible change on focus (outline «${focused.outline}», shadow «${focused.shadow}»)`
      : '';
  if (!seen.has(focused.kind) || (seen.get(focused.kind) === '' && problem !== '')) seen.set(focused.kind, problem);
}

function look(el: HTMLElement): Look {
  const kind = el.matches('[data-cell]')
    ? 'cell'
    : el.matches('[data-size-option]')
      ? 'size option'
      : el.matches('[data-control="level"] [role="radio"]')
        ? 'level option'
        : el.matches('.rules-close')
          ? 'rules-close'
          : el.matches('[data-confirm]')
            ? `confirm ${el.getAttribute('data-confirm') ?? ''}`
            : (el.getAttribute('data-action') ?? '');
  const s = getComputedStyle(el);
  const outline = s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0 ? '' : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`;
  return { kind, name: (el.getAttribute('aria-label') ?? el.textContent).trim().slice(0, 40), focusVisible: el.matches(':focus-visible'), outline, shadow: s.boxShadow };
}
