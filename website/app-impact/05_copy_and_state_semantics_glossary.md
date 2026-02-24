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

### Version / Cutoff
- `upgrade_required`
  - Anlam: Client version min supported altinda, islem devam edemez
  - Teknik: `426 Upgrade Required`
  - UX: update ekranina yonlendir

- `legacy_read_only`
  - Anlam: Eski client veri okuyabilir ama mutasyon yapamaz
  - Teknik: write path `426`, read path izinli

### Route / Trip Mutation
- `active_trip_route_locked`
  - Anlam: Aktif sefer sirasinda rota yapisal degisiklik (stop delete/reorder) yasak
  - UX: "Aktif sefer bitmeden bu degisiklik yapilamaz"

## 4. Acik Noktalar

- Web/app stale threshold gosterim copy'si pilotta sadeleştirilebilir
- Billing state copy'leri app tarafinda gerekecek mi (simdilik belirsiz)

