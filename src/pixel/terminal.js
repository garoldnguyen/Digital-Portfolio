/* terminal.exe: a small command line inside the desktop. Every answer is read from the page itself (the windows' own text),
   so nothing is repeated or made up here and it never goes out of date. Text is always added with textContent, never as
   HTML, and there is no eval: a command is just a name looked up in the table below.
   It is a window like the others (drag, minimise, close) and also a way to move around: `open career`, `cv`, `theme dark`.
   There is one small hidden challenge for the curious (see `ctf`). */

const FLAG_B64 = 'ZmxhZ3toZWxsb19yZWNydWl0ZXJ9';      // the secret in `.secret`; the answer is its decoded text

export function initTerminal(desk, ctl) {
  const win = document.getElementById('terminal');
  const out = document.getElementById('term-out');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-in');
  if (!win || !out || !form || !input || !desk) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const text = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
  const WINDOWS = desk.views.filter(v => v !== 'shortcuts');
  const history = [];
  let hpos = 0, sudoTried = 0;

  // ---- output ----
  function scroll() { out.scrollTop = out.scrollHeight; }
  function line(s, cls) {
    const d = document.createElement('div');
    d.className = 'tl' + (cls ? ' ' + cls : '');
    d.textContent = s;
    out.appendChild(d);
    scroll();
    return d;
  }
  function lines(arr, cls) { arr.forEach(s => line(s, cls)); }
  function link(prefix, label, href) {
    const d = document.createElement('div');
    d.className = 'tl';
    d.appendChild(document.createTextNode(prefix));
    const a = document.createElement('a');
    a.href = href; a.textContent = label;
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    d.appendChild(a);
    out.appendChild(d);
    scroll();
  }
  function echo(cmd) {
    const d = document.createElement('div');
    d.className = 'tl cmd';
    const p = document.createElement('span');
    p.className = 'ps1'; p.textContent = 'visitor@quan:~$';
    d.appendChild(p);
    d.appendChild(document.createTextNode(' ' + cmd));
    out.appendChild(d);
  }
  const toast = msg => document.dispatchEvent(new CustomEvent('desktop:toast', { detail: msg }));

  // ---- data, read from the windows ----
  const who = () => ({
    name: text($('#h-profile')), role: text($('#profile .role')), meta: text($('#profile .meta')), lede: text($('#profile .lede'))
  });
  const jobs = () => $$('#career article.card').map(a => ({ title: text($('.job-t', a)), co: text($('.job-co', a)), when: text($('.chip', a)) }));
  const certs = () => $$('#credentials article.cred').map(a => ({ abbr: text($('.abbr', a)), name: text($('.cert', a)), issued: text($('.muted', a)), href: ($('a.lnk', a) || {}).href }));
  const groups = () => $$('#expertise .cols > section').map(s => ({ title: text($('.col-t', s)), items: $$('li', s).map(text) }));
  const works = () => $$('#works article.card').map(a => ({ title: text($('.w-t', a)), stack: text($('.muted', a)), links: $$('a.lnk', a).map(l => ({ label: text(l), href: l.href })) }));
  const honours = () => $$('#honours details.acc').map(d => ({ when: text($('.chip', d)), title: text($('.acc-t b', d)), by: text($('.acc-t span', d)) }));
  const contactInfo = () => ({
    mail: text($('#contact .c-mail')), tel: text($('#contact .c-tel')), where: text($('#contact .muted')),
    links: $$('#contact .cta a').map(a => ({ label: text(a), href: a.href }))
  });
  const cvHref = () => { const a = $('.tb-cv'); return a ? a.href : ''; };

  // ---- commands ----
  const C = {};
  const help = [];
  const def = (name, desc, fn, hidden) => { C[name] = fn; if (!hidden) help.push([name, desc]); };

  def('help', 'list the commands', () => {
    line('Commands:');
    help.forEach(h => line('  ' + pad(h[0], 11) + h[1]));
    line('');
    line('Tab completes, the arrow keys bring back old commands, Ctrl+L clears. Some commands are not listed.', 'dim');
  });
  def('whoami', 'who is this?', () => { const w = who(); lines([w.name, w.role, w.meta]); });
  def('about', 'the short version', () => line(who().lede));
  def('career', 'where I have worked', () => jobs().forEach(j => { line(j.title + ', ' + j.co); line('  ' + j.when, 'dim'); }));
  def('certs', 'security certificates', () => certs().forEach(c => { line(pad(c.abbr, 6) + c.name); link('        ' + c.issued + ', ', 'view credential', c.href); }));
  def('skills', 'skills; try skills <group>', a => {
    const g = groups();
    if (a[0]) {
      const hit = g.filter(x => x.title.toLowerCase().indexOf(a[0].toLowerCase()) >= 0)[0];
      if (!hit) { line('no such group: ' + a[0] + ' (' + g.map(x => x.title.split(' ')[0].toLowerCase()).join(', ') + ')', 'err'); return false; }
      line(hit.title + ':'); lines(hit.items.map(i => '  ' + i)); return;
    }
    g.forEach(x => { line(x.title + ':'); line('  ' + x.items.join(', ')); });
  });
  def('works', 'selected projects', () => works().forEach(w => { line(w.title + '  (' + w.stack + ')'); w.links.forEach(l => link('  ', l.label + ' → ' + l.href.replace(/^https?:\/\//, ''), l.href)); }));
  def('research', 'the paper', () => { line(text($('#research .paper-t'))); line(text($('#research .paper-s'))); line(text($('#research .accepted')), 'dim'); });
  def('honours', 'leadership and honours', () => honours().forEach(h => line(pad(h.when, 14) + h.title + (h.title.indexOf(h.by) >= 0 ? '' : ' (' + h.by + ')'))));
  def('contact', 'how to reach me', () => {
    const c = contactInfo();
    link('mail   ', c.mail, 'mailto:' + c.mail);
    line('phone  ' + c.tel); line('where  ' + c.where);
    c.links.forEach(l => link(pad(l.label.toLowerCase(), 7), l.href.replace(/^https?:\/\/(www\.)?/, ''), l.href));
  });
  def('ls', 'list the windows (ls -a shows more)', a => {
    const all = a.indexOf('-a') >= 0 || a.indexOf('-la') >= 0;
    line((all ? '.  ..  .secret  ' : '') + WINDOWS.join('  '));
  });
  def('open', 'open a window: open <name>', a => {
    const v = (a[0] || '').toLowerCase();
    if (!v) { line('usage: open <' + WINDOWS.join('|') + '>', 'err'); return false; }
    if (WINDOWS.indexOf(v) < 0) { line('open: no such window: ' + v, 'err'); return false; }
    if (v === 'terminal') { line('you are here.'); return; }
    line('opening ' + v + '…');
    desk.open(v);
  });
  def('cv', 'open the CV (PDF)', () => {
    const href = cvHref();
    if (!href) { line('cv: not found', 'err'); return false; }
    line('opening the CV…');
    window.open(href, '_blank', 'noopener');
  });
  def('theme', 'theme [dark|light]', a => {
    const t = (a[0] || '').toLowerCase();
    if (t && t !== 'dark' && t !== 'light') { line('usage: theme [dark|light]', 'err'); return false; }
    if (t) ctl.theme.set(t); else ctl.theme.toggle();
    line('theme: ' + ctl.theme.get());
  });
  def('sfx', 'sfx [on|off] (8-bit sounds)', a => {
    const t = (a[0] || '').toLowerCase();
    if (t && t !== 'on' && t !== 'off') { line('usage: sfx [on|off]', 'err'); return false; }
    ctl.sfx.set(t ? t === 'on' : !ctl.sfx.enabled());
    line('sfx: ' + (ctl.sfx.enabled() ? 'on' : 'off'));
  });
  def('neofetch', 'a summary card', () => {
    const w = who(), j = jobs()[0], c = certs();
    line(w.name.toLowerCase().replace(/[^a-z]+/g, '') + '@portfolio');
    line('-----------------');
    lines([
      pad('role', 10) + w.role,
      pad('org', 10) + (j ? j.co : ''),
      pad('based', 10) + w.meta.split(',').pop().trim(),
      pad('certs', 10) + c.map(x => x.abbr).join(', '),
      pad('os', 10) + 'pixel-desktop 1.0',
      pad('shell', 10) + 'nq-sh',
      pad('theme', 10) + ctl.theme.get()
    ]);
  });
  def('security', 'how this site is protected', () => lines([
    'No inline scripts or styles (strict Content-Security-Policy), scripts only from this site and Google Analytics.',
    'HSTS, no framing, nosniff, a locked-down Permissions-Policy and same-origin window isolation.',
    'Report a problem: /.well-known/security.txt'
  ]));
  def('history', 'commands so far', () => history.forEach((h, i) => line(pad(String(i + 1), 4) + h)));
  def('clear', 'clear the screen', () => { out.textContent = ''; });
  def('date', 'the date', () => line(new Date().toString()), true);
  def('pwd', '', () => line('/home/visitor'), true);
  def('echo', '', a => line(a.join(' ')), true);
  def('exit', 'close the terminal', () => { desk.close('terminal'); });
  def('ctf', '', () => lines([
    'There is one flag on this machine, in the form flag{...}.',
    'Hint: hidden files are listed by `ls -a`. When you find the flag, submit it with `flag <the flag>`.'
  ]), true);
  def('cat', '', a => {
    const f = (a[0] || '').toLowerCase();
    if (f === '.secret') { line(FLAG_B64); line('(that does not look like English. Is it base64?)', 'dim'); return; }
    if (C[f] && f !== 'cat') return C[f]([]);
    line('cat: ' + (a[0] || '') + ': no such file', 'err'); return false;
  }, true);
  def('base64', '', a => {
    const d = a.indexOf('-d') >= 0 || a.indexOf('--decode') >= 0;
    const s = a.filter(x => x[0] !== '-').join('');
    if (!s) { line('usage: base64 [-d] <text>', 'err'); return false; }
    try { line(d ? atob(s) : btoa(s)); } catch (e) { line('base64: invalid input', 'err'); return false; }
  }, true);
  def('flag', '', a => {
    const guess = a.join(' ').trim();
    if (!guess) { line('usage: flag <the flag>', 'err'); return false; }
    let ok = false;
    try { ok = guess === atob(FLAG_B64); } catch (e) { ok = false; }
    if (!ok) { line('Wrong flag. Keep looking.', 'err'); return false; }
    lines(['ACCESS GRANTED', 'Achievement unlocked: red-team recruiter.', 'You read like an attacker. Opening the contact window…'], 'ok');
    ctl.sfx.play('ok');
    toast('Achievement unlocked: red-team recruiter');
    setTimeout(() => desk.open('contact'), 900);
  }, true);
  def('sudo', '', a => {
    if (a[0] === 'hire' && (a[1] || '').toLowerCase() === 'quan') {
      lines(['[sudo] password for visitor: ********', 'Permission granted. Opening the contact window…'], 'ok');
      ctl.sfx.play('ok');
      setTimeout(() => desk.open('contact'), 900);
      return;
    }
    sudoTried++;
    line(sudoTried > 1 ? 'visitor is not in the sudoers file. This incident will be reported. (to nobody)' : 'visitor is not in the sudoers file. This incident will be reported.', 'err');
    if (sudoTried === 1) line('Hint: there is one thing sudo can do here.', 'dim');
    return false;
  }, true);
  def('rm', '', () => { line('nice try. This is a static site, there is nothing to delete.', 'err'); return false; }, true);

  // ---- running a command ----
  function run(raw) {
    const s = raw.trim();
    if (!s) return;
    echo(s);
    history.push(s); hpos = history.length;
    const parts = s.split(/\s+/), name = parts[0].toLowerCase(), args = parts.slice(1);
    let fail = false;
    if (!C[name]) { line(name + ': command not found. Type `help`.', 'err'); fail = true; }
    else if (C[name](args) === false) fail = true;
    if (name !== 'clear') line('');
    ctl.sfx.play(fail ? 'error' : 'tick');
    scroll();
  }

  // ---- tab completion ----
  function complete() {
    const v = input.value, parts = v.split(/\s+/);
    const last = parts[parts.length - 1].toLowerCase();
    if (!v.trim()) return false;
    let pool = [];
    if (parts.length === 1) pool = Object.keys(C);
    else if (parts[0] === 'open' || parts[0] === 'cat') pool = WINDOWS.concat(parts[0] === 'cat' ? ['.secret'] : []);
    else if (parts[0] === 'theme') pool = ['dark', 'light'];
    else if (parts[0] === 'sfx') pool = ['on', 'off'];
    else if (parts[0] === 'skills') pool = groups().map(g => g.title.split(' ')[0].toLowerCase());
    const hits = pool.filter(p => p.indexOf(last) === 0);
    if (!hits.length) return false;
    if (hits.length === 1) { parts[parts.length - 1] = hits[0]; input.value = parts.join(' ') + ' '; return true; }
    echo(v); line(hits.join('  ')); return true;
  }

  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { if (hpos > 0) { hpos--; input.value = history[hpos]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (hpos < history.length - 1) { hpos++; input.value = history[hpos]; } else { hpos = history.length; input.value = ''; } e.preventDefault(); }
    else if (e.key === 'Tab' && input.value.trim() && !e.shiftKey) { if (complete()) e.preventDefault(); }
    else if (e.key === 'l' && e.ctrlKey) { out.textContent = ''; e.preventDefault(); }
    else if (e.key === 'Escape' && input.value) { input.value = ''; e.preventDefault(); }   // first Escape clears the line, the next one closes the window
  });
  win.addEventListener('click', e => {                                       // a click on the screen puts the cursor back in the prompt, unless text is being selected
    if (e.target.closest('a, button')) return;
    const sel = window.getSelection && window.getSelection();
    if (sel && String(sel)) return;
    input.focus();
  });
  $$('.tchips button', win).forEach(b => b.addEventListener('click', () => { run(b.getAttribute('data-cmd')); input.focus({ preventScroll: true }); }));

  lines(['nq-sh 1.0 (pixel-desktop)', 'Type `help` to list the commands, or tap one below. Try `whoami`.', '']);
}
