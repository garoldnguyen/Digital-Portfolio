/* Section-title glitch. Every so often a section heading (Profile, Credentials, Career, ...) changes into another
   word, glitches like a bad signal, and decodes back to the real title:

     1. the real word scrambles into the other word (letter by letter, through noise)
     2. the other word holds and glitches: colour-split copies jitter in clipped slices, a scan line sweeps through,
        a couple of letters flicker
     3. it scrambles back into the real word and settles

   The other word comes from the heading's data-alt attribute (edit it in index.html). The real title is kept in
   aria-label the whole time, so screen readers always read the real word. The hero name is deliberately not part
   of this. Only runs when motion is allowed (app.js skips it for prefers-reduced-motion).
   Test hook: window.dispatchEvent(new CustomEvent('fx:glitch')) runs the sequence on the first heading in view. */

var NOISE = 'ABCDEFGHKMNPRSTVXZ0123456789#%&@?/<>=+*';

function rand(a, b) { return a + Math.random() * (b - a); }
function noiseChar() { return NOISE.charAt(Math.floor(Math.random() * NOISE.length)); }

export function initGlitch() {
  var heads = Array.prototype.slice.call(document.querySelectorAll('.sh .h2'));
  if (!heads.length) return;

  var items = heads.map(function (h) {
    var text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    var wrap = document.createElement('div');
    wrap.className = 'gt';
    h.parentNode.insertBefore(wrap, h);
    wrap.appendChild(h);
    var layers = ['r', 'c'].map(function (k) {
      var l = document.createElement('span');
      l.className = 'h2 glx glx-' + k;
      l.setAttribute('aria-hidden', 'true');
      l.textContent = text;
      wrap.appendChild(l);
      return l;
    });
    return { h: h, wrap: wrap, text: text, alt: (h.getAttribute('data-alt') || '').trim(), layers: layers, visible: false, readyAt: 0, busy: false };
  });

  function setText(it, s) {
    it.h.textContent = s;
    it.layers.forEach(function (l) { l.textContent = s; });
  }

  // decode from one word into another, letter by letter, through noise
  function morph(it, from, to, ms, done) {
    var n = Math.max(from.length, to.length), start = performance.now(), lastFrame = 0, s0 = [], s1 = [], i;
    for (i = 0; i < n; i++) { s0[i] = (i / n) * 0.55 + Math.random() * 0.1; s1[i] = s0[i] + 0.35; }
    (function frame(now) {
      var t = (now - start) / ms;
      if (t >= 1) { setText(it, to); done(); return; }
      if (now - lastFrame >= 42) {
        lastFrame = now;
        var out = '';
        for (var k = 0; k < n; k++) {
          var fc = from.charAt(k), tc = to.charAt(k);
          if (t < s0[k]) out += fc;
          else if (t < s1[k]) out += (fc === ' ' && tc === ' ') ? ' ' : noiseChar();
          else out += tc;
        }
        setText(it, out);
      }
      requestAnimationFrame(frame);
    })(performance.now());
  }

  // while the other word holds: the decorative copies show corrupted versions, one real letter flickers
  function flicker(it, word) {
    it.flickering = true;
    (function step() {
      if (!it.flickering) return;
      it.layers.forEach(function (l) {
        var chars = word.split('');
        for (var k = 0; k < 2; k++) {
          var p = Math.floor(Math.random() * chars.length);
          if (chars[p] !== ' ') chars[p] = noiseChar();
        }
        l.textContent = chars.join('');
      });
      var real = word.split(''), q = Math.floor(Math.random() * real.length);
      if (real[q] !== ' ' && Math.random() < 0.5) real[q] = noiseChar();
      it.h.textContent = real.join('');
      setTimeout(step, rand(90, 150));
    })();
  }

  function run(it) {
    if (!it || it.busy || !it.alt || it.alt.toLowerCase() === it.text.toLowerCase()) return;
    it.busy = true;
    var wrap = it.wrap;
    wrap.style.minHeight = wrap.offsetHeight + 'px';          // a shorter or longer word must never move the page
    var failsafe = setTimeout(finish, 4200);
    function finish() {
      clearTimeout(failsafe);
      it.flickering = false;
      wrap.classList.remove('glitch');
      setText(it, it.text);
      wrap.style.minHeight = '';
      it.busy = false;
    }
    morph(it, it.text, it.alt, 560, function () {
      wrap.style.setProperty('--gd', '520ms');
      wrap.classList.toggle('gv2', Math.random() < 0.5);
      wrap.classList.add('glitch');
      var hold = rand(800, 1100);
      flicker(it, it.alt);
      setTimeout(function () {
        it.flickering = false;
        setText(it, it.alt);
        morph(it, it.alt, it.text, 560, function () {
          wrap.classList.remove('glitch');
          setTimeout(finish, 60);
        });
      }, hold);
    });
  }

  if (window.IntersectionObserver) {
    var byWrap = new Map();
    items.forEach(function (it) { byWrap.set(it.wrap, it); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var it = byWrap.get(en.target), was = it.visible;
        it.visible = en.isIntersecting;
        if (it.visible && !was) {
          // let the heading's own reveal (about 1.3s) finish, then flip it once as it "arrives"
          it.readyAt = performance.now() + 1900;
          setTimeout(function () { if (it.visible && !document.hidden) run(it); }, 1900);
        }
      });
    }, { threshold: 0.6 });
    items.forEach(function (it) { io.observe(it.wrap); });
  }

  function loop() {
    setTimeout(function () {
      if (!document.hidden) {
        var now = performance.now();
        var live = items.filter(function (it) { return it.visible && !it.busy && now > it.readyAt; });
        if (live.length) run(live[Math.floor(Math.random() * live.length)]);
      }
      loop();
    }, rand(6500, 11500));
  }

  items.forEach(function (it) {
    it.wrap.addEventListener('pointerenter', function () { run(it); });
    it.wrap.addEventListener('pointerdown', function () { run(it); });
  });
  window.addEventListener('fx:glitch', function () {
    run(items.filter(function (it) { return it.visible; })[0] || items[0]);
  });

  loop();
}
