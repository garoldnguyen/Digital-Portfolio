/* One window open at a time, chosen by the URL hash (#career), so every window has its own link and the browser's
   Back button works. The hash names a window; any other hash (like the skip link's #main) leaves the view alone. */

export const VIEWS = ['profile', 'credentials', 'career', 'works', 'research', 'honours', 'expertise', 'contact'];

export function initRouter() {
  const root = document.documentElement;
  const wins = {};
  VIEWS.forEach(v => { wins[v] = document.getElementById(v); });
  if (!wins.profile) return;
  let current = null;

  const fromHash = () => {
    let h = '';
    try { h = decodeURIComponent(location.hash.replace(/^#/, '')); } catch (e) { /* malformed hash */ }
    return VIEWS.indexOf(h) >= 0 ? h : null;
  };

  function show(view, moveFocus) {
    if (view === current) return;
    current = view;
    VIEWS.forEach(v => { if (wins[v]) wins[v].classList.toggle('is-open', v === view); });
    root.setAttribute('data-view', view);
    document.querySelectorAll('[data-view]').forEach(a => {
      if (a === root) return;
      if (a.getAttribute('data-view') === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const win = wins[view];
    if (win.dataset.title) document.title = win.dataset.title;
    const body = win.querySelector('.body');
    if (body) body.scrollTop = 0;
    window.scrollTo(0, 0);
    if (moveFocus) {
      const heading = win.querySelector('h1, h2');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
  }

  window.addEventListener('hashchange', () => {
    const v = fromHash();
    if (v) show(v, true);
    else if (!location.hash) show('profile', true);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && current !== 'profile' && !e.defaultPrevented) location.hash = '#profile';
  });

  show(fromHash() || 'profile', false);
}
