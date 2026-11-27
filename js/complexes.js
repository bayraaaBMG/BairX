  // ===== COMPLEXES · HOT LIST · VALUATION · GROWTH · BUDGET PAGES =====
  // Every average/growth figure shown here is READ from complexStats/{id} and siteStats/*,
  // which only the scheduled Cloud Function writes (functions/index.js). The browser never
  // aggregates prices itself — it only applies the documented per-listing formulas from
  // js/pricing.js (hot-list comparison, valuation = avg × area, budget / avg) to those
  // server numbers. Each figure is printed next to its method and "Шинэчилсэн" date.

  const P_ = BairxPricing;
  const DISTRICT_LABELS = {
    'khan-uul': 'Хан-Уул', 'sukhbaatar': 'Сүхбаатар', 'chingeltei': 'Чингэлтэй', 'bayanzurkh': 'Баянзүрх',
    'bayangol': 'Баянгол', 'songinokhairkhan': 'Сонгинохайрхан', 'nalaikh': 'Налайх',
    'baganuur': 'Багануур', 'bagakhangai': 'Багахангай'
  };
  const districtLabel = (d) => DISTRICT_LABELS[d] || d || '';

  const priceData = { complexes: new Map(), stats: new Map(), hot: null, summary: null, loaded: false, _p: null };

  function loadPriceData(force) {
    if (priceData._p && !force) return priceData._p;
    priceData._p = (async () => {
      try {
        const [cx, st] = await Promise.all([db.collection('complexes').get(), db.collection('complexStats').get()]);
        priceData.complexes = new Map(cx.docs.map(d => [d.id, Object.assign({ id: d.id }, d.data())]));
        priceData.stats = new Map(st.docs.map(d => [d.id, d.data()]));
      } catch (e) { console.error('loadPriceData failed:', e.code, e.message); }
      priceData.loaded = true;
      return priceData;
    })();
    return priceData._p;
  }
  async function loadSiteStat(name) {
    try {
      const snap = await db.doc('siteStats/' + name).get();
      return snap.exists ? snap.data() : null;
    } catch (e) { return null; }
  }

  function statsFor(id) { return id ? priceData.stats.get(id) || null : null; }
  function usableAvg(st) { return st && st.avgPpm2 != null && st.listingCount >= P_.MIN_LISTINGS ? st.avgPpm2 : null; }

  // Name typed on the Add-Listing form → catalogue id: exact (case-insensitive) name match
  // first, otherwise the same slug the server/migration would derive.
  function resolveComplexId(name) {
    const n = String(name || '').trim().toLowerCase();
    if (!n) return '';
    for (const [id, c] of priceData.complexes) if ((c.name || '').trim().toLowerCase() === n) return id;
    return P_.slugify(n);
  }

  // Hot-list membership for any in-memory listing (used by the Listings page's
  // "Зах зээлээс хямд" toggle and by card badges).
  function isHotListing(l) {
    // Demo seed listings are client-side placeholders — never compared to real averages.
    if (!l || l.isDemo || l.cat !== 'apartment' || l._inactive) return false;
    const avg = usableAvg(statsFor(l.complexId));
    return avg != null && P_.isHot(l, avg);
  }

  function complexListOf() {
    const ids = new Set([...priceData.complexes.keys(), ...priceData.stats.keys()]);
    // Ids are slugs; anything else is skipped rather than ever reaching a URL/handler.
    return [...ids].filter(id => /^[a-z0-9-]{1,60}$/.test(id)).map(id => {
      const c = priceData.complexes.get(id) || {};
      const s = priceData.stats.get(id) || {};
      return {
        id, name: c.name || s.name || id, district: c.district || s.district || '', khoroo: c.khoroo || s.khoroo || null,
        photo: (c.photos && c.photos[0]) || s.photo || '', stats: priceData.stats.get(id) || null, complex: c
      };
    });
  }

  // ---- formatting ----
  const fmtPpm = (v) => v == null ? '—' : (Math.round(v * 100) / 100).toFixed(2) + ' сая ₮/м²';
  const fmtPct = (v) => v == null ? null : (v > 0 ? '+' : '') + (Math.round(v * 1000) / 10).toFixed(1) + '%';
  const fmtMoney = (m) => m == null ? '—' : (m >= 1000 ? (m / 1000).toFixed(2) + ' тэрбум ₮' : Math.round(m) + ' сая ₮');
  const insufficient = '<span class="data-thin">өгөгдөл хүрэлцээгүй</span>';
  function updatedLine(date) { return `<span class="updated-at">Шинэчилсэн: ${esc(date || '—')}</span>`; }

  const METHOD = {
    avg: `<strong>Аргачлал:</strong> 1 м²-ийн дундаж = тухайн хотхоны идэвхтэй орон сууцны зарын (үнэ ÷ талбай)-н энгийн дундаж. Нэг байрыг олон агент тавьсан бол (хотхон + талбай + давхар + өрөө ижил) нэг гэж тооцно. ${P_.MIN_LISTINGS}-аас цөөн давтагдаагүй зартай хотхонд дундаж харуулахгүй. Өдөр бүр автоматаар шинэчлэгдэнэ.`,
    hot: `<strong>Журам:</strong> зарын 1 м²-ийн үнэ нь тухайн хотхоны 1 м²-ийн дунджаас <strong>15% ба түүнээс дээш</strong> доогуур бол (үнэ/м² ≤ дундаж × 0.85) энд орно. Дундаж нь ${P_.MIN_LISTINGS}+ зартай хотхонд л тооцогдоно. Хямд үнэ нь байрны нөхцөл, бичиг баримтын асуудалтай холбоотой байж болзошгүй тул заавал биечлэн үзэж, шалгана уу.`,
    valuation: `<strong>Аргачлал:</strong> үнэлгээ = хотхоны 1 м²-ийн дундаж × таны талбай, ±10% хүрээтэй. <strong>Ойролцоо тооцоо, мэргэжлийн үнэлгээ биш.</strong> Засвар, давхар, цонхны чиглэл, бичиг баримтын байдал үнэд нөлөөлнө.`,
    growth: `<strong>Аргачлал:</strong> зөвхөн бүртгэгдсэн бодит хэлцлийн (зарагдсан үнэ ÷ талбай) дунджаар тооцно, зарын үнэ орохгүй. 2023 → одоо = (сүүлийн 12 сарын дундаж − 2023 оны дундаж) ÷ 2023 оны дундаж. 1 жилийн өсөлт = сүүлийн 12 сар vs түүний өмнөх 12 сар. Аль нэг хугацаанд ${P_.MIN_SALES}-аас цөөн хэлцэл байвал "өгөгдөл хүрэлцээгүй".`,
    budget: `<strong>Аргачлал:</strong> авах боломжтой талбай = таны төсөв ÷ хотхоны 1 м²-ийн дундаж. Зөвхөн ${P_.MIN_SALES}+ бүртгэгдсэн хэлцэлтэй хотхоныг харуулна.`
  };
  const methodNote = (k) => `<div class="method-note">${METHOD[k]}</div>`;

  function districtOptions(selected) {
    return `<option value="">Бүх дүүрэг</option>` + Object.keys(DISTRICT_LABELS).map(k => `<option value="${k}" ${k === selected ? 'selected' : ''}>${DISTRICT_LABELS[k]}</option>`).join('');
  }

  // =================== /complexes ===================
  registerRoute(/^\/complexes$/, async () => {
    await loadPriceData();
    const qs = new URLSearchParams(location.search);
    return {
      title: 'Хотхонууд — 1 м²-ийн дундаж үнэ | BairX',
      description: 'Улаанбаатарын хотхон бүрийн 1 м²-ийн дундаж үнэ, идэвхтэй зарын тоо. Дүүрэг, хороогоор шүүх.',
      html: `<div class="route-head">
        <div class="route-eyebrow">Үнийн өгөгдөл</div>
        <h1 class="route-title">Хотхонууд</h1>
        <p class="route-lead">Хотхон бүрийн 1 м²-ийн дундаж үнэ, идэвхтэй зарын тоо. Дээр нь дарж тухайн хотхоны бүх зар, сүүлийн хэлцлийг харна.</p>
        <div class="cx-filters">
          <select class="form-input" id="cxDistrict" onchange="renderComplexGrid()">${districtOptions(qs.get('d') || '')}</select>
          <input class="form-input" id="cxKhoroo" type="number" min="1" max="40" placeholder="Хороо" oninput="renderComplexGrid()" />
          <input class="form-input" id="cxSearch" placeholder="Хотхоны нэр" oninput="renderComplexGrid()" />
        </div>
      </div>
      <div id="cxGrid" class="cx-grid"></div>
      ${methodNote('avg')}`,
      after: renderComplexGrid
    };
  });

  function complexCardHtml(c) {
    const avg = usableAvg(c.stats);
    return `<a class="cx-card" href="/complex/${encodeURIComponent(c.id)}" onclick="return go(event, '/complex/${encodeURIComponent(c.id)}')">
      <div class="cx-card-img">${c.photo ? `<img src="${esc(c.photo)}" alt="${esc(c.name)}" loading="lazy" onerror="this.remove()">` : ''}</div>
      <div class="cx-card-body">
        <div class="cx-card-name">${esc(c.name)}</div>
        <div class="cx-card-loc">${esc(districtLabel(c.district))}${c.khoroo ? ', ' + esc(c.khoroo) + '-р хороо' : ''}</div>
        <div class="cx-card-ppm">${avg != null ? fmtPpm(avg) : insufficient}</div>
        <div class="cx-card-meta">${c.stats && c.stats.listingCount ? c.stats.listingCount + ' идэвхтэй зар' : 'Зар удахгүй нэмэгдэнэ'}${c.stats && c.stats.salesCount ? ' · ' + c.stats.salesCount + ' хэлцэл' : ''}</div>
        ${c.stats ? `<div class="cx-card-upd">${updatedLine(c.stats.updatedDate)}</div>` : ''}
      </div>
    </a>`;
  }

  function renderComplexGrid() {
    const grid = document.getElementById('cxGrid');
    if (!grid) return;
    const d = document.getElementById('cxDistrict')?.value || '';
    const k = parseInt(document.getElementById('cxKhoroo')?.value, 10);
    const q = (document.getElementById('cxSearch')?.value || '').trim().toLowerCase();
    const items = complexListOf()
      .filter(c => !d || c.district === d)
      .filter(c => !k || Number(c.khoroo) === k)
      .filter(c => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => (b.stats?.listingCount || 0) - (a.stats?.listingCount || 0) || a.name.localeCompare(b.name));
    grid.innerHTML = items.length ? items.map(complexCardHtml).join('')
      : `<div class="home-empty-state"><div class="home-empty-title">Удахгүй хотхонууд нэмэгдэнэ</div><div class="home-empty-sub">Шүүлтүүрээ өөрчилж үзэх эсвэл өөрийн хотхоны байрыг үнэлүүлээрэй.</div><a class="btn btn-blue" href="/valuation" onclick="return go(event, '/valuation')">Байраа үнэлүүлэх</a></div>`;
  }

  // =================== /complex/:id ===================
  registerRoute(/^\/complex\/([^/]+)$/, async (m) => {
    const id = decodeURIComponent(m[1]);
    await loadPriceData();
    const c = priceData.complexes.get(id) || {};
    const st = priceData.stats.get(id) || null;
    if (!/^[a-z0-9-]{1,60}$/.test(id) || (!c.name && !st && !listings.some(l => l.complexId === id && !l.isDemo))) {
      return { title: 'Хотхон олдсонгүй — BairX', description: '', html: `<div class="route-page route-narrow"><h1 class="route-title">Хотхон олдсонгүй</h1><p class="route-lead">Энэ хотхоны мэдээлэл одоогоор алга.</p><a class="btn btn-blue" href="/complexes" onclick="return go(event, '/complexes')">Бүх хотхон</a></div>` };
    }
    // Pull this complex's active listings (beyond the first public page already in memory).
    try {
      const snap = await db.collection('listings').where('complexId', '==', id).where('status', '==', 'active').limit(60).get();
      snap.forEach(doc => ingestListingDoc(doc));
    } catch (e) { console.error('complex listings load failed:', e.code, e.message); }
    const name = c.name || st?.name || listings.find(l => l.complexId === id)?.complex || id;
    const avg = usableAvg(st);
    const own = listings.filter(l => l.complexId === id && !l._inactive && !l.isDemo);
    const photos = (c.photos && c.photos.length ? c.photos : (st?.photo ? [st.photo] : [])).slice(0, 6);
    const recent = (st && st.recentSales) || [];
    const phone = c.phone || SITE_HOTLINE;
    return {
      title: `${name} — 1 м²-ийн дундаж үнэ, зарууд | BairX`,
      description: `${name} хотхоны 1 м²-ийн дундаж үнэ${avg != null ? ' ' + fmtPpm(avg) : ''}, идэвхтэй зарууд, сүүлийн хэлцлүүд.`,
      canonical: '/complex/' + encodeURIComponent(id),
      html: `<div class="route-head">
        <a class="route-back" href="/complexes" onclick="return go(event, '/complexes')">← Бүх хотхон</a>
        <div class="route-eyebrow">${esc(districtLabel(c.district || st?.district))}${c.khoroo ? ', ' + esc(c.khoroo) + '-р хороо' : ''}</div>
        <h1 class="route-title">${esc(name)}</h1>
        ${c.yearBuilt || c.floors ? `<p class="route-lead">${c.yearBuilt ? 'Ашиглалтад орсон: ' + esc(c.yearBuilt) + ' он' : ''}${c.yearBuilt && c.floors ? ' · ' : ''}${c.floors ? esc(c.floors) + ' давхар' : ''}</p>` : ''}
      </div>
      ${photos.length ? `<div class="cx-photos">${photos.map(p => `<img src="${esc(p)}" alt="${esc(name)}" loading="lazy">`).join('')}</div>` : ''}
      <div class="cx-kpis">
        <div class="cx-kpi"><div class="cx-kpi-label">1 м²-ийн дундаж</div><div class="cx-kpi-val">${avg != null ? fmtPpm(avg) : insufficient}</div>${st ? updatedLine(st.updatedDate) : ''}</div>
        <div class="cx-kpi"><div class="cx-kpi-label">Идэвхтэй зар</div><div class="cx-kpi-val">${st ? st.listingCount : own.length}</div></div>
        <div class="cx-kpi"><div class="cx-kpi-label">Сүүлийн 12 сарын хэлцэл</div><div class="cx-kpi-val">${st ? st.sales12m : 0}</div></div>
        <div class="cx-kpi"><div class="cx-kpi-label">2023 → одоо</div><div class="cx-kpi-val">${st && st.growth2023 != null ? fmtPct(st.growth2023) : insufficient}</div></div>
      </div>
      ${methodNote('avg')}
      <div class="cx-contact">
        <div class="cx-contact-title">Энэ хотхоны талаар асуух</div>
        ${contactButtonsHtml(phone, { complexId: id, message: 'Сайн байна уу, BairX дээрх ' + name + ' хотхоны талаар асуух гэсэн юм.' })}
        <a class="btn btn-ghost cx-val-cta" href="/valuation?c=${encodeURIComponent(id)}" onclick="return go(event, '/valuation?c=${encodeURIComponent(id)}')">Энэ хотхонд байраа үнэлүүлэх →</a>
      </div>
      <h2 class="route-h2">Энэ хотхоны зарууд</h2>
      <div class="home-listings-grid">${own.length ? own.map(l => listingCardHtml(l)).join('') : homeEmptyStateHtml()}</div>
      <h2 class="route-h2">Саяхан зарагдсан</h2>
      ${recentSalesHtml(recent)}`
    };
  });

  function recentSalesHtml(rows) {
    if (!rows || !rows.length) return `<p class="muted-note">Бүртгэгдсэн хэлцэл одоогоор алга.</p>`;
    return `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Сар</th><th>Өрөө</th><th>Талбай</th><th>Үнэ</th><th>1 м²</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.month)}</td><td>${r.rooms != null ? r.rooms : '—'}</td><td>${r.areaM2} м²</td><td>${fmtMoney(r.price)}</td><td>${fmtPpm(P_.pricePerM2(r.price, r.areaM2))}</td></tr>`).join('')}</tbody>
    </table></div><p class="muted-note">Хувийн мэдээлэлгүй: зөвхөн сар, өрөө, талбай, ойролцоо үнэ харуулна.</p>`;
  }

  // =================== /hotlist ===================
  let _hotRooms = 'all';
  registerRoute(/^\/hotlist$/, async () => {
    priceData.hot = await loadSiteStat('hotlist');
    return {
      title: 'Хямд зарууд — хотхоны дунджаас 15%+ доогуур | BairX',
      description: 'Хотхоныхоо 1 м²-ийн дунджаас 15% ба түүнээс дээш хямд орон сууцны зарууд. Өдөр бүр шинэчлэгдэнэ.',
      html: `<div class="route-head">
        <div class="route-eyebrow">Hot list</div>
        <h1 class="route-title">Дунджаас хямд зарууд</h1>
        <p class="route-lead">Хотхоныхоо 1 м²-ийн дундаж үнээс 15%+ доогуур үнэтэй орон сууцнууд. ${updatedLine(priceData.hot?.updatedDate)}</p>
        <div class="chip-row" id="hotRooms">${['all', '1', '2', '3', '4'].map(r => `<button class="chip ${r === _hotRooms ? 'active' : ''}" data-r="${r}" onclick="setHotRooms('${r}')">${r === 'all' ? 'Бүгд' : r === '4' ? '4+ өрөө' : r + ' өрөө'}</button>`).join('')}</div>
      </div>
      ${methodNote('hot')}
      <div id="hotGrid" class="hot-grid"></div>
      <div class="cx-contact"><div class="cx-contact-title">Шинэ хямд зар гармагц мэдэгдэл авах уу?</div><a class="btn btn-blue" href="/alerts" onclick="return go(event, '/alerts')">Мэдэгдэл тохируулах</a></div>`,
      after: renderHotGrid
    };
  });
  function setHotRooms(r) {
    _hotRooms = r;
    document.querySelectorAll('#hotRooms .chip').forEach(c => c.classList.toggle('active', c.dataset.r === r));
    renderHotGrid();
  }
  function renderHotGrid() {
    const grid = document.getElementById('hotGrid');
    if (!grid) return;
    const items = ((priceData.hot && priceData.hot.items) || []).filter(h => _hotRooms === 'all' || (_hotRooms === '4' ? h.rooms >= 4 : h.rooms === parseInt(_hotRooms, 10)));
    if (!items.length) {
      grid.innerHTML = `<div class="home-empty-state"><div class="home-empty-title">Одоогоор журамд тэнцэх зар алга</div><div class="home-empty-sub">Хотхоны дунджаас 15%+ хямд зар гармагц энд гарна. Мэдэгдэл тохируулбал танд шууд хэлнэ.</div></div>`;
      return;
    }
    grid.innerHTML = items.map(h => `<article class="hot-card" onclick="openListingByFsId('${String(h.listingId).replace(/[^A-Za-z0-9_-]/g, '')}')">
      <div class="hot-img">${h.img ? `<img src="${esc(h.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span class="hot-badge">−${h.discountPct}%</span></div>
      <div class="hot-body">
        <div class="hot-price">${fmtMoney(h.price)}</div>
        <div class="hot-title">${esc(h.title)}</div>
        <div class="hot-loc">${esc(h.complexName)} · ${h.rooms != null ? h.rooms + ' өрөө · ' : ''}${h.areaM2} м²</div>
        <div class="hot-why">1 м²: <strong>${fmtPpm(h.pricePerM2)}</strong> · хотхоны дундаж ${fmtPpm(h.complexAvgPpm2)}<br><strong>Хотхоны дунджаас ${h.discountPct}% доогуур</strong></div>
      </div>
    </article>`).join('');
  }

  // =================== /valuation ===================
  registerRoute(/^\/valuation$/, async () => {
    await loadPriceData();
    const pre = new URLSearchParams(location.search).get('c') || '';
    const opts = complexListOf().filter(c => usableAvg(c.stats) != null).sort((a, b) => a.name.localeCompare(b.name));
    return {
      title: 'Байраа үнэлүүлэх — ойролцоо үнэлгээ | BairX',
      description: 'Хотхон, талбай, өрөөгөө оруулж байрныхаа ойролцоо зах зээлийн үнийг хотхоны 1 м²-ийн дунджаар тооцоол.',
      html: `<div class="route-page route-narrow">
        <div class="route-eyebrow">Үнэгүй</div>
        <h1 class="route-title">Байраа үнэлүүлэх</h1>
        <p class="route-lead">Хотхоны 1 м²-ийн бодит дундаж үнээр таны байрны ойролцоо үнийг тооцоолно.</p>
        <form class="lead-form" id="valForm" onsubmit="submitValuation(event)">
          <label class="lf-field"><span>Хотхон *</span>
            <select class="form-input" id="valComplex" required>
              <option value="">Сонгох…</option>
              ${opts.map(c => `<option value="${esc(c.id)}" ${c.id === pre ? 'selected' : ''}>${esc(c.name)} — ${esc(districtLabel(c.district))}</option>`).join('')}
            </select></label>
          ${opts.length ? '' : '<div class="muted-note">Хангалттай өгөгдөлтэй хотхон одоогоор алга. Өгөгдөл нэмэгдэхээр энд гарна.</div>'}
          <div class="lf-grid">
            <label class="lf-field"><span>Талбай (м²) *</span><input class="form-input" id="valArea" type="number" min="10" max="1000" step="0.1" required /></label>
            <label class="lf-field"><span>Өрөө *</span><select class="form-input" id="valRooms" required><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4+</option></select></label>
          </div>
          <label class="lf-field"><span>Давхар</span><input class="form-input" id="valFloor" type="number" min="-2" max="60" /></label>
          <div class="lf-sep">Үнэлгээг харахын тулд холбоо барих мэдээллээ үлдээнэ үү</div>
          <div class="lf-grid">
            <label class="lf-field"><span>Нэр *</span><input class="form-input" id="valName" maxlength="80" required autocomplete="name" /></label>
            <label class="lf-field"><span>Утас *</span><input class="form-input" id="valPhone" inputmode="numeric" maxlength="12" required placeholder="99112233" autocomplete="tel" /></label>
          </div>
          ${consentCheckboxHtml('valConsent')}
          <button class="btn btn-blue btn-lg" type="submit" id="valSubmit">Үнэлгээ харах</button>
        </form>
        <div id="valResult"></div>
        ${methodNote('valuation')}
      </div>`
    };
  });

  async function submitLead(fields) {
    const doc = Object.assign({
      consent: true, status: 'new', source: getLeadSource(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, fields);
    if (currentUser) doc.uid = currentUser.uid;
    Object.keys(doc).forEach(k => { if (doc[k] === undefined || doc[k] === '') delete doc[k]; });
    await db.collection('leads').add(doc);
    trackEvent('lead_submit', { channel: fields.type, complexId: fields.complexId || '', page: currentPageName() });
  }

  async function submitValuation(e) {
    e.preventDefault();
    const complexId = document.getElementById('valComplex').value;
    const area = parseFloat(document.getElementById('valArea').value);
    const rooms = parseInt(document.getElementById('valRooms').value, 10);
    const floorRaw = document.getElementById('valFloor').value;
    const name = document.getElementById('valName').value.trim();
    const phone = normalizeMnPhone(document.getElementById('valPhone').value);
    if (!complexId) { showToast('Хотхоноо сонгоно уу'); return; }
    if (!(area > 0)) { showToast('Талбайгаа оруулна уу'); return; }
    if (!name) { showToast('Нэрээ оруулна уу'); return; }
    if (!phone) { showToast('8 оронтой утасны дугаар оруулна уу'); return; }
    if (!consentGiven('valConsent')) return;
    if (!(await requireServerReady(e.target))) return;
    const st = statsFor(complexId);
    const v = P_.valuation(usableAvg(st), area);
    const btn = document.getElementById('valSubmit');
    btn.disabled = true; btn.textContent = 'Тооцоолж байна…';
    try {
      await submitLead({ type: 'valuation', name: name.slice(0, 80), phone, complexId, areaM2: area, rooms, floor: floorRaw === '' ? undefined : parseInt(floorRaw, 10), estimate: v ? v.estimate : undefined });
    } catch (err) {
      console.error('valuation lead failed:', err.code, err.message);
      showToast('Илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
      btn.disabled = false; btn.textContent = 'Үнэлгээ харах';
      return;
    }
    document.getElementById('valForm').style.display = 'none';
    const cname = priceData.complexes.get(complexId)?.name || st?.name || complexId;
    document.getElementById('valResult').innerHTML = v ? `<div class="val-result">
        <div class="val-label">${esc(cname)} · ${area} м² · ${rooms} өрөө</div>
        <div class="val-main">${fmtMoney(v.estimate)}</div>
        <div class="val-range">Хүрээ: ${fmtMoney(v.low)} – ${fmtMoney(v.high)} (±10%)</div>
        <div class="val-calc">${fmtPpm(st.avgPpm2)} × ${area} м² · ${updatedLine(st.updatedDate)}</div>
        <div class="val-disclaimer">Ойролцоо тооцоо, мэргэжлийн үнэлгээ биш.</div>
        <p class="muted-note">Манай мэргэжилтэн ${esc(phone)} дугаарт холбогдож, нарийвчилсан үнэлгээ санал болгоно.</p>
      </div>` : `<div class="lead-success">Хүсэлт хүлээн авлаа. Энэ хотхонд өгөгдөл хүрэлцээгүй тул манай мэргэжилтэн ${esc(phone)} дугаарт холбогдож үнэлгээ хийнэ.</div>`;
  }

  // =================== /growth (3.1) ===================
  registerRoute(/^\/growth$/, async () => {
    await loadPriceData();
    const rows = complexListOf().filter(c => c.stats).sort((a, b) => (b.stats.growth2023 ?? -99) - (a.stats.growth2023 ?? -99));
    const upd = rows[0]?.stats.updatedDate;
    return {
      title: 'Хотхоны үнийн өсөлт — 2023 → одоо | BairX',
      description: 'Хотхон бүрийн 1 м²-ийн үнийн өсөлт 2023 оноос хойш болон сүүлийн 1 жилд, зөвхөн бодит хэлцлийн өгөгдлөөр.',
      html: `<div class="route-head">
        <div class="route-eyebrow">Үнийн өсөлт</div>
        <h1 class="route-title">Хотхоны үнийн өсөлт</h1>
        <p class="route-lead">Зөвхөн бүртгэгдсэн бодит хэлцлийн өгөгдлөөр. ${updatedLine(upd)}</p>
      </div>
      ${rows.length ? `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Хотхон</th><th>2023 дундаж</th><th>Сүүлийн 12 сар</th><th>2023 → одоо</th><th>1 жилийн өсөлт</th><th>Хэлцэл</th></tr></thead>
        <tbody>${rows.map(c => `<tr>
          <td><a href="/complex/${encodeURIComponent(c.id)}" onclick="return go(event, '/complex/${encodeURIComponent(c.id)}')">${esc(c.name)}</a></td>
          <td>${c.stats.soldAvgPpm2_2023 != null ? fmtPpm(c.stats.soldAvgPpm2_2023) : insufficient}</td>
          <td>${c.stats.soldAvgPpm2_12m != null ? fmtPpm(c.stats.soldAvgPpm2_12m) : insufficient}</td>
          <td class="${(c.stats.growth2023 || 0) >= 0 ? 'pos' : 'neg'}">${c.stats.growth2023 != null ? fmtPct(c.stats.growth2023) : insufficient}</td>
          <td class="${(c.stats.growth1y || 0) >= 0 ? 'pos' : 'neg'}">${c.stats.growth1y != null ? fmtPct(c.stats.growth1y) : insufficient}</td>
          <td>${c.stats.salesCount || 0}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="home-empty-state"><div class="home-empty-title">Удахгүй нэмэгдэнэ</div><div class="home-empty-sub">Хэлцлийн өгөгдөл бүртгэгдэхээр энд хотхон бүрийн өсөлт гарна.</div></div>`}
      ${methodNote('growth')}`
    };
  });

  // =================== /budget (3.2) ===================
  registerRoute(/^\/budget$/, async () => {
    await loadPriceData();
    const b = parseFloat(new URLSearchParams(location.search).get('b')) || '';
    return {
      title: 'Төсвөөрөө хэдэн м² авах вэ? | BairX',
      description: 'Төсвөө оруулаад хотхон бүрт хэдэн м² байр авах боломжтойг 1 м²-ийн бодит дунджаар харьцуул.',
      html: `<div class="route-head">
        <div class="route-eyebrow">Тооцоолуур</div>
        <h1 class="route-title">Төсвөөрөө хэдэн м² авах вэ?</h1>
        <div class="cx-filters"><label class="lf-field" style="flex:1;max-width:320px;"><span>Төсөв (сая ₮)</span>
          <input class="form-input" id="budgetInput" type="number" min="10" step="10" value="${b}" placeholder="500" oninput="renderBudgetTable()" /></label></div>
      </div>
      <div id="budgetTable"></div>
      ${methodNote('budget')}`,
      after: renderBudgetTable
    };
  });
  function renderBudgetTable() {
    const el = document.getElementById('budgetTable');
    if (!el) return;
    const budget = parseFloat(document.getElementById('budgetInput').value);
    const rows = complexListOf().filter(c => c.stats && (c.stats.salesCount || 0) >= P_.MIN_SALES && usableAvg(c.stats) != null);
    if (!rows.length) { el.innerHTML = `<div class="home-empty-state"><div class="home-empty-title">Удахгүй нэмэгдэнэ</div><div class="home-empty-sub">${P_.MIN_SALES}+ хэлцэлтэй хотхон бүртгэгдэхээр энд харагдана.</div></div>`; return; }
    if (!(budget > 0)) { el.innerHTML = `<p class="muted-note">Төсвөө оруулна уу.</p>`; return; }
    const data = rows.map(c => ({ c, m2: P_.m2ForBudget(budget, c.stats.avgPpm2) })).sort((a, b) => b.m2 - a.m2);
    el.innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Хотхон</th><th>Дүүрэг</th><th>1 м²-ийн дундаж</th><th>Таны төсвөөр</th></tr></thead>
      <tbody>${data.map(({ c, m2 }) => `<tr><td><a href="/complex/${encodeURIComponent(c.id)}" onclick="return go(event, '/complex/${encodeURIComponent(c.id)}')">${esc(c.name)}</a></td><td>${esc(districtLabel(c.district))}</td><td>${fmtPpm(c.stats.avgPpm2)}</td><td><strong>${m2} м²</strong></td></tr>`).join('')}</tbody>
    </table></div><p class="muted-note">${updatedLine(rows[0].stats.updatedDate)}</p>`;
  }

  // =================== /b/:slug — budget landing pages (3.3) ===================
  registerRoute(/^\/b\/([a-z0-9-]+)$/, async (m) => {
    const b = P_.parseBudgetSlug(m[1]);
    if (!b) return { title: 'Хуудас олдсонгүй — BairX', description: '', html: `<div class="route-page route-narrow"><h1 class="route-title">Хуудас олдсонгүй</h1>${budgetLinksHtml()}</div>` };
    // Make sure we have more than the first page of public listings for this range.
    try {
      const snap = await db.collection('listings').where('status', '==', 'active')
        .where('category', '==', b.kind === 'rent' ? 'rent' : 'apartment').limit(120).get();
      snap.forEach(doc => ingestListingDoc(doc));
    } catch (e) { console.error('budget page load failed:', e.code, e.message); }
    // Real listings only — these are indexable SEO pages, so demo seed data never appears.
    const items = listings.filter(l => !l._inactive && !l.isDemo && (b.kind === 'rent' ? l.cat === 'rent' : l.cat === 'apartment') && P_.inBudget(l.price, b))
      .sort((x, y) => x.price - y.price);
    const title = b.label + ' — Улаанбаатар | BairX';
    const desc = `${b.label}: Улаанбаатарын идэвхтэй зарууд, хотхоны 1 м²-ийн дундаж үнэтэй харьцуулсан. Өдөр бүр шинэчлэгдэнэ.`;
    return {
      title, description: desc, canonical: '/b/' + b.slug,
      html: `<div class="route-head">
        <div class="route-eyebrow">${b.kind === 'rent' ? 'Түрээс' : 'Худалдах'}</div>
        <h1 class="route-title">${esc(b.label)}</h1>
        <p class="route-lead">${items.length ? items.length + ' зар' : 'Энэ төсөвт тохирох зар удахгүй нэмэгдэнэ'}. ${b.kind === 'sale' ? 'Хотхоныхоо дунджаас 15%+ хямдыг <a href="/hotlist" onclick="return go(event, \'/hotlist\')">хямд зарын жагсаалтаас</a> харна уу.' : ''}</p>
        ${budgetLinksHtml(b.slug)}
      </div>
      <div class="home-listings-grid">${items.length ? items.slice(0, 48).map(l => listingCardHtml(l)).join('') : homeEmptyStateHtml()}</div>
      <div class="cx-contact"><div class="cx-contact-title">Энэ төсөвт шинэ зар гармагц мэдэгдэл авах</div><a class="btn btn-blue" href="/alerts?b=${b.max || ''}" onclick="return go(event, '/alerts?b=${b.max || ''}')">Мэдэгдэл тохируулах</a></div>`
    };
  });
  function budgetLinksHtml(active) {
    return `<div class="chip-row">${Object.keys(P_.BUDGET_SLUGS).map(s => `<a class="chip ${s === active ? 'active' : ''}" href="/b/${s}" onclick="return go(event, '/b/${s}')">${esc(P_.BUDGET_SLUGS[s].label.replace(' байр', ''))}</a>`).join('')}</div>`;
  }

  // Warm the price data in the background so the "Зах зээлээс хямд" toggle and listing
  // badges work without visiting a price page first.
  loadPriceData().then(() => {
    if (priceData.stats.size === 0) return;
    if (typeof renderHomeListings === 'function') renderHomeListings();
    if (typeof applyListingFilter === 'function') applyListingFilter();
    // A listing opened from a direct link before the stats arrived rendered its market
    // panel as "insufficient data" — re-render it now that the server averages are here.
    const m = location.hash.match(/^#listing-(\d+)/);
    if (m && document.getElementById('modal')?.classList.contains('open') && typeof openListing === 'function') openListing(parseInt(m[1], 10));
  });
