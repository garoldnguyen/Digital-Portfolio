/* Cursor type cloud. A cloud of small deep-gold letters follows the pointer, built the way Cheng Lou's "Variable
   Typographic ASCII" demo is (chenglou.me/pretext): particles swarm the cursor and paint a soft brightness field, then every
   cell of the field becomes the letter whose ink density matches the brightness AND whose measured width fits the cell,
   chosen from one proportional face at several weights. (The demo measures widths with pretext; for a single glyph that is
   the number canvas measureText already returns, so there is no dependency here.)
   On top of the demo: the field is not left as a plain blob. It lights an isometric lattice of cubes (the look of a dark
   field of glowing-edged blocks), so the letters trace glowing edges and the odd corner glint with the faces left dark, and
   the cursor is the light that reveals it. Kept deliberately quiet: only the edges are lit, each letter changes weight in a few
   coarse steps and fades in and out smoothly instead of flickering, rows change a letter only every few seconds, and the
   ripple when the cursor moves is a slight, slow sway that settles as soon as it rests.
   Decorative only: aria-hidden canvas, no pointer events, mouse and pen only, nothing while the tab is hidden or the
   pointer is away. Off for prefers-reduced-motion and touch (app.js skips it). */

var CHARS = ' .,:;-+=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var WEIGHTS = [400, 500, 600];
var FONT_PX = 13, CELL_W = 7, CELL_H = 11;     // type size, and the grid the letters sit on
var OVER = 2;                                  // the brightness field is twice as fine as the grid, then averaged
var PARTICLES = 36;
var INK_MAX = 0.74;                            // the heaviest letters are never used: edges shine through colour and halo, not weight
var LEVELS = 7;                                // letter weight changes in this many coarse steps, so letters hold still
var CANDIDATES = 3;                            // letters that fit each brightness equally well; the row stream picks among them
var GAIN = 0.9;                                // overall strength of the cloud; lower it if it ever gets in the way of reading
var CUBE = 26;                                 // radius of one cube of the lattice, in px
var TINTS = [                                  // dim fringe, body of the cloud, the few bright cells (these get a halo)
  { fill: '#8C6A1F', glow: 0 },
  { fill: '#BC8A21', glow: 0 },
  { fill: '#E0AC3A', glow: 7 }
];

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

