/* Progressive enhancement only. Every section renders and reads correctly
   with this file absent — nothing here is required to see the content. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- nav: background + hairline once scrolled off the hero ------------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- mobile menu ------------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var panel = document.getElementById('navPanel');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ---- scroll reveal ----------------------------------------------------- */
  var targets = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- scrollspy: mark the section currently in view ---------------------
     In-page anchors only. The nav also carries an off-site Dashboard link, and
     feeding an absolute URL to querySelector below throws a SyntaxError that
     would take the rest of this file down with it.                          */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'))
    .filter(function (a) { return a.getAttribute('href').charAt(0) === '#'; });
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- hero: a Galton board settling into a normal distribution ----------
     Beads fall through a lattice of pegs, going left or right at each row.
     The binomial pile-up they produce converges on the Gaussian, which fades
     in over the histogram once enough have landed — the central limit theorem
     doing its work, to go with the Gauss quotation. Decorative only: the
     canvas is aria-hidden and the hero reads fine if this never runs.       */
  (function () {
    var canvas = document.querySelector('.hero__viz');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var css = getComputedStyle(document.documentElement);
    var C_PEG   = css.getPropertyValue('--line-strong').trim() || '#c3bdb4';
    var C_RULE  = css.getPropertyValue('--line').trim() || '#dcd8d2';
    var C_BEAD  = css.getPropertyValue('--ink').trim() || '#1a1a1a';
    var C_LABEL = css.getPropertyValue('--ink-faint').trim() || '#9a958e';

    var ROWS = 12;        // peg rows -> ROWS+1 bins
    var TOTAL = 210;      // beads per run
    var SPAWN = 45;       // ms between beads
    var ROW_MS = 58;      // ms to cross one peg row
    var HOLD = 3400;      // ms to hold the finished distribution

    var W = 0, H = 0, b = {}, bins = [], beads = [], released = 0, landed = 0;
    var raf = 0, timer = 0, prev = 0, acc = 0, visible = true;

    function measure() {
      var r = canvas.getBoundingClientRect();
      if (r.width < 60 || r.height < 60) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    // keep the board clear of the quotation: right-hand side on wide screens,
    // upper band on narrow ones
    function layout() {
      var wide = W / H > 1.35;
      var x, y, w, h;
      if (wide) { w = W * 0.50; h = H * 0.94; x = W - w; y = H * 0.03; }
      else      { w = W * 0.96; h = H * 0.56; x = W * 0.02; y = 0; }
      b = { x: x, y: y, w: w, h: h };
      b.cx = x + w / 2;
      b.gapX = w / (ROWS + 3);
      b.pegH = h * 0.58;
      b.gapY = b.pegH / (ROWS + 1);
      b.binTop = y + b.pegH + h * 0.07;
      b.binH = h - b.pegH - h * 0.07;
      b.unitMax = b.binH * 0.92;
    }

    function reset() {
      bins = [];
      for (var i = 0; i <= ROWS; i++) bins.push(0);
      beads = []; released = 0; landed = 0; acc = 0; prev = 0;
    }

    function spawn() {
      var path = [0], k;
      for (k = 0; k < ROWS; k++) {
        path.push(path[k] + (Math.random() < 0.5 ? -0.5 : 0.5));
      }
      beads.push({ path: path, t: 0, bin: path[ROWS] + ROWS / 2, drop: -1 });
      released++;
    }

    function unit() {
      var max = 1;
      for (var i = 0; i <= ROWS; i++) if (bins[i] > max) max = bins[i];
      return b.unitMax / max;
    }

    function ease(f) { return f * f * (3 - 2 * f); }

    function beadXY(o) {
      if (o.drop >= 0) return { x: b.cx + (o.bin - ROWS / 2) * b.gapX, y: o.drop };
      var r = Math.floor(o.t), f = o.t - r;
      if (r >= ROWS) r = ROWS - 1, f = 1;
      var off = o.path[r] + (o.path[r + 1] - o.path[r]) * ease(f);
      return { x: b.cx + off * b.gapX, y: b.y + o.t * b.gapY };
    }

    function draw(showCurve) {
      ctx.clearRect(0, 0, W, H);
      var u = unit(), i, k, px, py;

      // pegs
      ctx.fillStyle = C_PEG;
      for (var r = 0; r < ROWS; r++) {
        for (i = 0; i <= r; i++) {
          px = b.cx + (i - r / 2) * b.gapX;
          py = b.y + (r + 1) * b.gapY;
          ctx.beginPath(); ctx.arc(px, py, 1.15, 0, 6.2832); ctx.fill();
        }
      }

      // baseline
      ctx.strokeStyle = C_RULE; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.cx - (ROWS / 2 + 0.9) * b.gapX, b.binTop + b.binH + 0.5);
      ctx.lineTo(b.cx + (ROWS / 2 + 0.9) * b.gapX, b.binTop + b.binH + 0.5);
      ctx.stroke();

      // histogram
      var bw = b.gapX * 0.78;
      for (k = 0; k <= ROWS; k++) {
        if (!bins[k]) continue;
        var bh = bins[k] * u;
        var bx = b.cx + (k - ROWS / 2) * b.gapX - bw / 2;
        ctx.fillStyle = C_RULE;
        ctx.fillRect(bx, b.binTop + b.binH - bh, bw, bh);
        ctx.strokeStyle = C_PEG;
        ctx.strokeRect(Math.round(bx) + 0.5, Math.round(b.binTop + b.binH - bh) + 0.5, Math.round(bw), Math.round(bh));
      }

      // the Gaussian the pile-up is converging on
      if (showCurve > 0) {
        var mu = ROWS / 2, sd = Math.sqrt(ROWS * 0.25);
        ctx.strokeStyle = C_BEAD;
        ctx.globalAlpha = 0.55 * showCurve;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var s = 0; s <= 220; s++) {
          var kk = (s / 220) * ROWS;
          var p = Math.exp(-0.5 * Math.pow((kk - mu) / sd, 2));
          var cx2 = b.cx + (kk - ROWS / 2) * b.gapX;
          var cy2 = b.binTop + b.binH - p * b.unitMax;
          s ? ctx.lineTo(cx2, cy2) : ctx.moveTo(cx2, cy2);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;

        // mu and sigma markers
        ctx.fillStyle = C_LABEL;
        ctx.font = '400 10px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = showCurve;
        var marks = [[0, 'μ'], [-sd, '−σ'], [sd, '+σ']];
        for (i = 0; i < marks.length; i++) {
          var mx = b.cx + marks[i][0] * b.gapX;
          ctx.strokeStyle = C_PEG;
          ctx.beginPath();
          ctx.moveTo(mx, b.binTop + b.binH + 1);
          ctx.lineTo(mx, b.binTop + b.binH + 6);
          ctx.stroke();
          ctx.fillText(marks[i][1], mx, b.binTop + b.binH + 19);
        }
        ctx.globalAlpha = 1;
      }

      // beads in flight
      ctx.fillStyle = C_BEAD;
      for (i = 0; i < beads.length; i++) {
        var p2 = beadXY(beads[i]);
        ctx.beginPath(); ctx.arc(p2.x, p2.y, 2, 0, 6.2832); ctx.fill();
      }
    }

    function step(now) {
      if (!prev) prev = now;
      var dt = Math.min(now - prev, 48);
      prev = now;

      if (released < TOTAL) {
        acc += dt;
        while (acc >= SPAWN && released < TOTAL) { acc -= SPAWN; spawn(); }
      }

      var u = unit();
      for (var i = beads.length - 1; i >= 0; i--) {
        var o = beads[i];
        if (o.drop < 0) {
          o.t += dt / ROW_MS;
          if (o.t >= ROWS) { o.t = ROWS; o.drop = b.y + ROWS * b.gapY; }
        } else {
          var rest = b.binTop + b.binH - bins[o.bin] * u - 2;
          o.drop += dt * 0.9;
          if (o.drop >= rest) { bins[o.bin]++; landed++; beads.splice(i, 1); }
        }
      }

      var progress = landed / TOTAL;
      var fade = progress < 0.35 ? 0 : Math.min(1, (progress - 0.35) / 0.3);
      draw(fade);

      if (landed >= TOTAL) {
        raf = 0;
        // hold the finished distribution on screen, THEN fade and rebuild --
        // fading first would leave the hero blank for the whole hold
        timer = setTimeout(function () {
          canvas.style.opacity = '0';
          timer = setTimeout(cycle, 520);   // matches the CSS opacity transition
        }, HOLD);
        return;
      }
      raf = requestAnimationFrame(step);
    }

    function cycle() {
      if (!visible || !measure()) return;
      layout(); reset();
      canvas.style.opacity = '1';
      if (reduced) {           // settle straight to the expected distribution
        var c = 1;
        for (var k = 0; k <= ROWS; k++) {
          bins[k] = TOTAL * c / Math.pow(2, ROWS);
          c = c * (ROWS - k) / (k + 1);
        }
        draw(1);
        return;
      }
      raf = requestAnimationFrame(step);
    }

    function halt() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (timer) { clearTimeout(timer); timer = 0; }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible) { if (!raf && !timer) cycle(); } else halt();
      }, { threshold: 0 }).observe(canvas);
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { halt(); cycle(); }, 220);
    });

    cycle();
  })();

  /* ---- assemble mailto: links -------------------------------------------
     Addresses stay obfuscated in the markup so scrapers get "[at]" text,
     but real visitors get a working link.                                   */
  document.querySelectorAll('[data-mail]').forEach(function (el) {
    var parts = el.getAttribute('data-mail').split('|');
    if (parts.length !== 2) return;
    var address = parts[0] + '@' + parts[1];
    var a = document.createElement('a');
    a.href = 'mailto:' + address;
    a.textContent = address;
    el.textContent = '';
    el.appendChild(a);
  });
})();
