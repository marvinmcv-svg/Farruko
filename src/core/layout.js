// Shared shell for every page: nav, mobile menu, footer, cursor, grain,
// Spotify dock, page transitions, smooth scroll and the common micro-interactions.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SOCIAL } from '../data.js';

gsap.registerPlugin(ScrollTrigger);

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(pointer: fine)').matches;
export const fmtCompact = (n) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
export const fmtFull = (n) => new Intl.NumberFormat('en').format(n);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export { gsap, ScrollTrigger };

const PAGES = [
  { href: '/', key: 'home', label: 'Inicio' },
  { href: '/musica.html', key: 'musica', label: 'Música' },
  { href: '/media.html', key: 'media', label: 'Media' },
  { href: '/historia.html', key: 'historia', label: 'Historia' },
];

const shield = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 C68 12 84 10 96 16 C96 58 78 82 50 96 C22 82 4 58 4 16 C16 10 32 12 50 4Z"/></svg>';

function shellHTML(page) {
  const links = PAGES.map((p, i) => `<a href="${p.href}"${p.key === page ? ' aria-current="page"' : ''}><sup class="mono">0${i + 1}</sup>${p.label}</a>`).join('');
  return {
    top: `
      <div class="grain" aria-hidden="true"></div>
      <div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>
      <div class="gauge" aria-hidden="true"><i></i><span class="mono">RPM</span></div>
      <div class="pt" aria-hidden="true"><div class="pt__panel"><span class="pt__word">FARRUKO</span><span class="pt__num mono">LA167 · CARGANDO</span></div></div>
      <header class="nav">
        <a href="/" class="nav__logo" aria-label="Farruko — inicio">${shield}<span>FARRUKO</span></a>
        <nav class="nav__links" aria-label="Principal">${links}</nav>
        <a class="btn btn--fuel magnetic" href="${SOCIAL.presave}" target="_blank" rel="noopener" data-cursor="Pre-save"><span>Pre-save</span><b>Que Novedad RMX</b></a>
        <button class="nav__burger" aria-label="Abrir menú" aria-expanded="false"><i></i><i></i></button>
      </header>
      <div class="menu" aria-hidden="true">
        <nav class="menu__links">${links}</nav>
        <div class="menu__foot mono">
          <a href="${SOCIAL.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
          <a href="${SOCIAL.spotify}" target="_blank" rel="noopener">Spotify ↗</a>
          <a href="${SOCIAL.youtube}" target="_blank" rel="noopener">YouTube ↗</a>
        </div>
      </div>`,
    bottom: `
      <footer class="footer">
        <div class="footer__top">
          <div class="footer__brand display">FARRUKO<span class="fuel">.</span></div>
          <div class="footer__cols">
            <nav class="footer__nav" aria-label="Páginas">${PAGES.map((p) => `<a href="${p.href}">${p.label}</a>`).join('')}</nav>
            <nav class="footer__social" aria-label="Redes">
              <a href="${SOCIAL.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
              <a href="${SOCIAL.spotify}" target="_blank" rel="noopener">Spotify ↗</a>
              <a href="${SOCIAL.youtube}" target="_blank" rel="noopener">YouTube ↗</a>
              <a href="${SOCIAL.x}" target="_blank" rel="noopener">X ↗</a>
            </nav>
          </div>
        </div>
        <div class="footer__bottom mono">
          <span>© 2026 La 167 LLC · Cvrbon Vrmor</span>
          <span>Hecho en Puerto Rico 🇵🇷</span>
          <a href="#top" class="js-top">Volver arriba ↑</a>
        </div>
      </footer>
      <aside class="dock" aria-label="Reproduciendo" aria-hidden="true">
        <div class="dock__meta">
          <img class="dock__cover" alt="" />
          <div><span class="mono">Sonando ahora</span><b class="dock__title"></b></div>
          <div class="dock__eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <button class="dock__close" aria-label="Cerrar reproductor">✕</button>
        </div>
        <div class="dock__frame"></div>
      </aside>`,
  };
}

export let lenis = null;

