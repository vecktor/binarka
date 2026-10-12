const SVG_NS = 'http://www.w3.org/2000/svg';
const RAY_COUNT = 12;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

// 2x2 mini board drawn as shapes: a bar is 1, a ring is 0. No text, no id, no href.
// Sized to be read at 40 px (NFR-15, the user's drawing B of 2026-10-12): 16-unit cells in an r 24 circle, short rays outside it.
const CELLS: readonly { x: number; y: number; digit: 0 | 1 }[] = [
  { x: 15, y: 15, digit: 1 },
  { x: 33, y: 15, digit: 0 },
  { x: 15, y: 33, digit: 0 },
  { x: 33, y: 33, digit: 1 },
];

export function createLogo(): SVGSVGElement {
  const svg = svgEl('svg', {
    class: 'logo',
    'aria-hidden': 'true',
    focusable: 'false',
    viewBox: '0 0 64 64',
  });

  for (let index = 0; index < RAY_COUNT; index += 1) {
    const group = svgEl('g', { transform: `rotate(${(360 / RAY_COUNT) * index} 32 32)` });
    group.append(
      index % 2 === 0
        ? svgEl('rect', { x: '30.4', y: '0.5', width: '3.2', height: '6', rx: '1.6', fill: 'currentColor' })
        : svgEl('ellipse', {
            cx: '32',
            cy: '3.6',
            rx: '2.1',
            ry: '2.7',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '1.6',
          }),
    );
    svg.append(group);
  }

  svg.append(svgEl('circle', { cx: '32', cy: '32', r: '24', fill: 'currentColor' }));

  for (const { x, y, digit } of CELLS) {
    const cx = x + 8;
    const cy = y + 8;
    svg.append(svgEl('rect', { class: 'logo-cell', x: String(x), y: String(y), width: '16', height: '16', rx: '3' }));
    svg.append(
      digit === 1
        ? svgEl('rect', {
            class: 'logo-digit',
            x: String(cx - 2.25),
            y: String(cy - 5.5),
            width: '4.5',
            height: '11',
            rx: '2.25',
          })
        : svgEl('ellipse', {
            class: 'logo-digit-ring',
            cx: String(cx),
            cy: String(cy),
            rx: '3.5',
            ry: '5',
            'stroke-width': '3',
          }),
    );
  }

  return svg;
}
