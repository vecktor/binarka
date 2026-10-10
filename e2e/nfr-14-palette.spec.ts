// @trace NFR-14
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// update-page-palette (NFR-14, FR-65, FR-64, A-57; G2 block 2): the paint of the page's main column equals the design reference's at the sampled cases of
// quality/design-paint.json, except the three deviations A-57 names. The fixture is frozen from the design build (scripts/freeze-design-paint.mjs), which
// stands in for review-set-14 (docs/qa/g2/harness-calibration.txt), with the same browser setup as this test (Playwright's "Desktop Chrome", reduced
// motion, no stored preference, the colour scheme on the context, the viewport 1024x768). Each case shows the design's fixture board through the
// capture-only board (FR-119), as the pixel capture and the geometry test do.
//
// Sampling: the schemes light and dark x the states default, hint, win, four and eight x one viewport (1024x768; paint does not depend on the width) =
// 10 cases. Coverage: sampled, never continuum. What the computed paint is blind to is listed in the fixture (`sampling.notStrictlyCovered`): the stripe's
// colour stops (only the presence of a gradient is compared), hover and active feedback, the win glow, a given cell in a violation, any element or state
// outside the 10 cases. The independent second instrument is the per-block pixel crop of scripts/visual-block.mjs.

interface ElementSpec {
  selector: string;
  filter?: string;
  group: string;
}
type PaintEntry = null | { visible: false } | { visible: true; values: Record<string, string> };
type Outline = null | { focused: false } | { focused: true; values: Record<string, string> };
interface Deviation {
  id: string;
  clause: string;
  elements: string[];
  properties: string[];
  scheme: 'light' | 'dark' | 'both';
  cases: string[];
  design: string;
  expected: string;
  reason: string;
  sampled?: boolean;
}
interface PaintCase {
  shot: string;
  scheme: 'light' | 'dark';
  state: string;
  width: number;
  height: number;
  captureBoard: unknown;
  /** One action after load, as the capture adapter does (the hint state: one press of the hint button). */
  afterLoad?: 'press-hint';
  paint: Record<string, PaintEntry>;
  focus: Record<string, Outline>;
}
interface Fixture {
  provenance: { designCommit: string; designBuildSha1: string; browser: string };
  coverage: string;
  sampling: { dimensions: string[]; schemes: string[]; states: string[]; viewports: { width: number; height: number }[]; cases: number };
  elements: Record<string, ElementSpec>;
  properties: Record<string, string[]>;
  focus: { targets: Record<string, string>; properties: string[] };
  deviations: Deviation[];
  cases: PaintCase[];
}

const fixtureText = readFileSync('quality/design-paint.json', 'utf8');
const fixture = JSON.parse(fixtureText) as Fixture;

// The sampled cases of the spec (the matrix is pinned, not only the count).
const SCHEMES = ['light', 'dark'] as const;
const STATES = ['default', 'hint', 'win', 'four', 'eight'];
const EXPECTED_SHOTS = SCHEMES.flatMap((scheme) => STATES.map((state) => `1024-${scheme}-${state}`)).sort();

// GUARD (the next three tests): they read quality/design-paint.json, frozen from the design build by task 1.1, and describe the fixture, not the
// page, so they are green by construction (docs/qa/update-page-palette/red-run.txt, section B). They pin its shape against a silent regeneration.
test('@trace NFR-14 the fixture covers exactly the 10 sampled paint cases of the spec, with its provenance', () => {
  expect(fixture.cases.map((c) => c.shot).sort(), 'the shots of quality/design-paint.json').toEqual(EXPECTED_SHOTS);
  expect(fixture.sampling.cases).toBe(10);
  expect(fixture.provenance.designCommit, 'the design commit').toMatch(/^[0-9a-f]{40}$/);
  expect(fixture.provenance.designBuildSha1, 'the build SHA-1').toMatch(/^[0-9a-f]{40}$/);
  expect(fixture.provenance.browser, 'the browser').toMatch(/chromium \d+/i);
  for (const c of fixture.cases) {
    expect([c.width, c.height], `${c.shot}: the viewport`).toEqual([1024, 768]);
    expect(c.shot, `${c.shot}: the shot name carries its scheme and state`).toBe(`1024-${c.scheme}-${c.state}`);
  }
});

