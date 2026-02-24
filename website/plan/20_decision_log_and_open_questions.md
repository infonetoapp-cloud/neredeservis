# Decision Log + Open Questions (Rolling)

Tarih: 2026-02-24
Durum: Aktif karar kaydi

## 1. Amac

Karar ve acik sorulari tek yerde tutmak.

Format:
- ID
- Konu
- Durum
- Karar
- Not / sonraki adim

## 2. Alinan Kararlar (Current)

### D-001 - Web-first ilerleme

Durum: Alindi

Karar:
- Web panel domain modeli ve API kontratlari once tasarlanacak
- Mobil app sonradan bu kontratlara uyarlanabilecek

Not:
- Bu karar, kurumsal panel tasariminin temiz cikmasi icin verildi

### D-002 - Frontend hosting

Durum: Alindi

Karar:
- Azure Static Web Apps (frontend)
- Firebase backend korunacak

### D-003 - DNS/WAF

Durum: Alindi

Karar:
- Cloudflare DNS/WAF

Not:
- Domain `name.com` registrar
- DNS Cloudflare'a bagli

### D-004 - Web teknoloji secimi

Durum: Alindi

Karar:
- TypeScript + Next.js (React)

### D-005 - Web uygulama ayrimi

Durum: Revize edildi

Karar:
- MVP'de tek Next.js app (marketing + dashboard route groups) + tek SWA deploy
- landing/panel split post-pilot trigger tabanli karar

### D-006 - Ortam politikasi

Durum: Alindi

Karar:
- dev = gelistirme
- stg = release dogrulama/demo
- prod = gercek kullanici

### D-007 - Student hesabinin kullanimi

Durum: Alindi

Karar:
- student hesap dev/staging/demo icin
- production icin PayG + SWA Standard
- mimari eksik kurulmaz

### D-008 - Kod sagligi kurali

Durum: Revize edildi

Karar:
- genel soft cap: tek dosyada `500` satir
- UI render-agir componentlerde kontrollu esneme olabilir (yaklasik `800`, review gerekceli)
- logic/service/policy dosyalarinda daha siki limit uygulanir (500+ refactor adayi)
- spagettiyi engelleyen moduler tasarim zorunlu

Not:
- `15_engineering_standards_and_code_health.md` revize edildi (UI vs logic ayrimi)

### D-009 - Web auth provider seti

Durum: Alindi

Karar:
- MVP'de `Email/Password + Google Sign-In`

Not:
- Kurumsal hizli onboarding ve operasyon kolayligi icin secildi

### D-010 - Live ops read modeli

Durum: Alindi

Karar:
- Hibrit model
  - CRUD/list/detail readler icin Firestore
  - secili canli operasyon akislari icin RTDB stream
  - dashboard/aggregate ihtiyaclarinda hedefli projection endpoint/snapshot

Not:
- MVP'de company-level RTDB live access kullanilacak; routeReaders granular grants post-pilot tetigine alindi
- ADR-007 ile Faz 1-2 uygulamasi sadeleÅŸtirildi (projection endpointler trigger/esik tabanli)

### D-011 - Vehicle collection sekli

Durum: Revize edildi

Karar:
- Ilk Faz 0 karari global `vehicles/*` idi
- ADR-008 ile MVP default `companies/{companyId}/vehicles/*` oldu

Not:
- tenant izolasyonu ve solo-founder security posture onceliklendirildi

### D-012 - Staging domain stratejisi

Durum: Alindi

Karar:
- Faz 1'de Azure generated staging/preview domain yeterli
- `stg-app.neredeservis.app` sadece net ihtiyac dogarsa acilir (default degil)

Not:
- Erken karmaÅŸÄ±klÄ±k azaltÄ±lÄ±r, kalite algisi kritik noktada yukseltilir

### D-013 - Company of 1 tenant standardizasyonu

Durum: Alindi

Karar:
- Bireysel soforler backend/domain modelde `individual_operator` company tenant olarak temsil edilir
- UX mod farki korunur; policy/data katmani company-temelli ortak kalir
- Company-of-1 tenant olusturma lazy init ile yapilir (ilk bireysel operator aksiyonunda), tum signup'larda otomatik degil

Not:
- ADR-006

### D-014 - MVP read model sadeleÅŸtirme kurali

Durum: Alindi

Karar:
- Hibrit read modeli korunur
- Faz 1-2'de projection endpointler default degil
- Basit dashboard KPI'lar client-side aggregation ile baslayabilir

Not:
- ADR-007

### D-015 - Map canonical route/ETA + standardization trigger

Durum: Alindi

