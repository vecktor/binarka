// @trace NFR-14
// @trace FR-68
// @trace FR-65
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openPage, sel } from './helpers';

// update-settings-panel (NFR-14, FR-68, FR-65; G2 settings-panel block, the ADDED requirement «The settings panel takes the design's size, place and paint», its scenarios
// «The panel, the controls and «Закрити» match the design build's boxes», «An unchosen and a chosen option have the design's computed paint», the browser half of «The theme
// options grow by content and the language options are equal halves» and «On a short window a focused option stays clear of «Закрити»»). Written FIRST (red) from
// openspec/changes/update-settings-panel/specs/play-page/spec.md, before the port. Runs in the existing `layout` project (its `testMatch` already has `nfr-14-*`).
//
// Part 1, the fixture: quality/design-geometry.json holds the key `settingsPanel` (scripts/freeze-design-geometry.mjs, task 3.2) with 7 cases. While the key is absent the tests
// FAIL with the freeze instruction; they are never skipped.
// Part 2, the boxes: each case opens the page at the case's viewport with the case's capture board (FR-119) and, for the dark case, the stored theme (as the capture adapter does),
// presses the settings button, asserts the panel is `:popover-open`, and compares the boxes of the panel, the two controls, the chosen option of each and «Закрити» with the case's
// recorded design boxes within 0.5 px in x, y, width and height.
// Part 3, the paint: at 375-light-settings and 375-light-settings-dark the computed color, border-top-color, border-top-width, font-weight and font-size of an unchosen and a chosen
// option of each control equal the design's recorded values; an unchosen option's background-color equals the design card's (the design's option is transparent over its card), a
// chosen option's equals the recorded value.
// Part 4, the halves: the two language options have equal widths within 0.5 px at every case (the stylesheet cannot see it).
// Part 5, the short-window focus walk (667x375, 568x320 bottom sheet; 1024x360 dropdown): Tab through the panel with no scrolling by script. Its premise (the panel scrolls) is asserted.
//   * The clause "a focused option's ring stays clear of the mask" is a GUARD before the port: nothing covers an option on today's page, so it cannot fail there; after the port it is the proof.
//   * The clause "«Закрити» lies inside the panel and is stuck within 17.5 px of its bottom edge" is NOT green before the port: today's button is not sticky (see the report of the test
//     engineer); it goes green only when the button is `position: sticky`.
//
// Sampling dimensions: the viewport and the state of the 7 cases of the key (320x700, 375x812, 768x1024, 1024x768, 1366x650, 1440x900 light, "Як у системі" chosen; 375x812 with the
// stored dark theme and "Темна" chosen) and, for the walk, the three short windows. Coverage: sampled. The stricter instruments, to run before a block-done claim:
// `node scripts/visual-block.mjs --block settings` (the per-block crop over the 26 settings shots), `npm run check:visual` (the per-shot gate) and the same walk at more heights. This file
// claims neither all widths nor a pixel floor.

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface OptionPaint {
  color: string;
  backgroundColor: string;
  borderTopColor: string;
  borderTopWidth: string;
  fontWeight: string;
  fontSize: string;
}
interface ControlPaint {
  unchosen: OptionPaint;
  chosen: OptionPaint;
}
interface SettingsCase {
  shot: string;
  width: number;
  height: number;
  state: string;
  captureBoard?: unknown;
  afterLoad?: string;
  storedTheme?: string;
  boxes: Record<string, Box | null>;
  paint: { card: { theme: { backgroundColor: string }; language: { backgroundColor: string } }; theme: ControlPaint; language: ControlPaint };
}
interface SettingsKey {
  selectors: string[];
  coverage: string;
  provenance: Record<string, unknown>;
  cases: SettingsCase[];
}
interface Fixture {
  provenance: { designCommit: string; designCssSha1: string };
  tolerancePx: number;
  selectors: string[];
  cases: { shot: string }[];
  settingsPanel?: SettingsKey;
}

const fixture = JSON.parse(readFileSync('quality/design-geometry.json', 'utf8')) as Fixture;

