import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { RELEASES, STATS, TRACKS, ALBUMS, TIMELINE, COLLABS, POSTS } from './data.js';
import { initHero } from './hero3d.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const fmtCompact = (n) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const fmtFull = (n) => new Intl.NumberFormat('en').format(n);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------------------------------------------------------- render */

$('.releases__grid').innerHTML = RELEASES.map((r, i) => `
  <article class="rcard tilt" style="--accent:${r.accent}" data-cursor="${r.spotify ? 'Play' : 'Pre-save'}">
    <div class="rcard__inner">
      <div class="rcard__cover"><img src="${r.cover}" alt="${esc(r.title)} ${esc(r.sub)} cover art" loading="lazy" /></div>
      <div class="rcard__glare" aria-hidden="true"></div>
      <div class="rcard__body">
        <span class="rcard__tag mono">${String(i + 1).padStart(2, '0')} · ${esc(r.tag)}</span>
        <h3 class="rcard__title">${esc(r.title)} <small>${esc(r.sub)}</small></h3>
        <p class="rcard__artists">${esc(r.artists)}</p>
        <p class="rcard__blurb">${esc(r.blurb)}</p>
        <div class="rcard__foot mono">
          <span>${esc(r.date)}</span>
          ${r.spotify
            ? `<button class="rcard__btn js-play" data-spotify="${r.spotify}" data-title="${esc(r.title)}" data-cover="${r.cover}">▶ Play</button>`
            : `<a class="rcard__btn" href="${r.url}" target="_blank" rel="noopener">Pre-save ↗</a>`}
        </div>
      </div>
    </div>
  </article>`).join('');

$('.stats__grid').innerHTML = STATS.map((s) => `
  <div class="stat">
    <div class="stat__value display" data-value="${s.value}" data-fmt="${s.fmt}">0</div>
    <div class="stat__bar"><i></i></div>
    <p class="stat__label">${esc(s.label)}</p>
  </div>`).join('');

$('.tracks').innerHTML = TRACKS.map((t, i) => `
  <li class="track js-play" tabindex="0" role="button" data-spotify="${t.spotify}" data-title="${esc(t.title)}" data-cover="${t.cover}" data-cursor="Play">
    <span class="track__n mono">${String(i + 1).padStart(2, '0')}</span>
    <span class="track__eq" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="track__title">${esc(t.title)}${t.e ? ' <em class="explicit">E</em>' : ''}${t.isNew ? ' <em class="new mono">NEW</em>' : ''}</span>
    <span class="track__feat">${t.feat ? 'with ' + esc(t.feat) : 'Farruko'}</span>
    <span class="track__plays mono">${t.plays ? fmtFull(t.plays) : '—'}</span>
    <span class="track__time mono">${t.time}</span>
  </li>`).join('');

$('.disco__track').innerHTML = ALBUMS.map((a) => `
  <a class="album" href="https://open.spotify.com/album/${a.id}" target="_blank" rel="noopener" data-year="${a.year}" data-cursor="Open">
    <div class="album__art">
      <img src="${a.cover}" alt="${esc(a.title)} cover art" loading="lazy" />
      <div class="album__reflect" aria-hidden="true"><img src="${a.cover}" alt="" loading="lazy" /></div>
    </div>
    <div class="album__meta">
      <span class="mono">${a.year} · ${a.songs} tracks</span>
      <b>${esc(a.title)}</b>
      ${a.note ? `<em class="mono">${esc(a.note)}</em>` : ''}
    </div>
  </a>`).join('');

$('.timeline__items').innerHTML = TIMELINE.map((t, i) => `
  <div class="tl ${i % 2 ? 'tl--r' : 'tl--l'}">
    <div class="tl__dot" aria-hidden="true"></div>
    <div class="tl__card">
      <span class="tl__year display">${t.year}</span>
      <h3>${esc(t.title)}</h3>
      <p>${esc(t.text)}</p>
    </div>
  </div>`).join('');

