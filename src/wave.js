/* Cursor wave of words (laptop screens only). Round the cursor, small gold capitals lie on an isometric floor and
   spell out the skills from the page's ticker (SECURITY ARCHITECTURE, RISK AND GOVERNANCE...). A ripple flows outward from
   the cursor: on each crest the letters lift off the floor, grow a little and brighten, with a faint shadow left behind,
   then settle back into the dark. When the cursor rests the wave does not go away: it settles to a slow, faint
   ripple where the cursor last was, and stays as a quiet background effect (about 20 frames a second while resting).
   Click anywhere and it blooms, gently: a soft flash, and the letters (including the
   ones the resting wave keeps in the dark) drift outward in random directions and turn a little, then float slowly back,
   along curved paths and each at its own time, into the normal wave. Every click is a little different. The click is
   never blocked: links and buttons work as usual.
   One canvas, so it follows the cursor over every section of the page. Day to day it is a small canvas (600 x 560) that
   travels with the cursor; only while a click's bloom is going does it grow to cover the screen. It also draws the soft light
   that follows the cursor (it replaces the separate full-screen layer that used to do that). Every letter is fixed to its place on the
   floor, and the bloom is worked out from the letter's place and the time since the click (nothing is stored per
   letter), which keeps the motion smooth.
   Decorative only: aria-hidden, no pointer events. Off for prefers-reduced-motion (app.js skips it), touch screens and
   windows narrower than 1024px. Add ?wave=cost to the address to count frame cost in window.__wave;
   add ?wave=upright to stand the letters up instead of laying them on the floor. */

var FAMILY = 'Cormorant', WEIGHT = 500, FONT = 14;     // letter size in floor px
var P = 18;                                            // distance between letters on the floor (px)
var RHO = 6;                                           // radius of the wave, in letters
var AMP = 24;                                          // how far a crest lifts a letter (px)
var K = 1.1, SPEED = 2.2;                              // ring spacing and how fast the rings flow outward
var REST = 0.55;                                       // strength of the wave while the cursor rests (1 = while it moves)
var RHO_B = 9;                                         // radius of a click's bloom, in letters
var TOTAL = 8.4;                                       // seconds until the last letter is home again
var MAX_BLASTS = 3;
var REGION_W = 600, REGION_H = 560;                    // the small canvas that travels with the cursor (px)
var A = 0.8944, B = 0.4472;                            // 2:1 isometric floor: a floor step (1,0) lands at (A,B) on screen, (0,1) at (-A,B)
var PHRASE = 'SECURITY ARCHITECTURE · RISK AND GOVERNANCE · CLOUD SECURITY · APPLIED AI · THREAT MODELING · MENTORING · RESEARCH · ';
var TINTS = [[255, 226, 140], [255, 240, 200], [255, 205, 120], [255, 236, 170]];     // flash colours: gold, pale cream, amber, light gold

function mod(n, m) { return ((n % m) + m) % m; }
function rowShift(j) { var h = (j * 2654435761) >>> 0; return (h >>> 7) % PHRASE.length; }   // each row starts at its own place in the phrase
function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function smooth(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }
function soft(p) { p = clamp(p, 0, 1); return p * p * p * (p * (p * 6 - 15) + 10); }      // 0 to 1 with no jerk at either end (zero speed and zero acceleration)
function unit(i, j, seed, k) { var h = ((i * 73856093) ^ (j * 19349663) ^ (seed * 83492791) ^ (k * 2654435761)) >>> 0; h = ((h ^ (h >>> 15)) * 2246822519) >>> 0; return ((h ^ (h >>> 13)) >>> 0) / 4294967296; }