const PANEL = '[data-section="settings"]';
const THEME = '[data-control="theme"]';
const LANGUAGE = '[data-control="language"]';
const THEME_CHOSEN = '[data-control="theme"] button[aria-checked="true"]';
const LANGUAGE_CHOSEN = '[data-control="language"] button[aria-checked="true"]';
const CLOSE = '[data-action="settings-close"]';
const SELECTORS = [PANEL, THEME, LANGUAGE, THEME_CHOSEN, LANGUAGE_CHOSEN, CLOSE];
const FREEZE = 'quality/design-geometry.json has no key settingsPanel: run BINARKA_PORT_BASE=<base> node scripts/freeze-design-geometry.mjs after building design/v0 (design/README.md)';
const TOLERANCE = 0.5;

interface CaseSpec {
  shot: string;
  width: number;
  height: number;
  storedTheme?: 'dark';
}
const CASES: CaseSpec[] = [
  { shot: '320-light-settings', width: 320, height: 700 },
  { shot: '375-light-settings', width: 375, height: 812 },
  { shot: '768-light-settings', width: 768, height: 1024 },
  { shot: '1024-light-settings', width: 1024, height: 768 },
  { shot: '1366-light-settings', width: 1366, height: 650 },
  { shot: '1440-light-settings', width: 1440, height: 900 },
  { shot: '375-light-settings-dark', width: 375, height: 812, storedTheme: 'dark' },
];
const EXPECTED_SHOTS = CASES.map((c) => c.shot).sort();
const PAINT_SHOTS = ['375-light-settings', '375-light-settings-dark'];

// The top-level fixture as it stood before this change: the key is ADDED, nothing else moves (the same constants as e2e/nfr-14-setup-sheet.spec.ts).
const TOP_LEVEL_SELECTORS = [
  '.page-header',
  '.page-header h1',
  '.page-header .logo',
  '[data-action="settings"]',
  '[data-action="rules"]',
  '[data-action="setup"]',
  '[data-board]',
  '[data-board] [data-cell]:first-child',
  '[data-board] [data-cell]:last-child',
  '[data-action="hint"]',
  '[data-action="reset"]',
  '[data-action="new"]',
  '.messages',
  '[data-message="idle"]',
  '[data-message="hint"]',
  '[data-message="win"]',
];
const TOP_LEVEL_DESIGN_COMMIT = '41c51651e832cae79b58ce7b492a3550e43f19da';
const TOP_LEVEL_DESIGN_CSS_SHA1 = '8115024412a8e6c6d135136183fae458489597d0';
// Review gate fix round 1, finding A: the other blocks' keys, pinned as their recorded cases (SHA-1 of JSON.stringify of the parsed cases,
// read from main's quality/design-geometry.json at 18e5f3f) and recorded provenance, so adding settingsPanel can change neither.
// DELIBERATE CHANGE (design stream DS of wave 3, 2026-10-12; A-60 amended and signed, the user moved the NFR-14 reference to review-set-15): design
// iteration 17 changed the design, so the refreeze writes its provenance (designBuildSha1 of that build) into every key. rulesPanel keeps the cases
// of 18e5f3f (the 28px moves no rules panel box); setupSheet's cases are the iteration-17 refreeze's (docs/qa/design-stream/refreeze.txt).
const OTHER_KEYS = [
  { key: 'rulesPanel', count: 8, casesSha1: 'f70bb8c08a4415002cdd011efb40153047b4a75d', designBuildSha1: 'PENDING-REFREEZE' },
  { key: 'setupSheet', count: 12, casesSha1: 'PENDING-REFREEZE', designBuildSha1: 'PENDING-REFREEZE' },
] as const;

const isBox = (v: unknown): v is Box => {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Record<string, unknown>;
  return ['x', 'y', 'w', 'h'].every((k) => typeof b[k] === 'number' && Number.isFinite(b[k]));
};
const fmt = (b: Box | null | undefined): string => (b ? `${b.x.toFixed(2)},${b.y.toFixed(2)} ${b.w.toFixed(2)}x${b.h.toFixed(2)}` : 'absent');
const caseOf = (shot: string): SettingsCase | undefined => fixture.settingsPanel?.cases.find((c) => c.shot === shot);

// ---------------------------------------------------------------------------------------------------------
// Part 1: the fixture
// ---------------------------------------------------------------------------------------------------------

