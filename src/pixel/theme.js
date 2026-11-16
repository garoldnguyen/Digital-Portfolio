/* Light / dark theme. The first choice comes from assets/js/theme-init.js (saved choice, then the system setting, set
   before the page paints); this file wires the button and follows the system setting until the visitor chooses. */

export function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const saved = () => { try { return localStorage.getItem('qn-theme'); } catch (e) { return null; } };
  const sync = () => { if (btn) btn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark')); };

  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('qn-theme', next); } catch (e) { /* storage blocked: the choice lasts until reload */ }
      sync();
    });
  }
  if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = e => { if (!saved()) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); sync(); } };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }
  sync();
}
