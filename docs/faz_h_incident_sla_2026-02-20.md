# FAZ H Incident Response SLA (STEP-407)

Tarih: 2026-02-20  
Durum: Tamamlandi  
Etiket: codex

## SEV Siniflari
- SEV-1:
  - Uygulama acilmiyor, auth kitli, canli sefer kritik bozulma.
- SEV-2:
  - Ana akis calisiyor ama belirgin degrade var (stale artisi, push ciddi dusus).
- SEV-3:
  - Non-blocking hatalar, UI/metin uyumsuzluklari, dusuk etki.

## Hedef Sureler
- TTD (time to detect):
  - SEV-1: <= 10 dk
  - SEV-2: <= 30 dk
  - SEV-3: <= 1 is gunu
- TTA (time to acknowledge):
  - SEV-1: <= 15 dk
  - SEV-2: <= 30 dk
  - SEV-3: <= 1 is gunu
- Mitigasyon:
  - SEV-1: <= 60 dk (kill-switch, rollback, hotfix)
  - SEV-2: <= 4 saat
  - SEV-3: <= 3 is gunu

## Olay Akisi
1. Incident acilir, SEV atanir, owner belirlenir.
2. Kisa etki analizi ve workaround yayinlanir.
3. Gerekirse rollout durdurulur / rollback uygulanir.
4. Kapanis sonrasi postmortem notu 24 saat icinde yazilir.

## Kapanis Kriterleri
- Kullaniciyi etkileyen semptom ortadan kalkti.
- Izleme metrikleri normale dondu.
- Kalici aksiyonlar backlog'a acildi.
