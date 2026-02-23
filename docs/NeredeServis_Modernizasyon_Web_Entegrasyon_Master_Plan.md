# NeredeServis Modernizasyon + Web Entegrasyon Master Plani

Tarih: 2026-02-22  
Durum: Oneri / Uygulama Baslangic Plani  
Kapsam: Mobil uygulama temelini temizleyip uzun omurlu hale getirmek + sirket paneli (web) entegrasyonuna hazirlamak

## 1. Amac (North Star)

Bu planin amaci, NeredeServis'i:

- kisa vadede bug fix/refactor yaparken kirilmayan,
- orta vadede ekip buyudugunde ownership ve teslim hizi dusmeyen,
- uzun vadede mobil + web panelin ayni domain diliyle calistigi,
- denetlenebilir, test edilebilir, guvenli ve olceklenebilir

bir urun/muhendislik temeline oturtmaktir.

Hedef seviye: "modern, uzun omurlu, product engineering" kalitesi.  
Pratikte bu su demektir:

- Router veri erisimi yapmaz.
- Rol koridorlari (driver/passenger/admin) tasarim seviyesinde ayrilir.
- Is kurallari use case katmaninda toplanir.
- Mobil ve web ayni API/domain kontratlariyla calisir.
- Degisiklikler faz-faz, geri alinabilir ve olculebilir ilerler.

## 2. Neden Simdi (Mevcut Gercek Durum)

Kod tabanindaki mevcut durum, bu plani "nice-to-have" degil "zorunlu" hale getiriyor:

- `lib/app/router/app_router.dart` cok buyuk ve cok fazla sorumluluk tasiyor.
- Router icinde dogrudan Firebase Auth / Firestore / Functions erisimleri var.
- Router icinde gomulu widget/state siniflari ve business akislari var.
- Riverpod + repository altyapisi mevcut olmasina ragmen ana akisin bir kismi bunu bypass ediyor.
- Test altyapisi var ama tek bir "tam test lane" guvenilir degil (stale testler + compile kiriklari var).
- Global Flutter ile `.fvm` SDK farki mevcut; ekipte "yanlis SDK" riski var.
- Yari kalmis UI rename/refactor (Amber -> Core) izleri nedeniyle baseline kiriklari bulunuyor.

Sonuc: Yeni ozellik ekledikce teknik borc exponential buyur. Bu plan bunu durdurmak icin tasarlandi.

## 3. Kapsam

## 3.1 Sabit Gercekler ve Bilincli Belirsizlikler (Web Panel)

Bu plan web panel icin "icerik/IA tamamen netlesmeden" ilerlemek uzere tasarlanmistir.

Sabit olan (planin uzerine kuruldugu) gercek:

- Web uzerinden sirket/fabrika yetkilendirme yonetimi yapilacak.

Henuz net olmayan alanlar (bilincli olarak defer edilir):

- Web sitesi bilgi mimarisi/icerik sayfalari
- Pazarlama/landing/kurumsal icerik yapisi
- Son kullaniciya donuk site icerigi ve metinleri
- Web panel UI/UX detaylari

Plan karari:

- Bu belirsizlikler Faz 4-5 oncesi backend/domain/API temelini bloke etmez.
- Web panel hazirligi "icerik once" degil "yetki + tenant + API kontrati once" ilerler.
- Web panel UI kapsam kararlarinda ADR kullanilir; fakat tenant/RBAC/API boundary kararları ertelenmez.

## Dahil Olanlar

- Mobil uygulama mimari temizligi (router, guard, use case, repository kullanimi)
- Test/CI stabilizasyonu
- Rol koridor ayrimi
- Domain ve data boundary netlestirme
- Web panel entegrasyonuna uygun backend/domain/API kontrat zemini
- Sirket/tenant/permission modeli hazirligi
- Observability / audit / rollout disiplinleri

## Simdilik Dahil Olmayanlar (Anti-Goals)

- Big-bang rewrite
- Tum ekranlari tek seferde feature klasorlerine tasima
- Tek PR ile router + UI + domain + backend toplu degisim
- Web panel UI teknolojisini erken kilitlemek (ADR olmadan)
- "Temiz gorunsun" diye davranis degistiren refactor

