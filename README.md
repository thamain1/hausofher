# Haus of Her — hausofher.org

One-page brand site for **Haus of Her** — a Dallas sisterhood where women are
Honored, Empowered, and Respected. Features HER Chapter One: A Crowned
Celebration (book launch brunch, Nov 7, 2026) with links out to the events
page on [RSVPify](https://hausofher.rsvpify.com/).

Built as a single static `index.html` — generative WebGL halo background,
kinetic headline typography, section-based color theming. No build step.

## Structure

```
index.html        the entire site
assets/logo.png   brand crest (transparent background)
.github/workflows/pages.yml   GitHub Pages deployment
```

## Deploy

Pushes to `main` auto-deploy via GitHub Actions to GitHub Pages.

## Pointing hausofher.org here (when ready)

1. At the domain registrar, set DNS:
   - `A` records for the apex `@` → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - optional `CNAME` for `www` → `thamain1.github.io`
2. Add a `CNAME` file containing `hausofher.org` to this repo root.
3. In repo **Settings → Pages**, set the custom domain to `hausofher.org`
   and enforce HTTPS once the certificate issues.

© 2026 Haus of Her
