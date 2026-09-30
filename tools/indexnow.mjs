// Meldt alle URL's uit public/sitemap.xml aan bij IndexNow (Bing, Yandex, Naver, Seznam; Google doet niet mee).
// Gebruik: npm run indexnow   (na een deploy; het sleutelbestand /<key>.txt moet live staan)
import fs from 'node:fs';

const SITE = 'https://buildcalc.vanali.workers.dev';
const key = fs.readdirSync('public').map((f) => /^([0-9a-f]{32})\.txt$/.exec(f)).filter(Boolean)[0]?.[1];
if (!key) { console.error('geen sleutelbestand public/<32 hex>.txt gevonden; eerst npm run build'); process.exit(1); }
const sm = fs.readFileSync('public/sitemap.xml', 'utf8');
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const live = await fetch(`${SITE}/${key}.txt`);
if (!live.ok || (await live.text()).trim() !== key) { console.error('sleutelbestand staat niet live; eerst npm run deploy'); process.exit(1); }

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/${key}.txt`, urlList: urls }),
});
console.log('IndexNow:', r.status, r.statusText, '-', urls.length, "URL's aangemeld");
