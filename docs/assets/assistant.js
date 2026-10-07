(() => {
const $ = (s, r = document) => r.querySelector(s);
const fab = $('#ai-fab'), panel = $('#ai-panel'), body = $('#ai-body'), form = $('#ai-form'),
input = $('#ai-text'), send = $('#ai-send'), mic = $('#ai-mic'), welcome = $('#ai-welcome'), nudge = $('#ai-nudge');
if (!panel) return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const money = (n) => window.FF ? FF.money(n) : '$' + n.toLocaleString();
const PHONE = '<a href="tel:+12126349121">(212) 634-9121</a>', EMAIL = '<a href="mailto:operations@fidelity-funding.com">operations@fidelity-funding.com</a>';
const A = {
apply: (amt) => ({ label: amt ? `Apply for ${money(amt)}` : 'Start application', href: '/apply/' + (amt ? '?amount=' + amt : ''), icon: 'rocket' }),
call: { label: 'Call now', href: 'tel:+12126349121', icon: 'phone' },
email: { label: 'Email us', href: 'mailto:operations@fidelity-funding.com', icon: 'mail' },
contact: { label: 'Contact page', href: '/contact/', icon: 'chat' },
insights: { label: 'Read guides', href: '/insights/', icon: 'book' },
careers: { label: 'See careers', href: '/careers/', icon: 'users' },
faq: { label: 'All FAQs', href: '/#faq', icon: 'chat' },
};
const KB = [
[/\b(hi|hello|hey|yo|good (morning|afternoon|evening))\b/, () => ({ text: `Hi there! 👋 I'm Fidelity AI. I can explain funding options, walk you through the application, or connect you with a funding specialist. What does your business need right now?` })],
[/\b(thank|thanks|thx|appreciate)/, () => ({ text: `Anytime! If you'd like, I can start your application — it takes under 5 minutes and won't affect your credit.`, actions: [A.apply()] })],
[/(how (fast|quick|long)|same.?day|24 ?h|timeline|when (can|will|do) i (get|receive)|speed|turnaround)/, () => ({ text: `Most applicants get an **initial decision within hours** of submitting their information. Once approved, funds can often be deposited in **as little as 24 hours**, depending on the product and the documents required.\n\nHaving your recent bank statements ready is the single biggest thing that speeds things up.`, actions: [A.apply(), A.call] })],
[/(credit (score|check|pull|report)|hard (pull|inquiry)|soft (pull|inquiry)|affect my credit|hurt my credit|ding)/, () => ({ text: `No — your initial application and funding analysis use a **soft credit pull**, so they **don't impact your credit score**. A hard inquiry only happens if you decide to move forward with a specific lender.`, actions: [A.apply()] })],
[/(bad|poor|low|fair|no) credit|credit (is|isn'?t) (bad|great|good)|bankrupt|lien|judg(e)?ment/, () => ({ text: `Credit is only one piece of the picture. Many of our funding options — especially **merchant cash advances** — focus on your business's revenue and deposit history rather than your score alone.\n\nThe application asks about open judgments, liens or bankruptcies so we can match you with partners that fit. Final approval and terms are always set by the funding partner after underwriting.`, actions: [A.apply(), A.call] })],
[/(difference|vs\.?|versus|compare|which is better).*(loan|mca|cash advance)|(loan|mca|cash advance).*(vs\.?|versus|or|difference)/, () => ({ text: `Great question:\n\n- **Small business loan** — a lump sum repaid on a set schedule. Good for planned growth, hiring or stabilizing operations, with flexible terms.\n- **Merchant cash advance (MCA)** — funding based on your **future sales**. Repayment flexes with revenue (a share of card receipts or a fixed daily/weekly ACH). Ideal when you have strong daily transactions but limited collateral.\n\nMCAs are priced with a **factor rate** rather than an APR, so always compare total payback. A specialist can lay both side by side for your numbers.`, actions: [A.apply(), { label: 'MCA guide', href: '/insights/merchant-cash-advance-retail-shop-stabilize-cash-flow/', icon: 'book' }] })],
[/(merchant cash|\bmca\b|cash advance|factor rate|holdback)/, () => ({ text: `A **merchant cash advance** gives you an upfront lump sum in exchange for a portion of future sales. It's built for businesses with steady card or deposit volume that need capital fast.\n\n- Approval leans on revenue and processing history, not just credit\n- Repayment is a % of receipts or a fixed daily/weekly ACH\n- Priced with a factor rate — compare **total payback**, not just the payment\n\nIt's best for short-term working capital, not long-term investments.`, actions: [A.apply(), { label: 'Read the MCA guide', href: '/insights/merchant-cash-advance-retail-shop-stabilize-cash-flow/', icon: 'book' }] })],
[/(how much|max(imum)?|min(imum)?|range|up to|largest|smallest).*(fund|borrow|get|amount|loan)|funding amounts?/, () => ({ text: `Funding requests on our application range from about **$5,000 up to $1,000,000**. What you qualify for depends mostly on your revenue, time in business and the product. Tell me a number and what it's for, and I'll set up your application with it.`, actions: [A.apply()] })],
[/(small business loan|term loan|working capital loan|\bloan\b)/, () => ({ text: `**Small business loans** give you working capital to grow, hire or stabilize operations — with flexible terms, competitive rates and fast approvals. Through our national lender network you can compare real options before you commit.`, actions: [A.apply()] })],
[/(credit card processing|merchant services|payment processing|\bpos\b|point of sale|card fees|processing)/, () => ({ text: `Our **credit card processing** solutions help you save money and get paid faster, with integrated payments tailored to small businesses. Send us your latest processing statement and a specialist will review it with you.`, actions: [{ label: 'Ask about processing', href: '/contact/?topic=processing', icon: 'card' }, A.call] })],
[/(document|paperwork|statements?|what do (i|you) need|requirements?|qualif|eligib)/, () => ({ text: `To get the fastest decision, have these ready:\n\n- Last **3–6 months of business bank statements**\n- Merchant processing statements (if you take cards)\n- Business info: legal name, Tax ID, start date, address\n- Owner info and a government ID\n\nYou can upload statements right inside the application. Requirements vary by product and lender — a specialist will tell you exactly what applies to you.`, actions: [A.apply()] })],
[/(industr|who do you (work|serve)|what (types?|kinds?) of business|startup|new business|do you work with)/, () => ({ text: `We work with small and mid-sized businesses **across every industry** — retail, construction, transportation & trucking, healthcare, restaurants, professional services and more. Whether you're a startup or an established company, we'll help find the right fit.`, actions: [A.apply(), A.insights] })],
[/(truck|fleet|diesel|fuel|owner.?operator|freight|carrier)/, () => ({ text: `Trucking is a cash-flow timing business: fuel and drivers get paid today, loads pay in 30–90 days. Fast working capital helps you **cover fuel, keep trucks running, take loads competitors can't, and handle repairs before they cause downtime**.\n\nWe wrote a full playbook on navigating 2026 fuel prices.`, actions: [{ label: 'Trucking playbook', href: '/insights/trucking-company-mca-2026/', icon: 'truck' }, A.apply()] })],
[/(restaurant|cafe|bar|food truck|diner|kitchen)/, () => ({ text: `Restaurants often use funding for equipment, renovations, inventory and seasonal staffing. Approval odds improve with steady card sales, organized documentation and consistent deposits.`, actions: [{ label: 'Restaurant guide', href: '/insights/restaurant-owner-improve-approval-odds-merchant-cash-advance/', icon: 'utensils' }, A.apply()] })],
[/(retail|store|shop|boutique|inventory)/, () => ({ text: `For retail, funding commonly covers **inventory ahead of busy seasons**, staffing and repairs. If you're weighing an MCA, model how daily remittances affect your cash flow first — our retail guide walks through it.`, actions: [{ label: 'Retail guide', href: '/insights/merchant-cash-advance-retail-shop-stabilize-cash-flow/', icon: 'store' }, A.apply()] })],
[/(use (the )?(funds|money)|what can i use|spend it on|purpose)/, () => ({ text: `Almost anything that supports your business:\n\n- **Growth** — new locations, product lines, marketing, hiring\n- **Operations** — payroll, rent, bridging receivables, taxes, insurance\n- **Equipment** — vehicles, machinery, technology, POS upgrades\n\nYou're free to use your funding however it best supports your business.` , actions: [A.apply()] })],
[/(rate|interest|apr|cost|fee|expensive|cheap|price)/, () => ({ text: `Rates and fees depend on the product, your revenue, time in business and the funding partner — so we don't quote one-size-fits-all numbers. What we **do** promise is clarity: you'll see real options side by side and can compare total cost before you commit to anything.`, actions: [A.apply(), A.call] })],
[/(human|person|agent|representative|rep\b|specialist|someone|talk to|speak|call me|phone number|contact)/, () => ({ text: `Happy to connect you with a funding specialist — real people who'll guide you every step.\n\n📞 ${PHONE}\n✉️ ${EMAIL}\n📍 1655 Richmond Ave, Staten Island, NY 10314`, actions: [A.call, A.email, A.contact] })],
[/(where|address|location|office|located|visit)/, () => ({ text: `Our office is at **1655 Richmond Ave, Staten Island, NY 10314**. We fund businesses nationwide, so most clients never need to visit — but you're welcome to.`, actions: [{ label: 'Open in Maps', href: 'https://maps.google.com/?q=1655+Richmond+Ave,+Staten+Island,+NY+10314', icon: 'pin' }, A.call] })],
[/(job|career|hiring|work (for|at) you|position|sales role|employment)/, () => ({ text: `We're hiring! It's a **high-energy, high-commission** MCA sales environment with a real growth path — experience is a plus, not a requirement. Locations include Brooklyn, Jersey Shore, Staten Island, Tampa, Plantation and Englewood Cliffs.`, actions: [A.careers] })],
[/(safe|secure|privacy|encrypt|ssn|social security|data)/, () => ({ text: `Your security matters. Sensitive information is protected with **TLS encryption**, and we don't sell your personal information. You can read the full details in our Privacy Policy.`, actions: [{ label: 'Privacy Policy', href: '/privacy-policy/', icon: 'shield' }] })],
[/(apply|application|get started|start|sign up|get funded|ready)/, (c) => ({ text: c.amount ? `Let's do it. I'll pre-fill your application with **${money(c.amount)}**. It takes under 5 minutes, and there's no impact on your credit.` : `Let's get you started. The application takes **under 5 minutes**, there's no obligation, and the initial review won't affect your credit.`, actions: [A.apply(c.amount)] })],
];
const parseAmount = (t) => {
const m = t.replace(/,/g, '').match(/\$?\s?(\d+(?:\.\d+)?)\s*(k|m|mm|thousand|million|grand)?\b/i);
if (!m) return 0;
let n = parseFloat(m[1]); const u = (m[2] || '').toLowerCase();
if (u === 'k' || u === 'thousand' || u === 'grand') n *= 1e3; else if (u === 'm' || u === 'mm' || u === 'million') n *= 1e6;
if (!u && n < 1000) return 0; // bare small numbers are probably not amounts
return n >= 1000 && n <= 5e7 ? Math.round(n) : 0;
};
const purposeOf = (t) => /equip|machine|truck|vehicle|tool|tech/.test(t) ? 'equipment' : /payroll|rent|cash ?flow|bills|operat|tax/.test(t) ? 'operations' : /grow|expan|location|market|hire|inventory|launch/.test(t) ? 'growth' : '';
function think(q) {
const t = q.toLowerCase(), amount = parseAmount(q), purpose = purposeOf(t);
const hit = KB.find(([re]) => re.test(t));
if (amount && (!hit || /\b(need|want|looking|get|borrow|for)\b/.test(t))) {
const capped = Math.min(amount, 1e6);
const what = { equipment: 'equipment', operations: 'operations and cash flow', growth: 'growth' }[purpose];
return { text: `${money(amount)}${what ? ' for ' + what : ''} — got it.${amount > 1e6 ? `\n\nOur online application covers requests up to **$1M**; for larger needs, a specialist can talk through options directly.` : ''}\n\nBased on what you've told me, the next step is a quick application (under 5 minutes, soft pull only). A specialist will then walk you through the options you qualify for — often with a decision **within hours**.`,
actions: [{ label: `Apply for ${money(capped)}`, href: `/apply/?amount=${capped}${purpose ? '&purpose=' + purpose : ''}`, icon: 'rocket' }, A.call] };
}
if (hit) return hit[1]({ amount, purpose });
return { text: `I want to make sure you get the right answer. I can help with:\n\n- How fast funding works\n- Loans vs. merchant cash advances\n- Documents you'll need\n- Starting your application\n\nOr I can connect you with a funding specialist at ${PHONE}.`, actions: [A.apply(), A.call] };
}
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => {
const blocks = s.split(/\n\n/);
return blocks.map(b => {
const lines = b.split('\n');
if (lines.every(l => l.startsWith('- '))) return '<ul>' + lines.map(l => `<li>${inline(l.slice(2))}</li>`).join('') + '</ul>';
return '<p>' + lines.map(inline).join('<br>') + '</p>';
}).join('');
};
const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const icon = (n) => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
let history = store.get('ffai') || [];
const scroll = () => { body.scrollTop = body.scrollHeight; };
function bubble(role, html, actions) {
welcome.hidden = true;
const m = document.createElement('div');
m.className = 'msg' + (role === 'me' ? ' msg--me' : '');
m.innerHTML = (role === 'me' ? '' : `<span class="msg__av">${icon('sparkles')}</span>`) + `<div class="msg__bubble">${html}</div>`;
if (actions?.length) {
const a = document.createElement('div'); a.className = 'msg__actions';
a.innerHTML = actions.map(x => `<a href="${x.href}">${icon(x.icon)}${esc(x.label)}</a>`).join('');
m.querySelector('.msg__bubble').appendChild(a);
}
body.appendChild(m); scroll();
return m;
}
async function stream(el, html) {
if (reduce) { el.innerHTML = html; return; }
const tmp = document.createElement('div'); tmp.innerHTML = html;
const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT);
const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
const full = nodes.map(n => n.textContent); nodes.forEach(n => n.textContent = '');
el.innerHTML = ''; el.appendChild(tmp);
for (let i = 0; i < nodes.length; i++) {
const words = full[i].split(/(\s+)/);
for (let w = 0; w < words.length; w++) {
nodes[i].textContent += words[w];
if (w % 2 === 0) { scroll(); await new Promise(r => setTimeout(r, 14 + Math.random() * 22)); }
}
}
}
let busy = false;
async function ask(q, silent) {
q = (q || '').trim(); if (!q || busy) return;
busy = true; send.disabled = true;
bubble('me', esc(q));
if (!silent) { history.push({ r: 'me', t: q }); }
const typing = bubble('ai', '<span class="typing"><i></i><i></i><i></i></span>');
await new Promise(r => setTimeout(r, reduce ? 50 : 500 + Math.random() * 500));
const ans = think(q);
const bub = typing.querySelector('.msg__bubble');
await stream(bub, md(ans.text));
if (ans.actions?.length) {
const a = document.createElement('div'); a.className = 'msg__actions';
a.innerHTML = ans.actions.map(x => `<a href="${x.href}">${icon(x.icon)}${esc(x.label)}</a>`).join('');
bub.appendChild(a);
}
history.push({ r: 'ai', t: ans.text, a: ans.actions });
store.set('ffai', history.slice(-30));
scroll(); busy = false; send.disabled = !input.value.trim();
}
function restore() {
history.forEach(h => h.r === 'me' ? bubble('me', esc(h.t)) : bubble('ai', md(h.t), h.a));
}
let lastFocus;
function open(q, opts = {}) {
lastFocus = document.activeElement;
document.body.classList.add('ai-open');
fab.setAttribute('aria-expanded', 'true');
hideNudge(true);
setTimeout(() => input.focus({ preventScroll: true }), 250);
if (q) setTimeout(() => ask(q), 300);
if (opts.voice) setTimeout(listen, 400);
}
function close() {
document.body.classList.remove('ai-open');
fab.setAttribute('aria-expanded', 'false');
lastFocus?.focus?.();
}
window.FFAI = { open, close, ask };
fab.addEventListener('click', () => open());
$('#ai-close').addEventListener('click', close);
$('#ai-reset').addEventListener('click', () => {
history = []; store.set('ffai', []);
body.querySelectorAll('.msg').forEach(m => m.remove()); welcome.hidden = false;
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('ai-open')) close(); });
panel.addEventListener('click', (e) => {
const b = e.target.closest('[data-ask]'); if (b) ask(b.dataset.ask);
});
$$('[data-ai-open]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); open(b.dataset.aiOpen || undefined); }));
function $$(s) { return [...document.querySelectorAll(s)]; }
input.addEventListener('input', () => {
send.disabled = !input.value.trim() || busy;
input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px';
});
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; input.style.height = 'auto'; ask(v); });
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec;
function listen() {
if (!SR) return;
if (rec) { rec.stop(); return; }
rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true;
mic.classList.add('is-rec');
rec.onresult = (e) => { input.value = [...e.results].map(r => r[0].transcript).join(''); input.dispatchEvent(new Event('input')); };
rec.onend = () => { mic.classList.remove('is-rec'); rec = null; if (input.value.trim()) form.requestSubmit(); };
rec.onerror = () => { mic.classList.remove('is-rec'); rec = null; };
rec.start();
}
if (SR) { mic.hidden = false; mic.addEventListener('click', listen); }
else { const hm = document.getElementById('askbar-mic'); if (hm) hm.hidden = true; }
function hideNudge(forever) {
nudge.classList.remove('is-on');
if (forever) try { localStorage.setItem('ffai-nudged', '1'); } catch {}
}
let nudged = false; try { nudged = !!localStorage.getItem('ffai-nudged'); } catch {}
if (!nudged) setTimeout(() => { if (!document.body.classList.contains('ai-open')) nudge.classList.add('is-on'); }, 14000);
nudge.addEventListener('click', (e) => { if (e.target.closest('button')) hideNudge(true); else open('Estimate my funding options'); });
KB.unshift([/estimate my funding/, () => ({ text: `Happy to! Two quick questions:\n\n- **How much** are you looking for? (anywhere from $5K to $1M)\n- **What's it for** — growth, operations/cash flow, or equipment?\n\nJust reply in your own words, like "$80K for a new truck".` })]);
restore();
})();