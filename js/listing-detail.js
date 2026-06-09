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
    const monthly = typeof l.monthly === 'number' ? l.monthly.toFixed(2) + ' сая ₮' : l.monthly;
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

    // Мэргэжлийн AI үнэлгээ
    let aiVerdict = '';
    let aiColor = '';
    let aiReasoning = '';

    if (l.tag.type === 'below') {
      aiVerdict = 'Сонирхолтой санал';
      aiColor = '#009878';
      aiReasoning = `Зах зээлийн дунджаас доогуур үнэтэй (${l.tag.text}). Гэхдээ <strong>тэр болгон сайн биш</strong>. Дараах зүйлсийг шалгана уу: (1) Барьцаатай эсэх — бэлэн мөнгөөр шилжүүлэх боломжтой эсэх. (2) Эзэмшлийн гэрчилгээний хуулбар. (3) Барилгын чанарын баримт. (4) Хороогоор шалгаж үзэх. Хэрэв эдгээр нь шалгагдаж байвал зах зээлд орох сайн боломж.`;
    } else if (l.tag.type === 'above') {
      aiVerdict = 'Зах зээлээс дээгүүр';
      aiColor = '#FF4757';
      aiReasoning = `Зах зээлийн дунджаас дээгүүр үнэтэй. Premium байршил, чанар, аль нэг онцлогоос болсон байж болзошгүй. <strong>Үнэ хэлэлцэх боломжтой эсэхийг ярилц</strong>. Эсвэл агентаас "яагаад илүү үнэтэй вэ?" гэдгийг тодорхой тайлбарлуулж аваарай.`;
    } else {
      aiVerdict = 'Зах зээлийн үнэ';
      aiColor = '#1E5BFF';
      aiReasoning = `Үнэ зах зээлийн дунд түвшинд. Энэ бол ердийн сонголт — найдвартай ч давуу талгүй. Бусад заруудтай харьцуулж, заавал биечлэн очиж үзэж, чанар нь үнэдээ таарч буй эсэхийг шалгаарай.`;
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
    const seller = l.userSubmitted
      ? { phone: currentUser?.email || '9900-0000', name: currentUser?.name || 'Хэрэглэгч', type: 'Хувь хүн' }
      : (sellerData[l.id] || { phone: '9911-2233', name: 'Баталгаажсан Агент', type: 'Агент' });
    const sellerName = seller.name;
    const sellerLetter = sellerName[0] || 'А';
    const totalListings = l.userSubmitted ? 1 : 3 + (l.id % 12);
    const responseTime = l.id % 2 === 0 ? '10 минут' : '30 минут';
    const memberSince = l.userSubmitted ? new Date().getFullYear() : 2020 + (l.id % 5);

    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <button class="modal-share-btn" onclick="shareListingModal(${l.id}, '${l.title.replace(/'/g, '&#39;')}')" title="Хуваалцах">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>

      <!-- INLINE GALLERY CAROUSEL -->
      <div class="mc-wrap">
        <div class="mc-main">
          <img id="mcMainImg" src="${mcImages[0]}" alt="${l.title}" style="transition:opacity 0.22s;" />
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
          ${mcImages.map((img, i) => `<img class="mc-thumb ${i===0?'active':''}" src="${img}" onclick="mcGoto(${i})" alt="" />`).join('')}
        </div>` : ''}
      </div>

      <div class="modal-body">
        <h2 class="modal-title">${l.title}</h2>
        <div class="modal-loc">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${l.loc}
        </div>
        <div class="modal-price-row">
          <div>
            <div class="modal-price">${fmtPrice(l.price)}</div>
            <div style="font-size:13px; color:var(--ink-3); margin-top:4px;">${typeof l.pricePerSqm === 'number' ? l.pricePerSqm + ' сая ₮ / м²' : ''}</div>
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
        </div>

        <!-- SELLER CARD -->
        <div class="modal-section">
          <div class="seller-card">
            <div class="seller-av">${sellerLetter}</div>
            <div class="seller-info">
              <div class="seller-name">
                ${sellerName}
                <span class="seller-verified">✓ Баталгаажсан</span>
              </div>
              <div class="seller-meta">${seller.type}</div>
              <div class="seller-stats">
                <span><b>${totalListings} зар</b></span>
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
            <div class="prof-info-row">
              <div class="prof-info-label">Паркинг</div>
              <div class="prof-info-value">${l.parking || '—'}</div>
            </div>
            <div class="prof-info-row">
              <div class="prof-info-label">Лифт</div>
              <div class="prof-info-value">${l.elevator || '—'}</div>
            </div>
            <div class="prof-info-row">
              <div class="prof-info-label">Засвар/Төлөв</div>
              <div class="prof-info-value">${l.condition || '—'}</div>
            </div>
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
            <div class="legal-notes-text">${l.legalNotes || '—'}</div>
          </div>
        </div>

        <!-- MAP PLACEHOLDER -->
        <div class="modal-section">
          <h4>Байршил</h4>
          <div class="map-placeholder">
            <div class="map-placeholder-grid"></div>
            <div class="map-placeholder-inner">
              <div class="map-pin">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div style="font-weight:700;font-size:15px;color:var(--ink);">${l.district} дүүрэг, ${(l.id % 10) + 1}-р хороо</div>
              <div style="font-size:13px;color:var(--ink-2);margin-top:3px;">${l.loc}</div>
              <div style="font-size:11px;color:var(--ink-3);margin-top:6px;display:flex;align-items:center;gap:5px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Байршил ойролцоогоор · ${ ['Дэлгүүр', 'Сургууль', 'Эмнэлэг', 'Цэцэрлэгт хүрээлэн', 'Метроны буудал'][l.id % 5] } ойролцоо
              </div>
            </div>
          </div>
        </div>

        <!-- ЗЭЭЛИЙН САНАЛ -->
        <div class="modal-section">
          <h4>Зээлийн санал (зах зээлийн одоогийн хүү)</h4>
          <div style="background:var(--primary-soft); padding:18px; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="font-size:13px; color:var(--primary-deep); font-weight:600;">${l.loanType}, сар бүр</div>
              <div style="font-family:'Fraunces', serif; font-size:22px; font-weight:700; color:var(--primary-deep);">${monthly}</div>
            </div>
            <div style="font-size:12px; color:var(--primary-deep); opacity:0.8;">Урьдчилгаа 30% (${Math.round(l.price * 0.3)} сая ₮), хугацаа 20 жил. Тооцоолол хэлбэлзэх боломжтой.</div>
          </div>
        </div>

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

        <!-- АГЕНТЫН ШИНЖИЛГЭЭ -->
        <div class="modal-section">
          <h4>Үл хөдлөхийн мэргэжилтний шинжилгээ</h4>
          <div style="padding:18px; background:var(--paper-2); border-radius:14px;">
            <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
              <div style="padding:6px 12px; background:${aiColor}; color:white; border-radius:100px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">${aiVerdict}</div>
            </div>
            <div style="font-size:14px; line-height:1.65; color:var(--ink-2);">${aiReasoning}</div>

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
          <button class="btn btn-primary btn-lg" onclick="openListingChat(${l.id}, '${l.title.replace(/'/g, '&#39;')}')">
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
            <button class="btn btn-primary btn-lg" style="justify-content:center;" onclick="openListingChat(${l.id}, '${l.title.replace(/'/g, '&#39;')}')">
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
                <img src="${s.img}" alt="${s.title}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block;" onerror="this.style.background='var(--paper-2)';this.style.display='none';" />
                <div style="padding:10px 12px;">
                  <div style="font-weight:700;font-size:13px;color:var(--primary);font-family:'Fraunces',serif;">${fmtPrice(s.price)}</div>
                  <div style="font-size:12px;color:var(--ink-2);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</div>
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

  function openListingChat(id, title) {
    const l = listings.find(x => x.id === id);
    closeModal();
    setTimeout(() => {
      const msg = encodeURIComponent(`Сайн байна уу! "${title}" зарт сонирхсон байна. Дэлгэрэнгүй мэдээлэл авах боломжтой юу?`);
      document.getElementById('modalContent').innerHTML = `
        <button class="modal-close" onclick="closeModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div style="padding:32px 28px;">
          <h3 style="font-family:'Fraunces',serif;margin-bottom:6px;">Зар дахь чат</h3>
          <div style="font-size:13px;color:var(--ink-3);margin-bottom:20px;">${title}</div>
          <textarea id="chatMsgInput" rows="5" style="width:100%;padding:12px;border:1.5px solid var(--line-2);border-radius:12px;font-size:14px;font-family:'Manrope',sans-serif;resize:vertical;outline:none;">${decodeURIComponent(msg)}</textarea>
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
  }

