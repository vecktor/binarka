// Stylesheet reader for the accessibility tests (FR-64, FR-65; design.md decision 10).
//
// `parseStyles(text)` injects the text into a <style> element of the jsdom document and walks the parsed CSSOM
// (jsdom 29 uses css-tree), recursing into nested style rules (`&` resolved), @media, @supports, @layer,
// @container, @scope and keyframes. It throws only on rule types it cannot judge (@import, @font-face, anything
// unknown). It resolves ONLY the `--color-*` custom properties: the stylesheet also declares `--n` and
// `--cell-max`, which are layout numbers and must never be resolved or judged as colours.
//
// Known limit (reported, not hidden): css-tree silently drops what it cannot parse, so a rule that jsdom never
// materialises (a syntax error, `@property`) is invisible here, and "throw on an unknown rule type" can only fire for
// rule types jsdom does build. jsdom prints "Could not parse CSS stylesheet" to stderr for some nested rules (it still
// builds them); that message cannot be captured from a test. jsdom also normalises a colour literal in an ordinary rule to `rgb(r, g, b)`
// (`#fff` becomes `rgb(255, 255, 255)`), so the literal scan is told by the `rgb(` form, not by a leading `#`;
// custom property values (the `:root` tokens) are kept verbatim.
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';

export interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

export interface StyleRuleInfo {
  /** the resolved selector list (nested rules have `&` replaced by their parents) */
  selectors: string[];
  /** the at-rule chain around the rule, outermost first, for example `@media (min-width: 1px)` */
  context: string[];
  declarations: Declaration[];
}

export interface TokenSet {
  label: string;
  tokens: Record<string, string>;
}

export interface ParsedStyles {
  text: string;
  rules: StyleRuleInfo[];
  /**
   * every `--color-*` declaration of a `:root` rule outside any at-rule, in source order. A duplicate shows twice only
   * across two rules: inside one rule the CSSOM keeps the last declaration of a property.
   */
  tokenDeclarations: Declaration[];
  /** the top-level token set (the last declaration of a name wins) */
  tokens: Record<string, string>;
  /**
   * add-theme-switch (FR-65, A-51, TD finding 8): every `--color-*` declaration of the top-level `:root[data-theme="dark"]`
   * rule, in source order (empty when the file has no such rule).
   */
  darkTokenDeclarations: Declaration[];
  /**
   * the top-level set; then, when the file has a top-level `:root[data-theme="dark"]` rule, the dark set (the top-level set with
   * that rule's overrides applied); then the top-level set with each conditional `:root` rule's overrides applied
   */
  tokenSets: TokenSet[];
}

/** The label of the dark token set in `ParsedStyles.tokenSets`. */
export const DARK_LABEL = 'data-theme=dark';

/** Vitest runs from the project root (the engine-purity test reads src/engine the same way). */
export const STYLE_PATH = `${process.cwd()}/src/ui/style.css`;

export function readStyleText(): string {
  return readFileSync(STYLE_PATH, 'utf8');
}

/** `parseStyles` of src/ui/style.css. */
export function readStyles(): ParsedStyles {
  return parseStyles(readStyleText());
}

// ---------------------------------------------------------------------------------------------------------
// CSSOM walk
// ---------------------------------------------------------------------------------------------------------

