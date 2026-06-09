  // ===== DASHBOARD VIEWS CHART =====
  function renderViewsChart() {
    const chart = document.getElementById('viewsChart');
    if (!chart) return;
    const data = [
      { day: 'Дав', views: 120 },
      { day: 'Мяг', views: 185 },
      { day: 'Лха', views: 156 },
      { day: 'Пүр', views: 220 },
      { day: 'Баа', views: 280 },
      { day: 'Бям', views: 195 },
      { day: 'Ням', views: 128 }
    ];
    const max = Math.max(...data.map(d => d.views));
    chart.innerHTML = data.map(d => `
      <div class="views-bar-col">
        <div class="views-bar" style="height:${(d.views / max) * 100}%;" title="${d.views} үзэлт"></div>
        <div class="views-bar-label">${d.day}</div>
      </div>
    `).join('');
  }

  // ===== BOOST MODAL (dashboard) =====
  let selectedBoost = 'vip';
  function openDashboardBoost() {
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:36px;">
        <span class="al-eyebrow">Зар дээшлүүлэх</span>
        <div class="al-title" style="margin-bottom:8px;">Зараа дээшлүүлж, хурдан зараарай</div>
        <div class="al-sub" style="margin-bottom:24px;">"Зайсан, Хүннү 2222" зарыг дээшлүүлснээр илүү олон хүнд харагдана</div>

        <div class="boost-compare">
          <button class="boost-plan ${selectedBoost === 'top' ? 'active' : ''}" data-boost="top" onclick="selectBoost('top')">
            <div class="boost-plan-icon" style="background:var(--primary-soft); color:var(--primary);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </div>
            <div class="boost-plan-name">Дээш гаргах</div>
            <div class="boost-plan-multiplier">3x илүү үзэлт</div>
            <div class="boost-plan-price">9,000 ₮</div>
            <div class="boost-plan-period">3 хоног хайлтын эхэнд</div>
          </button>
          <button class="boost-plan ${selectedBoost === 'vip' ? 'active' : ''}" data-boost="vip" onclick="selectBoost('vip')">
            <div class="boost-plan-icon" style="background:rgba(255,176,32,0.15); color:#C77700;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="boost-plan-name">VIP</div>
            <div class="boost-plan-multiplier">5x илүү үзэлт</div>
            <div class="boost-plan-price">15,000 ₮</div>
            <div class="boost-plan-period">7 хоног, VIP тэмдэгтэй</div>
          </button>
          <button class="boost-plan ${selectedBoost === 'featured' ? 'active' : ''}" data-boost="featured" onclick="selectBoost('featured')">
            <div class="boost-plan-icon" style="background:rgba(0,212,170,0.15); color:#009878;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>
            </div>
            <div class="boost-plan-name">Онцлох</div>
            <div class="boost-plan-multiplier">8x илүү үзэлт</div>
            <div class="boost-plan-price">35,000 ₮</div>
            <div class="boost-plan-period">14 хоног, нүүр хуудсанд</div>
          </button>
        </div>

        <div style="padding:16px; background:var(--paper-2); border-radius:12px; margin-bottom:20px; font-size:13px; color:var(--ink-2); line-height:1.55;">
          <strong>Boost юу хийдэг вэ?</strong> Таны зар хайлтын үр дүнгийн эхэнд, Feed-ийн "Онцлох" хэсэгт, нүүр хуудсанд харагдана. Дунджаар boost хийсэн зарууд 60-75% хурдан зарагддаг.
        </div>

        <button class="btn btn-blue btn-lg" style="width:100%; justify-content:center;" onclick="confirmDashboardBoost()">
          Сонгосон багцаар дээшлүүлэх
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </button>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function selectBoost(plan) {
    selectedBoost = plan;
    document.querySelectorAll('.boost-plan').forEach(p => {
      p.classList.toggle('active', p.dataset.boost === plan);
    });
  }

  function confirmDashboardBoost() {
    closeModal();
    showToast('Зар амжилттай дээшиллээ! Удахгүй илүү олон хүнд харагдана', 'success');
  }

