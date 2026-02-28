# FAZ H On-Call Sorumluluk Matrisi (STEP-406)

Tarih: 2026-02-20  
Durum: Tamamlandi  
Etiket: codex

## Roller
- Incident Commander (IC)
- Mobile Owner
- Backend Owner
- Product/Comms Owner

## Sorumluluklar
- IC:
  - Olay seviyesini (SEV) belirler.
  - Bridge kanalini acar ve aksiyon sahiplerini atar.
  - Kapanis kararini verir.
- Mobile Owner:
  - Android/iOS regressions, crash, auth ve map akislarini inceler.
  - Gerekirse kill-switch veya hotfix lane'ini tetikler.
- Backend Owner:
  - Firebase Functions, Firestore/RTDB kurallari, notification pipeline kontrol eder.
  - Rate-limit, permission, queue ve heartbeat sinyallerini dogrular.
- Product/Comms Owner:
  - Kullaniciya etkiyi ozetler.
  - Destek metnini ve release notunu gunceller.

## Nobet Penceresi
- Hafta ici:
  - Birincil: 09:00-18:00 (Europe/Istanbul)
  - Kritik olayda 24/7 escalation
- Hafta sonu:
  - Nobetci IC + teknik backup

## Escalation
1. SEV-1: 15 dk icinde tum rol sahipleri bridge'de.
2. SEV-2: 30 dk icinde teknik ownerlar bridge'de.
3. SEV-3: Is saatleri icinde backlog/hotfix planina alinir.
