  // ===== PHASE 2 PUBLIC PAGES =====
  // /featured · /transactions · /listing/:id · /o/:slug · /search-request · /agents ·
  // /agent/:slug · /reviews · /terms · /contact, plus the home "Select / агент / сэтгэгдэл"
  // block and the complex page extras (price history, rent, hot, map, agent).
  // Everything is read from Firestore; with nothing configured each block shows an empty
  // state. Collections added here (agents, reviews, siteConfig, crmTasks) need the v3
  // firestore.rules — rulesV3Ready() detects whether those are deployed.

  // ---------- v3 rules probe ----------
  let _rulesV3P = null;
  function rulesV3Ready() {
    if (_rulesV3P) return _rulesV3P;
    _rulesV3P = db.doc('siteConfig/home').get()
      .then(snap => { _siteConfigCache.home = snap.exists ? snap.data() : {}; return true; })
      .catch(e => { const denied = e && e.code === 'permission-denied'; if (!denied) _rulesV3P = null; return !denied; });
    return _rulesV3P;
  }
  async function requireRulesV3(container) {
    if (await rulesV3Ready()) return true;
    if (container) {
      if (!(container.previousElementSibling && container.previousElementSibling.classList.contains('svc-closed'))) container.insertAdjacentHTML('beforebegin', serviceClosedHtml());
    } else showToast('Энэ үйлчилгээ түр хаалттай байна');
    return false;
  }

  // ---------- site config (home sections, BairX Select) ----------
  const _siteConfigCache = {};
  async function loadSiteConfig(name) {
    if (name in _siteConfigCache) return _siteConfigCache[name];
    try {
      const snap = await db.doc('siteConfig/' + name).get();
      _siteConfigCache[name] = snap.exists ? snap.data() : {};
    } catch (e) { _siteConfigCache[name] = {}; }
    return _siteConfigCache[name];
  }
  // Sections default ON; an admin can switch any of them off (Admin → Нүүр хуудас).
  const HOME_SECTIONS = {
    market: 'Статистик ба үнийн график', tools: 'Түргэн хэрэгслүүд', hot: 'Hot List', sales: 'Бодит хэлцлүүд',
    compare: 'Хотхоны харьцуулалт', select: 'BairX Select', agents: 'Агентууд', searchRequest: 'Хайлтаа даатгах',
    reviews: 'Сэтгэгдэл', faq: 'Түгээмэл асуулт'
  };
  function homeSectionOn(cfg, key) { return !(cfg && cfg.sections && cfg.sections[key] === false); }

  // ---------- agents ----------
  let _agentsP = null;
  function loadAgents(force) {
    if (_agentsP && !force) return _agentsP;
    _agentsP = db.collection('agents').get()
      .then(s => s.docs.map(d => Object.assign({ slug: d.id }, d.data())).filter(a => a.active !== false)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.name || '').localeCompare(b.name || '')))
      .catch(() => []);
    return _agentsP;
  }
  const safeUrl = (u) => /^https:\/\//i.test(String(u || '')) ? String(u) : '';
  function agentSocialHtml(a) {
    const links = [
      a.facebook && ['Facebook', safeUrl(a.facebook)], a.instagram && ['Instagram', safeUrl(a.instagram)],
      a.viber && ['Viber', 'viber://chat?number=%2B976' + encodeURIComponent(String(a.viber).replace(/\D/g, ''))],
      a.telegram && ['Telegram', 'https://t.me/' + encodeURIComponent(String(a.telegram).replace(/^@/, ''))]
    ].filter(x => x && x[1]);
    return links.length ? `<div class="ag-social">${links.map(([t, h]) => `<a href="${esc(h)}" target="_blank" rel="noopener">${t}</a>`).join('')}</div>` : '';
  }
  function agentCardHtml(a, opts) {
    const href = '/agent/' + encodeURIComponent(a.slug);
    return `<div class="ag-card">
      <a class="ag-photo" href="${href}" onclick="return go(event, '${href}')">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy" onerror="this.remove()">` : `<span>${esc((a.name || '?').slice(0, 1))}</span>`}</a>
      <div class="ag-body">
        <a class="ag-name" href="${href}" onclick="return go(event, '${href}')">${esc(a.name)}</a>
        ${a.org ? `<div class="ag-org">${esc(a.org)}</div>` : ''}
        <div class="ag-facts">
          ${a.yearsExperience != null ? `<span><strong>${esc(a.yearsExperience)}</strong> жил</span>` : ''}
          ${a.dealsClosed != null ? `<span><strong>${esc(a.dealsClosed)}</strong> хэлцэл</span>` : ''}
          ${a.totalVolume != null ? `<span><strong>${fmtMoney(a.totalVolume)}</strong> нийт</span>` : ''}
        </div>
        ${opts && opts.full && a.achievements ? `<div class="ag-ach">${esc(a.achievements)}</div>` : ''}
        <div class="ag-actions">
          ${a.phone ? `<a class="btn btn-blue" href="tel:+976${esc(a.phone)}" onclick="trackEvent('contact_click',{channel:'tel',page:'agent'})">Залгах</a>` : ''}
          <a class="btn btn-ghost" href="/search-request?agent=${encodeURIComponent(a.slug)}" onclick="return go(event, '/search-request?agent=${encodeURIComponent(a.slug)}')">Хайлтаа даатгах</a>
        </div>
        ${opts && opts.full ? agentSocialHtml(a) : ''}
      </div>
    </div>`;
  }
  const agentsEmpty = () => `<div class="home-empty-state"><div class="home-empty-title">Агентын мэдээлэл удахгүй нэмэгдэнэ</div><div class="home-empty-sub">Админ хэсгээс агентын танилцуулга оруулахаар энд харагдана.</div></div>`;

  // ---------- listings by Firestore id ----------
  async function fetchListingsByIds(ids) {
    const out = [];
    for (const id of (ids || []).slice(0, 24)) {
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) continue;
      let l = listings.find(x => x.firestoreId === id);
      if (!l) {
        try { const doc = await db.collection('listings').doc(id).get(); if (doc.exists) l = ingestListingDoc(doc); } catch (e) {}
      }
      if (l && !l._inactive) out.push(l);
    }
    return out;
  }

  // ---------- reviews ----------
  async function loadApprovedReviews(filter, limit) {
    try {
      let q = db.collection('reviews').where('status', '==', 'approved');
      if (filter && filter.agentSlug) q = q.where('agentSlug', '==', filter.agentSlug);
      const snap = await q.limit(limit || 50).get();
      return snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    } catch (e) { return []; }
  }
  const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  function reviewsHtml(list) {
    if (!list.length) return `<div class="home-empty-state"><div class="home-empty-title">Баталгаажсан сэтгэгдэл одоогоор алга</div><div class="home-empty-sub">Үйлчлүүлэгчдийн сэтгэгдэл шалгагдсаны дараа энд нийтлэгдэнэ.</div><a class="btn btn-ghost" href="/reviews" onclick="return go(event, '/reviews')">Сэтгэгдэл үлдээх</a></div>`;
    return `<div class="rv-grid">${list.map(r => `<figure class="rv-card"><div class="rv-stars" aria-label="${r.rating} од">${stars(r.rating)}</div>
      <blockquote>${esc(r.text)}</blockquote><figcaption>${esc(r.name)}${r.createdAt?.toDate ? ' · ' + r.createdAt.toDate().toISOString().slice(0, 7) : ''}</figcaption>
      ${r.reply ? `<div class="rv-reply"><strong>BairX:</strong> ${esc(r.reply)}</div>` : ''}</figure>`).join('')}</div>`;
  }

  // ---------- home: Select · agents · search request · reviews ----------
  async function renderHomeExtras() {
    const el = document.getElementById('homeExtras');
    if (!el) return;
    if (!(await rulesV3Ready())) { el.innerHTML = ''; return; }
    const [cfg, feat, agents, reviews] = await Promise.all([loadSiteConfig('home'), loadSiteConfig('featured'), loadAgents(), loadApprovedReviews(null, 6)]);
    const picks = homeSectionOn(cfg, 'select') ? await fetchListingsByIds(feat.listingIds) : [];
    const head = (t, p, lt) => `<div class="portal-section-head portal-section-head-spaced"><div><h2 class="portal-section-title display">${t}</h2></div>${p ? `<a class="btn btn-ghost" href="${p}" onclick="return go(event, '${p}')">${lt || 'Бүгдийг үзэх'}</a>` : ''}</div>`;
    el.innerHTML = [
      homeSectionOn(cfg, 'select') && picks.length ? head('BairX <em>Select</em>', '/featured') + `<div class="home-listings-grid">${picks.slice(0, 8).map(l => listingCardHtml(l)).join('')}</div>` : '',
      homeSectionOn(cfg, 'agents') && agents.length ? head('Манай <em>агентууд</em>', '/agents') + `<div class="ag-grid">${agents.slice(0, 3).map(a => agentCardHtml(a)).join('')}</div>` : '',
      homeSectionOn(cfg, 'searchRequest') ? `<div class="sr-cta"><div><div class="sr-cta-title">Байр хайлтаа агентдаа даатга</div><div class="sr-cta-sub">Төсөв, байршил, шаардлагаа үлдээгээрэй — тохирох байр гармагц агент тань холбогдоно.</div></div><a class="btn btn-blue btn-lg" href="/search-request" onclick="return go(event, '/search-request')">Хүсэлт үлдээх</a></div>` : '',
      homeSectionOn(cfg, 'reviews') ? head('Үйлчлүүлэгчдийн <em>сэтгэгдэл</em>', '/reviews') + reviewsHtml(reviews) : ''
    ].join('');
  }

  // =================== /featured — BairX Select ===================
  registerRoute(/^\/featured$/, async () => {
    const ok = await rulesV3Ready();
    const feat = ok ? await loadSiteConfig('featured') : {};
    const picks = await fetchListingsByIds(feat.listingIds);
    return {
      title: 'BairX Select — онцлох зарууд | BairX',
      description: 'BairX-ийн баг шалгаж сонгосон онцлох орон сууцны зарууд.',
      html: `<div class="route-head"><div class="route-eyebrow">BairX Select</div><h1 class="route-title">Онцлох зарууд</h1>
        <p class="route-lead">BairX-ийн баг шалгаж сонгосон зарууд. Сонголтыг зөвхөн админ хийнэ, төлбөрөөр байр эзэлдэггүй.</p></div>
        <div class="home-listings-grid">${picks.length ? picks.map(l => listingCardHtml(l)).join('') : `<div class="home-empty-state"><div class="home-empty-title">Онцлох зар одоогоор сонгогдоогүй</div><div class="home-empty-sub">Бүх идэвхтэй зарыг <a href="/listings" onclick="return go(event,'/listings')">энд</a> үзнэ үү.</div></div>`}</div>`
    };
  });

  // =================== /transactions — бодит хэлцлүүд ===================
  registerRoute(/^\/transactions$/, async () => {
    await loadPriceData();
    return {
      title: 'Бодит хэлцлүүд — саяхан зарагдсан байрууд | BairX',
      description: 'Улаанбаатарын хотхонуудад саяхан бодитоор зарагдсан байрны сар, талбай, үнэ (хувийн мэдээлэлгүй).',
      html: `<div class="route-head"><div class="route-eyebrow">Бодит хэлцэл</div><h1 class="route-title">Саяхан зарагдсан байрууд</h1>
        <p class="route-lead">Зарын үнэ биш — бүртгэгдсэн бодит хэлцэл. Нэр, утас, хаяг харуулахгүй; сар, өрөө, талбай, ойролцоо үнийг л нийтэлнэ.</p></div>
        ${marketSalesHtml(200)}
        <p class="muted-note"><a href="/growth" onclick="return go(event,'/growth')">Хотхон бүрийн үнийн өсөлт →</a> · <a href="/market" onclick="return go(event,'/market')">Зах зээлийн судалгаа →</a></p>`
    };
  });

  // =================== /listing/:id — shareable listing URL ===================
  registerRoute(/^\/listing\/([A-Za-z0-9_-]{1,40})$/, async (m) => {
    const id = m[1];
    let l = listings.find(x => x.firestoreId === id);
    if (!l) {
      try { const doc = await db.collection('listings').doc(id).get(); if (doc.exists) l = ingestListingDoc(doc); } catch (e) {}
    }
    if (!l || l._inactive) {
      return { title: 'Зар олдсонгүй — BairX', description: '', html: `<div class="route-page route-narrow"><h1 class="route-title">Зар олдсонгүй</h1><p class="route-lead">Энэ зар хасагдсан эсвэл идэвхгүй болсон байна.</p><a class="btn btn-blue" href="/listings" onclick="return go(event, '/listings')">Бүх зар</a></div>` };
    }
    const similar = listings.filter(x => x !== l && !x._inactive && x.cat === l.cat && (l.complexId ? x.complexId === l.complexId : x.district === l.district)).slice(0, 8);
    return {
      title: `${l.title || 'Зар'} — ${fmtMoney(l.price)} | BairX`,
      description: `${l.title || ''} · ${l.area || l.areaM2 || ''} м² · ${l.rooms || ''} өрөө. BairX дээрх зарын дэлгэрэнгүй.`.slice(0, 300),
      canonical: '/listing/' + id,
      html: `<div class="route-head"><a class="route-back" href="/listings" onclick="return go(event, '/listings')">← Бүх зар</a><h1 class="route-title">${esc(l.title || 'Зар')}</h1></div>
        <div class="home-listings-grid">${listingCardHtml(l)}</div>
        ${l.complexId ? `<p class="muted-note"><a href="/complex/${encodeURIComponent(l.complexId)}" onclick="return go(event,'/complex/${encodeURIComponent(l.complexId)}')">Энэ хотхоны 1 м²-ийн дундаж үнэ, бусад зар →</a></p>` : ''}
        ${similar.length ? `<h2 class="route-h2">Төстэй зарууд</h2><div class="home-listings-grid">${similar.map(x => listingCardHtml(x)).join('')}</div>` : ''}`,
      after: () => { if (typeof openListing === 'function') openListing(l.id); }
    };
  });

  // =================== /o/:slug — арилжааны үл хөдлөх ===================
  const COMMERCIAL = {
    office: { label: 'Оффис', test: l => l.cat === 'office' && l.propertyType !== 'commercial' },
    retail: { label: 'Худалдаа, үйлчилгээний талбай', test: l => l.propertyType === 'commercial' },
    all: { label: 'Арилжааны бүх үл хөдлөх', test: l => l.cat === 'office' || l.propertyType === 'commercial' }
  };
  registerRoute(/^\/o\/([a-z]+)$/, async (m) => {
    const kind = COMMERCIAL[m[1]];
    if (!kind) return { title: 'Хуудас олдсонгүй — BairX', description: '', html: `<div class="route-page route-narrow"><h1 class="route-title">Хуудас олдсонгүй</h1>${commercialLinks()}</div>` };
    try {
      const snap = await db.collection('listings').where('status', '==', 'active').where('category', '==', 'office').limit(120).get();
      snap.forEach(doc => ingestListingDoc(doc));
    } catch (e) { console.error('commercial load failed:', e.code, e.message); }
    const items = listings.filter(l => !l._inactive && !l.isDemo && kind.test(l)).sort((a, b) => a.price - b.price);
    return {
      title: kind.label + ' — зар, 1 м²-ийн үнэ | BairX', description: 'Улаанбаатарын ' + kind.label.toLowerCase() + ' худалдах, түрээслэх идэвхтэй зарууд.',
      canonical: '/o/' + m[1],
      html: `<div class="route-head"><div class="route-eyebrow">Арилжааны үл хөдлөх</div><h1 class="route-title">${esc(kind.label)}</h1>
        <p class="route-lead">${items.length ? items.length + ' идэвхтэй зар. Зар бүрийн 1 м²-ийн үнийг картан дээр харуулна.' : 'Энэ ангилалд идэвхтэй зар удахгүй нэмэгдэнэ.'}</p>${commercialLinks(m[1])}</div>
        <div class="home-listings-grid">${items.length ? items.slice(0, 60).map(l => listingCardHtml(l)).join('') : homeEmptyStateHtml()}</div>`
    };
  });
  function commercialLinks(active) {
    return `<div class="chip-row">${Object.keys(COMMERCIAL).map(k => `<a class="chip ${k === active ? 'active' : ''}" href="/o/${k}" onclick="return go(event, '/o/${k}')">${COMMERCIAL[k].label}</a>`).join('')}</div>`;
  }

  // =================== /search-request — хайлтаа даатгах ===================
  registerRoute(/^\/search-request$/, async () => {
    await loadPriceData();
    const agents = await loadAgents();
    const qs = new URLSearchParams(location.search);
    const agentSlug = qs.get('agent') || '';
    const agent = agents.find(a => a.slug === agentSlug);
    const cx = complexListOf().sort((a, b) => a.name.localeCompare(b.name));
    return {
      title: 'Байр хайлтаа агентад даатгах | BairX',
      description: 'Төсөв, байршил, өрөө, шаардлагаа үлдээгээрэй — тохирох байр гармагц агент холбогдоно.',
      html: `<div class="route-page route-narrow"><div class="route-eyebrow">Үнэгүй үйлчилгээ</div><h1 class="route-title">Хайлтаа даатгах</h1>
        <p class="route-lead">${agent ? esc(agent.name) + ' таны хүсэлтийг хүлээн авна.' : 'Хүсэлт тань BairX-ийн агентад шууд очно.'} Тохирох байр гармагц холбогдоно.</p>
        <form class="lead-form" id="srForm" onsubmit="submitSearchRequest(event)">
          <input type="hidden" id="srAgent" value="${esc(agent ? agent.slug : '')}">
          <div class="lf-grid">
            <label class="lf-field"><span>Нэр *</span><input class="form-input" id="srName" maxlength="80" required autocomplete="name"></label>
            <label class="lf-field"><span>Утас *</span><input class="form-input" id="srPhone" inputmode="numeric" maxlength="12" required placeholder="99112233" autocomplete="tel"></label>
            <label class="lf-field"><span>Төсөв (сая ₮) *</span><input class="form-input" id="srBudget" type="number" min="10" step="10" required></label>
            <label class="lf-field"><span>Урьдчилгаа (сая ₮)</span><input class="form-input" id="srDown" type="number" min="0" step="5"></label>
            <label class="lf-field"><span>Санхүүжилт</span><select class="form-input" id="srFin"><option value="cash">Бэлэн мөнгө</option><option value="loan">Зээл</option><option value="mixed">Хосолсон</option></select></label>
            <label class="lf-field"><span>Дүүрэг</span><select class="form-input" id="srDistrict">${districtOptions('')}</select></label>
            <label class="lf-field"><span>Сонирхож буй хотхон</span><select class="form-input" id="srComplex"><option value="">Хамаагүй</option>${cx.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
            <label class="lf-field"><span>Өрөө</span><select class="form-input" id="srRooms"><option value="">Хамаагүй</option><option>1</option><option>2</option><option>3</option><option value="4">4+</option></select></label>
            <label class="lf-field"><span>Талбай, доод (м²)</span><input class="form-input" id="srAreaMin" type="number" min="10" max="1000"></label>
            <label class="lf-field"><span>Талбай, дээд (м²)</span><input class="form-input" id="srAreaMax" type="number" min="10" max="1000"></label>
          </div>
          <label class="lf-field"><span>Нэмэлт шаардлага</span><textarea class="form-textarea" id="srNote" maxlength="1000" rows="3" placeholder="Жнь: сургуультай ойр, 5-аас дээш давхар, зогсоолтой"></textarea></label>
          <label class="consent-row"><input type="checkbox" id="srNotify" checked> Тохирох шинэ зар гармагц надад мэдэгдэх</label>
          ${consentCheckboxHtml('srConsent')}
          <button class="btn btn-blue btn-lg" type="submit" id="srSubmit">Хүсэлт илгээх</button>
        </form></div>`
    };
  });
  async function submitSearchRequest(e) {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value.trim();
    const n = (id) => { const x = parseFloat(v(id)); return Number.isFinite(x) ? x : undefined; };
    const name = v('srName'), phone = normalizeMnPhone(v('srPhone')), budget = n('srBudget');
    if (!name) { showToast('Нэрээ оруулна уу'); return; }
    if (!phone) { showToast('8 оронтой утасны дугаар оруулна уу'); return; }
    if (!(budget > 0)) { showToast('Төсвөө оруулна уу'); return; }
    if (!consentGiven('srConsent')) return;
    if (!(await requireRulesV3(e.target))) return;
    const btn = document.getElementById('srSubmit');
    btn.disabled = true; btn.textContent = 'Илгээж байна…';
    try {
      await submitLead({
        type: 'search_request', name: name.slice(0, 80), phone, budget, downPayment: n('srDown'), financing: v('srFin'),
        district: v('srDistrict'), complexId: v('srComplex'), rooms: n('srRooms'), areaMin: n('srAreaMin'), areaMax: n('srAreaMax'),
        note: v('srNote').slice(0, 1000), agentSlug: v('srAgent'), notifyMatches: document.getElementById('srNotify').checked
      });
      document.getElementById('srForm').innerHTML = `<div class="lead-success"><strong>Хүсэлт хүлээн авлаа.</strong><br>Агент тань ${esc(phone)} дугаарт удахгүй холбогдоно.</div>`;
    } catch (err) {
      console.error('search request failed:', err.code, err.message);
      showToast('Илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
      btn.disabled = false; btn.textContent = 'Хүсэлт илгээх';
    }
  }

  // =================== /agents · /agent/:slug ===================
  registerRoute(/^\/agents$/, async () => {
    const agents = (await rulesV3Ready()) ? await loadAgents() : [];
    return {
      title: 'Агентууд — BairX', description: 'BairX-ийн үл хөдлөхийн агентууд: туршлага, хаасан хэлцэл, холбоо барих.',
      html: `<div class="route-head"><div class="route-eyebrow">Баг</div><h1 class="route-title">Манай агентууд</h1>
        <p class="route-lead">Тоон үзүүлэлтийг агент өөрөө биш, BairX-ийн админ баталгаажуулж оруулдаг.</p></div>
        ${agents.length ? `<div class="ag-grid">${agents.map(a => agentCardHtml(a)).join('')}</div>` : agentsEmpty()}`
    };
  });
  registerRoute(/^\/agent\/([a-z0-9-]{1,60})$/, async (m) => {
    const agents = (await rulesV3Ready()) ? await loadAgents() : [];
    const a = agents.find(x => x.slug === m[1]);
    if (!a) return { title: 'Агент олдсонгүй — BairX', description: '', html: `<div class="route-page route-narrow"><h1 class="route-title">Агент олдсонгүй</h1><a class="btn btn-blue" href="/agents" onclick="return go(event, '/agents')">Бүх агент</a></div>` };
    const [picks, reviews] = await Promise.all([fetchListingsByIds(a.featuredListingIds), loadApprovedReviews({ agentSlug: a.slug }, 20)]);
    return {
      title: `${a.name} — үл хөдлөхийн агент | BairX`, description: `${a.name}${a.org ? ', ' + a.org : ''}. Туршлага, хаасан хэлцэл, онцлох зарууд.`,
      canonical: '/agent/' + a.slug,
      html: `<div class="route-head"><a class="route-back" href="/agents" onclick="return go(event, '/agents')">← Бүх агент</a></div>
        <div class="ag-profile">${agentCardHtml(a, { full: true })}</div>
        ${a.bio ? `<div class="ag-bio">${esc(a.bio).replace(/\n/g, '<br>')}</div>` : ''}
        <h2 class="route-h2">Онцлох зарууд</h2>
        <div class="home-listings-grid">${picks.length ? picks.map(l => listingCardHtml(l)).join('') : '<p class="muted-note">Онцлох зар сонгогдоогүй байна.</p>'}</div>
        <h2 class="route-h2">Сэтгэгдэл</h2>${reviewsHtml(reviews)}`
    };
  });

  // =================== /reviews ===================
  registerRoute(/^\/reviews$/, async () => {
    const ok = await rulesV3Ready();
    const [list, agents] = ok ? await Promise.all([loadApprovedReviews(null, 100), loadAgents()]) : [[], []];
    const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length) : null;
    return {
      title: 'Үйлчлүүлэгчдийн сэтгэгдэл | BairX', description: 'BairX-ээр үйлчлүүлсэн хүмүүсийн шалгагдсан сэтгэгдэл.',
      html: `<div class="route-head"><div class="route-eyebrow">Сэтгэгдэл</div><h1 class="route-title">Үйлчлүүлэгчдийн сэтгэгдэл</h1>
        <p class="route-lead">${avg != null ? `Дундаж үнэлгээ <strong>${avg.toFixed(1)} / 5</strong> (${list.length} сэтгэгдэл). ` : ''}Сэтгэгдэл бүрийг нийтлэхээс өмнө шалгана.</p></div>
        ${reviewsHtml(list)}
        <h2 class="route-h2">Сэтгэгдэл үлдээх</h2>
        <form class="lead-form route-narrow" id="rvForm" onsubmit="submitReview(event)">
          <div class="lf-grid">
            <label class="lf-field"><span>Нэр *</span><input class="form-input" id="rvName" maxlength="80" required></label>
            <label class="lf-field"><span>Үнэлгээ *</span><select class="form-input" id="rvRating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${stars(n)} (${n})</option>`).join('')}</select></label>
            ${agents.length ? `<label class="lf-field"><span>Агент</span><select class="form-input" id="rvAgent"><option value="">—</option>${agents.map(a => `<option value="${esc(a.slug)}">${esc(a.name)}</option>`).join('')}</select></label>` : ''}
          </div>
          <label class="lf-field"><span>Сэтгэгдэл *</span><textarea class="form-textarea" id="rvText" maxlength="1000" rows="4" required></textarea></label>
          ${consentCheckboxHtml('rvConsent')}
          <button class="btn btn-blue" type="submit" id="rvSubmit">Илгээх</button>
        </form>`
    };
  });
  async function submitReview(e) {
    e.preventDefault();
    const name = document.getElementById('rvName').value.trim();
    const text = document.getElementById('rvText').value.trim();
    if (!name || !text) { showToast('Нэр, сэтгэгдлээ бөглөнө үү'); return; }
    if (!consentGiven('rvConsent')) return;
    if (!(await requireRulesV3(e.target))) return;
    const doc = {
      name: name.slice(0, 80), text: text.slice(0, 1000), rating: parseInt(document.getElementById('rvRating').value, 10),
      consent: true, status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const ag = document.getElementById('rvAgent'); if (ag && ag.value) doc.agentSlug = ag.value;
    if (currentUser) doc.uid = currentUser.uid;
    const btn = document.getElementById('rvSubmit'); btn.disabled = true;
    try {
      await db.collection('reviews').add(doc);
      document.getElementById('rvForm').innerHTML = `<div class="lead-success"><strong>Баярлалаа!</strong> Сэтгэгдэл тань шалгагдсаны дараа нийтлэгдэнэ.</div>`;
    } catch (err) { console.error('review failed:', err.code, err.message); showToast('Илгээхэд алдаа гарлаа'); btn.disabled = false; }
  }

  // =================== /terms · /contact (existing info-page content as real URLs) ===================
  function infoRoute(key, path) {
    return () => {
      const p = (typeof infoPages === 'object' && infoPages[key]) || { title: '', eyebrow: '', body: '' };
      return { title: p.title + ' — BairX', description: p.title, canonical: path,
        html: `<div class="route-page route-narrow info-page"><div class="route-eyebrow">${p.eyebrow}</div><h1 class="route-title">${p.title}</h1><div class="info-page-body">${p.body}</div></div>` };
    };
  }
  registerRoute(/^\/terms$/, infoRoute('terms', '/terms'));
  registerRoute(/^\/contact$/, infoRoute('contact', '/contact'));

  // =================== complex page extras ===================
  // Monthly deal price history as an SVG bar chart (deals only, n per month shown).
  function priceHistoryHtml(history) {
    const h = (history || []).filter(x => x.avgPpm2 != null);
    if (h.length < 2) return `<p class="muted-note">Сар бүрийн хэлцлийн түүх гаргахад өгөгдөл хүрэлцээгүй байна.</p>`;
    const W = Math.max(320, h.length * 44), H = 180, pad = 24, max = Math.max(...h.map(x => x.avgPpm2)), bw = (W - pad) / h.length - 8;
    return `<div class="ph-scroll"><svg class="ph-svg" viewBox="0 0 ${W} ${H + 36}" width="${W}" height="${H + 36}" role="img" aria-label="Сар бүрийн хэлцлийн 1 м²-ийн дундаж үнэ">
      ${h.map((x, i) => { const bh = Math.max(4, (H - pad) * x.avgPpm2 / max), xx = pad / 2 + i * (bw + 8), y = H - bh;
        return `<g><title>${x.month}: ${x.avgPpm2.toFixed(2)} сая ₮/м², ${x.n} хэлцэл</title><rect x="${xx}" y="${y}" width="${bw}" height="${bh}" rx="4" class="${x.n < P_.MIN_SALES ? 'thin' : ''}"/>
          <text x="${xx + bw / 2}" y="${y - 4}" text-anchor="middle" class="ph-v">${x.avgPpm2.toFixed(1)}</text>
          <text x="${xx + bw / 2}" y="${H + 14}" text-anchor="middle" class="ph-m">${x.month.slice(2)}</text>
          <text x="${xx + bw / 2}" y="${H + 28}" text-anchor="middle" class="ph-n">${x.n}</text></g>`; }).join('')}
    </svg></div><p class="muted-note">Сая ₮/м² · баганын доорх тоо = тухайн сарын хэлцлийн тоо. Цайвар багана = ${P_.MIN_SALES}-аас цөөн хэлцэл (сул итгэлцэл).</p>`;
  }
  function complexExtrasHtml(id, c, st, own) {
    const sale = own.filter(l => l.cat === 'apartment'), rent = own.filter(l => l.cat === 'rent');
    const gap = st && st.avgPpm2 != null && st.soldAvgPpm2_12m ? (st.avgPpm2 - st.soldAvgPpm2_12m) / st.soldAvgPpm2_12m : null;
    const lat = parseFloat(c.lat), lng = parseFloat(c.lng);
    const info = [c.developer && ['Барилгын компани', c.developer], c.buildingType && ['Барилгын төрөл', c.buildingType], c.yearBuilt && ['Ашиглалтад орсон', c.yearBuilt + ' он'], c.floors && ['Давхар', c.floors], c.blocks && ['Блок', c.blocks], c.address && ['Хаяг', c.address]].filter(Boolean);
    return `
      ${info.length || c.description ? `<h2 class="route-h2">Барилгын мэдээлэл</h2><div class="cx-info">${info.map(([k, v]) => `<div><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div>${c.description ? `<p class="cx-desc">${esc(c.description)}</p>` : ''}` : ''}
      ${Number.isFinite(lat) && Number.isFinite(lng) ? `<h2 class="route-h2">Байршил</h2><div class="cx-map"><iframe title="${esc(c.name || id)} газрын зураг" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.006},${lat - 0.004},${lng + 0.006},${lat + 0.004}&layer=mapnik&marker=${lat},${lng}"></iframe></div>` : ''}
      <h2 class="route-h2">Зарын үнэ ба бодит хэлцлийн үнэ</h2>
      <div class="cx-kpis">
        <div class="cx-kpi"><div class="cx-kpi-label">Зарын 1 м² (хамгийн бага)</div><div class="cx-kpi-val">${st && st.minPpm2 != null ? fmtPpm(st.minPpm2) : insufficient}</div></div>
        <div class="cx-kpi"><div class="cx-kpi-label">Зарын 1 м² (хамгийн өндөр)</div><div class="cx-kpi-val">${st && st.maxPpm2 != null ? fmtPpm(st.maxPpm2) : insufficient}</div></div>
        <div class="cx-kpi"><div class="cx-kpi-label">Хэлцлийн 1 м² (12 сар)</div><div class="cx-kpi-val">${st && st.soldAvgPpm2_12m != null ? fmtPpm(st.soldAvgPpm2_12m) : insufficient}</div></div>
        <div class="cx-kpi"><div class="cx-kpi-label">Зарын ба хэлцлийн зөрүү</div><div class="cx-kpi-val">${gap != null ? fmtPct(gap) : '—'}</div></div>
      </div>
      <h2 class="route-h2">Үнийн түүх (бодит хэлцэл)</h2>${priceHistoryHtml(st && st.history)}
      <div id="cxHot"></div>
      <h2 class="route-h2">Худалдах зарууд</h2>
      <div class="home-listings-grid">${sale.length ? sale.map(l => listingCardHtml(l)).join('') : '<p class="muted-note">Худалдах идэвхтэй зар одоогоор алга.</p>'}</div>
      <h2 class="route-h2">Түрээсийн зарууд</h2>
      <div class="home-listings-grid">${rent.length ? rent.map(l => listingCardHtml(l)).join('') : '<p class="muted-note">Түрээсийн идэвхтэй зар одоогоор алга.</p>'}</div>
      <div class="cx-contact"><div class="cx-contact-title">Энэ хотхонд шинэ зар гармагц мэдэгдэл авах</div><a class="btn btn-blue" href="/alerts?c=${encodeURIComponent(id)}" onclick="return go(event, '/alerts?c=${encodeURIComponent(id)}')">Мэдэгдэл тохируулах</a></div>
      <div id="cxAgents"></div>`;
  }
  async function complexExtrasAfter(id, agentSlug) {
    const hot = await loadSiteStat('hotlist');
    const items = ((hot && hot.items) || []).filter(h => h.complexId === id);
    const hotEl = document.getElementById('cxHot');
    if (hotEl && items.length) hotEl.innerHTML = `<h2 class="route-h2">Hot List-д орсон зарууд</h2>` + hotPreviewHtml({ items });
    if (!(await rulesV3Ready())) return;
    const agents = (await loadAgents()).filter(a => a.slug === agentSlug || (a.complexIds || []).includes(id));
    const el = document.getElementById('cxAgents');
    if (el && agents.length) el.innerHTML = `<h2 class="route-h2">Холбогдох агент</h2><div class="ag-grid">${agents.slice(0, 3).map(a => agentCardHtml(a)).join('')}</div>`;
  }
