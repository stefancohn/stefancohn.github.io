# StefanCohnWebsite

Personal portfolio site — vanilla HTML/CSS/JS. No build, test, lint, or CI/CD.

## Structure

- `index.html` — meta-refresh redirect to `src/frontPage.html`
- `src/frontPage.html` — main portfolio page
- `js/frontPage.js` — smooth scroll, about tabs, project hover+mousetrail, contact form submit
- `src/duckSandbox/` — WebGL 3D demo (WASD controls), uses local `MV.js` + `initShaders.js` + `webgl-utils.js`
- `DivvyChip/` — app landing page; SCSS sources in `DivvyChip/styles/*.scss` (compiled `.css` checked in, no build command in repo)
- `src/bballBoom/portal.html` — app store links
- `src/dbProjPrev.html` — database project screenshots (academic code not included)

## Key details

- Contact form POSTs JSON to `https://he86awsa6g.execute-api.us-east-2.amazonaws.com/dev` (AWS API Gateway + Lambda)
- Google Analytics: `G-BH7K8MPQ7S`
- Google AdSense: `app-ads.txt` at root
- FontAwesome kit: `b754e26e35`
- Hidden nav link (`???`) points to `src/duckSandbox/main.html`
- `.gitignore` only skips `.DS_Store`
- All changes push directly to `main` — no PR workflow
- Dev server: `./serve.sh` (or `python3 -m http.server 8000`) from repo root