test('@trace NFR-14 @trace FR-68 the fixture keeps its 32 top-level shots, selectors, tolerance and design hashes (the key is ADDED; the design hashes name design iteration 17, review-set-15)', () => {
  expect(fixture.cases, 'the top-level cases of quality/design-geometry.json').toHaveLength(32);
  expect(fixture.tolerancePx).toBe(TOLERANCE);
  expect(fixture.selectors).toEqual(TOP_LEVEL_SELECTORS);
  expect(fixture.provenance.designCommit, 'the top-level provenance names the design commit of iteration 17').toBe(TOP_LEVEL_DESIGN_COMMIT);
  expect(fixture.provenance.designCssSha1, 'the top-level provenance names the design CSS hash of iteration 17').toBe(TOP_LEVEL_DESIGN_CSS_SHA1);
});

// DELIBERATE CHANGE (update-settings-panel, review gate fix round 1, finding A; the scenario «The panel, the controls and «Закрити» match the
// design build's boxes»: "no existing case, selector or provenance field of the file is changed by adding it"): the first freeze rewrote the
// designBuildSha1 of rulesPanel and setupSheet; the script now keeps each key's recorded provenance and fails on drifted cases.
test('@trace NFR-14 @trace FR-68 adding settingsPanel changes no case and no provenance field of rulesPanel and setupSheet, and settingsPanel names the same design', () => {
  const raw = fixture as unknown as Record<string, { cases: unknown[]; provenance: Record<string, string> } | undefined>;
  for (const other of OTHER_KEYS) {
    const key = raw[other.key];
    expect(key, `quality/design-geometry.json keeps the key ${other.key}`).toBeDefined();
    if (key === undefined) continue;
    expect(key.cases, `${other.key}.cases`).toHaveLength(other.count);
    expect(createHash('sha1').update(JSON.stringify(key.cases)).digest('hex'), `${other.key}.cases are the recorded ones`).toBe(other.casesSha1);
    expect(key.provenance.designCommit, `${other.key}.provenance.designCommit`).toBe(TOP_LEVEL_DESIGN_COMMIT);
    expect(key.provenance.designCssSha1, `${other.key}.provenance.designCssSha1`).toBe(TOP_LEVEL_DESIGN_CSS_SHA1);
    expect(key.provenance.designBuildSha1, `${other.key}.provenance.designBuildSha1 is the recorded one, not rewritten by a refreeze`).toBe(other.designBuildSha1);
  }
  expect(fixture.settingsPanel?.provenance.designCommit, `settingsPanel names the top-level design commit (${FREEZE})`).toBe(TOP_LEVEL_DESIGN_COMMIT);
  expect(fixture.settingsPanel?.provenance.designCssSha1, 'settingsPanel names the top-level design CSS hash').toBe(TOP_LEVEL_DESIGN_CSS_SHA1);
});

test('@trace NFR-14 @trace FR-68 the fixture holds the key settingsPanel: selectors, sampled coverage, its own provenance and exactly the 7 cases', () => {
  const key = fixture.settingsPanel;
  expect(key, FREEZE).toBeDefined();
  if (key === undefined) return;

  expect(key.coverage, 'the key declares sampled coverage').toBe('sampled');
  expect(key.selectors, 'the key names the panel, the two controls, the chosen option of each and «Закрити»').toEqual(SELECTORS);
  for (const field of ['designCommit', 'designCssSha1', 'designBuildSha1', 'browser']) {
    const value = key.provenance[field];
    expect(typeof value === 'string' && value !== '', `settingsPanel.provenance.${field} is a non-empty string (got ${JSON.stringify(value)})`).toBe(true);
  }
  expect(key.cases.map((c) => c.shot).sort(), 'the shots of settingsPanel.cases').toEqual(EXPECTED_SHOTS);
  for (const spec of CASES) {
    const c = key.cases.find((x) => x.shot === spec.shot);
    expect(c, `settingsPanel.cases has ${spec.shot}`).toBeDefined();
    if (c === undefined) continue;
    expect([c.width, c.height], `${spec.shot}: the viewport`).toEqual([spec.width, spec.height]);
    expect(c.afterLoad, `${spec.shot}: the recorded action after load`).toBe('open-settings');
    expect(c.storedTheme, `${spec.shot}: the recorded stored theme`).toBe(spec.storedTheme);
    for (const selector of SELECTORS) {
      expect(isBox(c.boxes[selector]), `${spec.shot}: boxes holds ${selector} (got ${JSON.stringify(c.boxes[selector])})`).toBe(true);
    }
    for (const control of ['theme', 'language'] as const) {
      for (const state of ['unchosen', 'chosen'] as const) {
        const paint = c.paint[control][state] as Partial<OptionPaint> | undefined;
        for (const property of ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'fontWeight', 'fontSize'] as const) {
          expect(typeof paint?.[property] === 'string' && paint[property] !== '', `${spec.shot}: paint.${control}.${state}.${property} is a non-empty string (got ${JSON.stringify(paint?.[property])})`).toBe(true);
        }
      }
      const card = c.paint.card[control].backgroundColor;
      expect(typeof card === 'string' && card !== '', `${spec.shot}: paint.card.${control}.backgroundColor is a non-empty string (got ${JSON.stringify(card)})`).toBe(true);
    }
  }
});

