// Play page: the header logo (FR-72, requirement «Logo» of openspec/changes/add-logo/specs/play-page/spec.md).
// The shapes are checked in jsdom, which has no layout: sizes, colours and legibility at 40 px are not tested here: NFR-15 is decided by vision-verify (clip 16-logo-40), the look by NFR-14.
// update-logo-legibility (2026-10-12): the delta of openspec/changes/update-logo-legibility adds the tile and the 40 px floors below.
//
// add-theme-switch DELIBERATE CHANGES (TC-14 and FR-72 as amended 2026-10-10, autonomy-log rows 120 and 121; delta requirement «Logo», MODIFIED):
// the header holds one more inline svg, the gear inside the settings button, so "the logo" is now the svg inside the HEADING (`logoOf`), the
// root holds exactly these two svg elements, and the scenario «The gear holds no text and no reference» is new. Every other test keeps its text.
//
// @trace FR-72
// @trace TC-14
// @trace FR-117
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

/** The logo: the only svg inside the heading of the header, asserted to be exactly one (the gear sits in the settings button, not in the heading). */
function logoOf(root: HTMLElement): SVGSVGElement {
  const heading = headerOf(root).querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
  expect.assert(heading !== null, 'the header holds a heading');
  const svgs = heading.querySelectorAll('svg');
  expect(svgs.length, 'the heading holds exactly one svg').toBe(1);
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

const LOGO_CLASSES = ['logo-tile', 'logo-cell', 'logo-digit', 'logo-digit-ring'];
const hasLogoClass = (el: Element): boolean => LOGO_CLASSES.some((c) => el.classList.contains(c));

describe('@trace FR-72 the header shows one decorative inline SVG logo', () => {
  it('One decorative inline logo in the header', () => {
    const root = mountFixture(WIN_PUZZLE);
    const header = headerOf(root);
    const headings = header.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    expect(headings.length, 'the header holds one heading').toBe(1);
    expect(headings[0]?.querySelectorAll('svg').length, 'the heading holds exactly one svg (the logo)').toBe(1);
    // the root holds exactly one other svg, the gear inside [data-action="settings"], and no third
    const all = Array.from(root.querySelectorAll('svg'));
    expect(all.length, 'the root holds exactly two svg elements').toBe(2);
    const svg = logoOf(root);
    const gears = all.filter((el) => el !== svg);
    expect(gears.length).toBe(1);
    expect(gears[0]?.closest('[data-action="settings"]'), 'the other svg is the gear inside the settings button').not.toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(gears[0]?.getAttribute('aria-hidden')).toBe('true');
    expect(headings[0]?.textContent, 'the logo adds no text to the heading').toBe(TITLE_TEXT);
  });

  it('The logo holds no text', () => {
    const root = mountFixture(WIN_PUZZLE);
    const svg = logoOf(root);
    expect(svg.querySelectorAll('text, title, desc, foreignObject').length).toBe(0);
    expect(textNodesUnder(svg).map((t) => t.data)).toEqual([]);
    expect(svg.textContent).toBe('');
  });

  it('The gear holds no text and no reference', () => {
    const root = mountFixture(WIN_PUZZLE);
    const button = root.querySelector('[data-action="settings"]');
    expect.assert(button !== null, 'the page has the settings button');
    const gear = button.querySelector('svg');
    expect.assert(gear !== null, 'the settings button holds the gear svg');
    expect(gear.querySelectorAll('text, title, desc, foreignObject, use').length, 'no text, title, desc, foreignObject or use element').toBe(0);
    expect(textNodesUnder(gear).map((t) => t.data), 'no text node').toEqual([]);
    for (const el of [gear, ...Array.from(gear.querySelectorAll('*'))]) {
      expect(el.hasAttribute('href'), `<${el.localName}> has no href`).toBe(false);
      expect(el.hasAttribute('xlink:href'), `<${el.localName}> has no xlink:href`).toBe(false);
      expect(el.hasAttributeNS('http://www.w3.org/1999/xlink', 'href'), `<${el.localName}> has no xlink href`).toBe(false);
    }
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

  // update-logo-legibility DELIBERATE CHANGE (FR-72 amended 2026-10-12, signed in chat: «in a circle with 0/1 rays» became «on a rounded
  // square tile»; delta scenario «Rounded square tile, no rays» replaces «Circle and 0/1 rays»).
  it('Rounded square tile, no rays', () => {
    const root = mountFixture(WIN_PUZZLE);
    const svg = logoOf(root);
    const tiles = svg.querySelectorAll('.logo-tile');
    expect(tiles.length, 'exactly one .logo-tile').toBe(1);
    const tile = tiles[0];
    expect.assert(tile !== undefined, 'the logo has a tile');
    expect(svg.firstElementChild === tile, 'the tile is the first child of the svg').toBe(true);
    expect(tile.localName).toBe('rect');
    expect([num(tile, 'x'), num(tile, 'y'), num(tile, 'width'), num(tile, 'height')]).toEqual([0, 0, 64, 64]);
    expect(num(tile, 'rx'), 'the tile has rounded corners').toBeGreaterThanOrEqual(8);
    expect(svg.querySelectorAll('circle').length, 'no circle').toBe(0);
    const unclassed = Array.from(svg.querySelectorAll('rect, ellipse, circle, path, line, polygon, polyline')).filter((el) => !hasLogoClass(el));
    expect(unclassed.map((el) => el.localName), 'every shape is the tile, a cell or a digit (no ray)').toEqual([]);
  });

  // update-logo-legibility DELIBERATE CHANGE (delta requirement «Logo», MODIFIED; the user's drawing G of 2026-10-12, after drawing B failed
  // the vision check, run wf_ae715072-b48): two new scenarios with geometric floors in viewBox units, spec-made proxies for NFR-15
  // (legibility at 40 px is decided by the vision check, not here).
  it('The digits are large enough to read at 40 px', () => {
    const root = mountFixture(WIN_PUZZLE);
    const svg = logoOf(root);
    expect(svg.getAttribute('viewBox')).toBe('0 0 64 64');

    const cells = Array.from(svg.querySelectorAll('.logo-cell')).map((el) => ({ x: num(el, 'x'), y: num(el, 'y'), w: num(el, 'width'), h: num(el, 'height') }));
    expect(cells.length).toBe(4);
    for (const c of cells) {
      expect(c.w, `the cell at (${c.x}, ${c.y}) is at least 24 wide`).toBeGreaterThanOrEqual(24);
      expect(c.h, `the cell at (${c.x}, ${c.y}) is at least 24 tall`).toBeGreaterThanOrEqual(24);
    }

    const bars = Array.from(svg.querySelectorAll('rect.logo-digit'));
    expect(bars.length).toBe(2);
    for (const bar of bars) {
      expect(num(bar, 'width'), 'a bar is at least 6 wide').toBeGreaterThanOrEqual(6);
      expect(num(bar, 'height'), 'a bar is at least 16 tall').toBeGreaterThanOrEqual(16);
      expect(num(bar, 'rx'), 'a bar has square ends').toBeLessThanOrEqual(1);
      const [bx, by, bw, bh] = [num(bar, 'x'), num(bar, 'y'), num(bar, 'width'), num(bar, 'height')];
      const home = cells.find((c) => bx >= c.x && bx <= c.x + c.w && by >= c.y && by <= c.y + c.h);
      expect.assert(home !== undefined, `a cell holds the bar at (${bx}, ${by})`);
      expect(bx + bw, 'the bar stays inside its cell (right)').toBeLessThanOrEqual(home.x + home.w);
      expect(by + bh, 'the bar stays inside its cell (bottom)').toBeLessThanOrEqual(home.y + home.h);
    }

    const rings = Array.from(svg.querySelectorAll('ellipse.logo-digit-ring'));
    expect(rings.length).toBe(2);
    for (const ring of rings) {
      const cx = num(ring, 'cx');
      const cy = num(ring, 'cy');
      const rx = num(ring, 'rx');
      const ry = num(ring, 'ry');
      const sw = num(ring, 'stroke-width');
      expect(sw, 'a ring stroke is at least 4.5').toBeGreaterThanOrEqual(4.5);
      expect(2 * (rx - sw / 2), 'the ring hole is at least 6.4 wide').toBeGreaterThanOrEqual(6.4);
      expect(2 * (ry - sw / 2), 'the ring hole is at least 9.6 tall').toBeGreaterThanOrEqual(9.6);
      const cell = cells.find((c) => cx >= c.x && cx <= c.x + c.w && cy >= c.y && cy <= c.y + c.h);
      expect.assert(cell !== undefined, `a cell holds the ring centred at (${cx}, ${cy})`);
      expect(cx - (rx + sw / 2), 'the ring stays inside its cell (left)').toBeGreaterThanOrEqual(cell.x);
      expect(cx + (rx + sw / 2), 'the ring stays inside its cell (right)').toBeLessThanOrEqual(cell.x + cell.w);
      expect(cy - (ry + sw / 2), 'the ring stays inside its cell (top)').toBeGreaterThanOrEqual(cell.y);
      expect(cy + (ry + sw / 2), 'the ring stays inside its cell (bottom)').toBeLessThanOrEqual(cell.y + cell.h);
    }
  });

  it('The board sits inside the tile', () => {
    const root = mountFixture(WIN_PUZZLE);
    const svg = logoOf(root);
    const cells = Array.from(svg.querySelectorAll('.logo-cell'));
    expect(cells.length).toBe(4);
    for (const el of cells) {
      const [x, y, w, h] = [num(el, 'x'), num(el, 'y'), num(el, 'width'), num(el, 'height')];
      expect(Math.min(x, y), `the cell at (${x}, ${y}) keeps a margin of 3 from the tile's top and left`).toBeGreaterThanOrEqual(3);
      expect(Math.max(x + w, y + h), `the cell at (${x}, ${y}) keeps a margin of 3 from the tile's bottom and right`).toBeLessThanOrEqual(61);
    }
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
      expect(root.querySelectorAll('svg').length, 'the root still holds exactly two svg elements (the logo and the gear)').toBe(2);
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
