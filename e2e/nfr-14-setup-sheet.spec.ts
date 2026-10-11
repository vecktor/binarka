// @trace NFR-14
// @trace FR-96
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { sel } from './helpers';

// update-setup-sheet (NFR-14, FR-96; G2 block B, the ADDED requirement «The setup sheet takes the design's size, place and paint», its scenarios
// «The sheet matches the design's box in a real browser», «The sheet ends below the button row and cuts no line of text» and «The fixture adds one
// key and changes nothing else»). Written FIRST (red) from openspec/changes/update-setup-sheet/specs/play-page/spec.md, before the port.
//
// Part 1, the fixture: quality/design-geometry.json holds the key `setupSheet` (scripts/freeze-design-geometry.mjs, task 3.1) with 12 cases.
// While the key is absent the tests FAIL with the freeze instruction; they are never skipped.
// Part 2, the box: each case opens the page at the case's viewport with the case's capture board (FR-119, as the pixel capture does), presses the
// summary button, asserts the sheet is `:popover-open`, and compares the four edges of the sheet with the case's `expected` box (the design with
// the signed 28px margin of SQ-5), the left edge of the first level description with the case's `boxes` value (the design's own), the sheet's
// computed line-height with the body's, and the computed margin-bottom of the level group with 28px. A miss prints the page's box, `expected`
// and the design's own `boxes`.
// Part 3, the page alone (no fixture, so a regression in the design's formula cannot hide in both sides): from 48rem the sheet ends at least
// 0.5rem below the button row or at the window's limit, and at all six viewports no edge of the sheet cuts the idle line's text: its ink band,
// from the first line's ink top to the last line's ink bottom, measured from the text's line boxes (Range.getClientRects) and the idle font's
// metrics (measureText). DELIBERATE CHANGE (update-setup-sheet, the user's decision of 2026-10-11): the band was the element's box at first, but
// the design's own sheet ends 0.8 px inside that box at 1024x768 (the page 4.8 px, with the 28px departure) while the glyphs stay clear
// (docs/qa/update-setup-sheet/green-run.txt, open finding 1); the ADDED scenario «The sheet ends below the button row and cuts no line of text».
// Part 4, the sweep (opt-in instrument, see below).
//
// Sampling dimensions: viewport (320x700, 375x812, 768x1024, 1024x768, 1366x650, 1440x900) and state (default: the 6x6 fixture board, shot
// `<w>-light-setup`; four: the 4x4 fixture board, shot `<w>-light-setup-four`). Light scheme only: geometry does not depend on the scheme.
// Coverage: sampled, never continuum. The stricter instruments, to run before a definition-of-done is claimed or when a sample lands near a
// bound: `npm run check:visual` (the per-shot pixel gate), `node scripts/visual-block.mjs --block setup` (the per-block crop and overlay) and the
// fine-step sweep of Part 4 (`SETUP_SHEET_SWEEP=1`). This file claims neither all widths nor a pixel floor.

type State = 'default' | 'four';
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Decided = 'min-height' | 'max-height' | 'content';
interface Layout {
  scrollHeight: number;
  clientHeight: number;
  minHeightPx: number;
  maxHeightPx: number;
  decidedBy: Decided;
}
interface SetupCase {
  shot: string;
  width: number;
  height: number;
  state: string;
  captureBoard: unknown;
  afterLoad?: string;
  boxes: Record<string, Box | null>;
  expected: Record<string, Box | null>;
  layout: Layout;
}
interface Deviation {
  rule: string;
  design: string;
  product: string;
  reason: string;
  contentDecidedCases: string[];
}
interface SetupSheetKey {
  selectors: string[];
  coverage: string;
  provenance: Record<string, unknown>;
  deviations: Deviation[];
  cases: SetupCase[];
}
interface Fixture {
  provenance: { designCommit: string; designCssSha1: string };
  tolerancePx: number;
  selectors: string[];
  cases: { shot: string; state: string; captureBoard: unknown }[];
  setupSheet?: SetupSheetKey;
}

const fixture = JSON.parse(readFileSync('quality/design-geometry.json', 'utf8')) as Fixture;

