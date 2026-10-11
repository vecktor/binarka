// PD-4 probe: does the capture path leave its `vite preview` listening after it is closed?
// Usage (after `npm run build`, under /tmp/binarka-capture.lock, ports 4174 and 4176 free):
//   node docs/qa/improvements/PD-4-orphan-probe.mjs [--e2e]   (--e2e also stops Playwright's runner on 4173; port 4173 free)
// Read-only for the repo: it edits no script. It runs the adapter's real capture()/close(), replays the spawn line of
// scripts/visual-block.mjs, and tries two candidate fixes on the same spawn line. Every process it leaves behind is its
// own; it reports each one and stops it at the end, so the ports are free when it exits.
import { execFileSync, spawn } from 'node:child_process';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const listener = (port) => {
  try {
    return execFileSync('lsof', ['-nP', '-t', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
};
const ps = (pid) => {
  try {
    return execFileSync('ps', ['-o', 'pid=,ppid=,pgid=,command=', '-p', String(pid)], { encoding: 'utf8' }).trim().replace(/\s+/g, ' ');
  } catch {
    return `${pid} (gone)`;
  }
};
const answers = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};
async function waitAnswer(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await answers(url)) return;
    await sleep(250);
  }
  throw new Error(`no answer on ${url}`);
}
const leftovers = [];
async function report(label, port, spawnedPid) {
  await sleep(2000);
  const pids = listener(port);
  const verdict = pids.length ? 'RED   (still listening after close)' : 'GREEN (port free after close)';
  console.log(`${label.padEnd(58)} ${verdict}`);
  if (spawnedPid) console.log(`  spawned (the pid the caller holds): ${ps(spawnedPid)}`);
  for (const pid of pids) {
    console.log(`  listener on ${port}: ${ps(pid)}`);
    leftovers.push(pid);
  }
  return pids.length === 0;
}

for (const port of [4174, 4176]) {
  if (listener(port).length) {
    console.error(`port ${port} is busy; stop it first (the probe measures only processes it starts)`);
    process.exit(2);
  }
}
const results = {};

// A. The gate's adapter, real code: one local capture, then close() (as check-visual-fidelity.mjs and visual-block.mjs call it).
{
  const adapter = await import('../../../scripts/check-visual-parity-adapters.mjs');
  const { readFileSync } = await import('node:fs');
  const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
  const shot = config.breakpoints.find((b) => b.name === '375-light-default');
  await adapter.capture({ role: 'local', url: config.localUrl, name: shot.name, width: shot.width, height: shot.height, settleMs: 300 });
  const before = listener(4174);
  console.log(`A. while capturing, listener on 4174: ${before.map(ps).join(' | ')}`);
  await adapter.close();
  results.A = await report('A. adapter capture() then close()  [as is]', 4174);
}

// B. The spawn line of scripts/visual-block.mjs:109 and its kill at :256, replayed as written.
{
  const proc = spawn('npx', ['vite', 'preview', '--port', '4176', '--strictPort'], { stdio: 'ignore' });
  await waitAnswer('http://localhost:4176/');
  proc.kill();
  results.B = await report('B. visual-block spawn npx, proc.kill()  [as is]', 4176, proc.pid);
}

for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
await sleep(1500);

// C. Candidate fix 1 (the plan's): npx in its own process group, the group killed.
{
  const proc = spawn('npx', ['vite', 'preview', '--port', '4176', '--strictPort'], { stdio: 'ignore', detached: true });
  await waitAnswer('http://localhost:4176/');
  process.kill(-proc.pid, 'SIGTERM');
  results.C = await report('C. npx detached, process.kill(-pid)  [fix 1]', 4176, proc.pid);
}

// D. Candidate fix 2: no wrapper; node runs vite's own bin, so the pid held is the listener; kill() reaches it.
{
  const proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4176', '--strictPort'], { stdio: 'ignore' });
  await waitAnswer('http://localhost:4176/');
  console.log(`D. while serving, listener on 4176: ${listener(4176).map(ps).join(' | ')}`);
  proc.kill();
  results.D = await report('D. node vite.js directly, proc.kill()  [fix 2]', 4176, proc.pid);
}

// E. The crash path: a caller that dies by an uncaught error before its finally/close (fix 2 plus an exit hook vs without).
for (const hook of [false, true]) {
  const body = `
    const { spawn } = require('node:child_process');
    const p = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4176', '--strictPort'], { stdio: 'ignore' });
    ${hook ? "process.on('exit', () => p.kill());" : ''}
    const t = setInterval(async () => { try { if ((await fetch('http://localhost:4176/')).ok) { clearInterval(t); throw new Error('crash'); } } catch (e) { if (e.message === 'crash') throw e; } }, 250);
  `;
  const r = spawn(process.execPath, ['-e', body], { stdio: 'ignore' });
  await new Promise((res) => r.on('exit', res));
  const key = hook ? 'E2' : 'E1';
  results[key] = await report(`E. caller crashes, fix 2 ${hook ? 'WITH' : 'without'} process.on('exit') kill`, 4176);
  for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
  await sleep(1500);
}

