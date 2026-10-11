import { defineConfig, devices } from '@playwright/test';

// Real-browser checks of the built play page in Chromium only (NFR-7, TC-13, A-14).
// Projects: `layout` carries NFR-10, NFR-12 and NFR-18 (the flash-on-reload spec joins it through one more `testMatch` pattern, approved in
// autonomy-log row 117; no new project) and, since update-page-layout-geometry, NFR-14's layout geometry (one more pattern, approved in autonomy-log
// row 150), `a11y` carries NFR-13 (`npm run check:a11y`).
// Every check samples fixed viewports and states; coverage is `sampled`, never continuum.
// The port is BINARKA_PORT_BASE (default 4173), the session's base port of scripts/capture-ports.mjs (PD-4), so parallel worktrees
// that pick different bases share no port. Workers load this file too and inherit the variable, so they agree on it.
const PORT = portBase(process.env.BINARKA_PORT_BASE);

function portBase(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 4173;
  const base = Number(raw);
  if (!Number.isInteger(base) || base < 1024 || base > 65530) throw new Error(`BINARKA_PORT_BASE must be an integer from 1024 to 65530, not "${raw}"`);
  return base;
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'docs/qa/e2e-report.json' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'layout', testMatch: [/nfr-1[02]-.*\.spec\.ts/, /nfr-18-.*\.spec\.ts/, /nfr-14-.*\.spec\.ts/] },
    { name: 'a11y', testMatch: /nfr-13-.*\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
