// @trace NFR-14
// The NFR-14 reference pins agree: the frozen set the NFR-14 row of docs/requirements.md names, quality/visual-parity.config.json
// (`referenceDir`, `referenceSha1sums`) and the set on disk (the SHA-1 of its SHA1SUMS, and its 170 shot names = the config's breakpoints).
// Review gate of the design stream DS of wave 3 (run wf_b4f0e083-6e6): no checker compared `referenceSha1sums` with the set, so a stale
// value passed silently; the PD-13 and PD-14 probe (docs/qa/improvements/PD-13-reference-probe.mjs) did it by hand. The negative case
// below feeds the same check a mismatched config, so the check is seen failing inside this file.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Config {
  referenceDir: string;
  referenceSha1sums: string;
  breakpoints: { name: string }[];
}
interface Reference {
  dir: string;
  sha1sums: string;
}

const ROW = /`(design\/v0-screenshots\/review-set-\d+)\/` \(170 shots; `SHA1SUMS` of the set ([0-9a-f]{40});/;

function rowReference(requirements: string): Reference | null {
  const row = requirements.split('\n').find((l) => l.startsWith('| NFR-14 |'));
  const m = ROW.exec(row ?? '');
  const [, dir, sha1sums] = m ?? [];
  return dir !== undefined && sha1sums !== undefined ? { dir, sha1sums } : null;
}

/** Every disagreement between the row's reference, the config and the set on disk; empty when they agree. */
function mismatches(row: Reference, config: Config, readSums: (path: string) => string | null): string[] {
  const out: string[] = [];
  if (config.referenceDir !== row.dir) out.push(`config.referenceDir ${config.referenceDir} is not the NFR-14 row's ${row.dir}`);
  if (config.referenceSha1sums !== row.sha1sums) out.push(`config.referenceSha1sums ${config.referenceSha1sums} is not the NFR-14 row's ${row.sha1sums}`);
  const sums = readSums(`${config.referenceDir}/SHA1SUMS`);
  if (sums === null) return [...out, `${config.referenceDir}/SHA1SUMS is missing`];
  const disk = createHash('sha1').update(sums).digest('hex');
  if (disk !== config.referenceSha1sums) out.push(`SHA-1 of ${config.referenceDir}/SHA1SUMS is ${disk}, the config says ${config.referenceSha1sums}`);
  const listed = new Set(sums.trim().split('\n').map((l) => l.split(/\s+/)[1]?.replace(/\.png$/, '')));
  const missing = config.breakpoints.map((b) => b.name).filter((n) => !listed.has(n));
  if (missing.length > 0 || listed.size !== config.breakpoints.length) out.push(`SHA1SUMS lists ${listed.size} shots, the config ${config.breakpoints.length}; missing: ${missing.join(', ') || 'none'}`);
  return out;
}

const readSums = (path: string): string | null => (existsSync(path) ? readFileSync(path, 'utf8') : null);
const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8')) as Config;
const row = rowReference(readFileSync('docs/requirements.md', 'utf8'));

describe('NFR-14 reference pins', () => {
  it('@trace NFR-14 the NFR-14 row names a frozen set and the SHA-1 of its SHA1SUMS', () => {
    expect(row, 'the NFR-14 row names "`design/v0-screenshots/review-set-N/` (170 shots; `SHA1SUMS` of the set <sha1>;"').not.toBeNull();
  });

  it('@trace NFR-14 the config, the NFR-14 row and the set on disk agree', () => {
    if (row === null) throw new Error('the NFR-14 row names no reference');
    expect(mismatches(row, config, readSums)).toEqual([]);
  });

  it('@trace NFR-14 the check reports a config that still names the previous set (negative case)', () => {
    if (row === null) throw new Error('the NFR-14 row names no reference');
    const stale: Config = { ...config, referenceDir: 'design/v0-screenshots/review-set-14', referenceSha1sums: 'e89badbf4bdbe29478563e9f2edef91fcc5c853f' };
    const found = mismatches(row, stale, readSums);
    expect(found.some((m) => m.startsWith('config.referenceDir')), found.join('; ')).toBe(true);
    expect(found.some((m) => m.startsWith('config.referenceSha1sums')), found.join('; ')).toBe(true);
    const wrongSum: Config = { ...config, referenceSha1sums: '0'.repeat(40) };
    expect(mismatches({ ...row, sha1sums: '0'.repeat(40) }, wrongSum, readSums).some((m) => m.startsWith('SHA-1 of')), 'a pin that is not the set\'s SHA1SUMS').toBe(true);
  });
});
