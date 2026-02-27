# NeredeServis Web Master Plan (V0)

Tarih: 2026-02-24
Durum: Planlama / kod yazimi yok

## 1. Karar Ozeti (Su an onaylanan yon)

1. Tanitim sitesi + web panel birlikte olacak.
2. Ana sayfa (landing) son tasarlanacak; once temel sistem ve panel mimarisi netlesecek.
3. Web panel ilk gunden hem:
   - firma bagli soforler
   - bireysel soforler
   icin destekleyecek.
4. Abonelik satin alma ekranlari ve bize ait internal admin web panel UI ilk fazda olmayacak (sonraya kalacak); ancak kontrol/uzaktan mudahale altyapisi ve policy/runbook planlanacak.
5. Web-first ilerlenebilir; mobil app sonradan web/backend kontratlarina gore uyarlanacak.

## 2. Mimari Ilke (ana karar)

Ana prensip:
- Backend (auth/data/realtime) tarafini bozma.
- Web arayuzlerini ayri katman olarak ekle.
- Kurumsal RBAC'yi mobil `driver/passenger/guest` rolunden ayri tasarla.

Bu nedenle onerilen temel:
- Data/API: Firebase (mevcut, geliştirilecek)
- Web frontend hosting: Azure Static Web Apps (onerilen)
- DNS/WAF: Cloudflare (onerilen, opsiyonel ama tavsiye)
- Kaynak kod / CI / issue takibi: GitHub

## 3. Neden boyle?

- Mevcut sistem zaten Firebase Functions + Firestore + RTDB ile kurulmus.
- Canli konum ve trip akislari backendde var.
- Web paneli sifirdan baska backend ile kurmak zaman ve risk artirir.
- Azure Static Web Apps, static/public site + panel hostingi icin kurumsal ve stabil bir secenektir.
- Ogrenci asamasinda Azure for Students ile deneme/staging tarafinda avantaj saglayabilir.
- Firebase Hosting tarafinda false-positive/abuse hassasiyeti konusunda cekincen oldugu icin frontend hostingi Firebase disina almak risk algisini azaltir.

## 4. Urun Cekirdegi (ilk hedef)

Web panelin ilk isi:
- Firma / operasyon kullanicilari icin kontrol merkezi olmak
- Bireysel sofor icin masaustu yonetim paneli sunmak
- Canli operasyon gorunurlugu vermek

Ilk fazda "tam ERP" degil, operasyon cekirdegi:
- sofor
- arac
- rota
- durak
- aktif sefer / canli takip
- temel rapor / log

## 5. Kritik Teknik Gercekler (mevcut repo okumasi)

- Firestore direct client write kapali; server-side mutasyon modeli var.
- RTDB `locations` canli konum icin kullaniliyor.
- `routeWriters` grant/revoke akisi var (aktif trip soforu yaziyor).
- `companyId` alanlari bazi modellerde hazir ama tenant modeli tam aktif degil.
- Mobil role modeli (`driver/passenger/guest`) kurumsal panel rollerini karsilamiyor.

Sonuc:
- Web panel icin yeni "company + company_member + vehicle + policy" katmani gerekecek.

## 6. Fazlama (ust seviye)

Faz 0: Plan + kararlar + domain/hosting setup
Faz 1: Auth + temel panel iskeleti + dashboard + bireysel sofor paneli
Faz 2: Firma tenant + RBAC + sofor/arac/rota yonetimi
Faz 3: Canli operasyon ekrani + audit log + raporlar
Faz 4: Abonelik/odeme altyapi hazirligi + internal admin kontrol altyapisi/policy (UI degil)
Faz 5: Landing page final tasarim ve pazarlama optimize

## 7. "Mimar karari" (net tavsiye)

Su an icin en dogru rota:
- Backend: Firebase'de kal (ama web ihtiyacina gore gelistir)
- Frontend hosting: Azure Static Web Apps kullan
- DNS: Cloudflare uzerinden yonet
- GitHub: ana source + CI/CD + issue/project kullan

Bu kombinasyon, ogrenci butcesi + web-first teslimat + saglam temel dengesi icin pragmatik secim.

## 8. Review Sonrasi Kritik Guncellemeler (2026-02-24)

Dis review / elestiri turu sonrasi planin ana guncellemeleri:
- `Company of 1` tenant standardizasyonu kabul edildi (bireysel UX korunur, backend ortak company modeli kullanir)
- Live ops/read modelde MVP sadeleştirme kabul edildi (projection endpointler trigger/esik tabanli)
- Vehicle modeli security posture nedeniyle MVP'de company-scoped path'e revize edildi
- Map provider farklari icin MVP'de telemetry-first, pilot sonrasi triggerli standardization stratejisi eklendi
- Mobile migration/backward compatibility + white-glove onboarding + force update + billing + advanced security + reporting/export + DR/retention konulari detay planlara ayrildi

Detaylar icin:
- `53_critique_integration_review_and_plan_update_register.md`
- `54_adr_006_company_of_one_tenant_standardization.md`
- `55_adr_007_mvp_read_model_simplification_and_projection_triggers.md`
- `56_adr_008_vehicle_collection_security_revision.md`
- `57_adr_009_map_standardization_and_eta_consistency.md`
- `79_vercel_deploy_budget_policy.md` (aktif deploy butcesi ve release penceresi kurali)
