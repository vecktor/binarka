// Play page: the summary and level buttons set their own colours (FR-65, NFR-9, FR-95, FR-97). Scenarios of the delta spec
// openspec/changes/add-level-selector/specs/play-page/spec.md ("The summary and level buttons set their own colours"). Written
// FIRST (red): the stylesheet has no rule for these buttons.
//
// @trace FR-65
// @trace NFR-9
// @trace FR-95
// @trace FR-97
// @trace FR-91
// @trace FR-87
//
// The rules are read from src/ui/style.css as declarations (jsdom never matches :focus-visible and applies no nested rule to
// computed style, A-28, TC-13). The selectors are the spec-made ones of design.md ambiguity E, written with single-quoted attribute
// values as the existing size-control tests do. Layout and the look are NOT claimed (held NFR-10, NFR-12, NFR-14).
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  installPageLifecycle,
  levelButtons,
  mountFixture,
  q,
  sheetCloseButton,
  summaryButton,
} from './helpers/play-page';
import {
  TOKEN_NAMES,
  contrastRatio,
  declarationsFor,
  readStyleText,
  readStyles,
  rulesWithSelector,
  scanColours,
} from './helpers/css';
import type { ParsedStyles } from './helpers/css';

installPageLifecycle();

const SUMMARY = '.setup-button';
const PLAIN = '.level-control button';
const CHECKED = ".level-control button[aria-checked='true']";
const UNAVAILABLE = ".level-control button[aria-disabled='true']";

/** The token name of a value that is a single `var(--color-x)` of a token declared in :root, else undefined. */
function tokenOf(parsed: ParsedStyles, value: string | undefined): string | undefined {
  const name = /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value ?? '')?.[1];
  return name !== undefined && name in parsed.tokens ? name : undefined;
}

/** The `#rrggbb` value of a token, asserted to exist. */
function hexOf(parsed: ParsedStyles, name: string): string {
  const value = parsed.tokens[name];
  expect.assert(value !== undefined && /^#[0-9a-f]{6}$/i.test(value), `${name} is declared in :root as #rrggbb`);
  return value;
}

describe('@trace FR-65 @trace NFR-9 the summary and level buttons declare their colours', () => {
  it('The summary and level buttons declare their colours', () => {
    const parsed = readStyles();
    for (const selector of [SUMMARY, PLAIN, CHECKED, UNAVAILABLE]) {
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      const declarations = declarationsFor(parsed, selector);
      for (const property of ['color', 'background-color']) {
        const value = declarations.get(property);
        expect(tokenOf(parsed, value), `${selector} { ${property} } is a single var(--color-...) of a declared token (is ${value ?? 'missing'})`).toBeDefined();
      }
      expect(declarations.has('opacity'), `${selector} does not declare opacity`).toBe(false);
    }
  });

  it('Each state has 4.5:1 text', () => {
    const parsed = readStyles();
    const plain = declarationsFor(parsed, PLAIN);
    const states: [string, Map<string, string>][] = [
      ['summary', declarationsFor(parsed, SUMMARY)],
      ['plain', plain],
      ['checked', new Map([...plain, ...declarationsFor(parsed, CHECKED)])],
      ['unavailable', new Map([...plain, ...declarationsFor(parsed, UNAVAILABLE)])],
    ];
    for (const [state, declarations] of states) {
      const fg = tokenOf(parsed, declarations.get('color'));
      const bg = tokenOf(parsed, declarations.get('background-color'));
      expect.assert(fg !== undefined, `${state}: color is a single var(--color-...) of a declared token (is ${declarations.get('color') ?? 'missing'})`);
      expect.assert(bg !== undefined, `${state}: background-color is a single var(--color-...) of a declared token (is ${declarations.get('background-color') ?? 'missing'})`);
      expect(contrastRatio(hexOf(parsed, fg), hexOf(parsed, bg)), `${state}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('The unavailable level has a cue besides colour', () => {
    const parsed = readStyles();
    const plain = declarationsFor(parsed, PLAIN);
    const unavailable = declarationsFor(parsed, UNAVAILABLE);
    expect(rulesWithSelector(parsed, UNAVAILABLE).length, `a rule for ${UNAVAILABLE}`).toBeGreaterThan(0);
    const borderStyle = unavailable.get('border-style');
    const plainBorderStyle = plain.get('border-style') ?? 'solid';
    const textDecoration = unavailable.get('text-decoration') ?? unavailable.get('text-decoration-line');
    const byBorder = borderStyle !== undefined && borderStyle !== plainBorderStyle;
    const byDecoration = textDecoration !== undefined && textDecoration.trim().toLowerCase() !== 'none';
    expect(
      byBorder || byDecoration,
      `the unavailable rule declares a border-style other than the plain one (${plainBorderStyle}) or a text-decoration other than none (border-style ${borderStyle ?? 'missing'}, text-decoration ${textDecoration ?? 'missing'})`,
    ).toBe(true);
  });
});

describe('@trace FR-65 @trace FR-95 @trace FR-97 the classes are on the elements and the buttons are buttons', () => {
  it('The classes are on the elements and the buttons are buttons', () => {
    const root = mountFixture(BLANK);
    const summary = summaryButton(root);
    expect(summary.classList.contains('setup-button'), 'the summary has the class setup-button').toBe(true);
    expect(summary.children[1]?.classList.contains('setup-summary'), 'its text span carries setup-summary').toBe(true);
    expect(summary.children[2]?.classList.contains('setup-cue'), 'its cue span carries setup-cue').toBe(true);
    expect(q(root, '[data-control="level"]').classList.contains('level-control'), 'the control has the class level-control').toBe(true);
    const six = [summary, ...levelButtons(root), sheetCloseButton(root)];
    expect(six, 'the summary, four level buttons and the close button').toHaveLength(6);
    for (const button of six) expect(button.tagName, 'a button element, so button:focus-visible applies').toBe('BUTTON');
  });

  it('The existing stylesheet scans still pass', () => {
    const text = readStyleText();
    const parsed = readStyles();
    // «Rules use the tokens and no colour literal is left»
    expect(TOKEN_NAMES, 'the 13 tokens').toHaveLength(13);
    for (const name of TOKEN_NAMES) {
      expect(parsed.tokenDeclarations.filter((d) => d.property === name), `${name} is declared once in :root`).toHaveLength(1);
    }
    expect(scanColours(parsed).literals).toEqual([]);
    expect(scanColours(parsed).named).toEqual([]);
    expect(scanColours(parsed).shorthands).toEqual([]);
    expect(scanColours(parsed).colourProperties).toEqual([]);
    expect(scanColours(parsed).tokensOutsideRoot).toEqual([]);
    expect(Object.keys(parsed.tokens).filter((name) => name.startsWith('--color-')), 'no 14th colour token').toHaveLength(13);
    // «Nothing removes the outline»
    expect(text).not.toMatch(/outline\s*:\s*(none|0(px)?(?![\d.]))/i);
    expect(text).not.toMatch(/outline-style\s*:\s*none/i);
    expect(text).not.toMatch(/outline-width\s*:\s*0(px)?(?![\d.])/i);
    // «The stylesheet stays inside the build target, with one :has( exception»
    expect(text).not.toMatch(/!\s*important/i);
    expect(text.match(/:has\(/gi) ?? [], 'exactly one :has(').toHaveLength(1);
    expect(text).not.toMatch(/display\s*:\s*contents/i);
  });
});
