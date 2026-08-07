  // ===== DASHBOARD (real, per-logged-in-user data) =====
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderDashboard() {
    if (!currentUser) return;
    const myListings = listings.filter(l => l.userSubmitted && l.ownerId === currentUser.uid);
    const activeListings = myListings.filter(l => !l._inactive);
    const totalViews = myListings.reduce((s, l) => s + (l.viewCount || 0), 0);
    const totalContacts = myListings.reduce((s, l) => s + (l.contactCount || 0), 0);
    const totalFavorites = myListings.reduce((s, l) => s + (l.favoriteCount || 0), 0);

    setText('dashGreeting', `Сайн байна уу, ${currentUser.name}!`);
    setText('dashSub', myListings.length > 0
      ? `Танд ${activeListings.length} идэвхтэй зар байна. Нийт ${fmt(totalViews)} үзэлт авсан байна.`
      : 'Та одоогоор зар нэмээгүй байна.');
    setText('dashStatViews', fmt(totalViews));
    setText('dashStatContacts', fmt(totalContacts));
    setText('dashStatFavorites', fmt(totalFavorites));
    setText('dashStatActive', activeListings.length);
    setText('dashListingsSub', `${activeListings.length} идэвхтэй зар`);

    const list = document.getElementById('dashMyListingsList');
    if (list) {
      if (myListings.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:32px 16px;color:var(--ink-3);">
          <div style="font-size:14px;margin-bottom:14px;">Та одоогоор зар нэмээгүй байна.</div>
          <button class="btn btn-blue" onclick="openAddListing()">Эхний зараа нэмэх</button>
        </div>`;
      } else {
        list.innerHTML = myListings.slice(0, 5).map(l => `
          <div class="dash-listing" onclick="showPage('listings'); setTimeout(()=>openListing(${l.id}),150)" style="${l._inactive ? 'opacity:0.6;' : ''}">
            <img class="dash-listing-img" src="${esc(l.img)}" alt="" onerror="this.style.background='var(--paper-2)';this.removeAttribute('src');" />
            <div class="dash-listing-info">
              <div class="dash-listing-title">${esc(l.title)}</div>
              <div class="dash-listing-price">${fmtPrice(l.price)}</div>
              <div class="dash-listing-stats">
                <span class="dash-listing-stat">👁 ${l.viewCount || 0}</span>
                <span class="dash-listing-stat">♥ ${l.favoriteCount || 0}</span>
                <span class="dash-listing-stat">☎ ${l.contactCount || 0}</span>
              </div>
            </div>
            <span class="dash-listing-status ${l._inactive ? '' : 'active'}">${l._expired ? 'Дууссан' : (l._inactive ? 'Идэвхгүй' : 'Идэвхтэй')}</span>
          </div>
        `).join('');
      }
    }

    const banner = document.getElementById('dashBoostBanner');
    if (banner) banner.style.display = activeListings.length > 0 ? 'block' : 'none';

    renderViewsChart(activeListings);
  }

  // ===== DASHBOARD VIEWS CHART (real per-listing view counts) =====
  function renderViewsChart(myActiveListings) {
    const chart = document.getElementById('viewsChart');
    if (!chart) return;
    const list = (myActiveListings || []).slice(0, 7);
    if (list.length === 0) {
      chart.innerHTML = `<div style="width:100%;text-align:center;color:var(--ink-3);font-size:13px;padding:20px 0;">Идэвхтэй зар нэмэхэд статистик энд харагдана</div>`;
      return;
    }
    const max = Math.max(...list.map(l => l.viewCount || 0), 1);
    chart.innerHTML = list.map(l => `
      <div class="views-bar-col">
        <div class="views-bar" style="height:${((l.viewCount || 0) / max) * 100}%;" title="${esc(l.title)}: ${l.viewCount || 0} үзэлт"></div>
        <div class="views-bar-label" style="font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:44px;">${esc((l.title || '').split(',')[0])}</div>
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
  const ACCT_SUPPORT_EMAIL = 'press@bairx.mn';
  const ACCT_SUPPORT_PHONE = '7211-9435';

  function renderAccountSidebar() {
    const html = `
      <div class="acct-support">
        <div class="acct-support-label">Техникийн тусламж</div>
        <div class="acct-support-phone">${ACCT_SUPPORT_PHONE}</div>
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
    pendingProfilePhoto = null;
    const canChangePassword = !currentUser.isGoogle && !currentUser.isPhone;
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow">Тохиргоо</span>
        <div class="al-title" style="margin-bottom:20px;">Миний тохиргоо</div>

        <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px;">
          <div style="position:relative; width:72px; height:72px; flex-shrink:0;">
            <div id="acctPhotoPreview" style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, var(--primary), var(--primary-deep)); display:grid; place-items:center; overflow:hidden; font-size:26px; font-weight:700; color:#fff;">
              ${currentUser.photoURL ? `<img src="${esc(currentUser.photoURL)}" alt="" style="width:100%;height:100%;object-fit:cover;">` : esc(currentUser.letter)}
            </div>
            <label for="acctPhotoInput" style="position:absolute; bottom:-2px; right:-2px; width:26px; height:26px; border-radius:50%; background:var(--ink); display:grid; place-items:center; cursor:pointer; border:2px solid white;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </label>
            <input type="file" id="acctPhotoInput" accept="image/*" style="display:none" onchange="handleProfilePhotoUpload(event)" />
          </div>
          <div style="font-size:12px; color:var(--ink-3); line-height:1.5;">Профайл зураг<br>JPG, PNG зөвшөөрнө</div>
        </div>

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

  let pendingProfilePhoto = null;
  function handleProfilePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Зурган файл сонгоно уу'); return; }
    if (file.size > 8 * 1024 * 1024) { showToast('Зураг 8MB-аас бага байх ёстой'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize down to a small square so the base64 result stays well under
        // Firestore's 1MiB document limit regardless of the source photo size.
        const maxDim = 320;
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height >= width && height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        pendingProfilePhoto = canvas.toDataURL('image/jpeg', 0.85);
        const preview = document.getElementById('acctPhotoPreview');
        if (preview) preview.innerHTML = `<img src="${pendingProfilePhoto}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function saveAccountSettings() {
    const firstName = document.getElementById('acctFirstName').value.trim();
    const lastName = document.getElementById('acctLastName').value.trim();
    if (!firstName) { showToast('Нэрээ оруулна уу'); return; }
    try {
      const updateData = { firstName, lastName };
      if (pendingProfilePhoto) updateData.photoURL = pendingProfilePhoto;
      await db.collection('users').doc(currentUser.uid).set(updateData, { merge: true });
      if (auth.currentUser) await auth.currentUser.updateProfile({ displayName: firstName + (lastName ? ' ' + lastName : '') });
      currentUser.name = firstName;
      currentUser.lastName = lastName;
      currentUser.letter = firstName[0] || 'Х';
      if (pendingProfilePhoto) { currentUser.photoURL = pendingProfilePhoto; pendingProfilePhoto = null; }
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

