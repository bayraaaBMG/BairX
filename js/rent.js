  // ===== RENT LISTINGS DATA =====
  const rentListings = [
    {
      id: 'r1', type: 'monthly',
      title: 'Зайсан, тавилгатай 2 өрөө',
      loc: 'Хан-Уул, 11-р хороо · Зайсан',
      price: 1.8, // сая ₮/сар
      deposit: 3.6, // сая ₮ (хоёр сарын)
      area: 65, rooms: 2,
      features: ['Тавилгатай', 'Цахилгаан хэрэгсэлтэй', 'Wi-Fi орсон'],
      protected: true,
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'
    },
    {
      id: 'r2', type: 'monthly',
      title: 'Сүхбаатар, төв байр, ганц өрөө',
      loc: 'Сүхбаатар, 1-р хороо',
      price: 1.4,
      deposit: 2.8,
      area: 42, rooms: 1,
      features: ['Тавилгатай', 'Цэвэрхэн', 'Лифттэй'],
      protected: true,
      img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
    },
    {
      id: 'r3', type: 'monthly',
      title: 'Чингэлтэй, шинэ барилга 3 өрөө',
      loc: 'Чингэлтэй, 4-р хороо',
      price: 2.2,
      deposit: 4.4,
      area: 78, rooms: 3,
      features: ['Тавилгатай', 'Паркинг', 'Гэр бүлд тохиромжтой'],
      protected: true,
      img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'
    },
    {
      id: 'r4', type: 'daily',
      title: 'Зайсан, Airbnb стандарт студио',
      loc: 'Хан-Уул, Зайсан · Богино хугацааны',
      price: 0.18, // сая ₮/хоног (180,000 ₮)
      deposit: 0.5,
      area: 38, rooms: 1,
      features: ['Үйлчилгээтэй', 'Цэвэрлэгээ', 'Цай, кофе'],
      protected: true,
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'
    },
    {
      id: 'r5', type: 'monthly',
      title: 'Яармаг, тагт орон сууц',
      loc: 'Хан-Уул, Яармаг',
      price: 3.5,
      deposit: 7.0,
      area: 140, rooms: 4,
      features: ['Тавилгатай', 'Гараж', 'Хашаатай', 'Цэцэрлэг'],
      protected: true,
      img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'
    },
    {
      id: 'r6', type: 'daily',
      title: 'Сүхбаатар, бизнес айлчилгаанд',
      loc: 'Сүхбаатар · Чингисийн өргөн чөлөө',
      price: 0.22,
      deposit: 0.6,
      area: 52, rooms: 2,
      features: ['Тавилгатай', 'Үйлчилгээтэй', 'Бизнес центр ойр'],
      protected: true,
      img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'
    }
  ];

  function renderRentListings(type) {
    const grid = document.getElementById('rentGrid');
    if (!grid) return;
    const items = type === 'all' ? rentListings : rentListings.filter(r => r.type === type);
    if (items.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--ink-3);">Энэ ангилалд зар олдсонгүй</div>';
      return;
    }
    grid.innerHTML = items.map(r => {
      const priceDisplay = r.type === 'daily' ?
        `${(r.price * 1000).toFixed(0)} мянга ₮` :
        `${r.price.toFixed(1)} сая ₮`;
      const period = r.type === 'daily' ? '/хоног' : '/сар';
      const depositDisplay = r.type === 'daily' ?
        `Барьцаа ${(r.deposit * 1000).toFixed(0)} мянга` :
        `Барьцаа ${r.deposit.toFixed(1)} сая`;
      return `
        <article class="rent-card" onclick="openRentDetail('${r.id}')">
          <div class="rent-img">
            <img src="${r.img}" alt="${r.title}" loading="lazy" />
            <span class="rent-type-badge ${r.type}">${r.type === 'monthly' ? 'Сарын' : 'Хоногийн'}</span>
          </div>
          <div class="rent-body">
            <div class="rent-price-row">
              <div>
                <div class="rent-price">${priceDisplay}<span class="rent-price-period">${period}</span></div>
              </div>
              <span class="rent-deposit">${depositDisplay}</span>
            </div>
            <h3 class="rent-title">${r.title}</h3>
            <div class="rent-loc">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle; margin-right:3px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${r.loc}
            </div>
            <div class="rent-features">
              ${r.features.slice(0, 3).map(f => `<span class="rent-feature">${f}</span>`).join('')}
            </div>
            <div class="rent-meta">
              <span><strong>${r.area}</strong> м²</span>
              <span><strong>${r.rooms}</strong> өрөө</span>
              <span style="margin-left:auto; color:var(--primary); font-weight:700;">Дэлгэрэнгүй →</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function openRentDetail(id) {
    // Real user-submitted rentals are mirrored into this list with a "u"-prefixed id (see
    // doSubmitListing in my-listings.js) — route those to the real listing detail modal
    // (openListing in listing-detail.js), which already has working contact/chat/report
    // functionality, instead of duplicating a second, thinner detail view here.
    if (typeof id === 'string' && id.charAt(0) === 'u') {
      const numId = parseInt(id.slice(1), 10);
      if (!isNaN(numId) && typeof listings !== 'undefined' && listings.some(l => l.id === numId)) {
        openListing(numId);
        return;
      }
    }
    const r = rentListings.find(x => x.id === id);
    if (!r) return;
    const priceDisplay = r.type === 'daily' ?
      `${(r.price * 1000).toFixed(0)} мянга ₮ / хоног` :
      `${r.price.toFixed(1)} сая ₮ / сар`;
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <img class="modal-img" src="${r.img}" alt="${r.title}" />
      <div class="modal-body">
        <span class="badge demo" style="margin-bottom:10px;">Жишээ зар</span>
        <h2 class="modal-title">${r.title}</h2>
        <div class="modal-loc">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${r.loc}
        </div>

        <div style="background:linear-gradient(135deg, rgba(0,212,170,0.1), rgba(30,91,255,0.05)); border:1px solid rgba(0,212,170,0.25); padding:20px; border-radius:14px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <div style="font-family:'Fraunces', serif; font-size:28px; font-weight:700; color:var(--primary-deep);">${priceDisplay}</div>
            <div style="font-size:13px; color:var(--ink-2); font-weight:600;">Барьцаа: ${r.type === 'daily' ? (r.deposit * 1000).toFixed(0) + ' мянга ₮' : r.deposit.toFixed(1) + ' сая ₮'}</div>
          </div>
        </div>

        <div class="modal-info-grid">
          <div class="info-card">
            <div class="info-card-label">Талбай</div>
            <div class="info-card-value">${r.area} м²</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Өрөө</div>
            <div class="info-card-value">${r.rooms}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Төрөл</div>
            <div class="info-card-value">${r.type === 'monthly' ? 'Сарын' : 'Хоногийн'}</div>
          </div>
        </div>

        <div class="modal-section">
          <h4>Түрээслэхэд туслах хэрэгслүүд</h4>
          <div style="background:var(--paper-2); padding:18px; border-radius:12px;">
            <div style="display:grid; gap:10px;">
              <div style="display:flex; gap:10px; align-items:start;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009878" stroke-width="2.5" style="flex-shrink:0; margin-top:1px;"><polyline points="20 6 9 17 4 12"/></svg>
                <div style="font-size:13.5px; line-height:1.5;">Стандарт түрээсийн гэрээний загварыг үзэж, ашиглаж болно.</div>
              </div>
              <div style="display:flex; gap:10px; align-items:start;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009878" stroke-width="2.5" style="flex-shrink:0; margin-top:1px;"><polyline points="20 6 9 17 4 12"/></svg>
                <div style="font-size:13.5px; line-height:1.5;">Зарын мэдээллийг өөрөө нягтлан шалгаарай — үнэ, талбай, байршил бодит эсэхийг.</div>
              </div>
              <div style="display:flex; gap:10px; align-items:start;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009878" stroke-width="2.5" style="flex-shrink:0; margin-top:1px;"><polyline points="20 6 9 17 4 12"/></svg>
                <div style="font-size:13.5px; line-height:1.5;">Сэжигтэй зар бол шууд мэдээлж болно.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-section">
          <h4>Онцлогууд</h4>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${r.features.map(f => `<span style="padding:7px 14px; background:var(--primary-soft); color:var(--primary-deep); border-radius:100px; font-size:13px; font-weight:600;">${f}</span>`).join('')}
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary btn-lg" onclick="openContractTemplate()">
            Гэрээ загвар үзэх
          </button>
        </div>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

