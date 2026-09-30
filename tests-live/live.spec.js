// Live check against the deployed site. Run after every deploy: npm run check:live
// (npm run deploy does this automatically). Verifies the live site runs the same build
// as your local public/ folder and that the donation buttons open the right PayPal page.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const local = JSON.parse(fs.readFileSync(new URL('../public/version.json', import.meta.url), 'utf8')).version;

test('live site runs the build you just made', async ({ request }) => {
  const res = await request.get('/version.json', { headers: { 'Cache-Control': 'no-cache' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).version, 'live version differs from local build: deploy did not go through').toBe(local);
});

for (const [lang, cur] of [['en', 'USD'], ['nl', 'EUR']]) {
  test(`live donate buttons work (${lang})`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto((lang === 'en' ? '/' : `/${lang}/`) + 'paint-calculator/');
    const amounts = page.locator('#donate a.amount');
    await expect(amounts).toHaveCount(5);
    await expect(amounts.nth(2)).toHaveAttribute('href', `https://www.paypal.com/paypalme/ABoulbahaiem/5${cur}`);
    const [popup] = await Promise.all([page.waitForEvent('popup'), amounts.nth(2).click()]);
    await popup.waitForURL(/paypal\.com\/.*ABoulbahaiem/i, { timeout: 30_000 });
    expect(errors).toEqual([]);
  });
}

test('PayPal.me profile exists and shows the right name', async ({ page }) => {
  await page.goto('https://www.paypal.com/paypalme/ABoulbahaiem');
  await expect(page.getByText('Boulbahaiem').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Boullbahaiem')).toHaveCount(0);
});
