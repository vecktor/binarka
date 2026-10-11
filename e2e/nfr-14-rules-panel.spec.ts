// @trace NFR-14
// @trace FR-57
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { sel } from './helpers';

// update-rules-panel (NFR-14, FR-57, A-59, A-20; G2 block A, the ADDED requirement «The rules panel takes the design's size, place and paint» and the
// MODIFIED «Rules panel»). Written FIRST (red) from openspec/changes/update-rules-panel/specs/play-page/spec.md, before the port.
//
// Part 1, «The panel opens at its top»: the built page with the design's fixture board (FR-119), at 320x700, 375x812, 768x1024 and 1366x650, a first
// opening by a mouse click and (a separate run) by the keyboard (focus «Правила», Enter), and a second opening after scrolling the panel to its end and
// closing it by «Зрозуміло» (one run) or by Escape (another run). The panel must be open (:popover-open), its scrollTop 0, and the active element
// «Зрозуміло» (.rules-close). The premise is asserted, not assumed: the panel scrolls at 320x700 and 375x812 and does not at 768x1024 and 1366x650.
// Where it scrolls, the focus ring of the stuck button lies inside the panel (3px ring at a 2px offset, 5px in all), and the reset of a second opening
// does not undo a scroll made one frame after the opening (the locked `rules-techniques` capture driver scrolls to the end right after :popover-open).
// The board for these runs is the capture board of the design's default state (the adapter's `rules` state uses the same fixture board).
//
// Part 2, the geometry: the box of [data-section="rules"] and of its close button, after a press on «Правила», against the box the design build has,
// frozen in the key `rulesPanel` of quality/design-geometry.json by scripts/freeze-design-geometry.mjs (task 3.1). The fixture is read, never the design
// build, so this part needs no design server. A fixture without the key FAILS the test with the freeze instruction; it never skips.
//
// Sampling (declared below as SAMPLING): the viewport (4 for part 1, 8 for part 2), the board size (6x6 and 4x4, part 2), the input method (mouse and
// keyboard) and the close method («Зрозуміло» and Escape). Coverage is sampled. Nothing between the viewports, no dark scheme, no other board and no hover
// state is looked at. The stricter instruments that run before a block-done claim are the per-block pixel crop of scripts/visual-block.mjs (block `rules`)
// and the per-shot gate (npm run check:visual), and then the full computed-style diff of every element of the panel (docs/qa/visual-diff/README.md).
// This test asserts no pixel score for any shot.

const SAMPLING = {
  dimensions: ['viewport', 'board size', 'input method', 'close method'],
  openViewports: ['320x700', '375x812', '768x1024', '1366x650'],
  geometryViewports: ['320x700', '375x812', '768x1024', '1024x768', '1366x650', '1440x900', '768x1024 (4x4)', '800x600'],
  boardSizes: [6, 4],
  inputMethods: ['mouse', 'keyboard'],
  closeMethods: ['button', 'escape'],
  coverage: 'sampled',
  stricterInstruments: ['scripts/visual-block.mjs', 'npm run check:visual'],
} as const;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface RulesCase {
  shot: string;
  width: number;
  height: number;
  state: string;
  captureBoard: unknown;
  afterLoad: string;
  boxes: Record<string, Box | null>;
  layout?: { scrollHeight: number; clientHeight: number; minHeightPx: number | null; maxHeightPx: number | null; decidedBy: string };
}
interface Fixture {
  tolerancePx: number;
  cases: { shot: string; captureBoard: unknown }[];
  rulesPanel?: { selectors: string[]; coverage: string; provenance?: Record<string, string>; cases: RulesCase[] };
}

const fixture = JSON.parse(readFileSync('quality/design-geometry.json', 'utf8')) as Fixture;
const MISSING_KEY = 'quality/design-geometry.json has no rulesPanel: run node scripts/freeze-design-geometry.mjs (task 3.1)';

const PANEL = '[data-section="rules"]';
const CLOSE = '[data-section="rules"] .rules-close';
const OPEN = `${PANEL}:popover-open`;

// ---------------------------------------------------------------------------------------------------------
// Part 1 helpers and matrix
// ---------------------------------------------------------------------------------------------------------