const SHEET = '[data-section="setup"]';
const DESCRIPTION = '[data-section="setup"] [data-control="level"] button:first-of-type .level-text';
const LEVEL_GROUP = '[data-section="setup"] [data-control="level"]';
const IDLE = '[data-message="idle"]';
const FREEZE = 'run `node scripts/freeze-design-geometry.mjs` (task 3.1 of openspec/changes/update-setup-sheet/tasks.md) to add the key setupSheet to quality/design-geometry.json';

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 650 },
  { width: 1440, height: 900 },
] as const;
const STATES: State[] = ['default', 'four'];
const shotOf = (width: number, state: State): string => `${width}-light-setup${state === 'four' ? '-four' : ''}`;
const EXPECTED_SHOTS = VIEWPORTS.flatMap((v) => STATES.map((s) => shotOf(v.width, s))).sort();
const FROM_48REM = 768;

// The top-level fixture as it stood before this change (design.md decision 9): the key is ADDED, nothing else moves.
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
const TOP_LEVEL_DESIGN_COMMIT = '5e61bfd14de56bff4b3726db4ddd624fcd3c2e04';
const TOP_LEVEL_DESIGN_CSS_SHA1 = 'd1b1255f4dff205d15d64850096429cd377e5fbf';

const isBox = (v: unknown): v is Box => {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Record<string, unknown>;
  return ['x', 'y', 'w', 'h'].every((k) => typeof b[k] === 'number' && Number.isFinite(b[k]));
};
const fmt = (b: Box | null | undefined): string => (b ? `${b.x.toFixed(2)},${b.y.toFixed(2)} ${b.w.toFixed(2)}x${b.h.toFixed(2)}` : 'absent');
const bottomOf = (b: Box): number => b.y + b.h;

// ---------------------------------------------------------------------------------------------------------
// Part 1: the fixture
// ---------------------------------------------------------------------------------------------------------

test('@trace NFR-14 @trace FR-96 the fixture keeps its 32 top-level shots, selectors, tolerance and design hashes (the key is ADDED, nothing else changes)', () => {
  expect(fixture.cases, 'the top-level cases of quality/design-geometry.json').toHaveLength(32);
  expect(fixture.cases.some((c) => c.shot.includes('setup')), 'no setup shot is among the top-level cases').toBe(false);
  expect(fixture.tolerancePx).toBe(0.5);
  expect(fixture.selectors).toEqual(TOP_LEVEL_SELECTORS);
  expect(fixture.provenance.designCommit, 'the top-level provenance keeps the design commit').toBe(TOP_LEVEL_DESIGN_COMMIT);
  expect(fixture.provenance.designCssSha1, 'the top-level provenance keeps the design CSS hash').toBe(TOP_LEVEL_DESIGN_CSS_SHA1);
});