test('@trace NFR-14 the fixture records the three deviation groups with the design value, the expected product value and the A-57 reason', () => {
  const byId = new Map(fixture.deviations.map((d) => [d.id, d]));
  expect([...byId.keys()].sort(), 'the three groups').toEqual(['given-in-violation-weight', 'light-cell-border', 'light-violating-digit']);
  for (const d of fixture.deviations) {
    expect(d.elements.length, `${d.id}: elements`).toBeGreaterThan(0);
    expect(d.properties.length, `${d.id}: properties`).toBeGreaterThan(0);
    expect(d.reason.length, `${d.id}: a reason`).toBeGreaterThan(20);
    expect(d.clause, `${d.id}: its A-57 clause`).toMatch(/A-57/);
    expect(d.design, `${d.id}: the design value is kept next to the expected one`).not.toBe(d.expected);
  }
  const border = byId.get('light-cell-border');
  expect(border?.scheme).toBe('light');
  expect([border?.design, border?.expected]).toEqual(['rgb(140, 131, 116)', 'rgb(132, 123, 109)']);
  expect(border?.cases.sort(), 'every light case that shows a cell').toEqual(STATES.map((s) => `1024-light-${s}`).sort());
  const digit = byId.get('light-violating-digit');
  expect(digit?.scheme).toBe('light');
  expect([digit?.design, digit?.expected]).toEqual(['rgb(179, 38, 30)', 'rgb(143, 29, 23)']);
  expect(digit?.cases, 'the light case with a violating cell').toEqual(['1024-light-default']);
  const weight = byId.get('given-in-violation-weight');
  expect([weight?.design, weight?.expected], 'the design rule sets 700, the product 800').toEqual(['700', '800']);
  expect(weight?.cases, 'not sampled: the design shows no given cell in a violation').toEqual([]);
  expect(weight?.sampled).toBe(false);
});

test('@trace NFR-14 the sampling is declared: schemes, states and the viewport; coverage sampled, no claim of every width, every state or a pixel floor', () => {
  expect(fixture.coverage).toBe('sampled');
  expect(fixture.sampling.dimensions).toEqual(['scheme', 'state', 'viewport']);
  expect(fixture.sampling.schemes).toEqual(['light', 'dark']);
  expect(fixture.sampling.states).toEqual(STATES);
  expect(fixture.sampling.viewports).toEqual([{ width: 1024, height: 768 }]);
  expect(fixtureText, 'the fixture claims no continuum, no all-widths or all-states coverage and no pixel floor').not.toMatch(/continuum|all widths|all states|pixel floor/i);
});

/** The page just as the capture shows the case: the design's fixture board through the capture-only board (FR-119), then the case's action. */
async function showCase(page: Page, c: PaintCase): Promise<void> {
  await page.setViewportSize({ width: c.width, height: c.height });
  await page.addInitScript((board: unknown) => {
    (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard = board;
  }, c.captureBoard);
  await page.goto('/');
  await expect(page.locator('[data-board] [data-cell]').first()).toBeVisible();
  // the scheme reached the page: with no stored preference the head step resolves the system scheme (a dark case must not run on the light page)
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), `${c.shot}: the page resolved the colour scheme`).toBe(c.scheme);
  if (c.afterLoad === 'press-hint') {
    await page.locator('[data-action="hint"]').evaluate((el: HTMLElement) => {
      el.click();
    });
    await expect(page.locator('[data-message="hint"]')).not.toBeEmpty();
  }
}

