const glitchCursorPalettes = {
  "light": {
    "k": "#3B2A3A",
    "p": "#FBF1E1",
    "m": "#E76F51",
    "a": "#3B2A3A",
    "x": "#1F6F68"
  },
  "dark": {
    "k": "#3B2A3A",
    "p": "#FBF1E1",
    "m": "#8FD3C8",
    "a": "#FBF1E1",
    "x": "#F08A6E"
  }
}

/* Use installGlitchCursor(element) to attach. Call the returned function to detach. */
function installGlitchCursor(target) {
  if (!(target instanceof HTMLElement)) throw new TypeError('Choose an HTML element')
  const sprite = [
    '.a...........', '.ka..........', '.kpa.........', '.kpma........',
    '.kppma.......', '.kppmka......', '.kppmaka.....', '.kppmmaka....',
    '.kppmmmaka...', '.kppmmmmpka..', '.kppmpppppka.', '.kppmaaaaaka.',
    '.kpkkma......', '.kka.kma.....', '.ka..kmmx....', '.....akmxa...',
    '......akxa...', '.......aa....'
  ]
  function bitmap(rows, colors) {
    const img = document.createElement('canvas')
    img.width = rows[0].length
    img.height = rows.length
    const brush = img.getContext('2d')
    rows.forEach((row,y) => Array.from(row).forEach((key,x) => {
      if (colors[key]) { brush.fillStyle = colors[key]; brush.fillRect(x,y,1,1) }
    }))
    return img
  }
  const arrows = Object.fromEntries(Object.entries(glitchCursorPalettes)
    .map(([theme, colors]) => [theme, bitmap(sprite, colors)]))
  const preferred = matchMedia('(prefers-color-scheme: dark)')
  let colors, arrow
  function syncTheme() {
    let theme
    for (let el=target; el && !theme; el=el.parentElement) {
      for (const attr of ['data-cursor-theme','data-theme','data-bs-theme']) {
        const value=el.getAttribute(attr)
        if (value==='dark' || value==='light') {theme=value;break}
      }
      if (!theme && (el.classList.contains('dark') || el.classList.contains('theme-dark'))) theme='dark'
      if (!theme && (el.classList.contains('light') || el.classList.contains('theme-light'))) theme='light'
    }
    theme ||= preferred.matches ? 'dark' : 'light'
    arrow=arrows[theme]; colors=glitchCursorPalettes[theme]
    schedule()
  }

  const layer = document.createElement('canvas')
  layer.setAttribute('aria-hidden','true')
  layer.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483646'
  document.body.append(layer)
  const ctx = layer.getContext('2d')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const controller = new AbortController()
  const listen = (el,type,fn) => el.addEventListener(type,fn,{passive:true,signal:controller.signal})
  const previous = target.style.cursor
  const pulses = []
  let point = null, raf = 0, speed = 0, lastPulse = -Infinity
  const unit = 2
  function schedule() { if (!raf) raf = requestAnimationFrame(paint) }
  function size() {
    const ratio = Math.min(devicePixelRatio || 1, 2)
    layer.width = Math.round(innerWidth * ratio); layer.height = Math.round(innerHeight * ratio)
    ctx.setTransform(ratio,0,0,ratio,0,0)
    ctx.imageSmoothingEnabled = false
    schedule()
  }
  function clear() {
    point = null; speed = 0; pulses.length = 0
    target.style.cursor = previous; schedule()
  }
  function enter(e) {
    if (!e.isPrimary) return
    if (e.target.closest?.('input,textarea,select,[contenteditable="true"],[data-native-cursor]')) { clear(); return }
    const now = performance.now()
    const x = e.clientX, y = e.clientY
    if (point && !reduced.matches) {
      const dx=x-point.x, dy=y-point.y, dist=Math.hypot(dx,dy)
      if (dist>=.5) {
        const dt=Math.min(60, Math.max(1,now-point.t))
        if (now-point.t>300) speed=0
        const measured=Math.min(3, dist/Math.max(4,dt))
        speed+=(measured-speed)*(1-Math.exp(-dt/24))
      }
    }
    point={x,y,t:now,touch:e.pointerType==='touch'}
    target.style.cursor='none'; schedule()
  }
  function pulse(e) {
    if(!e.isPrimary || e.button!==0) return
    enter(e)
    if(!point || reduced.matches) return
    lastPulse=performance.now()
    pulses.push({x:point.x,y:point.y,t:lastPulse})
    if(pulses.length>5) pulses.shift()
    schedule()
  }
  function release(e) {
    if(e.pointerType==='touch') {point=null;target.style.cursor=previous;schedule()}
  }
  function paint(now) {
    raf=0
    ctx.clearRect(0,0,innerWidth,innerHeight)
    const area=target===document.body?{left:0,top:0,width:innerWidth,height:innerHeight}:target.getBoundingClientRect()
    ctx.save(); ctx.beginPath();ctx.rect(area.left,area.top,area.width,area.height);ctx.clip()
    for(let i=pulses.length-1;i>=0;i--) {
      const p=pulses[i], t=Math.max(0,(now-p.t)/350)
      if(t>=1){pulses.splice(i,1);continue}
      const r=Math.round(5+32*(1-(1-t)**2)), len=3+Math.round(5*(1-t))
      ctx.globalAlpha=1-t
      for(const sx of [-1,1])for(const sy of [-1,1]) {
        ctx.fillStyle=sx===sy?colors.m:colors.x
        const x=Math.round(p.x)+sx*r, y=Math.round(p.y)+sy*r
        ctx.fillRect(x,y,-sx*len,sy*2);ctx.fillRect(x,y,sx*2,-sy*len)
      }
      ctx.globalAlpha=1
    }
    let glitch=false
    if(point) {
      const x=Math.round(point.x)-unit,y=Math.round(point.y)-unit
      glitch=!reduced.matches && ((now-lastPulse<145) || (speed>.8 && now-point.t<70))
      ctx.drawImage(arrow,x,y,13*unit,18*unit)
      if(glitch) {
        const yBand=6+Math.floor(Math.max(0,now)/35)%6
        ctx.globalAlpha=.8
        ctx.drawImage(arrow,0,yBand,13,2,x+4,y+yBand*unit,26,4)
        ctx.fillStyle=colors.x;ctx.fillRect(x-2,y+(yBand+2)*unit,5,2)
        ctx.globalAlpha=1
      }
    }
    ctx.restore()
    if(pulses.length || glitch) schedule()
  }
  listen(target,'pointermove',enter);listen(target,'pointerenter',enter)
  listen(target,'pointerdown',pulse);listen(target,'pointerleave',clear)
  listen(window,'pointerup',release);listen(window,'pointercancel',clear);listen(window,'blur',clear)
  listen(window,'scroll',clear);listen(window,'resize',size);listen(reduced,'change',clear)
  listen(document,'visibilitychange',clear)
  const observer=new MutationObserver(syncTheme)
  for(let el=target;el;el=el.parentElement) {
    observer.observe(el,{attributes:true,attributeFilter:['class','data-theme','data-cursor-theme','data-bs-theme']})
  }
  listen(preferred,'change',syncTheme)
  syncTheme()
  size()
  return () => {
    observer.disconnect();controller.abort();cancelAnimationFrame(raf);layer.remove();target.style.cursor=previous
  }
}
