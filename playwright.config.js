// Tests run against the built site (public/) served by tools/serve.mjs, which mimics
// Cloudflare Static Assets (index.html per folder, nearest 404.html). `npm test` builds first.
import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

// Use a preinstalled Chromium when present (CHROMIUM_PATH or /opt/pw-browsers/chromium),
// otherwise the normal Playwright download (npx playwright install chromium).
const chromiumPath = process.env.CHROMIUM_PATH ||
  (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8790',
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
  },
  webServer: {
    command: 'node tools/serve.mjs 8790',
    url: 'http://localhost:8790',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobiel-360', use: { viewport: { width: 360, height: 740 }, hasTouch: true } },
  ],
});
