// The vision gate (Phase H; NFR-11, NFR-15): a requirement whose verification is `vision-verify` is met only when a fresh
// vision-judge LOOKED at a recorded still that proves it and found it met and readable.
//
// Inputs:
//   - the vision verdicts in the recording manifests (docs/qa/**/manifest.json, results[].vision = { met, readable, notes }), written
//     by the vision-verify workflow (a fresh vision-judge per still, maker≠checker);
//   - the requirements in force (docs/requirements.md) whose verification cell names `vision-verify`.
// Rules:
//   - every verdict present must be met AND readable;
//   - every vision-verify requirement needs at least one recorded clip whose `proof` names it, and every such clip needs a verdict
//     that is met and readable;
//   - Scope 0 (no verdict at all) is NEVER a PASS: NOT-EARNED, exit 1, when product code exists (vacuous-pass-not-earned; PD-4 of
//     check-recordings). Before product code it is SKIP-pending, exit 0, still never PASS.
// Output: docs/qa/vision-report.json ({ met, result, scope, requirements, results }; `met` is what check-acceptance-methods reads)
// and docs/qa/vision-report.md, both regenerated on every run (no clock in them, so --check-fresh can compare).
//
// Usage:
//   node scripts/check-vision.mjs                      # report + exit code (npm run check:vision)
//   node scripts/check-vision.mjs --check-fresh        # the committed reports must equal a fresh render
//   node scripts/check-vision.mjs --manifest <file>    # read only these verdict files (repeatable; for probes); writes no report
//   node scripts/check-vision.mjs --requirements <f>   # another requirements file (default docs/requirements.md)
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const argv = process.argv.slice(2);
const flags = new Set(argv);
const values = (name) => argv.flatMap((a, i) => (a === name && argv[i + 1] ? [argv[i + 1]] : []));
const QA_DIR = 'docs/qa';
const REQUIREMENTS = values('--requirements')[0] ?? 'docs/requirements.md';
const OUT_JSON = 'docs/qa/vision-report.json';
const OUT_MD = 'docs/qa/vision-report.md';
const explicit = values('--manifest');
const CODE_DIRS = ['app', 'src', 'lib', 'server', 'packages'];
const CODE_EXT = /\.(m?[jt]sx?|cjs)$/i;

function* walk(dir, match) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return;
  for (const e of readdirSync(abs)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(join(root, p)).isDirectory()) yield* walk(p, match);
    else if (match(e)) yield p;
  }
}
const hasProductCode = () => CODE_DIRS.some((d) => !walk(d, (e) => CODE_EXT.test(e)).next().done);
const idsIn = (text) => new Set(text.match(/\b(?:FR|NFR)-\d+\b/g) ?? []);

const failures = [];
const fail = (id, msg) => failures.push({ id, msg });

// ---- the vision-verify requirements in force
const visionRequirements = [];
if (existsSync(join(root, REQUIREMENTS))) {
  for (const line of readFileSync(join(root, REQUIREMENTS), 'utf8').split('\n')) {
    const m = line.match(/^\|\s*((?:FR|NFR)-\d+)\s*\|/);
    if (!m) continue;
    const cells = line.split('|');
    const verify = cells[cells.length - 2] ?? '';
    if (/\bvision-verify\b/.test(verify) && !/\(pending:/.test(verify)) visionRequirements.push(m[1]);
  }
}

// ---- the clips and their verdicts
const manifests = explicit.length ? explicit : [...walk(QA_DIR, (f) => f === 'manifest.json')];
const clips = [];
for (const mf of manifests) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(root, mf), 'utf8'));
  } catch {
    fail(mf, 'not valid JSON');
    continue;
  }
  for (const r of data.results ?? []) {
    const v = r.vision ?? null;
    clips.push({
      manifest: mf.replaceAll('\\', '/'),
      id: r.id ?? '(unnamed)',
      proof: [...idsIn(String(r.proof ?? ''))],
      screenshot: r.screenshot ?? null,
      vision: v && typeof v === 'object' ? { met: v.met === true, readable: v.readable === true, notes: String(v.notes ?? '') } : null,
    });
  }
}
const judged = clips.filter((c) => c.vision !== null);

for (const c of judged) {
  if (!(c.vision.met && c.vision.readable)) {
    fail(c.id, `vision verdict is not met+readable (met ${c.vision.met}, readable ${c.vision.readable}): ${c.vision.notes}`);
  }
  if (c.screenshot && !existsSync(join(root, c.screenshot))) fail(c.id, `the judged still is missing on disk: ${c.screenshot}`);
}

