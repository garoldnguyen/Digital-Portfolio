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

**What it is.** A static site: `index.html`, one stylesheet (`assets/css/golden-age.css`) and one script bundle (`assets/js/golden-age.js`). The bundle is built from `src/` with esbuild; gsap and lenis are bundled in. The fonts are self-hosted in `assets/fonts/`, so the only outside request a visitor's browser makes is Firebase Analytics (`assets/js/analytics.js`, which does nothing on localhost).

**Run it locally.**

```sh
npm install
npm run dev     # http://localhost:3000, rebuilds the bundle as you edit src/
```

**Build.** `npm run build` bundles `src/` into `assets/js/golden-age.js` and stamps `index.html` and `404.html` with a fingerprint of each file (`?v=<hash>`), so a changed file always gets a new address. It also runs by itself before every `firebase deploy` (the `predeploy` step in `firebase.json`), so a stale bundle can never go live. Commit the result: the files in the repo are exactly what gets deployed.

**Caching.** Pages are always re-checked. Scripts, styles and fonts are cached for a year (safe, because their address changes when their content does); images for a week. The rules are in `firebase.json`.

**Fonts.** Cormorant, Josefin Sans and Lexend (SIL Open Font License) were copied from Google Fonts by `node scripts/fonts.js`; re-run it only if the font families or weights change, then `npm run build`.

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

**Security headers.** `firebase.json` sets a Content-Security-Policy and related headers on every response. If you add an external script, font, image host or API, add its address to the policy or the browser will block it. Inline `<script>` and `style=""` attributes are not allowed: put code in a file and styles in the stylesheet.

**Where things are.** Text and links: `index.html`. Section titles that swap to another word before returning (`data-alt`): `index.html` and `src/glitch.js`. Social share image: `assets/images/og-card.jpg` (1200x630). Search files: `sitemap.xml` and `robots.txt`. The 404 page is `404.html`. Effects switch themselves off for visitors who prefer reduced motion.
