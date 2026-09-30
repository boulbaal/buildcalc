# BuildCalc

Five free construction calculators. Static HTML/CSS/JS, no build step, no dependencies, no ads, no tracking. Every calculation runs client-side and keeps working offline.

Live: https://boulbaal.github.io/buildcalc/

## Calculators

- Roof pitch (degrees, percent, X:12, pitch multiplier)
- Concrete slab (cubic yards, bags with waste margin)
- Paint (gallons/liters per coats, minus doors and windows)
- Tile (tiles and boxes, grout gap, cutting waste)
- Stairs (risers, treads, US IRC check, comfort rule)

## Configure donations

Edit the `DONATE` object at the top of `assets/calc.js` and add your PayPal and/or Ko-fi link. The donation block stays hidden until at least one link is set, and only appears after a visitor calculates a result.

## Develop

Open any `index.html` in a browser. No tooling needed. Each calculator is one self-contained page plus the shared `assets/style.css` and `assets/calc.js`.

## Deploy

Served with GitHub Pages from the main branch. Any push to main updates the site.

## License

MIT for the code. The content (texts, FAQ) may not be republished as-is.
