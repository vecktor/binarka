// Play page: the three action buttons declare a touch-target floor (NFR-12). Scenarios of the delta spec
// openspec/changes/fix-action-button-targets/specs/play-page/spec.md, «Action buttons meet the touch-target floor»:
// «The stylesheet declares a 44 px minimum height for each action button» and «A declared minimum height below the floor fails the
// stylesheet test» (the same tests go red when the declaration is deleted or lowered). Written FIRST (red): the stylesheet gives
// «Підказка», «Скинути» and «Нова головоломка» no `min-height`, so they measure 40 px tall.
//
// @trace NFR-12
// @trace FR-101
//
// update-setup-sheet-start adds the section at the end: «Почати», the summary button and «Закрити» declare the same 44 px floor
// (NFR-12, FR-101; delta scenario «The stylesheet declares a 44 px minimum height for the three buttons»). The seven tests above stay.
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
//  - Part (d), the pseudo-class blind spot: part (b) skips selectors with a pseudo-class, so `.buttons button:active { min-height: 2rem }`
//    (or the same inside `@media (hover: hover)`) would pass parts (a) to (c) while shrinking the button on press. Part (d) therefore
//    matches the action buttons against every `min-height` rule in the file, at the top level or in any at-rule, after STRIPPING the
//    selector with `stripPseudos()`: pseudo-elements (`::before`, `:after`, `::part(x)`) and pseudo-classes without a selector
//    argument or with a non-selector argument (`:hover`, `:active`, `:focus-visible`, `:disabled`, `:first-child`, `:nth-child(2)`)
//    are removed, text inside attribute brackets is left alone, and what is left is matched with `button.matches()`. Stripping
//    widens what a selector matches everywhere EXCEPT inside a negation: in `:not(...)` it can narrow it (`button:not(.x:hover)` ->
//    `button:not(.x)`), so a negated-state rule such as `.buttons :not(:not(:hover)) { min-height: 2rem }` is a KNOWN BLIND SPOT of
//    part (d) (review-gate confirming run wf_2da18d60-f88; the simpler form `button:not([data-action="hint"]:hover)` is still caught by
//    part (a), because jsdom never matches `:hover` and so applies the rule). The real-browser check measures the resting state only. A selector made only of
//    pseudo-classes (`:hover`) strips to `*`. `:root` is kept (jsdom matches it, and it is never the button). The selector-taking
//    functional pseudo-classes `:not()`, `:is()`, `:where()`, `:has()` are kept for jsdom to evaluate, after stripping the pseudo-classes
//    inside them; an argument left empty (`:not(:hover)` -> `:not()`) is dropped, which is again the wider reading. A selector that
//    still cannot be parsed after stripping (for example `:is(.a, :hover)` -> `:is(.a, )`) is KEPT OUT of the matching and is
//    documented by the last test of part (d): it fails if such an unparsable selector mentions `button`, `data-action` or `.buttons`,
//    so an unparsable selector can only hide in rules for other controls. Each matching value must read as at least 44 px (px or rem).
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

/** Pseudo-classes whose argument is a selector list: kept for jsdom to evaluate (their insides are stripped too). */
const SELECTOR_PSEUDOS = ['not', 'is', 'where', 'has', 'matches'];

/**
 * The selector with pseudo-elements and pseudo-classes removed (see part (d) of the file header). Attribute brackets are set aside
 * first so a colon inside `[data-x="a:b"]` is not read as a pseudo-class. Widens what the selector matches, except inside `:not()`, where it can narrow it (header, part (d)).
 */