/** The paint of every element of the fixture in the page, read like scripts/freeze-design-paint.mjs reads the design. */
async function readPagePaint(page: Page): Promise<Record<string, PaintEntry>> {
  return page.evaluate(
    ({ elements, properties }) => {
      const kindOf = (cell: Element): string => {
        const has = (name: string): boolean => cell.classList.contains(name);
        if (has('cell-given')) return 'given';
        if (has('cell-hinted')) return 'hinted';
        if (has('cell-violation')) return 'violation';
        return cell.textContent.trim() === '' ? 'ordinary' : 'entry';
      };
      const out: Record<string, PaintEntry> = {};
      for (const [key, spec] of Object.entries(elements)) {
        const all = Array.from(document.querySelectorAll(spec.selector));
        const el = (spec.filter === undefined ? all : all.filter((e) => kindOf(e) === spec.filter))[0] ?? null;
        if (el === null) {
          out[key] = null;
          continue;
        }
        const r = el.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) {
          out[key] = { visible: false };
          continue;
        }
        const style = getComputedStyle(el);
        const values: Record<string, string> = {};
        for (const property of properties[spec.group] ?? []) {
          const v = style.getPropertyValue(property);
          values[property] = property === 'background-image' ? (v.includes('gradient(') ? 'gradient' : v === 'none' ? 'none' : `other: ${v}`) : v;
        }
        // the colour of a border that is not drawn paints nothing (the freeze script applies the same rule)
        for (const side of ['top', 'right', 'bottom', 'left']) {
          const drawn = !['none', 'hidden'].includes(values[`border-${side}-style`] ?? '') && values[`border-${side}-width`] !== '0px';
          if (!drawn && `border-${side}-color` in values) values[`border-${side}-color`] = 'unpainted';
        }
        out[key] = { visible: true, values };
      }
      return out;
    },
    { elements: fixture.elements, properties: fixture.properties },
  );
}

/** The value the page must have: the expected product value where a recorded deviation covers the (case, element, property), else the design's. */
function wanted(c: PaintCase, key: string, property: string, design: string): { want: string; deviation?: string } {
  for (const d of fixture.deviations) {
    if (d.sampled === false) continue;
    if (d.scheme !== 'both' && d.scheme !== c.scheme) continue;
    if (!d.cases.includes(c.shot) || !d.elements.includes(key) || !d.properties.includes(property)) continue;
    return { want: d.expected, deviation: d.id };
  }
  return { want: design };
}

