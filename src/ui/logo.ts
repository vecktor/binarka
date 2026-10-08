const SVG_NS = 'http://www.w3.org/2000/svg';
const RAY_COUNT = 12;

function svgEl(tag: string, attrs: Record<string, string>): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

// 2x2 mini board drawn as shapes: a bar is 1, a ring is 0. No text, no id, no href.
const CELLS: readonly { x: number; y: number; digit: 0 | 1 }[] = [
  { x: 20.5, y: 20.5, digit: 1 },
  { x: 32.5, y: 20.5, digit: 0 },
  { x: 20.5, y: 32.5, digit: 0 },
  { x: 32.5, y: 32.5, digit: 1 },
];

export function createLogo(): SVGSVGElement {
  const svg = svgEl('svg', {
    class: 'logo',
    'aria-hidden': 'true',
    focusable: 'false',
    viewBox: '0 0 64 64',
  }) as SVGSVGElement;

  for (let index = 0; index < RAY_COUNT; index += 1) {
    const group = svgEl('g', { transform: `rotate(${(360 / RAY_COUNT) * index} 32 32)` });
    group.append(
      index % 2 === 0
        ? svgEl('rect', { x: '30.6', y: '2.5', width: '2.8', height: '8', rx: '1.4', fill: 'currentColor' })
        : svgEl('ellipse', {
            cx: '32',
            cy: '6.5',
            rx: '2.3',
            ry: '3.2',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '1.8',
          }),
    );
    svg.append(group);
  }

  svg.append(svgEl('circle', { cx: '32', cy: '32', r: '19.5', fill: 'currentColor' }));

  for (const { x, y, digit } of CELLS) {
    const cx = x + 5.5;
    const cy = y + 5.5;
    svg.append(svgEl('rect', { class: 'logo-cell', x: String(x), y: String(y), width: '11', height: '11', rx: '2' }));
    svg.append(
      digit === 1
        ? svgEl('rect', {
            class: 'logo-digit',
            x: String(cx - 1.3),
            y: String(cy - 3.6),
            width: '2.6',
            height: '7.2',
            rx: '1.3',
          })
        : svgEl('ellipse', {
            class: 'logo-digit-ring',
            cx: String(cx),
            cy: String(cy),
            rx: '2.2',
            ry: '3.1',
            'stroke-width': '1.8',
          }),
    );
  }

  return svg;
}