## 4. Plana Sadakat Kurallari (Degisiklik Yonetimi)

Bu planin ise yaramasi icin kurallar net olacak. "Arada ufak degisiklik" kulturune kaymayacagiz.

- Faz sirasi bozulmaz.
- Bir faz kapanmadan bir sonraki faza davranis degistiren is alinmaz.
- Her faz sonunda calisan build + tanimli test lane zorunlu.
- Plan disi degisiklikler icin mini-ADR (1 sayfa) gerekir.
- "Acil bug" disinda mimari fazlara feature eklenmez.
- Refactor PR'lari davranis degistiren PR'lardan ayrilir.
- Her fazin acceptance criteria'si yazili ve olculebilir olacaktir.
- Her hafta bir "architecture checkpoint" yapilir (30-45 dk).

## 5. Non-Negotiable Mimari Prensipler

Bu prensipler "opsiyonel tercih" degil, temel standarttir.

1. Router safligi
- Router sadece route registry, redirect orchestration ve navigation wiring yapar.
- Router icinde dogrudan Firebase/Firestore/Functions cagrisi olmaz.
- Router icinde kalici business state tutulmaz.

2. Rol koridor izolasyonu
- Driver, Passenger ve ileride Admin/Dispatcher akislari corridor mantigiyla ayrilir.
- Bir rolun ekrani diger rol tarafinda "tesadufen" acilamaz.
- Istisnalar acik allow-list ile tanimlanir (orn. tracking/join gibi kontrollu akislarda).

3. Use case odakli is mantigi
- Ekran ve router "ne gosterilecegini" bilir.
- Use case "is nasil calisir" bilgisini tasir.
- Repository "data nasil okunur/yazilir" bilgisini tasir.

4. Typed kontratlar
- Typed route params
- Typed errors
- Typed command/request/response modelleri
- Versionlanabilir API kontratlari

5. Tek kaynakli domain dili
- Mobil ve web ayni terimleri kullanir: company, member, driver, route, stop, trip, assignment, invite.
- "UI bazli" isimler backend/domain tasarimini yonetmez.

6. Olculmeyen degisiklik yapilmaz
- Redirect/role-switch kritik akislari telemetry ile olcecegiz.
- Hata siniflari, retry, fallback davranislari standardize edilecek.

## 6. Hedef Mimari (Mobil + Web Entegre)

## 6.1 Mantiksal Topoloji

Sistem 5 ana katmanda ele alinacak:

1. Mobile Apps (tek kod tabani icinde driver + passenger deneyimi)
2. Web Admin Panel (sirket/operasyon kullanicilari)
3. Application/API Katmani (Functions/HTTP/Callable + orchestration)
4. Data Katmani (Firestore, RTDB, local cache/queue)
5. Platform Katmani (auth, telemetry, permissions, billing, feature flags)

## 6.2 Mobil Tarafta Hedef Yapi

- `app/router/*`: route registry + guards + redirect policy
- `features/<feature>/application/*`: use case / service orchestration
- `features/<feature>/domain/*`: entity / value object / policy
- `features/<feature>/data/*`: repository impl / datasource adapters
- `features/<role>/presentation/*`: ekran + presenter/viewmodel (kademeli)
- `app/providers/*`: DI/wiring (Riverpod)

Not:
- Riverpod standart olarak korunacak.
- Yeni state management eklenmeyecek.
- "Rewrite" yerine mevcut provider/repository altyapisi aktive edilecek.

## 6.3 Web Panel Tarafta Hedef Yapi (Sirket Paneli)

Web panelin ana amaci:

- Sirket olusturma / sirket ayarlari
- Yetkili kullanici (admin/dispatcher) yonetimi
- Sofor olusturma/davet etme
- Rota olusturma/guncelleme/arsivleme
- Durak olusturma/siralama/silme
- Sefer/trip planlama ve goruntuleme
- Canli durum izleme (read-only / kademeli control)
- Audit log ve operasyon kaydi

