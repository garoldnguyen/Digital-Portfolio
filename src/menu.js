/* Mobile menu. Under 900px the section links do not fit in the bar, so a menu button opens a full-screen sheet with the
   same links (gold hairlines, large serif type) plus the CV. It works with keyboard and screen readers: the button reports
   aria-expanded, the closed sheet is inert, focus moves into the sheet when it opens and stays inside it, Escape closes it
   and returns focus to the button. It also works with prefers-reduced-motion (the transitions are simply switched off).
   While it is open it fires menu:open / menu:close, which app.js uses to pause and resume smooth scrolling. */

export function initMenu() {
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  var nav = document.querySelector('.nav');
  if (!btn || !menu || !nav) return;
  var root = document.documentElement;
  var links = [].slice.call(menu.querySelectorAll('a'));
  var isOpen = false;

  function focusable() {
    var bar = [].slice.call(nav.querySelectorAll('a, button')).filter(function (e) { return e.offsetParent !== null; });
    return bar.concat(links);
  }

  function set(state, returnFocus) {
    if (isOpen === state) return;
    isOpen = state;
    btn.setAttribute('aria-expanded', String(state));
    btn.setAttribute('aria-label', state ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', state);
    if (state) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    root.classList.toggle('menu-open', state);
    window.dispatchEvent(new CustomEvent(state ? 'menu:open' : 'menu:close'));
    if (state) setTimeout(function () { if (isOpen && links[0]) links[0].focus({ preventScroll: true }); }, 80);
    else if (returnFocus) btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', function () { set(!isOpen, true); });

  menu.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) set(false, false);               // go to the section, then close
    else if (e.target === menu || (e.target.classList && e.target.classList.contains('menu-in'))) set(false, true);
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { set(false, true); return; }
    if (e.key !== 'Tab') return;
    var f = focusable(), i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
    else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { f[0].focus(); e.preventDefault(); }
  });

  // widening the window (rotating a tablet) leaves the menu behind: close it
  var mq = window.matchMedia('(min-width: 901px)');
  var onChange = function (m) { if (m.matches) set(false, false); };
  if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
}
