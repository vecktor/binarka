// Play page: the header logo (FR-72, requirement «Logo» of openspec/changes/add-logo/specs/play-page/spec.md).
// The shapes are checked in jsdom, which has no layout: sizes, colours and legibility at 40 px are not tested (held NFR-15, NFR-14).
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  TITLE_TEXT,
  WIN_MESSAGE,
  WIN_PUZZLE,
  boardSize,
  collectEverything,
  fillFrom,
  fixedGenerate,
  generateSpy,
  generatorBySize,
  installPageLifecycle,
  mountFixture,
  mountPage,
  pressNew,
  seedQueue,
  selectSize,
  solutionGrid,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

/** The header of the mounted page, asserted present. */
function headerOf(root: HTMLElement): HTMLElement {
  const header = root.querySelector('header');
  expect.assert(header !== null, 'the page has a header');
  return header;
}

/** The only svg of the header, asserted to be exactly one. */
function logoOf(root: HTMLElement): SVGSVGElement {
  const svgs = headerOf(root).querySelectorAll('svg');
  expect(svgs.length, 'the header holds exactly one svg').toBe(1);
  const svg = svgs[0];
  expect.assert(svg !== undefined, 'the header holds an svg');
  return svg;
}

/** Every text node under `node`, in document order. */
function textNodesUnder(node: Node): Text[] {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** A numeric attribute read with getAttribute, asserted present and finite. */
function num(el: Element, name: string): number {
  const raw = el.getAttribute(name);
  expect(raw, `<${el.localName}> has the attribute ${name}`).not.toBeNull();
  const value = Number(raw);
  expect(Number.isFinite(value), `<${el.localName} ${name}="${raw ?? ''}"> is a number`).toBe(true);
  return value;
}

const LOGO_CLASSES = ['logo-cell', 'logo-digit', 'logo-digit-ring'];
const hasLogoClass = (el: Element): boolean => LOGO_CLASSES.some((c) => el.classList.contains(c));

describe('@trace FR-72 the header shows one decorative inline SVG logo', () => {
  it('One decorative inline logo in the header', () => {
    const root = mountFixture(WIN_PUZZLE);
    const header = headerOf(root);
    expect(header.querySelectorAll('svg').length).toBe(1);
    expect(root.querySelectorAll('svg').length).toBe(1);
    const svg = logoOf(root);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const headings = header.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    expect(headings.length, 'the header holds one heading').toBe(1);
    expect(headings[0]?.textContent).toBe(TITLE_TEXT);
  });

  it('The logo holds no text', () => {
    const root = mountFixture(WIN_PUZZLE);
    const svg = logoOf(root);
    expect(svg.querySelectorAll('text, title, desc, foreignObject').length).toBe(0);
    expect(textNodesUnder(svg).map((t) => t.data)).toEqual([]);
    expect(svg.textContent).toBe('');
  });

  it('The mini board shows 1 0 / 0 1', () => {
    const root = mountFixture(WIN_PUZZLE);
    const svg = logoOf(root);

    const cellEls = Array.from(svg.querySelectorAll('.logo-cell'));
    expect(cellEls.length, 'four .logo-cell shapes').toBe(4);
    for (const cell of cellEls) expect(cell.localName, 'a cell is a rect').toBe('rect');
    const cells = cellEls.map((el) => ({ el, x: num(el, 'x'), y: num(el, 'y'), w: num(el, 'width'), h: num(el, 'height') }));
    expect(new Set(cells.map((c) => c.x)).size, 'two distinct x values').toBe(2);
    expect(new Set(cells.map((c) => c.y)).size, 'two distinct y values').toBe(2);
    expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size, 'each (x, y) combination once').toBe(4);

    const digitEls = Array.from(svg.querySelectorAll('.logo-digit, .logo-digit-ring'));
    expect(digitEls.length, 'four digit shapes').toBe(4);
    // a digit shape inside a cell: rect.logo-digit by its x and y, ellipse.logo-digit-ring by its cx and cy
    const inside = (digit: Element, cell: (typeof cells)[number]): boolean => {
      const px = digit.localName === 'ellipse' ? num(digit, 'cx') : num(digit, 'x');
      const py = digit.localName === 'ellipse' ? num(digit, 'cy') : num(digit, 'y');
      return px >= cell.x && px <= cell.x + cell.w && py >= cell.y && py <= cell.y + cell.h;
    };
    const digitOf = (digit: Element): string => {
      if (digit.localName === 'rect' && digit.classList.contains('logo-digit')) return '1';
      if (digit.localName === 'ellipse' && digit.classList.contains('logo-digit-ring')) return '0';
      return `? <${digit.localName} class="${digit.getAttribute('class') ?? ''}">`;
    };

    const reading = [...cells].sort((a, b) => a.y - b.y || a.x - b.x);
    const shown = reading.map((cell) => {
      const held = digitEls.filter((d) => inside(d, cell));
      expect(held.length, `exactly one digit shape lies in the cell at (${cell.x}, ${cell.y})`).toBe(1);
      const only = held[0];
      expect.assert(only !== undefined, 'a digit shape lies in the cell');
      return digitOf(only);
    });
    expect(shown).toEqual(['1', '0', '0', '1']);
  });

  it('Circle and 0/1 rays', () => {
    const root = mountFixture(WIN_PUZZLE);
    const svg = logoOf(root);
    expect(svg.querySelectorAll('circle').length).toBe(1);
    const rays = (tag: string): Element[] => Array.from(svg.querySelectorAll(tag)).filter((el) => !hasLogoClass(el));
    expect(rays('rect').length, 'at least one bar ray').toBeGreaterThanOrEqual(1);
    expect(rays('ellipse').length, 'at least one ring ray').toBeGreaterThanOrEqual(1);
  });

  it('No image file is used', () => {
    const root = mountFixture(WIN_PUZZLE);
    logoOf(root); // the logo is mounted, so the href checks below run on it
    expect(root.querySelectorAll('img, image, use, picture, object, embed, canvas').length).toBe(0);
    const everyElement = [root, ...Array.from(root.querySelectorAll('*'))];
    expect(everyElement.filter((el) => el.hasAttribute('src'))).toEqual([]);
    for (const svg of Array.from(root.querySelectorAll('svg'))) {
      for (const el of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
        expect(el.hasAttribute('href'), `<${el.localName}> has no href`).toBe(false);
        expect(el.hasAttribute('xlink:href'), `<${el.localName}> has no xlink:href`).toBe(false);
        expect(el.hasAttributeNS('http://www.w3.org/1999/xlink', 'href'), `<${el.localName}> has no xlink href`).toBe(false);
      }
    }
  });

  describe('The logo survives every board change', () => {
    /** After the action the header holds exactly one svg, the same element as at mount, with no text node. */
    const expectSameLogo = (root: HTMLElement, atMount: SVGSVGElement): void => {
      const now = logoOf(root);
      expect(now === atMount, 'the same svg element as at mount').toBe(true);
      expect(textNodesUnder(now).length, 'still no text node').toBe(0);
    };

    it('presses «Нова головоломка»', () => {
      const spy = generateSpy(() => BLANK);
      const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
      const atMount = logoOf(root);
      pressNew(root);
      expect(spy.calls.length, 'a new puzzle was generated').toBe(2);
      expectSameLogo(root, atMount);
    });

    it.each([4, 8] as const)('changes the size to %i', (size) => {
      const root = mountPage({
        seedSource: seedQueue([1, 2]).source,
        generate: generatorBySize({ 6: BLANK, 4: BLANK_4, 8: BLANK_8 }),
      });
      const atMount = logoOf(root);
      selectSize(root, size);
      expect(boardSize(root)).toBe(size);
      expectSameLogo(root, atMount);
    });

    it('reaches a win', () => {
      const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: fixedGenerate(WIN_PUZZLE) });
      const atMount = logoOf(root);
      fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
      expect(winMessage(root)).toBe(WIN_MESSAGE);
      expectSameLogo(root, atMount);
    });
  });

  it('The logo does not leak the seed', () => {
    const seed = 987654;
    const split = /9\D?8\D?7\D?6\D?5\D?4/;
    const root = mountPage({ seedSource: () => seed, generate: fixedGenerate(WIN_PUZZLE) });
    logoOf(root); // GIVEN: the logo is present
    for (const s of collectEverything(root)) {
      expect(s.includes('987654'), `"${s}" contains 987654`).toBe(false);
      expect(split.test(s), `"${s}" matches the split-seed pattern`).toBe(false);
    }
  });
});
