// PD-4 probe: does the capture path leave its `vite preview` listening after it is closed?
// Usage (after `npm run build`; the ports BINARKA_PORT_BASE + 0 to + 4 free, 4173 to 4177 by default, under the capture lock
// when on the default ports):
//   node docs/qa/improvements/PD-4-orphan-probe.mjs [--e2e] [--green]
//   (--e2e also stops Playwright's runner on 4173; --green adds the post-PD-4 cases K (the helper), P (the port base) and
//   H (visual-block.mjs itself, needs design/v0/out); the base + 1001 free too)
// Read-only for the repo: it edits no script. It runs the adapter's real capture()/close(), replays the spawn line of
// scripts/visual-block.mjs, and tries two candidate fixes on the same spawn line. Every process it leaves behind is its
// own; it reports each one and stops it at the end, so the ports are free when it exits.
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { capturePorts } from '../../../scripts/capture-ports.mjs';

// The session's ports (PD-4): BINARKA_PORT_BASE, default 4173. Case P moves a caller to OTHER_BASE.
const { e2e: E2E, gate: GATE, page: PAGE, design: DESIGN } = capturePorts();
const OTHER_BASE = E2E + 1000;

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

for (const port of [GATE, PAGE]) {
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
  const before = listener(GATE);
  console.log(`A. while capturing, listener on ${GATE}: ${before.map(ps).join(' | ')}`);
  await adapter.close();
  results.A = await report('A. adapter capture() then close()  [current code]', GATE);
}

// B. The spawn line of scripts/visual-block.mjs:109 and its kill at :256, replayed as written.
{
  const proc = spawn('npx', ['vite', 'preview', '--port', String(PAGE), '--strictPort'], { stdio: 'ignore' });
  await waitAnswer(`http://localhost:${PAGE}/`);
  proc.kill();
  results.B = await report('B. old visual-block spawn npx, proc.kill()  [before PD-4]', PAGE, proc.pid);
}

for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
await sleep(1500);

// C. Candidate fix 1 (the plan's): npx in its own process group, the group killed.
{
  const proc = spawn('npx', ['vite', 'preview', '--port', String(PAGE), '--strictPort'], { stdio: 'ignore', detached: true });
  await waitAnswer(`http://localhost:${PAGE}/`);
  process.kill(-proc.pid, 'SIGTERM');
  results.C = await report('C. npx detached, process.kill(-pid)  [fix 1]', PAGE, proc.pid);
}

// D. Candidate fix 2: no wrapper; node runs vite's own bin, so the pid held is the listener; kill() reaches it.
{
  const proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PAGE), '--strictPort'], { stdio: 'ignore' });
  await waitAnswer(`http://localhost:${PAGE}/`);
  console.log(`D. while serving, listener on ${PAGE}: ${listener(PAGE).map(ps).join(' | ')}`);
  proc.kill();
  results.D = await report('D. node vite.js directly, proc.kill()  [fix 2]', PAGE, proc.pid);
}

// E. The crash path: a caller that dies by an uncaught error before its finally/close (fix 2 plus an exit hook vs without).
for (const hook of [false, true]) {
  const body = `
    const { spawn } = require('node:child_process');
    const p = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '${PAGE}', '--strictPort'], { stdio: 'ignore' });
    ${hook ? "process.on('exit', () => p.kill());" : ''}
    const t = setInterval(async () => { try { if ((await fetch('http://localhost:${PAGE}/')).ok) { clearInterval(t); throw new Error('crash'); } } catch (e) { if (e.message === 'crash') throw e; } }, 250);
  `;
  const r = spawn(process.execPath, ['-e', body], { stdio: 'ignore' });
  await new Promise((res) => r.on('exit', res));
  const key = hook ? 'E2' : 'E1';
  results[key] = await report(`E. caller crashes, fix 2 ${hook ? 'WITH' : 'without'} process.on('exit') kill`, PAGE);
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
  const p = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '${GATE}', '--strictPort'], { stdio: 'ignore' });
  process.on('exit', () => p.kill());
  for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) process.once(sig, () => process.exit(128 + n));
  const t = setInterval(async () => { try { if ((await fetch('http://localhost:${GATE}/')).ok) { clearInterval(t); console.log('READY'); } } catch {} }, 250);
  setInterval(() => {}, 1000);
`;
// F7-F8: candidate fix 1 (npx in its own process group) with no handler, and with the same handlers killing the group.
const groupCaller = (handlers) => `
  const { spawn } = await import('node:child_process');
  const p = spawn('npx', ['vite', 'preview', '--port', '${GATE}', '--strictPort'], { stdio: 'ignore', detached: true });
  ${handlers ? `process.on('exit', () => { try { process.kill(-p.pid, 'SIGTERM'); } catch {} });
  for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) process.once(sig, () => process.exit(128 + n));` : ''}
  const t = setInterval(async () => { try { if ((await fetch('http://localhost:${GATE}/')).ok) { clearInterval(t); console.log('READY'); } } catch {} }, 250);
  setInterval(() => {}, 1000);
