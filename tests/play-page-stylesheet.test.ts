// Play page: the stylesheet requirements, read from src/ui/style.css (FR-62, FR-63; FR-59 and FR-60 for the rules that
// would hide rows and the label). Part (a) walks the parsed CSSOM; part (b) lets jsdom compute the cascade of the
// injected text. jsdom never matches :focus-visible and applies no @media or nested rule to computed style, so those are
// judged at declaration level only (A-26, TC-13). Scenarios of
// openspec/changes/add-page-accessibility/specs/play-page/spec.md; the helper is tests/helpers/css.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  PAIR_PLUS_4,
  PAIR_PLUS_8,
  PAIR_ROW_PLUS,
  cellEl,
  clickCell,
  installPageLifecycle,
  mountFixture,
  mountThenSelect,
  q,
} from './helpers/play-page';
import {
  TOKEN_NAMES,
  contrastProblems,
  contrastRatio,
  declarationsFor,
  hidingDeclarations,
  injectPageStyles,
  px,
  readStyleText,
  readStyles,
  rgbOf,
  rulesWithSelector,
  scanColours,
} from './helpers/css';
import type { ParsedStyles } from './helpers/css';

installPageLifecycle();

/** Assert the merged declaration `property` of the rules for `selector` (`var(--color-x)` written as the stylesheet has it). */
function expectDecl(parsed: ParsedStyles, selector: string, property: string, expected: string): void {
  expect(declarationsFor(parsed, selector).get(property)?.toLowerCase(), `${selector} { ${property}: ${expected} }`).toBe(expected);
}

