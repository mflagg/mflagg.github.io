# mflagg.github.io

Marketing site for **Flagg Visual Computing LLC** — a computer-vision, graphics and applied-AI consultancy.

A self-contained static site (no build step) served by GitHub Pages. The `.nojekyll`
file disables Jekyll processing so the files are served exactly as-is.

## Structure

```
index.html              Single-page site (hero, about, expertise, work, recognition, team, contact)
assets/css/style.css    All styles (design tokens at the top)
assets/js/main.js       Hero feature-point canvas, nav, scroll-reveal
assets/img/             headshot.jpg, favicon.svg
.nojekyll               Tells GitHub Pages to skip Jekyll
```

## Editing content

All copy lives directly in `index.html`:

- **Clients** — the `.work-grid` section (`<article class="client">` per company)
- **Team** — the `.people` section (`<div class="person">` per person)
- **Recognition** — the `.recog-list` section
- **Stats / bio** — the `#about` section

## Local preview

No build needed — open `index.html`, or run a static server:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deploy

Push to `main`. GitHub Pages serves the root of the repo at <https://mflagg.github.io/>.
