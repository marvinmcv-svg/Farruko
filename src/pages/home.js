import '../style.css';
import '../pages.css';
import { RELEASES, STATS, ALBUMS } from '../data.js';
import {
  $, $$, gsap, ScrollTrigger, reduced, finePointer, esc,
  initLayout, revealPage, revealLines, finishInit, setCursor,
} from '../core/layout.js';
import { initRoad } from '../hero/road.js';

initLayout('home');

/* ---------------------------------------------------------------- render */

$('.releases__grid').innerHTML = RELEASES.map((r, i) => `
  <article class="rcard tilt" data-tilt="14" style="--accent:${r.accent}" data-cursor="${r.spotify ? 'Play' : 'Escucha'}">
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
            : `<a class="rcard__btn" href="${r.url}" target="_blank" rel="noopener">Escucha ↗</a>`}
        </div>
      </div>
    </div>
  </article>`).join('');

// Clicking anywhere on a card plays it (or opens the link).
$('.releases__grid').addEventListener('click', (e) => {
  const card = e.target.closest('.rcard');
  if (!card || e.target.closest('a, button')) return;
  const btn = $('.js-play', card);
  if (btn) btn.click(); else window.open($('a.rcard__btn', card).href, '_blank', 'noopener');
});

$('.stats__grid').innerHTML = STATS.map((s) => `
  <div class="stat">
    <div class="stat__value display" data-value="${s.value}" data-fmt="${s.fmt}">0</div>
    <div class="stat__bar"><i></i></div>
    <p class="stat__label">${esc(s.label)}</p>
  </div>`).join('');

$('.disco__track').innerHTML = ALBUMS.map((a) => `
  <a class="album" href="/musica.html#${a.slug}" data-year="${a.year}" data-cursor="Abrir">
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

/* ---------------------------------------------------------------- hero: Carretera 167 */

const drive = $('.drive');
const num = $('.speedo__num');
const fill = $('.speedo__fill');
const CIRC = 2 * Math.PI * 84;
const ARC = 0.75; // 270° dial
fill.style.strokeDasharray = `${CIRC * ARC} ${CIRC}`;

// Redline zone (150–167) painted on the dial so the target is visible before you reach it.
const RED_FROM = 150 / 167;
$('.speedo__red').style.strokeDasharray = `0 ${CIRC * ARC * RED_FROM} ${CIRC * ARC * (1 - RED_FROM)} ${CIRC}`;

// Dial ticks every 10 km/h, long + labelled every 40, ending on a 167 mark.
const deg = (kmh) => (135 + (kmh / 167) * 270) * (Math.PI / 180);
const pt = (a, r) => `${(100 + Math.cos(a) * r).toFixed(1)}`;
const ptY = (a, r) => `${(100 + Math.sin(a) * r).toFixed(1)}`;
$('.speedo__ticks').innerHTML = [...Array.from({ length: 17 }, (_, i) => i * 10), 167].map((k) => {
  const a = deg(k);
  const major = k % 40 === 0 || k === 167;
  const r1 = 74, r2 = major ? 64 : 69;
  const line = `<line class="${k >= 150 ? 'is-red' : ''}" x1="${pt(a, r1)}" y1="${ptY(a, r1)}" x2="${pt(a, r2)}" y2="${ptY(a, r2)}" />`;
  return major ? line + `<text x="${pt(a, 98)}" y="${ptY(a, 98)}" class="${k === 167 ? 'is-red' : ''}">${k}</text>` : line;
}).join('');

const passK = $('.drive__passing-k');
const passV = $('.drive__passing-v b');
let road = null;

function startRoad() {
  try {
    road = initRoad($('.drive__canvas'), {
      albums: ALBUMS,
      reduced,
      onPass(album) {
        passK.textContent = `Pasando · ${album.year}`;
        if (reduced) { passV.textContent = album.title; return; }
        gsap.timeline()
          .to(passV, { yPercent: -110, opacity: 0, duration: 0.25, ease: 'power2.in' })
          .add(() => { passV.textContent = album.title; })
          .fromTo(passV, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
      },
      onHover(album) {
        drive.classList.toggle('is-over-board', !!album);
        if (finePointer) setCursor(album ? 'Abrir' : null);
      },
    });
  } catch (err) {
    document.documentElement.classList.add('no-webgl');
    console.warn('WebGL unavailable', err);
  }
}

// Hold to accelerate — pointer anywhere on the hero (except controls) or Space.
function setHold(v) {
  road?.setHold(v);
  drive.classList.toggle('is-boost', v);
}
drive.addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button')) return;
  if (road?.hovered) return; // clicking a billboard opens it instead
  setHold(true);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => drive.addEventListener(ev, () => setHold(false)));
drive.addEventListener('pointerleave', () => road?.clearPointer());
drive.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') road?.setPointer(e); });
drive.addEventListener('click', (e) => {
  if (e.target.closest('a, button') || !road?.hovered) return;
  const a = document.createElement('a');
  a.href = `/musica.html#${road.hovered.slug}`;
  document.body.appendChild(a);
  a.click();
});
let heroInView = true;
ScrollTrigger.create({ trigger: drive, start: 'top top', end: 'bottom top', onToggle: (s) => { heroInView = s.isActive; } });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && heroInView && !e.repeat && !e.target.closest('input, textarea, button, a')) { e.preventDefault(); setHold(true); }
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') setHold(false); });
drive.addEventListener('contextmenu', (e) => { if (e.pointerType !== 'mouse') e.preventDefault(); });