// ---------------------------------------------------------------------------------------------------------
// The page side
// ---------------------------------------------------------------------------------------------------------

/** Open the page as the capture does (the case's board, the stored theme before the load), then press the settings button and assert the panel is open. */
async function openPanel(page: Page, spec: CaseSpec, board: unknown): Promise<void> {
  if (board !== undefined && board !== null) {
    await page.addInitScript((b: unknown) => {
      (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = b;
    }, board);
  }
  await openPage(page, 1, spec.storedTheme === undefined ? {} : { theme: spec.storedTheme });
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), `${spec.shot}: the page resolved the theme`).toBe(spec.storedTheme ?? 'light');
  // A script click, as the capture adapter does (no pointer on the page).
  await page.locator(sel.settings).evaluate((el: HTMLElement) => {
    el.click();
  });
  await expect(page.locator(`${PANEL}:popover-open`), `${spec.shot}: the settings panel is :popover-open after the press`).toBeVisible();
}

async function readBoxes(page: Page): Promise<Record<string, Box | null>> {
  return page.evaluate((selectors: string[]) => {
    const out: Record<string, { x: number; y: number; w: number; h: number } | null> = {};
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el === null) {
        out[selector] = null;
        continue;
      }
      const r = el.getBoundingClientRect();
      out[selector] = { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return out;
  }, SELECTORS);
}

// ---------------------------------------------------------------------------------------------------------
// Part 2 to 4: the boxes, the paint and the halves, 7 cases (generated from the expected shot names, not from the fixture)
// ---------------------------------------------------------------------------------------------------------