test('@trace NFR-14 @trace FR-96 the fixture holds the key setupSheet: selectors, sampled coverage, its own provenance, the recorded 28px deviation and the 12 cases', () => {
  const key = fixture.setupSheet;
  expect(key, `quality/design-geometry.json has no key "setupSheet": ${FREEZE}`).toBeDefined();
  if (key === undefined) return;

  expect(key.coverage, 'the key declares sampled coverage').toBe('sampled');
  expect(key.selectors, 'the key names the sheet and the first description').toEqual([SHEET, DESCRIPTION]);
  for (const field of ['designCommit', 'designCssSha1', 'designBuildSha1', 'browser']) {
    const value = key.provenance[field];
    expect(typeof value === 'string' && value !== '', `setupSheet.provenance.${field} is a non-empty string (got ${JSON.stringify(value)})`).toBe(true);
  }
  expect(key.cases.map((c) => c.shot).sort(), 'the shots of setupSheet.cases').toEqual(EXPECTED_SHOTS);

  const contentDecided = key.cases.filter((c) => c.layout.decidedBy === 'content').map((c) => c.shot).sort();
  const deviation = key.deviations.find((d) => d.rule === '.setup .level-control { margin-bottom }');
  expect(deviation, `setupSheet.deviations records the rule ".setup .level-control { margin-bottom }" (got ${JSON.stringify(key.deviations.map((d) => d.rule))})`).toBeDefined();
  if (deviation !== undefined) {
    expect(deviation.design, 'the recorded design value').toContain('24px');
    expect(deviation.product, 'the recorded product value').toBe('28px');
    expect(deviation.reason, 'the reason names A-60').toContain('A-60');
    expect(deviation.reason, 'the reason names SQ-5').toContain('SQ-5');
    expect([...deviation.contentDecidedCases].sort(), 'the deviation lists exactly the cases whose layout.decidedBy is "content"').toEqual(contentDecided);
  }

  for (const shot of EXPECTED_SHOTS) {
    const c = key.cases.find((x) => x.shot === shot);
    expect(c, `setupSheet.cases has ${shot}`).toBeDefined();
    if (c === undefined) continue;
    const viewport = VIEWPORTS.find((v) => shot.startsWith(`${v.width}-`));
    const four = shot.endsWith('-four');
    expect([c.width, c.height], `${shot}: the viewport`).toEqual([viewport?.width, viewport?.height]);
    expect(c.afterLoad, `${shot}: the recorded action after load`).toBe('open-setup');
    const board = c.captureBoard as { size?: unknown } | null;
    expect(board?.size, `${shot}: the capture board is the ${four ? '4x4' : '6x6'} fixture`).toBe(four ? 4 : 6);
    for (const [name, boxes] of [['boxes', c.boxes], ['expected', c.expected]] as const) {
      expect(isBox(boxes[SHEET]), `${shot}: ${name} holds the sheet's box (got ${JSON.stringify(boxes[SHEET])})`).toBe(true);
    }
    expect(isBox(c.boxes[DESCRIPTION]), `${shot}: boxes holds the first description's box (got ${JSON.stringify(c.boxes[DESCRIPTION])})`).toBe(true);
    const l = c.layout;
    for (const f of ['scrollHeight', 'clientHeight', 'maxHeightPx'] as const) {
      expect(Number.isFinite(l[f]) && l[f] > 0, `${shot}: layout.${f} is a positive number (got ${JSON.stringify(l[f])})`).toBe(true);
    }
    // The phone regimes declare no min-height (computed `auto`), recorded as 0 (refreeze, docs/qa/update-setup-sheet/refreeze.txt).
    expect(Number.isFinite(l.minHeightPx) && l.minHeightPx >= 0, `${shot}: layout.minHeightPx is a number >= 0 (got ${JSON.stringify(l.minHeightPx)})`).toBe(true);
    expect(['min-height', 'max-height', 'content'], `${shot}: layout.decidedBy (got ${JSON.stringify(l.decidedBy)})`).toContain(l.decidedBy);

    // The expected box is the design's with the 28px margin: identical where the floor or the cap decides, taller by 4px (12px where the
    // design has 1rem, at 22.5rem and narrower) where the content decides, but never past the cap: at 320x700 (6x6) the design's content-decided
    // sheet is 2.31px under its max-height, so the expected sheet meets the cap (refreeze, docs/qa/update-setup-sheet/refreeze.txt).
    const design = c.boxes[SHEET];
    const want = c.expected[SHEET];
    if (isBox(design) && isBox(want)) {
      expect(Math.abs(want.w - design.w), `${shot}: expected width ${want.w} vs the design's ${design.w}`).toBeLessThanOrEqual(0.5);
      if (l.decidedBy === 'content') {
        const grow = Math.min(c.width <= 360 ? 12 : 4, l.maxHeightPx - design.h);
        expect(Math.abs(want.h - design.h - grow), `${shot}: content-decided, expected height ${want.h} should be the design's ${design.h} + ${grow} (the margin's growth, capped by max-height ${l.maxHeightPx})`).toBeLessThanOrEqual(0.5);
      } else {
        const delta = Math.max(Math.abs(want.x - design.x), Math.abs(want.y - design.y), Math.abs(bottomOf(want) - bottomOf(design)));
        expect(delta, `${shot}: decided by ${l.decidedBy}, expected ${fmt(want)} should equal the design's ${fmt(design)}`).toBeLessThanOrEqual(0.5);
      }
    }
  }
});

// ---------------------------------------------------------------------------------------------------------
// The page side, shared by Parts 2 to 4
// ---------------------------------------------------------------------------------------------------------

