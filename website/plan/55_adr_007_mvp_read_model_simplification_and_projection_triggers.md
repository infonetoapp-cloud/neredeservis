# ADR-007: MVP Read Model Simplification + Projection Trigger Thresholds

Tarih: 2026-02-24
Durum: Accepted
Supersedes/clarifies: `21_live_ops_read_model_adr.md` uygulama sirasi (kismi)

## 1. Problem

ADR-001'deki hibrit model dogru yon gosteriyor; ancak MVP Faz 1-2 icin projection endpointleri fazla erken genisletmek solo-founder delivery hizini dusurebilir.

## 2. Karar

Hibrit model korunacak, fakat MVP uygulama sirasi sadeleştirilecek:

### Faz 1-2 (default)
- Firestore read + RTDB stream
- Basit dashboard KPI'lar client-side aggregation
- Projection endpoint sadece zorunlu olursa

### Faz 3-4 (trigger-based)
- Performans/cost/permission karmasasi esiklerini gecen ekranlar icin hedefli projection endpoint

## 3. MVP Basit Read Kurali

Dashboard ekranlarinda asagidaki ozetler once client-side hesaplanabilir:
- aktif sefer sayisi
- online sofor sayisi (snapshot read model / mevcut listeden)
- warning count (sinirli veri seti)
- bugun tamamlanan sefer sayisi (sayfa boyutuna gore kismi)

Kural:
- Client-side hesaplanan KPI sadece "ekran ozet" amaclidir
- audit, billing, resmi rapor sayilari server-side hesapla dogrulanir

## 4. Projection Endpoint Acma Trigger'lari (MVP->Pilot)

Asagidaki kosullardan biri saglanirsa projection endpoint acilir:

1. P95 dashboard load > `1500ms` (stg/prod olcumlerinde)
2. Tek ekran icin Firestore read maliyeti kabul edilen esigi asar
3. Client-side authz/filtre mantigi UI'yi karmasiklastirir
4. Ayni aggregate hesap birden cok ekranda tekrar eder
5. Pagination nedeniyle KPI dogrulugu bozulur

## 5. Projection Endpoint Kullanim Kurali

Projection endpointler:
- "her ekran icin" degil
- sadece problemli aggregate / summary use-case icin
- request/response contract ile versiyonlanmis
- cache ve permission kurallari acik dokumante edilmis
olacak.

## 6. Live Ops Ozel Not

Canli harita icin RTDB stream stratejisi korunur.

Projection endpointin burada rolu:
- baslangic snapshot
- fleet summary
- route-level summary

RTDB stream rolu:
- dusuk gecikmeli konum update

## 7. Etkilenen Dokumanlar

- `21_live_ops_read_model_adr.md` (durum/uygulama notu)
- `42_p0_endpoint_contracts_v1_draft.md`
- `48_p0_endpoint_implementation_order_freeze.md`
- `32_observability_and_cost_control_plan.md`

## 8. Fazlama Sonucu

- Faz 1-2 delivery hizi artar
- Gereksiz backend endpoint sprawl azalir
- Buyume icin projection yolu kapanmaz

## 9. Review Zamani

Faz 4 sonu + Faz 6 pilot metric review:
- hangi projection endpointler acildi
- acilmayanlar dogru karar miydi
- read cost / latency trendleri