Karar:
- MVP'de hibrit provider + koordinat odakli canli gorunum kabul edilir
- Mismatch telemetry toplanir
- Backend canonical route/ETA standardization yatirimi pilot sonrasi trigger ile acilir

Not:
- ADR-009 (MVP-cut revizyonu)

### D-016 - Tasarim tooling karari (UI kit-first, Stitch opsiyonel)

Durum: Alindi

Karar:
- UI kit / component kit implementation defaultu olacak
- Stitch ideation/varyasyon araci olarak opsiyonel kalacak
- Figma freeze/handoff/systemlesme araci olarak kullanilabilir

Not:
- `46_*` / `47_*` guncellendi

### D-017 - Bulk Import UI fazlama karari

Durum: Alindi

Karar:
- MVP/pilot oncesi self-serve Bulk Import UI yapilmayacak
- Ilk kurumsal onboarding white-glove (manuel/script destekli) olacak
- Self-serve import UI Faz 6+ trigger tabanli backlog

Not:
- `58_*`, `65_*`

### D-018 - Mobile force update + server-side version enforcement

Durum: Alindi

Karar:
- Legacy compatibility layer sunset icin Remote Config force update + server-side min version enforcement birlikte kullanilacak
- Aggressive cutoff uygulanacak; legacy write path reject davranisi `426 Upgrade Required` (veya structured esdegeri) ile standartlasacak
- Compatibility adapter write-path omru dar ve kesin sunset tarihli tutulacak
- Eski client Force Update UI kapasitesi yoksa server-side reject fallback'i ana kilit olur; time-boxed legacy shim ihtiyaci endpoint bazli degerlendirilebilir

Not:
- `71_*`

### D-019 - Route/trip full versioning fazlama karari

Durum: Alindi

Karar:
- MVP'de full publish/versioning modeli yok
- MVP minimum koruma: trip snapshot + route edit warning + Firestore `updateTime`/version-token tabanli basic conflict guard
- Aktif seferde durak silme/siralama degisikligi gibi yapisal mutasyonlar MVP'de server-side soft-lock ile deny edilebilir
- Full versioning/publish semantigi pilot sonrasi tetiklenir

Not:
- `62_*`, `67_*`

### D-020 - Live ops stale/offline tolerance semantigi

Durum: Alindi

Karar:
- Live ops UI stale/degraded/offline_assumed durumlari timestamp bazli tanimlanacak
- Pilotta threshold tuning yapilacak
- onDisconnect/baglanti-koptu sinyali varsa offline durumu stale timer'a gore bekletilmeden one alinabilir

Not:
- `72_*`

### D-021 - Live ops revoke latency hardening (claims-only degil)

Durum: Alindi

Karar:
- RTDB live access icin claims'e ek olarak RTDB access mirror (server-maintained) kullanilacak
- Kritik yetki degisikliklerinde refresh token revoke/re-auth akisi planlanacak
- Mirror sync failure icin alert + reconcile + max session refresh failsafe eklenecek
- Company suspension fan-out write maliyeti buyurse company-level live access kill-switch optimizasyonu kullanilabilir

Not:
- `59_*`

### D-022 - Cross-tenant vehicle operasyon modeli

Durum: Alindi

Karar:
- `Vehicle` dokumani tenant-local owned asset olarak kalir
- MVP'de cross-tenant arac kullanimi desteklenmez
- Cross-tenant talep dogarsa post-pilot binding/projection modeli ayrica acilir (default degil)

Not:
- `08_*`
- Bu karar "bireysel sofor kendi araciyla baska firmanin operasyonunda calissin" senaryosunu MVP disina iter; onboarding/policy ile acik yonetilir

### D-023 - Billing entitlement/suspension omurgasi pilot oncesi

Durum: Alindi

Karar:
- Payment UI/provider entegrasyonu sonra olabilir
- Ama `billingStatus`/entitlement/suspension state machine + banner/lock behavior pilot oncesi netlesir
- MVP billing core 3-state olarak tutulur: `active`, `past_due`, `suspended_locked`
- Internal admin kontrol/uzaktan mudahale altyapisi (policy/runbook/script path) pilot oncesi planlanir
- Internal admin React/web panel UI tum site/panel cekirdegi bittikten sonra gelir
- Provider yokken bile `billingValidUntil` + scheduled failsafe job ile manuel unutma riski azaltilir

Not:
- `60_*`

### D-024 - Karar degisimi sonrasi MD senkron kuralı

Durum: Alindi

Karar:
- Mimari/plan karari degistiginde ilgili tum plan dokumanlari senkron guncellenecek
- Minimum zorunlu zincir: `20_*`, ilgili spec/ADR, `16_*`, `19_*`, gerekiyorsa `69_*`
- Eski karar izi kalmamasi icin anahtar kelime taramasi (rg/grep) kullanilacak

