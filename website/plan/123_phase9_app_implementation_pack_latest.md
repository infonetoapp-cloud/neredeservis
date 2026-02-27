# Faz 9 App Implementation Pack

Tarih: 2026-02-28 01:47:12
Durum: PASS

## Amac
- App ekibinin APP-SPRINT-1..4 bloklarini tek paketle, dogrudan uygulanabilir promptlarla kapatmasi.

## Giris Referanslari
- website/app-impact/12_phase9_app_sprint_packages_latest.json
- website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md
- website/app-impact/03_app_integration_cutover_checklist.md
- website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md

## Genel Kurallar
1. Contract-first ilerle: server shape degistirme, parser/mapping kapat.
2. 426 ve lock reason code mesajlarini eyleme donuk map et.
3. Live ops semantigi online/stale/offline + rtdb/trip_doc fallback ile ayni kalacak.
4. Her sprint sonunda checklist update + smoke kaniti ver.

## Sprint Promptlari

### APP-SPRINT-1 - Company Context + Vehicle + Route Base Parser
- Oncelik: P0
- Acik: 0/9
- W2A: W2A-004, W2A-006, W2A-007, W2A-008, W2A-009, W2A-010, W2A-011, W2A-012

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-1 (Company Context + Vehicle + Route Base Parser)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
Kabul kriterleri:
- Company secimi login sonrasi deterministic fallback ile aciliyor.
- Vehicle/Route create-update parser katmaninda crash olmadan isleniyor.
- Token mismatch mesaji UI'da anlasilir gosteriliyor.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

### APP-SPRINT-2 - Route Stops + Live Ops + Critical Error Mapping
- Oncelik: P0
- Acik: 0/13
- W2A: W2A-001, W2A-002, W2A-003, W2A-013, W2A-014, W2A-015, W2A-016, W2A-017

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-2 (Route Stops + Live Ops + Critical Error Mapping)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
Kabul kriterleri:
- Durak ekle/sil/sirala akislarinda soft-lock senaryolari dogru reason-code ile geri donuyor.
- RTDB stream kopma/yeniden baglanma sonrasi fallback semantigi korunuyor.
- 426 ve conflict kodlari kullaniciya eyleme donuk mesajla gosteriliyor.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

### APP-SPRINT-3 - Membership/Permission Parser + Guard Error Mapping
- Oncelik: P1
- Acik: 0/14
- W2A: W2A-100, W2A-101, W2A-102, W2A-103, W2A-104, W2A-105, W2A-106

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-3 (Membership/Permission Parser + Guard Error Mapping)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
Kabul kriterleri:
- Invite accept/decline ve member update/remove akislari parser seviyesinde deterministik.
- Owner/self guard reason-code'lari dogru UI mesajina mapleniyor.
- Route permission grant/revoke/list sonuclari role-state tutarli.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

### APP-SPRINT-4 - Acceptance Smoke + Cutover Checklist Closure
- Oncelik: P0
- Acik: 0/12
- W2A: W2A-001, W2A-002, W2A-003, W2A-004

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-4 (Acceptance Smoke + Cutover Checklist Closure)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
Kabul kriterleri:
- Parser crash-free smoke tum listedeki callable setinde PASS.
- Error mapping smoke listedeki tum zorunlu reason-code'larda PASS.
- 03 app integration cutover checklist maddeleri eksiksiz kapali.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

## Gun Sonu Rapor Formati
```text
Sprint: APP-SPRINT-X
Tamamlanan madde sayisi: A/B
Degisen dosyalar: ...
Calisan testler: ...
Acilan riskler: ...
Bir sonraki net 4 adim: ...
```

## Not
- Bu paket app implementasyonunu hizlandirmak icindir; web kontrati degistirmez.
