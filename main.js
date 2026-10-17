/* ═══════════════════════════════════════════════════════════════
   UDAY M.S. — CINEMATIC PORTFOLIO: MAIN SCRIPT
   Hero Sequence · Portrait Particle Engine · Interactions
   ═══════════════════════════════════════════════════════════════ */

import './style.css';

// ── DOM References ────────────────────────────────────────────
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
const heroSection = document.getElementById('hero');
const heroIntroContainer = document.getElementById('hero-intro-container');
const heroDot = document.getElementById('hero-dot');
const heroBar = document.getElementById('hero-bar');
const heroLightHalo = document.getElementById('hero-light-halo');
const heroUd = document.getElementById('hero-ud');
const heroAy = document.getElementById('hero-ay');
const heroTitleWrap = document.getElementById('hero-title-wrap');
const heroTitle = document.getElementById('hero-title');
const heroBottom = document.getElementById('hero-bottom');
const mainNav = document.getElementById('main-nav');
const navActiveLine = document.getElementById('nav-active-line');
const navScrollLine = document.getElementById('nav-scroll-line');
const portraitImg = document.getElementById('portrait-src');

// ── State ─────────────────────────────────────────────────────
let animationFrame = null;
let particles = [];
let scrollDispersion = 0;
let mouseX = -9999;
let mouseY = -9999;
let isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// ── Canvas Sizing ─────────────────────────────────────────────
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.resetTransform();
  ctx.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  resizeCanvas();
});
resizeCanvas();

// ── Mouse & Touch Tracking ────────────────────────────────────
if (!isTouch) {
  document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  document.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });
}

// ── Scroll Dispersion Tracking ────────────────────────────────
function updateScrollDispersion() {
  const scrollY = window.scrollY;
  const heroH = heroSection ? heroSection.offsetHeight : window.innerHeight;
  // Progress from 0 (at hero top) to 1 (when scrolled 70% of hero height)
  scrollDispersion = Math.min(1, Math.max(0, scrollY / (heroH * 0.70)));
}

window.addEventListener('scroll', updateScrollDispersion, { passive: true });

// ═══════════════════════════════════════════════════════════════
// PARTICLE CLASS
// ═══════════════════════════════════════════════════════════════
class Particle {
  constructor(targetX, targetY, color, size, originX, originY) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.originX = originX;
    this.originY = originY;
    this.color = color;
    this.size = size;

    // Start at outer origin (corners or perimeter)
    this.x = originX;
    this.y = originY;
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.86 + Math.random() * 0.05;
    this.ease = 0.034 + Math.random() * 0.024;
    this.opacity = 0;
    this.targetOpacity = 0.96;
    this.active = false;

