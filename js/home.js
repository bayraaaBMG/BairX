  // ===== HOME LISTINGS PREVIEW =====
  function renderHomeListings() {
    const grid = document.getElementById('homeListingsGrid');
    if (!grid) return;
    const recent = [...listings].sort((a, b) => b.id - a.id).slice(0, 8);
    grid.innerHTML = recent.map(l => `
      <article class="listing-card" onclick="showPage('listings'); setTimeout(()=>openListing(${l.id}),150)">
        <div class="listing-img">
          <img src="${l.img}" alt="${l.title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1B2D4F, #1E5BFF)';"/>
          <div class="listing-badges">
            ${l.badges.includes('vip') ? '<span class="badge vip">⭐ VIP</span>' : (l.badges.includes('hot') ? '<span class="badge hot">Эрэлттэй</span>' : '')}
            ${l.badges.includes('new') || l.badges.includes('user') ? '<span class="badge new">Шинэ</span>' : ''}
          </div>
          <button class="listing-fav ${favorites.includes(l.id) ? 'faved' : ''}" onclick="event.stopPropagation(); toggleFav(this, ${l.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
          </button>
        </div>
        <div class="listing-body">
          <div class="listing-price-row">
            <div>
              <div class="listing-price">${l.price >= 1000 ? (l.price/1000).toFixed(1) : l.price}<span style="font-size:14px; color:var(--ink-3); font-weight:500;"> ${l.price >= 1000 ? 'тэрбум' : 'сая'} ₮${l.cat === 'rent' ? '/сар' : ''}</span></div>
              <div class="listing-price-sub">${l.cat === 'rent' ? 'Сарын түрээс' : (typeof l.pricePerSqm === 'number' ? l.pricePerSqm + ' сая ₮/м²' : (l.pricePerSqm || ''))}</div>
            </div>
            <span class="price-tag ${l.tag.type === 'normal' ? '' : l.tag.type}">${l.tag.text}</span>
          </div>
          <h3 class="listing-title">${l.title}</h3>
          <div class="listing-loc"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${l.loc}</div>
          <div class="listing-meta">
            <span class="listing-meta-item"><strong>${l.area}</strong> м²</span>
            <span class="listing-meta-item"><strong>${l.rooms}</strong>${typeof l.rooms === 'number' ? ' өрөө' : ''}</span>
            <span class="listing-meta-item"><strong>${l.floor}</strong></span>
          </div>
        </div>
      </article>
    `).join('');
  }

