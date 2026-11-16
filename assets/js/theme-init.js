/* Runs before the page paints (loaded in <head> without defer): marks the page as "js", sets the colour theme (saved choice
   first, then the visitor's system setting) so there is no flash of the wrong theme, and decides whether the start-up screen
   plays (first visit of the session, computer-sized screen, no #window in the link, no reduced-motion request).
   It is a separate file because the Content-Security-Policy does not allow inline scripts. */
(function () {
  var d = document.documentElement, t = null;
  d.classList.add('js');
  try { t = localStorage.getItem('qn-theme'); } catch (e) { /* storage blocked: fall through */ }
  if (t !== 'light' && t !== 'dark') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  d.setAttribute('data-theme', t);
  try {
    var seen = sessionStorage.getItem('qn-booted'), deep = location.hash && location.hash !== '#profile';
    if (!seen && !deep && window.matchMedia && matchMedia('(min-width: 1100px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      d.classList.add('booting');
      setTimeout(function () { d.classList.remove('booting'); }, 8000);   // never trap the visitor if the main script fails to load
    }
  } catch (e) { /* storage blocked: no start-up screen */ }
})();
