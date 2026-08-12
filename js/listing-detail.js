  // ===== MODAL: LISTING DETAIL =====
  // Дүүргийн бодит жилийн дундаж өсөлт (2020-2025 он, мэргэжлийн үнэлгээгээр)
  const districtGrowth = {
    'khan-uul': { yearly: 7.2, label: 'Хан-Уул', note: 'Зайсан, Яармаг хамгийн өсөлттэй бүс' },
    'sukhbaatar': { yearly: 5.8, label: 'Сүхбаатар', note: 'Төв бүс — тогтвортой эрэлттэй' },
    'chingeltei': { yearly: 4.5, label: 'Чингэлтэй', note: 'Дунд зэргийн өсөлт, эрэлт сайн' },
    'bayanzurkh': { yearly: 4.2, label: 'Баянзүрх', note: 'Шинэ хороолол хөгжиж буй' },
    'bayangol': { yearly: 4.0, label: 'Баянгол', note: 'Тогтвортой бүс' },
    'songinokhairkhan': { yearly: 3.5, label: 'СХД', note: 'Хямд үнэ, дунд өсөлт' },
    'nalaikh': { yearly: 9.5, label: 'Налайх', note: 'Хотын ойролцоо хөгжиж буй' }
  };

  function openListing(id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    // View count: bump locally right away, best-effort sync to Firestore for real listings
    l.viewCount = (l.viewCount || 0) + 1;
    if (l.firestoreId) {
      db.collection('listings').doc(l.firestoreId).update({ viewCount: firebase.firestore.FieldValue.increment(1) }).catch(() => {});
    }
    // Compute the monthly mortgage payment live from the loan type's stated annual rate
    // (30% down, 20yr term — same amortization formula as the /#calc page) instead of trusting
    // a hand-typed per-listing number, which for real user-submitted listings was always 0.
    const loanRateMatch = (l.loanType || '').match(/(\d+(\.\d+)?)\s*%/);
    const loanRate = loanRateMatch ? parseFloat(loanRateMatch[1]) : null;
    let monthly;
    if (loanRate !== null && typeof l.price === 'number') {
      const loanAmt = (l.price * 0.7) * 1000000;
      const r = loanRate / 100 / 12, n = 240;
      const m = (loanAmt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      monthly = (m / 1000000).toFixed(2) + ' сая ₮';
    } else if (typeof l.monthly === 'string') {
      monthly = l.monthly; // land listings show an appreciation estimate instead, e.g. "+18% / 5 жил"
    } else {
      monthly = null; // negotiable rate — no honest number to show
    }
    const growth = districtGrowth[l.district] || { yearly: 5.0, label: 'Дүүрэг', note: '' };

    // Бодит compound growth тооцоолол
    const g5 = Math.round(l.price * (Math.pow(1 + growth.yearly/100, 5) - 1));
    const g10 = Math.round(l.price * (Math.pow(1 + growth.yearly/100, 10) - 1));
    const g20 = Math.round(l.price * (Math.pow(1 + growth.yearly/100, 20) - 1));

    // ===== ҮНИЙН ТҮҮХ (өнгөрсөн 6 жил) =====
    // Одоогийн үнээс ухарч өнгөрсөн жилүүдийн үнийг тооцоолно (бага зэрэг хэлбэлзэлтэйгээр)
    const priceHistory = [];
    const wobble = [0, -0.4, 0.6, -0.3, 0.5, 0]; // бодит зах зээлийн жижиг хэлбэлзэл
    for (let i = 5; i >= 0; i--) {
      const yearsAgo = i;
      let pastPrice = l.price / Math.pow(1 + growth.yearly/100, yearsAgo);
      pastPrice = pastPrice * (1 + (wobble[5-i] || 0)/100 * yearsAgo);
      priceHistory.push({ year: 2026 - yearsAgo, price: pastPrice });
    }
    priceHistory[priceHistory.length - 1].price = l.price; // одоогийн үнэ яг таарна

    const histMin = Math.min(...priceHistory.map(p => p.price));
    const histMax = Math.max(...priceHistory.map(p => p.price));
    const histRange = histMax - histMin || 1;
    const chartW = 480, chartH = 140, padL = 10, padR = 10, padT = 10, padB = 24;
    const plotW = chartW - padL - padR;
    const plotH = chartH - padT - padB;
    const points = priceHistory.map((p, i) => {
      const x = padL + (i / (priceHistory.length - 1)) * plotW;
      const y = padT + (1 - (p.price - histMin) / histRange) * plotH;
      return { x, y, ...p };
    });
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length-1].x.toFixed(1)} ${(padT+plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT+plotH).toFixed(1)} Z`;
    const totalGrowthPct = ((l.price - priceHistory[0].price) / priceHistory[0].price * 100);

    const priceHistoryHtml = `
      <div class="modal-section">
        <h4>Үнийн түүх (сүүлийн 6 жил)</h4>
        <div style="background:var(--paper-2); border-radius:14px; padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:14px;">
            <div>
              <div style="font-size:12px; color:var(--ink-3); font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">2020 → 2026 өсөлт</div>
              <div style="font-family:'Fraunces',serif; font-size:24px; font-weight:700; color:${totalGrowthPct >= 0 ? '#009878' : 'var(--danger)'};">
                ${totalGrowthPct >= 0 ? '+' : ''}${totalGrowthPct.toFixed(0)}%
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; color:var(--ink-3);">Жилийн дундаж</div>
              <div style="font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:700; color:var(--primary);">${growth.yearly}% / жил</div>
            </div>
          </div>
          <svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%; height:auto;" preserveAspectRatio="none">
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1E5BFF" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#1E5BFF" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="${areaPath}" fill="url(#histGrad)"/>
            <path d="${linePath}" stroke="#1E5BFF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${points.map((p, i) => `
              <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === points.length-1 ? 5 : 3}" fill="${i === points.length-1 ? '#1E5BFF' : 'white'}" stroke="#1E5BFF" stroke-width="2"/>
              <text x="${p.x.toFixed(1)}" y="${chartH - 6}" font-size="10" fill="var(--ink-3)" text-anchor="middle" font-family="JetBrains Mono, monospace">${p.year}</text>
            `).join('')}
            <text x="${points[points.length-1].x.toFixed(1)}" y="${(points[points.length-1].y - 12).toFixed(1)}" font-size="11" fill="#1E5BFF" text-anchor="end" font-weight="700" font-family="Manrope">${l.price >= 1000 ? (l.price/1000).toFixed(1)+'тэр' : l.price+'сая'}</text>
          </svg>
          <div style="font-size:11px; color:var(--ink-3); margin-top:8px; font-style:italic;">* ${growth.label} дүүргийн зах зээлийн дундаж хандлагад суурилсан тооцоолол. Тухайн байрны бодит түүх ялгаатай байж болно.</div>
        </div>
      </div>
    `;

    // AI Property Valuation — реал comparable-sales тооцоолол (computeValuation() —
    // utils.js). Демо тоо биш: платформ дээрх бодит зарууд дундаас адилавтар зар хайж,
    // тэдгээрийн дундаж ₮/м²-тэй харьцуулна. Хангалттай харьцуулах зар олдоогvй бол
    // тодорхой "мэдээлэл хvрэлцэхгvй" гэдгийг харуулна — тоо зохиохгvй.
    const valuation = computeValuation(l);
    let aiVerdict, aiColor, aiReasoning, aiConfidenceLabel, aiConfidenceColor, aiBasisLine;

    if (!valuation.available) {
      aiVerdict = 'Мэдээлэл хүрэлцэхгүй';
      aiColor = 'var(--ink-3)';
      aiConfidenceLabel = null;
      aiBasisLine = valuation.sampleSize
        ? `Одоогоор ${valuation.sampleSize} харьцуулах зар олдсон — найдвартай тооцоолол хийхэд хамгийн багадаа 2 хэрэгтэй.`
        : 'BairX дээр энэ төрлийн харьцуулах зар одоогоор алга.';
      aiReasoning = `Энэ байртай харьцуулах хангалттай зар платформ дээр олдсонгүй тул үнийг зах зээлтэй бодитоор харьцуулж чадахгүй байна. Дэлгэц дээрх тоо зохиомол биш — зөвхөн бодит харьцуулах зар байхгvй тул тооцоолол хийхгvй байна. Илvv олон жинхэнэ зар нэмэгдэх тусам энэ тооцоолол ажиллаж эхэлнэ.`;
    } else {
      aiVerdict = valuation.verdict;
      aiColor = valuation.color;
      const confMap = { high: ['Өндөр итгэмжтэй', '#009878'], medium: ['Дунд итгэмжтэй', '#C77700'], low: ['Бага итгэмжтэй', '#FF4757'] };
      [aiConfidenceLabel, aiConfidenceColor] = confMap[valuation.confidence];
      aiBasisLine = `${valuation.basisText} харьцуулав. Зах зээлийн дундаж ${fmt(valuation.marketPerSqm)}₮/м² (энэ байр ${fmt(valuation.subjectPerSqm)}₮/м², ${valuation.diffPct >= 0 ? '+' : ''}${(valuation.diffPct * 100).toFixed(0)}%).`;

      if (valuation.verdict === 'Сонирхолтой санал') {
        aiReasoning = `Харьцуулсан зарын дунджаас доогуур үнэтэй. Гэхдээ <strong>тэр болгон сайн биш</strong>. Дараах зүйлсийг шалгана уу: (1) Барьцаатай эсэх — бэлэн мөнгөөр шилжүүлэх боломжтой эсэх. (2) Эзэмшлийн гэрчилгээний хуулбар. (3) Барилгын чанарын баримт. (4) Хороогоор шалгаж үзэх. Хэрэв эдгээр нь шалгагдаж байвал зах зээлд орох сайн боломж.`;
      } else if (valuation.verdict === 'Зах зээлээс дээгүүр') {
        aiReasoning = `Харьцуулсан зарын дунджаас дээгүүр үнэтэй. Premium байршил, чанар, аль нэг онцлогоос болсон байж болзошгүй. <strong>Үнэ хэлэлцэх боломжтой эсэхийг ярилц</strong>. Эсвэл агентаас "яагаад илүү үнэтэй вэ?" гэдгийг тодорхой тайлбарлуулж аваарай.`;
      } else {
        aiReasoning = `Үнэ харьцуулсан зарын дунд түвшинд. Энэ бол ердийн сонголт — найдвартай ч давуу талгүй. Бусад заруудтай харьцуулж, заавал биечлэн очиж үзэж, чанар нь үнэдээ таарч буй эсэхийг шалгаарай.`;
      }
      if (valuation.confidence === 'low') {
        aiReasoning += ` <strong style="color:#C77700;">Анхаар:</strong> харьцуулах зар цөөн тул энэ дvгнэлт өндөр тодорхойгүй байдалтай — зөвхөн ерөнхий чиг баримжаа болгож vзнэ vv.`;
      }
    }

    // Тогтвортой байдлын үнэлгээ
    const stability = [];
    if (l.collateral && l.collateral.includes('Барьцаагүй')) stability.push({ ok: true, text: 'Барьцаагүй — нэн даруй шилжүүлэх боломжтой' });
    else if (l.collateral && l.collateral.includes('барьцаатай')) stability.push({ ok: false, text: 'Барьцаатай — шилжүүлэхэд 7-30 хоног шаардлагатай' });
    if (l.taxDebt && l.taxDebt.includes('өргүй')) stability.push({ ok: true, text: 'Татварын өргүй' });
    if (l.cadastre && l.cadastre.includes('шалгасан')) stability.push({ ok: true, text: 'Кадастрын мэдээлэл шалгасан' });
    else if (l.cadastre && l.cadastre.includes('гарч буй')) stability.push({ ok: false, text: 'Кадастр албажиж гарах хүлээгдэж буй' });

    // Build inline carousel
    const extras = listingExtras[l.id];
    mcImages = (extras?.gallery?.length ? extras.gallery : [l.img]);
    mcIdx = 0;
    mcListingId = l.id;

    // Similar listings (same cat + district, closest price, max 3)
    const similar = listings.filter(x => x.id !== l.id && x.cat === l.cat && x.district === l.district)
      .sort((a, b) => Math.abs(a.price - l.price) - Math.abs(b.price - l.price))
      .slice(0, 3);

    // Seller data from lookup table (deterministic, no Math.random)
    const seller = sellerData[l.id] || { phone: '9911-2233', name: 'Баталгаажсан Агент', type: 'Агент' };
    const sellerName = seller.name;
    const sellerLetter = sellerName[0] || 'А';
    const ownerOtherListings = l.userSubmitted && l.ownerId ? listings.filter(x => x.ownerId === l.ownerId && !x._inactive) : null;
    const totalListings = ownerOtherListings ? ownerOtherListings.length : 3 + (l.id % 12);
    const responseTime = l.id % 2 === 0 ? '10 минут' : '30 минут';
    const memberSince = l.userSubmitted ? new Date().getFullYear() : 2020 + (l.id % 5);
    // Only real accounts with an email-verified owner earn the verified badge — demo listings are pre-vetted
    const isVerified = l.userSubmitted ? !!l.sellerVerified : true;
    const sellerClickable = !!ownerOtherListings;

    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <button class="modal-share-btn" onclick="shareListingModal(${l.id}, '${esc(l.title)}')" title="Хуваалцах">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>

      <!-- INLINE GALLERY CAROUSEL -->
      <div class="mc-wrap">
        <div class="mc-main">
          <img id="mcMainImg" src="${esc(mcImages[0])}" alt="${esc(l.title)}" style="transition:opacity 0.22s;" />
          <span class="mc-counter" id="mcCounter">1 / ${mcImages.length}</span>
          ${mcImages.length > 1 ? `
          <button class="mc-nav prev" onclick="mcPrev()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="mc-nav next" onclick="mcNext()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>` : ''}
          <button class="mc-expand" onclick="openGallery(${l.id})" title="Том хэмжээгээр харах">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        </div>
        ${mcImages.length > 1 ? `
        <div class="mc-thumbs">
          ${mcImages.map((img, i) => `<img class="mc-thumb ${i===0?'active':''}" src="${esc(img)}" onclick="mcGoto(${i})" alt="" />`).join('')}
        </div>` : ''}
      </div>

      <div class="modal-body">
        ${!l.userSubmitted ? '<span class="badge demo" style="position:static;display:inline-block;margin-bottom:8px;">Жишээ зар</span>' : ''}
        <h2 class="modal-title">${esc(l.title)}</h2>
        <div class="modal-loc">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${esc(l.loc)}
          <span style="margin-left:10px;color:var(--ink-3);font-size:12px;display:inline-flex;align-items:center;gap:3px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ${l.viewCount || 1} үзсэн
          </span>
        </div>
        <div class="modal-price-row">
          <div>
            <div class="modal-price">${fmtPrice(l.price)}</div>
            <div style="font-size:13px; color:var(--ink-3); margin-top:4px;">${pricePerSqmText(l)}</div>
          </div>
          <span class="price-tag ${l.tag.type === 'normal' ? '' : l.tag.type}">${l.tag.text}</span>
        </div>
        <div class="modal-info-grid">
          <div class="info-card">
            <div class="info-card-label">Талбай</div>
            <div class="info-card-value">${l.area} м²</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Өрөө/Зэрэг</div>
            <div class="info-card-value">${l.rooms}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Давхар</div>
            <div class="info-card-value">${l.floor}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Он/Төлөв</div>
            <div class="info-card-value">${l.year}</div>
          </div>
          ${l.bedrooms ? `
          <div class="info-card">
            <div class="info-card-label">Унтлагын өрөө</div>
            <div class="info-card-value">${l.bedrooms}</div>
          </div>
          ` : ''}
          ${l.bathrooms ? `
          <div class="info-card">
            <div class="info-card-label">Ариун цэврийн өрөө</div>
            <div class="info-card-value">${l.bathrooms}</div>
          </div>
          ` : ''}
        </div>

        <!-- SELLER CARD -->
        <div class="modal-section">
          <div class="seller-card">
            <div class="seller-av" ${sellerClickable ? `onclick="openSellerProfile('${l.ownerId}', '${esc(sellerName)}')" style="cursor:pointer;"` : ''}>${sellerLetter}</div>
            <div class="seller-info">
              <div class="seller-name" ${sellerClickable ? `onclick="openSellerProfile('${l.ownerId}', '${esc(sellerName)}')" style="cursor:pointer;"` : ''}>
                ${esc(sellerName)}
                ${isVerified ? '<span class="seller-verified">✓ Баталгаажсан</span>' : ''}
              </div>
              <div class="seller-meta">${esc(seller.type)}</div>
              <div class="seller-stats">
                <span ${sellerClickable ? `onclick="openSellerProfile('${l.ownerId}', '${esc(sellerName)}')" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px;"` : ''}><b>${totalListings} зар</b></span>
                <span>Хариу: <b>${responseTime}</b></span>
                <span>Гишүүн: <b>${memberSince} оноос</b></span>
              </div>
            </div>
            <button class="btn btn-ghost" onclick="revealPhone('${l.id}', '${seller.phone}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.39 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23 18l-.08-1.08z"/></svg>
              Залгах
            </button>
          </div>
        </div>

        <!-- БАРИЛГЫН МЭРГЭЖЛИЙН МЭДЭЭЛЭЛ -->
        <div class="modal-section">
          <h4>Барилгын мэргэжлийн мэдээлэл</h4>
          <div class="prof-info-list">
            ${l.buildingName ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Барилгын нэр</div>
              <div class="prof-info-value">${esc(l.buildingName)}</div>
            </div>
            ` : ''}
            ${l.complex ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Хотхон</div>
              <div class="prof-info-value">${esc(l.complex)}</div>
            </div>
            ` : ''}
            <div class="prof-info-row">
              <div class="prof-info-label">Барилгын төрөл</div>
              <div class="prof-info-value">${l.buildingType || '—'}</div>
            </div>
            <div class="prof-info-row">
              <div class="prof-info-label">Дулаалга</div>
              <div class="prof-info-value">${l.insulation || '—'}</div>
            </div>
            <div class="prof-info-row">
              <div class="prof-info-label">Халаалт</div>
              <div class="prof-info-value">${l.heating || '—'}</div>
            </div>
            ${l.windowDirection ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Цонхны чиглэл</div>
              <div class="prof-info-value">${l.windowDirection}</div>
            </div>
            ` : ''}
            <div class="prof-info-row">
              <div class="prof-info-label">Паркинг</div>
              <div class="prof-info-value">${l.parking || '—'}</div>
            </div>
            <div class="prof-info-row">
              <div class="prof-info-label">Лифт</div>
              <div class="prof-info-value">${l.elevator || '—'}</div>
            </div>
            ${l.balcony ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Тагт</div>
              <div class="prof-info-value">${l.balcony}</div>
            </div>
            ` : ''}
            ${l.basement ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Зоорь</div>
              <div class="prof-info-value">${l.basement}</div>
            </div>
            ` : ''}
            ${l.furniture ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Тавилга</div>
              <div class="prof-info-value">${l.furniture}</div>
            </div>
            ` : ''}
            <div class="prof-info-row">
              <div class="prof-info-label">Засвар/Төлөв</div>
              <div class="prof-info-value">${l.condition || '—'}</div>
            </div>
            ${l.hoaFee ? `
            <div class="prof-info-row">
              <div class="prof-info-label">СӨХ-ийн төлбөр</div>
              <div class="prof-info-value">${fmt(l.hoaFee)} ₮/сар</div>
            </div>
            ` : ''}
            ${l.deposit ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Барьцаа/Урьдчилгаа</div>
              <div class="prof-info-value">${l.deposit} сая ₮</div>
            </div>
            ` : ''}
            ${l.minTerm ? `
            <div class="prof-info-row">
              <div class="prof-info-label">Хамгийн бага хугацаа</div>
              <div class="prof-info-value">${l.minTerm}</div>
            </div>
            ` : ''}
            <div class="prof-info-row highlight">
              <div class="prof-info-label">Нийтийн зардал</div>
              <div class="prof-info-value">${l.utilityCost || '—'}</div>
            </div>
          </div>
        </div>

        <!-- ЭРХ ЗҮЙН СТАТУС -->
        <div class="modal-section">
          <h4>Эрх зүйн статус ба баримт бичиг</h4>
          <div class="legal-grid">
            <div class="legal-item">
              <div class="legal-label">Эзэмшлийн хэлбэр</div>
              <div class="legal-value">${l.ownership || '—'}</div>
            </div>
            <div class="legal-item">
              <div class="legal-label">Кадастр</div>
              <div class="legal-value">${l.cadastre || '—'}</div>
            </div>
            <div class="legal-item ${l.collateral && l.collateral.includes('Барьцаагүй') ? 'ok' : 'warn'}">
              <div class="legal-label">Барьцааны байдал</div>
              <div class="legal-value">${l.collateral || '—'}</div>
            </div>
            <div class="legal-item ${l.taxDebt && l.taxDebt.includes('өргүй') ? 'ok' : 'warn'}">
              <div class="legal-label">Татвар</div>
              <div class="legal-value">${l.taxDebt || '—'}</div>
            </div>
          </div>
          <div class="legal-notes">
            <div class="legal-notes-label">Нэмэлт тэмдэглэл</div>
            <div class="legal-notes-text">${esc(l.legalNotes) || '—'}</div>
          </div>
        </div>

        <!-- БАЙРШИЛ -->
        <div class="modal-section">
          <h4>Байршил</h4>
          <div style="border-radius:14px;overflow:hidden;border:1px solid var(--line);">
            ${(l.geoLat && l.geoLng) ? `
            <div id="listingDetailMap" style="width:100%;height:220px;"></div>
            ` : `
            <iframe
              width="100%" height="220" style="border:0;display:block;"
              loading="lazy" referrerpolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=${encodeURIComponent(l.loc + ', ' + growth.label + ' дүүрэг, Улаанбаатар, Монгол улс')}&output=embed">
            </iframe>
            `}
          </div>
          <div style="font-size:13px;color:var(--ink-2);margin-top:8px;display:flex;align-items:center;gap:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${esc(l.loc)}
          </div>
        </div>

        <!-- ЗЭЭЛИЙН САНАЛ -->
        ${l.cat !== 'rent' ? `
        <div class="modal-section">
          <h4>Зээлийн санал (зах зээлийн одоогийн хүү)</h4>
          <div style="background:var(--primary-soft); padding:18px; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="font-size:13px; color:var(--primary-deep); font-weight:600;">${esc(l.loanType)}${monthly ? ', сар бүр' : ''}</div>
              ${monthly ? `<div style="font-family:'Fraunces', serif; font-size:22px; font-weight:700; color:var(--primary-deep);">${monthly}</div>` : ''}
            </div>
            <div style="font-size:12px; color:var(--primary-deep); opacity:0.8;">${loanRate !== null ? `Урьдчилгаа 30% (${Math.round(l.price * 0.3)} сая ₮), хугацаа 20 жил. ${loanRate}% жилийн хүүгээр сар бүрийн тооцоолол — бодит нөхцөл банк, зээлдэгчээс хамаарч хэлбэлзэнэ.` : 'Зээлийн нөхцөлийг зарын эзэн/банктай шууд тохиролцоно уу.'}</div>
          </div>
        </div>
        ` : ''}

        ${priceHistoryHtml}

        <!-- ХӨРӨНГӨ ОРУУЛАЛТЫН АНАЛИЗ -->
        <div class="modal-section">
          <h4>Хөрөнгийн өсөлтийн тооцоолол</h4>
          <div style="font-size:13px; color:var(--ink-3); margin-bottom:14px; padding:10px 14px; background:var(--paper-2); border-radius:8px;">
            <strong>${growth.label}</strong> дүүргийн сүүлийн 5 жилийн жилийн дундаж өсөлт: <strong style="color:var(--primary);">${growth.yearly}%</strong>. ${growth.note}.
          </div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
            <div style="padding:14px; background:rgba(0, 212, 170, 0.1); border-radius:10px;">
              <div style="font-size:11px; color:#009878; font-weight:700; text-transform:uppercase; margin-bottom:4px;">5 жилд</div>
              <div style="font-weight:700; color:#009878; font-size:18px;">+${g5} сая ₮</div>
              <div style="font-size:11px; color:#009878; margin-top:2px; opacity:0.8;">~${(g5/l.price*100).toFixed(0)}% өгөөж</div>
            </div>
            <div style="padding:14px; background:rgba(0, 212, 170, 0.15); border-radius:10px;">
              <div style="font-size:11px; color:#009878; font-weight:700; text-transform:uppercase; margin-bottom:4px;">10 жилд</div>
              <div style="font-weight:700; color:#009878; font-size:18px;">+${g10} сая ₮</div>
              <div style="font-size:11px; color:#009878; margin-top:2px; opacity:0.8;">~${(g10/l.price*100).toFixed(0)}% өгөөж</div>
            </div>
            <div style="padding:14px; background:rgba(0, 212, 170, 0.2); border-radius:10px;">
              <div style="font-size:11px; color:#009878; font-weight:700; text-transform:uppercase; margin-bottom:4px;">20 жилд</div>
              <div style="font-weight:700; color:#009878; font-size:18px;">+${g20} сая ₮</div>
              <div style="font-size:11px; color:#009878; margin-top:2px; opacity:0.8;">~${(g20/l.price*100).toFixed(0)}% өгөөж</div>
            </div>
          </div>
          <div style="font-size:11px; color:var(--ink-3); margin-top:10px; font-style:italic;">* Дээрх тооцоолол нь өнгөрсөн жилүүдийн дунджид суурилсан, ирээдүйн өсөлтийг баталгаажуулахгүй. Инфляц, эдийн засгийн нөхцөл байдлаас хамаарч өөрчлөгдөж болно.</div>
        </div>

        <!-- AI PROPERTY VALUATION -->
        <div class="modal-section">
          <h4>AI үнэлгээ — зах зээлтэй харьцуулалт</h4>
          <div style="padding:18px; background:var(--paper-2); border-radius:14px;">
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
              <div style="padding:6px 12px; background:${aiColor}; color:white; border-radius:100px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">${aiVerdict}</div>
              ${aiConfidenceLabel ? `<div style="padding:6px 12px; background:${aiConfidenceColor}22; color:${aiConfidenceColor}; border-radius:100px; font-size:11px; font-weight:700;">${aiConfidenceLabel}</div>` : ''}
            </div>
            <div style="font-size:12.5px; color:var(--ink-3); margin-bottom:10px; font-family:'JetBrains Mono',monospace;">${aiBasisLine}</div>
            <div style="font-size:14px; line-height:1.65; color:var(--ink-2);">${aiReasoning}</div>
            <div style="font-size:11px; color:var(--ink-3); margin-top:12px; font-style:italic;">* Дүрэм-суурьтай тооцоолол — BairX дээрх бодит зарын дунджид vндэслэсэн, машин сургалт (ML) ашигладаггvй. Тоо зохиомол бишээ, зөвхөн одоо байгаа бодит зар дээр тулгуурлана.</div>

            ${stability.length > 0 ? `
            <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--line);">
              <div style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--ink-3); margin-bottom:10px;">Шалгасан үзүүлэлтүүд</div>
              ${stability.map(s => `
                <div class="stability-item ${s.ok ? 'ok' : 'warn'}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    ${s.ok ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>'}
                  </svg>
                  <span>${s.text}</span>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
        </div>

        <!-- ШАЛГАХ ЁСТОЙ ЗҮЙЛС -->
        <div class="modal-section">
          <h4>Худалдан авахаасаа өмнө шалгах зүйлс</h4>
          <ol class="check-required">
            <li>Эзэмшлийн гэрчилгээний эх хувийг харж, ХҮ-н нэртэй таарч буй эсэхийг шалгана</li>
            <li>Шилжүүлэхэд хорьдох барьцаа, татвар, мөрдөн байцаалт байгаа эсэх</li>
            <li>Дотор үзлэг хийж — хана, шал, дээвэр, шугам сүлжээний байдлыг харна</li>
            <li>Хороогоор очиж — өвлийн дулаалга, чимээ, хөршүүдийн талаар асууна</li>
            <li>Кадастрын зургаар талбайн хэмжээ нь баримтын мэдээлэлтэй таарч буй эсэх</li>
            <li>Сүүлийн 12 сарын нийтийн төлбөрийн квитанц харж бодит зардал тооцно</li>
          </ol>
        </div>

        <!-- ХОЛБОО БАРИХ -->
        <div class="modal-section">
          <h4>Холбоо барих</h4>
          <div id="contactBox_${l.id}" style="background:var(--paper-2);border-radius:14px;padding:18px;text-align:center;">
            <div style="font-size:13px;color:var(--ink-3);margin-bottom:12px;">Эзэн/Агентийн утасны дугаарыг харахдаа дарна уу</div>
            <button class="btn btn-blue btn-lg" style="width:100%;justify-content:center;" onclick="revealPhone('${l.id}', '${seller.phone}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.39 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23 18l-.08-1.08z"/></svg>
              Дугаар харах
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary btn-lg" onclick="openListingChat(${l.id}, '${esc(l.title)}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Чат бичих
          </button>
          <button class="btn btn-blue btn-lg" onclick="showToast('Зээлийн хүсэлт илгээгдлээ', 'success'); closeModal()">
            Зээл авах
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- MOBILE STICKY CALL BAR (hidden on desktop via CSS) -->
        <div class="mobile-sticky-call">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;">
            <button class="btn btn-blue btn-lg" style="justify-content:center;" onclick="revealPhone('${l.id}', '${seller.phone}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.39 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23 18l-.08-1.08z"/></svg>
              Залгах
            </button>
            <button class="btn btn-primary btn-lg" style="justify-content:center;" onclick="openListingChat(${l.id}, '${esc(l.title)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Чат
            </button>
          </div>
        </div>

        ${similar.length > 0 ? `
        <!-- ИЖИЛ ТӨСТЭЙ ЗАРУУД -->
        <div class="modal-section">
          <h4>Ижил төстэй зарууд</h4>
          <div class="similar-grid">
            ${similar.map(s => `
              <div style="cursor:pointer;border-radius:12px;overflow:hidden;border:1.5px solid var(--line);transition:box-shadow 0.15s;" onclick="closeModal(); setTimeout(()=>openListing(${s.id}),200)">
                <img src="${esc(s.img)}" alt="${esc(s.title)}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block;" onerror="this.style.background='var(--paper-2)';this.style.display='none';" />
                <div style="padding:10px 12px;">
                  <div style="font-weight:700;font-size:13px;color:var(--primary);font-family:'Fraunces',serif;">${fmtPrice(s.price)}</div>
                  <div style="font-size:12px;color:var(--ink-2);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.title)}</div>
                  <div style="font-size:11px;color:var(--ink-3);margin-top:2px;">${s.area} м² · ${s.rooms} өрөө</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- REPORT LINK -->
        <div style="text-align:center;padding:16px 0 8px;">
          <button onclick="reportListing(${l.id})" style="background:none;border:none;font-size:12px;color:var(--ink-3);cursor:pointer;text-decoration:underline;text-underline-offset:3px;">
            Зөрчил мэдээлэх
          </button>
        </div>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (history.pushState) history.pushState(null, '', '#listing-' + id);
    if (l.geoLat && l.geoLng) {
      setTimeout(() => {
        const mapEl = document.getElementById('listingDetailMap');
        if (!mapEl || typeof L === 'undefined') return;
        const m = L.map('listingDetailMap', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([l.geoLat, l.geoLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
        }).addTo(m);
        L.marker([l.geoLat, l.geoLng]).addTo(m);
      }, 50);
    }
  }

  function shareListingModal(id, title) {
    const url = location.origin + location.pathname + '#listing-' + id;
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Холбоос хуулагдлаа', 'success'));
    } else {
      showToast('Холбоос: ' + url);
    }
  }

  function reportListing(id) {
    const reasons = ['Буруу үнэ', 'Хуурамч зар', 'Холбогдохгүй дугаар', 'Давхардсан зар'];
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow">Зар #${id}</span>
        <div class="al-title" style="margin-bottom:6px;">Зөрчил мэдээлэх</div>
        <div style="font-size:13px;color:var(--ink-3);margin-bottom:24px;">Зарын ямар асуудлыг мэдээлэх вэ?</div>
        <div style="display:grid;gap:10px;">
          ${reasons.map(r => `
            <button onclick="submitReport(${id}, '${r}')" style="text-align:left;padding:14px 18px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper-2);cursor:pointer;font-size:14px;font-weight:600;color:var(--ink);transition:border-color 0.15s;" onmouseover="this.style.borderColor='var(--danger)'" onmouseout="this.style.borderColor='var(--line)'">
              ${r}
            </button>
          `).join('')}
        </div>
        <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:16px;" onclick="closeModal()">Цуцлах</button>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  async function submitReport(id, reason) {
    closeModal();
    if (currentUser) {
      try {
        await db.collection('reports').add({
          listingId: id,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          reason,
          status: 'pending',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // reportCount-г зарт нэмнэ
        const l = listings.find(x => x.id === id);
        if (l?.firestoreId) {
          await db.collection('listings').doc(l.firestoreId).update({
            reportCount: firebase.firestore.FieldValue.increment(1)
          });
        }
      } catch(e) {}
    }
    showToast('Мэдээлэл хүлээн авлаа. Баярлалаа!', 'success');
  }

  function revealPhone(listingId, phone) {
    const box = document.getElementById('contactBox_' + listingId);
    if (!box) return;
    const l = listings.find(x => String(x.id) === String(listingId));
    if (l) {
      l.contactCount = (l.contactCount || 0) + 1;
      if (l.firestoreId) {
        db.collection('listings').doc(l.firestoreId).update({ contactCount: firebase.firestore.FieldValue.increment(1) }).catch(() => {});
      }
      if (typeof renderDashboard === 'function') renderDashboard();
    }
    box.innerHTML = `
      <div style="font-size:22px;font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--ink);letter-spacing:2px;margin-bottom:16px;">${phone}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a href="tel:${phone.replace(/\D/g,'')}" class="btn btn-blue">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.39 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23 18l-.08-1.08z"/></svg>
          Залгах
        </a>
        <button class="btn btn-primary" onclick="navigator.clipboard&&navigator.clipboard.writeText('${phone}').then(()=>showToast('Дугаар хуулагдлаа','success'))">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Хуулах
        </button>
      </div>
    `;
  }

  async function openListingChat(id, title) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    if (!currentUser) { closeModal(); showToast('Чат бичихийн тулд нэвтэрнэ үү'); openAuth(); return; }
    if (!l.ownerId) { openDemoListingChat(id, title); return; } // safety net only — every listing gets an ownerId
    if (l.ownerId === currentUser.uid) { showToast('Энэ бол таны өөрийн зар'); return; }
    closeModal();
    const chatId = await getOrCreateChat(l);
    if (!chatId) return;
    setTimeout(() => {
      document.getElementById('modalContent').className = 'modal chat-modal';
      renderChatShell();
      document.getElementById('modal').classList.add('open');
      document.body.style.overflow = 'hidden';
      openChatThread(chatId);
    }, 200);
  }

  // Demo listings have no real counterpart account to chat with — kept as a scripted preview only.
  function openDemoListingChat(id, title) {
    closeModal();
    setTimeout(() => {
      const msg = `Сайн байна уу! "${title}" зарт сонирхсон байна. Дэлгэрэнгүй мэдээлэл авах боломжтой юу?`;
      document.getElementById('modalContent').innerHTML = `
        <button class="modal-close" onclick="closeModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div style="padding:32px 28px;">
          <h3 style="font-family:'Fraunces',serif;margin-bottom:6px;">Зар дахь чат</h3>
          <div style="font-size:13px;color:var(--ink-3);margin-bottom:20px;">${esc(title)}</div>
          <textarea id="chatMsgInput" rows="5" style="width:100%;padding:12px;border:1.5px solid var(--line-2);border-radius:12px;font-size:14px;font-family:'Manrope',sans-serif;resize:vertical;outline:none;">${esc(msg)}</textarea>
          <div style="display:flex;gap:10px;margin-top:14px;">
            <button class="btn btn-blue btn-lg" style="flex:1;justify-content:center;" onclick="showToast('Мессеж илгээгдлээ!','success');closeModal();">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Илгээх
            </button>
            <button class="btn btn-ghost" onclick="closeModal()">Цуцлах</button>
          </div>
        </div>
      `;
      document.getElementById('modal').classList.add('open');
      document.body.style.overflow = 'hidden';
    }, 300);
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modalContent').className = 'modal';
    document.body.style.overflow = '';
    if (history.pushState && location.hash.startsWith('#listing-')) history.pushState(null, '', ' ');
    if (typeof unsubscribeActiveChat === 'function') unsubscribeActiveChat();
  }

  // ===== SELLER PROFILE =====
  function openSellerProfile(ownerId, name) {
    if (!ownerId) return;
    const sellerListings = listings.filter(x => x.ownerId === ownerId && !x._inactive);
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow">Худалдагчийн профайл</span>
        <div class="al-title" style="margin-bottom:6px;">${esc(name)}</div>
        <div style="font-size:13px;color:var(--ink-3);margin-bottom:20px;">${sellerListings.length} идэвхтэй зар</div>
        <div class="listings-grid" id="sellerProfileGrid"></div>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    const grid = document.getElementById('sellerProfileGrid');
    grid.innerHTML = sellerListings.map(l => `
      <article class="listing-card" onclick="closeModal(); setTimeout(()=>openListing(${l.id}),200)">
        <div class="listing-img">
          <img src="${esc(l.img)}" alt="${esc(l.title)}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1B2D4F, #1E5BFF)';" />
        </div>
        <div class="listing-body">
          <div class="listing-price-row">
            <div class="listing-price">${fmtPrice(l.price)}</div>
          </div>
          <h3 class="listing-title">${esc(l.title)}</h3>
          <div class="listing-loc"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${esc(l.loc)}</div>
        </div>
      </article>
    `).join('');
  }

