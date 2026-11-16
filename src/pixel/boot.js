/* The start-up screen and the shut-down. On the first visit of a session, on a computer, with no #window in the link and
   without reduced motion, a short BIOS-style boot plays (about two seconds, any key or click skips it). assets/js/theme-init.js
   sets the class "booting" on <html> before the page paints, so there is no flash of the desktop first. START > Shut down
   collapses the screen like an old monitor and shows a black screen with a Power on button that plays the boot again. */

const LINES = [
  'NQ-BIOS v1.0   (c) 2026 Quan Nguyen',
  'CPU: pixel-core x2 ............. OK',
  'Memory test: 640K .............. OK',
  'Mounting /profile .............. OK',
  'Mounting /career ............... OK',
  'Loading credentials ............ OK',
  'Applying zero-trust policy ..... OK',
  'Starting window manager ........ OK',
  '',
  'Welcome, visitor.'
];

export function initBoot(ctl) {
  const root = document.documentElement;
  const el = document.getElementById('boot');
  const desktop = document.querySelector('.desktop');
  if (!el || !desktop) { root.classList.remove('booting'); return { shutdown() {} }; }
  const log = el.querySelector('.boot-log');
  const fill = el.querySelector('.boot-bar i');
  const on = el.querySelector('.boot-on');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0, running = false;

  function lock(yes) { if (yes) desktop.setAttribute('inert', ''); else desktop.removeAttribute('inert'); }

  function finish() {
    clearTimeout(timer);
    running = false;
    document.removeEventListener('keydown', skip, true);
    el.removeEventListener('pointerdown', skip);
    el.classList.add('boot-out');
    setTimeout(() => { root.classList.remove('booting', 'off'); el.classList.remove('boot-out'); lock(false); }, reduce.matches ? 0 : 260);
    ctl.sfx.play('boot');
    try { sessionStorage.setItem('qn-booted', '1'); } catch (e) { /* storage blocked: it just boots again next time */ }
  }
  function skip() { if (running) finish(); }

  function run() {
    running = true;
    lock(true);
    log.textContent = '';
    fill.style.width = '0%';
    root.classList.remove('off');
    root.classList.add('booting');
    document.addEventListener('keydown', skip, true);
    el.addEventListener('pointerdown', skip);
    let i = 0;
    const step = () => {
      if (!running) return;
      log.textContent += (i ? '\n' : '') + LINES[i];
      fill.style.width = Math.round((i + 1) / LINES.length * 100) + '%';
      i++;
      if (i < LINES.length) timer = setTimeout(step, 190); else timer = setTimeout(finish, 420);
    };
    step();
  }

  function shutdown() {
    ctl.sfx.play('off');
    const go = () => { lock(true); root.classList.remove('shutting'); root.classList.add('off'); log.textContent = ''; fill.style.width = '0%'; if (on) on.focus(); };
    if (reduce.matches) { go(); return; }
    root.classList.add('shutting');
    setTimeout(go, 650);
  }
  if (on) on.addEventListener('click', run);

  if (root.classList.contains('booting')) run();
  return { shutdown };
}