function stripPseudos(selector: string): string {
  const brackets: string[] = [];
  let text = selector.replace(/\[[^\]]*\]/g, (m) => `@@${brackets.push(m) - 1}@@`);
  const keep = SELECTOR_PSEUDOS.map((n) => `${n}\\(`).join('|');
  // pseudo-elements (two colons, or the legacy one-colon four), then pseudo-classes other than :root and the selector-taking functions
  text = text.replace(/::[\w-]+(?:\([^()]*\))?/g, '');
  text = text.replace(/:(?:before|after|first-line|first-letter)(?![\w-])/g, '');
  const pseudoClass = new RegExp(`:(?!root(?![\\w-])|(?:${keep}))[\\w-]+(?:\\([^()]*\\))?`, 'g');
  let previous: string;
  do {
    previous = text;
    text = text.replace(pseudoClass, ''); // repeated: removing an inner one can expose an outer empty function
    text = text.replace(new RegExp(`:(?:${SELECTOR_PSEUDOS.join('|')})\\(\\s*\\)`, 'g'), '');
  } while (text !== previous);
  text = text.replace(/@@(\d+)@@/g, (_m, i: string) => brackets[Number(i)] ?? '');
  return text.trim() === '' ? '*' : text.trim();
}

type StrippedMatch = 'match' | 'no match' | 'unparsable';

function matchesStripped(button: Element, selector: string): StrippedMatch {
  try {
    return button.matches(stripPseudos(selector)) ? 'match' : 'no match';
  } catch {
    return 'unparsable'; // jsdom cannot parse it even after stripping: kept out, and guarded by the last test of part (d)
  }
}

/** Every rule in the file (top level or inside any at-rule) that declares `min-height` and has a selector matching `button` once stripped. */
function strippedMinHeightRulesFor(button: Element, rules: StyleRuleInfo[]): StyleRuleInfo[] {
  return rules.filter(
    (rule) =>
      rule.declarations.some((d) => d.property === 'min-height') &&
      rule.selectors.some((selector) => !selector.startsWith('@') && matchesStripped(button, selector) === 'match'),
  );
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
    // the five values that must fail the floor
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
      expect(rules.length, `at least one rule declares min-height for ${name} (${selector}); none matches the button`).toBeGreaterThan(0);
      for (const rule of rules) {
        expect(
          rule.context,
          `the min-height rule "${rule.selectors.join(', ')}" for ${name} is not inside an at-rule (@media, @supports, @layer): it is at ${rule.context.join(' ') || 'the top level'}`,
        ).toEqual([]);
      }
    });
  }
});

describe('@trace NFR-12 the stripping of pseudo-classes keeps the blind-spot check honest', () => {
  it('strips state pseudo-classes and pseudo-elements, keeps attribute text, :root and selector functions', () => {
    expect(stripPseudos('.buttons button:hover')).toBe('.buttons button');
    expect(stripPseudos('.buttons button:active')).toBe('.buttons button');
    expect(stripPseudos('.buttons button:focus-visible')).toBe('.buttons button');
    expect(stripPseudos('button:nth-child(2n+1):disabled')).toBe('button');
    expect(stripPseudos('button::before')).toBe('button');
    expect(stripPseudos('button:after')).toBe('button');
    expect(stripPseudos('[data-action="hint"]:hover')).toBe('[data-action="hint"]');
    expect(stripPseudos('[data-x="a:b"]')).toBe('[data-x="a:b"]');
    expect(stripPseudos(':hover')).toBe('*');
    expect(stripPseudos(':root')).toBe(':root');
    expect(stripPseudos('button:not(.x):hover')).toBe('button:not(.x)');
    expect(stripPseudos('button:not(:hover)')).toBe('button');
  });
});