export function initLayout(page) {
  const { top, bottom } = shellHTML(page);
  document.body.insertAdjacentHTML('afterbegin', top);
  document.body.insertAdjacentHTML('beforeend', bottom);

  smoothScroll();
  navBehaviour();
  pageTransitions();
  dock();
  gauge();
  if (finePointer) cursor();
}

/* ---------------------------------------------------------------- smooth scroll */
function smoothScroll() {
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' || id === '#' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) window.scrollTo(0, 0);
    else target.scrollIntoView();
  });
}

/* ---------------------------------------------------------------- nav */
export function closeMenu() {
  document.body.classList.remove('menu-open');
  $('.nav__burger')?.setAttribute('aria-expanded', 'false');
  $('.menu')?.setAttribute('aria-hidden', 'true');
  lenis?.start();
}
function navBehaviour() {
  const burger = $('.nav__burger');
  burger.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    if (!open) return closeMenu();
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    $('.menu').setAttribute('aria-hidden', 'false');
    lenis?.stop();
    gsap.from('.menu__links a', { yPercent: 100, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out', delay: 0.15 });
  });
  let lastY = 0;
  ScrollTrigger.create({
    onUpdate: (s) => {
      const y = s.scroll();
      const nav = $('.nav');
      nav.classList.toggle('is-hidden', y > lastY && y > 200 && !document.body.classList.contains('menu-open'));
      nav.classList.toggle('is-solid', y > 40);
      lastY = y;
    },
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

function gauge() {
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => $('.gauge i').style.setProperty('--p', s.progress) });
}

/* ---------------------------------------------------------------- page transitions */
// Internal links wipe a fuel-orange panel over the page, then navigate; the next
// page starts covered and wipes it away (see revealPage).
function pageTransitions() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/(\/|\.html)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return; // same page (hash links handled above)
    e.preventDefault();
    closeMenu();
    if (reduced) { location.href = url.href; return; }
    const pt = $('.pt');
    pt.classList.add('is-active');
    gsap.timeline({ onComplete: () => { location.href = url.href; } })
      .fromTo(pt, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.75, ease: 'expo.inOut' })
      .fromTo('.pt__word', { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' }, 0.35);
  });
  // Coming back via bfcache: make sure the panel isn't stuck over the page.
  window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set('.pt', { clipPath: 'inset(0 0 100% 0)' }); });
}

/** Wipe the transition panel away when a page loads (skipped on first visit to home, which has its loader). */
export function revealPage(onDone) {
  const pt = $('.pt');
  const entering = document.documentElement.classList.contains('is-entering');
  if (!entering) { gsap.set(pt, { clipPath: 'inset(0 0 100% 0)' }); onDone?.(); return; }
  pt.classList.add('is-active');
  gsap.set(pt, { clipPath: 'inset(0% 0 0 0)' });
  document.documentElement.classList.remove('is-entering');
  gsap.set('.pt__word', { yPercent: 0 });
  gsap.timeline()
    .to('.pt__word', { yPercent: -110, duration: 0.5, ease: 'expo.in' }, 0.1)
    .to(pt, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, 0.3)
    .add(() => onDone?.(), 0.65);
}

/* ---------------------------------------------------------------- cursor */
function cursor() {
  document.documentElement.classList.add('has-cursor');
  const cur = $('.cursor');
  const label = $('.cursor__label');
  const cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3.out' });
  const cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button');
    setCursor(t ? t.dataset.cursor || '' : null);
  });
  document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
  document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
}
/** null = default dot, '' = hover ring, text = labelled disc. */
export function setCursor(text) {
  const cur = $('.cursor');
  if (!cur) return;
  cur.classList.toggle('is-hover', text !== null);
  cur.classList.toggle('has-label', !!text);
  $('.cursor__label').textContent = text || '';
}

/* ---------------------------------------------------------------- shared interactions */

