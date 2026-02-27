# Web to App Change Register (Master Queue)

Tarih: 2026-02-24
Durum: Aktif backlog

## 1. KullanÃ„Â±m

Bu dosya web implementasyon sirasinda app'e yansiyacak degisikliklerin ana kaydidir.
Detay gerekiyorsa `01_*` veya `02_*` dosyalarina not dusulur.

## 2. Kayit Formati (kisa)

- `ID`:
- `Status`:
- `Priority`:
- `Kategori`: (`contract`, `auth`, `rbac`, `live_ops`, `route_trip`, `ui_ux`, `copy`, `migration`)
- `Web Trigger`:
- `App Impact (ozet)`:
- `Planlanan App Degisiklikleri`:
- `Bloklayici mi?` (`web bootstrap`, `web mvp`, `cutover`, `none`)
- `Ilgili Web Docs`:
- `Ilgili App Dosyalari`:
- `Notlar`:

## 3. Baslangic Kayitlari (seed)

Execution focus notu (2026-02-27):
- Admin panel UI genisleme backlog'u bu dongude donduruldu.
- Aktif kapanis sirasi: `website/app-impact/06_core_app_parity_execution_queue_2026_02_27.md`.
- Cutover onceligi: `W2A-001..017` + membership/permission kontratlari `W2A-100..106`.

