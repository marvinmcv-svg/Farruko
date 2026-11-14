# FARRUKO — Cvrbon Vrmor

An artist website for Farruko, built around his current **Cvrbon Vrmor / LA167** era: carbon black, fuel-pump orange from the *LA167* artwork, and chrome.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## What's inside

| Section | What it does |
| --- | --- |
| Preloader | A fuel gauge that counts to **167**, then the screen wipes away ("IGNICIÓN"). |
| Hero | A real-time Three.js carbon-fibre shield with a chrome rim, a glowing 167 emblem, an equalizer ring pulsing at 95 BPM, and floating embers. It follows the mouse and spins as you scroll. |
| Nuevo | The 4 releases from his Instagram link-in-bio, as 3D tilt cards with a holographic glare. |
| Que Novedad Remix | A vinyl record slides out of its sleeve as you scroll, with a pre-save button. |
| Telemetría | Animated stats: 43.4M monthly listeners, 22.6M followers, 1.93B Pepas streams… |
| Hits | Track list with Spotify play counts. A cover follows the cursor, and clicking a track plays it in a **real Spotify embed dock**. |
| Discografía | A pinned horizontal coverflow through all 15 albums (2010 → 2026), with a live year counter. |
| Historia | A timeline from Bayamón 1991 to 2026 whose line draws itself as you scroll. |
| Collabs | Two marquees of collaborators that speed up and skew with how fast you scroll. |
| Carbon Fiber / Feed / Outro | The label story, his latest Instagram posts with real engagement numbers, and a final pre-save call to action. |

Also included: smooth scrolling (Lenis), a custom cursor with labels, magnetic buttons, a scroll-progress "RPM" gauge, film grain, a mobile menu and responsive layouts. Motion is reduced for users who have `prefers-reduced-motion` set, and the page still looks intended if WebGL is unavailable.

## Data sources

The content in `src/data.js` was scraped with Firecrawl on 14 Nov 2026 from:
- Instagram `@farruko`: bio, follower count, recent posts
- His link-in-bio (`lnksfs.com/quenovedadrmx`)
- Spotify: the release pages, artist page and discography
- Wikipedia, latingrammy.com and Wikidata: biography and official handles

Artwork in `public/img` is official cover art pulled from Spotify's CDN, plus a CC-licensed Wikimedia Commons photo (`farruko-2021.jpg`). Before using this commercially, clear the rights with Farruko's team / La 167 LLC.

Design references came from Mobbin: Spotify's artist page (popular-tracks list and dock), TIDAL's artist and condensed-type sections, and DICE's artist stats row.