/** Masked line reveals for headings marked .reveal-lines (split on <br>). */
export function revealLines(root = document) {
  $$('.reveal-lines', root).forEach((el) => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="line"><span class="line__in">${l}</span></span>`).join('');
    gsap.from($$('.line__in', el), { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('.fade-up', root).forEach((el) => {
    gsap.from(el, { y: 28, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
}

export function tilt(selector = '.tilt') {
  if (!finePointer || reduced) return;
  $$(selector).forEach((el) => {
    if (el.dataset.tiltBound) return;
    el.dataset.tiltBound = '1';
    const max = +(el.dataset.tilt || 8);
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

export function magnetic() {
  if (!finePointer || reduced) return;
  $$('.magnetic').forEach((el) => {
    if (el.dataset.magBound) return;
    el.dataset.magBound = '1';
    const strength = +(el.dataset.magnet || 0.35);
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

/** Velocity-reactive marquee rows. */
export function marquees(selector = '.marquee__inner') {
  const rows = $$(selector).map((el, i) => ({ el, x: 0, dir: i % 2 ? 1 : -1 }));
  if (!rows.length) return;
  let velocity = 0;
  ScrollTrigger.create({ onUpdate: (s) => { velocity = s.getVelocity(); } });
  gsap.ticker.add(() => {
    const boost = gsap.utils.clamp(-12, 12, velocity / 250);
    velocity *= 0.92;
    rows.forEach((m) => {
      const w = m.el.scrollWidth / 2;
      m.x += (reduced ? 0.3 : 1 + Math.abs(boost)) * m.dir;
      if (m.x <= -w) m.x += w;
      if (m.x >= 0 && m.dir > 0) m.x -= w;
      m.el.style.transform = `translate3d(${m.x}px,0,0) skewX(${boost * -1.2}deg)`;
    });
  });
}

/* ---------------------------------------------------------------- Spotify dock */
let current = null;
export function play({ spotify, title, cover }) {
  if (!spotify) return;
  const d = $('.dock');
  $$('.is-playing').forEach((n) => n.classList.remove('is-playing'));
  $$(`[data-spotify="${spotify}"]`).forEach((n) => n.classList.add('is-playing'));
  if (current !== spotify) {
    current = spotify;
    $('.dock__frame').innerHTML = `<iframe title="Spotify — ${esc(title)}" src="https://open.spotify.com/embed/${spotify}?utm_source=generator&theme=0" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  }
  $('.dock__title').textContent = title;
  if (cover) $('.dock__cover').src = cover;
  d.classList.add('is-open');
  d.setAttribute('aria-hidden', 'false');
}
export function closeDock() {
  const d = $('.dock');
  d.classList.remove('is-open');
  d.setAttribute('aria-hidden', 'true');
  $('.dock__frame').innerHTML = '';
  current = null;
  $$('.is-playing').forEach((n) => n.classList.remove('is-playing'));
}
function dock() {
  $('.dock__close').addEventListener('click', closeDock);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.js-play');
    if (t) { e.preventDefault(); play(t.dataset); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('js-play') && e.target.tagName === 'LI') { e.preventDefault(); play(e.target.dataset); }
    if (e.key === 'Escape' && !document.querySelector('.modal.is-open')) closeDock();
  });
}

/* ---------------------------------------------------------------- modal */
let modalClose = null;
let lastFocus = null;
export function openModal(html, { className = '', onClose } = {}) {
  let m = $('.modal');
  if (!m) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="modal__scrim" data-close></div>
        <div class="modal__box"><button class="modal__x" data-close aria-label="Cerrar">✕</button><div class="modal__body"></div></div>
      </div>`);
    m = $('.modal');
    m.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.classList.contains('is-open')) closeModal(); });
  }
  modalClose?.();
  lastFocus = document.activeElement;
  m.className = `modal ${className}`;
  $('.modal__body', m).innerHTML = html;
  modalClose = onClose || null;
  m.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => m.classList.add('is-open'));
  lenis?.stop();
  document.body.classList.add('modal-open');
  setTimeout(() => $('.modal__x', m).focus({ preventScroll: true }), 50);
  if (!reduced) gsap.fromTo($('.modal__box', m), { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
  return m;
}
export function closeModal() {
  const m = $('.modal');
  if (!m || !m.classList.contains('is-open')) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  lenis?.start();
  const done = modalClose; modalClose = null;
  setTimeout(() => { if (!m.classList.contains('is-open')) $('.modal__body', m).innerHTML = ''; }, 400);
  done?.();
  lastFocus?.focus?.({ preventScroll: true });
}

/** Run after the page has rendered its content. */
export function finishInit() {
  tilt();
  magnetic();
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