Teknik prensip:

- Web panel "mobili taklit eden" bir UI degil.
- Web panel backend ile resmi API kontratlari uzerinden konusur.
- Web panel yazma operasyonlari audit + authorization + validation iceren application/API katmanindan gecer.

## 6.4 Mobil + Web Ortak Kontrat Katmani

Mobil ve web ayni davranislari farkli yollarla yazmamak icin "kontrat once" yaklasimi uygulanacak.

Ortaklasacak alanlar:

- Resource kimlikleri ve adlandirma (`companyId`, `routeId`, `tripId`, `driverId`)
- Command/response semalari
- Hata kodu sozlugu
- Permission/RBAC karar sozlugu
- Event/telemetry isimlendirme standardi
- Audit event tipleri

Bu kontratlar baslangicta dokuman + test ile baslar, sonra kod-uretilen schema/OpenAPI/JSON Schema katmanina tasinir.

## 6.5 Web Entegrasyonunda Backend API Standartlari (Kritik)

Web panelin backend ile nasil konusacagi erken netlesmezse "hizli ama kirilgan" bir admin panel olusur.

Temel kural:

- Web panel kritik yazma operasyonlarinda dogrudan Firestore'a browser'dan yazmaz.
- Yazma operasyonlari application/API katmani uzerinden gecer.
- API katmani authorization + validation + audit + idempotency uygular.

API tasarim prensipleri:

- Operasyonel CRUD ve mutasyonlar icin resmi API surface (HTTP veya callable, karar ADR ile)
- Her mutasyonda request id / correlation id
- Idempotent mutasyonlar icin `idempotencyKey` destegi (uygun endpointlerde)
- Typed error codes + user-safe error messages
- Versionlama (`/v1` veya esdeger kontrat version stratejisi)
- Server-side authorization zorunlu (UI role check tek basina yeterli degil)

Web guvenlik notlari:

- CORS/Origin allow-list politikasi
- CSRF/XSRF korumasi (HTTP tercih edilirse)
- Rate limit / abuse guard (admin endpointleri dahil)
- Admin action audit log zorunlulugu

## 6.6 Data Ownership ve Source-of-Truth Kurali

Mobil + web birlikte buyurken en tehlikeli risklerden biri "ayni veri birden fazla yerde authoritative gibi davranmasi"dir.

Bu nedenle her veri tipi icin source-of-truth acik tanimlanacak:

- Firestore: business state (company/driver/route/stop/trip metadata vb.)
- RTDB: low-latency live location / transient stream state (uygunsa)
- Local Drift/Queue: offline queue + local cache + retry state (authoritative degil)

Kurallar:

- Ayni business alaninin iki farkli kaynaga cift yazimi sadece acik migration penceresinde yapilir
- Sync/retry/merge kurallari dokumante edilir
- "Last write wins" kullanilan alanlar acik listelenir
- Conflict resolution gerektiren alanlar use case/policy katmaninda cozulur

## 7. Hedef Domain ve Yetki Modeli (Web Entegrasyon Hazirligi)

## 7.1 Cekirdek Varliklar

- Company
- CompanyMember (role: owner/admin/dispatcher/viewer)
- DriverProfile (company bagli)
- Vehicle (opsiyonel ama hazir tasarim)
- Route
- Stop
- Trip
- Assignment (driver <-> route/trip)
- PassengerMembership / PassengerJoin
- Invite
- AuditLog

## 7.2 Multi-Tenant Kurali (Kritik)

Tum business kayitlarinda tenant siniri acik olacak:

- `companyId` zorunlu alan (uygun varliklarda)
- Yetki kontrolleri `userId + companyId + role` uzerinden yapilir
- Cross-tenant okuma/yazma default olarak yasak
- "Super admin" operasyonlari yalniz backend tarafinda, audit zorunlu

## 7.3 RBAC / Policy Temeli

Roller (web panel icin):

- `owner`
- `admin`
- `dispatcher`
- `viewer`

Roller (mobil uygulama icin):

- `driver`
- `passenger`
- `guest`

Kural:

