// @trace NFR-13
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { ElementHandle, Page } from '@playwright/test';
import { chooseSize, hexToRgb, markLevel, markSize, openConfirm, openPage, openRules, openSettings, openSheet, pressTheme, readPageColours, sel, showHint, solveByHints } from './helpers';
import type { ThemeChoice } from './helpers';

// NFR-13 (sampled): two viewports x two colour schemes. axe runs in the default, hint, win, rules and confirmation
// states at 6x6, plus the setup sheet open at 6x6 and at 4x4 and open with a marked choice that differs from the board shown
// (update-setup-sheet-start, FR-100); any violation of any impact fails. The focus sweep
// reaches every control by the keyboard and asks for a visible indicator that differs from the unfocused look.
// This spec replaces the route-only reference script scripts/check-a11y.mjs (integrity-locked, kept unchanged).
// add-theme-switch (NFR-13, FR-102, FR-104 to FR-106, FR-117; delta spec openspec/changes/add-theme-switch/specs/play-page/spec.md): the
// sweep until now only emulated the SYSTEM scheme, so a manual override was never checked. The manual-theme states, the rendered colours,
// the live change of auto, the focused theme option and the focus sweep over the settings panel are added at the end of the file and in
// the focus test. Coverage is `sampled` (two viewports, the listed theme pairs), never continuum. The dark and light --color-page are read
// from the built stylesheet's own rules (`readPageColours`), never from the page being judged, and each test first asserts that the page
// really is in the theme it is meant to check, so a page that never turns dark cannot pass by being compared with itself.
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
        // Settings panel (add-theme-switch, FR-117), opened by the keyboard; Tab walks into it (the three theme options and «Закрити»).
        await expect(page.locator(sel.settings), 'the page has the settings button').toHaveCount(1);
        await page.locator(sel.settings).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator(`${sel.settingsPanel}:popover-open`)).toBeVisible();
        await sweep(page, seen);
        await page.keyboard.press('Escape');
        await expect(page.locator(`${sel.settingsPanel}:popover-open`)).toHaveCount(0);
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

        // add-theme-switch (autonomy-log row 124, A6): the settings button, the theme options and the panel's «Закрити» join the controls that
        // the keyboard must reach (the existing rule "every control reached by the keyboard", applied to the new controls)
        const expected = ['cell', 'hint', 'reset', 'new', 'rules', 'settings', 'setup', 'size option', 'level option', 'theme option', 'setup-start', 'setup-close', 'settings-close', 'rules-close', 'confirm yes', 'confirm no'];
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
  [320, 568],
  [375, 667],
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

// ---------------------------------------------------------------------------------------------------------
// add-theme-switch: the manual themes (NFR-13, FR-102, FR-104 to FR-106, FR-117). Sampled: two viewports, two stored/system pairs.
// ---------------------------------------------------------------------------------------------------------

const MANUAL_PAIRS = [
  { stored: 'dark', system: 'light' },
  { stored: 'light', system: 'dark' },
] as const;

/** Premise of every manual-theme test: the page really is in the theme under test (attribute and rendered background). */
async function expectTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await expect(page.locator('html'), `<html data-theme> is ${theme}`).toHaveAttribute('data-theme', theme);
  const colours = await readPageColours(page);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background, `the body background is the ${theme} --color-page`).toBe(colours[theme]);
}

for (const [width, height] of VIEWPORTS) {
  for (const { stored, system } of MANUAL_PAIRS) {
    test.describe(`${width}x${height} manual ${stored} on a ${system} system`, () => {
      test.use({ viewport: { width, height }, colorScheme: system });

      for (const panel of ['closed', 'open'] as const) {
        // delta «Manual themes pass the sweep»: axe-core with the settings panel closed and open, in both manual themes
        test(`NFR-13 axe: no violation with the settings panel ${panel}`, async ({ page }) => {
          await openPage(page, 1, { theme: stored });
          await expectTheme(page, stored);
          if (panel === 'open') await openSettings(page);
          const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
          const lines = violations.map((v) => `${v.id} (${v.impact ?? 'n/a'}, ${v.nodes.length} node(s)): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('; ')}`);
          expect(lines, `${lines.length} axe violation(s), ${stored} on a ${system} system, settings panel ${panel}:\n${lines.join('\n')}`).toEqual([]);
        });
      }
    });
  }
}

