/* Build: bundle src/ into assets/js/golden-age.js with esbuild, then stamp every page with a content fingerprint.

   The stamp is what makes long caching safe: the pages point at /assets/js/golden-age.js?v=<hash of the file>, so a changed
   file gets a new address automatically and nobody ever has to remember to bump a version number by hand.

   `npm run build` runs this. The Firebase deploy runs it too (predeploy in firebase.json), so a stale bundle can never be
   deployed. If esbuild is not installed (a fresh clone before `npm install`) it says so and carries on with the committed
   bundle instead of blocking the deploy. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const rel = f => path.join(root, f);

function bundle() {
  let esbuild;
  try { esbuild = require('esbuild'); } catch (e) {
    console.log('build: esbuild is not installed (run "npm install"), so the committed bundle is used as it is.');
    return;
  }
  const t0 = Date.now();
  esbuild.buildSync({
    entryPoints: [rel('src/app.js')], bundle: true, minify: true, format: 'iife', target: 'es2019',
    legalComments: 'none', outfile: rel('assets/js/golden-age.js')
  });
  console.log('build: assets/js/golden-age.js bundled in ' + (Date.now() - t0) + ' ms');
}

function stamp() {
  const files = ['assets/css/golden-age.css', 'assets/js/golden-age.js', 'assets/js/analytics.js'];
  const hashes = {};
  for (const f of files) hashes[f] = crypto.createHash('sha256').update(fs.readFileSync(rel(f)).toString('utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8);
  let changed = 0;
  for (const page of ['index.html', '404.html']) {
    const raw = fs.readFileSync(rel(page), 'utf8');
    let html = raw;
    for (const f of files) {
      const re = new RegExp('(' + f.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + ')\\?v=[0-9a-zA-Z]+', 'g');
      html = html.replace(re, '$1?v=' + hashes[f]);
    }
    if (html !== raw) { fs.writeFileSync(rel(page), html); changed++; }
  }
  console.log('build: stamped ' + files.map(f => path.basename(f) + '=' + hashes[f]).join(', ') + (changed ? ' (' + changed + ' page(s) updated)' : ' (pages already up to date)'));
}

bundle();
stamp();
