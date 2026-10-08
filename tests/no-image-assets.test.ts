// Repository scan for TC-14 (no image file, no bitmap, no other graphics asset). Tagged FR-72, the one row that allows
// the single inline SVG graphic. A guard test, not a behaviour test: it passes before the logo exists.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.ico', '.svg'];

/** Every file under `dir`, recursively (empty when `dir` does not exist). */
function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) out.push(...filesUnder(path));
    else out.push(path);
  }
  return out;
}

const imageFiles = (dir: string): string[] =>
  filesUnder(dir).filter((f) => IMAGE_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)));

describe('@trace FR-72 the repository holds no image asset', () => {
  it('The repository holds no image asset: no image file under src/ or public/', () => {
    expect(filesUnder(`${ROOT}/src`).length, 'the scan sees the source files').toBeGreaterThan(0);
    expect(imageFiles(`${ROOT}/src`)).toEqual([]);
    expect(imageFiles(`${ROOT}/public`)).toEqual([]);
  });

  it('The repository holds no image asset: index.html has no icon link and no img', () => {
    const doc = new DOMParser().parseFromString(readFileSync(`${ROOT}/index.html`, 'utf8'), 'text/html');
    expect(doc.querySelectorAll('img').length).toBe(0);
    const iconLinks = Array.from(doc.querySelectorAll('link')).filter((l) => (l.getAttribute('rel') ?? '').toLowerCase().includes('icon'));
    expect(iconLinks.map((l) => l.outerHTML)).toEqual([]);
  });

  it('The repository holds no image asset: src/ui/style.css has no url(', () => {
    const css = readFileSync(`${ROOT}/src/ui/style.css`, 'utf8');
    expect(css.length, 'the stylesheet is read').toBeGreaterThan(0);
    expect(css.includes('url(')).toBe(false);
  });
});