// F. The caller is stopped by a signal while its preview is up (a tool timeout, `kill <pid>`, a closed terminal).
// F1-F4: the gate's adapter, real code, in a child process that has captured one shot and waits; the signal goes to that
// child's pid only (not its group), as `kill <pid>` or a supervisor that stops one process does.
// F5, F6, F9, F10: candidate fix 2 plus signal handlers (stop the preview, then exit 128+n), against SIGTERM, SIGKILL,
// SIGINT and SIGHUP.
const adapterUrl = new URL('../../../scripts/check-visual-parity-adapters.mjs', import.meta.url).href;
const realCaller = `
  const a = await import(${JSON.stringify(adapterUrl)});
  const { readFileSync } = await import('node:fs');
  const c = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
  const s = c.breakpoints.find((b) => b.name === '375-light-default');
  await a.capture({ role: 'local', url: c.localUrl, name: s.name, width: s.width, height: s.height, settleMs: 300 });
  console.log('READY');
  setInterval(() => {}, 1000);
`;
const fixedCaller = `
  const { spawn } = await import('node:child_process');
  const p = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4174', '--strictPort'], { stdio: 'ignore' });
  process.on('exit', () => p.kill());
  for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) process.once(sig, () => process.exit(128 + n));
  const t = setInterval(async () => { try { if ((await fetch('http://localhost:4174/')).ok) { clearInterval(t); console.log('READY'); } } catch {} }, 250);
  setInterval(() => {}, 1000);
`;
// F7-F8: candidate fix 1 (npx in its own process group) with no handler, and with the same handlers killing the group.
const groupCaller = (handlers) => `
  const { spawn } = await import('node:child_process');
  const p = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { stdio: 'ignore', detached: true });
  ${handlers ? `process.on('exit', () => { try { process.kill(-p.pid, 'SIGTERM'); } catch {} });
  for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) process.once(sig, () => process.exit(128 + n));` : ''}
  const t = setInterval(async () => { try { if ((await fetch('http://localhost:4174/')).ok) { clearInterval(t); console.log('READY'); } } catch {} }, 250);
  setInterval(() => {}, 1000);
`;
const signalCases = [
  ['F1', realCaller, 'SIGTERM', 'adapter as is'],
  ['F2', realCaller, 'SIGINT', 'adapter as is'],
  ['F3', realCaller, 'SIGHUP', 'adapter as is'],
  ['F4', realCaller, 'SIGKILL', 'adapter as is'],
  ['F5', fixedCaller, 'SIGTERM', 'fix 2 + exit hook + signal handlers'],
  ['F6', fixedCaller, 'SIGKILL', 'fix 2 + exit hook + signal handlers'],
  ['F9', fixedCaller, 'SIGINT', 'fix 2 + exit hook + signal handlers'],
  ['F10', fixedCaller, 'SIGHUP', 'fix 2 + exit hook + signal handlers'],
  ['F7', groupCaller(false), 'SIGTERM', 'fix 1 (group), no handlers'],
  ['F8', groupCaller(true), 'SIGTERM', 'fix 1 (group) + exit hook + signal handlers'],
];
for (const [key, body, sig, what] of signalCases) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', body], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res, rej) => {
    child.stdout.on('data', (d) => { if (String(d).includes('READY')) res(); });
    child.on('exit', () => rej(new Error(`${key}: caller exited before READY`)));
  });
  console.log(`${key}. while up, listener on 4174: ${listener(4174).map(ps).join(' | ')}`);
  const gone = new Promise((res) => child.on('exit', res));
  process.kill(child.pid, sig);
  await gone;
  results[key] = await report(`${key}. caller gets ${sig}, ${what}`, 4174);
  for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
  await sleep(1500);
}

// G. Port 4173: Playwright's own webServer (playwright.config.ts), stopped by a signal while it serves (only with --e2e;
// the runner builds first). The signal goes to the runner's pid only, as in F.
if (process.argv.includes('--e2e')) {
  for (const [key, sig] of [['G1', 'SIGTERM'], ['G2', 'SIGINT'], ['G3', 'SIGKILL']]) {
    if (listener(4173).length) throw new Error('port 4173 is busy');
    const runner = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--project=layout', 'e2e/nfr-18-flash.spec.ts', '--repeat-each=50'], { stdio: 'ignore' });
    const end = Date.now() + 120000;
    while (!listener(4173).length && Date.now() < end) await sleep(250);
    await sleep(1500);
    console.log(`${key}. while up, listener on 4173: ${listener(4173).map(ps).join(' | ')}`);
    const gone = new Promise((res) => runner.on('exit', res));
    process.kill(runner.pid, sig);
    await gone;
    results[key] = await report(`${key}. playwright runner gets ${sig}`, 4173);
    for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
    await sleep(1500);
  }
}

for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
await sleep(1500);
console.log(`\nafter cleanup: ${[4173, 4174, 4176].map((p) => `${p} ${listener(p).length ? 'BUSY' : 'free'}`).join(', ')}`);
console.log(JSON.stringify(results));
