  // ===== ADD LISTING FORM =====
  // Full unegui.mn-style property type list. Each type maps to one of the 4 filterable
  // buckets (apartment/house/land/office) so search/filter pills stay unchanged — the
  // specific type name is still stored and shown, just grouped under a bucket for filtering.
  const PROPERTY_TYPES = [
    { id: 'apartment', name: 'Орон сууц', desc: 'Байр, апартмент', bucket: 'apartment',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M8 10h.01M8 14h.01M12 6h.01M12 10h.01M12 14h.01M16 6h.01M16 10h.01M16 14h.01"/></svg>' },
    { id: 'house', name: 'Хувийн сууц', desc: 'Хаус, тагт орон сууц', bucket: 'house',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12l9-9 9 9M5 10v11h14V10"/></svg>' },
    { id: 'ger', name: 'Монгол гэр', desc: 'Гэр, хашаатай', bucket: 'house',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 6v12H4V9l8-6z"/><path d="M12 3v18M4 13h16"/></svg>' },
    { id: 'yard-house', name: 'Хашаа байшин', desc: 'Хашаатай байшин', bucket: 'house',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="10" width="18" height="11" rx="1"/><path d="M7 10V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/></svg>' },
    { id: 'land', name: 'Газар', desc: 'Эзэмшил, барилгын', bucket: 'land',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M3 21l6-12 4 6 4-8 4 14"/></svg>' },
    { id: 'office', name: 'Оффис', desc: 'Захиргаа, ажлын байр', bucket: 'office',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/></svg>' },
    { id: 'commercial', name: 'Худалдаа, үйлчилгээ', desc: 'Дэлгүүр, үйлчилгээний талбай', bucket: 'office',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l1-5h16l1 5M4 9h16v11H4z"/><path d="M9 20v-6h6v6"/></svg>' },
    { id: 'warehouse', name: 'Үйлдвэр, агуулах', desc: 'Агуулах, объект', bucket: 'office',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 20V9l10-6 10 6v11H2z"/><path d="M2 9l10 6 10-6"/></svg>' },
    { id: 'garage', name: 'Гараж, контейнер', desc: 'Гараж, з-сууц', bucket: 'house',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V9l9-6 9 6v12"/><path d="M5 21v-8h14v8"/></svg>' },
    { id: 'cottage', name: 'АОС, зуслан', desc: 'Хаус, амралтын газар', bucket: 'house',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21V11L12 4l8 7v10"/><path d="M9 21v-6h6v6"/></svg>' },
    { id: 'basement', name: '00-н өрөө, подвал', desc: 'В1, доод давхар', bucket: 'apartment',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 15h16"/></svg>' },
    { id: 'dorm', name: 'Нийтийн байр', desc: 'Дотуур байр', bucket: 'apartment',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h6M3 15h6M15 9h6M15 15h6"/></svg>' },
    { id: 'meeting-room', name: 'Хурлын өрөө, заал', desc: 'Хурал, арга хэмжээний танхим', bucket: 'office',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="12" cy="12" r="4"/></svg>' },
    { id: 'daily', name: 'Хоногоор байр', desc: 'Хоног/цагаар түрээслэх', bucket: 'house',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' },
    { id: 'hostel', name: 'Hostel', desc: 'Хостел', bucket: 'apartment',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 18h18M6 9V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>' },
    { id: 'other', name: 'Бусад', desc: 'Дээрхэд ороогүй', bucket: 'house',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' }
  ];
  function propertyTypeBucket(id) {
    return (PROPERTY_TYPES.find(t => t.id === id) || {}).bucket || 'apartment';
  }

  // Approximate real-world district centers (Улаанбаатар), used to center the location
  // picker map before the user places their own exact pin.
  const DISTRICT_CENTERS = {
    'khan-uul': [47.8864, 106.9057], 'sukhbaatar': [47.9184, 106.9177],
    'chingeltei': [47.9280, 106.8935], 'bayanzurkh': [47.9203, 106.9556],
    'bayangol': [47.9077, 106.8600], 'songinokhairkhan': [47.9298, 106.7600],
    'nalaikh': [47.7725, 107.2506], 'bagakhangai': [47.5497, 106.7644],
    'baganuur': [47.8093, 108.3722]
  };
  const UB_CENTER = [47.9184, 106.9177];

  let editingListingId = null;

  function editMyListing(id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    editingListingId = id;
    const districtKeys = {
      'Хан-Уул': 'khan-uul', 'Сүхбаатар': 'sukhbaatar', 'Чингэлтэй': 'chingeltei',
      'Баянзүрх': 'bayanzurkh', 'Баянгол': 'bayangol', 'Сонгинохайрхан': 'songinokhairkhan',
      'Налайх': 'nalaikh', 'Багахангай': 'bagakhangai', 'Багануур': 'baganuur'
    };
    Object.assign(addListingState, {
      step: 2,
      intent: l.cat === 'rent' ? 'rent' : 'sell',
      propertyType: l.propertyType || (l.cat === 'rent' ? 'apartment' : l.cat),
      title: l.title,
      district: districtKeys[l.district] || l.district,
      khoroo: l.khoroo ? String(l.khoroo) : '',
      address: l.loc,
      geoLat: l.geoLat || null,
      geoLng: l.geoLng || null,
      area: String(l.area),
      rooms: String(l.rooms),
      bedrooms: l.bedrooms ? String(l.bedrooms) : '',
      bathrooms: l.bathrooms ? String(l.bathrooms) : '',
      floor: (l.floor || '').split('/')[0] || '',
      totalFloors: (l.floor || '').split('/')[1] || '',
      year: String(l.year),
      buildingName: l.buildingName || '',
      complex: l.complex || '',
      price: String(l.price),
      buildingType: l.buildingType || '',
      heating: l.heating || '',
      insulationType: l.insulationType || '',
      windowDirection: l.windowDirection || '',
      hoaFee: l.hoaFee ? String(l.hoaFee) : '',
      condition: l.condition || '',
      deposit: l.deposit ? String(l.deposit) : '',
      minTerm: l.minTerm || '',
      description: '',
      features: Array.isArray(l.features) ? l.features.slice() : [],
      images: listingExtras[l.id]?.gallery || (l.img ? [l.img] : []),
      videoUrl: l.videoUrl || '',
      tourUrl: l.tourUrl || '',
      floorPlan: l.floorPlan || null,
      phone: '',
      name: ''
    });
    document.getElementById('modalContent').innerHTML = renderAddListing();
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(attachAddListingHandlers, 50);
  }

  let addListingState = {
    step: 1,
    // Step 1
    intent: 'sell', // sell, rent, exchange
    propertyType: '', // apartment, house, land, office
    // Step 2 - basic info
    title: '',
    district: '',
    khoroo: '',
    address: '',
    geoLat: null,
    geoLng: null,
    area: '',
    rooms: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    totalFloors: '',
    year: '',
    buildingName: '',
    complex: '',
    // Step 3 - details
    price: '',
    buildingType: '',
    heating: '',
    insulationType: '',
    windowDirection: '',
    hoaFee: '',
    condition: '',
    deposit: '',
    minTerm: '',
    description: '',
    features: [],
    // Step 4 - images
    images: [],
    videoUrl: '',
    tourUrl: '',
    floorPlan: null,
    // Step 5 - contact
    phone: '',
    name: '',
    role: 'owner', // owner, agent, company
    plan: 'basic' // basic, vip, featured
  };

  function openAddListing() {
    addListingState.step = 1;
    // Default the "Та хэн вэ?" role to the account's saved identity (Миний тохиргоо) so
    // it stays consistent across listings instead of resetting to "owner" every time —
    // still overridable per listing in Step 5.
    if (currentUser?.accountType) addListingState.role = currentUser.accountType;
    document.getElementById('modalContent').innerHTML = renderAddListing();
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(attachAddListingHandlers, 50);
  }

  function renderAddListing() {
    return `
      <button class="modal-close" onclick="confirmCloseAddListing()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="add-listing">
        <div class="al-header">
          <span class="al-eyebrow">Шинэ зар нийтлэх</span>
          <div class="al-title">Үл хөдлөх хөрөнгөө BairX дээр зарлаарай</div>
          <div class="al-sub">Бүх алхамыг бөглөж дуусгахад ойролцоогоор 4-6 минут зарцуулагдана.</div>
        </div>

        <!-- Stepper -->
        <div class="stepper">
          ${[
            { n: 1, name: 'Төрөл' },
            { n: 2, name: 'Үндсэн мэдээлэл' },
            { n: 3, name: 'Дэлгэрэнгүй' },
            { n: 4, name: 'Зураг' },
            { n: 5, name: 'Холбоо барих' }
          ].map(s => `
            <div class="step ${addListingState.step === s.n ? 'active' : ''} ${addListingState.step > s.n ? 'done' : ''}">
              <div class="step-num">${addListingState.step > s.n ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : s.n}</div>
              <span class="step-name">${s.name}</span>
            </div>
          `).join('')}
        </div>

        ${renderStep1()}
        ${renderStep2()}
        ${renderStep3()}
        ${renderStep4()}
        ${renderStep5()}
        ${renderSuccess()}
      </div>
    `;
  }

  function renderStep1() {
    const active = addListingState.step === 1;
    return `
      <div class="step-panel ${active ? 'active' : ''}" data-step="1">
        <div class="step-section-title">Зарын зорилго</div>
        <div class="step-section-sub">Та юу хийхийг хүсэж байна вэ?</div>

        <div class="intent-grid" style="margin-bottom:28px;">
          <button class="intent-card ${addListingState.intent === 'sell' ? 'active' : ''}" data-intent="sell">
            <div class="intent-card-name">Худалдах</div>
            <div class="intent-card-desc">Үл хөдлөх хөрөнгөө бүрэн зарж борлуулах</div>
          </button>
          <button class="intent-card ${addListingState.intent === 'rent' ? 'active' : ''}" data-intent="rent">
            <div class="intent-card-name">Түрээслүүлэх</div>
            <div class="intent-card-desc">Сар, жилийн түрээсээр гаргах</div>
          </button>
          <button class="intent-card ${addListingState.intent === 'exchange' ? 'active' : ''}" data-intent="exchange">
            <div class="intent-card-name">Солилцох / Бартер</div>
            <div class="intent-card-desc">Өөр үл хөдлөх хөрөнгөөр солих</div>
          </button>
        </div>

        <div class="step-section-title">Үл хөдлөх хөрөнгийн төрөл</div>
        <div class="step-section-sub">Зөв ангилал нь зөв хайлтын үр дүнг авчирна</div>

        <div class="type-grid">
          ${PROPERTY_TYPES.map(t => `
            <button class="type-card ${addListingState.propertyType === t.id ? 'active' : ''}" data-type="${t.id}">
              <div class="type-card-icon">${t.icon}</div>
              <div class="type-card-name">${t.name}</div>
              <div class="type-card-desc">${t.desc}</div>
            </button>
          `).join('')}
        </div>

        <div class="step-nav">
          <button class="btn btn-ghost btn-back" onclick="closeModal()">Цуцлах</button>
          <button class="btn btn-blue btn-lg" onclick="nextStep(1)">
            Үргэлжлүүлэх
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  // Which extra field set a property type shows: 'land' keeps its existing zoning
  // fields; 'commercial' (office/warehouse/commercial-space) skips residential-only
  // fields like bedrooms or balcony; everything else gets the full residential set.
  function listingFieldGroup() {
    const isLand = addListingState.propertyType === 'land';
    if (isLand) return 'land';
    return propertyTypeBucket(addListingState.propertyType) === 'office' ? 'commercial' : 'residential';
  }

  function renderStep2() {
    const active = addListingState.step === 2;
    const isLand = addListingState.propertyType === 'land';
    const fieldGroup = listingFieldGroup();
    const isResidential = fieldGroup === 'residential';
    return `
      <div class="step-panel ${active ? 'active' : ''}" data-step="2">
        <div class="step-section-title">Үндсэн мэдээлэл</div>
        <div class="step-section-sub">Зар үзэгчдэд хамгийн чухал суурь мэдээлэл</div>

        <div class="form-row">
          <label class="form-label">Зарын гарчиг<span class="req">*</span> <span class="hint">— богино, ойлгомжтой</span></label>
          <input type="text" class="form-input" id="alTitle" placeholder="Жнь: Зайсан, шинэ барилга 2 өрөө, засвартай" value="${addListingState.title}" maxlength="80" />
          <div class="form-err-msg">Гарчгийг бөглөнө үү (10-аас доошгүй тэмдэгт)</div>
        </div>

        <div class="form-grid-2">
          <div>
            <label class="form-label">Дүүрэг<span class="req">*</span></label>
            <select class="form-select" id="alDistrict">
              <option value="">Сонгох...</option>
              <option value="khan-uul" ${addListingState.district === 'khan-uul' ? 'selected' : ''}>Хан-Уул</option>
              <option value="sukhbaatar" ${addListingState.district === 'sukhbaatar' ? 'selected' : ''}>Сүхбаатар</option>
              <option value="chingeltei" ${addListingState.district === 'chingeltei' ? 'selected' : ''}>Чингэлтэй</option>
              <option value="bayanzurkh" ${addListingState.district === 'bayanzurkh' ? 'selected' : ''}>Баянзүрх</option>
              <option value="bayangol" ${addListingState.district === 'bayangol' ? 'selected' : ''}>Баянгол</option>
              <option value="songinokhairkhan" ${addListingState.district === 'songinokhairkhan' ? 'selected' : ''}>Сонгинохайрхан</option>
              <option value="nalaikh" ${addListingState.district === 'nalaikh' ? 'selected' : ''}>Налайх</option>
              <option value="bagakhangai" ${addListingState.district === 'bagakhangai' ? 'selected' : ''}>Багахангай</option>
              <option value="baganuur" ${addListingState.district === 'baganuur' ? 'selected' : ''}>Багануур</option>
            </select>
            <div class="form-err-msg">Дүүрэг сонгоно уу</div>
          </div>
          <div>
            <label class="form-label">Хороо</label>
            <input type="number" class="form-input" id="alKhoroo" placeholder="Жнь: 11" min="1" max="50" value="${addListingState.khoroo}" />
          </div>
        </div>

        ${fieldGroup !== 'land' ? `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Барилгын нэр <span class="hint">— заавал биш</span></label>
            <input type="text" class="form-input" id="alBuildingName" placeholder="Жнь: Хүннү 2222" value="${addListingState.buildingName}" />
          </div>
          <div>
            <label class="form-label">Хотхон</label>
            <input type="text" class="form-input" id="alComplex" placeholder="Жнь: Зайсан Тольт" value="${addListingState.complex}" />
          </div>
        </div>
        ` : ''}

        <div class="form-row">
          <label class="form-label">Дэлгэрэнгүй хаяг <span class="hint">— хороолол, барилгын нэр</span></label>
          <input type="text" class="form-input" id="alAddress" placeholder="Жнь: Зайсан, Хүннү 2222 хороолол" value="${addListingState.address}" />
        </div>

        <div class="form-row">
          <label class="form-label">Байршил <span class="hint">— газрын зураг дээр тодорхой цэгээ тэмдэглэнэ үү</span></label>
          ${addListingState.geoLat ? `
            <div id="alMapPicker" style="height:220px; border-radius:12px; overflow:hidden; border:1px solid var(--line);"></div>
            <button type="button" class="btn btn-ghost" style="margin-top:8px;" onclick="clearListingLocation()">Цэгийг арилгах</button>
          ` : `
            <button type="button" class="btn btn-ghost" style="width:100%; justify-content:center; border:1.5px solid var(--line-2);" onclick="openListingMapPicker()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Газрын зураг дээр байршил тэмдэглэх
            </button>
          `}
        </div>

        <div class="form-grid-3">
          <div>
            <label class="form-label">Талбай (м²)<span class="req">*</span></label>
            <input type="number" class="form-input" id="alArea" placeholder="78" value="${addListingState.area}" min="1" />
            <div class="form-err-msg">Талбайн хэмжээ оруулна уу</div>
          </div>
          ${!isLand ? `
          <div>
            <label class="form-label">Өрөөний тоо<span class="req">*</span></label>
            <select class="form-select" id="alRooms">
              <option value="">Сонгох...</option>
              <option value="1" ${addListingState.rooms === '1' ? 'selected' : ''}>1 өрөө (студи)</option>
              <option value="2" ${addListingState.rooms === '2' ? 'selected' : ''}>2 өрөө</option>
              <option value="3" ${addListingState.rooms === '3' ? 'selected' : ''}>3 өрөө</option>
              <option value="4" ${addListingState.rooms === '4' ? 'selected' : ''}>4 өрөө</option>
              <option value="5" ${addListingState.rooms === '5' ? 'selected' : ''}>5 өрөө</option>
              <option value="6+" ${addListingState.rooms === '6+' ? 'selected' : ''}>6+ өрөө</option>
            </select>
            <div class="form-err-msg">Өрөөний тоо сонгоно уу</div>
          </div>
          <div>
            <label class="form-label">Барилгын насжилт</label>
            <input type="number" class="form-input" id="alYear" placeholder="2022" min="1950" max="2030" value="${addListingState.year}" />
          </div>
          ` : `
          <div>
            <label class="form-label">Зориулалт</label>
            <select class="form-select" id="alRooms">
              <option value="">Сонгох...</option>
              <option value="residential">Орон сууцны</option>
              <option value="commercial">Худалдаа үйлчилгээний</option>
              <option value="industrial">Үйлдвэрлэлийн</option>
              <option value="agricultural">Хөдөө аж ахуйн</option>
            </select>
          </div>
          <div>
            <label class="form-label">Дэд бүтэц</label>
            <select class="form-select" id="alYear">
              <option value="">Сонгох...</option>
              <option value="full">Цахилгаан, ус, дулаан</option>
              <option value="electric">Зөвхөн цахилгаан</option>
              <option value="none">Дэд бүтэцгүй</option>
            </select>
          </div>
          `}
        </div>

        ${isResidential ? `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Унтлагын өрөө</label>
            <input type="number" class="form-input" id="alBedrooms" placeholder="2" min="0" max="20" value="${addListingState.bedrooms}" />
          </div>
          <div>
            <label class="form-label">Ариун цэврийн өрөө</label>
            <input type="number" class="form-input" id="alBathrooms" placeholder="1" min="0" max="10" value="${addListingState.bathrooms}" />
          </div>
        </div>
        ` : ''}

        ${!isLand ? `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Хэддүгээр давхар</label>
            <input type="number" class="form-input" id="alFloor" placeholder="5" min="1" max="50" value="${addListingState.floor}" />
          </div>
          <div>
            <label class="form-label">Нийт давхар</label>
            <input type="number" class="form-input" id="alTotalFloors" placeholder="12" min="1" max="50" value="${addListingState.totalFloors}" />
          </div>
        </div>
        ` : ''}

        <div class="step-nav">
          <button class="btn btn-ghost btn-back" onclick="prevStep(2)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Буцах
          </button>
          <button class="btn btn-blue btn-lg" onclick="nextStep(2)">
            Үргэлжлүүлэх
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  // ===== LOCATION PICKER (real Leaflet/OpenStreetMap — no API key needed) =====
  let listingPickerMap = null;
  let listingPickerMarker = null;
  let listingPreviewMap = null;

  function openListingMapPicker() {
    saveStepData(2);
    const start = (addListingState.geoLat && addListingState.geoLng)
      ? [addListingState.geoLat, addListingState.geoLng]
      : (DISTRICT_CENTERS[addListingState.district] || UB_CENTER);
    document.getElementById('modalContent').innerHTML = `
      <div style="padding:0;">
        <div style="display:flex; align-items:center; gap:12px; padding:20px 24px 12px;">
          <button class="btn btn-ghost" onclick="document.getElementById('modalContent').innerHTML = renderAddListing(); setTimeout(attachAddListingHandlers, 50);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div style="font-weight:700; font-size:16px;">Байршил</div>
        </div>
        <div id="alMapPickerFull" style="height:60vh; min-height:320px;"></div>
        <div style="padding:16px 24px;">
          <div style="font-size:12px; color:var(--ink-3); margin-bottom:12px;">Газрын зураг дээр товшиж эсвэл цэгийг чирж яг байршлаа тэмдэглэнэ үү.</div>
          <button class="btn btn-blue btn-lg" style="width:100%; justify-content:center;" onclick="saveListingLocation()">Газрын зураг дээр байршлыг хадгалах</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      listingPickerMap = L.map('alMapPickerFull').setView(start, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
      }).addTo(listingPickerMap);
      listingPickerMarker = L.marker(start, { draggable: true }).addTo(listingPickerMap);
      listingPickerMap.on('click', (e) => listingPickerMarker.setLatLng(e.latlng));
    }, 50);
  }

  function saveListingLocation() {
    if (!listingPickerMarker) return;
    const pos = listingPickerMarker.getLatLng();
    addListingState.geoLat = pos.lat;
    addListingState.geoLng = pos.lng;
    document.getElementById('modalContent').innerHTML = renderAddListing();
    setTimeout(attachAddListingHandlers, 50);
  }

  function clearListingLocation() {
    addListingState.geoLat = null;
    addListingState.geoLng = null;
    document.getElementById('modalContent').innerHTML = renderAddListing();
    setTimeout(attachAddListingHandlers, 50);
  }

  // Small read-only preview map shown on step 2 once a location pin has been saved.
  function initListingLocationPreview() {
    const el = document.getElementById('alMapPicker');
    if (!el || !addListingState.geoLat) return;
    if (listingPreviewMap) { listingPreviewMap.remove(); listingPreviewMap = null; }
    const pos = [addListingState.geoLat, addListingState.geoLng];
    listingPreviewMap = L.map('alMapPicker', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView(pos, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(listingPreviewMap);
    L.marker(pos).addTo(listingPreviewMap);
  }

  function renderStep3() {
    const active = addListingState.step === 3;
    const isLand = addListingState.propertyType === 'land';
    const fieldGroup = listingFieldGroup();
    const isResidential = fieldGroup === 'residential';
    return `
      <div class="step-panel ${active ? 'active' : ''}" data-step="3">
        <div class="step-section-title">Үнэ ба дэлгэрэнгүй</div>
        <div class="step-section-sub">Үнэ, барилгын чанарын мэдээлэл</div>

        <div class="form-row">
          <label class="form-label">Үнэ (сая ₮)<span class="req">*</span></label>
          <input type="number" class="form-input" id="alPrice" placeholder="Жнь: 412" min="1" step="0.5" value="${addListingState.price}" />
          <div class="form-err-msg">Үнэ оруулна уу</div>
          <div id="pricePerSqmBox" style="margin-top:8px;"></div>
          <div id="priceSuggestBox"></div>
        </div>

        ${!isLand ? `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Барилгын төрөл</label>
            <select class="form-select" id="alBuildingType">
              <option value="">Сонгох...</option>
              <option value="reinforced-concrete">Цутгамал төмөр бетон</option>
              <option value="brick">Хийц өрлөгийн (керамзитбетон)</option>
              <option value="panel">Угсармал панель</option>
              <option value="frame">Каркасан хийц</option>
              <option value="wooden">Модон</option>
            </select>
          </div>
          <div>
            <label class="form-label">Халаалт</label>
            <select class="form-select" id="alHeating">
              <option value="">Сонгох...</option>
              <option value="central">Төвлөрсөн халаалт</option>
              <option value="gas">Хийн зуух (бие даасан)</option>
              <option value="electric">Цахилгаан халаагуур</option>
              <option value="solid">Хатуу түлшний</option>
              <option value="floor">Шалны халаалт</option>
            </select>
          </div>
        </div>

        ${isResidential ? `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Цонхны чиглэл</label>
            <select class="form-select" id="alWindowDirection">
              <option value="">Сонгох...</option>
              <option value="north">Хойд</option>
              <option value="south">Урд</option>
              <option value="east">Дорнод</option>
              <option value="west">Өрнөд</option>
              <option value="southeast">Урд-Дорнод</option>
              <option value="southwest">Урд-Өрнөд</option>
              <option value="northeast">Хойд-Дорнод</option>
              <option value="northwest">Хойд-Өрнөд</option>
            </select>
          </div>
          <div>
            <label class="form-label">Дулаалга</label>
            <select class="form-select" id="alInsulation">
              <option value="">Сонгох...</option>
              <option value="eps">Гадна EPS дулаалга</option>
              <option value="mw">Эрдэс ноос (MW)</option>
              <option value="pir">PIR (шинэ стандарт)</option>
              <option value="inside">Дотроос хийсэн</option>
              <option value="none">Дулаалгагүй</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">СӨХ-ийн төлбөр (₮/сар) <span class="hint">— заавал биш</span></label>
          <input type="number" class="form-input" id="alHoaFee" placeholder="Жнь: 80000" min="0" step="1000" value="${addListingState.hoaFee}" />
        </div>
        ` : ''}

        <div class="form-row">
          <label class="form-label">Засварын байдал</label>
          <select class="form-select" id="alCondition">
            <option value="">Сонгох...</option>
            <option value="white-box">Засваргүй (white box)</option>
            <option value="basic">Энгийн засвартай</option>
            <option value="renovated">Үндсэн засвартай</option>
            <option value="premium">Premium засвартай</option>
            <option value="furnished">Тавилгатай, бүрэн засвартай</option>
          </select>
        </div>

        <div class="form-row">
          <label class="form-label">Нэмэлт онцлогууд</label>
          <div class="toggle-grid">
            <div class="toggle-row" data-feature="parking">
              <span>Паркинг бий</span>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-row" data-feature="elevator">
              <span>Лифттэй</span>
              <div class="toggle-switch"></div>
            </div>
            ${isResidential ? `
            <div class="toggle-row" data-feature="balcony">
              <span>Тагттай</span>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-row" data-feature="basement">
              <span>Зоорьтой</span>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-row" data-feature="furnished">
              <span>Тавилгатай</span>
              <div class="toggle-switch"></div>
            </div>
            ` : ''}
            <div class="toggle-row" data-feature="loan">
              <span>Банкны зээлд хамрагдана</span>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-row" data-feature="negotiable">
              <span>Үнэ хэлэлцэх боломжтой</span>
              <div class="toggle-switch"></div>
            </div>
          </div>
        </div>

        ${addListingState.intent === 'rent' ? `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Барьцаа/Урьдчилгаа (сая ₮)</label>
            <input type="number" class="form-input" id="alDeposit" placeholder="Жнь: 2" min="0" step="0.5" value="${addListingState.deposit}" />
          </div>
          <div>
            <label class="form-label">Хамгийн бага хугацаа</label>
            <select class="form-select" id="alMinTerm">
              <option value="">Сонгох...</option>
              <option value="1m">1 сар</option>
              <option value="3m">3 сар</option>
              <option value="6m">6 сар</option>
              <option value="1y">1 жил+</option>
            </select>
          </div>
        </div>
        ` : ''}
        ` : ''}

        <div class="form-row">
          <label class="form-label">Дэлгэрэнгүй тайлбар<span class="req">*</span></label>
          <textarea class="form-textarea" id="alDescription" rows="5" placeholder="Үл хөдлөх хөрөнгийнхөө онцлог, давуу талыг тайлбарлана уу. Жнь: Зайсаны бизнес төвөөс 5 минутын зайтай, өмнөд талдаа задгай, наран гэрэлтэй..." maxlength="2000">${addListingState.description}</textarea>
          <div class="form-err-msg">Тайлбараа оруулна уу</div>
        </div>

        <div class="step-nav">
          <button class="btn btn-ghost btn-back" onclick="prevStep(3)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Буцах
          </button>
          <button class="btn btn-blue btn-lg" onclick="nextStep(3)">
            Үргэлжлүүлэх
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderStep4() {
    const active = addListingState.step === 4;
    return `
      <div class="step-panel ${active ? 'active' : ''}" data-step="4">
        <div class="step-section-title">Зурагнууд</div>
        <div class="step-section-sub">Тод, чанартай 5-15 зураг оруулна уу. Эхний зураг нь үндсэн зураг болно.</div>

        <div class="image-upload-grid" id="imageGrid">
          ${renderImageBoxes()}
        </div>

        <div class="price-suggest" style="margin-top: 20px;">
          <div class="price-suggest-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </div>
          <div>
            <strong>Чанартай зураг оруулах зөвлөмж:</strong> Гэрэл сайтай, цэвэрхэн өрөөг харуулна уу. Хамгийн багадаа дотор, гадна, гал тогоо, ванн өрөөний зургуудыг оруулна. Чанартай зурагтай зарууд 3 дахин хурдан зарагддаг.
          </div>
        </div>

        <div class="step-section-title" style="margin-top:28px;">Нэмэлт медиа <span class="hint">— заавал биш</span></div>
        <div class="step-section-sub">Байгаа бол оруулна уу — байхгүй бол хоосон орхиж болно</div>

        <div class="form-row">
          <label class="form-label">Видео холбоос <span class="hint">— YouTube эсвэл Vimeo линк</span></label>
          <input type="url" class="form-input" id="alVideoUrl" placeholder="https://youtube.com/watch?v=..." value="${addListingState.videoUrl || ''}" />
        </div>

        <div class="form-row">
          <label class="form-label">360° тойрох холбоос <span class="hint">— Matterport, Kuula гэх мэт embed линк</span></label>
          <input type="url" class="form-input" id="alTourUrl" placeholder="https://my.matterport.com/show/?m=..." value="${addListingState.tourUrl || ''}" />
        </div>

        <div class="form-row">
          <label class="form-label">Планировкын зураг (Floor plan)</label>
          ${addListingState.floorPlan ? `
            <div style="position:relative; display:inline-block;">
              <img src="${addListingState.floorPlan}" alt="" style="max-width:220px; border-radius:10px; border:1px solid var(--line); display:block;" />
              <button type="button" class="remove-img" style="position:absolute; top:6px; right:6px;" onclick="clearFloorPlan()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ` : `
            <label class="image-upload-box" for="floorPlanInput" style="max-width:220px;">
              <input type="file" id="floorPlanInput" accept="image/*" style="display:none" onchange="handleFloorPlanUpload(event)" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M3 9h18"/></svg>
              <div class="image-upload-text">Планировка оруулах</div>
              <div class="image-upload-hint">JPG, PNG</div>
            </label>
          `}
        </div>

        <div class="step-nav">
          <button class="btn btn-ghost btn-back" onclick="prevStep(4)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Буцах
          </button>
          <button class="btn btn-blue btn-lg" onclick="nextStep(4)">
            Үргэлжлүүлэх
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderImageBoxes() {
    const boxes = [];
    for (let i = 0; i < 8; i++) {
      const img = addListingState.images[i];
      if (img) {
        boxes.push(`
          <div class="image-upload-box has-image">
            ${i === 0 ? '<div class="main-badge">Үндсэн</div>' : ''}
            <button class="remove-img" onclick="removeImage(${i})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <img src="${img}" alt="">
          </div>
        `);
      } else {
        boxes.push(`
          <label class="image-upload-box" for="imgInput${i}">
            <input type="file" id="imgInput${i}" accept="image/*" style="display:none" onchange="handleImageUpload(event, ${i})" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>
            <div class="image-upload-text">${i === 0 ? 'Үндсэн зураг' : 'Зураг ' + (i + 1)}</div>
            <div class="image-upload-hint">JPG, PNG (5MB)</div>
          </label>
        `);
      }
    }
    return boxes.join('');
  }

  function renderStep5() {
    const active = addListingState.step === 5;
    return `
      <div class="step-panel ${active ? 'active' : ''}" data-step="5">
        <div class="step-section-title">Холбоо барих ба нийтлэх</div>
        <div class="step-section-sub">Худалдан авагчид зөвхөн энэ дугаараар холбогдоно</div>

        <div class="form-row">
          <label class="form-label" for="alPhone">Холбоо барих утасны дугаар<span class="req">*</span></label>
          <div class="phone-input-group">
            <div class="phone-prefix">+976</div>
            <input type="tel" class="form-input" id="alPhone" placeholder="88112233" maxlength="8" value="${addListingState.phone}" />
          </div>
          <div class="form-err-msg">Утасны дугаараа 8 оронтой зөв оруулна уу</div>
        </div>

        <div class="form-grid-2">
          <div>
            <label class="form-label">Таны нэр<span class="req">*</span></label>
            <input type="text" class="form-input" id="alName" placeholder="Жнь: Болд" value="${addListingState.name}" />
            <div class="form-err-msg">Нэрээ оруулна уу</div>
          </div>
          <div>
            <label class="form-label">Та хэн вэ?<span class="req">*</span></label>
            <select class="form-select" id="alRole">
              <option value="owner" ${addListingState.role === 'owner' ? 'selected' : ''}>Үл хөдлөхийн эзэн</option>
              <option value="agent" ${addListingState.role === 'agent' ? 'selected' : ''}>Үл хөдлөхийн агент</option>
              <option value="company" ${addListingState.role === 'company' ? 'selected' : ''}>Барилгын компани</option>
            </select>
          </div>
        </div>

        <div class="step-section-title" style="margin-top:24px;">Зарын үнэлгээний хувилбар</div>
        <div class="step-section-sub">Илүү харагдах зарууд илүү хурдан зарагдана</div>

        <div class="plan-grid">
          <button class="plan-card ${addListingState.plan === 'basic' ? 'active' : ''}" data-plan="basic">
            <div class="plan-name">Энгийн</div>
            <div class="plan-price">Үнэгүй</div>
            <div class="plan-price-period">30 хоног идэвхтэй</div>
            <ul class="plan-features">
              <li>30 хоног идэвхтэй</li>
              <li>8 хүртэл зураг</li>
              <li>Энгийн хайлтад харагдана</li>
            </ul>
          </button>
          <button class="plan-card recommend ${addListingState.plan === 'vip' ? 'active' : ''}" data-plan="vip">
            <div class="plan-name">VIP</div>
            <div class="plan-price">15,000 ₮ <span class="plan-price-period">/ зар</span></div>
            <div class="plan-price-period">60 хоног идэвхтэй</div>
            <ul class="plan-features">
              <li>60 хоног идэвхтэй</li>
              <li>8 хүртэл зураг</li>
              <li>"VIP" тэмдэглэгээтэй</li>
              <li>Хайлт болон нүүр хуудсанд эхэнд гарна</li>
            </ul>
          </button>
          <button class="plan-card ${addListingState.plan === 'featured' ? 'active' : ''}" data-plan="featured">
            <div class="plan-name">Онцлох</div>
            <div class="plan-price">35,000 ₮ <span class="plan-price-period">/ зар</span></div>
            <div class="plan-price-period">90 хоног идэвхтэй</div>
            <ul class="plan-features">
              <li>90 хоног идэвхтэй</li>
              <li>8 хүртэл зураг</li>
              <li>"VIP" тэмдэглэгээтэй</li>
              <li>Хайлт болон нүүр хуудсанд эхэнд гарна</li>
              <li>Хамгийн урт хугацаагаар идэвхтэй</li>
            </ul>
          </button>
        </div>

        <div style="padding:14px; background:var(--paper-2); border-radius:10px; font-size:12px; color:var(--ink-3); line-height:1.5;">
          Зар нийтлэхээр <a href="javascript:void(0)" style="color:var(--primary); font-weight:600;" onclick="saveStepData(5); openInfoPage('terms', 'addListing')">Үйлчилгээний нөхцөл</a> болон <a href="javascript:void(0)" style="color:var(--primary); font-weight:600;" onclick="saveStepData(5); openInfoPage('privacy', 'addListing')">Нууцлалын бодлого</a>-той зөвшөөрсөнд тооцогдоно. Хуурамч мэдээлэл оруулсан тохиолдолд зар нь устгагдаж, бүртгэл блоклогдох эрсдэлтэй.
        </div>

        <div class="step-nav">
          <button class="btn btn-ghost btn-back" onclick="prevStep(5)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Буцах
          </button>
          <button class="btn btn-blue btn-lg" onclick="submitListing()">
            Зар нийтлэх
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderSuccess() {
    const active = addListingState.step === 6;
    if (!active) return '';
    const listingId = 'BX-' + Date.now().toString().slice(-7);
    return `
      <div class="step-panel ${active ? 'active' : ''}">
        <div class="success-state">
          <div class="success-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="success-title">${addListingState._syncFailed ? 'Зар энэ төхөөрөмж дээр хадгалагдлаа' : 'Зар амжилттай нийтлэгдлээ'}</div>
          <div class="success-id">Зарын дугаар: ${listingId}</div>
          <div class="success-info">
            ${addListingState._syncFailed
              ? 'Таны зар одоогоор зөвхөн энэ төхөөрөмж дээр харагдаж байна — сервер лүү илгээхэд алдаа гарлаа (сүлжээ эсвэл зургийн хэмжээнээс шалтгаалж болзошгүй). Дахин оролдоно уу эсвэл интернэт холболтоо шалгаад дараа дахин нийтэлнэ үү.'
              : `Таны зар одоо BairX дээр идэвхтэй боллоо. Бид AI системээр зөв байгаа эсэхийг шалгах ба ${addListingState.plan === 'basic' ? '5-10 минутын' : 'хэдхэн минутын'} дотор бүх хэрэглэгчдэд харагдаж эхэлнэ. Зар үзэгчид холбогдох үед утсанд тань мэдэгдэл ирнэ.`}
          </div>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button class="btn btn-ghost btn-lg" onclick="closeModal()">Хаах</button>
            <button class="btn btn-blue btn-lg" onclick="closeModal(); scrollToSection('listings');">
              Заруудыг үзэх
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ===== Add Listing handlers =====
  function attachAddListingHandlers() {
    initListingLocationPreview();

    // Intent cards
    document.querySelectorAll('.intent-card').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('.intent-card').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        addListingState.intent = c.dataset.intent;
      });
    });

    // Type cards
    document.querySelectorAll('.type-card').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('.type-card').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        addListingState.propertyType = c.dataset.type;
      });
    });

    // Toggle rows
    document.querySelectorAll('.toggle-row').forEach(t => {
      const feature = t.dataset.feature;
      if (addListingState.features.includes(feature)) t.classList.add('on');
      t.addEventListener('click', () => {
        t.classList.toggle('on');
        if (t.classList.contains('on')) {
          if (!addListingState.features.includes(feature)) addListingState.features.push(feature);
        } else {
          addListingState.features = addListingState.features.filter(f => f !== feature);
        }
      });
    });

    // Plan cards
    document.querySelectorAll('.plan-card').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('.plan-card').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        addListingState.plan = c.dataset.plan;
      });
    });

    // Price suggestion
    const priceInput = document.getElementById('alPrice');
    if (priceInput) priceInput.addEventListener('input', updatePriceSuggestion);

    // Phone input — digits only
    const phoneEl = document.getElementById('alPhone');
    if (phoneEl) {
      phoneEl.addEventListener('input', () => {
        phoneEl.value = phoneEl.value.replace(/\D/g, '').slice(0, 8);
      });
    }

    updatePriceSuggestion();
  }

  function updatePriceSuggestion() {
    const priceInput = document.getElementById('alPrice');
    const box = document.getElementById('priceSuggestBox');
    const ppsqmBox = document.getElementById('pricePerSqmBox');
    if (!priceInput) return;
    const price = parseFloat(priceInput.value);
    const area = parseFloat(document.getElementById('alArea')?.value || addListingState.area);
    if (!price || !area) {
      if (box) box.innerHTML = '';
      if (ppsqmBox) ppsqmBox.innerHTML = '';
      return;
    }

    if (ppsqmBox) {
      const totalTogrog = Math.round(price * 1000000);
      ppsqmBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:10px 14px; background:var(--paper-2); border-radius:10px; font-size:13px;">
          <span style="color:var(--ink-3);">${fmt(totalTogrog)}₮ ÷ ${area}м² =</span>
          <strong style="font-family:'JetBrains Mono',monospace; color:var(--primary);">${fmt(totalTogrog / area)}₮/м²</strong>
        </div>
      `;
    }

    if (!box) return;
    const district = document.getElementById('alDistrict')?.value || addListingState.district;
    const pricePerSqm = price / area;
    const avg = DISTRICT_MARKET_AVG[district] || 4.0;
    const diff = ((pricePerSqm - avg) / avg) * 100;

    let msg, color;
    if (Math.abs(diff) < 8) {
      msg = `<strong>Шударга үнэлгээ.</strong> Таны үнэ дүүргийн дунджтай ойролцоо (${pricePerSqm.toFixed(2)} сая ₮/м², дундаж ${avg} сая ₮/м²). Зар хурдан үзэгдэх боломжтой.`;
      color = 'var(--primary)';
    } else if (diff < 0) {
      msg = `<strong style="color:#009878;">Сонирхолтой үнэ.</strong> Дүүргийн дунджаас ${Math.abs(diff).toFixed(0)}% доогуур. Хурдан зарагдах магадлал өндөр.`;
      color = '#009878';
    } else {
      msg = `<strong style="color:#C77700;">Анхаарна уу.</strong> Дүүргийн дунджаас ${diff.toFixed(0)}% дээгүүр (${pricePerSqm.toFixed(2)} vs ${avg} сая ₮/м²). Зар удаан үзэгдэх магадлалтай.`;
      color = '#C77700';
    }

    box.innerHTML = `
      <div class="price-suggest">
        <div class="price-suggest-icon" style="color:${color};">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M9 9l4 4 5-5"/></svg>
        </div>
        <div>${msg}</div>
      </div>
    `;
  }

  function nextStep(currentStep) {
    if (!validateStep(currentStep)) return;
    saveStepData(currentStep);
    addListingState.step = currentStep + 1;
    document.getElementById('modalContent').innerHTML = renderAddListing();
    document.getElementById('modal').scrollTop = 0;
    document.querySelector('.modal')?.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(attachAddListingHandlers, 50);
  }

  function prevStep(currentStep) {
    saveStepData(currentStep);
    addListingState.step = currentStep - 1;
    document.getElementById('modalContent').innerHTML = renderAddListing();
    setTimeout(attachAddListingHandlers, 50);
  }

  function saveStepData(step) {
    if (step === 2) {
      addListingState.title = document.getElementById('alTitle')?.value || '';
      addListingState.district = document.getElementById('alDistrict')?.value || '';
      addListingState.khoroo = document.getElementById('alKhoroo')?.value || '';
      addListingState.address = document.getElementById('alAddress')?.value || '';
      addListingState.area = document.getElementById('alArea')?.value || '';
      addListingState.rooms = document.getElementById('alRooms')?.value || '';
      addListingState.bedrooms = document.getElementById('alBedrooms')?.value || '';
      addListingState.bathrooms = document.getElementById('alBathrooms')?.value || '';
      addListingState.year = document.getElementById('alYear')?.value || '';
      addListingState.floor = document.getElementById('alFloor')?.value || '';
      addListingState.totalFloors = document.getElementById('alTotalFloors')?.value || '';
      addListingState.buildingName = document.getElementById('alBuildingName')?.value || '';
      addListingState.complex = document.getElementById('alComplex')?.value || '';
    }
    if (step === 3) {
      addListingState.price = document.getElementById('alPrice')?.value || '';
      addListingState.buildingType = document.getElementById('alBuildingType')?.value || '';
      addListingState.heating = document.getElementById('alHeating')?.value || '';
      addListingState.windowDirection = document.getElementById('alWindowDirection')?.value || '';
      addListingState.insulationType = document.getElementById('alInsulation')?.value || '';
      addListingState.hoaFee = document.getElementById('alHoaFee')?.value || '';
      addListingState.condition = document.getElementById('alCondition')?.value || '';
      addListingState.deposit = document.getElementById('alDeposit')?.value || '';
      addListingState.minTerm = document.getElementById('alMinTerm')?.value || '';
      addListingState.description = document.getElementById('alDescription')?.value || '';
    }
    if (step === 4) {
      addListingState.videoUrl = document.getElementById('alVideoUrl')?.value || '';
      addListingState.tourUrl = document.getElementById('alTourUrl')?.value || '';
    }
    if (step === 5) {
      addListingState.phone = document.getElementById('alPhone')?.value || '';
      addListingState.name = document.getElementById('alName')?.value || '';
      addListingState.role = document.getElementById('alRole')?.value || 'owner';
    }
  }

  // Scrolls/focuses the first invalid field so a validation failure is never silent —
  // without this, a rejected step just looks like the button did nothing.
  function focusFirstInvalid() {
    const el = document.querySelector('.form-input.err, .form-select.err, .form-textarea.err');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
  }

  function validateStep(step) {
    document.querySelectorAll('.form-input.err, .form-select.err, .form-textarea.err').forEach(el => el.classList.remove('err'));
    if (step === 1) {
      if (!addListingState.intent || !addListingState.propertyType) {
        showToast('Зорилго ба үл хөдлөхийн төрлөө сонгоно уу');
        return false;
      }
      return true;
    }
    if (step === 2) {
      let ok = true;
      const title = document.getElementById('alTitle');
      const district = document.getElementById('alDistrict');
      const area = document.getElementById('alArea');
      const rooms = document.getElementById('alRooms');
      if (!title.value || title.value.length < 10) { title.classList.add('err'); ok = false; }
      if (!district.value) { district.classList.add('err'); ok = false; }
      if (!area.value || parseFloat(area.value) < 1) { area.classList.add('err'); ok = false; }
      if (rooms && !rooms.value) { rooms.classList.add('err'); ok = false; }
      if (!ok) { showToast('Заавал бөглөх талбаруудыг шалгана уу'); focusFirstInvalid(); }
      return ok;
    }
    if (step === 3) {
      let ok = true;
      const price = document.getElementById('alPrice');
      const desc = document.getElementById('alDescription');
      if (!price.value || parseFloat(price.value) < 1) { price.classList.add('err'); ok = false; }
      if (!desc.value || !desc.value.trim()) { desc.classList.add('err'); ok = false; }
      if (!ok) { showToast('Заавал бөглөх талбаруудыг шалгана уу'); focusFirstInvalid(); }
      return ok;
    }
    if (step === 4) {
      if (addListingState.images.length < 1) {
        showToast('Хамгийн багадаа 1 зураг оруулна уу');
        return false;
      }
      return true;
    }
    if (step === 5) {
      let ok = true;
      const phone = document.getElementById('alPhone');
      if (!phone.value || phone.value.length !== 8) { phone.classList.add('err'); ok = false; }
      const name = document.getElementById('alName');
      if (!name.value) { name.classList.add('err'); ok = false; }
      if (!ok) {
        showToast(!phone.value || phone.value.length !== 8 ? 'Утасны дугаараа 8 оронтой зөв оруулна уу' : 'Нэрээ оруулна уу');
        focusFirstInvalid();
      }
      return ok;
    }
    return true;
  }

  function handleImageUpload(event, idx) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Зураг 5MB-аас бага байх ёстой');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      addListingState.images[idx] = e.target.result;
      document.getElementById('imageGrid').innerHTML = renderImageBoxes();
    };
    reader.readAsDataURL(file);
  }

  function removeImage(idx) {
    addListingState.images.splice(idx, 1);
    document.getElementById('imageGrid').innerHTML = renderImageBoxes();
  }

  // Floor plan — same resize-then-base64 approach as the profile photo (dashboard.js),
  // just a larger max dimension since floor plans need readable text/labels.
  function handleFloorPlanUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Зурган файл сонгоно уу'); return; }
    if (file.size > 8 * 1024 * 1024) { showToast('Зураг 8MB-аас бага байх ёстой'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height >= width && height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        addListingState.floorPlan = canvas.toDataURL('image/jpeg', 0.85);
        // Re-rendering the step would otherwise revert alVideoUrl/alTourUrl to their
        // last-saved (possibly stale) state, discarding whatever the user just typed
        // into those fields before touching the floor plan uploader.
        saveStepData(4);
        document.getElementById('modalContent').innerHTML = renderAddListing();
        setTimeout(attachAddListingHandlers, 50);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearFloorPlan() {
    saveStepData(4);
    addListingState.floorPlan = null;
    document.getElementById('modalContent').innerHTML = renderAddListing();
    setTimeout(attachAddListingHandlers, 50);
  }

  async function submitListing() {
    if (!validateStep(5)) return;
    try {
      await doSubmitListing();
    } catch(e) {
      console.error('submitListing failed:', e);
      showToast('Зар нийтлэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  }

  async function doSubmitListing() {
    saveStepData(5);

    const s = addListingState;
    const districtLabels = {
      'khan-uul': 'Хан-Уул', 'sukhbaatar': 'Сүхбаатар', 'chingeltei': 'Чингэлтэй',
      'bayanzurkh': 'Баянзүрх', 'bayangol': 'Баянгол', 'songinokhairkhan': 'Сонгинохайрхан',
      'nalaikh': 'Налайх', 'bagakhangai': 'Багахангай', 'baganuur': 'Багануур'
    };
    const zoningLabels = { residential: 'Орон сууцны', commercial: 'Худалдаа үйлчилгээний', industrial: 'Үйлдвэрлэлийн', agricultural: 'Хөдөө аж ахуйн' };
    const infraLabels = { full: 'Цахилгаан, ус, дулаан', electric: 'Зөвхөн цахилгаан', none: 'Дэд бүтэцгүй' };
    const conditionLabels = {
      'white-box': 'Засваргүй (white box)', basic: 'Энгийн засвартай', renovated: 'Үндсэн засвартай',
      premium: 'Premium засвартай', furnished: 'Тавилгатай, бүрэн засвартай'
    };
    const insulationLabels = {
      eps: 'Гадна EPS дулаалга', mw: 'Эрдэс ноос (MW)', pir: 'PIR (шинэ стандарт)',
      inside: 'Дотроос хийсэн', none: 'Дулаалгагүй'
    };
    const windowDirLabels = {
      north: 'Хойд', south: 'Урд', east: 'Дорнод', west: 'Өрнөд',
      southeast: 'Урд-Дорнод', southwest: 'Урд-Өрнөд', northeast: 'Хойд-Дорнод', northwest: 'Хойд-Өрнөд'
    };
    const minTermLabels = { '1m': '1 сар', '3m': '3 сар', '6m': '6 сар', '1y': '1 жил+' };
    const isLand = s.propertyType === 'land';
    const newId = listings.reduce(function(m, l) { return l.id > m ? l.id : m; }, 0) + 1;
    const p = parseFloat(s.price) || 0;
    const a = parseFloat(s.area) || 0;
    const allImages = s.images.filter(Boolean);
    const planDays = { basic: 30, vip: 60, featured: 90 };
    const now = Date.now();
    const expiresAt = now + (planDays[s.plan] || 30) * 86400000;
    const newListing = {
      id: newId,
      ownerId: currentUser?.uid || null,
      sellerVerified: !!(currentUser && currentUser.emailVerified),
      // "Verified phone" means THIS listing's contact number matches a number the owner
      // actually proved via SMS OTP (see dashboard.js's real phone-verification flow) —
      // not just that the account exists. Recomputed on every save, including edits, so
      // changing the contact number to an unverified one correctly drops the badge.
      phoneVerified: !!(currentUser?.verifiedPhone && normalizePhone(s.phone) === currentUser.verifiedPhone),
      // Admin-only, scam-review signal — never true on a fresh listing or after an edit
      // (firestore.rules blocks the owner from setting this themselves either way).
      listingVerified: false,
      expiresAt, _bumpedAt: now,
      cat: s.intent === 'rent' ? 'rent' : propertyTypeBucket(s.propertyType || 'apartment'),
      propertyType: s.propertyType || 'apartment',
      title: s.title || ((districtLabels[s.district] || s.district) + ', ' + (isLand ? 'газар' : (s.rooms || '?') + ' өрөө')),
      loc: (districtLabels[s.district] || s.district) + (s.khoroo ? ' · ' + s.khoroo + '-р хороо' : ''),
      district: s.district || 'sukhbaatar',
      khoroo: s.khoroo ? parseInt(s.khoroo) : null,
      geoLat: s.geoLat || null,
      geoLng: s.geoLng || null,
      price: p,
      pricePerSqm: (a && p) ? parseFloat((p / a).toFixed(2)) : 0,
      area: a,
      rooms: isLand ? (a ? (a / 10000).toFixed(2) + ' га' : '—') : (parseInt(s.rooms) || 1),
      bedrooms: isLand ? null : (parseInt(s.bedrooms) || null),
      bathrooms: isLand ? null : (parseInt(s.bathrooms) || null),
      floor: isLand ? 'Эзэмшил' : (s.floor ? s.floor + '/' + (s.totalFloors || '?') : '?'),
      year: isLand ? (infraLabels[s.year] || 'Тодорхойгүй') : (parseInt(s.year) || new Date().getFullYear()),
      buildingName: isLand ? '' : (s.buildingName || ''),
      complex: isLand ? '' : (s.complex || ''),
      tag: { type: 'new', text: 'Шинэ зар' },
      // VIP/Featured plans promise a "VIP" badge on the card — that only actually happens
      // if the chosen plan is reflected here, not just in expiresAt's longer duration.
      badges: (s.plan === 'vip' || s.plan === 'featured') ? ['new', 'user', 'vip'] : ['new', 'user'],
      loanType: 'Тохиролцоно',
      monthly: 0,
      img: allImages[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      buildingType: isLand ? ('Газар (' + (zoningLabels[s.rooms] || 'Тодорхойгүй') + ')') : (s.buildingType || ''),
      insulation: isLand ? '' : (insulationLabels[s.insulationType] || ''),
      windowDirection: isLand ? '' : (windowDirLabels[s.windowDirection] || ''),
      hoaFee: isLand ? null : (parseInt(s.hoaFee) || null),
      heating: s.heating || '',
      parking: s.features.includes('parking') ? 'Паркинг бий' : '',
      elevator: s.features.includes('elevator') ? 'Лифттэй' : '',
      balcony: s.features.includes('balcony') ? 'Тагттай' : '',
      basement: s.features.includes('basement') ? 'Зоорьтой' : '',
      furniture: s.features.includes('furnished') ? 'Тавилгатай' : '',
      deposit: (s.intent === 'rent' && !isLand) ? (parseFloat(s.deposit) || null) : null,
      minTerm: (s.intent === 'rent' && !isLand) ? (minTermLabels[s.minTerm] || '') : '',
      videoUrl: (s.videoUrl && videoEmbedUrl(s.videoUrl)) ? s.videoUrl.trim() : '',
      tourUrl: (s.tourUrl && safeEmbedUrl(s.tourUrl)) ? s.tourUrl.trim() : '',
      floorPlan: s.floorPlan || null,
      utilityCost: '', ownership: 'Хувийн өмчлөл',
      cadastre: '', collateral: '', taxDebt: '',
      condition: conditionLabels[s.condition] || s.condition || '',
      features: s.features.slice(),
      legalNotes: 'Хэрэглэгчийн нэмсэн зар · ' + (s.name || '') + ' · ' + (s.phone || ''),
      userSubmitted: true
    };
    if (allImages.length > 0) listingExtras[newId] = { coords: { x: 50, y: 50 }, gallery: allImages };

    const targetId = editingListingId || newId;

    // ===== FIRESTORE SAVE =====
    let firestoreSaveFailed = false;
    if (currentUser) {
      const fsDoc = {
        ownerId: currentUser.uid,
        ownerEmail: currentUser.email,
        sellerVerified: newListing.sellerVerified,
        phoneVerified: newListing.phoneVerified,
        listingVerified: newListing.listingVerified,
        expiresAt: newListing.expiresAt,
        bumpedAt: newListing._bumpedAt,
        category: newListing.cat,
        propertyType: newListing.propertyType,
        title: newListing.title,
        loc: newListing.loc,
        district: newListing.district,
        khoroo: newListing.khoroo,
        geoLat: newListing.geoLat,
        geoLng: newListing.geoLng,
        price: newListing.price,
        area: newListing.area,
        rooms: newListing.rooms,
        bedrooms: newListing.bedrooms,
        bathrooms: newListing.bathrooms,
        floor: newListing.floor,
        year: newListing.year,
        buildingName: newListing.buildingName,
        complex: newListing.complex,
        buildingType: newListing.buildingType,
        insulation: newListing.insulation,
        windowDirection: newListing.windowDirection,
        hoaFee: newListing.hoaFee,
        heating: newListing.heating,
        deposit: newListing.deposit,
        minTerm: newListing.minTerm,
        condition: newListing.condition,
        features: newListing.features,
        img: newListing.img,
        images: allImages,
        videoUrl: newListing.videoUrl,
        tourUrl: newListing.tourUrl,
        floorPlan: newListing.floorPlan,
        sellerName: s.name || currentUser.name || 'Хэрэглэгч',
        sellerPhone: s.phone || '',
        sellerType: s.role === 'agent' ? 'Агент' : (s.role === 'company' ? 'Компани' : 'Хувь хүн'),
        // Snapshot at publish time — other users can't read another account's private
        // users/{uid} doc (Firestore rules), so verification/company identity has to
        // ride along on the listing itself the same way sellerVerified already does.
        sellerCompany: currentUser.companyName || '',
        status: 'active',
        badges: newListing.badges,
        boosted: s.plan === 'vip' || s.plan === 'featured',
        userSubmitted: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      // Firestore documents cap out around 1MiB and base64 photos blow past that fast —
      // keep only the cover photo server-side so the write doesn't silently fail;
      // the full gallery still renders locally via listingExtras/localStorage.
      if (JSON.stringify(fsDoc).length > 900000) {
        fsDoc.images = allImages.slice(0, 1);
      }
      if (JSON.stringify(fsDoc).length > 900000) {
        fsDoc.floorPlan = null; // still too large even with just the cover photo — drop the plan too
      }
      try {
        if (editingListingId) {
          const existingFsId = listings.find(x => x.id === editingListingId)?.firestoreId;
          if (existingFsId) await db.collection('listings').doc(existingFsId).update(fsDoc);
        } else {
          fsDoc.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          fsDoc.viewCount = 0; fsDoc.favoriteCount = 0; fsDoc.reportCount = 0;
          const docRef = await db.collection('listings').add(fsDoc);
          newListing.firestoreId = docRef.id;
        }
      } catch(e) {
        firestoreSaveFailed = true;
        console.error('Listing Firestore save failed:', e.code, e.message);
        const reason = e.code === 'permission-denied'
          ? ' (зөвшөөрөл татгалзагдлаа — Firestore Rules Publish хийгдээгүй байж болзошгүй)'
          : (e.code ? ' (' + e.code + ')' : '');
        showToast('Сервер лүү илгээхэд алдаа гарлаа — зар зөвхөн энэ төхөөрөмж дээр хадгалагдлаа' + reason);
      }
    }
    // ===== END FIRESTORE =====

    if (editingListingId) {
      const idx = listings.findIndex(x => x.id === editingListingId);
      if (idx > -1) Object.assign(listings[idx], newListing, { id: editingListingId, badges: listings[idx].badges, userSubmitted: true, _gallery: allImages });
      if (allImages.length > 0) listingExtras[editingListingId] = { coords: { x: 50, y: 50 }, gallery: allImages };
      try {
        var saved = JSON.parse(localStorage.getItem('bairxUserListings') || '[]');
        const si = saved.findIndex(x => x.id === editingListingId);
        const updated = Object.assign({}, listings.find(x => x.id === editingListingId), { _gallery: allImages });
        if (si > -1) saved[si] = updated; else saved.push(updated);
        localStorage.setItem('bairxUserListings', JSON.stringify(saved));
      } catch(e) {}
      editingListingId = null;
    } else {
      newListing._gallery = allImages;
      listings.push(newListing);
      try {
        var saved = JSON.parse(localStorage.getItem('bairxUserListings') || '[]');
        saved.push(newListing);
        localStorage.setItem('bairxUserListings', JSON.stringify(saved));
      } catch(e) {}
    }

    // Mirror rent-intent submissions into the dedicated Rent section's data source too
    if (s.intent === 'rent' && typeof rentListings !== 'undefined') {
      const rentFeatureLabels = { furnished: 'Тавилгатай', parking: 'Гараж', elevator: 'Лифттэй', balcony: 'Тагттай', negotiable: 'Үнэ хэлэлцэх боломжтой' };
      const rentFeatures = s.features.map(f => rentFeatureLabels[f]).filter(Boolean);
      const rentId = 'u' + targetId;
      const rentEntry = {
        id: rentId, type: 'monthly',
        title: newListing.title, loc: newListing.loc,
        price: p, deposit: parseFloat((p * 2).toFixed(1)),
        area: a, rooms: isLand ? 0 : (parseInt(s.rooms) || 1),
        features: rentFeatures.length ? rentFeatures : ['Хэрэглэгчийн зар'],
        protected: true, img: newListing.img
      };
      const ridx = rentListings.findIndex(x => x.id === rentId);
      if (ridx > -1) rentListings[ridx] = rentEntry; else rentListings.push(rentEntry);
      const activeRentTab = document.querySelector('.rent-tab.active');
      if (typeof renderRentListings === 'function') renderRentListings(activeRentTab?.dataset.rentType || 'all');
    }

    if (s.name || s.phone) {
      sellerData[targetId] = {
        phone: s.phone || '9900-0000',
        name: s.name || 'Хэрэглэгч',
        type: s.role === 'agent' ? 'Агент' : (s.role === 'company' ? 'Компани' : 'Хувь хүн'),
        company: currentUser?.companyName || ''
      };
      try {
        const sd = JSON.parse(localStorage.getItem('bairxSellerData') || '{}');
        sd[targetId] = sellerData[targetId];
        localStorage.setItem('bairxSellerData', JSON.stringify(sd));
      } catch(e) {}
    }

    renderHomeListings();
    renderListings(getFilteredListings());
    updateCatPillCounts();
    renderMyListings();
    if (typeof renderDashboard === 'function') renderDashboard();

    addListingState._syncFailed = firestoreSaveFailed;
    addListingState.step = 6;
    document.getElementById('modalContent').innerHTML = renderAddListing();
  }

  // Sweeps every user-submitted listing and auto-marks anything past its plan duration as expired.
  function checkExpiredListings() {
    const now = Date.now();
    let changed = false;
    listings.forEach(l => {
      if (l.userSubmitted && l.expiresAt && now > l.expiresAt && !l._expired) {
        l._expired = true;
        l._inactive = true;
        changed = true;
      }
    });
    return changed;
  }

  function bumpMyListing(id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    const now = Date.now();
    if (l._bumpedAt && now - l._bumpedAt < 86400000) {
      const hoursLeft = Math.ceil((86400000 - (now - l._bumpedAt)) / 3600000);
      showToast(`Дараагийн үнэгүй дээшлүүлэлт ${hoursLeft} цагийн дараа боломжтой`);
      return;
    }
    l._bumpedAt = now;
    if (l.firestoreId) db.collection('listings').doc(l.firestoreId).update({ bumpedAt: now }).catch(() => {});
    showToast('Зар дээшлүүлэгдлээ', 'success');
    renderMyListings();
    if (typeof renderDashboard === 'function') renderDashboard();
    renderListings(getFilteredListings());
    renderHomeListings();
  }

  async function renewMyListing(id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    const now = Date.now();
    l.expiresAt = now + 30 * 86400000;
    l._expired = false;
    l._inactive = false;
    l._bumpedAt = now;
    if (l.firestoreId) {
      try {
        await db.collection('listings').doc(l.firestoreId).update({ expiresAt: l.expiresAt, status: 'active', bumpedAt: now });
      } catch(e) {}
    }
    showToast('Зар 30 хоногоор сунгагдлаа', 'success');
    renderMyListings('active');
    renderListings(getFilteredListings());
    renderHomeListings();
  }

  let myListingsTab = 'active';
  function renderMyListings(tab) {
    checkExpiredListings();
    myListingsTab = tab || myListingsTab;
    // Highlight active tab
    ['active','pending','ended'].forEach(t => {
      const btn = document.getElementById('myTab-' + t);
      if (btn) btn.classList.toggle('active', t === myListingsTab);
    });
    const grid = document.getElementById('myListingsGrid');
    if (!grid) return;
    const userListings = listings.filter(l => l.userSubmitted || l.badges.includes('user'));
    // active = not auto-expired (may still be manually deactivated, shown with a badge)
    // ended = auto-expired past its plan duration; pending has no real workflow yet
    const shown = myListingsTab === 'active' ? userListings.filter(l => !l._expired)
      : myListingsTab === 'ended' ? userListings.filter(l => l._expired)
      : [];
    if (shown.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 24px;color:var(--ink-3);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px;opacity:0.4;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
        <div style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:6px;">Зар байхгүй</div>
        <div style="font-size:13px;margin-bottom:20px;">Одоогоор энэ хэсэгт зар байхгүй байна.</div>
        <button class="btn btn-blue" onclick="openAddListing()">Зар нэмэх</button>
      </div>`;
      return;
    }
    grid.innerHTML = shown.map(l => {
      const isVip = l.badges.includes('vip');
      const isInactive = l._inactive === true;
      const isExpired = l._expired === true;
      const statusLabel = isExpired ? 'Дууссан' : (isInactive ? 'Идэвхгүй' : 'Идэвхтэй');
      const statusClass = isInactive ? 'badge' : 'badge new';
      const daysLeft = l.expiresAt ? Math.ceil((l.expiresAt - Date.now()) / 86400000) : null;
      const canBump = !isExpired && (!l._bumpedAt || Date.now() - l._bumpedAt >= 86400000);
      return `
      <article class="listing-card" onclick="showPage('listings'); setTimeout(()=>openListing(${l.id}),150)" style="${isInactive ? 'opacity:0.65;' : ''}">
        <div class="listing-img">
          <img src="${esc(l.img)}" alt="${esc(l.title)}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1B2D4F, #1E5BFF)';"/>
          <div class="listing-badges">
            ${isVip ? '<span class="badge vip">⭐ VIP</span>' : ''}
            <span class="${statusClass}">${statusLabel}</span>
          </div>
        </div>
        <div class="listing-body">
          <div class="listing-price-row">
            <div class="listing-price">${fmtPrice(l.price)}</div>
          </div>
          <h3 class="listing-title">${esc(l.title)}</h3>
          <div class="listing-loc"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${esc(l.loc)}</div>
          <div class="listing-meta">
            <span class="listing-meta-item"><strong>${l.area}</strong> м²</span>
            <span class="listing-meta-item"><strong>${l.rooms}</strong> өрөө</span>
            <span class="listing-meta-item">👁 <strong>${l.viewCount || 0}</strong></span>
          </div>
          ${!isExpired && daysLeft !== null ? `<div style="font-size:11px;color:var(--ink-3);margin-top:6px;">${daysLeft > 0 ? daysLeft + ' хоногийн дараа дуусна' : 'Өнөөдөр дуусна'}</div>` : ''}
          <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">
            ${isExpired ? `
            <button class="btn btn-blue" style="flex:1;justify-content:center;font-size:11px;min-width:0;" onclick="event.stopPropagation();renewMyListing(${l.id})">Сунгах</button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;" onclick="event.stopPropagation();editMyListing(${l.id})">Засах</button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;color:var(--danger);" onclick="event.stopPropagation();deleteMyListing(${l.id})">Устгах</button>
            ` : `
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;color:${canBump ? 'var(--primary)' : 'var(--ink-3)'};" onclick="event.stopPropagation();bumpMyListing(${l.id})" title="24 цагт нэг удаа үнэгүй">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Дээшлүүлэх
            </button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;" onclick="event.stopPropagation();openBoostModal(${l.id})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Boost
            </button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;" onclick="event.stopPropagation();editMyListing(${l.id})">Засах</button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;color:${isInactive ? 'var(--primary)' : 'var(--ink-3)'};" onclick="event.stopPropagation();toggleListingActive(${l.id})">${isInactive ? 'Идэвхжүүлэх' : 'Идэвхгүй болгох'}</button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;color:var(--danger);" onclick="event.stopPropagation();deleteMyListing(${l.id})">Устгах</button>
            `}
          </div>
        </div>
      </article>
    `}).join('');
  }

  async function toggleListingActive(id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    l._inactive = !l._inactive;
    if (l.firestoreId) {
      try {
        await db.collection('listings').doc(l.firestoreId).update({
          status: l._inactive ? 'inactive' : 'active',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}
    }
    try {
      const saved = JSON.parse(localStorage.getItem('bairxUserListings') || '[]');
      const si = saved.findIndex(x => x.id === id);
      if (si > -1) { saved[si]._inactive = l._inactive; localStorage.setItem('bairxUserListings', JSON.stringify(saved)); }
    } catch(e) {}
    showToast(l._inactive ? 'Зар идэвхгүй болгогдлоо' : 'Зар идэвхжүүлэгдлаа', 'success');
    renderMyListings();
    if (typeof renderDashboard === 'function') renderDashboard();
    renderListings(getFilteredListings());
    renderHomeListings();
  }

  let boostTargetId = null;

  function openBoostModal(id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    boostTargetId = id;
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 28px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:36px;margin-bottom:8px;">⚡</div>
          <h3 style="font-family:'Fraunces',serif;font-size:22px;font-weight:700;margin-bottom:6px;">Зараа дэмжих</h3>
          <div style="font-size:13px;color:var(--ink-3);">${esc(l.title)}</div>
        </div>
        <div style="display:grid;gap:12px;">
          ${[
            { icon:'⭐', name:'VIP', price:'15,000 ₮', days: 60, desc:'60 хоног · VIP шошго · Нүүр хуудас, хайлтын үр дүнд эхэнд харагдана', color:'#FFB020' },
            { icon:'💎', name:'Онцлох', price:'35,000 ₮', days: 90, desc:'90 хоног · VIP шошго · Нүүр хуудас, хайлтын үр дүнд эхэнд харагдана', color:'#009878' }
          ].map(p => `
            <div style="border:2px solid var(--line);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:border-color 0.15s;" onclick="confirmBoost('${p.name}', '${p.price}', ${p.days})">
              <div style="font-size:28px;">${p.icon}</div>
              <div style="flex:1;">
                <div style="font-weight:700;color:${p.color};">${p.name} — ${p.price}</div>
                <div style="font-size:12px;color:var(--ink-3);margin-top:2px;">${p.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          `).join('')}
        </div>
        <div style="font-size:11.5px; color:var(--ink-3); margin-top:14px; line-height:1.5;">Энэ бол жишээ/demo төлбөрийн урсгал — бодит төлбөрийн систем холбогдоогүй.</div>
        <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:16px;" onclick="closeModal()">Цуцлах</button>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function confirmBoost(plan, price, days) {
    // Add vip badge and extend expiresAt by the plan's promised duration — matching the same
    // real mechanism (badge + expiresAt) the listing-creation wizard's VIP/Featured plans use,
    // so a boost bought from here behaves identically to one bought at creation time.
    if (boostTargetId) {
      const bl = listings.find(x => x.id === boostTargetId);
      if (bl) {
        if (!bl.badges.includes('vip')) bl.badges.push('vip');
        const base = (bl.expiresAt && bl.expiresAt > Date.now()) ? bl.expiresAt : Date.now();
        bl.expiresAt = base + (days || 30) * 86400000;
        if (bl.firestoreId) {
          db.collection('listings').doc(bl.firestoreId).update({ badges: bl.badges, expiresAt: bl.expiresAt }).catch(() => {});
        }
      }
      const txn = { listingId: boostTargetId, listingTitle: bl?.title || '', plan, price, date: Date.now() };
      try {
        const boosted = JSON.parse(localStorage.getItem('bairxBoostedListings') || '[]');
        if (!boosted.includes(boostTargetId)) boosted.push(boostTargetId);
        localStorage.setItem('bairxBoostedListings', JSON.stringify(boosted));
        const txns = JSON.parse(localStorage.getItem('bairxTransactions') || '[]');
        txns.unshift(txn);
        localStorage.setItem('bairxTransactions', JSON.stringify(txns));
      } catch(e) {}
      if (currentUser) {
        db.collection('transactions').add(Object.assign({}, txn, {
          userId: currentUser.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })).catch(() => {});
      }
      renderMyListings();
    if (typeof renderDashboard === 'function') renderDashboard();
      renderHomeListings();
      renderListings(getFilteredListings());
    }
    closeModal();
    setTimeout(() => {
      document.getElementById('modalContent').innerHTML = `
        <button class="modal-close" onclick="closeModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        <div style="padding:40px 28px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">🎉</div>
          <h3 style="font-family:'Fraunces',serif;font-size:22px;margin-bottom:8px;">${plan} идэвхжлээ!</h3>
          <div style="font-size:14px;color:var(--ink-3);margin-bottom:24px;">${price} төлбөр баталгаажлаа (Demo горим)</div>
          <button class="btn btn-blue btn-lg" onclick="closeModal()">Ойлголоо</button>
        </div>
      `;
      document.getElementById('modal').classList.add('open');
      document.body.style.overflow = 'hidden';
    }, 250);
    showToast(plan + ' идэвхжлээ!', 'success');
    boostTargetId = null;
  }

  async function deleteMyListing(id) {
    if (!confirm('Зарыг устгах уу?')) return;
    const l = listings.find(x => x.id === id);
    if (l?.firestoreId) {
      try { await db.collection('listings').doc(l.firestoreId).delete(); } catch(e) {}
    }
    const idx = listings.findIndex(x => x.id === id);
    if (idx > -1) listings.splice(idx, 1);
    try {
      const saved = JSON.parse(localStorage.getItem('bairxUserListings') || '[]').filter(x => x.id !== id);
      localStorage.setItem('bairxUserListings', JSON.stringify(saved));
    } catch(e) {}
    renderMyListings();
    if (typeof renderDashboard === 'function') renderDashboard();
    renderHomeListings();
    renderListings(getFilteredListings());
    updateCatPillCounts();
    showToast('Зар устгагдлаа');
  }

  function confirmCloseAddListing() {
    if (addListingState.step === 6 || addListingState.step === 1) {
      closeModal();
      addListingState = {
        step: 1, intent: 'sell', propertyType: '',
        title: '', district: '', khoroo: '', address: '', geoLat: null, geoLng: null, area: '', rooms: '',
        bedrooms: '', bathrooms: '', floor: '', totalFloors: '', year: '', buildingName: '', complex: '',
        price: '', buildingType: '', heating: '', insulationType: '', windowDirection: '', hoaFee: '',
        condition: '', deposit: '', minTerm: '', description: '', features: [], images: [],
        videoUrl: '', tourUrl: '', floorPlan: null,
        phone: '', name: '', role: 'owner', plan: 'basic'
      };
      return;
    }
    if (confirm('Зар нэмэх процессоос гарвал оруулсан мэдээлэл устгагдана. Үргэлжлүүлэх үү?')) {
      closeModal();
      addListingState = {
        step: 1, intent: 'sell', propertyType: '',
        title: '', district: '', khoroo: '', address: '', geoLat: null, geoLng: null, area: '', rooms: '',
        bedrooms: '', bathrooms: '', floor: '', totalFloors: '', year: '', buildingName: '', complex: '',
        price: '', buildingType: '', heating: '', insulationType: '', windowDirection: '', hoaFee: '',
        condition: '', deposit: '', minTerm: '', description: '', features: [], images: [],
        videoUrl: '', tourUrl: '', floorPlan: null,
        phone: '', name: '', role: 'owner', plan: 'basic'
      };
    }
  }

