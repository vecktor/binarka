import { defineConfig } from 'vitest/config';

// ngrok tunnels to the dev and preview servers: a leading dot allows every subdomain, so each new ngrok URL works without an edit.
const tunnelHosts = ['.ngrok-free.app'];

export default defineConfig({
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
});