/** The four viewports of «The panel opens at its top», and whether the panel scrolls there (asserted as a premise). */
const OPEN_VIEWPORTS = [
  { width: 320, height: 700, scrolls: true },
  { width: 375, height: 812, scrolls: true },
  { width: 768, height: 1024, scrolls: false },
  { width: 1366, height: 650, scrolls: false },
] as const;
const INPUTS = ['mouse', 'keyboard'] as const;
const CLOSES = ['button', 'escape'] as const;
type Input = (typeof INPUTS)[number];

/** The design's fixture board at a width: the capture board of its default state (the adapter's `rules` state is the same fixture, FR-119). */
function boardAt(width: number): unknown {
  const found = fixture.cases.find((c) => c.shot === `${width}-light-default`);
  if (found === undefined) throw new Error(`quality/design-geometry.json has no case ${width}-light-default (the design's fixture board)`);
  return found.captureBoard;
}

async function openPageWithBoard(page: Page, width: number, height: number, board: unknown): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.addInitScript((value: unknown) => {
    (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = value;
  }, board);
  await page.goto('/');
  await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
}

/** Press «Правила» by the input method: a real mouse click, or focus and Enter. */
async function pressRules(page: Page, input: Input): Promise<void> {
  if (input === 'mouse') {
    await page.locator(sel.rules).click();
  } else {
    await page.locator(sel.rules).focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator(OPEN)).toHaveCount(1);
}

/** One animation frame of the page. */
async function frame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => { requestAnimationFrame(() => { resolve(); }); }));
}

interface PanelState {
  open: boolean;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  activeIsClose: boolean;
}
async function readPanel(page: Page): Promise<PanelState> {
  return page.evaluate(() => {
    const panel = document.querySelector('[data-section="rules"]');
    if (panel === null) throw new Error('the page has no [data-section="rules"]');
    const active = document.activeElement;
    return {
      open: panel.matches(':popover-open'),
      scrollTop: panel.scrollTop,
      scrollHeight: panel.scrollHeight,
      clientHeight: panel.clientHeight,
      activeIsClose: active !== null && active.matches('.rules-close') && panel.contains(active),
    };
  });
}

/** Set scrollTop to scrollHeight (the browser clamps it) and read back what the panel scrolled by. Returns scrollHeight - clientHeight and the clamped scrollTop. */
async function scrollToEnd(page: Page): Promise<{ range: number; scrollTop: number }> {
  return page.evaluate(() => {
    const panel = document.querySelector('[data-section="rules"]');
    if (panel === null) throw new Error('the page has no [data-section="rules"]');
    panel.scrollTop = panel.scrollHeight;
    return { range: panel.scrollHeight - panel.clientHeight, scrollTop: panel.scrollTop };
  });
}

// ---------------------------------------------------------------------------------------------------------
// The sampling is declared
// ---------------------------------------------------------------------------------------------------------

test('@trace NFR-14 @trace FR-57 the coverage is declared: sampled, the sampling dimensions named, the stricter instruments named, nothing beyond a sample claimed', () => {
  expect(SAMPLING.coverage).toBe('sampled');
  expect(SAMPLING.dimensions).toEqual(['viewport', 'board size', 'input method', 'close method']);
  expect(SAMPLING.openViewports, 'the viewports of the opening at the top').toEqual(OPEN_VIEWPORTS.map((v) => `${v.width}x${v.height}`));
  expect(SAMPLING.geometryViewports, 'the viewports of the geometry cases').toHaveLength(8);
  expect(SAMPLING.boardSizes).toEqual([6, 4]);
  expect(SAMPLING.stricterInstruments).toEqual(['scripts/visual-block.mjs', 'npm run check:visual']);
  const text = readFileSync('e2e/nfr-14-rules-panel.spec.ts', 'utf8');
  expect(text, 'the file names the stricter instruments').toContain('scripts/visual-block.mjs');
  expect(text).toContain('npm run check:visual');
  expect(text).toContain('block `rules`');
  // the file claims nothing beyond a sample (the phrases are assembled so that this check does not match its own text)
  const claims = new RegExp(['contin' + 'uum', 'all ' + 'widths', 'all ' + 'board sizes', 'pixel ' + 'floor'].join('|'), 'i');
  expect(text, 'the file claims nothing beyond a sample of viewports, boards, inputs and close methods').not.toMatch(claims);
});