test.describe('manual themes against auto on the same system', () => {
  test('NFR-13 theme: a manual theme resolves the same colours as auto on that system', async ({ browser, baseURL }) => {
    // delta «A manual theme resolves the same tokens as auto on that system»: `dark` stored on a light system and `auto` on a dark system
    const read = async (colorScheme: 'light' | 'dark', theme: ThemeChoice | undefined): Promise<Record<string, string>> => {
      const context = await browser.newContext({ baseURL, colorScheme, viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage();
        await openPage(page, 1, theme === undefined ? {} : { theme });
        await expectTheme(page, 'dark');
        return await page.evaluate(() => {
          const pick = (el: Element | null, name: string): Record<string, string> => {
            if (el === null) throw new Error(`${name}: no element`);
            const s = getComputedStyle(el);
            return { [`${name} color`]: s.color, [`${name} background`]: s.backgroundColor, [`${name} border`]: s.borderTopColor };
          };
          return {
            ...pick(document.body, 'body'),
            ...pick(document.querySelector('[data-board] [data-cell]'), 'cell'),
            ...pick(document.querySelector('[data-action="hint"]'), 'button'),
          };
        });
      } finally {
        await context.close();
      }
    };
    const manual = await read('light', 'dark');
    const auto = await read('dark', undefined);
    expect(manual, 'dark stored on a light system computes the same colours as auto on a dark system').toEqual(auto);
  });
});

test.describe('the rendered colours follow the effective theme', () => {
  test.use({ viewport: { width: 375, height: 812 }, colorScheme: 'light' });

  test('NFR-13 theme: dark stored on a light system gives the dark background and color-scheme dark', async ({ page }) => {
    // delta «The rendered colours follow the effective theme»: the binding check of color-scheme (the stylesheet owns it)
    await openPage(page, 1, { theme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const colours = await readPageColours(page);
    const rendered = await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      scheme: getComputedStyle(document.documentElement).colorScheme,
    }));
    expect(rendered.background, 'the body background equals the dark --color-page').toBe(colours.dark);
    expect(rendered.scheme, 'color-scheme of <html> is dark').toBe('dark');
  });

  test('NFR-13 theme: auto follows a live change of the system scheme without a reload', async ({ page }) => {
    // delta «Auto follows a live change in a real browser»
    await page.emulateMedia({ colorScheme: 'light' });
    await openPage(page);
    await expect(page.locator('html'), 'premise: auto on a light system is light').toHaveAttribute('data-theme', 'light');
    const colours = await readPageColours(page);
    const lightBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(lightBackground, 'premise: the light --color-page').toBe(colours.light);

    await page.emulateMedia({ colorScheme: 'dark' }); // no reload
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'the body background equals the dark --color-page').toBe(colours.dark);
    const meta = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(meta === null ? '' : hexToRgb(meta), 'the theme-color meta equals the dark --color-page').toBe(colours.dark);
  });

  test('NFR-13 theme: a press stores the theme, a reload keeps it and a light dismiss keeps the choice', async ({ page }) => {
    // the browser check of tasks.md 6.1 (k2) as an automated step: press-then-reload stores nothing by addInitScript
    await page.emulateMedia({ colorScheme: 'dark' });
    await openPage(page);
    await expect(page.locator('html'), 'premise: auto on a dark system is dark').toHaveAttribute('data-theme', 'dark');
    await openSettings(page);
    await pressTheme(page, 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('h1').click(); // a click outside the open panel: the browser's light dismiss
    await expect(page.locator(`${sel.settingsPanel}:popover-open`)).toHaveCount(0);
    await expect(page.locator('html'), 'the choice is kept after the light dismiss').toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expectTheme(page, 'light');
  });

  test('NFR-13 theme: light stored by the test on a dark system is light after a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openPage(page);
    await page.evaluate(() => { window.localStorage.setItem('binarka.theme', 'light'); });
    await page.reload();
    await expectTheme(page, 'light');
  });
});

test.describe('the focused theme option', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('NFR-13 focus: Tab from the settings button reaches a theme option with a solid outline of at least 2px', async ({ page }) => {
    // delta «The focused theme option shows an indicator»
    await openPage(page);
    await openSettings(page);
    await page.locator(sel.settings).focus();
    let reached = false;
    for (let i = 0; i < 8 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => document.activeElement?.matches('[data-theme-option]') ?? false);
    }
    expect(reached, 'Tab reaches a theme option').toBe(true);
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (el === null) throw new Error('no focused element');
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), focusVisible: el.matches(':focus-visible') };
    });
    expect(outline.focusVisible, ':focus-visible matches after a keyboard move').toBe(true);
    expect(outline.style, 'the outline style is not none').not.toBe('none');
    expect(outline.width, 'the outline is at least 2px wide').toBeGreaterThanOrEqual(2);
  });
});

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
        : el.matches('[data-theme-option]')
          ? 'theme option'
          : el.matches('.rules-close')
            ? 'rules-close'
            : el.matches('[data-confirm]')
              ? `confirm ${el.getAttribute('data-confirm') ?? ''}`
              : (el.getAttribute('data-action') ?? '');
  const s = getComputedStyle(el);
  const outline = s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0 ? '' : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`;
  return { kind, name: (el.getAttribute('aria-label') ?? el.textContent).trim().slice(0, 40), focusVisible: el.matches(':focus-visible'), outline, shadow: s.boxShadow };
}