for (const scheme of SCHEMES) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });

    for (const c of fixture.cases.filter((x) => x.scheme === scheme)) {
      test(`@trace NFR-14 ${c.shot}: the main column's computed paint equals the design's, except the recorded deviations`, async ({ page }) => {
        await showCase(page, c);
        const actual = await readPagePaint(page);
        const misses: string[] = [];
        for (const key of Object.keys(fixture.elements)) {
          const design = c.paint[key] ?? null;
          const got = actual[key] ?? null;
          if (design === null || got === null) {
            if (design !== got) misses.push(`${key}: ${design === null ? 'present on the page, absent in the design' : 'missing on the page'}`);
            continue;
          }
          if (!design.visible) {
            // an element the design hides (an empty hint or win line, the idle line behind a message) paints nothing; the page may keep it rendered at
            // zero size (FR-63), but must not paint it
            if (got.visible) misses.push(`${key}: the page shows it, the design hides it`);
            continue;
          }
          if (!got.visible) {
            misses.push(`${key}: the page has it at zero size, the design shows it`);
            continue;
          }
          for (const [property, designValue] of Object.entries(design.values)) {
            const { want, deviation } = wanted(c, key, property, designValue);
            const have = got.values[property];
            if (have !== want) {
              misses.push(`${key} ${property}: page ${have ?? 'missing'}, ${deviation === undefined ? 'design' : `expected (${deviation}; the design has ${designValue})`} ${want}`);
            }
          }
        }
        expect(misses, `${c.shot}: ${misses.length} paint values off`).toEqual([]);
      });

      test(`@trace NFR-14 @trace FR-65 ${c.shot}: the focus rings of the first non-given cell and of «Підказка» equal the design's: solid, 3px, offset 2px, the focus colour`, async ({ page }) => {
        await showCase(page, c);
        // keyboard modality first, then a script focus, so that :focus-visible applies (the capture adapter's keyboardFocus)
        await page.keyboard.press('Shift');
        for (const [name, selector] of Object.entries(fixture.focus.targets)) {
          await page.locator(selector).first().focus();
          const have = await page.evaluate(
            ({ sel, properties }) => {
              const el = document.querySelector(sel);
              if (el === null) return null;
              if (document.activeElement !== el) return { focused: false as const };
              const style = getComputedStyle(el);
              return { focused: true as const, values: Object.fromEntries(properties.map((p) => [p, style.getPropertyValue(p)])) };
            },
            { sel: selector, properties: fixture.focus.properties },
          );
          expect(have, `${c.shot}: the ${name} ring equals the design's`).toEqual(c.focus[name]);
          // the values the spec names, independent of the fixture
          expect(have, `${c.shot}: the ${name} ring is solid, 3px wide, 2px offset, in the focus colour`).toEqual({
            focused: true,
            values: { 'outline-color': scheme === 'light' ? 'rgb(30, 33, 38)' : 'rgb(241, 237, 228)', 'outline-width': '3px', 'outline-style': 'solid', 'outline-offset': '2px' },
          });
        }
      });
    }

    test(`@trace NFR-14 @trace FR-65 the ${scheme} deviations are the page's expected values: cell and given borders, and the violating digit`, async ({ page }) => {
      const c = fixture.cases.find((x) => x.shot === `1024-${scheme}-default`);
      expect(c, 'the default case of the scheme is in the fixture').toBeDefined();
      if (c === undefined) return;
      await showCase(page, c);
      const actual = await readPagePaint(page);
      const colour = (key: string, property: string): string | undefined => {
        const entry = actual[key] ?? null;
        return entry?.visible === true ? entry.values[property] : undefined;
      };
      // the product values of A-57, written out here independently of the fixture; the design's values are the ones the page must NOT have in light
      const border = scheme === 'light' ? 'rgb(132, 123, 109)' : 'rgb(138, 127, 113)';
      const digit = scheme === 'light' ? 'rgb(143, 29, 23)' : 'rgb(255, 138, 125)';
      expect(colour('cell-ordinary', 'border-top-color'), 'an ordinary cell border').toBe(border);
      expect(colour('cell-given', 'border-top-color'), 'a given cell border (equal to the cell border, PA-Q1 A)').toBe(border);
      expect(colour('cell-violation', 'color'), 'the violating digit').toBe(digit);
      if (scheme === 'light') {
        expect(colour('cell-ordinary', 'border-top-color'), "not the design's border").not.toBe('rgb(140, 131, 116)');
        expect(colour('cell-violation', 'color'), "not the design's digit").not.toBe('rgb(179, 38, 30)');
      }
    });

    test(`@trace NFR-14 @trace FR-65 the ${scheme} action row states its transparent fills and borders: «Скинути» has no fill and no border colour`, async ({ page }) => {
      const c = fixture.cases.find((x) => x.shot === `1024-${scheme}-default`);
      expect(c, 'the default case of the scheme is in the fixture').toBeDefined();
      if (c === undefined) return;
      await showCase(page, c);
      const reset = await page.locator('[data-action="reset"]').evaluate((el) => {
        const s = getComputedStyle(el);
        return [s.backgroundColor, s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor, s.textDecorationLine];
      });
      expect(reset, '«Скинути»: background and the four border colours transparent, underlined').toEqual([
        'rgba(0, 0, 0, 0)',
        'rgba(0, 0, 0, 0)',
        'rgba(0, 0, 0, 0)',
        'rgba(0, 0, 0, 0)',
        'rgba(0, 0, 0, 0)',
        'underline',
      ]);
    });
  });
}
