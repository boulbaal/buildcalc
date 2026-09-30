// Live checks against https://buildcalc.vanali.workers.dev (no local server).
import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

const chromiumPath = process.env.CHROMIUM_PATH ||
  (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: './tests-live',
  timeout: 60_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.LIVE_URL || 'https://buildcalc.vanali.workers.dev',
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
  },
});
