  // ===== PHASE 4 — ТУСЛАХ · КОНТЕНТ СТУДИ · ҮЙЛЧИЛГЭЭНИЙ ТӨЛӨВ =====
  // No paid AI/LLM API is connected. Everything below is deterministic and runs only on
  // BairX's own data (listings in memory, complexStats, siteStats) — and every surface says
  // so. When an LLM is approved later, assistantAnswer()/studioGenerate() are the two seams
  // to route through a server-side function (API keys never live in the browser).

  // ---------- integrations: real status, never faked ----------
  // `ready` is computed from actual configuration; nothing here claims a channel works
  // unless the code path that sends it is live.
  function integrationStatus() {
    const vapid = typeof FCM_VAPID_KEY === 'string' && !!FCM_VAPID_KEY;
    return [
      { key: 'search', name: 'Ухаалаг хайлт (дүрэмд суурилсан)', ready: true, need: '—', note: 'Энгийн өгүүлбэрээс төсөв, өрөө, дүүрэг таних. Үнэгүй, ажиллаж байна.' },
      { key: 'assistant', name: 'BairX туслах чат', ready: true, need: '—', note: 'BairX-ийн өгөгдлөөс л хариулна. LLM холбогдоогүй.' },
      { key: 'writer', name: 'Зар бичигч, үнийн тайлбар (загвар)', ready: true, need: '—', note: 'Загварт суурилсан текст. LLM холбогдоогүй.' },
      { key: 'llm', name: 'AI хэлний загвар (LLM)', ready: false, need: 'Төлбөртэй API + Cloud Functions (Blaze)', note: 'API түлхүүрийг зөвхөн серверт хадгална. Таны зөвшөөрөл шаардлагатай.' },
      { key: 'push', name: 'Web Push', ready: false, need: vapid ? 'Cloud Functions (Blaze)' : 'FCM VAPID түлхүүр (үнэгүй) + Cloud Functions (Blaze)', note: 'Илгээгч нь onListingActivated функц.' },
      { key: 'email', name: 'И-мэйл мэдэгдэл', ready: false, need: 'Cloud Functions (Blaze) + "Trigger Email" extension + SMTP', note: '`mail` collection-д дараалалд орно, илгээгч тохируулаагүй.' },
      { key: 'telegram', name: 'Telegram бот', ready: false, need: 'BotFather токен + Cloud Functions (Blaze)', note: 'Токеныг серверийн secret-д хадгална.' },
      { key: 'viber', name: 'Viber мэдэгдэл', ready: false, need: 'Viber Bot/Business Messages (төлбөртэй байж болно) + Functions', note: 'Хэрэглэгчийн зөвшөөрөл шаардлагатай.' },
      { key: 'reels', name: 'AI Reels / видео үүсгэгч', ready: false, need: 'Төлбөртэй видео/AI API', note: 'Одоогоор зөвхөн зураг авалтын төлөвлөгөө (storyboard) текстээр гаргана.' }
    ];
  }

  // ---------- price explanation (rule-based, from server averages) ----------
  function priceExplanation(l) {
    if (!l) return '';
    const P = BairxPricing;
    const ppm = P.listingPpm2(l);
    const st = typeof statsFor === 'function' ? statsFor(l.complexId) : null;
    const avg = typeof usableAvg === 'function' ? usableAvg(st) : null;
    const parts = [];
    if (ppm != null) parts.push(`Энэ зарын 1 м²-ийн үнэ ${ppm.toFixed(2)} сая ₮.`);
    if (avg != null && ppm != null) {
      const d = (ppm - avg) / avg;
      const dir = d < 0 ? 'хямд' : 'үнэтэй';
      parts.push(`${st.name || 'Хотхон'}-ын идэвхтэй ${st.listingCount} зарын дундаж ${avg.toFixed(2)} сая ₮/м² тул энэ зар дунджаас ${Math.abs(Math.round(d * 100))}% ${dir}.`);
      if (d <= -0.15) parts.push('Хотхоны дунджаас 15%+ хямд тул Hot List-д орно. Бичиг баримт, нөхцөлийг заавал шалгаарай.');
      if (st.soldAvgPpm2_12m != null) parts.push(`Сүүлийн 12 сарын бодит хэлцлийн дундаж ${st.soldAvgPpm2_12m.toFixed(2)} сая ₮/м².`);
    } else if (ppm != null) parts.push('Хотхоны дундажтай харьцуулах өгөгдөл хүрэлцээгүй байна.');
    parts.push('Энэ нь ойролцоо тооцоо, мэргэжлийн үнэлгээ биш.');
    return parts.join(' ');
  }

  // ---------- listing text studio (templates) ----------
  const ROOM_WORD = (r) => r ? r + ' өрөө' : '';
  function listingFacts(l) {
    const area = l.areaM2 || l.area;
    return {
      kind: { apartment: 'орон сууц', rent: 'түрээсийн орон сууц', office: 'оффис', house: 'хашаа байшин', land: 'газар' }[l.cat || l.category] || 'үл хөдлөх',
      rooms: ROOM_WORD(l.rooms), area: area ? area + ' м²' : '', floor: l.floor ? l.floor + ' давхар' : '',
      complex: l.complex || '', district: (typeof districtLabel === 'function' ? districtLabel(l.district) : l.district) || '',
      price: l.price ? (typeof fmtMoney === 'function' ? fmtMoney(l.price) : l.price + ' сая ₮') : '',
      features: (l.features || []).slice(0, 6)
    };
  }
  function studioGenerate(l) {
    const f = listingFacts(l);
    const head = [f.complex, f.rooms, f.kind].filter(Boolean).join(' ');
    const where = [f.district, f.complex].filter(Boolean).join(', ');
    const desc = [
      `${where ? where + ' байршилд ' : ''}${[f.rooms, f.area].filter(Boolean).join(', ')} ${f.kind} ${l.cat === 'rent' ? 'түрээслүүлнэ' : 'худалдана'}.`,
      f.floor && `Байрлал: ${f.floor}.`,
      f.features.length && `Онцлог: ${f.features.join(', ')}.`,
      f.price && `Үнэ: ${f.price}.`,
      'Үзлэгт урьдчилан цаг товлоно уу.'
    ].filter(Boolean).join(' ');
    const tags = ['#BairX', '#үлхөдлөх', '#ulaanbaatar', f.complex && '#' + f.complex.replace(/\s+|\(.*?\)/g, ''), f.district && '#' + f.district.replace(/[\s-]+/g, ''), f.rooms && '#' + f.rooms.replace(/\s+/g, '')].filter(Boolean);
    const social = `🏠 ${head}${f.price ? ' — ' + f.price : ''}\n📍 ${where || 'Улаанбаатар'}\n📐 ${[f.area, f.floor].filter(Boolean).join(' · ')}\n${f.features.length ? '✅ ' + f.features.slice(0, 4).join(' · ') + '\n' : ''}👉 bairx.vercel.app/listing/${l.firestoreId || ''}\n${tags.join(' ')}`;
    const reels = [
      `0–3 сек: Гадна талын зураг + "${head}" гарчиг`,
      `3–8 сек: Зочны өрөө (${f.area || 'талбай'})`,
      `8–13 сек: Гал тогоо, унтлагын өрөө${f.rooms ? ' (' + f.rooms + ')' : ''}`,
      `13–18 сек: Цонхны үзэмж / ${f.floor || 'давхар'}`,
      `18–22 сек: Байршил — ${where || 'газрын зураг'}`,
      `22–25 сек: Үнэ ${f.price || ''} + "BairX дээр дэлгэрэнгүй"`
    ].join('\n');
    return { title: head, desc, social, reels, explain: priceExplanation(l) };
  }

  // ---------- BairX assistant (answers ONLY from BairX data) ----------
  function realListings() { return (typeof listings !== 'undefined' ? listings : []).filter(l => !l.isDemo && !l._inactive && l.firestoreId); }
  function linkTo(path, text) { return `<a href="${path}" onclick="return go(event, '${path}')">${text}</a>`; }
  async function assistantAnswer(text) {
    const q = String(text || '').toLowerCase().trim();
    if (!q) return 'Асуултаа бичнэ үү.';
    await loadPriceData();
    // 1) complex price question: a known complex name + an м²/үнэ word
    const cx = complexListOf().find(c => q.includes(c.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim()) && c.name.length > 2);
    if (cx && /(үнэ|м2|м²|дундаж|хэд)/.test(q)) {
      const avg = usableAvg(cx.stats);
      return avg != null ? `<strong>${esc(cx.name)}</strong>: 1 м²-ийн дундаж ${fmtPpm(avg)} (${cx.stats.listingCount} идэвхтэй зар, шинэчилсэн ${esc(cx.stats.updatedDate || '—')}). ${linkTo('/complex/' + encodeURIComponent(cx.id), 'Дэлгэрэнгүй →')}`
        : `<strong>${esc(cx.name)}</strong>-ын 1 м²-ийн дундаж гаргахад өгөгдөл хүрэлцээгүй байна. ${linkTo('/complex/' + encodeURIComponent(cx.id), 'Хотхоны хуудас →')}`;
    }
    if (/үнэл/.test(q)) return `Байрныхаа ойролцоо үнийг ${linkTo('/valuation', 'Байраа үнэлүүлэх')} хуудсанд хотхоны дунджаар тооцоолно.`;
    if (/зээл|хүү|сарын төлбөр/.test(q)) return `Сарын төлбөр, банкны нөхцөлийг ${linkTo('/loan', 'зээлийн тооцоолуур')}-аар харна уу.`;
    if (/агент|даатга|туслаач|хайж өг/.test(q)) return `Хайлтаа ${linkTo('/search-request', 'агентад даатгавал')} тохирох байр гармагц холбогдоно.`;
    if (/хэлцэл|зарагдсан/.test(q)) return `Бодит хэлцлүүдийг ${linkTo('/transactions', 'энд')} харна уу.`;
    if (/хямд|hot/.test(q) && !/\d/.test(q)) {
      const hot = await loadSiteStat('hotlist');
      const items = (hot && hot.items) || [];
      return items.length ? 'Хотхоныхоо дунджаас хамгийн хямд зарууд:<br>' + items.slice(0, 3).map(h => `• ${linkTo('/listing/' + encodeURIComponent(h.listingId), esc(h.complexName) + ', ' + (h.rooms || '?') + ' өрөө — ' + fmtMoney(h.price) + ' (−' + h.discountPct + '%)')}`).join('<br>') + '<br>' + linkTo('/hotlist', 'Бүх хямд зар →')
        : `Одоогоор хотхоны дунджаас 15%+ хямд зар алга. ${linkTo('/alerts', 'Гармагц мэдэгдэл авах →')}`;
    }
    // 2) natural-language search over real listings
    const p = BairxPricing.parseNaturalQuery(q);
    if (p.maxPrice != null || p.minPrice != null || p.rooms != null || p.district || p.kind || p.minArea != null) {
      const res = realListings().filter(l => (p.kind === 'rent' ? l.cat === 'rent' : l.cat !== 'rent')
        && (p.maxPrice == null || l.price <= p.maxPrice) && (p.minPrice == null || l.price >= p.minPrice)
        && (p.rooms == null || BairxPricing.parseRooms(l.rooms) === p.rooms) && (!p.district || l.district === p.district)
        && (p.minArea == null || (l.areaM2 || l.area) >= p.minArea)).sort((a, b) => a.price - b.price);
      const cond = [p.kind === 'rent' && 'түрээс', p.rooms && p.rooms + ' өрөө', p.district && districtLabel(p.district), p.maxPrice != null && fmtMoney(p.maxPrice) + ' хүртэл', p.minPrice != null && fmtMoney(p.minPrice) + '-аас дээш', p.minArea && p.minArea + ' м²+'].filter(Boolean).join(', ');
      if (!res.length) return `"${esc(cond)}" нөхцөлд тохирох идэвхтэй зар одоогоор алга. ${linkTo('/search-request', 'Хайлтаа даатгах')} эсвэл ${linkTo('/alerts', 'мэдэгдэл тохируулах')} боломжтой.`;
      return `"${esc(cond)}" — ${res.length} зар олдлоо:<br>` + res.slice(0, 5).map(l => `• ${linkTo('/listing/' + encodeURIComponent(l.firestoreId), esc(l.title || 'Зар') + ' — ' + fmtMoney(l.price))}`).join('<br>');
    }
    const faq = (typeof FAQ !== 'undefined' ? FAQ : []).find(([qq]) => qq.toLowerCase().split(/\s+/).filter(w => w.length > 4).some(w => q.includes(w.slice(0, 5))));
    if (faq) return `<strong>${esc(faq[0])}</strong><br>${esc(faq[1])}`;
    return 'Би BairX-ийн өгөгдлөөс л хариулдаг туслах. Жишээ нь: "500 сая хүртэл 3 өрөө Хан-Уул", "Зайсан хотхоны м² үнэ", "хямд зар", "зээл".';
  }

  // ---------- floating assistant widget ----------
  function toggleAssistant(open) {
    const box = document.getElementById('bxAssist');
    if (!box) return;
    const willOpen = open == null ? !box.classList.contains('open') : open;
    box.classList.toggle('open', willOpen);
    if (willOpen) setTimeout(() => document.getElementById('bxAssistIn')?.focus(), 50);
  }
  async function sendAssistant(e) {
    if (e) e.preventDefault();
    const inp = document.getElementById('bxAssistIn'), log = document.getElementById('bxAssistLog');
    const text = inp.value.trim(); if (!text) return;
    inp.value = '';
    log.insertAdjacentHTML('beforeend', `<div class="bxa-msg me">${esc(text)}</div>`);
    const ans = await assistantAnswer(text).catch(() => 'Уучлаарай, хариулж чадсангүй.');
    log.insertAdjacentHTML('beforeend', `<div class="bxa-msg bot">${ans}</div>`);
    log.scrollTop = log.scrollHeight;
    if (typeof trackEvent === 'function') trackEvent('search', { channel: 'assistant', page: 'assistant' });
  }
  function mountAssistant() {
    if (document.getElementById('bxAssist')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <button class="bxa-fab" type="button" onclick="toggleAssistant()" aria-label="BairX туслах" aria-controls="bxAssist">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg></button>
      <section class="bxa" id="bxAssist" role="dialog" aria-label="BairX туслах">
        <header><strong>BairX туслах</strong><span class="bxa-badge">AI холбогдоогүй · зөвхөн BairX өгөгдөл</span><button type="button" onclick="toggleAssistant(false)" aria-label="Хаах">×</button></header>
        <div class="bxa-log" id="bxAssistLog" aria-live="polite"><div class="bxa-msg bot">Сайн байна уу! Байр хайх, хотхоны м² үнэ, хямд зар, зээлийн талаар асуугаарай. Жнь: "500 сая хүртэл 3 өрөө Хан-Уул".</div></div>
        <form class="bxa-form" onsubmit="sendAssistant(event)"><input class="form-input" id="bxAssistIn" maxlength="200" placeholder="Асуултаа бичнэ үү…" autocomplete="off"><button class="btn btn-blue" type="submit">Илгээх</button></form>
      </section>`);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAssistant); else mountAssistant();

  // =================== /admin/studio — контент студи (staff) ===================
  registerRoute(/^\/admin\/studio$/, async () => ({
    title: 'Контент студи — BairX', description: 'BairX ажилтны контент студи',
    html: `<div id="studioRoot"></div>`,
    after: renderStudio
  }));
  function renderStudio() {
    const root = document.getElementById('studioRoot');
    if (!root) return;
    if (!currentUser) { root.innerHTML = `<div class="route-page route-narrow"><h1 class="route-title">Нэвтэрнэ үү</h1><button class="btn btn-blue" onclick="openAuth()">Нэвтрэх</button></div>`; return; }
    if (!isStaffUser()) { root.innerHTML = render403(); return; }
    const mine = realListings().slice(0, 300);
    root.innerHTML = `<div class="route-head"><div class="route-eyebrow">Ажилтан</div><h1 class="route-title">Контент студи</h1>
      <p class="route-lead">Зарын тайлбар, сошиал пост, Reels-ийн зураг авалтын төлөвлөгөө, үнийн тайлбарыг BairX-ийн өгөгдлөөс <strong>загвараар</strong> үүсгэнэ. AI хэлний загвар холбогдоогүй.</p></div>
      <div class="crm-panel"><div class="lf-grid">
        <label class="lf-field"><span>Зар сонгох</span><select class="form-input" id="stuSel"><option value="">—</option>${mine.map(l => `<option value="${esc(l.firestoreId)}">${esc((l.title || 'Зар').slice(0, 60))} — ${fmtMoney(l.price)}</option>`).join('')}</select></label>
        <label class="lf-field"><span>эсвэл Firestore ID</span><input class="form-input" id="stuId" maxlength="40"></label></div>
        <button class="btn btn-blue" onclick="studioRun()">Үүсгэх</button></div>
      <div id="stuOut"></div>
      <h2 class="route-h2">Үйлчилгээний төлөв</h2>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Үйлчилгээ</th><th>Төлөв</th><th>Шаардлага</th><th>Тайлбар</th></tr></thead>
        <tbody>${integrationStatus().map(s => `<tr><td>${esc(s.name)}</td><td class="${s.ready ? 'pos' : 'neg'}">${s.ready ? 'Ажиллаж байна' : 'Холбогдоогүй'}</td><td>${esc(s.need)}</td><td>${esc(s.note)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  async function studioRun() {
    const id = (document.getElementById('stuId').value.trim() || document.getElementById('stuSel').value).replace(/[^A-Za-z0-9_-]/g, '');
    const out = document.getElementById('stuOut');
    if (!id) { showToast('Зар сонгоно уу'); return; }
    await loadPriceData();
    let l = listings.find(x => x.firestoreId === id);
    if (!l) { try { const d = await db.collection('listings').doc(id).get(); if (d.exists) l = ingestListingDoc(d); } catch (e) {} }
    if (!l) { out.innerHTML = '<p class="muted-note">Зар олдсонгүй.</p>'; return; }
    const g = studioGenerate(l);
    const block = (title, key, text) => `<div class="crm-panel stu-block"><div class="stu-head"><h3 class="route-h3">${title}</h3><button class="btn btn-ghost" onclick="navigator.clipboard.writeText(document.getElementById('stu_${key}').value).then(()=>showToast('Хуулсан','success'))">Хуулах</button></div><textarea class="form-textarea" id="stu_${key}" rows="${Math.min(10, text.split('\n').length + 2)}">${esc(text)}</textarea></div>`;
    out.innerHTML = block('Зарын тайлбар', 'desc', g.desc) + block('Facebook / Instagram пост', 'social', g.social) + block('Reels — зураг авалтын төлөвлөгөө', 'reels', g.reels) + block('Үнийн тайлбар', 'explain', g.explain)
      + '<p class="muted-note">Загвараар үүсгэсэн текст. Нийтлэхээсээ өмнө уншиж засна уу.</p>';
  }