    // Subtle micro-floating vibration
    this.floatAngle = Math.random() * Math.PI * 2;
    this.floatSpeed = 0.012 + Math.random() * 0.015;
    this.floatAmp = 0.35 + Math.random() * 0.45;
  }

  update() {
    if (!this.active) return;

    this.floatAngle += this.floatSpeed;
    const floatOffsetX = Math.cos(this.floatAngle) * this.floatAmp;
    const floatOffsetY = Math.sin(this.floatAngle) * this.floatAmp;

    // Destination interpolates based on scrollDispersion:
    // When scrollDispersion === 0: destination is assembled portrait target position
    // When scrollDispersion > 0: destination spreads outward towards origin corners!
    const destX = this.targetX + (this.originX - this.targetX) * scrollDispersion + floatOffsetX * (1 - scrollDispersion);
    const destY = this.targetY + (this.originY - this.targetY) * scrollDispersion + floatOffsetY * (1 - scrollDispersion);

    // Spring physics toward destination
    const dx = destX - this.x;
    const dy = destY - this.y;
    this.vx += dx * this.ease;
    this.vy += dy * this.ease;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;

    // Restrained hover bulge: subtle & gentle micro-repulsion only when resting at top
    if (!isTouch && scrollDispersion === 0 && mouseX > -1000) {
      const mdx = this.x - mouseX;
      const mdy = this.y - mouseY;
      const dist = Math.hypot(mdx, mdy);
      const repulseR = 65; // Restrained radius
      if (dist < repulseR && dist > 0) {
        const force = (repulseR - dist) / repulseR;
        // Restrained gentle displacement (force * 1.6 max)
        this.vx += (mdx / dist) * force * 1.6;
        this.vy += (mdy / dist) * force * 1.6;
      }
    }

    // Fade in when forming, fade out as scrolled away
    const baseTargetAlpha = this.targetOpacity * Math.max(0, 1 - scrollDispersion * 1.05);
    this.opacity += (baseTargetAlpha - this.opacity) * 0.08;
  }

  draw(ctx) {
    if (!this.active || this.opacity <= 0.01) return;
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      Math.round(this.x),
      Math.round(this.y),
      this.size,
      this.size
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PORTRAIT → PARTICLES
// ═══════════════════════════════════════════════════════════════
function extractPortraitPixels() {
  return new Promise((resolve) => {
    const img = portraitImg;

    const tryExtract = () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      const screenW = canvas.getBoundingClientRect().width;
      const screenH = canvas.getBoundingClientRect().height;
      const isMobile = screenW < 768;

      // Prominent, enlarged scale with face centered in upper-mid viewport
      const portraitH = isMobile ? Math.min(screenH * 0.70, 520) : Math.min(screenH * 0.82, 740);
      const portraitW = (img.naturalWidth / img.naturalHeight) * portraitH;

      const blockSize = isMobile ? 3.4 : 2.8;
      const sampleW = Math.floor(portraitW / blockSize);
      const sampleH = Math.floor(portraitH / blockSize);

      tempCanvas.width = sampleW;
      tempCanvas.height = sampleH;
      tempCtx.drawImage(img, 0, 0, sampleW, sampleH);

      let imageData;
      try {
        imageData = tempCtx.getImageData(0, 0, sampleW, sampleH);
      } catch (e) {
        console.warn('Canvas getImageData failed:', e);
        return resolve([]);
      }

      const data = imageData.data;
      const offsetX = (screenW - portraitW) / 2;
      const offsetY = (screenH - portraitH) / 2 - (isMobile ? 15 : screenH * 0.035);

      const result = [];
      const skipRate = isMobile ? 0.35 : 0.15;

      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const i = (y * sampleW + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Transparent background pixels skipped
          if (a < 30) continue;
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
          if (brightness < 10 && a < 180) continue;

          if (Math.random() < skipRate) continue;

          const targetX = offsetX + x * blockSize;
          const targetY = offsetY + y * blockSize;

          // Scatter origin: outer corners & perimeter
          const corner = Math.floor(Math.random() * 4);
          let originX, originY;
          const spread = 220 + Math.random() * 320;

          if (corner === 0) {
            originX = -spread;
            originY = -spread + Math.random() * (screenH * 0.6);
          } else if (corner === 1) {
            originX = screenW + spread;
            originY = -spread + Math.random() * (screenH * 0.6);
          } else if (corner === 2) {
            originX = -spread;
            originY = screenH * 0.4 + Math.random() * spread;
          } else {
            originX = screenW + spread;
            originY = screenH * 0.4 + Math.random() * spread;
          }

          result.push({
            targetX,
            targetY,
            originX,
            originY,
            color: `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`,
            size: Math.max(1.8, blockSize - 0.5)
          });
        }
      }

      resolve(result);
    };

    if (img.complete && img.naturalWidth > 0) {
      tryExtract();
    } else {
      img.onload = tryExtract;
      img.onerror = () => resolve([]);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// AMBIENT PARTICLES (background stars/dots)
// ═══════════════════════════════════════════════════════════════
const ambientParticles = [];
const AMBIENT_COUNT = 65;

function initAmbient() {
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  for (let i = 0; i < AMBIENT_COUNT; i++) {
    ambientParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.3 + 0.05,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005
    });
  }
}

function drawAmbient() {
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;

  for (const p of ambientParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.pulse += p.pulseSpeed;

    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    const opacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#f4f4f6';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY SEQUENCER
// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY SEQUENCER & KINETIC MORPH
// ═══════════════════════════════════════════════════════════════
const GLYPH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function renderWordChars(container, word, initialClass = 'entering') {
  container.innerHTML = '';
  const spans = [];
  for (let i = 0; i < word.length; i++) {
    const span = document.createElement('span');
    span.className = `char ${initialClass}`;
    span.textContent = word[i];
    span.dataset.char = word[i];
    container.appendChild(span);
    spans.push(span);
  }
  return spans;
}

// Scramble an individual character span from its current character into targetChar
function scrambleCharTo(span, targetChar, durationMs = 170) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    span.classList.add('scrambling');
    span.classList.remove('settled');

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= durationMs) {
        clearInterval(interval);
        span.textContent = targetChar;
        span.dataset.char = targetChar;
        span.classList.remove('scrambling');
        span.classList.add('settled');
        resolve();
      } else {
        span.textContent = GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)];
      }
    }, 32);
  });
}

