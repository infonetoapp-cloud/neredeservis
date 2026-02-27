# Copy + State Semantics Glossary (Web <-> App)

Tarih: 2026-02-24
Durum: Baslangic sozlugu

## 1. Amac

Web ve app'te ayni durumu farkli isimlerle anlatma riskini azaltmak.
Ozellikle live ops / auth / version enforcement tarafinda ortak dil kullanmak.

## 2. Kullanim Kurali

- Yeni bir status/state/error copy eklendiginde buraya bak
- Mevcut anlamla cakisiyorsa yeni terim uretme
- App etkisi olan yeni semantik varsa `W2A` kaydi da ac

## 3. Baslangic Semantik Sozlugu

### Live Ops
- `online`
  - Anlam: Veri akisi normal, son sinyal threshold icinde
  - Web UI: yesil/canli
  - App UI: "bagli/canli" semantigi

- `stale`
  - Anlam: Son sinyal gec geldi ama baglanti tamamen kopmus oldugu kesin degil
  - Web UI: sari/gri (MVP threshold sade)
  - App UI: "veri gecikiyor" tonu

- `offline`
  - Anlam: onDisconnect veya baglanti kopusu sinyali alindi
  - Web UI: baglanti yok / offline
  - App UI: "Baglanti bekleniyor..." bar tonu

- `access_denied`
  - Anlam: Yetki/policy nedeniyle veri/aksiyon reddedildi
  - Web UI: session/role/tenant kaynakli acik mesaj
  - App UI: stale/offline ile karistirilmaz

- `rtdb_stream_connecting`
  - Anlam: RTDB stream subscribe edildi ama gecerli payload/koordinat henuz gelmedi
  - Web UI: "RTDB Stream Baglaniyor"
  - App UI: `stale/offline` yerine ayri "stream hazirlaniyor" semantigi

- `rtdb_stream_mismatch`
  - Anlam: RTDB payload geldi ama `tripId` secili seferle eslesmiyor (ayni rota uzerinde baska aktif sefer veya stale payload)
  - Web UI: "RTDB Payload Baska Sefer" + read-side koordinat fallback
  - App UI: stream hata gibi degil; fallback/read-side davranisiyla ayri semantik

- `rtdb_connection_online`
  - Anlam: RTDB `.info/connected` bagli (socket seviyesinde baglanti var)
  - Web UI: "RTDB Bagli" chip
  - App UI: stream status'ten ayri baglanti semantigi olarak gosterilir

- `rtdb_connection_offline`
  - Anlam: RTDB `.info/connected` bagli degil (baglanti yok / kopuk)
  - Web UI: "RTDB Baglanti Yok" chip
  - App UI: `stale` (veri gecikmesi) ile karistirilmaz

- `rtdb_access_denied`
  - Anlam: RTDB stream subscribe hata verdi ve hata semantigi `permission_denied` / `permission denied`
  - Web UI: stream hata copy'si `access_denied` tonu ile ayrilir (offline/stale degil)
  - App UI: role/tenant/policy kaynakli read deny copy'si olarak ayrica ele alinir

### Version / Cutoff
- `upgrade_required`
  - Anlam: Client version min supported altinda, islem devam edemez
  - Teknik: `426 Upgrade Required`
  - UX: update ekranina yonlendir

- `legacy_read_only`
  - Anlam: Eski client veri okuyabilir ama mutasyon yapamaz
  - Teknik: write path `426`, read path izinli

### Auth Provider Copy
- `google_sign_in`
  - UI copy: `Google ile Giris`
  - Not: Provider adi copy'de markali yazilir

- `microsoft_sign_in`
  - UI copy: `Microsoft ile Giris`
  - Not: "Outlook ile Giris" denmez; provider semantigi `microsoft.com` olarak kalir

### Route / Trip Mutation
- `active_trip_route_locked`
  - Anlam: Aktif sefer sirasinda rota yapisal degisiklik (stop delete/reorder) yasak
  - UX: "Aktif sefer bitmeden bu degisiklik yapilamaz"

## 4. Acik Noktalar

- Web/app stale threshold gosterim copy'si pilotta sadeleştirilebilir
- Billing state copy'leri app tarafinda gerekecek mi (simdilik belirsiz)
