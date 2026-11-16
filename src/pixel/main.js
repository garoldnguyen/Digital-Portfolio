/* Entry point: the pixel desktop. Everything is plain DOM code; the pages work without it (every window is a real
   section, every icon a real link), it only adds the window manager, the terminal, the START menu, the boot screen, the
   sound effects, the theme switch, the copy buttons and the glitch cursor. */
import { initWindows } from './windows.js';
import { initTheme } from './theme.js';
import { initSfx } from './sfx.js';
import { initTerminal } from './terminal.js';
import { initStartMenu } from './startmenu.js';
import { initShortcuts } from './shortcuts.js';
import { initBoot } from './boot.js';
import { installGlitchCursor } from './glitch-cursor.js';
import { initCopy } from './copy.js';
import { initAccordions } from './accordions.js';

const theme = initTheme();
const sfx = initSfx();
const ctl = { theme, sfx, boot: { shutdown() {} } };
const desk = initWindows({
  onOpen: () => sfx.play('open'),
  onClose: () => sfx.play('close'),
  onMinimise: () => sfx.play('min')
});
if (desk) {
  initTerminal(desk, ctl);
  initStartMenu(desk, ctl);
  initShortcuts(desk, ctl);
}
ctl.boot = initBoot(ctl);
installGlitchCursor(document.body);
initCopy();
initAccordions();