// ═══════════════════════════════════════════════════════════════
// HERO ANIMATION SEQUENCE
// ═══════════════════════════════════════════════════════════════
async function runHeroSequence() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    if (heroIntroContainer) heroIntroContainer.classList.add('hidden');
    if (heroTitleWrap) {
      heroTitleWrap.classList.add('visible', 'descended');
      renderWordChars(heroTitle, 'PORTFOLIO', 'settled');
    }
    const pixelData = await extractPortraitPixels();
    particles = pixelData.map(p => {
      const part = new Particle(p.targetX, p.targetY, p.color, p.size, p.originX, p.originY);
      part.x = p.targetX;
      part.y = p.targetY;
      part.opacity = part.targetOpacity;
      part.active = true;
      return part;
    });
    if (heroBottom) heroBottom.classList.add('visible');
    if (mainNav) mainNav.classList.add('visible');
    return;
  }

  // Pre-populate UDAY in heroTitle with initial hidden/entering state
  heroTitle.innerHTML = '';
  const initialLetters = ['U', 'D', 'A', 'Y'];
  const charSpans = [];
  for (let i = 0; i < initialLetters.length; i++) {
    const span = document.createElement('span');
    span.className = 'char entering';
    span.textContent = initialLetters[i];
    span.dataset.char = initialLetters[i];
    heroTitle.appendChild(span);
    charSpans.push(span);
  }

  // ── Stage A: Dot falls from above and bounces twice with softened light spread ──
  await delay(250);
  if (heroDot) heroDot.classList.add('falling');

  // First impact flash (at ~520ms) - softened halo
  setTimeout(() => {
    if (heroLightHalo) {
      heroLightHalo.classList.add('pulse');
      setTimeout(() => heroLightHalo.classList.add('fade'), 300);
    }
  }, 520);

  // Second impact flash (at ~1050ms) - softened halo
  setTimeout(() => {
    if (heroLightHalo) {
      heroLightHalo.classList.remove('fade');
      heroLightHalo.classList.add('pulse');
      setTimeout(() => heroLightHalo.classList.add('fade'), 250);
    }
  }, 1050);

  // Wait for 2 bounces to complete and settle
  await delay(1500);

  // ── Stage B: Upper vertical stroke falls and bends left ────────────────
  if (heroBar) heroBar.classList.add('falling');
  await delay(650);

  // Light spread accompanying stroke bend
  if (heroLightHalo) {
    heroLightHalo.classList.remove('fade');
    heroLightHalo.classList.add('pulse');
    setTimeout(() => heroLightHalo.classList.add('fade'), 250);
  }
  if (heroBar) heroBar.classList.add('bend-left');

  // Immediately before or as the first letters of UDAY appear, remove exclamation stroke and dot completely
  await delay(200);
  if (heroBar) {
    heroBar.classList.add('vanished');
    heroBar.style.opacity = '0';
    heroBar.style.visibility = 'hidden';
  }
  if (heroDot) {
    heroDot.classList.add('vanished');
    heroDot.style.opacity = '0';
    heroDot.style.visibility = 'hidden';
  }

  // ── Stage C: Form UD, then AY into clean, bold UDAY ────────────────────
  if (heroTitleWrap) heroTitleWrap.classList.add('visible');

  // Reveal UD
  charSpans[0].classList.remove('entering');
  charSpans[0].classList.add('settled');
  charSpans[1].classList.remove('entering');
  charSpans[1].classList.add('settled');

  await delay(350);

  // Soft light pulse connecting into AY
  if (heroLightHalo) {
    heroLightHalo.classList.remove('fade');
    heroLightHalo.classList.add('pulse');
    setTimeout(() => heroLightHalo.classList.add('fade'), 250);
  }

  // Reveal AY
  charSpans[2].classList.remove('entering');
  charSpans[2].classList.add('settled');
  charSpans[3].classList.remove('entering');
  charSpans[3].classList.add('settled');

  // Complete word UDAY is formed, centered, bold and completely unobstructed!
  // Keep the four existing letters visible for a deliberate pause
  await delay(750);

  // ── Stage D1: Kinetic character transformation UDAY -> PORT ───────────
  // Mapping: U -> P, D -> O, A -> R, Y -> T
  const morphPairs = [
    { span: charSpans[0], target: 'P', stagger: 0 },
    { span: charSpans[1], target: 'O', stagger: 70 },
    { span: charSpans[2], target: 'R', stagger: 140 },
    { span: charSpans[3], target: 'T', stagger: 210 },
  ];

  await Promise.all(
    morphPairs.map(({ span, target, stagger }) =>
      new Promise(res => {
        setTimeout(() => {
          scrambleCharTo(span, target, 170).then(res);
        }, stagger);
      })
    )
  );

  // ── Stage D2: Sequentially reveal remaining letters FOLIO ──────────────
  await delay(120);

  const remainingLetters = ['F', 'O', 'L', 'I', 'O'];
  for (const ch of remainingLetters) {
    const span = document.createElement('span');
    span.className = 'char entering';
    span.textContent = ch;
    span.dataset.char = ch;
    heroTitle.appendChild(span);
    // Force reflow for smooth kinetic entry transition
    void span.offsetWidth;
    span.classList.remove('entering');
    span.classList.add('settled');
    await delay(115); // Measured medium speed
  }

  // ── Stage E: Complete PORTFOLIO settles and descends ───────────────────
  await delay(450);
  if (heroTitleWrap) heroTitleWrap.classList.add('descended');

  // As it descends, initiate the 6-wave portrait particle assembly
  await delay(400);

  const pixelData = await extractPortraitPixels();
  if (pixelData.length > 0) {
    particles = pixelData.map(p =>
      new Particle(p.targetX, p.targetY, p.color, p.size, p.originX, p.originY)
    );

    const total = particles.length;
    const waveCount = 6;
    const waveSize = Math.ceil(total / waveCount);

    for (let w = 0; w < waveCount; w++) {
      const startIdx = w * waveSize;
      const endIdx = Math.min(startIdx + waveSize, total);
      for (let i = startIdx; i < endIdx; i++) {
        particles[i].active = true;
      }
      await delay(90);
    }
  }

  // Reveal hero bottom bar and navbar
  await delay(600);
  if (heroBottom) heroBottom.classList.add('visible');
  if (mainNav) mainNav.classList.add('visible');
}