const half = Math.ceil(COLLABS.length / 2);
const marqueeHTML = (list) => {
  const items = list.map((n) => `<span>${esc(n)}</span><i aria-hidden="true">✦</i>`).join('');
  return items + items;
};
$('.marquee--a .marquee__inner').innerHTML = marqueeHTML(COLLABS.slice(0, half));
$('.marquee--b .marquee__inner').innerHTML = marqueeHTML(COLLABS.slice(half));

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

/* ---------------------------------------------------------------- split text */

function splitChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = [...text].map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  return $$('.ch', el);
}
const heroChars = $$('.hero__title .split').flatMap(splitChars);

// Wrap each visual line of .reveal-lines headings (split on <br>) for masked reveals.
$$('.reveal-lines').forEach((el) => {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map((l) => `<span class="line"><span class="line__in">${l}</span></span>`)
    .join('');
});

/* ---------------------------------------------------------------- smooth scroll */

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  const target = id === '#top' ? 0 : $(id);
  if (target === null) return;
  e.preventDefault();
  closeMenu();
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  else if (target === 0) window.scrollTo(0, 0);
  else target.scrollIntoView();
}));

/* ---------------------------------------------------------------- hero 3D */

let hero = null;
try {
  hero = initHero($('.hero__canvas'), { reduced });
} catch (err) {
  // No WebGL — the CSS fallback glow on .hero still looks intentional.
  document.documentElement.classList.add('no-webgl');
  console.warn('WebGL unavailable', err);
}

/* ---------------------------------------------------------------- preloader */

function intro() {
  const tl = gsap.timeline();
  tl.from(heroChars, { yPercent: 110, rotate: 6, duration: 1.2, ease: 'expo.out', stagger: 0.05 })
    .from('.hero__meta > *', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, '-=0.8')
    .from('.hero__hud, .hero__scroll, .nav', { opacity: 0, duration: 0.8 }, '-=0.6')
    .from('.hero__canvas', { opacity: 0, scale: 1.15, duration: 1.8, ease: 'power2.out' }, 0);
}

function runLoader() {
  const loader = $('.loader');
  if (reduced) { loader.remove(); intro(); return; }
  document.body.classList.add('is-loading');
  const num = $('.loader__num');
  const obj = { v: 0 };
  const tl = gsap.timeline({
    onComplete: () => { loader.remove(); document.body.classList.remove('is-loading'); },
  });
  tl.to(obj, {
    v: 167, duration: 2.1, ease: 'power2.inOut',
    onUpdate: () => { num.textContent = String(Math.round(obj.v)).padStart(3, '0'); },
  })
    .to('.loader__bar i', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0)
    .from('.loader__word span', { yPercent: 120, opacity: 0, stagger: 0.04, duration: 0.5, ease: 'back.out(2)' }, 1.5)
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=0.25')
    .add(intro, '-=0.55');
}
document.fonts.ready.then(runLoader);

/* ---------------------------------------------------------------- scroll FX */

// Hero: scroll drives the shield and drifts the title apart.
ScrollTrigger.create({
  trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
  onUpdate: (s) => hero?.setScroll(s.progress),
});
gsap.to('.hero__row:first-child', { xPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.hero__row--right', { xPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

// RPM gauge = overall page progress.
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (s) => $('.gauge i').style.setProperty('--p', s.progress),
});

