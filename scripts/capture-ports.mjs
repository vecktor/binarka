// The capture ports of this worktree, and a way to stop the servers it left behind (PD-4, docs/qa/improvements/PD-4-*).
//
// One base port per session: BINARKA_PORT_BASE (default 4173). The roles sit at fixed offsets:
//   +0 e2e      the Playwright preview of the built page (playwright.config.ts)
//   +1 gate     the NFR-14 adapter's own preview (scripts/check-visual-parity-adapters.mjs; the config's localUrl at the default)
//   +2 refname  the config's referenceUrl names the design build here; nothing binds it (the adapter reads the frozen PNGs)
//   +3 page     scripts/visual-block.mjs's page preview (geometry channel)
//   +4 design   the design build served by scripts/visual-block.mjs and scripts/freeze-design-*.mjs
// Parallel sessions that pick different bases share no port. The defaults are the ports every earlier run used.
//
// Usage: node scripts/capture-ports.mjs          list the listeners on the five ports, with pid, command and working directory
//        node scripts/capture-ports.mjs --stop   also stop the listeners whose working directory is this worktree (never another's);
//                                                exit 1 if one of them still listens 2 s later
// A listener left by SIGKILL, or by a Playwright runner stopped with SIGTERM (it handles SIGINT only), is what --stop is for.
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function portBase(env = process.env) {
  const raw = env.BINARKA_PORT_BASE;
  if (raw === undefined || raw === '') return 4173;
  const base = Number(raw);
  if (!Number.isInteger(base) || base < 1024 || base > 65530) throw new Error(`BINARKA_PORT_BASE must be an integer from 1024 to 65530, not "${raw}"`);
  return base;
}

export function capturePorts(env = process.env) {
  const base = portBase(env);
  return { e2e: base, gate: base + 1, refname: base + 2, page: base + 3, design: base + 4 };
}

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};
const listeners = (port) => run('lsof', ['-nP', '-t', `-iTCP:${port}`, '-sTCP:LISTEN']).split('\n').filter(Boolean).map(Number);
const command = (pid) => run('ps', ['-o', 'command=', '-p', String(pid)]).trim();
const cwdOf = (pid) => {
  const line = run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']).split('\n').find((l) => l.startsWith('n'));
  if (!line) return null;
  try {
    return realpathSync(line.slice(1));
  } catch {
    return line.slice(1);
  }
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const stop = process.argv.includes('--stop');
  const root = realpathSync(resolve(fileURLToPath(new URL('..', import.meta.url))));
  const ports = capturePorts();
  console.log(`worktree ${root}, BINARKA_PORT_BASE ${process.env.BINARKA_PORT_BASE ?? '(unset)'}, base ${ports.e2e}`);
  const ours = [];
  for (const [role, port] of Object.entries(ports)) {
    const pids = listeners(port);
    if (!pids.length) console.log(`${String(port).padEnd(6)} ${role.padEnd(8)} free`);
    for (const pid of pids) {
      const cwd = cwdOf(pid);
      const mine = cwd === root;
      if (mine) ours.push({ pid, port });
      console.log(`${String(port).padEnd(6)} ${role.padEnd(8)} pid ${pid} ${mine ? 'THIS worktree' : `not ours (${cwd ?? 'cwd unknown'})`}: ${command(pid)}`);
    }
  }
  if (!stop) process.exit(0);
  for (const { pid } of ours) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch { /* already gone */ }
  }
  await new Promise((r) => setTimeout(r, 2000));
  const left = ours.filter(({ port, pid }) => listeners(port).includes(pid));
  console.log(ours.length ? `stopped ${ours.length - left.length} of ${ours.length} listener(s) of this worktree` : 'nothing of this worktree to stop');
  for (const { port, pid } of left) console.error(`still listening: pid ${pid} on ${port}`);
  process.exit(left.length ? 1 : 0);
}
