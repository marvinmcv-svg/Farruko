import '../style.css';
import '../pages.css';
import { ALBUMS, TRACKS, RECORD_TYPES } from '../data.js';
import {
  $, $$, gsap, reduced, finePointer, esc, fmtFull,
  initLayout, revealPage, revealLines, finishInit, openModal, play, tilt,
} from '../core/layout.js';

initLayout('musica');

/* ---------------------------------------------------------------- crate */

const FILTERS = { all: 'Todo', ...RECORD_TYPES };
const counts = Object.fromEntries(Object.keys(FILTERS).map((k) => [k, k === 'all' ? ALBUMS.length : ALBUMS.filter((a) => a.type === k).length]));
$('.chips').innerHTML = Object.entries(FILTERS).map(([k, label]) =>
  `<button class="chip" role="tab" aria-selected="${k === 'all'}" data-filter="${k}">${label}<sup>${counts[k]}</sup></button>`).join('');

$('.crate').innerHTML = ALBUMS.map((a, i) => `
  <button class="rec" data-slug="${a.slug}" data-type="${a.type}" data-cursor="Abrir" style="--i:${i}">
    <span class="rec__stage">
      <span class="rec__vinyl" aria-hidden="true"><span class="rec__label"><img src="${a.cover}" alt="" loading="lazy" /></span></span>
      <span class="rec__sleeve tilt" data-tilt="10"><img src="${a.cover}" alt="${esc(a.title)} cover art" loading="lazy" /><span class="rec__shine" aria-hidden="true"></span></span>
    </span>
    <span class="rec__meta">
      <span class="mono">${a.year} · ${RECORD_TYPES[a.type]} · ${a.songs} tracks</span>
      <b>${esc(a.title)}</b>
      ${a.note ? `<em class="mono">${esc(a.note)}</em>` : ''}
    </span>
  </button>`).join('');

function setCount(n) { $('.crate__count').textContent = `${String(n).padStart(2, '0')} / ${ALBUMS.length} records`; }
setCount(ALBUMS.length);

$('.chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const f = chip.dataset.filter;
  $$('.chip').forEach((c) => c.setAttribute('aria-selected', String(c === chip)));
  const recs = $$('.rec');
  const show = recs.filter((r) => f === 'all' || r.dataset.type === f);
  const hide = recs.filter((r) => !show.includes(r));
  setCount(show.length);
  if (reduced) { hide.forEach((r) => { r.hidden = true; }); show.forEach((r) => { r.hidden = false; }); return; }
  // FLIP: remember positions, re-layout, animate from old positions.
  const first = new Map(recs.map((r) => [r, r.getBoundingClientRect()]));
  hide.forEach((r) => { r.hidden = true; });
  show.forEach((r) => { r.hidden = false; });
  show.forEach((r, i) => {
    const a = first.get(r);
    const b = r.getBoundingClientRect();
    if (a.width) gsap.fromTo(r, { x: a.left - b.left, y: a.top - b.top }, { x: 0, y: 0, duration: 0.8, ease: 'expo.out', delay: i * 0.015 });
    else gsap.fromTo(r, { opacity: 0, y: 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out', delay: i * 0.03 });
  });
});

/* ---------------------------------------------------------------- record modal */

function recordHTML(a) {
  const idx = ALBUMS.indexOf(a);
  const prev = ALBUMS[(idx - 1 + ALBUMS.length) % ALBUMS.length];
  const next = ALBUMS[(idx + 1) % ALBUMS.length];
  const tracks = TRACKS.filter((t) => t.cover === a.cover);
  return `
    <div class="rmodal">
      <div class="rmodal__art">
        <div class="rmodal__vinyl" aria-hidden="true"><span class="rec__label"><img src="${a.cover}" alt="" /></span></div>
        <img class="rmodal__cover" src="${a.cover}" alt="${esc(a.title)} cover art" />
      </div>
      <div class="rmodal__info">
        <p class="eyebrow mono">${a.year} · ${RECORD_TYPES[a.type]}</p>
        <h2 class="display rmodal__title">${esc(a.title)}</h2>
        <ul class="rmodal__meta mono">
          <li><span>Año</span><b>${a.year}</b></li>
          <li><span>Tipo</span><b>${RECORD_TYPES[a.type]}</b></li>
          <li><span>Canciones</span><b>${a.songs}</b></li>
          ${a.note ? `<li><span>Nota</span><b>${esc(a.note)}</b></li>` : ''}
        </ul>
        ${tracks.length ? `<p class="rmodal__hits mono">Hits: ${tracks.map((t) => esc(t.title)).join(' · ')}</p>` : ''}
        <div class="rmodal__btns">
          <button class="btn btn--fuel js-play" data-spotify="album/${a.id}" data-title="${esc(a.title)}" data-cover="${a.cover}"><span>Reproducir</span><b>en el dock</b></button>
          <a class="btn btn--ghost" href="https://open.spotify.com/album/${a.id}" target="_blank" rel="noopener"><span>Spotify ↗</span></a>
        </div>
        <div class="rmodal__embed">
          <iframe title="${esc(a.title)} en Spotify" src="https://open.spotify.com/embed/album/${a.id}?utm_source=generator&theme=0" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
        <nav class="rmodal__nav mono" aria-label="Más records">
          <button class="js-open-record" data-slug="${prev.slug}">← ${esc(prev.title)}</button>
          <button class="js-open-record" data-slug="${next.slug}">${esc(next.title)} →</button>
        </nav>
      </div>
    </div>`;
}

function openRecord(slug, { push = true } = {}) {
  const a = ALBUMS.find((x) => x.slug === slug);
  if (!a) return;
  if (push && location.hash !== `#${slug}`) history.replaceState(null, '', `#${slug}`);
  const m = openModal(recordHTML(a), {
    className: 'modal--record',
    onClose: () => history.replaceState(null, '', location.pathname),
  });
  if (!reduced) {
    gsap.fromTo($('.rmodal__vinyl', m), { xPercent: 0, rotate: -90 }, { xPercent: 38, rotate: 0, duration: 1.2, ease: 'expo.out', delay: 0.15 });
    gsap.from($$('.rmodal__info > *', m), { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05, delay: 0.1 });
  }
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('.rec, .js-open-record');
  if (t) openRecord(t.dataset.slug);
});

