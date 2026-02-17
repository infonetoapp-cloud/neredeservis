# Engineer Onboarding Security Baseline

Tarih: 2026-02-17  
Durum: Active (Zorunlu)

## 1) Amaç
- Yeni muhendis/ajan ilk gunden itibaren proje guvenlik cizgisinin bozulmamasini saglamak.
- Firebase API key kisitlarini panel hafizasina degil script + kanit modeline baglamak.

## 2) Zorunlu Ilk Gun Adimlari
1. Aktif hesap dogrulama:
   - `gcloud auth list`
   - `gcloud config list --format="value(core.account,core.project)"`
2. API key hardening yedegi:
   - `powershell -ExecutionPolicy Bypass -File scripts/harden_firebase_api_keys.ps1 -Mode backup`
3. API key hardening dogrulama:
   - `powershell -ExecutionPolicy Bypass -File scripts/harden_firebase_api_keys.ps1 -Mode verify`
4. Sonuclari `docs/proje_uygulama_iz_kaydi.md` dosyasina append-only formatta isle.

## 3) Degisiklik Sonrasi Zorunlu Adimlar
- Firebase API key restriction/app target/referrer degisirse:
  1. `... -Mode backup`
  2. `... -Mode apply`
  3. `... -Mode verify`
  4. Kanit + hata kaydi + duzeltme notunu iz dosyasina yaz.

## 4) Yasaklar
- Panelde manuel degistirip kanitsiz gecmek.
- API key restriction degisikliklerini iz kaydina yazmamak.
- `firebase_options_*.dart` dosyalarini repoya koymak.

## 5) Release Gate Baglantisi
- `docs/security_gate.md` icindeki `SG-13` bu dokumanin teknik enforcement kapisidir.
