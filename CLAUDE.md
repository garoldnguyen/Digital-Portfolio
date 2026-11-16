# Project notes for Claude Code

Quân Nguyễn Minh's portfolio: a static site styled as a pixel-art desktop (each section opens as a window). Hosted on Firebase Hosting. How to build, run and deploy it is in `README.md`, under "Developer notes". Read that first.

## Ground rules

- Do not commit, push or deploy unless the user asks. The live site is built from `main`; the pixel desktop is developed on the `pixel-desktop` branch.
- The audience is recruiters plus the user's general personal brand. Content (career, research, honours, credentials, contact) is the user's real data: do not invent or reword claims.
- The user asks to be consulted before decisions about design direction. Propose options rather than rebuilding blind.

## Hard constraints

- **CSP is strict** (`firebase.json`): `style-src 'self'`, `img-src 'self'`, no inline `<script>`, no `style=""` attributes in HTML, no `data:` images. Styles go in `assets/css/pixel-desktop.css`; JS may set styles through the CSSOM (`el.style.top = …`, Web Animations API). Fonts are self-hosted.
- **The page must work without JavaScript.** `theme-init.js` adds the class `js` to `<html>`; only then does the layout become a fixed desktop. Without it, the sections stack as a normal page.
- **Pixel art stays crisp**: `image-rendering: pixelated`, sizes in whole multiples of the native size.
- Respect `prefers-reduced-motion` and touch: the glitch cursor (`src/pixel/glitch-cursor.js`, from `glitch-cursor-kit/`) hides the system arrow and draws a pixel arrow in a canvas; it keeps the system cursor over form fields and `[data-native-cursor]`, goes still for reduced motion, and also reacts to touch (the kit's own design).

## Layout of the code

- `index.html`: one `section.win` per window (profile, credentials, career, works, research, honours, expertise, contact), the icon grid and the taskbar. `404.html` reuses the same stylesheet.
- `src/pixel/`: `main.js` wires `router.js` (hash routes, `.is-open`, `aria-current`, title, focus), `theme.js`, `glitch-cursor.js` (the glitch cursor from `glitch-cursor-kit/`: a canvas layer with a pixel arrow, a glitch band on fast moves and corner pulses on click; two small edits to fit the CSP and to hide the system cursor on links, see the comment at the top of the file), `copy.js` (copy buttons + toast), `accordions.js` (`<details name>` fallback). Bundled by esbuild into `assets/js/pixel-desktop.js` (generated, committed).
- `assets/css/pixel-desktop.css`: lines 1 to ~21 are a generated `@font-face` block (`npm run fonts`); the rest is hand-written. Tokens for light and dark are at the top.
- Pixel sprites: `scripts/pixel-list.js` is the single list (name, size). `<img data-sprite="group/name">` shows a generated stand-in from `assets/pixel/_placeholder/` until `assets/pixel/group/name.png` exists; `scripts/pixel-assets.js` (run by `npm run assets` and `npm run build`) rewrites the `src` with a content hash and warns on a wrong size. Details in `assets/pixel/README.md`.
- `scripts/build.js`: bundle, swap sprites, stamp `?v=<hash>` on css/js in both pages.

## Known gaps (update when fixed)

- `assets/images/og-card.jpg` still shows the previous design.
- The phone layout (below 1100px, page scrolls, icon grid under the intro, no taskbar section buttons) is a first version.
- All 14 sprites are real art made by the user with Astra (delivered as `quan-pixel-assets/`, a leftover copy at the repo root, excluded from deploys in `firebase.json` and safe to delete). `glitch-cursor-kit/` (delivered 2026-11-16: the cursor code, a demo page and the arrow as PNGs) is also kept at the repo root and excluded from deploys; the site uses only the code, the arrow is drawn from a bitmap inside the JS, so the PNGs are not used. The earlier cursors (capybara, rainbow arrow) were removed. `assets/pixel/_placeholder/` holds stand-ins for any sprite that is missing.