// HUD: speedometer + title speed effects read from the sim each frame.
let shownKmh = -1;
let redlined = false;
gsap.ticker.add(() => {
  if (!road) return;
  const kmh = road.kmh;
  const p = road.state.speed;
  if (kmh !== shownKmh) {
    shownKmh = kmh;
    num.textContent = String(kmh).padStart(3, '0');
    fill.style.strokeDashoffset = String(CIRC * ARC * (1 - p));
  }
  drive.style.setProperty('--spd', p.toFixed(3));
  const atRed = road.state.redline;
  if (atRed !== redlined) {
    redlined = atRed;
    drive.classList.toggle('is-redline', atRed);
    if (atRed && !reduced) {
      gsap.fromTo('.drive__redline span', { scale: 2.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' });
      gsap.fromTo('.speedo', { scale: 1.12 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      navigator.vibrate?.(40);
    }
  }
});

// Scroll: the camera climbs above the road and the title lifts away.
ScrollTrigger.create({
  trigger: drive, start: 'top top', end: 'bottom top', scrub: true,
  onUpdate: (s) => road?.setScroll(s.progress),
});
gsap.to('.drive__title', { yPercent: -40, opacity: 0.1, ease: 'none', scrollTrigger: { trigger: drive, start: 'top top', end: 'bottom top', scrub: true } });

/* ---------------------------------------------------------------- loader + intro */

function intro() {
  const tl = gsap.timeline();
  tl.from('.drive__canvas', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
    .from('.drive__word', { yPercent: 60, opacity: 0, scaleY: 1.6, duration: 1.4, ease: 'expo.out' }, 0.1)
    .from('.drive__tag, .drive__hud', { opacity: 0, y: 14, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.5)
    .from('.speedo, .drive__passing, .drive__cta > *', { opacity: 0, y: 30, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.6)
    .from('.nav', { opacity: 0, duration: 0.8 }, 0.6);
}

function runLoader() {
  const loader = $('.loader');
  const seen = sessionStorage.getItem('farru-ignition');
  const cameFromSite = document.referrer && new URL(document.referrer).origin === location.origin;
  startRoad();
  if (reduced || seen || cameFromSite) {
    loader.remove();
    revealPage(intro);
    return;
  }
  sessionStorage.setItem('farru-ignition', '1');
  revealPage();
  document.body.classList.add('is-loading');
  const n = $('.loader__num');
  const obj = { v: 0 };
  gsap.timeline({ onComplete: () => { loader.remove(); document.body.classList.remove('is-loading'); } })
    .to(obj, { v: 167, duration: 2.1, ease: 'power2.inOut', onUpdate: () => { n.textContent = String(Math.round(obj.v)).padStart(3, '0'); } })
    .to('.loader__bar i', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0)
    .from('.loader__word span', { yPercent: 120, opacity: 0, stagger: 0.04, duration: 0.5, ease: 'back.out(2)' }, 1.5)
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=0.25')
    .add(intro, '-=0.55');
}
document.fonts.ready.then(runLoader);

/* ---------------------------------------------------------------- sections */

revealLines();

gsap.from('.rcard', {
  y: 120, rotateX: -25, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
  scrollTrigger: { trigger: '.releases__grid', start: 'top 80%' },
});

const fTl = gsap.timeline({ scrollTrigger: { trigger: '.feature', start: 'top 70%', end: 'center 40%', scrub: 1 } });
fTl.fromTo('.feature .disc', { xPercent: 0, rotate: 0 }, { xPercent: 52, rotate: 220, ease: 'none' })
  .fromTo('.feature .sleeve', { rotateY: 0 }, { rotateY: -14, ease: 'none' }, 0);
gsap.to('.feature__bg', { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '.feature', scrub: true } });

$$('.stat').forEach((el) => {
  const v = $('.stat__value', el);
  const target = +v.dataset.value;
  const fmt = v.dataset.fmt;
  const o = { n: 0 };
  const render = () => {
    const n = o.n;
    v.textContent = fmt === 'M' ? (n / 1e6).toFixed(1) + 'M'
      : fmt === 'B' ? (n / 1e9).toFixed(2) + 'B'
      : fmt === '+' ? Math.round(n) + '+'
      : fmt === '#' ? '#' + Math.round(n)
      : String(Math.round(n));
  };
  gsap.to(o, { n: target, duration: 2.2, ease: 'power3.out', onUpdate: render, scrollTrigger: { trigger: el, start: 'top 85%' } });
  gsap.from($('.stat__bar i', el), { scaleX: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});

// Discography: pinned horizontal coverflow.
gsap.matchMedia().add('(min-width: 900px)', () => {
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
  const flow = () => {
    const cx = window.innerWidth / 2;
    let best = null, bestD = Infinity;
    albums.forEach((a) => {
      const left = a.offsetLeft + gsap.getProperty(track, 'x');
      const d = (left + a.offsetWidth / 2 - cx) / window.innerWidth;
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

// Portals: rows rise in; covers fan out on hover (CSS).
gsap.from('.portal', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.portals__list', start: 'top 80%' } });

gsap.from('.outro__big span', {
  yPercent: 100, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
  scrollTrigger: { trigger: '.outro', start: 'top 75%' },
});

finishInit();
