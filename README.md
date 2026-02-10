# Juan Calderon — Portfolio

Personal portfolio website for Juan Calderon, a UC Berkeley EECS student. The site highlights work experience, research publications, patents, and software projects spanning full-stack development, AI/ML, and computational research.

## Tech Stack

- **HTML5** — Semantic markup, no framework
- **CSS3** — Custom styling with CSS Grid, Flexbox, keyframe animations, backdrop blur effects, and responsive breakpoints (768px / 480px)
- **Vanilla JavaScript (ES6)** — Intersection Observer API for scroll-triggered animations, dynamic navbar, mobile hamburger menu, and a notification system
- **Google Fonts** — SF Pro Display with system font fallbacks

No build tools, bundlers, or npm dependencies. The site is fully static.

## Sections

- **Hero** — Animated gradient text, floating geometric shapes, profile image with parallax scrolling
- **About** — Bio, interests (algorithms, low-level programming, rock climbing, biking), and interactive tilted image grid
- **Publications & Research** — Published paper in *Microorganisms* (2023), a pending US patent (US 2024/0415923 A1), and a computational chemistry presentation
- **Experience** — SDE Intern at AWS (CI/CD with ECS Fargate, RAG agents with Anthropic Claude API), Research Assistant at Emory University and Georgia Tech
- **Skills** — Java, Python, C/C++, RISC-V, JavaScript, React, Node.js, SQL, Kubernetes, Docker, AWS, LangGraph, LangChain, CI/CD, and more
- **Projects** — Homely (full-stack marketplace with AI design advisory), Deterministic World Generation (Java game with Prim's algorithm), WordNet Hyponym Graph (BFS/DFS on 800+ years of English), Tower Stacking Game
- **Contact** — Email, LinkedIn, and GitHub links

## Project Structure

```
├── index.html       # Single-page site
├── styles.css       # All styling
├── script.js        # Interactivity and animations
├── Images/          # Profile photos, logos, thumbnails
├── DeterministicWorld/  # Screenshots for project showcase
└── HyponymGraph/        # Screenshots for project showcase
```

## Run Locally

Open `index.html` in a browser, or use a local server:

```bash
# Python
python3 -m http.server

# VS Code
# Install the Live Server extension and click "Go Live"
```

## Deploy

The site is static HTML/CSS/JS with no build step. Deploy by pushing to GitHub Pages, dropping the folder onto Netlify, or importing the repo into Vercel.
