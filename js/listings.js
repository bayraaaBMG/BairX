  // ===== RENDER LISTINGS =====
  function renderListings(items) {
    const grid = document.getElementById('listingsGrid');
    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:72px 24px;color:var(--ink-3);">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="margin-bottom:18px;opacity:0.3;"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:700;color:var(--ink);margin-bottom:8px;">Тохирох зар олдсонгүй</div>
        <div style="font-size:14px;max-width:340px;margin:0 auto 24px;">Шүүлтүүрийн нөхцөлийг өөрчлөх эсвэл хайлтыг цэвэрлэж дахин оролдоно уу.</div>
        <button class="btn btn-blue" onclick="resetFilters()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Шүүлтүүр цэвэрлэх
        </button>
      </div>`;
      return;
    }
    grid.innerHTML = items.map(l => `
      <article class="listing-card" onclick="openListing(${l.id})">
        <div class="listing-img">
          <img src="${l.img}" alt="${l.title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1B2D4F, #1E5BFF)';" />
          <div class="listing-badges">
            ${l.badges.includes('vip') ? '<span class="badge vip">⭐ VIP</span>' : (l.badges.includes('hot') ? '<span class="badge hot">Эрэлттэй</span>' : '')}
            ${l.badges.includes('new') || l.badges.includes('user') ? '<span class="badge new">Шинэ</span>' : ''}
            ${(sellerData[l.id]?.type === 'Агент') ? '<span class="badge agent">Агент</span>' : ''}
          </div>
          <button class="listing-fav ${favorites.includes(l.id) ? 'faved' : ''}" onclick="event.stopPropagation(); toggleFav(this, ${l.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
          </button>
          <button class="listing-compare" onclick="event.stopPropagation(); toggleCompare(${l.id}, this)">
            <span class="listing-compare-check"></span>
            Харьцуулах
          </button>
          <div class="listing-img-count" onclick="event.stopPropagation(); openGallery(${l.id})">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            ${(listingExtras[l.id]?.gallery.length || 5)}
          </div>
        </div>
        <div class="listing-body">
          <div class="listing-price-row">
            <div>
              <div class="listing-price">${fmtPrice(l.price).replace(' тэрбум ₮','').replace(' сая ₮','')}<span style="font-size:14px; color:var(--ink-3); font-weight:500;"> ${l.price >= 1000 ? 'тэрбум' : 'сая'} ₮${l.cat === 'rent' ? '/сар' : ''}</span></div>
              <div class="listing-price-sub">${l.cat === 'rent' ? 'Сарын түрээс' : (typeof l.pricePerSqm === 'number' ? l.pricePerSqm + ' сая ₮/м²' : (l.pricePerSqm || ''))}</div>
            </div>
            <span class="price-tag ${l.tag.type === 'normal' ? '' : l.tag.type}">${l.tag.text}</span>
          </div>
          <h3 class="listing-title">${l.title}</h3>
          <div class="listing-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${l.loc}
          </div>
          <div class="listing-meta">
            <span class="listing-meta-item"><strong>${l.area}</strong> м²</span>
            <span class="listing-meta-item"><strong>${l.rooms}</strong>${typeof l.rooms === 'number' ? ' өрөө' : ''}</span>
            <span class="listing-meta-item"><strong>${l.floor}</strong></span>
            <span class="listing-meta-item"><strong>${l.year}</strong></span>
          </div>
          ${l.cat !== 'rent' ? `<div class="listing-loan-strip">
            <div>
              <div class="loan-strip-label">${l.loanType} сар бүр</div>
              <div class="loan-strip-amt">${typeof l.monthly === 'number' ? l.monthly.toFixed(2) + ' сая ₮' : l.monthly}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-deep)" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg>
          </div>` : `<div class="listing-loan-strip"><div><div class="loan-strip-label">Барьцаа</div><div class="loan-strip-amt">${l.legalNotes.split('·')[0].trim()}</div></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-deep)" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg></div>`}
        </div>
      </article>
    `).join('');
  }

