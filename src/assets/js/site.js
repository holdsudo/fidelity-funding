// Fidelity Funding — site interactions (no dependencies)
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.remove('no-js');

  const money = (n) => n >= 1e6 ? '$' + (n / 1e6).toFixed(n % 1e6 ? 2 : 0).replace(/\.?0+$/, '') + 'M' : '$' + Math.round(n).toLocaleString('en-US');
  window.FF = { money };

  // ---- Toast ----
  const toast = $('#toast');
  let toastT;
  window.FF.toast = (msg) => {
    if (!toast) return;
    toast.querySelector('span').textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 3200);
  };

  // ---- Nav: scrolled state, hide on scroll down, reading progress ----
  const nav = $('#nav'), prog = $('#progress');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > 480 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    stepsLine();
    parallax();
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  // ---- Mobile menu ----
  const burger = $('.nav__burger'), mm = $('#mobile-menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    mm.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver((ents) => ents.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal,.reveal-stagger').forEach(el => io.observe(el));

  // ---- Count-up numbers ----
  const cio = new IntersectionObserver((ents) => ents.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = pre + end.toLocaleString() + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = pre + v.toLocaleString() + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  // ---- Steps progress line ----
  const steps = $('.steps');
  function stepsLine() {
    if (!steps) return;
    const r = steps.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .3)));
    steps.style.setProperty('--sp', p.toFixed(3));
  }

  // ---- Showcase parallax ----
  const pImgs = $$('[data-parallax]');
  function parallax() {
    if (reduce) return;
    pImgs.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.transform = `scale(1.12) translateY(${(p * -40).toFixed(1)}px)`;
    });
  }

  // ---- Funding card ----
  const fc = $('#fund-card');
  if (fc) {
    const range = $('#amount', fc), out = $('#amount-out', fc), wrap = $('.range', fc);
    const steps = [5e3, 1e4, 15e3, 2e4, 25e3, 3e4, 4e4, 5e4, 6e4, 75e3, 1e5, 125e3, 15e4, 2e5, 25e4, 3e5, 4e5, 5e5, 6e5, 75e4, 1e6];
    range.max = steps.length - 1;
    let shown = 25e4, raf;
    const animateTo = (target) => {
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now();
      const run = (t) => {
        const p = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - p, 3);
        shown = from + (target - from) * e;
        out.textContent = money(p < 1 ? Math.round(shown / 1000) * 1000 : target);
        if (p < 1) raf = requestAnimationFrame(run);
      };
      raf = requestAnimationFrame(run);
    };
    const sync = (fromChip) => {
      const v = steps[+range.value];
      wrap.style.setProperty('--p', (range.value / range.max * 100) + '%');
      range.setAttribute('aria-valuetext', money(v));
      animateTo(v);
      if (!fromChip) $$('.chip[data-amt]', fc).forEach(c => c.setAttribute('aria-pressed', +c.dataset.amt === v));
      fc.dataset.amount = v;
    };
    range.value = steps.indexOf(25e4);
    range.addEventListener('input', () => sync());
    $$('.chip[data-amt]', fc).forEach(c => c.addEventListener('click', () => {
      range.value = steps.indexOf(+c.dataset.amt);
      $$('.chip[data-amt]', fc).forEach(x => x.setAttribute('aria-pressed', x === c));
      sync(true);
    }));
    $$('.seg button', fc).forEach(b => b.addEventListener('click', () => {
      $$('.seg button', fc).forEach(x => x.setAttribute('aria-pressed', x === b));
      fc.dataset.purpose = b.dataset.purpose;
    }));
    $('#fund-go', fc).addEventListener('click', (e) => {
      e.preventDefault();
      const q = new URLSearchParams({ amount: fc.dataset.amount || 25e4, purpose: fc.dataset.purpose || 'growth' });
      location.href = '/apply/?' + q;
    });
    sync();
    // subtle 3D tilt
    if (!reduce && matchMedia('(hover:hover)').matches) {
      fc.addEventListener('pointermove', (e) => {
        const r = fc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        fc.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
      fc.addEventListener('pointerleave', () => { fc.style.transform = ''; });
    }
  }

  // ---- Product card spotlight ----
  $$('.product').forEach(p => p.addEventListener('pointermove', (e) => {
    const r = p.getBoundingClientRect();
    p.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    p.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  // ---- Tabs ----
  $$('[data-tabs]').forEach(t => {
    const btns = $$('[role=tab]', t), pill = $('.tabs__pill', t);
    const sel = (b, focus) => {
      btns.forEach(x => {
        const on = x === b;
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      if (pill) { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`; }
      if (focus) b.focus();
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => sel(b));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') sel(btns[(i + 1) % btns.length], true);
        if (e.key === 'ArrowLeft') sel(btns[(i - 1 + btns.length) % btns.length], true);
      });
    });
    const init = () => sel(btns.find(b => b.getAttribute('aria-selected') === 'true') || btns[0]);
    init(); addEventListener('resize', init); document.fonts?.ready.then(init);
  });

  // ---- Netflix-style rows ----
  $$('.row').forEach(row => {
    const track = $('.row__track', row), prev = $('[data-dir="-1"]', row), next = $('[data-dir="1"]', row);
    if (!track) return;
    const upd = () => {
      if (prev) prev.disabled = track.scrollLeft < 8;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    };
    [prev, next].forEach(b => b?.addEventListener('click', () => track.scrollBy({ left: +b.dataset.dir * track.clientWidth * .8, behavior: 'smooth' })));
    track.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  });

  // ---- Statement word-by-word highlight ----
  $$('[data-statement]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="dim">${w}</span>`).join(' ');
    const spans = $$('span', el);
    const upd = () => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height + innerHeight * .25)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('dim', i >= n));
    };
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
  });

  // ---- Filterable grids (insights) ----
  $$('[data-filter-grid]').forEach(g => {
    const items = $$('[data-tags]', g), chips = $$('[data-filter]'), q = $('[data-filter-search]'), empty = $('[data-empty]');
    let tag = 'all';
    const run = () => {
      const term = (q?.value || '').toLowerCase().trim(); let shown = 0;
      items.forEach(it => {
        const ok = (tag === 'all' || it.dataset.tags.includes(tag)) && (!term || it.textContent.toLowerCase().includes(term));
        it.hidden = !ok; if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    };
    chips.forEach(c => c.addEventListener('click', () => { tag = c.dataset.filter; chips.forEach(x => x.setAttribute('aria-pressed', x === c)); run(); }));
    q?.addEventListener('input', run);
  });

  // ---- Front-end-only forms (no backend wired yet) ----
  $$('form[data-fake-form]').forEach(f => f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const done = f.dataset.fakeForm;
    const target = f.dataset.successTarget && $(f.dataset.successTarget);
    if (target) { f.hidden = true; target.hidden = false; target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else FF.toast(done);
    f.reset();
  }));

  // ---- Careers: location tiles prefill the form ----
  $$('[data-loc]').forEach(t => t.addEventListener('click', () => { const s = $('#j-loc'); if (s) s.value = t.dataset.loc; }));

  // ---- Prefill from query (contact topic) ----
  const qs = new URLSearchParams(location.search);
  const topicSel = $('#c-topic');
  if (topicSel && qs.get('topic')) topicSel.value = qs.get('topic');

  // ---- Command palette (⌘K) ----
  const cmdk = $('#cmdk'), cin = $('#cmdk-input'), clist = $('#cmdk-list');
  const pages = [
    ['Home', '/', 'home'], ['Apply for funding', '/apply/', 'rocket'], ['Small Business Loans', '/#products', 'briefcase'],
    ['Merchant Cash Advances', '/#products', 'cash'], ['Credit Card Processing', '/contact/?topic=processing', 'card'],
    ['How it works', '/#how', 'gear'], ['Frequently asked questions', '/#faq', 'chat'], ['Insights & guides', '/insights/', 'book'],
    ['Careers', '/careers/', 'users'], ['Contact us', '/contact/', 'mail'], ['Privacy Policy', '/privacy-policy/', 'shield'],
    ['Terms & Conditions', '/terms-and-conditions/', 'file'], ['Call (212) 634-9121', 'tel:+12126349121', 'phone']
  ];
  let sel = 0, items = [];
  const ic = (n) => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const render = () => {
    const q = cin.value.trim(), ql = q.toLowerCase();
    const hits = pages.filter(p => !ql || p[0].toLowerCase().includes(ql));
    items = [];
    let h = '';
    if (q) { items.push({ ask: q }); h += `<div class="cmdk__grp">Fidelity AI</div><button class="cmdk__item" role="option" data-i="0">${ic('sparkles')}Ask “${q.replace(/[<>&"]/g, '')}”<small>↵</small></button>`; }
    if (hits.length) h += `<div class="cmdk__grp">Pages</div>`;
    hits.forEach(p => { items.push({ href: p[1] }); h += `<button class="cmdk__item" role="option" data-i="${items.length - 1}">${ic(p[2])}${p[0]}</button>`; });
    clist.innerHTML = h; sel = 0; mark();
  };
  const mark = () => $$('.cmdk__item', clist).forEach((b, i) => b.classList.toggle('is-sel', i === sel));
  const go = (i) => {
    const it = items[i]; if (!it) return;
    closeCmdk();
    if (it.ask) window.FFAI?.open(it.ask); else location.href = it.href;
  };
  const openCmdk = () => { cmdk.classList.add('is-open'); cin.value = ''; render(); setTimeout(() => cin.focus(), 30); };
  const closeCmdk = () => cmdk.classList.remove('is-open');
  window.FF.openCmdk = openCmdk;
  if (cmdk) {
    cin.addEventListener('input', render);
    cin.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); mark(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); mark(); e.preventDefault(); }
      if (e.key === 'Enter') { go(sel); e.preventDefault(); }
    });
    clist.addEventListener('click', (e) => { const b = e.target.closest('.cmdk__item'); if (b) go(+b.dataset.i); });
    cmdk.addEventListener('click', (e) => { if (e.target === cmdk) closeCmdk(); });
    addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.classList.contains('is-open') ? closeCmdk() : openCmdk(); }
      if (e.key === 'Escape') closeCmdk();
    });
    $$('[data-cmdk]').forEach(b => b.addEventListener('click', openCmdk));
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) $$('.nav__ai kbd').forEach(k => k.textContent = 'Ctrl K');
  }

  // ---- Hero ask bar → assistant ----
  const ask = $('#askbar');
  if (ask) {
    ask.addEventListener('submit', (e) => { e.preventDefault(); const v = $('input', ask).value.trim(); window.FFAI?.open(v || undefined); $('input', ask).value = ''; });
    $$('[data-hero-ask]').forEach(b => b.addEventListener('click', () => window.FFAI?.open(b.dataset.heroAsk)));
    // rotating placeholder, Google-style
    const inp = $('input', ask), ph = ['How fast can I get funded?', 'Do you work with trucking companies?', 'Will this affect my credit?', 'I need $50K for inventory', 'What documents do I need?'];
    let k = 0;
    if (!reduce) setInterval(() => { if (document.activeElement !== inp && !inp.value) { k = (k + 1) % ph.length; inp.placeholder = ph[k]; } }, 3200);
    $('#askbar-mic')?.addEventListener('click', () => window.FFAI?.open(undefined, { voice: true }));
  }

  // ---- Hero canvas: flowing capital lines ----
  const cv = $('#hero-canvas');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let w, h, dpr, pts = [], run = true;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, w * h / 22000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .4 }));
    };
    let mx = -999, my = -999;
    cv.parentElement.parentElement.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    const draw = () => {
      if (!run) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < 140) { p.x += dx / d * .6; p.y += dy / d * .6; }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) { ctx.strokeStyle = `rgba(147,238,242,${(1 - d / 130) * .22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        ctx.fillStyle = 'rgba(200,240,255,.75)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size);
    new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was) draw(); }).observe(cv);
    draw();
  }

  onScroll();
})();
