/* Language. The English text is written in the code; the Vietnamese page (vi/index.html, built by scripts/i18n.js) carries the
   run-time strings in a JSON block, <script type="application/json" id="i18n">, and t() prefers them. A JSON block is data, not a
   script, so the Content-Security-Policy is not involved. initLang() makes the EN / VI links keep the open window: the same
   #hash is carried over to the other language's page. */

let table = {};
try {
  const el = document.getElementById('i18n');
  if (el) table = JSON.parse(el.textContent) || {};
} catch (e) { table = {}; }

export const t = (key, english) => (typeof table[key] === 'string' ? table[key] : english);

export function initLang() {
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[data-lang]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // new tab and the like: the browser's own way
    e.preventDefault();
    location.href = a.getAttribute('href') + location.hash;
  });
}