const requirementRows = visionRequirements.map((id) => {
  const proving = clips.filter((c) => c.proof.includes(id));
  const unjudged = proving.filter((c) => c.vision === null);
  const bad = proving.filter((c) => c.vision !== null && !(c.vision.met && c.vision.readable));
  let status;
  if (proving.length === 0) {
    status = 'FAIL';
    fail(id, `declares vision-verify, but no recorded clip names it in its proof`);
  } else if (unjudged.length) {
    status = 'NOT-EARNED';
    fail(id, `clip(s) ${unjudged.map((c) => c.id).join(', ')} prove it but have no vision verdict (run the vision-verify workflow)`);
  } else if (bad.length) {
    status = 'FAIL';
  } else {
    status = 'met';
  }
  return { id, status, clips: proving.map((c) => c.id) };
});

// ---- verdict (never a PASS over Scope 0)
let result;
let exitCode;
if (failures.length) {
  result = 'FAIL';
  exitCode = 1;
} else if (judged.length === 0) {
  if (hasProductCode()) {
    result = 'NOT-EARNED';
    exitCode = 1;
    failures.push({ id: 'vision', msg: 'Scope 0: no vision verdict on any recorded still while product code exists — NOT-EARNED, never a PASS over an empty evidence base' });
  } else {
    result = 'SKIP-pending';
    exitCode = 0;
  }
} else {
  result = 'PASS';
  exitCode = 0;
}
const met = result === 'PASS';

const report = {
  generatedBy: 'scripts/check-vision.mjs',
  met,
  result,
  scope: { clips: clips.length, judged: judged.length, requirements: visionRequirements.length },
  requirements: requirementRows,
  results: judged.map((c) => ({ id: c.id, proof: c.proof.join(', '), screenshot: c.screenshot, met: c.vision.met, readable: c.vision.readable, notes: c.vision.notes })),
  failures,
};
const json = `${JSON.stringify(report, null, 2)}\n`;
const md = `# Vision Report (generated - do not hand-edit)

Generated by \`node scripts/check-vision.mjs\` from the vision verdicts in the recording manifests (written by the \`vision-verify\`
workflow: a fresh vision-judge looked at each settled still). A requirement whose verification is \`vision-verify\` is met only when
every recorded still that proves it was judged met and readable. Scope 0 is never a PASS.

Scope: ${judged.length} judged still(s) of ${clips.length} clip(s); ${visionRequirements.length} vision-verify requirement(s) in force.
Result: ${result}
Overall: met: ${met}

## Requirements

| Requirement | Status | Clips |
|---|---|---|
${requirementRows.map((r) => `| ${r.id} | ${r.status} | ${r.clips.join(', ') || '-'} |`).join('\n') || '| (none in force) | - | - |'}

## Verdicts

| Clip | Proves | Met | Readable | Notes |
|---|---|---|---|---|
${report.results.map((r) => `| ${r.id} | ${r.proof} | ${r.met ? 'yes' : '**no**'} | ${r.readable ? 'yes' : '**no**'} | ${r.notes.replaceAll('|', '\\|').replaceAll('\n', ' ')} |`).join('\n') || '| - | - | - | - | - |'}

## Failures

${failures.length ? failures.map((f) => `- **${f.id}**: ${f.msg}`).join('\n') : 'None.'}
`;

if (flags.has('--check-fresh')) {
  for (const [path, body] of [[OUT_JSON, json], [OUT_MD, md]]) {
    const committed = existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : null;
    if (committed === null) {
      console.error(`FAIL  [freshness] ${path} does not exist — run npm run check:vision and commit it`);
      exitCode = 1;
    } else if (committed.replace(/\r\n/g, '\n') !== body) {
      console.error(`FAIL  [freshness] ${path} is stale — regenerate and commit`);
      exitCode = 1;
    }
  }
} else if (!explicit.length) {
  writeFileSync(join(root, OUT_JSON), json);
  writeFileSync(join(root, OUT_MD), md);
}

for (const f of failures) console.error(`${result === 'NOT-EARNED' && f.id === 'vision' ? 'NOT-EARNED' : 'FAIL'}  [${f.id}] ${f.msg}`);
for (const r of requirementRows) console.log(`${r.status.padEnd(10)} ${r.id} (${r.clips.join(', ') || 'no clip'})`);
console.log(`\nScope: ${judged.length} judged still(s) of ${clips.length} clip(s) in ${manifests.length} manifest(s); ${visionRequirements.length} vision-verify requirement(s)`);
console.log(`Result: ${result}`);
process.exit(exitCode);