/* ---------------------------------------------------------------- hits */

$('.tracks').innerHTML = TRACKS.map((t, i) => `
  <li class="track js-play" tabindex="0" role="button" data-spotify="${t.spotify}" data-title="${esc(t.title)}" data-cover="${t.cover}" data-cursor="Play">
    <span class="track__n mono">${String(i + 1).padStart(2, '0')}</span>
    <span class="track__eq" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="track__title">${esc(t.title)}${t.e ? ' <em class="explicit">E</em>' : ''}${t.isNew ? ' <em class="new mono">NEW</em>' : ''}</span>
    <span class="track__feat">${t.feat ? 'with ' + esc(t.feat) : 'Farruko'}</span>
    <span class="track__plays mono">${t.plays ? fmtFull(t.plays) : '—'}</span>
    <span class="track__time mono">${t.time}</span>
  </li>`).join('');

if (finePointer) {
  const float = $('.track-float');
  const img = $('img', float);
  const fx = gsap.quickTo(float, 'x', { duration: 0.6, ease: 'power3.out' });
  const fy = gsap.quickTo(float, 'y', { duration: 0.6, ease: 'power3.out' });
  const fr = gsap.quickTo(float, 'rotation', { duration: 0.8, ease: 'power3.out' });
  let lastX = 0;
  $('.tracks').addEventListener('pointermove', (e) => {
    fx(e.clientX); fy(e.clientY);
    fr(gsap.utils.clamp(-15, 15, (e.clientX - lastX) * 0.8));
    lastX = e.clientX;
  });
  $$('.track').forEach((t) => t.addEventListener('pointerenter', () => { img.src = t.dataset.cover; float.classList.add('is-on'); }));
  $('.tracks').addEventListener('pointerleave', () => float.classList.remove('is-on'));
}

/* ---------------------------------------------------------------- motion */

revealLines();
revealPage(() => {
  const tl = gsap.timeline();
  tl.from('.phero__title .line__in', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 })
    .from('.phero__lede, .phero__stats, .phero .eyebrow', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.3)
    .from('.turntable', { x: 120, opacity: 0, rotate: 8, duration: 1.4, ease: 'expo.out' }, 0.1);
  if (location.hash.length > 1) tl.add(() => openRecord(location.hash.slice(1), { push: false }), 0.5);
});

gsap.from('.rec', {
  y: 80, opacity: 0, duration: 1, ease: 'expo.out', stagger: { each: 0.05, grid: 'auto' },
  scrollTrigger: { trigger: '.crate', start: 'top 85%' },
});
gsap.from('.track', { x: -40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '.tracks', start: 'top 80%' } });
gsap.to('.phero__bg', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });

window.addEventListener('hashchange', () => { if (location.hash.length > 1) openRecord(location.hash.slice(1), { push: false }); });

finishInit();
tilt('.rec__sleeve');
