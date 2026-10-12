// PD-10 probe: each rule of a signed disposition fails by name when it is broken.
//
// For one slice it writes a temporary docs/qa/review-dispositions/<slice>.json (a copy of the compiled one with a
// SYNTHETIC signature, «probe, not the user's»), breaks one rule per case, runs `check-trajectory.mjs --release
// --check-fresh` (which writes nothing) and prints that slice's lines. The real file (or its absence) is restored after.
//
// Usage: node docs/qa/improvements/PD-10-probe.mjs <compiled disposition json>
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const source = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const slice = source.slice;
const target = `docs/qa/review-dispositions/${slice}.json`;
const before = existsSync(target) ? readFileSync(target) : null;
const synthetic = { signedBy: 'probe, not the user', signedAt: '2026-10-12T00:00:00+05:30', channel: 'probe', words: 'probe' };
const clone = () => structuredClone({ ...source, signature: synthetic });

const cases = [
  ['A valid, signed copy', (d) => d],
  ['signature null', (d) => ({ ...d, signature: null })],
  ['a fixCommit that does not exist', (d) => ((d.findings[0] = { ...d.findings[0], outcome: 'fixed', fixCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' }), d)],
  ['a fixCommit that exists but is not on HEAD (3ada092, the pre-rebase settings fix)', (d) => ((d.findings[0] = { ...d.findings[0], outcome: 'fixed', fixCommit: '3ada092' }), d)],
  ['a waived product-code defect', (d) => ((d.findings[0] = { ...d.findings[0], productCodeDefect: true, outcome: 'waived', waiver: 'probe' }), d)],
  ['a confirmed title left out (findings emptied)', (d) => ({ ...d, findings: [] })],
  ['a design waiver pointing at a missing file', (d) => ({ ...d, designWaiver: { reason: 'probe', pointsAt: 'docs/no-such-file.md' } })],
];

try {
  for (const [name, mutate] of cases) {
    writeFileSync(target, `${JSON.stringify(mutate(clone()), null, 2)}\n`);
    const run = spawnSync('node', ['scripts/check-trajectory.mjs', '--release', '--check-fresh'], { encoding: 'utf8' });
    const lines = `${run.stdout}${run.stderr}`.split('\n').filter((l) => l.includes(slice));
    console.log(`\n## ${name}\n${lines.length ? lines.join('\n') : `(no line names ${slice}: it passes)`}`);
  }
} finally {
  if (before === null) rmSync(target, { force: true });
  else writeFileSync(target, before);
  console.log(`\n# restored ${target} (${before === null ? 'absent' : 'as it was'})`);
}
