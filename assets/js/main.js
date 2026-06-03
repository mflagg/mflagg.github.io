/* =========================================================================
   Flagg Visual Computing — interactions
   1. Hero "feature-point" network canvas (evokes CV keypoints / 3D point cloud)
   2. Sticky-header state, mobile nav
   3. Scroll-reveal
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     1. Hero feature-point network
     ---------------------------------------------------------------------- */
  (function heroCanvas() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var points = [];
    var mouse = { x: -9999, y: -9999 };
    var raf = null;

    var ACCENT = [61, 215, 255];
    var VIOLET = [155, 107, 255];

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      // density scales with area, capped for performance
      var count = Math.min(110, Math.round((w * h) / 14000));
      points = [];
      for (var i = 0; i < count; i++) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.6,
          mix: Math.random() // accent <-> violet blend
        });
      }
    }

    function colorFor(mix, alpha) {
      var r = Math.round(ACCENT[0] + (VIOLET[0] - ACCENT[0]) * mix);
      var g = Math.round(ACCENT[1] + (VIOLET[1] - ACCENT[1]) * mix);
      var b = Math.round(ACCENT[2] + (VIOLET[2] - ACCENT[2]) * mix);
      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }

    var LINK = 132; // link distance

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.x += p.vx;
        p.y += p.vy;

        // gentle wrap
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;

        // subtle attraction to cursor
        var mdx = mouse.x - p.x, mdy = mouse.y - p.y;
        var md2 = mdx * mdx + mdy * mdy;
        if (md2 < 26000) {
          var f = (1 - md2 / 26000) * 0.015;
          p.vx += mdx * f * 0.02;
          p.vy += mdy * f * 0.02;
        }
        // damping so it never runs away
        p.vx *= 0.995; p.vy *= 0.995;
      }

      // links
      for (var a = 0; a < points.length; a++) {
        for (var b = a + 1; b < points.length; b++) {
          var pa = points[a], pb = points[b];
          var dx = pa.x - pb.x, dy = pa.y - pb.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            var alpha = (1 - d / LINK) * 0.32;
            ctx.strokeStyle = colorFor((pa.mix + pb.mix) / 2, alpha);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (var k = 0; k < points.length; k++) {
        var pt = points[k];
        ctx.fillStyle = colorFor(pt.mix, 0.9);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf) return;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    resize();
    window.addEventListener("resize", debounce(resize, 200));

    window.addEventListener("mousemove", function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    window.addEventListener("mouseleave", function () { mouse.x = -9999; mouse.y = -9999; });

    if (reduceMotion) {
      // draw a single static frame, no animation loop
      frame();
      stop();
    } else {
      start();
      // pause when hero scrolled out of view
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? start() : stop();
        }, { threshold: 0 });
        io.observe(canvas);
      }
      document.addEventListener("visibilitychange", function () {
        document.hidden ? stop() : start();
      });
    }
  })();

  /* ----------------------------------------------------------------------
     2. Header state + mobile nav
     ---------------------------------------------------------------------- */
  (function nav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");

    function onScroll() {
      if (window.scrollY > 24) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          links.classList.remove("open");
          toggle.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  })();

  /* ----------------------------------------------------------------------
     3. Scroll reveal
     ---------------------------------------------------------------------- */
  (function reveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------------- */
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }
})();
