/* i18n: builds the Vietnamese page (vi/index.html) from the English page (index.html) and a translation file (i18n/vi.json).

   index.html stays the single source of truth. A "unit" is any element that has text of its own (a paragraph, a chip, a
   button, a list item...); its inner HTML, with white space collapsed, is the key that i18n/vi.json looks up:

     "text":  English inner HTML  ->  Vietnamese inner HTML (inline tags such as <kbd> or <a> are kept in both)
     "attrs": English value of aria-label, alt, title, data-title, data-toast and of the meta description / og / twitter
              tags  ->  Vietnamese value
     "keep":  strings that stay as they are (names, product names, file names, commands, paper titles)
     "js":    strings that the scripts write at run time, served to the page as a JSON block (see src/pixel/i18n.js)

   If the English text changes and no translation matches any more, the build does NOT fail: that one string stays English on
   the Vietnamese page and the build prints a warning listing it, so a typo fix on the English page can never block a deploy.
   `node scripts/i18n.js --missing` prints the missing keys as JSON, ready to paste into i18n/vi.json (and the stale ones).

   Everything between <script>, <style> and <pre> is left alone. */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SOURCE = path.join(root, 'index.html');
const TABLE = path.join(root, 'i18n', 'vi.json');
const TARGET = path.join(root, 'vi', 'index.html');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'pre', 'textarea']);
const ATTRS = new Set(['aria-label', 'alt', 'title', 'data-title', 'data-toast']);
const META_NAMES = new Set(['description', 'twitter:title', 'twitter:description', 'og:title', 'og:description', 'og:image:alt']);

const norm = s => s.replace(/\s+/g, ' ').trim();
const lineOf = (html, i) => html.slice(0, i).split('\n').length;
// text with nothing worth translating: numbers, symbols, a single letter (a key such as T or ?)
const trivial = s => !/[A-Za-zÀ-ỹ]{2,}/.test(s.replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, ' '));

/* Walks the page once and returns every translatable unit and attribute with its position in the source. */
function scan(html) {
  const units = [], attrs = [], stack = [];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) {                                                       // </tag>
      const name = m[1].toLowerCase(), e = stack.pop();
      if (!e || e.tag !== name) throw new Error('i18n: </' + name + '> on line ' + lineOf(html, m.index) + ' does not close <' + (e && e.tag) + '>');
      if (e.hasText) {
        const start = e.innerStart, end = m.index;
        while (units.length && units[units.length - 1].start >= start) units.pop();   // an element inside this one is part of this unit
        units.push({ start, end, raw: html.slice(start, end), line: lineOf(html, start) });
      }
    } else if (m[2]) {                                                // <tag ...>
      const name = m[2].toLowerCase(), attrStart = m.index + 1 + m[2].length;
      const found = {}, list = [];
      const ar = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let a;
      while ((a = ar.exec(m[3]))) {
        const value = a[2] !== undefined ? a[2] : a[3];
        const end = attrStart + a.index + a[0].length - 1;
        found[a[1].toLowerCase()] = value;
        list.push({ name: a[1].toLowerCase(), value, start: end - value.length, end });
      }
      list.forEach(x => {
        const wanted = ATTRS.has(x.name) || (name === 'meta' && x.name === 'content' && META_NAMES.has(found.name || found.property));
        if (wanted && !trivial(x.value)) attrs.push({ start: x.start, end: x.end, raw: x.value, line: lineOf(html, x.start) });
      });
      if (RAW.has(name)) {                                            // skip the whole element, its content is code
        const close = html.toLowerCase().indexOf('</' + name, re.lastIndex);
        if (close < 0) throw new Error('i18n: <' + name + '> on line ' + lineOf(html, m.index) + ' is never closed');
        re.lastIndex = html.indexOf('>', close) + 1;
        continue;
      }
      if (!VOID.has(name) && !/\/\s*$/.test(m[3])) stack.push({ tag: name, innerStart: m.index + m[0].length, hasText: false });
    } else if (/\S/.test(m[0]) && stack.length) {                     // text
      stack[stack.length - 1].hasText = true;
    }
  }
  if (stack.length) throw new Error('i18n: <' + stack[stack.length - 1].tag + '> is never closed');
  return { units: units.filter(u => !trivial(u.raw)), attrs };
}

function loadTable() {
  const t = JSON.parse(fs.readFileSync(TABLE, 'utf8'));
  return { text: t.text || {}, attrs: t.attrs || {}, keep: new Set(t.keep || []), js: t.js || {}, raw: t };
}

