#!/usr/bin/env bash
# BuildCalc: zet de broncode op GitHub (maakt de publieke repo aan of werkt hem bij).
# Hosting gebeurt apart op Cloudflare met: npm run deploy
# Uitvoeren vanuit deze map:  bash publiceer.sh ["commitboodschap"]
# Eerste keer: maakt repo aan. Daarna: publiceert elke wijziging.
set -euo pipefail
OWNER="boulbaal"
REPO="buildcalc"
SITE_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"

command -v gh >/dev/null || { echo "GitHub CLI (gh) ontbreekt. Installeer: sudo apt install gh  en daarna: gh auth login"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Eerst inloggen: gh auth login"; exit 1; }

# Bestaat de repo al: clone hem, vervang de bestanden, commit en push (geschiedenis blijft).
# Bestaat hij nog niet: nieuwe repo aanmaken en pushen.
if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  gh repo clone "$OWNER/$REPO" "$WORK" -- -q
  find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  (cd "$SITE_DIR" && tar --exclude=./node_modules --exclude=./public --exclude=./.wrangler --exclude=./.git --exclude=./test-results -cf - .) | (cd "$WORK" && tar -xf -)
    cd "$WORK"
  git add -A
  if git diff --cached --quiet; then echo "Geen wijzigingen, niets te pushen."; else
    git -c user.name="boulbaal" -c user.email="boulbaal@users.noreply.github.com" commit -q -m "${1:-Update BuildCalc}"
    git push -q origin main
  fi
else
  (cd "$SITE_DIR" && tar --exclude=./node_modules --exclude=./public --exclude=./.wrangler --exclude=./.git --exclude=./test-results -cf - .) | (cd "$WORK" && tar -xf -)
    cd "$WORK"
  git init -q -b main
  git add -A
  git -c user.name="boulbaal" -c user.email="boulbaal@users.noreply.github.com" commit -q -m "BuildCalc v1: five construction calculators"
  gh repo create "$OWNER/$REPO" --public \
    --description "Five free construction calculators. No ads, no tracking, works offline." \
    --homepage "https://buildcalc.vanali.workers.dev" --source . --push
fi

# GitHub Pages uitzetten: de site draait op Cloudflare Workers; de repo bevat de bron (src/),
# die GitHub Pages niet correct kan tonen. Zo is er ook geen dubbele kopie voor Google.
if gh api "repos/$OWNER/$REPO/pages" >/dev/null 2>&1; then
  gh api -X DELETE "repos/$OWNER/$REPO/pages" >/dev/null && echo "GitHub Pages uitgezet (site draait op Cloudflare)."
fi

echo
echo "Klaar. Repo:  https://github.com/$OWNER/$REPO"
echo "Online zetten of bijwerken op Cloudflare:  npm install && npm run deploy"
rm -rf "$WORK"
