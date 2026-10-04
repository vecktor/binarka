// Engine purity (TC-7: no DOM, TC-8: no Math.random): a source scan of src/engine.
// Deliberately carries NO trace tag: per the spec Exclusions these are constraints, not traced behaviours.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROOT = `${process.cwd()}/src/engine`;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (entry.endsWith('.ts')) out.push(path);
  }
  return out;
}

/** Remove block and line comments so that prose such as "no document access" is not a finding. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

const FILES = sourceFiles(ROOT);

describe('src/engine purity', () => {
  it('scans the engine modules (the scan is not vacuous)', () => {
    const names = FILES.map((f) => f.slice(ROOT.length + 1)).sort();
    for (const expected of ['generator.ts', 'hint.ts', 'index.ts', 'rng.ts', 'rules.ts', 'solver.ts', 'types.ts']) {
      expect(names).toContain(expected);
    }
  });

  it('never uses Math.random', () => {
    const offenders = FILES.filter((f) => /\bMath\s*\.\s*random\b/.test(withoutComments(readFileSync(f, 'utf8'))));
    expect(offenders).toEqual([]);
  });

  it('uses no DOM or browser globals', () => {
    const globals = /\b(document|window|localStorage|sessionStorage|navigator|location|requestAnimationFrame|HTMLElement|alert)\b/;
    const offenders = FILES.filter((f) => globals.test(withoutComments(readFileSync(f, 'utf8'))));
    expect(offenders).toEqual([]);
  });

  it('imports nothing from the page or from a DOM module', () => {
    const domImport = /from\s+['"](?:[^'"]*\/)?(?:ui|main)(?:\/[^'"]*)?['"]|from\s+['"](?:jsdom|happy-dom)['"]/;
    const offenders = FILES.filter((f) => domImport.test(withoutComments(readFileSync(f, 'utf8'))));
    expect(offenders).toEqual([]);
  });
});
