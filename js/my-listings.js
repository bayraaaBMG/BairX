  // ===== ADD LISTING FORM =====
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
      phoneVerified: true,
      intent: l.cat === 'rent' ? 'rent' : 'sell',
      propertyType: l.cat === 'rent' ? 'apartment' : l.cat,
      title: l.title,
      district: districtKeys[l.district] || l.district,
      khoroo: '',
      address: l.loc,
      area: String(l.area),
      rooms: String(l.rooms),
      floor: (l.floor || '').split('/')[0] || '',
      totalFloors: (l.floor || '').split('/')[1] || '',
      year: String(l.year),
      price: String(l.price),
      buildingType: l.buildingType || '',
      heating: l.heating || '',
      condition: l.condition || '',
      description: '',
      features: [],
      images: listingExtras[l.id]?.gallery || (l.img ? [l.img] : []),
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
    phoneVerified: false,
    // Step 1
    intent: 'sell', // sell, rent, exchange
    propertyType: '', // apartment, house, land, office
    // Step 2 - basic info
    title: '',
    district: '',
    khoroo: '',
    address: '',
    area: '',
    rooms: '',
    floor: '',
    totalFloors: '',
    year: '',
    // Step 3 - details
    price: '',
    buildingType: '',
    heating: '',
    condition: '',
    description: '',
    features: [],
    // Step 4 - images
    images: [],
    // Step 5 - contact
    phone: '',
    name: '',
    role: 'owner', // owner, agent, company
    plan: 'basic' // basic, vip, featured
  };

  function openAddListing() {
    addListingState.step = 1;
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
          <div class="al-sub">Бүх алхамыг бөглөж дуусгахад ойролцоогоор 4-6 минут зарцуулагдана. Зар нийтлэхэд утсаар баталгаажилт шаардлагатай.</div>
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
          <button class="type-card ${addListingState.propertyType === 'apartment' ? 'active' : ''}" data-type="apartment">
            <div class="type-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M8 10h.01M8 14h.01M12 6h.01M12 10h.01M12 14h.01M16 6h.01M16 10h.01M16 14h.01"/></svg>
            </div>
            <div class="type-card-name">Орон сууц</div>
            <div class="type-card-desc">Байр, апартмент</div>
          </button>
          <button class="type-card ${addListingState.propertyType === 'house' ? 'active' : ''}" data-type="house">
            <div class="type-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12l9-9 9 9M5 10v11h14V10"/></svg>
            </div>
            <div class="type-card-name">Хувийн сууц</div>
            <div class="type-card-desc">Хаус, тагт орон сууц</div>
          </button>
          <button class="type-card ${addListingState.propertyType === 'land' ? 'active' : ''}" data-type="land">
            <div class="type-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M3 21l6-12 4 6 4-8 4 14"/></svg>
            </div>
            <div class="type-card-name">Газар</div>
            <div class="type-card-desc">Эзэмшил, барилгын</div>
          </button>
          <button class="type-card ${addListingState.propertyType === 'office' ? 'active' : ''}" data-type="office">
            <div class="type-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <div class="type-card-name">Оффис</div>
            <div class="type-card-desc">Худалдаа, үйлчилгээ</div>
          </button>
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

  function renderStep2() {
    const active = addListingState.step === 2;
    const isLand = addListingState.propertyType === 'land';
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

        <div class="form-row">
          <label class="form-label">Дэлгэрэнгүй хаяг <span class="hint">— хороолол, барилгын нэр</span></label>
          <input type="text" class="form-input" id="alAddress" placeholder="Жнь: Зайсан, Хүннү 2222 хороолол" value="${addListingState.address}" />
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

  function renderStep3() {
    const active = addListingState.step === 3;
    const isLand = addListingState.propertyType === 'land';
    return `
      <div class="step-panel ${active ? 'active' : ''}" data-step="3">
        <div class="step-section-title">Үнэ ба дэлгэрэнгүй</div>
        <div class="step-section-sub">Үнэ, барилгын чанарын мэдээлэл</div>

        <div class="form-row">
          <label class="form-label">Үнэ (сая ₮)<span class="req">*</span></label>
          <input type="number" class="form-input" id="alPrice" placeholder="Жнь: 412" min="1" step="0.5" value="${addListingState.price}" />
          <div class="form-err-msg">Үнэ оруулна уу</div>
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
            <div class="toggle-row" data-feature="balcony">
              <span>Тагттай</span>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-row" data-feature="furnished">
              <span>Тавилгатай</span>
              <div class="toggle-switch"></div>
            </div>
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
        ` : ''}

        <div class="form-row">
          <label class="form-label">Дэлгэрэнгүй тайлбар<span class="req">*</span> <span class="hint">— хамгийн багадаа 50 тэмдэгт</span></label>
          <textarea class="form-textarea" id="alDescription" rows="5" placeholder="Үл хөдлөх хөрөнгийнхөө онцлог, давуу талыг тайлбарлана уу. Жнь: Зайсаны бизнес төвөөс 5 минутын зайтай, өмнөд талдаа задгай, наран гэрэлтэй..." maxlength="2000">${addListingState.description}</textarea>
          <div class="form-err-msg">Тайлбар хангалтгүй</div>
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
        <div class="step-section-sub">Утсаар баталгаажуулсны дараа зар нийтлэгдэнэ</div>

        <!-- Phone verification -->
        <div class="phone-verify" id="phoneVerifyBox">
          ${!addListingState.phoneVerified ? `
            <div style="font-weight:700; font-size:15px; margin-bottom:6px;">Утсаар баталгаажих<span class="req">*</span></div>
            <div style="font-size:13px; color:var(--ink-3); margin-bottom:14px;">Зар оруулагч хүн бүр утасны дугаараар бүртгүүлэх шаардлагатай. Энэ нь хуурамч зар, давхар зарын эрсдлээс сэргийлдэг.</div>

            <div id="phoneStep1">
              <label class="form-label">Утасны дугаар</label>
              <div class="phone-input-group">
                <div class="phone-prefix">+976</div>
                <input type="tel" class="form-input" id="alPhone" placeholder="88112233" maxlength="8" value="${addListingState.phone}" />
                <button class="btn btn-blue" onclick="sendOtp()" id="sendOtpBtn">
                  Код илгээх
                </button>
              </div>
            </div>

            <div id="phoneStep2" style="display:none;">
              <div style="font-size:13px; color:var(--ink-2); margin-bottom:8px;">
                <strong>+976 <span id="phoneDisplay"></span></strong> дугаарт 4 оронтой код илгээлээ
              </div>
              <div class="otp-input-group">
                <input type="text" class="otp-input" maxlength="1" id="otp0" />
                <input type="text" class="otp-input" maxlength="1" id="otp1" />
                <input type="text" class="otp-input" maxlength="1" id="otp2" />
                <input type="text" class="otp-input" maxlength="1" id="otp3" />
              </div>
              <div class="resend-row">
                Код ирээгүй юу? <a onclick="resendOtp()">Дахин илгээх</a>
              </div>
            </div>
          ` : `
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:50%; background:var(--accent); display:grid; place-items:center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style="font-weight:700; color:#009878;">Утас амжилттай баталгаажлаа</div>
                <div style="font-size:13px; color:var(--ink-3);">+976 ${addListingState.phone}</div>
              </div>
            </div>
          `}
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
              <li>10 хүртэл зураг</li>
              <li>Энгийн хайлтад харагдана</li>
            </ul>
          </button>
          <button class="plan-card recommend ${addListingState.plan === 'vip' ? 'active' : ''}" data-plan="vip">
            <div class="plan-name">VIP</div>
            <div class="plan-price">15,000 ₮ <span class="plan-price-period">/ зар</span></div>
            <div class="plan-price-period">60 хоног идэвхтэй</div>
            <ul class="plan-features">
              <li>60 хоног идэвхтэй</li>
              <li>15 зураг хүртэл</li>
              <li>"VIP" тэмдэглэгээтэй</li>
              <li>Хайлтын эхэнд гарна</li>
              <li>Илүү дэлгэрэнгүй талбарууд</li>
            </ul>
          </button>
          <button class="plan-card ${addListingState.plan === 'featured' ? 'active' : ''}" data-plan="featured">
            <div class="plan-name">Онцлох</div>
            <div class="plan-price">35,000 ₮ <span class="plan-price-period">/ зар</span></div>
            <div class="plan-price-period">90 хоног идэвхтэй</div>
            <ul class="plan-features">
              <li>90 хоног идэвхтэй</li>
              <li>20 зураг хүртэл</li>
              <li>Нүүр хуудсан дээр</li>
              <li>"Шилдэг сонголт" хэсэгт</li>
              <li>AI үнэлгээний тайлан</li>
              <li>Статистик мэдээлэл</li>
            </ul>
          </button>
        </div>

        <div style="padding:14px; background:var(--paper-2); border-radius:10px; font-size:12px; color:var(--ink-3); line-height:1.5;">
          Зар нийтлэхээр <strong style="color:var(--ink);">Үйлчилгээний нөхцөл</strong> болон <strong style="color:var(--ink);">Нууцлалын бодлого</strong>-той зөвшөөрсөнд тооцогдоно. Хуурамч мэдээлэл оруулсан тохиолдолд зар нь устгагдаж, бүртгэл блоклогдох эрсдэлтэй.
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
          <div class="success-title">Зар амжилттай нийтлэгдлээ</div>
          <div class="success-id">Зарын дугаар: ${listingId}</div>
          <div class="success-info">
            Таны зар одоо BairX дээр идэвхтэй боллоо. Бид AI системээр зөв байгаа эсэхийг шалгах ба ${addListingState.plan === 'basic' ? '5-10 минутын' : 'хэдхэн минутын'} дотор бүх хэрэглэгчдэд харагдаж эхэлнэ. Зар үзэгчид холбогдох үед утсанд тань мэдэгдэл ирнэ.
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

    // OTP auto-advance
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById('otp' + i);
      if (!el) continue;
      el.addEventListener('input', () => {
        if (el.value.length === 1) {
          el.classList.add('filled');
          if (i < 3) document.getElementById('otp' + (i + 1)).focus();
          else checkOtp();
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !el.value && i > 0) {
          document.getElementById('otp' + (i - 1)).focus();
        }
      });
    }

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
    if (!priceInput || !box) return;
    const price = parseFloat(priceInput.value);
    const area = parseFloat(document.getElementById('alArea')?.value || addListingState.area);
    if (!price || !area) { box.innerHTML = ''; return; }

    const district = document.getElementById('alDistrict')?.value || addListingState.district;
    const pricePerSqm = price / area;

    // Дүүргийн ойролцоогоор зах зээлийн дундаж м² үнэ (сая ₮/м²)
    const marketAvg = {
      'khan-uul': 5.2,
      'sukhbaatar': 5.8,
      'chingeltei': 4.0,
      'bayanzurkh': 3.8,
      'bayangol': 3.5,
      'songinokhairkhan': 3.2,
      'nalaikh': 1.8
    };
    const avg = marketAvg[district] || 4.0;
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
      addListingState.year = document.getElementById('alYear')?.value || '';
      addListingState.floor = document.getElementById('alFloor')?.value || '';
      addListingState.totalFloors = document.getElementById('alTotalFloors')?.value || '';
    }
    if (step === 3) {
      addListingState.price = document.getElementById('alPrice')?.value || '';
      addListingState.buildingType = document.getElementById('alBuildingType')?.value || '';
      addListingState.heating = document.getElementById('alHeating')?.value || '';
      addListingState.condition = document.getElementById('alCondition')?.value || '';
      addListingState.description = document.getElementById('alDescription')?.value || '';
    }
    if (step === 5) {
      addListingState.name = document.getElementById('alName')?.value || '';
      addListingState.role = document.getElementById('alRole')?.value || 'owner';
    }
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
      if (!ok) showToast('Заавал бөглөх талбаруудыг шалгана уу');
      return ok;
    }
    if (step === 3) {
      let ok = true;
      const price = document.getElementById('alPrice');
      const desc = document.getElementById('alDescription');
      if (!price.value || parseFloat(price.value) < 1) { price.classList.add('err'); ok = false; }
      if (!desc.value || desc.value.length < 50) { desc.classList.add('err'); ok = false; }
      if (!ok) showToast('Заавал бөглөх талбаруудыг шалгана уу');
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
      if (!addListingState.phoneVerified) {
        showToast('Утсаар баталгаажих шаардлагатай');
        return false;
      }
      const name = document.getElementById('alName');
      if (!name.value) { name.classList.add('err'); showToast('Нэрээ оруулна уу'); return false; }
      return true;
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

  function sendOtp() {
    const phone = document.getElementById('alPhone').value.trim();
    if (phone.length !== 8) {
      showToast('Утасны дугаар 8 оронтой байх ёстой');
      return;
    }
    addListingState.phone = phone;
    document.getElementById('phoneStep1').style.display = 'none';
    document.getElementById('phoneStep2').style.display = 'block';
    document.getElementById('phoneDisplay').textContent = phone;
    setTimeout(() => document.getElementById('otp0').focus(), 100);
    showToast('Баталгаажуулах код илгээгдлээ (демо: 1234)', 'success');
  }

  function checkOtp() {
    const code = ['otp0', 'otp1', 'otp2', 'otp3'].map(id => document.getElementById(id).value).join('');
    if (code === '1234') {
      addListingState.phoneVerified = true;
      document.getElementById('phoneVerifyBox').innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:40px; height:40px; border-radius:50%; background:var(--accent); display:grid; place-items:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div style="font-weight:700; color:#009878;">Утас амжилттай баталгаажлаа</div>
            <div style="font-size:13px; color:var(--ink-3);">+976 ${addListingState.phone}</div>
          </div>
        </div>
      `;
      showToast('Утас амжилттай баталгаажлаа', 'success');
    } else {
      showToast('Код буруу байна. Демо-д 1234 оруулна уу');
      ['otp0', 'otp1', 'otp2', 'otp3'].forEach(id => {
        const el = document.getElementById(id);
        el.value = '';
        el.classList.remove('filled');
      });
      document.getElementById('otp0').focus();
    }
  }

  function resendOtp() {
    showToast('Код дахин илгээгдлээ (демо: 1234)', 'success');
  }

  async function submitListing() {
    if (!validateStep(5)) return;
    saveStepData(5);

    const s = addListingState;
    const districtLabels = {
      'khan-uul': 'Хан-Уул', 'sukhbaatar': 'Сүхбаатар', 'chingeltei': 'Чингэлтэй',
      'bayanzurkh': 'Баянзүрх', 'bayangol': 'Баянгол', 'songinokhairkhan': 'Сонгинохайрхан',
      'nalaikh': 'Налайх', 'bagakhangai': 'Багахангай', 'baganuur': 'Багануур'
    };
    const newId = listings.reduce(function(m, l) { return l.id > m ? l.id : m; }, 0) + 1;
    const p = parseFloat(s.price) || 0;
    const a = parseFloat(s.area) || 0;
    const allImages = s.images.filter(Boolean);
    const newListing = {
      id: newId,
      cat: s.propertyType || 'apartment',
      title: s.title || ((districtLabels[s.district] || s.district) + ', ' + (s.rooms || '?') + ' өрөө'),
      loc: (districtLabels[s.district] || s.district) + (s.khoroo ? ' · ' + s.khoroo + '-р хороо' : ''),
      district: s.district || 'sukhbaatar',
      price: p,
      pricePerSqm: (a && p) ? parseFloat((p / a).toFixed(2)) : 0,
      area: a,
      rooms: parseInt(s.rooms) || 1,
      floor: s.floor ? s.floor + '/' + (s.totalFloors || '?') : '?',
      year: parseInt(s.year) || new Date().getFullYear(),
      tag: { type: 'new', text: 'Шинэ зар' },
      badges: ['new', 'user'],
      loanType: 'Тохиролцоно',
      monthly: 0,
      img: allImages[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      buildingType: s.buildingType || '', insulation: '', heating: s.heating || '',
      parking: '', elevator: '', utilityCost: '', ownership: 'Хувийн өмчлөл',
      cadastre: '', collateral: '', taxDebt: '', condition: s.condition || '',
      legalNotes: 'Хэрэглэгчийн нэмсэн зар · ' + (s.name || '') + ' · ' + (s.phone || ''),
      userSubmitted: true
    };
    if (allImages.length > 0) listingExtras[newId] = { coords: { x: 50, y: 50 }, gallery: allImages };

    const targetId = editingListingId || newId;

    // ===== FIRESTORE SAVE =====
    if (currentUser) {
      const fsDoc = {
        ownerId: currentUser.uid,
        ownerEmail: currentUser.email,
        category: newListing.cat,
        title: newListing.title,
        loc: newListing.loc,
        district: newListing.district,
        price: newListing.price,
        area: newListing.area,
        rooms: newListing.rooms,
        floor: newListing.floor,
        year: newListing.year,
        img: newListing.img,
        images: allImages,
        sellerName: s.name || currentUser.name || 'Хэрэглэгч',
        sellerPhone: s.phone || '',
        sellerType: s.role === 'agent' ? 'Агент' : (s.role === 'company' ? 'Компани' : 'Хувь хүн'),
        status: 'active',
        badges: ['new', 'user'],
        boosted: false,
        userSubmitted: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
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
      } catch(e) { showToast('Firestore хадгалахад алдаа гарлаа'); }
    }
    // ===== END FIRESTORE =====

    if (editingListingId) {
      const idx = listings.findIndex(x => x.id === editingListingId);
      if (idx > -1) Object.assign(listings[idx], newListing, { id: editingListingId, badges: listings[idx].badges, userSubmitted: true });
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
      listings.push(newListing);
      try {
        var saved = JSON.parse(localStorage.getItem('bairxUserListings') || '[]');
        newListing._gallery = allImages;
        saved.push(newListing);
        localStorage.setItem('bairxUserListings', JSON.stringify(saved));
      } catch(e) {}
    }

    if (s.name || s.phone) {
      sellerData[targetId] = {
        phone: s.phone || '9900-0000',
        name: s.name || 'Хэрэглэгч',
        type: s.role === 'agent' ? 'Агент' : (s.role === 'company' ? 'Компани' : 'Хувь хүн')
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

    addListingState.step = 6;
    document.getElementById('modalContent').innerHTML = renderAddListing();
  }

  let myListingsTab = 'active';
  function renderMyListings(tab) {
    myListingsTab = tab || myListingsTab;
    // Highlight active tab
    ['active','pending','ended'].forEach(t => {
      const btn = document.getElementById('myTab-' + t);
      if (btn) btn.classList.toggle('active', t === myListingsTab);
    });
    const grid = document.getElementById('myListingsGrid');
    if (!grid) return;
    const userListings = listings.filter(l => l.userSubmitted || l.badges.includes('user'));
    // Simulate tabs: active = all user listings, pending = none (demo), ended = none (demo)
    const shown = myListingsTab === 'active' ? userListings : [];
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
      const statusLabel = isInactive ? 'Идэвхгүй' : 'Идэвхтэй';
      const statusClass = isInactive ? 'badge' : 'badge new';
      return `
      <article class="listing-card" onclick="showPage('listings'); setTimeout(()=>openListing(${l.id}),150)" style="${isInactive ? 'opacity:0.65;' : ''}">
        <div class="listing-img">
          <img src="${l.img}" alt="${l.title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1B2D4F, #1E5BFF)';"/>
          <div class="listing-badges">
            ${isVip ? '<span class="badge vip">⭐ VIP</span>' : ''}
            <span class="${statusClass}">${statusLabel}</span>
          </div>
        </div>
        <div class="listing-body">
          <div class="listing-price-row">
            <div class="listing-price">${fmtPrice(l.price)}</div>
          </div>
          <h3 class="listing-title">${l.title}</h3>
          <div class="listing-loc"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${l.loc}</div>
          <div class="listing-meta">
            <span class="listing-meta-item"><strong>${l.area}</strong> м²</span>
            <span class="listing-meta-item"><strong>${l.rooms}</strong> өрөө</span>
          </div>
          <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;" onclick="event.stopPropagation();openBoostModal(${l.id})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Boost
            </button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;" onclick="event.stopPropagation();editMyListing(${l.id})">Засах</button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;color:${isInactive ? 'var(--primary)' : 'var(--ink-3)'};" onclick="event.stopPropagation();toggleListingActive(${l.id})">${isInactive ? 'Идэвхжүүлэх' : 'Идэвхгүй болгох'}</button>
            <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:11px;min-width:0;color:var(--danger);" onclick="event.stopPropagation();deleteMyListing(${l.id})">Устгах</button>
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
          <div style="font-size:13px;color:var(--ink-3);">${l.title}</div>
        </div>
        <div style="display:grid;gap:12px;">
          ${[
            { icon:'🚀', name:'Boost', price:'9,900 ₮', desc:'7 хоногийн турш хайлтад дээр гарна', color:'var(--primary)' },
            { icon:'⭐', name:'VIP', price:'19,900 ₮', desc:'30 хоног · Онцгой шошго · 5x илүү үзэлт', color:'#FFB020' },
            { icon:'💎', name:'Онцлох зар', price:'29,900 ₮', desc:'Нүүр хуудас · Email хэвлэл · Агентын санал', color:'#009878' }
          ].map(p => `
            <div style="border:2px solid var(--line);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:border-color 0.15s;" onclick="confirmBoost('${p.name}', '${p.price}')">
              <div style="font-size:28px;">${p.icon}</div>
              <div style="flex:1;">
                <div style="font-weight:700;color:${p.color};">${p.name} — ${p.price}</div>
                <div style="font-size:12px;color:var(--ink-3);margin-top:2px;">${p.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:16px;" onclick="closeModal()">Цуцлах</button>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function confirmBoost(plan, price) {
    // Add vip badge to the listing and persist
    if (boostTargetId) {
      const bl = listings.find(x => x.id === boostTargetId);
      if (bl && !bl.badges.includes('vip')) bl.badges.push('vip');
      try {
        const boosted = JSON.parse(localStorage.getItem('bairxBoostedListings') || '[]');
        if (!boosted.includes(boostTargetId)) boosted.push(boostTargetId);
        localStorage.setItem('bairxBoostedListings', JSON.stringify(boosted));
      } catch(e) {}
      renderMyListings();
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
    renderHomeListings();
    renderListings(getFilteredListings());
    updateCatPillCounts();
    showToast('Зар устгагдлаа');
  }

  function confirmCloseAddListing() {
    if (addListingState.step === 6 || addListingState.step === 1) {
      closeModal();
      addListingState = {
        step: 1, phoneVerified: false, intent: 'sell', propertyType: '',
        title: '', district: '', khoroo: '', address: '', area: '', rooms: '',
        floor: '', totalFloors: '', year: '', price: '', buildingType: '',
        heating: '', condition: '', description: '', features: [], images: [],
        phone: '', name: '', role: 'owner', plan: 'basic'
      };
      return;
    }
    if (confirm('Зар нэмэх процессоос гарвал оруулсан мэдээлэл устгагдана. Үргэлжлүүлэх үү?')) {
      closeModal();
      addListingState = {
        step: 1, phoneVerified: false, intent: 'sell', propertyType: '',
        title: '', district: '', khoroo: '', address: '', area: '', rooms: '',
        floor: '', totalFloors: '', year: '', price: '', buildingType: '',
        heating: '', condition: '', description: '', features: [], images: [],
        phone: '', name: '', role: 'owner', plan: 'basic'
      };
    }
  }