Not:
- `73_decision_change_propagation_checklist.md`

### D-025 - Web package manager secimi (execution)

Durum: Alindi

Karar:
- Web repo/bootstrap icin package manager `pnpm`
- lockfile disiplini `pnpm-lock.yaml` ile korunur
- Sistem izinleri nedeniyle global `pnpm` yoksa `npx pnpm@latest ...` wrapper kullanimi gecici olarak kabul edilir

Not:
- Faz 1 bootstrap baslatildi, `website/apps/web` scaffold `pnpm` ile olusturuldu

### D-026 - Lokal web Firebase bootstrap hedefi (gecici)

Durum: Alindi (gecici execution karari)

Karar:
- Lokal web bootstrap'te placeholder Firebase degerleri kullanilmaz
- Firebase CLI/IAM ile `neredeservis-dev-01` web app registrations listelenemiyorsa, gercek Firebase Hosting `__/firebase/init.json` config'i donen ortam (su an `stg`) ile bootstrap edilir
- `NEXT_PUBLIC_FIREBASE_APP_ID` web app registration SDK config alinana kadar opsiyonel tutulur (auth+rtdb bootstrap icin)
- Final env freeze (`dev/stg/prod`) Firebase Console web app registration ve authorized domains tamamlaninca yapilir

Not:
- `firebase projects:list` mevcut CLI hesabinda `neredeservis-*` projelerini gostermedi
- `canpolatmail0@gmail.com` gcloud hesabi ile `dev/stg/prod` projelerine proje-owner erisimi dogrulandi
- Firebase Management API cagrilarinda `x-goog-user-project` quota-project header'i zorunlu
- 2026-02-24: `dev/stg/prod` icin Firebase Web App registration'lari olusturuldu ve SDK config'leri alindi (bkz. `docs/firebase_app_registry.md`)
- `Email/Password` + `Google` provider durumlari `dev/stg/prod` icin API ile dogrulandi (enabled)
- `dev` + `stg` authorized domains listesine `localhost` ve `127.0.0.1` eklendi (lokal Google auth smoke icin)
- `neredeservis-dev-01` web SDK config'i ile lokal auth bootstrap calisiyor (`stg` init.json fallback artik ana yol degil)
- `43_*`, `27_*`, `29_*` guncellendi

## 3. Acik Sorular (Faz 1 oncesi kapanacak)

### Q-001 - Landing ve panel ilk kurulumda tek repo app mi, iki app mi?

Durum: Cevaplandi (revize)

Not:
- MVP default: tek app + route groups
- split ihtiyaca gore post-pilot degerlendirilir

### Q-002 - Web staging custom domain hemen acilsin mi?

Durum: Cevaplandi

Karar:
- Faz 1'de hayir (generated domain)
- custom staging domain ihtiyaca gore (default degil)

### Q-003 - Live ops read modeli

Durum: Cevaplandi (kritik)

Karar:
- Hibrit model (RTDB + Firestore + hedefli projection endpoint)

### Q-004 - Web panel auth provider seti

Durum: Cevaplandi

Karar:
- Email/Password + Google

### Q-005 - Vehicle koleksiyonu tenant alti mi global mi?

Durum: Cevaplandi (revize edildi)

Karar:
- Ilk karar global idi
- ADR-008 ile MVP default `companies/{companyId}/vehicles/*`

## 4. Sonraki Karar Turlari (Planli)

Faz 1 bootstrap oncesi (bloklayici olmayanlar haric):
- Azure/Firebase region alignment son teyidi (latency smoke ile)
- naming convention freeze (resource/app/env) [tamamlandi: `74_*`]
- Firebase Auth provider/authorized domains finalizasyonu (Google auth smoke icin gerekli; web app registrations tamamlandi)

Faz 2 oncesi:
- activeCompanyId claims semantigi (MVP) son teyidi
- legacy mobile compatibility sure/takvim politikasi (ilk taslak)
- route permission granularity genisligi
- audit retention policy
- recurrence/timezone/DST policy freeze
- force update cutoff template/operasyon seviyesi teyit

Faz 3 oncesi:
- odeme provider shortlist (TR odakli)
- projection endpoints kapsami (triggerlere gore)
- live ops scaling stratejisi
- feature flag platform minimum V1 kapsami

Faz 6 oncesi:
- routeReaders/granular live grants gerekli mi? (pilot verisine gore)
- full route/trip versioning/publish semantigi yatirimi acilsin mi?

## 5. Karar Kayit Kurali

Yeni mimari karar oldugunda:
- bu dosyaya eklenir
- gerekiyorsa ilgili plan dokumanina link verilir
- tarih atilir