/**
 * The capture board of a state when the fixture has no case for it (key absent): the one the adapter gives, built from the top-level cases of the
 * fixture. 'setup' is the 6x6 fixture board at level 2 (scripts/check-visual-parity-adapters.mjs: `setup: fixtureBoard, level 2`), 'four' the 4x4
 * board at level 1. The page side then still runs and the failure is the missing fixture case, not a missing page.
 */
function fallbackBoard(state: State): unknown {
  const found = fixture.cases.find((c) => c.state === (state === 'four' ? 'four' : 'default'));
  if (found === undefined) throw new Error(`quality/design-geometry.json has no top-level ${state} case to take the capture board from`);
  return state === 'four' ? found.captureBoard : { ...(found.captureBoard as Record<string, unknown>), level: 2 };
}

const boardOf = (width: number, state: State): unknown => fixture.setupSheet?.cases.find((c) => c.shot === shotOf(width, state))?.captureBoard ?? fallbackBoard(state);

async function pressSummary(page: Page): Promise<void> {
  // A script click, as the capture adapter does (no pointer on the page).
  await page.locator(sel.summary).evaluate((el: HTMLElement) => {
    el.click();
  });
  await expect(page.locator(`${SHEET}:popover-open`), 'the setup sheet is :popover-open after the summary press').toBeVisible();
}

async function openSheetAt(page: Page, width: number, height: number, state: State, board: unknown): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.addInitScript((b: unknown) => {
    (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = b;
  }, board);
  await page.goto('/');
  await expect(page.locator(`${sel.board}[data-size="${state === 'four' ? 4 : 6}"]`), `premise: the ${state === 'four' ? '4x4' : '6x6'} fixture board is shown`).toBeVisible();
  await pressSummary(page);
  await expect(page.locator(IDLE), 'premise: the idle line is visible').toBeVisible();
}

interface Metrics {
  open: boolean;
  sheet: Box | null;
  description: Box | null;
  hintBottom: number | null;
  /** The idle line's ink band (x and w of its box; y and h from the first line's ink top to the last line's ink bottom). */
  idle: Box | null;
  /** The idle line's element box, printed beside the band on a miss. */
  idleBox: Box | null;
  windowHeight: number;
  sheetLineHeight: string | null;
  bodyLineHeight: string;
  levelMarginBottom: string | null;
}

async function readMetrics(page: Page): Promise<Metrics> {
  return page.evaluate(
    (s: { sheet: string; description: string; level: string; idle: string; hint: string }) => {
      const box = (selector: string): { x: number; y: number; w: number; h: number } | null => {
        const el = document.querySelector(selector);
        if (el === null) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      const ink = (selector: string): { x: number; y: number; w: number; h: number } | null => {
        const el = document.querySelector(selector);
        if (el === null) return null;
        const range = document.createRange();
        range.selectNodeContents(el);
        const lines = [...range.getClientRects()].filter((r) => r.height > 0);
        const first = lines[0];
        const last = lines[lines.length - 1];
        const ctx = document.createElement('canvas').getContext('2d');
        if (first === undefined || last === undefined || ctx === null) return null;
        const cs = getComputedStyle(el);
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const m = ctx.measureText(el.textContent);
        const top = first.top + m.fontBoundingBoxAscent - m.actualBoundingBoxAscent;
        const bottom = last.top + m.fontBoundingBoxAscent + m.actualBoundingBoxDescent;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: top, w: r.width, h: bottom - top };
      };
      const sheet = document.querySelector(s.sheet);
      const level = document.querySelector(s.level);
      const hint = document.querySelector(s.hint);
      return {
        open: sheet?.matches(':popover-open') ?? false,
        sheet: box(s.sheet),
        description: box(s.description),
        hintBottom: hint === null ? null : hint.getBoundingClientRect().bottom,
        idle: ink(s.idle),
        idleBox: box(s.idle),
        windowHeight: window.innerHeight,
        sheetLineHeight: sheet === null ? null : getComputedStyle(sheet).lineHeight,
        bodyLineHeight: getComputedStyle(document.body).lineHeight,
        levelMarginBottom: level === null ? null : getComputedStyle(level).marginBottom,
      };
    },
    { sheet: SHEET, description: DESCRIPTION, level: LEVEL_GROUP, idle: IDLE, hint: sel.hint },
  );
}

