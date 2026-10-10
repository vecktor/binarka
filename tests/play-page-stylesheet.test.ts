// Play page: the stylesheet requirements, read from src/ui/style.css (FR-64, FR-65; FR-61 for the rule that would drop the
// semantics of the board group and its buttons; FR-63 for the status regions that stay rendered while empty). Part (a) walks
// the parsed CSSOM; part (b) lets jsdom compute the cascade of the injected text. jsdom never matches :focus-visible and
// applies no @media or nested rule to computed style, so those are judged at declaration level only (A-28, TC-13). Scenarios of
// openspec/specs/play-page/spec.md (reconcile-ux-accessibility); the helper is tests/helpers/css.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  PAIR_PLUS_4,
  PAIR_PLUS_8,
  PAIR_ROW_PLUS,
  allCells,
  cellEl,
  clickCell,
  installPageLifecycle,
  mountFixture,
  mountThenSelect,
  q,
  rulesPanel,
} from './helpers/play-page';
import {
  TOKEN_NAMES,
  contrastProblems,
  contrastRatio,
  declarationsFor,
  injectPageStyles,
  px,
  readStyleText,
  readStyles,
  rgbOf,
  rulesWithSelector,
  scanColours,
  themeTokenSets,
} from './helpers/css';
import type { ParsedStyles, TokenSet } from './helpers/css';

installPageLifecycle();

/** Assert the merged declaration `property` of the rules for `selector` (`var(--color-x)` written as the stylesheet has it). */
function expectDecl(parsed: ParsedStyles, selector: string, property: string, expected: string): void {
  expect(declarationsFor(parsed, selector).get(property)?.toLowerCase(), `${selector} { ${property}: ${expected} }`).toBe(expected);
}

/**
 * add-theme-switch (FR-65, A-51): the `#rrggbb` value of a token in one token set (light or dark), asserted to exist. The set list
 * comes from `themeTokenSets`, which fails on an assertion when the stylesheet has no `:root[data-theme="dark"]` block, so a loop
 * over it can never pass on the light set alone.
 */
function tokenIn(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined && /^#[0-9a-f]{6}$/i.test(value), `${name} is #rrggbb in the ${set.label} token set`);
  return value;
}

/** The subject of a selector: its last compound selector (after the last combinator outside brackets and parentheses). */
function subjectOf(selector: string): string {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector.charAt(i);
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    else if (depth === 0 && /[\s>+~]/.test(ch)) start = i + 1;
  }
  return selector.slice(start);
}

/** The token name of a value that is a single `var(--color-x)` of a token declared in :root, else undefined. */
function tokenOf(parsed: ParsedStyles, value: string | undefined): string | undefined {
  const name = /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value ?? '')?.[1];
  return name !== undefined && name in parsed.tokens ? name : undefined;
}

// ---------------------------------------------------------------------------------------------------------
// (a) CSSOM walk
// ---------------------------------------------------------------------------------------------------------

