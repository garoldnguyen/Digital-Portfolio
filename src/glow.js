/* Luminescent particles. Now and then a few soft golden lights appear somewhere on the screen, wander around for a
   few seconds on slow curved paths, and fade away. Small and dim on purpose, so they never get in the way of reading.
   Decorative only: aria-hidden, no pointer events, never more than a handful at once, nothing while the tab is hidden.
   Off for prefers-reduced-motion (app.js skips it).
   Test hook: window.dispatchEvent(new CustomEvent('fx:glow')) spawns a cluster now. */

function rand(a, b) { return a + Math.random() * (b - a); }

export function initGlow(G) {
  var live = 0, MAX = 8;

  function orb(x, y) {
    var d = rand(22, 54), life = rand(4.6, 7.4), peak = rand(0.45, 0.80);
    var el = document.createElement('i');
    el.className = 'orb';
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--d', d.toFixed(0) + 'px');
    document.body.appendChild(el);
    live++;
    G.set(el, { x: x, y: y, scale: 0.5, opacity: 0 });
    // appear and fade slowly...
    G.timeline({ onComplete: function () { el.remove(); live--; } })
      .to(el, { opacity: peak, scale: 1, duration: rand(1.1, 1.8), ease: 'sine.out' }, 0)
      .to(el, { opacity: 0, scale: 0.7, duration: rand(1.5, 2.2), ease: 'sine.in' }, life - 2.0);
    // ...while wandering: two independent slow eases make a curved path
    G.to(el, { x: x + rand(-1, 1) * rand(90, 230), duration: life, ease: 'sine.inOut' });
    G.to(el, { y: y + rand(-1, 1) * rand(70, 180), duration: life * rand(0.8, 1.2), ease: 'sine.inOut' });
  }

  function cluster() {
    var w = window.innerWidth, h = window.innerHeight;
    var n = 1 + Math.floor(Math.random() * 3);
    var cx = rand(0.08, 0.92) * w, cy = rand(0.18, 0.88) * h;
    for (var i = 0; i < n && live < MAX; i++) {
      (function (i) {
        setTimeout(function () {
          if (!document.hidden && live < MAX) orb(cx + rand(-90, 90), Math.max(100, cy + rand(-70, 70)));
        }, i * rand(300, 900));
      })(i);
    }
  }

  function loop() {
    setTimeout(function () {
      if (!document.hidden) cluster();
      loop();
    }, rand(4200, 9000));
  }

  window.addEventListener('fx:glow', cluster);
  setTimeout(cluster, rand(2200, 3800));
  loop();
}