// ---------------------------------------------------------------------------------------------------------
// Part 1: the panel opens at its top
// ---------------------------------------------------------------------------------------------------------

for (const { width, height, scrolls } of OPEN_VIEWPORTS) {
  for (const input of INPUTS) {
    test(`@trace NFR-14 @trace FR-57 ${width}x${height} first opening by ${input}: open, scrollTop 0, the active element is «Зрозуміло»; the panel ${scrolls ? 'scrolls' : 'fits'}`, async ({ page }) => {
      await openPageWithBoard(page, width, height, boardAt(width));
      await pressRules(page, input);
      const state = await readPanel(page);
      expect(state.open, 'the panel is open (:popover-open)').toBe(true);
      // the premise: where the panel scrolls, and where it fits (a layout that overflows at 768x1024 or 1366x650 fails here, not vacuously)
      expect(state.scrollHeight > state.clientHeight, `premise: the panel ${scrolls ? 'scrolls' : 'does not scroll'} (scrollHeight ${state.scrollHeight}, clientHeight ${state.clientHeight})`).toBe(scrolls);
      expect(state.scrollTop, `scrollTop at the first opening by ${input} (scrollHeight ${state.scrollHeight}, clientHeight ${state.clientHeight})`).toBe(0);
      expect(state.activeIsClose, 'the active element is «Зрозуміло» (.rules-close)').toBe(true);
    });
  }
}

for (const { width, height, scrolls } of OPEN_VIEWPORTS) {
  for (const input of INPUTS) {
    for (const close of CLOSES) {
      test(`@trace NFR-14 @trace FR-57 ${width}x${height} second opening by ${input} after ${scrolls ? 'scrolling to the end and ' : ''}closing by ${close === 'button' ? '«Зрозуміло»' : 'Escape'}: open, scrollTop 0, the active element is «Зрозуміло»`, async ({ page }) => {
        await openPageWithBoard(page, width, height, boardAt(width));
        await pressRules(page, input);
        if (scrolls) {
          const end = await scrollToEnd(page);
          expect(end.range, `premise: the panel scrolls (scrollHeight - clientHeight ${end.range})`).toBeGreaterThan(0);
          expect(Math.abs(end.scrollTop - end.range), `scrollTop ${end.scrollTop} reached the end ${end.range}`).toBeLessThanOrEqual(1);
        }
        if (close === 'button') await page.locator(CLOSE).click();
        else await page.keyboard.press('Escape');
        await expect(page.locator(OPEN)).toHaveCount(0);

        await pressRules(page, input);
        await frame(page);
        const state = await readPanel(page);
        expect(state.open, 'the panel is open again (:popover-open)').toBe(true);
        expect(state.scrollTop, `scrollTop at the second opening, after one animation frame (scrollHeight ${state.scrollHeight}, clientHeight ${state.clientHeight})`).toBe(0);
        expect(state.activeIsClose, 'the active element is «Зрозуміло» again').toBe(true);
      });
    }
  }
}

// ---------------------------------------------------------------------------------------------------------
// The ring of the stuck button and the race with the end-scroll driver, at the two viewports where the panel scrolls
// ---------------------------------------------------------------------------------------------------------

const SCROLLING = OPEN_VIEWPORTS.filter((v) => v.scrolls);

