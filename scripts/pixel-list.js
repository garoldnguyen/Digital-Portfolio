/* The pixel sprites the site uses: the name is the file path under assets/pixel/ (without .png) and the native size.
   Used by scripts/make-placeholders.js (draws a stand-in for each) and scripts/pixel-assets.js (swaps in the real file
   when one exists and warns when its size differs). To add a sprite: add it here, add an <img data-sprite="name"> in
   index.html, then run `node scripts/make-placeholders.js` and `npm run assets`. */
module.exports = [
  { name: 'icons/profile', w: 32, h: 32 },
  { name: 'icons/credentials', w: 32, h: 32 },
  { name: 'icons/career', w: 32, h: 32 },
  { name: 'icons/works', w: 32, h: 32 },
  { name: 'icons/research', w: 32, h: 32 },
  { name: 'icons/honours', w: 32, h: 32 },
  { name: 'icons/expertise', w: 32, h: 32 },
  { name: 'icons/contact', w: 32, h: 32 },
  { name: 'works/music', w: 32, h: 32 },
  { name: 'works/timer', w: 32, h: 32 },
  { name: 'works/gomoku', w: 32, h: 32 },
  { name: 'ui/heart', w: 16, h: 16 },
  { name: 'ui/sun', w: 16, h: 16 },
  { name: 'ui/moon', w: 16, h: 16 }
];