/** The `#rrggbb` value of a token, asserted to exist (a missing token fails on an assertion that names it). */
function token(parsed: ParsedStyles, name: string): string {
  const value = parsed.tokens[name];
  expect.assert(value !== undefined && /^#[0-9a-f]{6}$/i.test(value), `${name} is declared in :root as #rrggbb`);
  return value;
}

// ---------------------------------------------------------------------------------------------------------
// (a) CSSOM walk
// ---------------------------------------------------------------------------------------------------------

describe('the colours are tokens (FR-63)', () => {
  it('@trace FR-63 Tokens exist and are literal: 13 names, each declared once in the top-level :root as #rrggbb', () => {
    const parsed = readStyles();
    expect(TOKEN_NAMES).toHaveLength(13);
    for (const name of TOKEN_NAMES) {
      const declarations = parsed.tokenDeclarations.filter((d) => d.property === name);
      expect(declarations, `${name} is declared once in the top-level :root`).toHaveLength(1);
      expect(declarations[0]?.value, `${name} is #rrggbb`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('@trace FR-63 No colour literal is left: no hex, rgb(), hsl() ... outside :root, wherever the rule is in the file', () => {
    const parsed = readStyles();
    expect(parsed.rules.length, 'the walk found the rules').toBeGreaterThan(5);
    expect(scanColours(parsed).literals).toEqual([]);
  });

  it('@trace FR-63 No CSS named colour is left outside :root', () => {
    expect(scanColours(readStyles()).named).toEqual([]);
  });

  it('@trace FR-63 Every colour-bearing shorthand has a var(--color-...) colour (or is none or 0)', () => {
    expect(scanColours(readStyles()).shorthands).toEqual([]);
  });

  it('@trace FR-63 Every color, background-color, border-color and outline-color is one declared token or an allowed keyword', () => {
    expect(scanColours(readStyles()).colourProperties).toEqual([]);
  });

  it('@trace FR-63 No --color-* property is declared outside :root', () => {
    expect(scanColours(readStyles()).tokensOutsideRoot).toEqual([]);
  });

  it('@trace FR-63 The named rules take their colours from the named tokens, written with the longhands', () => {
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
    for (const selector of ['.cell:focus-visible', 'button:focus-visible', 'select:focus-visible']) {
      expectDecl(parsed, selector, 'outline-color', 'var(--color-focus)');
    }
  });

  it('@trace FR-63 The button and select rule takes text, fill and border from the control tokens', () => {
    const parsed = readStyles();
    for (const selector of ['button', 'select']) {
      expectDecl(parsed, selector, 'color', 'var(--color-text)');
      expectDecl(parsed, selector, 'background-color', 'var(--color-control-bg)');
      expectDecl(parsed, selector, 'border-color', 'var(--color-control-border)');
    }
  });
});

describe('contrast (FR-63, NFR-9)', () => {
  it('@trace FR-63 Cell borders have 3:1 against the page, the cell and the given fill', () => {
    const parsed = readStyles();
    token(parsed, '--color-cell-border');
    expect(contrastProblems(parsed.tokens, ['cell-border'])).toEqual([]);
  });

  it('@trace FR-63 @trace FR-62 The given cue has 3:1 and is not the fill: 2px border in its own colour, bold digits', () => {
    const parsed = readStyles();
    token(parsed, '--color-given-border');
    expect(contrastProblems(parsed.tokens, ['given-cue'])).toEqual([]);
    expectDecl(parsed, '.cell-given', 'border-width', '2px');
    expectDecl(parsed, '.cell-given', 'border-color', 'var(--color-given-border)');
    expectDecl(parsed, '.cell-given', 'font-weight', '700');
    // the cue tells a given from an ordinary cell without the fill: another colour and a wider border
    expect(parsed.tokens['--color-given-border']?.toLowerCase()).not.toBe(parsed.tokens['--color-cell-border']?.toLowerCase());
    expect(px(declarationsFor(parsed, '.cell-given').get('border-width'))).toBeGreaterThan(
      px(declarationsFor(parsed, '.cell').get('border-width')),
    );
  });

  it('@trace FR-63 @trace FR-62 The violation cue has 3:1 against the page, the cell and the violation fill', () => {
    const parsed = readStyles();
    token(parsed, '--color-violation-border');
    expect(contrastProblems(parsed.tokens, ['violation-cue'])).toEqual([]);
  });

  it('@trace FR-63 The focus ring has 3:1 against the page and every cell background', () => {
    const parsed = readStyles();
    token(parsed, '--color-focus');
    expect(contrastProblems(parsed.tokens, ['focus-ring'])).toEqual([]);
  });

  it('@trace FR-63 @trace NFR-9 The control border has 3:1 and the text pairs have 4.5:1', () => {
    const parsed = readStyles();
    token(parsed, '--color-control-border');
    token(parsed, '--color-text');
    expect(contrastProblems(parsed.tokens, ['control-border', 'text'])).toEqual([]);
  });

  it('@trace FR-63 @trace NFR-9 Every pair holds for the top-level token set and for every set a conditional :root block makes', () => {
    const parsed = readStyles();
    expect(parsed.tokenSets.length).toBeGreaterThanOrEqual(1);
    expect(parsed.tokenSets[0]?.label).toBe('top-level');
    for (const set of parsed.tokenSets) {
      expect(contrastProblems(set.tokens), `token set "${set.label}"`).toEqual([]);
    }
  });
});

describe('visible, unobscured focus indicators (FR-63)', () => {
  const targets = ['.cell:focus-visible', 'button:focus-visible', 'select:focus-visible'];

  it('@trace FR-63 Focus-visible rules exist for the cell, the button and the select: solid, at least 2px, the focus token', () => {
    const parsed = readStyles();
    for (const selector of targets) {
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      expectDecl(parsed, selector, 'outline-style', 'solid');
      expect(px(declarationsFor(parsed, selector).get('outline-width')), `${selector} outline-width`).toBeGreaterThanOrEqual(2);
      expectDecl(parsed, selector, 'outline-color', 'var(--color-focus)');
    }
  });

  it('@trace FR-63 The cell ring is outside the border and above the neighbours: offset 2px, position relative, z-index at least 1', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.cell:focus-visible', 'outline-offset', '2px');
    expectDecl(parsed, '.cell:focus-visible', 'position', 'relative');
    const zIndex = Number(declarationsFor(parsed, '.cell:focus-visible').get('z-index'));
    expect(Number.isInteger(zIndex) && zIndex >= 1, `z-index ${zIndex} is an integer of at least 1`).toBe(true);
  });

  it('@trace FR-63 The button and select rings have a positive outline-offset', () => {
    const parsed = readStyles();
    for (const selector of ['button:focus-visible', 'select:focus-visible']) {
      expect(px(declarationsFor(parsed, selector).get('outline-offset')), `${selector} outline-offset`).toBeGreaterThan(0);
    }
  });

  it('@trace FR-63 Nothing removes the outline (text search and declarations)', () => {
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

  it('@trace FR-63 The stylesheet stays inside the build target: no :has( and no !important', () => {
    const text = readStyleText();
    expect(text).not.toMatch(/:has\(/i);
    expect(text).not.toMatch(/!\s*important/i);
    const parsed = readStyles();
    expect(parsed.rules.flatMap((r) => r.declarations.filter((d) => d.important))).toEqual([]);
    expect(parsed.rules.flatMap((r) => r.selectors.filter((s) => s.includes(':has(')))).toEqual([]);
  });
});

describe('rows are kept in the accessibility tree and the label is not hidden', () => {
  it('@trace FR-59 No rule uses display: contents (it has a history of dropping row semantics)', () => {
    expect(readStyleText()).not.toMatch(/display\s*:\s*contents/i);
    const parsed = readStyles();
    expect(parsed.rules.flatMap((r) => r.declarations.filter((d) => d.property === 'display' && d.value === 'contents'))).toEqual([]);
  });

  it('@trace FR-60 The size-label rules have no hiding declaration and .size-label has a gap of at least 4px', () => {
    const parsed = readStyles();
    expect(rulesWithSelector(parsed, '.size-label').length, 'a .size-label rule exists').toBeGreaterThan(0);
    expect(hidingDeclarations(parsed)).toEqual([]);
    expect(px(declarationsFor(parsed, '.size-label').get('gap')), '.size-label gap').toBeGreaterThanOrEqual(4);
  });

  it('@trace FR-60 The label and its text compute a display other than none and a visibility that is shown (injected stylesheet)', () => {
    injectPageStyles();
    const root = mountFixture(BLANK);
    const label = q(root, 'label.size-label');
    for (const el of [label, q(label, '.size-label-text')]) {
      const style = getComputedStyle(el);
      expect(style.display).not.toBe('none');
      expect(['hidden', 'collapse']).not.toContain(style.visibility);
    }
  });
});

describe('the selector sets its own colours and the board disables double-tap zoom (FR-63)', () => {
  it('@trace FR-63 The select declares color var(--color-text) and background-color var(--color-control-bg)', () => {
    const parsed = readStyles();
    expect(rulesWithSelector(parsed, 'select').length).toBeGreaterThan(0);
    expectDecl(parsed, 'select', 'color', 'var(--color-text)');
    expectDecl(parsed, 'select', 'background-color', 'var(--color-control-bg)');
  });

  it('@trace FR-63 The board sets touch-action: manipulation and [data-board] has the class board', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.board', 'touch-action', 'manipulation');
    const root = mountFixture(BLANK);
    expect(q(root, '[data-board]').classList.contains('board')).toBe(true);
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
    it(`@trace FR-62 The computed border is heavier for a violation at ${n}x${n}: 1px, 2px, 3px and 3px`, () => {
      injectPageStyles();
      const kinds = fourKinds(puzzle);
      const widths = [kinds.ordinary, kinds.given, kinds.violating, kinds.givenViolating].map((el) => getComputedStyle(el).borderTopWidth);
      expect(widths).toEqual(['1px', '2px', '3px', '3px']);
    });
  }

  for (const [n, puzzle] of sizes) {
    it(`@trace FR-63 The cascade gives each cell kind the token colours at ${n}x${n}, and the page the page colour`, () => {
      injectPageStyles();
      const parsed = readStyles();
      const kinds = fourKinds(puzzle);
      const expected: [HTMLElement, string, string, string, string][] = [
        [kinds.ordinary, '--color-cell-border', '--color-cell-bg', '--color-text', 'ordinary cell'],
        [kinds.given, '--color-given-border', '--color-given-bg', '--color-text', 'given cell'],
        [kinds.violating, '--color-violation-border', '--color-violation-bg', '--color-violation-text', 'violating cell'],
        [kinds.givenViolating, '--color-violation-border', '--color-violation-bg', '--color-violation-text', 'given in violation'],
      ];
      for (const [el, border, fill, text, what] of expected) {
        const style = getComputedStyle(el);
        expect(style.borderTopColor, `${what} border`).toBe(rgbOf(token(parsed, border)));
        expect(style.backgroundColor, `${what} fill`).toBe(rgbOf(token(parsed, fill)));
        expect(style.color, `${what} text`).toBe(rgbOf(token(parsed, text)));
      }
      expect(getComputedStyle(document.body).backgroundColor).toBe(rgbOf(token(parsed, '--color-page')));
    });
  }
});

describe('the contrast helper is not vacuous', () => {
  it('@trace FR-63 contrastRatio gives 21:1 for black on white, 1:1 for equal colours and 1.41:1 (below 3:1) for the old given fill on the page', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#6b7280', '#6b7280')).toBeCloseTo(1, 5);
    const oldGivenFill = contrastRatio('#d1d5db', '#f9fafb');
    expect(oldGivenFill).toBeCloseTo(1.41, 2);
    expect(oldGivenFill).toBeLessThan(3);
  });
});