/** Split a selector list on its top-level commas (a comma inside `:is(a, b)` or `[x="a,b"]` stays). */
function splitSelectorList(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = '';
  let current = '';
  for (const ch of text) {
    if (quote !== '') {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(' || ch === '[') {
      depth += 1;
    } else if (ch === ')' || ch === ']') {
      depth -= 1;
    } else if (ch === ',' && depth === 0) {
      out.push(current.trim().replace(/\s+/g, ' '));
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current.trim().replace(/\s+/g, ' '));
  return out.filter((s) => s !== '');
}

/** Resolve a nested selector list against its parent's resolved list (`&` is replaced, else a descendant combinator). */
function resolveSelectors(parents: string[] | null, selectorText: string): string[] {
  const own = splitSelectorList(selectorText);
  if (parents === null) return own;
  return own.flatMap((child) =>
    parents.map((parent) => (child.includes('&') ? child.replaceAll('&', parent) : `${parent} ${child}`)),
  );
}

function declarationsOf(style: CSSStyleDeclaration): Declaration[] {
  return Array.from(style, (property) => ({
    property,
    value: style.getPropertyValue(property).replace(/\s+/g, ' ').trim(),
    important: style.getPropertyPriority(property) === 'important',
  }));
}

/** The at-rule prelude, for example `@media (min-width: 1px)`. */
function preludeOf(rule: CSSRule): string {
  return rule.cssText.split('{')[0]?.trim().replace(/\s+/g, ' ') ?? rule.cssText;
}

const GROUPING_RULES = new Set(['CSSMediaRule', 'CSSSupportsRule', 'CSSLayerBlockRule', 'CSSContainerRule', 'CSSScopeRule']);

function walk(list: CSSRuleList, context: string[], parents: string[] | null, out: StyleRuleInfo[]): void {
  for (const rule of Array.from(list)) {
    const kind = rule.constructor.name;
    if (kind === 'CSSStyleRule') {
      const styleRule = rule as CSSStyleRule;
      const selectors = resolveSelectors(parents, styleRule.selectorText);
      out.push({ selectors, context, declarations: declarationsOf(styleRule.style) });
      walk(styleRule.cssRules, context, selectors, out);
    } else if (kind === 'CSSNestedDeclarations') {
      // declarations that follow a nested rule belong to the enclosing style rule
      out.push({ selectors: parents ?? [], context, declarations: declarationsOf((rule as CSSNestedDeclarations).style) });
    } else if (GROUPING_RULES.has(kind)) {
      walk((rule as CSSGroupingRule).cssRules, [...context, preludeOf(rule)], parents, out);
    } else if (kind === 'CSSKeyframesRule') {
      const keyframes = rule as CSSKeyframesRule;
      for (const frame of Array.from(keyframes.cssRules)) {
        const keyframe = frame as CSSKeyframeRule;
        out.push({
          selectors: [`@keyframes ${keyframes.name} ${keyframe.keyText}`],
          context,
          declarations: declarationsOf(keyframe.style),
        });
      }
    } else if (kind === 'CSSLayerStatementRule') {
      // `@layer a, b;` only orders layers: no declarations
    } else if (kind === 'CSSImportRule' || kind === 'CSSFontFaceRule') {
      throw new Error(`parseStyles cannot judge ${kind} (${rule.cssText.slice(0, 60)}): not allowed in the stylesheet`);
    } else {
      throw new Error(`parseStyles cannot judge the rule type ${kind} (${rule.cssText.slice(0, 60)})`);
    }
  }
}

const isRootRule = (rule: StyleRuleInfo): boolean => rule.selectors.length > 0 && rule.selectors.every((s) => s === ':root');
/**
 * add-theme-switch (FR-65, A-51, TD finding 8): the dark palette rule `:root[data-theme="dark"]` (jsdom keeps the quote style
 * the file uses, so a double quote, a single quote and no quote are all accepted). Only a rule outside every at-rule counts as
 * the dark set; `isRootRule` stays the PLAIN predicate that `tokens` and `tokenDeclarations` use, so each token is still
 * declared once in the plain `:root`.
 */
const DARK_SELECTOR = /^:root\[data-theme=(["']?)dark\1\]$/;
const isDarkRootRule = (rule: StyleRuleInfo): boolean =>
  rule.context.length === 0 && rule.selectors.length > 0 && rule.selectors.every((s) => DARK_SELECTOR.test(s));
const isColourToken = (property: string): boolean => property.startsWith('--color-');

export function parseStyles(text: string): ParsedStyles {
  const style = document.createElement('style');
  style.textContent = text;
  const rules: StyleRuleInfo[] = [];
  try {
    document.head.appendChild(style);
    const sheet = style.sheet;
    if (sheet === null) throw new Error('jsdom built no stylesheet for the text');
    walk(sheet.cssRules, [], null, rules);
  } finally {
    style.remove();
  }

  const tokenDeclarations = rules
    .filter((r) => isRootRule(r) && r.context.length === 0)
    .flatMap((r) => r.declarations.filter((d) => isColourToken(d.property)));
  const tokens = Object.fromEntries(tokenDeclarations.map((d) => [d.property, d.value]));
  const darkTokenDeclarations = rules
    .filter((r) => isDarkRootRule(r))
    .flatMap((r) => r.declarations.filter((d) => isColourToken(d.property)));
  const tokenSets: TokenSet[] = [{ label: 'top-level', tokens }];
  if (darkTokenDeclarations.length > 0) {
    tokenSets.push({ label: DARK_LABEL, tokens: { ...tokens, ...Object.fromEntries(darkTokenDeclarations.map((d) => [d.property, d.value])) } });
  }
  for (const rule of rules) {
    if (!isRootRule(rule) || rule.context.length === 0) continue;
    const overrides = rule.declarations.filter((d) => isColourToken(d.property));
    if (overrides.length === 0) continue;
    tokenSets.push({
      label: `${rule.context.join(' ')} :root`,
      tokens: { ...tokens, ...Object.fromEntries(overrides.map((d) => [d.property, d.value])) },
    });
  }
  return { text, rules, tokenDeclarations, darkTokenDeclarations, tokens, tokenSets };
}

/**
 * add-theme-switch (FR-65, A-51): the two shipped token sets, light first then dark, for a per-set loop. The dark set is
 * ASSERTED: a stylesheet without a `:root[data-theme="dark"]` block fails here, on an assertion that names it, so a loop over
 * `themeTokenSets(parsed)` can never pass on the light set alone.
 */
export function themeTokenSets(parsed: ParsedStyles): TokenSet[] {
  const light = parsed.tokenSets.find((set) => set.label === 'top-level');
  const dark = parsed.tokenSets.find((set) => set.label === DARK_LABEL);
  expect.assert(light !== undefined, 'themeTokenSets: the top-level token set is missing');
  expect.assert(
    dark !== undefined,
    'the dark token set exists: src/ui/style.css has no top-level :root[data-theme="dark"] rule that redefines --color-* tokens',
  );
  return [
    { label: 'light', tokens: light.tokens },
    { label: 'dark', tokens: dark.tokens },
  ];
}

// ---------------------------------------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------------------------------------

/** The top-level `:root` rules (plain predicate: the light token rules, `color-scheme: light` lives here). */
export function lightRootRules(parsed: ParsedStyles): StyleRuleInfo[] {
  return parsed.rules.filter((r) => r.context.length === 0 && isRootRule(r));
}

/** The top-level `:root[data-theme="dark"]` rules (any quote style). */
export function darkRootRules(parsed: ParsedStyles): StyleRuleInfo[] {
  return parsed.rules.filter((r) => isDarkRootRule(r));
}

/** The rules (anywhere in the file) whose resolved selector list contains exactly `selector`. */
export function rulesWithSelector(parsed: ParsedStyles, selector: string): StyleRuleInfo[] {
  return parsed.rules.filter((r) => r.selectors.includes(selector));
}

/** property -> value, merged over every rule of `rulesWithSelector` in source order (a later declaration wins). */
export function declarationsFor(parsed: ParsedStyles, selector: string): Map<string, string> {
  const merged = new Map<string, string>();
  for (const rule of rulesWithSelector(parsed, selector)) {
    for (const d of rule.declarations) merged.set(d.property, d.value);
  }
  return merged;
}

/** A length such as `3px` or `0` as a number of px; NaN for anything else (em, var(), empty). */
export function px(value: string | undefined): number {
  if (value === undefined) return Number.NaN;
  const m = /^(-?\d*\.?\d+)(px)?$/.exec(value.trim());
  if (m?.[1] === undefined) return Number.NaN;
  if (m[2] === undefined && Number(m[1]) !== 0) return Number.NaN;
  return Number(m[1]);
}

// ---------------------------------------------------------------------------------------------------------
// Colour scan (FR-65)
// ---------------------------------------------------------------------------------------------------------

/** The literal pattern of the FR-65 requirement. */
export const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i;

/** The CSS Color 4 named colours. */
export const NAMED_COLOURS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
    'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod ' +
    'darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon ' +
    'darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray ' +
    'dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green ' +
    'greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon ' +
    'lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon ' +
    'lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen ' +
    'magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue ' +
    'mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy ' +
    'oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip ' +
    'peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown ' +
    'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal ' +
    'thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
);

const COLOUR_KEYWORDS = /^(transparent|currentcolor|inherit|initial|unset|revert)$/i;
const SHORTHANDS = new Set([
  'background',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'outline',
  'box-shadow',
  'text-decoration',
  'column-rule',
]);
const COLOUR_PROPERTIES = new Set(['color', 'background-color', 'border-color', 'outline-color']);

/** The identifiers of a declaration value, without strings, url() and the NAMES inside var(). */
function identifiersOf(value: string): string[] {
  const stripped = value
    .replace(/"[^"]*"|'[^']*'/g, ' ')
    .replace(/url\([^)]*\)/gi, ' ')
    .replace(/var\(\s*--[\w-]+/gi, 'var(');
  return (stripped.match(/-?[a-z][a-z0-9-]*/gi) ?? []).map((s) => s.toLowerCase());
}

export function namedColoursIn(value: string): string[] {
  return identifiersOf(value).filter((id) => NAMED_COLOURS.has(id));
}

export interface ColourScan {
  /** a hex, rgb(), hsl(), ... literal in a declaration outside `:root` */
  literals: string[];
  /** a CSS named colour in a declaration outside `:root` */
  named: string[];
  /** a colour-bearing shorthand without a `var(--color-...)` colour (and not none or 0) */
  shorthands: string[];
  /** a `--color-*` property declared outside a `:root` rule */
  tokensOutsideRoot: string[];
  /** a color, background-color, border-color or outline-color that is not one declared token or an allowed keyword */
  colourProperties: string[];
}

/**
 * The colour scan of FR-65 over every declaration outside `:root` rules, wherever it is in the file (top level, nested
 * rules, at-rules, keyframes). Messages read `selector { property: value }` for the failure output.
 */
export function scanColours(parsed: ParsedStyles): ColourScan {
  const scan: ColourScan = { literals: [], named: [], shorthands: [], tokensOutsideRoot: [], colourProperties: [] };
  for (const rule of parsed.rules) {
    if (isRootRule(rule) || isDarkRootRule(rule)) continue;
    const where = `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim();
    for (const { property, value } of rule.declarations) {
      const message = `${where} { ${property}: ${value} }`;
      if (isColourToken(property)) scan.tokensOutsideRoot.push(message);
      if (COLOUR_LITERAL.test(value)) scan.literals.push(message);
      if (namedColoursIn(value).length > 0) scan.named.push(message);
      if (SHORTHANDS.has(property) && !/^(none|0|0px|medium)$/i.test(value) && !value.includes('var(--color-')) {
        // jsdom serialises `border: none` as `medium`, hence the extra keyword
        scan.shorthands.push(message);
      }
      if (COLOUR_PROPERTIES.has(property)) {
        const single = /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value);
        const declared = single?.[1] !== undefined && single[1] in parsed.tokens;
        if (!declared && !COLOUR_KEYWORDS.test(value)) scan.colourProperties.push(message);
      }
    }
  }
  return scan;
}

// ---------------------------------------------------------------------------------------------------------
// Tokens and contrast (FR-65)
// ---------------------------------------------------------------------------------------------------------

export const TOKEN_NAMES = [
  '--color-page',
  '--color-text',
  '--color-cell-bg',
  '--color-cell-border',
  '--color-given-bg',
  '--color-given-border',
  '--color-violation-bg',
  '--color-violation-border',
  '--color-violation-text',
  '--color-focus',
  '--color-control-bg',
  '--color-control-border',
  '--color-win-text',
] as const;

/** WCAG 2 relative luminance of `#rrggbb`. */
function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (m?.[1] === undefined || m[2] === undefined || m[3] === undefined) throw new Error(`not a #rrggbb colour: "${hex}"`);
  const [r, g, b] = [m[1], m[2], m[3]].map((part) => {
    const c = Number.parseInt(part, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** The WCAG 2 contrast ratio of two `#rrggbb` colours (1 to 21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const [a, b] = [luminance(hexA), luminance(hexB)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** `#rrggbb` as the `rgb(r, g, b)` string jsdom returns from getComputedStyle. */
export function rgbOf(hex: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (m?.[1] === undefined || m[2] === undefined || m[3] === undefined) throw new Error(`not a #rrggbb colour: "${hex}"`);
  return `rgb(${Number.parseInt(m[1], 16)}, ${Number.parseInt(m[2], 16)}, ${Number.parseInt(m[3], 16)})`;
}

/**
 * The text with every `var(--color-x)` replaced by the value of that token in `tokens` (default: the top-level set of the
 * text itself; unknown tokens stay as they are). add-theme-switch: a caller passes the dark set to inline the dark values.
 */
export function withTokensInlined(text: string, tokens: Record<string, string> = parseStyles(text).tokens): string {
  return text.replace(/var\(\s*(--color-[\w-]+)\s*\)/g, (whole, name: string) => tokens[name] ?? whole);
}

export type PairGroup = 'cell-border' | 'given-cue' | 'violation-cue' | 'focus-ring' | 'control-border' | 'text';

export interface ContrastPair {
  group: PairGroup;
  fg: string;
  bg: string;
  min: number;
}

const pairs = (group: PairGroup, fg: string, bgs: string[], min: number): ContrastPair[] =>
  bgs.map((bg) => ({ group, fg: `--color-${fg}`, bg: `--color-${bg}`, min }));

/** Every pair of FR-65: 3 for borders, cues and rings, 4.5 for text. */
export const CONTRAST_PAIRS: ContrastPair[] = [
  ...pairs('cell-border', 'cell-border', ['page', 'cell-bg', 'given-bg'], 3),
  ...pairs('violation-cue', 'violation-border', ['page', 'cell-bg', 'violation-bg'], 3),
  ...pairs('given-cue', 'given-border', ['page', 'cell-bg', 'given-bg'], 3),
  ...pairs('focus-ring', 'focus', ['page', 'cell-bg', 'given-bg', 'violation-bg'], 3),
  ...pairs('control-border', 'control-border', ['page'], 3),
  ...pairs('text', 'text', ['page', 'cell-bg', 'given-bg', 'control-bg'], 4.5),
  ...pairs('text', 'violation-text', ['violation-bg'], 4.5),
  ...pairs('text', 'win-text', ['page'], 4.5),
];

/**
 * What is wrong with a token set for the pairs of `groups` (all groups by default): a missing or non-`#rrggbb` token,
 * or a ratio below the minimum. An empty list means every pair passes. A missing token is reported, never thrown, so
 * a test on the red page fails on an assertion that names the token.
 */
export function contrastProblems(tokens: Record<string, string>, groups?: PairGroup[]): string[] {
  const problems: string[] = [];
  for (const pair of CONTRAST_PAIRS) {
    if (groups !== undefined && !groups.includes(pair.group)) continue;
    const fg = tokens[pair.fg];
    const bg = tokens[pair.bg];
    const bad = [pair.fg, pair.bg].filter((name) => !/^#[0-9a-f]{6}$/i.test(tokens[name] ?? ''));
    if (fg === undefined || bg === undefined || bad.length > 0) {
      problems.push(`${pair.group}: ${bad.join(' and ')} is missing or not #rrggbb`);
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio < pair.min) {
      problems.push(`${pair.group}: ${pair.fg} ${fg} on ${pair.bg} ${bg} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1`);
    }
  }
  return [...new Set(problems)];
}

// ---------------------------------------------------------------------------------------------------------
// jsdom cascade
// ---------------------------------------------------------------------------------------------------------

/** Marks the <style> elements the tests inject, so the page lifecycle can remove them after each test. */
export const INJECTED_STYLE_ATTRIBUTE = 'data-test-styles';

/**
 * Inject CSS text into the document head (jsdom then computes the cascade of its top-level style rules for
 * getComputedStyle). Remove it with `removeInjectedStyles()`; `installPageLifecycle` does so after each test.
 */
export function injectStyles(text: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute(INJECTED_STYLE_ATTRIBUTE, '');
  style.textContent = text;
  document.head.appendChild(style);
  return style;
}

export function removeInjectedStyles(): void {
  for (const style of Array.from(document.head.querySelectorAll(`style[${INJECTED_STYLE_ATTRIBUTE}]`))) style.remove();
}

/**
 * Inject src/ui/style.css with every `var(--color-x)` replaced by its `:root` value (jsdom does not resolve var()). With
 * `tokens` (a resolved token set, see `themeTokenSets`) the values of that set are substituted instead.
 */
export function injectPageStyles(tokens?: Record<string, string>): HTMLStyleElement {
  return injectStyles(withTokensInlined(readStyleText(), tokens));
}
