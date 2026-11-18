/* Playable works. A link marked data-play (in the Works window) opens its demo inside the window instead of a new tab: the cards
   give way to a small player (a "Back to works" button, a "Reload" button, the title, an "Open in new tab" link) and one <iframe>.
   - Nothing third-party loads until the click: the <iframe> is created then, and removed again on Back or when the window closes,
     so a demo never keeps running (or playing sound) behind a closed window. Minimising keeps it, like any app.
   - Without JavaScript the link is a normal link to a new tab; Ctrl/Cmd/Shift-click and middle-click also keep that behaviour.
   - Only addresses named in `frame-src` of the Content-Security-Policy (firebase.json) can load. A demo whose own server forbids
     framing (Gomoku Tales sends frame-ancestors for itch.io only) simply has no data-play and stays a new-tab link.
   - The frame is sandboxed: scripts, forms, its own storage, pop-ups and downloads work, but the demo cannot navigate this page. */

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads';

export function initPlayer(desk) {
  const win = document.getElementById('works');
  const panel = document.getElementById('player');
  if (!win || !panel) return;
  const box = panel.querySelector('.player-frame');
  const title = document.getElementById('player-t');
  const ext = document.getElementById('player-ext');
  const back = panel.querySelector('[data-player-back]');
  let frame = null, launcher = null, grown = false;

  // (Re)creates the frame from the address of the "Open in new tab" link. A page of another site cannot be told to reload from here
  // (cross-origin), so Reload builds a fresh frame: the demo starts again from its first page with nothing left in memory.
  function mount() {
    if (frame) frame.remove();
    box.classList.remove('is-loaded');
    frame = document.createElement('iframe');
    frame.className = 'player-iframe';
    frame.title = title.textContent;
    frame.setAttribute('sandbox', SANDBOX);
    frame.setAttribute('allow', 'fullscreen');
    frame.addEventListener('load', () => box.classList.add('is-loaded'), { once: true });
    frame.src = ext.href;
    box.append(frame);
  }

  function open(link) {
    close(false);
    const card = link.closest('article');
    const heading = card && card.querySelector('.w-t');
    const name = heading ? heading.textContent.trim() : '';
    launcher = link;
    title.textContent = name;
    ext.href = link.href;
    mount();
    win.classList.add('is-playing');
    panel.hidden = false;
    // the window is only as tall as the cards, far too small to play in: on a computer it opens to the full desktop area (the
    // window manager's own maximise, so it glides and restores like any other) and goes back to its size on Back. On a phone it is already full width.
    if (desk && !desk.isPhone() && !win.classList.contains('is-max')) { desk.toggleMax('works'); grown = true; }
    back.focus({ preventScroll: true });
  }

  function close(restoreFocus) {
    if (frame) { frame.remove(); frame = null; }          // removing the frame unloads the page: its timers and sounds stop
    box.classList.remove('is-loaded');
    panel.hidden = true;
    win.classList.remove('is-playing');
    if (grown && restoreFocus && win.classList.contains('is-max')) desk.toggleMax('works');   // only if it is still the maximise we made (the user may have restored it already; a closed window has forgotten it)
    grown = false;
    if (restoreFocus && launcher && launcher.isConnected) launcher.focus({ preventScroll: true });
    if (restoreFocus) launcher = null;
  }

  document.addEventListener('click', e => {
    const link = e.target.closest && e.target.closest('a[data-play]');
    if (link && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) { e.preventDefault(); open(link); return; }
    if (e.target.closest && e.target.closest('[data-player-back]')) close(true);
    else if (e.target.closest && e.target.closest('[data-player-reload]') && frame) mount();
  });

  // Esc first leaves the demo (back to the cards); a second Esc closes the window as usual. Runs before windows.js's own Escape.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented || !frame) return;
    const menu = document.getElementById('startmenu');
    if (menu && !menu.hidden) return;                       // the START menu handles its own Escape
    if (!win.contains(document.activeElement)) return;      // only when focus is in this window
    e.preventDefault();
    close(true);
  }, true);

  // closing the Works window ends the demo (the class is-open comes off); minimising keeps it running
  new MutationObserver(() => { if (frame && !win.classList.contains('is-open')) close(false); })
    .observe(win, { attributes: true, attributeFilter: ['class'] });
}
