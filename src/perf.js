/* Keeping the page light. Nothing should animate while nobody can see it: every running animation costs a full redraw of the
   screen, even for an element that is far off screen.
   - The hero's animations (light rays, glow, the portrait ring, the diamond, the button glow) pause while the hero is out of
     view (html.hero-off), and the gilded titles, the marquee bulbs and the spinning medals pause while they are out of view
     (.off). CSS in golden-age.css turns both classes into animation-play-state: paused.
   - The page-load veil (a full-screen cover that fades out in the first 3 seconds) is removed once it has finished, instead of
     staying on top of the page as an invisible full-screen layer.
   - The marquee bulbs step by a timer (every half second, and only while visible) instead of by a CSS animation.
   The marquee (app.js) and the hero light (app.js) pause themselves the same way. */

export function initPerf() {
  var root = document.documentElement;
  var veil = document.querySelector('.veil');
  if (veil) {
    var gone = function () { if (veil.parentNode) veil.remove(); };
    veil.addEventListener('animationend', gone);
    setTimeout(gone, 4500);
  }
  if (!window.IntersectionObserver) return;
  var hero = document.querySelector('.hero');
  if (hero) new IntersectionObserver(function (en) { root.classList.toggle('hero-off', !en[0].isIntersecting); }, { rootMargin: '80px' }).observe(hero);
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (e) { e.target.classList.toggle('off', !e.isIntersecting); });
  }, { rootMargin: '80px' });
  var bulbs = document.querySelectorAll('.bulbs'), step = 0;
  Array.prototype.forEach.call(document.querySelectorAll('.bulbs, .gild, .medal'), function (el) { io.observe(el); });
  setInterval(function () {
    if (document.hidden) return;
    step = (step + 1) % 3;
    Array.prototype.forEach.call(bulbs, function (b) { if (!b.classList.contains('off')) { b.classList.remove('c1', 'c2'); if (step) b.classList.add('c' + step); } });
  }, 500);
}
