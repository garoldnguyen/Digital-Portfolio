# Nguyen Minh Quan (Garold Nguyễn)
### Security Architect, Associate @ NAB Innovation Centre Vietnam

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/quanng47/)
[![Email](https://img.shields.io/badge/Email-Contact_Me-EA4335?style=flat-square&logo=gmail)](mailto:garoldnguyen@gmail.com)
[![Location](https://img.shields.io/badge/Location-Ho_Chi_Minh_City,_VN-4285F4?style=flat-square&logo=google-maps)](https://goo.gl/maps/generic)

---

## Professional Profile

Passionate **Security Team Member** specializing in cybersecurity risk assessments, compliance frameworks, and infrastructure security. I combine technical expertise in **ISO 27001**, **PCI-DSS**, and **Cloud Security** with a strong commitment to leadership and mentoring.

*   **Current Role:** Driving security initiatives and compliance for the Business, Private & Digital Banking division at NAB.
*   **Mission:** Advancing cybersecurity standards, inspiring leadership, and creating global impact.
*   **Mentorship:** "Best Mentor" awardee for RMIT Emerging Leaders Project.

---

## Certifications & Awards

| Badge | Certification / Award | Date |
| :---: | :--- | :--- |
| ![Security+](https://img.shields.io/badge/CompTIA-Security+-red?style=flat-square) | **CompTIA Security+ (SY-701)** | Valid |
| ![ISC2](https://img.shields.io/badge/ISC2-SSCP-orange?style=flat-square) | **Systems Security Certified Practitioner (SSCP)** | Valid |
| ![ISC2](https://img.shields.io/badge/ISC2-CC-orange?style=flat-square) | **Certified in Cybersecurity (CC)** | Valid |
| | **Young Leader for Vietnam** (McKinsey & Co.) | Oct 2025 |
| | **VP Bank Tech Hackathon Finale** (AWS Cloud Security) | July 2025 |

---

## Technical Arsenal

**Security & Governance**
![ISO27001](https://img.shields.io/badge/Audit-ISO_27001-blue?style=flat-square)
![PCI-DSS](https://img.shields.io/badge/Compliance-PCI__DSS-blue?style=flat-square)
![NIST](https://img.shields.io/badge/Framework-NIST_CSF-blue?style=flat-square)
![STRIDE](https://img.shields.io/badge/Modeling-STRIDE-blue?style=flat-square)

**Infrastructure & Tools**
![AWS](https://img.shields.io/badge/Cloud-AWS-232F3E?style=flat-square&logo=amazon-aws)
![Azure](https://img.shields.io/badge/Cloud-Azure-0078D4?style=flat-square&logo=microsoft-azure)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)
![Python](https://img.shields.io/badge/Scripting-Python-3776AB?style=flat-square&logo=python)
![PowerShell](https://img.shields.io/badge/Scripting-PowerShell-5391FE?style=flat-square&logo=powershell)

---

## Featured Projects

A collection of personal projects focusing on utility, productivity, and entertainment.

| Project | Type | Description | Link |
| :--- | :--- | :--- | :---: |
| **Note Detector** | Music/AI | Real-time audio frequency analysis and pitch detection. | [Demo](https://music-note-detector.fly.dev/) |
| **Fokus** | Productivity | A Pomodoro timer designed for mental optimization. | [Demo](https://the-greatest-veigar-ever.github.io/fokus-pomodoro/) |
| **GameHub** | Gaming | WebRTC-based multiplayer gaming platform. | [Demo](https://the-greatest-veigar-ever.github.io/webrtc-game-hub/) |
| **Timezone Tracker** | Utility | Global time synchronization and visualization tool. | [Demo](https://the-greatest-veigar-ever.github.io/timezone-tracker/) |
| **Money Servant** | Utility | Currency management system (Archived). | [Repo](https://github.com/the-greatest-veigar-ever/money-servant.git) |
| **ASCII Image** | Graphics | Image-to-Text conversion algorithm for terminal art. | [Demo](https://the-greatest-veigar-ever.github.io/ascii-art-generator/) |

---

## Work Experience

#### **NAB Innovation Centre Vietnam** (2024 - Present)
**Security Architect, Associate**
*   Conducted security risk assessments for Enterprise Security Gateway migration.
*   Managed executive-approved risk deferrals, ensuring 100% compliance for customer-exposed assets.
*   Performed Cloud Service (SaaS) risk assessments and due diligence using STRIDE.

#### **ItechWX Limited Company** (2023 - 2024)
**Infrastructure Technical Support Engineer**
*   Supported Microsoft System Center Suite (SCOM, SCCM) for enterprise customers.
*   Deployed Windows Server 2016 and managed Active Directory environments.
*   Automated tasks using PowerShell and optimized SQL Server reporting.

---

© 2025 Nguyen Minh Quan (Garold Nguyễn). All rights reserved.

---

## Developer notes

How this site is built, run and deployed.

**What it is.** A static site that works like a pixel-art desktop: each desktop icon or taskbar button opens one section as a window (`#career`, `#works`, and so on) instead of scrolling a page. It is `index.html`, one stylesheet (`assets/css/pixel-desktop.css`) and one script bundle (`assets/js/pixel-desktop.js`) built from `src/pixel/` with esbuild. Without JavaScript the sections simply stack as a normal page. The fonts are self-hosted in `assets/fonts/`, so the only outside request a visitor's browser makes is Firebase Analytics (`assets/js/analytics.js`, which does nothing on localhost).

**Run it locally.**

```sh
npm install
npm run dev     # http://localhost:3000, rebuilds the bundle as you edit src/pixel/
```

**Build.** `npm run build` bundles `src/pixel/` into `assets/js/pixel-desktop.js`, swaps in any real pixel art (see below) and stamps `index.html` and `404.html` with a fingerprint of each file (`?v=<hash>`), so a changed file always gets a new address. It also runs by itself before every `firebase deploy` (the `predeploy` step in `firebase.json`), so a stale bundle can never go live. Commit the result: the files in the repo are exactly what gets deployed.

**Languages.** The site is in English (`/`) and Vietnamese (`/vi/`); the EN / VI button in the taskbar (and the START menu) switches and keeps the open window. `index.html` is the only page written by hand. `scripts/i18n.js` (run by `npm run build`, or on its own with `npm run i18n`) makes `vi/index.html` from it using the translation table `i18n/vi.json`: the English text of an element is the key, the Vietnamese text the value (`text`), plus `attrs` for aria-labels, alt text and meta tags, `keep` for text that stays as it is (names, product names, commands) and `js` for the few strings the scripts write at run time (read through `src/pixel/i18n.js`). After changing English text, run `node scripts/i18n.js --missing`: it lists the strings that no longer match, and until they are translated they simply stay English on `/vi/` (the build warns, it never fails). The terminal commands, the BIOS start-up log and the share card are English only.

**Motion.** All of it is native CSS/JS, no library, and only `opacity` and the individual `translate` / `scale` properties move (compositor only, so it stays smooth when the main thread is busy). Windows rise a few pixels and scale up from 96% as they fade in (ease-out, 0.22s) and leave faster (ease-in, 0.14s); the START menu does the same smaller (`@starting-style` for entering, `transition-behavior: allow-discrete` on `display` for leaving; the block "motion" at the end of `pixel-desktop.css`). Minimising flies a window down to its taskbar tab and restoring brings it back from there (`windows.js` sets `--fly-x/--fly-y/--fly-s/--dur` for the far end); maximise and restore glide with the Web Animations API (FLIP: the layout changes first, then the window scales from its old rectangle). Do not use `steps()` for these: a stepped 0.16s move is only four frames and reads as lag. `html.motion` is added by `main.js` after the first screen, so nothing animates on load. Page changes use View Transitions: `@view-transition { navigation: auto }` cross-fades EN and VI (Chrome and Safari 18.2+; Firefox just reloads), and on a phone `windows.js` wraps the app switch in `document.startViewTransition`. The taskbar has its own `view-transition-name`, so it stays put. The home window gets its final size in CSS (`#profile:not(.placed)`, container query units on `.stage`) so the first frame matches what `windows.js` computes and a page transition shows no jump. `speculation.json`, sent by the `Speculation-Rules` header on the pages (`firebase.json`), prefetches the other language when its button is hovered or pressed; it is an external file because the CSP forbids inline scripts, and prefetch (not prerender) so analytics never counts a page nobody opened. Under `prefers-reduced-motion` nothing slides, scales or flies; windows, the menu and page changes keep a 0.1s fade. Anything the browser cannot do falls back to an instant show/hide or a normal page load.

**Pixel art.** The 15 sprites (section icons including the terminal, project sprites, heart/sun/moon) are listed in `scripts/pixel-list.js` with their sizes. Every `<img data-sprite="group/name">` in the pages shows a generated stand-in from `assets/pixel/_placeholder/` until a real file exists at `assets/pixel/group/name.png`. To add art: put the PNG there (for example `assets/pixel/icons/career.png`), then run `npm run assets` (or `npm run build`). It prints which sprites are real, which are still stand-ins, and warns when a size is wrong. After changing the list, run `npm run placeholders` to redraw the stand-ins. See `assets/pixel/README.md`.

**Theme.** Light and dark live on `<html data-theme>`; the choice is saved in `localStorage` (`qn-theme`) and first comes from the system setting. `assets/js/theme-init.js` sets it before the page paints.

**Caching.** Pages are always re-checked. Scripts, styles and fonts are cached for a year (safe, because their address changes when their content does); images for a week. The rules are in `firebase.json`.

**Fonts.** Nunito (text) and Silkscreen (tiny window titles and labels), both SIL Open Font License, were copied from Google Fonts by `npm run fonts`, which also rewrites the `@font-face` block at the top of `assets/css/pixel-desktop.css`. Re-run it only if the font families or weights change, then `npm run build`.

**Deploy.** Preview first, then live (both need `firebase login`):

```sh
firebase hosting:channel:deploy my-preview --only quannguyen47 --expires 14d   # a temporary preview URL
firebase deploy --only hosting                                                  # live: quannguyen47.web.app and digital-portfolio-dc046.web.app
```

The deploy uploads about 30 files. If the tool reports hundreds, a hidden folder is being published: check the `ignore` list in `firebase.json`.

**Automatic deploys from GitHub (optional, currently off).** `.github/workflows/firebase-hosting.yml` deploys `main` to the live site as soon as the repository secret `FIREBASE_SERVICE_ACCOUNT_DIGITAL_PORTFOLIO_DC046` exists. Until then it finishes green with a notice and deploys stay manual. To switch it on:

1. Firebase console, then Project settings, then Service accounts, then **Generate new private key**. This downloads a JSON file.
2. GitHub, then this repository's Settings, then Secrets and variables, then Actions, then **New repository secret**. Name it `FIREBASE_SERVICE_ACCOUNT_DIGITAL_PORTFOLIO_DC046` and paste the whole contents of the JSON file.
3. Delete the downloaded JSON file. The key can deploy to your project, so keep it out of the repo and out of chats.

**Security headers.** `firebase.json` sets a Content-Security-Policy, HSTS and related headers on every response, and `security.txt` (served at `/.well-known/security.txt` through a rewrite) names the contact for security reports; renew its `Expires` date each year. If you add an external script, font, image host or API, add its address to the policy or the browser will block it. Inline `<script>` and `style=""` attributes are not allowed: put code in a file and styles in the stylesheet.

**Where things are.** Text and links: `index.html` (one `section.win` per window). The window manager (focus mode: opening a window minimises the others and they return when it closes, Shift+click opens next to the others; drag, resize, minimise, maximise, the `#hash` routes and the phone fallback to one window at a time): `src/pixel/windows.js`. The terminal (`terminal.exe`, answers are read from the page's own text, plus a small hidden challenge): `src/pixel/terminal.js`. The START menu (`startmenu.js`), keyboard shortcuts (`shortcuts.js`), the start-up screen and shut-down (`boot.js`, decided before first paint in `assets/js/theme-init.js`) and the 8-bit sound effects, off by default (`sfx.js`). The glitch cursor (replaces the mouse arrow with a pixel arrow that glitches on fast moves and sends out corner pulses on click; from `glitch-cursor-kit/`): `src/pixel/glitch-cursor.js`. Social share image: `assets/images/og-card.jpg` (1200x630), rendered from `scripts/og-card.html` by `npm run og` (needs Chrome; after changing it, ask LinkedIn and Facebook to re-scrape the link, they cache the old picture). Search files: `sitemap.xml` and `robots.txt`. The 404 page is `404.html`. The cursor is drawn in a canvas and never changes the page itself; form fields and anything marked `data-native-cursor` keep the system cursor, and with reduced motion the cursor stays still (no glitch, no pulses).
