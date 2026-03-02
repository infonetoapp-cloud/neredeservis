# MVP Faz Sirasi v1

Tarih: 2026-03-02
Durum: Execution order locked
Referanslar: 155, 157, 158, 159

## Faz 0 - Scope Lock ve Plan Hijyeni (Tamam)
- MVP kapsam kilidi
- Plan klasoru sadeleştirme ve arşivleme
- Web-first strateji karari

## Faz A - IA ve Contract Kilidi
- Fleet Setup + Live Ops bilgi mimarisi
- Endpoint contract matrisi
- Rol/izin tablosu
- Harita davranis kontrati
- Mikro-kopya seti

Exit gate:
- IA + contract + role matrix onayli

## Faz B - Web IA Uygulama
- Drivers/Vehicles/Routes -> Fleet Setup birlestirme
- Live Ops panel sadeleştirme
- Drawer tabanli "no tab hopping" akislari

Exit gate:
- Yonetici sekme degistirmeden temel create/assign akislarini tamamlar

## Faz C - Web Operasyon Ozellikleri (P0)
- Fleet Setup create/edit/assign tamamlanmasi
- Live Ops risk kuyrugu + hizli aksiyonlar
- Harita odak/tam ekran + manual fit + follow toggle

Exit gate:
- P0 kabul kriterleri (158/bolum 6) gecmis

## Faz D - Stabilizasyon ve Gozetim
- Telemetry thresholds
- Read model/perf tuning
- Operator smoke checklistleri

Exit gate:
- Pilot operasyon stabilitesi kabul seviyesi

## Faz E - Driver App Parity
- Web kontratlarina gore driver app akislari
- Sefer baslat/bitir + konum gonderme stabilitesi

Exit gate:
- Driver app P0 acceptance tamam

## Faz F - Passenger App Parity
- Canli takip + temel duyuru
- Route/session deneyimi sadeleştirme

Exit gate:
- Passenger app P0 acceptance tamam

## Faz G - MVP Release Readiness
- UAT
- Cutover checklist
- Operasyon handoff

Exit gate:
- MVP yayin onayi

## Notlar
- UKOME/tarife motoru bu siralamada yok (MVP disi)
- AI/tahminleme bu siralamada yok (MVP disi)
