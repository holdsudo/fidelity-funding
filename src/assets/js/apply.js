// Application wizard — front-end only. Nothing is transmitted or stored server-side yet.
// Sensitive fields (data-sensitive: SSN, EIN, DOB, DL) are never written to browser storage.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('#apply-form'); if (!form) return;
  const steps = $$('.fstep', form), rail = $$('.apply-step'), bar = $('#apply-bar'),
        back = $('#btn-back'), next = $('#btn-next'), saveState = $('#save-state');
  let cur = 0;

  // ---- States ----
  const ST = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  $$('[data-states]').forEach(s => s.innerHTML = '<option value="">Select</option>' + ST.map(x => `<option>${x}</option>`).join(''));

  // ---- Masks ----
  const digits = (v) => v.replace(/\D/g, '');
  const masks = {
    phone: (v) => { const d = digits(v).slice(0, 10); return d.length < 4 ? d : d.length < 7 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`; },
    ein: (v) => { const d = digits(v).slice(0, 9); return d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d; },
    ssn: (v) => { const d = digits(v).slice(0, 9); return d.length > 5 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d; },
    money: (v) => { const d = digits(v).slice(0, 10); return d ? (+d).toLocaleString('en-US') : ''; },
  };
  $$('[data-mask]', form).forEach(i => i.addEventListener('input', () => { i.value = masks[i.dataset.mask](i.value); }));
  $$('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    const i = $('#' + b.dataset.toggle); const show = i.type === 'password';
    i.type = show ? 'text' : 'password'; b.setAttribute('aria-label', (show ? 'Hide' : 'Show') + ' SSN');
  }));
  $$('[data-reveal]').forEach(r => r.addEventListener('change', () => { $(r.dataset.reveal).hidden = r.hasAttribute('data-reveal-off'); }));

  // ---- Validation ----
  const custom = {
    ein: (v) => digits(v).length === 9, ssn: (v) => digits(v).length === 9,
    phone: (v) => digits(v).length === 10, money: (v) => +digits(v) > 0,
  };
  function validField(el) {
    const f = el.closest('.field'); if (!f) return true;
    let ok = el.checkValidity();
    if (ok && el.value && el.dataset.mask && custom[el.dataset.mask]) ok = custom[el.dataset.mask](el.value);
    if (ok && el.id === 'f-amt') ok = +digits(el.value) >= 5000;
    f.classList.toggle('is-invalid', !ok);
    return ok;
  }
  function validStep(i) {
    let first = null;
    const seenRadio = new Set();
    $$('input,select,textarea', steps[i]).forEach(el => {
      if (el.type === 'file' || el.closest('[hidden]')) return;
      if (el.type === 'radio') { if (seenRadio.has(el.name)) return; seenRadio.add(el.name); }
      if (!validField(el) && !first) first = el;
    });
    if (i === 3 && sig.empty) { $('#sig-err').style.display = 'block'; first = first || $('#sig-canvas'); }
    if (first) { first.focus({ preventScroll: true }); first.closest('.field')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return !first;
  }
  form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f?.classList.contains('is-invalid')) validField(e.target); draft(); });
  form.addEventListener('change', (e) => { const f = e.target.closest('.field'); if (f?.classList.contains('is-invalid')) validField(e.target); draft(); });

  // ---- Navigation ----
  function go(i) {
    cur = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    rail.forEach((r, k) => { r.classList.toggle('is-active', k === i); r.classList.toggle('is-done', k < i); r.querySelector('.apply-step__n').innerHTML = k < i ? '<svg class="icon" style="width:16px;height:16px;stroke-width:3"><use href="#i-check"/></svg>' : k + 1; });
    bar.style.width = ((i + 1) / steps.length * 100) + '%';
    back.hidden = i === 0;
    next.innerHTML = i === steps.length - 1 ? 'Submit application <svg class="icon icon--arrow"><use href="#i-arrow"/></svg>' : 'Continue <svg class="icon icon--arrow"><use href="#i-arrow"/></svg>';
    if (i === 3) { buildReview(); sig.resize(); }
    const top = $('.apply-card').getBoundingClientRect().top + scrollY - 90;
    if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validStep(cur)) return;
    if (cur < steps.length - 1) go(cur + 1); else submit();
  });
  back.addEventListener('click', () => go(Math.max(0, cur - 1)));
  rail.forEach((r, k) => r.addEventListener('click', () => { if (k < cur) go(k); }));

  // ---- Prefill from homepage / assistant ----
  const qs = new URLSearchParams(location.search);
  const amt = +qs.get('amount');
  const fill = () => {
    if (amt >= 1000) $('#f-amt').value = masks.money(String(Math.round(amt)));
    const pur = qs.get('purpose'); if (pur && $(`#f-use option[value="${pur}"]`)) $('#f-use').value = pur;
  };

  // ---- Draft autosave (non-sensitive fields only, this tab only) ----
  let draftT;
  function draft() {
    clearTimeout(draftT);
    draftT = setTimeout(() => {
      const d = {};
      $$('input,select', form).forEach(el => {
        if (el.dataset.sensitive !== undefined || el.type === 'file' || el.type === 'password' || !el.name) return;
        if (el.type === 'radio' || el.type === 'checkbox') { if (el.checked) d[el.name + (el.type === 'checkbox' ? '' : '')] = el.type === 'checkbox' ? true : el.value; }
        else if (el.value) d[el.name] = el.value;
      });
      try { sessionStorage.setItem('ff-apply', JSON.stringify(d)); } catch {}
      saveState.innerHTML = '<svg class="icon"><use href="#i-check-circle"/></svg> Draft saved';
    }, 500);
  }
  try {
    const d = JSON.parse(sessionStorage.getItem('ff-apply') || 'null');
    if (d) Object.entries(d).forEach(([k, v]) => {
      $$(`[name="${k}"]`, form).forEach(el => {
        if (el.type === 'radio') { el.checked = el.value === v; if (el.checked && el.dataset.reveal) $(el.dataset.reveal).hidden = el.hasAttribute('data-reveal-off'); }
        else if (el.type === 'checkbox') el.checked = !!v;
        else el.value = v;
      });
    });
  } catch {}
  fill();

  // ---- File uploads (kept in memory only) ----
  const dz = $('#dropzone'), fin = $('#f-files'), list = $('#file-list');
  let files = [];
  const fmt = (b) => b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';
  const renderFiles = () => {
    list.innerHTML = files.map((f, i) => `<div class="file"><svg class="icon"><use href="#i-file"/></svg><span>${f.name.replace(/[<>&]/g, '')}</span><small>${fmt(f.size)}</small><button type="button" data-rm="${i}" aria-label="Remove ${f.name.replace(/"/g, '')}"><svg class="icon"><use href="#i-x"/></svg></button></div>`).join('');
  };
  const add = (fl) => { [...fl].forEach(f => { if (f.size <= 25e6) files.push(f); else window.FF?.toast(`${f.name} is over 25 MB`); }); renderFiles(); fin.value = ''; };
  fin.addEventListener('change', () => add(fin.files));
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-over'); }));
  dz.addEventListener('drop', (e) => add(e.dataTransfer.files));
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { files.splice(+b.dataset.rm, 1); renderFiles(); } });

  // ---- Signature pad ----
  const cv = $('#sig-canvas'), ctx = cv.getContext('2d'), ph = $('#sig-ph');
  const sig = { empty: true, resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    if (!r.width) return;
    const img = sig.empty ? null : cv.toDataURL();
    cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0A0F1F';
    if (img) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = img; }
  } };
  let drawing = false, lx = 0, ly = 0;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', (e) => { drawing = true; cv.setPointerCapture(e.pointerId); [lx, ly] = pos(e); ctx.beginPath(); ctx.arc(lx, ly, 1.1, 0, 6.3); ctx.fillStyle = '#0A0F1F'; ctx.fill(); });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const [x, y] = pos(e);
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx, ly, (lx + x) / 2, (ly + y) / 2); ctx.lineTo(x, y); ctx.stroke();
    [lx, ly] = [x, y];
    if (sig.empty) { sig.empty = false; ph.hidden = true; $('#sig-err').style.display = ''; }
  });
  addEventListener('pointerup', () => { drawing = false; });
  $('#sig-clear').addEventListener('click', () => { ctx.clearRect(0, 0, cv.width, cv.height); sig.empty = true; ph.hidden = false; });
  addEventListener('resize', () => { if (cur === 3) sig.resize(); });

  // ---- Review ----
  const sections = [
    ['Business', 0, ['legal_name', 'dba', 'website', 'ein', 'start_date', 'address', 'city', 'state', 'zip', 'business_phone', 'industry', 'location_type', 'entity']],
    ['Owner', 1, ['owner_name', 'owner_email', 'owner_cell', 'ownership', 'ssn', 'dob', 'credit', 'owner_address', 'owner_city', 'owner_state', 'owner_zip']],
    ['Funding', 2, ['amount', 'use', 'annual_revenue', 'avg_balance', 'judgments', 'erc', 'has_advance']],
  ];
  const label = (name) => { const el = form.querySelector(`[name="${name}"]`); const f = el?.closest('.field'); return (f?.querySelector('label,.label')?.textContent || name).replace('*', '').replace(/\(.*?\)/, '').trim(); };
  const val = (name) => {
    const els = $$(`[name="${name}"]`, form); if (!els.length) return '';
    const el = els[0];
    if (el.type === 'radio') return els.find(x => x.checked)?.value || '';
    if (name === 'ssn') return el.value ? '•••-••-' + digits(el.value).slice(-4) : '';
    if (name === 'ein') return el.value ? '••-•••' + digits(el.value).slice(-4) : '';
    if (el.tagName === 'SELECT') return el.selectedOptions[0]?.value ? el.selectedOptions[0].textContent : '';
    if (el.dataset.mask === 'money' && el.value) return '$' + el.value;
    return el.value;
  };
  function buildReview() {
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    $('#review').innerHTML = sections.map(([t, i, names]) => `<section class="review__sec"><header><h4>${t}</h4><button type="button" data-goto="${i}">Edit</button></header><dl>${
      names.map(n => [n, val(n)]).filter(([, v]) => v).map(([n, v]) => `<div><dt>${esc(label(n))}</dt><dd>${esc(v)}</dd></div>`).join('')
    }${t === 'Funding' && files.length ? `<div><dt>Statements</dt><dd>${files.length} file${files.length > 1 ? 's' : ''}</dd></div>` : ''}</dl></section>`).join('');
    $$('[data-goto]').forEach(b => b.addEventListener('click', () => go(+b.dataset.goto)));
  }

  // ---- Submit (front-end only) ----
  function submit() {
    // Backend not connected yet: nothing leaves the browser. Wire a POST here when the API is ready.
    next.disabled = true; next.innerHTML = 'Submitting…';
    setTimeout(() => {
      const first = ($('#o-name').value || '').split(' ')[0];
      $('#success-msg').textContent = `Thanks${first ? ', ' + first : ''}! A Fidelity funding specialist will review your application for ${val('amount') || 'your request'} and reach out shortly — often within hours.`;
      form.hidden = true; $('.apply-progress').hidden = true;
      $('#apply-success').hidden = false;
      rail.forEach(r => { r.classList.remove('is-active'); r.classList.add('is-done'); r.querySelector('.apply-step__n').innerHTML = '<svg class="icon" style="width:16px;height:16px;stroke-width:3"><use href="#i-check"/></svg>'; });
      try { sessionStorage.removeItem('ff-apply'); } catch {}
      form.reset(); files = [];
      confetti();
      scrollTo({ top: $('.apply-card').getBoundingClientRect().top + scrollY - 100, behavior: 'smooth' });
    }, 900);
  }

  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
    const x = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight;
    const cols = ['#0329D1', '#48D6E4', '#3B5BFF', '#93EEF2', '#ffffff', '#12B76A'];
    const ps = Array.from({ length: 160 }, () => ({ x: W / 2, y: H / 2.4, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4, s: Math.random() * 7 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.random() * cols.length | 0] }));
    let t = 0;
    (function f() {
      x.clearRect(0, 0, W, H);
      ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
      if (++t < 170) requestAnimationFrame(f); else c.remove();
    })();
  }

  go(0);
})();
