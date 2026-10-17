# Uday M.S. — Developer Portfolio

A cinematic, interactive personal developer portfolio showcasing full-stack AI engineering, cloud architectures, backend systems, and production software projects.

Built with vanilla web technologies, high-performance HTML5 Canvas particle systems, custom keyframe choreographies, and an interactive Breakout game engine.

---

## Overview

This repository houses the personal portfolio of **Uday M.S.**, an AI Systems & Backend Developer and Computer Science Engineering student based in Bengaluru, India. The portfolio features a minimalist dark aesthetic, silver-gradient typography, responsive editorial layouts, and kinetic animations designed for visual depth and performance.

---

## Features

- **Cinematic Hero Opening Sequence:**
  - Falling dot with double bounce physics and radial light halo expansion.
  - Tilted vertical stroke animation that fluidly bends and transitions cleanly into the centered name **UDAY** without residual visual artifacts.
  - Character-by-character medium-speed typing animation of **PORTFOLIO**.
  - Six-wave 2D Canvas particle reconstruction forming a detailed portrait with gentle floating and cursor-repulsion dynamics.
- **Dynamic Navigation:**
  - Prominent brand header (`UDAY M.S.`) with active section tracking via `IntersectionObserver`.
  - Coordinated sliding underline indicator (`.nav-active-line`) that glides seamlessly between navigation links.
  - Delicate scroll-direction hairline that extends as you scroll down and retracts on scroll up.
- **Scroll-Responsive Intro Section:**
  - Progressive word-by-word scroll-typing reveal that illuminates dimmed text into crisp white light as the visitor scrolls through the introduction.
- **Multi-Row Alternating Tech Stack Marquee:**
  - 4 continuous infinite-loop marquee tracks moving in alternating directions (left/right) at controlled speeds.
- **Interactive Breakout Arcade Game:**
  - Enlarged retro pixel typography rendering **HELLO WORLD** destructible bricks.
  - Idle preview mode with slow automatic ball bounce and smooth respawn.
  - Full gameplay mode triggered by "START GAME", featuring 3 lives, score counter, paddle deflection, particle explosions, persistent ghost brick traces, ball motion trails, and clean game-over/restart handling.
- **Projects Showcase & Architecture Deep Dives:**
  - In-depth presentation of 7 featured technical systems: Kestlo Platform, IngestIQ, LegalMind AI, CodeReviewer Pro, Sentinel Shield, Paper2Podcast, and InsightPulse.
- **Education, Resume & Glossy Contact Section:**
  - Academic history at Sapthagiri NPS University.
  - Downloadable verified PDF resume.
  - Translucent glossy contact card with verified direct links to GitHub, LinkedIn, email, and phone.

---

## Technology Stack

- **Markup & Structure:** Semantic HTML5
- **Styling:** Vanilla CSS (Custom design tokens, CSS Grid, Flexbox, glassmorphic backdrop filters, custom keyframe animations)
- **Scripting & Engine:** Vanilla JavaScript (ES6+ modular code)
- **Canvas Rendering:** HTML5 Canvas 2D Context API for high-density particle rasterization and Breakout game physics
- **Build Tool & Bundler:** [Vite](https://vite.dev/)
- **Typography:** Space Grotesk, Inter, and EB Garamond (Google Fonts)

---

## Project Structure

```text
portfolio/
├── index.html            # Main semantic HTML structure & SVG assets
├── style.css             # Design tokens, layouts, glassmorphism, animations
├── main.js               # Canvas particle engine, hero timeline, game & scroll logic
├── package.json          # Vite scripts and development dependencies
├── vite.config.js        # Vite bundler configuration
├── .gitignore            # Git exclusion rules
├── README.md             # Project documentation
└── public/
    ├── portrait-new.png  # Source image for Canvas particle portrait
    └── assets/
        └── Uday_MS.pdf   # Verified downloadable resume
```

---

## Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` (packaged with Node.js)

### 1. Clone the repository
```bash
git clone https://github.com/Uday-MS/portfolio.git
cd portfolio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start local development server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser to view the portfolio.

---

## Build and Deployment

### Production Build
To compile and bundle minified production assets:
```bash
npm run build
```
Compiled output will be placed in the `dist/` directory.

### Preview Production Build
To test the production build locally before deployment:
```bash
npm run preview
```

### Static Deployment
The output from `npm run build` is purely static and can be deployed directly to:
- **GitHub Pages**
- **Vercel** (`vercel --prod`)
- **Netlify**
- **Cloudflare Pages**

---

## Environment Variables

No external API keys or secrets are required to run this portfolio.

---

## Author & Connect

- **Author:** Uday M.S.
- **Location:** Bengaluru, Karnataka, India
- **GitHub:** [https://github.com/Uday-MS](https://github.com/Uday-MS)
- **LinkedIn:** [https://linkedin.com/in/uday-ms-2a8783335](https://linkedin.com/in/uday-ms-2a8783335)
- **Email:** [msudayuday@gmail.com](mailto:msudayuday@gmail.com)

---

## License

This project is open-source and available under the [MIT License](LICENSE).
