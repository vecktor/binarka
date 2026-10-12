// Recorded proofs of Бінарка (G6, G7): one clip per capability, each DRIVING the real flow and ASSERTING the requirements in its
// `proof`. Adapted from the factory template (stream R of wave 3, docs/handoff/delivery-plan-2026-10-12.md section 2.3).
//
// - Its own headless Chromium; never the user's browser, never a Save-As dialog.
// - Its own `vite preview` of the built page on the page port of BINARKA_PORT_BASE (+3, scripts/capture-ports.mjs). It fails when
//   something already answers there (it records only the preview it starts), and the preview never outlives it (stopOnExit, PD-4).
// - "Record" and "prove" are one step: every clip asserts what it shows, and a clip that leaves an id of its `proof` unasserted FAILS.
// - The engine is the oracle: `src/engine` and `src/ui/strings.ts` are loaded through tsx, so a clip compares what the page shows with
//   what the engine and the string table say (the board of a seed, the hint of a board, the violations, the number of solutions).
// - Engine requirements go through the page where the page shows them: FR-119 capture boards (window.__binarkaCaptureBoard, set by an
//   init script before the page mounts) for violations, the win and the hints. The CLI clip runs `src/cli.ts` through tsx (as
//   `npm run cli` does), asserts its English output and shows it on a terminal page; the few engine rows with no page or CLI path
//   (FR-25: no board with valid FR-119 givens leaves the page without a hint; FR-50: the CLI grammar stops a fractional size first)
//   are engine calls shown on the same terminal page, labelled as such.
// - Every still is taken after a settle: fonts ready, network idle, two animation frames and a pause; the caption is removed first.
//
// Output (read by scripts/check-recordings.mjs, scripts/check-traceability.mjs --strict-recordings, the vision-verify workflow and
// scripts/check-vision.mjs):
//   docs/qa/demo-recordings/<id>.webm   the video
//   docs/qa/demo-recordings/<id>.png    the settled still
//   docs/qa/demo-recordings/<id>.md     the explainer (every assertion, in order)
//   docs/qa/demo-recordings/manifest.json { kind, results: [{ id, title, proof, video, screenshot, explainer, asserted, assertions }] }
//
// Run: `npm run qa:record-demos` (builds first). Options: `--only <id>[,<id>]` records those clips into the existing manifest;
// `--vision-probe` writes only the NFR-11 probe still with the non-colour cues removed (docs/qa/vision-probe/), for the red run of
// check:vision. Env: BINARKA_PORT_BASE (this session's base).
import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'tsx/esm/api';
import { capturePorts } from './capture-ports.mjs';

register();
const root = process.cwd();
const load = (rel) => import(pathToFileURL(join(root, rel)).href);
const E = await load('src/engine/index.ts');
const { MAX_ATTEMPTS, buildPuzzle } = await load('src/engine/generator.ts');
const { solveByRules } = await load('src/engine/rule-solve.ts');
const S = await load('src/ui/strings.ts');

const argv = process.argv.slice(2);
const flagValue = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const OUT_DIR = 'docs/qa/demo-recordings';
const PROBE_DIR = 'docs/qa/vision-probe';
const PORT = capturePorts().page;
const BASE_URL = `http://localhost:${PORT}/`;
const VIEWPORT = { width: 1280, height: 800 };
const CELL = '[data-board] [data-cell]';
const PACE = 350; // ms between visible steps, so a person can follow the video

const sel = {
  board: '[data-board]',
  summary: '[data-action="setup"]',
  hint: '[data-action="hint"]',
  reset: '[data-action="reset"]',
  newPuzzle: '[data-action="new"]',
  rules: '[data-action="rules"]',
  rulesPanel: '[data-section="rules"]',
  rulesClose: '.rules-close',
  settings: '[data-action="settings"]',
  settingsPanel: '[data-section="settings"]',
  settingsClose: '[data-action="settings-close"]',
  sheet: '[data-section="setup"]',
  size: (n) => `[data-size-option="${n}"]`,
  level: (i) => `[data-control="level"] [role="radio"] >> nth=${i}`,
  levels: '[data-control="level"] [role="radio"]',
  start: '[data-action="setup-start"]',
  setupClose: '[data-action="setup-close"]',
  dialog: 'dialog[data-dialog="confirm"]',
  yes: '[data-confirm="yes"]',
  no: '[data-confirm="no"]',
  hintMessage: '[data-message="hint"]',
  winMessage: '[data-message="win"]',
  idle: '[data-message="idle"]',
  theme: (v) => `[data-theme-option="${v}"]`,
  language: (v) => `[data-language-option="${v}"]`,
  cell: (r, c) => `[data-board] [data-cell][data-row="${r + 1}"][data-col="${c + 1}"]`,
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Engine-side helpers (Node). Grids are arrays of rows of 0, 1 or null, 0-based like the engine.

const copy = (g) => g.map((row) => [...row]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const emptyGrid = (n) => Array.from({ length: n }, () => Array(n).fill(null));
const overlay = (givens, entries) => givens.map((row, r) => row.map((v, c) => (v !== null ? v : entries[r][c])));
const cyrillic = /[Ѐ-ӿ]/;

/** The seeded Math.random the init script installs (the same arithmetic as e2e/helpers.ts and the adapter). */
function seededRandom(start) {
  let a = start >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The page's seed source (src/ui/seed.ts) over that Math.random: the seeds the page takes, in order. */
function seedStream(start) {
  const random = seededRandom(start);
  let previous = null;
  return () => {
    let seed = Math.floor(random() * 2147483648);
    while (seed === previous) seed = Math.floor(random() * 2147483648);
    previous = seed;
    return seed;
  };
}

/** The puzzle the page shows for one generation: a seed per attempt, a retry only on the engine's run-out (FR-88), at most 3. */
function pagePuzzle(next, n, level) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const seed = next();
    try {
      return { seed, puzzle: E.generate(n, seed, level) };
    } catch (error) {
      if (!(error instanceof E.GenerationRunOutError)) throw error;
    }
  }
  throw new Error(`the page would fail to generate ${n}x${n} level ${level}`);
}

/** Walk the hint engine (ceiling 4, as the page) from the givens of (n, seed, level) to the first board whose hint is `rule`. */
function boardBeforeRule(rule, n, level, seed) {
  const puzzle = E.generate(n, seed, level);
  const entries = emptyGrid(n);
  for (let step = 0; step < n * n; step++) {
    const board = overlay(puzzle.givens, entries);
    const h = E.hint(board, 4);
    if (h.kind !== 'fill') break;
    if (h.rule === rule) return { givens: puzzle.givens, entries: copy(entries), board, hint: h, n, level, seed };
    entries[h.row][h.col] = h.value;
  }
  return null;
}

function techniqueBoard(rule) {
  for (const [n, level] of [[6, 2], [6, 3], [6, 4], [8, 3], [8, 4]]) {
    for (let seed = 1; seed < 60; seed++) {
      const found = boardBeforeRule(rule, n, level, seed);
      if (found) return found;
    }
  }
  throw new Error(`no board found whose next hint is "${rule}"`);
}

/** A deterministic pseudo-random choice for the board searches (never Math.random). */
function chooser(seed) {
  const random = seededRandom(seed);
  return (k) => Math.floor(random() * k);
}

/**
 * Entries over the givens of one puzzle that break exactly one kind of rule: `kind` is the engine's violation rule ('three', 'count',
 * 'duplicate') and `axis` 'row' or 'col'. The entries come from the solution except in the line made to break.
 */
function violationBoard(kind, axis) {
  for (let seed = 1; seed < 200; seed++) {
    const { givens, solution } = E.generate(6, seed, 1);
    const n = 6;
    const at = (line, i) => (axis === 'row' ? [line, i] : [i, line]);
    const attempt = (entries) => {
      const board = overlay(givens, entries);
      const v = E.findViolations(board);
      return v.length >= 1 && v.every((x) => x.rule === kind && x.axis === axis) ? { givens, entries, board, violations: v, solution } : null;
    };
    for (let line = 0; line < n; line++) {
      if (kind === 'three' || kind === 'count') {
        // three: a run of three equal digits; count: four of one digit with no run of three (d d x d d), others empty
        const patterns =
          kind === 'three'
            ? [0, 1, 2, 3].flatMap((s) => [0, 1].map((d) => Array.from({ length: n }, (_, i) => (i >= s && i < s + 3 ? d : null))))
            : [0, 1].map((d) => [d, d, null, d, d, null]);
        for (const pattern of patterns) {
          const entries = emptyGrid(n);
          let ok = true;
          pattern.forEach((v, i) => {
            if (v === null) return;
            const [r, c] = at(line, i);
            if (givens[r][c] !== null) ok &&= givens[r][c] === v;
            else entries[r][c] = v;
          });
          if (!ok) continue;
          const found = attempt(entries);
          if (found) return found;
        }
      } else {
        for (let other = 0; other < n; other++) {
          if (other === line) continue;
          const values = Array.from({ length: n }, (_, i) => (axis === 'row' ? solution[other][i] : solution[i][other]));
          const entries = emptyGrid(n);
          let ok = true;
          for (let i = 0; i < n; i++) {
            const [r1, c1] = at(other, i);
            const [r2, c2] = at(line, i);
            if (givens[r1][c1] === null) entries[r1][c1] = values[i];
            if (givens[r2][c2] !== null) ok &&= givens[r2][c2] === values[i];
            else entries[r2][c2] = values[i];
          }
          if (!ok) continue;
          const found = attempt(entries);
          if (found) return found;
        }
      }
    }
  }
  throw new Error(`no board found that breaks only "${kind}" on ${axis}s`);
}

/** Givens of a valid grid that admit no solution (one given flipped, no rule broken) and givens that admit two or more. */
function badGivens() {
  const { solution } = E.generate(6, 5, 1);
  const pick = chooser(17);
  let zero = null;
  for (let tries = 0; tries < 5000 && zero === null; tries++) {
    const g = emptyGrid(6);
    for (let k = 0; k < 12; k++) {
      const r = pick(6);
      const c = pick(6);
      g[r][c] = solution[r][c];
    }
    const r = pick(6);
    const c = pick(6);
    g[r][c] = 1 - solution[r][c];
    if (E.findViolations(g).length === 0 && E.countSolutions(g) === 0) zero = g;
  }
  const two = emptyGrid(6);
  two[0][0] = solution[0][0];
  two[5][5] = solution[5][5];
  if (zero === null || E.countSolutions(two) !== 2) throw new Error('no 0-solution or 2-solution givens found');
  return { zero, two, solution };
}

/** The design's fixture boards (design/v0/lib/boards.json, A-56) as FR-119 values, as the adapter reads them. */
const boards = JSON.parse(readFileSync('design/v0/lib/boards.json', 'utf8'));
function fixture(name, { level = 1, hinted = true } = {}) {
  const spec = boards[name];
  const givens = [];
  const entries = [];
  let cell;
  spec.rows.forEach((row, r) => {
    const tokens = row.trim().split(/\s+/);
    givens.push(tokens.map((t) => (t[0] === 'g' ? Number(t[1]) : null)));
    entries.push(
      tokens.map((t, c) => {
        if (t[0] === 'p') return Number(t[1]);
        if (t[0] !== 'h') return null;
        if (!hinted) return null;
        cell = [r, c];
        return Number(t[1]);
      }),
    );
  });
  return { size: spec.size, level, givens, entries, ...(cell ? { hinted: cell } : {}) };
}

/** The four cell states of NFR-11 on one board: the fixture's violation, its givens and entries, and a hinted entry. */
function fourStateBoard() {
  const value = fixture('fixtureBoard');
  value.hinted = [1, 0]; // row 2, column 1: the entry 1, outside the violation
  return value;
}

/** The FR-119 value for givens and entries. */
const captureValue = (givens, entries, level = 1, hinted) => ({ size: givens.length, level, givens, entries, ...(hinted ? { hinted } : {}) });

/** The board the page should show for a capture value. */
const captureBoard = (value) => overlay(value.givens, value.entries);

// ---------------------------------------------------------------------------------------------------------------------------------
// The page driver.

function makeDriver(page, clip, log) {
  const asserted = new Set();
  const t = {
    page,
    log,
    /** Assert `cond` for the ids (a string or an array); the ids count as asserted only when it holds. */
    check(ids, cond, msg) {
      const list = Array.isArray(ids) ? ids : [ids];
      if (!cond) throw new Error(`${list.join(', ')}: ${msg}`);
      for (const id of list) asserted.add(id);
      log.push(`${list.join(', ')}: ${msg}`);
    },
    asserted,
    async pause(ms = PACE) {
      await page.waitForTimeout(ms);
    },
    /** A caption on the video (outside the page root, no pointer events); removed before every still. */
    async say(text) {
      await page.evaluate((value) => {
        let el = document.getElementById('rec-caption');
        if (!el) {
          el = document.createElement('div');
          el.id = 'rec-caption';
          el.setAttribute('aria-hidden', 'true');
          el.style.cssText =
            'position:fixed;left:8px;bottom:8px;z-index:2147483647;max-width:46%;padding:6px 10px;border-radius:6px;' +
            'background:rgba(20,20,20,.82);color:#fff;font:13px/1.35 system-ui,sans-serif;pointer-events:none';
          document.documentElement.appendChild(el);
        }
        el.textContent = value;
      }, text);
      await t.pause(PACE);
    },
    /** Load the page with an FR-119 board (or none), a seed for the page's Math.random and stored preferences. */
    async open({ board = null, seed = 1, prefs = {}, storageThrows = false } = {}) {
      if (!page.url().startsWith(BASE_URL)) await page.goto(BASE_URL, { waitUntil: 'load' });
      await page.evaluate(
        ({ board, seed, prefs, storageThrows }) => {
          sessionStorage.clear();
          sessionStorage.setItem('rec-seed', String(seed));
          if (board) sessionStorage.setItem('rec-board', JSON.stringify(board));
          if (storageThrows) sessionStorage.setItem('rec-storage-throws', '1');
          try {
            localStorage.clear();
            for (const [key, value] of Object.entries(prefs)) localStorage.setItem(key, value);
          } catch {
            // the previous load blocked storage on purpose (FR-115); the next load has it back
          }
        },
        { board, seed, prefs, storageThrows },
      );
      await page.goto(BASE_URL, { waitUntil: 'load' });
      await page.locator(CELL).first().waitFor();
      await t.pause(PACE);
    },
    /** The board as the page shows it: values, givens, classes, labels. */
    async read() {
      const cells = await page.locator(CELL).evaluateAll((els) =>
        els.map((c) => ({
          r: Number(c.getAttribute('data-row')) - 1,
          c: Number(c.getAttribute('data-col')) - 1,
          text: c.textContent ?? '',
          given: c.getAttribute('data-given') === 'true',
          classes: [...c.classList],
          label: c.getAttribute('aria-label'),
          invalid: c.getAttribute('aria-invalid'),
          disabled: c.getAttribute('aria-disabled'),
          tag: c.tagName,
          type: c.getAttribute('type'),
          role: c.getAttribute('role'),
          hasDisabledAttr: c.hasAttribute('disabled'),
        })),
      );
      const n = Math.round(Math.sqrt(cells.length));
      const values = emptyGrid(n);
      const givens = emptyGrid(n);
      for (const cell of cells) {
        values[cell.r][cell.c] = cell.text === '' ? null : Number(cell.text);
        if (cell.given) givens[cell.r][cell.c] = Number(cell.text);
      }
      const withClass = (name) => cells.filter((x) => x.classes.includes(name)).map((x) => [x.r, x.c]);
      return { n, cells, values, givens, withClass };
    },
    async text(selector) {
      return (await page.locator(selector).first().textContent()) ?? '';
    },
    async clickCell(r, c, times = 1) {
      for (let i = 0; i < times; i++) {
        await page.locator(sel.cell(r, c)).click({ force: true }); // a given is aria-disabled, which Playwright treats as not enabled
        await t.pause(PACE / 2);
      }
    },
    async press(selector) {
      await page.locator(selector).first().click({ force: true }); // an unavailable level is aria-disabled: the press must still happen (FR-73)
      await t.pause(PACE);
    },
    async isOpen(selector) {
      return page.locator(selector).first().evaluate((el) => el.matches(':popover-open'));
    },
    async focused() {
      return page.evaluate(() => {
        const a = document.activeElement;
        if (!a) return null;
        return a.getAttribute('data-action') ?? a.getAttribute('data-confirm') ?? a.getAttribute('data-size-option') ??
          a.getAttribute('data-theme-option') ?? a.getAttribute('data-language-option') ??
          (a.hasAttribute('data-cell') ? `cell ${a.getAttribute('data-row')},${a.getAttribute('data-col')}` : a.textContent);
      });
    },
    /** Settle and take the clip's still (once; a later call replaces it). `element` crops to that element plus a margin. */
    async still({ element = null, margin = 16, fullPage = true } = {}) {
      await page.evaluate(() => document.getElementById('rec-caption')?.remove());
      await settle(page);
      let clipRect;
      if (element) {
        const box = await page.locator(element).first().boundingBox();
        if (!box) throw new Error(`still: ${element} is not visible`);
        clipRect = {
          x: Math.max(0, Math.floor(box.x - margin)),
          y: Math.max(0, Math.floor(box.y - margin)),
          width: Math.ceil(box.width + 2 * margin),
          height: Math.ceil(box.height + 2 * margin),
        };
      }
      t.stillPng = await page.screenshot({ fullPage: element ? false : fullPage, animations: 'disabled', caret: 'hide', ...(clipRect ? { clip: clipRect } : {}) });
      t.stillAt = clip.id;
    },
  };
  return t;
}

async function settle(page, ms = 600) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(ms);
}

