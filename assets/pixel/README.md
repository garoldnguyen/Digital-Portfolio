# Pixel art for the portfolio

Put the finished PNG for each sprite at `assets/pixel/<group>/<name>.png`, then run `npm run assets` (or `npm run build`). Until a file exists, the site shows a generated stand-in from `_placeholder/`.

| File | Size |
| --- | --- |
| `icons/profile.png`, `icons/credentials.png`, `icons/career.png`, `icons/works.png`, `icons/research.png`, `icons/honours.png`, `icons/expertise.png`, `icons/contact.png`, `icons/terminal.png` | 32×32 |
| `works/music.png`, `works/timer.png`, `works/gomoku.png` | 32×32 |
| `ui/heart.png`, `ui/sun.png`, `ui/moon.png` | 16×16 |

- Transparent background, no anti-aliased soft edges, exactly the size above (the page scales them 2× or 3× with `image-rendering: pixelated`).
- `npm run assets` lists each sprite as `REAL` or `placeholder` and warns when a real file's size differs from the table (it is still used).
- The list of names and sizes is `scripts/pixel-list.js`. To add a sprite, add it there, add an `<img data-sprite="group/name">` in `index.html`, then run `npm run placeholders` and `npm run assets`.
- The generation prompts are kept outside the repo, in `portfolio-astra-prompts.md`.
- The mouse cursor is not a sprite file: `src/pixel/glitch-cursor.js` draws it from a bitmap written in the code (the kit's PNGs of it are not used by the site).