- Mobil rol ile sirket panel RBAC rolunu ayni sey sanmayacagiz.
- Gerekirse ayni kullanici hem `driver` hem `companyMember(dispatcher)` olabilir.
- Yetki karari "tek string role" yerine policy fonksiyonlariyla verilecek.

## 7.4 PII ve Veri Gorunurluk Kurali (Web Panel Icin)

Sirket paneli geldikten sonra veri erisimi riski buyur. Bu nedenle PII gorunurlugu role bazli tanimlanacak.

Prensipler:

- Minimum gerekli veri goruntuleme (least data exposure)
- Role bazli alan maskeleme (orn. telefon/email alanlari)
- Export/islem loglama (kim hangi hassas veriyi gordu/degistirdi)
- Passenger verisi ile operasyon verisinin ayri policy kurallari
- Support/admin istisnalari audit + zaman sinirli izin modeli ile

## 8. Faz Yol Haritasi (Master Plan)

## Faz 0A - Baseline Stabilization (Zorunlu)

Amac:
- "Temizleme" isine baslamadan once calisan ve olculebilir bir baseline yaratmak.

Is Paketleri:

- FVM guardrail:
  - `.fvm` SDK kullanimi standardize edilir
  - Yerel/CI komutlari `fvm flutter ...` veya fallback olarak `.fvm/flutter_sdk/bin/flutter` ile sabitlenir
  - Global Flutter ile calisma riski dokumante edilir ve preflight script eklenir
- Branch hygiene:
  - Yari kalmis Amber -> Core rename/refactor baseline'i netlestirilir
  - Compile kiriklari "mimari refactor"dan once ayrilir/kapatilir veya quarantine edilir
  - Refactor branch'leri icin "baseline tag/commit" belirlenir
- Test lane ayrimi:
  - `router-guards`
  - `domain-application`
  - `ui-widget`
  - `integration-smoke`
- Stale test cleanup:
  - Guncel guard davranisiyla celisen router testleri duzeltilir

Ciktilar:

- Calisan baseline build
- En azindan kisa lane'ler guvenilir hale gelir
- SDK karmasasi bitirilir
- Refactor riskleri gorunur olur

Acceptance Criteria:

- Tanimli preflight komutu her makinede ayni SDK'yi raporlar
- `router-guards` lane yesil
- `domain-application` lane compile olur (hedef: yesil)
- Baseline kiriklari ayrik listede takip edilir (quarantine listesi)

## Faz 0B - Test/CI Governance (Kalite Kapisi)

Amac:
- "Tek komut fail" durumunu yonetilebilir kalite kapilarina cevirmek.

Is Paketleri:

- CI pipeline lane bazli yeniden duzenlenir
- Her lane icin timeout ve owner tanimlanir
- Failing tests icin quarantine etiketi + geri donus tarihi konur
- PR template'e lane checklist eklenir
- Mimari degisimlerde zorunlu test matrix alanlari eklenir
- CODEOWNERS / review ownership matrisi tanimlanir (router, auth, domain, web-api, ui)
- ADR ritmi netlestirilir (hangi degisiklikler mini-ADR zorunlu)

Acceptance Criteria:

- PR'da hangi lane'lerin kosulacagi net
- Quarantine edilen her testin owner + target date'i var
- "Unknown flaky" kategorisi sifir

## Faz 1 - Koridor Ayrimi (Driver / Passenger)

Amac:
- Rol bazli navigation davranisini deterministic ve denetlenebilir hale getirmek.

Is Paketleri:

- Route registry modullerine ayrilir:
  - `public_routes.dart`
  - `driver_routes.dart`
  - `passenger_routes.dart`
  - `shared_routes.dart`
- Ayrik shell yapisi (GoRouter shell/stateful shell uygun tasarimla)
  - `DriverShell`
  - `PassengerShell`
- Role corridor coordinator (state machine mantigi)
  - role switch transaction
  - stack reset
  - role-specific bootstrap/fallback
- Guard matrix netlestirme
  - `AuthGuard`
  - `RoleGuard`
  - `ConsentGuard`
  - `SubscriptionGuard`

