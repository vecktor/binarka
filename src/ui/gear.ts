const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag: string, attrs: Record<string, string>): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

/** The gear drawn as shapes (eight teeth around a disc with a hole), decorative: no text, no id, no href (FR-72, TC-14). */
export function createGear(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [name, value] of Object.entries({ class: 'gear', 'aria-hidden': 'true', focusable: 'false', viewBox: '0 0 24 24' })) svg.setAttribute(name, value);
  for (let i = 0; i < 8; i += 1) {
    svg.append(svgEl('rect', { x: '10', y: '1.5', width: '4', height: '5', rx: '1.25', fill: 'currentColor', transform: `rotate(${i * 45} 12 12)` }));
  }
  svg.append(svgEl('circle', { cx: '12', cy: '12', r: '7.25', fill: 'currentColor' }));
  svg.append(svgEl('circle', { class: 'gear-hole', cx: '12', cy: '12', r: '3' }));
  return svg;
}