/** Per context: the FR-119 board, the seeded Math.random, an optional throwing localStorage and a probe of <html> at the first <body>. */
function initScript() {
  const ss = window.sessionStorage;
  const start = Number(ss.getItem('rec-seed') ?? '1');
  let a = start >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const raw = ss.getItem('rec-board');
  if (raw) window.__binarkaCaptureBoard = JSON.parse(raw);
  if (ss.getItem('rec-storage-throws') === '1') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('storage is blocked', 'SecurityError');
      },
    });
  }
  const observer = new MutationObserver(() => {
    if (document.body && !window.__recAtBody) {
      const html = document.documentElement;
      window.__recAtBody = { theme: html.getAttribute('data-theme'), lang: html.getAttribute('lang'), title: document.title, meta: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null, mounted: (document.getElementById('app')?.childElementCount ?? 0) > 0 };
      observer.disconnect();
    }
  });
  observer.observe(document, { childList: true, subtree: true });
}

// ---------------------------------------------------------------------------------------------------------------------------------
// The CLI and the terminal page.

const TSX_CLI = 'node_modules/tsx/dist/cli.mjs';
function runCli(args) {
  const out = spawnSync(process.execPath, [TSX_CLI, 'src/cli.ts', ...args], { encoding: 'utf8' });
  return { args, stdout: out.stdout, stderr: out.stderr, status: out.status };
}
const gridText = (grid) => grid.map((row) => row.map((v) => (v === null ? '.' : String(v))).join(' ')).join('\n') + '\n';
const oneEnglishSentence = (text) => /^[A-Z][\x20-\x7E]*\.\n$/.test(text) && !/[.!?] [A-Z]/.test(text.trim().slice(0, -1)) && !cyrillic.test(text);

