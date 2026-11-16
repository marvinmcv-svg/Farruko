import '../style.css';
import '../pages.css';
import { TIMELINE, COLLABS, BIO } from '../data.js';
import { $, $$, gsap, ScrollTrigger, esc, initLayout, revealPage, revealLines, finishInit, marquees } from '../core/layout.js';

initLayout('historia');

$('.facts').innerHTML = BIO.facts.map(([k, v]) => `<div class="fact"><span class="mono">${esc(k)}</span><b>${esc(v)}</b></div>`).join('');

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
const rows = $$('.marquee__inner');
rows[0].innerHTML = marqueeHTML(COLLABS.slice(0, half));
rows[1].innerHTML = marqueeHTML(COLLABS.slice(half));
marquees();

revealLines();
revealPage(() => {
  gsap.timeline()
    .from('.hist__photo img', { scale: 1.35, duration: 2.2, ease: 'expo.out' }, 0)
    .from('.hist__photo', { clipPath: 'inset(0 0 0 100%)', duration: 1.4, ease: 'expo.inOut' }, 0)
    .from('.phero__title .line__in', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, 0.3)
    .from('.phero__lede, .phero .eyebrow, .hist__caption', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.6);
});

gsap.to('.hist__photo img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.from('.fact', { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '.facts', start: 'top 85%' } });

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

finishInit();
