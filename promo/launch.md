# BuildCalc: lancering (stap voor stap)

Zelfde afspraken als bij Whenly:

- Afzender: **BuildCalc** of **"the maker of BuildCalc"**. Geen persoonsnaam, geen locatie, geen foto.
- Contact: alleen **github.com/boulbaal/buildcalc/issues**. Nergens een e-mailadres.
- Nooit om upvotes vragen, ook niet aan vrienden.
- Eén kanaal per dag, en antwoord snel en eerlijk op elke reactie, vooral op kritiek.
- Ik plaats niets; jij plakt. Ik maak geen accounts aan.

Verwachting, eerlijk: Reddit en Hacker News geven pieken van een paar dagen. Het blijvende verkeer komt van Google, en dat begint pas na 2 tot 4 maanden. Donaties: reken op ordegrootte 1 per enkele duizenden bezoekers.

---

## Stap 0: voor je ergens post

1. **Online en getest.** `npm test` groen, `npm run deploy` gedaan, site open op je eigen telefoon.
2. **Google Search Console** (jouw Google-account): property `https://buildcalc.vanali.workers.dev` toevoegen. Verifiëren met een HTML-bestand: geef mij het bestand, ik zet het in `src/static/`. Daarna sitemap indienen: `https://buildcalc.vanali.workers.dev/sitemap.xml` (138 pagina's: 6 per taal, 23 talen).
3. **Bing Webmaster Tools**: kan de Search Console-property importeren. Daarnaast `npm run indexnow` na elke deploy met nieuwe pagina's.
4. **PayPal-link**: `https://paypal.me/ABoulbahaiem` (gecorrigeerd op 30 september 2026, oude link met dubbele L is verwijderd).

---

## Stap 1: niche-subreddits (dag 1 tot 5, één per dag)

Lees eerst de regels van elke subreddit; sommige verbieden zelfpromotie of vragen een flair. Toon per subreddit de calculator die past, niet de hele set.

| Dag | Subreddit | Calculator | Link |
|---|---|---|---|
| 1 | r/Roofing | Roof pitch | /roof-pitch-calculator/ |
| 2 | r/Concrete | Concrete slab | /concrete-calculator/ |
| 3 | r/HomeImprovement | Paint | /paint-calculator/ |
| 4 | r/Tile (of r/DIY) | Tile | /tile-calculator/ |
| 5 | r/Carpentry | Stairs | /stair-calculator/ |

**Tekst (aanpassen per subreddit, jouw stem):**

> **I made a free [roof pitch] calculator with no ads, would love feedback from people who actually do this**
>
> I got tired of calculator sites that bury a one-line formula under ads and popups, so I built my own. It shows the math under every result, works offline once loaded, and has no tracking or sign-up. It also works in metric and in 23 languages.
>
> [link]
>
> If a number looks wrong to you, tell me. You know this better than I do.

---

## Stap 2: r/InternetIsBeautiful (week 2)

Pas nadat de niche-posts feedback hebben opgeleverd en eventuele fouten zijn hersteld. Hele set, homepage-link.

> **BuildCalc: five construction calculators (roof pitch, concrete, paint, tile, stairs). No ads, no tracking, 23 languages, shows the formula behind every result.**

---

## Stap 3: Show HN (week 2 of 3, dinsdag tot donderdag, tussen 14:00 en 16:00 Belgische tijd)

Titel: `Show HN: BuildCalc – construction calculators in 23 languages, no ads, no tracking`

Eerste reactie van jou, meteen na posten:

> Plain HTML/JS on Cloudflare Workers static assets, no framework and no build step at runtime. A tiny Node script renders every page in 23 languages from one template per page; the build refuses to run if a translation is missing a key, a placeholder or an HTML tag. Imperial for English, metric for everything else. The source is on GitHub; issues for wrong formulas or bad translations are very welcome.

---

## Stap 4: directories (week 3, laag risico)

AlternativeTo (als alternatief voor Omni Calculator en Calculator.net), SaaSHub, Fazier. Korte omschrijving (≤ 160 tekens):

> Free construction calculators: roof pitch, concrete, paint, tile, stairs. No ads, no tracking, 23 languages, shows the math behind every result.

---

## Stap 5: regionaal (vanaf maand 2)

Met cijfers uit de eerste weken, per taal waar het verkeer vandaan komt. Klus-Facebookgroepen en fora in die taal, zelfde toon: maker vraagt feedback, geen reclame.

## Logboek

| Datum | Kanaal | Link | Bezoekers 48 u | Donaties | Opvallende feedback |
|---|---|---|---|---|---|
| | | | | | |
