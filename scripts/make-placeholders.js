/* Draws a stand-in PNG for every sprite in scripts/pixel-list.js into assets/pixel/_placeholder/.
   The site shows these until the real artwork is dropped into assets/pixel/<group>/<name>.png.
   Run with: node scripts/make-placeholders.js   (needs nothing from npm; the PNGs are committed, so you rarely need it). */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const list = require('./pixel-list.js');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'assets', 'pixel', '_placeholder');

// ---- tiny PNG writer ----
function crc32(buf) {
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    let c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

// ---- sprite maths: rect ops [colour, x, y, w, h]; a null colour erases ----
function render(w, h, ops, outline) {
  let g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(null));
  ops.forEach(o => {
    for (let j = o[2]; j < o[2] + o[4]; j++) for (let i = o[1]; i < o[1] + o[3]; i++) if (j >= 0 && j < h && i >= 0 && i < w) g[j][i] = o[0];
  });
  if (outline) {
    const c = g.map(r => r.slice());
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (g[j][i] === null && ((j > 0 && g[j - 1][i]) || (j < h - 1 && g[j + 1][i]) || (i > 0 && g[j][i - 1]) || (i < w - 1 && g[j][i + 1]))) c[j][i] = outline;
    }
    g = c;
  }
  const buf = Buffer.alloc(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const col = g[j][i], p = (j * w + i) * 4;
    if (col) { const rgb = hex(col); buf[p] = rgb[0]; buf[p + 1] = rgb[1]; buf[p + 2] = rgb[2]; buf[p + 3] = 255; }
  }
  return buf;
}

const K = '#3b2a3a';
const P = { cream: '#fbf1e1', white: '#ffffff', paper: '#f3e4cf', paperD: '#d9c5a8', coral: '#e76f51', coralL: '#f4977f', coralD: '#c8442b', butter: '#f4a261', butterL: '#ffd08a', gold: '#f2c14e', goldL: '#ffe08a', goldD: '#c8962a', teal: '#2a9d8f', tealL: '#8fd3c8', tealD: '#1f6f68', rose: '#f2b5a7', plum: '#4a3a52', plumL: '#6a5575', plumD: '#2a1d2c', wood: '#a0673a', woodL: '#c98a58', woodD: '#7a4a28' };