Davranis Kurallari:

- Driver -> passenger koridoruna default girmez
- Passenger -> driver koridoruna default girmez
- Istisna rotalar explicit allow-list ile tanimlanir
- Back behavior ve app cold-start behavior testlenir

Acceptance Criteria:

- Role switch deterministic
- Guard matrix testleri yazili ve yesil
- `driver/paywall`, `passenger/settings`, `driver/settings` (veya alias policy) net
- Deep-link backward compatibility korunur

## Faz 2 - Router Zayiflatma (God Module Parcalama)

Amac:
- `app_router.dart` dosyasini orchestration seviyesine indirmek.

Is Paketleri:

- Router icindeki `_handle*` business akislarini use case/service katmanina tasima
- Router icindeki FirebaseAuth/Firestore/Functions cagrilarini repository/use case uzerine alma
- Router icindeki gomulu widget/state siniflarini presentation dosyalarina tasima
- Router side-effect cleanup:
  - telemetry configure
  - session hydrate vb. kurulumlari app bootstrap/composition root'a alma
- Typed route param parser/validator yardimcilari

Acceptance Criteria:

- Router icinde dogrudan data access sifir
- Router icinde gomulu business widget sinifi kalmaz (hedef)
- Router dosya boyutu ciddi azalir (hedef KPI tanimlanir)
- Redirect ve deep-link davranisi regresyon testleriyle korunur

## Faz 3 - Domain + Data Boundary Aktivasyonu (Mevcut Altyapiyi Kullan)

Amac:
- Ekran/router/provider katmanlarinda dogrudan backend konusmalari azaltmak ve kurallastirmak.

Is Paketleri:

- Mevcut repository interface/implementasyonlarini aktif kullanima alma
- Use case paketleri olusturma / tamamlama:
  - Driver use cases
  - Passenger use cases
  - Shared auth/session/profile/consent use cases
- Presentation katmaninda repository yerine use case tercih etme
- Error normalization standardi
- Idempotency / optimistic concurrency kurallarini command seviyesinde toplama

Acceptance Criteria:

- Router ve presentation katmanlarinda dogrudan Firestore/Functions cagrilari hedeflenen sinira iner (nihai hedef: sifir)
- Kritik akislar use case testleri ile korunur
- Error codes mobil + backend kontratinda hizalanir

## Faz 4 - Web Entegrasyon Hazirligi (Backend / Kontrat / Tenant)

Amac:
- Sirket paneli gelmeden once backend/domain sinirlarini resmi hale getirmek.

Is Paketleri:

- Multi-tenant domain kurallari
  - `companyId` stratejisi
  - membership / invite / RBAC kurallari
- Admin/API surface tanimlama
  - route create/update/archive
  - stop CRUD/reorder
  - driver create/invite/assign
  - trip planning/monitoring endpoints
  - company/member management endpoints
- Kontrat standardi
  - request/response schema
  - versionlama (`v1`)
  - error catalog mapping
  - consumer-driven contract test stratejisi (mobil/web -> backend)
- API security/runtime standardi
  - authn/authz boundary
  - CORS/CSRF (uygun protokole gore)
  - rate limit / abuse controls
  - idempotency key policy
- Audit log standardi
  - kim neyi ne zaman degistirdi
  - before/after (uygun alanlarda)
- Authorization katmani
  - policy evaluators
  - server-side guardrail
- Legacy data migration/backfill plani
  - mevcut kayitlara `companyId`/ownership backfill stratejisi
  - migration penceresi ve backward compatibility kurali
  - cutover + rollback plani
- Firestore/Index/query kapasite hazirligi
  - gerekli composite index listesi
  - admin panel sorgu/desenleri icin performans/cost review

Acceptance Criteria:

- Web panelin kullanacagi kritik operasyonlar icin resmi API kontrati yazili
- RBAC karar tablosu dokumante + testli
- Audit log zorunlu operasyon listesi tanimli
- Tenant sizintisi testi (cross-tenant deny) mevcut
- Legacy data migration/backfill runbook'u yazili ve dry-run planli