export function initWave(fontsReady) {
  if (!matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches) return;
  var cv = document.createElement('canvas');
  cv.className = 'wave'; cv.setAttribute('aria-hidden', 'true');
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  document.body.appendChild(cv);
  document.documentElement.classList.add('wave-on');                                    // the CSS cursor light is not needed any more
  var q = location.search;
  var cost = /[?&]wave=cost\b/.test(q) ? (window.__wave = { frames: 0, ms: 0 }) : null;
  var flat = !/[?&]wave=upright\b/.test(q);

  var W = 0, H = 0, dpr = 1, ox = 0, oy = 0, lox = NaN, loy = NaN, cw = 0, ch = 0, lit = 0, inside = false, cx = 0, cy = 0, px = 0, py = 0, pres = 0, clock = 0, lastMove = -1e9, running = false, ready = false, last = 0;
  var blasts = [], seen = new Map(), list = [];

  function size() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cw = 0; ch = 0; fit();
  }
  // the canvas is small and travels with the cursor; while a bloom is going it covers the whole screen
  function fit() {
    var full = blasts.length > 0, nw = full ? W : Math.min(REGION_W, W), nh = full ? H : Math.min(REGION_H, H);
    if (nw !== cw || nh !== ch) { cw = nw; ch = nh; cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; }
    if (full) { ox = 0; oy = 0; } else { ox = Math.round(cx - cw / 2); oy = Math.round(cy - ch / 2); }
    if (ox !== lox || oy !== loy) { lox = ox; loy = oy; cv.style.transform = 'translate(' + ox + 'px,' + oy + 'px)'; }
  }
  function floorOf(x, y) { return [(x / A + y / B) / 2 / P, (y / B - x / A) / 2 / P]; }      // a screen point's place on the floor, in letters

  // place one letter: lying on the floor (skewed along the floor's axes) or standing upright, turned by rot
  function setLetter(x, y, sc, rot) {
    var c = Math.cos(rot), s = Math.sin(rot);
    if (flat) {
      var a = A * sc, b = B * sc, cc = -A * sc, d = B * sc;
      ctx.setTransform(dpr * (a * c + cc * s), dpr * (b * c + d * s), dpr * (-a * s + cc * c), dpr * (-b * s + d * c), dpr * (x - ox), dpr * (y - oy));
    } else ctx.setTransform(dpr * sc * c, dpr * sc * s, dpr * -sc * s, dpr * sc * c, dpr * (x - ox), dpr * (y - oy));
  }

  // the cells to draw this frame: round the cursor, and round every bloom that is still going
  function gather(fx, fy, rho) {
    var s0 = Math.floor(fx + fy - rho * 1.4143), s1 = Math.ceil(fx + fy + rho * 1.4143);
    for (var s = s0; s <= s1; s++) {
      for (var i = Math.floor(fx - rho); i <= Math.ceil(fx + rho); i++) {
        var j = s - i, di = i - fx, dj = j - fy;
        if (di * di + dj * dj >= rho * rho) continue;
        var key = (i + 20000) * 40000 + (j + 20000);
        if (!seen.has(key)) { seen.set(key, 1); list.push(i, j); }
      }
    }
  }

  function flashes(ts) {                                           // the soft flash of each bloom
    for (var b = 0; b < blasts.length; b++) {
      var bl = blasts[b], tau = ts - bl.t0;
      if (tau < 0 || tau > 1.1) continue;
      var t = bl.tint, f = soft(tau / 0.18) * Math.pow(1 - soft(tau / 1.1), 1.5), r = 70 + 190 * soft(tau / 1.1) * bl.S;
      var g = ctx.createRadialGradient(bl.x, bl.y, 0, bl.x, bl.y, r);
      g.addColorStop(0, 'rgba(255,250,225,' + (0.26 * f * bl.S).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',' + (0.1 * f * bl.S).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',0)');
      ctx.fillStyle = g; ctx.fillRect(bl.x - r, bl.y - r, r * 2, r * 2);
    }
  }

  function draw(t, ts) {
    fit();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);                         // from here on, positions are screen positions
    if (lit > 0.01) {                                                              // the soft light that follows the cursor
      var lg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 245);
      lg.addColorStop(0, 'rgba(228,199,119,' + (0.11 * lit).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(228,199,119,0)');
      ctx.fillStyle = lg; ctx.fillRect(cx - 245, cy - 245, 490, 490);
    }
    ctx.font = WEIGHT + ' ' + FONT + 'px ' + FAMILY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var fc = floorOf(cx, cy), fx = fc[0], fy = fc[1], b, n = 0;
    flashes(ts);
    ctx.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);
    seen.clear(); list.length = 0;
    gather(fx, fy, RHO);
    for (b = 0; b < blasts.length; b++) gather(blasts[b].fx, blasts[b].fy, RHO_B);
    var idx = []; for (var z = 0; z < list.length; z += 2) idx.push(z);
    idx.sort(function (u, v) { return (list[u] + list[u + 1]) - (list[v] + list[v + 1]); });      // back to front

    for (var m = 0; m < idx.length; m++) {
      var i = list[idx[m]], j = list[idx[m] + 1];
      var ch = PHRASE[mod(i + rowShift(j), PHRASE.length)];
      if (ch === ' ') continue;
      var di = i - fx, dj = j - fy, g = Math.sqrt(di * di + dj * dj);
      var env = g < RHO ? 1 - g / RHO : 0; env = env * env * (3 - 2 * env);
      var ring = Math.sin(g * K - t * SPEED), drift = Math.sin(di * 0.9 + dj * 0.6 + t * 1.3);
      var hn = pres * env * (0.06 + 0.94 * Math.pow(0.5 + 0.5 * (0.75 * ring + 0.25 * drift), 1.7));
      var a = pres * Math.pow(env, 0.8);
      var X = (i - j) * P * A, Y = (i + j) * P * B, lift = AMP * hn, sc = 0.86 + 0.34 * hn;
      var dx = 0, dy = 0, rot = 0, fl = 0;

      for (b = 0; b < blasts.length; b++) {                          // the blooms: where this letter is, long after the click
        var bl = blasts[b], tau = ts - bl.t0;
        if (tau < 0 || tau > TOTAL) continue;
        var gb = Math.sqrt((i - bl.fx) * (i - bl.fx) + (j - bl.fy) * (j - bl.fy));
        if (gb >= RHO_B) continue;
        var envB = smooth(1 - gb / RHO_B);
        var h1 = unit(i, j, bl.seed, 1), h2 = unit(i, j, bl.seed, 2), h3 = unit(i, j, bl.seed, 3);
        var ang = Math.atan2(Y - bl.y, X - bl.x) + (h1 - 0.5) * 1.9, maxd = (28 + 120 * h2) * bl.S * (0.5 + 0.5 * envB);
        var tOut = 0.9 + 0.6 * h3, r0 = 1.7 + 1.3 * h1, tBack = 3.0 + 1.8 * h2;     // out unhurried, a little hang, then home slowly: each letter in its own time
        var back = soft((tau - r0) / tBack), frac = soft(tau / tOut) * (1 - back);   // 0 -> 1 -> 0, smooth all the way
        var dist = maxd * frac;
        var wob = (h3 - 0.5) * 0.7 * maxd * Math.sin(3.1416 * back);                  // the way home curves
        dx += Math.cos(ang) * dist - Math.sin(ang) * wob; dy += Math.sin(ang) * dist + Math.cos(ang) * wob - 22 * frac * (0.4 + h3);
        rot += (h2 - 0.5) * 3 * frac;
        var pulse = soft(tau / 0.3) * (1 - soft((tau - 0.3) / 1.0)) * envB;            // the flash lights the letters, then lets go
        fl = Math.max(fl, pulse, frac * 0.7 * envB);
        a = Math.max(a, (pulse * 0.5 + frac * 0.6) * envB);
        hn = Math.max(hn, 0.7 * pulse, 0.55 * frac * envB);
        sc += 0.3 * frac;
      }
      a = Math.min(1, a);
      var col = 'rgba(' + Math.round(214 + 41 * hn) + ',' + Math.round(178 + 62 * hn) + ',' + Math.round(92 + 98 * hn) + ',';
      var sh = 0.2 * a * soft((hn - 0.1) / 0.25) * (1 - soft(fl / 0.3));              // the shadow it leaves on the floor, fading in and out
      if (sh > 0.004) { setLetter(X, Y, 0.9, 0); ctx.fillStyle = col + sh.toFixed(3) + ')'; ctx.fillText(ch, 0, 0); }
      setLetter(X + dx, Y - lift + dy, sc, rot);
      ctx.fillStyle = col + (a * (0.22 + 0.78 * hn)).toFixed(3) + ')';
      var glow = soft((hn - 0.5) / 0.3);                                               // the glow on the brightest letters grows with their brightness
      if (glow > 0.03) { ctx.shadowColor = 'rgba(255,224,140,' + (0.85 * glow).toFixed(2) + ')'; ctx.shadowBlur = 6 * glow; ctx.fillText(ch, 0, 0); ctx.shadowBlur = 0; }
      else ctx.fillText(ch, 0, 0);
      n++;
    }
    ctx.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);
    return n;
  }

  function frame(now) {
    var ts = now / 1000, resting = (now - lastMove) / 1000 > 1 && !blasts.length;
    if (resting && now - last < 48) { requestAnimationFrame(frame); return; }          // at rest about 20 frames a second is plenty for a slow ripple
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var t0 = cost ? performance.now() : 0;
    var target = (now - lastMove) / 1000 > 1 ? REST : 1;
    pres += (target - pres) * (1 - Math.exp(-dt * (target > pres ? 4 : 1.4)));
    clock += dt * (0.45 + 0.55 * pres);                                                 // the ripple slows down as the wave settles
    var e = 1 - Math.exp(-dt * 7);
    cx += (px - cx) * e; cy += (py - cy) * e;
    lit += ((inside ? 1 : 0) - lit) * (1 - Math.exp(-dt * 2.5));
    blasts = blasts.filter(function (bl) { return ts - bl.t0 < TOTAL; });
    draw(clock, ts);
    if (cost) { cost.frames++; cost.ms += performance.now() - t0; }
    requestAnimationFrame(frame);
  }
  function start() { if (running || !ready) return; running = true; last = performance.now(); requestAnimationFrame(frame); }   // runs for good once the cursor has moved; the browser pauses it in a hidden tab
  if (cost) cost.peek = function () { return { pres: pres, running: running, idle: performance.now() - lastMove, blasts: blasts.length }; };

  // a click: a soft flash and a bloom that is a little different every time (strength, colour, direction of every letter, a second softer bloom now and then)
  function boom(x, y) {
    if (!ready) return;
    var now = performance.now() / 1000, f = floorOf(x, y), S = rand(0.8, 1.2), tint = TINTS[Math.floor(Math.random() * TINTS.length)];
    if (blasts.length >= MAX_BLASTS) blasts.shift();
    blasts.push({ x: x, y: y, fx: f[0], fy: f[1], t0: now, S: S, seed: 1 + Math.floor(Math.random() * 100000), tint: tint });
    if (Math.random() < 0.2) blasts.push({ x: x, y: y, fx: f[0], fy: f[1], t0: now + rand(0.18, 0.3), S: S * 0.55, seed: 1 + Math.floor(Math.random() * 100000), tint: TINTS[Math.floor(Math.random() * TINTS.length)] });
  }

  window.addEventListener('pointermove', function (e) {
    px = e.clientX; py = e.clientY; inside = true;
    if (!running) { cx = px; cy = py; }
    lastMove = performance.now(); start();
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !ready) return;
    px = e.clientX; py = e.clientY;
    if (!running) { cx = px; cy = py; }
    lastMove = performance.now(); start(); boom(e.clientX, e.clientY);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { lastMove = -1e9; inside = false; });     // the cursor left the window: the wave settles where it was
  window.addEventListener('resize', size);
  size();

  /* the letters are drawn in the real font, so wait for it */
  var need = (document.fonts && document.fonts.load) ? document.fonts.load(WEIGHT + ' ' + FONT + 'px ' + FAMILY, PHRASE) : Promise.resolve();
  Promise.all([need, fontsReady]).then(function () { ready = true; }).catch(function (e) { if (window.console) console.warn('[portfolio] wave', e); });
}