// Line reveals.
$$('.reveal-lines').forEach((el) => {
  gsap.from($$('.line__in', el), {
    yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.09,
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});
$$('.eyebrow, .section__note, .story__lede, .feature__text, .label__quote p').forEach((el) => {
  gsap.from(el, { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
});

// Release cards rise in with a 3D flip.
gsap.from('.rcard', {
  y: 120, rotateX: -25, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
  scrollTrigger: { trigger: '.releases__grid', start: 'top 80%' },
});

// Feature: vinyl slides out of the sleeve and spins.
const fTl = gsap.timeline({ scrollTrigger: { trigger: '.feature', start: 'top 70%', end: 'center 40%', scrub: 1 } });
fTl.fromTo('.feature .disc', { xPercent: 0, rotate: 0 }, { xPercent: 52, rotate: 220, ease: 'none' })
  .fromTo('.feature .sleeve', { rotateY: 0 }, { rotateY: -14, ease: 'none' }, 0);
gsap.to('.feature__bg', { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '.feature', scrub: true } });

// Stats counters.
$$('.stat').forEach((el) => {
  const v = $('.stat__value', el);
  const target = +v.dataset.value;
  const fmt = v.dataset.fmt;
  const o = { n: 0 };
  const render = () => {
    const n = o.n;
    v.textContent =
      fmt === 'M' ? (n / 1e6).toFixed(1) + 'M'
      : fmt === 'B' ? (n / 1e9).toFixed(2) + 'B'
      : fmt === '+' ? Math.round(n) + '+'
      : fmt === '#' ? '#' + Math.round(n)
      : String(Math.round(n));
  };
  gsap.to(o, { n: target, duration: 2.2, ease: 'power3.out', onUpdate: render, scrollTrigger: { trigger: el, start: 'top 85%' } });
  gsap.from($('.stat__bar i', el), { scaleX: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});

// Tracks stagger.
gsap.from('.track', { x: -40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '.tracks', start: 'top 80%' } });

// Discography: pinned horizontal coverflow.
const mm = gsap.matchMedia();
mm.add('(min-width: 900px)', () => {
  const track = $('.disco__track');
  const albums = $$('.album', track);
  const yearEl = $('.disco__year b');
  const dist = () => track.scrollWidth - window.innerWidth + window.innerWidth * 0.2;
  const st = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.disco', pin: '.disco__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.8, invalidateOnRefresh: true,
      onUpdate: (s) => { $('.disco__progress i').style.transform = `scaleX(${s.progress})`; },
    },
  });
  // Coverflow is computed from real on-screen positions every frame, so it never lags the scrub.
  const flow = () => {
    const cx = window.innerWidth / 2;
    let best = null, bestD = Infinity;
    albums.forEach((a) => {
      const r = a.offsetWidth;
      const left = a.offsetLeft + gsap.getProperty(track, 'x');
      const d = (left + r / 2 - cx) / window.innerWidth;
      const ad = Math.abs(d);
      a.style.setProperty('--ry', `${gsap.utils.clamp(-40, 40, d * -55)}deg`);
      a.style.setProperty('--z', `${-Math.min(ad, 1) * 140}px`);
      a.style.setProperty('--o', `${1 - Math.min(ad, 0.9) * 0.55}`);
      if (ad < bestD) { bestD = ad; best = a; }
    });
    if (best && yearEl.textContent !== best.dataset.year) {
      yearEl.textContent = best.dataset.year;
      gsap.fromTo(yearEl, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    }
  };
  gsap.ticker.add(flow);
  return () => { gsap.ticker.remove(flow); st.scrollTrigger?.kill(); albums.forEach((a) => a.removeAttribute('style')); };
});

// Timeline line draws with scroll; items slide in from their side.
gsap.fromTo('.timeline__line i', { scaleY: 0 }, {
  scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 60%', scrub: true },
});
$$('.tl').forEach((el) => {
  gsap.from($('.tl__card', el), {
    x: el.classList.contains('tl--l') ? -60 : 60, opacity: 0, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 60%', toggleClass: 'is-active' });
});

// Story photo parallax.
gsap.fromTo('.story__photo img', { yPercent: -8, scale: 1.15 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.story__photo', scrub: true } });

// Collab marquees: base speed + scroll-velocity boost & skew.
const marquees = $$('.marquee__inner').map((el, i) => ({ el, x: 0, dir: i ? 1 : -1 }));
let velocity = 0;
ScrollTrigger.create({ onUpdate: (s) => { velocity = s.getVelocity(); } });
gsap.ticker.add(() => {
  const boost = gsap.utils.clamp(-12, 12, velocity / 250);
  velocity *= 0.92;
  marquees.forEach((m) => {
    const w = m.el.scrollWidth / 2;
    m.x += (reduced ? 0.3 : 1 + Math.abs(boost)) * m.dir;
    if (m.x <= -w) m.x += w;
    if (m.x >= 0 && m.dir > 0) m.x -= w;
    m.el.style.transform = `translate3d(${m.x}px,0,0) skewX(${boost * -1.2}deg)`;
  });
});

// Feed cards.
gsap.from('.post', { y: 80, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '.feed__grid', start: 'top 80%' } });

// Outro letters.
gsap.from('.outro__big span', {
  yPercent: 100, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
  scrollTrigger: { trigger: '.outro', start: 'top 75%' },
});

/* ---------------------------------------------------------------- 3D tilt + glare */

if (finePointer && !reduced) {
  $$('.tilt').forEach((el) => {
    const max = el.classList.contains('rcard') ? 14 : 8;
    const qx = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      qx((px - 0.5) * max * 2);
      qy((0.5 - py) * max * 2);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
}

/* ---------------------------------------------------------------- magnetic buttons */

if (finePointer && !reduced) {
  $$('.magnetic').forEach((el) => {
    const strength = el.classList.contains('outro__big') ? 0.12 : 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------------------------------------------------------- custom cursor */

if (finePointer) {
  document.documentElement.classList.add('has-cursor');
  const cur = $('.cursor');
  const label = $('.cursor__label');
  const cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3.out' });
  const cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button');
    cur.classList.toggle('is-hover', !!t);
    label.textContent = t?.dataset.cursor || '';
    cur.classList.toggle('has-label', !!t?.dataset.cursor);
  });
  document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
  document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
}

/* ---------------------------------------------------------------- floating cover on track hover */

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
  $$('.track').forEach((t) => t.addEventListener('pointerenter', () => {
    img.src = t.dataset.cover;
    float.classList.add('is-on');
  }));
  $('.tracks').addEventListener('pointerleave', () => float.classList.remove('is-on'));
}

/* ---------------------------------------------------------------- player dock (Spotify embed) */

const dock = $('.dock');
let current = null;
function play({ spotify, title, cover }) {
  if (!spotify) return;
  $$('.is-playing').forEach((n) => n.classList.remove('is-playing'));
  $$(`[data-spotify="${spotify}"]`).forEach((n) => n.classList.add('is-playing'));
  if (current !== spotify) {
    current = spotify;
    $('.dock__frame').innerHTML = `<iframe title="Spotify player — ${esc(title)}" src="https://open.spotify.com/embed/${spotify}?utm_source=generator&theme=0" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  }
  $('.dock__title').textContent = title;
  $('.dock__cover').src = cover;
  dock.classList.add('is-open');
  dock.setAttribute('aria-hidden', 'false');
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('.js-play');
  if (t) { e.preventDefault(); play(t.dataset); return; }
  const card = e.target.closest('.rcard');
  if (card && !e.target.closest('a')) {
    const btn = $('.js-play', card);
    if (btn) play(btn.dataset); else window.open($('a.rcard__btn', card).href, '_blank', 'noopener');
  }
});
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('track')) { e.preventDefault(); play(e.target.dataset); }
  if (e.key === 'Escape') { closeDock(); closeMenu(); }
});
function closeDock() {
  dock.classList.remove('is-open');
  dock.setAttribute('aria-hidden', 'true');
  $('.dock__frame').innerHTML = '';
  current = null;
  $$('.is-playing').forEach((n) => n.classList.remove('is-playing'));
}
$('.dock__close').addEventListener('click', closeDock);

/* ---------------------------------------------------------------- nav */

const burger = $('.nav__burger');
const menu = $('.menu');
function closeMenu() {
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}
burger.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  if (open) gsap.from('.menu a', { yPercent: 100, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'expo.out' });
});

let lastY = 0;
ScrollTrigger.create({
  onUpdate: (s) => {
    const y = s.scroll();
    $('.nav').classList.toggle('is-hidden', y > lastY && y > 200 && !document.body.classList.contains('menu-open'));
    $('.nav').classList.toggle('is-solid', y > 40);
    lastY = y;
  },
});

window.addEventListener('load', () => ScrollTrigger.refresh());