for (const { width, height } of SCROLLING) {
  test(`@trace NFR-14 @trace FR-57 ${width}x${height}: while «Зрозуміло» is stuck (first opening, and after scrolling to the end) its focus ring of 5px lies inside the panel`, async ({ page }) => {
    await openPageWithBoard(page, width, height, boardAt(width));
    await pressRules(page, 'mouse');
    const ringProblems = async (stage: string): Promise<string[]> => {
      const m = await page.evaluate(() => {
        const panel = document.querySelector('[data-section="rules"]');
        const close = document.querySelector('[data-section="rules"] .rules-close');
        if (panel === null || close === null) throw new Error('the page has no rules panel or close button');
        const p = panel.getBoundingClientRect();
        const c = close.getBoundingClientRect();
        const cs = getComputedStyle(panel);
        return {
          panel: { left: p.left, right: p.right, bottom: p.bottom },
          close: { left: c.left, right: c.right, bottom: c.bottom },
          border: { left: parseFloat(cs.borderLeftWidth), right: parseFloat(cs.borderRightWidth), bottom: parseFloat(cs.borderBottomWidth) },
        };
      });
      const problems: string[] = [];
      // the ring is 3px at a 2px offset: 5px in all
      if (!(m.close.bottom + 5 <= m.panel.bottom - m.border.bottom)) problems.push(`${stage}: bottom: close ${m.close.bottom} + 5 > panel ${m.panel.bottom} - border ${m.border.bottom}`);
      if (!(m.close.left - 5 >= m.panel.left + m.border.left)) problems.push(`${stage}: left: close ${m.close.left} - 5 < panel ${m.panel.left} + border ${m.border.left}`);
      if (!(m.close.right + 5 <= m.panel.right - m.border.right)) problems.push(`${stage}: right: close ${m.close.right} + 5 > panel ${m.panel.right} - border ${m.border.right}`);
      return problems;
    };
    const first = await ringProblems('first opening');
    const end = await scrollToEnd(page);
    expect(end.range, 'premise: the panel scrolls').toBeGreaterThan(0);
    const last = await ringProblems('scrolled to the end');
    // if the bottom check fails, the design's geometry clips the ring: the block stops and reports it (a fix departs from the design and needs the user)
    expect([...first, ...last], 'the focus ring lies inside the panel').toEqual([]);
  });

  test(`@trace NFR-14 @trace FR-57 ${width}x${height}: a scroll to the end made one frame after the opening holds one frame later (the reset on open does not undo it)`, async ({ page }) => {
    await openPageWithBoard(page, width, height, boardAt(width));
    // as the capture driver of the state `rules-techniques`: press by a script click, wait for :popover-open, then scroll to the end
    await page.locator(sel.rules).evaluate((el: HTMLElement) => { el.click(); });
    await page.locator(OPEN).waitFor();
    await frame(page);
    const end = await scrollToEnd(page);
    expect(end.range, `premise: the panel scrolls (scrollHeight - clientHeight ${end.range})`).toBeGreaterThan(0);
    await frame(page);
    const state = await readPanel(page);
    expect(state.scrollTop, `scrollTop one frame after the scroll (the end is ${state.scrollHeight - state.clientHeight})`).toBeGreaterThan(0);
    expect(Math.abs(state.scrollTop - (state.scrollHeight - state.clientHeight)), 'scrollTop is still scrollHeight - clientHeight').toBeLessThanOrEqual(1);
  });
}

// ---------------------------------------------------------------------------------------------------------
// Part 2: the geometry against the frozen design boxes
// ---------------------------------------------------------------------------------------------------------

const EXPECTED_CASES = [
  { shot: '320-light-rules', width: 320, height: 700 },
  { shot: '375-light-rules', width: 375, height: 812 },
  { shot: '768-light-rules', width: 768, height: 1024 },
  { shot: '1024-light-rules', width: 1024, height: 768 },
  { shot: '1366-light-rules', width: 1366, height: 650 },
  { shot: '1440-light-rules', width: 1440, height: 900 },
  { shot: '768-light-rules-four', width: 768, height: 1024 },
  { shot: '800-light-rules-short', width: 800, height: 600 },
] as const;
const SELECTORS = [PANEL, CLOSE];

