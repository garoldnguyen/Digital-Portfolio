/* Keyboard shortcuts, active when the focus is not in a text field and no Ctrl, Cmd or Alt key is held:
   1 to 9 open a window, T the terminal, ? the list of shortcuts, M minimise, F maximise, D switch the theme, Esc close. */

export function initShortcuts(desk, ctl) {
  const ORDER = ['profile', 'credentials', 'career', 'works', 'research', 'honours', 'expertise', 'contact', 'terminal'];
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = e.key;
    if (k >= '1' && k <= '9') { desk.open(ORDER[Number(k) - 1]); e.preventDefault(); }
    else if (k === 't' || k === 'T') { desk.open('terminal'); e.preventDefault(); }
    else if (k === '?' || (k === '/' && e.shiftKey)) { desk.open('shortcuts'); e.preventDefault(); }
    else if (k === 'm' || k === 'M') { if (desk.active()) desk.minimise(desk.active()); }
    else if (k === 'f' || k === 'F') { if (desk.active()) desk.toggleMax(desk.active()); }
    else if (k === 'd' || k === 'D') { ctl.theme.toggle(); }
  });
}