const TERMINAL = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Binarka CLI</title><style>
  body{margin:0;background:#16181d;color:#e8e6e3;font:15px/1.45 ui-monospace,Menlo,Consolas,monospace}
  main{padding:20px 28px} h1{font:600 17px system-ui,sans-serif;margin:0 0 14px;color:#fff}
  .cmd{color:#8fd18f;margin-top:12px} .out{white-space:pre;color:#f2f0ec} .err{white-space:pre;color:#ffb4a8}
  .exit{color:#9aa4b2} .engine{color:#9ecbff;margin-top:12px} .note{color:#c8c2b8;font:13px system-ui,sans-serif;margin-top:4px}
</style></head><body><main><h1>Бінарка CLI: npm run cli (src/cli.ts through tsx), then engine calls</h1><div id="log"></div></main></body></html>`;

async function terminalAppend(page, html) {
  await page.evaluate((value) => {
    const log = document.getElementById('log');
    log.insertAdjacentHTML('beforeend', value);
    window.scrollTo(0, document.body.scrollHeight);
  }, html);
  await page.waitForTimeout(PACE);
}
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// ---------------------------------------------------------------------------------------------------------------------------------
// The clips: one per capability. `proof` lists every id the clip asserts; a missing assertion fails the clip.

const LEVEL1_SEED = 3; // the page's Math.random start for the generated-board clips

const CLIPS = [
  {
    id: '01-play-board',
    title: 'The play page shows a generated puzzle: givens, cycling cells, header, logo, messages',
    proof: ['FR-13', 'FR-14', 'FR-15', 'FR-31', 'FR-32', 'FR-33', 'FR-34', 'FR-63', 'FR-68', 'FR-71', 'FR-72'],
    async run(t) {
      const { page } = t;
      await t.open({ seed: LEVEL1_SEED });
      await t.say('A generated 6×6 puzzle; the engine replays the same seed');
      const next = seedStream(LEVEL1_SEED);
      const { seed, puzzle } = pagePuzzle(next, 6, 1);
      const b = await t.read();
      t.check('FR-31', b.n === 6, 'the page shows a 6×6 grid by default');
      t.check('FR-13', same(b.givens, puzzle.givens) && b.cells.every((x) => x.given === (puzzle.givens[x.r][x.c] !== null)), `the board is the generator's 6×6 puzzle for seed ${seed}, level 1: givens 0 or 1, the rest empty`);
      t.check('FR-15', E.countSolutions(b.givens) === 1, 'the shown givens have exactly one solution (countSolutions = 1)');
      t.check('FR-32', b.cells.every((x) => x.given === x.classes.includes('cell-given')) && b.cells.some((x) => x.given) && b.cells.some((x) => !x.given), 'every given carries data-given="true" and cell-given; no other cell does');
      await page.reload();
      await page.locator(CELL).first().waitFor();
      const again = await t.read();
      t.check('FR-14', same(again.givens, b.givens) && same(E.generate(6, seed, 1).givens, puzzle.givens), 'the same seed gives the identical puzzle after a reload, and in the engine');
      const given = b.cells.find((x) => x.given);
      const empty = b.cells.find((x) => !x.given);
      await t.say('A given does not change; a player cell cycles empty → 0 → 1 → empty');
      await t.clickCell(given.r, given.c);
      t.check('FR-33', (await t.read()).values[given.r][given.c] === b.values[given.r][given.c], `a click on the given at row ${given.r + 1}, column ${given.c + 1} leaves it as it was`);
      const seen = [];
      for (let i = 0; i < 3; i++) {
        await t.clickCell(empty.r, empty.c);
        seen.push(await page.locator(sel.cell(empty.r, empty.c)).textContent());
      }
      t.check('FR-34', same(seen, ['0', '1', '']), `clicks on row ${empty.r + 1}, column ${empty.c + 1} show «0», «1», then empty`);
      const order = await page.evaluate(() => {
        const app = document.getElementById('app');
        const kids = [...app.children].map((el) => el.getAttribute('data-action') ?? el.getAttribute('data-section') ?? el.getAttribute('data-dialog') ?? el.className ?? el.tagName);
        const header = [...app.querySelector('header').children].map((el) => el.getAttribute('data-action') ?? el.tagName);
        const buttons = [...app.querySelector('.buttons').children].map((el) => el.getAttribute('data-action'));
        const messages = [...app.querySelector('.messages').children].map((el) => el.getAttribute('data-message'));
        const boardHost = app.querySelector('[data-board]').parentElement.className;
        return { kids, header, buttons, messages, boardHost };
      });
      t.check('FR-68', same(order.kids.slice(0, 5), ['page-header', 'setup', 'board-host', 'buttons', 'messages']) && same(order.header, ['H1', 'settings', 'rules']) && same(order.buttons, ['hint', 'reset', 'new']) && same(order.messages, ['idle', 'hint', 'win']) && ['rules', 'setup', 'settings', 'confirm'].every((k) => order.kids.slice(5).includes(k)), 'document order: header (title, settings, rules), summary, board, hint/reset/new, idle/hint/win; the sheet, panels and dialog outside it');
      const status = await page.evaluate(() => ['hint', 'win'].map((k) => { const el = document.querySelector(`[data-message="${k}"]`); return { role: el.getAttribute('role'), text: el.textContent, display: getComputedStyle(el).display }; }));
      t.check('FR-63', status.every((s) => s.role === 'status' && s.text === '' && s.display !== 'none'), 'the hint and win messages have role="status", are present and empty, and are rendered (not display: none)');
      const idle = await page.locator(sel.idle);
      t.check('FR-71', (await idle.textContent()) === S.IDLE && (await idle.isVisible()) && (await idle.getAttribute('role')) === null, 'the idle line shows «Натискайте клітинки, щоб ставити 0 і 1. …» (U+00A0 around «і»), visible while both messages are empty, with no role');
      const logo = await page.evaluate(() => {
        const svg = document.querySelector('header h1 svg.logo');
        return svg && { hidden: svg.getAttribute('aria-hidden'), texts: svg.querySelectorAll('text').length, words: svg.textContent.trim(), img: document.querySelectorAll('header img').length, cells: svg.querySelectorAll('.logo-cell').length, bars: svg.querySelectorAll('.logo-digit').length, rings: svg.querySelectorAll('.logo-digit-ring').length };
      });
      t.check('FR-72', logo && logo.hidden === 'true' && logo.texts === 0 && logo.words === '' && logo.img === 0 && logo.cells === 4 && logo.bars === 2 && logo.rings === 2, 'the header logo is an inline SVG (no image file), aria-hidden, no text: a 2×2 board of two bars (1) and two rings (0)');
      await t.still();
    },
  },
  {
    id: '02-keyboard-a11y',
    title: 'Cells are buttons: Tab order, Enter and Space, labels, roles and the focus ring',
    proof: ['FR-59', 'FR-60', 'FR-61', 'FR-62', 'FR-65', 'FR-69', 'FR-70'],
    async run(t) {
      const { page } = t;
      const value = fixture('fixtureBoard');
      await t.open({ board: value });
      const b = await t.read();
      t.check('FR-69', b.cells.every((x) => x.tag === 'BUTTON' && x.type === 'button' && !x.hasDisabledAttr && (x.given ? x.disabled === 'true' : x.disabled === null)), 'every cell is a <button type="button">; a given has aria-disabled="true" and no disabled attribute');
      const board = await page.evaluate(() => { const el = document.querySelector('[data-board]'); return { role: el.getAttribute('role'), label: el.getAttribute('aria-label'), onlyCells: [...el.children].every((c) => c.hasAttribute('data-cell')) }; });
      const expectedInvalid = new Set();
      for (const v of E.findViolations(captureBoard(value))) {
        if (v.rule === 'count') for (let i = 0; i < 6; i++) expectedInvalid.add(v.axis === 'row' ? `${v.index},${i}` : `${i},${v.index}`);
        else for (const [r, c] of v.cells) expectedInvalid.add(`${r},${c}`);
      }
      t.check('FR-61', board.role === 'group' && board.label === 'Поле 6×6' && board.onlyCells && b.cells.every((x) => x.role === null && (x.invalid === 'true') === expectedInvalid.has(`${x.r},${x.c}`)), 'the board is role="group" «Поле 6×6», its children are its cells (no role), aria-invalid exactly on the violation the engine reports');
      t.check('FR-70', b.cells.every((x) => x.label === S.cellLabel(x.r + 1, x.c + 1, b.values[x.r][x.c], x.given, false, false)), 'every cell is labelled «Рядок R, стовпець C, V» with «, задано» on givens (e.g. «' + b.cells[0].label + '»)');
      t.check('FR-59', (await page.locator('[tabindex]').count()) === 0, 'no element of the page has a tabindex');
      await t.say('Tab from the summary button walks the cells in reading order, then the hint button');
      await page.locator(sel.summary).focus();
      const order = [];
      for (let i = 0; i < 37; i++) {
        await page.keyboard.press('Tab');
        order.push(await t.focused());
        if (i < 8) await t.pause(120);
      }
      const want = [];
      for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) want.push(`cell ${r},${c}`);
      t.check('FR-59', same(order.slice(0, 36), want) && order[36] === 'hint', 'each cell is its own Tab stop, row by row, after the summary button and before «Підказка»');
      const empty = b.cells.find((x) => !x.given && x.text === '' && !expectedInvalid.has(`${x.r},${x.c}`));
      await page.locator(sel.cell(empty.r, empty.c)).focus();
      await t.say('Enter and Space on a focused cell cycle it as a click does');
      await page.keyboard.press('Enter');
      await t.pause();
      const afterEnter = await page.locator(sel.cell(empty.r, empty.c)).textContent();
      await page.keyboard.press('Space');
      await t.pause();
      const afterSpace = await page.locator(sel.cell(empty.r, empty.c)).textContent();
      const stillFocused = await t.focused();
      const given = b.cells.find((x) => x.given);
      await page.locator(sel.cell(given.r, given.c)).focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      const givenAfter = await page.locator(sel.cell(given.r, given.c)).textContent();
      t.check('FR-60', afterEnter === '0' && afterSpace === '1' && stillFocused === `cell ${empty.r + 1},${empty.c + 1}` && givenAfter === given.text, 'Enter gives «0», Space «1», the cell keeps the focus; on a given both change nothing');
      await page.locator(sel.cell(empty.r, empty.c)).focus();
      const before = await t.read();
      for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'End', 'PageDown', 'Escape', 'a']) await page.keyboard.press(key);
      t.check('FR-59', (await t.focused()) === `cell ${empty.r + 1},${empty.c + 1}` && same((await t.read()).values, before.values), 'arrows, Home, End, PageDown, Escape and letters neither move the focus nor change a cell');
      const changed = await page.locator(sel.cell(empty.r, empty.c)).evaluate((el) => [el.getAttribute('aria-label'), el.classList.contains('cell-cause')]);
      t.check('FR-70', changed[0] === S.cellLabel(empty.r + 1, empty.c + 1, 1, false, false, changed[1]), `the label follows the change of the cell («${changed[0]}»)`);
      await t.say('The size group in the setup sheet is named by aria-label only');
      await t.press(sel.summary);
      const sizes = await page.evaluate(() => { const g = document.querySelector('[data-control="size"]'); return { label: g.getAttribute('aria-label'), role: g.getAttribute('role'), buttons: [...g.querySelectorAll('[role="radio"]')].map((x) => [x.textContent, x.hasAttribute('aria-label') || x.hasAttribute('aria-labelledby')]), shown: document.body.innerText.includes('Розмір поля') }; });
      t.check('FR-62', sizes.role === 'radiogroup' && sizes.label === 'Розмір поля' && same(sizes.buttons, [['Поле 4×4', false], ['Поле 6×6', false], ['Поле 8×8', false]]) && !sizes.shown, 'the size radiogroup is named «Розмір поля» by aria-label, each size button by its own text, and no visible text says «Розмір поля»');
      await page.keyboard.press('Escape');
      await t.pause();
      await t.say('The keyboard focus ring on a cell');
      await page.locator(sel.cell(empty.r, empty.c)).focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      const ring = await page.locator(sel.cell(empty.r, empty.c)).evaluate((el) => { const cs = getComputedStyle(el); return el.matches(':focus-visible') && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2; });
      const paint = await page.evaluate(([er, ec]) => {
        const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
        const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
        const page = getComputedStyle(document.body).backgroundColor;
        const cell = document.querySelector(`[data-cell][data-row="${er}"][data-col="${ec}"]`);
        const given = document.querySelector('[data-cell][data-given="true"]:not(.cell-violation)');
        const player = document.querySelector('[data-cell][data-given="false"]:not(.cell-violation):not(.cell-hinted)');
        const cs = getComputedStyle(cell);
        return { focusContrast: ratio(cs.outlineColor, page), borderContrast: ratio(getComputedStyle(player).borderTopColor, page), givenWeight: getComputedStyle(given).fontWeight, playerWeight: getComputedStyle(player).fontWeight };
      }, [empty.r + 1, empty.c + 1]);
      t.check('FR-65', ring && paint.focusContrast >= 3 && paint.borderContrast >= 3 && paint.givenWeight === '800' && paint.playerWeight === '500', `the keyboard focus ring shows (contrast ${paint.focusContrast.toFixed(2)}:1 to the page), the cell border ${paint.borderContrast.toFixed(2)}:1, givens weigh 800 against 500`);
      await t.still();
    },
  },
  {
    id: '03-violations',
    title: 'The rule checker on the page: runs, counts and identical lines are highlighted, live',
    proof: ['FR-1', 'FR-2', 'FR-3', 'FR-4', 'FR-5', 'FR-6', 'FR-7', 'FR-35', 'FR-36', 'FR-37', 'FR-38', 'FR-64', 'FR-120'],
    async run(t) {
      const { page } = t;
      const expectedMarks = (board) => {
        const marked = new Set();
        for (const v of E.findViolations(board)) {
          if (v.rule === 'count') for (let i = 0; i < board.length; i++) marked.add(v.axis === 'row' ? `${v.index},${i}` : `${i},${v.index}`);
          else for (const [r, c] of v.cells) marked.add(`${r},${c}`);
        }
        return [...marked].sort();
      };
      const shownMarks = async () => (await t.read()).withClass('cell-violation').map(([r, c]) => `${r},${c}`).sort();
      const cases = [
        ['three', 'row', ['FR-1', 'FR-35'], 'three equal digits side by side in a row'],
        ['three', 'col', ['FR-2', 'FR-35'], 'three equal digits side by side in a column'],
        ['count', 'row', ['FR-3', 'FR-36'], 'a row with more than N/2 of one digit, incomplete'],
        ['count', 'col', ['FR-4', 'FR-36'], 'a column with more than N/2 of one digit, incomplete'],
        ['duplicate', 'row', ['FR-5', 'FR-37'], 'two complete identical rows'],
        ['duplicate', 'col', ['FR-6', 'FR-37'], 'two complete identical columns'],
      ];
      for (const [kind, axis, ids, words] of cases) {
        const found = violationBoard(kind, axis);
        await t.open({ board: captureValue(found.givens, found.entries) });
        await t.say(`${words}: the page highlights what the checker reports`);
        const v = found.violations;
        const lines = v.map((x) => (x.rule === 'duplicate' ? `${axis} ${x.index + 1} and ${x.other + 1}` : `${axis} ${x.index + 1}`)).join('; ');
        const marks = await shownMarks();
        const count = kind === 'count' ? v.every((x) => x.cells.every(([r, c]) => found.board[r][c] === found.board[v[0].cells[0][0]][v[0].cells[0][1]])) : true;
        t.check(ids[0], v.every((x) => x.rule === kind && x.axis === axis) && count && (kind !== 'duplicate' || v.every((x) => x.other !== undefined)), `the checker reports ${words} (${lines})`);
        t.check(ids[1], same(marks, expectedMarks(found.board)) && marks.length > 0, `the page highlights exactly those cells (${marks.length})`);
      }
      const clean = violationBoard('three', 'row');
      const partial = emptyGrid(6);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (clean.givens[r][c] === null && (r + c) % 3 === 0) partial[r][c] = clean.solution[r][c];
      await t.open({ board: captureValue(clean.givens, partial) });
      await t.say('A partly filled board that breaks no rule: no highlight at all');
      t.check('FR-7', E.findViolations(overlay(clean.givens, partial)).length === 0 && (await shownMarks()).length === 0, 'empty cells count as no digit: no violation and no highlight on a rule-clean partial board');
      await t.open({ seed: 1 });
      const shown = await t.read();
      // the page shows a generated board; take the two-click plan from the board it shows
      const plan = (() => {
        const givens = shown.givens;
        for (let ra = 0; ra < 6; ra++) for (let ca = 0; ca < 6; ca++) for (const d of [0, 1]) {
          if (givens[ra][ca] !== null) continue;
          const b1 = copy(givens); b1[ra][ca] = d;
          if (E.findViolations(b1).length) continue;
          for (let rb = 0; rb < 6; rb++) for (let cb = 0; cb < 6; cb++) {
            if (givens[rb][cb] !== null || (ra === rb && ca === cb)) continue;
            const b2 = copy(b1); b2[rb][cb] = d;
            const v = E.findViolations(b2);
            if (v.length === 1 && v[0].rule === 'three' && v[0].cells.some(([x, y]) => x === rb && y === cb)) return { a: [ra, ca, d], b: [rb, cb, d] };
          }
        }
        throw new Error('no two-click run of three on the generated board');
      })();
      await t.say('Two clicks make a run of three: the highlight appears at once, the cause cell gets its corner mark');
      await t.clickCell(plan.a[0], plan.a[1], plan.a[2] + 1);
      const quiet = await shownMarks();
      await t.clickCell(plan.b[0], plan.b[1], plan.b[2] + 1);
      const loud = await t.read();
      const want = E.findViolations(loud.values);
      const causes = loud.withClass('cell-cause');
      t.check('FR-38', quiet.length === 0 && same(loud.withClass('cell-violation').map(([r, c]) => `${r},${c}`).sort(), expectedMarks(loud.values)) && want.length === 1, 'after the first click nothing is highlighted; after the second the run is highlighted at once');
      t.check('FR-120', causes.length === 1 && causes[0][0] === plan.b[0] && causes[0][1] === plan.b[1] && loud.cells.find((x) => x.r === plan.b[0] && x.c === plan.b[1]).classes.includes('cell-violation'), `exactly one cell carries cell-cause: the clicked cell (row ${plan.b[0] + 1}, column ${plan.b[1] + 1}), which is also in the violation`);
      const cue = await page.evaluate(([r, c]) => {
        const cause = document.querySelector(`[data-cell][data-row="${r}"][data-col="${c}"]`);
        const plain = document.querySelector('[data-cell][data-given="false"]:not(.cell-violation)');
        const after = getComputedStyle(cause, '::after');
        return { violation: parseFloat(getComputedStyle(cause).borderTopWidth), plain: parseFloat(getComputedStyle(plain).borderTopWidth), mark: after.content !== 'none' && parseFloat(after.borderTopWidth) > 0, markColor: after.borderTopColor, border: getComputedStyle(cause).borderTopColor };
      }, [plan.b[0] + 1, plan.b[1] + 1]);
      t.check('FR-64', cue.violation > cue.plain && cue.mark && cue.markColor === cue.border, `a violation cell has a heavier border (${cue.violation}px against ${cue.plain}px); the cause cell has a corner mark in the violation border colour`);
      await t.still();
      await t.say('One more click on the cause cell removes the run: the highlight and the mark disappear');
      await t.clickCell(plan.b[0], plan.b[1], 2 - plan.b[2]);
      const after = await t.read();
      t.check('FR-38', after.withClass('cell-violation').length === 0 && E.findViolations(after.values).length === 0, 'once the rule is no longer broken, its highlight disappears');
      t.check('FR-120', after.withClass('cell-cause').length === 0, 'the cause marker is removed by the next board change');
    },
  },
  {
    id: '04-capture-board-and-win',
    title: 'Capture boards, the solver count and the win message',
    proof: ['FR-8', 'FR-9', 'FR-10', 'FR-11', 'FR-12', 'FR-41', 'FR-119'],
    async run(t) {
      const { page } = t;
      const bad = badGivens();
      await t.say('A capture board whose givens have no solution is ignored: the page generates instead');
      await t.open({ board: captureValue(bad.zero, emptyGrid(6)), seed: 1 });
      const zeroShown = await t.read();
      const generated = pagePuzzle(seedStream(1), 6, 1).puzzle.givens;
      t.check('FR-10', E.countSolutions(bad.zero) === 0 && same(zeroShown.givens, generated), 'the solver reports 0 for givens with no completion; the page ignores that value and shows the generated puzzle');
      await t.open({ board: captureValue(bad.two, emptyGrid(6)), seed: 1 });
      t.check('FR-12', E.countSolutions(bad.two) === 2 && same((await t.read()).givens, generated), 'the solver stops at the second solution and reports 2; the page ignores that value too');
      const value = fixture('fixtureBoard', { level: 2 });
      await t.open({ board: value });
      const shown = await t.read();
      t.check('FR-11', E.countSolutions(value.givens) === 1 && same(shown.values, captureBoard(value)), 'the solver reports 1 for the fixture givens; the page shows exactly that board');
      t.check('FR-119', (await t.text('.setup-summary')).startsWith('6×6 · Задачка') && shown.withClass('cell-violation').length > 0 && (await t.text(sel.winMessage)) === '', 'the capture board takes the place of the first puzzle: its level in the summary («6×6 · Задачка»), its violations highlighted');
      const solved = fixture('solvedBoard');
      const full = captureBoard(solved);
      const [hr, hc] = (() => { for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (solved.givens[r][c] === null) return [r, c]; return null; })();
      const almost = copy(solved.entries);
      almost[hr][hc] = null;
      await t.open({ board: captureValue(solved.givens, almost) });
      await t.say('One empty cell left: not solved yet');
      t.check('FR-9', !E.isSolved(overlay(solved.givens, almost)) && (await t.text(sel.winMessage)) === '', 'a grid with an empty cell is not solved: no win message');
      const wrong = copy(solved.entries);
      wrong[hr][hc] = 1 - full[hr][hc];
      await t.open({ board: captureValue(solved.givens, wrong) });
      t.check('FR-9', !E.isSolved(overlay(solved.givens, wrong)) && (await t.text(sel.winMessage)) === '' && (await t.read()).withClass('cell-violation').length > 0, 'a full grid with a violation is not solved: no win message, the violation is highlighted');
      await t.open({ board: captureValue(solved.givens, almost) });
      await t.say('The last cell completes the grid: the win message');
      await t.clickCell(hr, hc, full[hr][hc] + 1);
      const win = await t.text(sel.winMessage);
      const after = await t.read();
      t.check('FR-8', E.isSolved(after.values) && (await page.locator('.board-host').getAttribute('data-solved')) === 'true', 'every cell filled, no violation: the grid is recognised as solved');
      t.check('FR-41', win === S.WIN && win.includes('ʼ') && !win.includes("'"), 'the win message is exactly «Вітаємо, головоломку розвʼязано!» with U+02BC');
      await t.still();
      await t.open({ board: solved });
      t.check('FR-119', (await t.text(sel.winMessage)) === S.WIN, 'a capture board that is already solved shows the win state at mount');
    },
  },
  {
    id: '05-hints-basic',
    title: 'Hints: pair, sandwich and count, the hinted cell, the broken-rule sentence, solving by hints',
    proof: ['FR-19', 'FR-20', 'FR-21', 'FR-22', 'FR-23', 'FR-24', 'FR-26', 'FR-27', 'FR-39', 'FR-40', 'FR-66'],
    async run(t) {
      const { page } = t;
      const rows = [
        ['pair', 'FR-19', /^Два (нулі|одиниці) поспіль у (рядку|стовпці) \d+, тож поруч може стояти лише (одиниця|нуль)/],
        ['sandwich', 'FR-20', /^Між двома (нулями|одиницями) у (рядку|стовпці) \d+ може стояти лише/],
        ['count', 'FR-21', /^У (рядку|стовпці) \d+ вже /],
      ];
      for (const [rule, id, shape] of rows) {
        const found = techniqueBoard(rule);
        const value = captureValue(found.givens, found.entries, found.level);
        await t.open({ board: value });
        await t.say(`«Підказка» on a board whose next move is the ${rule} rule`);
        const before = await t.read();
        await t.press(sel.hint);
        const message = await t.text(sel.hintMessage);
        const after = await t.read();
        const h = found.hint;
        const changed = after.cells.filter((x) => after.values[x.r][x.c] !== before.values[x.r][x.c]);
        t.check(id, message === h.sentence && h.rule === rule && shape.test(message), `the hint is the ${rule} rule: «${message}»`);
        t.check('FR-39', changed.length === 1 && changed[0].r === h.row && changed[0].c === h.col && after.values[h.row][h.col] === h.value, `it fills row ${h.row + 1}, column ${h.col + 1} with ${h.value}`);
        t.check('FR-66', same(after.withClass('cell-hinted'), [[h.row, h.col]]), 'that cell, and only it, carries cell-hinted');
        t.check('FR-24', before.values[h.row][h.col] === null && same(after.givens, before.givens), 'the target was empty, and no given or filled cell changed');
        const lineWord = h.axis === 'row' ? 'рядку' : 'стовпці';
        t.check('FR-22', message.includes(`${lineWord} ${h.line + 1}`) && (h.axis === 'row' ? h.row : h.col) === h.line, `the sentence names the line of the target cell: «${lineWord} ${h.line + 1}»`);
        t.check('FR-40', !/[A-Za-z]/.test(message), 'the sentence is in the page language (Ukrainian)');
        if (rule === 'pair') {
          await t.open({ board: value });
          await t.press(sel.hint);
          const second = await t.read();
          t.check('FR-23', (await t.text(sel.hintMessage)) === message && same(second.withClass('cell-hinted'), [[h.row, h.col]]) && E.hint(found.board, 4).sentence === h.sentence, 'the same board gives the same hint again: same cell, value and sentence');
          const other = second.cells.find((x) => !x.given && second.values[x.r][x.c] === null);
          await t.clickCell(other.r, other.c);
          t.check('FR-66', (await t.read()).withClass('cell-hinted').length === 0, 'a click on another cell removes the hinted marker');
        }
      }
      const broken = violationBoard('three', 'row');
      await t.open({ board: captureValue(broken.givens, broken.entries) });
      await t.say('On a board that breaks a rule the hint asks to fix it first and fills nothing');
      const before = await t.read();
      await t.press(sel.hint);
      const sentence = await t.text(sel.hintMessage);
      t.check('FR-26', sentence === E.hint(broken.board, 4).sentence && E.hint(broken.board, 4).kind === 'broken' && sentence.startsWith('Спершу виправте') && same((await t.read()).values, before.values), `the broken-rule sentence: «${sentence}»; no cell is filled`);
      await t.open({ seed: LEVEL1_SEED });
      await t.say('A generated level 1 puzzle, solved by «Підказка» alone: every step is a level 1 rule');
      const next = seedStream(LEVEL1_SEED);
      const { puzzle } = pagePuzzle(next, 6, 1);
      let board = copy(puzzle.givens);
      let steps = 0;
      let allLevel1 = true;
      for (; steps < 36 && (await t.text(sel.winMessage)) === ''; steps++) {
        const want = E.hint(board, 1);
        await page.locator(sel.hint).click();
        await t.pause(120);
        const got = await t.text(sel.hintMessage);
        if (want.kind !== 'fill' || got !== want.sentence || !['pair', 'sandwich', 'count'].includes(want.rule)) allLevel1 = false;
        if (want.kind === 'fill') board[want.row][want.col] = want.value;
      }
      t.check('FR-27', allLevel1 && E.isSolved(board) && (await t.text(sel.winMessage)) === S.WIN && same((await t.read()).values, board), `the givens reach the solution in ${steps} hints, each a pair, sandwich or count fill, never «no rule»; the page shows the win`);
      await t.still();
    },
  },
  {
    id: '06-hints-advanced',
    title: 'Hints: line balance, unique lines and look-ahead, the lowest technique first',
    proof: ['FR-74', 'FR-75', 'FR-76', 'FR-77', 'FR-78', 'FR-79', 'FR-80'],
    async run(t) {
      const rows = [
        ['balance', 2, 'FR-74', 'FR-78', /^У (рядку|стовпці) \d+ є місце лише для одн(ого|ієї) /],
        ['unique', 3, 'FR-75', 'FR-79', /^(Рядок|Стовпець) \d+ збігається з повним (рядком|стовпцем) \d+ усюди, крім двох порожніх клітинок/],
        ['lookahead', 4, 'FR-76', 'FR-80', /^Якщо поставити [01] у рядку (\d+), стовпці (\d+), за кілька кроків порушиться правило, тож тут [01]\.$/],
      ];
      for (const [rule, technique, id, sentenceId, shape] of rows) {
        const found = techniqueBoard(rule);
        // the look-ahead board is set at level 1: the page uses all four techniques whatever the board's level (FR-77)
        const level = rule === 'lookahead' ? 1 : found.level;
        await t.open({ board: captureValue(found.givens, found.entries, level) });
        await t.say(`«Підказка» where nothing simpler applies: technique ${technique} (${rule})`);
        await t.press(sel.hint);
        const message = await t.text(sel.hintMessage);
        const h = found.hint;
        const after = await t.read();
        t.check(id, h.rule === rule && after.values[h.row][h.col] === h.value && same(after.withClass('cell-hinted'), [[h.row, h.col]]), `the page fills row ${h.row + 1}, column ${h.col + 1} with ${h.value} by ${rule}`);
        t.check(sentenceId, message === h.sentence && shape.test(message) && message.split(/[.!?](\s|$)/).filter((s) => s && s.trim()).length === 1, `one sentence: «${message}»`);
        const lower = E.hint(found.board, technique - 1);
        t.check('FR-77', lower.kind === 'none' && E.hint(found.board, technique).rule === rule, `no technique below ${technique} applies here (ceiling ${technique - 1} gives «${lower.sentence}»), so the page picks ${rule}${rule === 'lookahead' ? ', also on a level 1 board' : ''}`);
        if (rule === 'lookahead') {
          const m = message.match(shape);
          t.check('FR-80', Number(m[1]) === h.row + 1 && Number(m[2]) === h.col + 1, 'the look-ahead sentence names the cell by its row and its column');
          await t.still();
        }
      }
    },
  },
  {
    id: '07-levels-generator',
    title: 'Levels: an 8×8 «Мозколамка» and a 6×6 «Головоломка» are exactly their level, with one solution',
    proof: ['FR-14', 'FR-15', 'FR-44', 'FR-82', 'FR-83', 'FR-88'],
    async run(t) {
      const { page } = t;
      const START = 11;
      await t.open({ seed: START });
      const next = seedStream(START);
      pagePuzzle(next, 6, 1); // the mount
      const checked = await page.locator(`${sel.levels}[aria-checked="true"]`).evaluate((el) => el.querySelector('.level-name').textContent);
      t.check('FR-88', checked === 'Розминка' && (await t.text('.setup-summary')).startsWith('6×6 · Розминка'), '«Розминка» is the level at start');
      for (const [n, level, name] of [[8, 4, 'Мозколамка'], [6, 3, 'Головоломка']]) {
        await t.say(`The setup sheet: ${n}×${n} and «${name}», then «Почати»`);
        await t.press(sel.summary);
        await t.press(sel.size(n));
        await t.press(sel.level(level - 1));
        await t.press(sel.start);
        await page.locator(sel.summary).filter({ hasText: `${n}×${n} · ${name}` }).waitFor();
        const { seed, puzzle } = pagePuzzle(next, n, level);
        const b = await t.read();
        t.check('FR-44', b.n === n && (await t.text('.setup-summary')).startsWith(`${n}×${n} · ${name}`), `the page offers level ${level} at ${n}×${n} and shows that puzzle`);
        t.check('FR-14', same(b.givens, puzzle.givens) && same(E.generate(n, seed, level).givens, puzzle.givens), `the board equals the engine's puzzle for (${n}, seed ${seed}, level ${level}), the same on every call`);
        t.check('FR-15', E.countSolutions(b.givens) === 1, 'the givens shown have exactly one solution');
        t.check('FR-82', solveByRules(b.givens, level).solved && !solveByRules(b.givens, level - 1).solved, `the board is solvable with techniques 1 to ${level} and not with 1 to ${level - 1}`);
        const solutions = [1, 2, 3, 4].map((l) => { try { return E.generate(n, seed, l).solution; } catch (e) { if (e instanceof E.GenerationRunOutError) return null; throw e; } }).filter(Boolean);
        t.check('FR-83', solutions.length >= 2 && solutions.every((s) => same(s, puzzle.solution)), `the solution for (${n}, seed ${seed}) is the same at every level the engine builds (${solutions.length} levels compared)`);
      }
      const stored = await page.evaluate(() => Object.keys(localStorage));
      t.check('FR-88', stored.length === 0, 'size, level and the marked choice are never stored (localStorage holds no key)');
      await t.still();
    },
  },
  {
    id: '08-setup-sheet',
    title: 'The setup sheet: summary button, marking a size and a level, the 4×4 rule, closing and «Почати»',
    proof: ['FR-43', 'FR-73', 'FR-87', 'FR-89', 'FR-91', 'FR-92', 'FR-95', 'FR-96', 'FR-97', 'FR-99', 'FR-100', 'FR-101'],
    async run(t) {
      const { page } = t;
      await t.open({ seed: 21 });
      const summary = await page.evaluate(() => { const b = document.querySelector('[data-action="setup"]'); return { type: b.getAttribute('type'), target: b.getAttribute('popovertarget'), sheetId: document.querySelector('[data-section="setup"]').id, label: b.querySelector('.setup-summary').textContent, cue: b.querySelector('.setup-cue')?.getAttribute('aria-hidden'), cueText: b.querySelector('.setup-cue')?.textContent }; });
      t.check('FR-95', summary.type === 'button' && summary.target === summary.sheetId && summary.label === '6×6 · Розминка' && summary.cue === 'true' && summary.cueText === '▾', 'the summary button «6×6 · Розминка ▾» opens the sheet by popovertarget; the ▾ cue is aria-hidden');
      const boardBefore = (await t.read()).values;
      await t.say('The summary opens the setup sheet');
      await t.press(sel.summary);
      const sheet = await page.evaluate(() => { const s = document.querySelector('[data-section="setup"]'); return { popover: s.getAttribute('popover'), role: s.getAttribute('role'), label: s.getAttribute('aria-label'), labelledby: s.hasAttribute('aria-labelledby'), kids: [...s.children].map((k) => k.getAttribute('data-control') ?? k.getAttribute('data-action')), outside: !document.querySelector('[data-board]').contains(s) }; });
      t.check('FR-96', (await t.isOpen(sel.sheet)) && sheet.popover !== null && sheet.role === 'dialog' && sheet.label === 'Поле і складність' && !sheet.labelledby && same(sheet.kids, ['size', 'level', 'setup-start', 'setup-close']) && sheet.outside, 'the sheet is a popover dialog «Поле і складність» holding size, level, «Почати», «Закрити», outside the board');
      const groups = await page.evaluate(() => {
        const size = document.querySelector('[data-control="size"]');
        const level = document.querySelector('[data-control="level"]');
        return {
          size: [...size.querySelectorAll('[role="radio"]')].map((b) => [b.tagName, b.getAttribute('type'), b.textContent, b.getAttribute('aria-checked')]),
          levelRole: level.getAttribute('role'), levelLabel: level.getAttribute('aria-label'),
          levels: [...level.querySelectorAll('[role="radio"]')].map((b) => ({ type: b.getAttribute('type'), checked: b.getAttribute('aria-checked'), spans: [...b.querySelectorAll('span')].map((s) => [s.className, s.textContent, s.id]), aria: ['aria-label', 'aria-labelledby', 'aria-describedby'].some((a) => b.hasAttribute(a)), height: b.getBoundingClientRect().height })),
          descriptionLine: document.querySelectorAll('[data-level-description]').length,
        };
      });
      t.check('FR-43', same(groups.size, [['BUTTON', 'button', 'Поле 4×4', 'false'], ['BUTTON', 'button', 'Поле 6×6', 'true'], ['BUTTON', 'button', 'Поле 8×8', 'false']]), 'the size group holds «Поле 4×4», «Поле 6×6», «Поле 8×8» radio buttons, 6×6 checked');
      t.check('FR-87', groups.levelRole === 'radiogroup' && groups.levelLabel === 'Складність' && same(groups.levels.map((l) => l.spans[0][1]), S.LEVELS.map((l) => l.name)) && same(groups.levels.map((l) => l.checked), ['true', 'false', 'false', 'false']), 'the level group «Складність» holds «Розминка», «Задачка», «Головоломка», «Мозколамка», «Розминка» checked');
      t.check('FR-89', groups.descriptionLine === 0 && groups.levels.every((l, i) => l.spans.length === 2 && l.spans[1][1] === S.LEVELS[i].description && l.spans.every((s) => s[2] === '') && S.LEVELS[i].description.length <= 80), 'each level button holds its name and its description (two spans, no id); no separate description line');
      t.check('FR-99', groups.levels.every((l) => l.type === 'button' && !l.aria && l.height >= 44), 'no aria-label, -labelledby or -describedby on a level button; each at least 44 px tall');
      await t.say('Marking 8×8 and «Мозколамка»: the sheet stays open, the board and the summary do not change');
      await t.press(sel.size(8));
      const focusAfterSize = await t.focused();
      await t.press(sel.level(3));
      const marked = await page.evaluate(() => [document.querySelector('[data-size-option="8"]').getAttribute('aria-checked'), document.querySelectorAll('[data-control="level"] [role="radio"]')[3].getAttribute('aria-checked')]);
      t.check(['FR-73', 'FR-97', 'FR-100'], same(marked, ['true', 'true']) && (await t.isOpen(sel.sheet)) && focusAfterSize === '8' && (await t.text('.setup-summary')) === '6×6 · Розминка' && same((await t.read()).values, boardBefore) && (await page.locator(`${sel.dialog}[open]`).count()) === 0, 'a press only marks: aria-checked moves, the sheet stays open, the focus stays on the pressed button, no dialog, the board and summary unchanged');
      await t.say('Marking 4×4: only «Розминка» exists; the other levels are unavailable, with the reason');
      await t.press(sel.size(4));
      const four = await page.evaluate(() => ({ levels: [...document.querySelectorAll('[data-control="level"] [role="radio"]')].map((b) => [b.getAttribute('aria-checked'), b.getAttribute('aria-disabled')])}));
      const reason = await page.locator('[data-level-reason]');
      t.check('FR-91', same(four.levels, [['true', null], ['false', 'true'], ['false', 'true'], ['false', 'true']]) && (await reason.isVisible()) && (await reason.textContent()) === S.LEVEL_REASON_4X4, 'marking 4×4 marks «Розминка»; levels 2 to 4 carry aria-disabled="true"; the reason line «Для поля 4×4 є лише рівень «Розминка».» shows');
      await t.still();
      await t.press(sel.level(2));
      t.check('FR-73', (await page.locator(sel.level(2)).getAttribute('aria-checked')) === 'false' && (await page.locator(sel.level(0)).getAttribute('aria-checked')) === 'true', 'a press on an unavailable level does nothing');
      await t.press(sel.size(6));
      const back = await page.evaluate(() => [...document.querySelectorAll('[data-control="level"] [role="radio"]')].map((b) => [b.getAttribute('aria-checked'), b.getAttribute('aria-disabled')]));
      t.check('FR-92', same(back, [['true', null], ['false', null], ['false', null], ['false', null]]) && !(await reason.isVisible()), 'marking 6×6 afterwards removes aria-disabled and the reason and keeps «Розминка»');
      await t.say('«Закрити» discards the marked choice; the next opening shows the board shown');
      await t.press(sel.size(8));
      await t.press(sel.level(1));
      await t.press(sel.setupClose);
      const closedFocus = await t.focused();
      await t.press(sel.summary);
      const reopened = await page.evaluate(() => [document.querySelector('[data-size-option="6"]').getAttribute('aria-checked'), document.querySelectorAll('[data-control="level"] [role="radio"]')[0].getAttribute('aria-checked')]);
      t.check(['FR-97', 'FR-100'], closedFocus === 'setup' && same(reopened, ['true', 'true']) && same((await t.read()).values, boardBefore), 'closing changes nothing, focus ends on the summary button, and reopening shows 6×6 · Розминка again');
      await t.say('8×8 and «Задачка», then «Почати» on an untouched board: one new puzzle at once');
      await t.press(sel.size(8));
      await t.press(sel.level(1));
      await t.press(sel.start);
      const next = seedStream(21);
      pagePuzzle(next, 6, 1);
      const { puzzle } = pagePuzzle(next, 8, 2);
      t.check('FR-101', !(await t.isOpen(sel.sheet)) && (await t.focused()) === 'setup' && (await t.text('.setup-summary')) === '8×8 · Задачка' && same((await t.read()).givens, puzzle.givens) && (await page.locator(`${sel.dialog}[open]`).count()) === 0, '«Почати» closes the sheet, starts one 8×8 «Задачка» puzzle (the next seed) with no dialog, updates the summary and focuses it');
      t.check('FR-92', (await t.read()).n === 8, 'one «Почати» made one new puzzle with both the marked size and the marked level');
    },
  },
  {
    id: '09-confirm-actions',
    title: '«Нова головоломка», «Скинути» and «Почати» ask before discarding moves',
    proof: ['FR-42', 'FR-58', 'FR-67', 'FR-90', 'FR-98'],
    async run(t) {
      const { page } = t;
      const START = 31;
      await t.open({ seed: START });
      const next = seedStream(START);
      const first = pagePuzzle(next, 6, 1).puzzle;
      await t.say('An untouched board: «Скинути» acts at once and changes nothing');
      await t.press(sel.reset);
      t.check('FR-58', (await page.locator(`${sel.dialog}[open]`).count()) === 0 && same((await t.read()).givens, first.givens), 'on an untouched board «Скинути» opens no dialog and changes nothing');
      await t.say('A hint and one move, then «Нова головоломка»: the page asks first');
      await t.press(sel.hint);
      const b = await t.read();
      const empty = b.cells.find((x) => !x.given && b.values[x.r][x.c] === null);
      await t.clickCell(empty.r, empty.c);
      const withEntries = (await t.read()).values;
      await t.press(sel.newPuzzle);
      const dialog = await page.evaluate(() => { const d = document.querySelector('dialog[data-dialog="confirm"]'); return { open: d.open, modal: d.matches(':modal'), text: d.querySelector('p').textContent, yes: d.querySelector('[data-confirm="yes"]').textContent, no: d.querySelector('[data-confirm="no"]').textContent, focus: document.activeElement?.getAttribute('data-confirm') }; });
      t.check('FR-67', dialog.open && dialog.modal && dialog.text === S.CONFIRM.text && dialog.yes === 'Так, почати' && dialog.no === 'Скасувати' && dialog.focus === 'no', 'a modal <dialog> asks «Почати заново? Ваші ходи на цьому полі буде втрачено.» with «Так, почати» and «Скасувати» (focused)');
      await t.still();
      await t.press(sel.no);
      t.check('FR-67', !(await page.locator(sel.dialog).evaluate((d) => d.open)) && same((await t.read()).values, withEntries) && (await t.text(sel.hintMessage)) !== '', '«Скасувати» closes it and leaves the board and the hint message as they were');
      await t.press(sel.newPuzzle);
      await t.press(sel.yes);
      const second = pagePuzzle(next, 6, 1).puzzle;
      const fresh = await t.read();
      t.check('FR-42', same(fresh.givens, second.givens) && fresh.withClass('cell-hinted').length === 0 && (await t.text(sel.hintMessage)) === '' && (await t.text(sel.winMessage)) === '' && (await t.text('.setup-summary')) === '6×6 · Розминка', '«Так, почати» shows a new puzzle of the same size and level (the next seed) and clears the messages and the hinted marker');
      await t.say('«Скинути» after a hint and a move: confirmed, every player cell is emptied');
      await t.press(sel.hint);
      const fill = await t.read();
      const free = fill.cells.find((x) => !x.given && fill.values[x.r][x.c] === null);
      await t.clickCell(free.r, free.c);
      await t.press(sel.reset);
      t.check('FR-67', await page.locator(sel.dialog).evaluate((d) => d.open), '«Скинути» asks too, because the board has entries');
      await t.press(sel.yes);
      const reset = await t.read();
      t.check('FR-58', same(reset.values, second.givens) && reset.withClass('cell-hinted').length === 0 && reset.withClass('cell-violation').length === 0 && (await t.text(sel.hintMessage)) === '' && (await t.text('.setup-summary')) === '6×6 · Розминка', 'every non-given cell is empty (the hint fill too), givens, size and level kept, the hint message and marker cleared');
      await t.say('«Почати» with moves on the board: the sheet closes first, then the dialog');
      await t.clickCell(free.r, free.c);
      const moved = (await t.read()).values;
      await t.press(sel.summary);
      await t.press(sel.size(8));
      await t.press(sel.start);
      const both = await page.evaluate(() => [document.querySelector('[data-section="setup"]').matches(':popover-open'), document.querySelector('dialog[data-dialog="confirm"]').open]);
      t.check('FR-98', same(both, [false, true]), 'the sheet is closed before the dialog opens; they are never open together');
      await t.press(sel.no);
      t.check('FR-90', same((await t.read()).values, moved) && (await t.text('.setup-summary')) === '6×6 · Розминка' && (await t.focused()) === 'setup' && !(await t.isOpen(sel.sheet)), '«Скасувати»: board, size, level and summary unchanged, the pending start dropped, focus on the summary, the sheet not reopened');
      await t.press(sel.summary);
      await t.press(sel.size(8));
      await t.press(sel.start);
      await t.press(sel.yes);
      const third = pagePuzzle(next, 8, 1).puzzle;
      t.check('FR-98', same((await t.read()).givens, third.givens) && (await t.text('.setup-summary')) === '8×8 · Розминка' && (await t.focused()) === 'setup', '«Так, почати» performs the start marked at the press: an 8×8 board, the summary updated, focus on it');
      t.check('FR-90', await page.locator(sel.dialog).evaluate((d) => !d.open), 'the dialog is closed again after «Так, почати»; «Почати» asked only because the board had entries');
    },
  },
  {
    id: '10-rules-panel',
    title: 'The rules panel: three rules and three harder techniques, every text from strings.ts',
    proof: ['FR-57', 'FR-93', 'FR-94'],
    async run(t) {
      const { page } = t;
      await t.open({ seed: 41 });
      await t.say('«Правила» opens the rules panel, with no script of the page');
      const button = await page.evaluate(() => { const b = document.querySelector('[data-action="rules"]'); return { text: b.textContent, target: b.getAttribute('popovertarget'), inHeader: !!b.closest('header') }; });
      await t.press(sel.rules);
      const panel = await page.evaluate(() => {
        const p = document.querySelector('[data-section="rules"]');
        const close = p.querySelector('.rules-close');
        return { id: p.id, popover: p.getAttribute('popover'), heading: p.querySelector('h2').textContent, rules: [...p.querySelectorAll(':scope > ul > li .rule-text')].map((x) => x.textContent), techHeading: p.querySelector('[data-section="techniques"] h3').textContent, techniques: [...p.querySelectorAll('[data-section="techniques"] li')].map((x) => x.textContent), close: close.textContent, action: close.getAttribute('popovertargetaction'), outside: !document.querySelector('.board-host').contains(p), details: document.querySelectorAll('details').length };
      });
      t.check('FR-57', button.text === 'Правила' && button.inHeader && button.target === panel.id && (await t.isOpen(sel.rulesPanel)) && panel.heading === 'Правила' && same(panel.rules, [...S.RULES.items]) && panel.close === 'Зрозуміло' && panel.action === 'hide' && panel.outside && panel.details === 0, 'the header button «Правила» opens the popover panel «Правила» with exactly the three rules and «Зрозуміло»; no <details>, outside the board');
      t.check('FR-93', panel.techHeading === 'Складніші прийоми' && same(panel.techniques, [...S.TECHNIQUES.items]), 'after the rules: «Складніші прийоми» and three one-sentence items, for line balance, matching lines and look-ahead');
      await t.still();
      await t.press(sel.rulesClose);
      t.check('FR-57', !(await t.isOpen(sel.rulesPanel)), '«Зрозуміло» closes the panel');
      const leaves = new Set();
      const walk = (v) => { if (typeof v === 'string') leaves.add(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
      walk([S.TITLE, S.BUTTONS, S.SIZE_GROUP, S.CONFIRM, S.RULES, S.IDLE, S.WIN, S.SETUP, S.LEVEL_GROUP, S.LEVELS, S.LEVEL_REASON_4X4, S.TECHNIQUES, S.SETTINGS, S.THEME_OPTIONS, S.LANGUAGE_OPTIONS]);
      for (let n = 4; n <= 8; n += 2) leaves.add(S.sizeLabel(n));
      const texts = await page.evaluate(() => {
        const out = [];
        const tw = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
        while (tw.nextNode()) { const v = tw.currentNode.data; if (/[Ѐ-ӿ]/.test(v)) out.push(v); }
        for (const el of document.querySelectorAll('#app [aria-label]')) { const v = el.getAttribute('aria-label'); if (/[Ѐ-ӿ]/.test(v) && !el.hasAttribute('data-cell') && !el.hasAttribute('data-board')) out.push(v); }
        return out;
      });
      const stray = texts.filter((v) => !leaves.has(v) && !leaves.has(v.trim()) && !/^\d+×\d+ · /.test(v));
      const sources = ['src/main.ts', 'src/ui/play-page.ts', 'src/ui/capture-board.ts', 'src/ui/gear.ts', 'src/ui/index.ts', 'src/ui/logo.ts', 'src/ui/preferences.ts', 'src/ui/seed.ts'];
      const cyrillicElsewhere = sources.filter((f) => existsSync(f) && cyrillic.test(readFileSync(f, 'utf8')));
      t.check('FR-94', stray.length === 0 && texts.length > 20 && cyrillicElsewhere.length === 0, `every Ukrainian text and name on the page (${texts.length}) comes from src/ui/strings.ts; no Cyrillic in the other src/ui modules or src/main.ts`);
    },
  },
  {
    id: '11-theme',
    title: 'The theme: light, dark or the system, applied before the first paint, stored, safe when storage fails',
    proof: ['FR-102', 'FR-103', 'FR-104', 'FR-105', 'FR-106', 'FR-113', 'FR-114', 'FR-115', 'FR-116', 'FR-117', 'FR-118'],
    async run(t) {
      const { page } = t;
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.emulateMedia({ colorScheme: 'light' });
      await t.open({ seed: 51 });
      await t.say('The settings panel: the theme group, «Як у системі» chosen when nothing is stored');
      await t.press(sel.settings);
      const group = await page.evaluate(() => { const g = document.querySelector('[data-control="theme"]'); return { role: g.getAttribute('role'), label: g.getAttribute('aria-label'), options: [...g.children].map((b) => [b.tagName, b.getAttribute('type'), b.getAttribute('role'), b.textContent, b.getAttribute('data-theme-option'), b.getAttribute('aria-checked'), b.hasAttribute('aria-label')]), inSettings: !!g.closest('[data-section="settings"]') }; });
      t.check('FR-102', group.role === 'radiogroup' && group.label === 'Тема' && group.inSettings && same(group.options.map((o) => o.slice(3, 6)), [['Світла', 'light', 'false'], ['Темна', 'dark', 'false'], ['Як у системі', 'auto', 'true']]), 'the radiogroup «Тема» in the settings panel: «Світла», «Темна», «Як у системі» (checked)');
      const sizes = await page.locator('[data-control="theme"] [role="radio"], [data-control="language"] [role="radio"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
      t.check('FR-117', group.options.every((o) => o[0] === 'BUTTON' && o[1] === 'button' && o[2] === 'radio' && !o[6]) && sizes.every(([w, h]) => w >= 44 && h >= 44) && (await page.locator('[tabindex]').count()) === 0, 'every option is a <button type="button" role="radio"> named by its text, at least 44×44 CSS px, no tabindex');
      const html = () => page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), scheme: getComputedStyle(document.documentElement).colorScheme, meta: document.querySelector('meta[name="theme-color"]').getAttribute('content'), page: getComputedStyle(document.documentElement).getPropertyValue('--color-page').trim(), metas: document.querySelectorAll('meta[name="theme-color"]').length }));
      await t.say('On «Як у системі» the page follows a system change live');
      await page.emulateMedia({ colorScheme: 'dark' });
      await t.pause();
      const liveDark = await html();
      await page.emulateMedia({ colorScheme: 'light' });
      await t.pause();
      const liveLight = await html();
      t.check('FR-105', liveDark.theme === 'dark' && liveDark.scheme === 'dark' && liveLight.theme === 'light' && liveLight.scheme === 'light', 'while auto, a system change to dark and back is followed at once (data-theme, color-scheme)');
      t.check('FR-106', liveDark.metas === 1 && liveDark.meta.toLowerCase() === liveDark.page.toLowerCase() && liveLight.meta.toLowerCase() === liveLight.page.toLowerCase() && liveDark.meta !== liveLight.meta, `one theme-color meta, equal to --color-page of the effective theme (${liveLight.meta} light, ${liveDark.meta} dark)`);
      const board = (await t.read()).values;
      await page.evaluate(() => { window.__recWrites = []; const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { window.__recWrites.push([k, v]); return orig.call(this, k, v); }; });
      await t.say('«Темна»: applied at once, stored, nothing else changes');
      await page.locator(sel.theme('dark')).focus();
      await page.keyboard.press('Enter');
      await t.pause();
      const dark = await html();
      t.check('FR-104', dark.theme === 'dark' && dark.scheme === 'dark', '<html data-theme="dark"> and color-scheme dark');
      t.check('FR-103', (await page.locator(sel.theme('dark')).getAttribute('aria-checked')) === 'true' && same((await t.read()).values, board) && (await t.focused()) === 'dark' && (await t.isOpen(sel.settingsPanel)) && (await t.text('.setup-summary')) === '6×6 · Розминка', 'the press moves aria-checked, keeps the board, summary and focus, and opens or closes nothing');
      await page.keyboard.press('Space');
      const writes = await page.evaluate(() => window.__recWrites);
      t.check('FR-113', same(writes, [['binarka.theme', 'dark']]) && same(await page.evaluate(() => Object.keys(localStorage).sort()), ['binarka.theme']), 'exactly one write, binarka.theme = dark; a press on the chosen option writes nothing; no other key');
      t.check('FR-117', (await t.focused()) === 'dark', 'Enter and Space act as native button activation; the focus stays on the option');
      await page.emulateMedia({ colorScheme: 'light' });
      t.check('FR-105', (await html()).theme === 'dark', 'while the choice is dark, a system change does nothing');
      await t.still();
      await page.locator(sel.settingsClose).click();
      await t.say('A reload: the stored theme is on <html> before the body is parsed');
      await page.reload();
      await page.locator(CELL).first().waitFor();
      const atBody = await page.evaluate(() => window.__recAtBody);
      t.check('FR-116', atBody && atBody.theme === 'dark' && atBody.lang === 'uk' && atBody.title === 'Бінарка' && atBody.meta === dark.meta && atBody.mounted === false, 'at the first <body>, before the page module mounts: data-theme dark, lang uk, title «Бінарка», the dark theme-color');
      await t.say('Stored values outside the lists are ignored and kept');
      await t.open({ seed: 51, prefs: { 'binarka.theme': 'Dark', 'binarka.language': 'ru' } });
      const fallback = await page.evaluate(() => ({ checked: document.querySelector('[data-theme-option][aria-checked="true"]').getAttribute('data-theme-option'), lang: document.documentElement.lang, kept: [localStorage.getItem('binarka.theme'), localStorage.getItem('binarka.language')] }));
      t.check('FR-114', fallback.checked === 'auto' && fallback.lang === 'uk' && same(fallback.kept, ['Dark', 'ru']), '«Dark» and «ru» fall back to auto and Ukrainian, and stay stored as they were');
      await t.say('With storage blocked the page still plays, and a theme press still works');
      await t.open({ seed: 51, storageThrows: true });
      await t.press(sel.settings);
      await t.press(sel.theme('dark'));
      t.check('FR-115', errors.length === 0 && (await html()).theme === 'dark' && (await t.read()).n === 6, 'localStorage throws on access: the page mounts with the defaults, a press applies dark for the session, no uncaught error');
      await page.locator(sel.settingsClose).click();
      await t.open({ seed: 51 });
      await t.say('The theme options are not part of the setup sheet\'s marked choice');
      await t.press(sel.summary);
      await t.press(sel.size(8));
      await t.press(sel.settings);
      const sheetClosed = !(await t.isOpen(sel.sheet));
      await t.press(sel.theme('light'));
      await page.locator(sel.settingsClose).click();
      await t.press(sel.summary);
      t.check('FR-118', sheetClosed && (await page.locator(sel.size(6)).getAttribute('aria-checked')) === 'true' && (await html()).theme === 'light', 'opening the settings closes the sheet (popover auto) and discards the mark; the theme press acted at once');
    },
  },
  {
    id: '12-english',
    title: 'English: the language switch re-renders every text in place, hints included',
    proof: ['FR-22', 'FR-40', 'FR-55', 'FR-56', 'FR-107', 'FR-108', 'FR-109', 'FR-110', 'FR-111', 'FR-112'],
    async run(t) {
      const { page } = t;
      const balance = techniqueBoard('balance');
      await t.open({ board: captureValue(balance.givens, balance.entries, balance.level) });
      t.check('FR-55', (await page.evaluate(() => document.documentElement.lang)) === 'uk' && (await t.text(sel.hint)) === 'Підказка', 'the page starts in Ukrainian');
      await t.press(sel.hint);
      const ukHint = await t.text(sel.hintMessage);
      await t.say('Settings → «English»: everything re-renders in place, the hint on screen becomes the same hint in English');
      await t.press(sel.settings);
      const lang = await page.evaluate(() => { const g = document.querySelector('[data-control="language"]'); return { role: g.getAttribute('role'), label: g.getAttribute('aria-label'), options: [...g.children].map((b) => [b.textContent, b.getAttribute('lang'), b.getAttribute('data-language-option'), b.getAttribute('aria-checked')]), afterTheme: g.previousElementSibling?.previousElementSibling?.getAttribute('data-control') }; });
      t.check('FR-107', lang.role === 'radiogroup' && lang.label === 'Мова' && same(lang.options, [['Українська', 'uk', 'uk', 'true'], ['English', 'en', 'en', 'false']]) && lang.afterTheme === 'theme', 'the radiogroup «Мова» after the theme group: «Українська» (lang uk, checked) and «English» (lang en)');
      const before = await t.read();
      await page.locator(sel.language('en')).click();
      await t.pause();
      const after = await t.read();
      const doc = await page.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, h1: document.querySelector('header h1').textContent, stored: localStorage.getItem('binarka.language'), focus: document.activeElement?.getAttribute('data-language-option') }));
      t.check('FR-109', doc.lang === 'en' && doc.title === 'Binarka' && doc.h1 === 'Binarka', '<html lang="en">, document.title and the header title "Binarka"');
      const h = balance.hint;
      t.check('FR-110', (await t.text(sel.hintMessage)) === E.hintSentence(h, 'en') && ukHint === h.sentence, 'the hint on screen is the same hint (same technique, line and cell) in English');
      const labels = after.cells.every((x) => x.label === S.EN.cellLabel(x.r + 1, x.c + 1, after.values[x.r][x.c], x.given, x.r === h.row && x.c === h.col, false));
      t.check('FR-108', same(after.values, before.values) && same(after.withClass('cell-hinted'), before.withClass('cell-hinted')) && labels && doc.stored === 'en' && doc.focus === 'en' && (await page.locator(sel.board).getAttribute('aria-label')) === 'Grid 6×6', 'board, entries and hinted cell stay; every cell label and the board name are English; stored as en; the focus stays on «English»');
      await page.locator(sel.settingsClose).click();
      await t.pause();
      const en = S.EN;
      const shown = await page.evaluate(() => ({
        buttons: ['hint', 'reset', 'new', 'rules'].map((a) => document.querySelector(`[data-action="${a}"]`).textContent),
        idle: document.querySelector('[data-message="idle"]').textContent,
        summary: document.querySelector('.setup-summary').textContent,
        prefix: document.querySelector('[data-action="setup"] .visually-hidden').textContent,
        sheet: document.querySelector('[data-section="setup"]').getAttribute('aria-label'),
        groups: ['size', 'level', 'theme', 'language'].map((k) => document.querySelector(`[data-control="${k}"]`).getAttribute('aria-label')),
        sizes: [...document.querySelectorAll('[data-size-option]')].map((b) => b.textContent),
        levels: [...document.querySelectorAll('[data-control="level"] [role="radio"]')].map((b) => [b.querySelector('.level-name').textContent, b.querySelector('.level-text').textContent]),
        rules: [document.querySelector('[data-section="rules"] h2').textContent, ...[...document.querySelectorAll('[data-section="rules"] .rule-text')].map((x) => x.textContent)],
        techniques: [document.querySelector('[data-section="techniques"] h3').textContent, ...[...document.querySelectorAll('[data-section="techniques"] li')].map((x) => x.textContent)],
        confirm: [document.querySelector('dialog[data-dialog="confirm"] p').textContent, document.querySelector('[data-confirm="yes"]').textContent, document.querySelector('[data-confirm="no"]').textContent],
        themes: [...document.querySelectorAll('[data-theme-option]')].map((b) => b.textContent),
        settings: [document.querySelector('[data-section="settings"]').getAttribute('aria-label'), ...[...document.querySelectorAll('.settings-label')].map((x) => x.textContent), document.querySelector('[data-action="settings-close"]').textContent],
      }));
      const want = {
        buttons: [en.BUTTONS.hint, en.BUTTONS.reset, en.BUTTONS.newPuzzle, en.BUTTONS.rules], idle: en.IDLE, summary: en.summaryText(6, balance.level), prefix: en.SETUP.prefix, sheet: en.SETUP.sheetLabel,
        groups: [en.SIZE_GROUP, en.LEVEL_GROUP, en.SETTINGS.themeLabel, en.SETTINGS.languageLabel], sizes: [4, 6, 8].map(en.sizeLabel), levels: en.LEVELS.map((l) => [l.name, l.description]),
        rules: [en.RULES.heading, ...en.RULES.items], techniques: [en.TECHNIQUES.heading, ...en.TECHNIQUES.items], confirm: [en.CONFIRM.text, en.CONFIRM.yes, en.CONFIRM.no],
        themes: en.THEME_OPTIONS.map((o) => o.name), settings: [en.SETTINGS.label, en.SETTINGS.themeLabel, en.SETTINGS.languageLabel, en.SETTINGS.close],
      };
      t.check('FR-111', same(shown, want) && !cyrillic.test(JSON.stringify(shown)), 'every page text has its English counterpart from the EN table: buttons, idle line, summary, sheet, groups, sizes, levels, rules, techniques, dialog, theme and settings texts');
      t.check('FR-108', same(shown, want), 'the switch re-rendered every page text and accessible name without a reload');
      await t.still();
      await t.say('English hint sentences for every technique and the broken-rule case');
      const kinds = [];
      for (const rule of ['pair', 'sandwich', 'count', 'balance', 'unique', 'lookahead']) {
        const found = techniqueBoard(rule);
        await t.open({ board: captureValue(found.givens, found.entries, found.level), prefs: { 'binarka.language': 'en' } });
        await t.press(sel.hint);
        const sentence = await t.text(sel.hintMessage);
        const want = E.hint(found.board, 4, 'en');
        const line = want.rule === 'lookahead' ? `row ${want.row + 1}, column ${want.col + 1}` : `${want.axis === 'row' ? 'row' : 'column'} ${want.line + 1}`;
        if (sentence === want.sentence && want.rule === rule && !cyrillic.test(sentence) && sentence.toLowerCase().includes(line) && !/['ʼ]/.test(sentence)) kinds.push(rule);
        if (rule === 'pair') t.check('FR-40', sentence === want.sentence && !cyrillic.test(sentence), `in English mode the hint shows the English sentence: «${sentence}»`);
        if (rule === 'count') t.check('FR-22', sentence.toLowerCase().includes(line), `the English sentence names the line: "${line}"`);
      }
      const broken = violationBoard('three', 'col');
      await t.open({ board: captureValue(broken.givens, broken.entries), prefs: { 'binarka.language': 'en' } });
      await t.press(sel.hint);
      const brokenSentence = await t.text(sel.hintMessage);
      if (brokenSentence === E.hint(broken.board, 4, 'en').sentence && !cyrillic.test(brokenSentence)) kinds.push('broken');
      t.check('FR-112', same(kinds, ['pair', 'sandwich', 'count', 'balance', 'unique', 'lookahead', 'broken']), 'the engine returns English sentences for pair, sandwich, count, line balance, unique lines, look-ahead and broken-rule (the no-rule one is in the CLI clip), each naming row or column and its number, no Cyrillic, no apostrophe');
      t.check('FR-56', kinds.length === 7, 'hint sentences are available in English (pointer row to FR-110 and FR-112)');
    },
  },
  {
    id: '13-cli-engine',
    title: 'The CLI (npm run cli) prints puzzles and English errors; engine calls with no page or CLI path',
    proof: ['FR-16', 'FR-17', 'FR-25', 'FR-28', 'FR-29', 'FR-30', 'FR-49', 'FR-50', 'FR-51', 'FR-52', 'FR-53', 'FR-54', 'FR-81', 'FR-84', 'FR-85', 'FR-86'],
    viewport: { width: 1100, height: 900 },
    async run(t) {
      const { page } = t;
      await page.setContent(TERMINAL);
      const show = async (r, note) => {
        await terminalAppend(page, `<div class="cmd">$ npm run cli --${r.args.length ? ' ' + esc(r.args.join(' ')) : ''}</div>${r.stdout ? `<div class="out">${esc(r.stdout)}</div>` : ''}${r.stderr ? `<div class="err">${esc(r.stderr)}</div>` : ''}<div class="exit">exit ${r.status}${note ? ` · ${esc(note)}` : ''}</div>`);
      };
      const ok = (r) => r.status === 0 && r.stderr === '';
      const failed = (r) => r.status !== 0 && r.stdout === '' && oneEnglishSentence(r.stderr);
      const a = runCli(['--size', '6', '--seed', '42']);
      await show(a, 'FR-28');
      const lines = a.stdout.trimEnd().split('\n');
      t.check('FR-28', ok(a) && lines.length === 6 && lines.every((l) => /^[01.]( [01.]){5}$/.test(l)) && a.stdout === gridText(E.generate(6, 42, 1).givens), '`--size 6 --seed 42` prints 6 lines of 6 space-separated tokens (0, 1 or .), the engine puzzle for that seed');
      const d = runCli([]);
      await show(d, 'FR-29: defaults');
      t.check('FR-29', ok(d) && d.stdout === runCli(['--size', '6', '--seed', '1']).stdout, 'no options means size 6 and seed 1');
      const sizeError = 'The size must be an even whole number from 4 to 16.\n';
      const s5 = runCli(['--size', '5']);
      await show(s5, 'FR-16: odd');
      t.check(['FR-16', 'FR-30'], failed(s5) && s5.stderr === sizeError, 'an odd size: one English sentence on stderr, exit non-zero, nothing on stdout');
      const s2 = runCli(['--size', '2']);
      await show(s2, 'FR-17: below 4');
      t.check(['FR-17', 'FR-30'], failed(s2) && s2.stderr === sizeError, 'a size below 4 is rejected the same way');
      const s18 = runCli(['--size', '18']);
      await show(s18, 'FR-49: above 16');
      t.check(['FR-49', 'FR-30'], failed(s18) && s18.stderr === sizeError, 'a size above 16 is rejected the same way');
      const bad = ['6.5', '+6', '-2', '1e1', '0x6', ''].map((v) => runCli(['--size', v]));
      for (const r of bad.slice(0, 3)) await show(r, 'FR-53: digits only');
      t.check(['FR-53', 'FR-30'], bad.every((r) => failed(r) && r.stderr === 'The size must be written as whole decimal digits only.\n'), '`6.5`, `+6`, `-2`, `1e1`, `0x6` and an empty value are not whole decimal digits');
      const zero = runCli(['--size', '06', '--seed', '42']);
      await show(zero, 'FR-53: leading zero');
      t.check('FR-53', zero.stdout === a.stdout, '`06` means 6');
      const seedHigh = runCli(['--seed', '2147483648']);
      await show(seedHigh, 'FR-51, FR-52');
      t.check(['FR-51', 'FR-52'], failed(seedHigh) && seedHigh.stderr === 'The seed must be a whole number from 0 to 2147483647.\n', 'a seed above 2147483647: one English sentence on stderr, exit non-zero, nothing on stdout');
      const seedBad = runCli(['--seed', '-1']);
      t.check('FR-52', failed(seedBad), 'a seed that is not digits is rejected the same way');
      const missing = runCli(['--size']);
      await show(missing, 'FR-54: no value');
      const unknown = runCli(['--colour', 'red']);
      await show(unknown, 'FR-54: unknown option');
      t.check('FR-54', failed(missing) && missing.stderr === 'The --size option needs a value.\n' && failed(unknown) && unknown.stderr === 'Unknown option: only --size, --seed and --level are supported.\n', 'an option without a value and an unknown option: one English sentence each, exit non-zero');
      const l3 = runCli(['--size', '6', '--seed', '42', '--level', '3']);
      await show(l3, 'FR-85');
      const l1 = runCli(['--size', '6', '--seed', '42', '--level', '1']);
      t.check('FR-85', ok(l3) && l3.stdout === gridText(E.generate(6, 42, 3).givens) && l1.stdout === a.stdout && l3.stdout !== a.stdout, '`--level 3` prints the level 3 puzzle in the same shape; without `--level` the output is byte-identical to `--level 1`');
      const levels = ['0', '5', '1.5', ''].map((v) => runCli(['--size', '6', '--level', v]));
      for (const r of levels.slice(0, 2)) await show(r, 'FR-86');
      const four = runCli(['--size', '4', '--level', '2']);
      await show(four, 'FR-86: 4×4 has level 1 only');
      const levelMissing = runCli(['--level']);
      t.check('FR-86', levels.every(failed) && failed(four) && failed(levelMissing) && four.stderr === 'Levels 2 to 4 need a size of 6 or more.\n', 'levels 0, 5, 1.5, an empty or missing value, and level 2 at size 4: an English sentence on stderr, exit non-zero, nothing on stdout');
      t.check('FR-81', levels[1].stderr === 'The level must be a whole number from 1 to 4.\n' && four.stderr === 'Levels 2 to 4 need a size of 6 or more.\n', 'the generator rejects a level outside 1 to 4, and a level above 1 at N = 4');
      const runOut = runCli(['--size', '6', '--seed', '1422', '--level', '2']);
      await show(runOut, 'FR-84: run-out');
      let fewer = null;
      try { buildPuzzle(6, 1422, 2, MAX_ATTEMPTS); } catch (e) { fewer = e; }
      t.check('FR-84', MAX_ATTEMPTS === 100 && failed(runOut) && runOut.stderr === 'No puzzle of the requested level was found within the attempt limit.\n' && fewer instanceof E.GenerationRunOutError, 'after 100 attempts (6, seed 1422, level 2) the generator throws its own run-out error and returns no puzzle; the CLI prints it');
      await terminalAppend(page, '<div class="engine">engine calls (no CLI or page path)</div><div class="note">The CLI grammar rejects a fractional size before the engine sees it, and no board with valid FR-119 givens leaves the page without a hint, so these two rows are shown on the engine directly.</div>');
      const engineLines = [];
      for (const v of [4.5, NaN, Infinity]) {
        try { E.generate(v, 1); engineLines.push([`generate(${v}, 1)`, 'returned a puzzle']); } catch (e) { engineLines.push([`generate(${v}, 1)`, `${e.name}: ${e.message}`]); }
      }
      for (const [call, result] of engineLines) await terminalAppend(page, `<div class="cmd">&gt; ${esc(call)}</div><div class="err">${esc(result)}</div>`);
      t.check('FR-50', engineLines.every(([, r]) => /Error: /.test(r)), 'a size that is not an integer (4.5, NaN, Infinity) is rejected with an error, no puzzle returned');
      const isolated = emptyGrid(6);
      isolated[0][0] = 0;
      isolated[3][4] = 1;
      const none = E.hint(isolated, 4);
      const noneEn = E.hint(isolated, 4, 'en');
      await terminalAppend(page, `<div class="cmd">&gt; hint(two isolated digits, ceiling 4)</div><div class="out">${esc(JSON.stringify({ kind: none.kind, sentence: none.sentence }))}\n${esc(JSON.stringify({ kind: noneEn.kind, sentence: noneEn.sentence }))}</div>`);
      t.check('FR-25', none.kind === 'none' && none.sentence === 'Жодне з правил зараз не підказує наступного ходу.' && noneEn.kind === 'none' && !cyrillic.test(noneEn.sentence), 'when no technique applies the hint targets no cell and says «Жодне з правил зараз не підказує наступного ходу.» (in English too)');
      await t.still();
    },
  },
  {
    id: '14-cell-states-light',
    title: 'NFR-11, light: a violation, a given, a player entry and the hinted cell, each with a non-colour cue',
    proof: ['NFR-11', 'FR-32', 'FR-64', 'FR-66'],
    scheme: 'light',
    async run(t) {
      await cellStates(t, 'light');
    },
  },
  {
    id: '15-cell-states-dark',
    title: 'NFR-11, dark: a violation, a given, a player entry and the hinted cell, each with a non-colour cue',
    proof: ['NFR-11', 'FR-32', 'FR-64', 'FR-66'],
    scheme: 'dark',
    async run(t) {
      await cellStates(t, 'dark');
    },
  },
  {
    id: '16-logo-40',
    title: 'NFR-15: the header logo at 40×40 CSS px',
    proof: ['NFR-15', 'FR-72'],
    dpr: 1,
    async run(t) {
      const { page } = t;
      await t.open({ seed: 61 });
      await t.say('The page\'s own header logo, sized to 40×40 CSS px for this still (capture-only style)');
      await page.addStyleTag({ content: '.page-header h1 .logo { width: 40px !important; height: 40px !important; }' });
      await t.pause();
      const box = await page.locator('header h1 svg.logo').boundingBox();
      const logo = await page.evaluate(() => { const svg = document.querySelector('header h1 svg.logo'); return { texts: svg.querySelectorAll('text').length, words: svg.textContent.trim(), bars: svg.querySelectorAll('.logo-digit').length, rings: svg.querySelectorAll('.logo-digit-ring').length, dpr: devicePixelRatio }; });
      t.check('NFR-15', Math.round(box.width) === 40 && Math.round(box.height) === 40 && logo.dpr === 1, 'the logo is drawn at 40×40 CSS px, device pixel ratio 1');
      t.check('FR-72', logo.texts === 0 && logo.words === '' && logo.bars === 2 && logo.rings === 2, 'the logo carries no text; its digits «1 0 / 0 1» are two bars and two rings');
      await t.still({ element: 'header h1', margin: 12 });
    },
  },
];

