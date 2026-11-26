  // ===== PRIVACY POLICY · OPT-OUT · ACCOUNT DELETION =====
  // /privacy  — what is collected, who it is shared with, how to get it deleted
  // /optout   — "Зараа хасуулах": anyone (no account needed) asks for a listing to be removed
  // deleteMyAccount() — "Бүртгэлээ устгах" in Миний тохиргоо: Firestore data + Storage photos
  //                     + the Firebase Auth user itself

  const SITE_SUPPORT_EMAIL = 'bbayraa20@gmail.com';
  const PRIVACY_UPDATED = '2026-11-26';

  const PRIVACY_HTML = `
    <p class="route-updated">Шинэчилсэн: ${PRIVACY_UPDATED}</p>
    <p>Энэ бодлого нь BairX (bairx.vercel.app) ямар хувийн мэдээлэл цуглуулдаг, түүнийг хэнтэй хуваалцдаг, та өөрийн мэдээллийг хэрхэн устгуулах боломжтойг тайлбарлана.</p>

    <h3>1. Бид ямар мэдээлэл цуглуулдаг вэ?</h3>
    <ul>
      <li><strong>Бүртгэл:</strong> нэр, и-мэйл хаяг эсвэл утасны дугаар (SMS кодоор нэвтэрсэн бол), Google-ээр нэвтэрсэн бол Google профайлын нэр, зураг. Нууц үгийг бид хадгалдаггүй — Firebase Authentication хадгалж, шалгадаг.</li>
      <li><strong>Зар:</strong> байршил, үнэ, талбай, өрөө, давхар, зураг, тайлбар, зар дээр харуулах нэр болон утасны дугаар.</li>
      <li><strong>Лид (хүсэлт):</strong> "Байраа үнэлүүлэх", "Мэдэгдэл авах", "Холбогдох" зэрэг форм бөглөхөд таны нэр, утас, төсөв, сонирхсон хотхон, зөвшөөрөл өгсөн огноо, та сайт руу хаанаас орж ирсэн (жишээ нь facebook, google).</li>
      <li><strong>Мэдэгдлийн тохиргоо:</strong> төсөв, өрөөний тоо, хотхон, мэдэгдэл хүлээн авах суваг.</li>
      <li><strong>Хэмжилт:</strong> аль товч дарагдсан (Залгах, Viber, WhatsApp, Мессеж), аль хуудас үзэгдсэн. Эдгээр бичлэгт таны нэр, утас, хэрэглэгчийн ID-г хадгалдаггүй.</li>
      <li><strong>Тооцоолуур:</strong> зээлийн тооцоолуурт оруулсан орлого, урьдчилгаа зэрэг утга зөвхөн таны төхөөрөмж дээр байна, бид хадгалдаггүй.</li>
    </ul>

    <h3>2. Хэнтэй хуваалцдаг вэ?</h3>
    <ul>
      <li><strong>Нийтэд:</strong> зар дээр таны өөрөө оруулсан нэр, утасны дугаар бүх зочинд харагдана.</li>
      <li><strong>BairX-ийн ажилтан:</strong> лид, зараа хасуулах хүсэлтийг зөвхөн BairX-ийн админ харна. Бусад хэрэглэгч, зочин унших боломжгүй.</li>
      <li><strong>Агент, зар эзэмшигч:</strong> та тодорхой зар эсвэл хотхоны талаар холбогдохыг хүссэн тохиолдолд л таны нэр, утсыг тухайн зарын эзэн эсвэл түнш агентад дамжуулна.</li>
      <li><strong>Үйлчилгээ үзүүлэгч:</strong> Google Firebase (нэвтрэлт, мэдээллийн сан, зураг хадгалалт) болон Vercel (вэб хостинг) нь бидний өмнөөс өгөгдлийг хадгалж, боловсруулна.</li>
      <li>Бид таны мэдээллийг худалддаггүй. Монгол Улсын хууль тогтоомжоор албан ёсоор шаардсан тохиолдолд эрх бүхий байгууллагад өгч болно.</li>
    </ul>

    <h3>3. Хэрхэн устгуулах вэ?</h3>
    <ul>
      <li><strong>Бүртгэлээ бүрэн устгах:</strong> нэвтэрч ороод "Миний самбар" → "Миний тохиргоо" → "Бүртгэлээ устгах". Таны профайл, бүх зар, зарын зураг, хадгалсан зар, хадгалсан хайлт, мэдэгдлийн тохиргоо, мэдэгдлүүд болон нэвтрэх бүртгэл тэр даруй устана. Чатаар илгээсэн зурвас харилцагчийн талд үлдэнэ.</li>
      <li><strong>Зараа хасуулах:</strong> таны байрыг таны зөвшөөрөлгүй тавьсан, эсвэл бүртгэлгүйгээр зараа хасуулах бол <a href="/optout" onclick="return go(event, '/optout')">Зараа хасуулах</a> формыг бөглөнө үү. Бид 3 ажлын өдөрт багтаан шийдвэрлэнэ.</li>
      <li><strong>Лидийн мэдээллээ устгуулах:</strong> форм бөглөхдөө үлдээсэн нэр, утсаа устгуулах бол мөн <a href="/optout" onclick="return go(event, '/optout')">энэ формоор</a> эсвэл <a href="mailto:${SITE_SUPPORT_EMAIL}">${SITE_SUPPORT_EMAIL}</a> хаягаар хүсэлт илгээнэ үү.</li>
    </ul>

    <h3>4. Зөвшөөрөл</h3>
    <p>Нэр, утас цуглуулдаг форм бүр дээр "Нууцлалын бодлоготой танилцаж зөвшөөрч байна" гэсэн тэмдэглэгээг заавал хийнэ. Зөвшөөрлөө хүссэн үедээ дээрх аргаар цуцалж болно.</p>

    <h3>5. Үнэ, үнэлгээний тооны тухай</h3>
    <p>Хотхоны 1 м²-ийн дундаж үнэ, хямд зарын жагсаалт, байрны ойролцоо үнэлгээ нь BairX дээрх идэвхтэй зар болон бүртгэгдсэн хэлцлийн өгөгдлөөс өдөр бүр автоматаар тооцоологдоно. Тооцоо бүрийн дэргэд аргачлал болон шинэчилсэн огноо харагдана. Энэ нь мэргэжлийн үнэлгээ биш.</p>

    <h3>6. Холбоо барих</h3>
    <p>Асуулт, гомдол: <a href="mailto:${SITE_SUPPORT_EMAIL}">${SITE_SUPPORT_EMAIL}</a> · Утас: 7211-9435</p>
  `;

  function openPrivacyPage() { go(null, '/privacy'); }

  registerRoute(/^\/privacy$/, () => ({
    title: 'Нууцлалын бодлого — BairX',
    description: 'BairX ямар мэдээлэл цуглуулдаг, хэнтэй хуваалцдаг, хэрхэн устгуулах вэ.',
    html: `<div class="route-page route-legal">
      <div class="route-eyebrow">Хувийн мэдээллийн хамгаалалт</div>
      <h1 class="route-title">Нууцлалын бодлого</h1>
      <div class="route-body">${PRIVACY_HTML}</div>
    </div>`
  }));

  // ---- /optout ----
  const OPTOUT_REASONS = {
    not_mine: 'Миний байрыг миний зөвшөөрөлгүй тавьсан',
    sold: 'Зарагдсан / түрээслэгдсэн',
    wrong_info: 'Мэдээлэл буруу',
    delete_lead: 'Миний үлдээсэн нэр, утсыг устгана уу',
    other: 'Бусад'
  };

  registerRoute(/^\/optout$/, () => ({
    title: 'Зараа хасуулах — BairX',
    description: 'BairX дээрх зараа эсвэл үлдээсэн мэдээллээ устгуулах хүсэлт.',
    html: `<div class="route-page route-narrow">
      <div class="route-eyebrow">Хүсэлт</div>
      <h1 class="route-title">Зараа хасуулах</h1>
      <p class="route-lead">Таны байрыг зөвшөөрөлгүй тавьсан, зарагдсан, эсвэл үлдээсэн нэр, утсаа устгуулах бол доорх формыг бөглөнө үү. Бүртгэл шаардлагагүй. Бид 3 ажлын өдөрт багтаан шийдвэрлэж, таны утсаар холбогдоно.</p>
      <form class="lead-form" id="optoutForm" onsubmit="submitOptout(event)">
        <label class="lf-field"><span>Зарын холбоос эсвэл дугаар</span>
          <input class="form-input" id="ooListing" maxlength="300" placeholder="https://bairx.vercel.app/#listing-12" /></label>
        <label class="lf-field"><span>Шалтгаан *</span>
          <select class="form-input" id="ooReason" required>
            ${Object.keys(OPTOUT_REASONS).map(k => `<option value="${k}">${OPTOUT_REASONS[k]}</option>`).join('')}
          </select></label>
        <label class="lf-field"><span>Таны нэр *</span>
          <input class="form-input" id="ooName" maxlength="80" required autocomplete="name" /></label>
        <label class="lf-field"><span>Утасны дугаар *</span>
          <input class="form-input" id="ooPhone" inputmode="numeric" maxlength="12" required placeholder="99112233" autocomplete="tel" /></label>
        <label class="lf-field"><span>Нэмэлт тайлбар</span>
          <textarea class="form-textarea" id="ooNote" rows="3" maxlength="1000"></textarea></label>
        ${consentCheckboxHtml('ooConsent')}
        <button class="btn btn-blue btn-lg" type="submit" id="ooSubmit">Хүсэлт илгээх</button>
      </form>
    </div>`
  }));

  async function submitOptout(e) {
    e.preventDefault();
    const name = document.getElementById('ooName').value.trim();
    const phone = normalizeMnPhone(document.getElementById('ooPhone').value);
    const listingRef = document.getElementById('ooListing').value.trim();
    const reason = document.getElementById('ooReason').value;
    if (!name) { showToast('Нэрээ оруулна уу'); return; }
    if (!phone) { showToast('8 оронтой утасны дугаар оруулна уу'); return; }
    if (reason !== 'delete_lead' && !listingRef) { showToast('Зарын холбоос эсвэл дугаарыг оруулна уу'); return; }
    if (!consentGiven('ooConsent')) return;
    const btn = document.getElementById('ooSubmit');
    btn.disabled = true; btn.textContent = 'Илгээж байна…';
    try {
      await db.collection('optoutRequests').add({
        listingRef: listingRef.slice(0, 300), reason, name: name.slice(0, 80), phone,
        note: document.getElementById('ooNote').value.trim().slice(0, 1000),
        consent: true, status: 'new', source: getLeadSource(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      document.getElementById('optoutForm').innerHTML = `<div class="lead-success"><strong>Хүсэлт хүлээн авлаа.</strong><br>Бид 3 ажлын өдөрт багтаан шийдвэрлэж, ${esc(phone)} дугаарт холбогдоно.</div>`;
    } catch (err) {
      console.error('optout submit failed:', err.code, err.message);
      showToast('Илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
      btn.disabled = false; btn.textContent = 'Хүсэлт илгээх';
    }
  }

  // ---- Account deletion ----
  function openDeleteAccount() {
    if (!currentUser) { openAuth(); return; }
    if (currentUser.role === 'owner') { showToast('Эзэмшигчийн бүртгэлийг устгах боломжгүй'); return; }
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()" aria-label="Хаах">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow" style="color:var(--danger);">Анхаар</span>
        <div class="al-title" style="margin-bottom:12px;">Бүртгэлээ устгах</div>
        <p style="font-size:14px;color:var(--ink-3);margin-bottom:12px;">Дараах мэдээлэл <strong>бүрмөсөн</strong> устах ба сэргээх боломжгүй:</p>
        <ul style="font-size:13.5px;color:var(--ink-2);margin:0 0 16px 18px;line-height:1.7;">
          <li>Профайл (нэр, утас, и-мэйл, зураг)</li>
          <li>Таны бүх зар болон зарын зураг</li>
          <li>Хадгалсан зар, хадгалсан хайлт, мэдэгдлийн тохиргоо, мэдэгдлүүд</li>
          <li>Нэвтрэх бүртгэл</li>
        </ul>
        <p style="font-size:12.5px;color:var(--ink-3);margin-bottom:16px;">Чатаар илгээсэн зурвас харилцагчийн талд үлдэнэ.</p>
        <label class="lf-field"><span>Баталгаажуулахын тулд <strong>УСТГАХ</strong> гэж бичнэ үү</span>
          <input class="form-input" id="delConfirm" autocomplete="off" /></label>
        <button class="btn btn-lg" id="delAccountBtn" style="width:100%;justify-content:center;background:var(--danger);color:#fff;margin-top:8px;" onclick="deleteMyAccount()">Бүртгэлээ бүрмөсөн устгах</button>
      </div>`;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  async function deleteQueryDocs(q) {
    const snap = await q.get();
    await Promise.all(snap.docs.map(d => d.ref.delete()));
    return snap.size;
  }

  async function deleteMyAccount() {
    const fbUser = auth.currentUser;
    if (!fbUser || !currentUser) { openAuth(); return; }
    if ((document.getElementById('delConfirm')?.value || '').trim().toUpperCase() !== 'УСТГАХ') {
      showToast('"УСТГАХ" гэж бичиж баталгаажуулна уу'); return;
    }
    // Firebase only lets a user delete their own Auth record shortly after signing in. Check
    // first, BEFORE touching any data — otherwise the data would be gone but the account left.
    const lastSignIn = Date.parse(fbUser.metadata.lastSignInTime || 0);
    if (!lastSignIn || Date.now() - lastSignIn > 4 * 60 * 1000) {
      closeModal();
      showToast('Аюулгүй байдлын үүднээс дахин нэвтэрч ороод устгана уу', 'success');
      await auth.signOut();
      setTimeout(openAuth, 400);
      return;
    }
    const btn = document.getElementById('delAccountBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Устгаж байна…'; }
    const uid = fbUser.uid;
    try {
      await deleteQueryDocs(db.collection('listings').where('ownerId', '==', uid));
      await deleteQueryDocs(db.collection('favorites').where('userId', '==', uid));
      await deleteQueryDocs(db.collection('savedSearches').where('userId', '==', uid));
      await deleteQueryDocs(db.collection('notifications').where('userId', '==', uid));
      await deleteQueryDocs(db.collection('alerts').where('userId', '==', uid));
      try {
        const list = await storage.ref('listing-images/' + uid).listAll();
        await Promise.all(list.items.map(it => it.delete()));
      } catch (e) { console.error('storage cleanup failed:', e.code, e.message); }
      await db.collection('users').doc(uid).delete();
      await fbUser.delete();
      ['bairxUserListings', 'bairxFavorites', 'bairxSellerData', 'bairxBoostedListings'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
      closeModal();
      showToast('Таны бүртгэл болон мэдээлэл устгагдлаа', 'success');
      setTimeout(() => location.assign('/'), 1200);
    } catch (e) {
      console.error('deleteMyAccount failed:', e.code, e.message);
      if (e.code === 'auth/requires-recent-login') {
        closeModal();
        showToast('Дахин нэвтэрч ороод устгах товчийг дахин дарна уу');
        await auth.signOut();
        setTimeout(openAuth, 400);
        return;
      }
      showToast('Устгахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '') + '. ' + SITE_SUPPORT_EMAIL + ' хаягаар холбогдоно уу.');
      if (btn) { btn.disabled = false; btn.textContent = 'Бүртгэлээ бүрмөсөн устгах'; }
    }
  }