describe('the colours are tokens (FR-65)', () => {
  it('@trace FR-65 Tokens exist and are literal: 13 names, each declared once in the top-level :root as #rrggbb', () => {
    const parsed = readStyles();
    expect(TOKEN_NAMES).toHaveLength(13);
    for (const name of TOKEN_NAMES) {
      const declarations = parsed.tokenDeclarations.filter((d) => d.property === name);
      expect(declarations, `${name} is declared once in the top-level :root`).toHaveLength(1);
      expect(declarations[0]?.value, `${name} is #rrggbb`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('@trace FR-65 No colour literal is left: no hex, rgb(), hsl() ... outside :root, wherever the rule is in the file', () => {
    const parsed = readStyles();
    expect(parsed.rules.length, 'the walk found the rules').toBeGreaterThan(5);
    expect(scanColours(parsed).literals).toEqual([]);
  });

  it('@trace FR-65 No CSS named colour is left outside :root', () => {
    expect(scanColours(readStyles()).named).toEqual([]);
  });

  it('@trace FR-65 Every colour-bearing shorthand has a var(--color-...) colour (or is none or 0)', () => {
    expect(scanColours(readStyles()).shorthands).toEqual([]);
  });

  it('@trace FR-65 Every color, background-color, border-color and outline-color is one declared token or an allowed keyword', () => {
    expect(scanColours(readStyles()).colourProperties).toEqual([]);
  });

  it('@trace FR-65 No --color-* property is declared outside :root', () => {
    expect(scanColours(readStyles()).tokensOutsideRoot).toEqual([]);
  });

  it('@trace FR-65 The named rules take their colours from the named tokens, written with the longhands', () => {
    const parsed = readStyles();
    expectDecl(parsed, 'body', 'background-color', 'var(--color-page)');
    expectDecl(parsed, 'body', 'color', 'var(--color-text)');
    expectDecl(parsed, '.cell', 'border-color', 'var(--color-cell-border)');
    expectDecl(parsed, '.cell', 'background-color', 'var(--color-cell-bg)');
    expectDecl(parsed, '.cell-given', 'border-color', 'var(--color-given-border)');
    expectDecl(parsed, '.cell-given', 'background-color', 'var(--color-given-bg)');
    expectDecl(parsed, '.cell-violation', 'border-color', 'var(--color-violation-border)');
    expectDecl(parsed, '.cell-violation', 'background-color', 'var(--color-violation-bg)');
    expectDecl(parsed, '.cell-violation', 'color', 'var(--color-violation-text)');
    expectDecl(parsed, '.message-win', 'color', 'var(--color-win-text)');
    for (const selector of ['.cell:focus-visible', 'button:focus-visible']) {
      expectDecl(parsed, selector, 'outline-color', 'var(--color-focus)');
    }
  });

  it('@trace FR-65 The button rule takes text, fill and border from the control tokens', () => {
    const parsed = readStyles();
    for (const selector of ['button']) {
      expectDecl(parsed, selector, 'color', 'var(--color-text)');
      expectDecl(parsed, selector, 'background-color', 'var(--color-control-bg)');
      expectDecl(parsed, selector, 'border-color', 'var(--color-control-border)');
    }
  });
});

// add-theme-switch DELIBERATE CHANGE (FR-65, A-51; autonomy-log rows 118 and 124, decision A1): the five scenarios «Cell borders have 3:1»,
// «The given cue has 3:1 and is not the fill», «The violation cue has 3:1», «The focus ring has 3:1 against every cell background» and «The
// control border has 3:1 and the text has 4.5:1» now say "the resolved colours of the tokens of each token set (light, then dark)": each
// loops over `themeTokenSets(parsed)` (the dark set is asserted to exist). The declarations are asserted once; no threshold changed.
describe('contrast (FR-65, NFR-9)', () => {
  it('@trace FR-65 Cell borders have 3:1 against the page, the cell and the given fill, in the light and in the dark token set', () => {
    const parsed = readStyles();
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-cell-border');
      expect(contrastProblems(set.tokens, ['cell-border']), `${set.label} token set`).toEqual([]);
    }
  });

  it('@trace FR-65 @trace FR-64 The given cue has 3:1 and is not the fill: 2px border in its own colour, bold digits (light and dark)', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.cell-given', 'border-width', '2px');
    expectDecl(parsed, '.cell-given', 'border-color', 'var(--color-given-border)');
    expectDecl(parsed, '.cell-given', 'font-weight', '700');
    expect(px(declarationsFor(parsed, '.cell-given').get('border-width'))).toBeGreaterThan(
      px(declarationsFor(parsed, '.cell').get('border-width')),
    );
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-given-border');
      expect(contrastProblems(set.tokens, ['given-cue']), `${set.label} token set`).toEqual([]);
      // the cue tells a given from an ordinary cell without the fill: another colour (and a wider border, above)
      expect(tokenIn(set, '--color-given-border').toLowerCase(), `${set.label}: the given border differs from the cell border`).not.toBe(
        tokenIn(set, '--color-cell-border').toLowerCase(),
      );
    }
  });

  it('@trace FR-65 @trace FR-64 The violation cue has 3:1 against the page, the cell and the violation fill (light and dark)', () => {
    const parsed = readStyles();
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-violation-border');
      expect(contrastProblems(set.tokens, ['violation-cue']), `${set.label} token set`).toEqual([]);
    }
  });

  it('@trace FR-65 The focus ring has 3:1 against the page and every cell background (light and dark)', () => {
    const parsed = readStyles();
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-focus');
      expect(contrastProblems(set.tokens, ['focus-ring']), `${set.label} token set`).toEqual([]);
    }
  });

  it('@trace FR-65 @trace NFR-9 The control border has 3:1 and the text pairs have 4.5:1 (light and dark)', () => {
    const parsed = readStyles();
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-control-border');
      tokenIn(set, '--color-text');
      expect(contrastProblems(set.tokens, ['control-border', 'text']), `${set.label} token set`).toEqual([]);
    }
  });

  it('@trace FR-65 @trace NFR-9 Every pair holds for the top-level token set, the dark set and every set a conditional :root block makes', () => {
    const parsed = readStyles();
    expect(parsed.tokenSets.length).toBeGreaterThanOrEqual(1);
    expect(parsed.tokenSets[0]?.label).toBe('top-level');
    // add-theme-switch: the light and the dark set always exist (themeTokenSets asserts the dark one), a conditional block adds sets only if the file has one
    expect(themeTokenSets(parsed).map((set) => set.label)).toEqual(['light', 'dark']);
    for (const set of parsed.tokenSets) {
      expect(contrastProblems(set.tokens), `token set "${set.label}"`).toEqual([]);
    }
  });
});