const cat = (...arrs) => [].concat(...arrs);
// rounded outlined box: 1px outline, fill, optional light top edge and dark bottom edge, corner pixels cut
const rb = (c, x, y, w, h, hl, sh) => {
  const o = [[K, x, y, w, h], [c, x + 1, y + 1, w - 2, h - 2]];
  if (hl) o.push([hl, x + 1, y + 1, w - 2, 1]);
  if (sh) o.push([sh, x + 1, y + h - 2, w - 2, 1]);
  o.push([null, x, y, 1, 1], [null, x + w - 1, y, 1, 1], [null, x, y + h - 1, 1, 1], [null, x + w - 1, y + h - 1, 1, 1]);
  return o;
};
const disc = (c, cx, cy, r) => {
  const o = [];
  for (let y = -r; y <= r; y++) { const dx = Math.round(Math.sqrt(r * r + r * 0.6 - y * y)); o.push([c, cx - dx, cy + y, 2 * dx + 1, 1]); }
  return o;
};
const poly = (c, pts) => {
  const ops = [];
  let ymin = Infinity, ymax = -Infinity;
  pts.forEach(p => { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); });
  for (let y = Math.floor(ymin); y <= Math.ceil(ymax); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) { const x0 = Math.round(xs[k]), x1 = Math.round(xs[k + 1]); if (x1 > x0) ops.push([c, x0, y, x1 - x0, 1]); }
  }
  return ops;
};
const ell = (c, cx, cy, rx, ry) => {
  const ops = [];
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry;
    if (Math.abs(dy) > 1) continue;
    const dx = rx * Math.sqrt(1 - dy * dy), x0 = Math.round(cx - dx), x1 = Math.round(cx + dx);
    if (x1 > x0) ops.push([c, x0, y, x1 - x0, 1]);
  }
  return ops;
};
const line = (c, x0, y0, x1, y1) => {
  const ops = [], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ops.push([c, x0, y0, 1, 1]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return ops;
};

const flap = [];
for (let i = 0; i <= 11; i++) { const yy = 10 + Math.round(i * 0.65); flap.push(['#b9a58a', 5 + i, yy, 1, 1], ['#b9a58a', 26 - i, yy, 1, 1]); }

const art = {
  'icons/profile': cat([[P.coral, 15, 0, 2, 3]], rb(P.cream, 6, 4, 20, 26, P.white, P.paperD), [[P.teal, 7, 5, 18, 5], [P.tealL, 7, 5, 18, 1], [P.tealD, 7, 9, 18, 1]], [[K, 13, 2, 6, 3], [P.paperD, 14, 3, 4, 1]], disc(P.plumL, 16, 16, 4), rb(P.plumL, 10, 21, 12, 6, P.plum, P.plumD), [[P.paperD, 9, 28, 14, 1]]),
  'icons/credentials': cat(rb(P.coral, 8, 1, 7, 14, P.coralL, P.coralD), rb(P.teal, 17, 1, 7, 14, P.tealL, P.tealD), disc(K, 16, 20, 10), disc(P.gold, 16, 20, 9), disc(P.goldD, 16, 20, 7), disc(P.goldL, 16, 20, 6), [[P.white, 15, 16, 2, 8], [P.white, 12, 19, 8, 2], [P.goldD, 15, 19, 2, 2]]),
  'icons/career': cat([[K, 11, 5, 10, 6], [null, 13, 7, 6, 4]], rb(P.wood, 3, 10, 26, 19, P.woodL, P.woodD), [[P.woodD, 4, 17, 24, 1], [P.goldL, 5, 12, 2, 2], [P.goldL, 25, 12, 2, 2]], rb(P.gold, 14, 15, 4, 6, P.goldL, P.goldD)),
  'icons/works': cat(rb(P.plumL, 5, 4, 22, 16), [[P.plumD, 7, 6, 18, 12], [P.tealL, 9, 8, 6, 1], [P.butterL, 16, 8, 5, 1], [P.coral, 9, 11, 9, 1], [P.tealL, 9, 14, 6, 1], [P.cream, 16, 14, 1, 2]], rb(P.paperD, 2, 19, 28, 7, P.white, '#bfab8e'), [['#bfab8e', 13, 19, 6, 2]]),
  'icons/research': cat(rb(P.teal, 6, 3, 20, 26, P.tealL, P.tealD), [[P.tealD, 7, 4, 4, 24], [P.tealL, 11, 5, 1, 22], [P.paper, 24, 6, 1, 20]], rb(P.cream, 13, 8, 10, 8), [[P.tealD, 15, 10, 6, 1], [P.tealD, 15, 13, 4, 1], [P.cream, 13, 20, 10, 1], [P.cream, 13, 23, 7, 1]], [[P.coral, 20, 25, 3, 6], [null, 21, 30, 1, 1]]),
  'icons/honours': cat(rb(P.gold, 2, 6, 9, 10), [[null, 4, 8, 5, 6]], rb(P.gold, 21, 6, 9, 10), [[null, 23, 8, 5, 6]], rb(P.gold, 8, 3, 16, 14, P.goldL, P.goldD), rb(P.gold, 11, 15, 10, 6, P.gold, P.goldD), rb(P.gold, 14, 20, 4, 5, P.gold, P.goldD), rb(P.wood, 8, 24, 16, 6, P.woodL, P.woodD), [[P.cream, 11, 6, 2, 7], [P.goldD, 15, 7, 2, 6], [P.goldD, 13, 9, 6, 2]]),
  'icons/expertise': cat(rb(P.paperD, 6, 2, 6, 5), [[null, 8, 2, 2, 2]], rb(P.paperD, 7, 6, 4, 11), rb(P.coral, 20, 3, 6, 8, P.coralL, P.coralD), [[P.plumL, 22, 11, 2, 6], [K, 22, 16, 2, 1]], rb(P.teal, 3, 14, 26, 15, P.tealL, P.tealD), [[P.tealD, 4, 20, 24, 1]], rb(P.gold, 13, 18, 6, 5, P.goldL, P.goldD), [[P.butterL, 5, 16, 2, 2], [P.butterL, 25, 16, 2, 2]]),
  'icons/contact': cat(rb(P.cream, 3, 8, 26, 17, P.white, P.paperD), flap, [[P.coral, 14, 16, 2, 1], [P.coral, 17, 16, 2, 1], [P.coral, 14, 17, 5, 1], [P.coral, 15, 18, 3, 1], [P.coral, 16, 19, 1, 1]]),
  'icons/terminal': cat(rb('#2a1d2c', 3, 4, 26, 21, '#4a3a52', '#1b121d'), [[P.coral, 4, 5, 24, 3], [P.cream, 6, 6, 2, 1], [P.cream, 10, 6, 2, 1], [P.cream, 14, 6, 2, 1]], [[P.tealL, 7, 11, 2, 1], [P.tealL, 9, 12, 2, 1], [P.tealL, 11, 13, 2, 1], [P.tealL, 9, 14, 2, 1], [P.tealL, 7, 15, 2, 1]], [[P.tealL, 14, 16, 6, 2], [P.coral, 22, 11, 3, 7]], rb(P.paperD, 11, 25, 10, 4, P.white, '#bfab8e')),
  'works/music': cat([[K, 12, 7, 2, 16], [K, 24, 5, 2, 16], [K, 12, 5, 14, 4], [P.coral, 13, 6, 12, 2]], disc(K, 9, 24, 4), disc(P.coral, 9, 24, 3), disc(K, 21, 22, 4), disc(P.coral, 21, 22, 3), [[P.white, 8, 23, 1, 1], [P.white, 20, 21, 1, 1]]),
  'works/timer': cat(rb(P.plumL, 13, 2, 6, 4), [[K, 15, 5, 2, 3]], disc(K, 16, 19, 12), disc(P.tealL, 16, 19, 11), disc(P.cream, 16, 19, 9), [[K, 16, 11, 1, 2], [K, 16, 26, 1, 2], [K, 8, 19, 2, 1], [K, 23, 19, 2, 1]], [[P.coralD, 16, 12, 2, 8], [K, 16, 18, 6, 2], [K, 15, 18, 3, 3]]),
  'works/gomoku': cat(rb(P.woodL, 3, 3, 26, 26, '#e3b07a', P.woodD), [[P.woodD, 7, 10, 18, 1], [P.woodD, 7, 16, 18, 1], [P.woodD, 7, 22, 18, 1], [P.woodD, 10, 7, 1, 18], [P.woodD, 16, 7, 1, 18], [P.woodD, 22, 7, 1, 18]], disc(P.plumD, 10, 10, 2), disc(K, 16, 16, 3), disc(P.white, 16, 16, 2), disc(P.plumD, 22, 10, 2), disc(K, 22, 22, 3), disc(P.white, 22, 22, 2), disc(P.plumD, 10, 22, 2)),
  'ui/heart': [[P.coral, 2, 1, 4, 1], [P.coral, 10, 1, 4, 1], [P.coral, 1, 2, 6, 1], [P.coral, 9, 2, 6, 1], [P.coral, 1, 3, 14, 3], [P.coral, 2, 6, 12, 1], [P.coral, 3, 7, 10, 1], [P.coral, 4, 8, 8, 1], [P.coral, 5, 9, 6, 1], [P.coral, 6, 10, 4, 1], [P.coral, 7, 11, 2, 1], [P.cream, 3, 2, 2, 1], [P.cream, 2, 3, 1, 1]],
  'ui/sun': cat(disc(P.gold, 8, 8, 4), [[P.gold, 7, 0, 2, 2], [P.gold, 7, 14, 2, 2], [P.gold, 0, 7, 2, 2], [P.gold, 14, 7, 2, 2], [P.gold, 2, 2, 2, 2], [P.gold, 12, 2, 2, 2], [P.gold, 2, 12, 2, 2], [P.gold, 12, 12, 2, 2]]),
  'ui/moon': cat(disc(P.plumL, 8, 8, 6), disc(null, 12, 6, 5))
};

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
list.forEach(s => {
  if (!art[s.name]) { console.log('no artwork drawn for', s.name); return; }
  fs.writeFileSync(path.join(outDir, s.name.replace('/', '-') + '.png'), png(s.w, s.h, render(s.w, s.h, art[s.name])));
  n++;
});
console.log('make-placeholders: wrote ' + n + ' PNGs to assets/pixel/_placeholder/');
