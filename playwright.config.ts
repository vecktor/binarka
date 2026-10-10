import { defineConfig, devices } from '@playwright/test';

// Real-browser checks of the built play page in Chromium only (NFR-7, TC-13, A-14).
// Projects: `layout` carries NFR-10, NFR-12 and NFR-18 (the flash-on-reload spec joins it through one more `testMatch` pattern, approved in
// autonomy-log row 117; no new project) and, since update-page-layout-geometry, NFR-14's layout geometry (one more pattern, approved in autonomy-log
// row 150), `a11y` carries NFR-13 (`npm run check:a11y`).
// Every check samples fixed viewports and states; coverage is `sampled`, never continuum.
const PORT = 4173;

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