// ═══════════════════════════════════════════════════════════════
// RENDER LOOP
// ═══════════════════════════════════════════════════════════════
function render() {
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  
  ctx.clearRect(0, 0, w, h);
  
  // Ambient particles
  drawAmbient();
  
  // Portrait particles
  for (const p of particles) {
    p.update();
    p.draw(ctx);
  }
  
  animationFrame = requestAnimationFrame(render);
}

// ═══════════════════════════════════════════════════════════════
// CAPABILITIES ACCORDION
// ═══════════════════════════════════════════════════════════════
function initCapabilities() {
  const items = document.querySelectorAll('.capability-item');
  items.forEach(item => {
    const header = item.querySelector('.capability-header');
    if (!header) return;

    const toggleItem = () => {
      const isExpanded = item.classList.contains('expanded');
      // Collapse all
      items.forEach(i => {
        i.classList.remove('expanded');
        const h = i.querySelector('.capability-header');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
      // Toggle clicked item
      if (!isExpanded) {
        item.classList.add('expanded');
        header.setAttribute('aria-expanded', 'true');
      }
    };

    header.addEventListener('click', toggleItem);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleItem();
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// INTRO PROGRESSIVE SCROLL-TYPING REVEAL
// ═══════════════════════════════════════════════════════════════
function initIntroScrollReveal() {
  const aboutSection = document.getElementById('about');
  const textParagraphs = document.querySelectorAll('#about .about-text-line');
  if (!aboutSection || !textParagraphs.length) return;

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) return;

  // Split text into words wrapped in span.intro-type-word
  textParagraphs.forEach(p => {
    const temp = document.createElement('div');
    temp.innerHTML = p.innerHTML;

    function processNodes(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const parts = text.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else if (part.length > 0) {
            const span = document.createElement('span');
            span.className = 'intro-type-word';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(processNodes);
      }
    }

    Array.from(temp.childNodes).forEach(processNodes);
    p.innerHTML = temp.innerHTML;
  });

  const wordSpans = document.querySelectorAll('#about .intro-type-word');
  const totalWords = wordSpans.length;

  function updateIntroReveal() {
    const rect = aboutSection.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Scroll progress as user scrolls into and through the Intro section
    const startY = windowH * 0.85;
    const endY = windowH * 0.15;
    const progress = Math.min(1, Math.max(0, (startY - rect.top) / (startY - endY)));

    // Progressive character/word typing at measured medium speed
    const activeCount = Math.floor(progress * totalWords);

    wordSpans.forEach((w, idx) => {
      if (idx <= activeCount) {
        w.classList.add('typed');
      } else {
        w.classList.remove('typed');
      }
    });
  }

  window.addEventListener('scroll', updateIntroReveal, { passive: true });
  updateIntroReveal();
}

// ═══════════════════════════════════════════════════════════════
// SCROLL REVEAL (Intersection Observer)
// ═══════════════════════════════════════════════════════════════
function initScrollReveal() {
  const headingSelectors = [
    '.about-left',
    '.capabilities-header',
    '.projects-header-container',
    '.education-header'
  ];

  const contentSelectors = [
    '.about-right',
    '.capability-item',
    '.project-item',
    '.education-card',
    '.resume-content',
    '.game-top-bar', '.game-canvas-wrapper',
    '.contact-left', '.contact-right'
  ];

  [...headingSelectors, ...contentSelectors].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('reveal');
    });
  });

  // Assign stagger index to capability items
  document.querySelectorAll('.capabilities-list .capability-item').forEach((item, idx) => {
    item.style.setProperty('--reveal-idx', idx);
  });

  // Assign stagger index to education cards
  document.querySelectorAll('.education-grid .education-card').forEach((card, idx) => {
    card.style.setProperty('--reveal-idx', idx);
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION: SLIDING ACTIVE UNDERLINE & SCROLL-DIRECTION LINE
// ═══════════════════════════════════════════════════════════════
function initNavigation() {
  const links = document.querySelectorAll('.nav-link[data-section]');
  const activeLine = document.getElementById('nav-active-line');
  const scrollLine = document.getElementById('nav-scroll-line');
  const nav = document.getElementById('main-nav');
  if (!links.length) return;

  const sections = [];
  links.forEach(link => {
    const sectionEl = document.getElementById(link.dataset.section);
    if (sectionEl) sections.push({ el: sectionEl, link, id: link.dataset.section });
  });

  function setUnderline(activeLink) {
    if (!activeLine || !activeLink) return;
    const linkRect = activeLink.getBoundingClientRect();
    const parentRect = activeLink.parentElement.getBoundingClientRect();
    const left = linkRect.left - parentRect.left;
    const width = linkRect.width;

    activeLine.style.opacity = '1';
    activeLine.style.transform = `translateX(${left}px)`;
    activeLine.style.width = `${width}px`;
  }

  function updateNav() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? Math.min(1, Math.max(0, scrollY / docH)) : 0;

    // Thin scroll line expands smoothly down, retracts up
    if (scrollLine) {
      scrollLine.style.transform = `scaleX(${progress})`;
    }

    // Header sticky backdrop blur
    if (nav) {
      if (scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    // Determine current section in view
    const triggerY = window.innerHeight * 0.35;
    let current = sections[0];

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const rect = s.el.getBoundingClientRect();
      if (rect.top <= triggerY && rect.bottom > triggerY) {
        current = s;
        break;
      } else if (rect.top <= triggerY) {
        current = s;
      }
    }

    links.forEach(l => l.classList.remove('active'));
    if (current && current.link) {
      current.link.classList.add('active');
      setUnderline(current.link);
    }
  }

  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      setUnderline(link);
    });
  });

  window.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', () => {
    const active = document.querySelector('.nav-link.active') || links[0];
    if (active) setUnderline(active);
  });

  setTimeout(() => {
    const active = document.querySelector('.nav-link.active') || links[0];
    if (active) setUnderline(active);
  }, 120);
}

