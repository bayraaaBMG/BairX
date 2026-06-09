  // ===== INFO PAGES (footer links) =====
  const infoPages = {
    about: {
      title: 'Бидний тухай',
      eyebrow: 'BairX-ийн түүх',
      body: `
        <p>BairX нь 2026 онд Улаанбаатарт үүсгэн байгуулагдсан Монголын анхны ухаалаг үл хөдлөх хөрөнгийн платформ юм. Бид үл хөдлөх хөрөнгө худалдах, худалдан авах, түрээслэх үйл явцыг технологи ашиглан хялбар, ил тод, аюулгүй болгох зорилготой.</p>

        <h4>Бидний эрхэм зорилго</h4>
        <p>Монголын иргэн бүр зөв шийдвэр гаргаж, өөрийн орон сууцтай болохын тулд шаардлагатай бүх мэдээллийг нэг дороос авч чадахаар зохион байгуулах. Үл хөдлөх + банк санхүү + AI анализыг нэгтгэн ажиллуулж буй цорын ганц платформ бид юм.</p>

        <h4>Beta хувилбарын байдал</h4>
        <div class="info-stats">
          <div class="info-stat"><div class="info-stat-num">30+</div><div class="info-stat-label">Demo зар</div></div>
          <div class="info-stat"><div class="info-stat-num">12</div><div class="info-stat-label">Банкны тооцоолуур</div></div>
          <div class="info-stat"><div class="info-stat-num">2026</div><div class="info-stat-label">Үүсгэн байгуулсан</div></div>
          <div class="info-stat"><div class="info-stat-num" style="font-size:16px;">Beta</div><div class="info-stat-label">Хөгжлийн шат</div></div>
        </div>

        <h4>Манай үнэт зүйлс</h4>
        <p><strong>Ил тод байдал.</strong> Бид агентын далдалсан төлбөр, хуурамч зар, хэт өндөр үнэлгээтэй тэмцэнэ. Хэрэглэгч өөрөө шийдвэрлэх бүх мэдээллийг нээлттэй авна.</p>
        <p><strong>Иргэдийн талд.</strong> Бид зэрэгцээ хэлбэрээр банктай ч, агенттай ч ажилладаггүй. Зөвхөн хэрэглэгчийн талд зогсож, тэдэнд хамгийн ашигтай саналыг олж өгнө.</p>
        <p><strong>Технологийн тэргүүлэгч.</strong> Монголд анх удаа AI ашигласан үнэлгээ, ирээдүйн өгөөжийн тооцоолол, чадварын үнэлгээг нэг платформ дээр нэгтгэлээ.</p>
      `
    },
    career: {
      title: 'Карьер',
      eyebrow: 'Бидэнтэй ажиллах',
      body: `
        <p>BairX нь Монголын үл хөдлөх салбарыг өөрчилж буй залуу, амбицтай баг юм. Хэрэв та технологиор хүмүүсийн амьдралыг сайжруулах хүсэлтэй бол бидэнтэй нэгдээрэй.</p>

        <h4>Нээлттэй ажлын байр</h4>
        <div class="job-list">
          <div class="job-card">
            <div class="job-tag">Engineering</div>
            <div class="job-title">Senior Frontend Developer</div>
            <div class="job-meta">React, TypeScript · Бүтэн цаг · Улаанбаатар</div>
            <div class="job-salary">3,500,000 - 6,000,000 ₮</div>
          </div>
          <div class="job-card">
            <div class="job-tag">Engineering</div>
            <div class="job-title">Backend Engineer (Node.js)</div>
            <div class="job-meta">Node.js, PostgreSQL · Бүтэн цаг · Улаанбаатар</div>
            <div class="job-salary">3,200,000 - 5,500,000 ₮</div>
          </div>
          <div class="job-card">
            <div class="job-tag">Data</div>
            <div class="job-title">AI/ML Engineer</div>
            <div class="job-meta">Python, ML · Бүтэн цаг · Хагас зайнаас</div>
            <div class="job-salary">4,000,000 - 7,000,000 ₮</div>
          </div>
          <div class="job-card">
            <div class="job-tag">Бизнес</div>
            <div class="job-title">Үл хөдлөхийн мэргэжилтэн</div>
            <div class="job-meta">Үл хөдлөх салбарт 3+ жил · Улаанбаатар</div>
            <div class="job-salary">2,500,000 - 4,500,000 ₮</div>
          </div>
          <div class="job-card">
            <div class="job-tag">Маркетинг</div>
            <div class="job-title">Контент менежер</div>
            <div class="job-meta">Сошиал медиа, контент бичих · Бүтэн цаг</div>
            <div class="job-salary">2,000,000 - 3,500,000 ₮</div>
          </div>
        </div>

        <h4>Бидний санал болгох зүйл</h4>
        <p>Уян хатан цагийн хуваарь, эрүүл мэндийн даатгал, тоног төхөөрөмжийн дэмжлэг, мэргэжил хөгжүүлэх төсөв (жилд 1.5 сая ₮ хүртэл), жилийн 28 хоногийн амралт.</p>

        <p><strong>Хүсэлт илгээх:</strong> career@bairx.mn</p>
      `
    },
    press: {
      title: 'Хэвлэл мэдээлэл',
      eyebrow: 'Press & Media',
      body: `
        <p>BairX бол 2026 онд хөгжүүлэлт эхлэсэн <strong>beta хувилбар</strong> платформ юм. Доорх зорилтуудыг хэрэгжүүлэхийн тулд ажиллаж байна.</p>

        <h4>Хөгжлийн зам (Roadmap)</h4>
        <div class="press-list">
          <div class="press-item">
            <div class="press-date" style="color:var(--accent)">Зорилт</div>
            <div class="press-title">12 банктай нөхцөл харьцуулалтын хамтын ажиллагаа</div>
            <div class="press-desc">Монголын тэргүүлэх банкуудтай хамтран, орон сууцны зээлийн бодит нөхцөлийг автоматаар харьцуулах боломж олгох.</div>
          </div>
          <div class="press-item">
            <div class="press-date" style="color:var(--accent)">Зорилт</div>
            <div class="press-title">AI-д суурилсан үнэлгээний систем</div>
            <div class="press-desc">Зах зээлийн өгөгдөл, дүүргийн өсөлт, барилгын чанарт суурилж байрны зах зээлийн үнийг автоматаар тооцоолох систем.</div>
          </div>
          <div class="press-item">
            <div class="press-date" style="color:var(--primary)">Идэвхтэй</div>
            <div class="press-title">Beta хувилбар нийтэд нээлттэй боллоо</div>
            <div class="press-desc">Зар хайх, зар нэмэх, зээл тооцоолох 3 үндсэн боломж бүхий beta хувилбарыг туршихад урьж байна. Санал хүсэлтийг хүлээн авч байна.</div>
          </div>
          <div class="press-item">
            <div class="press-date" style="color:var(--accent)">Зорилт</div>
            <div class="press-title">Баталгаажуулалтын систем ба жинхэнэ зар</div>
            <div class="press-desc">Эзэмшлийн гэрчилгээгээр баталгаажсан зар, агентуудын бүртгэл, хуурамч зарыг тасалгаасан систем нэвтрүүлэх.</div>
          </div>
        </div>

        <h4>Хэвлэлийн харилцаа</h4>
        <p>Сэтгүүлчид, блогерүүд, медиа байгууллагуудаас ирүүлэх асуултыг бид хүлээн авч байна. Хэвлэлийн материал, ярилцлагын хүсэлтийг доорх хаягаар илгээнэ үү.</p>
        <p><strong>И-мэйл:</strong> press@bairx.mn<br><strong>Утас:</strong> 7211-9435</p>
      `
    },
    contact: {
      title: 'Холбоо барих',
      eyebrow: 'Бидэнтэй холбогдох',
      body: `
        <p>Асуулт, санал, гомдол, хамтын ажиллагааны санал гээд бүхий л асуудлаар бидэнтэй холбоо барина уу. Бид 24 цагийн дотор хариу өгөхийг зорино.</p>

        <div class="contact-grid">
          <div class="contact-card">
            <div class="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div class="contact-card-label">Утас</div>
            <a class="contact-card-value" href="tel:+97672119435">7211-9435</a>
            <div class="contact-card-hint">Даваа - Баасан, 09:00 - 18:00</div>
          </div>

          <div class="contact-card">
            <div class="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div class="contact-card-label">И-мэйл</div>
            <a class="contact-card-value" href="mailto:info@bairx.mn">info@bairx.mn</a>
            <div class="contact-card-hint">24 цагийн дотор хариу өгнө</div>
          </div>

          <div class="contact-card">
            <div class="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div class="contact-card-label">Хаяг</div>
            <div class="contact-card-value">Сүхбаатар дүүрэг</div>
            <div class="contact-card-hint">1-р хороо, Чингисийн өргөн чөлөө<br>BairX Tower, 7 давхар</div>
          </div>

          <div class="contact-card">
            <div class="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div class="contact-card-label">Ажлын цаг</div>
            <div class="contact-card-value">9:00 - 18:00</div>
            <div class="contact-card-hint">Даваа - Баасан<br>Бямба, Ням амарна</div>
          </div>
        </div>

        <h4>Тусгай хэлтсүүд</h4>
        <div class="dept-list">
          <div class="dept-item"><strong>Үйлчилгээний дэмжлэг:</strong> support@bairx.mn</div>
          <div class="dept-item"><strong>Хэвлэл мэдээлэл:</strong> press@bairx.mn</div>
          <div class="dept-item"><strong>Карьер:</strong> career@bairx.mn</div>
          <div class="dept-item"><strong>Хамтын ажиллагаа:</strong> partners@bairx.mn</div>
          <div class="dept-item"><strong>Зээлийн дэмжлэг:</strong> loans@bairx.mn</div>
        </div>
      `
    },
    terms: {
      title: 'Үйлчилгээний нөхцөл',
      eyebrow: 'Эрх зүйн баримт бичиг',
      body: `
        <p style="color:var(--ink-3); font-size:13px;">Шинэчлэгдсэн: 2026 оны 1 дүгээр сарын 15</p>

        <h4>1. Ерөнхий заалт</h4>
        <p>Энэхүү үйлчилгээний нөхцөл нь BairX платформ (цаашид "Бид", "Платформ" гэх) болон үйлчилгээний хэрэглэгчдийн (цаашид "Хэрэглэгч") хооронд үүсэх харилцааг зохицуулна. Хэрэглэгч платформд бүртгүүлэх, ашиглах үед энэхүү нөхцөлийг бүрэн хүлээн зөвшөөрсөн гэж үзнэ.</p>

        <h4>2. Үйлчилгээний хүрээ</h4>
        <p>BairX нь үл хөдлөх хөрөнгийн зар нийтлэх, хайх, банкны зээл харьцуулах, чадварын үнэлгээ хийх, хөрөнгө оруулалтын тооцоолол гаргах зэрэг үйлчилгээг үзүүлнэ. Бид зар оруулагч болон зар үзэгчийн хооронд гэрээний этгээд биш бөгөөд зөвхөн мэдээллийн платформ үйлчилгээ үзүүлнэ.</p>

        <h4>3. Хэрэглэгчийн үүрэг</h4>
        <p>Хэрэглэгч өөрийн оруулсан мэдээллийн үнэн зөв, бүрэн байдлыг бүрэн хариуцна. Хуурамч зар, бусдын зургийг ашиглах, залилан мэхлэх зорилгоор платформ ашиглахыг хатуу хориглоно. Энэ нөхцөлийг зөрчсөн тохиолдолд бид хэрэглэгчийн бүртгэлийг урьдчилан мэдэгдэлгүйгээр түр болон бүрэн зогсоох эрхтэй.</p>

        <h4>4. Зар нийтлэх журам</h4>
        <p>Зар нийтлэхдээ хэрэглэгч өөрийн утасны дугаараар баталгаажих шаардлагатай. Нэг утасны дугаараар сард 5-аас илүү зар нийтлэхгүй. Тус бүр нь хэрэглэгчийн өөрийн эзэмшиж буй эсвэл итгэмжлэгдсэн төлөөлж буй үл хөдлөх хөрөнгөтэй холбоотой байх ёстой.</p>

        <h4>5. Үнийн санал, банкны зээл</h4>
        <p>Платформ дээр харагдах банкны зээлийн нөхцөл нь дөхөмжлөн харьцуулсан байх ба эцсийн зээлийн шийдвэр, нөхцөлийг тухайн банк өөрөө гаргана. BairX нь зээлийн төлбөр төлөгдөх, зээл олгогдох гэх мэт асуудалд оролцохгүй.</p>

        <h4>6. Хариуцлагын хязгаарлалт</h4>
        <p>BairX нь зөвхөн мэдээллийн платформ үйлчилгээ үзүүлэх ба хэрэглэгчдийн хооронд гарсан гэрээ, гүйлгээний асуудалд хариуцлага хүлээхгүй. Гэхдээ бид залилан мэхлэх, хууран мэхлэх үйлдлүүдтэй идэвхтэй тэмцэж, хэрэглэгчдийг хамгаалахаар бүх боломжит арга хэмжээ авна.</p>

        <h4>7. Үйлчилгээний нөхцөлийг өөрчлөх</h4>
        <p>Бид үйлчилгээний нөхцөлд нэмэлт, өөрчлөлт оруулах эрхтэй. Нэмэлт өөрчлөлтийг платформ дээр нийтлэснээс хойш 7 хоногийн дараа хүчин төгөлдөр болно.</p>
      `
    },
    privacy: {
      title: 'Нууцлалын бодлого',
      eyebrow: 'Хувийн мэдээллийн хамгаалалт',
      body: `
        <p style="color:var(--ink-3); font-size:13px;">Шинэчлэгдсэн: 2026 оны 1 дүгээр сарын 15</p>

        <p>BairX нь хэрэглэгчдийн хувийн мэдээллийг хамгаалахад чухал ач холбогдол өгдөг. Энэхүү нууцлалын бодлого нь бид ямар мэдээлэл цуглуулж, хэрхэн ашиглаж, хамгаалж байгаа талаар тайлбарлана.</p>

        <h4>1. Бид ямар мэдээлэл цуглуулдаг вэ?</h4>
        <p><strong>Бүртгэлийн мэдээлэл:</strong> нэр, утасны дугаар, и-мэйл хаяг, нууц үг (шифрлэгдсэн).</p>
        <p><strong>Зарын мэдээлэл:</strong> үл хөдлөх хөрөнгийн байршил, үнэ, хэмжээ, зураг, тайлбар.</p>
        <p><strong>Тооцоолуурын өгөгдөл:</strong> зээл тооцоолуурт оруулсан орлого, хадгаламж, бусад мэдээлэл (зөвхөн таны төхөөрөмжид хадгалагдана, бид хадгалдаггүй).</p>
        <p><strong>Техникийн мэдээлэл:</strong> IP хаяг, хөтчийн төрөл, оруулсан хуудас, хайлтын түүх.</p>

        <h4>2. Бид мэдээллийг хэрхэн ашигладаг вэ?</h4>
        <p>Үйлчилгээ үзүүлэх, хайлтын үр дүнг сайжруулах, хууран мэхлэх үйлдлээс сэргийлэх, AI-аар үнэлгээ хийх, статистик гаргах, хэрэглэгчтэй холбогдох (зөвхөн зөвшөөрөл өгсөн тохиолдолд) зэрэг зорилгоор ашиглана.</p>

        <h4>3. Гуравдагч этгээдтэй хуваалцах</h4>
        <p>Бид хэрэглэгчийн хувийн мэдээллийг ямар нэгэн төлбөртэйгөөр гуравдагч этгээдэд зардаггүй. Зөвхөн дараах тохиолдлуудад мэдээллийг хуваалцах боломжтой:</p>
        <p>· Хэрэглэгч өөрөө зөвшөөрсөн (жишээ нь: банкинд зээлийн хүсэлт илгээх)<br>· Монгол улсын хууль тогтоомжийн дагуу шаардсан тохиолдолд<br>· Залилан мэхлэх үйлдлээс сэргийлэх зорилгоор</p>

        <h4>4. Аюулгүй байдал</h4>
        <p>Хэрэглэгчийн мэдээллийг SSL/TLS шифрлэлтээр хамгаалж, өндөр аюулгүй байдалтай серверт хадгална. Нууц үгийг bcrypt алгоритмаар шифрлэн хадгалдаг тул бид өөрсдөө ч хэрэглэгчийн нууц үгийг харах боломжгүй.</p>

        <h4>5. Күүки (Cookies)</h4>
        <p>Бид хэрэглэгчийн туршлагыг сайжруулах, статистик цуглуулах зорилгоор күүки ашиглана. Хөтчийн тохиргооноос күүкийг хааж болно, гэхдээ зарим функц зөв ажиллахгүй байж болно.</p>

        <h4>6. Таны эрх</h4>
        <p>Та өөрийн мэдээллийг хүссэн үедээ үзэх, засах, устгах, татаж авах эрхтэй. Үүнийг хийхийн тулд бүртгэлийн тохиргоо хуудсыг ашиглах эсвэл privacy@bairx.mn хаягаар бидэнтэй холбогдоно уу.</p>
      `
    },
    security: {
      title: 'Аюулгүй байдал',
      eyebrow: 'Хэрэглэгчийн хамгаалалт',
      body: `
        <p>BairX дээр аюулгүй байдал нь манай хамгийн чухал зорилт юм. Бид хэрэглэгчдийг залилан мэхлэх үйлдлээс хамгаалах, мэдээллийг найдвартай хадгалах олон давхар хамгаалалтын системтэй.</p>

        <h4>Бидний аюулгүй байдлын стандарт</h4>
        <div class="security-list">
          <div class="security-item">
            <div class="security-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div class="security-title">Утасны баталгаажуулалт</div>
              <div class="security-desc">Зар нийтлэх хүн бүр өөрийн утасны дугаараар баталгаажих шаардлагатай. Энэ нь хуурамч, давхар зар оруулахаас сэргийлдэг.</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <div class="security-title">SSL шифрлэлт</div>
              <div class="security-desc">Бүх өгөгдөл нь 256-бит SSL/TLS шифрлэлтээр хамгаалагдсан байдаг. Таны мэдээллийг гуравдагч этгээд унших боломжгүй.</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div>
              <div class="security-title">24/7 хяналт</div>
              <div class="security-desc">AI системээр хуурамч зар, сэжигтэй үйлдлийг автоматаар илрүүлж, манай аюулгүй байдлын баг 24 цаг хяналт тавьдаг.</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
            </div>
            <div>
              <div class="security-title">AI үнэлгээний систем</div>
              <div class="security-desc">Зар бүрийг автоматаар шалгаж, зах зээлийн үнэлгээтэй харьцуулан хэт өндөр, хэт доогуур үнэтэй сэжигтэй заруудыг тэмдэглэдэг.</div>
            </div>
          </div>
        </div>

        <h4>Залилан мэхлэхээс хэрхэн сэргийлэх вэ?</h4>
        <p><strong>· Урьдчилгаа төлбөр битгий илгээ.</strong> Зарын эзэн биечлэн уулзахаас өмнө мөнгө шилжүүлэхийг хэрэгсэхгүй болго.</p>
        <p><strong>· Бичиг баримтыг шалга.</strong> Худалдан авахаасаа өмнө үл хөдлөх хөрөнгийн гэрчилгээ, бүртгэлийн хэвлэмэл хувийг шалгана уу.</p>
        <p><strong>· Газар дээр нь үзэх.</strong> Зөвхөн зураг дээрээс шийдвэрлэхгүй, заавал биечлэн очиж үзэж байгаад худалдан авна.</p>
        <p><strong>· Маш хямд үнэ сэжигтэй.</strong> Зах зээлийн үнэлгээнээс 30%+ доогуур үнэтэй зар нь ихэвчлэн залилан байдаг.</p>

        <h4>Сэжигтэй зар мэдэгдэх</h4>
        <p>Хэрэв та хуурамч, залилан зар олж харвал зарын дэлгэрэнгүй хуудсан дээрх "Мэдэгдэх" товчийг дарах эсвэл security@bairx.mn хаягаар бидэнд мэдэгдэнэ үү. Бид 24 цагийн дотор шалгаж, шаардлагатай арга хэмжээ авна.</p>

        <p style="margin-top:24px; padding:16px; background:var(--paper-2); border-radius:12px; font-size:13px;"><strong>Яаралтай туслах утас:</strong> 7211-9435 (өдөр бүр 9:00 - 21:00)</p>
      `
    },
    addListing: {
      title: 'Зар нэмэх',
      eyebrow: 'Шинэ зар нийтлэх',
      body: `
        <p>BairX дээр зар нэмэхийн тулд та эхлээд утасны дугаараар бүртгүүлэх шаардлагатай. Үүнээс өмнө дараах мэдээллийг бэлтгэнэ үү:</p>

        <h4>Бэлтгэх ёстой мэдээлэл</h4>
        <div class="checklist">
          <div class="check-item">✓ Үл хөдлөх хөрөнгийн төрөл (байр / хаус / газар / оффис)</div>
          <div class="check-item">✓ Байршил (дүүрэг, хороо, хороолол)</div>
          <div class="check-item">✓ Хэмжээ (м²), өрөөний тоо, давхар, барилгын насжилт</div>
          <div class="check-item">✓ Үнэ ба төлбөрийн нөхцөл</div>
          <div class="check-item">✓ Чанартай зургууд (5-аас доошгүй)</div>
          <div class="check-item">✓ Дэлгэрэнгүй тайлбар</div>
          <div class="check-item">✓ Холбоо барих утасны дугаар</div>
        </div>

        <h4>Зар нийтлэх алхмууд</h4>
        <ol class="step-list">
          <li><strong>Бүртгэл үүсгэх</strong> — Утасны дугаараа оруулж, СМС-ээр ирэх кодоор баталгаажуулна.</li>
          <li><strong>Зарын ангилал сонгох</strong> — Худалдах, түрээслэх, хөрөнгө оруулалт гэсэн сонголтоос сонгоно.</li>
          <li><strong>Дэлгэрэнгүй мэдээлэл</strong> — Дээр дурдсан мэдээллүүдийг бөглөнө.</li>
          <li><strong>Зураг оруулах</strong> — Тод, чанартай 5-15 зураг оруулж, дараалал нь зөв байх ёстой.</li>
          <li><strong>Үнэлгээ хийлгэх</strong> — Манай AI систем зах зээлийн үнэлгээтэй харьцуулан зөв үнэ санал болгоно.</li>
          <li><strong>Нийтлэх</strong> — Зар автоматаар идэвхждэг ба шууд хэрэглэгчдэд харагдаж эхэлнэ.</li>
        </ol>

        <h4>Үнэлгээний боломжууд</h4>
        <p><strong>Энгийн зар (Үнэгүй).</strong> 30 хоног идэвхтэй, зураг 10 хүртэл, ангилал бүрт оруулж болно.</p>
        <p><strong>VIP зар (15,000 ₮).</strong> 60 хоног, дээгүүр харагдана, "VIP" тэмдэглэгээтэй, хайлтын үр дүнгийн эхэнд гарч ирнэ.</p>
        <p><strong>Онцлох зар (35,000 ₮).</strong> 90 хоног, нүүр хуудсан дээр харагдана, AI үнэлгээний дэлгэрэнгүй тайлан, статистик.</p>

        <button class="btn btn-blue btn-lg" style="margin-top:20px; width:100%; justify-content:center;" onclick="closeModal(); setTimeout(openAddListing, 300)">
          Зар нэмэх эхлэх
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </button>
      `
    },
    map: {
      title: 'Газрын зургаар хайх',
      eyebrow: 'Map View',
      body: `
        <p>BairX-ийн газрын зургаар хайх онцлог нь танд Улаанбаатар хотын аль ч цэг дээр идэвхтэй байгаа үл хөдлөх хөрөнгийн заруудыг харааж, харьцуулах боломжийг олгоно.</p>

        <div style="aspect-ratio: 16/9; background: linear-gradient(135deg, var(--primary-soft), white); border-radius: 16px; display: grid; place-items: center; margin: 24px 0; border: 1px dashed var(--line-2); position: relative; overflow: hidden;">
          <div style="position: absolute; inset: 0; background-image:
            radial-gradient(circle at 30% 30%, rgba(30, 91, 255, 0.15) 0%, transparent 30%),
            radial-gradient(circle at 70% 50%, rgba(0, 212, 170, 0.15) 0%, transparent 25%),
            radial-gradient(circle at 50% 70%, rgba(30, 91, 255, 0.1) 0%, transparent 25%);"></div>
          <div style="text-align: center; z-index: 1;">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" style="margin: 0 auto 12px; display: block;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <div style="font-weight: 700; font-size: 18px; margin-bottom: 6px;">Удахгүй нэмэгдэнэ</div>
            <div style="font-size: 13px; color: var(--ink-3);">Google Maps интеграцитай газрын зургийн интерфейс</div>
          </div>
        </div>

        <h4>Газрын зургаар хайхын давуу тал</h4>
        <p><strong>Бүс нутгаар хайх.</strong> Хүссэн дүүрэг, хороо, бүс нутгаа газрын зураг дээрээс шууд сонгоно.</p>
        <p><strong>Дэд бүтэц харах.</strong> Зар бүрийн ойролцоох сургууль, цэцэрлэг, эмнэлэг, дэлгүүрийн зайг автоматаар тооцоолно.</p>
        <p><strong>Тээврийн зам.</strong> Ажил, сургуулийнхаа байршлаас хичнээн минутын зайтайг харах боломжтой.</p>
        <p><strong>Үнийн дулааны зураг.</strong> Бүсчилсэн дундаж үнэ, өсөлтийн чиг хандлагыг өнгөөр харуулна.</p>

        <h4>Дэмжих байршлууд</h4>
        <p>Улаанбаатар хотын бүх дүүрэг, дагуул хотууд (Налайх, Багануур, Багахангай) болон Дархан, Эрдэнэт, Чойбалсан зэрэг томоохон хотуудын мэдээлэл.</p>
      `
    },
    topPicks: {
      title: 'Шилдэг сонголт',
      eyebrow: "Editor's Picks",
      body: `
        <p>BairX-ийн мэргэжилтнүүд, AI системийн хослолоор сонгосон энэ долоо хоногийн хамгийн ашигтай, чанартай заруудын жагсаалт.</p>

        <h4>Энэ долоо хоногийн топ-5</h4>
        <div class="top-pick-list">
          <div class="top-pick">
            <div class="top-pick-rank">1</div>
            <div class="top-pick-info">
              <div class="top-pick-title">Чингэлтэй, шинэ барилга 2 өрөө</div>
              <div class="top-pick-meta">248 сая ₮ · 57 м² · 4.35 сая ₮/м² · Үнэлгээ: ★★★★★</div>
              <div class="top-pick-reason">Зах зээлийн дунджаас 6% доогуур, шинэ стандартын дулаалгатай, эхлэн авагч өрхүүдэд тохирсон сонголт.</div>
            </div>
          </div>
          <div class="top-pick">
            <div class="top-pick-rank">2</div>
            <div class="top-pick-info">
              <div class="top-pick-title">Налайх, барилгын зориулалттай газар</div>
              <div class="top-pick-meta">145 сая ₮ · 600 м² · 242 мянган ₮/м² · Үнэлгээ: ★★★★★</div>
              <div class="top-pick-reason">Хотын ойролцоо хөгжиж буй бүс, жилийн 9.5% өсөлттэй, дэд бүтэц татсан. 5 жилд +18% өгөөж.</div>
            </div>
          </div>
          <div class="top-pick">
            <div class="top-pick-rank">3</div>
            <div class="top-pick-info">
              <div class="top-pick-title">Зайсан, Хүннү 2222, 2 өрөө</div>
              <div class="top-pick-meta">412 сая ₮ · 78 м² · 5.28 сая ₮/м² · Үнэлгээ: ★★★★☆</div>
              <div class="top-pick-reason">Хан-Уул дүүргийн жилийн 7.2% өсөлт. Засвартай, паркинг боломжтой. Дунд анги орлоготой өрхүүдэд тохиромжтой.</div>
            </div>
          </div>
          <div class="top-pick">
            <div class="top-pick-rank">4</div>
            <div class="top-pick-info">
              <div class="top-pick-title">Яармаг, тусгайлсан хаус</div>
              <div class="top-pick-meta">920 сая ₮ · 240 м² · 0.07 га · Үнэлгээ: ★★★★☆</div>
              <div class="top-pick-reason">Гэр бүлд тохиромжтой, өөрийн газартай, тайван бүс. Зах зээлийн дунджаас 8% доогуур үнэтэй.</div>
            </div>
          </div>
          <div class="top-pick">
            <div class="top-pick-rank">5</div>
            <div class="top-pick-info">
              <div class="top-pick-title">Олимп Тауэр, Сүхбаатар 3 өрөө</div>
              <div class="top-pick-meta">605 сая ₮ · 101 м² · 5.99 сая ₮/м² · Үнэлгээ: ★★★★☆</div>
              <div class="top-pick-reason">Хотын төв, бизнес хэсэгт байрлах. Тогтвортой түрээслүүлэх боломжтой (сар бүр 2.8 сая ₮ түрээс).</div>
            </div>
          </div>
        </div>

        <h4>Сонголтын шалгуур</h4>
        <p>Манай систем дараах хүчин зүйлсийг тооцон шилдэг саналыг гаргадаг: үнэ-чанарын харьцаа, байршлын ач холбогдол, дэд бүтэц, зээлийн нөхцөл, ирээдүйн өсөлтийн потенциал, агентын баталгаажилт. Жагсаалт долоо хоног бүр шинэчлэгдэнэ.</p>
      `
    }
  };

  function openInfoPage(key) {
    const page = infoPages[key];
    if (!page) return;
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="info-page">
        <div class="info-page-eyebrow">${page.eyebrow}</div>
        <h2 class="info-page-title">${page.title}</h2>
        <div class="info-page-body">${page.body}</div>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