/** The four NFR-11 states on one board, in one scheme. */
async function cellStates(t, scheme) {
  const { page } = t;
  const value = fourStateBoard();
  await t.open({ board: value });
  await t.say(`The four cell states in the ${scheme} scheme`);
  const b = await t.read();
  const state = (x) => (x.classes.includes('cell-hinted') ? 'hinted' : x.classes.includes('cell-violation') ? 'violation' : x.given ? 'given' : x.text !== '' ? 'entry' : 'empty');
  const counts = {};
  for (const x of b.cells) counts[state(x)] = (counts[state(x)] ?? 0) + 1;
  const scheme_ = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  t.check('NFR-11', scheme_ === scheme && counts.hinted === 1 && counts.violation >= 3 && counts.given >= 5 && counts.entry >= 2, `the board shows all four states in the ${scheme} scheme (${counts.violation} violation, ${counts.given} given, ${counts.entry} entry, ${counts.hinted} hinted)`);
  const cues = await page.evaluate(() => {
    const pick = (q) => document.querySelector(q);
    const style = (el) => { const s = getComputedStyle(el); return { bw: parseFloat(s.borderTopWidth), bs: s.borderTopStyle, fw: s.fontWeight, fs: s.fontStyle, td: s.textDecorationLine, bg: s.backgroundImage }; };
    return {
      violation: style(pick('[data-cell].cell-violation:not(.cell-given)')),
      given: style(pick('[data-cell].cell-given:not(.cell-violation)')),
      entry: style(pick('[data-cell][data-given="false"]:not(.cell-violation):not(.cell-hinted):not(:empty)')),
      hinted: style(pick('[data-cell].cell-hinted')),
    };
  });
  const key = (s) => JSON.stringify(s);
  t.check('NFR-11', new Set([cues.violation, cues.given, cues.entry, cues.hinted].map(key)).size === 4, `each state differs from the others by a non-colour property: violation ${cues.violation.bw}px ${cues.violation.td} with stripes, given weight ${cues.given.fw}, entry weight ${cues.entry.fw}, hinted ${cues.hinted.bs} ${cues.hinted.fs}`);
  t.check('FR-32', cues.given.fw === '800' && cues.entry.fw === '500', 'givens are told from player cells by weight (800 against 500)');
  t.check('FR-64', cues.violation.bw > cues.entry.bw, 'a violation cell has a heavier border than an ordinary cell');
  t.check('FR-66', same(b.withClass('cell-hinted'), [[1, 0]]), 'exactly one cell, row 2 column 1, carries cell-hinted');
  await t.still({ element: '[data-board]', margin: 20 });
}

