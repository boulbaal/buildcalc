#!/usr/bin/env node
// BuildCalc build: src/ (templates + translations) -> public/ (static site for Cloudflare Workers).
// Usage: node tools/build.mjs            build everything
//        node tools/build.mjs --check    only validate translations
//        node tools/build.mjs --check --lang nl   validate one language
//
// Template syntax (src/pages/*.html):
//   {{key}}        string from the page section, falling back to "common" (HTML allowed)
//   {{key@u}}      key_imperial or key_metric, depending on the language's default units
//   {{#u:A|B}}     literal A for imperial-default languages, B for metric-default ones
//   {{@var}}       build variable (lang, locale, dir, units, root, canonical, hreflang,
//                  langselect, T, faq, faqld, appld, url_<page>)
//
// Translations: src/i18n/<lang>/<section>.json. Every language must have exactly the
// same keys as English, same array lengths, same {placeholders} and same HTML tags.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');
const OUT = process.env.BUILD_OUT ? path.resolve(process.env.BUILD_OUT) : path.join(ROOT, 'public');
const SITE = 'https://buildcalc.vanali.workers.dev';
const LANGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/langs.json'), 'utf8'));
const LANG_CODES = Object.keys(LANGS);

// page id -> template file, i18n section, URL slug (relative to the language root)
const PAGES = [
  { id: 'home',     tpl: 'home.html',     section: 'home',     slug: '' },
  { id: 'roof',     tpl: 'roof.html',     section: 'roof',     slug: 'roof-pitch-calculator/' },
  { id: 'concrete', tpl: 'concrete.html', section: 'concrete', slug: 'concrete-calculator/' },
  { id: 'paint',    tpl: 'paint.html',    section: 'paint',    slug: 'paint-calculator/' },
  { id: 'tile',     tpl: 'tile.html',     section: 'tile',     slug: 'tile-calculator/' },
  { id: 'stair',    tpl: 'stair.html',    section: 'stair',    slug: 'stair-calculator/' },
  { id: '404',      tpl: '404.html',      section: 'notfound', slug: '404.html', noindex: true },
];
const SECTIONS = ['common', ...PAGES.map((p) => p.section)];

const errors = [];
const fail = (m) => errors.push(m);

// ---------- load translations ----------
function loadLang(lang) {
  const out = {};
  for (const s of SECTIONS) {
    const f = path.join(SRC, 'i18n', lang, s + '.json');
    if (!fs.existsSync(f)) { fail(`${lang}: missing ${s}.json`); out[s] = {}; continue; }
    try { out[s] = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { fail(`${lang}/${s}.json: invalid JSON (${e.message})`); out[s] = {}; }
  }
  return out;
}

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const tags = (s) => [...s.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1].toLowerCase()).sort().join(',');

function compare(en, other, where) {
  if (Array.isArray(en)) {
    if (!Array.isArray(other)) return fail(`${where}: expected array`);
    if (en.length !== other.length) return fail(`${where}: array length ${other.length}, English has ${en.length}`);
    en.forEach((v, i) => compare(v, other[i], `${where}[${i}]`));
  } else if (en && typeof en === 'object') {
    if (!other || typeof other !== 'object' || Array.isArray(other)) return fail(`${where}: expected object`);
    for (const k of Object.keys(en)) {
      if (!(k in other)) fail(`${where}.${k}: missing`);
      else compare(en[k], other[k], `${where}.${k}`);
    }
    for (const k of Object.keys(other)) if (!(k in en)) fail(`${where}.${k}: not in English (typo?)`);
  } else if (typeof en === 'string') {
    if (typeof other !== 'string') return fail(`${where}: expected string`);
    if (!other.trim()) fail(`${where}: empty`);
    if (other.includes('{{')) fail(`${where}: contains {{`);
    if (placeholders(en) !== placeholders(other)) fail(`${where}: placeholders {${placeholders(other)}} differ from English {${placeholders(en)}}`);
    if (tags(en) !== tags(other)) fail(`${where}: HTML tags [${tags(other)}] differ from English [${tags(en)}]`);
  }
}

const I18N = {};
for (const l of LANG_CODES) {
  if (!fs.existsSync(path.join(SRC, 'i18n', l))) { if (l === 'en') fail('en: missing'); continue; }
  I18N[l] = loadLang(l);
}
const BUILT_LANGS = LANG_CODES.filter((l) => I18N[l]);
const onlyLang = process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : null;
for (const l of BUILT_LANGS) if (l !== 'en' && (!onlyLang || l === onlyLang)) for (const s of SECTIONS) compare(I18N.en[s], I18N[l][s], `${l}/${s}`);

if (process.argv.includes('--check') || errors.length) {
  if (errors.length) {
    console.error(`Translation check FAILED (${errors.length}):\n  ` + errors.slice(0, 80).join('\n  ') + (errors.length > 80 ? `\n  ... ${errors.length - 80} more` : ''));
    process.exit(1);
  }
  console.log(`Translation check OK: ${BUILT_LANGS.length} languages (${BUILT_LANGS.join(' ')})`);
  if (process.argv.includes('--check')) process.exit(0);
}

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim();
const langRoot = (l) => (l === 'en' ? '/' : `/${l}/`);
const pageUrl = (l, p) => SITE + langRoot(l) + p.slug;
const jsonScript = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

