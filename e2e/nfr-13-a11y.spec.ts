// @trace NFR-13
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { ElementHandle, Page } from '@playwright/test';
import { chooseSize, openConfirm, openPage, openRules, openSheet, sel, showHint, solveByHints } from './helpers';

// NFR-13 (sampled): two viewports x two colour schemes. axe runs in the default, hint, win, rules and confirmation
// states at 6x6, plus the setup sheet open at 6x6 and at 4x4; any violation of any impact fails. The focus sweep
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
        // Confirmation dialog, opened by the keyboard; it opens on «Скасувати».
        await page.locator(sel.emptyCell).first().focus();
        await page.keyboard.press('Enter');
        await page.locator(sel.reset).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator(`${sel.dialog}[open]`)).toBeVisible();
        await sweep(page, seen);

        const expected = ['cell', 'hint', 'reset', 'new', 'rules', 'setup', 'size option', 'level option', 'setup-close', 'rules-close', 'confirm yes', 'confirm no'];
        const misses = [
          ...expected.filter((k) => !seen.has(k)).map((k) => `${k}: never reached by the keyboard`),
          ...[...seen.values()].filter((v) => v !== ''),
        ];
        expect(misses, `${misses.length} focus problem(s):\n${misses.join('\n')}`).toEqual([]);
      });
    });
  }
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
async function record(page: Page, seen: Map<string, string>): Promise<void> {
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
    ? `${focused.kind} «${focused.name}»: :focus-visible does not match after a keyboard move`
    : !indicator
      ? `${focused.kind} «${focused.name}»: no visible change on focus (outline «${focused.outline}», shadow «${focused.shadow}»)`
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
