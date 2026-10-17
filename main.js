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
const heroTitleWrap = document.getElementById('hero-title-wrap');
const heroTitle = document.getElementById('hero-title');
const heroBottom = document.getElementById('hero-bottom');
const mainNav = document.getElementById('main-nav');
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
const GLYPH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function renderWordChars(container, word, initialClass = 'entering') {
  container.innerHTML = '';
  const spans = [];
  for (let i = 0; i < word.length; i++) {
    const span = document.createElement('span');
    span.className = `char ${initialClass}`;
    span.textContent = word[i];
    container.appendChild(span);
    spans.push(span);
  }
  return spans;
}

// Rapid kinetic letter scramble/morph into target word
function morphWord(container, targetWord, durationMs = 850) {
  return new Promise((resolve) => {
    const targetLen = targetWord.length;
    container.innerHTML = '';
    const spans = [];

    for (let i = 0; i < targetLen; i++) {
      const span = document.createElement('span');
      span.className = 'char scrambling';
      span.textContent = targetWord[i];
      container.appendChild(span);
      spans.push(span);
    }

    const startTime = performance.now();
    const staggerPerChar = durationMs / (targetLen + 3);

    function scrambleFrame(now) {
      const elapsed = now - startTime;
      let allSettled = true;

      for (let i = 0; i < targetLen; i++) {
        const charStart = i * staggerPerChar;
        const charDuration = 220;
        const charProgress = (elapsed - charStart) / charDuration;

        if (charProgress < 0) {
          allSettled = false;
          spans[i].textContent = GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)];
        } else if (charProgress < 1) {
          allSettled = false;
          spans[i].className = 'char scrambling';
          spans[i].textContent = GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)];
        } else {
          if (spans[i].textContent !== targetWord[i]) {
            spans[i].textContent = targetWord[i];
            spans[i].className = 'char settled';
          }
        }
      }

      if (allSettled && elapsed >= durationMs) {
        for (let i = 0; i < targetLen; i++) {
          spans[i].textContent = targetWord[i];
          spans[i].className = 'char settled';
        }
        resolve();
      } else {
        requestAnimationFrame(scrambleFrame);
      }
    }

    requestAnimationFrame(scrambleFrame);
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

  // ── Stage 1: Dot falls from above and bounces twice ────────
  await delay(250);
  if (heroDot) heroDot.classList.add('falling');

  // Allow the 2 bounces to complete and settle (1.4s animation)
  await delay(1450);

  // ── Stage 2: Upper stroke emerges and tilts left (-22deg) ───
  if (heroBar) heroBar.classList.add('active');

  // Hold exclamation shape momentarily
  await delay(700);

  // ── Stage 3: Stroke morphs, UDAY appears in center ─────────
  if (heroBar) heroBar.classList.add('morphing');
  await delay(200);
  if (heroIntroContainer) heroIntroContainer.classList.add('hidden');

  // Form UDAY character-by-character
  if (heroTitleWrap) heroTitleWrap.classList.add('visible');
  const udaySpans = renderWordChars(heroTitle, 'UDAY', 'entering');
  for (let i = 0; i < udaySpans.length; i++) {
    await delay(75);
    udaySpans[i].classList.remove('entering');
    udaySpans[i].classList.add('settled');
  }

  // Hold UDAY in center with dramatic silver typography
  await delay(1200);

  // ── Stage 4: UDAY rapidly transforms into PORTFOLIO ────────
  await morphWord(heroTitle, 'PORTFOLIO', 850);

  // Hold PORTFOLIO in center
  await delay(350);

  // ── Stage 5: PORTFOLIO descends slowly to lower position ────
  if (heroTitleWrap) heroTitleWrap.classList.add('descended');

  // As it descends, initiate the 5-step portrait particle assembly
  await delay(400);

  const pixelData = await extractPortraitPixels();
  if (pixelData.length > 0) {
    particles = pixelData.map(p =>
      new Particle(p.targetX, p.targetY, p.color, p.size, p.originX, p.originY)
    );

    // Release particles in 6 waves so the inward streaming is clearly visible
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
    header.addEventListener('click', () => {
      const isExpanded = item.classList.contains('expanded');
      // Collapse all
      items.forEach(i => i.classList.remove('expanded'));
      // Toggle clicked
      if (!isExpanded) {
        item.classList.add('expanded');
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════════════════
function initScrollReveal() {
  // Add reveal class to elements
  const selectors = [
    '.about-left', '.about-right',
    '.capability-item',
    '.project-item',
    '.education-card',
    '.resume-content',
    '.game-header', '.game-canvas',
    '.contact-left', '.contact-right'
  ];
  
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('reveal');
    });
  });
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// NAVBAR SCROLL STATE & ACTIVE LINK
// ═══════════════════════════════════════════════════════════════
function initNavbar() {
  const links = document.querySelectorAll('.nav-link[data-section]');
  const sections = [];
  links.forEach(link => {
    const sectionEl = document.getElementById(link.dataset.section);
    if (sectionEl) sections.push({ el: sectionEl, link });
  });
  
  window.addEventListener('scroll', () => {
    // Scrolled state
    if (window.scrollY > 80) {
      mainNav.classList.add('scrolled');
    } else {
      mainNav.classList.remove('scrolled');
    }
    
    // Active section
    let current = sections[0];
    for (const s of sections) {
      if (window.scrollY >= s.el.offsetTop - 200) {
        current = s;
      }
    }
    links.forEach(l => l.classList.remove('active'));
    if (current) current.link.classList.add('active');
  });
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

  let gameRunning = false;
  let isPaused = false;
  let gameAnimFrame = null;

  // Game constants & state
  const BLOCK = 8;
  let PADDLE_W = 84;
  const PADDLE_H = 10;
  const BALL_R = 5;

  let bricks = [];
  let brickParticles = [];
  let ball = { x: 0, y: 0, vx: 3.5, vy: -3.5 };
  let paddle = { x: 0 };
  let score = 0;
  let lives = 3;
  let keys = { left: false, right: false };
  let ballAttached = true;

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
    PADDLE_W = rect.width < 500 ? 70 : 90;
  }

  function buildBricks() {
    bricks = [];
    brickParticles = [];
    const w = gameCanvas.getBoundingClientRect().width;
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
                w: BLOCK - 1,
                h: BLOCK - 1,
                alive: true,
                color: color
              });
            }
          }
        }
      }
    }

    const h = gameCanvas.getBoundingClientRect().height;
    addLine(text1, Math.floor(h / BLOCK * 0.16), '#f4f4f6');
    addLine(text2, Math.floor(h / BLOCK * 0.16) + charH + 2, '#cdc6b6');

    score = 0;
    lives = 3;
    updateScoreUI();
    updateLivesUI();

    const cw = gameCanvas.getBoundingClientRect().width;
    const ch = gameCanvas.getBoundingClientRect().height;
    paddle.x = cw / 2 - PADDLE_W / 2;
    ballAttached = false;
    ball.x = cw / 2;
    ball.y = ch - 50;
    ball.vx = 3.5 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -3.5;
  }

  function spawnBrickExplosion(b) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      brickParticles.push({
        x: b.x + b.w / 2,
        y: b.y + b.h / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
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

    // Subtle starry background in game canvas
    gameCtx.fillStyle = '#08080a';
    gameCtx.fillRect(0, 0, w, h);

    // Bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      gameCtx.fillStyle = b.color;
      gameCtx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Explosion particles
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
    gameCtx.roundRect(paddle.x, h - 28, PADDLE_W, PADDLE_H, [3, 3, 3, 3]);
    gameCtx.fill();

    // Ball
    gameCtx.fillStyle = '#ffffff';
    gameCtx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    gameCtx.shadowBlur = 8;
    gameCtx.beginPath();
    gameCtx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    gameCtx.fill();
    gameCtx.shadowBlur = 0;

    // Paused overlay
    if (isPaused) {
      gameCtx.fillStyle = 'rgba(5, 5, 5, 0.7)';
      gameCtx.fillRect(0, 0, w, h);
      gameCtx.font = '600 16px "Space Grotesk", sans-serif';
      gameCtx.fillStyle = '#f4f4f6';
      gameCtx.textAlign = 'center';
      gameCtx.fillText('PAUSED', w / 2, h / 2 - 10);
      gameCtx.font = '400 12px "Inter", sans-serif';
      gameCtx.fillStyle = '#8e8e93';
      gameCtx.fillText('Press SPACE to resume', w / 2, h / 2 + 15);
    }
  }

  function updateGame() {
    if (isPaused) return;

    const w = gameCanvas.getBoundingClientRect().width;
    const h = gameCanvas.getBoundingClientRect().height;

    // Keyboard paddle control
    const paddleSpeed = 8;
    if (keys.left) paddle.x -= paddleSpeed;
    if (keys.right) paddle.x += paddleSpeed;
    paddle.x = Math.max(0, Math.min(w - PADDLE_W, paddle.x));

    // Update brick particles
    for (let i = brickParticles.length - 1; i >= 0; i--) {
      const p = brickParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.alpha -= 0.04;
      if (p.alpha <= 0) {
        brickParticles.splice(i, 1);
      }
    }

    if (ballAttached) {
      ball.x = paddle.x + PADDLE_W / 2;
      ball.y = h - 38;
      return;
    }

    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

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
      ball.y + BALL_R >= h - 28 &&
      ball.y - BALL_R <= h - 18 &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + PADDLE_W
    ) {
      ball.vy = -Math.abs(ball.vy);
      // Angle deflection based on hit point
      const hitPos = (ball.x - paddle.x) / PADDLE_W;
      ball.vx = (hitPos - 0.5) * 8;
    }

    // Ball fell off screen
    if (ball.y > h + 20) {
      lives--;
      updateLivesUI();

      if (lives > 0) {
        // Respawn ball
        ballAttached = true;
        setTimeout(() => {
          ballAttached = false;
          ball.vx = 3.5 * (Math.random() > 0.5 ? 1 : -1);
          ball.vy = -3.5;
        }, 700);
      } else {
        // Game Over
        gameRunning = false;
        if (startBtn) startBtn.textContent = 'GAME OVER — PLAY AGAIN';
        return;
      }
    }

    // Brick collision
    for (const b of bricks) {
      if (!b.alive) continue;
      if (
        ball.x + BALL_R > b.x &&
        ball.x - BALL_R < b.x + b.w &&
        ball.y + BALL_R > b.y &&
        ball.y - BALL_R < b.y + b.h
      ) {
        b.alive = false;
        spawnBrickExplosion(b);
        ball.vy *= -1;
        score += 10;
        updateScoreUI();
        break;
      }
    }

    // Win check
    if (bricks.length > 0 && bricks.every(b => !b.alive)) {
      gameRunning = false;
      if (startBtn) startBtn.textContent = 'YOU WIN! PLAY AGAIN';
    }
  }

  function gameLoop() {
    if (!gameRunning) {
      drawGame();
      return;
    }
    updateGame();
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
      if (gameRunning) {
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

  // Mouse control for paddle
  gameCanvas.addEventListener('mousemove', (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - PADDLE_W / 2;
    paddle.x = Math.max(0, Math.min(rect.width - PADDLE_W, paddle.x));
  });

  // Touch control for paddle
  gameCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = gameCanvas.getBoundingClientRect();
    paddle.x = e.touches[0].clientX - rect.left - PADDLE_W / 2;
    paddle.x = Math.max(0, Math.min(rect.width - PADDLE_W, paddle.x));
  }, { passive: false });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (isPaused) {
        isPaused = false;
        startBtn.textContent = 'PLAYING...';
        return;
      }
      resizeGame();
      buildBricks();
      gameRunning = true;
      isPaused = false;
      startBtn.textContent = 'PLAYING...';
      if (gameAnimFrame) cancelAnimationFrame(gameAnimFrame);
      gameLoop();
    });
  }

  window.addEventListener('resize', () => {
    resizeGame();
    if (!gameRunning) drawGame();
  });

  // Initial draw
  resizeGame();
  buildBricks();
  drawGame();
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
  initCapabilities();
  initScrollReveal();
  initNavbar();
  initSmoothScroll();
  initGame();
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
