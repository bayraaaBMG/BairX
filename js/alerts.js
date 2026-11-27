  // ===== ALERTS (3.4) — "шинэ хямд зар гармагц мэдэгдэнэ" =====
  // Signed-in visitors save an alerts/{id} doc (budget, rooms, complex, channel); the
  // onListingActivated Cloud Function matches every newly-approved listing against these
  // AND against the existing "Дагасан хайлт" (savedSearches) and notifies in-app + per channel.
  // Logged-out visitors leave name/phone instead → leads (type: alert), with consent.
  //
  // Web Push needs the project's public VAPID key: Firebase console → Project settings →
  // Cloud Messaging → Web Push certificates → "Generate key pair", then paste it below.
  const FCM_VAPID_KEY = '';

  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const pushConfigured = () => pushSupported() && !!FCM_VAPID_KEY;

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = resolve; s.onerror = () => reject(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }

  // Registers this browser for Web Push and stores its FCM token. Returns true on success.
  async function enablePush() {
    if (!currentUser) { openAuth(); return false; }
    if (!pushConfigured()) { showToast('Web Push одоогоор тохируулагдаагүй байна. И-мэйл сонгоно уу.'); return false; }
    if (!(await requireServerReady(null))) return false;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { showToast('Хөтөч мэдэгдэл илгээхийг зөвшөөрөөгүй байна'); return false; }
      await loadScriptOnce('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
      const reg = await navigator.serviceWorker.ready;
      const token = await firebase.messaging().getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg });
      if (!token) return false;
      const id = currentUser.uid.slice(0, 10) + '_' + token.slice(-40).replace(/[^A-Za-z0-9]/g, '');
      await db.collection('pushTokens').doc(id).set({
        userId: currentUser.uid, token, ua: navigator.userAgent.slice(0, 200),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error('enablePush failed:', e.code || '', e.message);
      showToast('Push мэдэгдэл идэвхжүүлж чадсангүй');
      return false;
    }
  }

  registerRoute(/^\/alerts$/, async () => {
    await loadPriceData();
    const b = new URLSearchParams(location.search).get('b') || '';
    const cx = complexListOf().sort((a, b2) => a.name.localeCompare(b2.name));
    const channelHtml = `
      <div class="lf-field"><span>Мэдэгдэл хүлээн авах суваг *</span>
        <div class="radio-row">
          <label><input type="radio" name="alCh" value="push" ${pushConfigured() ? 'checked' : 'disabled'}> Web Push${pushConfigured() ? '' : ' (удахгүй)'}</label>
          <label><input type="radio" name="alCh" value="email" ${pushConfigured() ? '' : 'checked'}> И-мэйл</label>
          <label class="disabled"><input type="radio" name="alCh" value="telegram" disabled> Telegram (удахгүй)</label>
        </div></div>`;
    return {
      title: 'Хямд зарын мэдэгдэл авах | BairX',
      description: 'Төсөв, өрөө, хотхоноо сонгоод шинэ хямд зар гармагц мэдэгдэл аваарай.',
      html: `<div class="route-page route-narrow">
        <div class="route-eyebrow">Мэдэгдэл</div>
        <h1 class="route-title">Шинэ хямд зар гармагц мэдэгдэх</h1>
        <p class="route-lead">Таны нөхцөлд тохирох, хотхоныхоо дунджаас 15%+ хямд шинэ зар батлагдмагц шууд мэдэгдэнэ.</p>
        <form class="lead-form" id="alertForm" onsubmit="submitAlert(event)">
          <div class="lf-grid">
            <label class="lf-field"><span>Дээд төсөв (сая ₮)</span><input class="form-input" id="alBudget" type="number" min="10" step="10" value="${esc(b)}" placeholder="500" /></label>
            <label class="lf-field"><span>Өрөө</span><select class="form-input" id="alRooms"><option value="">Хамаагүй</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></label>
          </div>
          <label class="lf-field"><span>Хотхон</span><select class="form-input" id="alComplex"><option value="">Бүх хотхон</option>${cx.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
          <label class="consent-row" style="color:var(--ink-2)"><input type="checkbox" id="alOnlyHot" checked><span>Зөвхөн хотхоны дунджаас 15%+ хямд зар</span></label>
          ${currentUser ? channelHtml : `
            <div class="lf-sep">Нэвтэрсэн бол Web Push / и-мэйлээр шууд мэдэгдэнэ. Нэвтрэхгүйгээр утсаа үлдээвэл манай ажилтан холбогдоно.</div>
            <div class="lf-grid">
              <label class="lf-field"><span>Нэр *</span><input class="form-input" id="alName" maxlength="80" autocomplete="name" /></label>
              <label class="lf-field"><span>Утас *</span><input class="form-input" id="alPhone" inputmode="numeric" maxlength="12" placeholder="99112233" autocomplete="tel" /></label>
            </div>`}
          ${consentCheckboxHtml('alConsent')}
          <button class="btn btn-blue btn-lg" type="submit" id="alSubmit">Мэдэгдэл тохируулах</button>
          ${currentUser ? '' : '<button type="button" class="btn btn-ghost" onclick="openAuth()">Нэвтэрч Push/и-мэйлээр авах</button>'}
        </form>
        <div id="myAlerts"></div>
      </div>`,
      after: renderMyAlerts
    };
  });

  async function submitAlert(e) {
    e.preventDefault();
    const budgetMax = parseFloat(document.getElementById('alBudget').value) || null;
    const rooms = document.getElementById('alRooms').value;
    const complexId = document.getElementById('alComplex').value;
    const onlyHot = document.getElementById('alOnlyHot').checked;
    if (!consentGiven('alConsent')) return;
    if (!(await requireServerReady(e.target))) return;
    const btn = document.getElementById('alSubmit');
    if (!currentUser) {
      const name = (document.getElementById('alName').value || '').trim();
      const phone = normalizeMnPhone(document.getElementById('alPhone').value);
      if (!name) { showToast('Нэрээ оруулна уу'); return; }
      if (!phone) { showToast('8 оронтой утасны дугаар оруулна уу'); return; }
      btn.disabled = true;
      try {
        await submitLead({ type: 'alert', name, phone, budget: budgetMax || undefined, complexId: complexId || undefined, rooms: rooms ? parseInt(rooms, 10) : undefined, note: onlyHot ? 'Зөвхөн хямд зар' : '' });
        document.getElementById('alertForm').innerHTML = `<div class="lead-success">Бүртгэгдлээ. Тохирох хямд зар гармагц ${esc(phone)} дугаарт мэдэгдэнэ.</div>`;
      } catch (err) { console.error(err); showToast('Илгээхэд алдаа гарлаа'); btn.disabled = false; }
      return;
    }
    const channel = (document.querySelector('input[name="alCh"]:checked') || {}).value || 'email';
    if (channel === 'push' && !(await enablePush())) return;
    btn.disabled = true;
    try {
      await db.collection('alerts').add({
        userId: currentUser.uid, budgetMax, rooms: rooms ? parseInt(rooms, 10) : null,
        complexId: complexId || '', channel, onlyHot, active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      trackEvent('lead_submit', { channel: 'alert', complexId, page: 'alerts' });
      showToast('Мэдэгдэл тохируулагдлаа', 'success');
      btn.disabled = false;
      renderMyAlerts();
    } catch (err) {
      console.error('alert save failed:', err.code, err.message);
      showToast('Хадгалахад алдаа гарлаа'); btn.disabled = false;
    }
  }

  async function renderMyAlerts() {
    const el = document.getElementById('myAlerts');
    if (!el || !currentUser) return;
    try {
      const snap = await db.collection('alerts').where('userId', '==', currentUser.uid).get();
      if (snap.empty) { el.innerHTML = ''; return; }
      const chLabel = { push: 'Web Push', email: 'И-мэйл', telegram: 'Telegram' };
      el.innerHTML = `<h2 class="route-h2">Миний мэдэгдлүүд</h2>` + snap.docs.map(d => {
        const a = d.data();
        const cname = a.complexId ? (priceData.complexes.get(a.complexId)?.name || a.complexId) : 'Бүх хотхон';
        return `<div class="alert-row"><div><strong>${a.budgetMax ? a.budgetMax + ' сая ₮ хүртэл' : 'Төсөв хамаагүй'}</strong> · ${a.rooms ? a.rooms + ' өрөө' : 'Өрөө хамаагүй'} · ${esc(cname)}${a.onlyHot !== false ? ' · зөвхөн хямд' : ''}<div class="muted-note">${chLabel[a.channel] || a.channel}</div></div>
          <button class="btn btn-ghost" onclick="deleteAlert('${d.id}')">Устгах</button></div>`;
      }).join('');
    } catch (e) { el.innerHTML = ''; }
  }

  async function deleteAlert(id) {
    try { await db.collection('alerts').doc(id).delete(); showToast('Устгагдлаа'); renderMyAlerts(); }
    catch (e) { showToast('Устгахад алдаа гарлаа'); }
  }
