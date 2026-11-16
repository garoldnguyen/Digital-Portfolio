/* Renders scripts/og-card.html to assets/images/og-card.jpg (1200x630), the picture shown when the site is shared.
   Needs Google Chrome (set CHROME=/path/to/chrome if it is not in the usual place) and, for the JPEG step, macOS `sips`.
   Run with: npm run og */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const chrome = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(p => fs.existsSync(p));
if (!chrome) { console.error('make-og: Chrome not found, set CHROME=/path/to/chrome'); process.exit(1); }

const png = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'og-')), 'og.png');
const page = 'file://' + path.join(__dirname, 'og-card.html');
let r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=4000', '--screenshot=' + png, page], { stdio: 'inherit' });
if (r.status !== 0 || !fs.existsSync(png)) { console.error('make-og: Chrome did not produce a screenshot'); process.exit(1); }

const out = path.join(root, 'assets', 'images', 'og-card.jpg');
r = spawnSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', png, '--out', out], { stdio: 'ignore' });
if (r.status !== 0) { fs.copyFileSync(png, out.replace(/\.jpg$/, '.png')); console.log('make-og: sips not available, wrote a PNG instead; convert it to JPEG yourself'); process.exit(0); }
console.log('make-og: wrote assets/images/og-card.jpg (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
