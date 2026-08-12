# juancal28.github.io

Personal portfolio for Juan Calderon — EECS at UC Berkeley. Live at
**https://juancal28.github.io**.

Hand-written static site: no framework, no build step, no dependencies.
Push to `main` and GitHub Pages serves it from the repo root.

## Local development

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

That's the whole toolchain. Edit the three source files and reload.

## Layout

```
index.html            all markup and all content
styles.css            the entire stylesheet, organised with @layer
script.js             progressive enhancement only (~90 lines)
favicon.svg           "JC" monogram
assets/fonts/         self-hosted woff2 (General Sans, JetBrains Mono)
assets/img/           optimised webp + the Homely logo
assets/symposium-slides.pdf
```

Content lives directly in `index.html` as semantic HTML rather than in a data
file rendered by JavaScript. For a static portfolio that recruiters and
crawlers hit, client-side rendering would cost SEO and break without JS; the
DRY win isn't worth it for four projects and three publications.

## Design system

Sharp hairline grid, geometric grotesque display type, monospace for every
label. The visual reference is [maap.cc](https://maap.cc).

- **Type** — General Sans (display, weight 500, tight tracking) + JetBrains
  Mono. Every eyebrow, meta line, tag and micro-link is mono at 12px; that is
  the core signal of the whole design.
- **Colour** — white, warm off-white (`#f4f2ef`), near-black (`#111110`), ink
  `#1a1a1a`. **No accent hue anywhere.** Emphasis is invert or underline.
- **No `box-shadow`, no gradients, `border-radius: 0` globally.** Depth comes
  from 1px rules and background bands only.
- Tokens live in `@layer tokens` at the top of `styles.css`. Change a value
  there and it propagates everywhere.

Layer order is `tokens, base, layout, components, utilities`.

## Things worth knowing before editing

- **Content must render without JavaScript.** Reveal animations are opt-in via
  a `.js` class set by an inline script in `<head>`; the CSS only hides
  `.reveal` under that class. Never write a rule that hides content
  unconditionally and relies on JS to show it.
- `script.js` handles the mobile menu, scroll reveal, nav state, scrollspy, the
  hero visualisation, and assembling `mailto:` links from the obfuscated
  `data-mail` attributes. Nothing in it is required to read the page.
- **The hero graphic is a Galton board**, to go with the Gauss quotation.
  Beads fall through a peg lattice going left or right at each row; the
  binomial pile-up converges on the normal distribution, and the Gaussian
  curve plus μ/±σ markers fade in over the histogram once about a third of
  the beads have landed. Bars are rescaled continuously so the tallest always
  fills the bin area, which is why the shape settles rather than overflows.
  Tuning knobs at the top of the block: `ROWS`, `TOTAL`, `SPAWN`, `ROW_MS`,
  `HOLD`. A full cycle is roughly 13s.
  It reads its colours from the CSS tokens, so retheming the palette rethemes
  the graphic. It is `aria-hidden`, pauses via `IntersectionObserver` when the
  hero scrolls out of view, settles straight to the expected distribution under
  `prefers-reduced-motion`, and draws nothing at all without JS — in that case
  the hero is meant to read as intentionally empty, not broken.
  A CSS `mask-image` fades it out behind the quotation; if you change the
  quote's size or position, adjust that mask on `.hero__viz`.
  Note that the board deliberately sits to the right on wide viewports and in
  an upper band on narrow ones, to stay clear of the quote — see `layout()`.
- The nav panel transitions `visibility` with a `0s` delay rather than a
  duration — visibility is stepped, not interpolated, and giving it a duration
  leaves the panel stuck hidden.
- Project thumbnails use `object-fit: contain`. They are UI screenshots and
  logos, not photography; cropping a white-background screenshot lands on an
  empty region and the tile looks broken.
- Breakpoints are `min-width` at 640 / 760 / 900 / 1200. The three-column work
  and publication rows engage at 900 — below that the text column becomes an
  unreadable ribbon.

## Adding a project

Copy an existing `<article class="row row--work">` block in the Work section,
bump the `row__idx` number, and add a webp to `assets/img/`. Optimise it first:

```bash
sips -Z 1400 source.png --out /tmp/r.png
cwebp -q 82 -m 6 /tmp/r.png -o assets/img/name.webp
```

Give every `<img>` explicit `width`/`height` and `loading="lazy"`.

## Publication thumbnails

Each publication row carries a thumbnail in a `.row__media--doc` tile with a
mono format badge. Add `row--media` to the `<article>` to switch that row into
the four-column layout; without it the row stays three-column and no gap is left
behind.

To make a thumbnail from a PDF (Ghostscript + cwebp, both already installed):

```bash
gs -dNOPAUSE -dBATCH -q -sDEVICE=png16m -r220 -dFirstPage=1 -dLastPage=1 \
   -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile=/tmp/p1.png doc.pdf
# portrait pages: crop the top 16:10 band so the tile isn't mostly letterbox
cwebp -crop 0 0 <width> <width*0.625> -resize 1000 0 -q 82 /tmp/p1.png \
      -o assets/img/name.webp
```

Crop with `cwebp -crop` rather than `sips -c` — sips anchors to the centre and
will cut the header off a document.

Total page weight is ~708 KB including both fonts and all ten images. Keep it
in that ballpark.
