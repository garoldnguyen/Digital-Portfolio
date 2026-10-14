/* Cursor wave of words (prototype, laptop screens only). Round the cursor, small gold capitals lie on an isometric floor and
   spell out the skills from the page's ticker (SECURITY ARCHITECTURE, RISK AND GOVERNANCE...). A ripple flows outward from
   the cursor: on each crest the letters lift off the floor, grow a little and brighten, with a faint shadow left behind,
   then settle back into the dark. When the cursor rests the wave does not go away: it settles to a slow, faint
   ripple where the cursor last was, and stays as a quiet background effect (about 30 frames a second while resting).
   One fixed canvas, so it follows the cursor over every section of the page. Every letter is fixed to its place on the
   floor (nothing is random from frame to frame), which keeps the motion smooth.
   Decorative only: aria-hidden, no pointer events. Off for prefers-reduced-motion (app.js skips it), touch screens and
   windows narrower than 1024px. Add ?wave=cost to the address to count frame cost in window.__wave;
   add ?wave=upright to stand the letters up instead of laying them on the floor. */

var FAMILY = 'Cormorant', WEIGHT = 500, FONT = 14;     // letter size in floor px
var P = 18;                                            // distance between letters on the floor (px)
var RHO = 6;                                         // radius of the wave, in letters
var AMP = 24;                                          // how far a crest lifts a letter (px)
var K = 1.1, SPEED = 2.2;                              // ring spacing and how fast the rings flow outward
var REST = 0.55;                                       // strength of the wave while the cursor rests (1 = while it moves)
var A = 0.8944, B = 0.4472;                            // 2:1 isometric floor: a floor step (1,0) lands at (A,B) on screen, (0,1) at (-A,B)
var PHRASE = 'SECURITY ARCHITECTURE · RISK AND GOVERNANCE · CLOUD SECURITY · APPLIED AI · THREAT MODELING · MENTORING · RESEARCH · ';

function mod(n, m) { return ((n % m) + m) % m; }
function rowShift(j) { var h = (j * 2654435761) >>> 0; return (h >>> 7) % PHRASE.length; }   // each row starts at its own place in the phrase

export function initWave(fontsReady) {
  if (!matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches) return;
  var cv = document.createElement('canvas');
  cv.className = 'wave'; cv.setAttribute('aria-hidden', 'true');
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  document.body.appendChild(cv);
  var q = location.search;
  var cost = /[?&]wave=cost\b/.test(q) ? (window.__wave = { frames: 0, ms: 0 }) : null;
  var flat = !/[?&]wave=upright\b/.test(q);

  var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, px = 0, py = 0, pres = 0, clock = 0, lastMove = -1e9, running = false, ready = false, last = 0;
  var cells = [];                                                  // the letters of this frame, back to front

  function size() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = WEIGHT + ' ' + FONT + 'px ' + FAMILY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var fx = (cx / A + cy / B) / 2 / P, fy = (cy / B - cx / A) / 2 / P;            // the cursor's place on the floor, in letters
    var s0 = Math.floor(fx + fy - RHO * 1.4143), s1 = Math.ceil(fx + fy + RHO * 1.4143), n = 0;
    for (var s = s0; s <= s1; s++) {                                               // back to front along the floor diagonal
      for (var i = Math.floor(fx - RHO); i <= Math.ceil(fx + RHO); i++) {
        var j = s - i, di = i - fx, dj = j - fy, g = Math.sqrt(di * di + dj * dj);
        if (g >= RHO) continue;
        var env = 1 - g / RHO; env = env * env * (3 - 2 * env);
        var ch = PHRASE[mod(i + rowShift(j), PHRASE.length)];
        if (ch === ' ') continue;
        var ring = Math.sin(g * K - t * SPEED), drift = Math.sin(di * 0.9 + dj * 0.6 + t * 1.3);
        var hn = pres * env * (0.06 + 0.94 * Math.pow(0.5 + 0.5 * (0.75 * ring + 0.25 * drift), 1.7));
        var a = pres * Math.pow(env, 0.8);
        var X = (i - j) * P * A, Y = (i + j) * P * B, lift = AMP * hn, sc = 0.86 + 0.34 * hn;
        var col = 'rgba(' + Math.round(214 + 41 * hn) + ',' + Math.round(178 + 62 * hn) + ',' + Math.round(92 + 98 * hn) + ',';
        if (hn > 0.2) {                                                            // the shadow it leaves on the floor
          setLetter(X, Y, 0.9, flat); ctx.fillStyle = col + (0.2 * a * hn).toFixed(3) + ')'; ctx.fillText(ch, 0, 0);
        }
        setLetter(X, Y - lift, sc, flat);
        ctx.fillStyle = col + (a * (0.22 + 0.78 * hn)).toFixed(3) + ')';
        if (hn > 0.62) { ctx.shadowColor = 'rgba(255,224,140,.85)'; ctx.shadowBlur = 6; ctx.fillText(ch, 0, 0); ctx.shadowBlur = 0; }
        else ctx.fillText(ch, 0, 0);
        n++;
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return n;
  }
  // place one letter: lying on the floor (skewed along the floor's axes) or standing upright
  function setLetter(x, y, sc, lie) {
    if (lie) ctx.setTransform(dpr * A * sc, dpr * B * sc, -dpr * A * sc, dpr * B * sc, dpr * x, dpr * y);
    else ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * x, dpr * y);
  }

  function frame(now) {
    var resting = (now - lastMove) / 1000 > 1;
    if (resting && now - last < 33) { requestAnimationFrame(frame); return; }          // at rest about 30 frames a second is plenty
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var t0 = cost ? performance.now() : 0;
    var target = resting ? REST : 1;
    pres += (target - pres) * (1 - Math.exp(-dt * (target > pres ? 4 : 1.4)));
    clock += dt * (0.45 + 0.55 * pres);                                                 // the ripple slows down as the wave settles
    var e = 1 - Math.exp(-dt * 7);
    cx += (px - cx) * e; cy += (py - cy) * e;
    draw(clock);
    if (cost) { cost.frames++; cost.ms += performance.now() - t0; }
    requestAnimationFrame(frame);
  }
  function start() { if (running || !ready) return; running = true; last = performance.now(); requestAnimationFrame(frame); }   // runs for good once the cursor has moved; the browser pauses it in a hidden tab
  if (cost) cost.peek = function () { return { pres: pres, running: running, idle: performance.now() - lastMove }; };

  window.addEventListener('pointermove', function (e) {
    px = e.clientX; py = e.clientY;
    if (!running) { cx = px; cy = py; }
    lastMove = performance.now(); start();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { lastMove = -1e9; });     // the cursor left the window: the wave settles where it was
  window.addEventListener('resize', size);
  size();

  /* the letters are drawn in the real font, so wait for it */
  var need = (document.fonts && document.fonts.load) ? document.fonts.load(WEIGHT + ' ' + FONT + 'px ' + FAMILY, PHRASE) : Promise.resolve();
  Promise.all([need, fontsReady]).then(function () { ready = true; }).catch(function (e) { if (window.console) console.warn('[portfolio] wave', e); });
}
