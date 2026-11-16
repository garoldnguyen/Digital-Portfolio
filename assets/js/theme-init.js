/* Runs before the page paints (loaded in <head> without defer): marks the page as "js" and sets the colour theme
   (saved choice first, then the visitor's system setting) so there is no flash of the wrong theme.
   It is a separate file because the Content-Security-Policy does not allow inline scripts. */
(function () {
  var d = document.documentElement, t = null;
  d.classList.add('js');
  try { t = localStorage.getItem('qn-theme'); } catch (e) { /* storage blocked: fall through */ }
  if (t !== 'light' && t !== 'dark') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  d.setAttribute('data-theme', t);
})();
