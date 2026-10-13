
/* 
 * Portfolio Main Script
 * Author: Nguyen Minh Quan
 * Last Updated: 2026
 */

/* =========================================
   0. Preloader
   ========================================= */
(function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN_DISPLAY_MS = prefersReducedMotion ? 0 : 500;
    const MAX_WAIT_MS = 3000;
    const start = Date.now();
    let hidden = false;

    document.body.style.overflow = 'hidden';

    function hidePreloader() {
        if (hidden) return;
        hidden = true;
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => {
            preloader.classList.add('preloader-hidden');
            document.body.style.overflow = '';
            setTimeout(() => preloader.remove(), 600);
        }, wait);
    }

    window.addEventListener('load', hidePreloader);
    setTimeout(hidePreloader, MAX_WAIT_MS);
})();

/* =========================================
   1. Theme Manager
   ========================================= */
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme();
        this.bindToggleButton();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateToggleIcon();
        // Trigger resize for canvas redraws when theme changes
        window.dispatchEvent(new Event('resize'));
    }

    updateToggleIcon() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            const icon = toggleButton.querySelector('i');
            if (this.theme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();

        // Add a subtle animation effect
        document.body.style.transition = 'background-color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    bindToggleButton() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleTheme());
        }
    }
}

/* =========================================
   2. Mobile Navigation
   ========================================= */
class MobileNav {
    constructor() {
        this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        this.navMenu = document.querySelector('.navbar');
        this.overlay = document.getElementById('mobile-menu-overlay');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.isOpen = false;
        this.init();
    }

    init() {
        if (this.mobileMenuToggle && this.navMenu && this.overlay) {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Toggle button click
        this.mobileMenuToggle.addEventListener('click', () => this.toggleMenu());

        // Overlay click to close
        this.overlay.addEventListener('click', () => this.closeMenu());

        // Close menu when nav link is clicked
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Close menu when window is resized to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isOpen = true;
        this.mobileMenuToggle.classList.add('active');
        this.navMenu.classList.add('active');
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    closeMenu() {
        this.isOpen = false;
        this.mobileMenuToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

/* =========================================
   3. UI Animations (TypeWriter, Staggered)
   ========================================= */
// TypeWriter class removed - now using GSAP TextPlugin

/* =========================================
   4. Cyber Network Visuals
   ========================================= */
class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseVx = (Math.random() - 0.5) * 1.5;
        this.baseVy = (Math.random() - 0.5) * 1.5;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.size = Math.random() * 2.5 + 0.5;
        this.parallaxFactor = this.size * 0.3;
        this.pulse = 0;
        this.tagText = '';
        this.tagUntil = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Friction to return to base velocity
        this.vx += (this.baseVx - this.vx) * 0.04;
        this.vy += (this.baseVy - this.vy) * 0.04;

        // Bounce off edges
        if (this.x < 0 || this.x > this.canvas.width) {
            this.baseVx *= -1;
            this.vx *= -1;
            this.x = Math.max(0, Math.min(this.canvas.width, this.x));
        }
        if (this.y < 0 || this.y > this.canvas.height) {
            this.baseVy *= -1;
            this.vy *= -1;
            this.y = Math.max(0, Math.min(this.canvas.height, this.y));
        }
    }

    draw(ctx, mouseX, mouseY) {
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const glowColor = isDark ? '27, 218, 122' : '0, 150, 0';

        let drawX = this.x;
        let drawY = this.y;

        // Parallax Offset
        if (mouseX !== null && mouseY !== null) {
            let pOffsetX = (mouseX - window.innerWidth / 2) * 0.05 * this.parallaxFactor;
            let pOffsetY = (mouseY - window.innerHeight / 2) * 0.05 * this.parallaxFactor;
            drawX -= pOffsetX;
            drawY -= pOffsetY;
        }

        const baseAlpha = 0.28 + this.size * 0.07;

        if (this.pulse > 0.05) {
            // Scan pulse: node is "detected" - brighter, larger, with a soft glow
            const litSize = this.size * (1 + this.pulse * 1.8);
            const litAlpha = Math.min(1, baseAlpha + this.pulse * 0.7);
            ctx.save();
            ctx.shadowColor = `rgba(${glowColor}, ${this.pulse})`;
            ctx.shadowBlur = 10 * this.pulse;
            ctx.fillStyle = `rgba(${glowColor}, ${litAlpha})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, litSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = `rgba(${glowColor}, ${baseAlpha})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Brief scan-result tag on the node a ping originated from
        if (this.tagUntil > performance.now()) {
            const remaining = (this.tagUntil - performance.now()) / 700;
            ctx.save();
            ctx.font = '10px "Source Code Pro", monospace';
            ctx.fillStyle = `rgba(${glowColor}, ${Math.max(0, remaining)})`;
            ctx.fillText(this.tagText, drawX + 10, drawY - 10);
            ctx.restore();
        }

        return {x: drawX, y: drawY};
    }
}

class NetworkAnimation {
    constructor() {
        this.canvas = document.getElementById('network-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.particleCount = window.innerWidth < 768 ? 60 : 130;
        this.time = 0;

        // Scan propagation tuning: hovering near a node "pings" it, and the
        // ping ripples outward across connected edges, fading with each hop.
        this.HOVER_RADIUS = 55;
        this.PING_COOLDOWN = 450;
        this.PROPAGATION_FACTOR = 0.6;
        this.PULSE_DECAY = 0.93;
        this.lastPingTime = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        document.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // Click Shockwave
        document.addEventListener('click', (e) => {
            if (window.scrollY > this.canvas.height) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.triggerShockwave(
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            );
        });

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas));
        }

        gsap.ticker.add(() => this.animate());
    }

    triggerShockwave(x, y) {
        this.particles.forEach(p => {
            let dx = p.x - x;
            let dy = p.y - y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 300) {
                let force = (300 - distance) / 300;
                gsap.to(p, {
                    vx: p.baseVx + (dx / distance) * force * 20,
                    vy: p.baseVy + (dy / distance) * force * 20,
                    duration: 0.6,
                    ease: "power2.out"
                });
            }
        });
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
    }

