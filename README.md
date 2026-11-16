# FARRUKO — Cvrbon Vrmor

An artist website for Farruko, built around his current **Cvrbon Vrmor / LA167** era: carbon black, fuel-pump orange from the *LA167* artwork, and chrome.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## Pages

| Page | What's on it |
| --- | --- |
| `index.html` — Inicio | **Carretera 167** hero: a real-time Three.js night drive down PR-167 in Bayamón (the road *La 167* is named after). The album covers are lit billboards you drive past, and the HUD names each one ("Pasando · 2021 — La 167"). Click a billboard to open that record. Hold the mouse/finger or **Space** to accelerate to 167 km/h: the FOV widens, traffic stretches into light trails, and a radial blur plus chromatic split kick in. Bloom, an overhead "167 BAYAMÓN" sign and a glowing skyline. Below the hero: new releases, the Que Novedad vinyl feature, stats, the pinned discography coverflow and links into the other pages. |
| `musica.html` — Música | A turntable header, then a filterable crate of all 15 records (Álbum / EP / Live / Especial). When you hover a sleeve, the vinyl slides out. Clicking one opens a record modal with the Spotify tracklist and prev/next buttons, and each record has a deep link (`/musica.html#la-167`). Also the hits list with play counts. |
| `media.html` — Media | A featured video in a theater layout, a filterable grid of 16 official videos that play in a lightbox (youtube-nocookie, deep links like `#v-<id>`), the Instagram feed, and a **press kit**: short/long bio with a copy button, key facts, downloadable artwork and the 167 shield logo as SVG. |
| `historia.html` — Historia | A portrait header, key facts, the scroll-drawn timeline, Carbon Fiber, and the collaborator marquees. |

Shared across pages (`src/core/layout.js`): nav with the current page marked, a fuel-orange wipe transition between pages, a Spotify dock that every page can use, smooth scrolling, a custom cursor, magnetic buttons and tilt cards. three.js loads only on the home page.

## Data sources

The content in `src/data.js` was scraped with Firecrawl on 14 Nov 2026 from:
- Instagram `@farruko`: bio, follower count, recent posts
- His link-in-bio (`lnksfs.com/quenovedadrmx`)
- YouTube: official video IDs, view counts and thumbnails (16 Nov 2026), via Firecrawl
- Spotify: the release pages, artist page and discography
- Wikipedia, latingrammy.com and Wikidata: biography and official handles

Artwork in `public/img` is official cover art pulled from Spotify's CDN, plus a CC-licensed Wikimedia Commons photo (`farruko-2021.jpg`). Before using this commercially, clear the rights with Farruko's team / La 167 LLC.

Design references came from Mobbin: Spotify's artist page (popular-tracks list and dock), TIDAL's artist and condensed-type sections, and DICE's artist stats row.
