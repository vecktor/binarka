// index.html: the theme-color meta and the classic inline head step that applies the stored theme before the first paint
// (add-theme-switch). One test per jsdom/source scenario of the delta spec openspec/changes/add-theme-switch/specs/play-page/spec.md,
// title = scenario name, from the requirements «Browser colour follows the theme» (the static half) and «Preferences are applied
// before the first paint». Written FIRST (red): index.html has no meta, no inline head script and no preferences module yet.
//
// The head step is run for real: `new JSDOM(html, { runScripts: 'dangerously', beforeParse })` parses index.html and runs its inline
// classic script exactly as a browser does, with the storage and matchMedia stubbed in `beforeParse` (autonomy-log row 124, A5);
// script errors reach a VirtualConsole `jsdomError` listener, so "raises no error" is a real check. The built-file test makes its OWN
// `vite build --outDir <temporary directory>` and fails loudly if the build fails: it never skips and never reads a stale dist/.
// The colours the head step must carry are read from src/ui/style.css (--color-page of the light and of the dark token set).
// The real-browser flash check (NFR-18) lives in e2e/nfr-18-flash.spec.ts.
//
// @trace FR-116
// @trace FR-106
// @trace FR-104
// @trace FR-114
// @trace FR-115
// @trace FR-113
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { readStyles, themeTokenSets } from './helpers/css';

const ROOT = process.cwd();
const INDEX_HTML = readFileSync(`${ROOT}/index.html`, 'utf8');
const KEY = 'binarka.theme';

const parse = (html: string): Document => new DOMParser().parseFromString(html, 'text/html');

/** `--color-page` of the light and of the dark token set of the stylesheet (the dark set must exist). */
function pageColours(): { light: string; dark: string } {
  const [light, dark] = themeTokenSets(readStyles());
  return { light: (light?.tokens['--color-page'] ?? '').toLowerCase(), dark: (dark?.tokens['--color-page'] ?? '').toLowerCase() };
}

/** The inline classic scripts of a parsed document's head (no src, not a module). */
const inlineClassicScripts = (doc: Document): HTMLScriptElement[] =>
  Array.from(doc.head.querySelectorAll('script')).filter((s) => !s.hasAttribute('src') && (s.getAttribute('type') ?? '') !== 'module');

describe('Browser colour follows the theme (the static half)', () => {
  it('The meta exists once and has the page colour', () => {
    const doc = parse(INDEX_HTML);
    expect(doc.head.querySelectorAll('meta[name="theme-color"]'), 'exactly one theme-color meta in the head').toHaveLength(1);
    expect(doc.querySelectorAll('meta[name="theme-color"]'), 'and none elsewhere').toHaveLength(1);
    expect(doc.querySelectorAll('meta[name="description"]'), 'no description meta (Q12)').toHaveLength(0);
    expect(doc.head.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '', 'the meta carries a #rrggbb colour').toMatch(
      /^#[0-9a-f]{6}$/i,
    );
  });
});

