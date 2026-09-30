// BuildCalc end-to-end tests. Run: npm test (builds, serves public/ and runs on desktop + 360 px).
// Every page in every language is loaded and checked; control values are checked per calculator
// in the language's default unit system, and the unit toggle is checked in English.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const LANGS = JSON.parse(fs.readFileSync(new URL('../tools/langs.json', import.meta.url), 'utf8'));
const BUILT = Object.keys(LANGS).filter((l) => fs.existsSync(new URL(`../src/i18n/${l}/`, import.meta.url)));
const root = (l) => (l === 'en' ? '/' : `/${l}/`);
const D = '[.,٫]'; // decimal separator in any locale

const CALCS = {
  roof:     { slug: 'roof-pitch-calculator/', imperial: [/6:12/, /26\.57/], metric: [new RegExp(`26${D}57`), /6:12/] },
  concrete: { slug: 'concrete-calculator/',   imperial: [/1\.23/, /62/],    metric: [new RegExp(`0${D}9`), /81/] },
  paint:    { slug: 'paint-calculator/',      imperial: [/(^|\D)2(\D|$)/],  metric: [/(^|\D)7(\D|$)/] },
  tile:     { slug: 'tile-calculator/',       imperial: [/130/],            metric: [/144/] },
  stair:    { slug: 'stair-calculator/',      imperial: [/13/, /7\.69/],    metric: [/14/, new RegExp(`19${D}29`)] },
};
const PAGES = [{ id: 'home', slug: '' }, ...Object.entries(CALCS).map(([id, c]) => ({ id, slug: c.slug }))];

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return errors;
}

async function commonChecks(page, lang) {
  const meta = LANGS[lang];
  await expect(page.locator('html')).toHaveAttribute('lang', lang);
  await expect(page.locator('html')).toHaveAttribute('dir', meta.rtl ? 'rtl' : 'ltr');
  const title = await page.title();
  expect(title.length).toBeGreaterThan(3);
  const html = await page.content();
  expect(html).not.toContain('{{');
  await expect(page.locator('h1')).not.toBeEmpty();
  await expect(page.locator('#lang option')).toHaveCount(BUILT.length);
  // no horizontal scrolling (also at 360 px)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
}

for (const lang of BUILT) {
  test.describe(`${lang}`, () => {
    for (const p of PAGES) {
      test(`${p.id} loads cleanly`, async ({ page }) => {
        const errors = watchErrors(page);
        const res = await page.goto(root(lang) + p.slug);
        expect(res.status()).toBe(200);
        await commonChecks(page, lang);
        const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
        expect(canonical).toBe('https://buildcalc.vanali.workers.dev' + root(lang) + p.slug);
        await expect(page.locator('link[rel=alternate][hreflang]')).toHaveCount(BUILT.length + 1);

        if (p.id !== 'home') {
          const units = LANGS[lang].units;
          const main = page.locator('#r-main');
          await expect(main).not.toHaveText(/^\s*$/);
          const text = await page.locator('#result').innerText();
          expect(text).not.toMatch(/NaN|Infinity|undefined/);
          expect(text, 'untranslated key in result').not.toMatch(/\b[a-z]+_[a-z_]+\b/);
          for (const re of CALCS[p.id][units]) expect(await main.innerText(), `${units} control value`).toMatch(re);
          // donation block appears after a result, with the PayPal link
          await expect(page.locator('#donate')).toBeVisible();
          const cur = lang === 'en' ? 'USD' : 'EUR';
          const amounts = page.locator('#donate a.amount');
          await expect(amounts).toHaveCount(5);
          await expect(amounts.nth(2)).toHaveAttribute('href', `https://www.paypal.com/paypalme/ABoullbahaiem/5${cur}`);
          await expect(page.locator('#donate [data-donate-free]')).toHaveAttribute('href', 'https://www.paypal.com/paypalme/ABoullbahaiem');
          // FAQ structured data is valid JSON with 5 questions
          const ld = await page.locator('script[type="application/ld+json"]').allInnerTexts();
          const faq = ld.map((s) => JSON.parse(s)).find((j) => j['@type'] === 'FAQPage');
          expect(faq.mainEntity).toHaveLength(5);
        }
        expect(errors).toEqual([]);
      });
    }

    test('404 page is localized', async ({ page }) => {
      const res = await page.goto(root(lang) + 'does-not-exist/');
      expect(res.status()).toBe(404);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).not.toBeEmpty();
    });
  });
}

test.describe('unit toggle (English)', () => {
  for (const [id, c] of Object.entries(CALCS)) {
    if (id === 'roof') continue; // roof pitch is unit-free
    test(`${id}: imperial -> metric -> imperial`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto('/' + c.slug);
      const main = page.locator('#r-main');
      await page.locator('.units button[data-units=metric]').click();
      await expect(page.locator('.units button[data-units=metric]')).toHaveAttribute('aria-pressed', 'true');
      for (const re of c.metric) await expect(main).toHaveText(re);
      await page.locator('.units button[data-units=imperial]').click();
      for (const re of c.imperial) await expect(main).toHaveText(re);
      expect(errors).toEqual([]);
    });
  }
});

test('invalid input never shows NaN and shows an error', async ({ page }) => {
  await page.goto('/concrete-calculator/');
  await page.locator('#length').fill('-5');
  await expect(page.locator('#length-error')).not.toBeEmpty();
  await expect(page.locator('#result')).not.toHaveText(/NaN|Infinity/);
});

test('sitemap lists every page in every language', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>/g)].length;
  expect(locs).toBe(PAGES.length * BUILT.length);
});

test('language switcher navigates to the same page in another language', async ({ page }) => {
  test.skip(BUILT.length < 2, 'only one language built');
  await page.goto('/stair-calculator/');
  const other = BUILT.find((l) => l !== 'en');
  await page.locator('#lang').selectOption(`/${other}/stair-calculator/`);
  await expect(page).toHaveURL(new RegExp(`/${other}/stair-calculator/$`));
  await expect(page.locator('html')).toHaveAttribute('lang', other);
});
