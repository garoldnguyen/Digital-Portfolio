/* The window manager. On a computer every section is a window on the desktop: several can be open at once, you drag one by
   its title bar, resize it from the corner, minimise, maximise (double-click the bar) or close it, and the one in front is
   the one the address bar names (#career), so every window still has its own link and the Back button works. On a phone or
   a narrow screen (the same 1099px break as the stylesheet) it falls back to one window at a time, like an app.
   Focus mode: opening a window puts the others away (minimised, still on the taskbar) so there is one thing to look at; they come
   back when that window is closed or minimised, and Shift+click opens a window next to the others instead.
   Without JavaScript none of this runs: the sections simply stack as a normal page. */
import { t } from './i18n.js';

export const VIEWS = ['profile', 'credentials', 'career', 'works', 'research', 'honours', 'expertise', 'contact', 'terminal', 'shortcuts'];
const HOME = 'profile';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function initWindows(hooks) {
  hooks = hooks || {};
  const root = document.documentElement;
  const stage = document.getElementById('main');
  if (!stage || !document.getElementById(HOME)) return null;
  const phone = matchMedia('(max-width: 1099px)');
  const wins = {};
  VIEWS.forEach(v => {
    const el = document.getElementById(v);
    if (el) wins[v] = { el, open: el.classList.contains('is-open'), min: false, max: false, placed: false };
  });
  let active = null, zTop = 10;
  const hidden = {};                                                         // window -> the windows it put away when it opened, which return when it goes
  const homeTitle = document.title;
  const MIN_W = 380, MIN_H = 240;

  const fromHash = () => {
    let h = '';
    try { h = decodeURIComponent(location.hash.replace(/^#/, '')); } catch (e) { /* malformed hash */ }
    return wins[h] ? h : null;
  };
  const quietHash = v => { try { history.replaceState(null, '', v ? '#' + v : location.pathname + location.search); } catch (e) { /* file:// and the like */ } };
  const saved = () => { try { return JSON.parse(sessionStorage.getItem('qn-win2') || '{}'); } catch (e) { return {}; } };
  const save = v => {
    const w = wins[v];
    if (!w.placed) return;
    try {
      const all = saved();
      all[v] = { l: parseFloat(w.el.style.left), t: parseFloat(w.el.style.top), w: parseFloat(w.el.style.width), h: parseFloat(w.el.style.height) };
      sessionStorage.setItem('qn-win2', JSON.stringify(all));
    } catch (e) { /* storage blocked: positions last until reload */ }
  };

  // ---- geometry ----
  function stageSize() { return { w: stage.clientWidth, h: stage.clientHeight, top: stage.getBoundingClientRect().top }; }

  // turn the stylesheet's centring into explicit numbers, so the window can be moved and resized
  function freeze(v) {
    const w = wins[v];
    if (w.placed || phone.matches) return;
    const r = w.el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    setGeom(v, r.left - s.left, r.top - s.top, r.width, r.height);
    w.placed = true;
    w.el.classList.add('placed');
  }
  function setGeom(v, l, t, w, h) {
    const el = wins[v].el;
    el.style.left = Math.round(l) + 'px'; el.style.top = Math.round(t) + 'px';
    el.style.width = Math.round(w) + 'px'; el.style.height = Math.round(h) + 'px';
  }

  // a window opening for the first time: centred, then shifted a little for every window already open, so they fan out
  function place(v) {
    const w = wins[v];
    if (w.placed || phone.matches) return;
    const el = w.el, s = stageSize();
    const mine = saved()[v];
    const natural = el.getBoundingClientRect();
    let width = natural.width, height = Math.min(natural.height, s.h);
    let l, t;
    if (mine && isFinite(mine.l) && isFinite(mine.w)) {
      width = clamp(mine.w, MIN_W, s.w); height = clamp(mine.h || height, MIN_H, s.h);
      l = mine.l; t = mine.t;
    } else if (v === HOME) {                                                 // the home window opens big, in a 16:9 frame (never shorter than its content needs)
      width = Math.min(s.w - 32, (s.h - 8) * 16 / 9, 1560);
      el.style.width = Math.round(width) + 'px'; el.style.height = 'auto';
      const need = el.getBoundingClientRect().height;
      height = Math.min(s.h, Math.max(Math.round(width * 9 / 16), need));
      l = (s.w - width) / 2; t = (s.h - height) / 2;
    } else {
      const others = VIEWS.filter(k => k !== v && wins[k] && wins[k].open && !wins[k].min).length;
      const off = (others % 6) * 32;
      l = (s.w - width) / 2 + off; t = (s.h - height) / 2 + off;
    }
    l = clamp(l, 80 - width, s.w - 80); t = clamp(t, -s.top, s.h - 34);
    height = Math.max(MIN_H, Math.min(height, s.h + 24 - t));              // the bottom edge stays above the taskbar, so the resize corner can be reached
    setGeom(v, l, t, width, height);
    w.placed = true;
    el.classList.add('placed');
  }

  function unplace(v) {
    const w = wins[v], el = w.el;
    ['left', 'top', 'width', 'height', 'maxHeight', 'zIndex'].forEach(p => { el.style[p] = ''; });
    el.classList.remove('placed', 'is-max', 'is-min', 'is-focus', 'dragging');
    w.placed = false; w.max = false; w.min = false;
  }

  // ---- state ----
  function topmost(except) {
    let best = null, bz = -1;
    VIEWS.forEach(k => {
      const w = wins[k];
      if (!w || k === except || !w.open || w.min) return;
      const z = parseInt(w.el.style.zIndex, 10) || 0;
      if (z >= bz) { bz = z; best = k; }
    });
    return best;
  }

  // On a phone the taskbar is a row you swipe sideways: keep the tab of the open window in view, centred when it can be.
  const bar = document.querySelector('.taskbar');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  function revealTab() {
    if (!bar || !phone.matches) return;
    const tab = bar.querySelector('.tb[aria-current="page"]');
    if (!tab) return;
    const left = Math.max(0, tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2);
    bar.scrollTo({ left, behavior: still.matches ? 'auto' : 'smooth' });
  }

  function sync() {
    VIEWS.forEach(k => {
      const w = wins[k];
      if (!w) return;
      w.el.classList.toggle('is-open', w.open);
      w.el.classList.toggle('is-min', w.open && w.min);
      w.el.classList.toggle('is-max', w.open && w.max && !phone.matches);
      w.el.classList.toggle('is-focus', k === active);
    });
    root.setAttribute('data-view', active || '');
    document.querySelectorAll('[data-view]').forEach(a => {
      if (a === root) return;
      const k = a.getAttribute('data-view'), w = wins[k];
      if (k === active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      a.classList.toggle('is-open', !!(w && w.open));
      a.classList.toggle('is-min', !!(w && w.open && w.min));
    });
    document.querySelectorAll('.wb-max').forEach(b => {
      const k = b.closest('.win').id, on = !!(wins[k] && wins[k].max);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? t('win.restore', 'Restore window') : t('win.maximise', 'Maximise window'));
    });
    const cur = active && wins[active];
    document.title = cur && cur.el.dataset.title ? cur.el.dataset.title : homeTitle;
    revealTab();
  }

  function bringFront(v) {
    wins[v].el.style.zIndex = ++zTop;
    active = v;
  }

  function focusInside(v) {
    const el = wins[v].el;
    const auto = el.querySelector('[data-autofocus]');
    const target = auto || el.querySelector('h1, h2');
    if (!target) return;
    if (!auto) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  function hideOthers(v) {
    const list = hidden[v] = hidden[v] || [];
    VIEWS.forEach(k => {
      const w = wins[k];
      if (k === v || !w || !w.open || w.min) return;
      w.min = true;
      if (list.indexOf(k) < 0) list.push(k);
    });
  }
  function restoreHidden(v) {
    const list = hidden[v] || [];
    hidden[v] = [];
    list.forEach(k => { const w = wins[k]; if (w && w.open && w.min) w.min = false; });
  }

  function openView(v, opts) {
    opts = opts || {};
    const w = wins[v];
    if (!w) return;
    const wasShown = w.open && !w.min;
    if (phone.matches) VIEWS.forEach(k => { if (wins[k]) { wins[k].open = k === v; wins[k].min = false; } });
    w.open = true; w.min = false;
    if (!phone.matches && !opts.alongside) hideOthers(v);
    w.el.classList.add('is-open');
    w.el.classList.remove('is-min');
    if (!phone.matches) place(v);
    bringFront(v);
    sync();
    if (!wasShown && hooks.onOpen) hooks.onOpen(v);
    if (phone.matches) { const b = w.el.querySelector('.body'); if (b) b.scrollTop = 0; window.scrollTo(0, 0); }
    if (opts.moveFocus) focusInside(v);
  }

  function navigate(v, opts) {
    if (!wins[v]) return;
    if (location.hash !== '#' + v) { try { history.pushState(null, '', '#' + v); } catch (e) { location.hash = v; } }
    openView(v, Object.assign({ moveFocus: true }, opts));
  }

  function afterLeaving(v) {
    const next = topmost(v);
    if (next) { bringFront(next); quietHash(next); } else { active = null; quietHash(''); }
    sync();
  }

  function closeView(v) {
    const w = wins[v];
    if (!w || !w.open) return;
    if (v === HOME) { minimise(v); return; }
    if (phone.matches) { navigate(HOME); return; }
    w.open = false; w.min = false; w.max = false;
    unplaceKeep(v);
    if (hooks.onClose) hooks.onClose(v);
    restoreHidden(v);
    afterLeaving(v);
    if (active) focusInside(active);
  }
  // a closed window forgets maximise and focus but keeps its place for next time
  function unplaceKeep(v) { const el = wins[v].el; el.classList.remove('is-max', 'is-min', 'is-focus', 'dragging'); }

  function minimise(v) {
    const w = wins[v];
    if (!w || !w.open || phone.matches) return;
    w.min = true;
    if (hooks.onMinimise) hooks.onMinimise(v);
    restoreHidden(v);
    afterLeaving(v);
    if (active) focusInside(active);
  }

  function toggleMax(v) {
    const w = wins[v];
    if (!w || phone.matches) return;
    freeze(v);
    w.max = !w.max;
    sync();
    if (hooks.onMinimise) hooks.onMinimise(v);
  }

  // ---- window chrome: minimise and maximise buttons, resize grip, dragging ----
  function enhance(v) {
    const w = wins[v], el = w.el, bar = el.querySelector('.bar');
    if (!bar) return;
    const box = document.createElement('span');
    box.className = 'wbtns';
    const mk = (cls, label) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'wb ' + cls; b.setAttribute('aria-label', label); return b; };
    const bMin = mk('wb-min', t('win.minimise', 'Minimise window')), bMax = mk('wb-max', t('win.maximise', 'Maximise window'));
    bMax.setAttribute('aria-pressed', 'false');
    box.appendChild(bMin); box.appendChild(bMax);
    const x = bar.querySelector('.x');
    if (x) box.appendChild(x);
    bar.appendChild(box);
    bMin.addEventListener('click', () => minimise(v));
    bMax.addEventListener('click', () => toggleMax(v));
    if (x) x.addEventListener('click', e => { e.preventDefault(); closeView(v); });

    const grip = document.createElement('span');
    grip.className = 'grip';
    grip.setAttribute('aria-hidden', 'true');
    el.appendChild(grip);

    el.addEventListener('pointerdown', () => { if (active !== v && w.open && !w.min) { bringFront(v); sync(); quietHash(v); } }, true);
    bar.addEventListener('dblclick', e => { if (!e.target.closest('.wbtns')) toggleMax(v); });

    bar.addEventListener('pointerdown', e => {
      if (e.button !== 0 || phone.matches || w.max || e.target.closest('.wbtns')) return;
      freeze(v);
      const l0 = parseFloat(el.style.left), t0 = parseFloat(el.style.top), sx = e.clientX, sy = e.clientY;
      bar.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      const move = ev => {
        const s = stageSize();
        el.style.left = Math.round(clamp(l0 + ev.clientX - sx, 80 - el.offsetWidth, s.w - 80)) + 'px';
        el.style.top = Math.round(clamp(t0 + ev.clientY - sy, -s.top, s.h - 34)) + 'px';
      };
      const up = () => {
        bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up);
        el.classList.remove('dragging'); save(v);
      };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });

    grip.addEventListener('pointerdown', e => {
      if (e.button !== 0 || phone.matches || w.max) return;
      e.preventDefault();
      freeze(v);
      const w0 = el.offsetWidth, h0 = el.offsetHeight, l = parseFloat(el.style.left), t = parseFloat(el.style.top), sx = e.clientX, sy = e.clientY;
      grip.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      const move = ev => {
        const s = stageSize();
        el.style.width = Math.round(clamp(w0 + ev.clientX - sx, MIN_W, Math.max(MIN_W, s.w + 80 - l))) + 'px';
        el.style.height = Math.round(clamp(h0 + ev.clientY - sy, MIN_H, Math.max(MIN_H, s.h + 24 - t))) + 'px';
      };
      const up = () => {
        grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
        el.classList.remove('dragging'); save(v);
      };
      grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
    });
  }
  VIEWS.forEach(v => { if (wins[v]) enhance(v); });

  // ---- input ----
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[data-view]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey) return;      // Ctrl/Cmd-click still opens a new tab, as the browser does
    const v = a.getAttribute('data-view');
    if (!wins[v]) return;
    e.preventDefault();
    const w = wins[v];
    if (a.classList.contains('tb') && !phone.matches && w.open && !w.min && active === v) minimise(v);   // a taskbar button for the front window shrinks it
    else navigate(v, { alongside: e.shiftKey });
  });

  const onHash = () => {
    const v = fromHash();
    if (v) { if (!(wins[v].open && !wins[v].min && active === v)) openView(v, { moveFocus: true }); }
    else if (!location.hash) openView(HOME, { moveFocus: false });
  };
  window.addEventListener('hashchange', onHash);
  window.addEventListener('popstate', onHash);

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented || !active || active === HOME) return;
    if (document.getElementById('startmenu') && !document.getElementById('startmenu').hidden) return;   // the menu handles its own Escape
    closeView(active);
  });

  phone.addEventListener('change', () => {
    if (phone.matches) {                                                    // to a phone: one window, no geometry
      const keep = active || HOME;
      VIEWS.forEach(k => { if (wins[k]) { unplace(k); wins[k].open = k === keep; } });
      openView(keep);
    } else {                                                                // to a computer: the open window stays, centred
      VIEWS.forEach(k => { if (wins[k]) { wins[k].placed = false; } });
      const keep = active || HOME;
      VIEWS.forEach(k => { if (wins[k] && wins[k].open && k !== keep) wins[k].open = false; });
      openView(keep);
    }
  });

  window.addEventListener('resize', () => {
    if (phone.matches) return;
    const s = stageSize();
    VIEWS.forEach(k => {
      const w = wins[k];
      if (!w || !w.placed) return;
      const el = w.el, width = clamp(el.offsetWidth, MIN_W, s.w);
      const l = clamp(parseFloat(el.style.left), 80 - width, s.w - 80), t = clamp(parseFloat(el.style.top), -s.top, s.h - 34);
      setGeom(k, l, t, width, clamp(el.offsetHeight, MIN_H, Math.max(MIN_H, s.h + 24 - t)));
    });
  });

  // first view: the hash if it names a window (a shared link), otherwise the home window
  const first = fromHash() || HOME;
  VIEWS.forEach(k => { if (wins[k]) wins[k].open = k === first; });
  openView(first, { moveFocus: false });
  if (first === 'terminal') {                                              // a link straight to the terminal puts the cursor in its prompt; the browser's own
    const f = () => setTimeout(() => focusInside('terminal'), 0);          // jump to #terminal clears the focus after load, so wait for that
    if (document.readyState === 'complete') f(); else window.addEventListener('load', f);
  }

  return {
    open: (v, o) => navigate(v, o),
    close: closeView,
    minimise,
    toggleMax,
    active: () => active,
    isOpen: v => !!(wins[v] && wins[v].open && !wins[v].min),
    isPhone: () => phone.matches,
    views: VIEWS.slice()
  };
}
