// PD-13 probe: does quality/visual-parity.config.json name the NFR-14 reference the user moved to?
// It compares three things and exits 1 on any mismatch (no port, no capture, nothing written):
//   1. the reference the NFR-14 row of docs/requirements.md names (set directory and the SHA-1 of its SHA1SUMS);
//   2. the config's referenceDir and referenceSha1sums;
//   3. the SHA-1 of <referenceDir>/SHA1SUMS on disk, and that SHA1SUMS lists the 170 breakpoints of the config.
// Usage: node docs/qa/improvements/PD-13-reference-probe.mjs
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const fail = [];
const row = readFileSync('docs/requirements.md', 'utf8').split('\n').find((l) => l.startsWith('| NFR-14 |'));
const m = /`(design\/v0-screenshots\/review-set-\d+)\/` \(170 shots; `SHA1SUMS` of the set ([0-9a-f]{40});/.exec(row ?? '');
if (!m) fail.push('the NFR-14 row names no reference in the form "`design/v0-screenshots/review-set-N/` (170 shots; `SHA1SUMS` of the set <sha1>;"');
const [, rowDir, rowSha] = m ?? [];
const cfg = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const sums = `${cfg.referenceDir}/SHA1SUMS`;
const diskSha = existsSync(sums) ? createHash('sha1').update(readFileSync(sums)).digest('hex') : null;
console.log(`NFR-14 row:  ${rowDir} ${rowSha}`);
console.log(`config:      ${cfg.referenceDir} ${cfg.referenceSha1sums}`);
console.log(`on disk:     ${sums} ${diskSha ?? 'missing'}`);
if (rowDir !== undefined && cfg.referenceDir !== rowDir) fail.push(`config.referenceDir ${cfg.referenceDir} is not the NFR-14 row's ${rowDir}`);
if (rowSha !== undefined && cfg.referenceSha1sums !== rowSha) fail.push(`config.referenceSha1sums ${cfg.referenceSha1sums} is not the NFR-14 row's ${rowSha}`);
if (diskSha !== cfg.referenceSha1sums) fail.push(`SHA-1 of ${sums} is ${diskSha ?? 'missing'}, the config says ${cfg.referenceSha1sums}`);
if (diskSha !== null) {
  const listed = new Set(readFileSync(sums, 'utf8').trim().split('\n').map((l) => l.split(/\s+/)[1]?.replace(/\.png$/, '')));
  const missing = cfg.breakpoints.map((b) => b.name).filter((n) => !listed.has(n));
  if (missing.length > 0 || listed.size !== cfg.breakpoints.length) fail.push(`${sums} lists ${listed.size} shots; config breakpoints ${cfg.breakpoints.length}; missing ${missing.join(', ') || 'none'}`);
}
for (const f of fail) console.log(`FAIL ${f}`);
console.log(fail.length === 0 ? 'PASS: the config names the NFR-14 reference, and its SHA1SUMS matches' : `FAIL: ${fail.length} mismatch(es)`);
process.exit(fail.length === 0 ? 0 : 1);