export function initCursorType() {
  var cv = document.createElement('canvas');
  cv.className = 'cx';
  cv.setAttribute('aria-hidden', 'true');
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  document.body.appendChild(cv);

  var family = (getComputedStyle(document.documentElement).getPropertyValue('--f-display') || '').trim() || 'Georgia, serif';
  var palette = [], lookup = [], sprites = [];
  var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, fc = 0, fr = 0;
  var field, shown, rowSpeed, stampP, stampC, stampO;
  var parts = [];
  var tx = 0, ty = 0, sx = 0, sy = 0, seen = false, active = false, energy = 0, wave = 0, idle = 0;
  var running = false, last = 0, raf = 0, ready = false, skip = false;

  /* ---------- the letters: measure each one, and how much ink it carries ---------- */
  var ink = document.createElement('canvas'), ictx = ink.getContext('2d', { willReadFrequently: true });
  ink.width = ink.height = FONT_PX * 2;

  function density(ch, font) {
    var n = ink.width;
    ictx.clearRect(0, 0, n, n);
    ictx.font = font; ictx.fillStyle = '#fff'; ictx.textBaseline = 'middle';
    ictx.fillText(ch, 1, n / 2);
    var d = ictx.getImageData(0, 0, n, n).data, s = 0;
    for (var i = 3; i < d.length; i += 4) s += d[i];
    return s / (255 * n * n);
  }

  function buildPalette() {
    var mc = document.createElement('canvas').getContext('2d');
    for (var w = 0; w < WEIGHTS.length; w++) {
      var font = WEIGHTS[w] + ' ' + FONT_PX + 'px ' + family;
      mc.font = font;
      for (var i = 0; i < CHARS.length; i++) {
        var ch = CHARS.charAt(i);
        if (ch === ' ') continue;
        var width = mc.measureText(ch).width;
        if (width > 0) palette.push({ ch: ch, font: font, width: width, ink: density(ch, font) });
      }
    }
    var top = 0;
    palette.forEach(function (p) { if (p.ink > top) top = p.ink; });
    palette.forEach(function (p) { p.ink /= top; });
    palette.sort(function (a, b) { return a.ink - b.ink; });
    palette.forEach(function (p, i) { p.id = i; });
  }

  // the letters that best fit one brightness: close in ink, close in width to the cell (same scoring as the demo)
  function bestFor(target) {
    var lo = 0, hi = palette.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (palette[mid].ink < target) lo = mid + 1; else hi = mid; }
    var from = Math.max(0, lo - 18), to = Math.min(palette.length, lo + 18), scored = [];
    for (var i = from; i < to; i++) {
      var p = palette[i];
      scored.push({ id: p.id, s: Math.abs(p.ink - target) * 2.5 + Math.abs(p.width - CELL_W) / CELL_W });
    }
    scored.sort(function (a, b) { return a.s - b.s; });
    return scored.slice(0, CANDIDATES).map(function (e) { return e.id; });
  }

  function buildLookup() {
    for (var i = 0; i < LEVELS; i++) lookup.push(bestFor((i + 0.5) / LEVELS * INK_MAX));
  }

  // one letter, one tint, drawn once into its own small canvas; frames then just copy it around
  function sprite(id, tint) {
    var key = id * 3 + tint, s = sprites[key];
    if (s) return s;
    var p = palette[id], t = TINTS[tint], pad = 3 + t.glow;
    var w = Math.ceil(p.width) + pad * 2, h = Math.ceil(FONT_PX * 1.5) + pad * 2;
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    var g = c.getContext('2d');
    g.scale(dpr, dpr);
    g.font = p.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = t.fill;
    if (t.glow) { g.shadowColor = 'rgba(255,196,70,.85)'; g.shadowBlur = t.glow * dpr; }
    g.fillText(p.ch, w / 2, h / 2);
    s = sprites[key] = { c: c, w: w, h: h };
    return s;
  }

  /* ---------- the field ---------- */
  function stamp(rpx, edge) {
    // a soft round blob of brightness, in field cells (the demo's falloff: bright core, long gentle skirt)
    var rx = rpx / (CELL_W / OVER), ry = rpx / (CELL_H / OVER);
    var ax = Math.ceil(rx), ay = Math.ceil(ry), sw = ax * 2 + 1, v = new Float32Array(sw * (ay * 2 + 1));
    for (var y = -ay; y <= ay; y++) for (var x = -ax; x <= ax; x++) {
      var d = Math.sqrt((x / rx) * (x / rx) + (y / ry) * (y / ry)), a = 0;
      if (d < 1) a = d <= 0.35 ? 0.45 + (0.15 - 0.45) * (d / 0.35) : 0.15 * (1 - (d - 0.35) / 0.65);
      v[(y + ay) * sw + x + ax] = a * edge;
    }
    return { ax: ax, ay: ay, sw: sw, v: v };
  }

  function splat(px, py, st) {
    var gx = Math.round(px / (CELL_W / OVER)), gy = Math.round(py / (CELL_H / OVER));
    for (var y = -st.ay; y <= st.ay; y++) {
      var yy = gy + y;
      if (yy < 0 || yy >= fr) continue;
      for (var x = -st.ax; x <= st.ax; x++) {
        var xx = gx + x;
        if (xx < 0 || xx >= fc) continue;
        var a = st.v[(y + st.ay) * st.sw + x + st.ax];
        if (a) { var k = yy * fc + xx; field[k] = Math.min(1, field[k] + a); }
      }
    }
  }

  function size() {
    var nd = Math.min(window.devicePixelRatio || 1, 2);
    if (nd !== dpr) { dpr = nd; sprites = []; }
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cols = Math.ceil(W / CELL_W); rows = Math.ceil(H / CELL_H);
    fc = cols * OVER; fr = rows * OVER;
    field = new Float32Array(fc * fr);
    shown = new Float32Array(cols * rows);
    rowSpeed = new Float32Array(rows);
    for (var r = 0; r < rows; r++) rowSpeed[r] = (Math.random() < 0.5 ? -1 : 1) * rand(0.06, 0.22);  // letter shifts per second
  }

  function seed(x, y) {
    parts = [];
    for (var i = 0; i < PARTICLES; i++) {
      var a = rand(0, 6.283), r = rand(4, 34);
      parts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: rand(-1, 1), vy: rand(-1, 1) });
    }
  }

  /* ---------- the lattice: a field of cubes seen from above, as in the reference ---------- */
  var HEX_A = CUBE * 0.86603;                    // apothem: centre of a hexagon to the middle of its edge
  var hq = 0, hr = 0, hx = 0, hy = 0;            // scratch: the cube nearest the last point asked about

  function nearestCube(x, y) {
    var qf = (0.57735 * x - 0.33333 * y) / CUBE, rf = 0.66667 * y / CUBE, sf = -qf - rf;
    var q = Math.round(qf), r = Math.round(rf), s = Math.round(sf);
    var dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
    hq = q; hr = r; hx = CUBE * (1.73205 * q + 0.86603 * r); hy = CUBE * 1.5 * r;
  }

  var SPOKES = [[0, 1], [-0.86603, -0.5], [0.86603, -0.5]];      // centre to the three corners that make the Y of a cube
  function brightnessAt(x, y, t) {
    nearestCube(x + t * 1.2, y + t * 0.5);                        // the whole lattice drifts very slowly
    var qx = x + t * 1.2 - hx, qy = y + t * 0.5 - hy;
    var h = (((hq * 73856093) ^ (hr * 19349663)) >>> 0) / 4294967296;            // a fixed random number for this cube
    // outline of the cube
    var dE = HEX_A - Math.max(Math.abs(qx), Math.abs(qx * 0.5 + qy * 0.86603), Math.abs(qx * 0.5 - qy * 0.86603));
    // the Y inside it
    var dS = 1e9;
    for (var i = 0; i < 3; i++) {
      var u = SPOKES[i], tt = clamp(qx * u[0] + qy * u[1], 0, CUBE), ex = qx - u[0] * tt, ey = qy - u[1] * tt, d = ex * ex + ey * ey;
      if (d < dS) dS = d;
    }
    dS = Math.sqrt(dS);
    var line = Math.exp(-(Math.min(dE, dS) * Math.min(dE, dS)) / 30);
    // each cube breathes on its own, slowly; now and then a corner glints
    var pulse = 0.5 + 0.5 * Math.sin(t * (0.18 + h * 0.2) + h * 40), glow = 0.55 + 0.45 * pulse;
    var dV = 1e9;
    for (var k = 0; k < 6; k++) {
      var a = 0.5236 + k * 1.0472, vx = qx - Math.cos(a) * CUBE, vy = qy - Math.sin(a) * CUBE, dd = vx * vx + vy * vy;
      if (dd < dV) dV = dd;
    }
    var tw = Math.max(0, Math.sin(t * (0.3 + h * 0.4) + h * 91)), spark = Math.exp(-dV / 24) * tw * tw * tw * tw;
    return line * glow * 1.2 + spark * 0.6;
  }

  /* ---------- one frame ---------- */
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (idle > 2.5) { skip = !skip; if (skip) return; }       // a resting cursor only needs half the frames
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016), k = dt * 60, t = now / 1000;
    last = now;
    idle += dt;

    // the cursor itself (never eased, or the cloud would lag behind it); and how fast it moves, which drives the ripple
    var ox = sx, oy = sy;
    sx = tx; sy = ty;
    var speed = Math.sqrt((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy)) / dt;
    var want = clamp(speed / 1300, 0, 1);
    wave += (want - wave) * (1 - Math.exp(-dt * (want > wave ? 3 : 1.6)));
    energy += ((active ? 1 : 0) - energy) * (1 - Math.exp(-dt * (active ? 3.2 : 5)));

    // two attractors, as in the demo: the cursor itself, and a lighter one circling it
    var a2 = t * 0.45, r2 = 30 + 7 * Math.sin(t * 0.3);
    var bx = sx + Math.cos(a2) * r2, by = sy + Math.sin(a2) * r2 * 0.8;
    var mvx = sx - ox, mvy = sy - oy;                         // the cloud travels with the cursor, so it never trails behind it
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.x += mvx * 0.92; p.y += mvy * 0.92;
      var d1x = sx - p.x, d1y = sy - p.y, d2x = bx - p.x, d2y = by - p.y;
      var q1 = d1x * d1x + d1y * d1y, q2 = d2x * d2x + d2y * d2y;
      var near = q1 < q2, ax = near ? d1x : d2x, ay = near ? d1y : d2y;
      var dist = Math.sqrt(near ? q1 : q2) + 1;
      var pull = (near ? 0.34 : 0.06) + Math.max(0, dist - 48) * 0.05;
      p.vx += (ax / dist * pull - d1y / (Math.sqrt(q1) + 1) * 0.05) * k + rand(-0.1, 0.1) * k;
      p.vy += (ay / dist * pull + d1x / (Math.sqrt(q1) + 1) * 0.05) * k + rand(-0.1, 0.1) * k;
      var damp = Math.pow(0.97, k);
      p.vx *= damp; p.vy *= damp;
      p.x += p.vx * k; p.y += p.vy * k;
    }

    var keep = Math.pow(0.5, k);                              // the field fades in a couple of frames: no smear
    for (var j = 0; j < field.length; j++) field[j] *= keep;
    for (var n = 0; n < parts.length; n++) splat(parts[n].x, parts[n].y, stampP);
    splat(sx, sy, stampC);
    splat(bx, by, stampO);

    // the field, turned into letters
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var amp = 1.3 * wave, drawn = 0, tgt = 0, rise = 1 - Math.exp(-dt * 7), fall = 1 - Math.exp(-dt * 18);
    for (var r = 0; r < rows; r++) {
      var shift = Math.floor(rowSpeed[r] * t), row = r * OVER * fc, cy0 = (r + 0.5) * CELL_H;
      for (var c = 0; c < cols; c++) {
        var i0 = row + c * OVER, si = r * cols + c;
        var cloud = Math.min(1, (field[i0] + field[i0 + 1] + field[i0 + fc] + field[i0 + fc + 1]) * 0.25 * 2.1) * energy;
        var cx0 = (c + 0.5) * CELL_W;
        tgt = cloud < 0.03 ? 0 : cloud * brightnessAt(cx0, cy0, t) * GAIN;
        // each cell eases toward its brightness: in a little slower than out, so nothing flickers and nothing lingers
        shown[si] += (tgt - shown[si]) * (tgt > shown[si] ? rise : fall);
        var b = shown[si];
        if (b < 0.07) continue;
        var cands = lookup[Math.min(LEVELS - 1, (Math.min(b, 1) * LEVELS) | 0)];
        if (!cands) continue;
        // the row changes a letter only now and then: each cell shows the letter that was one slot over a while ago
        var h = (((c - shift) * 73856093) ^ (r * 19349663)) >>> 0;
        var sp = sprite(cands[h % cands.length], b < 0.35 ? 0 : b < 0.7 ? 1 : 2);
        var cx = cx0, cy = cy0;
        if (amp > 0.02) {
          var dx = cx - sx, dy = cy - sy, ph = Math.sqrt(dx * dx + dy * dy) * 0.035 - t * 2.2;
          cx += amp * 0.5 * Math.cos(ph * 0.9 + cy * 0.02);
          cy += amp * Math.sin(ph + cx * 0.015);
        }
        ctx.globalAlpha = Math.min(1, 0.25 + 0.75 * b);
        ctx.drawImage(sp.c, cx - sp.w / 2, cy - sp.h / 2, sp.w, sp.h);
        drawn++;
      }
    }
    ctx.globalAlpha = 1;

    if (!active && energy < 0.01 && !drawn) stop();
  }

  function start() {
    if (running || !ready || document.hidden) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; cancelAnimationFrame(raf); }
  function stop() {
    pause();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  }

  /* ---------- wiring ---------- */
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    tx = e.clientX; ty = e.clientY; idle = 0;
    if (!seen) { sx = tx; sy = ty; seed(tx, ty); seen = true; }
    active = true;
    start();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { active = false; });
  window.addEventListener('blur', function () { active = false; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else if (active) start(); });
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (ready) size(); }, 150); });

  // the face has to be loaded before its letters can be measured
  var loads = WEIGHTS.map(function (w) { return document.fonts ? document.fonts.load(w + ' ' + FONT_PX + 'px ' + family, 'Aa') : Promise.resolve(); });
  Promise.all(loads).catch(function () {}).then(function () {
    buildPalette();
    buildLookup();
    stampP = stamp(14, 1); stampC = stamp(32, 0.7); stampO = stamp(17, 0.8);
    size();
    ready = true;
    if (active) start();
  });
}
