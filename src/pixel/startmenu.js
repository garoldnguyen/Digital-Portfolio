/* The START menu: every window, the terminal, the shortcut list, the CV, the theme and sound switches and "Shut down".
   On a phone it doubles as the app switcher. Without JavaScript the START button is just a link to the home window. */

export function initStartMenu(desk, ctl) {
  const btn = document.getElementById('start-btn');
  const menu = document.getElementById('startmenu');
  if (!btn || !menu) return;
  const items = () => Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]'));
  const isOpen = () => !menu.hidden;

  function open() {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    const first = items()[0];
    if (first) first.focus({ preventScroll: true });
  }
  function close(returnFocus) {
    if (!isOpen()) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) btn.focus({ preventScroll: true });
  }

  btn.setAttribute('role', 'button');
  btn.addEventListener('click', e => { e.preventDefault(); if (isOpen()) close(false); else open(); });
  btn.addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); btn.click(); } });

  menu.addEventListener('click', e => {
    const it = e.target.closest('[role="menuitem"]');
    if (!it) return;
    const act = it.getAttribute('data-act');
    if (act === 'theme') ctl.theme.toggle();
    else if (act === 'sfx') ctl.sfx.toggle();
    else if (act === 'shortcuts') desk.open('shortcuts');
    else if (act === 'shutdown') ctl.boot.shutdown();
    if (act === 'theme' || act === 'sfx') return;                  // those stay open so the label change is seen
    close(false);
  });

  menu.addEventListener('keydown', e => {
    const list = items(), i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { list[(i + 1) % list.length].focus(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { list[(i - 1 + list.length) % list.length].focus(); e.preventDefault(); }
    else if (e.key === 'Home') { list[0].focus(); e.preventDefault(); }
    else if (e.key === 'End') { list[list.length - 1].focus(); e.preventDefault(); }
    else if (e.key === 'Escape') { close(true); e.preventDefault(); }
    else if (e.key === 'Tab') close(false);
  });
  document.addEventListener('pointerdown', e => { if (isOpen() && !menu.contains(e.target) && !btn.contains(e.target)) close(false); });
  window.addEventListener('blur', () => close(false));
}
