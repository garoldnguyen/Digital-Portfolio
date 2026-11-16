/* Points every <img data-sprite="group/name" src="..."> in the pages at the real artwork when it exists.

   The rule: if assets/pixel/<group>/<name>.png exists, the page uses it (with ?v=<hash of the file>, so a replaced file
   never serves a stale cache); otherwise it uses the stand-in in assets/pixel/_placeholder/. So to add artwork you only
   drop the PNG into the right folder and run `npm run assets` (or `npm run build`, which does the same).
   It also checks each real file's pixel size against scripts/pixel-list.js and prints a report. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const list = require('./pixel-list.js');

const root = path.join(__dirname, '..');

function pngSize(buf) {
  if (buf.length < 24 || buf.toString('latin1', 1, 4) !== 'PNG') return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

function run() {
  const found = {};
  const lines = [];
  for (const s of list) {
    const file = path.join(root, 'assets', 'pixel', s.name + '.png');
    if (!fs.existsSync(file)) { lines.push('  placeholder  ' + s.name); continue; }
    const buf = fs.readFileSync(file);
    const size = pngSize(buf);
    found[s.name] = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
    if (!size) lines.push('  REAL (not a valid PNG!)  ' + s.name);
    else if (size[0] !== s.w || size[1] !== s.h) lines.push('  REAL, size ' + size[0] + 'x' + size[1] + ' but expected ' + s.w + 'x' + s.h + '  ' + s.name);
    else lines.push('  REAL         ' + s.name + ' (' + size[0] + 'x' + size[1] + ')');
  }

  const srcFor = name => found[name]
    ? 'assets/pixel/' + name + '.png?v=' + found[name]
    : 'assets/pixel/_placeholder/' + name.replace('/', '-') + '.png';

  let changed = 0;
  for (const page of ['index.html', '404.html']) {
    const file = path.join(root, page);
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const html = raw.replace(/(data-sprite="([^"]+)"\s+src=")[^"]*(")/g, (m, pre, name, post) => pre + srcFor(name) + post);
    if (html !== raw) { fs.writeFileSync(file, html); changed++; }
  }
  const real = Object.keys(found).length;
  console.log('pixel assets: ' + real + ' real, ' + (list.length - real) + ' placeholder' + (changed ? ' (' + changed + ' page(s) updated)' : ' (pages already up to date)'));
  if (require.main === module) console.log(lines.join('\n'));
  return found;
}

if (require.main === module) run();
module.exports = { run };