for (const spec of CASES) {
  test.describe(`${spec.shot} (${spec.width}x${spec.height})`, () => {
    test.use({ viewport: { width: spec.width, height: spec.height }, reducedMotion: 'reduce', colorScheme: 'light' });

    test(`@trace NFR-14 @trace FR-68 ${spec.shot}: the open panel, the two controls, the chosen option of each and «Закрити» match the design's boxes within ${TOLERANCE} px`, async ({ page }) => {
      const c = caseOf(spec.shot);
      await openPanel(page, spec, c?.captureBoard);
      const have = await readBoxes(page);
      const problems: string[] = [];
      if (c === undefined) {
        problems.push(`${FREEZE} (no case ${spec.shot})`);
      } else {
        for (const selector of SELECTORS) {
          const want = c.boxes[selector] ?? null;
          const got = have[selector] ?? null;
          if (want === null || got === null) {
            problems.push(`${spec.shot} ${selector}: ${want === null ? 'no design box in the fixture' : 'missing on the page'} (page ${fmt(got)}, design ${fmt(want)})`);
            continue;
          }
          const off = (['x', 'y', 'w', 'h'] as const).filter((k) => Math.abs(got[k] - want[k]) > TOLERANCE).map((k) => `${k} ${got[k].toFixed(2)} vs ${want[k].toFixed(2)}`);
          if (off.length > 0) problems.push(`${spec.shot} ${selector}: page ${fmt(got)}, design ${fmt(want)}; off at ${off.join(', ')}`);
        }
      }
      expect(problems, `${spec.shot}: ${problems.length} problem(s)`).toEqual([]);
    });

    test(`@trace NFR-14 @trace FR-68 ${spec.shot}: the two language options are equal halves (widths within ${TOLERANCE} px)`, async ({ page }) => {
      await openPanel(page, spec, caseOf(spec.shot)?.captureBoard);
      const widths = await page.locator(`${LANGUAGE} button`).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
      expect(widths, `${spec.shot}: the language control holds two options`).toHaveLength(2);
      const [a, b] = widths;
      expect(Math.abs((a ?? 0) - (b ?? 0)), `${spec.shot}: the language options' widths ${String(a)} and ${String(b)}`).toBeLessThanOrEqual(TOLERANCE);
    });

    if (PAINT_SHOTS.includes(spec.shot)) {
      test(`@trace NFR-14 @trace FR-68 ${spec.shot}: an unchosen and a chosen option of each control have the design's computed paint`, async ({ page }) => {
        const c = caseOf(spec.shot);
        await openPanel(page, spec, c?.captureBoard);
        const read = (control: string, checked: string): Promise<OptionPaint> =>
          page.locator(`[data-control="${control}"] button[aria-checked="${checked}"]`).first().evaluate((el) => {
            const s = getComputedStyle(el);
            return { color: s.color, backgroundColor: s.backgroundColor, borderTopColor: s.borderTopColor, borderTopWidth: s.borderTopWidth, fontWeight: s.fontWeight, fontSize: s.fontSize };
          });
        const problems: string[] = [];
        if (c === undefined) problems.push(`${FREEZE} (no case ${spec.shot})`);
        for (const control of ['theme', 'language'] as const) {
          for (const state of ['unchosen', 'chosen'] as const) {
            const got = await read(control, state === 'chosen' ? 'true' : 'false');
            const want = c?.paint[control][state];
            if (want === undefined) continue;
            for (const property of ['color', 'borderTopColor', 'borderTopWidth', 'fontWeight', 'fontSize'] as const) {
              if (got[property] !== want[property]) problems.push(`${spec.shot} ${control} ${state} ${property}: page ${got[property]}, design ${want[property]}`);
            }
            // the design's unchosen option is transparent over its card: the page states the card's own fill
            const wantFill = state === 'unchosen' ? c?.paint.card[control].backgroundColor : want.backgroundColor;
            if (got.backgroundColor !== wantFill) {
              problems.push(`${spec.shot} ${control} ${state} backgroundColor: page ${got.backgroundColor}, design ${String(wantFill)}${state === 'unchosen' ? ' (the design card\'s fill)' : ''}`);
            }
          }
        }
        expect(problems, `${spec.shot}: ${problems.length} paint difference(s)`).toEqual([]);
      });
    }
  });
}

// ---------------------------------------------------------------------------------------------------------
// Part 5: the short-window focus walk (the clause on the ring is a GUARD before the port; the clause on the stuck button is not, see the header)
// ---------------------------------------------------------------------------------------------------------

const WINDOWS = [
  { width: 667, height: 375, regime: 'bottom sheet' },
  { width: 568, height: 320, regime: 'bottom sheet' },
  { width: 1024, height: 360, regime: 'dropdown' },
] as const;
const WALK: { kind: 'theme' | 'language' | 'close'; index: number }[] = [
  { kind: 'theme', index: 0 },
  { kind: 'theme', index: 1 },
  { kind: 'theme', index: 2 },
  { kind: 'language', index: 0 },
  { kind: 'language', index: 1 },
  { kind: 'close', index: 0 },
];
const MASK = 16; // 1rem
const RING_BELOW_OPTION = 2; // the 3px ring of `outline-offset: -1px` reaches 2px below the option's box

interface Focused {
  kind: 'theme' | 'language' | 'close' | 'other';
  index: number;
  name: string;
  rect: { top: number; bottom: number; left: number; right: number };
  panel: { top: number; bottom: number; left: number; right: number };
  close: { top: number; bottom: number; left: number; right: number };
}

