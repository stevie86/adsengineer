import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: resolve(__dirname, 'setup/e2e-setup.ts'),
    globalTeardown: resolve(__dirname, 'setup/e2e-teardown.ts'),
    timeout: 30000,
    hookTimeout: 30000,
    retry: 2,
  },
  testTimeout: 60000,
  hookTimeout: 60000,
});