`;
const signalCases = [
  ['F1', realCaller, 'SIGTERM', 'adapter, current code'],
  ['F2', realCaller, 'SIGINT', 'adapter, current code'],
  ['F3', realCaller, 'SIGHUP', 'adapter, current code'],
  ['F4', realCaller, 'SIGKILL', 'adapter, current code'],
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
  console.log(`${key}. while up, listener on ${GATE}: ${listener(GATE).map(ps).join(' | ')}`);
  const gone = new Promise((res) => child.on('exit', res));
  process.kill(child.pid, sig);
  await gone;
  results[key] = await report(`${key}. caller gets ${sig}, ${what}`, GATE);
  if (key === 'F4' && process.argv.includes('--green')) {
    // K. What no handler can catch (SIGKILL) is stopped by the helper, which stops only this worktree's listeners.
    const h = spawnSync(process.execPath, ['scripts/capture-ports.mjs', '--stop'], { encoding: 'utf8' });
    console.log(`K. node scripts/capture-ports.mjs --stop -> exit ${h.status}\n${h.stdout.trim().replace(/^/gm, '   ')}`);
    leftovers.splice(0);
    results.K = h.status === 0 && (await report('K. after the helper', GATE));
  }
  for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
  await sleep(1500);
}

// P. The port base (only with --green): the adapter's preview moves to BINARKA_PORT_BASE + 1; 4174 stays free.
if (process.argv.includes('--green')) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', realCaller], { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, BINARKA_PORT_BASE: String(OTHER_BASE) } });
  await new Promise((res, rej) => {
    child.stdout.on('data', (d) => { if (String(d).includes('READY')) res(); });
    child.on('exit', () => rej(new Error('P: caller exited before READY')));
  });
  console.log(`P. BINARKA_PORT_BASE=${OTHER_BASE}, while up: ${OTHER_BASE + 1} ${listener(OTHER_BASE + 1).map(ps).join(' | ') || 'none'}; ${GATE} ${listener(GATE).length ? 'BUSY' : 'free'}`);
  results.P = listener(OTHER_BASE + 1).length === 1 && listener(GATE).length === 0;
  const gone = new Promise((res) => child.on('exit', res));
  process.kill(child.pid, 'SIGTERM');
  await gone;
  results.P2 = await report(`P. base ${OTHER_BASE} caller gets SIGTERM`, OTHER_BASE + 1);
  for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
  await sleep(1500);
}

// H. scripts/visual-block.mjs itself (only with --green; needs design/v0/out): stopped by SIGTERM while its previews are up.
if (process.argv.includes('--green')) {
  const out = execFileSync('mktemp', ['-d'], { encoding: 'utf8' }).trim();
  const vb = spawn(process.execPath, ['scripts/visual-block.mjs', '--block', 'layout', '--shots', '1440-light-default,1440-dark-default,375-light-default', '--out', out], { stdio: 'ignore' });
  let exited = null;
  const gone = new Promise((res) => vb.on('exit', (code, signal) => { exited = signal ?? code; res(exited); }));
  const end = Date.now() + 60000;
  while (!listener(PAGE).length && exited === null && Date.now() < end) await sleep(50);
  console.log(`H. while visual-block runs: ${GATE} ${listener(GATE).map(ps).join(' | ') || 'none'}; ${PAGE} ${listener(PAGE).map(ps).join(' | ') || 'none'}; ${DESIGN} ${listener(DESIGN).length ? 'up' : 'none'}`);
  if (exited === null) process.kill(vb.pid, 'SIGTERM');
  else console.log('H. visual-block exited before its page preview listened (not a signal case)');
  console.log(`H. visual-block exit: ${await gone}`);
  const free = [];
  for (const port of [GATE, PAGE, DESIGN]) free.push(await report(`H. visual-block gets SIGTERM, port ${port}`, port));
  results.H = free.every(Boolean);
  for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
  await sleep(1500);
}

// G. Port 4173: Playwright's own webServer (playwright.config.ts), stopped by a signal while it serves (only with --e2e;
// the runner builds first). The signal goes to the runner's pid only, as in F.
if (process.argv.includes('--e2e')) {
  for (const [key, sig] of [['G1', 'SIGTERM'], ['G2', 'SIGINT'], ['G3', 'SIGKILL']]) {
    if (listener(E2E).length) throw new Error(`port ${E2E} is busy`);
    const runner = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--project=layout', 'e2e/nfr-18-flash.spec.ts', '--repeat-each=50'], { stdio: 'ignore' });
    const end = Date.now() + 120000;
    while (!listener(E2E).length && Date.now() < end) await sleep(250);
    await sleep(1500);
    console.log(`${key}. while up, listener on ${E2E}: ${listener(E2E).map(ps).join(' | ')}`);
    const gone = new Promise((res) => runner.on('exit', res));
    process.kill(runner.pid, sig);
    await gone;
    results[key] = await report(`${key}. playwright runner gets ${sig}`, E2E);
    for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
    await sleep(1500);
  }
}

for (const pid of leftovers.splice(0)) process.kill(pid, 'SIGTERM');
await sleep(1500);
console.log(`\nafter cleanup: ${[E2E, GATE, PAGE, DESIGN, OTHER_BASE + 1].map((p) => `${p} ${listener(p).length ? 'BUSY' : 'free'}`).join(', ')}`);
console.log(JSON.stringify(results));