/** The floor (from 48rem) and the no-cut check, read from the page alone. Returns one message per failure. */
function floorAndCutProblems(m: Metrics, width: number, height: number, state: State): string[] {
  const where = `${width}x${height} ${state}`;
  const { sheet: S, idle: I, hintBottom: R } = m;
  if (S === null || I === null || R === null) return [`${where}: the sheet, the idle line or the hint button is missing (sheet ${fmt(S)}, idle ${fmt(I)}, hint bottom ${String(R)})`];
  const out: string[] = [];
  const H = m.windowHeight;
  if (width >= FROM_48REM) {
    const floor = Math.min(R + 8, H - 16);
    if (bottomOf(S) < floor - 0.5) {
      out.push(`${where}: the sheet ends at ${bottomOf(S).toFixed(2)}, above the floor min(R+8, H-16) = min(${(R + 8).toFixed(2)}, ${H - 16}) = ${floor.toFixed(2)} (R = ${R.toFixed(2)}, H = ${H}, sheet ${fmt(S)})`);
    }
  }
  // An edge at the window's limit is the window's edge, not a cut by the sheet (DELIBERATE CHANGE, update-setup-sheet, the user's decision of
  // 2026-10-11: the sweep counted bottom sheets ending at the window's bottom while the idle line ran past the fold; docs/qa/update-setup-sheet/sweep.txt).
  const atWindowLimit = (v: number): boolean => Math.abs(v) <= 0.5 || Math.abs(v - H) <= 0.5;
  const inside = (v: number): boolean => !atWindowLimit(v) && v > I.y + 0.5 && v < bottomOf(I) - 0.5;
  const band = `ink ${I.y.toFixed(2)} to ${bottomOf(I).toFixed(2)}, box ${fmt(m.idleBox)}`;
  if (inside(S.y)) out.push(`${where}: the sheet's top ${S.y.toFixed(2)} cuts the idle line's text (${band}; sheet ${fmt(S)})`);
  if (inside(bottomOf(S))) out.push(`${where}: the sheet's bottom ${bottomOf(S).toFixed(2)} cuts the idle line's text (${band}; sheet ${fmt(S)})`);
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Part 2: the box against the fixture, 12 cases (generated from the expected shot names, not from the fixture)
// ---------------------------------------------------------------------------------------------------------

for (const v of VIEWPORTS) {
  for (const state of STATES) {
    const shot = shotOf(v.width, state);
    test(`@trace NFR-14 @trace FR-96 ${shot} (${v.width}x${v.height}): the open setup sheet matches the design's box within the fixture's tolerance`, async ({ page }) => {
      const c = fixture.setupSheet?.cases.find((x) => x.shot === shot);
      await openSheetAt(page, v.width, v.height, state, c?.captureBoard ?? fallbackBoard(state));
      const m = await readMetrics(page);
      const problems: string[] = [];
      const tolerance = fixture.tolerancePx;

      if (c === undefined) {
        problems.push(`quality/design-geometry.json has no setupSheet case ${shot}: ${FREEZE}`);
      } else {
        const want = c.expected[SHEET] ?? null;
        const design = c.boxes[SHEET] ?? null;
        if (want === null || m.sheet === null) {
          problems.push(`${SHEET}: ${want === null ? 'no expected box in the fixture' : 'missing on the page'}`);
        } else {
          const edges = [
            ['left', m.sheet.x, want.x],
            ['top', m.sheet.y, want.y],
            ['right', m.sheet.x + m.sheet.w, want.x + want.w],
            ['bottom', bottomOf(m.sheet), bottomOf(want)],
          ] as const;
          const off = edges.filter(([, got, exp]) => Math.abs(got - exp) > tolerance).map(([name, got, exp]) => `${name} ${got.toFixed(2)} vs ${exp.toFixed(2)}`);
          if (off.length > 0) {
            problems.push(`${shot} ${SHEET}: page ${fmt(m.sheet)}, expected ${fmt(want)}, design's own boxes ${fmt(design)} (decided by ${c.layout.decidedBy}); off at ${off.join(', ')}`);
          }
        }
        const wantLeft = c.boxes[DESCRIPTION]?.x;
        if (wantLeft === undefined) {
          problems.push(`${shot}: the fixture has no box for the first description (${DESCRIPTION})`);
        } else if (m.description === null) {
          problems.push(`${shot}: the first description is missing on the page (${DESCRIPTION}); the design's left edge is ${wantLeft.toFixed(2)}`);
        } else if (Math.abs(m.description.x - wantLeft) > tolerance) {
          problems.push(`${shot} first description: page left edge ${m.description.x.toFixed(2)}, design's ${wantLeft.toFixed(2)} (page box ${fmt(m.description)}, design box ${fmt(c.boxes[DESCRIPTION])})`);
        }
      }

      // These two read the page alone, so they report even while the fixture case is missing.
      if (m.sheetLineHeight !== m.bodyLineHeight) {
        problems.push(`${shot}: the sheet's computed line-height is ${String(m.sheetLineHeight)}, the body's is ${m.bodyLineHeight}`);
      }
      if (m.levelMarginBottom !== '28px') {
        problems.push(`${shot}: the computed margin-bottom of ${LEVEL_GROUP} is ${String(m.levelMarginBottom)}, not 28px`);
      }
      expect(problems, `${shot}: ${problems.length} problem(s)`).toEqual([]);
    });
  }
}

// ---------------------------------------------------------------------------------------------------------
// Part 3: the floor and the no-cut check, page alone, six viewports x two states
// ---------------------------------------------------------------------------------------------------------

for (const v of VIEWPORTS) {
  for (const state of STATES) {
    const rule = v.width >= FROM_48REM ? 'ends below the button row and cuts no idle line' : 'cuts no idle line';
    test(`@trace NFR-14 @trace FR-96 ${v.width}x${v.height} ${state}: the open setup sheet ${rule}`, async ({ page }) => {
      await openSheetAt(page, v.width, v.height, state, boardOf(v.width, state));
      const m = await readMetrics(page);
      expect(m.open, 'the sheet is open when read').toBe(true);
      const problems = floorAndCutProblems(m, v.width, v.height, state);
      expect(problems, `${v.width}x${v.height} ${state}: ${problems.length} problem(s)`).toEqual([]);
    });
  }
}

// ---------------------------------------------------------------------------------------------------------
// Part 4: the sweep, an opt-in instrument. `SETUP_SHEET_SWEEP=1 npx playwright test --project=layout e2e/nfr-14-setup-sheet.spec.ts`.
// Off by default, so these tests are NOT registered then; that is not a skip of a required check (Parts 1 to 3 are the required checks, always on):
// the sweep is the stricter instrument that is run before a definition-of-done is claimed, because the six sampled viewports cannot say what lies
// between them. Widths 320 to 1440 in steps of 16 px at six heights, both states, the floor (from 768 wide) and the no-cut checks, one test per
// state and height that collects every failure and reports them together. Coverage is `sampled` at a 16 px step, never continuum.
// ---------------------------------------------------------------------------------------------------------

if (process.env.SETUP_SHEET_SWEEP === '1') {
  const WIDTHS: number[] = [];
  for (let w = 320; w <= 1440; w += 16) WIDTHS.push(w);
  const HEIGHTS = [568, 650, 700, 768, 900, 1024];
  for (const state of STATES) {
    for (const height of HEIGHTS) {
      test(`@trace NFR-14 @trace FR-96 sweep ${state} at height ${height}: widths 320 to 1440 in 16 px steps, floor and no-cut`, async ({ page }) => {
        test.setTimeout(240_000);
        await openSheetAt(page, WIDTHS[0] ?? 320, height, state, boardOf(320, state));
        const problems: string[] = [];
        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height });
          await page.evaluate(
            () =>
              new Promise<void>((done) => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    done();
                  });
                });
              }),
          );
          let m = await readMetrics(page);
          if (!m.open) {
            problems.push(`${width}x${height} ${state}: the sheet closed on resize (reopened for the read)`);
            await pressSummary(page);
            m = await readMetrics(page);
          }
          problems.push(...floorAndCutProblems(m, width, height, state));
        }
        expect(problems, `sweep ${state} at height ${height}: ${problems.length} problem(s) in ${WIDTHS.length} widths`).toEqual([]);
      });
    }
  }
}
