/* Tiny 8-bit sound effects made with the Web Audio API (no audio files). Off until the visitor turns it on with the SFX
   button, the START menu, the terminal (sfx on) or nothing at all: the choice is remembered. Browsers only allow sound
   after a click or key press, so the audio engine is created the first time a sound is asked for after that. */

const NOTES = {
  open: [[660, 0.06], [880, 0.08]],
  close: [[740, 0.06], [494, 0.09]],
  min: [[587, 0.07]],
  tick: [[1320, 0.025]],
  error: [[150, 0.14]],
  ok: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.12]],
  boot: [[392, 0.09], [523, 0.09], [659, 0.09], [784, 0.16]],
  off: [[784, 0.08], [523, 0.08], [392, 0.14]]
};

export function initSfx() {
  const btn = document.getElementById('sfx-toggle');
  let on = false, ctx = null;
  try { on = localStorage.getItem('qn-sfx') === 'on'; } catch (e) { /* storage blocked */ }

  function engine() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  function play(name) {
    if (!on) return;
    const seq = NOTES[name], c = engine();
    if (!seq || !c) return;
    if (c.state === 'suspended' && c.resume) c.resume();
    let t = c.currentTime + 0.01;
    seq.forEach(n => {
      const osc = c.createOscillator(), gain = c.createGain();
      osc.type = name === 'error' ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(n[0], t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.045, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t); osc.stop(t + n[1] + 0.02);
      t += n[1];
    });
  }

  function sync() {
    if (btn) btn.setAttribute('aria-pressed', String(on));
    document.querySelectorAll('[data-sfx-label]').forEach(el => { el.textContent = on ? 'Sound: on' : 'Sound: off'; });
  }
  function set(next) {
    on = !!next;
    try { localStorage.setItem('qn-sfx', on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
    sync();
    if (on) play('ok');
  }
  if (btn) btn.addEventListener('click', () => set(!on));
  sync();
  return { play, set, toggle: () => set(!on), enabled: () => on };
}