/** The NFR-11 probe: the same board with every non-colour cue removed, so only colour tells the states apart (red run of check:vision). */
const PROBE_CSS = `
  [data-cell], [data-cell].cell-given, [data-cell].cell-hinted, [data-cell].cell-violation, [data-cell].cell-given.cell-violation {
    border-width: 1px !important; border-style: solid !important; font-weight: 500 !important; font-style: normal !important;
    text-decoration: none !important; background-image: none !important; box-shadow: none !important;
  }
  [data-cell].cell-cause::after { display: none !important; }`;

// ---------------------------------------------------------------------------------------------------------------------------------
// The preview server (as the adapter: its own `vite preview`, never another's).

let server = null;
const answers = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

async function startServer() {
  if (!existsSync('dist/index.html')) throw new Error('dist/index.html is missing: run "npm run build" first (npm run qa:record-demos does)');
  if (await answers(BASE_URL)) throw new Error(`something already answers on ${BASE_URL}; stop it first (the recordings use only the preview they start)`);
  let exit = null;
  let stderr = '';
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  process.on('exit', () => server?.kill());
  for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) process.once(sig, () => process.exit(128 + n));
  server.stderr.on('data', (chunk) => { stderr += chunk; });
  server.on('exit', (code, signal) => { exit ??= `exited with ${signal ?? `code ${code}`}`; });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (exit) throw new Error(`vite preview on ${BASE_URL} ${exit} before it answered${stderr ? `: ${stderr.trim().slice(-300)}` : ''}`);
    if (await answers(BASE_URL)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite preview did not answer on ${BASE_URL} within 30 s`);
}

// ---------------------------------------------------------------------------------------------------------------------------------

async function recordClip(browser, clip) {
  const viewport = clip.viewport ?? VIEWPORT;
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: clip.dpr ?? 2,
    colorScheme: clip.scheme ?? 'light',
    reducedMotion: 'reduce',
    locale: 'uk-UA',
    recordVideo: { dir: join(OUT_DIR, 'raw'), size: { width: Math.round(viewport.width * 0.75), height: Math.round(viewport.height * 0.75) } }, // 75%: smaller committed videos
  });
  await context.addInitScript(initScript);
  const page = await context.newPage();
  const log = [];
  const t = makeDriver(page, clip, log);
  let error = null;
  try {
    await clip.run(t);
    const missing = clip.proof.filter((id) => !t.asserted.has(id));
    if (missing.length) throw new Error(`the proof lists ${missing.join(', ')}, but the clip asserted nothing for it`);
    if (!t.stillPng) throw new Error('the clip took no still');
    await page.waitForTimeout(800); // the video's last frames show the settled state
  } catch (e) {
    error = e.message;
  }
  if (!t.stillPng) t.stillPng = await page.screenshot({ fullPage: true }).catch(() => null);
  const video = page.video();
  await page.close();
  await context.close();
  const base = join(OUT_DIR, clip.id);
  if (t.stillPng) await writeFile(`${base}.png`, t.stillPng);
  if (video) await video.saveAs(`${base}.webm`);
  const asserted = error === null;
  const md = `# ${clip.title}\n\n**Proves:** ${clip.proof.join(', ')}\n\n**Result:** ${asserted ? 'asserted ✓' : `FAILED: ${error}`}\n\n**Video:** [${clip.id}.webm](${clip.id}.webm) · recorded by \`scripts/record-demos.mjs\` against its own \`vite preview\` of the built page${clip.id === '13-cli-engine' ? ' (this clip runs `src/cli.ts` through tsx, as `npm run cli` does, and shows the output on a terminal page)' : ''}.\n\n## Assertions, in order\n\n${log.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\n![still](${clip.id}.png)\n`;
  await writeFile(`${base}.md`, md);
  console.log(`${asserted ? '✓' : '✗'} ${clip.id} (${clip.proof.join(', ')})${error ? ` — ${error}` : ''}`);
  return { id: clip.id, title: clip.title, proof: clip.proof.join(', '), video: `${base}.webm`, screenshot: `${base}.png`, explainer: `${base}.md`, asserted, assertions: log.length };
}