    /* ---- Scan Propagation: hovering near a node seeds a ping ---- */
    triggerScan(positions) {
        if (this.mouse.x === null || this.mouse.y === null) return;
        if (window.scrollY > this.canvas.height) return;
        if (performance.now() - this.lastPingTime < this.PING_COOLDOWN) return;

        let nearestIndex = -1;
        let nearestDist = this.HOVER_RADIUS;

        positions.forEach((pos, i) => {
            const dx = pos.x - this.mouse.x;
            const dy = pos.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIndex = i;
            }
        });

        if (nearestIndex !== -1 && this.particles[nearestIndex].pulse < 0.3) {
            const node = this.particles[nearestIndex];
            node.pulse = 1;
            node.tagText = '0x' + Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
            node.tagUntil = performance.now() + 700;
            this.lastPingTime = performance.now();
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time += 0.015;

        // Decay every node's pulse before this frame's propagation
        this.particles.forEach(p => {
            p.pulse *= this.PULSE_DECAY;
            if (p.pulse < 0.02) p.pulse = 0;
        });

        let drawnPositions = [];

        this.particles.forEach(particle => {
            particle.update();
            let pos = particle.draw(this.ctx, this.mouse.x, this.mouse.y);
            drawnPositions.push(pos);
        });

        this.triggerScan(drawnPositions);
        this.connect(drawnPositions);
    }

