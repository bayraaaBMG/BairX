  // ===== MARKET · HOME PRICE SECTIONS · PATH ALIASES · SERVER-READY GATE =====
  // Phase 1 of the platform plan. Everything here only READS server-written figures
  // (complexStats/*, siteStats/*) loaded by complexes.js → loadPriceData()/loadSiteStat().
  // Nothing is ever invented: with no data every block renders an explicit empty state.

  // ---------- Server-ready gate ----------
  // Collections added in Sprint 1–3 (leads, alerts, optoutRequests, pushTokens …) need the
  // new firestore.rules. Until those are deployed, the old rules deny every read of
  // siteStats/*, so one probe read tells us whether forms that write there can work.
  // After the rules deploy the probe succeeds and the forms switch on by themselves.
  let _serverReadyP = null;
  function serverReady() {
    if (_serverReadyP) return _serverReadyP;
    _serverReadyP = db.doc('siteStats/summary').get()
      .then(() => true)
      .catch(e => { if (e && e.code !== 'permission-denied') _serverReadyP = null; return !(e && e.code === 'permission-denied'); });
    return _serverReadyP;
  }
  function serviceClosedHtml() {
    return `<div class="svc-closed" role="status"><strong>Энэ үйлчилгээ тохиргоо хийгдэж байгаа тул түр хаалттай байна.</strong><br>Яаралтай бол <a href="tel:+976${esc(typeof SITE_HOTLINE === 'string' ? SITE_HOTLINE : '')}">утсаар</a> эсвэл <a href="/#resources" onclick="showPage('resources');return false;">холбоо барих</a> хэсгээр хандана уу.</div>`;
  }
  // Use at the top of a submit handler: `if (!(await requireServerReady(formEl))) return;`
  async function requireServerReady(container) {
    if (await serverReady()) return true;
    if (container) {
      if (!(container.previousElementSibling && container.previousElementSibling.classList.contains('svc-closed'))) container.insertAdjacentHTML('beforebegin', serviceClosedHtml());
    }
    else showToast('Энэ үйлчилгээ түр хаалттай байна');
    return false;
  }

  // ---------- Short path aliases for the hash-routed pages ----------
  // /listings, /rent … open the existing sections so links can be shared and refreshed.
  const PATH_ALIASES = {
    '/listings': 'listings', '/sale': 'listings', '/rent': 'rent', '/new-projects': 'newdev',
    '/loan': 'calc', '/compare': 'compare', '/dashboard': 'dashboard', '/admin': 'admin',
    '/favorites': 'dashboard'
  };
  function pathAlias(path) {
    const clean = String(path || '/').split(/[?#]/)[0].replace(/\/+$/, '');
    return PATH_ALIASES[clean] || null;
  }

  // ---------- Building-shaped price chart ("skyline") ----------
  // One building per complex; height ∝ 1 м²-ийн дундаж; sorted high → low. Only complexes
  // whose average passes MIN_LISTINGS (usableAvg) are drawn — no estimated/fake bars.
  function skylineItems(limit) {
    return complexListOf()
      .map(c => ({ c, avg: usableAvg(c.stats) }))
      .filter(x => x.avg != null)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, limit || 40);
  }
  function skylineHtml(items) {
    if (!items.length) {
      return `<div class="home-empty-state sky-empty"><div class="home-empty-title">Үнийн график удахгүй гарна</div>
        <div class="home-empty-sub">Хотхон бүрт ${P_.MIN_LISTINGS}+ давтагдаагүй зар бүртгэгдэхээр 1 м²-ийн дундаж үнэ энд барилга хэлбэрээр харагдана. Бид тоо зохиохгүй.</div></div>`;
    }
    const max = items[0].avg, min = items[items.length - 1].avg;
    const floorPct = 28; // the cheapest building still gets visible height
    return `<div class="sky-scroll" tabindex="0" aria-label="Хотхонуудын 1 м²-ийн дундаж үнэ, үнэтэйгээс хямд руу">
      <div class="sky-row" role="list">${items.map(({ c, avg }, i) => {
        const h = max === min ? 100 : floorPct + (100 - floorPct) * (avg - min) / (max - min);
        const href = '/complex/' + encodeURIComponent(c.id);
        return `<a class="sky-bld" role="listitem" href="${href}" onclick="return go(event, '${href}')" style="--h:${h.toFixed(1)}%;--i:${i}"
            aria-label="${esc(c.name)}: ${fmtPpm(avg)}">
          <span class="sky-label"><span class="sky-price">${(Math.round(avg * 100) / 100).toFixed(2)}</span><span class="sky-name">${esc(c.name)}</span></span>
          <span class="sky-body"><span class="sky-win"></span></span>
          <span class="sky-tip">${esc(c.name)} · ${esc(districtLabel(c.district))}<br>${fmtPpm(avg)} · ${c.stats.listingCount} зар</span>
        </a>`;
      }).join('')}</div></div>
      <div class="sky-legend">Тоо: сая ₮ / м² · ${updatedLine(items[0].c.stats.updatedDate)}</div>`;
  }

  // ---------- Comparison table (also used on /market) ----------
  function compareTableHtml(items) {
    if (!items.length) return '';
    return `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Хотхон</th><th>Дүүрэг</th><th>Зарын 1 м² дундаж</th><th>Хэлцлийн 1 м² (12 сар)</th><th>Зөрүү</th><th>Зар</th><th>Хэлцэл</th></tr></thead>
      <tbody>${items.map(({ c, avg }) => {
        const sold = c.stats.soldAvgPpm2_12m;
        const gap = sold != null && sold > 0 ? (avg - sold) / sold : null;
        const href = '/complex/' + encodeURIComponent(c.id);
        return `<tr><td><a href="${href}" onclick="return go(event, '${href}')">${esc(c.name)}</a></td>
          <td>${esc(districtLabel(c.district))}</td><td>${fmtPpm(avg)}</td>
          <td>${sold != null ? fmtPpm(sold) : insufficient}</td>
          <td>${gap != null ? fmtPct(gap) : '—'}</td>
          <td>${c.stats.listingCount || 0}</td><td>${c.stats.salesCount || 0}</td></tr>`;
      }).join('')}</tbody></table></div>`;
  }

  function districtSummaryHtml(items) {
    if (!items.length) return '';
    const by = new Map();
    for (const x of items) {
      const d = x.c.district || '';
      if (!by.has(d)) by.set(d, []);
      by.get(d).push(x.avg);
    }
    const rows = [...by.entries()].map(([d, arr]) => ({ d, n: arr.length, lo: Math.min(...arr), hi: Math.max(...arr) }))
      .sort((a, b) => b.hi - a.hi);
    return `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Дүүрэг</th><th>Хотхон</th><th>Хамгийн хямд хотхоны дундаж</th><th>Хамгийн үнэтэй хотхоны дундаж</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(districtLabel(r.d) || '—')}</td><td>${r.n}</td><td>${fmtPpm(r.lo)}</td><td>${fmtPpm(r.hi)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  function marketSalesRows(limit) {
    const rows = [];
    for (const c of complexListOf()) for (const s of (c.stats && c.stats.recentSales) || []) rows.push(Object.assign({ name: c.name, id: c.id }, s));
    return rows.sort((a, b) => String(b.month).localeCompare(String(a.month))).slice(0, limit || 8);
  }
  function marketSalesHtml(limit) {
    const rows = marketSalesRows(limit);
    if (!rows.length) return `<div class="home-empty-state"><div class="home-empty-title">Бодит хэлцэл удахгүй нэмэгдэнэ</div><div class="home-empty-sub">Баталгаажсан хэлцэл бүртгэгдэхээр сар, үнэ, талбайгаар (хувийн мэдээлэлгүйгээр) энд харагдана.</div></div>`;
    return `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Сар</th><th>Хотхон</th><th>Өрөө</th><th>Талбай</th><th>Үнэ</th></tr></thead>
      <tbody>${rows.map(s => `<tr><td>${esc(s.month)}</td><td><a href="/complex/${encodeURIComponent(s.id)}" onclick="return go(event, '/complex/${encodeURIComponent(s.id)}')">${esc(s.name)}</a></td>
        <td>${s.rooms || '—'}</td><td>${s.areaM2 ? s.areaM2 + ' м²' : '—'}</td><td>${fmtMoney(s.price)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function hotPreviewHtml(hot) {
    const items = (hot && hot.items) || [];
    if (!items.length) return `<div class="home-empty-state"><div class="home-empty-title">Одоогоор хямд зар алга</div><div class="home-empty-sub">Хотхоныхоо дунджаас 15%+ хямд зар гармагц энд орно.</div><a class="btn btn-blue" href="/alerts" onclick="return go(event, '/alerts')">Гармагц мэдэгдэл авах</a></div>`;
    return `<div class="hot-mini-grid">${items.slice(0, 6).map(h => `<a class="hot-mini" href="/?l=${encodeURIComponent(h.listingId)}" onclick="openListingByFsId('${esc(h.listingId)}');return false;">
      <span class="hot-mini-img">${h.img ? `<img src="${esc(h.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span class="hot-mini-badge">−${h.discountPct}%</span></span>
      <span class="hot-mini-body"><strong>${fmtMoney(h.price)}</strong><span>${esc(h.complexName)} · ${h.rooms || '?'} өрөө · ${h.areaM2 || '?'} м²</span>
      <span class="hot-mini-cmp">${(Math.round(h.pricePerM2 * 100) / 100).toFixed(2)} vs дундаж ${(Math.round(h.complexAvgPpm2 * 100) / 100).toFixed(2)} сая/м²</span></span></a>`).join('')}</div>`;
  }

  const FAQ = [
    ['1 м²-ийн дундаж үнийг яаж тооцдог вэ?', 'Тухайн хотхоны идэвхтэй орон сууцны зарын (үнэ ÷ талбай)-н энгийн дундаж. Давхардсан зарыг нэг гэж тооцож, ' + P_.MIN_LISTINGS + '-аас цөөн зартай хотхонд дундаж харуулахгүй.'],
    ['Hot List-д ямар зар ордог вэ?', 'Зарын 1 м²-ийн үнэ нь хотхоныхоо дунджаас 15% ба түүнээс дээш доогуур идэвхтэй орон сууц. Хямд үнэ нь нөхцөл, бичиг баримттай холбоотой байж болох тул биечлэн шалгаарай.'],
    ['Байрны үнэлгээ хэр найдвартай вэ?', 'Хотхоны дундаж × таны талбай, ±10% хүрээтэй ойролцоо тооцоо. Мэргэжлийн үнэлгээчний дүгнэлт биш.'],
    ['Зарын үнэ болон хэлцлийн үнэ ялгаатай юу?', 'Тийм. Зарын үнэ нь худалдагчийн хүсэж буй үнэ, хэлцлийн үнэ нь бодитоор зарагдсан үнэ. Бид хоёрыг тусад нь тооцож, зөрүүг /market хуудсанд харуулна.'],
    ['Зар оруулах үнэгүй юу?', 'Тийм. Нэвтэрч ороод "Зар нэмэх" дарна. Зар админы шалгалтын дараа нийтлэгдэнэ.'],
    ['Миний мэдээллийг хасуулж болох уу?', 'Болно. /optout хуудсаар хүсэлт илгээнэ үү, 3 ажлын өдөрт шийдвэрлэнэ.']
  ];
  function faqHtml() {
    return `<div class="faq-list">${FAQ.map(([q, a]) => `<details class="faq-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  }

  const sectionHead = (title, linkPath, linkText) => `<div class="portal-section-head portal-section-head-spaced"><div><h2 class="portal-section-title display">${title}</h2></div>${linkPath ? `<a class="btn btn-ghost" href="${linkPath}" onclick="return go(event, '${linkPath}')">${linkText || 'Бүгдийг үзэх'}</a>` : ''}</div>`;

  // ---------- Home page market block ----------
  async function renderHomeMarket() {
    const el = document.getElementById('homeMarket');
    if (!el) return;
    await loadPriceData();
    const [summary, hot] = await Promise.all([loadSiteStat('summary'), loadSiteStat('hotlist')]);
    const items = skylineItems(24);
    const cfg = (typeof rulesV3Ready === 'function' && await rulesV3Ready()) ? await loadSiteConfig('home') : {};
    const sec = (k, html) => (typeof homeSectionOn !== 'function' || homeSectionOn(cfg, k)) ? html : '';
    const stat = (v, label) => `<div class="mk-stat"><strong>${v == null ? '—' : esc(String(v))}</strong><span>${label}</span></div>`;
    el.innerHTML = sec('market', `
      <div class="mk-stats">
        ${stat(summary ? summary.activeListingCount : null, 'идэвхтэй зар')}
        ${stat(summary ? summary.complexCount : (priceData.complexes.size || null), 'хотхон')}
        ${stat(summary ? summary.salesCount : null, 'бүртгэгдсэн хэлцэл')}
        ${stat(summary ? summary.hotCount : null, 'хямд зар')}
      </div>
      ${summary ? '' : '<p class="muted-note mk-note">Статистик сервер дээр өдөр бүр тооцогдоно. Одоогоор тооцоолол хийгдээгүй байна.</p>'}
      ${sectionHead('Хотхоны 1 м²-ийн <em>дундаж үнэ</em>', '/market', 'Зах зээлийн судалгаа')}
      ${skylineHtml(items)}`) + sec('tools', `
      <div class="mk-tools">
        <form class="mk-tool" onsubmit="event.preventDefault();go(null,'/budget?b='+encodeURIComponent(document.getElementById('mkBudget').value||''))">
          <div class="mk-tool-title">Төсвөөрөө хэдэн м² авах вэ?</div>
          <label class="lf-field"><span>Төсөв (сая ₮)</span><input class="form-input" id="mkBudget" type="number" min="10" step="10" placeholder="500"></label>
          <button class="btn btn-blue" type="submit">Тооцоолох</button>
        </form>
        <form class="mk-tool" onsubmit="event.preventDefault();go(null,'/valuation?c='+encodeURIComponent(document.getElementById('mkValCx').value||''))">
          <div class="mk-tool-title">Байраа түргэн үнэлүүлэх</div>
          <label class="lf-field"><span>Хотхон</span><select class="form-input" id="mkValCx"><option value="">Сонгох…</option>${items.slice().sort((a, b) => a.c.name.localeCompare(b.c.name)).map(x => `<option value="${esc(x.c.id)}">${esc(x.c.name)}</option>`).join('')}</select></label>
          <button class="btn btn-blue" type="submit">Үнэлгээ харах</button>
        </form>
        <div class="mk-tool">
          <div class="mk-tool-title">Хямд байр гармагц мэдэгдэл авах</div>
          <p class="muted-note">Төсөв, хотхон, өрөөгөө сонгоод шинэ тохирох зар гармагц мэдэгдэл аваарай.</p>
          <a class="btn btn-blue" href="/alerts" onclick="return go(event, '/alerts')">Мэдэгдэл тохируулах</a>
        </div>
      </div>`) + sec('hot', `
      ${sectionHead('Hot List — <em>дунджаас 15%+ хямд</em>', '/hotlist')}
      ${hotPreviewHtml(hot)}`) + sec('sales', `
      ${sectionHead('Саяхан хаасан <em>бодит хэлцлүүд</em>', '/growth', 'Үнийн өсөлт')}
      ${marketSalesHtml(6)}`) + sec('compare', items.length ? sectionHead('Хотхонуудын <em>харьцуулалт</em>', '/complexes', 'Бүх хотхон') + compareTableHtml(items.slice(0, 10)) : '');
    const faq = document.getElementById('homeFaq');
    if (faq) faq.innerHTML = sec('faq', sectionHead('Түгээмэл <em>асуултууд</em>') + faqHtml());
  }

  // ---------- /market ----------
  registerRoute(/^\/market$/, async () => {
    await loadPriceData();
    const summary = await loadSiteStat('summary');
    const items = skylineItems(200);
    return {
      title: 'Зах зээлийн судалгаа — хотхоны 1 м²-ийн үнэ | BairX',
      description: 'Улаанбаатарын хотхонуудын 1 м²-ийн дундаж үнэ, зарын болон бодит хэлцлийн үнийн зөрүү, дүүргээр харьцуулалт.',
      html: `<div class="route-head">
        <div class="route-eyebrow">Зах зээлийн судалгаа</div>
        <h1 class="route-title">Орон сууцны зах зээл</h1>
        <p class="route-lead">${items.length ? items.length + ' хотхоны 1 м²-ийн дундаж үнэ, үнэтэйгээс хямд руу.' : 'Хангалттай өгөгдөлтэй хотхон бүртгэгдэхээр энд судалгаа гарна.'} ${updatedLine(summary && summary.updatedDate)}</p>
      </div>
      ${skylineHtml(items)}
      ${items.length ? `<h2 class="route-h2">Дүүргээр</h2>${districtSummaryHtml(items)}
        <h2 class="route-h2">Хотхон бүрээр: зарын үнэ ба бодит хэлцлийн үнэ</h2>${compareTableHtml(items)}` : ''}
      <h2 class="route-h2">Саяхны бодит хэлцлүүд</h2>${marketSalesHtml(20)}
      ${methodNote('avg')}
      <div class="method-note"><strong>Зөрүү</strong> = (зарын 1 м² дундаж − сүүлийн 12 сарын хэлцлийн 1 м² дундаж) ÷ хэлцлийн дундаж. Хэлцэл ${P_.MIN_SALES}-аас цөөн бол тооцохгүй. Дүүргийн мөрөнд тухайн дүүргийн хотхонуудын дунджийн хамгийн бага, их утгыг харуулна.</div>`
    };
  });
