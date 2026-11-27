# BairX — Sprint 1–3 deploy заавар

Энэ баримт нь үнийн өгөгдөл, лид, мэдэгдлийн шинэ боломжуудыг production-д гаргах алхмуудыг тайлбарлана.

## 1. Firebase Blaze төлөвлөгөө ба төсвийн анхааруулга

Scheduled Cloud Function зөвхөн Blaze (төлбөртэй) төлөвлөгөөнд ажиллана.

1. Firebase console → Usage and billing → Blaze руу шилжүүлнэ.
2. Google Cloud console → Billing → Budgets & alerts → шинэ budget (жишээ нь сард $10), 50% / 90% / 100% дээр и-мэйл анхааруулга.

## 2. Firestore болон Storage дүрэм

```
firebase deploy --only firestore:rules,storage
```

Storage дүрэм Firestore-оос эрх уншдаг. Анх deploy хийхэд CLI "cross-service rules"-д зөвшөөрөл асууна, зөвшөөрнө.

### Rules v3 (Phase 2–4)

Шинэ collection: `agents`, `reviews`, `siteConfig`, `crmTasks`. Leads-д `search_request` төрөл болон 8 шатны pipeline нэмэгдсэн. Admin/owner `complexStats`, `siteStats`-ийг зөвхөн `source:'manual'` тэмдэгтэйгээр бичиж болно (Cloud Functions deploy хийгдээгүй үеийн гар аргаар шинэчлэх). Storage-д `agent-images/` хавтас нэмэгдсэн.

```
firebase deploy --only firestore:rules,firestore:indexes,storage --project bairx-fd502
```

v3 deploy хийгдээгүй үед сайт `siteConfig/home`-ийг уншиж шалгадаг (`rulesV3Ready()` in js/pages.js). Permission denied гарвал шинэ формууд (хайлт даатгах, сэтгэгдэл) "түр хаалттай" гэж харуулж, агент/Select/сэтгэгдлийн хэсэг нуугдана. Deploy хийсний дараа автоматаар нээгдэнэ.

## 3. Cloud Functions

```
cd functions
npm install
cd ..
firebase deploy --only functions
```

`firebase.json`-ийн predeploy нь `js/pricing.js`-ийг `functions/pricing.js` руу хуулна. Томъёо нэг л газар байна.

| Function | Хэзээ | Юу хийнэ |
|---|---|---|
| `dailyComplexStats` | Өдөр бүр 03:00 (Улаанбаатар) | `complexStats/*`, `siteStats/hotlist`, `siteStats/summary`-г дахин тооцоолно |
| `recomputeStatsNow` | Ажлын самбар → Хэлцэл → "Статистик одоо шинэчлэх" | Дээрхийг шууд ажиллуулна (зөвхөн staff) |
| `onListingActivated` | Зар `active` болох бүрт | `alerts` болон `savedSearches`-тэй тулгаж мэдэгдэл илгээнэ |

Анх deploy хийсний дараа "Статистик одоо шинэчлэх" товчийг нэг удаа дарж эхний өгөгдлийг үүсгэнэ.

## 4. Одоо байгаа зарыг шинэ бүтэц рүү шилжүүлэх

Firebase console → Project settings → Service accounts → "Generate new private key".

```
cd functions
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\key.json"
npm run migrate                                        # dry run, юу өөрчлөгдөхийг хэвлэнэ
npm run migrate:apply                                  # бичнэ
node scripts/migrate-listings.js --apply --create-complexes   # хотхоны каталог үүсгэнэ
```

Скрипт дахин ажиллуулахад аюулгүй: утгатай талбарыг дарж бичихгүй.

## 5. Мэдэгдлийн сувгууд

- **Web Push:** Firebase console → Project settings → Cloud Messaging → Web Push certificates → "Generate key pair". Public key-г `js/alerts.js`-ийн `FCM_VAPID_KEY`-д хуулна. Хоосон бол Push сонголт "удахгүй" гэж харагдана.
- **И-мэйл:** Firebase Extensions → "Trigger Email from Firestore" суулгаж SMTP (эсвэл SendGrid) тохируулна, collection нь `mail`. Function нь тэр collection руу захидал бичдэг.
- **Telegram:** хоёрдугаар ээлжинд. Одоогоор сонголт идэвхгүй.

## 6. Эрх олгох

Owner → Удирдлага → Хэрэглэгчид → цэс → "Менежер болгох" эсвэл "Агент болгох".

- Менежер: бүх лид, хэлцэл оруулах, хотхон, зураг, хэмжилт.
- Агент: зөвхөн өөрт хуваарилагдсан лид.

## 7. Тест

```
cd tests
npm install
npm run test:unit      # томъёоны unit тест (Java шаардлагагүй)
npm run test:rules     # Firestore дүрмийн тест, Java 11+ болон Firebase emulator хэрэгтэй
```

## 8. Vercel

`vercel.json` нь `/privacy`, `/optout`, `/complexes`, `/complex/:id`, `/hotlist`, `/valuation`, `/growth`, `/budget`, `/alerts`, `/crm`, `/b/:slug` замуудыг `index.html` руу чиглүүлнэ. `.vercelignore` нь `functions/`, `tests/`, `docs/`-ийг сайтад оруулахгүй.

## 9. Зөв дараалал

1. Firestore дүрэм, index, Storage дүрмийг deploy хийнэ. Энэ нь одоогийн сайтыг эвдэхгүй (зөвхөн шинэ collection нэмнэ).
2. Blaze идэвхжүүлээд Cloud Functions-ийг deploy хийнэ, "Статистик одоо шинэчлэх"-ийг нэг удаа ажиллуулна.
3. Сүүлд нь PR-ийг `main` руу merge хийнэ. Vercel автоматаар production руу deploy хийнэ.

Frontend-ийг дүрмээс өмнө гаргавал шинэ хуудсууд хоосон эсвэл "алдаа" харуулна.

## 10. CI/CD (`.github/workflows/firebase.yml`)

- PR бүрт: syntax шалгалт, unit тест, emulator дээр дүрмийн тест.
- `main`-д push хийхэд: зөвхөн "production" environment дээр зөвшөөрөл өгсний дараа Firebase deploy.
- Тохируулах: GitHub → Settings → Environments → `production` үүсгэж Required reviewers-т өөрийгөө нэмнэ. Мөн `FIREBASE_SERVICE_ACCOUNT` secret-д service account JSON-ыг хадгална (Firebase Admin, Cloud Functions Admin, Service Account User эрхтэй). Түлхүүрийг repo-д хэзээ ч бүү хийгээрэй.
- Vercel: Git integration аль хэдийн идэвхтэй. `main` → production, бусад branch → preview.

## Deploy-ийн дараах шалгалт

- Нүүр хуудсанд "0" гэсэн тоо харагдахгүй.
- Lighthouse (mobile): Performance ≥ 80, PWA суулгах боломжтой хэвээр.
- Нэвтрээгүй хөтчөөс `leads` уншихыг оролдоход татгалзана (`npm run test:rules` үүнийг баталдаг).