### W2A-001
- `Status`: `web_partial_app_pending`
- `Priority`: `P0`
- `Kategori`: `migration`
- `Web Trigger`: Aggressive force update + server-side version enforcement + `426` cutoff
- `App Impact (ozet)`: Eski clientlarin mutasyonlari reddedilecegi icin app tarafinda force-update UX/fallback davranisi kesin olmali.
- `Planlanan App Degisiklikleri`:
  - Remote Config min version kontrolunu dogrula/ekle
  - `426` durumunda user-facing fallback/upgrade ekrani
  - aktif sefer bitisinde legacy shim kullaniliyorsa handler davranisini netlestir
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`, `plan/71_mobile_force_update_and_client_version_enforcement_plan.md`
- `Ilgili App Dosyalari`: `lib/app/router/*`, auth/session/network error handling katmanlari
- `Notlar`: 2026-02-27: Web callable error mapping tarafinda `UPGRADE_REQUIRED/FORCE_UPDATE_REQUIRED/426` semantigi user-facing mesaja baglandi. Server-side version enforcement + app force-update ekrani hala cutover bloklayici olarak app tarafinda pending.

### W2A-002
- `Status`: `web_done_app_pending`
- `Priority`: `P0`
- `Kategori`: `live_ops`
- `Web Trigger`: Offline burst replay latest-only live node + drift guard + stale/offline semantigi
- `App Impact (ozet)`: App konum gonderim mantigi web live ops beklentilerine uygun olmalÃ„Â±.
- `Planlanan App Degisiklikleri`:
  - live path'e latest-only yazim davranisi
  - history/trail path ayrimi (MVP kapsaminda varsa)
  - sourceTimestamp drift guard ile uyumlu payload/clock davranisi
  - offline banner semantics (offline vs stale) UI tutarliligi
- `Bloklayici mi?`: `web mvp`
- `Ilgili Web Docs`: `plan/59_route_readers_lifecycle_live_read_grants_technical_spec.md`, `plan/72_mobile_offline_stale_location_tolerance_plan.md`
- `Ilgili App Dosyalari`: `lib/ui/screens/passenger_tracking_screen.dart`, driver trip/live konum gonderim akislari
- `Notlar`: 2026-02-27: Web live-ops tarafinda stale/offline/lag/mismatch semantigi ve reconnect-backoff davranisi aktif. App tarafinda latest-only publish + drift guard + ayni UI semantigi hizasi pending.

### W2A-003
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `route_trip`
- `Web Trigger`: Aktif seferde route yapisal degisiklikleri server-side soft-lock (stop delete/reorder deny)
- `App Impact (ozet)`: App tarafi yeni error reason/policy kodlarini anlamali; aktif seferde stale route cache ile patlamamali.
- `Planlanan App Degisiklikleri`:
  - server reason code mapping (uyari metni)
  - aktif sefer route cache invalidation/fallback
  - destructive route edit denemelerinde UX copy
- `Bloklayici mi?`: `web mvp`
- `Ilgili Web Docs`: `plan/62_route_trip_versioning_recurrence_timezone_dst_and_concurrent_editing_spec.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: driver active trip / route management ekranlari
- `Notlar`: 2026-02-27: Web route/stop mutasyonlarinda `UPDATE_TOKEN_MISMATCH`, `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`, `ROUTE_STOP_*` hata semantikleri conflict-recovery davranisina baglandi. App tarafi parser/copy/retry parity pending.

### W2A-004
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `auth`
- `Web Trigger`: Company-of-1 lazy init + activeCompany context semantigi
- `App Impact (ozet)`: Role/mode secim ve passenger/driver entry routing akislari company context kurallariyla hizalanmali.
- `Planlanan App Degisiklikleri`:
  - mode selector / role corridor fallback state'leri
  - first-action lazy init bekleme durumu (gerekirse)
  - multi-company context secim kurallariyla uyum
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/54_adr_006_company_of_one_tenant_standardization.md`, `plan/08_domain_model_company_rbac.md`
- `Ilgili App Dosyalari`: `lib/app/router/*`, `lib/ui/screens/role_select_screen.dart`
- `Notlar`: 2026-02-27: Dashboard shell'de aktif company context otomatik senkronizasyonu eklendi (tek aktif uyelikte auto-select, invalid/suspended uyelikte clear, isim degisimi reconcile). App tarafi mode/company resolver parity sprinti pending.

### W2A-005
- `Status`: `web_done_app_deferred`
- `Priority`: `P2`
- `Kategori`: `auth`
- `Web Trigger`: Web login shell'e Microsoft Sign-In (`microsoft.com`) provider akisinin feature-flag kontrollu eklenmesi
- `App Impact (ozet)`: App tarafinda da ileride Microsoft ile giris istenirse provider mapping, copy ve account-linking davranislari hizalanmali.
- `Planlanan App Degisiklikleri`:
  - auth provider enum / source mapping (`google`, `password`, `microsoft`) uyumu
  - "Microsoft ile Giris" copy semantigi (Outlook degil)
  - ayni e-posta ile provider farkliysa account linking/fallback davranisi
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/22_web_auth_provider_decision.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: auth/login ekranlari ve provider error mapping katmani (gelecek app auth refresh sprinti)
- `Notlar`: Web tarafi tamamlandi (`NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN` + popup akisi). App tarafi parity isi opsiyonel auth refresh sprintine ertelendi; cutover bloklayici degil.

### W2A-006
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 company bootstrap vertical slice (`createCompany`, `listMyCompanies`) web panelde gercek Firebase callable akisina baglandi
- `App Impact (ozet)`: App tarafi ileride company-secim/aktif company context ile hizalanirken ayni backend call semantics ve company bootstrap beklentisini kullanmali.
- `Planlanan App Degisiklikleri`:
  - `activeCompany` context secimi/hatirlama semantigini web ile hizala
  - company bootstrap (ilk company olusturma) UX/copy fallback'lerini uyumlu tasarla
  - `createCompany` / `listMyCompanies` response parser + error mapping parity (app tarafinda kullanilacaksa)
  - auth sonrasi mode/company resolver davranisini web ile benzerlestir
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: `lib/app/router/*`, role/mode secim akislari, gelecekteki company secim ekranlari
- `Notlar`: MVP web implementation'da `listMyCompanies` okumasi user-scoped membership mirror (`users/{uid}/company_memberships`) uzerinden yapildi; app tarafi icin bu internal detay kontrat degisikligi yaratmaz ama semantics kayda gecirildi. 2026-02-27: web callable katmaninda `createCompany` + `listMyCompanies` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-007
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 ikinci vertical dilimde `/drivers` ekrani ilk gercek backend listesine baglandi (`listCompanyMembers` Firebase callable)
- `App Impact (ozet)`: App tarafi ileride company uyeleri / firma sofor listesi / role gorunumleri kullanacaksa ayni member summary shape (`role`, `memberStatus`, `displayName`, `email`, `phone`) ve access semantics ile hizalanmali.
- `Planlanan App Degisiklikleri`:
  - company member list/parsing modeli (owner/admin/dispatcher/viewer + memberStatus) web ile uyumlu tanimlanir
  - auth sonrasi aktif company context secimine bagli "firma uyeleri" / "sofor listesi" ekranlarinda response mapping parity saglanir
  - error semantics (`permission-denied`, `failed-precondition`) app feedback copy standardina islenir
  - company-only route/feature guard copy'si web ile semantik uyumlu hale getirilir
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company/member list flows, role/company context resolver, company-only guard copy
- `Notlar`: Web implementasyonu ilk etapta `drivers` ekraninda company members listesi olarak basladi (bilincli MVP secimi); app tarafinda "sofor" ve "uye" kavram ayrimi netlestirilirken bu ara temsil dikkate alinacak. 2026-02-27: `listCompanyMembers` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-008
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 dorduncu dilimde `/routes` ekrani ilk gercek route summary listesine baglandi (`listCompanyRoutes` Firebase callable)
- `App Impact (ozet)`: App tarafinda gelecekte company route listesi / route selector / route summary kartlari ayni route summary shape ve company-context read semantics ile hizalanmali.
- `Planlanan App Degisiklikleri`:
  - company route summary parser (routeId, name, srvCode, scheduledTime, timeSlot, isArchived, allowGuestTracking, authorizedDriverIds?, passengerCount, updatedAt)
  - company context secimine bagli route listesi/read akisi parity
  - "route summary" vs "route detail/stop editor" ayriminin copy/state semantigine islenmesi
  - company-only route guard copy/feedback (company secimi yok / yetki yok) uyumlandirilmasi
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company route list/screens, route selector flows, auth->company context resolver
- `Notlar`: Faz 2 implementasyonu route CRUD degil "route summary read" dilimi olarak acildi; response shape'i onuncu dilimde `authorizedDriverIds[]` ile genisletildi (route drawer driver yetkilendirme UX'i icin). 2026-02-27: `listCompanyRoutes` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-009
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 besinci dilimde `/vehicles` ekrani company-scoped vehicle summary listesine baglandi (`listCompanyVehicles` Firebase callable)
- `App Impact (ozet)`: App tarafi future company vehicle listesi / vehicle selector / assignment ekranlarinda ayni vehicle summary shape ve company-context read semantigine hizalanmali.
- `Planlanan App Degisiklikleri`:
  - company vehicle summary parser (vehicleId, plate, status, brand/model/year/capacity, updatedAt)
  - company context secimi sonrasi vehicle list/read akisi parity
  - vehicle summary vs vehicle detail/edit ayriminin copy/state semantigine islenmesi
  - company-only guard / no-company-selected feedback copy parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company vehicle list/screens, vehicle selector flows, assignment UIs
- `Notlar`: Faz 2 implementasyonu vehicle CRUD degil "vehicle summary read" dilimi olarak acildi; create/update mutasyonlari sonraki dilimde eklenecek. 2026-02-27: `listCompanyVehicles` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-010
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 altinci dilimde `vehicles` icin company-scoped `createVehicle` + `updateVehicle` mutasyon callables acildi; web `/vehicles` ekraninda minimal create formu kullanima alindi
- `App Impact (ozet)`: App tarafi future company vehicle create/edit / assignment akislari ayni request/response shape, duplicate-plate hata semantigi ve company-only mutation policy ile hizalanmali.
- `Planlanan App Degisiklikleri`:
  - `createVehicle` request/response parser parity (`ownerType=company`, `companyId`, plate/brand/model/year/capacity/status`)
  - `updateVehicle` patch semantigi parity (`plate`, `brand`, `model`, `year`, `capacity`, `status`)
  - duplicate plate (`already-exists`) hata kodu ve copy mapping'i
  - company-only vehicle mutation guard copy / no-company-selected fallback parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company vehicle create/edit screens, assignment UIs, network error mapping katmani
- `Notlar`: Web Faz 2'de create UI acildi, update callable backend'de acik ama drawer/detail edit UX sonraki dilime ertelendi. 2026-02-27: `createVehicle` + `updateVehicle` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-011
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 sekizinci dilimde `createCompanyRoute` callable acildi; `/routes` ekraninda minimal company-scoped route create formu (inline) kullanima alindi
- `App Impact (ozet)`: App tarafi future company route create/onboarding akislari ayni request/response shape, `authorizedDriverIds` company membership dogrulamasi ve `failed-precondition` hata semantigi ile hizalanmali.
- `Planlanan App Degisiklikleri`:
  - `createCompanyRoute` request parser parity (`companyId`, `name`, `start/end`, `scheduledTime`, `timeSlot`, `allowGuestTracking`, `authorizedDriverIds?`)
  - response parity (`routeId`, `srvCode`) ve create-success feedback/copy uyumu
  - `failed-precondition` (tenant/driver mismatch) hata copy mapping'i
  - company-only route create guard / no-company-selected fallback parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company route create screens/forms, route onboarding flows, network error mapping katmani
- `Notlar`: Faz 2 dilimi route create + route summary reload ile sinirli; stop editor/detail drawer ve route update mutasyonu sonraki dilimlere ertelendi. 2026-02-27: `createCompanyRoute` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-012
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 dokuzuncu dilimde `updateCompanyRoute` callable acildi; `/routes` side panelinde route ozet patch formu (name/saat/slot/guest/archive) kullanima alindi
- `App Impact (ozet)`: App tarafi future company route detail/edit ekranlari ayni patch semantigi, optimistic update token (`updatedAt`) ve `UPDATE_TOKEN_MISMATCH` / tenant mismatch hata davranisi ile hizalanmali.
- `Planlanan App Degisiklikleri`:
  - `updateCompanyRoute` patch parser parity (`name`, `scheduledTime`, `timeSlot`, `allowGuestTracking`, `isArchived`, `authorizedDriverIds?`)
  - route summary `updatedAt` alanini optimistic precondition token olarak kullanma parity
  - `failed-precondition` hata semantigi icinde `UPDATE_TOKEN_MISMATCH` ve tenant mismatch copy mapping'i
  - route detail vs stop editor ayriminin UI state/copy semantiklerine islenmesi
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company route detail/edit screens, route create/update forms, error mapping katmani
- `Notlar`: Web Faz 2 onuncu dilimde `authorizedDriverIds` patch UI da acildi; app route detail/edit ekranlari ayni field'i patch semantigi ve member-selection UX'i ile hizalamali. 2026-02-27: `updateCompanyRoute` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-013
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 on birinci dilimde route stop editor v1 acildi (`listCompanyRouteStops` + `upsertCompanyRouteStop` callables; `/routes` side panel liste + ekle/guncelle)
- `App Impact (ozet)`: App tarafi future company route stop editor / route detail akislari ayni stop summary shape, upsert semantigi ve active-trip soft-lock (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`) davranisi ile hizalanmali.
- `Planlanan App Degisiklikleri`:
  - `listCompanyRouteStops` response parser parity (stopId, order, name, lat/lng, createdAt/updatedAt)
  - `upsertCompanyRouteStop` request/response parity (`companyId`, `routeId`, `stopId?`, `name`, `location`, `order`)
  - active trip varsa route stop mutasyon deny copy mapping'i (`failed-precondition` / `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`)
  - route detail vs stop editor ayrimi ve "silme/reorder sonraki dilim" UX semantigi parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company route detail/stop editor screens, route mutation error mapping katmani
- `Notlar`: Web Faz 2 stop editor v1 sadece liste + ekle/guncelle (upsert) akisini aciyor; delete/reorder ve geometri editoru sonraki dilimlerde. 2026-02-27: `listCompanyRouteStops` + `upsertCompanyRouteStop` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-014
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 on ikinci dilimde `deleteCompanyRouteStop` callable acildi; route stop editor v1'de durak silme UI ve upsert/delete route token precondition kullanimi aktif edildi
- `App Impact (ozet)`: App tarafi future company route stop editor akislari durak silme mutasyonunu, `lastKnownUpdateToken` optimistic precondition semantigini ve active-trip soft-lock hata davranisini ayni sekilde map etmeli.
- `Planlanan App Degisiklikleri`:
  - `deleteCompanyRouteStop` request/response parser parity (`companyId`, `routeId`, `stopId`, `lastKnownUpdateToken?` -> `deleted`)
  - `UPDATE_TOKEN_MISMATCH` + `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED` hata copy/ux parity (stop editor seviyesinde)
  - stop mutasyonu sonrasi route summary `updatedAt` refresh ihtiyacini app route detail/shell state'ine islemek
  - "silme var / reorder sonraki dilim" UI semantigini parity ile korumak
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company route stop editor screens, route detail shell state, route mutation error mapping
- `Notlar`: Web stop editor bu dilimde silme UI acti; reorder/drag-drop hala sonraki dilim backlogunda. 2026-02-27: `deleteCompanyRouteStop` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-015
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 on ucuncu dilimde `reorderCompanyRouteStops` callable acildi; route stop editor v1'de `Yukari/Asagi` ile transactional reorder UI aktif edildi
- `App Impact (ozet)`: App tarafi future company route stop editor akislari stop reorder mutasyonunu, no-op (`changed=false`) semantigini ve optimistic route token davranisini ayni sekilde map etmeli.
- `Planlanan App Degisiklikleri`:
  - `reorderCompanyRouteStops` request/response parser parity (`companyId`, `routeId`, `stopId`, `direction`, `lastKnownUpdateToken?` -> `routeId`, `updatedAt`, `changed`)
  - `UPDATE_TOKEN_MISMATCH` + `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED` hata copy/ux parity (reorder aksiyonlari icin)
  - stop reorder sonrasi route summary `updatedAt` refresh / shell state tazeleme parity
  - "Yukari/Asagi reorder var, drag-drop sonra" UX semantigi parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company route stop editor screens, route detail shell state, route mutation error mapping/conflict feedback
- `Notlar`: Web Faz 2'de reorder backend transaction ile atomik swap olarak acildi; app tarafinda iki ayri upsert ile reorder yapilmamali. Sonraki dilimde web stop editor drag-drop UI da ayni endpoint uzerinden acildi (step-by-step reorder + optimistic token zinciri); app parity planinda ayni davranis hedeflenmeli. 2026-02-27: `reorderCompanyRouteStops` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-016
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 on besinci dilimde `listActiveTripsByCompany` callable acildi; `/live-ops` ekraninda aktif sefer listesi + secili sefer detay paneli gercek backend verisine baglandi (harita shell placeholder korunuyor)
- `App Impact (ozet)`: App tarafi future company live-ops / operasyon izleme ekranlari ayni aktif sefer summary shape'ini, `liveState` (`online|stale`) semantigini ve `live.source` (`rtdb|trip_doc`) fallback davranisini parity ile map etmeli.
- `Planlanan App Degisiklikleri`:
  - `listActiveTripsByCompany` response parser parity (`tripId`, `routeId`, `routeName`, `driverUid`, `driverName`, `driverPlate?`, `startedAt?`, `lastLocationAt?`, `updatedAt?`, `liveState`, `live{lat,lng,source,stale}`)
  - live ops UI copy/state parity: `online` vs `stale` badge/chip semantigi ve stale filtreleme davranisi
  - `live.source=trip_doc` fallback durumunda "canli koordinat yok / son bilinen konum" UX/copy semantigi
  - route/driver filter alanlari acildiginda ayni request alanlari (`routeId?`, `driverUid?`, `pageSize?`) ile parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future company live-ops screens, trip list/feed UI, live status badge copy mapping, RTDB/Firestore bridge read adapters
- `Notlar`: Web Faz 2 implementasyonu harita panelini placeholder tuttu; ilk dikey dilim sadece aktif sefer listesi + detail panel read-side parity hedefiyle acildi. 2026-02-27: `listActiveTripsByCompany` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-017
- `Status`: `web_done_app_pending`
- `Priority`: `P2`
- `Kategori`: `live_ops`
- `Web Trigger`: Faz 2 on sekizinci + on dokuzuncu dilimlerde `/live-ops` ekraninda secili sefer detay paneli ve gorunen markerlar icin `locations/{routeId}` RTDB stream overlay acildi; `tripId` mismatch durumunda read-side (`trip_doc`) koordinat fallback korunuyor
- `App Impact (ozet)`: App tarafi future company live-ops detay/map ekranlari secili rota + gorunen marker RTDB stream overlay davranisini, stream durum semantiklerini (`idle|connecting|live|mismatch|error`) ve RTDB->read-side fallback copy/state mantigini parity ile map etmeli.
- `Planlanan App Degisiklikleri`:
  - secili rota/sefer icin RTDB stream okuma parity (`locations/{routeId}`) + `tripId` eslesme kontrolu
  - RTDB stream status copy/state parity (`connecting`, `mismatch`, `error`) ve bunlari `stale/offline` semantiklerinden ayri tutma
  - RTDB baglanti durumu (`.info/connected`) semantigini stream durumundan ayri gosterme parity (`online/offline/connecting/error`)
  - stream hata icinde `permission_denied` -> `access_denied` copy mapping parity
  - detail panel koordinat gosteriminde RTDB koordinati > read-side fallback oncelik kurali parity
  - gorunen map markerlar icin (MVP cap mantigi) stream-vs-read-side fallback konum oncelik kurali parity
  - stream timestamp / son sinyal copy semantigi parity (`receivedAt` fallback, source timestamp varsa onu oncelikleme)
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company live-ops detail/map shell, RTDB live stream adapters, live status chip/copy mapping, stale/offline/access-denied UI semantics
- `Notlar`: Bu dilimler yeni callable kontrati acmadi; mevcut `listActiveTripsByCompany` read-side uzerine web-only behavior slice olarak secili sefer detay paneli + gorunen markerlar icin RTDB overlay eklendi ve RTDB baglanti durumu / stream durumu UI semantikleri ayrildi. Bu nedenle yeni `API-DIFF` yok, sadece davranis/copy parity backlog kaydi acildi.

### W2A-018
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 otuz sekizinci + otuz dokuzuncu dilimlerde `/drivers`, `/routes`, `/vehicles` filtrelerinin URL query parity hardening'i (`q`, `status`, `slot`) ve query-param oncelikli state modeli (query varsa onu esas al, yoksa local fallback) uygulandi
- `App Impact (ozet)`: Yok. Degisiklik yalnizca web panel state/URL davranisiyla sinirlidir; Firebase callable payload/response ve mesaj semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-019
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ux_no_contract_change`
- `Web Trigger`: Faz 2 kirkinci dilimde dashboard command palette klavye navigasyonu (ArrowUp/ArrowDown/Enter/Escape), aktif satir vurgusu ve `aria-activedescendant` erisilebilirlik iyilestirmesi eklendi
- `App Impact (ozet)`: Yok. Bu degisiklik yalnizca web paneldeki hizli navigasyon UX davranisini etkiler; app tarafi kontrat/mesaj/akislari degismez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-020
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 kirk birinci dilimde `/drivers`, `/routes`, `/vehicles` ekranlarina URL-senkron sort katmani eklendi (`sort` query param; filtre+sort+secim parity)
- `App Impact (ozet)`: Yok. Liste siralama davranisi web panel UX/state katmaninda degisti; callable payload/response ve app kontrat semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-021
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 kirk ikinci dilimde `/live-ops` ekranina query-senkron arama/siralama katmani eklendi (`q`, `sort`) ve route/driver filtreleriyle ayni URL modeli uzerinden calisir hale getirildi
- `App Impact (ozet)`: Yok. Degisiklik yalnizca web panel operator listesinin tarama/siralama UX davranisini etkiler; callable payload/response ve app kontrat semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-022
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 kirk ucuncu dilimde `/live-ops` toolbar'ina `Filtreleri Sifirla` aksiyonu eklendi; route/driver/search/sort tek hamlede defaulta aliniyor
- `App Impact (ozet)`: Yok. Bu degisiklik web panel operator UX tarafinda state toparlama aksiyonudur; app tarafi davranis/kontrat/mesaj semantigini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-023
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 kirk dorduncu dilimde `/live-ops` secili sefer `tripId` query parami ile deep-link hale getirildi; liste/harita secimleri URL'ye yaziliyor
- `App Impact (ozet)`: Yok. Degisiklik web panel secim-state/URL davranisina aittir; app tarafi kontrat/mesaj ve backend payload semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-024
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ux_no_contract_change`
- `Web Trigger`: Faz 2 kirk besinci dilimde `/live-ops` liste basligina operasyon sayaclari eklendi (`filtreli/canli/stale/ham toplam`)
- `App Impact (ozet)`: Yok. Bu degisiklik web panelin gozlemsel UX katmanindadir; app tarafi kontrat/mesaj ve backend payload semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-025
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 kirk altinci dilimde `/dashboard` live-ops onizleme kartlari sefer bazli deep-link (`tripId/routeId/driverUid`) ile baglandi ve hizli aksiyonlar `live-ops` preset query linkleriyle guclendirildi (`sort=signal_desc`, `sort=state`)
- `App Impact (ozet)`: Yok. Degisiklik web panelde navigasyon/entry-point hizlandirmasi seviyesindedir; app tarafi davranis/kontrat/mesaj semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-026
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 kirk yedinci dilimde `/live-ops` detay paneline `Sefer Linkini Kopyala` aksiyonu eklendi; secili sefer deep-link'i (`tripId/routeId/driverUid/sort`) panoya alinabiliyor
- `App Impact (ozet)`: Yok. Degisiklik web panelde paylasim/entry-point UX seviyesindedir; app tarafi kontrat, mesaj ve mutasyon davranisini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-027
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 kirk sekizinci dilimde `/live-ops` stale gizleme tercihi query-senkron hale getirildi (`hideStale=1`) ve query-precedence state modeliyle calisir hale getirildi
- `App Impact (ozet)`: Yok. Degisiklik web panel URL/state davranisiyla sinirlidir; app tarafi kontrat/mesaj/mutasyon semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-028
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 kirk dokuzuncu dilimde `/live-ops` query-url self-heal davranisi eklendi; gecersiz `tripId` query degerleri mevcut secime/fallback'e otomatik hizalaniyor
- `App Impact (ozet)`: Yok. Degisiklik web panel URL/state tutarliligini sertlestirir; app tarafi kontrat/mesaj/mutasyon semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-029
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 ellinci dilimde `/drivers`, `/routes`, `/vehicles` side-panel'lerine baglam koruyan `live-ops` gecis aksiyonlari eklendi (`driverUid`, `routeId`, `q`, `sort`)
- `App Impact (ozet)`: Yok. Degisiklik web panel moduller arasi gecis/navigation UX davranisina aittir; app tarafi kontrat/mesaj/mutasyon semantiklerinde degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-030
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 elli birinci dilimde `/drivers`, `/routes`, `/vehicles` ekranlarina query secim ID self-heal parity eklendi (`memberUid`, `routeId`, `vehicleId`)
- `App Impact (ozet)`: Yok. Degisiklik web panel URL/state tutarliligina aittir; app tarafi kontrat, mesaj ve mutasyon davranislarinda degisiklik yok.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-031
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 elli ikinci dilimde `/drivers`, `/routes`, `/vehicles` side-panel'lerine "Bu Gorunumu Kopyala" aksiyonu eklendi; aktif query (filtre/sort/secim) ile paylasilabilir link panoya alinabiliyor
- `App Impact (ozet)`: Yok. Degisiklik web panelde paylasim/navigasyon UX seviyesindedir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-032
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 elli ucuncu dilimde `/live-ops` ekraninda query route self-heal eklendi; query'deki `routeId` aktif company route listesinde yoksa URL/filter otomatik temizlenir
- `App Impact (ozet)`: Yok. Degisiklik web panel URL/filter state sertlestirmesine aittir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-033
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 elli dorduncu dilimde `/live-ops` driver query self-heal eklendi; query'deki `driverUid` company member setinde yoksa URL/filter otomatik temizlenir, gecerli ama aktif seferde olmayan secim icin select fallback option korunur
- `App Impact (ozet)`: Yok. Degisiklik web panel URL/filter state ve secim UX sertlestirmesidir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-034
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 elli besinci dilimde `/live-ops` ust aksiyonlarina "Gorunumu Kopyala" eklendi; aktif query baglamiyla (route/driver/search/sort/tripId/hideStale) link panoya alinabiliyor
- `App Impact (ozet)`: Yok. Degisiklik web panelde paylasim/navigasyon UX seviyesindedir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-035
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 elli altinci dilimde `live-ops` marker katmani ayri dosyaya bolundu (`live-ops-map-markers-layer.tsx`) ve ana feature dosyasi satir limiti governance hedefine cekildi
- `App Impact (ozet)`: Yok. Bu degisiklik sadece web kod organizasyonu/refactor seviyesindedir; app tarafi davranis, kontrat ve mesaj semantiklerini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-036
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 elli yedinci dilimde `Dashboard Command Palette` dinamik canli sefer komutlariyla genisletildi; secilen sefer `live-ops` deep-link'ine (`tripId/routeId/driverUid/sort`) dogrudan aciliyor
- `App Impact (ozet)`: Yok. Degisiklik web panelde komut paleti/navigasyon UX seviyesindedir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-037
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 elli sekizinci dilimde `Command Palette` aktif company verisiyle dinamik `uye/rota/arac` komutlari alir hale getirildi; secilen komut ilgili ekrani query deep-link ile aciyor (`memberUid/routeId/vehicleId`)
- `App Impact (ozet)`: Yok. Degisiklik web panelde komut paleti/navigasyon hizlandirmasidir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-038
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 elli dokuzuncu dilimde `Command Palette` son kullanilan komut hafizasi eklendi (`localStorage` recent list + `Son` etiketi)
- `App Impact (ozet)`: Yok. Degisiklik web panelde local UX-state seviyesindedir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-039
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_state_no_contract_change`
- `Web Trigger`: Faz 2 altmisinci dilimde `Command Palette` icine `Gecmisi Temizle` aksiyonu eklendi; recent komut state'i ve localStorage kaydi temizleniyor
- `App Impact (ozet)`: Yok. Degisiklik web panelde local UX-state yonetimi seviyesindedir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-040
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_navigation_no_contract_change`
- `Web Trigger`: Faz 2 altmis birinci dilimde `Command Palette` query bazli hizli arama komutlari eklendi; `q` paramli deep-link aksiyonlariyla `live-ops/drivers/routes/vehicles` ekranlarina tek adim gecis saglaniyor
- `App Impact (ozet)`: Yok. Degisiklik web panelde navigasyon/hizli aksiyon UX seviyesindedir; app tarafi kontrat, mesaj ve mutasyon davranislarini degistirmez.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-041
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 altmis ikinci dilimde `functions/src/index.ts` icindeki ortak parse/value helper fonksiyonlari `functions/src/common/runtime_value_helpers.ts` altina tasindi ve index satiri dusuruldu
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-042
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 altmis ucuncu dilimde support report redaction yardimcilari `functions/src/common/support_redaction.ts` moduline tasindi; `index.ts` satiri dusuruldu
- `App Impact (ozet)`: Yok. Degisiklik backend ic kod organizasyonudur; callable endpoint kontratlari ve app davranis semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-043
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 altmis besinci dilimde Mapbox proxy + route preview helperlari `functions/src/common/mapbox_route_preview_helpers.ts` moduline tasindi; `functions/src/index.ts` satir sayisi dusuruldu (`5831 -> 5530`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-044
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 altmis altinci dilimde role/chat/ghost/support yardimcilari `functions/src/common/index_domain_helpers.ts` moduline tasindi; `functions/src/index.ts` satir sayisi dusuruldu (`5530 -> 5424`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-045
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 altmis yedinci dilimde route erisim/uyelik yardimcilari `functions/src/common/route_membership_helpers.ts` moduline tasindi; `functions/src/index.ts` satir sayisi dusuruldu (`5424 -> 5350`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-046
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 altmis sekizinci dilimde route olusturma transaction yardimcisi `functions/src/common/route_creation_helpers.ts` moduline tasindi; `functions/src/index.ts` satir sayisi dusuruldu (`5350 -> 5288`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-047
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 altmis dokuzuncu dilimde subscription entitlement yardimcilari `functions/src/common/premium_entitlement_helpers.ts` moduline tasindi; `functions/src/index.ts` satir sayisi dusuruldu (`5288 -> 5255`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-048
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yetmisinci dilimde company role/permission + vehicle normalize helperlari `functions/src/common/company_access_helpers.ts` moduline tasindi (factory: `createCompanyAccessHelpers(db)`); `functions/src/index.ts` satir sayisi dusuruldu (`5255 -> 5191`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-049
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yetmis birinci dilimde route audit helperlari `functions/src/common/route_audit_helpers.ts` moduline tasindi ve `index.ts` icinde db+collection bagli wrapper kullanimina gecildi; `functions/src/index.ts` satir sayisi dusuruldu (`5191 -> 5158`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-050
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yetmis ikinci dilimde callable input schema bloklari `functions/src/common/input_schemas.ts` moduline tasindi (`createInputSchemas` factory); `functions/src/index.ts` satir sayisi dusuruldu (`5158 -> 4802`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-051
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yetmis ucuncu dilimde callable output/type arayuzleri `functions/src/common/output_contract_types.ts` moduline tasindi (type-only import modeli); `functions/src/index.ts` satir sayisi dusuruldu (`4802 -> 4483`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint adi, request/response kontrati ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-052
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yetmis dorduncu dilimde cleanup scheduled triggerlari (`guestSessionTtlEnforcer`, `cleanupStaleData`, `cleanupRouteWriters`) `functions/src/common/cleanup_scheduled_triggers.ts` moduline tasindi; `functions/src/index.ts` satir sayisi dusuruldu (`4483 -> 4235`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; schedule/callable kontratlari, endpoint isimleri ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-053
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yetmis besinci dilimde operasyonel triggerlar `functions/src/common/operational_triggers.ts` moduline tasindi (`syncPassengerCount`, `syncRouteMembership`, `syncTripHeartbeatFromLocation`, `abandonedTripGuard`, `morningReminderDispatcher`); `functions/src/index.ts` satir sayisi dusuruldu (`4235 -> 3987`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; trigger path/schedule semantigi, callable endpoint kontratlari ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-054
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yetmis altinci dilimde profil/surucu onboarding callables `functions/src/callables/profile_driver_callables.ts` moduline tasindi (`bootstrapUserProfile`, `updateUserProfile`, `upsertConsent`, `requestDriverAccess`, `upsertDriverProfile`, `registerDevice`); `functions/src/index.ts` satir sayisi dusuruldu (`3984 -> 3661`)
- `App Impact (ozet)`: Yok. Degisiklik backend kod organizasyonu/refactor seviyesindedir; callable endpoint isimleri, request/response kontratlari ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-055
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 decomposition step-15 ile account/support/search callables ayri modullere tasindi (`account_support_callables.ts`, `search_driver_callable.ts`); `functions/src/index.ts` satir sayisi `3661 -> 3300`
- `App Impact (ozet)`: Yok. Endpoint isimleri, request/response kontratlari ve davranis semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-056
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 decomposition step-16 ile trip chat callables (`openTripConversation`, `sendTripMessage`, `markTripConversationRead`) `trip_chat_callables.ts` moduline tasindi; `index.ts` `3300 -> 3006`
- `App Impact (ozet)`: Yok. Chat callable kontratlari ve policy davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-057
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 decomposition step-17 ile passenger ops callables (`updatePassengerSettings`, `submitSkipToday`, `createGuestSession`) `passenger_ops_callables.ts` moduline tasindi; `index.ts` `3006 -> 2784`
- `App Impact (ozet)`: Yok. Passenger callable kontratlari ve runtime davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-058
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 decomposition step-18 ile trip lifecycle callables (`startTrip`, `finishTrip`) `trip_lifecycle_callables.ts` moduline tasindi; `index.ts` `2784 -> 2387`
- `App Impact (ozet)`: Yok. Trip lifecycle endpoint kontratlari/idempotency semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-059
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 decomposition step-19 ile passenger membership callables (`joinRouteBySrvCode`, `leaveRoute`) `passenger_membership_callables.ts` moduline tasindi; `index.ts` `2387 -> 2243`
- `App Impact (ozet)`: Yok. Membership endpoint kontratlari ve audit/rate-limit davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-060
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 decomposition step-20 ile driver route edit callables (`updateRoute`, `upsertStop`, `deleteStop`) `driver_route_callables.ts` moduline tasindi; `index.ts` `2243 -> 2114`
- `App Impact (ozet)`: Yok. Route edit endpoint kontratlari ve ownership/policy davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-061
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Faz 2 decomposition step-21 ile driver route creation callables (`createRoute`, `createRouteFromGhostDrive`) `driver_route_creation_callables.ts` moduline tasindi; `index.ts` `2114 -> 1980`
- `App Impact (ozet)`: Yok. Route create endpoint kontratlari ve ghost-drive semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-062
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `backend_refactor_no_contract_change`
- `Web Trigger`: Decomposition lint hardening diliminde callable schema tipleri `ZodType<unknown>` ile sertlestirildi, `index.ts` kullanilmayan import/type temizligi yapildi ve map-matching input tipi explicitlesti; `index.ts` `1980 -> 1948`
- `App Impact (ozet)`: Yok. Degisiklik backend kod kalitesi/lint sertlestirmesi seviyesindedir; endpoint kontratlari ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-063
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_live_ops_action`
- `Web Trigger`: Faz 2 doksan birinci dilimde `/live-ops` secili sefer detayina `WhatsApp ile Gonder` aksiyonu eklendi (driver phone varsa `wa.me` deep-link + dispatch ozeti).
- `App Impact (ozet)`: Yok. App API kontratlari, callable request/response semantigi ve app copy/state modeli degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-064
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 doksan ikinci ve doksan ucuncu dilimlerde `/live-ops` detail paneli ve harita/split-view paneli ayri component dosyalarina tasindi (`live-ops-selected-trip-detail-pane.tsx`, `live-ops-map-split-pane.tsx`).
- `App Impact (ozet)`: Yok. Degisiklik web kod organizasyonu/refactor seviyesinde; backend kontratlari ve app tarafi davranis modeli degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-065
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_live_ops_focus`
- `Web Trigger`: Faz 2 doksan dorduncu ve doksan besinci dilimlerde `/live-ops` listeden hover/focus edilen sefer icin harita odak modu eklendi (hedef marker vurgu, diger markerlar soluk; klavye parity aktif).
- `App Impact (ozet)`: Yok. Sadece web dispatcher UX iyilestirmesi; app ekranlari, domain kurallari ve API kontratlari degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-066
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_routes_onboarding_flow`
- `Web Trigger`: Faz 2 doksan altinci dilimde `/routes` ekraninda yeni rota olusturma sonrasi otomatik secim eklendi (liste reload + olusan `routeId` query secimi).
- `App Impact (ozet)`: Yok. Sadece web operator onboarding/akislama UX degisimi var; app kontratlari, callable semantigi ve mobil metinler degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-067
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 doksan yedinci ve doksan sekizinci dilimlerde `/routes` ve `/drivers` liste/filter/tablo bloklari ayri componentlere tasindi (`routes-list-section.tsx`, `drivers-list-section.tsx`), yardimci fonksiyonlar helper modullerine ayrildi.
- `App Impact (ozet)`: Yok. Bu degisiklikler yalniz web tarafi kod organizasyonu ve maintainability refactorudur; callable kontratlari ve app davranisi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-068
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 doksan dokuzuncu ve yuzuncu dilimlerde stop editor ve command palette yardimcilari ayri helper dosyalarina tasindi (`route-stops-editor-helpers.ts`, `dashboard-command-palette-helpers.ts`).
- `App Impact (ozet)`: Yok. Endpoint kontratlari, domain kurallari ve uygulama ici mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-069
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_vehicles_onboarding_flow`
- `Web Trigger`: Faz 2 yuz birinci dilimde `/vehicles` ekraninda yeni arac olusturma sonrasi otomatik secim eklendi (liste reload + olusan `vehicleId` query secimi).
- `App Impact (ozet)`: Yok. Sadece web operator akis hizlandirmasi; app kontratlari, mobil davranis ve server-side domain kurallari degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-070
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz ikinci-yuz dorduncu dilimlerde live-ops feature state/view-model/dispath aksiyonlari hook + helper katmanlarina ayrildi (`use-live-ops-company-active-trips-state.ts`, `use-live-ops-dispatch-actions.ts`, `live-ops-company-active-trips-helpers.ts` ek genisletmeleri).
- `App Impact (ozet)`: Yok. Refactor yalniz web kod organizasyonunu etkiler; API contract, domain davranisi ve app metin/akislari degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-071
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz besinci dilimde `/vehicles` side panel blogu ayri component'e tasindi (`vehicles-side-panel.tsx`) ve ana feature dosyasi sadelestirildi (`vehicles-company-vehicles-feature.tsx`).
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-072
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz altinci dilimde `/routes` side panel blogu ayri component'e tasindi (`routes-side-panel.tsx`) ve ana feature dosyasi sadelestirildi (`routes-company-routes-feature.tsx`).
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-073
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yedinci dilimde `/drivers` side panel blogu ayri component'e tasindi (`drivers-side-panel.tsx`) ve ana feature dosyasi sadelestirildi (`drivers-company-members-feature.tsx`).
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-074
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz sekizinci dilimde `/live-ops` query parse/build mantigi ayri helper moduline tasindi (`live-ops-query-helpers.ts`) ve ana state hook dosyasi sadelestirildi (`use-live-ops-company-active-trips-state.ts`).
- `App Impact (ozet)`: Yok. Degisiklik yalniz web kod organizasyonu/refactor seviyesinde; URL query semantigi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-075
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz dokuzuncu dilimde route update formundaki yetkili uye/surucu secim blogu ayri component'e tasindi (`route-authorized-members-fieldset.tsx`) ve `route-update-drawer-form.tsx` dosyasi sadelestirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; patch semantigi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-076
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz onuncu dilimde route stop editorundeki durak liste/render blogu ayri component'e tasindi (`route-stops-list-section.tsx`) ve `route-stops-drawer-editor.tsx` dosyasi sadelestirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; stop editor davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-077
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz on birinci dilimde gorunum linki kopyalama davranisi ortak hook'a tasindi (`use-copy-view-link.ts`); `/drivers`, `/routes`, `/vehicles`, `/live-ops` ekranlari ortak copy-state semantigine gecirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web UI icindeki copy-state yonetimini standartlastirir; endpoint kontratlari, query/link semantigi ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-078
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz on ikinci dilimde route stop editorundeki form blogu ayri component'e tasindi (`route-stops-form-section.tsx`) ve `route-stops-drawer-editor.tsx` dosyasi sadelestirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; form davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-079
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_behavior_hardening_no_contract_change`
- `Web Trigger`: Faz 2 yuz on ucuncu dilimde route stop tek-adim reorder sonrasi secili durak form state'i stale liste state'inden bagimsiz optimize edildi (`route-stops-drawer-editor.tsx`).
- `App Impact (ozet)`: Yok. Endpoint kontratlari, backend davranisi ve app tarafi mesaj/kontrat semantigi degismedi; yalniz web tarafi form-order tutarliligi sertlestirildi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-080
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz on dorduncu dilimde `/live-ops` query self-heal effectleri ayri hook'a tasindi (`use-live-ops-query-self-heal.ts`) ve ana state hook dosyasi sadelestirildi (`use-live-ops-company-active-trips-state.ts`).
- `App Impact (ozet)`: Yok. Degisiklik yalniz web kod organizasyonu/refactor seviyesinde; query self-heal semantigi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-081
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz on besinci dilimde command palette modal/render blogu ayri component'e tasindi (`dashboard-command-palette-dialog.tsx`) ve `dashboard-command-palette.tsx` dosyasi sadelestirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; klavye akis semantigi, komut davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-082
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz on altinci dilimde vehicle update form render blogu ayri component'e tasindi (`vehicle-update-form-section.tsx`) ve `vehicle-update-drawer-form.tsx` dosyasi sadelestirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; vehicle patch davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-083
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_dispatcher_productivity`
- `Web Trigger`: Faz 2 yuz on yedinci dilimde `/drivers` side paneline secili uye icin route-yetki gorunumu eklendi; bagli rotalar listelenir ve tek tikla `/routes?routeId=...` gecisi acilir.
- `App Impact (ozet)`: Yok. Bu degisiklik dispatcher web UX hizlandirmasidir; backend endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-084
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_dispatcher_productivity`
- `Web Trigger`: Faz 2 yuz on sekizinci dilimde `/routes` side paneline secili rota icin yetkili uye gorunumu eklendi; authorized/driver bagli uyeler listelenir ve tek tikla `/drivers?memberUid=...` gecisi acilir.
- `App Impact (ozet)`: Yok. Bu degisiklik dispatcher web UX hizlandirmasidir; backend endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-085
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_dispatcher_productivity`
- `Web Trigger`: Faz 2 yuz on dokuzuncu dilimde `/drivers` side paneline secili uye icin aktif sefer listesi eklendi (`useCompanyActiveTrips` driver-scope) ve tek tikla `live-ops` deep-link gecisi acildi.
- `App Impact (ozet)`: Yok. Bu degisiklik dispatcher web UX hizlandirmasidir; backend endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-086
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_dispatcher_productivity`
- `Web Trigger`: Faz 2 yuz yirminci dilimde `/routes` side paneline secili rota icin aktif sefer listesi eklendi (`useCompanyActiveTrips` route-scope) ve tek tikla `live-ops` deep-link gecisi acildi.
- `App Impact (ozet)`: Yok. Bu degisiklik dispatcher web UX hizlandirmasidir; backend endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-087
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_dispatcher_productivity`
- `Web Trigger`: Faz 2 yuz yirmi birinci dilimde `/vehicles` side paneline secili plaka icin aktif sefer listesi eklendi (`useCompanyActiveTrips` + plate eslesmesi) ve tek tikla `live-ops` deep-link gecisi acildi.
- `App Impact (ozet)`: Yok. Bu degisiklik dispatcher web UX hizlandirmasidir; backend endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-088
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yirmi ikinci dilimde route update formunun render blogu ayri component'e tasindi (`route-update-form-section.tsx`) ve `route-update-drawer-form.tsx` dosyasi sadelestirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web component parcalama/refactor seviyesinde; route patch davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-089
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yirmi ucuncu dilimde stop form dogrulama mantigi helper katmanina tasindi (`validateStopFormInput` in `route-stops-editor-helpers.ts`) ve editor dosyasi sadelestirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki form validation kod organizasyonunu etkiler; stop create/update endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-090
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_ui_only_dispatcher_productivity`
- `Web Trigger`: Faz 2 yuz yirmi dorduncu dilimde `/drivers`, `/routes`, `/vehicles` side panellerindeki aktif sefer bloklarina "Tumunu Live Ops'ta Ac" hizli aksiyonu eklendi (`driverUid/routeId/q` preset query ile).
- `App Impact (ozet)`: Yok. Bu degisiklik dispatcher web UX hizlandirmasidir; backend endpoint kontratlari, domain kurallari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-091
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yirmi besinci dilimde `/live-ops` state hook'u iki alt hook'a ayrildi (`use-live-ops-derived-state.ts`, `use-live-ops-selected-trip-stream-state.ts`) ve ana state dosyasi sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web tarafinda state kod organizasyonu/refactor seviyesindedir; filtreleme, secim, RTDB stream davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-092
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yirmi altinci dilimde route stop reorder ve drag-drop planlama akislari helper katmanina tasindi (`route-stops-editor-reorder-helpers.ts`) ve editor dosyasi sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web tarafinda stop reorder kod organizasyonunu etkiler; durak siralama davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-093
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yirmi yedinci dilimde `/drivers` ekranindaki query parse/sync mantigi helper katmanina tasindi (`drivers-members-query-helpers.ts`) ve feature dosyasi sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki query kod organizasyonunu etkiler; filtreleme/deep-link davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-094
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yirmi sekizinci dilimde `/routes` ekranindaki query parse/sync mantigi helper katmanina tasindi (`routes-query-helpers.ts`) ve feature dosyasi sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki query kod organizasyonunu etkiler; filtreleme/deep-link davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-095
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz yirmi dokuzuncu dilimde `/vehicles` ekranindaki query parse/sync mantigi helper katmanina tasindi (`vehicles-query-helpers.ts`) ve feature dosyasi sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki query kod organizasyonunu etkiler; filtreleme/deep-link davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-096
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz otuzuncu dilimde command palette action uretim/merge/filter/summary mantigi helper katmanina tasindi (`dashboard-command-palette-helpers.ts`) ve ana component sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki command palette kod organizasyonunu etkiler; kisa yol davranisi, route yonlendirmeleri, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-097
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz otuz birinci dilimde live-ops liste ekranindaki ust aksiyon/filtre blogu ayri component'e tasindi (`live-ops-trips-list-toolbar.tsx`) ve ana liste component'i sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki live-ops UI kod organizasyonunu etkiler; filtreleme/listeleme/copy-link davranisi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-098
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz otuz ikinci dilimde live-ops filtre/seÃƒÂ§im state ve handler blogu ayri hook'a tasindi (`use-live-ops-filters.ts`) ve ana state hook'u sadeleÃ…Å¸tirildi.
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki state organizasyonunu etkiler; filter/query semantigi, trip secimi, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-099
- `Status`: `not_required`
- `Priority`: `P3`
- `Kategori`: `web_refactor_no_contract_change`
- `Web Trigger`: Faz 2 yuz otuz ucuncu dilimde dashboard mode placeholder icindeki company summary hesaplama, sinyal formatlama ve hizli aksiyon veri seti helper katmanina tasindi (`dashboard-mode-placeholder-helpers.ts`).
- `App Impact (ozet)`: Yok. Degisiklik yalniz web icindeki dashboard mode kod organizasyonunu etkiler; mode davranisi, route yonlendirmeleri, endpoint kontratlari ve app davranis/mesaj semantigi degismedi.
- `Planlanan App Degisiklikleri`:
  - yok
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: yok
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-100
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 yuz otuz dorduncu dilimde company member role/status mutasyonu acildi (`updateCompanyMember` callable) ve `/drivers` side panelinde role/durum update karti gercek backend'e baglandi.
- `App Impact (ozet)`: App tarafi ileride company member yonetimi actiginda ayni patch semantigini (`role`, `memberStatus`) ve guard davranislarini (owner immutable, self-suspend deny, owner/admin actor gereksinimi) birebir map etmeli.
- `Planlanan App Degisiklikleri`:
  - `updateCompanyMember` request/response parser parity (`companyId`, `memberUid`, `patch`, `updatedAt`)
  - owner hedef immutable ve self-suspend deny hata semantigi icin copy/state mapping
  - owner/admin disi actorlarda mutation aksiyonu gizleme/disable UX parity
  - company member liste ekranlarinda role-status update sonrasi optimistic refresh davranisi
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: future company member management ekranlari, authz guard copy/state katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet, yeni mutasyon kontrati acildi ve app parity backlog'una eklendi. 2026-02-27: `updateCompanyMember` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-101
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 yuz otuz besinci dilimde company member davet mutasyonu acildi (`inviteCompanyMember` callable) ve `/drivers` side panelinde uye davet karti gercek backend'e baglandi.
- `App Impact (ozet)`: App tarafi ileride company uye daveti actiginda ayni request/response semantigini (`email`, `role`, `status=pending`, `expiresAt`) ve actor-policy kurallarini (owner/admin actor, admin->admin deny) map etmeli.
- `Planlanan App Degisiklikleri`:
  - `inviteCompanyMember` request/response parser parity (`companyId`, `email`, `role` -> `inviteId`, `memberUid`, `status`, `expiresAt`)
  - "email sistemde yoksa davet acilmaz" (`INVITE_EMAIL_NOT_FOUND`) hata/copy mapping'i
  - admin actor icin admin daveti deny davranisini UI seviyesinde disable/uyari parity
  - pending invite durumunun company member listesinde `invited` state olarak gorunmesi parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: future company member invite flows, member list invited-state rendering, authz guard copy/state katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet, yeni davet kontrati acildi ve app parity backlog'una eklendi. 2026-02-27: `inviteCompanyMember` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-102
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 yuz otuz altinci dilimde invite kabul mutasyonu acildi (`acceptCompanyInvite` callable) ve `/mode-select` ekraninda `memberStatus=invited` satirlarinda tek tik kabul + company mode gecis akisi aktif edildi.
- `App Impact (ozet)`: App tarafi future company mode selector/davet onboarding akisinda ayni kabul kontratini (`companyId` -> `memberStatus=active`, `acceptedAt`) ve invited->active state gecisini map etmeli.
- `Planlanan App Degisiklikleri`:
  - `acceptCompanyInvite` request/response parser parity (`companyId` -> `role`, `memberStatus`, `acceptedAt`)
  - mode selector'da `invited` company satirlari icin "Daveti Kabul Et" aksiyonu ve sonrasinda active company context secimi
  - `INVITE_NOT_ACCEPTABLE` hata code/copy mapping'i (invited disi durumlarda)
  - invite kabul sonrasi company-membership cache refresh ve dashboard gecis parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: future mode selector/company chooser, invite onboarding flow, company membership cache/state katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet, yeni invite kabul kontrati acildi ve app parity backlog'una eklendi. 2026-02-27: `acceptCompanyInvite` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-103
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 yuz otuz yedinci dilimde invite red mutasyonu acildi (`declineCompanyInvite` callable) ve `/mode-select` ekraninda `memberStatus=invited` satirlari icin "Daveti Reddet" aksiyonu eklendi.
- `App Impact (ozet)`: App tarafi future company invite onboarding akisinda ayni red kontratini (`companyId` -> `memberStatus=suspended`, `declinedAt`) map etmeli; red sonrasi mode selector'da company satiri askida semantigine gecmeli.
- `Planlanan App Degisiklikleri`:
  - `declineCompanyInvite` request/response parser parity (`companyId` -> `role`, `memberStatus`, `declinedAt`)
  - mode selector'da invited satirlar icin "Daveti Reddet" aksiyonu ve red sonrasi `suspended` state rendering parity
  - `INVITE_NOT_DECLINABLE` hata code/copy mapping'i (invited disi durumlarda)
  - invite red sonrasi company-membership cache refresh ve aksiyon disable davranisi parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: future mode selector/company chooser, invite onboarding flow, company membership state/copy katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet, yeni invite red kontrati acildi ve app parity backlog'una eklendi. 2026-02-27: `declineCompanyInvite` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-104
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 yuz otuz sekizinci dilimde company member kaldirma mutasyonu acildi (`removeCompanyMember` callable) ve `/drivers` side panelinde secili uye icin "Uyeyi Sirketten Cikar" aksiyonu backend'e baglandi.
- `App Impact (ozet)`: App tarafi future company member management akisinda ayni kaldirma kontratini (`companyId`, `memberUid`) map etmeli; owner/self kaldirma deny ve admin->admin deny policy copy/state semantigi korunmali.
- `Planlanan App Degisiklikleri`:
  - `removeCompanyMember` request/response parser parity (`companyId`, `memberUid` -> `removedRole`, `removedMemberStatus`, `removed`, `removedAt`)
  - owner hedef kaldirma deny (`OWNER_MEMBER_IMMUTABLE`) ve self-remove deny (`SELF_MEMBER_REMOVE_FORBIDDEN`) hata/copy mapping'i
  - admin actor icin admin uye kaldirma deny davranisinin UI disable/uyari parity'si
  - uye kaldirma sonrasi member liste/cache refresh ve secili uye fallback davranisi parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: future company member management ekranlari, role/policy guard copy-state katmani, membership list cache orchestrasyonu
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet, yeni uye kaldirma kontrati acildi ve app parity backlog'una eklendi. 2026-02-27: `removeCompanyMember` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-105
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 yuz otuz dokuzuncu dilimde route-level permission mutasyonlari acildi (`grantDriverRoutePermissions`, `revokeDriverRoutePermissions`) ve `/routes` update drawer authorized uye toggle akisi bu endpointlerle calisacak sekilde degistirildi.
- `App Impact (ozet)`: App tarafi future route yetki yonetimi akisinda authorized driver togglesini ayni grant/revoke kontratlariyla map etmeli; reset revoke davranisi (`resetToDefault`) ve ana surucu immutability (`ROUTE_PRIMARY_DRIVER_IMMUTABLE`) copy/state semantigi korunmali.
- `Planlanan App Degisiklikleri`:
  - `grantDriverRoutePermissions` request/response parser parity (`companyId`, `routeId`, `driverUid`, `permissions`, `updatedAt`)
  - `revokeDriverRoutePermissions` request/response parser parity (`companyId`, `routeId`, `driverUid`, `permissionKeys?`, `resetToDefault?`, `updatedAt`)
  - route authorized member toggle UX'inde diff-temelli grant/revoke orchestration parity (ekle/ciikar ayrik mutasyon)
  - `ROUTE_PRIMARY_DRIVER_IMMUTABLE` ve tenant mismatch hata code/copy mapping parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: future route detail/permissions paneli, route membership policy guards, mutation error feedback katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet, yeni route-permission kontratlari acildi ve app parity backlog'una eklendi. 2026-02-27: `grantDriverRoutePermissions` + `revokeDriverRoutePermissions` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-106
- `Status`: `web_done_app_pending`
- `Priority`: `P1`
- `Kategori`: `contract`
- `Web Trigger`: Faz 2 iki yuz kirkinci dilimde route permission read-side endpoint'i acildi (`listRouteDriverPermissions` callable) ve `/routes` side panelinde yetkili uye kartlarina permission ozeti (`aktif izin sayisi`) baglandi.
- `App Impact (ozet)`: App tarafi future route permission panelinde route bazli permission read modelini ayni kontratla map etmeli; grant/revoke mutasyonlari sonrasi permission liste refresh ve fallback semantigi parity korunmali.
- `Planlanan App Degisiklikleri`:
  - `listRouteDriverPermissions` request/response parser parity (`companyId`, `routeId` -> `items[].driverUid`, `items[].permissions`, `items[].updatedAt`)
  - route permission kartlarinda `X/6 aktif` benzeri sade ozet semantigi parity
  - query hata durumunda "varsayilan izin gorunumu" fallback copy/state parity
  - grant/revoke sonrasi route permission liste yeniden yukleme (read-after-write consistency) parity
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: future route permission read paneli, route detail side panel, permission cache/state orchestrasyonu
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet, yeni route permission read kontrati acildi ve app parity backlog'una eklendi. 2026-02-27: `listRouteDriverPermissions` response-shape runtime guard eklendi (`CONTRACT_MISMATCH` sinyali aktif).

### W2A-107
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk birinci dilimde `/routes` side paneline "Detayli Rota Yetkileri" editoru eklendi; mevcut `listRouteDriverPermissions` read-state baz alinip 6 permission flag `grantDriverRoutePermissions` ile toplu kaydedilir.
- `App Impact (ozet)`: Yeni API acilmadi ancak app tarafinda route yetki UX parity icin fine-grained editor semantigi (read baseline + full-object save) gerekebilir; stale read durumunda submit engelleme davranisi parity degerinde degerlendirilmelidir.
- `Planlanan App Degisiklikleri`:
  - route permission panelinde uye secimi + 6 flag editor parity
  - read-state (`loading/error`) tamamlanmadan write aksiyonunu kilitleme parity
  - save sonucu copy semantigi (degisiklik yok / basarili / hata) parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Dosyalari`: future route permission UI/editor katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (davranis/copy semantigi), ancak yeni kontrat acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-108
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk ikinci dilimde `/drivers -> /routes` gecisi `memberUid` deep-link ile genisletildi; `/drivers` panelindeki yeni aksiyon secili uye icin route yetki editorunu hedefleyen query ile `/routes` ekranina yonlendiriyor.
- `App Impact (ozet)`: App tarafinda ileride member->route permission gecisi acilacaksa ayni deep-link semantigi korunmali; gecersiz uye query'sini temizleyen self-heal davranisi ve "ilk uygun route'u sec" fallback modeli parity olarak alinmali.
- `Planlanan App Degisiklikleri`:
  - member odakli route permission gecisi icin `memberUid` context parametresi parity
  - route ekraninda secili uyeye uygun route fallback secimi parity
  - gecersiz uye context'inde URL/state self-heal temizligi parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company member detail -> route permission gecisleri, route permission editor preselect state
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (davranis/deep-link semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-109
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk ucuncu dilimde `/routes` ekraninda `memberUid` odakli deep-link kilitlenmesi duzeltildi; manuel rota seciminde uye eslesmesi yoksa `memberUid` query temizleniyor ve panel basligina "Uye Odagini Temizle" aksiyonu eklendi.
- `App Impact (ozet)`: App tarafinda ileride member-odakli route deep-link kullanilacaksa ayni "odakli moddan manuel cikis" davranisi uygulanmali; aksi halde kullanÃ„Â±cÃ„Â± belli bir uye context'ine kilitlenebilir.
- `Planlanan App Degisiklikleri`:
  - member odakli route ekraninda manuel rota seciminde context-clear parity
  - route liste basliginda odagi sifirlama aksiyonu parity
  - gecersiz/eslesmeyen member-route kombinasyonunda self-heal URL/state parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future route list/detail context management, deep-link query/state orchestrasyonu
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (davranis/state semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-110
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk dorduncu dilimde `/drivers` side panelindeki rota listesi route-gecisinde `memberUid` context'ini koruyacak sekilde guncellendi; rota satirlarina secili uye bazli rol etiketi (`Ana Surucu` / `Yetkili Surucu`) eklendi.
- `App Impact (ozet)`: App tarafinda future uye->rota gecisinde context kaybi olmamasi icin `routeId + memberUid` birlikte tasinmali; rota satiri rol etiketi semantigi app detail/list parity'sine alinmali.
- `Planlanan App Degisiklikleri`:
  - uye panelinden rota acilisinda `memberUid` context parity
  - rota satirinda uye-ozel rol etiketi parity (`Ana Surucu` / `Yetkili Surucu`)
  - uye->rota gecisinde permission editor preselect davranisi parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future member detail route list, route permission preselect/state katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (davranis/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-111
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk besinci dilimde `/drivers` panelindeki secili uye rota listesi siralamasi guncellendi; uye `Ana Surucu` oldugu rotalar once, `Yetkili Surucu` oldugu rotalar sonra listeleniyor.
- `App Impact (ozet)`: App tarafinda future uye-detay rota listesinde ayni "rol-odakli siralama" parity'si uygulanmali; operator her ekranda ayni oncelik modelini gormeli.
- `Planlanan App Degisiklikleri`:
  - uyeye bagli rota listesinde primary-driver onceleme parity
  - rol etiketi + siralama semantigi parity (`Ana Surucu` / `Yetkili Surucu`)
  - mevcut arsiv/alfa tie-break modelini koruma parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future member detail route list sorting/helpers katmani
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (davranis semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-112
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk altinci dilimde route permission UX'i aktif-uye kuralina gore sertlestirildi; permission editor sadece `memberStatus=active` uyeleri duzenliyor, inaktif uyeler bilgilendirme metniyle ayriliyor ve `/drivers` panelindeki rota-yetki duzenleme aksiyonu inaktif uye icin kilitleniyor.
- `App Impact (ozet)`: App tarafinda future route permission akisinda ayni aktif-uye guard zorunlu olmali; inaktif uye icin write aksiyonu disable + yonlendirici copy parity korunmali.
- `Planlanan App Degisiklikleri`:
  - route permission editorunde aktif uye filtresi parity
  - inaktif uye icin aksiyon disable + copy parity
  - member odakli query'de "uye var ama rota eslesmesi yok" durumunda self-heal parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future route permission editor and member management action guards
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (davranis/policy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-113
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk yedinci dilimde `/routes` update drawer'a inaktif yetki uyari karti ve "Inaktif Yetkileri Formdan Temizle" aksiyonu eklendi; formdaki `authorizedDriverIds` aktif uye setiyle hizalanabiliyor.
- `App Impact (ozet)`: App tarafinda future route update ekraninda gorunmeyen/inaktif yetkileri yonetmek icin ayni guard ve temizleme aksiyonu olmali; aksi halde kullanici formda gormedigi uyeleri kaldiramaz.
- `Planlanan App Degisiklikleri`:
  - route update formunda inaktif-yetki tespiti parity
  - inaktif yetkileri tek tikla formdan temizleme parity
  - save oncesi `authorizedDriverIds` aktif uye setiyle hizalama parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future route update/assignment form state helpers
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (davranis/form semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-114
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk sekizinci dilimde `/dashboard` hizli aksiyonlari `invited` ve `suspended` uye metriklerine gore dinamiklestirildi; sayi > 0 oldugunda ilgili filtreli `drivers` deep-link kartlari gorunuyor.
- `App Impact (ozet)`: App tarafinda future company dashboard varsa ayni operasyonel odak kartlari (bekleyen davet / askidaki uye) parity olarak alinmali.
- `Planlanan App Degisiklikleri`:
  - dashboard ozetinde invited/suspended uye sayisi parity
  - filtreli uye listesi deep-link aksiyonlari parity
  - kartlarin sadece sayi > 0 iken gorunmesi parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company dashboard summary cards and quick-actions
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (dashboard davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-115
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz kirk dokuzuncu dilimde dashboard KPI kartlarinda `Uye Sayisi` alanina alt kirilim satiri eklendi (`Aktif / Davet / Askida`).
- `App Impact (ozet)`: App tarafinda future company dashboard KPI karti olacaksa ayni uye-dagilim kirilimi parity alinmali; sadece toplam uye gostermek operasyonel karar hizini dusurur.
- `Planlanan App Degisiklikleri`:
  - uye KPI kartinda aktif/davet/askida alt metin parity
  - yukleme durumunda kirilim metni fallback parity
  - dashboard copy semantiginde toplam + dagilim birlikteligi parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company dashboard KPI componentleri
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (dashboard davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-116
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz ellinci dilimde dashboard hizli aksiyon kartlarina ton semantigi eklendi (`default` / `attention` / `warning`); `invited` karti amber, `suspended` karti rose tonunda gosteriliyor.
- `App Impact (ozet)`: App tarafinda future dashboard quick-action kartlari ayni oncelik tonu semantigini korumali; kritik operasyon kartlari gorsel olarak ayrismali.
- `Planlanan App Degisiklikleri`:
  - quick-action karti ton enum parity (`default/attention/warning`)
  - invited/suspended kartlarinda kritik ton parity
  - ton bazli card class/token mapping parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company dashboard quick-actions and visual token mapping
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (gorsel davranis semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-117
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli birinci dilimde dashboard quick-action listesi risk odagina gore sort edilmeye baslandi; `warning` ve `attention` kartlari varsayilan kartlarin ustunde gosteriliyor.
- `App Impact (ozet)`: App tarafinda future dashboard quick-action listesi ayni oncelik siralama kuraliyla render edilmeli; kritik kartlarin alta dusmesi onlenmeli.
- `Planlanan App Degisiklikleri`:
  - quick-action listesinde tone-priority sort parity
  - `warning > attention > default` siralama parity
  - kritik kartlari ustte tutan liste davranisi parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future dashboard quick-action list rendering/sort helpers
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste davranisi semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-118
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli ikinci dilimde `/drivers` liste basligina status ozet ciplari eklendi; `Aktif/Davet/Askida` sayilari toplam company member setinden hesaplanip tek tikla ilgili status filtresini uygular.
- `App Impact (ozet)`: App tarafinda future company member listesinde ayni status-summary + quick filter ciplari parity alinmali; dispatcher listede filtreye daha hizli ulasir.
- `Planlanan App Degisiklikleri`:
  - member list header'da status summary chip parity
  - chip->status filter hizli gecis parity
  - status seciliyken "Tum Durumlar" reset aksiyonu parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company member list toolbar/filter components
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste filtreleme davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-119
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli ucuncu dilimde `/drivers` liste basligina role ozet ciplari eklendi; `Owner/Admin/Dispatcher/Viewer` sayilari toplam member setinden hesaplanip tek tikla ilgili role filtresini uygular.
- `App Impact (ozet)`: App tarafinda future company member listesinde ayni role-summary + quick filter ciplari parity alinmali; dispatcher role bazli uye taramasini daha hizli yapar.
- `Planlanan App Degisiklikleri`:
  - member list header'da role summary chip parity
  - chip->role filter hizli gecis parity
  - role seciliyken `Tum Roller` reset aksiyonu parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company member list toolbar/filter components
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste filtreleme davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.
### W2A-120
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli dorduncu dilimde `/drivers` ekranina query-senkron pagination eklendi (`page` param) ve `memberUid` deep-link secimi ilgili sayfaya otomatik hizalandi.
- `App Impact (ozet)`: App tarafinda future company member listesinde buyuk listeler icin pagination + deep-link uyumu parity alinmali.
- `Planlanan App Degisiklikleri`:
  - member listesinde page modelinin filtre/siralama ile birlikte calismasi parity
  - deep-link secili uye icin hedef sayfaya otomatik hizalama parity
  - `page` reset davranisinin filtre degisimiyle tutarli olmasi parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future company member list pagination/query helpers
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste davranisi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-121
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli besinci dilimde route stop editorune `Basa`/`Sona` hizli tasima aksiyonlari eklendi (mevcut reorder callable reuse).
- `App Impact (ozet)`: App tarafinda future stop editorde ayni hizli tasima aksiyonlari parity alinmali; uzun rota duzenleme sureleri kisaltilmali.
- `Planlanan App Degisiklikleri`:
  - stop listesinde en uste/en alta tasima parity
  - mevcut yukari/asagi reorder semantigiyle birlikte calisma parity
  - reorder basari/failure copy semantigi parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future route stop editor action bar/reorder helpers
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (duzenleme davranisi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-122
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli altinci dilimde `/vehicles` side paneline canli `Atama Ozeti` karti eklendi; aktif seferlerden sofor/rota ozetleri gosteriliyor.
- `App Impact (ozet)`: App tarafinda future vehicle detail ekraninda ayni canli assignment ozeti parity alinmali.
- `Planlanan App Degisiklikleri`:
  - secili arac icin aktif sofor sayisi parity
  - aktif sofor/rota ozet chipleri parity
  - atama yok durumunda fallback copy parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future vehicle detail / assignment summary components
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (detay ekran davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.
### W2A-123
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli yedinci dilimde `/routes` liste basligina status summary ciplari eklendi (`Aktif`, `Arsiv`) ve tek tik status filtre aksiyonu acildi.
- `App Impact (ozet)`: App tarafinda future route listesinde ayni status-summary + quick filter ciplari parity alinmali.
- `Planlanan App Degisiklikleri`:
  - route list header'da status summary chip parity
  - chip->status filter hizli gecis parity
  - status seciliyken `Tum Durumlar` reset parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future route list toolbar/filter components
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste filtreleme davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-124
- `Status`: `triaged`
- `Priority`: `P3`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli sekizinci dilimde `/vehicles` liste basligina status summary ciplari eklendi (`Aktif`, `Bakim`, `Pasif`) ve tek tik status filtre aksiyonu acildi.
- `App Impact (ozet)`: App tarafinda future vehicle listesinde ayni status-summary + quick filter ciplari parity alinmali.
- `Planlanan App Degisiklikleri`:
  - vehicle list header'da status summary chip parity
  - chip->status filter hizli gecis parity
  - status seciliyken `Tum Durumlar` reset parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future vehicle list toolbar/filter components
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste filtreleme davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.

### W2A-125
- `Status`: `triaged`
- `Priority`: `P2`
- `Kategori`: `behavior`
- `Web Trigger`: Faz 2 iki yuz elli dokuzuncu dilimde `/dashboard` individual mode KPI/ozet kartlari statik degerlerden dinamik company summary degerlerine tasindi.
- `App Impact (ozet)`: App tarafinda bireysel dashboard KPI/ozet kartlari statik placeholder yerine gercek operasyon metriklerinden beslenmeli.
- `Planlanan App Degisiklikleri`:
  - individual KPI kartlarinda dinamik sefer/rota/arac degeri parity
  - individual ozet kartlarinda statik metinlerin kaldirilmasi parity
  - yukleme durumunda `Yukleniyor` fallback copy parity
- `Bloklayici mi?`: `no`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Dosyalari`: future individual dashboard KPI/summary components
- `Notlar`: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (dashboard davranisi/copy semantigi), yeni endpoint acilmadigi icin `API-DIFF` kaydi acilmadi.
### W2A-126
- Status: triaged
- Priority: P3
- Kategori: behavior
- Web Trigger: Faz 2 iki yuz altmisinci dilimde /routes ekranina query-senkron pagination eklendi (page param) ve routeId deep-link secimi ilgili sayfaya otomatik hizalandi.
- App Impact (ozet): App tarafinda future company route listesinde buyuk liste taramasi icin pagination + deep-link sayfa hizalama parity alinmali.
- Planlanan App Degisiklikleri:
  - route listesinde page modelinin filtre/siralama ile birlikte calismasi parity
  - deep-link secili rota icin hedef sayfaya otomatik hizalama parity
  - filtre degisiminde page reset davranisi parity
- Bloklayici mi?: no
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: future route list pagination/query helpers
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste davranisi), yeni endpoint acilmadigi icin API-DIFF kaydi acilmadi.

### W2A-127
- Status: triaged
- Priority: P3
- Kategori: behavior
- Web Trigger: Faz 2 iki yuz altmis birinci dilimde /vehicles ekranina query-senkron pagination eklendi (page param) ve vehicleId deep-link secimi ilgili sayfaya otomatik hizalandi.
- App Impact (ozet): App tarafinda future company vehicle listesinde buyuk liste taramasi icin pagination + deep-link sayfa hizalama parity alinmali.
- Planlanan App Degisiklikleri:
  - vehicle listesinde page modelinin filtre/siralama ile birlikte calismasi parity
  - deep-link secili arac icin hedef sayfaya otomatik hizalama parity
  - filtre degisiminde page reset davranisi parity
- Bloklayici mi?: no
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: future vehicle list pagination/query helpers
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste davranisi), yeni endpoint acilmadigi icin API-DIFF kaydi acilmadi.

### W2A-128
- Status: triaged
- Priority: P3
- Kategori: behavior
- Web Trigger: Faz 2 iki yuz altmis ikinci dilimde /routes ve /vehicles listelerine ortak pager UI semantigi eklendi (Onceki/Sonraki, Sayfa X/Y, filtered/total baglami).
- App Impact (ozet): App tarafinda future route/vehicle listelerinde tutarli pager UX semantigi parity alinmali.
- Planlanan App Degisiklikleri:
  - route ve vehicle listelerinde ortak pager bileseni parity
  - Sayfa X / Y baglam metni parity
  - onceki/sonraki buton disable davranisi parity
- Bloklayici mi?: no
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: future route list and vehicle list toolbar/list footer components
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (liste gezinme davranisi), yeni endpoint acilmadigi icin API-DIFF kaydi acilmadi.
## 4. Yazi Kurali

- Karar degismis ama app implementasyonu daha baslamamissa: mevcut kaydi guncelle, yeni duplicate kayit acma
- "Yapildi" oldugunda hangi commit/PR ile kapandigini not et






### W2A-129
- Status: triaged
- Priority: P2
- Kategori: rbac
- Web Trigger: Faz 3 birinci dilimde `/admin` role-gated shell acildi ve dashboard mutasyon panellerinde actor status tabanli RBAC UI sertlestirmesi yapildi.
- App Impact (ozet): App tarafinda da invited/suspended actorlarin mutasyon aksiyonlari tutarli sekilde kilitlenmeli; owner/admin ve dispatcher ayrimi ekran seviyesinde netlestirilmeli.
- Planlanan App Degisiklikleri:
  - admin benzeri kritik ekranlara role gate parity
  - invited/suspended actorlar icin mutasyon buton disable + aciklama copy parity
  - routes/vehicles/drivers mutasyonlarinda active role guard parity
- Bloklayici mi?: no
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/76_multi_agent_execution_protocol.md
- Ilgili App Dosyalari: role gate ve mutasyon action barlari (driver/route/vehicle ekranlari)
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: evet (RBAC davranis ve copy semantigi). Yeni endpoint acilmadigi icin API-DIFF kaydi acilmadi.

### W2A-130
- Status: no_action_required
- Priority: P4
- Kategori: contract
- Web Trigger: Faz 3 ucuncu dilimde `listCompanyAuditLogs` endpointi ve `/admin` read-only audit listesi acildi.
- App Impact (ozet): Yok (simdilik). Bu endpoint internal web admin gorunurlugu icindir, mobil appte karsilikli ekran bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/42_p0_endpoint_contracts_v1_draft.md, plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-131
- Status: no_action_required
- Priority: P4
- Kategori: contract
- Web Trigger: Faz 3 altinci dilimde `getCompanyAdminTenantState` endpointi acildi ve `/admin` ekranina tenant suspension/lock read-only kartlari baglandi.
- App Impact (ozet): Yok (simdilik). Admin web operasyon paneline ozel bir gorunurluk endpoint'i.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/42_p0_endpoint_contracts_v1_draft.md, plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-132
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yedinci dilimde `/admin` risk triage listesi tenant riskleriyle birlestirildi (bos risk false-negative duzeltmesi) ve audit bolumune status KPI ozet kartlari + sayili filtre etiketleri eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin operasyon ekraninin okunurlugunu artirir; mobil appte karsilikli admin ekrani yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-133
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 sekizinci dilimde `/admin` audit paneline event/target/search filtreleri, filtre ozeti ve gorunen zaman araligi etiketi eklendi; audit bolumu ayri component'e tasinarak dosya sisme riski azaltildi.
- App Impact (ozet): Yok (simdilik). Bu iyilestirme yalnizca web admin read-side triage ekraninin kullanilabilirligini artirir.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-134
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 dokuzuncu dilimde `/admin` audit paneline "Ozeti Kopyala" aksiyonu eklendi (filtre ozeti, status dagilimi, zaman araligi ve son olay satiri).
- App Impact (ozet): Yok (simdilik). Bu aksiyon web admin operasyon paylasimi icindir; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-135
- Status: no_action_required
- Priority: P4
- Kategori: rbac
- Web Trigger: Faz 3 onuncu dilimde dashboard command palette icindeki `Admin` hizli aksiyonu role/status gate ile sinirlandi (`owner|admin` + `memberStatus=active`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web command palette navigasyonuyla ilgilidir; mobil appte ayni bilesen bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-136
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 on birinci dilimde `/admin` audit paneli ilk acilista query paramlardan preset filtre okuyacak sekilde guncellendi (`auditStatus/auditEvent/auditTarget/auditQ`) ve side panelde `Denied Audit` hizli gecisi eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin triage navigasyonuyla ilgilidir; mobil appte ayni admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-137
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 on ikinci dilimde `/admin` audit listesine adimli yukleme eklendi (8'erli artan gorunum + `Gosterilen X/Y` ozeti + filtre degisiminde gorunum reseti).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin read-side listeleme ergonomisine yoneliktir; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-138
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 on ucuncu dilimde `/admin` audit deep-link preset filter state modeli sertlestirildi (query degisince preset takip + local override korunumu).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin filtre-state parity duzeltmesidir; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-139
- Status: no_action_required
- Priority: P4
- Kategori: rbac
- Web Trigger: Faz 3 on dorduncu dilimde dashboard header aksiyonlarina role-gated `Admin` kisayolu eklendi (`owner|admin` + `active` + company context).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web header navigasyon akisiyla ilgilidir; mobil appte esdeger dashboard header kisayolu bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-140
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 on besinci dilimde `/admin` risk triage listesi audit `denied/error` sinyallerini de kapsayacak sekilde genisletildi (`/admin?auditStatus=denied|error` deep-linkleri).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin read-side risk gorunurlugunu artirir; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-141
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 on altinci dilimde `/admin` audit paneline "Filtre Linki Kopyala" aksiyonu eklendi (aktif `auditStatus/auditEvent/auditTarget/auditQ` query paramlariyla URL olusur).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin triage paylasim akisiyla ilgilidir; mobil appte esdeger admin audit filtresi/URL modeli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-142
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 on yedinci dilimde `/admin` audit satirlarina "Hedefe Git" aksiyonu eklendi (targetType bazli deep-link).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin panelinden operasyon ekranina gecis ergonomisiyle ilgilidir; mobil appte esdeger admin audit listesi bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-143
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 on sekizinci dilimde `/admin` audit paneline siralama modlari eklendi (`newest/oldest/status_priority`) ve filtre linkine `auditSort` query destegi verildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin read-side triage gorunumunu iyilestirir; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-144
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 on dokuzuncu dilimde `/admin` audit panel helperlari ayri modula tasindi (`admin-audit-panel-helpers.ts`), ana dosya satir limiti tekrar guvenceye alindi.
- App Impact (ozet): Yok. Refactor sadece web kod organizasyonunu etkiler; app davranisi/kontrati/copy degismez.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-145
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yirminci dilimde `/admin` audit paneline filtrelenmis/siralanmis kayitlari dosya olarak veren `CSV Indir` aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin read-side disa-aktarma ergonomisiyle ilgilidir; mobil appte esdeger admin audit export ekrani bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-146
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yirmi birinci dilimde `/admin` audit panelinde local override aktifken URL query presetlerine geri donus (`URL Presetine Don`) aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin filtre-state/deep-link parity davranisiyla ilgilidir; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-147
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 yirmi ikinci dilimde `/admin` audit event label sozlugu genisletildi; ham event kodlari yerine operasyonel metinler daha kapsayici hale getirildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin audit okunurlugu/copy katmanini etkiler; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-148
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yirmi ucuncu dilimde `/admin` audit hedef deep-link kapsami `company` ve `route_driver_permission` target tiplerini kapsayacak sekilde genisletildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin triage ekranindan operasyon ekranlarina gecis ergonomisini etkiler; mobil appte esdeger admin audit deep-link paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-149
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 yirmi dorduncu dilimde `/admin` audit satirlarindaki targetType metinleri operasyonel etiketlere cevrildi (`Firma/Uye/Rota Yetkisi` vb.).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin audit okunurlugu/copy katmanini etkiler; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-150
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yirmi besinci dilimde admin side panel hizli gecis listesine `Hata Audit` kisa yolu eklendi (`/admin?auditStatus=error`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin navigasyon ergonomisini etkiler; mobil appte esdeger admin panel hizli gecis listesi bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-151
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 yirmi altinci dilimde `/admin` audit panelindeki ozet/link metni uretimi helper katmanina tasindi; ana dosya satir sayisi dusuruldu.
- App Impact (ozet): Yok. Refactor sadece web kod organizasyonunu etkiler; app davranisi/kontrati/copy degismez.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-152
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 yirmi yedinci dilimde admin operations ekranindaki sabit/gorsel helperlar ayri helper dosyasina tasindi; ana feature dosyasi satir sayisi azaltildi.
- App Impact (ozet): Yok. Refactor sadece web kod organizasyonunu etkiler; app davranisi/kontrati/copy degismez.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-153
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yirmi sekizinci dilimde `/admin` audit paneline `Aksiyonlanabilir` filtresi eklendi ve filtre link parity'sine `auditActionable=1` query parami baglandi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin triage filtreleme ergonomisine ozeldir; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-154
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 yirmi dokuzuncu dilimde admin audit satir render blogu `admin-audit-row-item.tsx` bilesenine ayrildi; ana panel dosyasi satir baskisi dusuruldu.
- App Impact (ozet): Yok. Refactor sadece web kod organizasyonunu etkiler; app davranisi/kontrati/copy degismez.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-155
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 otuzuncu dilimde admin side panel hizli gecis listesine `Aksiyonlanabilir Audit` kisa yolu eklendi (`/admin?auditActionable=1`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin navigasyon ergonomisini etkiler; mobil appte esdeger admin panel hizli gecis listesi bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-156
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 otuz birinci dilimde `/admin` audit panelindeki `Aksiyonlanabilir` filtre butonuna sayisal olay sayaci eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin triage gorunurlugunu etkiler; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-157
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 otuz ikinci dilimde admin risk listesine `Aksiyonlanabilir audit kayitlari` sinyali eklendi (`/admin?auditActionable=1`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin risk triage gorunurlugunu etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-158
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 otuz ucuncu dilimde admin risk paneline `Warning/Attention/Info` dagilim ciplari eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin risk okunurlugunu etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-159
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 otuz dorduncu dilimde `/admin` audit liste basligina aktif filtre modu etiketi eklendi (`Mod: Aksiyonlanabilir`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin triage baglam gorunurlugunu etkiler; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-160
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 otuz besinci dilimde admin risk ozet ciplari interaktif filtreye cevrildi (`warning/attention/info` tikla-filtrele).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin risk triage ergonomisini etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-161
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 otuz altinci dilimde risk ozet ciplari ayri bilesene tasindi (`admin-risk-summary-chips.tsx`) ve ana admin feature dosya boyutu azaltildi.
- App Impact (ozet): Yok. Refactor sadece web kod organizasyonunu etkiler; app davranisi/kontrati/copy degismez.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-162
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 otuz yedinci dilimde risk severity filtresi seciliyken tek tikla temizleme aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin filtre kullanilabilirligini etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-163
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 otuz sekizinci dilimde severity temizleme aksiyonu `admin-risk-summary-chips.tsx` bilesenine tasinarak ana dosya satir limiti korunacak sekilde refactor edildi.
- App Impact (ozet): Yok. Refactor sadece web kod organizasyonunu etkiler; app davranisi/kontrati/copy degismez.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-164
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 otuz dokuzuncu dilimde `/admin` audit panelinde `Aksiyonlanabilir` filtre acikken bos durum mesaji baglama duyarlÃ„Â± hale getirildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin triage geri bildirim copy'sini etkiler; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-165
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirkincÃ„Â± dilimde admin risk ozet ciplari sifir sayim durumunda pasiflestirildi (`disabled`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin filtre kullanilabilirligini etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-166
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk birinci dilimde risk chip bileseninde secili severity etiketi gosterildi (`Aktif filtre: ...`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin filtre baglam gorunurlugunu etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-167
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk ikinci dilimde `/admin` risk filtresi query preset parity ile guclendirildi (`riskSeverity=warning|attention|info`) ve local override acikken `URL Presetine Don` aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin risk triage filtre state davranisini etkiler; mobil appte esdeger admin risk paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-168
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 kirk ikinci dilimde dosya sisme limiti icin risk filtre meta blogu `admin-risk-filter-meta.tsx` bilesenine ayristirildi ve `admin-operations-feature.tsx` `509 -> 492` satira indirildi.
- App Impact (ozet): Yok (simdilik). Refactor yalnizca web admin kod organizasyonunu etkiler; app kontrat ve davranisinda degisiklik yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-169
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk ucuncu dilimde `/admin` risk filtre baglamina `Filtre Linki Kopyala` aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin risk triage paylasim aksiyonunu etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-170
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk dorduncu dilimde `/admin` risk paneline `Gorunen risk: X / Y | Mod: ...` ozet satiri eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin risk triage gozlenebilirligini etkiler; mobil appte esdeger admin risk paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-171
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 kirk besinci dilimde `/admin` audit filtre secenekleri (`Event Type`, `Target Type`) operasyonel etiket gosterimine alindi.
- App Impact (ozet): Yok (simdilik). Degisiklik web admin okunurluk/copy seviyesinde; mobil app kontrati, mesaji veya davranisi etkilenmiyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-172
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk altinci dilimde `/admin` audit event/target filtre secenekleri etiket metnine gore siralandi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin filtre ergonomisini etkiler; mobil app tarafinda kontrat/mesaj/davranis degisikligi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-173
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk yedinci dilimde `/admin` audit KPI ozetine `Aksiyonlanabilir` karti ve kart-uzeri filtre gecisi eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin audit triage gorunurlugunu etkiler; mobil appte esdeger admin audit paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-174
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk sekizinci dilimde admin hizli operasyon gecis kartlarina dinamik sayaclar eklendi (`Denied`, `Hata`, `Aksiyonlanabilir`, `Kritik Riskler`).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin triage gorunurlugunu etkiler; mobil appte esdeger admin hizli gecis paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-175
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 kirk dokuzuncu dilimde `/admin` audit satirlarina `Audit ID Kopyala` aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin destek/triage aksiyonunu etkiler; mobil appte esdeger audit satiri paneli bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-176
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 ellinci dilimde `/admin` audit satirlarinda `auditId` gorunurlugu (kisaltilmis gosterim + tam deger tooltip) eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik web admin destek/triage paneli okunurlugunu etkiler; mobil appte esdeger admin audit satir yapisi bulunmuyor.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-177
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 elli birinci dilimde admin hizli operasyon kartlarinda sayaci sifir olan triage kisayollari pasif gorunume cekildi (`aria-disabled`, muted badge, `su an kayit yok` copy).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin triage navigasyon ergonomisini etkiler; mobil appte esdeger admin hizli operasyon kartlari yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-178
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 elli ikinci dilimde `/admin` audit satirlarinda status rozet metinleri operasyonel etiketlere cevrildi (`Basarili`, `Denied`, `Hata`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin okunurlugunu etkiler; mobil app kontrat/mesaj/davranisinda degisiklik yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-179
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 elli ucuncu dilimde admin sag panel blogu `admin-side-panel.tsx` dosyasina ayristirildi ve ana feature dosyasi satir baskisi azaltildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web kod organizasyonunu etkiler; app davranis/kontrat/mesajinda degisiklik yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-180
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 elli dorduncu dilimde `/admin` audit satirlarinda uzun `reason` metinleri kisaltilmis onizleme + tooltip ile gosterildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin audit okunurlugunu etkiler; mobil appte esdeger admin audit satir bileÅŸeni yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-181
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 elli besinci dilimde `/admin` risk filtre copy'si operasyonel Turkce etiketlere standardize edildi (`Kritik`, `Uyari`, `Bilgi`, `Tum seviyeler`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin copy tutarliligini etkiler; mobil app kontrat/davranis/mesajinda degisiklik yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-182
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 elli altinci dilimde `/admin` audit paneline `status=error` baglaminda hata banneringi ve bos liste hata copy'si eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin read-side hata geri bildirimi seviyesinde; mobil app kontrat/davranis/mesajinda degisiklik yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-183
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 elli yedinci dilimde `/admin` audit satirlarina goreli zaman etiketi eklendi (`az once`, `N dk once`, `N saat once`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin audit liste okunurlugunu etkiler; mobil appte esdeger admin audit liste paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

## Process Guardrail (Mandatory)

- After each web slice, answer this question explicitly:
  - `Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?`
- If answer is `evet`:
  - Open a new `W2A-XXX` row.
  - Set `Status` to at least `planned`.
  - Fill `Planlanan App Degisiklikleri` and `Ilgili App Dosyalari`.
- If answer is `hayir`:
  - Still open a new `W2A-XXX` row with `no_action_required` for traceability.

### W2A-184
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 elli sekizinci dilimde `/admin` audit status filtre ciplari sayaci `0` oldugunda pasiflestirildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin filtre ergonomisini etkiler; mobil appte esdeger admin audit filtre paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-185
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 elli dokuzuncu dilimde `/admin` side panel `Veri Durumu` rozet metinleri Turkce operasyon etiketlerine cevrildi (`Hazir`, `Yukleniyor`, `Hata`, `Beklemede`).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin copy seviyesinde; mobil app kontrat/mesaj/davranis degisikligi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-186
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 altmisinci dilimde `/admin` pasif hizli aksiyon kartlarina neden aciklayan tooltip eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin triage geri bildirimi seviyesinde; mobil appte esdeger admin hizli aksiyon karti yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-187
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 altmis birinci dilimde admin audit status filtre ciplari `admin-audit-status-filters.tsx` bilesenine ayristirildi ve ana panel dosya baskisi azaltildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web kod organizasyonunu etkiler; app tarafinda davranis/kontrat/mesaj degisimi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-188
- Status: no_action_required
- Priority: P4
- Kategori: maintainability
- Web Trigger: Faz 3 altmis ikinci dilimde admin audit KPI kartlari `admin-audit-kpi-cards.tsx` bilesenine ayristirildi ve kart-uzeri filtre aksiyonlari netlestirildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin kod organizasyonu + triage ergonomisini etkiler; app tarafinda davranis/kontrat/mesaj degisimi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-189
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 altmis ucuncu dilimde `/admin` audit status filtre ciplari sifir kayitta tooltip ile pasiflik nedenini gosterir hale getirildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin filtre geri bildirimi seviyesinde; mobil appte esdeger admin audit filtre ciplari yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-190
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 altmis dorduncu dilimde `/admin` audit status filtre cipi `Aksiyonlanabilir` sifir kayitta (aktif degilse) pasiflestirildi ve tooltip eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin filtre etkileÅŸimini etkiler; mobil appte esdeger admin audit filtre cipi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-191
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 altmis besinci dilimde `/admin` audit KPI kartlarindaki pasif `Filtrele` butonlarina neden tooltip'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin geri bildirim tutarliligini etkiler; mobil appte esdeger admin audit KPI karti yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-192
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 altmis altinci dilimde `/admin` audit filtre ozetindeki siralama metni teknik koddan operasyonel etikete cevrildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin copy okunurlugunu etkiler; mobil app tarafinda kontrat/mesaj/davranis degisimi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-193
- Status: no_action_required
- Priority: P4
- Kategori: copy
- Web Trigger: Faz 3 altmis yedinci dilimde `/admin` audit filtre ozet satirinda teknik `status/event/target` kodlari operasyonel etiketlere cevrildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin copy/okunurluk katmaninda; mobil appte kontrat/davranis/mesaj degisikligi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-194
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 altmis sekizinci dilimde `/admin` risk cipi aktif filtre bilgisinde adet gosterimi eklendi (`Kritik (N)` vb.).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin risk triage gorunurlugunu etkiler; mobil appte esdeger admin risk cipi paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-195
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 altmis dokuzuncu dilimde `/admin` audit panelde yukleme sirasinda mevcut liste korunup ustte yukleniyor bandi gosterilmeye baslandi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin read-side yenileme UX davranisini etkiler; mobil appte esdeger admin audit paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-196
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmisinci dilimde `/admin` audit satirlarina `Evente Gore Filtrele` ve `Hedefe Gore Filtrele` aksiyonlari eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin triage navigasyonunu etkiler; mobil appte esdeger admin audit satiri filtre aksiyonu yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-197
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmis birinci dilimde `/admin` risk ozet ciplari sifir kayitta neden tooltip'i gosterir hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin filtre geri bildirimi seviyesinde; mobil appte esdeger admin risk cipi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-198
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmis ikinci dilimde `/admin` audit satiri `Evente/Hedefe Gore Filtrele` aksiyonlari tam yonlendirme (`window.location.assign`) ile calisir hale getirildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin filtre-guvenilirlik davranisini etkiler; mobil appte esdeger admin audit satiri filtre aksiyonu yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-199
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmis ucuncu dilimde `/admin` audit satiri event/target filtre aksiyonlari mevcut query baglamini koruyacak sekilde guncellendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin triage filtre davranisini etkiler; mobil appte esdeger admin audit satiri filtre aksiyonu yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-200
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmis dorduncu dilimde `/admin` audit paneline `URL Filtrelerini Temizle` aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin filtre-yasam-dongusu davranisini etkiler; mobil appte esdeger admin audit query-preset paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-201
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmis besinci dilimde /admin risk filtre paneline URL Risk Filtresini Temizle aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin query filtre ergonomisini etkiler; mobil appte esdeger admin risk query paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-202
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmis altinci dilimde admin hizli aksiyon listesindeki /admin query gecisleri tam yonlendirme davranisina cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin query filtre guvenilirligini etkiler; mobil appte esdeger admin hizli aksiyon paneli yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-203
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yetmis yedinci dilimde tenant durum karti ayri bilesene tasindi (admin-tenant-state-panel.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app kontrat/davranis/metin degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-204
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 yetmis sekizinci dilimde risk oncelik listesindeki /admin query hedefli kartlar tam yonlendirme davranisina cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin query filtre guvenilirligini etkiler; mobil appte esdeger admin risk triage query davranisi yok.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-205
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yetmis dokuzuncu dilimde audit panel toolbar bolumu ayri bilesene tasindi (admin-audit-toolbar.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app kontrat/davranis/metin degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.### W2A-206
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 sekseninci dilimde risk oncelik liste render blogu ayri bilesene tasindi (admin-risk-priority-list.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app kontrat/davranis/metin degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-207
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen birinci dilimde /admin audit satirlarina detay ac/kapat aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin audit satiri inceleme UX'ini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-208
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen ikinci dilimde /admin audit detay paneline Ham Kaydi Kopyala aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin destek akisi ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-209
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen ucuncu dilimde /admin audit satirina Kayit Linki Kopyala eklendi ve auditId query ile hedef kayit otomatik acilir hale getirildi.
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin triage paylasim akisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-210
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen dorduncu dilimde /admin risk paneline metin arama eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin risk triage tarama ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-211
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen besinci dilimde /admin risk arama alanina Risk Aramasini Temizle aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin risk triage ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-212
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen altinci dilimde /admin audit toolbar'a Kayit Vurgusunu Kaldir eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin triage ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-213
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen yedinci dilimde /admin risk filtresine riskQ query parity eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin filtre-link davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-214
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen sekizinci dilimde /admin risk filtre meta satirina arama ozeti eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin filtre okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-215
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 seksen dokuzuncu dilimde /admin audit panelde pinli auditId filtre disinda kaldiginda uyari banner'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin triage geri bildirimi seviyesinde; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-216
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksaninci dilimde admin KPI kart grid'i ayri bilesene tasindi (admin-kpi-grid.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-217
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan birinci dilimde audit filtre kontrol blogu ayri bilesene tasindi (admin-audit-filter-controls.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-218
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan ikinci dilimde operasyon durum karti ayri bilesene tasindi (admin-operations-status-card.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-219
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan ucuncu dilimde audit panel pinli kayit uyari blogu ayri bilesene tasindi (admin-audit-pinned-warning.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-220
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan dorduncu dilimde risk arama kontrol blogu ayri bilesene tasindi (admin-risk-search-control.tsx).
- App Impact (ozet): Yok (simdilik). Bu degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-221
- Status: no_action_required
- Priority: P4
- Kategori: ux
- Web Trigger: Faz 3 doksan besinci dilimde /admin audit filtre arama alanina Aramayi Temizle aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin filtre UX'ini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-222
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan altinci dilimde `/routes` feature dosyasi parcali hale getirildi (`routes-workspace-pane.tsx`, `use-routes-query-guards.ts`) ve ana dosya satir baskisi azaltildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde ic bilesen/hook ayristirmasi; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.



### W2A-223
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan yedinci dilimde `/admin` audit liste render/empty-state blogu `admin-audit-list-section.tsx` bilesenine tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin ic render/refactor kapsaminda; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-224
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan sekizinci dilimde `/admin` risk bolumu `admin-risk-section.tsx` bilesenine tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin ic bilesen ayrismasi/refactor kapsaminda; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-225
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 doksan dokuzuncu dilimde `/admin` audit toolbar aksiyon/state blogu `use-admin-audit-toolbar-state.ts` hook'una tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin ic hook ayristirmasi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-226
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuzuncu dilimde `/drivers` feature dosyasinda workspace ve query-guard bloglari ayristirildi (`drivers-workspace-pane.tsx`, `use-drivers-query-guards.ts`).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde ic bilesen/hook ayrismasi; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-227
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz birinci dilimde `/routes` feature filtre state/handler blogu `use-routes-filter-state.ts` hook'una tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel ic state yonetimi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-228
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz ikinci dilimde `/admin` risk durum/filtre/turetim blogu `use-admin-risk-priority-state.ts` hook'una tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin ic state/hesaplama refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-229
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz ucuncu dilimde `/vehicles` feature dosyasi workspace/query guard/filter state bloglari ayristirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde ic bilesen/hook ayrismasi; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-230
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz dorduncu dilimde `/drivers` feature filtre state/handler blogu `use-drivers-filter-state.ts` hook'una tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel ic state yonetimi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-231
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz besinci dilimde `/mode-select` company mode render blogu `mode-select-company-panel.tsx` bilesenine tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web mode-select ic render ayrismasi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-232
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz altinci dilimde company callable hata-mesaj haritasi `company-callable-error-messages.ts` dosyasina tasindi ve `company-callables.ts` icinden re-export edildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web callable client hata-map katmani refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-233
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz yedinci dilimde /admin audit panelindeki URL preset/local-override filtre state blogu use-admin-audit-filter-state.ts hook'una tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin ic state yonetimi/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-234
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz sekizinci dilimde /routes feature turetim/paging/selection hesaplari use-routes-derived-view.ts hook'una tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel ic turetim/state refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-235
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz dokuzuncu dilimde /routes yan panelde canli operasyon/aktif sefer/gorunum linki kartlari 
outes-side-panel-live-ops-section.tsx bilesenine tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel ic render/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-236
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz onuncu dilimde dashboard KPI grid blogu dashboard-kpi-grid.tsx bilesenine tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web dashboard ic render/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-237
- Status: no_action_required
- Priority: P4
- Kategori: refactor
- Web Trigger: Faz 3 yuz on birinci dilimde company callable katmani route/vehicle modullerine ayrildi (company-route-callables.ts, company-vehicle-callables.ts) ve company-callables.ts facade katmanina cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web callable istemci dosya organizasyonu/refactor kapsami; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-238
- Status: web_done_app_pending
- Priority: P2
- Kategori: live_ops
- Web Trigger: Faz 4 birinci dilimde `/live-ops` harita shell'i gercek Mapbox canvas'a baglandi (`live-ops-mapbox-canvas.tsx`) ve secili seferde RTDB effective koordinat onceleme aktif edildi.
- App Impact (ozet): Kisa vadede zorunlu kontrat degisikligi yok. Ancak web harita semantigi (online/stale, stream fallback) ile app ekran copy/state parity'si pilot oncesi hizalanmali.
- Planlanan App Degisiklikleri:
  - app live tracking ekraninda stream/fallback durum metinlerini web ile ayni semantikte gozden gecir
  - eger app harita provider'i farkli ise pilot notlarina "provider farkindan dogan geometri/etiket farki" risk copy'si ekle
  - cutover oncesi web-app canli konum smoke testi checklist'ine map parity satiri ekle
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md, plan/16_master_phase_plan_detailed.md
- Ilgili App Dosyalari: future live tracking/passenger map screens (parity review)
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: simdilik kontrat degismiyor; UX parity takip gerektiriyor.


### W2A-239
- Status: web_done_app_pending
- Priority: P3
- Kategori: live_ops
- Web Trigger: Faz 4 ikinci dilimde `/live-ops` haritasina secili rota durak overlay'i eklendi (durak markerlari + stop-path cizgisi).
- App Impact (ozet): Kontrat degisikligi yok. Ancak app live map ekraninda secili rota duraklarini gosterme beklentisi parity backlog'una alinmali.
- Planlanan App Degisiklikleri:
  - app live map ekraninda secili rota icin durak marker/rota cizgisi parity degerlendirmesi
  - app tarafinda map okunurluk copy'sini web ile semantik hizalama (durak sirasi, rota baglami)
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: future passenger/driver live map overlays
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: kontrat degismiyor; UX parity takip gerektiriyor.
### W2A-240
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 ucuncu dilimde live-ops Mapbox marker katmani performans limiti eklendi (`MAX_MAP_MARKERS=200`) ve limit asiminda bilgilendirme copy'si gosterildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web harita render performansina yoneliktir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-241
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 dorduncu dilimde live-ops map UX iyilestirmesi yapildi (`Haritaya Sigdir` aksiyonu, harita legend'i, split-view durak sayisi etiketi).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel map ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-242
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 besinci dilimde live-ops map'te secili sefer takip modu eklendi (`Secili Takip: Acik/Kapali`) ve tercih local key ile kalici hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web harita kamera davranisi/ergonomisi ile ilgilidir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-243
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altinci dilimde live-ops map'te durak overlay ac/kapat kontrolu eklendi ve tercih local key ile saklandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web harita gorunum ergonomisine yoneliktir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-244
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yedinci dilimde split-view ust durum ciplari konum kaynagi semantigiyle genisletildi (`RTDB Stream/RTDB/Trip Doc`, stale varyantlari).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel copy/okunurluk ergonomisine yoneliktir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-245
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 sekizinci dilimde live-ops map geometri cizgisi iyilestirildi (smoother stop-path) ve secili sefer canli konumundan ilk duraga ayri baglanti cizgisi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web harita okunurlugu ve dispatcher karar hizini iyilestiren gorsel semantik katmanidir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-246
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 dokuzuncu dilimde live-ops haritasina stil secici eklendi (`Light/Streets/Navigation`) ve tercih local olarak saklandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel map gorsel ergonomisine yoneliktir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-247
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 onuncu dilimde live-ops secili sefer detay paneline dispatch hazir mesaj aksiyonlari eklendi (`Kopyala` + `WhatsApp`).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web dispatch operasyon hizina yoneliktir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-248
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on birinci dilimde live-ops detay paneline sefer bazli dispatch aksiyon gecmisi eklendi (`Son Dispatch Aksiyonlari`).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde local operasyon izlenebilirligi saglar; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-249
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on ikinci dilimde live-ops dispatch gecmis paneline `Gecmisi Temizle` aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel local dispatch gecmis ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-250
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on ucuncu dilimde live-ops detay paneline operasyon icgorusu karti eklendi (risk tonu, yakin durak, mesafe, sefer suresi).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde karar destek gorunurlugunu artirir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-251
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on dorduncu dilimde live-ops detay paneline `Destek Paketini Kopyala` aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde destek triage metni uretimini hizlandirir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.
### W2A-252
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on besinci dilimde dispatch gecmis temizleme aksiyonu sefer bazli modele cekildi (`Bu Seferi Temizle`).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel local gecmis davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?" Cevap: hayir.

### W2A-253
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on altinci dilimde live-ops secili sefer detayina risk/stream odakli Operasyon Playbook karti eklendi (onerilen aksiyonlar: destek paketi, sefer linki, route editor, WhatsApp hazir mesaj).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel operasyon triage ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-254
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on yedinci dilimde live-ops dispatch gecmis paneline sefer bazli Gecmisi Kopyala aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel dispatch operasyon devrini hizlandirir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-255
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on sekizinci dilimde live-ops aktif sefer listesine Risk Oncelik Kuyrugu eklendi (kritik/uyari sefer top-liste + en riskliyi sec).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde operasyon odaklama UX'ini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-256
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 on dokuzuncu dilimde live-ops risk oncelik kuyruguna Kritikleri Kopyala ve Uyarilari Kopyala aksiyonlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel operasyon devir/paylasim UX'ini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-257
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirminci dilimde live-ops risk oncelik kuyrugu uzerinden kritik/uyari odak filtre aksiyonlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde liste odaklama UX'ini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-258
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi birinci dilimde live-ops risk kuyrugu kartina Risk Linklerini Kopyala aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde operasyon koordinasyon/paylasim UX'ini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-259
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi ikinci dilimde live-ops risk odagi (riskTone) query parity ile paylasilabilir hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre/deep-link tutarliligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-260
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi ucuncu dilimde risk odak aksiyonlari (Kritige/Uyariya Odaklan) ilgili risk grubunda ilk seferi otomatik sececek sekilde guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel triage gecis hizini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-261
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi dorduncu dilimde Filtreleri Sifirla aksiyonu riskTone odagini da temizleyecek sekilde duzeltildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel filtre reset davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-262
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi besinci dilimde risk kuyrugu kartina kritik/uyari bazli toplu dispatch mesaj kopyalama aksiyonlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde operasyon mesaj devri UX'ini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-263
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi altinci dilimde live-ops aktif sefer satirlarina risk rozeti ve risk nedeni metni eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-264
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi yedinci dilimde live-ops harita markerlarina risk tonu semantigi (Kritik/Uyari) eklendi ve legend genisletildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde harita gorsel semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-265
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi sekizinci dilimde live-ops toolbar bolumune aktif risk odagi banner'i ve Risk Odagini Temizle aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-266
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yirmi dokuzuncu dilimde live-ops harita marker tooltip metnine risk ozeti (tone + reason) eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde harita hover bilgi metnini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-267
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuzuncu dilimde live-ops risk odagi harita marker gorunumuyle senkronize edildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde liste-harita filtre tutarliligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-268
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz birinci dilimde live-ops risk kuyrugu kartina kritik/uyari bazli toplu WhatsApp aksiyonlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde dispatch devir ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-269
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz ikinci dilimde live-ops harita split-view ust ciplara marker hacmi (Marker/Canli/Stale) eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde harita veri baglam gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-270
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz ucuncu dilimde risk odagi aktifken secili seferin haritada baglam icin tutuldugunu belirten UI cipi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde durum semantigi copy'sini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-271
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz dorduncu dilimde live-ops risk kuyrugu kartina sinyal gecikme metrikleri (en eski/ortalama) eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk metrik gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-272
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz besinci dilimde live-ops harita legend paneline ac/kapat kontrolu eklendi ve tercih localde saklandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde harita ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-273
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz altinci dilimde live-ops toolbar metriklerine risk yogunlugu (Riskli/Kritik/Uyari) eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde operasyon metrik okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-274
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz yedinci dilimde live-ops toolbar'a Kritik Odak ve Uyari Odak hizli filtre butonlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre erisilebilirligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-275
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz sekizinci dilimde live-ops liste siralama seceneklerine Risk Onceligi (risk_desc) eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde liste siralama davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-276
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 otuz dokuzuncu dilimde live-ops risk kuyrugu kartina risk siralama toggle aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde liste siralama etkilesimini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-277
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirkinci dilimde live-ops harita paneline risk odagi altinda gizlenen sefer sayaci eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre semantigi gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-278
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk birinci dilimde risk odagi secimiyle liste siralamasi otomatik risk_desc moduna cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre-siralama akisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-279
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk ikinci dilimde live-ops risk kuyrugu kartina Onceki Risk / Sonraki Risk gezinme aksiyonlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk kayitlari arasi gezinme akisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-280
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk ucuncu dilimde live-ops risk kuyrugu kartina Alt+Yukari / Alt+Asagi klavye gezinme destegi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk kayitlari arasi klavye gecisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-281
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk dorduncu dilimde live-ops risk kuyrugu kartina secili risk konum gostergesi eklendi (Secili risk: x/y).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk gezinti konum gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-282
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk besinci dilimde live-ops risk kuyrugunda Esc ile risk odagini temizleme kisayolu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye odakli filtre temizleme akislarini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-283
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk altinci dilimde live-ops risk kuyrugunda Alt+R ile risk siralama toggle kisayolu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye odakli siralama akisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-284
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk yedinci dilimde live-ops risk kuyruguna kalici klavye kisayol rehberi satiri eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde kisayol kesfedilebilirligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-285
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk sekizinci dilimde live-ops listede risk odagi bos sonuc durumuna inline temizleme butonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre cikis ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-286
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 kirk dokuzuncu dilimde live-ops harita paneline risk odagi aktifken inline temizleme butonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre cikis ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-287
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 ellinci dilimde live-ops risk kuyruguna Alt+C (kritik) ve Alt+W (uyari) odak kisayollari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye odakli risk filtre akislarini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-288
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli birinci dilimde live-ops harita paneline kritik/uyari risk sayac ciplari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde harita metrik gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-289
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli ikinci dilimde live-ops toolbar risk odagi banner'ina dinamik kayit adedi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk odagi gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-290
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli ucuncu dilimde live-ops secili sefer dispatch gecmis bolumune kayit adedi eklendi ve liste turetimi tek noktaya indirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde dispatch gecmis okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-291
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli dorduncu dilimde live-ops secili sefer dispatch gecmis kartina son aksiyon zamani eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde dispatch gecmis semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-292
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli besinci dilimde live-ops risk kuyrugunda En Riskliyi Ac aksiyonuna risk nedeni ozeti eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde triage secim baglamini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-293
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli altinci dilimde live-ops risk kuyrugu satirlarina oncelik sira etiketleri eklendi (#1, #2, ...).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk sirasi gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-294
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli yedinci dilimde live-ops toolbar risk odagi satirina odakta gorunen kayit adedi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre kapsami gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-295
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli sekizinci dilimde live-ops risk kuyruguna Top N / Toplam risk gorunurlugu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk kuyrugu hacim semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-296
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 elli dokuzuncu dilimde live-ops harita paneline secili sefer risk cipi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde secili sefer risk gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-297
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmisinci dilimde live-ops secili sefer dispatch gecmis kartina +N daha gostergesi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde dispatch gecmis hacim gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-298
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis birinci dilimde live-ops risk kuyruguna Tum Riskleri Kopyala aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk ozet disa aktarim ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-299
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis ikinci dilimde live-ops risk odagi bos liste mesajina toplam risk adedi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde bos durum semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-300
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis ucuncu dilimde live-ops risk kuyruguna Top 4 / Top 8 gorunum toggle'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk kuyrugu gorunum derinligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-301
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis dorduncu dilimde live-ops harita paneline risk yogunlugu (%) metrik cipi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde harita risk metrik gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-302
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis besinci dilimde live-ops risk kuyruguna Risk Linklerini WhatsApp Ac aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk link devir ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-303
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis altinci dilimde live-ops harita paneline secili sefer son sinyal cipi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde secili sefer tazelik gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-304
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis yedinci dilimde live-ops risk kuyruguna Alt+K (Tum Riskleri Kopyala) kisayolu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye odakli risk ozet aktarimini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-305
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis sekizinci dilimde live-ops harita risk yogunlugu cipi esik-bazli renk semantigiyle guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk metrik okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-306
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 altmis dokuzuncu dilimde live-ops risk odak butonlari adet + disabled semantigiyle guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde odak aksiyon ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-307
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmisinci dilimde live-ops risk yogunlugu cipi seviye etiketiyle (Dusuk/Orta/Yuksek) guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde map risk metrik semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-308
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis birinci dilimde risk odagi aktifken Alt+Yukari/Asagi gezinme secili tone kuyruguyla sinirlandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye triage davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-309
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis ikinci dilimde risk kuyrugu secili-risk satiri gezinme kapsami etiketiyle (Tum riskler/Kritik odak/Uyari odak) guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye gezinme semantigini daha gorunur kilar; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-310
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis ucuncu dilimde risk kuyrugunda Risk Linklerini WhatsApp Ac aksiyonu Alt+M kisayoluyla tetiklenebilir hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye odakli devir ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-311
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis dorduncu dilimde risk kuyrugu Top 4/Top 8 limiti kalici preference olarak saklandi ve Alt+Q kisayolu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk kuyrugu ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-312
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis besinci dilimde risk kuyrugunda En Riskliyi Ac aksiyonu Alt+E kisayoluyla tetiklenebilir hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye triage ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-313
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis altinci dilimde risk kuyrugu limit tercihi query-state parity ile (
iskLimit) paylasilabilir hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde deep-link/state ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-314
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis yedinci dilimde risk kuyrugu deep-link payload'i aktif sort ve 
iskLimit bilgisini tasiyacak sekilde guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde paylasim link state parity'sini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-315
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis sekizinci dilimde 
iskLimit query parami icin self-heal/normalize korumasi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde URL-state dayanÄ±kliligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-316
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yetmis dokuzuncu dilimde live-ops toolbar metriklerine risk kuyrugu limiti eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde gorunurluk katmanini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-317
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 sekseninci dilimde risk kuyrugu tone-scoped Top N semantigiyle guclendirildi ve toplu aksiyonlar toplam risk setine hizalandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk triage semantigini iyilestirir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-318
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen birinci dilimde risk kuyrugu bos-state paneline Odagi Temizle aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde filtre cikis ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-319
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen ikinci dilimde risk kuyrugunda secili-risk etiketi scope-bazli hale getirildi ve gorunum disi secili kayit icin Top 8 genisletme aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde triage okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-320
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen ucuncu dilimde live-ops query self-heal kapsami sort/riskTone/hideStale/riskLimit parametrelerini dogrulayacak sekilde genisletildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde URL-state dayanikliligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-321
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen dorduncu dilimde gorunum disi secili-riski Top 8'e getiren aksiyon Alt+G kisayoluyla desteklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye triage ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-322
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen besinci dilimde gorunum disi secili risk icin Ilk gorunen riske git aksiyonu ve Alt+J kisayolu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde triage navigasyonunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-323
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen altinci dilimde risk kuyrugu metrikleri ve Top N toggle kosulu odak kapsam semantigiyle guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk metrik okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-324
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen yedinci dilimde Tum Riskleri Kopyala (Alt+K) aksiyonu Top N degil kapsam tumunu kopyalayacak sekilde guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde devir/raporlama metin kapsamini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-325
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen sekizinci dilimde live-ops risk kuyruguna Secili Riski Kopyala aksiyonu ve Alt+P kisayolu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde secili-risk devir ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-326
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 seksen dokuzuncu dilimde live-ops risk kuyruguna Secili Riski WhatsApp Ac aksiyonu ve Alt+O kisayolu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde secili-risk devir kanalini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-327
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksaninci dilimde live-ops bos-state mesaji stale-gizlenen risk adedini gosterir hale getirildi ve Stale Gorunurlugunu Ac aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde triage aciklayiciligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-328
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan birinci dilimde live-ops toolbar risk odagi banner'ina stale-gizlenen sayaci ve Stale Gorunurlugunu Ac aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk odagi okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-329
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan ikinci dilimde live-ops toolbar'a Risk Kuyrugu: Top 4/Top 8 hizli gecis aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde triage hiz ayarini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-330
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan ucuncu dilimde live-ops harita paneline kritik/uyari odak butonlari eklendi ve risk disi gizlenen metrine oran bilgisi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde map-first triage ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-331
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan dorduncu dilimde live-ops harita paneline stale-gizlenen risk sayaci ve Stale Gorunurlugunu Ac aksiyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde map triage filtre cikisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-332
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan besinci dilimde stale-gizlenen risk sayaclari kritik/uyari olarak ayrildi ve harita risk odagi buton sayac/disable semantigi bu toplamlara hizalandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk odagi aksiyon semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-333
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan altinci dilimde harita paneline odakta gorunen kayit yokken stale-gizli risk uyari satiri eklendi ve ayni satira Stale Gorunurlugunu Ac aksiyonu tanimlandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde odak/filtre geri bildirimi ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-334
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan yedinci dilimde live-ops harita paneline Odak Toplami metriÄŸi eklendi ve hideStale acikken gorunen/stale-gizli dagilimi ayni cipe baglandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk odagi okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-335
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan sekizinci dilimde live-ops stale gorunurluk toggle aksiyonu Alt+H kisayoluyla desteklendi ve toolbar etiketleri bu kisayola hizalandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye operasyon hizini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-337
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 doksan dokuzuncu dilimde live-ops risk kuyruguna stale gorunurluk toggle butonu eklendi ve kisayol rehberi Alt+H ile guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde risk kuyrugu icinden filtre gecisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-338
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuzuncu dilimde risk kuyrugu Odagi Temizle kisayolu Esc (Alt'siz) olacak sekilde duzeltildi ve contentEditable alanlar kisayol kapsami disina alindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye etkilesim semantigini duzeltir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-339
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuz birinci dilimde risk kuyrugu deep-link uretilerine hideStale query state'i eklendi (kopya/WhatsApp).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde paylasilan linkin gorunum parity'sini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-340
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuz ikinci dilimde risk link kopya/WhatsApp payload'ina kapsam metrikleri eklendi (kopyalanan-kapsam-genel toplam).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde operasyon paylasim metninin acikligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-341
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuz ucuncu dilimde risk link kopyalama akisina bos kuyruk guard'i eklendi ve buton disabled semantigi duzeltildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde aksiyon guvenligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-342
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuz dorduncu dilimde Risk Linklerini WhatsApp Ac aksiyonu bos kuyrukta disabled semantige cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde bos-state aksiyon guvenligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-343
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuz besinci dilimde Tum Riskleri Kopyala aksiyonuna bos kapsam guard'i eklendi ve buton disabled semantige cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde bos-state aksiyon tutarliligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-344
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuz altinci dilimde risk panelinde Esc akisina copy/status mesaji kapatma adimi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde klavye etkilesimini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-345
- Status: no_action_required
- Priority: P4
- Kategori: live_ops
- Web Trigger: Faz 4 yuz yedinci dilimde route/durak conflict guard hata mesajlari sertlestirildi ve conflict sinifinda otomatik liste yenileme eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde hata geri bildirimi ve refresh davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-346
- Status: no_action_required
- Priority: P4
- Kategori: route_scheduling
- Web Trigger: Faz 4 yuz sekizinci dilimde route create/update formlarinda HH:MM saat format guard'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde form on-dogrulama davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-347
- Status: no_action_required
- Priority: P4
- Kategori: route_scheduling
- Web Trigger: Faz 4 yuz dokuzuncu dilimde route create/update ekranlarina anlik HH:MM validation geri bildirimi ve update submit guard'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde form UX/validation davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-348
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz onuncu dilimde route stops formunda order/lat/lng alanlari icin anlik validation geri bildirimi ve submit guard eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde form UX/validation davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-349
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz on birinci dilimde durak koordinat parse semantigi virgullu TR girisle uyumlu hale getirildi ve duplicate sira numarasi form seviyesinde engellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde form dogrulama/normalizasyon davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-350
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz on ikinci dilimde route create koordinat alanlari icin aralik dogrulamasi ve virgullu TR giris normalizasyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde route-create form validation semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-351
- Status: no_action_required
- Priority: P4
- Kategori: vehicle_operations
- Web Trigger: Faz 4 yuz on ucuncu dilimde vehicle create/update formlarinda plaka-yil-kapasite icin ortak validation semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde vehicle form validation/normalizasyon davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-352
- Status: no_action_required
- Priority: P4
- Kategori: vehicle_operations
- Web Trigger: Faz 4 yuz on dorduncu dilimde vehicle create/update formlarinda plaka blur-normalization semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde plate input normalizasyon davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-353
- Status: no_action_required
- Priority: P4
- Kategori: data_validation
- Web Trigger: Faz 4 yuz on besinci dilimde route-create koordinat parser strictlestirildi ve vehicle integer parser kismi-parse acigina karsi sertlestirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde input-validation semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-354
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz on altinci dilimde route-stop koordinat parser strictlestirildi ve bos degerin 0 parse edilme acigi kapatildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde stop form validation semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-355
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz on yedinci dilimde route-stop order validation integer-zorunlu semantige cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde form validation davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-356
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz on sekizinci dilimde route-create ve route-stop koordinat alanlarina blur-normalization semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde input ergonomisi/normalizasyon davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-357
- Status: no_action_required
- Priority: P4
- Kategori: vehicle_operations
- Web Trigger: Faz 4 yuz on dokuzuncu dilimde vehicle year/capacity alanlarina blur-normalization ve step/min/max sinirlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde vehicle numeric input ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-358
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz yirminci dilimde route-stop order blur-normalization ve conflict guard sertlestirmesi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde stop-order form davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-359
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz yirmi birinci dilimde route-create ve route-stop koordinat inputlarina inputMode=decimal eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde input ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-360
- Status: no_action_required
- Priority: P4
- Kategori: ux_accessibility
- Web Trigger: Faz 4 yuz yirmi ikinci dilimde route/stop ve vehicle formlarinda invalid alanlara aria-invalid semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde erisilebilirlik semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-361
- Status: no_action_required
- Priority: P4
- Kategori: form_data_hygiene
- Web Trigger: Faz 4 yuz yirmi ucuncu dilimde route/stop/vehicle metin alanlarina blur-trim normalizasyonu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde text input hygiene davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-362
- Status: no_action_required
- Priority: P4
- Kategori: route_stop_operations
- Web Trigger: Faz 4 yuz yirmi dorduncu dilimde route-stop order onChange davranisi bos giriste 0a dusmeyecek sekilde duzeltildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde stop-order input davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-363
- Status: no_action_required
- Priority: P4
- Kategori: route_scheduling
- Web Trigger: Faz 4 yuz yirmi besinci dilimde route-update formuna blur-trim + inline name validation + time aria-invalid semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde route-update form UX/erisilebilirlik davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-364
- Status: no_action_required
- Priority: P4
- Kategori: form_submission_semantics
- Web Trigger: Faz 4 yuz yirmi altinci dilimde route-update ve vehicle-update formlarinda hasChanges guardi submit seviyesine alindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde no-op submit davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-365
- Status: no_action_required
- Priority: P4
- Kategori: form_data_hygiene
- Web Trigger: Faz 4 yuz yirmi yedinci dilimde text input normalizasyonu ortak helper uzerine toplandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde form hygiene uygulama detayini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-366
- Status: no_action_required
- Priority: P4
- Kategori: ux_accessibility
- Web Trigger: Faz 4 yuz yirmi sekizinci dilimde form feedback kutularina role=alert / aria-live=polite semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde erisilebilirlik semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-367
- Status: no_action_required
- Priority: P4
- Kategori: driver_member_management
- Web Trigger: Faz 4 yuz yirmi dokuzuncu dilimde drivers-member invite/management formlarina e-posta blur-normalization, stricter email guard ve feedback semantics eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde company member davet/yetki yonetimi form davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-368
- Status: no_action_required
- Priority: P4
- Kategori: driver_member_management
- Web Trigger: Faz 4 yuz otuzuncu dilimde drivers-member invite formunda invalid e-posta state'i alan seviyesi semantikle guclendirildi (kirmizi border + odak rengi).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde invite formu gorsel validasyon semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-369
- Status: no_action_required
- Priority: P4
- Kategori: driver_member_management
- Web Trigger: Faz 4 yuz otuz birinci dilimde drivers-member management kartina degisiklik-yok guard mesaji ve aria-live=polite bilgi kutusu eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde role/durum guncelleme UX semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-370
- Status: no_action_required
- Priority: P4
- Kategori: ux_accessibility
- Web Trigger: Faz 4 yuz otuz ikinci dilimde drivers side panelde Gorunum Linki geri bildirimi aria-live/role semantiklerine alindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde copy-link status mesajlarinin erisilebilirlik davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-371
- Status: no_action_required
- Priority: P4
- Kategori: driver_member_management
- Web Trigger: Faz 4 yuz otuz ucuncu dilimde drivers-member invite/management kartlarinda disabled butonlar icin title tabanli neden semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde pasif aksiyon geri bildirimi ergonomisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-372
- Status: no_action_required
- Priority: P4
- Kategori: driver_member_management
- Web Trigger: Faz 4 yuz otuz dorduncu dilimde drivers liste filtrelerinde aria-pressed/aria-label semantikleri ve no-op filtre reset guard'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde drivers filtre ergonomisi/erisilebilirligi tarafindadir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-373
- Status: no_action_required
- Priority: P4
- Kategori: drivers_query_performance
- Web Trigger: Faz 4 yuz otuz besinci dilimde drivers query sync akisina no-op `router.replace` guard'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde URL query sync performans davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-374
- Status: no_action_required
- Priority: P4
- Kategori: query_performance
- Web Trigger: Faz 4 yuz otuz altinci dilimde routes ve vehicles feature query sync akislari no-op `router.replace` guard'i ile guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde query-sync performans davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-375
- Status: no_action_required
- Priority: P4
- Kategori: ux_accessibility
- Web Trigger: Faz 4 yuz otuz yedinci dilimde routes/vehicles liste filtreleri icin aria semantikleri ve no-op reset guard'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde liste filtre erisilebilirligi ve UX davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-376
- Status: no_action_required
- Priority: P4
- Kategori: live_ops_query_performance
- Web Trigger: Faz 4 yuz otuz sekizinci dilimde live-ops query sync katmanina no-op `router.replace` guard'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde live-ops URL sync performans davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-377
- Status: no_action_required
- Priority: P4
- Kategori: driver_member_management
- Web Trigger: Faz 4 yuz otuz dokuzuncu dilimde drivers side panelde placeholder yerine gercek Driver Ops Snapshot karti acildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde drivers detay okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-378
- Status: no_action_required
- Priority: P4
- Kategori: operations_sidepanel
- Web Trigger: Faz 4 yuz kirkinci dilimde vehicles/routes side panel placeholderlari yerine gercek snapshot kartlari acildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde side-panel bilgi mimarisi/okunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-379
- Status: no_action_required
- Priority: P4
- Kategori: ux_accessibility
- Web Trigger: Faz 4 yuz kirk birinci dilimde vehicles/routes side panel Gorunum Linki geri bildirimleri aria-live/role semantiklerine alindi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde copy-link status mesajlarinin erisilebilirlik davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-380
- Status: no_action_required
- Priority: P4
- Kategori: release_policy
- Web Trigger: Faz 4 yuz kirk ikinci dilimde zorunlu Vercel deploy-budget policy aktive edildi ve release runbook ile baglandi.
- App Impact (ozet): Yok (simdilik). Degisiklik kod/kontrat degil, release operasyon politikasidir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/79_vercel_deploy_budget_policy.md, plan/33_release_and_pilot_runbook_web.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.
### W2A-381
- Status: no_action_required
- Priority: P4
- Kategori: live_ops_ux
- Web Trigger: Faz 4 yuz kirk ucuncu dilimde live-ops harita paneline "aktif sefer yok" empty-state ve filtre temizleme aksiyonlari eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panelde harita empty-state UX davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/75_phase2_closeout_and_phase3_entry.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-382
- Status: no_action_required
- Priority: P4
- Kategori: auth_copy
- Web Trigger: Faz 4 yuz kirk dorduncu dilimde login sayfasi copy'si placeholder dilinden operasyonel dile cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web login sayfasi bilgilendirme copy'sini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-383
- Status: no_action_required
- Priority: P4
- Kategori: marketing_copy
- Web Trigger: Faz 4 yuz kirk yedinci dilimde marketing ana sayfa kopyalari placeholder dilinden erken erisim diline cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web landing kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-384
- Status: no_action_required
- Priority: P4
- Kategori: auth_copy
- Web Trigger: Faz 4 yuz kirk sekizinci dilimde firebase client bootstrap probe kopyasi placeholder dilden dogrulama diline cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web login saglik kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-385
- Status: no_action_required
- Priority: P4
- Kategori: ux_copy
- Web Trigger: Faz 4 yuz kirk dokuzuncu dilimde live-ops placeholder bilesenindeki etiketler "ornek" diline cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web placeholder etiketlerini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-386
- Status: no_action_required
- Priority: P4
- Kategori: ux_copy
- Web Trigger: Faz 4 yuz elli birinci dilimde dashboard list placeholder toolbar/alt satir copy'si "ornek" diline cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web placeholder kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-387
- Status: no_action_required
- Priority: P4
- Kategori: ux_copy
- Web Trigger: Faz 4 yuz elli ikinci dilimde mode tercihinde "placeholder" ibaresi kaldirildi (etiketler sadeletildi).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel mode label kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-388
- Status: no_action_required
- Priority: P4
- Kategori: marketing_copy
- Web Trigger: Faz 4 yuz elli ucuncu dilimde iletisim sayfasi copy'si daha net operasyonel dile cekildi (faz referanslari kaldirildi).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web landing copy'sini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-389
- Status: no_action_required
- Priority: P4
- Kategori: marketing_copy
- Web Trigger: Faz 4 yuz elli dorduncu dilimde gizlilik/KVKK metinlerindeki "placeholder" ibareleri "taslak" diliyle degistirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web landing copy'sini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-390
- Status: no_action_required
- Priority: P4
- Kategori: ux_copy
- Web Trigger: Faz 4 yuz elli besinci dilimde dashboard feature placeholder notlari ve hizli gecis basligi operasyonel dile hizalandi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web placeholder kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-391
- Status: no_action_required
- Priority: P4
- Kategori: marketing_copy
- Web Trigger: Faz 4 yuz elli dokuzuncu dilimde marketing content sayfasi "erken erisim notu" kopyasi guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web marketing bilgi sayfasi kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-392
- Status: no_action_required
- Priority: P4
- Kategori: marketing_copy
- Web Trigger: Faz 4 yuz altmisinci dilimde gizlilik/KVKK metinleri erken erisim diline cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web marketing kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-393
- Status: no_action_required
- Priority: P4
- Kategori: ux_copy
- Web Trigger: Faz 4 yuz altmis birinci dilimde dashboard feature placeholder hizli gecis etiketi "Canli Ops" olarak turkcelestirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-394
- Status: no_action_required
- Priority: P4
- Kategori: live_ops_accessibility
- Web Trigger: Faz 4 yuz altmis ucuncu dilimde live-ops toolbar aksiyonlarina aria-pressed/aria-label semantigi eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web panel erisilebilirlik semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-395
- Status: no_action_required
- Priority: P4
- Kategori: marketing_copy
- Web Trigger: Faz 4 yuz altmis dorduncu dilimde marketing bilgi sayfasi ust aksiyon etiketi "Panel Girisi" olarak netlestirildi.
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web marketing header kopyasini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Vercel deploy limiti nedeniyle bu dilim local build-dogrulama ile kayda gecmistir.
### W2A-396
- Status: no_action_required
- Priority: P3
- Kategori: admin_ui_maintainability
- Web Trigger: Faz 5 seksen alti-seksen dokuz dilimlerinde admin tarih/saat etiketleri ortak helper'a tasindi ve web build tip blokajlari kapatildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web admin UI formatlama/tip guvenligi ile sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run build` (web) yesil, lint backlog'u ayri teknik borc olarak duruyor.
### W2A-397
- Status: no_action_required
- Priority: P3
- Kategori: web_lint_quality_gate
- Web Trigger: Faz 5 doksan-doksan uc dilimlerinde admin kartlarinda lazy bootstrap refactoru ve dashboard hook purity/lint temizligi tamamlandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web state bootstrap, lint uyumu ve panel copy semantigiyle sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) birlikte yesile cekildi.
### W2A-398
- Status: no_action_required
- Priority: P3
- Kategori: admin_panel_sync_ux
- Web Trigger: Faz 5 doksan dorduncu-doksan yedinci dilimlerinde Faz 5 admin checklist kartlari icin event tabanli localStorage senkronu eklendi (summary + risk chips otomatik tazeleme).
- App Impact (ozet): Yok (simdilik). Degisiklik yalnizca web admin panel state senkron davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-399
- Status: no_action_required
- Priority: P3
- Kategori: admin_checklist_data_consistency
- Web Trigger: Faz 5 doksan sekiz-yuz bir dilimlerinde admin checklist storage semantigi ortak helper ile birlestirildi; security/secret kartlari `updatedAt` alanina cekildi ve summary/risk sayimlari uniform parser'a baglandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web admin local state tutarliligi ve panel gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) birlikte yesil.
### W2A-400
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_readiness_visibility
- Web Trigger: Faz 5 yuz ikinci-yuz bes dilimlerinde checklist helper extras destegi eklendi; smoke checklist ortak storage contract'a tasindi; risk chip + Faz 5 ozet kartinda readiness blokaj gorunurlugu guclendirildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web admin panel localStorage semantigi ve operasyonel readiness gorunurlugu ile sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-401
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_state_unification
- Web Trigger: Faz 5 yuz alti-yuz dokuz dilimlerinde readiness toplam/hesap semantigi helper+hook altinda birlestirildi; Faz 5 ozet ve risk kalite kartlari ortak readiness state kaynagina tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web admin panel state organizasyonu ve readiness gorunurluguyle sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-402
- Status: no_action_required
- Priority: P3
- Kategori: admin_readiness_single_source
- Web Trigger: Faz 5 yuz on-yuz on uc dilimlerinde Faz 5 readiness state tek hook instance uzerinden status/risk/summary kartlarina dagitildi ve operasyon durum kartina readiness badge + blokaj ozeti eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web admin paneli state dagitimi ve readiness gorunurlugu ile sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-403
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_navigation_visibility
- Web Trigger: Faz 5 yuz on dort-yuz on yedi dilimlerinde Faz 5 checklist kartlari anchor id ile linklenebilir hale getirildi; side panelde readiness karti acildi ve bloklayan basliklar dogrudan ilgili karta yonlenir oldu.
- App Impact (ozet): Yok (simdilik). Degisiklikler web admin panel navigasyon/izlenebilirlik katmaninda; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-404
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_progress_visibility
- Web Trigger: Faz 5 yuz on sekiz-yuz yirmi bir dilimlerinde readiness ilerleme metrikleri (completed/total/percent) state'e eklendi; status/side-panel/summary kartlarinda progress ve blokaj link semantigi gelistirildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web admin panel UX gorunurlugu ve navigasyonla sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-405
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_storage_consistency
- Web Trigger: Faz 5 yuz yirmi iki-yuz yirmi bes dilimlerinde release gate + CORS kartlari ortak checklist storage helper'ina tasindi, CORS allow-list degerleri merkezi helper'a baglandi ve operations status kartina ilk blokaja hizli gecis eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web admin checklist storage tutarliligi ve panel navigasyon UX'i ile sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-406
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_freshness_signal
- Web Trigger: Faz 5 yuz yirmi alti-yuz yirmi dokuz dilimlerinde readiness freshness helper'lari eklendi; side panel readiness kartina freshness + copy aksiyonu geldi; operasyon durum kartina freshness etiketi yansitildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web admin panel tazelik sinyali ve operasyonel gorunurluk katmaniyla sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-407
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_realtime_freshness_tick
- Web Trigger: Faz 5 yuz otuz-yuz otuz uc dilimlerinde 60 sn minute tick hook'u eklendi ve freshness label/tone status/side/summary kartlarina parent seviyesinden canli dagitildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web admin panel freshness gorunurlugu ve UI state tazeleme ritmiyle sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-408
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_freshness_context_visibility
- Web Trigger: Faz 5 yuz otuz dort-yuz otuz yedi dilimlerinde freshness metadata'si (label/tone/updatedAt) parent seviyesinde tek kaynakta birlestirildi; status/side/summary kartlarina dagitildi ve stale durumda admin workspace'e amber operasyon uyari karti eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web admin panel Faz 5 tazelik gorunurlugu ve operasyonel uyari katmanini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-409
- Status: no_action_required
- Priority: P3
- Kategori: admin_risk_panel_freshness_and_navigation
- Web Trigger: Faz 5 yuz otuz sekiz-yuz kirk bir dilimlerinde risk paneline Faz 5 freshness baglami tasindi, risk kalite chip'lerinde freshness/updatedAt gorunurlugu acildi, filtre link copy aksiyonu clipboard guard ile sertlestirildi ve risk kart gecisleri `router.push` ile SPA akisa cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web admin risk triage UX'i, freshness gorunurlugu ve panel navigasyon davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-410
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_risk_triage_blocking_preview
- Web Trigger: Faz 5 yuz kirk iki-yuz kirk bes dilimlerinde Faz 5 blokaj preview helper'i eklendi, risk quality karti progress+blokaj linkleriyle genislestirildi, freshness warn callout'u risk paneline alindi ve filtre link kopyalama geri bildirimi gorunur hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web admin risk triage ve Faz 5 checklist gorunurluguyle ilgilidir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-411
- Status: no_action_required
- Priority: P3
- Kategori: admin_phase5_copy_and_blocking_summary_standardization
- Web Trigger: Faz 5 yuz kirk alti-yuz kirk dokuz dilimlerinde readiness kopya payload'i ortak helper'a tasindi, summary/side kart blokaj listeleri preview semantigine (ilk N + gizli sayi) alinip operasyon status blokaj satiri kisaltilmis ozet modele cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web admin Faz 5 checklist gorunurlugu ve rapor kopyalama UX'i ile ilgilidir; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-412
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_map_telemetry_and_health_visibility
- Web Trigger: Faz 5 yuz elli-yuz elli uc dilimlerinde live ops map telemetry hesaplari helper'a tasindi, split pane helper tabanli refactor edildi, Harita Sagligi chip'i ve perf slow operasyon uyari banner'i eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops map gorunurlugu ve operasyonel risk sinyallerini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-413
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_issue_tone_standardization
- Web Trigger: Faz 5 yuz elli dort-yuz elli yedi dilimlerinde stream issue semantigi `resolveStreamIssueState` ile tek kaynaga tasindi; map split, selected trip detail ve operator playbook kartlari warn/error ayrimini ayni state'ten okur hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops stream issue gorunurlugu ve operasyonel playbook copy semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-414
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_issue_single_source_state
- Web Trigger: Faz 5 yuz elli sekiz-yuz altmis bir dilimlerinde stream issue state selected-trip hook seviyesinde tek kaynaga alindi ve map/detail/playbook panelleri bu state'ten beslenecek sekilde refactor edildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web live ops stream issue state dagitimi ve panel semantik tutarliligi ile sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-415
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_issue_banner_and_presentation_unification
- Web Trigger: Faz 5 yuz altmis iki-yuz altmis bes dilimlerinde stream issue presentation helper + ortak banner component eklendi; map/detail callout'lari bu bilesene tasindi ve playbook metin tonu ortak presentation semantigiyle hizalandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler web live ops stream issue UI tutarliligi ve operator copy semantigi ile sinirli; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-416
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_list_toolbar_stream_issue_visibility
- Web Trigger: Faz 5 yuz altmis alti-yuz altmis dokuz dilimlerinde stream issue summary helper'i eklendi; trips list toolbar stream status chip'i ve label satiriyla genisletildi; pane+feature prop zinciri `streamIssueState` ile map/detail parity modeline cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops liste ustu stream sinyali gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-417
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_risk_queue_stream_health_visibility
- Web Trigger: Faz 5 yuz yetmis-yuz yetmis uc dilimlerinde risk oncelik kuyrugu stream issue summary ile genisletildi; header + empty-state chip'leri eklendi ve pane uzerinden `streamIssueState` prop dagitimi tamamlandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops risk panelinde stream saglik gorunurlugunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-418
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_map_and_detail_stream_health_chip_parity
- Web Trigger: Faz 5 yuz yetmis dort-yuz yetmis yedi dilimlerinde map split ve selected trip detail panellerine stream saglik chip'i eklendi; stream backoff satiri ASCII-safe metne cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops map+detail stream gorunurlugu ve metin semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-419
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_playbook_stream_chip_parity
- Web Trigger: Faz 5 yuz yetmis sekiz-yuz seksen bir dilimlerinde operator playbook kartina stream health chip'i eklendi, mode chip ile cift gorunum parity'si saglandi ve stream issue `title` semantigi tanimlandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops operator playbook UX semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-420
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_chip_component_unification
- Web Trigger: Faz 5 yuz seksen iki-yuz seksen bes dilimlerinde `live-ops-stream-issue-chip.tsx` ortak component'i eklendi ve toolbar/risk-queue/map/detail/playbook panellerindeki stream chip markuplari bu component'e tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops UI kod organizasyonu ve stream chip gorsel semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-421
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_risk_payload_stream_context
- Web Trigger: Faz 5 yuz seksen alti-yuz seksen dokuz dilimlerinde risk kuyrugu copy/share payload uretecilerine stream issue context satiri eklendi ve tum aksiyon cagrilari bu yeni stream state parametresiyle guncellendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops risk paneli kopya/paylasim metin semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-422
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_dispatch_payload_stream_context
- Web Trigger: Faz 5 yuz doksan-yuz doksan uc dilimlerinde dispatch aksiyon katmani `streamIssueState` parametresiyle genisletildi; sefer ozeti, destek paketi ve dispatch gecmisi payloadlarina stream baglam satiri eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops dispatch/paylasim metin semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-423
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_template_and_bulk_whatsapp_stream_parity
- Web Trigger: Faz 5 yuz doksan dort-yuz doksan yedi dilimlerinde dispatch template payload'lari stream issue baglamiyla genisletildi ve risk queue bulk WhatsApp trim davranisi stream satirini koruyacak sekilde duzeltildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops dispatch/risk paylasim metin semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-424
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_context_helper_centralization
- Web Trigger: Faz 5 yuz doksan sekiz-iki yuz bir dilimlerinde stream context satiri ortak helper'a merkezilestirildi; dispatch ve risk payload katmanlari ayni helper semantigine tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops copy/share payload organizasyonunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-425
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_payload_generated_at_standardization
- Web Trigger: Faz 5 iki yuz iki-iki yuz bes dilimlerinde payload zaman damgasi uretimi ortak helper'a tasindi; risk queue ve dispatch paketlerinde `Generated At (ISO/TR)` semantigi standardize edildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops payload metin formatini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-426
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_context_message_unification
- Web Trigger: Faz 5 iki yuz alti-iki yuz dokuz dilimlerinde stream context metni icin merkezi helper (`resolveLiveOpsStreamContextMessage`) tanimlandi; map/detail/list toolbar panelleri bu helper'a baglandi ve stream/rtdb status tipleri ortak contract olarak export edildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops stream metin semantigi ve tip organizasyonunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-427
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_deep_link_contract_centralization
- Web Trigger: Faz 5 iki yuz on-iki yuz on uc dilimlerinde deep-link uretimi ortak helper'a tasindi; risk queue ve dispatch trip-link akislarinda tek URL/query kontrati kullanilmaya baslandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops deep-link uretim semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-428
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_filter_context_payload_visibility
- Web Trigger: Faz 5 iki yuz on dort-iki yuz on yedi dilimlerinde live ops filter context modeli merkezilestirildi ve risk/dispatch copy-share payloadlarina filtre baglami satiri eklendi; toolbar uzerinde filtre ozet ve gorunum-link kopya geri bildirimi gorunur oldu.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops operasyon metni/geri bildirim semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-429
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_clipboard_support_hardening
- Web Trigger: Faz 5 iki yuz on sekiz-iki yuz yirmi bir dilimlerinde live ops copy akislarina pano destek guard'i eklendi; dispatch/risk/detail panellerinde unsupported tarayici durumunda kopya aksiyonlari pasiflestirildi ve acik geri bildirim mesaji verildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops copy UX guvenilirligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.
### W2A-430
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_toolbar_clipboard_guard_parity
- Web Trigger: Faz 5 iki yuz yirmi iki-iki yuz yirmi bes dilimlerinde live ops list toolbar copy aksiyonu clipboardSupported prop zinciri ile sertlestirildi; unsupported pano durumunda buton pasiflestirildi ve toolbar callout/mesaj semantigi detail+risk panelleriyle hizalandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops toolbar copy UX semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde npm run lint ve npm run build (web) yesil.
### W2A-431
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_lag_stale_semantics_hardening
- Web Trigger: Faz 5 iki yuz yirmi alti-iki yuz yirmi dokuz dilimlerinde live ops RTDB stream retry/backoff akisi stabilize edildi; stream lag timeout (45 sn), stale reason ve lag gorunurlugu map/detail panellerine tasindi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops stream teshis/izleme UX semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde npm run lint ve npm run build (web) yesil.
### W2A-432
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_recovery_visibility_and_soft_reload
- Web Trigger: Faz 5 iki yuz otuz-iki yuz otuz uc dilimlerinde live ops stream recovery sinyalleri list toolbar'a tasindi ve stream_lag_timeout durumunda kontrollu soft-reload eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops stream teshis/gorunurluk ve otomatik read-side yenileme davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde npm run lint ve npm run build (web) yesil.

### W2A-433
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_lag_tone_unification
- Web Trigger: Faz 5 iki yuz otuz dort-iki yuz otuz yedi dilimlerinde stream lag tonu helper ile merkezilestirildi ve map/list/detail panellerinde lag gorunurlugu parity'ye cekildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops stream lag teshis gorunumunu etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde npm run lint ve npm run build (web) yesil.

### W2A-434
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_recovery_quick_actions
- Web Trigger: Faz 5 iki yuz otuz sekiz-iki yuz kirk bir dilimlerinde live ops stream recovery callout'u stale/lag/backoff tek satir baglamina cekildi ve hizli triage aksiyonlari (yenile + kritik odak + stale gizle) eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops operasyonel triage UX davranisini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde npm run lint ve npm run build (web) yesil.

### W2A-435
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_recovery_contract_unification
- Web Trigger: Faz 5 iki yuz kirk iki-iki yuz kirk bes dilimlerinde stream toparlanma semantigi helper katmanina merkezilestirildi ve toolbar + selected detail + map panelleri ayni recovery kontratina (stale+lag+backoff) baglandi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops stream toparlanma gorunurlugu/triage semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde npm run lint ve npm run build (web) yesil.

### W2A-436
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_recovery_callout_componentization
- Web Trigger: Faz 5 iki yuz kirk alti-iki yuz kirk dokuz dilimlerinde stream toparlanma callout'u ortak bilesene tasindi ve toolbar + map + detail panellerinde ayni UI/ton semantigi kullanildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops operasyonel toparlanma gorunumunun tutarliligini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.

### W2A-437
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_risk_queue_stream_recovery_alignment
- Web Trigger: Faz 5 iki yuz elli-iki yuz elli uc dilimlerinde risk kuyrugu stream recovery semantigiyle hizalandi; payload metinlerine recovery baglami eklendi ve risk panelinde recovery callout gorunur hale getirildi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops risk paneli/payload semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.

### W2A-438
- Status: no_action_required
- Priority: P3
- Kategori: live_ops_stream_recovery_state_dispatch_unification
- Web Trigger: Faz 5 iki yuz elli dort-iki yuz elli yedi dilimlerinde stream recovery ozeti parent state'e tasindi, toolbar/risk queue prop zinciri tekillestirildi ve dispatch/support payloadlarina recovery baglami eklendi.
- App Impact (ozet): Yok (simdilik). Degisiklikler yalnizca web live ops operasyon semantigini etkiler; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.

### W2A-439
- Status: no_action_required
- Priority: P3
- Kategori: phase5_gate_validation_scope_lock_doc_sync
- Web Trigger: Faz 5 closeout hazirligi icin web/functions gate komutlari yeniden calistirildi, scope lock (`website/**` + `functions/**`) resmi kayda alindi ve Faz 5 blokaj dosyasi acildi (`plan/80_phase5_scope_and_closeout_execution_2026_02_27.md`).
- App Impact (ozet): Yok. Degisiklikler dokumantasyon + gate dogrulama seviyesinde; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/16_master_phase_plan_detailed.md, plan/80_phase5_scope_and_closeout_execution_2026_02_27.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Teknik blokaj web/functions rules testinde `STEP-289` olarak ayri kayda alinmistir.

### W2A-440
- Status: no_action_required
- Priority: P3
- Kategori: join_route_rate_limit_runtime_env_alignment
- Web Trigger: Faz 5 iki yuz altmis ikinci-iki yuz altmis dorduncu dilimlerinde `joinRouteBySrvCode` rate-limit env degerleri callable runtime'inda okunacak sekilde duzeltildi ve emulatorlu rules test paketi 34/34 yesile cekildi.
- App Impact (ozet): Yok. Degisiklik server-side testability/rate-limit kaynagini etkiler; app tarafinda davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md, plan/80_phase5_scope_and_closeout_execution_2026_02_27.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Teknik blokaj (`STEP-289`) kapanmistir.

### W2A-441
- Status: no_action_required
- Priority: P3
- Kategori: phase5_release_checklist_execution_log_sync
- Web Trigger: Faz 5 iki yuz altmis alti-iki yuz altmis dokuz dilimlerinde local route smoke kaniti toplandi ve release runbook checklisti icin execution log dosyasi acilip runbook'a baglandi (`plan/81_phase5_release_checklist_execution_log_2026_02_27.md`, `plan/33_release_and_pilot_runbook_web.md`).
- App Impact (ozet): Yok. Degisiklikler release operasyon dokumantasyonu ve web smoke kaydi seviyesinde; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/80_phase5_scope_and_closeout_execution_2026_02_27.md, plan/81_phase5_release_checklist_execution_log_2026_02_27.md, plan/33_release_and_pilot_runbook_web.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-442
- Status: no_action_required
- Priority: P3
- Kategori: phase5_local_gate_automation
- Web Trigger: Faz 5 iki yuz yetmis-iki yuz yetmis uc dilimlerinde local gate otomasyon scripti eklendi (`phase5-local-gate.ps1`), `npm run gate:local` komutu tanimlandi ve otomatik kanit raporu uretildi (`plan/82_phase5_local_gate_run_2026_02_27_1204.md`).
- App Impact (ozet): Yok. Degisiklikler web/functions kalite gate otomasyonu ve release dokumani seviyesinde; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/33_release_and_pilot_runbook_web.md, plan/80_phase5_scope_and_closeout_execution_2026_02_27.md, plan/81_phase5_release_checklist_execution_log_2026_02_27.md, plan/82_phase5_local_gate_run_2026_02_27_1204.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-443
- Status: no_action_required
- Priority: P3
- Kategori: phase5_vercel_env_audit_automation
- Web Trigger: Faz 5 iki yuz yetmis dort-iki yuz yetmis yedi dilimlerinde Vercel env key audit otomasyonu eklendi (`vercel-env-audit.ps1`), komut alias'i tanimlandi (`npm run audit:vercel-env`) ve PASS kanit raporu uretildi (`plan/83_vercel_env_audit_2026_02_27_1219.md`).
- App Impact (ozet): Yok. Degisiklikler release operasyon otomasyonu ve web dokuman senkronu seviyesinde; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/33_release_and_pilot_runbook_web.md, plan/80_phase5_scope_and_closeout_execution_2026_02_27.md, plan/81_phase5_release_checklist_execution_log_2026_02_27.md, plan/83_vercel_env_audit_2026_02_27_1219.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-444
- Status: no_action_required
- Priority: P3
- Kategori: phase5_domain_probe_automation
- Web Trigger: Faz 5 iki yuz yetmis sekiz-iki yuz seksen bir dilimlerinde domain probe otomasyonu eklendi (`domain-probe.ps1`), `npm run probe:domains` komutu tanimlandi ve canonical redirect/env-badge kaniti raporlandi (`plan/84_domain_probe_2026_02_27_1224.md`).
- App Impact (ozet): Yok. Degisiklikler domain/release operasyon dogrulama otomasyonu seviyesinde; app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/33_release_and_pilot_runbook_web.md, plan/80_phase5_scope_and_closeout_execution_2026_02_27.md, plan/81_phase5_release_checklist_execution_log_2026_02_27.md, plan/84_domain_probe_2026_02_27_1224.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir.

### W2A-445
- Status: no_action_required
- Priority: P2
- Kategori: signed_route_share_and_public_preview_hardening
- Web Trigger: Faz 5 iki yuz seksen iki-iki yuz seksen bes dilimlerinde rota paylasim akisi imzali link modeline cekildi (`generateRouteShareLink`) ve public `/r/[srvCode]` onizleme sayfasi tokenli dinamik preview callable'ina baglandi (`getDynamicRoutePreview`).
- App Impact (ozet): Yok (simdilik). Degisiklik web tarafinda misafir paylasim guvenligini ve onizleme UX'ini etkiler; mobil app davranis/kontrat/mesaj degismedi.
- Planlanan App Degisiklikleri:
  - none
- Bloklayici mi?: none
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: none
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu dilimde `npm run lint` ve `npm run build` (web) yesil.

### W2A-446
- Status: review_required
- Priority: P1
- Kategori: canonical_route_share_domain_switch
- Web Trigger: Faz 5 iki yuz seksen alti-iki yuz seksen sekiz dilimlerinde backend route share URL kaynagi `ROUTE_SHARE_BASE_URL` env degerine tasindi ve varsayilan canonical domain `https://app.neredeservis.app/r` olarak guncellendi.
- App Impact (ozet): Deger-semantigi etkisi var. API kontrat alanlari degismedi ancak `shareUrl`/`signedLandingUrl` icerigindeki host degisti; app icindeki link acma/allowlist davranisi bu host ile uyumlu olmali.
- Planlanan App Degisiklikleri:
  - `app.neredeservis.app` hostu icin deep-link/webview allowlist kontrolu yap.
  - Duyuru/paylasim metni icindeki link acma akisinda canonical host parity smoke testi ekle.
- Bloklayici mi?: potential
- Ilgili Web Docs: plan/29_phase1_first_sprint_backlog.md
- Ilgili App Dosyalari: BULUNAMADI (bu turda app kodu degistirilmedi)
- Notlar: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet (link host degeri). Web/functions kalite gate yesil (`npm run lint`, `npm run build`).

## W2A-447
- Date: 2026-02-27
- Web Trigger: Faz 5 iki yuz doksaninci dilimde route-share canonical host degisimi sonrasi functions integration test beklentileri guncellendi (STEP-287), local gate/env/domain kanitlari tekrar alindi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Production/web callable kontrati degismedi; yalniz test expectation ve release kanit dokumanlari senkronlandi.
## W2A-448
- Date: 2026-02-27
- Web Trigger: Faz 5 release readiness otomasyonu eklendi (npm run readiness:phase5) ve release kanit dosyalari (82/83/84/85) guncellendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Sadece web release sureci otomasyon/dokuman guncellemesi; mobil app davranis/kontrat/mesaj degisikligi yok.


## W2A-449
- Date: 2026-02-27
- Web Trigger: Faz 5 manual closeout hizlandirmasi icin smoke:manual:phase5 probe otomasyonu eklendi ve STG/PROD smoke kanit raporlari uretildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Sadece web release operasyon surecine yonelik script/dokuman guncellemesi; mobil app kontrat/davranis degisikligi yok.

## W2A-450
- Date: 2026-02-27
- Web Trigger: Production env duzeltmesinin canliya yansitilmasi icin redeploy adimi denendi; Vercel free deploy limiti (402 api-deployments-free-per-day) nedeniyle closeout checklist'e operasyon blokaji notu eklendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Bu kayit release operasyon durumudur; app kontrat/davranis/mesaj degisikligi yok.

## W2A-451
- Date: 2026-02-27
- Web Trigger: redeploy:phase5:verify otomasyonu eklendi ve Vercel limit blokaji (402) raporu kayda alindi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Release operasyonunu hizlandirma amacli script/log guncellemesi; app davranis/kontrat/mesaj degisikligi yok.

## W2A-452
- Date: 2026-02-27
- Web Trigger: `npm run redeploy:phase5:wait-retry` ile production redeploy basariyla tamamlandi ve prod smoke probe'da env badge `PROD` olarak dogrulandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Web release operasyon kapanisi; mobil app kontrat/davranis/mesaj degisikligi yok.

## W2A-453
- Date: 2026-02-27
- Web Trigger: STG smoke probe hala `HTTP 525` fail. Vercel domain inspect sonucu STG icin DNS kaydi gerekliligi (`A stg-app -> 76.76.21.21`) runbook/checklist'e eklendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Altyapi/DNS operasyon adimi; app tarafinda kod ya da kontrat degisikligi gerektirmez.

## W2A-454
- Date: 2026-02-27
- Web Trigger: Cloudflare API ile `stg-app.neredeservis.app` DNS kaydi acildi/duzeltildi ve Vercel tarafinda domain health PASS'e cekildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: STG altyapi baglantisi onarimi; app tarafinda davranis/kontrat/mesaj degisikligi yok.

## W2A-455
- Date: 2026-02-27
- Web Trigger: `stg-app` alias'i preview deployment'a tasindi; STG smoke probe'da env badge `STG` PASS oldu.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Web release izolasyonu duzeltmesi (prod/stg ayrimi). Mobil app kontrat/davranis degisikligi yok.

## W2A-456
- Date: 2026-02-27
- Web Trigger: Faz 5 release checklist kaydi `Closed` duruma alindi; kalan operasyonel acceptance maddeleri Faz 6 carry-over olarak etiketlendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Dokuman ve release sureci kapanis karari; app davranis/kontrat/mesaj degisikligi yok.

## W2A-457
- Date: 2026-02-27
- Web Trigger: `90_phase5_closeout_decision_2026_02_27.md` olusturuldu ve Faz 5 resmi kapanis karari kayda gecirildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Faz 5 -> Faz 6 gecis karar dokumani; mobil app tarafinda degisiklik gerektirmez.

## W2A-458
- Date: 2026-02-27
- Web Trigger: Faz 6 pilot acceptance checklist + execution log acildi (`91_phase6_pilot_acceptance_checklist_2026_02_27.md`, `92_phase6_execution_log_2026_02_27.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Planlama/operasyon dokumani acilisi; app tarafinda davranis/kontrat/mesaj degisikligi yok.

## W2A-459
- Date: 2026-02-27
- Web Trigger: Faz 6 manuel smoke ve readiness scriptleri eklendi (`phase6-manual-ops-smoke.ps1`, `phase6-readiness.ps1`) ve package scriptlerine baglandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Sadece web release-operasyon otomasyonu; app tarafinda davranis/kontrat/mesaj degisikligi yok.

## W2A-460
- Date: 2026-02-27
- Web Trigger: Faz 6 readiness strict moda cekildi (`-FailOnWarn`, `-FailOnPartial`) ve Vercel preview branch (`web-dev-vercel`) icin `NEXT_PUBLIC_MAPBOX_TOKEN` env tamamlama yapildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Konfigurasyon ve web release gate sertlestirmesi; app tarafinda davranis/kontrat/mesaj degisikligi yok.

## W2A-461
- Date: 2026-02-27
- Web Trigger: Faz 6 pilot onboarding check scripti eklendi (`phase6-pilot-onboarding-check.ps1`) ve onboarding rapor cikisi (`95_phase6_pilot_onboarding_check_*.md`) acildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Web operasyon dokumantasyonu ve onboarding disiplini; app tarafinda davranis/kontrat/mesaj degisikligi yok.

## W2A-462
- Date: 2026-02-27
- Web Trigger: Faz 6 acceptance closeout kosusu tamamlandi (`npm run acceptance:close:phase6`), route/stop CRUD + live ops + audit acceptance akislari PASS raporuyla kapatildi (`96_phase6_acceptance_closeout_2026_02_27_1651.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik release/acceptance otomasyonu ve dokuman kapanisi seviyesinde.

## W2A-463
- Date: 2026-02-27
- Web Trigger: Faz 6 kalan operasyon kalemleri kapatildi (`closeout:prod-ops:phase6` + onboarding check `-MarkAllDone`) ve checklist `Closed` durumuna cekildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web operasyon kapanis otomasyonu ve dokuman senkronu seviyesinde.

## W2A-464
- Date: 2026-02-27
- Web Trigger: Faz 7 ilk teknik dilimde admin tenant-state mutation akisi acildi (`updateCompanyAdminTenantState` callable + admin panel mutation karti). Company status, billing status ve billing valid-until patchleri owner/admin guard altinda audit log ile birlikte yazilir hale geldi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Akis sadece web admin operasyon yuzeyi ve web backend callable kapsamina aittir.

## W2A-465
- Date: 2026-02-27
- Web Trigger: Company share + admin callables icin runtime response-shape guardlari eklendi (`generateRouteShareLink`, `getDynamicRoutePreview`, `listCompanyAuditLogs`, `getCompanyAdminTenantState`, `updateCompanyAdminTenantState`) ve `CONTRACT_MISMATCH` korumasi aktif edildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Kontrat semantigi degismedi; yalnizca web tarafinda fail-fast dogrulama ve hata guvenligi sertlestirildi.

## W2A-466
- Date: 2026-02-27
- Web Trigger: Landing ana sayfa copy/CTA sertlestirmesi yapildi (phase-1 placeholder dili kaldirildi, pilot-ready mesaj/yonlendirme seti aktive edildi; `/live-ops`, `/routes`, `/dashboard` odakli CTA akisi).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web marketing katmaninda metin/yonlendirme sertlestirmesidir.

## W2A-467
- Date: 2026-02-27
- Web Trigger: Marketing alt sayfalari (`/iletisim`, `/gizlilik`, `/kvkk`) phase-1 placeholder seviyesinden cikartildi; bolum bazli detay icerik, hizli aksiyon linkleri ve bilgilendirme notu semantigi eklendi. `MarketingContentPage` bileseni `items`, `quickLinks`, `note` alanlariyla genisletildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklikler web marketing/icerik katmaninda ve app kontratlarindan bagimsizdir.

## W2A-468
- Date: 2026-02-27
- Web Trigger: Marketing alt sayfalarina (`/iletisim`, `/gizlilik`, `/kvkk`) sayfa bazli SEO metadata eklendi (`title`, `description`, `robots`, `openGraph`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Sadece web route metadata katmani guncellendi.

## W2A-469
- Date: 2026-02-27
- Web Trigger: `/login` ve `/giris` rotalari ortak `LoginPageShell` bileseninde birlestirildi; `giris` artik redirect yerine ayni premium login shell'i render ediyor. Her iki rota icin metadata tanimlandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web auth giris katmaninda UI tekrarini azaltma ve route UX birlesimi seviyesindedir.

## W2A-470
- Date: 2026-02-27
- Web Trigger: Faz 5/Faz 6 manuel smoke script kapsami genisletildi; ek probe adimlari eklendi (`/giris`, `/gizlilik`, `/iletisim`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web release-runbook otomasyon kapsami seviyesindedir.

## W2A-471
- Date: 2026-02-27
- Web Trigger: Canonical/SEO butunlugu icin global metadata katmani sertlestirildi (`layout metadataBase`, route-level canonical alternates, login canonical unify) ve yeni `robots.ts` + `sitemap.ts` route'lari eklendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web indexing/canonical katmanindadir.
## W2A-472
- Date: 2026-02-27
- Web Trigger: Sosyal paylasim onizleme katmani eklendi (`/opengraph-image`, `/twitter-image`) ve global/page metadata `openGraph.images` + `twitter` alanlariyla hizalandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web SEO/sosyal-onizleme katmanindadir.
## W2A-473
- Date: 2026-02-27
- Web Trigger: Landing ana sayfaya SEO structured data (JSON-LD) eklendi (`Organization`, `WebSite`, `LoginAction`). Structured data canonical marketing/panel URL helperlariyla uretiliyor.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web SEO indeksleme katmanindadir.
## W2A-474
- Date: 2026-02-27
- Web Trigger: Brand metadata/PWA katmani eklendi (`/icon`, `/apple-icon`, `/manifest.webmanifest`). Layout metadata `manifest` ve icon alanlariyla hizalandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web metadata/ikon katmanindadir.
## W2A-475
- Date: 2026-02-27
- Web Trigger: Faz 8 icin SEO smoke otomasyonu eklendi (`phase8-marketing-seo-smoke.ps1`, `npm run smoke:phase8:seo`) ve ilk canli probe raporu uretildi (`98_phase8_marketing_seo_smoke_2026_02_27_2010.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Rapor sonucu web release durumunu gosterir (robots/sitemap/opengraph/twitter/manifest endpointleri canli deploy bekliyor).
## W2A-476
- Date: 2026-02-27
- Web Trigger: Faz 8 deploy-butce dostu kalite kapisi eklendi (`phase8-local-seo-smoke.ps1`, `phase8-readiness.ps1`) ve ilk lokal kanit raporlari PASS aldi (`99_phase8_local_seo_smoke_2026_02_27_2013.md`, `100_phase8_readiness_2026_02_27_2013.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web kalite otomasyonu ve release disiplini katmanindadir.
## W2A-477
- Date: 2026-02-27
- Web Trigger: Faz 8 sosyal/ikon route'larinda edge runtime kaldirildi (`/icon`, `/apple-icon`, `/opengraph-image`, `/twitter-image`). Route'lar statik uretime gecerek build uyarisi temizlendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web build/perf katmanindadir.
## W2A-478
- Date: 2026-02-27
- Web Trigger: Faz 8 UX polish kapsaminda custom `not-found` sayfasi eklendi (`src/app/not-found.tsx`). 404 akisinda panel/marketing/iletisim yonlendirmeleri standartlastirildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web route UX katmanindadir.
## W2A-479
- Date: 2026-02-27
- Web Trigger: Faz 8 closeout otomasyonu eklendi (`phase8-closeout.ps1`, `npm run closeout:phase8`) ve ilk closeout raporu uretildi (`101_phase8_closeout_2026_02_27_2019.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Closeout raporu web release durumunu gosterir; remote smoke PASS icin deploy penceresi gerekir.
## W2A-480
- Date: 2026-02-27
- Web Trigger: Faz 8 closeout otomasyonu strict moda cekildi (`remote smoke -FailOnPartial`) ve closeout toplam durum hesaplama hatasi duzeltildi. Guncel closeout raporu (`101_phase8_closeout_2026_02_27_2022.md`) artik dogru sekilde `PARTIAL` durumunu yansitir.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web release karar dogrulugunu sertlestiren operasyon script katmanindadir.
## W2A-481
- Date: 2026-02-27
- Web Trigger: Faz 8 icin tek prod deploy penceresi calistirildi (`npx vercel --prod --yes`), `phase8-marketing-seo-smoke.ps1` sitemap root regex'i trailing slash tolerant hale getirildi ve strict remote smoke PASS'e cekildi. Faz 8 closeout raporu `PASS` durumuna guncellendi (`101_phase8_closeout_2026_02_27_2026.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web deploy + SEO smoke dogrulugu + release closeout katmanindadir.
## W2A-482
- Date: 2026-02-27
- Web Trigger: Faz 8 resmi kapanis karari dosyasi acildi (`website/plan/102_phase8_closeout_decision_2026_02_27.md`) ve kapanis kanitlari tek referansta toplandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web plan/release dokumantasyonu katmanindadir.
## W2A-483
- Date: 2026-02-27
- Web Trigger: App parity handoff otomasyonu eklendi (`phase9-app-parity-handoff.ps1`, `npm run handoff:app-parity`) ve ilk handoff raporu uretildi (`website/plan/103_phase9_app_parity_handoff_2026_02_27_2032.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app backlog gorunurlugunu olculer hale getiren web ops/dokumantasyon katmanindadir.
## W2A-484
- Date: 2026-02-27
- Web Trigger: Faz 9 app parser kontrat paket otomasyonu eklendi (`phase9-parser-contract-packet.ps1`, `npm run packet:app-parity`) ve ilk paket raporu uretildi (`website/plan/105_phase9_parser_contract_packet_2026_02_27_2050.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app sprintine girdi olacak rapor otomasyonu seviyesindedir.

## W2A-485
- Date: 2026-02-27
- Web Trigger: Faz 9 cutover core readiness otomasyonu eklendi (`phase9-cutover-core-readiness.ps1`, `npm run readiness:phase9`) ve guncel readiness raporu uretildi (`website/plan/104_phase9_cutover_core_readiness_2026_02_27_2053.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app cutover risk gorunurlugunu otomatik olcen web ops katmanindadir.

## W2A-486
- Date: 2026-02-27
- Web Trigger: Faz 9 handoff raporu tekrar kosuldu (`npm run handoff:app-parity`) ve toplam acik kalem sayisi 70 olarak yeniden kanitlandi (`website/plan/103_phase9_app_parity_handoff_2026_02_27_2050.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app backlog olcum ve cutover kontrol disiplini seviyesindedir.
## W2A-487
- Date: 2026-02-27
- Web Trigger: Faz 9 closeout orkestrasyon scripti eklendi (`phase9-closeout.ps1`, `npm run closeout:phase9`). Handoff + parser packet + readiness adimlari tek komutta kosulur hale getirildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web operasyon otomasyonu ve cutover gorunurlugu seviyesindedir.

## W2A-488
- Date: 2026-02-27
- Web Trigger: Faz 9 closeout kosusu alindi ve kapanis raporu uretildi (`website/plan/106_phase9_closeout_2026_02_27_2055.md`). Sonuc PARTIAL olarak kayda alindi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app backlog closure durumunu raporlayan web plan/ops katmanindadir.
## W2A-489
- Date: 2026-02-27
- Web Trigger: Faz 9 app workcards otomasyonu eklendi (`phase9-app-workcards.ps1`, `npm run workcards:phase9`) ve app parser/mapping closure maddeleri 4 paket halinde otomatik raporlanir hale getirildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app icin uygulanabilir is kartlarini ureten web ops otomasyonudur.

## W2A-490
- Date: 2026-02-27
- Web Trigger: Faz 9 closeout orkestrasyonu workcards adimini da kapsayacak sekilde genisletildi (`phase9-closeout.ps1`, `npm run closeout:phase9`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web release/cutover karar otomasyonu seviyesindedir.

## W2A-491
- Date: 2026-02-27
- Web Trigger: Faz 9 guncel closeout kosusu alindi; handoff + readiness + workcards raporlari PARTIAL olarak yeniden kanitlandi (`103/104/106/107` 2059 serisi).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app backlog closure durumunu olcen plan/ops katmanindadir.
## W2A-492
- Date: 2026-02-27
- Web Trigger: Dashboard route page fonksiyon isimleri placeholder ibaresinden arindirildi (`LiveOpsPage`, `DashboardPage`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web kod okunurlugu ve isim tutarliligi seviyesindedir.

## W2A-493
- Date: 2026-02-27
- Web Trigger: Faz 9 contract JSON export otomasyonu eklendi (`phase9-contract-json-export.ps1`, `npm run export:phase9:contract-json`) ve latest JSON paketi uretildi (`website/app-impact/10_phase9_contract_packet_latest.json`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app entegrasyonuna veri saglayan web otomasyon katmanindadir.

## W2A-494
- Date: 2026-02-27
- Web Trigger: Faz 9 closeout zinciri contract JSON adimini da kapsayacak sekilde guncellendi ve yeni closeout kosusu alindi (`website/plan/106_phase9_closeout_2026_02_27_2103.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web cutover karar otomasyonu seviyesindedir.
## W2A-495
- Date: 2026-02-27
- Web Trigger: Faz 9 rapor otomasyonlari latest-overwrite moduna cekildi (`103/104/105/107 latest`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik rapor dosya buyumesini kontrol eden web otomasyon iyilestirmesidir.

## W2A-496
- Date: 2026-02-27
- Web Trigger: Contract JSON export varsayilan davranisi latest-json guncelleme moduna alindi (`website/app-impact/10_phase9_contract_packet_latest.json`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app entegrasyonu icin daha stabil tek-kaynak artefact cikisidir.

## W2A-497
- Date: 2026-02-27
- Web Trigger: Faz 9 closeout zinciri latest rapor setini okumaya guncellendi ve latest closeout raporu uretildi (`website/plan/106_phase9_closeout_latest.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik cutover karar otomasyonunun stabil cikti modeline gecisidir.

## W2A-498
- Date: 2026-02-27
- Web Trigger: Dashboard route page fonksiyon isimleri placeholder ibaresinden arindirildi (`LiveOpsPage`, `DashboardPage`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web kod okunurlugu/parite seviyesindedir.
## W2A-499
- Date: 2026-02-27
- Web Trigger: Faz 9 web closure'i app closure'dan ayirmak icin yeni readiness scripti eklendi (`phase9-web-only-readiness.ps1`, `npm run readiness:phase9:web`) ve latest rapor cikisi acildi (`website/plan/109_phase9_web_only_readiness_latest.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web cutover gorunurlugunu netlestiren rapor otomasyonudur.

## W2A-500
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `Web-Only Readiness` adimini kapsayacak sekilde guncellendi; closeout scriptinde snapshot olusturma varsayilan davranisi kapatilip opsiyonel `-Snapshot` bayragina alindi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik dosya-sisme riskini azaltan web operasyon script iyilestirmesidir.

## W2A-501
- Date: 2026-02-27
- Web Trigger: `W2A-001` durumu `web_partial_app_pending` -> `web_done_app_pending` olarak netlestirildi (kaynaklar: `06_core_app_parity_execution_queue_2026_02_27.md`, `08_block_a_contract_alignment_matrix_2026_02_27.md`), raporlar tekrar uretildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. App force-update/cutoff closure hala bloklayici olarak pending'dir; degisiklik web closure siniflandirmasinin dogru ayrisimi icindir.
## W2A-502
- Date: 2026-02-27
- Web Trigger: App parser closure paketlerini makine-okunur sekilde disariya veren yeni JSON export eklendi (`phase9-workcards-json-export.ps1`, `npm run export:phase9:workcards-json`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app ekibine backlog transferini kolaylastiran web otomasyonudur.

## W2A-503
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` scripti `Workcards JSON` adimini zorunlu kanit satirina dahil edecek sekilde guncellendi (`11_phase9_app_workcards_latest.json`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web cutover raporunun izlenebilirlik kapsam genislemesidir.
## W2A-504
- Date: 2026-02-27
- Web Trigger: App parser/mapping backlog'unu uygulama sirasina ceviren sprint package otomasyonu eklendi (`phase9-app-sprint-packages.ps1`, `npm run plan:phase9:app-sprint-packages`) ve latest artefact'lar uretildi (`111_phase9_app_sprint_packages_latest.md`, `12_phase9_app_sprint_packages_latest.json`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app'e teslim edilecek islerin planlama/otomasyon katmanindadir.

## W2A-505
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `Sprint Packages JSON` adimini kapsayacak sekilde genisletildi; closeout raporu app execution plan gate'ini artik resmi satir olarak izliyor.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web cutover raporlamasinin izlenebilirligini artiran operasyonel iyilestirmedir.

## W2A-506
- Date: 2026-02-27
- Web Trigger: Phase 9 script setine file-lock retry yazimi eklendi (handoff/packet/cutover/web-readiness/workcards/workcards-json/contract-json/sprint-packages/closeout).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web rapor artefact uretim stabilitesini artirir.
## W2A-507
- Date: 2026-02-27
- Web Trigger: App cutover checklistindeki hazirlik maddesini kapatmak icin app regression smoke checklist dosyasi acildi (`website/app-impact/13_app_regression_smoke_checklist_phase9.md`) ve `03_app_integration_cutover_checklist.md` guncellendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app test hazirlik dokumantasyonu seviyesindedir.
## W2A-508
- Date: 2026-02-27
- Web Trigger: `phase9-app-kickoff-prompt.ps1` icindeki checklist referans satiri (`07_*`) format escape hatasi duzeltildi; app kickoff prompt cikisi temizlendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik yalnizca web dokuman artefact format kalitesidir.
## W2A-509
- Date: 2026-02-27
- Web Trigger: APP-SPRINT-1 icin dogrudan uygulanabilir execution runbook + smoke template artefactlari eklendi (`phase9-app-sprint1-execution-pack.ps1`, `npm run pack:phase9:app-sprint1`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app uygulama ekibine teslim formatini netlestiren web planlama otomasyonudur.

## W2A-510
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `Sprint1 Execution Pack` gate satirini kapsayacak sekilde genisletildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web closeout raporunun artefact izlenebilirlik kapsam genislemesidir.
## W2A-511
- Date: 2026-02-27
- Web Trigger: APP-SPRINT-2 icin dogrudan uygulanabilir execution runbook + smoke template artefactlari eklendi (`phase9-app-sprint2-execution-pack.ps1`, `npm run pack:phase9:app-sprint2`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app uygulama ekibine teslim formatini APP-SPRINT-2 kapsaminda genisletir.

## W2A-512
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `Sprint2 Execution Pack` gate satirini kapsayacak sekilde genisletildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web closeout raporunun izlenebilirlik kapsamini APP-SPRINT-2 seviyesine cikardi.
## W2A-513
- Date: 2026-02-27
- Web Trigger: APP-SPRINT-3 icin dogrudan uygulanabilir execution runbook + smoke template artefactlari eklendi (`phase9-app-sprint3-execution-pack.ps1`, `npm run pack:phase9:app-sprint3`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app teslim hattini APP-SPRINT-3 kapsaminda genisletir.

## W2A-514
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `Sprint3 Execution Pack` gate satirini kapsayacak sekilde genisletildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web closeout raporunun izlenebilirlik kapsamini APP-SPRINT-3 seviyesine cikardi.
## W2A-515
- Date: 2026-02-27
- Web Trigger: APP-SPRINT-4 icin dogrudan uygulanabilir execution runbook + smoke template artefactlari eklendi (`phase9-app-sprint4-execution-pack.ps1`, `npm run pack:phase9:app-sprint4`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app teslim hattini APP-SPRINT-4 acceptance closure kapsaminda tamamlar.

## W2A-516
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `Sprint4 Execution Pack` gate satirini kapsayacak sekilde genisletildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web closeout raporunun execution-pack izlenebilirligini APP-SPRINT-1..4 seviyesinde tamamlar.

## W2A-517
- Date: 2026-02-27
- Web Trigger: App sprint ilerlemesini tek raporda gosteren execution board otomasyonu eklendi (`phase9-app-execution-board.ps1`, `npm run board:phase9:app`). Latest ciktilar: `website/plan/121_phase9_app_execution_board_latest.md`, `website/app-impact/18_phase9_app_execution_board_latest.json`.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web tarafinda app backlog gorunurlugu ve ilerleme olcumu otomasyonudur.

## W2A-518
- Date: 2026-02-27
- Web Trigger: Uc kritik acceptance akisinin standart runbook'unu ureten manuel acceptance scripti eklendi (`phase9-manual-acceptance-pack.ps1`, `npm run pack:phase9:manual-acceptance`). Latest cikti: `website/plan/122_phase9_manual_acceptance_pack_latest.md`.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik acceptance adimlarini netlestiren web planlama artefactidir.

## W2A-519
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri yeni adimlarla genisletildi (`Execution Board JSON`, `Execution Board`, `Manual Acceptance Pack`) ve closeout raporu bu adimlari zorunlu kanit satiri olarak okumaya basladi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web cutover raporlama disiplinini guclendiren operasyonel entegrasyondur.

## W2A-520
- Date: 2026-02-27
- Web Trigger: Guncel Faz 9 closeout yeniden kosuldu (`npm run closeout:phase9`) ve yeni artefact seti latest dosyalara yazildi; web kalite dogrulamasi (`npm run lint`, `npm run build`) yesil alindi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Sonuc halen `PARTIAL` olup acik kalemlerin app parser/mapping kapanisinda oldugu netlestirildi.

## W2A-521
- Date: 2026-02-27
- Web Trigger: App davranis semantigini netlestiren kontrat dokumani eklendi (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`) ve force-update/426 + live stale-offline + route-lock reason-code policy seti tek referansa baglandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik implementasyon degil, cutover davranis tanimini netlestiren dokumantasyon adimidir.

## W2A-522
- Date: 2026-02-27
- Web Trigger: `03_app_integration_cutover_checklist.md` icindeki 3 acik madde yeni davranis kontrati referansiyla kapatildi; checklist acik sayisi 0'a cekildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu adim checklist seviyesinde tanim closure'dir.

## W2A-523
- Date: 2026-02-27
- Web Trigger: Faz 9 core gate yeniden olculdu (`npm run readiness:phase9`) ve toplam acik sayisi 66'dan 63'e indi (`website/plan/104_phase9_cutover_core_readiness_latest.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik rapor olcum guncellemesidir.

## W2A-524
- Date: 2026-02-27
- Web Trigger: Faz 9 closeout yeniden kosuldu (`npm run closeout:phase9`) ve yeni durum latest rapora yazildi (`website/plan/106_phase9_closeout_latest.md`); durum beklendigi gibi `PARTIAL` korundu.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Acik kalanlar app parser/mapping closure backlogudur.

## W2A-525
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` icindeki script calisma sirasi duzeltildi; `phase9-app-sprint-packages.ps1` adimi `phase9-app-execution-board.ps1` adimindan once calisacak sekilde alinarak execution board metriklerinin stale kalmasi engellendi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik web rapor orkestrasyonu tutarliligini iyilestirir.

## W2A-526
- Date: 2026-02-27
- Web Trigger: Closeout/readiness tekrar kosularinda metrikler guncellendi (`npm run closeout:phase9`, `npm run readiness:phase9`); execution board acik toplam 41'e, core gate toplam acik 63'e senkronlandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Bu adim olcum ve rapor tutarliligi guncellemesidir.

## W2A-527
- Date: 2026-02-27
- Web Trigger: App sprint paketlerinden otomatik uygulama promptu ureten implementation pack scripti eklendi (`phase9-app-implementation-pack.ps1`, `npm run pack:phase9:app-implementation`) ve latest artefact uretildi (`website/plan/123_phase9_app_implementation_pack_latest.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app implementasyon hizini artiran web dokuman otomasyonudur.

## W2A-528
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `App Implementation Pack` adimini zorunlu gate satiri olarak kapsayacak sekilde genisletildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik closeout izlenebilirligini guclendiren web orkestrasyon guncellemesidir.

## W2A-529
- Date: 2026-02-27
- Web Trigger: Implementation pack scriptinde PowerShell parse hatasi giderildi (markdown fence satirlari guvenli string formatina tasindi) ve komut PASS'e cekildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik script stabilitesi iyilestirmesidir.

## W2A-530
- Date: 2026-02-27
- Web Trigger: Faz 9 closeout + kalite komutlari yeniden kosuldu (`npm run closeout:phase9`, `npm run lint`, `npm run build`) ve closeout raporunda implementation pack satiri PASS olarak dogrulandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Faz 9 halen app parser/mapping backlog nedeniyle PARTIAL durumdadir.

## W2A-531
- Date: 2026-02-27
- Web Trigger: Gunluk uygulama disiplini icin `phase9-app-daily-checkpoint.ps1` eklendi (`npm run checkpoint:phase9:app`) ve latest cikti uretildi (`website/plan/124_phase9_app_daily_checkpoint_latest.md`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app calisma ritmini netlestiren web otomasyonudur.

## W2A-532
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri `App Daily Checkpoint` adimini zorunlu gate satiri olarak kapsayacak sekilde genisletildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik closeout izlenebilirligini artiran web orchestration guncellemesidir.

## W2A-533
- Date: 2026-02-27
- Web Trigger: Daily checkpoint scriptindeki PowerShell parse hatasi giderildi (backtick iceren satirlar guvenli string formatina tasindi) ve komut PASS'e cekildi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik script stabilitesi iyilestirmesidir.

## W2A-534
- Date: 2026-02-27
- Web Trigger: `npm run checkpoint:phase9:app`, `npm run closeout:phase9`, `npm run lint`, `npm run build` yeniden kosuldu ve closeout raporunda `App Daily Checkpoint` satiri PASS olarak dogrulandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Faz 9 halen app parser/mapping backlog nedeniyle PARTIAL durumdadir.

## W2A-535
- Date: 2026-02-27
- Web Trigger: App batch planindan issue bazli teslim paketleri ureten script eklendi (`phase9-app-issue-cards.ps1`, `npm run plan:phase9:app-issue-cards`). Latest ciktilar: `website/plan/126_phase9_app_issue_cards_latest.md`, `website/app-impact/21_phase9_app_issue_cards_latest.json`.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik app ekibine teslim edilen gorev kartlarini otomatiklestiren web planlama adimidir.

## W2A-536
- Date: 2026-02-27
- Web Trigger: App acik/P0/P1 metriklerini GO-NO-GO semantigiyle ozetleyen script eklendi (`phase9-app-progress-delta.ps1`, `npm run status:phase9:app-delta`). Latest cikti: `website/plan/127_phase9_app_progress_delta_latest.md`.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik operasyonel izleme ve karar gorunurlugunu artiran web raporlama adimidir.

## W2A-537
- Date: 2026-02-27
- Web Trigger: `phase9-closeout.ps1` zinciri yeni gate satirlariyla genisletildi (`App Issue Cards JSON`, `App Issue Cards`, `App Progress Delta`).
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik closeout izlenebilirligini app uygulama hazirlik artefactlariyla genisletir.

## W2A-538
- Date: 2026-02-27
- Web Trigger: `npm run plan:phase9:app-issue-cards`, `npm run status:phase9:app-delta`, `npm run closeout:phase9` kosulari alindi ve `106_phase9_closeout_latest.md` raporunda yeni gate satirlari PASS olarak dogrulandi.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Faz 9 genel durumu app parser/mapping backlog nedeniyle PARTIAL olarak korunur.

## W2A-539
- Date: 2026-02-27
- Web Trigger: Issue-card scriptinde ASCII uyum bozulmasina yol acan baslik duzeltildi (`Amac`), artefact yeniden uretildi ve closeout tekrar kosuldu.
- App Impact: none
- Action for App Team: no_action_required
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: hayir. Degisiklik dokuman kalitesi ve script cikti tutarliligi iyilestirmesidir.

## W2A-540
- Date: 2026-02-27
- Web Trigger: App parity blok A icin typed callable client + parser katmani eklendi; route/stop mutasyon komutlari company-scoped callable akisina baglandi ve reason-code tabanli route mutation feedback mapping'i sertlestirildi.
- App Impact: contract_and_behavior_change
- Action for App Team: parser checklist (`07_*`) secim 1/2/3/4(kismi) + error mapping secim 6(kismi) maddelerini done/partial olarak kapat; membership/permission (W2A-100..106), live-source UI mapping ve acceptance smoke adimlarini sonraki sprintte tamamla.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet. Etki eden callables: `createCompany`, `listMyCompanies`, `listCompanyMembers`, `listCompanyVehicles`, `createVehicle`, `updateVehicle`, `createCompanyRoute`, `updateCompanyRoute`, `listCompanyRouteStops`, `upsertCompanyRouteStop`, `deleteCompanyRouteStop`, `reorderCompanyRouteStops`, `listActiveTripsByCompany`; hata semantikleri: `426`, `UPDATE_TOKEN_MISMATCH`, `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`, `ROUTE_STOP_INVALID_STATE`, `ROUTE_STOP_REORDER_STATE_INVALID`.

## W2A-541
- Date: 2026-02-27
- Web Trigger: Blok B parser closure adimi tamamlandi; app callable client'a `updateCompanyMember`, `inviteCompanyMember`, `acceptCompanyInvite`, `declineCompanyInvite`, `removeCompanyMember`, `grantDriverRoutePermissions`, `revokeDriverRoutePermissions`, `listRouteDriverPermissions` eklendi. Ayrica `listCompanyRoutes` parser/methodu eklendi.
- App Impact: contract_change
- Action for App Team: Blok B matrix (`09_*`) satirlarini `done` seviyesine cek; kalan odagi force-update/live-ops mapping/acceptance smoke uzerine kaydir.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet. Etki yeni callable response parserlari uzerindedir; mevcut web kontratlariyla birebir typed mapping saglandi.

## W2A-542
- Date: 2026-02-27
- Web Trigger: App parity icin canli operasyon ve guard reason-code mapping use-case katmani eklendi (`MapCompanyLiveOpsStateUseCase`, `ResolveCompanyContractErrorMessageUseCase`) ve testleri yazildi.
- App Impact: behavior_and_copy_alignment
- Action for App Team: Live ops UI katmaninda mapper sonucunu dogrudan kullanarak acceptance smoke maddelerini (`07` secim 7) kapat.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet. `liveState/live.source/stream-state` ve `OWNER_MEMBER_IMMUTABLE/SELF_MEMBER_REMOVE_FORBIDDEN/INVITE_*/ROUTE_PRIMARY_DRIVER_IMMUTABLE` kodlari icin standart copy semantigi tek noktada toplandi.

## W2A-543
- Date: 2026-02-27
- Web Trigger: App test altyapi blokaji kapatildi; pubspec dev tooling versiyonlari guncellendi (`drift 2.29.0`, `drift_dev 2.29.0`, `build_runner 2.6.1`) ve hedef app parity test seti PASS aldi.
- App Impact: tooling_runtime_stability
- Action for App Team: Secim 7 acceptance maddelerini manuel/runtime smoke ile kapat; parser/error-code closure artik testlenebilir durumda.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet (tooling/runtime). `flutter test` artik calisiyor; onceki pub solve ve `build/unit_test_assets` kilidi temizlendi.

## W2A-544
- Date: 2026-02-28
- Web Trigger: App parity acceptance closure icin smoke test paketi eklendi (`company_contract_parser_smoke_test`, `company_phase9_acceptance_smoke_test`) ve ilgili company/driver smoke setleri birlikte PASS aldi.
- App Impact: behavior_and_validation_closure
- Action for App Team: `07_*` secim 7 ve `13_*` smoke checklist satirlarini PASS seviyesinde koru; kalan tek bloklayici `W2A-001` hard-block force-update UX/mode gate implementasyonudur.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet. Company context recoverability, route conflict copy/retry ve live fallback semantigi testle kanitlandi.

## W2A-545
- Date: 2026-02-28
- Web Trigger: Blok A durum matrisi ve execution queue snapshot guncellendi; `W2A-002/003/004/017` app durumu `done` seviyesine cekildi, `W2A-001` tek bloklayici olarak ayrildi.
- App Impact: planning_alignment_update
- Action for App Team: Force-update hard-block ekrani + min version gate runtime kapanisina odaklan; sonrasi `handoff:app-parity` PASS hedeflenir.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet (durum/aksiyon onceligi). Kalan isler net olarak tek kaleme indirildi.

## W2A-546
- Date: 2026-02-28
- Web Trigger: App router'a hard-block force-update koridoru eklendi (`/force-update` route, `ForceUpdateRequiredScreen`, auth/consent exempt). Route/stop mutasyon failure helper'lari `UPGRADE_REQUIRED/FORCE_UPDATE_REQUIRED/426` sinyali aldiginda ekrana yonleniyor.
- App Impact: behavior_change
- Action for App Team: Min version gate runtime (proaktif) adimini tamamla; sonrasi W2A-001'i `done` seviyesine cek.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet. Legacy write-path reject durumunda app akisi artik hard-block update CTA'ya zorlanir.

## W2A-547
- Date: 2026-02-28
- Web Trigger: Startup min-version gate eklendi (`lib/app/router/force_update_version_gate.dart` + `NeredeServisApp` entegrasyonu). `MIN_REQUIRED_APP_VERSION` tanimliysa app acilisinda surum kontrolu yapilip gerekirse `/force-update` rotasina zorlanir.
- App Impact: behavior_and_config_change
- Action for App Team: DEV/STG/PROD build pipeline'larinda `MIN_REQUIRED_APP_VERSION` dart-define degerini ortama gore set et; release checkliste bu adimi sabitle.
- Notes: Kontrol sorusu uygulandi: Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu? Cevap: evet. W2A-001 parity kapanisi icin proaktif gate + reaktif 426 hard-block birlikte calisir hale geldi.

### W2A-548
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Faz 10 no-admin readiness bootstrap (`readiness:phase10:no-admin`)
- `App Impact (ozet)`: Yok; sadece web release-gate ve dokuman senkronizasyonu.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/128_phase10_no_admin_scope_bootstrap_2026_02_27.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-27: Faz 10 bootstrap adimi app runtime davranisi/kontrat/mesaj semantigini degistirmez.

### W2A-549
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Faz 10 manual release window automation (`pack:phase10:manual-release-window`)
- `App Impact (ozet)`: Yok; sadece web release-window denetimi ve raporlama.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/130_phase10_manual_release_window_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: app davranis/kontrat/mesaj semantigi degismedi.

### W2A-550
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Faz 10 no-admin closeout orchestration (`closeout:phase10:no-admin`)
- `App Impact (ozet)`: Yok; web closeout zinciri.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/131_phase10_no_admin_closeout_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: app runtime degisimi yok.

### W2A-551
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Manual smoke probe semantik guncellemesi (`/giris` 307/308->/login PASS)
- `App Impact (ozet)`: Yok; sadece web operasyon smoke script dogrulama kriteri.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/87_phase5_manual_smoke_probe_*.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: app davranis/kontrat/mesaj semantigi degismedi.

### W2A-552
- `Status`: `web_done_app_not_required`
- `Priority`: `P2`
- `Kategori`: `migration`
- `Web Trigger`: Vercel NEXT_PUBLIC_APP_ENV ortam hizalama ve alias yonetimi (prod/stg)
- `App Impact (ozet)`: Yok; deployment/env operasyon ayari.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/130_phase10_manual_release_window_latest.md`, `plan/131_phase10_no_admin_closeout_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: Production env badge PASS'e cekildi; STG tarafinda env badge hala DEV gorunuyor, preview env resolve davranisi icin operasyonel takip acik.

### W2A-553
- `Status`: `web_done_app_not_required`
- `Priority`: `P2`
- `Kategori`: `ui_ux`
- `Web Trigger`: Login shell env badge host-aware resolve (`stg-app.neredeservis.app` => `stg`, apex/app => `prod`)
- `App Impact (ozet)`: Yok; sadece web login shell SSR env rozet gorunurlugu duzeltmesi.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/129_phase10_no_admin_readiness_latest.md`, `plan/130_phase10_manual_release_window_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: App davranis/kontrat/mesaj semantigi degismedi. Duzenleme sadece web SSR env rozetinin STG/PROD hosta gore deterministik render edilmesi.

### W2A-554
- `Status`: `web_done_app_not_required`
- `Priority`: `P2`
- `Kategori`: `migration`
- `Web Trigger`: Tek preview deploy + `stg-app` alias rebind ile Faz 10 smoke/closeout PASS kapanisi
- `App Impact (ozet)`: Yok; deployment ve domain routing operasyonu.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/87_phase5_manual_smoke_probe_2026_02_28_0037.md`, `plan/130_phase10_manual_release_window_latest.md`, `plan/131_phase10_no_admin_closeout_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: App davranis/kontrat/mesaj semantigi degismedi. STG env badge PASS canli probe ile dogrulandi.

### W2A-555
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Faz 10 post-release observe otomasyonu (`phase10-post-release-observe.ps1`)
- `App Impact (ozet)`: Yok; sadece web release-sonrasi gozlem/izlenebilirlik raporu.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/132_phase10_post_release_observe_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: App davranis/kontrat/mesaj semantigi degismedi.

### W2A-556
- `Status`: `web_done_app_not_required`
- `Priority`: `P2`
- `Kategori`: `ui_ux`
- `Web Trigger`: Admin yuzeyinin env flag ile default kapatilmasi (`NEXT_PUBLIC_ENABLE_ADMIN_SURFACE=false`)
- `App Impact (ozet)`: Yok; degisiklik web panel navigasyonu/route guard seviyesiyle sinirli.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/29_phase1_first_sprint_backlog.md`, `plan/16_master_phase_plan_detailed.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: `/admin` route kapaliysa `/dashboard` redirect olur; sidebar/komut paleti admin linkini gizler. App davranis/kontrat/mesaj semantigi degismedi.

### W2A-557
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Faz 10 stabilization pack otomasyonu (`phase10-stabilization-pack.ps1`)
- `App Impact (ozet)`: Yok; web release operasyon zinciri (closeout + observe) tek komutta birlestirildi.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/133_phase10_stabilization_pack_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: App davranis/kontrat/mesaj semantigi degismedi.

### W2A-558
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Website-only commit pack otomasyonu (`phase10-website-commit-pack.ps1`)
- `App Impact (ozet)`: Yok; sadece website degisikliklerini ayiklayan release-ops yardimci raporudur.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/134_phase10_website_commit_pack_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: App davranis/kontrat/mesaj semantigi degismedi.

### W2A-559
- `Status`: `web_done_app_not_required`
- `Priority`: `P3`
- `Kategori`: `migration`
- `Web Trigger`: Faz 10 rapor prune otomasyonu (`phase10-report-prune.ps1`) ve eski timestamp raporlarinin temizligi
- `App Impact (ozet)`: Yok; sadece web plan rapor artefact sayisini kontrol etmek icin housekeeping adimi.
- `Planlanan App Degisiklikleri`: none
- `Bloklayici mi?`: `none`
- `Ilgili Web Docs`: `plan/135_phase10_report_prune_latest.md`
- `Ilgili App Dosyalari`: none
- `Notlar`: 2026-02-28: App davranis/kontrat/mesaj semantigi degismedi.