## Faz 5 - Web Panel Temeli (Sirket / Operasyon Paneli)

Amac:
- Sirketlerin sofor/rota/durak yonetebilecegi web panelin ilk production-grade temelini kurmak.

Not:
- UI teknolojisi Faz 4 sonunda ADR ile secilecek (ornek: Next.js + TS veya Flutter Web).
- Secim kriteri: ekip yetkinligi, SSR/SEO ihtiyaci, form ergonomisi, deploy kolayligi, test ekosistemi.

MVP Kapsam (Web v1):

- Auth + tenant secimi
- Company member management (read/create/invite)
- Driver management (CRUD lite)
- Route management (CRUD)
- Stop management (CRUD + siralama)
- Trip list/monitor (read-only baslangic)
- Audit log viewer (read-only)

Acceptance Criteria:

- Web panelden yapilan route/stop/driver degisiklikleri mobilde dogru yansir
- API hatalari UI'da standardize feedback ile gorunur
- Role bazli menu/ekran erisimi testli

## Faz 6 - Mobil + Web Convergence (Ortak Domain Dilinin Kilitlenmesi)

Amac:
- Iki client (mobil + web) gelistikce spagettiyi geri getirmemek.

Is Paketleri:

- Ortak API kontratlarindan kod uretimi (uygunsa)
- Shared error handling standardi
- Event/telemetry naming standardi (mobil + web)
- Release note / changelog kontrat degisim yonetimi
- Backward compatibility policy (deprecate window)
- Client compatibility matrix (desteklenen mobil surumler vs backend/API kontrati)

Acceptance Criteria:

- Kontrat degisiklikleri versionlanir
- Breaking change oncesi migration plani zorunlu
- Mobil ve web ayni hata kodlarini yorumlar

## Faz 7 - Production-Grade Operasyon ve Guvenlik Sertlestirme

Amac:
- Uygulamayi ve paneli sadece "calisan" degil "isletilebilir" hale getirmek.

Is Paketleri:

- Observability:
  - structured logs
  - trace/correlation ids
  - router redirect telemetry
  - role-switch telemetry
- SLO/SLA:
  - auth success rate
  - route mutation success rate
  - callable latency p95/p99
- Security:
  - least privilege
  - admin action audit
  - secrets/config hygiene
  - policy regression tests
- Cost/performance governance:
  - Firestore read/write budgetlari
  - Functions cold-start/latency/cost izleme
  - external API (orn. Places) quota + cache + cost guardrails
- Release engineering:
  - staged rollout
  - rollback playbook
  - smoke checklist (mobile + web)

Acceptance Criteria:

- Kritik akislar icin dashboard/alert var
- Rollback proseduru tatbik edilmis
- Security/policy regression lane tanimli

## 9. Uygulama Stratejisi: Strangler Migration (Big-Bang Yok)

Bu planin kalbi budur.

- Eski akislari bir anda silmeyecegiz.
- Yeni boundary'leri once yanina kuracagiz.
- Trafik/akislari kademeli tasiyacagiz.
- Her faz sonunda sistem calisir durumda kalacak.

Pratik kurallar:

- "Move + behavior change" ayni PR'da minimum tutulur
- Yeni use case yazildiysa eski path ile parity test yazilir
- Alias route/redirect ile backward compatibility korunur
- Gerektiginde feature flag ile rollout yapilir

## 10. Kalite Kapilari (Definition of Done)

Bir faz "tamamlandi" sayilmasi icin:

- Kod:
  - Mimari kurallara uyum
  - Import boundary ihlali yok
  - Review notlari kapanmis
- Test:
  - Ilgili lane'ler yesil
  - Yeni kritik davranis icin en az 1 regresyon testi
- Dokumantasyon:
  - Guncel plan/ADR/kontrat notu
  - `docs/proje_uygulama_iz_kaydi.md` append kaydi
- Operasyon:
  - Gerekliyse rollout/rollback notu

## 11. Metrikler (Basariyi Olcmek Icin)

## Mimari KPI