async function visionProbe(browser) {
  await mkdir(PROBE_DIR, { recursive: true });
  for (const scheme of ['light']) {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce' });
    await context.addInitScript(initScript);
    const page = await context.newPage();
    const t = makeDriver(page, { id: 'probe' }, []);
    await t.open({ board: fourStateBoard() });
    await page.addStyleTag({ content: PROBE_CSS });
    await t.still({ element: '[data-board]', margin: 20 });
    const path = join(PROBE_DIR, `probe-no-colour-cue-${scheme}.png`);
    await writeFile(path, t.stillPng);
    console.log(`wrote ${path}`);
    await context.close();
  }
}

async function main() {
  const only = flagValue('--only')?.split(',');
  const clips = only ? CLIPS.filter((c) => only.includes(c.id)) : CLIPS;
  if (only && clips.length !== only.length) throw new Error(`unknown clip id in --only ${only.join(',')}`);
  await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    if (argv.includes('--vision-probe')) {
      await visionProbe(browser);
      return 0;
    }
    if (!only && existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true, force: true });
    await mkdir(join(OUT_DIR, 'raw'), { recursive: true });
    const previous = only && existsSync(join(OUT_DIR, 'manifest.json')) ? JSON.parse(await readFile(join(OUT_DIR, 'manifest.json'), 'utf8')).results : [];
    const results = [];
    for (const clip of clips) results.push(await recordClip(browser, clip));
    await rm(join(OUT_DIR, 'raw'), { recursive: true, force: true });
    const merged = CLIPS.map((c) => results.find((r) => r.id === c.id) ?? previous.find((r) => r.id === c.id)).filter(Boolean);
    await writeFile(join(OUT_DIR, 'manifest.json'), `${JSON.stringify({ kind: 'demo', generatedBy: 'scripts/record-demos.mjs', results: merged }, null, 2)}\n`);
    console.log(`\nwrote ${results.length} clip(s) to ${OUT_DIR} (manifest: ${merged.length}). Validate: node scripts/check-recordings.mjs`);
    return results.every((r) => r.asserted) ? 0 : 1;
  } finally {
    await browser.close();
    server?.kill();
  }
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e.message);
    process.exit(1);
  },
);