/* Replaces the units and attributes of `html` with their translations; returns the new page and what was not found. */
function translate(html, table) {
  const { units, attrs } = scan(html);
  const missing = [], edits = [];
  const used = new Set();
  units.forEach(u => {
    const key = norm(u.raw);
    if (table.keep.has(key)) { used.add(key); return; }
    const vi = table.text[key];
    if (vi === undefined) { missing.push({ kind: 'text', key, line: u.line }); return; }
    used.add(key);
    const lead = u.raw.match(/^\s*/)[0], trail = u.raw.match(/\s*$/)[0];
    edits.push({ start: u.start, end: u.end, value: lead + vi + trail });
  });
  attrs.forEach(x => {
    const key = norm(x.raw);
    if (table.keep.has(key)) { used.add(key); return; }
    const vi = table.attrs[key];
    if (vi === undefined) { missing.push({ kind: 'attr', key, line: x.line }); return; }
    used.add(key);
    edits.push({ start: x.start, end: x.end, value: vi.replace(/"/g, '&quot;') });
  });
  const stale = [];
  Object.keys(table.text).forEach(k => { if (!used.has(k)) stale.push({ kind: 'text', key: k }); });
  Object.keys(table.attrs).forEach(k => { if (!used.has(k)) stale.push({ kind: 'attr', key: k }); });
  table.keep.forEach(k => { if (!used.has(k)) stale.push({ kind: 'keep', key: k }); });
  edits.sort((a, b) => b.start - a.start).forEach(e => { html = html.slice(0, e.start) + e.value + html.slice(e.end); });
  return { html, missing, stale };
}

/* Changes that are not translations: language, canonical address, the way back to English, relative links made absolute. Each
   replaced string must exist in index.html, so editing one of those lines without updating this list fails loudly. */
function localise(html, table) {
  const swaps = [
    ['<html lang="en"', '<html lang="vi"'],
    ['<link rel="canonical" href="https://quannguyen47.web.app/">', '<link rel="canonical" href="https://quannguyen47.web.app/vi/">'],
    ['<meta property="og:url" content="https://quannguyen47.web.app/">', '<meta property="og:url" content="https://quannguyen47.web.app/vi/">'],
    ['<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="vi_VN">'],
    ['<meta property="og:locale:alternate" content="vi_VN">', '<meta property="og:locale:alternate" content="en_US">'],
    ['<a class="tb tb-lang" href="/vi/" hreflang="vi" lang="vi" data-lang="vi" aria-label="VI, Tiếng Việt">VI</a>',
     '<a class="tb tb-lang" href="/" hreflang="en" lang="en" data-lang="en" aria-label="EN, English">EN</a>'],
    ['<a role="menuitem" href="/vi/" hreflang="vi" lang="vi" data-lang="vi">Tiếng Việt</a>',
     '<a role="menuitem" href="/" hreflang="en" lang="en" data-lang="en">English</a>']
  ];
  swaps.forEach(([from, to]) => {
    if (html.indexOf(from) < 0) throw new Error('i18n: index.html no longer contains the line the Vietnamese page rewrites:\n  ' + from);
    html = html.replace(from, to);
  });
  // the page now lives one folder down: links to assets/... must start at the site root
  html = html.replace(/\b(href|src)="assets\//g, '$1="/assets/');
  // strings the scripts write at run time (src/pixel/i18n.js reads this block)
  const block = '<script type="application/json" id="i18n">' + JSON.stringify(table.js).replace(/</g, '\\u003c') + '</script>\n';
  const marker = '<script src="/assets/js/pixel-desktop.js';
  if (html.indexOf(marker) < 0) throw new Error('i18n: cannot find the main script tag to put the run-time strings before');
  html = html.replace(marker, block + marker);
  return html;
}

function run() {
  const table = loadTable();
  const source = fs.readFileSync(SOURCE, 'utf8');
  const { html, missing, stale } = translate(source, table);
  const out = localise(html, table);
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  const before = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, 'utf8') : '';
  if (before !== out) fs.writeFileSync(TARGET, out);
  console.log('i18n: vi/index.html ' + (before !== out ? 'written' : 'already up to date') + ' (' + Object.keys(table.text).length + ' texts, ' + Object.keys(table.attrs).length + ' attributes)');
  if (missing.length) {
    console.log('i18n: WARNING ' + missing.length + ' string(s) have no Vietnamese translation yet and stay English on /vi/ (run "node scripts/i18n.js --missing"):');
    missing.slice(0, 8).forEach(x => console.log('  line ' + x.line + ' [' + x.kind + '] ' + x.key.slice(0, 90)));
    if (missing.length > 8) console.log('  ... and ' + (missing.length - 8) + ' more');
  }
  if (stale.length) console.log('i18n: note: ' + stale.length + ' entr' + (stale.length === 1 ? 'y' : 'ies') + ' in i18n/vi.json no longer match any English text (renamed or removed).');
  return { missing, stale };
}

if (require.main === module) {
  if (process.argv.includes('--missing')) {
    const table = loadTable();
    const { missing, stale } = translate(fs.readFileSync(SOURCE, 'utf8'), table);
    const out = { text: {}, attrs: {} };
    missing.forEach(x => { (x.kind === 'text' ? out.text : out.attrs)[x.key] = ''; });
    console.log(JSON.stringify(out, null, 2));
    if (stale.length) console.error('stale entries:\n' + stale.map(x => '  [' + x.kind + '] ' + x.key.slice(0, 100)).join('\n'));
    process.exit(0);
  }
  run();
}

module.exports = { run, scan, translate };
