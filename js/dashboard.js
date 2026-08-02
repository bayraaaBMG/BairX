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

  // ===== ACCOUNT SIDEBAR (support + quick links, shown on Dashboard / My Listings) =====
  const ACCT_SUPPORT_EMAIL = 'bbayraaa20@gmail.com';

  function renderAccountSidebar() {
    const html = `
      <div class="acct-support">
        <div class="acct-support-label">Техникийн тусламж</div>
        <a class="acct-support-email" href="mailto:${ACCT_SUPPORT_EMAIL}">${ACCT_SUPPORT_EMAIL}</a>
      </div>
      <div class="acct-nav-list">
        <a onclick="showPage('my-listings')">Миний зарууд</a>
        <a onclick="openPaymentHistory()">Төлбөр</a>
        <a onclick="openAccountSettings()">Миний тохиргоо</a>
        <a onclick="openFavorites()">Таалагдсан зарууд <span class="acct-nav-count">${favorites.length}</span></a>
        <a onclick="openSavedSearches()">Таалагдсан хайлтууд <span class="acct-nav-count">${typeof savedSearchesCount !== 'undefined' ? savedSearchesCount : 0}</span></a>
      </div>
    `;
    ['acctSidebarDash', 'acctSidebarMyListings'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }

  // ===== МИНИЙ ТОХИРГОО (account settings) =====
  function openAccountSettings() {
    if (!currentUser) { showToast('Нэвтэрнэ үү'); openAuth(); return; }
    const canChangePassword = !currentUser.isGoogle && !currentUser.isPhone;
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow">Тохиргоо</span>
        <div class="al-title" style="margin-bottom:20px;">Миний тохиргоо</div>

        <div class="form-grid-2">
          <div>
            <label class="form-label">Овог</label>
            <input class="form-input" id="acctLastName" value="${esc(currentUser.lastName || '')}" />
          </div>
          <div>
            <label class="form-label">Нэр</label>
            <input class="form-input" id="acctFirstName" value="${esc(currentUser.name || '')}" />
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Холбоо барих</label>
          <input class="form-input" value="${esc(currentUser.isPhone ? (currentUser.phoneNumber || '') : (currentUser.email || ''))}" disabled />
        </div>
        <button class="btn btn-blue btn-lg" style="width:100%;justify-content:center;margin-top:8px;" onclick="saveAccountSettings()">Хадгалах</button>

        ${canChangePassword ? `
        <div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--line);">
          <div class="step-section-title" style="margin-bottom:12px;">Нууц үг солих</div>
          <div class="form-row"><label class="form-label">Одоогийн нууц үг</label><input class="form-input" type="password" id="acctCurPw" autocomplete="current-password" /></div>
          <div class="form-row"><label class="form-label">Шинэ нууц үг</label><input class="form-input" type="password" id="acctNewPw" placeholder="Хамгийн багадаа 6 тэмдэгт" autocomplete="new-password" /></div>
          <button class="btn btn-ghost" style="width:100%;justify-content:center;" onclick="changeAccountPassword()">Нууц үг солих</button>
        </div>` : ''}

        <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:20px;color:var(--danger);" onclick="closeModal(); logout();">Гарах</button>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  async function saveAccountSettings() {
    const firstName = document.getElementById('acctFirstName').value.trim();
    const lastName = document.getElementById('acctLastName').value.trim();
    if (!firstName) { showToast('Нэрээ оруулна уу'); return; }
    try {
      await db.collection('users').doc(currentUser.uid).set({ firstName, lastName }, { merge: true });
      if (auth.currentUser) await auth.currentUser.updateProfile({ displayName: firstName + (lastName ? ' ' + lastName : '') });
      currentUser.name = firstName;
      currentUser.lastName = lastName;
      currentUser.letter = firstName[0] || 'Х';
      updateNavLoggedIn();
      showToast('Мэдээлэл шинэчлэгдлээ', 'success');
    } catch(e) {
      showToast('Хадгалахад алдаа гарлаа');
    }
  }

  async function changeAccountPassword() {
    const curPw = document.getElementById('acctCurPw').value;
    const newPw = document.getElementById('acctNewPw').value;
    if (!curPw || newPw.length < 6) { showToast('Нууц үгээ зөв оруулна уу (шинэ нь 6+ тэмдэгт)'); return; }
    try {
      const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, curPw);
      await auth.currentUser.reauthenticateWithCredential(cred);
      await auth.currentUser.updatePassword(newPw);
      showToast('Нууц үг солигдлоо', 'success');
      document.getElementById('acctCurPw').value = '';
      document.getElementById('acctNewPw').value = '';
    } catch(e) {
      const msgs = { 'auth/wrong-password': 'Одоогийн нууц үг буруу байна', 'auth/weak-password': 'Шинэ нууц үг хэт энгийн байна' };
      showToast(msgs[e.code] || 'Нууц үг солиход алдаа гарлаа');
    }
  }

  // ===== ТӨЛБӨР (payment / boost transaction history) =====
  async function openPaymentHistory() {
    if (!currentUser) { showToast('Нэвтэрнэ үү'); openAuth(); return; }
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow">Төлбөр</span>
        <div class="al-title" style="margin-bottom:20px;">Төлбөрийн түүх</div>
        <div id="paymentHistoryList" style="text-align:center;padding:40px;color:var(--ink-3);">Ачааллаж байна…</div>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';

    let txns = [];
    try {
      const snap = await db.collection('transactions').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').limit(50).get();
      txns = snap.docs.map(d => d.data());
    } catch(e) {
      try { txns = JSON.parse(localStorage.getItem('bairxTransactions') || '[]'); } catch(e2) {}
    }
    const list = document.getElementById('paymentHistoryList');
    if (!list) return;
    if (txns.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--ink-3);">Одоогоор төлбөрийн түүх алга байна. Зараа Boost хийхэд эндээс харагдана.</div>`;
      return;
    }
    list.innerHTML = txns.map(t => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;border:1px solid var(--line);border-radius:12px;margin-bottom:10px;text-align:left;">
        <div>
          <div style="font-weight:700;font-size:14px;">${esc(t.plan)}</div>
          <div style="font-size:12px;color:var(--ink-3);">${esc(t.listingTitle || '')}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;color:var(--primary);">${esc(t.price)}</div>
          <div style="font-size:11px;color:var(--ink-3);">Demo горим</div>
        </div>
      </div>
    `).join('');
  }

