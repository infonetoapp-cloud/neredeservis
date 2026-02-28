# Mobile Offline + Stale Location Tolerance Plan (Live Ops)

Tarih: 2026-02-24
Durum: V1 plan

## 1. Amac

Canli takip deneyiminde network kopmasi / tunnel / zayif baglanti durumlarinda:
- veri ne kadar sure gecerli sayilir
- UI nasil davranir
- mobil app neyi buffer eder
sorularini netlestirmek.

## 2. Problem

RTDB stream canli gorunse bile mobil cihaz:
- tunnel'a girebilir
- internet kaybedebilir
- batarya optimizasyonu nedeniyle arkaplanda yavaslayabilir

Bu durumda web panelde nokta ekranda kalir ama gercekte veri stale olur.

## 3. MVP Temel Tolerans Kurali (onerilen)

Web panel stale hesaplama kuralı (serverTimestamp veya sourceTimestamp bazli):
- `0-30s` -> `online`
- `31-120s` -> `degraded`
- `121-180s` -> `stale`
- `>180s` -> `offline_assumed`

Not:
- Esikler pilot oncesi ayarlanabilir
- Uygulama ve panel ayni semantigi kullanmali (etiketlerde)
- MVP UI karmasasini azaltmak icin `degraded` ve `stale` tek gorunum sinifina birlestirilebilir (telemetry ayrimi korunabilir)

## 4. Timestamp Semantigi

Konum kaydinda mumkunse iki zaman tutulur:
- `sourceTimestamp` (cihaz olcum zamani)
- `serverTimestamp` (backend/RTDB yazim zamani)

UI stale hesaplamasi:
- once `sourceTimestamp` (varsa)
- fallback `serverTimestamp`

Kural:
- saat kaymasi / bozuk device clock senaryolari loglanir
- sourceTimestamp her zaman guvenilir kabul edilmez; backend drift kontrolu uygular

Backend drift guard (MVP onerilen):
- `abs(serverTimestamp - sourceTimestamp)` esigi asilirsa (ornegin >5 dk)
- live/stale hesaplamada `sourceTimestamp` yerine `serverTimestamp` kullan
- anomaly metric/log uret (`client_clock_skew_events`)

## 5. Web Panel Davranisi (Live Ops)

### 5.1 Marker/UI durumlari

- `online`: normal marker + son guncelleme etiketi
- `degraded`: marker gorunur + sari durum chip (MVP opsiyonel: `stale` ile tek "stale" gorunumu)
- `stale`: marker soluk/gri + "X dk once" etiketi
- `offline_assumed`: marker gri / kesik ring + listede alta dusurme (opsiyonel)

### 5.2 Operator UX kurallari

- stale/offline araclar listede filtrelenebilir
- "Offline araclari gizle" toggle'i eklenebilir (MVP UX kazanimi yuksek)
- "son konum" oldugu acikca belirtilir
- stale datayi canli data gibi animasyonla oynatma

## 6. Mobil App Davranisi (uyarlanacak plan)

MVP minimum hedef (app tarafi sonraki implementasyon icin):
- network yoksa lokal queue/buffer (hafif)
- baglanti gelince son gecerli konumlar/olaylar yeniden gonderilir (policy'e gore)
- gereksiz agresif retry ile batarya tuketimi artirilmaz

Ayrica:
- app UI'sinda driver'a baglanti durumu gorunmeli
- "konum gonderilemiyor" durumu sessizce gizlenmemeli

## 6.1 Burst replay / backlog flush riski (review sonrasi ek)

Senaryo:
- cihaz offline kalir
- konumlar lokal queue'da birikir
- baglanti gelince toplu gonderim olur

Risk:
- web RTDB stream'i kisa surede cok sayida update alir
- harita animasyonu / React state / marker update dongusu kilitlenebilir

MVP korunma kurallari:
- mumkunse mobil client live path'e sadece queue'daki en guncel konumu yazar; gecmis batch verisini history/log kanalina yollar
- backend/live ingest katmani ayni arac icin burst update'leri coalesce eder (RTDB live node'a latest-only yazim)
- gecmis konumlar gerekiyorsa ayri history/log kanalina gider; live path backlog dump almaz
- web UI her update'i tek tek animasyonlamak zorunda degil
- ayni arac icin kisa aralikta gelen eski konumlar UI tarafinda da sample/drop/coalesce edilebilir
- marker render frequency limitlenir (or. animation frame / throttled update)
- list/KPI hesaplari burst'te debounce edilir

Not:
- Operasyon dogrulugu icin son guncel konum korunur
- Gecmis iz (history trail) gerekiyorsa ayri kanal/ekran olarak dusunulur
- "stale location" semantigi "session/access stale" (59) durumundan UI dilinde ayri tutulur

## 7. Retry / Buffer Notlari (MVP-lite)

- Guaranteed delivery sistemi MVP icin zorunlu degil
- Ama son konum + son durum event'i icin temel retry mantigi olmali
- Queue boyutu / saklama suresi sinirli olmali

Post-pilot:
- daha guclu offline queue semantics
- batch resend policy
- dedupe/idempotency iyilestirme

## 7.1 Disconnect / ghost vehicle notu (review sonrasi ek)

Web panelde "arac canliymis gibi donuk kalma" algisini azaltmak icin:
- stale/offline durumu sadece UI timer ile degil, baglanti sinyalleriyle de desteklenir
- mumkunse backend/RTDB tarafinda disconnect sinyali veya heartbeat eksikligi hizli isaretlenir
- mumkunse RTDB `.info/connected` + `onDisconnect` desenleriyle "baglanti koptu" sinyali desteklenir
- UI `online` state'i son update timestamp + connection signal kombinasyonuyla verir

OnDisconnect oncelik kuralı (review netlestirmesi):
- `onDisconnect`/baglanti-koptu sinyali gelirse `offline_assumed` durumu timestamp stale timer'ina gore bekletilmez
- timestamp tabanli stale/degraded hesap sadece baglanti sinyali yok veya belirsizse kullanilir

MVP hedefi:
- anlik sert offline tespiti garanti degil
- ama \"3 dk boyunca canli gorunuyor\" yanilgisini azaltacak semantik ve telemetry bulunur

## 8. Observability / Metrics

- stale_location_count_by_company
- avg_location_freshness_seconds
- offline_assumed_vehicle_count
- client_clock_skew_events
- reconnect_recovery_time
- location_update_gap_histogram

## 9. Test Senaryolari (min)

- network cut -> stale state transition test
- tunnel simulation -> degraded/stale visual state test
- reconnect -> state recovery test
- onDisconnect sinyali -> offline_assumed onceligi testi
- sourceTimestamp missing -> serverTimestamp fallback test
- clock skew anomaly logging test
- burst replay (coklu update flush) -> UI freeze olmama smoke test
- burst replay -> backend coalescing (latest-only live node) testi

## 10. Fazlama

- Faz 4: web live ops stale state UX semantigi
- Faz 5: telemetry + threshold tuning
- Faz 6: pilotta esiklerin kalibrasyonu
- Sonrasi: mobil offline queue iyilestirmeleri

## 11. Referanslar

- `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
- `57_adr_009_map_standardization_and_eta_consistency.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
- `33_release_and_pilot_runbook_web.md`
