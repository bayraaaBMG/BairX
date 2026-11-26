  // ===== CONTACT BUTTONS + EVENT TRACKING + CONSENT =====
  // Shared by every listing, complex page and lead form:
  //  - contactButtonsHtml(): Залгах / Viber / WhatsApp / Мессеж row for one phone number
  //  - trackEvent(): fire-and-forget analytics write to the `events` collection (create-only
  //    for the public, admin-only read — see firestore.rules). Button clicks, page views and
  //    lead submissions all land here, which is what the admin "Хэмжилт" view counts.
  //  - consentCheckboxHtml()/consentGiven(): the mandatory privacy-consent checkbox every
  //    form that collects a name or phone number must carry.

  const SITE_HOTLINE = '72119435'; // BairX туслах утас (Аюулгүй байдал хуудсанд нийтлэгдсэн)

  // Mongolian numbers are 8 digits; accepts "9911-2233", "+976 99112233", "97699112233".
  function normalizeMnPhone(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('976')) d = d.slice(3);
    return d.length === 8 ? d : null;
  }

  // ---- Lead source (first-touch, per browser session) ----
  // utm_source > utm_medium > external referrer host > "direct". Stored once per session so a
  // lead submitted three pages later is still attributed to how the visitor actually arrived.
  function getLeadSource() {
    try {
      const cached = sessionStorage.getItem('bairxSource');
      if (cached) return cached;
      const p = new URLSearchParams(location.search);
      let src = p.get('utm_source') || p.get('ref') || '';
      if (!src && document.referrer) {
        const host = new URL(document.referrer).hostname;
        if (host && host !== location.hostname) src = host.replace(/^www\./, '');
      }
      src = (src || 'direct').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || 'direct';
      sessionStorage.setItem('bairxSource', src);
      return src;
    } catch (e) { return 'direct'; }
  }

  const TRACKED_EVENT_TYPES = ['contact_click', 'page_view', 'lead_submit', 'search'];
  function trackEvent(type, data) {
    if (!TRACKED_EVENT_TYPES.includes(type)) return;
    try {
      const d = data || {};
      const doc = {
        type,
        channel: String(d.channel || '').slice(0, 20),
        page: String(d.page || '').slice(0, 60),
        listingRef: String(d.listingRef || '').slice(0, 60),
        complexId: String(d.complexId || '').slice(0, 80),
        source: getLeadSource(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      db.collection('events').add(doc).catch(() => {});
    } catch (e) {}
  }

  function safeId(s) { return String(s || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80); }

  // listingRef: Firestore doc id for real listings, "demo-<id>" for seed data.
  function listingRefOf(l) { return l ? (l.firestoreId || ('demo-' + l.id)) : ''; }

  function trackContact(channel, listingRef, complexId) {
    trackEvent('contact_click', { channel, listingRef, complexId, page: currentPageName() });
  }

  function currentPageName() {
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    if (path) return path;
    return location.hash.replace('#', '') || 'home';
  }

  const ICON_PHONE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.39 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23 18l-.08-1.08z"/></svg>';
  const ICON_MSG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const ICON_VIBER = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.5 2 3 4.8 3 10.5c0 3 1 5 2.8 6.3V21l3.3-2.6c.9.2 1.9.3 2.9.3 5.5 0 9-2.8 9-8.2S17.5 2 12 2z"/><path d="M9 8.5c.5 2.5 2 4 4.5 5"/></svg>';
  const ICON_WA = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21l1.7-4.6A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1-1.2 2 .9c-.2 1.3-1.2 2-2.5 1.8-3-.5-5.5-3-6-6-.2-1.3.5-2.3 1.8-2.5l.9 2z"/></svg>';

  // phone: raw seller/agent phone. ctx: { listingRef, complexId, message }.
  // Returns '' when the number is not a valid Mongolian number — callers show their own
  // "дугаар байхгүй" text rather than a button that dials nothing.
  function contactButtonsHtml(phone, ctx) {
    const n = normalizeMnPhone(phone);
    if (!n) return '';
    const c = ctx || {};
    // Only id-safe characters ever reach the inline onclick (see revealPhone's note in
    // listing-detail.js on why HTML-escaping alone isn't enough inside a JS string).
    const ref = safeId(c.listingRef);
    const cx = safeId(c.complexId);
    const text = encodeURIComponent(c.message || 'Сайн байна уу, BairX дээрх зарын талаар асуух гэсэн юм.');
    const t = (ch) => `onclick="trackContact('${ch}','${ref}','${cx}')"`;
    return `<div class="contact-btns">
      <a class="cbtn cbtn-call" href="tel:+976${n}" ${t('tel')}>${ICON_PHONE}<span>Залгах</span></a>
      <a class="cbtn cbtn-viber" href="viber://chat?number=%2B976${n}" ${t('viber')}>${ICON_VIBER}<span>Viber</span></a>
      <a class="cbtn cbtn-wa" href="https://wa.me/976${n}?text=${text}" target="_blank" rel="noopener" ${t('whatsapp')}>${ICON_WA}<span>WhatsApp</span></a>
      <a class="cbtn cbtn-sms" href="sms:+976${n}?body=${text}" ${t('sms')}>${ICON_MSG}<span>Мессеж</span></a>
    </div>`;
  }

  // Mobile bottom-nav "Залгах": on an open real listing it reveals that seller's contact
  // options; everywhere else it dials the BairX hotline.
  function mbnCall() {
    const m = location.hash.match(/^#listing-(\d+)/);
    if (m) {
      const id = parseInt(m[1], 10);
      const l = listings.find(x => x.id === id);
      if (l && !l.isDemo && sellerData[id] && normalizeMnPhone(sellerData[id].phone)) {
        revealPhone(String(id));
        const box = document.getElementById('contactBox_' + id);
        if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    trackContact('tel', '', '');
    location.href = 'tel:+976' + SITE_HOTLINE;
  }

  // ---- Consent checkbox (mandatory on every form that collects name/phone) ----
  function consentCheckboxHtml(id) {
    return `<label class="consent-row" for="${id}">
      <input type="checkbox" id="${id}" required />
      <span><a href="/privacy" target="_blank" rel="noopener">Нууцлалын бодлого</a>той танилцаж зөвшөөрч байна <span class="req">*</span></span>
    </label>`;
  }
  function consentGiven(id) {
    const el = document.getElementById(id);
    if (el && el.checked) return true;
    showToast('Нууцлалын бодлоготой танилцаж зөвшөөрлөө тэмдэглэнэ үү');
    if (el) { el.focus(); el.closest('.consent-row')?.classList.add('consent-missing'); }
    return false;
  }

  // Record the landing source as early as possible (before any in-app navigation).
  getLeadSource();
