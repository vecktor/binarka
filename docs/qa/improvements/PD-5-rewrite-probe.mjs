// PD-5 probe: what does the visual-fidelity line of `qa-verify` and `gate:status` do to the committed NFR-14 evidence?
// Usage (under /tmp/binarka-capture.lock, a clean docs/qa/visual-diff/):
//   node docs/qa/improvements/PD-5-rewrite-probe.mjs
// It runs the checker with exactly the command line both locked scripts use (`node scripts/check-visual-fidelity.mjs`, no
// CHECK_VISUAL_FIDELITY_ADAPTERS), compares every docs/qa/visual-diff/*/report.json before and after, and then restores
// the committed files (git checkout) and removes the files the run created, so the tree is as it was.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'docs/qa/visual-diff';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const dirty = () => git('status', '--porcelain', '--', DIR).trim();
if (dirty()) {
  console.error(`${DIR} is not clean; commit or restore it first:\n${dirty()}`);
  process.exit(2);
}
const read = () => Object.fromEntries(readdirSync(DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(DIR, d.name, 'report.json')))
  .map((d) => [d.name, JSON.parse(readFileSync(join(DIR, d.name, 'report.json'), 'utf8'))]));

// What the two locked scripts run (static evidence, printed for the record).
for (const f of ['scripts/qa-verify.mjs', 'scripts/gate-status.mjs']) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /check-visual-fidelity/.test(l));
  console.log(`${f}: ${lines.map(([n, l]) => `${n}: ${l.trim()}`).join(' | ')}; sets CHECK_VISUAL_FIDELITY_ADAPTERS: ${/CHECK_VISUAL_FIDELITY_ADAPTERS/.test(src) ? 'yes' : 'no'}`);
}

const before = read();
const env = { ...process.env };
delete env.CHECK_VISUAL_FIDELITY_ADAPTERS;
const t0 = Date.now();
const r = spawnSync('node', ['scripts/check-visual-fidelity.mjs'], { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
const out = `${r.stdout}${r.stderr}`;
console.log(`\nrun: node scripts/check-visual-fidelity.mjs (no adapter variable), exit ${r.status}, ${Math.round((Date.now() - t0) / 1000)} s`);
console.log(`adapter line: ${/adapters injected/.test(out) ? out.match(/\(adapters injected[^)]*\)/)[0] : 'none (the default URL-to-URL adapters)'}`);
for (const l of out.split('\n').filter((l) => /^(Scope|Result):/.test(l))) console.log(l);
const firstFail = out.split('\n').find((l) => /^FAIL/.test(l));
if (firstFail) console.log(`first failure: ${firstFail.slice(0, 220)}`);

const after = read();
const names = Object.keys(before).sort();
const changed = names.filter((n) => JSON.stringify(before[n]) !== JSON.stringify(after[n]));
const flipped = names.filter((n) => before[n].pass !== after[n]?.pass);
const passBefore = names.filter((n) => before[n].pass).length;
const passAfter = names.filter((n) => after[n]?.pass).length;
const modified = git('diff', '--name-only', '--', DIR).trim().split('\n').filter(Boolean);
const created = git('ls-files', '--others', '--exclude-standard', '--', DIR).trim().split('\n').filter(Boolean);
console.log(`\nreports: ${names.length}; rewritten with different content: ${changed.length}; verdict (pass) flipped: ${flipped.length}`);
console.log(`passing at 0.98: before ${passBefore}, after ${passAfter}`);
console.log(`git: ${modified.length} tracked file(s) modified, ${created.length} untracked file(s) created`);
for (const n of changed.slice(0, 3)) {
  console.log(`  ${n}\n    before ${JSON.stringify(before[n])}\n    after  ${JSON.stringify(after[n])}`);
}

// Restore the committed evidence.
if (modified.length) execFileSync('git', ['checkout', '--', DIR]);
for (const f of created) rmSync(f);
console.log(`\nrestored: ${dirty() ? `NOT CLEAN\n${dirty()}` : `${DIR} clean (git status --porcelain empty)`}`);
