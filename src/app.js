import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { initGlitch } from './glitch.js';
import { initGlow } from './glow.js';
import { initBackdrop } from './backdrop.js';
import { initMenu } from './menu.js';
import { initWave } from './wave.js';

(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[portfolio] ' + name, e); } }

  /* ---------- copy buttons (no libraries needed) ---------- */
  var toast = $('#toast'), toastTimer;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('on'); }, 2000);
  }
  safe('copy', function () {
    $$('[data-copy], [data-copy-target]').forEach(function (b) {
      b.addEventListener('click', function () {
        var src = b.getAttribute('data-copy-target') ? $(b.getAttribute('data-copy-target')) : null;
        var v = src ? src.textContent.trim() : b.getAttribute('data-copy');
        var msg = b.getAttribute('data-toast') || ('Copied ' + v);
        var fail = function () {
          var s = src || b.previousElementSibling;
          if (s) { var r = doc.createRange(); r.selectNodeContents(s); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
          say('Selected. Press Ctrl+C or Cmd+C to copy.');
        };
        try { navigator.clipboard.writeText(v).then(function () { say(msg); }, fail); } catch (e) { fail(); }
      });
    });
  });

  /* ---------- mobile menu, and the skip link (both must work with reduced motion too) ---------- */
  safe('menu', function () { initMenu(); });
  safe('skip', function () {
    var sk = $('.skip'), main = $('#main');
    if (sk && main) sk.addEventListener('click', function () { setTimeout(function () { main.focus({ preventScroll: true }); }, 0); });
  });

  /* ---------- WebGL hero light ---------- */
  var fade = { v: 1 };
  var stage = { v: 1 };                       // stage light: comes up slowly with the page fade-in
  var mouse = { x: 0.5, y: 0.5 };
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uFade;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);',
    ' float a=hash(i);float b=hash(i+vec2(1.,0.));float c=hash(i+vec2(0.,1.));float d=hash(i+vec2(1.,1.));',
    ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'float dust(vec2 p,float seed){vec2 id=floor(p);vec2 f=fract(p);float h=hash(id+seed);',
    ' vec2 o=vec2(hash(id+seed+3.1),hash(id+seed+7.7))*.6+.2;float d=length(f-o);',
    ' float tw=.5+.5*sin(uTime*(.8+h*2.)+h*40.);',
    ' return (1.-smoothstep(0.,.035+h*.03,d))*tw*step(.6,h);}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;vec2 m=uMouse-.5;',
    ' vec2 q=vec2((uv.x-.5)*asp,uv.y);',
    ' vec2 s=q-vec2(m.x*.15,-.14);',
    ' float r=length(s);',
    ' float a=atan(s.x,s.y)+m.x*.22+sin(uTime*.11)*.04;',
    ' float warp=fbm(vec2(a*2.5,uTime*.04))*1.6;',
    ' float f1=sin(a*24.+uTime*.09+warp);float f2=sin(a*57.-uTime*.06+warp*.5);',
    ' float rays=smoothstep(.15,1.,f1*.5+.5)*.85+smoothstep(.6,1.,f2*.5+.5)*.3;',
    ' float cone=1.-smoothstep(.2,1.4,abs(a));',
    ' float fall=exp(-r*1.15)*smoothstep(.02,.3,r);',
    ' float beam=rays*cone*fall;',
    ' float glow=exp(-length(vec2(s.x*.75,s.y*1.25))*2.);',
    ' float haze=fbm(q*2.6+vec2(0.,-uTime*.025))*.6+.4;',
    ' vec3 gold=vec3(.894,.78,.47);vec3 pale=vec3(1.,.93,.72);vec3 deep=vec3(.039,.082,.071);vec3 em=vec3(.059,.239,.2);',
    ' vec3 col=mix(deep,em,(1.-smoothstep(0.,1.,uv.y))*.5*haze);',
    ' col+=gold*beam*.30*haze;',
    ' col+=gold*glow*.24;',
    ' vec2 pp=vec2(uv.x*asp,uv.y);',
    ' float dd=dust(pp*7.+vec2(m.x*.6,-uTime*.05),1.)*.55+dust(pp*13.+vec2(m.x*1.1,-uTime*.09),5.)*.8+dust(pp*23.+vec2(m.x*1.8,-uTime*.14),9.)*.75;',
    ' col+=pale*dd*.85*smoothstep(0.,.5,uv.y+.25);',
    ' float vig=1.-smoothstep(.45,1.25,length((uv-.5)*vec2(1.,.9)));',
    ' col*=mix(.55,1.,vig);',
    ' col=mix(deep,col,uFade);',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function initGL(still) {
    var c = $('#gl'), hero = $('.hero');
    if (!c || !hero) return;
    var gl = c.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { c.remove(); return; }
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn('[gl]', gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { c.remove(); return; }
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { c.remove(); return; }
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(pr, 'uRes'), uTime = gl.getUniformLocation(pr, 'uTime'),
        uMouse = gl.getUniformLocation(pr, 'uMouse'), uFade = gl.getUniformLocation(pr, 'uFade');
    var vis = true, t0 = performance.now(), w = 2, h = 2;
    function size() {
      var r = hero.getBoundingClientRect();
      var s = Math.min(window.devicePixelRatio || 1, 1) * 0.8;
      w = Math.max(2, Math.round(r.width * s)); h = Math.max(2, Math.round(r.height * s));
      c.width = w; c.height = h; gl.viewport(0, 0, w, h);
    }
    function draw(t) {
      gl.uniform2f(uRes, w, h); gl.uniform1f(uTime, t); gl.uniform2f(uMouse, mouse.x, mouse.y); gl.uniform1f(uFade, fade.v * stage.v);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    size();
    if (window.ResizeObserver) new ResizeObserver(function () { size(); if (still) draw(8); }).observe(hero);
    else window.addEventListener('resize', size);
    c.addEventListener('webglcontextlost', function (e) { e.preventDefault(); c.remove(); });
    if (still) { draw(8); return; }
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(hero);
    (function loop() {
      if (vis && !doc.hidden && c.isConnected) draw((performance.now() - t0) / 1000 + 6);
      if (c.isConnected) requestAnimationFrame(loop);
    })();
  }

  var G = gsap, ST = ScrollTrigger, SP = SplitText;

  /* ---------- the glamour backdrop behind the see-through sections (drawn once, still, for reduced motion) ---------- */
  safe('backdrop', function () { initBackdrop(G, { still: reduce || !G }); });
  if (!G || reduce) { safe('gl', function () { initGL(true); }); return; }
  stage.v = 0.1;
  G.to(stage, { v: 1, duration: 3.4, delay: 0.5, ease: 'power2.inOut' });
  safe('gl', function () { initGL(false); });

  root.classList.add('js');
  if (ST) G.registerPlugin(ST);
  if (SP) G.registerPlugin(SP);

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  safe('lenis', function () {
    if (!ST) return;
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (time) { lenis.raf(time * 1000); });
    G.ticker.lagSmoothing(0);
  });
  window.addEventListener('menu:open', function () { if (lenis) lenis.stop(); });
  window.addEventListener('menu:close', function () { if (lenis) lenis.start(); });
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    var t = doc.getElementById(id.slice(1));
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -56, duration: 1.7 });
    else t.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- pointer light, tilt, magnetic buttons ---------- */
  safe('pointer', function () {
    if (!fine) return;
    var cl = $('.cl');
    if (cl) {
      var qx = G.quickTo(cl, 'x', { duration: 0.9, ease: 'power3.out' }), qy = G.quickTo(cl, 'y', { duration: 0.9, ease: 'power3.out' });
      window.addEventListener('pointermove', function (e) { qx(e.clientX); qy(e.clientY); cl.classList.add('on'); }, { passive: true });
      doc.addEventListener('pointerleave', function () { cl.classList.remove('on'); });
    }
    var mx = G.quickTo(mouse, 'x', { duration: 1.4, ease: 'power3.out' }), my = G.quickTo(mouse, 'y', { duration: 1.4, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { mx(e.clientX / window.innerWidth); my(1 - e.clientY / window.innerHeight); }, { passive: true });

    $$('.frame').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect();
        card.style.setProperty('--mx', (((e.clientX - b.left) / b.width) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (((e.clientY - b.top) / b.height) * 100).toFixed(1) + '%');
      });
    });
    $$('.mag').forEach(function (b) {
      var bx = G.quickTo(b, 'x', { duration: 0.6, ease: 'power3.out' }), by = G.quickTo(b, 'y', { duration: 0.6, ease: 'power3.out' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        bx((e.clientX - (r.left + r.width / 2)) * 0.22); by((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      b.addEventListener('pointerleave', function () { bx(0); by(0); });
    });
  });

  /* ---------- hero intro ---------- */
  var fontsReady = (doc.fonts && doc.fonts.ready) ? Promise.race([doc.fonts.ready, new Promise(function (r) { setTimeout(r, 1400); })]) : Promise.resolve();
  fontsReady.then(function () {
    safe('intro', function () {
      var chars = null;
      if (SP) {
        var sp = SP.create('#name', { type: 'words,chars', wordsClass: 'w', charsClass: 'ch' });
        chars = sp.chars;
      }
      var tl = G.timeline({ delay: 0.7, defaults: { ease: 'expo.out' } });   // the page is still fading in
      tl.from('.hi-label', { opacity: 0.2, y: 20, filter: 'blur(6px)', duration: 1.2, clearProps: 'filter' }, 0.1)
        .from('.hi-arch', { opacity: 0.2, y: 50, scale: 0.94, filter: 'blur(8px)', duration: 1.7, clearProps: 'filter' }, 0.2);
      if (chars) {
        tl.from(chars, { yPercent: 60, opacity: 0.15, filter: 'blur(10px)', duration: 1.7, stagger: { each: 0.045 }, clearProps: 'filter' }, 0.5);
      } else {
        tl.from('#name', { opacity: 0.2, y: 30, duration: 1.5 }, 0.5);
      }
      tl.from('.hi-div i', { scaleX: 0.15, opacity: 0.2, duration: 1.4 }, 1.1)
        .from('.hi-role, .hi-alias', { opacity: 0.2, y: 24, filter: 'blur(6px)', duration: 1.3, stagger: 0.12, clearProps: 'filter' }, 1.2)
        .from('.hi-cta', { opacity: 0.2, y: 24, duration: 1.2 }, 1.5);
      safe('glitch', function () { initGlitch(); });
      safe('glow', function () { initGlow(G); });
      if (chars) {
        G.timeline({ repeat: -1, repeatDelay: 5, delay: 3.6 })
          .to(chars, { color: '#FFF7DC', textShadow: '0 0 24px rgba(255,236,160,.9)', duration: 0.45, yoyo: true, repeat: 1, stagger: 0.07, ease: 'sine.inOut' });
      }
    });
  });

  safe('wave', function () { initWave(fontsReady); });   // a ripple of words that follows the cursor on every page (prototype, laptop screens)

  if (!ST) return;
  ST.config({ ignoreMobileResize: true });

  /* ---------- hero scroll-out ---------- */
  safe('hero-scrub', function () {
    var base = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    G.to('.hero-inner', { yPercent: -5, ease: 'none', scrollTrigger: base });
    G.to('.px', { y: 90, ease: 'none', scrollTrigger: base });
    G.to(fade, { v: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true } });
  });

  /* ---------- nav ---------- */
  safe('nav', function () {
    var nav = $('.nav'), links = $$('.links a, .menu-in a[href^="#"]');
    G.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    function slim(self) { nav.classList.toggle('scrolled', self.scroll() > 60); }
    ST.create({ start: 0, end: 'max', onUpdate: slim, onRefresh: slim });   // the bar stays with the visitor; it only slims down
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1), s = doc.getElementById(id);
      if (!s) return;
      ST.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) { a.classList.toggle('act', self.isActive); } });
    });
  });

  /* ---------- section heads ---------- */
  safe('heads', function () {
    $$('.sh').forEach(function (sh) {
      var h = $('.h2', sh), l = $$('.ln', sh);
      var tl = G.timeline({ scrollTrigger: { trigger: sh, start: 'top 88%', once: true, onEnter: function () { sh._rv = true; } } });
      sh._tl = tl;
      tl.from(l, { scaleX: 0.15, duration: 1.4, ease: 'expo.out' }, 0)
        .from(h, { y: 34, opacity: 0.2, filter: 'blur(8px)', duration: 1.3, ease: 'expo.out', clearProps: 'filter' }, 0);
    });
  });

  /* ---------- content reveal ---------- */
  safe('reveal', function () {
    var items = $$('.rv');
    items.forEach(function (el) { G.set(el, el.classList.contains('job') ? { y: 46 } : { opacity: 0.25, y: 46 }); });
    ST.batch(items, {
      start: 'top 92%', once: true,
      onEnter: function (b) { b.forEach(function (el) { el._rv = true; }); G.to(b, { opacity: 1, y: 0, duration: 1.15, ease: 'power3.out', stagger: Math.min(0.12, 0.6 / Math.max(1, b.length - 1)), overwrite: 'auto' }); }
    });
  });

  /* ---------- career rail ---------- */
  safe('timeline', function () {
    var tl = $('.tl'); if (!tl) return;
    G.to('.tl-fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 60%', end: 'bottom 60%', scrub: 0.5 } });
    $$('.job', tl).forEach(function (j) {
      ST.create({ trigger: j, start: 'top 62%', onEnter: function () { j.classList.add('on'); }, onLeaveBack: function () { j.classList.remove('on'); } });
    });
  });

  /* ---------- counters ---------- */
  safe('counters', function () {
    $$('[data-count]').forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '', o = { v: 0 };
      function fmt(v) { return pre + v.toFixed(dec) + suf; }
      ST.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () {
          G.to(o, { v: end, duration: 1.9, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v); }, onComplete: function () { el.textContent = fmt(end); } });
        }
      });
    });
  });

  /* ---------- catch up: reveal what a reload or a jump skipped ----------
     The reveals above fire when a trigger is crossed while scrolling forward. After a reload (the browser restores the
     scroll position), or Home/End, or any jump, content that is already on screen or above it was never crossed and would
     stay dim. This reveals it. It runs after load and fonts, and whenever scrolling stops; it only touches what is still
     unrevealed, so normal scrolling is unaffected. */
  safe('catchup', function () {
    var rv = $$('.rv'), heads = $$('.sh'), jobs = $$('.job');
    function catchUp() {
      var vh = window.innerHeight;
      rv.forEach(function (el) {
        if (el._rv) return;
        var r = el.getBoundingClientRect();
        if (r.top >= vh * 0.92) return;
        el._rv = true;
        if (r.bottom < 0) G.set(el, { opacity: 1, y: 0 });
        else G.to(el, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', overwrite: 'auto' });
      });
      heads.forEach(function (sh) {
        if (sh._rv || !sh._tl) return;
        var r = sh.getBoundingClientRect();
        if (r.top >= vh * 0.88) return;
        sh._rv = true;
        if (r.bottom < 0) sh._tl.progress(1); else sh._tl.play();
      });
      jobs.forEach(function (j) { if (j.getBoundingClientRect().top < vh * 0.62) j.classList.add('on'); });
    }
    var t = 0;
    window.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(catchUp, 220); }, { passive: true });
    window.addEventListener('load', function () { setTimeout(catchUp, 60); });
    fontsReady.then(function () { setTimeout(catchUp, 60); });
    [150, 600, 1500, 3000].forEach(function (ms) { setTimeout(catchUp, ms); });   // the browser may restore the scroll position late
    catchUp();
  });

  /* ---------- ticker that reacts to scroll speed ---------- */
  safe('ticker', function () {
    var track = $('.tick-track'); if (!track) return;
    track.style.animation = 'none';
    var grp = track.firstElementChild, gw = grp.getBoundingClientRect().width;
    var loop = G.to(track, { x: -gw, duration: gw / 55, ease: 'none', repeat: -1 });
    var lastY = window.scrollY, cur = 1, dir = 1;
    G.ticker.add(function () {
      var y = window.scrollY, v = y - lastY; lastY = y;
      if (Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1;
      var target = dir * (1 + Math.min(Math.abs(v) * 0.35, 7));
      cur += (target - cur) * 0.07;
      loop.timeScale(cur);
    });
    window.addEventListener('resize', function () { loop.invalidate(); });
  });

  /* ---------- ghost numerals ---------- */
  safe('ghost', function () {
    $$('.ghost').forEach(function (g) {
      G.fromTo(g, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: g.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ---------- refresh once everything has settled ---------- */
  window.addEventListener('load', function () { ST.refresh(); });
  fontsReady.then(function () { ST.refresh(); });
})();