describe('visible, unobscured focus indicators (FR-65)', () => {
  const targets = ['.cell:focus-visible', 'button:focus-visible'];

  it('@trace FR-65 Focus-visible rules exist for the cell and the button: solid, at least 2px, the focus token', () => {
    const parsed = readStyles();
    for (const selector of targets) {
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      expectDecl(parsed, selector, 'outline-style', 'solid');
      expect(px(declarationsFor(parsed, selector).get('outline-width')), `${selector} outline-width`).toBeGreaterThanOrEqual(2);
      expectDecl(parsed, selector, 'outline-color', 'var(--color-focus)');
    }
  });

  it('@trace FR-65 The cell ring is outside the border and above the neighbours: offset 2px, position relative, z-index at least 1', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.cell:focus-visible', 'outline-offset', '2px');
    expectDecl(parsed, '.cell:focus-visible', 'position', 'relative');
    const zIndex = Number(declarationsFor(parsed, '.cell:focus-visible').get('z-index'));
    expect(Number.isInteger(zIndex) && zIndex >= 1, `z-index ${zIndex} is an integer of at least 1`).toBe(true);
  });

  it('@trace FR-65 The button ring has a positive outline-offset', () => {
    const parsed = readStyles();
    for (const selector of ['button:focus-visible']) {
      expect(px(declarationsFor(parsed, selector).get('outline-offset')), `${selector} outline-offset`).toBeGreaterThan(0);
    }
  });

  // fix-size-option-focus-ring (FR-65 "unobscured"; «Segmented options keep the focus ring inside the card»): inside a segmented card an
  // outset ring runs over the gap and the neighbour option, so the options of the size, theme and language controls pull it inside.
  // That every other button keeps the outset ring is the test above («The button ring has a positive outline-offset»).
  it('@trace FR-65 Each segmented control declares an inset focus ring: outline-offset -1px, not important', () => {
    const parsed = readStyles();
    for (const control of ['.size-control', '.theme-control', '.language-control']) {
      const selector = `${control} button:focus-visible`;
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      expectDecl(parsed, selector, 'outline-offset', '-1px');
      const important = rulesWithSelector(parsed, selector).flatMap((r) =>
        r.declarations.filter((d) => d.property === 'outline-offset' && d.important),
      );
      expect(important, `${selector} outline-offset is not !important`).toEqual([]);
    }
  });

  // update-setup-sheet-start, review-gate second fix round (finding 1, FR-65): the sticky footer strip hides a keyboard-focused
  // level option when the sheet scrolls, unless the scroll container reserves the strip in its scroll padding.
  it('@trace FR-65 The open sheet reserves the footer in its scroll padding: scroll-padding-bottom of at least calc(2.75rem + 48px) (92px)', () => {
    const parsed = readStyles();
    expect(rulesWithSelector(parsed, '.setup-sheet:popover-open').length, 'a rule for .setup-sheet:popover-open').toBeGreaterThan(0);
    const value = declarationsFor(parsed, '.setup-sheet:popover-open').get('scroll-padding-bottom');
    expect(value, '.setup-sheet:popover-open declares scroll-padding-bottom').toBeDefined();
    // 1rem = 16px; accept one length (px or rem) or a calc() sum of such lengths
    const lengthPx = (term: string): number => {
      const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(term.trim());
      return m?.[1] === undefined ? Number.NaN : Number(m[1]) * (m[2] === 'rem' ? 16 : 1);
    };
    const inner = /^calc\(\s*(.+)\s*\)$/i.exec((value ?? '').trim())?.[1] ?? (value ?? '').trim();
    const terms = inner.split(/\s+\+\s+/);
    const total = terms.reduce((sum, term) => sum + lengthPx(term), 0);
    expect(Number.isFinite(total), `scroll-padding-bottom «${value}» is a px/rem length or a calc() sum of them`).toBe(true);
    expect(total, `scroll-padding-bottom «${value}» = ${total}px, at least the strip, the bottom padding and the ring: 2.75rem + 48px = 92px (the measured need, focus-obscured-repro.txt)`).toBeGreaterThanOrEqual(92);
  });

  it('@trace FR-65 Nothing removes the outline (text search and declarations)', () => {
    const text = readStyleText();
    expect(text).not.toMatch(/outline\s*:\s*(none|0(px)?(?![\d.]))/i);
    expect(text).not.toMatch(/outline-style\s*:\s*none/i);
    expect(text).not.toMatch(/outline-width\s*:\s*0(px)?(?![\d.])/i);
    const parsed = readStyles();
    const removing = parsed.rules.flatMap((r) =>
      r.declarations.filter(
        (d) =>
          (d.property === 'outline' && /^(none|0|0px)$/i.test(d.value)) ||
          (d.property === 'outline-style' && d.value.toLowerCase() === 'none') ||
          (d.property === 'outline-width' && px(d.value) === 0),
      ),
    );
    expect(removing).toEqual([]);
  });

  it('@trace FR-65 Every page button is a button element, so button:focus-visible (and .cell:focus-visible for the cells) applies to it', () => {
    // Slice DL2 DELIBERATE CHANGE (FR-65 modified, FR-87, FR-95, FR-97): seven radio buttons (three sizes, four levels), the
    // summary button and the close button of the setup sheet join the list (was three radios and 1 + 3 + 3 + 1 + 2 + 36 buttons);
    // update-setup-sheet-start (FR-65, FR-101): the start button «Почати» joins it too (one more button)
    const root = mountFixture(BLANK);
    const panel = rulesPanel(root);
    // add-theme-switch DELIBERATE CHANGE (FR-65, FR-102, FR-117; delta «Every page button is a button element»): the three theme options are
    // radios inside the root too (7 becomes 10), and the settings button and the settings panel's close button join the list (53 becomes 58)
    // add-english-version DELIBERATE CHANGE (FR-65, FR-107; delta «Every page button is a button element»): the two language options are radios
    // too (10 becomes 12), and the list of buttons grows from 58 to 60
    const radios = Array.from(root.querySelectorAll('[role="radio"]'));
    expect(radios, 'the three size buttons, the four level buttons, the three theme options and the two language options').toHaveLength(12);
    const panelButtons = Array.from(panel.querySelectorAll('button'));
    expect(panelButtons, 'premise: the rules panel holds one button, its close button').toHaveLength(1);
    const buttons: Element[] = [
      q(root, '[data-action="rules"]'),
      q(root, '[data-action="settings"]'),
      q(root, '[data-action="setup"]'),
      ...radios,
      q(root, '[data-action="setup-start"]'),
      q(root, '[data-action="setup-close"]'),
      q(root, '[data-action="settings-close"]'),
      q(root, '[data-action="hint"]'),
      q(root, '[data-action="reset"]'),
      q(root, '[data-action="new"]'),
      ...panelButtons,
      q(root, '[data-confirm="yes"]'),
      q(root, '[data-confirm="no"]'),
      ...allCells(root),
    ];
    expect(buttons).toHaveLength(1 + 1 + 1 + 12 + 1 + 1 + 1 + 3 + 1 + 2 + 36);
    for (const button of buttons) {
      expect(button.tagName, `${button.getAttribute('data-action') ?? button.getAttribute('data-confirm') ?? button.getAttribute('role') ?? 'cell'} is a button element`).toBe('BUTTON');
    }
  });

  it('@trace FR-65 The stylesheet stays inside the build target, with one :has( exception: no !important; exactly one rule has :has(, its subject is .message-idle and it declares only display: none', () => {
    expect(readStyleText()).not.toMatch(/!\s*important/i);
    const parsed = readStyles();
    expect(parsed.rules.flatMap((r) => r.declarations.filter((d) => d.important))).toEqual([]);
    const withHas = parsed.rules.filter((r) => r.selectors.some((s) => s.includes(':has(')));
    expect(withHas, 'exactly one rule contains :has(').toHaveLength(1);
    expect(readStyleText().match(/:has\(/gi) ?? [], 'the raw text holds :has( exactly once (no rule the parser drops, no at-rule prelude)').toHaveLength(1);
    const rule = withHas[0];
    expect.assert(rule !== undefined, 'premise: one rule contains :has(');
    expect(rule.selectors.map(subjectOf), 'the subject of its selector is .message-idle').toEqual(['.message-idle']);
    expect(rule.declarations.map((d) => `${d.property}: ${d.value}`), 'it declares nothing but display: none').toEqual(['display: none']);
  });
});

