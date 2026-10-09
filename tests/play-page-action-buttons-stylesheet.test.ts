// Play page: the three action buttons declare a touch-target floor (NFR-12). Scenarios of the delta spec
// openspec/changes/fix-action-button-targets/specs/play-page/spec.md, «Action buttons meet the touch-target floor»:
// «The stylesheet declares a 44 px minimum height for each action button» and «A declared minimum height below the floor fails the
// stylesheet test» (the same tests go red when the declaration is deleted or lowered). Written FIRST (red): the stylesheet gives
// «Підказка», «Скинути» and «Нова головоломка» no `min-height`, so they measure 40 px tall.
//
// @trace NFR-12
//
// WHAT THIS FILE CANNOT DECIDE: jsdom has no layout (TC-13), so no test here sees a rendered size. This file checks the
// DECLARATION only; the measured size (at least 44x44 CSS px at the eight sampled viewports) is decided by the real-browser check
// e2e/nfr-12-targets.spec.ts (`npm run test:e2e`, project `layout`). The eight viewports are a sample, not continuum coverage.
//
// HOW IT READS THE STYLESHEET (verified in jsdom 29 before this file was written):
//  - Part (a), the computed value: jsdom DOES cascade top-level style rules into getComputedStyle after `injectPageStyles()`. It
//    returns `min-height` as written (`2.75rem` stays `2.75rem`, `44px` stays `44px`, `0` becomes `0px`) and `auto` when no rule
//    sets it. A rule inside @media is NOT applied, so a floor hidden in a media query reads `auto`. The value is converted with
//    rem = 16 px (the root font size of the page); anything that is not a plain px or rem number (auto, calc(), var(), %, em)
//    reads as NaN and fails, because it cannot be shown to be 44 px without layout.
//  - Part (b), the declarations: `readStyles()` rules whose resolved selector the button `matches()` (selectors with a pseudo-class
//    or pseudo-element are skipped, as jsdom never matches them). Each must sit at the top level (`context` is empty), because the
//    spec forbids a floor that exists only inside an at-rule (@media, @supports, @layer).
//  - Part (c): no `min-height` declaration anywhere in the file has the priority `important`.
// Helpers: tests/helpers/play-page.ts, tests/helpers/css.ts (unchanged).
import { describe, expect, it } from 'vitest';
import { BLANK, installPageLifecycle, mountFixture, q } from './helpers/play-page';
import { injectPageStyles, readStyles } from './helpers/css';
import type { StyleRuleInfo } from './helpers/css';

installPageLifecycle();

const FLOOR_PX = 44;
const REM_PX = 16;

/** The three action buttons: name for the failure message, and the selector the tests find them by (no dependence on the fix's selector). */
const ACTION_BUTTONS: [string, string][] = [
  ['«Підказка»', '[data-action="hint"]'],
  ['«Скинути»', '[data-action="reset"]'],
  ['«Нова головоломка»', '[data-action="new"]'],
];

/** A computed `min-height` as px: a plain `px` or `rem` length (rem = 16 px), a bare `0`; NaN for auto, empty, calc(), var(), em, %. */
function lengthPx(value: string): number {
  const m = /^(-?\d*\.?\d+)(px|rem)?$/.exec(value.trim());
  if (m?.[1] === undefined) return Number.NaN;
  const n = Number(m[1]);
  if (m[2] === 'rem') return n * REM_PX;
  if (m[2] === 'px') return n;
  return n === 0 ? 0 : Number.NaN; // a unitless number other than 0 is not a length
}

/** True when the selector holds a pseudo-class or pseudo-element outside attribute brackets and quotes (jsdom never matches those). */
function hasPseudo(selector: string): boolean {
  return selector.replace(/\[[^\]]*\]/g, '').includes(':');
}

/** The rules of the stylesheet that declare `min-height` and whose selector list has a selector (no pseudo) that `button` matches. */
function minHeightRulesFor(button: Element, rules: StyleRuleInfo[]): StyleRuleInfo[] {
  return rules.filter((rule) => {
    if (!rule.declarations.some((d) => d.property === 'min-height')) return false;
    return rule.selectors.some((selector) => {
      if (selector.startsWith('@') || hasPseudo(selector)) return false;
      try {
        return button.matches(selector);
      } catch {
        return false; // a selector jsdom cannot parse cannot be shown to match
      }
    });
  });
}

describe('@trace NFR-12 the length reader tells a floor from a non-floor', () => {
  it('reads px and rem, and rejects empty, auto, 0, 2.5rem and anything it cannot size', () => {
    expect(lengthPx('2.75rem')).toBe(44);
    expect(lengthPx('44px')).toBe(44);
    expect(lengthPx('3rem')).toBe(48);
    expect(lengthPx('')).toBeNaN();
    expect(lengthPx('auto')).toBeNaN();
    expect(lengthPx('calc(2rem + 12px)')).toBeNaN();
    expect(lengthPx('var(--x)')).toBeNaN();
    expect(lengthPx('2.75em')).toBeNaN();
    expect(lengthPx('0px')).toBe(0);
    expect(lengthPx('0')).toBe(0);
    expect(lengthPx('2.5rem')).toBe(40);
    // the three that must fail the floor
    for (const below of ['', 'auto', '0px', '0', '2.5rem']) {
      expect(lengthPx(below) >= FLOOR_PX, `"${below}" is not a 44 px floor`).toBe(false);
    }
  });
});

describe('@trace NFR-12 the stylesheet declares a 44 px minimum height for each action button', () => {
  for (const [name, selector] of ACTION_BUTTONS) {
    it(`The computed min-height of ${name} (${selector}) is a length of at least 44 px`, () => {
      const root = mountFixture(BLANK);
      const button = q(root, selector);
      expect(button.tagName, `${name} is a button element`).toBe('BUTTON');
      injectPageStyles();
      const value = getComputedStyle(button).minHeight;
      expect(
        lengthPx(value) >= FLOOR_PX,
        `${name} has min-height "${value}" (reads as ${lengthPx(value)} px); NFR-12 needs a length of at least ${FLOOR_PX} px, for example 2.75rem`,
      ).toBe(true);
    });

    it(`Every rule that declares min-height for ${name} is at the top level of the stylesheet, and at least one exists`, () => {
      const root = mountFixture(BLANK);
      const button = q(root, selector);
      const rules = minHeightRulesFor(button, readStyles().rules);
      expect(rules.length, `at least one top-level rule declares min-height for ${name} (${selector}); none matches the button`).toBeGreaterThan(0);
      for (const rule of rules) {
        expect(
          rule.context,
          `the min-height rule "${rule.selectors.join(', ')}" for ${name} is not inside an at-rule (@media, @supports, @layer): it is at ${rule.context.join(' ') || 'the top level'}`,
        ).toEqual([]);
      }
    });
  }
});

describe('@trace NFR-12 no min-height is forced with !important', () => {
  it('No min-height declaration in the stylesheet has the priority important', () => {
    const declarations = readStyles().rules.flatMap((rule) =>
      rule.declarations
        .filter((d) => d.property === 'min-height')
        .map((d) => ({ where: `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim(), important: d.important, value: d.value })),
    );
    // premise: the check looks at real declarations (the stylesheet already sets min-height on other controls)
    expect(declarations.length, 'the stylesheet declares min-height somewhere').toBeGreaterThan(0);
    expect(
      declarations.filter((d) => d.important).map((d) => `${d.where} { min-height: ${d.value} !important }`),
      'no min-height declaration is !important',
    ).toEqual([]);
  });
});