describe('Preferences are applied before the first paint', () => {
  it('The head step is a classic inline script in the head', () => {
    const doc = parse(INDEX_HTML);
    const scripts = inlineClassicScripts(doc);
    expect(scripts, 'the head holds an inline classic script').toHaveLength(1);
    const script = scripts[0];
    expect.assert(script !== undefined, 'premise: the head step exists');
    expect(script.hasAttribute('src')).toBe(false);
    expect(script.getAttribute('type') ?? '').not.toBe('module');
    expect(script.hasAttribute('defer'), 'no defer').toBe(false);
    expect(script.hasAttribute('async'), 'no async').toBe(false);
    expect(script.textContent.trim(), 'it has a body').not.toBe('');
    for (const bodyScript of Array.from(doc.body.querySelectorAll('script'))) {
      expect(bodyScript.textContent, 'no body script sets the theme').not.toMatch(/data-theme|binarka\.theme|theme-color/);
    }
  });

  interface Run {
    theme: string | null;
    meta: string | null;
    errors: string[];
  }

  /** Run the REAL head step of index.html in jsdom with the given storage and system theme. */
  function runHeadStep(options: { stored?: string; storage?: 'ok' | 'access-throws' | 'getItem-throws'; system?: 'dark' | 'light' | 'none' | 'throws' }): Run {
    const errors: string[] = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (error) => { errors.push(error.message); });
    const dom = new JSDOM(INDEX_HTML, {
      url: 'http://localhost/',
      runScripts: 'dangerously',
      virtualConsole,
      beforeParse(window) {
        const storage = options.storage ?? 'ok';
        if (storage === 'ok' && options.stored !== undefined) window.localStorage.setItem(KEY, options.stored);
        if (storage === 'access-throws') {
          Object.defineProperty(window, 'localStorage', {
            configurable: true,
            get(): Storage {
              throw new DOMException('The operation is insecure.', 'SecurityError');
            },
          });
        }
        if (storage === 'getItem-throws') {
          const broken = {
            getItem(): string | null {
              throw new Error('getItem is broken');
            },
            setItem(): void { /* a storage stub: writes go nowhere */ },
            removeItem(): void { /* a storage stub */ },
          };
          Object.defineProperty(window, 'localStorage', { configurable: true, value: broken });
        }
        const system = options.system ?? 'none';
        if (system === 'dark' || system === 'light') {
          Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: (query: string) => ({ matches: system === 'dark', media: query, addEventListener(): void { /* a listener-less stub */ }, removeEventListener(): void { /* a listener-less stub */ } }),
          });
        }
        if (system === 'throws') {
          Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: () => {
              throw new Error('matchMedia is broken');
            },
          });
        }
      },
    });
    const { document: doc } = dom.window;
    return {
      theme: doc.documentElement.getAttribute('data-theme'),
      meta: doc.querySelector('meta[name="theme-color"]')?.getAttribute('content')?.toLowerCase() ?? null,
      errors,
    };
  }

  it('The head step sets the attributes', () => {
    const dark = runHeadStep({ stored: 'dark', system: 'light' });
    const light = runHeadStep({ stored: 'light', system: 'dark' });
    const auto = runHeadStep({ stored: 'auto', system: 'dark' });
    for (const run of [dark, light, auto]) expect(run.errors).toEqual([]);
    expect(dark.theme, 'stored dark on a light system').toBe('dark');
    expect(light.theme, 'stored light on a dark system').toBe('light');
    expect(auto.theme, 'stored auto on a dark system').toBe('dark');

    const colours = pageColours();
    expect(dark.meta, 'the --color-page of the dark set').toBe(colours.dark);
    expect(light.meta, 'the --color-page of the light set').toBe(colours.light);
    expect(auto.meta).toBe(colours.dark);
  });

  it('The head step survives bad and throwing storage', () => {
    const runs: [string, Run, string][] = [
      ['a bad stored value, no matchMedia', runHeadStep({ stored: 'Dark' }), 'light'],
      ['a bad stored value on a dark system', runHeadStep({ stored: 'system', system: 'dark' }), 'dark'],
      ['storage whose access throws, no matchMedia', runHeadStep({ storage: 'access-throws' }), 'light'],
      ['storage whose access throws, dark system', runHeadStep({ storage: 'access-throws', system: 'dark' }), 'dark'],
      ['getItem that throws', runHeadStep({ storage: 'getItem-throws', system: 'dark' }), 'dark'],
      ['a matchMedia that throws', runHeadStep({ stored: 'auto', system: 'throws' }), 'light'],
    ];
    for (const [name, run, theme] of runs) {
      expect(run.errors, `${name}: it raises no error`).toEqual([]);
      expect(run.theme, `${name}: data-theme is the system theme`).toBe(theme);
    }
    const colours = pageColours();
    for (const [name, run, theme] of runs) {
      expect(run.meta, `${name}: the meta follows`).toBe(theme === 'dark' ? colours.dark : colours.light);
    }
  });

  it('The duplicated names and colours equal the module and the tokens', () => {
    const script = inlineClassicScripts(parse(INDEX_HTML))[0]?.textContent ?? '';
    expect(script, 'premise: the head step exists').not.toBe('');
    const uiDir = `${ROOT}/src/ui`;
    const modules = readdirSync(uiDir)
      .filter((name) => name.endsWith('.ts') && name !== 'strings.ts')
      .map((name) => ({ name, text: readFileSync(`${uiDir}/${name}`, 'utf8') }))
      .filter((file) => /['"]binarka\.theme['"]/.test(file.text));
    expect(modules.length, 'exactly one preferences module under src/ui/ exports the key binarka.theme (the head step is the one deliberate duplicate)').toBe(1);
    const moduleText = modules[0]?.text.toLowerCase() ?? '';
    const colours = pageColours();

    expect(/['"]binarka\.theme['"]/.test(script), 'the key name in the head step equals the module\'s').toBe(true);
    for (const [name, colour] of [['light', colours.light], ['dark', colours.dark]] as const) {
      expect(colour, `premise: the ${name} --color-page is #rrggbb`).toMatch(/^#[0-9a-f]{6}$/);
      expect(script.toLowerCase(), `the head step holds the ${name} --color-page ${colour}`).toContain(colour);
      expect(moduleText, `the preferences module holds the ${name} --color-page ${colour}`).toContain(colour);
    }
  });

  it('The built file keeps the order', { timeout: 180_000 }, () => {
    const outDir = mkdtempSync(join(tmpdir(), 'binarka-theme-build-'));
    try {
      const build = spawnSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], { cwd: ROOT, encoding: 'utf8', timeout: 170_000 });
      expect(build.status, `vite build into ${outDir} must succeed (never skipped): ${build.stderr}\n${build.stdout}`).toBe(0);
      let html = '';
      try {
        html = readFileSync(join(outDir, 'index.html'), 'utf8');
      } catch (error) {
        expect.assert(false, `the build made no index.html in ${outDir}: ${String(error)}`);
      }
      const head = Array.from(parse(html).head.children);
      const indexOf = (predicate: (el: Element) => boolean): number => head.findIndex(predicate);
      const inline = indexOf((el) => el.tagName === 'SCRIPT' && !el.hasAttribute('src') && el.getAttribute('type') !== 'module');
      const module = indexOf((el) => el.tagName === 'SCRIPT' && el.getAttribute('type') === 'module');
      const sheet = indexOf((el) => el.tagName === 'LINK' && (el.getAttribute('rel') ?? '').includes('stylesheet'));
      expect(inline, 'the built head holds the inline classic script').toBeGreaterThanOrEqual(0);
      expect(module, 'the built head holds the module script Vite injected').toBeGreaterThanOrEqual(0);
      expect(sheet, 'the built head holds the stylesheet link Vite injected').toBeGreaterThanOrEqual(0);
      expect(inline, 'the inline script precedes the module script').toBeLessThan(module);
      expect(inline, 'the inline script precedes the stylesheet link').toBeLessThan(sheet);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
