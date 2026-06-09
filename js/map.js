  // ===== MAP VIEW =====
  let mapViewOn = false;
  function toggleMapView() {
    mapViewOn = !mapViewOn;
    const mapView = document.getElementById('mapView');
    const label = document.getElementById('mapToggleLabel');
    const icon = document.getElementById('mapToggleIcon');
    const btn = document.getElementById('mapToggleBtn');
    if (mapViewOn) {
      mapView.style.display = 'block';
      label.textContent = 'Жагсаалт';
      if (icon) icon.innerHTML = '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>';
      if (btn) { btn.style.background = 'var(--primary-soft)'; btn.style.color = 'var(--primary)'; }
      renderMiniMap(getFilteredListings());
    } else {
      mapView.style.display = 'none';
      label.textContent = 'Газрын зураг';
      if (icon) icon.innerHTML = '<path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7"/>';
      if (btn) { btn.style.background = ''; btn.style.color = ''; }
    }
  }

  function renderMiniMap(items) {
    const map = document.getElementById('miniMap');
    if (!map) return;
    const poiHtml = `
      <div class="map-poi" style="left:30%; top:25%;"><div class="map-poi-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>Сургууль</div>
      <div class="map-poi" style="left:75%; top:30%;"><div class="map-poi-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF4757" stroke-width="2"><path d="M8 2h8M12 2v6M5 10h14l-1 12H6z"/></svg></div>Эмнэлэг</div>
      <div class="map-poi" style="left:55%; top:62%;"><div class="map-poi-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" stroke-width="2"><path d="M3 3h18v13H3zM8 21h8M12 16v5"/></svg></div>Худалдаа</div>
    `;
    const roadsHtml = `
      <svg class="mini-map-roads" viewBox="0 0 100 56" preserveAspectRatio="none">
        <path d="M0 28 L100 30" stroke="rgba(30,91,255,0.15)" stroke-width="2.5" fill="none"/>
        <path d="M45 0 L50 56" stroke="rgba(30,91,255,0.12)" stroke-width="2" fill="none"/>
        <path d="M0 12 L100 8" stroke="rgba(30,91,255,0.08)" stroke-width="1.5" fill="none"/>
        <path d="M75 0 L80 56" stroke="rgba(30,91,255,0.08)" stroke-width="1.5" fill="none"/>
      </svg>
    `;
    const pins = items.map((l, i) => {
      const c = listingExtras[l.id]?.coords || { x: 30 + i * 12, y: 40 + (i % 3) * 12 };
      const priceLabel = l.price >= 1000 ? (l.price/1000).toFixed(1) + 'тэр' : l.price + 'сая';
      return `
        <div class="map-pin ${i === 0 ? 'main' : ''}" style="left:${c.x}%; top:${c.y}%;" onclick="openListing(${l.id})">
          <div class="map-pin-marker ${i === 0 ? 'main' : ''}">${priceLabel}</div>
        </div>
      `;
    }).join('');
    map.innerHTML = `<div class="mini-map-grid"></div>${roadsHtml}${poiHtml}${pins}`;
  }

