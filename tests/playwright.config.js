// Browser tests against a local static server + the Firebase Emulator Suite (never
// production). Run:  cd tests && npm run test:e2e
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'e2e-results/results.json' }]],
  outputDir: 'e2e-results/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:5055',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'mn-MN',
    serviceWorkers: 'allow'
  },
  webServer: {
    command: 'node e2e/serve.js 5055',
    url: 'http://127.0.0.1:5055/',
    reuseExistingServer: true,
    timeout: 20000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'tablet', use: { ...devices['Galaxy Tab S4'], browserName: 'chromium' } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ]
});
