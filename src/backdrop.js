/* Golden Age backdrop: the see-through content sections (Profile, Credentials, Career, ...) sit on top of this.
   One fixed canvas behind the page, drawn in a fragment shader (no images):
     - deep night and emerald "light leak" clouds, drifting very slowly
     - an Art Deco diamond lattice in gold double hairlines with a small lozenge at every crossing
     - a slow gold-leaf shimmer: a soft diagonal band of light that glides across the lattice every ~17 seconds
     - fine gold dust, drifting upward, with a little parallax against the scroll
     - cinema finish: vignette, film grain, an almost imperceptible projector flicker
   It is kept dim on purpose so text on top always stays readable. Drawn at 30fps and paused while the tab is hidden.
   With prefers-reduced-motion (or no gsap) it is drawn once and never animates.
   If WebGL is unavailable the canvas is removed and the sections keep their original solid colours (html.bd is only set
   once the first frame is on screen).
   Test hook: window.dispatchEvent(new CustomEvent('fx:backdrop', { detail: 8 })) freezes it at t = 8 seconds. */

var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

var FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform float uDpr;
uniform float uMotion;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }

// Art Deco diamond lattice: double hairlines with a small lozenge at every crossing. p in CSS px.
float lattice(vec2 p, float size){
  vec2 q = p/size;
  vec2 g = vec2(q.x + q.y, q.x - q.y);
  vec2 e = 0.5 - abs(fract(g) - 0.5);                 // distance to the nearest line, in lattice units
  float w = 1.5/size;                                  // about one CSS pixel
  float l1 = 1.0 - smoothstep(w*0.5, w*1.3, min(e.x, e.y));
  float l2 = 1.0 - smoothstep(w*0.4, w*1.1, min(abs(e.x - 0.055), abs(e.y - 0.055)));
  float node = 1.0 - smoothstep(0.040, 0.068, e.x + e.y);
  return l1*0.62 + l2*0.26 + node;
}

// a few fine motes of gold dust per cell grid
float dust(vec2 p, float cell, float seed, float t){
  vec2 id = floor(p/cell); vec2 f = fract(p/cell);
  float h = hash(id + seed);
  vec2 o = vec2(hash(id + seed + 3.1), hash(id + seed + 7.7))*0.7 + 0.15;
  float d = length((f - o)*cell);
  float r = 0.8 + h*1.5;
  float tw = 0.5 + 0.5*sin(t*(0.5 + h*1.3) + h*50.0);
  return (1.0 - smoothstep(0.0, r, d))*tw*step(0.80, h);
}

void main(){
  vec2 vp = uRes/uDpr;                                  // viewport in CSS px
  vec2 sc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y)/uDpr;   // CSS px, y down
  float t = uTime*uMotion;
  vec3 night = vec3(0.039, 0.082, 0.071);
  vec3 emer  = vec3(0.059, 0.239, 0.200);
  vec3 gold  = vec3(0.894, 0.780, 0.470);
  vec3 pale  = vec3(1.000, 0.930, 0.720);

  // light-leak clouds
  float leak = fbm(sc*0.0016 + vec2(0.0, uScroll*0.00010) + vec2(t*0.004, -t*0.003));
  vec3 col = mix(night, emer, smoothstep(0.30, 0.85, leak)*0.55);
  col += gold*0.022*smoothstep(0.55, 0.90, fbm(sc*0.0021 + 7.0 + vec2(t*0.002, 0.0)));

  // gold-leaf shimmer band, gliding across on a long diagonal
  float diag = dot(sc, normalize(vec2(1.0, 0.55)));
  float ph = fract(t*0.058);
  float centre = mix(-320.0, (vp.x + vp.y)*0.92 + 320.0, ph);
  float band = exp(-pow((diag - centre)/250.0, 2.0))*uMotion;

  // lattice, with a gentle scroll parallax and slow variation in strength
  vec2 pl = vec2(sc.x, sc.y + uScroll*0.30);
  float lat = lattice(pl, 104.0);
  float vary = clamp(0.55 + 0.9*fbm(sc*0.0022 + 3.0), 0.0, 1.4);
  col += gold*lat*(0.050 + 0.24*band)*vary;

  // gold dust
  float dd = dust(vec2(sc.x, sc.y + uScroll*0.50 + t*14.0), 90.0, 1.0, t)*0.9
           + dust(vec2(sc.x + 40.0, sc.y + uScroll*0.80 + t*22.0), 150.0, 5.0, t)*0.7
           + dust(vec2(sc.x + 90.0, sc.y + uScroll*1.10 + t*30.0), 240.0, 9.0, t)*0.5;
  col += pale*dd*(0.30 + 0.70*band);

  // cinema finish
  vec2 uv = sc/vp;
  col *= 1.0 - 0.38*pow(length((uv - 0.5)*vec2(1.0, 0.9))*1.25, 2.0);
  col *= 1.0 + (hash(vec2(floor(t*12.0), 3.0)) - 0.5)*0.03*uMotion;
  col += (hash(gl_FragCoord.xy + floor(t*24.0)) - 0.5)*0.030;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

export function initBackdrop(G, opts) {
  var still = !!(opts && opts.still);
  var root = document.documentElement;
  var c = document.createElement('canvas');
  c.className = 'backdrop';
  c.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(c, document.body.firstChild);

  var gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) { c.remove(); return null; }

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn('[backdrop]', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  var pr = vs && fs && gl.createProgram();
  if (pr) { gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); }
  if (!pr || !gl.getProgramParameter(pr, gl.LINK_STATUS)) { c.remove(); return null; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uTime', 'uScroll', 'uDpr', 'uMotion'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

  var w = 2, h = 2, dpr = 1, frozen = null, t0 = performance.now(), last = 0, shown = false;

  function draw() {
    var t = frozen != null ? frozen : (still ? 8 : (performance.now() - t0) / 1000 + 8);
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uScroll, still ? 0 : (window.pageYOffset || 0));
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uMotion, (still || frozen != null) ? 0.0 : 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!shown) { shown = true; root.classList.add('bd'); }       // sections turn see-through once there is something behind them
  }
  function size() {
    var r = c.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(2, Math.round(r.width * dpr)); h = Math.max(2, Math.round(r.height * dpr));
    c.width = w; c.height = h; gl.viewport(0, 0, w, h);
    draw();
  }
  c.addEventListener('webglcontextlost', function (e) { e.preventDefault(); c.remove(); root.classList.remove('bd'); });
  if (window.ResizeObserver) new ResizeObserver(size).observe(c); else window.addEventListener('resize', size);
  size();

  window.addEventListener('fx:backdrop', function (e) { frozen = Number(e.detail) || 0; draw(); });

  if (!still) {
    G.ticker.add(function (time) {
      if (document.hidden || frozen != null || time - last < 1 / 30) return;
      last = time;
      draw();
    });
  }
  return { draw: draw };
}