describe('rows are kept in the accessibility tree and the label is not hidden', () => {
  it('@trace FR-61 No rule uses display: contents (it has a history of dropping row semantics)', () => {
    expect(readStyleText()).not.toMatch(/display\s*:\s*contents/i);
    const parsed = readStyles();
    expect(parsed.rules.flatMap((r) => r.declarations.filter((d) => d.property === 'display' && d.value === 'contents'))).toEqual([]);
  });
});

describe('the selector sets its own colours and the board disables double-tap zoom (FR-65)', () => {
  // add-theme-switch DELIBERATE CHANGE (FR-65, A-51; delta «The size buttons set their own colours...», decision A1): the 4.5:1 ratio of the
  // text to the background is computed in the light AND in the dark token set; the declarations are asserted once.
  it('@trace FR-65 The size buttons declare a color and a background-color token, unchecked and checked, with 4.5:1 between them (light and dark)', () => {
    const parsed = readStyles();
    const unchecked = declarationsFor(parsed, '.size-control button');
    const checkedOwn = declarationsFor(parsed, ".size-control button[aria-checked='true']");
    expect(rulesWithSelector(parsed, '.size-control button').length, 'a rule for the size buttons').toBeGreaterThan(0);
    expect(rulesWithSelector(parsed, ".size-control button[aria-checked='true']").length, 'a rule for the checked size button').toBeGreaterThan(0);
    const checked = new Map([...unchecked, ...checkedOwn]); // the declarations of the checked state: its own laid over the unchecked ones
    for (const set of themeTokenSets(parsed)) {
      for (const [state, declarations] of [['unchecked', unchecked], ['checked', checked]] as const) {
        const fg = tokenOf(parsed, declarations.get('color'));
        const bg = tokenOf(parsed, declarations.get('background-color'));
        expect.assert(fg !== undefined, `${state}: color is a single var(--color-...) of a declared token (is ${declarations.get('color') ?? 'missing'})`);
        expect.assert(bg !== undefined, `${state}: background-color is a single var(--color-...) of a declared token (is ${declarations.get('background-color') ?? 'missing'})`);
        expect(contrastRatio(tokenIn(set, fg), tokenIn(set, bg)), `${set.label} set, ${state}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('@trace FR-65 The board sets touch-action: manipulation and [data-board] has the class board', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.board', 'touch-action', 'manipulation');
    const root = mountFixture(BLANK);
    expect(q(root, '[data-board]').classList.contains('board')).toBe(true);
  });
});

describe('the hint and win regions stay rendered while empty (FR-63)', () => {
  /** The selector of a rule as a subject without its pseudo-classes and pseudo-elements, with single-quoted attribute values. */
  const baseOf = (selector: string): string => subjectOf(selector).replace(/::?[\w-]+(\([^()]*\))?/g, '').replaceAll('"', "'");
  const regionSubjects = new Set(['.message', '.message-win', "[data-message='hint']", "[data-message='win']"]);

  it('@trace FR-63 Empty hint and win regions stay rendered: they compute no display none and no hidden visibility, and no rule of theirs declares either', () => {
    injectPageStyles();
    const root = mountFixture(BLANK);
    for (const name of ['hint', 'win']) {
      const region = q(root, `[data-message="${name}"]`);
      expect(region.textContent, `premise: the ${name} region is empty`).toBe('');
      const style = getComputedStyle(region);
      expect(style.display, `the empty ${name} region computes a display`).not.toBe('none');
      expect(['hidden', 'collapse'], `the empty ${name} region is not hidden`).not.toContain(style.visibility);
    }
    const parsed = readStyles();
    const own = parsed.rules.filter((r) => r.selectors.some((s) => regionSubjects.has(baseOf(s))));
    expect(own.length, 'the walk found the rules of the message regions').toBeGreaterThan(0);
    const hiding = own.flatMap((r) =>
      r.declarations
        .filter((d) => (d.property === 'display' && d.value === 'none') || (d.property === 'visibility' && ['hidden', 'collapse'].includes(d.value)))
        .map((d) => `${r.selectors.join(', ')} { ${d.property}: ${d.value} }`),
    );
    expect(hiding).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// (b) The cascade, computed by jsdom on the injected stylesheet (var(--color-x) replaced by the :root value)
// ---------------------------------------------------------------------------------------------------------

describe('the cascade gives each cell state its border and the colours whose contrast is checked', () => {
  const sizes: [number, typeof PAIR_ROW_PLUS][] = [
    [4, PAIR_PLUS_4],
    [6, PAIR_ROW_PLUS],
    [8, PAIR_PLUS_8],
  ];

  /** The four kinds at size n: ordinary 1,1; a plain given at n,n; a violating player cell 3,3; a given in the violation 3,1. */
  function fourKinds(puzzle: typeof PAIR_ROW_PLUS): Record<'ordinary' | 'given' | 'violating' | 'givenViolating', HTMLElement> {
    const n = puzzle.size;
    const root = mountThenSelect(puzzle);
    clickCell(root, 3, 3); // 0 next to the givens 0 0 at 3,1 and 3,2
    const kinds = {
      ordinary: cellEl(root, 1, 1),
      given: cellEl(root, n, n),
      violating: cellEl(root, 3, 3),
      givenViolating: cellEl(root, 3, 1),
    };
    const has = (el: HTMLElement, cls: string): boolean => el.classList.contains(cls);
    expect([has(kinds.ordinary, 'cell-given'), has(kinds.ordinary, 'cell-violation')], 'ordinary cell').toEqual([false, false]);
    expect([has(kinds.given, 'cell-given'), has(kinds.given, 'cell-violation')], 'plain given').toEqual([true, false]);
    expect([has(kinds.violating, 'cell-given'), has(kinds.violating, 'cell-violation')], 'violating cell').toEqual([false, true]);
    expect([has(kinds.givenViolating, 'cell-given'), has(kinds.givenViolating, 'cell-violation')], 'given in violation').toEqual([true, true]);
    return kinds;
  }

  for (const [n, puzzle] of sizes) {
    it(`@trace FR-64 The computed border is heavier for a violation at ${n}x${n}: 1px, 2px, 3px and 3px`, () => {
      injectPageStyles();
      const kinds = fourKinds(puzzle);
      const widths = [kinds.ordinary, kinds.given, kinds.violating, kinds.givenViolating].map((el) => getComputedStyle(el).borderTopWidth);
      expect(widths).toEqual(['1px', '2px', '3px', '3px']);
    });
  }

  // add-theme-switch DELIBERATE CHANGE (FR-65, A-51; delta «The cascade gives each cell state the colours whose contrast is checked»): the test
  // injects the stylesheet once with the light values and once with the dark values substituted (`injectPageStyles(set.tokens)`).
  for (const [n, puzzle] of sizes) {
    it(`@trace FR-65 The cascade gives each cell kind the token colours at ${n}x${n}, and the page the page colour (light and dark values)`, () => {
      const parsed = readStyles();
      for (const set of themeTokenSets(parsed)) {
        const style = injectPageStyles(set.tokens);
        const kinds = fourKinds(puzzle);
        const expected: [HTMLElement, string, string, string, string][] = [
          [kinds.ordinary, '--color-cell-border', '--color-cell-bg', '--color-text', 'ordinary cell'],
          [kinds.given, '--color-given-border', '--color-given-bg', '--color-text', 'given cell'],
          [kinds.violating, '--color-violation-border', '--color-violation-bg', '--color-violation-text', 'violating cell'],
          [kinds.givenViolating, '--color-violation-border', '--color-violation-bg', '--color-violation-text', 'given in violation'],
        ];
        for (const [el, border, fill, text, what] of expected) {
          const computed = getComputedStyle(el);
          expect(computed.borderTopColor, `${set.label}: ${what} border`).toBe(rgbOf(tokenIn(set, border)));
          expect(computed.backgroundColor, `${set.label}: ${what} fill`).toBe(rgbOf(tokenIn(set, fill)));
          expect(computed.color, `${set.label}: ${what} text`).toBe(rgbOf(tokenIn(set, text)));
        }
        expect(getComputedStyle(document.body).backgroundColor, `${set.label}: the page colour`).toBe(rgbOf(tokenIn(set, '--color-page')));
        style.remove();
        document.body.replaceChildren();
      }
    });
  }
});

describe('the contrast helper is not vacuous', () => {
  it('@trace FR-65 contrastRatio gives 21:1 for black on white, 1:1 for equal colours and 1.41:1 (below 3:1) for the old given fill on the page', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#6b7280', '#6b7280')).toBeCloseTo(1, 5);
    const oldGivenFill = contrastRatio('#d1d5db', '#f9fafb');
    expect(oldGivenFill).toBeCloseTo(1.41, 2);
    expect(oldGivenFill).toBeLessThan(3);
  });
});