test('@trace NFR-14 the fixture holds exactly the 8 rules cases: shots, viewports, coverage sampled, the two selectors, the recorded way into the state', () => {
  const rulesPanel = fixture.rulesPanel;
  expect(rulesPanel, MISSING_KEY).toBeDefined();
  if (rulesPanel === undefined) return;
  expect(rulesPanel.cases.map((c) => c.shot).sort(), 'the shots of rulesPanel.cases').toEqual(EXPECTED_CASES.map((c) => c.shot).sort());
  expect(rulesPanel.coverage).toBe('sampled');
  expect(rulesPanel.selectors).toEqual(SELECTORS);
  for (const want of EXPECTED_CASES) {
    const c = rulesPanel.cases.find((x) => x.shot === want.shot);
    expect(c, `case ${want.shot}`).toBeDefined();
    expect([c?.width, c?.height, c?.state, c?.afterLoad], `${want.shot}: viewport, state and the recorded way into the state`).toEqual([want.width, want.height, 'rules', 'open-rules']);
    expect(c?.captureBoard, `${want.shot}: the case holds its own capture board`).toBeTruthy();
    expect(Object.keys(c?.boxes ?? {}).sort(), `${want.shot}: the boxes are keyed by the two selectors`).toEqual([...SELECTORS].sort());
    expect(typeof c?.layout?.decidedBy, `${want.shot}: the case records which bound decided the design's height`).toBe('string');
  }
});

for (const want of EXPECTED_CASES) {
  test(`@trace NFR-14 ${want.shot} (${want.width}x${want.height}): the open panel and «Зрозуміло» have the design's boxes within ${fixture.tolerancePx}px, «Зрозуміло» is inside the panel at most 17px above its bottom`, async ({ page }) => {
    const c = fixture.rulesPanel?.cases.find((x) => x.shot === want.shot);
    if (c === undefined) throw new Error(`${MISSING_KEY} (no case ${want.shot})`);
    await openPageWithBoard(page, c.width, c.height, c.captureBoard);
    // the capture driver's press: a script click on «Правила» (the recorded afterLoad is `open-rules`)
    await page.locator(sel.rules).evaluate((el: HTMLElement) => { el.click(); });
    await expect(page.locator(OPEN), `${c.shot}: the panel is open (:popover-open)`).toHaveCount(1);
    const actual = await page.evaluate((selectors: string[]) => selectors.map((s) => {
      const el = document.querySelector(s);
      if (el === null) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }), SELECTORS);
    const f = (b: Box): string => `${b.x.toFixed(2)},${b.y.toFixed(2)} ${b.w.toFixed(2)}x${b.h.toFixed(2)}`;
    const tolerance = fixture.tolerancePx;
    const misses: string[] = [];
    SELECTORS.forEach((selector, i) => {
      const frozen = c.boxes[selector] ?? null;
      const page_ = actual[i] ?? null;
      if (frozen === null || page_ === null) {
        misses.push(`${c.shot} ${selector}: ${frozen === null ? 'absent in the design' : 'missing on the page'}`);
        return;
      }
      const edges: [string, number, number][] = [
        ['left', frozen.x, page_.x],
        ['top', frozen.y, page_.y],
        ['right', frozen.x + frozen.w, page_.x + page_.w],
        ['bottom', frozen.y + frozen.h, page_.y + page_.h],
      ];
      const off = edges.filter(([, a, b]) => Math.abs(a - b) > tolerance).map(([name, a, b]) => `${name} ${a.toFixed(2)} vs ${b.toFixed(2)}`);
      if (off.length > 0) misses.push(`${c.shot} ${selector}: design ${f(frozen)}, page ${f(page_)} (${off.join('; ')})`);
    });
    expect(misses, `${c.shot}: ${misses.length} of ${SELECTORS.length} boxes differ`).toEqual([]);

    const panel = actual[0];
    const close = actual[1];
    expect(panel, `${c.shot}: the panel exists`).not.toBeNull();
    expect(close, `${c.shot}: «Зрозуміло» exists`).not.toBeNull();
    if (panel === null || panel === undefined || close === null || close === undefined) return;
    const inside = close.x >= panel.x - tolerance && close.y >= panel.y - tolerance && close.x + close.w <= panel.x + panel.w + tolerance && close.y + close.h <= panel.y + panel.h + tolerance;
    expect(inside, `${c.shot}: «Зрозуміло» ${f(close)} lies inside the panel ${f(panel)}`).toBe(true);
    const gap = panel.y + panel.h - (close.y + close.h);
    expect(gap, `${c.shot}: the panel's bottom edge less «Зрозуміло»'s bottom edge (the 1px border and the 1rem padding)`).toBeLessThanOrEqual(17 + 0.001);
  });
}
