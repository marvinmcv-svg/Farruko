import '../style.css';
import '../pages.css';
import { VIDEOS, VIDEO_TAGS, POSTS, ALBUMS, BIO } from '../data.js';
import {
  $, $$, gsap, reduced, esc, fmtCompact,
  initLayout, revealPage, revealLines, finishInit, openModal, closeDock,
} from '../core/layout.js';

initLayout('media');

const thumb = (id) => `/img/video/${id}.jpg`;
const ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

/* ---------------------------------------------------------------- theater (featured) */

const feat = VIDEOS[0];
$('.theater').innerHTML = `
  <button class="theater__screen js-video" data-id="${feat.id}" data-cursor="Play" aria-label="Play ${esc(feat.title)} official video">
    <img src="${thumb(feat.id)}" alt="" />
    <span class="theater__scan" aria-hidden="true"></span>
    <span class="theater__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg></span>
    <span class="theater__meta">
      <span class="mono"><span class="dot"></span> Estreno · ${feat.year}</span>
      <b class="display">${esc(feat.title)}</b>
      <span class="mono">${esc(feat.artists)} · ${feat.time} · ${fmtCompact(feat.views)} vistas</span>
    </span>
  </button>`;

/* ---------------------------------------------------------------- video grid */

const tagCounts = Object.fromEntries(Object.keys(VIDEO_TAGS).map((k) => [k, k === 'all' ? VIDEOS.length : VIDEOS.filter((v) => v.tag === k).length]));
$('.chips--videos').innerHTML = Object.entries(VIDEO_TAGS).map(([k, label]) =>
  `<button class="chip" role="tab" aria-selected="${k === 'all'}" data-filter="${k}">${label}<sup>${tagCounts[k]}</sup></button>`).join('');

$('.vgrid').innerHTML = VIDEOS.map((v, i) => `
  <button class="vcard js-video ${i === 0 ? 'vcard--big' : i === 7 ? 'vcard--wide' : ''}" data-id="${v.id}" data-tag="${v.tag}" data-cursor="Play" id="v-${v.id}">
    <span class="vcard__img"><img src="${thumb(v.id)}" alt="" loading="lazy" /><span class="vcard__time mono">${v.time}</span><span class="vcard__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg></span></span>
    <span class="vcard__meta">
      <b>${esc(v.title)}</b>
      <span>${esc(v.artists)}</span>
      <span class="mono">${v.year} · ${fmtCompact(v.views)} vistas</span>
    </span>
  </button>`).join('');

$('.chips--videos').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const f = chip.dataset.filter;
  $$('.chips--videos .chip').forEach((c) => c.setAttribute('aria-selected', String(c === chip)));
  const cards = $$('.vcard');
  const show = cards.filter((c) => f === 'all' || c.dataset.tag === f);
  cards.forEach((c) => { c.hidden = !show.includes(c); });
  // Only the full grid uses the oversized feature tiles.
  $('.vgrid').classList.toggle('is-filtered', f !== 'all');
  if (!reduced) gsap.fromTo(show, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 });
});

function openVideo(id) {
  const v = VIDEOS.find((x) => x.id === id);
  if (!v) return;
  closeDock(); // don't play Spotify over the video
  history.replaceState(null, '', `#v-${id}`);
  const idx = VIDEOS.indexOf(v);
  const next = VIDEOS[(idx + 1) % VIDEOS.length];
  openModal(`
    <div class="vmodal">
      <div class="vmodal__frame"><iframe src="${ytEmbed(id)}" title="${esc(v.title)} — video oficial" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      <div class="vmodal__meta">
        <div><b class="display">${esc(v.title)}</b><span class="mono">${esc(v.artists)} · ${v.year} · ${fmtCompact(v.views)} vistas</span></div>
        <button class="btn btn--ghost js-video" data-id="${next.id}"><span>Siguiente</span><b>${esc(next.title)} →</b></button>
      </div>
    </div>`, { className: 'modal--video', onClose: () => history.replaceState(null, '', location.pathname) });
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('.js-video');
  if (t) openVideo(t.dataset.id);
});

/* ---------------------------------------------------------------- feed */

const dateFmt = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' });
$('.feed__grid').innerHTML = POSTS.map((p, i) => `
  <a class="post tilt ${i % 5 === 0 ? 'post--wide' : ''}" href="${p.url}" target="_blank" rel="noopener" data-cursor="Ver">
    <div class="post__glare" aria-hidden="true"></div>
    <div class="post__top mono"><span>@farruko</span><span>${dateFmt.format(new Date(p.date + 'T12:00:00'))}</span></div>
    <p class="post__text">${esc(p.text)}</p>
    <div class="post__stats mono">
      <span>♥ ${fmtCompact(p.likes)}</span>
      <span>💬 ${fmtCompact(p.comments)}</span>
      ${p.views ? `<span>▶ ${fmtCompact(p.views)}</span>` : ''}
    </div>
  </a>`).join('');

/* ---------------------------------------------------------------- press kit */

let bioKey = 'short';
const renderBio = () => { $('.press__text').textContent = BIO[bioKey]; };
renderBio();
$('.press__tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-bio]');
  if (!b) return;
  bioKey = b.dataset.bio;
  $$('.press__tabs [data-bio]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  renderBio();
  if (!reduced) gsap.from('.press__text', { opacity: 0, y: 10, duration: 0.4 });
});
$('.press__copy').addEventListener('click', async (e) => {
  const label = $('span', e.currentTarget);
  try {
    await navigator.clipboard.writeText(BIO[bioKey]);
    label.textContent = '¡Copiada!';
  } catch {
    label.textContent = 'Selecciona y copia';
  }
  setTimeout(() => { label.textContent = 'Copiar bio'; }, 1800);
});
$('.press__facts').innerHTML = BIO.facts.map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');

$('.press__art').innerHTML = ALBUMS.map((a) => `
  <a href="${a.cover}" download="farruko-${a.slug}.jpg" title="Descargar ${esc(a.title)}" data-cursor="↓">
    <img src="${a.cover}" alt="${esc(a.title)}" loading="lazy" /><span class="mono">${a.year}</span>
  </a>`).join('');

$('.js-logo').addEventListener('click', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 4 C68 12 84 10 96 16 C96 58 78 82 50 96 C22 82 4 58 4 16 C16 10 32 12 50 4Z" fill="#ff5b1a"/><text x="50" y="62" font-family="Impact, sans-serif" font-size="34" text-anchor="middle" fill="#08080a">167</text></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'farruko-167-shield.svg' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ---------------------------------------------------------------- motion */

revealLines();
revealPage(() => {
  gsap.timeline()
    .from('.phero__title .line__in', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 })
    .from('.phero .eyebrow', { opacity: 0, y: 20, duration: 0.8 }, 0.2)
    .from('.theater', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
    .from('.theater__screen img', { scale: 1.3, duration: 2, ease: 'expo.out' }, 0.3);
  if (location.hash.startsWith('#v-')) setTimeout(() => openVideo(location.hash.slice(3)), 700);
});

gsap.from('.vcard', { y: 70, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.vgrid', start: 'top 85%' } });
gsap.from('.post', { y: 80, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '.feed__grid', start: 'top 80%' } });
gsap.from('.press__art a', { scale: 0.8, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.03, scrollTrigger: { trigger: '.press__art', start: 'top 85%' } });

finishInit();
