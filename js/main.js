/* =========================================================
   HVAC Services — interactions & animation
   ========================================================= */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduced = doc.classList.contains('reduced');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var yearEl = $('.year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -70, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(id === '#home' ? 0 : el);
      if (id !== '#main') history.replaceState(null, '', id);
    });
  });

  /* ---------- Mobile menu ---------- */
  var burger = $('.burger');
  var menu = $('#mobile-menu');
  var nav = $('.nav');
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.add('menu-open');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('menu-open');
    if (lenis) lenis.start();
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 700);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Nav: scrolled / hide on scroll down / active link ---------- */
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    if (!nav.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;
    var bar = $('.progress span');
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var links = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'services', 'about', 'why', 'faq', 'contact'].forEach(function (id) {
      var s = document.getElementById(id); if (s) io.observe(s);
    });
  }

  /* ---------- Custom cursor ---------- */
  var cursor = $('.cursor');
  if (cursor && finePointer && !reduced) {
    var dot = $('.cursor__dot'), ring = $('.cursor__ring');
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .tile, .knob, input, select, textarea'));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.28;
        var y = (e.clientY - r.top - r.height / 2) * 0.38;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Bento tile tilt + spotlight ---------- */
  if (finePointer && !reduced) {
    $$('.tile').forEach(function (t) {
      t.addEventListener('mousemove', function (e) {
        var r = t.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        t.style.setProperty('--mx', px * 100 + '%');
        t.style.setProperty('--my', py * 100 + '%');
        t.style.transform = 'perspective(900px) rotateX(' + (0.5 - py) * 7 + 'deg) rotateY(' + (px - 0.5) * 9 + 'deg)';
      });
      t.addEventListener('mouseleave', function () { t.style.transform = ''; });
    });
  }

  /* ---------- Hero airflow canvas ---------- */
  (function airflow() {
    var canvas = $('.hero__flow');
    if (!canvas || reduced) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr, particles = [], running = true;
    var mouse = { x: -9999, y: -9999 };
    var colors = ['61,123,255', '52,209,182', '61,123,255', '255,107,74'];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(110, w / 12));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(spawn(true));
    }
    function spawn(anywhere) {
      return {
        x: anywhere ? Math.random() * w : -40,
        y: Math.random() * h,
        v: 0.6 + Math.random() * 1.6,
        len: 30 + Math.random() * 90,
        amp: 10 + Math.random() * 30,
        ph: Math.random() * Math.PI * 2,
        a: 0.12 + Math.random() * 0.3,
        c: colors[(Math.random() * colors.length) | 0],
        lw: 0.8 + Math.random() * 1.6
      };
    }
    var t = 0;
    function frame() {
      if (!running) return;
      t += 0.012;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.v;
        var dy = Math.sin(p.x * 0.006 + p.ph + t) * p.amp;
        var y = p.y + dy;
        var mdx = p.x - mouse.x, mdy = y - mouse.y, d2 = mdx * mdx + mdy * mdy;
        if (d2 < 22000) { p.y += (mdy > 0 ? 1 : -1) * 1.4; p.x += 1.2; }
        var grad = ctx.createLinearGradient(p.x - p.len, y, p.x, y);
        grad.addColorStop(0, 'rgba(' + p.c + ',0)');
        grad.addColorStop(1, 'rgba(' + p.c + ',' + p.a + ')');
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.lw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var s = 0; s <= 6; s++) {
          var sx = p.x - p.len + (p.len * s) / 6;
          var sy = p.y + Math.sin(sx * 0.006 + p.ph + t) * p.amp;
          s ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
        }
        ctx.stroke();
        if (p.x - p.len > w) particles[i] = spawn(false);
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(frame); }
        running = vis;
      }).observe(canvas);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- Comfort dial ---------- */
  (function dial() {
    var section = $('.dial');
    var knob = $('.knob');
    if (!section || !knob) return;
    var MIN = 60, MAX = 84, SWEEP = 270;
    var tempEl = $('.knob__temp b'), labelEl = $('.knob__label');
    var nameEl = $('.dial__mode-name'), textEl = $('.dial__mode-text'), tagsEl = $('.dial__tags');
    var ticksEl = $('.knob__ticks');
    var modes = {
      cold: { label: 'Heating', name: 'Too chilly?', text: 'When the house won’t warm up, we repair, replace and tune furnaces and heat pumps so heat comes back fast and stays steady.', tags: ['Furnace repair', 'Heat pumps', 'Safety checks'] },
      comfort: { label: 'Comfort', name: 'Comfort zone', text: 'Right where you want it. Regular tune-ups and clean filters keep it that way all year.', tags: ['Tune-ups', 'Air quality', 'Maintenance'] },
      hot: { label: 'Cooling', name: 'Too hot?', text: 'When the cool air quits, we diagnose, repair or install a properly sized AC or mini-split so every room cools evenly.', tags: ['AC repair', 'AC installation', 'Mini-splits'] }
    };
    var ticks = [];
    for (var i = 0; i <= 24; i++) {
      var tk = document.createElement('i');
      tk.style.transform = 'rotate(' + (-135 + (SWEEP / 24) * i) + 'deg)';
      ticksEl.appendChild(tk); ticks.push(tk);
    }
    var value = 72, mode = '';
    function modeFor(v) { return v <= 67 ? 'cold' : v >= 77 ? 'hot' : 'comfort'; }
    function render(v) {
      var p = (v - MIN) / (MAX - MIN);
      knob.style.setProperty('--a', (-135 + p * SWEEP) + 'deg');
      knob.style.setProperty('--p', (p * 100).toFixed(2));
      var rounded = Math.round(v);
      tempEl.textContent = rounded;
      ticks.forEach(function (tk, idx) { tk.classList.toggle('on', idx <= p * 24 + 0.001); });
      var m = modeFor(rounded);
      knob.setAttribute('aria-valuenow', rounded);
      knob.setAttribute('aria-valuetext', rounded + ' degrees, ' + modes[m].label.toLowerCase());
      if (m !== mode) {
        mode = m;
        section.setAttribute('data-mode', m);
        labelEl.textContent = modes[m].label;
        var swap = function () {
          nameEl.textContent = modes[m].name;
          textEl.textContent = modes[m].text;
          tagsEl.innerHTML = modes[m].tags.map(function (t) { return '<li>' + t + '</li>'; }).join('');
        };
        if (hasGsap && !reduced) {
          gsap.timeline()
            .to([nameEl, textEl, tagsEl], { y: -12, opacity: 0, duration: 0.2, stagger: 0.04, ease: 'power2.in', onComplete: swap })
            .fromTo([nameEl, textEl, tagsEl], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power3.out' });
        } else swap();
      }
    }
    function set(v) { value = Math.max(MIN, Math.min(MAX, v)); render(value); }
    function fromPointer(e) {
      var r = knob.getBoundingClientRect();
      var ang = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      if (ang > 135) ang = 135; if (ang < -135) ang = -135;
      set(MIN + ((ang + 135) / SWEEP) * (MAX - MIN));
    }
    var dragging = false;
    knob.addEventListener('pointerdown', function (e) { dragging = true; knob.setPointerCapture(e.pointerId); fromPointer(e); e.preventDefault(); });
    knob.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    knob.addEventListener('pointerup', function () { dragging = false; set(Math.round(value)); });
    knob.addEventListener('pointercancel', function () { dragging = false; });
    knob.addEventListener('keydown', function (e) {
      var k = e.key, v = Math.round(value);
      if (k === 'ArrowRight' || k === 'ArrowUp') v++;
      else if (k === 'ArrowLeft' || k === 'ArrowDown') v--;
      else if (k === 'PageUp') v += 4;
      else if (k === 'PageDown') v -= 4;
      else if (k === 'Home') v = MIN;
      else if (k === 'End') v = MAX;
      else return;
      e.preventDefault(); set(v);
    });
    render(value);

    // A little demo sweep the first time the dial is seen.
    if (hasGsap && !reduced) {
      var demo = { v: 72 };
      ScrollTrigger.create({
        trigger: section, start: 'top 55%', once: true,
        onEnter: function () {
          if (dragging) return;
          gsap.timeline()
            .to(demo, { v: 63, duration: 1, ease: 'power2.inOut', onUpdate: function () { if (!dragging) set(demo.v); } })
            .to(demo, { v: 81, duration: 1.4, ease: 'power2.inOut', onUpdate: function () { if (!dragging) set(demo.v); } })
            .to(demo, { v: 72, duration: 1, ease: 'power3.out', onUpdate: function () { if (!dragging) set(demo.v); }, onComplete: function () { if (!dragging) set(72); } });
        }
      });
    }
  })();

  /* ---------- FAQ accordion ---------- */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      $$('.acc__btn').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        var p = document.getElementById(b.getAttribute('aria-controls'));
        if (p) p.classList.remove('is-open');
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById(btn.getAttribute('aria-controls')).classList.add('is-open');
      }
      if (hasGsap) setTimeout(function () { ScrollTrigger.refresh(); }, 600);
    });
  });

  /* ---------- Quote form ---------- */
  (function form() {
    var f = $('.qform');
    if (!f) return;
    var status = $('.qform__status', f);
    var success = $('.qsuccess');
    var submitBtn = $('button[type="submit"]', f);
    var label = $('.qform__label', f);
    var dateInput = $('#f-date');
    if (dateInput) {
      var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dateInput.min = d.toISOString().slice(0, 10);
    }
    var rules = {
      name: function (v) { return v.trim().length >= 2 || 'Please enter your name.'; },
      phone: function (v) { return v.replace(/\D/g, '').length >= 10 || 'Please enter a valid phone number.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email.'; },
      address: function (v) { return v.trim().length >= 5 || 'Please enter the service address.'; },
      service: function (v) { return !!v || 'Please choose a service.'; }
    };
    function check(el) {
      var rule = rules[el.name];
      if (!rule) return true;
      var res = rule(el.value || '');
      var field = el.closest('.field');
      var err = $('.field__err', field);
      var ok = res === true;
      field.classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (err) { err.textContent = ok ? '' : res; el.setAttribute('aria-describedby', err.id); }
      return ok;
    }
    Object.keys(rules).forEach(function (n) {
      var el = f.elements[n];
      if (!el) return;
      el.addEventListener('blur', function () { if (el.value) check(el); });
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('is-invalid')) check(el); });
      el.addEventListener('change', function () { check(el); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      var firstBad = null;
      Object.keys(rules).forEach(function (n) {
        var el = f.elements[n];
        if (el && !check(el) && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }
      submitBtn.classList.add('is-loading');
      label.textContent = 'Sending…';
      var useEl = $('svg use', submitBtn); if (useEl) useEl.setAttribute('href', '#i-fan');
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(f)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        showSuccess();
      }).catch(function () {
        status.textContent = 'Something went wrong sending your request. Please try again or call (000) 000-0000.';
      }).then(function () {
        submitBtn.classList.remove('is-loading');
        label.textContent = 'Send my request';
        if (useEl) useEl.setAttribute('href', '#i-arrow');
      });
    });
    function showSuccess() {
      var done = function () {
        f.hidden = true; success.hidden = false; success.focus();
        if (hasGsap && !reduced) gsap.from(success.children, { y: 24, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
      };
      if (hasGsap && !reduced) gsap.to(f, { opacity: 0, y: -16, duration: 0.35, onComplete: function () { gsap.set(f, { clearProps: 'all' }); done(); } });
      else done();
    }
    $('.qsuccess__again').addEventListener('click', function () {
      f.reset(); success.hidden = true; f.hidden = false;
      $$('.field', f).forEach(function (x) { x.classList.remove('is-invalid'); });
      f.elements.name.focus();
    });
  })();

  /* =========================================================
     GSAP-driven motion
     ========================================================= */
  var loader = $('.loader');
  if (!hasGsap || reduced) {
    if (loader) loader.remove();
    if (!hasGsap) return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Split headings into words for reveal.
  $$('.split').forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true"><span>' + w + '</span></span>'; }).join(' ');
  });
  var statement = $('.about__statement.words');
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd">' + w + '</span>'; }).join(' ');
  }

  if (reduced) return;

  /* ---------- Intro: loader then hero ---------- */
  var heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
  heroTl
    .from('.hero__title .line__in', { yPercent: 110, rotate: 4, duration: 1.2, stagger: 0.12 })
    .from('.hero__pill', { y: 20, opacity: 0, duration: 0.8 }, '<0.1')
    .from('.hero__lead', { y: 30, opacity: 0, duration: 1 }, '<0.15')
    .from('.hero__actions > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1 }, '<0.1')
    .fromTo('.hero__frame', { clipPath: 'inset(100% 0% 0% 0% round 36px)' }, { clipPath: 'inset(0% 0% 0% 0% round 36px)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
    .from('.hero__frame img', { scale: 1.4, duration: 1.8, ease: 'expo.out' }, 0.3)
    .from('.chip', { scale: 0.6, opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: 'back.out(1.8)' }, 0.8)
    .from('.nav__inner > *', { y: -30, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.2)
    .add(function () {
      // Floating chips once they've landed.
      $$('.chip').forEach(function (c, i) {
        gsap.to(c, { y: i % 2 ? 12 : -12, duration: 2.6 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    });

  if (loader) {
    loader.style.animation = 'none';
    var num = $('.loader__num span', loader);
    var counter = { v: 60 };
    var lt = gsap.timeline({
      onComplete: function () { loader.remove(); }
    });
    lt.to('.loader__bar span', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
      .to(counter, { v: 72, duration: 1.4, ease: 'power2.inOut', onUpdate: function () { num.textContent = Math.round(counter.v); } }, 0)
      .to('.loader__fan', { scale: 1.3, duration: 0.3, ease: 'power2.in' }, 1.35)
      .to(loader.children, { y: -30, opacity: 0, duration: 0.45, stagger: 0.04, ease: 'power2.in' }, 1.45)
      .fromTo(loader, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, 1.7)
      .add(function () { heroTl.play(); }, 1.9);
  } else heroTl.play();

  /* ---------- Hero scroll + pointer parallax ---------- */
  gsap.to('.hero__fan', { rotate: 360, duration: 40, repeat: -1, ease: 'none' });
  gsap.to('.hero__frame img', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { y: -80, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__fan svg', { rotate: 220, scale: 1.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  if (finePointer) {
    var frame = $('.hero__frame');
    var rx = gsap.quickTo(frame, 'rotationY', { duration: 0.8, ease: 'power3' });
    var ry = gsap.quickTo(frame, 'rotationX', { duration: 0.8, ease: 'power3' });
    $('.hero').addEventListener('mousemove', function (e) {
      rx((e.clientX / window.innerWidth - 0.5) * 10);
      ry((e.clientY / window.innerHeight - 0.5) * -8);
    });
    $('.hero').addEventListener('mouseleave', function () { rx(0); ry(0); });
  }

  /* ---------- Ticker driven by scroll velocity ---------- */
  (function ticker() {
    var track = $('.ticker__track');
    if (!track) return;
    var x = 0, speed = 1, half = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure(); window.addEventListener('resize', measure);
    var boost = 0;
    ScrollTrigger.create({
      trigger: '.ticker', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) { boost = gsap.utils.clamp(-12, 12, self.getVelocity() / 200); }
    });
    gsap.ticker.add(function () {
      boost *= 0.94;
      speed = 1 + Math.abs(boost);
      x -= speed * (boost < -0.3 ? -1 : 1);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
    });
  })();

  /* ---------- Headings: word reveal ---------- */
  $$('.split').forEach(function (h) {
    gsap.from($$('.w > span', h), {
      yPercent: 110, rotate: 6, duration: 1, stagger: 0.06, ease: 'power4.out',
      scrollTrigger: { trigger: h, start: 'top 85%' }
    });
  });
  $$('.section .pill, .dial .pill, .shead__lead, .why__lead, .dial__lead, .contact__lead, .faq__head > p:last-child').forEach(function (el) {
    gsap.from(el, { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- Bento tiles ---------- */
  ScrollTrigger.batch('.tile', {
    start: 'top 88%',
    once: true,
    onEnter: function (batch) {
      gsap.fromTo(batch,
        { clipPath: 'inset(30% 10% 0% 10% round 28px)', y: 80, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0% round 28px)', y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: 'expo.out', clearProps: 'clipPath' });
      batch.forEach(function (t) {
        gsap.fromTo($('img', t), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out', clearProps: 'transform' });
      });
    }
  });
  gsap.set('.tile', { opacity: 0 });

  /* ---------- Dial entrance ---------- */
  gsap.from('.knob', { scale: 0.7, rotate: -90, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.dial', start: 'top 70%' } });
  gsap.from('.dial__mode', { x: -30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.dial', start: 'top 60%' } });

  /* ---------- About ---------- */
  if (statement) {
    gsap.fromTo($$('.wd', statement), { opacity: 0.14 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  }
  gsap.from('.about__list li', { x: -30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.about__list', start: 'top 88%' } });
  $$('.about__img').forEach(function (fig, i) {
    gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4, delay: i * 0.15, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: '.about__media', start: 'top 75%' } });
    gsap.from($('img', fig), { scale: 1.4, duration: 1.8, delay: i * 0.15, ease: 'expo.out', scrollTrigger: { trigger: '.about__media', start: 'top 75%' } });
    var speed = parseFloat(fig.getAttribute('data-speed')) || 0;
    gsap.to(fig, { y: function () { return -speed * window.innerHeight * 0.7; }, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });

  /* ---------- Why: stacking cards ---------- */
  var cards = $$('.scard');
  cards.forEach(function (card, i) {
    gsap.from(card, { y: 100, opacity: 0, rotateX: -20, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: card, start: 'top 95%' } });
    var nEl = $('.scard__n', card), target = parseInt(nEl.textContent, 10) || 0, cnt = { v: 0 };
    nEl.textContent = '00';
    gsap.to(cnt, { v: target, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: card, start: 'top 90%' },
      onUpdate: function () { nEl.textContent = String(Math.round(cnt.v)).padStart(2, '0'); } });
    if (i < cards.length - 1) {
      gsap.to(card, {
        scale: 0.92, opacity: 0.55, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top 85%', end: 'top 25%', scrub: true }
      });
    }
  });

  /* ---------- Process ---------- */
  var mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 641px)', narrow: '(max-width: 640px)' }, function (ctx) {
    var prop = ctx.conditions.wide ? 'scaleX' : 'scaleY';
    var from = {}; from[prop] = 0;
    var to = { ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: ctx.conditions.wide ? 'top 30%' : 'bottom 60%', scrub: true } };
    to[prop] = 1;
    gsap.fromTo('.steps__line span', from, to);
  });
  $$('.step').forEach(function (s, i) {
    var tl = gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 82%' } });
    tl.from($('.step__n', s), { scale: 0, rotate: -180, duration: 0.9, delay: i * 0.12, ease: 'back.out(2)' })
      .from([$('h3', s), $('p', s)], { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, '<0.3');
  });

  /* ---------- FAQ ---------- */
  gsap.from('.acc__item', { y: 30, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '.acc', start: 'top 85%' } });

  /* ---------- Contact ---------- */
  gsap.from('.formcard', { y: 80, rotate: 2, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.contact', start: 'top 70%' } });
  gsap.from('.qform > *:not(.hp):not([type="hidden"])', { y: 20, opacity: 0, duration: 0.7, stagger: 0.06, delay: 0.25, ease: 'power3.out', scrollTrigger: { trigger: '.contact', start: 'top 70%' } });
  gsap.from('.contact__phone', { x: -30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.contact__phone', start: 'top 92%' } });

  /* ---------- Footer word ---------- */
  gsap.from('.foot__word', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.foot__word', start: 'top 95%' } });
  gsap.fromTo('.foot__word', { letterSpacing: '0em' }, { letterSpacing: '-.07em', ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
