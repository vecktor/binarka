const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

// 2x2 mini board drawn as shapes on a rounded square tile: a bar is 1, a ring is 0. No text, no id, no href.
// Sized to be read at 40 px (NFR-15; FR-72 as amended 2026-10-12, the user's drawing G): 26-unit cells, square-ended bars, wide rings.
const CELLS: readonly { x: number; y: number; digit: 0 | 1 }[] = [
  { x: 4, y: 4, digit: 1 },
  { x: 34, y: 4, digit: 0 },
  { x: 4, y: 34, digit: 0 },
  { x: 34, y: 34, digit: 1 },
];

export function createLogo(): SVGSVGElement {
  const svg = svgEl('svg', {
    class: 'logo',
    'aria-hidden': 'true',
    focusable: 'false',
    viewBox: '0 0 64 64',
  });

  svg.append(svgEl('rect', { class: 'logo-tile', x: '0', y: '0', width: '64', height: '64', rx: '14', fill: 'currentColor' }));

  for (const { x, y, digit } of CELLS) {
    const cx = x + 13;
    const cy = y + 13;
    svg.append(svgEl('rect', { class: 'logo-cell', x: String(x), y: String(y), width: '26', height: '26', rx: '4' }));
    svg.append(
      digit === 1
        ? svgEl('rect', {
            class: 'logo-digit',
            x: String(cx - 3.5),
            y: String(cy - 9),
            width: '7',
            height: '18',
            rx: '0.8',
          })
        : svgEl('ellipse', {
            class: 'logo-digit-ring',
            cx: String(cx),
            cy: String(cy),
            rx: '6',
            ry: '8',
            'stroke-width': '5',
          }),
    );
  }

  return svg;
}