    connect(positions) {
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const glowColor = isDark ? '27, 218, 122' : '0, 150, 0';
        const snapshotPulses = this.particles.map(p => p.pulse);

        for (let a = 0; a < positions.length; a++) {
            for (let b = a + 1; b < positions.length; b++) {
                let dx = positions[a].x - positions[b].x;
                let dy = positions[a].y - positions[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    const edgeFalloff = 1 - (distance / 120);

                    // Propagate the scan pulse outward across this edge
                    if (snapshotPulses[a] > 0.05) {
                        this.particles[b].pulse = Math.max(this.particles[b].pulse, snapshotPulses[a] * this.PROPAGATION_FACTOR * edgeFalloff);
                    }
                    if (snapshotPulses[b] > 0.05) {
                        this.particles[a].pulse = Math.max(this.particles[a].pulse, snapshotPulses[b] * this.PROPAGATION_FACTOR * edgeFalloff);
                    }

                    const edgeBoost = Math.max(snapshotPulses[a], snapshotPulses[b]);
                    this.ctx.strokeStyle = isDark
                        ? `rgba(${glowColor}, ${edgeFalloff * 0.16 + edgeBoost * 0.5})`
                        : `rgba(${glowColor}, ${edgeFalloff * 0.1 + edgeBoost * 0.4})`;
                    this.ctx.lineWidth = 1 + edgeBoost * 1.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(positions[a].x, positions[a].y);
                    this.ctx.lineTo(positions[b].x, positions[b].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

/* =========================================
   5. Interactive Features (Hacker Mode)
   ========================================= */
class HackerMode {
    constructor() {
        this.secret = 'hack';
        this.input = '';
        this.timer = null;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            this.input += e.key.toLowerCase();

            // Clear input if no key pressed for 1 second (resets detection)
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.input = '';
            }, 1000);

            // Check match
            if (this.input.includes(this.secret)) {
                this.activate();
                this.input = '';
            }
        });
    }

    activate() {
        const body = document.body;
        const overlay = document.getElementById('access-granted');

        // Toggle Mode
        if (body.classList.contains('hacker-mode')) {
            body.classList.remove('hacker-mode');
        } else {
            body.classList.add('hacker-mode');

            // Show Overlay
            if (overlay) {
                overlay.classList.add('show');
                setTimeout(() => {
                    overlay.classList.remove('show');
                }, 2000);
            }

            console.log("%c SYSTEM OVERRIDE INITIATED... WELCOME, ADMIN. ", "background: #000; color: #0f0; font-size: 20px; font-weight: bold;");
        }
    }
}

/* =========================================
   6. Experience Accordion
   ========================================= */
function initExperienceAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        // Click handler
        header.addEventListener('click', () => toggleAccordion(header));

        // Keyboard accessibility (Enter/Space)
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAccordion(header);
            }
        });
    });

    function toggleAccordion(header) {
        const item = header.closest('.accordion-item');
        const content = item.querySelector('.accordion-content');
        const isActive = item.classList.contains('active');

        // Close all other accordions smoothly
        document.querySelectorAll('.accordion-item').forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-header').setAttribute('aria-expanded', false);
                if (typeof gsap !== 'undefined') {
                    gsap.to(otherItem.querySelector('.accordion-content'), {height: 0, opacity: 0, duration: 0.3, ease: "power2.out"});
                }
            }
        });

        if (isActive) {
            item.classList.remove('active');
            header.setAttribute('aria-expanded', false);
            if (typeof gsap !== 'undefined') {
                gsap.to(content, {height: 0, opacity: 0, duration: 0.3, ease: "power2.out"});
            }
        } else {
            item.classList.add('active');
            header.setAttribute('aria-expanded', true);
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(content, {height: 0, opacity: 0}, {height: "auto", opacity: 1, duration: 0.4, ease: "power2.out"});
            }
        }
    }
}

