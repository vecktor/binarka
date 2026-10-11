# PD-4: a stopped capture leaves its `vite preview` listening

Status: **PROPOSED, awaiting the user's approval.** Drafted 2026-10-11 from 17:55 (UTC+5:30) by session C of the parallel G2 plan (`claude/modest-darwin-process`; `docs/handoff/parallel-g2-plan-2026-10-11.md`, «C: the process stream»; the user's «Draft both», autonomy-log row 170). No script is edited before the yes. The locked adapter changes only in a commit with `Refs: PD-4`.

## Defect

- The capture path starts a `vite preview` it does not always stop. Seen in the palette block: an orphan on 4174 made the first attempt at run 7 refuse all 168 captures (autonomy-log row 159), and a re-run of the per-block tool hit it and committed a crash log as evidence (row 160, COR-2). Seen again on 4174 and 4176 in the same session.
- The servers:

  | Port | Started by | How | Locked |
  |---|---|---|---|
  | 4173 | `playwright.config.ts` `webServer` (e2e, a11y) | `npm run build && npx vite preview`, by Playwright | no |
  | 4174 | `scripts/check-visual-parity-adapters.mjs` `startServer` (the gate, and `visual-block.mjs` through it) | `spawn('npx', ['vite', 'preview', …])`; port from `localUrl` in `quality/visual-parity.config.json` | **yes** |
  | 4175 | nobody (the config's `referenceUrl` names the design build; the parity adapter does not fetch it) | — | — |
  | 4176 | `scripts/visual-block.mjs` `startPreview` | `spawn('npx', ['vite', 'preview', …])` | no |
  | 4177 | `visual-block.mjs`, `freeze-design-geometry.mjs`, `freeze-design-paint.mjs` | an in-process `http` server | no |

  The 4177 servers live inside the caller's process and die with it; they cannot orphan.

## The earlier diagnosis was wrong

Rows 159 and 160 say the capture "kills `npx`, not its `vite` child". Measured, that is not so (`PD-4-proof.txt`, cases A and B): on this machine (npm 10.9.4) `npx` passes SIGTERM on to `vite`, and both the adapter's `close()` and `visual-block.mjs`'s `proc.kill()` free the port. **The orphan comes from the abnormal exit:** a caller that is stopped by a signal, or that dies before its `finally`, never calls `close()`, and `npx` and `vite` carry on, reparented.

| Case (`PD-4-proof.txt`) | Result |
|---|---|
| A, B: clean close, as is | port free |
| E1: the caller dies of an uncaught error before `close()` | **orphan** |
| F1 to F3: the adapter's caller gets SIGTERM, SIGINT or SIGHUP (to its pid) | **orphan**, all three |
| F4: the caller gets SIGKILL | **orphan** |
| G1, G3: the Playwright runner gets SIGTERM or SIGKILL | **orphan** on 4173 |
| G2: the Playwright runner gets SIGINT | port free (Playwright handles SIGINT only) |

**What likely stopped the callers in rows 159 and 160 is a hypothesis, not a finding:** a per-block run of 64 shots takes minutes, longer than the agent's default command timeout, and the tool that stops a timed-out command signals it. Not measured.

## Fix (proposed)

1. **Spawn `vite` without the `npx` wrapper.** `spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', port, '--strictPort'])`, so the pid the caller holds is the listener itself (case D). Same version of vite, same flags, same cwd.
2. **Stop the preview on every exit the process can see.** When the preview starts, register `process.on('exit', () => server.kill())` and handlers for SIGINT, SIGTERM and SIGHUP that exit with 128 + the signal number (the exit hook then stops the preview). Registered when the server starts, not when the module loads, so a test that only imports the adapter is unaffected. Measured: E2 and F5, F9, F10 free the port (uncaught error, SIGTERM, SIGINT, SIGHUP).
3. Apply 1 and 2 in `scripts/check-visual-parity-adapters.mjs` (**locked**: `Refs: PD-4` and a re-seal with `--init-lock --adaptation "PD-4: …"`) and in `scripts/visual-block.mjs` for its 4176 preview (**not locked**; changed in the same commit for one review).
4. **A small helper for what no in-process fix can reach** (SIGKILL: F4, F6; Playwright's 4173 on SIGTERM: G1). `scripts/capture-ports.mjs` lists the listeners on 4173 to 4177 with their pid, command and working directory (`lsof -a -p <pid> -d cwd`), and with `--stop` stops only those whose working directory is this worktree. This makes the plan's manual rule («stop only orphans of your own worktree») one command. New, not locked; built only on the user's yes.

### Why not the process group (the plan's first idea)

Fix 1 (`detached: true`, then `process.kill(-pid)`) works on the clean path (C), where the current code already works. On the failing path it needs the same handlers (F7 without: orphan; F8 with: port free), so it adds nothing over fix 2. It also takes the preview out of the terminal's foreground group, so a Ctrl-C in the terminal would no longer reach it directly. Fix 2 keeps one process and the default group.

## Ports by an environment variable (a design choice for the user)

Today every worktree uses the same five ports, so parallel sessions share one `mkdir` lock. Options:

- **P1, keep the fixed ports and the lock** (today). No change; the lock is a rule, not a mechanism, and an orphan blocks every session until someone stops it.
- **P2, one base port per session**, for example `BINARKA_PORT_BASE` (default 4173: e2e +0, gate preview +1, page preview +3, design build +4). Five places read it: `playwright.config.ts`, the adapter (locked; it would override the port of `localUrl`), `visual-block.mjs` and the two freeze scripts. The defaults keep every recorded command valid. Sessions pick different bases and need no port lock.
- **P3, ports chosen by the operating system**, as the shell slice's e2e already does for its design server (`openspec/changes/archive/2026-10-11-update-panel-shell/design.md`, decision 9). No coordination at all; but the config's `localUrl` becomes nominal, and Playwright loads its config in every worker, so the chosen port has to be passed through the environment from the main process.

Under P2 or P3 one question stays open: **two full captures at the same time load the CPU**, and the capture settles for a fixed 300 ms. PD-3's determinism probe ran serially. Whether parallel captures stay byte-stable is not measured; until it is, the lock could stay for full `check:visual` runs, and only the port clash goes away.

## Red to green proof

- **Red** (`PD-4-proof.txt`, 2026-10-11 18:07 to 18:09, lock held, ports free before and after): E1, F1 to F4, G1 and G3 leave a listener; the earlier diagnosis is disproved by A and B. Three earlier runs (17:58, 17:59 and 18:02, with earlier versions of the probe) gave the same verdicts for the cases they had (`PD-4-proof-runs-1-3.txt`).
- **Green is earned when**, after the yes, the same probe run against the changed adapter (real code, case F) frees the port for SIGTERM, SIGINT, SIGHUP and the uncaught error; SIGKILL stays red and the helper stops that listener; `check-factory-integrity` passes after the re-seal. Not run yet.
- **Sampling, declared:** one machine (macOS 26.5.2, Node 22.21.1, npm 10.9.4), one shot, one e2e file; signals to the caller's pid only. A terminal Ctrl-C (signal to the whole group) is not measured.

## How the two PDs meet

An orphan never measures silently: since PD-2 the adapter refuses a port that something else answers on. It fails loudly instead (the first attempt at run 7). But the checker writes a failed capture into the shot's `docs/qa/visual-diff/*/report.json` as `score: null, pass: false` (`PD-5-proof.txt`), so an orphan also overwrites the committed evidence. That overwrite is the mechanism PD-5 is about.

## Rollback

Revert the `Refs: PD-4` commit; that restores the PD-3 adapter and lock. The helper is a new file and goes with it.