// ═══════════════════════════════════════════════════════════════
// PIXEL ART GAME — HELLO WORLD BREAKOUT
// ═══════════════════════════════════════════════════════════════
function initGame() {
  const gameCanvas = document.getElementById('game-canvas');
  if (!gameCanvas) return;
  const gameCtx = gameCanvas.getContext('2d');
  const startBtn = document.getElementById('game-start-btn');
  const scoreVal = document.getElementById('game-score-val');
  const livesDots = document.querySelectorAll('#game-lives-dots .dot');
  const gameOverOverlay = document.getElementById('game-gameover-overlay');
  const againBtn = document.getElementById('game-again-btn');

  let gameMode = 'idle'; // 'idle' | 'playing' | 'gameover'
  let isPaused = false;
  let gameAnimFrame = null;
  let lastTimestamp = 0;

  // Game constants & state
  let BLOCK = 14;
  let PADDLE_W = 100;
  let PADDLE_H = 11;
  let BALL_R = 7;

  let bricks = [];
  let ghostBricks = [];
  let brickParticles = [];
  let ballTrail = [];
  let ball = { x: 0, y: 0, vx: 2.2, vy: -2.4 };
  let paddle = { x: 0 };
  let score = 0;
  let lives = 3;
  let keys = { left: false, right: false };
  let ballAttached = false;
  let respawnTimer = null;

  // Pixel font for "HELLO WORLD" — each letter is a 5x7 grid
  const letters = {
    'H': [1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1],
    'E': [1,1,1,1,1, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,1],
    'L': [1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,1],
    'O': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    'W': [1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,1,0,1, 1,1,0,1,1, 1,0,0,0,1],
    'R': [1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,0, 1,0,1,0,0, 1,0,0,1,0, 1,0,0,0,1],
    'D': [1,1,1,0,0, 1,0,0,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,1,0, 1,1,1,0,0],
    ' ': [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0]
  };

  function updateLivesUI() {
    livesDots.forEach((dot, idx) => {
      if (idx < lives) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function updateScoreUI() {
    if (scoreVal) scoreVal.textContent = score;
  }

  function resizeGame() {
    const rect = gameCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    gameCanvas.width = rect.width * dpr;
    gameCanvas.height = rect.height * dpr;
    gameCtx.resetTransform();
    gameCtx.scale(dpr, dpr);
    
    BLOCK = Math.max(8, Math.min(19, Math.floor(rect.width / 46)));
    PADDLE_W = Math.max(76, Math.min(130, Math.floor(rect.width * 0.13)));
    PADDLE_H = Math.max(9, Math.floor(BLOCK * 0.72));
    BALL_R = Math.max(5, Math.floor(BLOCK * 0.4));
  }

  function buildBricks(keepGhost = false) {
    bricks = [];
    if (!keepGhost) ghostBricks = [];
    brickParticles = [];
    ballTrail = [];
    const w = gameCanvas.getBoundingClientRect().width;
    const h = gameCanvas.getBoundingClientRect().height;
    
    BLOCK = Math.max(8, Math.min(19, Math.floor(w / 46)));
    PADDLE_W = Math.max(76, Math.min(130, Math.floor(w * 0.13)));
    PADDLE_H = Math.max(9, Math.floor(BLOCK * 0.72));
    BALL_R = Math.max(5, Math.floor(BLOCK * 0.4));

    const text1 = 'HELLO';
    const text2 = 'WORLD';

    const charW = 5;
    const charH = 7;
    const gap = 1;

    function addLine(text, baseY, color) {
      const totalW = text.length * (charW + gap) - gap;
      const startX = (w / BLOCK - totalW) / 2;

      for (let c = 0; c < text.length; c++) {
        const char = text[c];
        const charData = letters[char] || letters[' '];
        const cx = startX + c * (charW + gap);

        for (let row = 0; row < charH; row++) {
          for (let col = 0; col < charW; col++) {
            if (charData[row * charW + col]) {
              bricks.push({
                x: (cx + col) * BLOCK,
                y: (baseY + row) * BLOCK,
                w: BLOCK - 2,
                h: BLOCK - 2,
                alive: true,
                color: color
              });
            }
          }
        }
      }
    }

    const totalLinesH = (charH * 2 + 2) * BLOCK;
    const startRow = Math.max(2, Math.floor((h * 0.36 - totalLinesH / 2) / BLOCK));
    addLine(text1, startRow, '#ffffff');
    addLine(text2, startRow + charH + 2, '#ffffff');

    paddle.x = w / 2 - PADDLE_W / 2;
  }

  function resetIdleBall() {
    const w = gameCanvas.getBoundingClientRect().width;
    const h = gameCanvas.getBoundingClientRect().height;
    ball.x = w / 2;
    ball.y = h * 0.55;
    ball.vx = 1.6 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -1.6;
    ballAttached = false;
  }

  function resetPlayingBall() {
    const w = gameCanvas.getBoundingClientRect().width;
    const h = gameCanvas.getBoundingClientRect().height;
    ball.x = paddle.x + PADDLE_W / 2;
    ball.y = h - 45;
    // ~15% faster active gameplay speed, smooth and controlled
    ball.vx = 2.75 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -3.0;
    ballAttached = false;
  }

  function spawnBrickExplosion(b) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      brickParticles.push({
        x: b.x + b.w / 2,
        y: b.y + b.h / 2,
        vx: (Math.random() - 0.5) * 3.5,
        vy: (Math.random() - 0.5) * 3.5,
        size: Math.random() * 2 + 1.5,
        alpha: 1,
        color: b.color
      });
    }
  }

  function drawGame() {
    const w = gameCanvas.getBoundingClientRect().width;
    const h = gameCanvas.getBoundingClientRect().height;

    gameCtx.clearRect(0, 0, w, h);

    // Deep black canvas background
    gameCtx.fillStyle = '#08080a';
    gameCtx.fillRect(0, 0, w, h);

    // Subtle ghost traces for destroyed blocks (non-collidable)
    for (const g of ghostBricks) {
      gameCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      gameCtx.fillRect(g.x, g.y, g.w, g.h);
      gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      gameCtx.strokeRect(g.x, g.y, g.w, g.h);
    }

    // Active Bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      gameCtx.fillStyle = b.color;
      gameCtx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Brick explosion particles
    for (let i = brickParticles.length - 1; i >= 0; i--) {
      const p = brickParticles[i];
      gameCtx.globalAlpha = p.alpha;
      gameCtx.fillStyle = p.color;
      gameCtx.fillRect(p.x, p.y, p.size, p.size);
    }
    gameCtx.globalAlpha = 1;

    // Paddle
    gameCtx.fillStyle = '#f4f4f6';
    gameCtx.beginPath();
    gameCtx.roundRect(paddle.x, h - 30, PADDLE_W, PADDLE_H, [3, 3, 3, 3]);
    gameCtx.fill();

    // Subtle translucent ball trail afterimages
    for (let i = 0; i < ballTrail.length; i++) {
      const t = ballTrail[i];
      const trailAlpha = (1 - i / ballTrail.length) * 0.22;
      gameCtx.fillStyle = `rgba(255, 255, 255, ${trailAlpha.toFixed(3)})`;
      gameCtx.beginPath();
      gameCtx.arc(t.x, t.y, BALL_R * 0.85, 0, Math.PI * 2);
      gameCtx.fill();
    }

    // Ball
    gameCtx.fillStyle = '#ffffff';
    gameCtx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    gameCtx.shadowBlur = 10;
    gameCtx.beginPath();
    gameCtx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    gameCtx.fill();
    gameCtx.shadowBlur = 0;

    // Paused overlay
    if (isPaused) {
      gameCtx.fillStyle = 'rgba(5, 5, 5, 0.75)';
      gameCtx.fillRect(0, 0, w, h);
      gameCtx.font = '600 18px "Space Grotesk", sans-serif';
      gameCtx.fillStyle = '#f4f4f6';
      gameCtx.textAlign = 'center';
      gameCtx.fillText('PAUSED', w / 2, h / 2 - 10);
      gameCtx.font = '400 13px "Inter", sans-serif';
      gameCtx.fillStyle = '#8e8e93';
      gameCtx.fillText('Press SPACE to resume', w / 2, h / 2 + 16);
    }
  }

  function updateGame(dt) {
    if (isPaused) return;

    const w = gameCanvas.getBoundingClientRect().width;
    const h = gameCanvas.getBoundingClientRect().height;

    // Keyboard paddle control
    const paddleSpeed = 7 * dt;
    if (keys.left) paddle.x -= paddleSpeed;
    if (keys.right) paddle.x += paddleSpeed;
    paddle.x = Math.max(0, Math.min(w - PADDLE_W, paddle.x));

    // Update brick particles
    for (let i = brickParticles.length - 1; i >= 0; i--) {
      const p = brickParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.12 * dt; // Gravity
      p.alpha -= 0.035 * dt;
      if (p.alpha <= 0) {
        brickParticles.splice(i, 1);
      }
    }

    if (ballAttached) {
      ball.x = paddle.x + PADDLE_W / 2;
      ball.y = h - 42;
      return;
    }

    // Record ball trail
    ballTrail.unshift({ x: ball.x, y: ball.y });
    if (ballTrail.length > 5) ballTrail.pop();

    // Ball movement (delta-time based for rock-solid consistent speed)
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Wall bounce
    if (ball.x - BALL_R <= 0) {
      ball.x = BALL_R;
      ball.vx *= -1;
    } else if (ball.x + BALL_R >= w) {
      ball.x = w - BALL_R;
      ball.vx *= -1;
    }
    if (ball.y - BALL_R <= 0) {
      ball.y = BALL_R;
      ball.vy *= -1;
    }

    // Paddle bounce
    if (
      ball.y + BALL_R >= h - 30 &&
      ball.y - BALL_R <= h - 18 &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + PADDLE_W
    ) {
      ball.vy = -Math.abs(ball.vy);
      // Angle deflection based on hit position
      const hitPos = (ball.x - paddle.x) / PADDLE_W;
      ball.vx = (hitPos - 0.5) * 6.2;
    }

    // Ball fell below bottom edge
    if (ball.y > h + 25) {
      if (gameMode === 'idle') {
        // IDLE PREVIEW: Do NOT lose life or score; respawn smoothly after 0.8s
        if (!respawnTimer) {
          respawnTimer = setTimeout(() => {
            resetIdleBall();
            respawnTimer = null;
          }, 800);
        }
      } else if (gameMode === 'playing') {
        lives--;
        updateLivesUI();

        if (lives > 0) {
          ballAttached = true;
          setTimeout(() => {
            ballAttached = false;
            ball.vx = 2.75 * (Math.random() > 0.5 ? 1 : -1);
            ball.vy = -3.0;
          }, 700);
        } else {
          // Game Over State
          gameMode = 'gameover';
          if (gameOverOverlay) gameOverOverlay.classList.add('active');
          if (startBtn) startBtn.textContent = 'GAME OVER';
          return;
        }
      }
    }

    // Brick collision (only during active play or preview bounce)
    for (const b of bricks) {
      if (!b.alive) continue;
      if (
        ball.x + BALL_R > b.x &&
        ball.x - BALL_R < b.x + b.w &&
        ball.y + BALL_R > b.y &&
        ball.y - BALL_R < b.y + b.h
      ) {
        b.alive = false;
        // Preserve ghost trace at destroyed block location
        ghostBricks.push({ x: b.x, y: b.y, w: b.w, h: b.h });
        spawnBrickExplosion(b);
        ball.vy *= -1;

        if (gameMode === 'playing') {
          score += 10;
          updateScoreUI();
        }
        break;
      }
    }

    // Win condition check
    if (gameMode === 'playing' && bricks.length > 0 && bricks.every(b => !b.alive)) {
      gameMode = 'idle';
      if (startBtn) startBtn.textContent = 'YOU WIN! PLAY AGAIN';
    }
  }

  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / (1000 / 60), 2.0);
    lastTimestamp = timestamp;

    if (gameMode !== 'gameover') {
      updateGame(dt);
    }
    drawGame();
    gameAnimFrame = requestAnimationFrame(gameLoop);
  }

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
      keys.left = true;
    } else if (e.key === 'ArrowRight' || e.code === 'KeyD') {
      keys.right = true;
    } else if (e.code === 'Space') {
      if (gameMode === 'playing') {
        e.preventDefault();
        isPaused = !isPaused;
        if (startBtn) startBtn.textContent = isPaused ? 'RESUME' : 'PLAYING...';
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
      keys.left = false;
    } else if (e.key === 'ArrowRight' || e.code === 'KeyD') {
      keys.right = false;
    }
  });

  // Mouse & Touch paddle controls
  gameCanvas.addEventListener('mousemove', (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - PADDLE_W / 2;
    paddle.x = Math.max(0, Math.min(rect.width - PADDLE_W, paddle.x));
  });

  gameCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = gameCanvas.getBoundingClientRect();
    paddle.x = e.touches[0].clientX - rect.left - PADDLE_W / 2;
    paddle.x = Math.max(0, Math.min(rect.width - PADDLE_W, paddle.x));
  }, { passive: false });

  // Play button click: start active gameplay
  function startPlaying() {
    if (isPaused) {
      isPaused = false;
      if (startBtn) startBtn.textContent = 'PLAYING...';
      return;
    }
    if (gameOverOverlay) gameOverOverlay.classList.remove('active');
    gameMode = 'playing';
    isPaused = false;
    score = 0;
    lives = 3;
    updateScoreUI();
    updateLivesUI();
    buildBricks(false);
    resetPlayingBall();
    if (startBtn) startBtn.textContent = 'PLAYING...';
  }

  if (startBtn) {
    startBtn.addEventListener('click', startPlaying);
  }

  if (againBtn) {
    againBtn.addEventListener('click', startPlaying);
  }

  window.addEventListener('resize', () => {
    resizeGame();
  });

  // Start Idle Preview on initial load
  resizeGame();
  buildBricks(false);
  resetIdleBall();
  gameMode = 'idle';
  gameAnimFrame = requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL NAV LINKS
// ═══════════════════════════════════════════════════════════════
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════
function init() {
  initAmbient();
  render();
  runHeroSequence();
  initIntroScrollReveal();
  initCapabilities();
  initScrollReveal();
  initNavigation();
  initSmoothScroll();
  initGame();
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