function render(tpl, lang, page) {
  const meta = LANGS[lang];
  const tr = I18N[lang];
  const sec = tr[page.section];
  const common = tr.common;
  const units = meta.units;
  const lookup = (key) => {
    if (key in sec && typeof sec[key] === 'string') return sec[key];
    if (key in common && typeof common[key] === 'string') return common[key];
    throw new Error(`${lang}/${page.id}: unknown key "${key}"`);
  };
  const faqList = Array.isArray(sec.faq) ? sec.faq : [];
  const vars = {
    lang, locale: meta.locale, dir: meta.rtl ? 'rtl' : 'ltr', units, currency: meta.currency || 'EUR',
    root: langRoot(lang),
    canonical: pageUrl(lang, page),
    hreflang: page.noindex ? '' : BUILT_LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(l, page)}">`).join('\n')
      + `\n<link rel="alternate" hreflang="x-default" href="${pageUrl('en', page)}">`,
    langselect: `<select id="lang" class="langsel" aria-label="${esc(strip(common.language))}">`
      + BUILT_LANGS.map((l) => `<option value="${langRoot(l) + (page.noindex ? '' : page.slug)}" lang="${l}"${l === lang ? ' selected' : ''}>${esc(LANGS[l].name)}</option>`).join('')
      + '</select>',
    T: `<script>window.T=${jsonScript({ ...(common.js || {}), ...(sec.js || {}) })};</script>`,
    faq: faqList.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join('\n'),
    faqld: faqList.length ? `<script type="application/ld+json">${jsonScript({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqList.map(([q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })),
    })}</script>` : '',
    appld: `<script type="application/ld+json">${jsonScript({
      '@context': 'https://schema.org', '@type': page.id === 'home' ? 'WebSite' : 'WebApplication',
      name: strip(sec.h1 || sec.meta_title), url: pageUrl(lang, page), inLanguage: lang,
      description: strip(sec.meta_desc || ''),
      ...(page.id === 'home' ? {} : { applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }),
    })}</script>`,
  };
  for (const p of PAGES) vars['url_' + p.id] = langRoot(lang) + (p.id === '404' ? '' : p.slug);

  return tpl.replace(/\{\{([^}]+)\}\}/g, (m, raw) => {
    const k = raw.trim();
    if (k.startsWith('@')) {
      const v = k.slice(1);
      if (!(v in vars)) throw new Error(`${page.id}: unknown build var {{${k}}}`);
      return vars[v];
    }
    if (k.startsWith('#u:')) {
      const [a, b] = k.slice(3).split('|');
      return units === 'imperial' ? a : b;
    }
    if (k.endsWith('@u')) return lookup(k.slice(0, -2) + '_' + units);
    return lookup(k);
  });
}

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });
if (fs.existsSync(path.join(SRC, 'static'))) fs.cpSync(path.join(SRC, 'static'), OUT, { recursive: true });

// Cache busting: every HTML page references the assets with ?v=<content hash>, so a
// browser never combines a new page with an old cached calc.js or style.css.
const ASSET_VERSION = crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(SRC, 'assets/calc.js')))
  .update(fs.readFileSync(path.join(SRC, 'assets/style.css')))
  .digest('hex').slice(0, 10);
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify({ version: ASSET_VERSION }) + '\n');
const versionAssets = (html) => html
  .replaceAll('"/assets/calc.js"', `"/assets/calc.js?v=${ASSET_VERSION}"`)
  .replaceAll('"/assets/style.css"', `"/assets/style.css?v=${ASSET_VERSION}"`);

let count = 0;
const missingTpl = [];
for (const page of PAGES) {
  const tf = path.join(SRC, 'pages', page.tpl);
  if (!fs.existsSync(tf)) { missingTpl.push(page.tpl); continue; }
  const tpl = fs.readFileSync(tf, 'utf8');
  for (const lang of BUILT_LANGS) {
    let html;
    try { html = render(tpl, lang, page); }
    catch (e) { console.error('BUILD FAILED: ' + e.message); process.exit(1); }
    if (html.includes("{{")) { console.error(`BUILD FAILED: unrendered braces in ${lang}/${page.id}`); process.exit(1); }
    const dest = path.join(OUT, langRoot(lang).slice(1), page.slug.endsWith('.html') ? page.slug : page.slug + 'index.html');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, versionAssets(html));
    count++;
  }
}

// sitemap with hreflang alternates, robots.txt
const indexable = PAGES.filter((p) => !p.noindex && !missingTpl.includes(p.tpl));
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
for (const p of indexable) for (const l of BUILT_LANGS) {
  sm += `  <url><loc>${pageUrl(l, p)}</loc>` + BUILT_LANGS.map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${pageUrl(a, p)}"/>`).join('')
    + `<xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en', p)}"/></url>\n`;
}
sm += '</urlset>\n';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sm);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${count} pages in ${BUILT_LANGS.length} languages -> public/ (assets v=${ASSET_VERSION})` + (missingTpl.length ? `  (templates not yet present: ${missingTpl.join(', ')})` : ''));
