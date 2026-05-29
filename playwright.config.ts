import { defineConfig } from '@playwright/test';

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  reporter: [['list']],
  use: {
    baseURL: apiBaseUrl,
    extraHTTPHeaders: {
      Accept: 'application/json'
    }
  }
});
