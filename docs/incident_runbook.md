# Incident Runbook (STEP-298)

Tarih: 2026-02-18  
Durum: Active

## 1) Severity Levels

- `P1`: Canli akista kritik kesinti (auth/trip/delete akisi calismiyor, yaygin hata).
- `P2`: Kismi kesinti veya yuksek hata orani (degrade mod calisiyor ama kalite dusuk).
- `P3`: Performans/maliyet anomalisi, ertelenebilir ama takip gerektirir.

## 2) Ilk 15 Dakika (Triage)

1. Alarm kaynagini dogrula (metric + log).
2. Etkilenen fonksiyon/ortam (`dev/stg/prod`) kapsamını belirle.
3. Son deploy/config degisikliklerini kontrol et.
4. Gerekirse feature flag ile blast radius daralt.

## 3) Teknik Kontrol Listesi

- Cloud Functions error logs (error code/message dagilimi)
- Firestore/RTDB quota ve latency
- Secret/ENV degisiklikleri
- App Check/Auth provider sagligi
- Scheduler son calisma zamanlari:
  - `cleanupStaleData`
  - `guestSessionTtlEnforcer`
  - `cleanupRouteWriters`

## 4) Mitigation Kaliplari

- Rate-limit kaynakli yuk:
  - istemci retry backoff kontrolu
  - gecici threshold ayari (sadece kontrollu)
- Upstream (Mapbox vb.) kesintisi:
  - graceful fallback pathlerini aktif tut
  - timeout/limit ayarlarini guvenli aralikta tut
- KVKK delete backlog:
  - `cleanupStaleData` scheduler sagligini oncelikli incele
  - pending queue artisinda P2 alarmi tetikle

## 5) Iletisim

- P1: 15 dk icinde durum notu gec.
- P2: 60 dk icinde durum notu gec.
- Her olayda:
  - etki alani
  - gecici cozum
  - kalici cozum plani

## 6) Kapanis (Post-Incident)

1. Kök neden analizi yaz.
2. Aksiyonlari owner + tarih ile backlog'a ekle.
3. Gerekirse alert threshold ve runbook guncelle.
4. `docs/proje_uygulama_iz_kaydi.md` dosyasina append-only kayit dus.
