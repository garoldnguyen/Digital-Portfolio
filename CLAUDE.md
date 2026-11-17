# Project notes for Claude Code

Quân Nguyễn Minh's portfolio: a static site styled as a pixel-art desktop (each section opens as a window). Hosted on Firebase Hosting. How to build, run and deploy it is in `README.md`, under "Developer notes". Read that first.

## Ground rules

- Do not commit, push or deploy unless the user asks. The live site is built from `main`. The pixel desktop was merged into `main` and deployed on 2026-11-16 (PR #1); the `pixel-desktop` branch is kept but is no longer where work happens. Deploys are done by hand (`firebase deploy --only hosting`, see README) because the GitHub workflow has no Firebase secret yet. Work on a branch, check it on a preview channel, and merge to `main` only when the user says so.
- The audience is recruiters plus the user's general personal brand. Content (career, research, honours, credentials, contact) is the user's real data: do not invent or reword claims.
- The user asks to be consulted before decisions about design direction. Propose options rather than rebuilding blind.

## Hard constraints

- **CSP is strict** (`firebase.json`): `style-src 'self'`, `img-src 'self'`, no inline `<script>`, no `style=""` attributes in HTML, no `data:` images. Styles go in `assets/css/pixel-desktop.css`; JS may set styles through the CSSOM (`el.style.top = …`, Web Animations API). Fonts are self-hosted.
- **The page must work without JavaScript.** `theme-init.js` adds the class `js` to `<html>`; only then does the layout become a fixed desktop. Without it, the sections stack as a normal page.
- **Pixel art stays crisp**: `image-rendering: pixelated`, sizes in whole multiples of the native size.
- **Motion is native and compositor-only**: animate `opacity` and the individual `translate`/`scale` properties, never `top`/`left`/`width`. Nothing may animate on load (`html.motion` gates it), a window's stored size must be read with `offsetWidth`/`offsetHeight` (a rectangle includes the scale of an opening animation), and every effect needs a reduced-motion answer (a 0.1s fade, no movement) and a no-support fallback (instant). Details in `README.md`, "Motion".
- Respect `prefers-reduced-motion` and touch: the glitch cursor (`src/pixel/glitch-cursor.js`, from `glitch-cursor-kit/`) hides the system arrow and draws a pixel arrow in a canvas; it keeps the system cursor over form fields and `[data-native-cursor]`, goes still for reduced motion, and also reacts to touch (the kit's own design).

## Layout of the code

- `index.html`: one `section.win` per window (profile, credentials, career, works, research, honours, expertise, contact, plus the JS-only terminal and shortcuts windows), the icon grid, the taskbar, the START menu and the boot overlay. `404.html` reuses the same stylesheet.
- Two languages: `index.html` (English) is the only hand-written page; `scripts/i18n.js` builds `vi/index.html` (generated, committed) from it and `i18n/vi.json` on every `npm run build`. Never edit `vi/index.html`: change `index.html` and the table. The Vietnamese text is a faithful translation of the user's own claims, written impersonally like the English; ask the user before rewording any of it. `src/pixel/i18n.js` gives the scripts `t(key, english)` for run-time strings.
- `src/pixel/`: `main.js` wires `windows.js` (window manager: several windows at once, drag/resize/minimise/maximise, hash routes, one-window phone mode), `terminal.js`, `startmenu.js`, `shortcuts.js`, `boot.js` (start-up screen, shut-down), `sfx.js` (8-bit sounds, off by default), `theme.js`, `glitch-cursor.js` (the glitch cursor from `glitch-cursor-kit/`: a canvas layer with a pixel arrow, a glitch band on fast moves and corner pulses on click; two small edits to fit the CSP and to hide the system cursor on links, see the comment at the top of the file), `copy.js` (copy buttons + toast), `accordions.js` (`<details name>` fallback). Bundled by esbuild into `assets/js/pixel-desktop.js` (generated, committed).
- `assets/css/pixel-desktop.css`: lines 1 to ~21 are a generated `@font-face` block (`npm run fonts`); the rest is hand-written. Tokens for light and dark are at the top.
- Pixel sprites: `scripts/pixel-list.js` is the single list (name, size). `<img data-sprite="group/name">` shows a generated stand-in from `assets/pixel/_placeholder/` until `assets/pixel/group/name.png` exists; `scripts/pixel-assets.js` (run by `npm run assets` and `npm run build`) rewrites the `src` with a content hash and warns on a wrong size. Details in `assets/pixel/README.md`.
- `scripts/build.js`: bundle, swap sprites, stamp `?v=<hash>` on css/js in both pages.

## Known gaps (update when fixed)

- The Vietnamese translation (`i18n/vi.json`, first draft written 2026-11-16) has not been read through by the user yet. Not translated on purpose: skill names, job titles, company and certificate names, the paper's title and keywords, the terminal and BIOS log (English), `assets/docs/Quan - CV.pdf` and the share card (`og-card.jpg`, English text). Numbers keep the English decimal point (99.57%) so they match the metric tiles.
- The phone layout (below 1100px: one window at a time, home screen = intro + app grid, a fixed bottom bar that swipes sideways with START pinned left and one tab per window, sticky title bar with a large close button) was tested in a desktop browser at narrow widths, and the user looked at the preview once on an iPhone (2026-11-16, no problems reported except the missing always-visible switcher, which the bottom bar now provides). The bar itself is not yet confirmed on a real phone.
- Dragging windows has no keyboard equivalent (maximise, minimise and close are buttons and shortcuts).
- 14 of 15 sprites are real art (`icons/terminal` is still a stand-in drawn by `scripts/make-placeholders.js`; its Astra prompt is 24 in `../portfolio-astra-prompts.md`) made by the user with Astra (delivered as `quan-pixel-assets/`, a leftover copy at the repo root, excluded from deploys in `firebase.json` and safe to delete). `glitch-cursor-kit/` (delivered 2026-11-16: the cursor code, a demo page and the arrow as PNGs) is also kept at the repo root and excluded from deploys; the site uses only the code, the arrow is drawn from a bitmap inside the JS, so the PNGs are not used. The earlier cursors (capybara, rainbow arrow) were removed. `assets/pixel/_placeholder/` holds stand-ins for any sprite that is missing.
