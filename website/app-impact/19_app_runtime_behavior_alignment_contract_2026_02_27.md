# App Runtime Behavior Alignment Contract (Phase 9)

Tarih: 2026-02-27  
Durum: Implemented (env-bound min-version gate + hard-block update route)

## 1) Force Update + `426` Fallback Davranisi

Amac:
- Eski app surumlerinin web-first kontratlarla veri bozmasini engellemek.

Kurallar:
1. Server mutasyon endpointleri eski istemciyi `426 Upgrade Required` ile reddeder.
2. App tarafinda `426` yakalaninca zorunlu guncelleme akisi acilir.
3. Guncelleme ekrani kapatilamaz (hard block), store yonlendirmesi sunulur.
4. Read-only akista (kritik mutasyon disi ekranlar) bilgi goruntuleme bozulmaz.
5. Cutoff tarihi sonrasi mutasyon retry-loop olusmamalidir; tekil hata + update CTA zorunlu.

## 2) Live Ops Stale/Offline Semantigi (App + Web Tutarliligi)

Amac:
- Operator ve sofor tarafinda ayni "durum dili"ni kullanmak.

Semantik:
1. `online`: son sinyal <= 60s
2. `stale`: son sinyal > 60s ve baglanti tamamen kopuk degil
3. `offline`: baglanti koptu / stream read yok / yetki yok
4. `source`: once `rtdb`, fallback `trip_doc`
5. RTDB geri geldiginde source tekrar `rtdb` olur; ghost-state birikmez.

UI Davranisi:
- App ve web ayni durum etiketlerini ve ayni eylem dilini kullanir (`yenile`, `yeniden baglan`, `guncelle`).

## 3) Route/Trip Mutasyon Lock Reason-Code Davranisi

Amac:
- Soft-lock ve conflict durumlarinda operatorun yanlis aksiyonla devam etmesini engellemek.

Zorunlu reason-code map:
1. `UPDATE_TOKEN_MISMATCH` -> veri guncellendi, yeniden yukle + tekrar dene
2. `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED` -> aktif seferde yapisal degisiklik kilitli
3. `ROUTE_STOP_INVALID_STATE` -> durak durumu bu islem icin uygun degil
4. `ROUTE_STOP_REORDER_STATE_INVALID` -> siralama kilitli/uygunsuz
5. Guard kodlari (`OWNER_MEMBER_IMMUTABLE`, `SELF_MEMBER_REMOVE_FORBIDDEN`, vb.) net ve eyleme donuk metinle gosterilir.

## 4) Kapanis Kriteri Baglantisi

Bu dokuman, asagidaki checklist maddelerinin "davranis tanimi" tarafini kapatir:
- `03_app_integration_cutover_checklist.md`
  - force update / `426` fallback davranisi app tarafinda tanimli
  - live ops stale/offline semantigi app + web tutarli
  - route/trip mutasyon lock reason code'lari app tarafinda ele aliniyor

Not:
- Bu dosya implementasyon degil, davranis kontratidir.
- Gercek app implementasyon closure kayitlari `07_*` parser/mapping checklisti ve app smoke kanitlari uzerinden kapanir.