async function readFocused(page: Page): Promise<Focused | null> {
  return page.evaluate(() => {
    const el = document.activeElement;
    const panel = document.querySelector('[data-section="settings"]');
    const close = document.querySelector('[data-action="settings-close"]');
    if (el === null || panel === null || close === null) return null;
    const edges = (e: Element): { top: number; bottom: number; left: number; right: number } => {
      const r = e.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const control = el.closest('[data-control]');
    const controlName = control?.getAttribute('data-control') ?? '';
    let kind: 'theme' | 'language' | 'close' | 'other' = 'other';
    let index = 0;
    if (el.matches('[data-action="settings-close"]')) kind = 'close';
    else if (controlName === 'theme' || controlName === 'language') {
      kind = controlName;
      const buttons: Element[] = [...(control?.querySelectorAll('button') ?? [])];
      index = buttons.indexOf(el);
    }
    return { kind, index, name: el.textContent.trim().slice(0, 30), rect: edges(el), panel: edges(panel), close: edges(close) };
  });
}

for (const w of WINDOWS) {
  test.describe(`${w.width}x${w.height} (${w.regime}) short-window focus walk`, () => {
    test.use({ viewport: { width: w.width, height: w.height }, reducedMotion: 'reduce', colorScheme: 'light' });

    test(`@trace NFR-14 @trace FR-65 ${w.width}x${w.height}: Tab through the panel keeps «Закрити» stuck inside the panel and every focused option clear of its mask (mask clause: GUARD before the port; stuck clause: red before the port)`, async ({ page }) => {
      await openPage(page);
      // Open with the keyboard: the focus stays on the settings button, and Tab then enters the open popover.
      await page.locator(sel.settings).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator(`${PANEL}:popover-open`), 'the settings panel is open').toBeVisible();

      // The premise: the panel scrolls, so the walk is not vacuous. A failure here is a finding for the user, not a licence to loosen the check.
      const scroll = await page.locator(PANEL).evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
      expect(scroll.scrollHeight, `premise (a finding for the user if it fails): the panel scrolls at ${w.width}x${w.height} (scrollHeight ${scroll.scrollHeight} > clientHeight ${scroll.clientHeight})`).toBeGreaterThan(scroll.clientHeight);

      const problems: string[] = [];
      let first: Focused | null = null;
      const visited: string[] = [];
      for (let i = 0; i < 6 && first === null; i++) {
        await page.keyboard.press('Tab');
        const f = await readFocused(page);
        visited.push(f === null ? 'none' : `${f.kind}${f.index} «${f.name}»`);
        if (f?.kind === 'theme' && f.index === 0) first = f;
      }
      expect(first, `premise: Tab from the settings button reaches the first theme option (visited ${visited.join(', ')})`).not.toBeNull();

      for (const [step, expected] of WALK.entries()) {
        if (step > 0) await page.keyboard.press('Tab');
        const f = await readFocused(page);
        expect(f, `step ${step + 1}: something is focused`).not.toBeNull();
        if (f === null) continue;
        expect([f.kind, f.index], `step ${step + 1}: the focused element is ${expected.kind} #${expected.index} (is ${f.kind} #${f.index} «${f.name}»)`).toEqual([expected.kind, expected.index]);
        const at = `step ${step + 1} (${f.kind} #${f.index} «${f.name}")`;
        // «Закрити» lies inside the panel's box and is stuck at the bottom (the panel's 1rem padding and 1px border, plus half a pixel).
        const insidePanel = f.close.top >= f.panel.top - TOLERANCE && f.close.bottom <= f.panel.bottom + TOLERANCE && f.close.left >= f.panel.left - TOLERANCE && f.close.right <= f.panel.right + TOLERANCE;
        if (!insidePanel) problems.push(`${at}: «Закрити» (${f.close.top.toFixed(1)} to ${f.close.bottom.toFixed(1)}) is not inside the panel (${f.panel.top.toFixed(1)} to ${f.panel.bottom.toFixed(1)})`);
        const gap = f.panel.bottom - f.close.bottom;
        if (gap > 17.5) problems.push(`${at}: «Закрити» bottom is ${gap.toFixed(1)} px above the panel's bottom edge, more than 17.5 px (the button is not stuck)`);
        if (f.kind === 'theme' || f.kind === 'language') {
          const ringBottom = f.rect.bottom + RING_BELOW_OPTION;
          const maskTop = f.close.top - MASK;
          if (ringBottom > maskTop) problems.push(`${at}: the ring's bottom ${ringBottom.toFixed(1)} is below the top of «Закрити»'s mask ${maskTop.toFixed(1)}`);
        }
      }
      expect(problems, `${w.width}x${w.height}: ${problems.length} problem(s) in the focus walk`).toEqual([]);
    });
  });
}