- `app_router.dart` satir sayisi (faz bazli dusus)
- Router icindeki dogrudan Firebase cagrisi sayisi -> `0`
- Presentation katmanindaki dogrudan backend cagrisi sayisi -> hedeflenen sinira dusus
- Guard matrix coverage yuzdesi

## Kalite KPI

- Lane bazli test pass oranlari
- Flaky test sayisi
- Build break suresi (MTTR)
- Regression bug tekrar orani

## Urun/Operasyon KPI

- Role-switch hata orani
- Route/stop mutation success rate
- Deep-link success rate
- Admin panel action success/latency

## 12. Riskler ve Karsi Hamleler

Risk: Refactor ile feature delivery durur  
Karsi hamle: Faz bazli WIP limiti + behavior-preserving PR disiplini

Risk: Web panel baskisi mimari temizligi bozar  
Karsi hamle: Faz 4 kontrat/tenant/RBAC tamamlanmadan web CRUD yazimi baslatilmaz

Risk: Yari kalmis rename/refactor baseline'i surekli kirar  
Karsi hamle: Faz 0A baseline freeze + quarantine/owner sistemi

Risk: Ekibin farkli Flutter SDK ile calismasi  
Karsi hamle: FVM preflight + CI SDK dogrulama

Risk: Router split sirasinda deep-link/back behavior regression  
Karsi hamle: Guard matrix + deep-link smoke + alias route policy

Risk: Web panelin hizli gelismesiyle dogrudan browser->Firestore yazimlarinin yayilmasi  
Karsi hamle: Faz 4 API boundary standardi + code review rule + security checklist

Risk: `companyId` migration/backfill sirasinda tenant karisikliklari  
Karsi hamle: Dry-run, backfill audit raporu, read-compat window, cutover checklist

## 13. Ilk 90 Gun Uygulama Plani (Onerilen)

## Hafta 1-2

- Faz 0A tamamla (baseline + SDK guardrail + compile kiriklarini ayikla)
- Faz 0B baslat (test lane ayrimi + CI checklist)
- Router/guard stale test cleanup

## Hafta 3-5

- Faz 1 (route groups + corridor coordinator + shell yapisi)
- Guard matrix testleri + back behavior regresyon testleri

## Hafta 6-8

- Faz 2 (router business/data extraction)
- Router side-effect cleanup
- Typed route params baslangici

## Hafta 9-11

- Faz 3 (use case/repository activation genisleme)
- Kritik akis parity/regresyon testleri

## Hafta 12+

- Faz 4 baslangici (tenant + RBAC + admin API kontratlari)
- Web panel tech ADR hazirligi

## 14. Bu Planla Baslayacagimiz Somut Ilk Paket

Asagidaki paket, bu master plana sadik ilk uygulama paketi olarak onerilir:

1. Faz 0A + 0B
- FVM enforcement/preflight
- test lane ayrimi
- stale router guard test cleanup
- baseline compile kiriklari triage

2. Faz 1 (davranisi koruyarak route registry modularization)
- route group dosyalari
- guard matrix netlestirme
- role corridor coordinator taslagi

3. Faz 1 devam (koridor davranisi)
- shell yapisi
- `driver/paywall` + settings policy netlestirme
- deep-link/back behavior testleri

Not:
- Faz 2 (router zayiflatma) bu adimlardan sonra baslar.
- Web panel CRUD gelistirmesi Faz 4 kontrat/RBAC zemini olmadan baslamaz.

## 15. Karar Ozetleri (Kilitlemek Icin)

- State management standardi: Riverpod (devam)
- Navigation standardi: GoRouter (moduler + corridor yaklasimi)
- Refactor stratejisi: Strangler Migration
- Mobil/web entegrasyon stratejisi: ortak domain + API kontrati once
- Yetki modeli: multi-tenant + RBAC + audit zorunlu
- Kalite disiplini: lane bazli CI + measurable acceptance criteria

---

Bu dokuman "master plan"dir. Uygulama sirasinda her faz icin:

- detayli teknik gorev listesi,
- risk listesi,
- acceptance criteria checklist,
- rollback notu

ayri dokuman/step kaydi ile uretilmelidir.
