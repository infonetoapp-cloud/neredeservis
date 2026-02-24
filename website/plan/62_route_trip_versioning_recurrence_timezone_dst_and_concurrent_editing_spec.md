# Route/Trip Versioning, Recurrence, Timezone/DST + Concurrent Editing Spec (MVP-Cut Revision)

Tarih: 2026-02-24
Durum: V2 technical design plan (MVP simplification applied)

## 1. Amac

Operasyonel kaosu onlemek icin eksik kalan davranislari tanimlamak, ama solo-founder MVP hizini korumak:
- route/trip versioning (MVP minimum + post-pilot full model)
- recurrence / timezone / DST kurallari
- concurrent editing icin minimum koruma

## 2. Revize Karar Ozeti

Ilk plandaki tam model (`routeDefinition` + `publishedRouteVersion` + `expectedVersion` genis yayilim) MVP icin fazla agir bulundu.

Bu nedenle:
- MVP'de full route versioning yok
- MVP'de minimal koruma var (trip snapshot + warning + basic conflict guard)
- Full publish/versioning semantigi post-pilot (Faz 6+) backloguna tasindi

## 3. MVP Route/Trip Davranisi (minimum koruma)

### 3.1 Route modeli (MVP)

- Route mutable kalir (tek aktif tanim)
- Operatör route/durak guncelleyebilir (policy dahilinde)
- "Aktif seferde route degistirme" UX olarak uyarilir

### 3.2 Trip snapshot kuralı (MVP zorunlu)

Trip baslatilirken en azindan su alanlar snapshotlanir:
- `routeId`
- route stop listesi snapshoti (veya hash + gerekli alanlar)
- `startedAt`

Amac:
- sonradan "bu sefer hangi rotaya gore yapildi" tartismasini azaltmak
- full versioning olmadan minimum izlenebilirlik saglamak

### 3.3 Aktif seferde route edit davranisi (MVP)

Varsayilan MVP kurali:
- aktif sefer varsa route edit ekraninda warning banner goster
- operatör route'u yine de duzenleyebilir (hard block yok, hiz odakli)
- audit log'a "active trip existed during route edit" notu dus

Review sonrasi soft-lock daraltmasi (MVP kalite korumasi):
- aktif sefer varken route metadata alanlari (isim/not vb.) guncellenebilir
- aktif sefer varken durak silme / durak sira degistirme / stop list yapisini degistiren mutasyonlar server-side soft-lock ile deny edilir
- aktif sefer varken izin verilecek route mutasyon subset'i endpoint bazli dokumante edilir

Not:
- Hard block veya advanced override akisi post-pilot degerlendirilir

## 4. Minimal Concurrent Editing Koruma (MVP)

Tam optimistic concurrency yerine MVP'de minimum koruma:
- route save mutasyonlarinda `lastKnownUpdateToken` (Firestore `updateTime` esdegeri/version token) istenir
- server bu tokeni Firestore'daki guncel kayitla transaction/precondition icinde karsilastirir
- conflict olursa basit `conflict` error + refresh mesaji
- stop-level merge/soft-lock/diff preview yok

Kural:
- Client'tan gelen serbest timestamp conflict kaynagi olarak kullanilmaz
- `lastKnownUpdateToken`/Firestore `updateTime` semantigi server-side enforce edilen precondition olmalidir
- silent overwrite riski sifirlanmaz ama ciddi oranda azaltilir
- conflict kontrolu backend command katmaninda zorunlu testlenir

## 5. Full Versioning / Concurrency (Post-Pilot hedef)

Asagidaki model Faz 6+ icin korunur:
- `routeDefinition` (tasarim)
- `publishedRouteVersion` (immutable snapshot)
- trip create aninda `routeVersionId`
- `expectedVersion` tabanli daha genis optimistic concurrency
- active trip override akisi

Bu dokuman bunu silmez; sadece MVP defaultu olmaktan cikarir.

## 6. Recurrence / Takvim / Saat Dilimi / DST

### 6.1 Neden kritik?

Servis operasyonunda haftalik tekrar ve saat bazli planlama vardir. Bu alan MVP'de bile dogru zemine oturtulmalidir.

### 6.2 MVP kurallari

1. Tekrarlı schedule kurali local semantik ile tutulur (`daysOfWeek` + `startLocalTime` + `timezone`)
2. Tek sefer/gerceklesen olay timestamp'leri UTC tutulur
3. "Bir sonraki seferin UTC karsiligi" runtime'da hesaplanir
4. UI gosterimi tenant timezone (varsayilan `Europe/Istanbul`)
5. Audit/log: UTC + display timezone conversion
6. DST davranisi policy olarak yazilir (ileri istisnalar sonra)

### 6.3 MVP recurrence alanlari (dar kapsam)

- `timezone`
- `daysOfWeek`
- `startLocalTime`
- `effectiveFrom` (opsiyonel)
- `effectiveTo` (opsiyonel)

Post-pilot:
- `holidayPolicy`
- `exceptionDates`
- daha zengin recurrence kurallari

## 7. Endpoint/Contract Etkisi (revize)

MVP zorunlu alanlar:
- trip create/start -> route snapshot referansi veya snapshot payload
- route update -> `lastKnownUpdateToken` (Firestore `updateTime` esdegeri) server-side enforced conflict guard
- active trip varsa destructive stop mutasyonlari icin `failed-precondition` / `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`

Post-pilot adaylari:
- `expectedVersion`
- `routeVersionId`
- publish semantics endpointleri

## 8. Test Basliklari (MVP odakli)

- trip start -> route snapshot capture test
- active trip exists + route edit warning/audit test
- active trip exists + stop delete/reorder soft-lock deny test
- server-enforced conflict response test (`lastKnownUpdateToken` / `updateTime` mismatch / race`)
- timezone conversion tests
- DST boundary smoke tests (temel)

Post-pilot ek testler:
- publish -> new trips only test
- immutable routeVersion behavior
- advanced concurrent editing conflict tests

## 9. Fazlama (revize)

- Faz 3-4: MVP minimum koruma + timezone/recurrence temel kurallar
- Faz 5: pilot oncesi telemetry/audit review (route edit during active trip olaylari)
- Faz 6+: full versioning/publish semantigi ihtiyac karari

## 10. Referanslar

- `42_p0_endpoint_contracts_v1_draft.md`
- `48_p0_endpoint_implementation_order_freeze.md`
- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
