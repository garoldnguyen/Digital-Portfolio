/* Entry point: the pixel desktop. Everything is plain DOM code; the pages work without it (every window is a real
   section, every icon a real link), it only adds the "one window at a time" behaviour, the theme switch, the copy
   buttons and the glitch cursor. */
import { initRouter } from './router.js';
import { initTheme } from './theme.js';
import { installGlitchCursor } from './glitch-cursor.js';
import { initCopy } from './copy.js';
import { initAccordions } from './accordions.js';

initTheme();
initRouter();
installGlitchCursor(document.body);
initCopy();
initAccordions();
