/* "Copy" buttons: data-copy="text" copies that text, data-copy-target="#id" copies the text of that element.
   A small message (data-toast) confirms it; the message sits in a polite live region so screen readers hear it. */
import { t } from './i18n.js';

export function initCopy() {
  const toast = document.getElementById('toast');
  let timer = 0;
  const say = msg => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  async function write(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return; }
    const ta = document.createElement('textarea');       // older browsers
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    if (!ok) throw new Error('copy not available');
  }

  document.addEventListener('desktop:toast', e => say(String(e.detail || '')));     // other parts of the desktop (the terminal) can show a message too

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-copy], [data-copy-target]');
    if (!b) return;
    let text = b.getAttribute('data-copy');
    if (text === null) { const t = document.querySelector(b.getAttribute('data-copy-target')); text = t ? t.textContent.trim() : ''; }
    if (!text) return;
    write(text).then(() => say(b.getAttribute('data-toast') || t('copy.done', 'Copied')), () => say(t('copy.fail', 'Could not copy, please select the text')));
  });
}