/* =========================================
   8. Main Initialization
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP Plugins & Hero Entrance
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger, TextPlugin);
        
        // Hero Entrance Timeline
        const heroTl = gsap.timeline();
        heroTl.fromTo('.navbar', { x: -250, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" })
              .fromTo('.nav-link', { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, stagger: 0.1, ease: "power2.out", clearProps: "transform,opacity,visibility" }, "-=0.4")
              .fromTo('.hero-content h1', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "back.out(1.5)" }, "-=0.4")
              .fromTo('.hero-content .nickname', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" }, "-=0.6")
              .fromTo('.hero-content h2:not(.nickname)', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.2, ease: "power3.out" }, "-=0.2")
              .fromTo('.hero-content p', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" }, "-=0.2")
              .fromTo('.hero-buttons .btn', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.2, ease: "back.out(1.5)" }, "-=0.4");
              
        // Hero Parallax Scrub
        gsap.to('.hero-content', {
            yPercent: 30,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
        
        gsap.to('#network-canvas', {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
              
        // Magnetic Buttons
        const magneticElements = document.querySelectorAll('.social-link');
        magneticElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
            });
        });
    }

    // 1. Initialize Theme
    const themeManager = new ThemeManager();

    // 2. Initialize Navigation
    const mobileNav = new MobileNav();

    // Terminal Window Tabs (ARIA tabs pattern: click + arrow-key navigation)
    // Wired unconditionally so category switching works even if GSAP fails to load.
    // Shared by every .terminal-window instance on the page (Skills, Certificates, ...).
    const terminalWindows = Array.from(document.querySelectorAll('.terminal-window'));
    const revealPanelLines = (panel) => {
        const lines = panel.querySelectorAll('li');
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(lines,
                { x: -8, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }
            );
        } else {
            lines.forEach(line => { line.style.opacity = '1'; line.style.transform = 'none'; });
        }
    };

    terminalWindows.forEach(terminalEl => {
        const tabs = Array.from(terminalEl.querySelectorAll('.terminal-tab'));
        const panels = Array.from(terminalEl.querySelectorAll('.terminal-panel'));

        const activateTab = (tab) => {
            tabs.forEach(t => {
                const isActive = t === tab;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-selected', isActive ? 'true' : 'false');
                t.tabIndex = isActive ? 0 : -1;
            });
            panels.forEach(panel => {
                const isActive = panel.id === tab.getAttribute('data-target');
                panel.classList.toggle('active', isActive);
                panel.hidden = !isActive;
                if (isActive) revealPanelLines(panel);
            });
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activateTab(tab));
            tab.addEventListener('keydown', (e) => {
                let newIndex = null;
                if (e.key === 'ArrowRight') newIndex = (index + 1) % tabs.length;
                if (e.key === 'ArrowLeft') newIndex = (index - 1 + tabs.length) % tabs.length;
                if (newIndex !== null) {
                    e.preventDefault();
                    tabs[newIndex].focus();
                    activateTab(tabs[newIndex]);
                }
            });
        });
    });

    // 3. Advanced GSAP Animations (Premium Effects)
    if (typeof gsap !== 'undefined') {
        // A. General fade-in for standard elements
        const animateElements = gsap.utils.toArray('.accordion-item');
        animateElements.forEach((el) => {
            gsap.fromTo(el,
                { y: 30, opacity: 0 },
                {
                    scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
                    y: 0, opacity: 1, duration: 0.6, ease: "power2.out"
                }
            );
        });

        // Advanced Image Reveal (About Section)
        const aboutImages = document.querySelectorAll('.profile-image');
        if (aboutImages.length > 0) {
            gsap.fromTo(aboutImages, 
                { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", scale: 1.1 },
                { 
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", 
                    scale: 1,
                    duration: 1.2, 
                    ease: "power3.inOut",
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: ".about-images",
                        start: "top 80%"
                    }
                }
            );
        }

        // B. Staggered Entrance for Certificates
        gsap.fromTo('.cert-card',
            { y: 40, opacity: 0 },
            {
                scrollTrigger: { trigger: '.cert-grid', start: "top 85%" },
                y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "power2.out"
            }
        );

        // Research Dossier Entrance
        if (document.querySelector('.research-dossier')) {
            gsap.fromTo('.research-dossier',
                { y: 35, opacity: 0 },
                {
                    scrollTrigger: { trigger: '#research', start: "top 85%" },
                    y: 0, opacity: 1, duration: 0.8, ease: "power3.out"
                }
            );
            gsap.fromTo('.mechanism-item',
                { y: 15, opacity: 0 },
                {
                    scrollTrigger: { trigger: '.mechanism-list', start: "top 90%" },
                    y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "power2.out"
                }
            );
        }

        // C. Number Counter & Dynamic Entrance for About Stats
        const statsContainers = document.querySelectorAll('.stat');
        gsap.fromTo(statsContainers,
            { y: 30, opacity: 0 },
            { scrollTrigger: { trigger: '.about-stats', start: "top 90%" }, y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "power2.out" }
        );

        const numbers = document.querySelectorAll('.stat h3');
        numbers.forEach(num => {
            const text = num.innerText;
            if (text.includes('+')) {
                const target = parseInt(text);
                // Reset text to 0 initially
                num.innerText = '0+';
                gsap.to(num, {
                    scrollTrigger: { trigger: num, start: "top 90%" },
                    innerText: target,
                    duration: 2.5,
                    ease: "power3.out",
                    snap: { innerText: 1 },
                    onUpdate: function() { num.innerText = this.targets()[0].innerText + '+'; }
                });
            } else {
                gsap.fromTo(num, { opacity: 0, filter: "blur(5px)" }, {
                    scrollTrigger: { trigger: num, start: "top 90%" },
                    opacity: 1, filter: "blur(0px)", duration: 1.5, delay: 0.3, ease: "power2.out"
                });
            }
        });

        // E. Terminal Window Entrance (Skills, Certificates, ...)
        terminalWindows.forEach(terminalEl => {
            gsap.fromTo(terminalEl,
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.7, ease: "power2.out",
                    scrollTrigger: { trigger: terminalEl, start: "top 85%" }
                }
            );

            // Reveal the initially active panel's lines on scroll into view
            const initialPanel = terminalEl.querySelector('.terminal-panel.active');
            if (initialPanel) {
                ScrollTrigger.create({
                    trigger: terminalEl,
                    start: "top 85%",
                    once: true,
                    onEnter: () => revealPanelLines(initialPanel)
                });
            }
        });

        // F. Projects Slideshow
        const slideshowTrack = document.getElementById('slideshow-track');
        const slides = document.querySelectorAll('.project-slide');
        const prevBtn = document.getElementById('slide-prev');
        const nextBtn = document.getElementById('slide-next');
        const dotsContainer = document.getElementById('slideshow-dots');
        const counterEl = document.getElementById('slideshow-counter');

        if (slideshowTrack && slides.length > 0) {
            let currentSlide = 0;
            const totalSlides = slides.length;

            // Generate dots
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('button');
                dot.classList.add('slideshow-dot');
                dot.setAttribute('aria-label', `Go to project ${i + 1}`);
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }

            function updateCounter() {
                if (counterEl) counterEl.textContent = `${currentSlide + 1} / ${totalSlides}`;
            }

            function updateDots() {
                const dots = dotsContainer.querySelectorAll('.slideshow-dot');
                dots.forEach((dot, i) => {
                    if (i === currentSlide) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }

            function goToSlide(index) {
                if (index === currentSlide) return;
                const direction = index > currentSlide ? 1 : -1;
                const oldSlide = slides[currentSlide];
                currentSlide = index;
                const newSlide = slides[currentSlide];

                // Animate track position
                gsap.to(slideshowTrack, {
                    x: `-${currentSlide * 100}%`,
                    duration: 0.5,
                    ease: "power2.inOut"
                });

                // Fade content of new slide
                gsap.fromTo(newSlide.querySelector('.project-card'), 
                    { opacity: 0.4, y: direction * 15 },
                    { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.1 }
                );

                updateDots();
                updateCounter();
            }

            function nextSlide() {
                goToSlide((currentSlide + 1) % totalSlides);
            }

            function prevSlide() {
                goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
            }

            if (prevBtn) prevBtn.addEventListener('click', prevSlide);
            if (nextBtn) nextBtn.addEventListener('click', nextSlide);

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                const projectsSection = document.getElementById('projects');
                if (!projectsSection) return;
                const rect = projectsSection.getBoundingClientRect();
                const inView = rect.top < window.innerHeight && rect.bottom > 0;
                if (!inView) return;

                if (e.key === 'ArrowRight') nextSlide();
                if (e.key === 'ArrowLeft') prevSlide();
            });

            // Touch swipe support
            let touchStartX = 0;
            const slideshowEl = document.getElementById('projects-slideshow');
            if (slideshowEl) {
                slideshowEl.addEventListener('touchstart', (e) => {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });
                slideshowEl.addEventListener('touchend', (e) => {
                    const diff = touchStartX - e.changedTouches[0].screenX;
                    if (Math.abs(diff) > 50) {
                        if (diff > 0) nextSlide();
                        else prevSlide();
                    }
                }, { passive: true });
            }

            // Entrance animation
            gsap.fromTo('.projects-slideshow',
                { y: 40, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
                    scrollTrigger: { trigger: '.projects-slideshow', start: "top 85%" }
                }
            );

            updateCounter();
        }

        // G. Contact Section Stagger
        const contactItems = document.querySelectorAll('.contact-item');
        if (contactItems.length > 0) {
            gsap.fromTo(contactItems,
                { x: -30, opacity: 0 },
                {
                    x: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out",
                    scrollTrigger: { trigger: ".contact-info", start: "top 85%" }
                }
            );
        }

        const socialLinks = document.querySelectorAll('.social-links .social-link');
        if (socialLinks.length > 0) {
            gsap.fromTo(socialLinks,
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out",
                    scrollTrigger: { trigger: ".social-links", start: "top 90%" }
                }
            );
        }

        // H. Experience Timeline Progress
        const experienceSection = document.querySelector('.experience-accordion');
        const progressBar = document.querySelector('.timeline-progress-bar');
        if (experienceSection && progressBar) {
            gsap.to(progressBar, {
                height: "100%",
                ease: "none",
                scrollTrigger: {
                    trigger: experienceSection,
                    start: "top center",
                    end: "bottom center",
                    scrub: true
                }
            });
        }
    }

    // 4. Initialize TypeWriter (GSAP TextPlugin) - Cycles through certificates
    const typingElement = document.querySelector('.typing-text');
    const cursor = document.querySelector('.cursor');
    const certs = [
        "ISC2 SSCP",
        "ISC2 CC",
        "CompTIA Security+ (SY-701)"
    ];
    if (typingElement && cursor && typeof gsap !== 'undefined') {
        gsap.to(cursor, { opacity: 0, ease: "power2.inOut", repeat: -1, yoyo: true, duration: 0.5 });
        let masterTl = gsap.timeline({ repeat: -1 });
        certs.forEach(cert => {
            let duration = Math.max(cert.length * 0.05, 1);
            masterTl.to(typingElement, { duration: duration, text: cert, ease: "none" })
                    .to(typingElement, { duration: duration, text: "", ease: "none", delay: 2 });
        });
    }

    // 5. Initialize Network Animation
    new NetworkAnimation();

    // 6. Initialize Hacker Mode
    new HackerMode();

    // 8. Experience Accordion
    initExperienceAccordion();

    // 8. Robust Smooth Scrolling & Unified Scroll Spy
    const allNavLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    let isClickScrolling = false;
    let scrollSpyTimer = null;

    function setActiveNavLink(targetId) {
        if (!targetId) return;
        allNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${targetId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
            // Clear any lingering inline styles
            link.style.paddingLeft = '';
            link.style.color = '';
        });
    }

    // Unified Smooth Scrolling Click Handlers
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.id === 'centerDemoBtn' || this.hasAttribute('target')) return;
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();

                // Immediately highlight active link
                isClickScrolling = true;
                clearTimeout(scrollSpyTimer);
                setActiveNavLink(targetId.substring(1));

                // Smoothly scroll to exact destination
                const targetTop = target.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: targetTop,
                    behavior: 'smooth'
                });

                // Unlock scroll spy after smooth scroll settles
                scrollSpyTimer = setTimeout(() => {
                    isClickScrolling = false;
                    updateScrollSpy();
                }, 800);
            }
        });
    });

    // Highly Accurate Scroll Spy
    function updateScrollSpy() {
        if (isClickScrolling) return;

        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Bottom of page -> activate last section
        if (scrollY + windowHeight >= documentHeight - 60) {
            if (sections.length > 0) {
                const lastSection = sections[sections.length - 1];
                setActiveNavLink(lastSection.getAttribute('id'));
                return;
            }
        }

        // Top of page -> activate first section
        if (scrollY < 120) {
            if (sections.length > 0) {
                setActiveNavLink(sections[0].getAttribute('id'));
                return;
            }
        }

        // Check which section intersects the focus line (top 35% of viewport)
        const triggerPoint = scrollY + (windowHeight * 0.35);
        let currentSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (triggerPoint >= sectionTop && triggerPoint < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // Fallback: select the closest section above trigger point
        if (!currentSectionId) {
            for (let i = sections.length - 1; i >= 0; i--) {
                if (scrollY + 100 >= sections[i].offsetTop) {
                    currentSectionId = sections[i].getAttribute('id');
                    break;
                }
            }
        }

        if (currentSectionId) {
            setActiveNavLink(currentSectionId);
        }
    }

    // Scroll event listener with requestAnimationFrame
    let isScrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!isScrollTicking) {
            window.requestAnimationFrame(() => {
                updateScrollSpy();
                isScrollTicking = false;
            });
            isScrollTicking = true;
        }

        // Back to Top Visibility
        if (backToTopBtn) {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    }, { passive: true });

    // Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Initial check on load
    updateScrollSpy();
    window.addEventListener('load', () => {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
        updateScrollSpy();
    });

    // Research Paper Dossier Interactions
    const copyCitationBtn = document.getElementById('copy-citation-btn');
    const toggleBibtexBtn = document.getElementById('toggle-bibtex-btn');
    const bibtexDrawer = document.getElementById('bibtex-drawer');
    const copyBibtexRawBtn = document.getElementById('copy-bibtex-raw');

    if (copyCitationBtn) {
        copyCitationBtn.addEventListener('click', () => {
            const citationText = "Ngo, T., Nguyen, Q., et al. (2026). Ephemeral Polymorphic Defense: A Preliminary Study of Small Language Model Agents for Cloud Security Automation. Communications in Computer and Information Science (CCIS), Springer. Accepted for publication.";
            navigator.clipboard.writeText(citationText).then(() => {
                const btnText = document.getElementById('copy-btn-text');
                const origText = btnText ? btnText.innerText : 'Copy Citation';
                if (btnText) btnText.innerText = "Citation Copied!";
                copyCitationBtn.classList.add('copied');
                setTimeout(() => {
                    if (btnText) btnText.innerText = origText;
                    copyCitationBtn.classList.remove('copied');
                }, 2500);
            }).catch(() => {
                prompt("Copy citation:", citationText);
            });
        });
    }

    if (toggleBibtexBtn && bibtexDrawer) {
        toggleBibtexBtn.addEventListener('click', () => {
            bibtexDrawer.classList.toggle('open');
            const isOpen = bibtexDrawer.classList.contains('open');
            toggleBibtexBtn.style.borderColor = isOpen ? 'var(--accent-color)' : '';
            toggleBibtexBtn.style.color = isOpen ? 'var(--accent-color)' : '';
        });
    }

    if (copyBibtexRawBtn) {
        copyBibtexRawBtn.addEventListener('click', () => {
            const codeEl = document.querySelector('.bibtex-code code');
            const bibtexCode = codeEl ? codeEl.innerText : '';
            navigator.clipboard.writeText(bibtexCode).then(() => {
                const span = copyBibtexRawBtn.querySelector('span');
                const orig = span ? span.innerText : 'Copy BibTeX';
                if (span) span.innerText = "Copied!";
                copyBibtexRawBtn.classList.add('copied');
                setTimeout(() => {
                    if (span) span.innerText = orig;
                    copyBibtexRawBtn.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                prompt("Copy BibTeX:", bibtexCode);
            });
        });
    }

    // 10. Shortcut Keys
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            themeManager.toggleTheme();
        }
    });

    // Console Easter Egg
    console.log(`
██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗
██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗
██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║
██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║
██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝
╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝

🔐 Security Architect, Associate Portfolio
💻 Built with passion for cybersecurity
🎯 Keyboard shortcuts: Ctrl/Cmd + D (toggle theme)
🕹️ Try typing "hack" ...
`);
});