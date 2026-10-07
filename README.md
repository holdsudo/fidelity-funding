# Fidelity Funding — website

Redesign of fidelity-funding.com. Static, dependency-free (plain HTML/CSS/JS), served by GitHub Pages at
**https://fidelity.fastapi.online** (Pages source: `main` branch, `/docs`).

## Layout
- `src/pages/` — page bodies (first line is a JSON meta comment: title, desc, nav, …)
- `src/partials/` — shared head, nav, footer, AI assistant, SVG icon sprite
- `src/assets/` — CSS, JS, fonts (self-hosted Inter), images (brand logos/art from the original site)
- `build.py` — wraps pages with partials, minifies, writes `docs/` + sitemap, robots, manifest, CNAME
- `tools/` — one-off content generators (posts/legal from the scraped original) and Playwright screenshot/flow checks

## Build
    python3 build.py            # -> docs/
    cd docs && python3 -m http.server 8765

## Not wired to a backend yet (by design)
- **Application** (`/apply/`): full 4-step wizard with validation, masks, uploads, signature, review. Submit shows the
  success screen only — nothing leaves the browser. SSN/EIN/DOB/DL are never written to storage. Hook the POST in
  `src/assets/js/apply.js` → `submit()`.
- **Fidelity AI** (`assistant.js`): answers from a local knowledge base built from the site's own content. Replace
  `think()` with a call to a real model; keep the `{ text, actions }` shape.
- Contact / careers / newsletter forms: front-end confirmation only.
