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

  /* ---- scrollspy: mark the section currently in view --------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
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

  /* ---- hero: a minimum spanning tree, drawn with Prim's algorithm --------
     Same algorithm as the world generator in the Work section. Pure hairlines
     in the palette's own tokens; decorative only, so it is aria-hidden and the
     hero reads identically if this never runs.                              */
  (function () {
    var canvas = document.querySelector('.hero__viz');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var css = getComputedStyle(document.documentElement);
    var C_EDGE = css.getPropertyValue('--line-strong').trim() || '#c3bdb4';
    var C_NODE = css.getPropertyValue('--ink-faint').trim() || '#9a958e';
    var C_LIVE = css.getPropertyValue('--ink').trim() || '#1a1a1a';

    var PER_EDGE = 52;    // ms to grow one edge
    var HOLD = 4200;      // ms to admire the finished tree
    var W = 0, H = 0, nodes = [], edges = [], raf = 0, timer = 0, start = 0;
    var visible = true;

    function measure() {
      var r = canvas.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    // jittered grid: spreads points evenly where pure random would clump
    function scatter() {
      var target = Math.max(12, Math.min(42, Math.round(W * H / 9500)));
      var cols = Math.max(3, Math.round(Math.sqrt(target * W / H)));
      var rows = Math.max(3, Math.round(target / cols));
      nodes = [];
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          nodes.push({
            x: (x + 0.15 + Math.random() * 0.7) * (W / cols),
            y: (y + 0.15 + Math.random() * 0.7) * (H / rows)
          });
        }
      }
    }

    // Prim's: grow from one node, repeatedly taking the cheapest crossing edge
    function prim() {
      var inTree = [0], rest = [], i, j;
      for (i = 1; i < nodes.length; i++) rest.push(i);
      edges = [];
      while (rest.length) {
        var best = Infinity, from = 0, to = 0, at = 0;
        for (i = 0; i < inTree.length; i++) {
          var a = nodes[inTree[i]];
          for (j = 0; j < rest.length; j++) {
            var b = nodes[rest[j]];
            var d = (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
            if (d < best) { best = d; from = inTree[i]; to = rest[j]; at = j; }
          }
        }
        edges.push([from, to]);
        inTree.push(to);
        rest.splice(at, 1);
      }
    }

    function render(grown, partial) {
      ctx.clearRect(0, 0, W, H);
      var i, a, b;

      ctx.lineWidth = 1;
      ctx.strokeStyle = C_EDGE;
      ctx.beginPath();
      for (i = 0; i < grown; i++) {
        a = nodes[edges[i][0]]; b = nodes[edges[i][1]];
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      if (partial != null && grown < edges.length) {
        a = nodes[edges[grown][0]]; b = nodes[edges[grown][1]];
        ctx.strokeStyle = C_LIVE;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * partial, a.y + (b.y - a.y) * partial);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = C_NODE;
      var seen = { 0: 1 };
      for (i = 0; i < grown; i++) seen[edges[i][1]] = 1;
      for (var k in seen) {
        var n = nodes[k];
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.8, 0, 6.2832);
        ctx.fill();
      }
    }

    function frame(now) {
      if (!start) start = now;
      var elapsed = now - start;
      var grown = Math.min(edges.length, Math.floor(elapsed / PER_EDGE));
      render(grown, (elapsed - grown * PER_EDGE) / PER_EDGE);
      if (grown >= edges.length) {
        raf = 0;
        timer = setTimeout(cycle, HOLD);   // fade out, then rewire
        canvas.style.opacity = '0';
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function cycle() {
      if (!visible) return;
      if (!measure()) return;
      scatter(); prim();
      start = 0;
      canvas.style.opacity = '1';
      if (reduced) { render(edges.length, null); return; }
      raf = requestAnimationFrame(frame);
    }

    function halt() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (timer) { clearTimeout(timer); timer = 0; }
    }

    // don't burn frames when the hero is scrolled away
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { if (!raf && !timer) cycle(); }
        else halt();
      }, { threshold: 0 }).observe(canvas);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { halt(); cycle(); }, 220);
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
