# BuildCalc

Five free construction calculators in 23 languages. No ads, no tracking, no sign-up, works offline.

**Live:** https://buildcalc.vanali.workers.dev

| Calculator | What it does |
|---|---|
| Roof pitch | Rise and run to degrees, percent and X:12, plus the pitch multiplier for roof area |
| Concrete slab | Volume and number of bags (40/60/80 lb or 25 kg) with waste margin |
| Paint | Paint needed per room, minus doors and windows, per number of coats |
| Tile | Tiles and boxes from area and tile size, with grout gap and cutting waste |
| Stairs | Risers and treads from total rise, checked against US IRC limits and the comfort rule |

Languages: English, Nederlands, Français, Deutsch, Español, Português, Polski, Українська, Русский, Türkçe, العربية, اردو, हिन्दी, বাংলা, Bahasa Indonesia, Tiếng Việt, 中文, 日本語, 한국어, Kiswahili, ⵜⴰⵎⴰⵣⵉⵖⵜ, Kurdî, chiShona. English defaults to imperial units, every other language to metric; each calculator can switch.

Found a mistake in a formula or a translation? [Open an issue](https://github.com/boulbaal/buildcalc/issues).

## How it is built

| Part | Choice |
|---|---|
| Hosting | Cloudflare Workers, Static Assets only (free plan, no worker code, no database) |
| Pages | Plain HTML, CSS and JavaScript, system fonts (only Tifinagh is bundled) |
| Translations | `src/i18n/<lang>/<section>.json`, checked by the build: same keys, placeholders and HTML tags as English |
| Build | `tools/build.mjs` (no dependencies) renders `src/pages/*.html` for every language into `public/` |
| Tests | Playwright on desktop and 360 px: every page in every language, plus control values per calculator (336 tests) |

```
src/
  pages/        one template per page (home, roof, concrete, paint, tile, stair, 404)
  i18n/<lang>/  translations per page section, plus common.json
  assets/       style.css, calc.js (shared helpers, donation links), favicon, Tifinagh font
  static/       copied as-is: _headers, IndexNow key
tools/          build.mjs, serve.mjs (local preview), indexnow.mjs, langs.json
tests/          Playwright tests
```

## License

MIT for the code.

---

# Nederlands: werken met BuildCalc

## Eenmalig online zetten (±5 minuten, gratis)

Nodig: Node 18+ en hetzelfde Cloudflare-account als Whenly.

```
npm install
npx wrangler login        # alleen als wrangler nog niet ingelogd is
npm run deploy
```

`npm run deploy` bouwt, zet online en controleert daarna de live site (`npm run check:live`): draait de live site echt de nieuwe versie, werken de doneerknoppen en opent PayPal de juiste pagina. De eerste keer vraagt dat eenmalig: `npx playwright install chromium`.

Onderaan staat het adres: `https://buildcalc.vanali.workers.dev`. Daarna eenmalig:

```
npm run indexnow          # meldt alle pagina's aan bij Bing, Yandex, Naver en Seznam
```

En in Google Search Console de sitemap indienen: `https://buildcalc.vanali.workers.dev/sitemap.xml`.

## Iets aanpassen

1. Tekst wijzigen: `src/i18n/<taal>/<pagina>.json`. Een nieuwe tekst eerst in `en`, dan in alle andere talen (de build weigert als een taal een sleutel mist).
2. Layout of rekenlogica: `src/pages/<pagina>.html`.
3. Donatielinks: bovenaan `src/assets/calc.js` (`DONATE`).
4. `npm test` (bouwt en test alles), daarna `npm run deploy`.
5. Broncode naar GitHub: `bash publiceer.sh "wat je veranderde"` (werkt de repo boulbaal/buildcalc bij).

Lokaal bekijken: `npm run build && node tools/serve.mjs` en open http://localhost:8790.