describe('@trace NFR-12 no pseudo-class, media or other rule shrinks an action button below the floor', () => {
  for (const [name, selector] of ACTION_BUTTONS) {
    it(`Every min-height rule that matches ${name} (${selector}) once pseudo-classes are stripped, in any at-rule too, declares at least 44 px`, () => {
      const root = mountFixture(BLANK);
      const button = q(root, selector);
      const rules = strippedMinHeightRulesFor(button, readStyles().rules);
      // premise: the check sees at least the rule that carries the floor, so an empty match cannot pass it
      expect(rules.length, `at least one rule declares min-height for ${name} (${selector}) after stripping; none matches the button`).toBeGreaterThan(0);
      const below = rules.flatMap((rule) =>
        rule.declarations
          .filter((d) => d.property === 'min-height' && !(lengthPx(d.value) >= FLOOR_PX))
          .map((d) => `${rule.context.join(' ')} ${rule.selectors.join(', ')} { min-height: ${d.value} } reads as ${lengthPx(d.value)} px`.trim()),
      );
      expect(below, `${name}: every declared min-height must be a px or rem length of at least ${FLOOR_PX} px, in any state (:hover, :active, :focus-visible) and in any at-rule`).toEqual([]);
    });
  }

  it('A min-height rule whose selector cannot be parsed even after stripping never mentions a button, data-action or .buttons', () => {
    const buttons = ACTION_BUTTONS.map(([, selector]) => q(mountFixture(BLANK), selector));
    expect(buttons.length).toBe(3);
    const unparsable = readStyles()
      .rules.filter((rule) => rule.declarations.some((d) => d.property === 'min-height'))
      .flatMap((rule) => rule.selectors.map((selector) => ({ selector, context: rule.context.join(' ') })))
      .filter(({ selector }) => !selector.startsWith('@') && buttons.every((b) => matchesStripped(b, selector) === 'unparsable'));
    expect(
      unparsable.filter(({ selector }) => /button|data-action|\.buttons/i.test(selector)).map((u) => `${u.context} ${u.selector}`.trim()),
      'an unparsable selector that names a button is not judged by the matching test above; rewrite it so jsdom can parse it',
    ).toEqual([]);
  });
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

// ---------------------------------------------------------------------------------------------------------
// update-setup-sheet-start: the start button, the summary button and the close button of the setup sheet (NFR-12, FR-101)
// ---------------------------------------------------------------------------------------------------------

/** The three buttons of the scenario «The stylesheet declares a 44 px minimum height for the three buttons». */
const SHEET_BUTTONS: [string, string][] = [
  ['«Почати»', '[data-action="setup-start"]'],
  ['the summary button', '[data-action="setup"]'],
  ['«Закрити»', '[data-action="setup-close"]'],
];

describe('@trace NFR-12 @trace FR-101 the stylesheet declares a 44 px minimum height for «Почати», the summary button and «Закрити»', () => {
  it('The stylesheet declares a 44 px minimum height for the three buttons', () => {
    const root = mountFixture(BLANK);
    injectPageStyles();
    const rules = readStyles().rules;
    for (const [name, selector] of SHEET_BUTTONS) {
      const button = q(root, selector); // «Почати» is missing on a page without the start button: this line fails first
      expect(button.tagName, `${name} is a button element`).toBe('BUTTON');
      const value = getComputedStyle(button).minHeight;
      expect(
        lengthPx(value) >= FLOOR_PX,
        `${name} has min-height "${value}" (reads as ${lengthPx(value)} px); NFR-12 needs a length of at least ${FLOOR_PX} px, for example 2.75rem`,
      ).toBe(true);
      // one ordinary declaration in a rule that matches the element: at least one rule, none of them inside an at-rule
      const declaring = minHeightRulesFor(button, rules);
      expect(declaring.length, `at least one top-level rule declares min-height for ${name}`).toBeGreaterThan(0);
      for (const rule of declaring) {
        expect(rule.context, `the min-height rule "${rule.selectors.join(', ')}" for ${name} is not inside an at-rule`).toEqual([]);
      }
      // no state or at-rule rule shrinks it, and none is !important
      const below = strippedMinHeightRulesFor(button, rules).flatMap((rule) =>
        rule.declarations
          .filter((d) => d.property === 'min-height' && !(lengthPx(d.value) >= FLOOR_PX))
          .map((d) => `${rule.context.join(' ')} ${rule.selectors.join(', ')} { min-height: ${d.value} }`.trim()),
      );
      expect(below, `${name}: every declared min-height is at least ${FLOOR_PX} px in any state`).toEqual([]);
      const important = strippedMinHeightRulesFor(button, rules).filter((rule) => rule.declarations.some((d) => d.property === 'min-height' && d.important));
      expect(important.map((rule) => rule.selectors.join(', ')), `${name}: no min-height declaration is !important`).toEqual([]);
    }
  });
});
