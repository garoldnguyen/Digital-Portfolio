/* Light / dark theme. The first choice comes from assets/js/theme-init.js (saved choice, then the system setting, set
   before the page paints); this file wires the button and follows the system setting until the visitor chooses.
   It returns a small handle so the terminal, the START menu and the keyboard shortcuts can switch the theme too. */

export function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const saved = () => { try { return localStorage.getItem('qn-theme'); } catch (e) { return null; } };
  const get = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  const sync = () => {
    if (btn) btn.setAttribute('aria-pressed', String(get() === 'dark'));
    document.querySelectorAll('[data-theme-label]').forEach(el => { el.textContent = get() === 'dark' ? 'Light theme' : 'Dark theme'; });
  };
  function set(next) {
    root.setAttribute('data-theme', next === 'dark' ? 'dark' : 'light');
    try { localStorage.setItem('qn-theme', get()); } catch (e) { /* storage blocked: the choice lasts until reload */ }
    sync();
  }
  const toggle = () => set(get() === 'dark' ? 'light' : 'dark');

  if (btn) btn.addEventListener('click', toggle);
  if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = e => { if (!saved()) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); sync(); } };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }
  sync();
  return { get, set, toggle };
}
