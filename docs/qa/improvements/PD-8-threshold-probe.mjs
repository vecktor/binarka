// PD-8 probe: which pixel-diff threshold does `check-acceptance-methods --mode=artifact` enforce for NFR-14?
//
// It sets the score of one committed report (the first one the checker walks, 1024-dark-confirm, 1.0 on main) to a
// probe value, runs the checker, prints its NFR-14 and TC-13 lines and the per-entry status from
// trace/acceptance-contracts.json, and restores the report and the trace file with `git checkout`.
//
// Usage: node docs/qa/improvements/PD-8-threshold-probe.mjs 0.985 0.975
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const REPORT = 'docs/qa/visual-diff/1024-dark-confirm/report.json';
const TRACE = 'trace/acceptance-contracts.json';
const restore = () => spawnSync('git', ['checkout', '--', REPORT, TRACE], { stdio: 'inherit' });

const original = JSON.parse(readFileSync(REPORT, 'utf8'));
console.log(`# ${REPORT} on HEAD: score ${original.score}`);
try {
  for (const value of process.argv.slice(2).map(Number)) {
    writeFileSync(REPORT, `${JSON.stringify({ ...original, score: value }, null, 2)}\n`);
    const run = spawnSync('node', ['scripts/check-acceptance-methods.mjs', '--mode=artifact'], { encoding: 'utf8' });
    const lines = `${run.stdout}${run.stderr}`.split('\n');
    console.log(`\n## probe score ${value}: exit ${run.status}`);
    for (const l of lines) if (/NFR-14|TC-13|\[config\]|^Result|^acceptance/.test(l)) console.log(l);
    const contracts = JSON.parse(readFileSync(TRACE, 'utf8'));
    for (const id of ['NFR-14', 'TC-13']) {
      const rows = (contracts[id] ?? contracts.contracts?.[id] ?? []).filter((e) => e.method === 'pixel-diff');
      for (const e of rows) console.log(`trace ${id} pixel-diff: ${e.status}${e.artifact ? ` (${e.artifact})` : ''}`);
    }
  }
} finally {
  restore();
  const after = spawnSync('git', ['status', '--porcelain', REPORT, TRACE], { encoding: 'utf8' }).stdout.trim();
  console.log(`\n# restored: git status --porcelain ${REPORT} ${TRACE} -> ${after === '' ? '(empty)' : after}`);
}
