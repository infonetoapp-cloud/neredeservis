# NeredeServis App Check Konfig Taslagi (STEP-045)

Tarih: 2026-02-17  
Durum: Draft hazir (uygulama + console enforce adimi faz B-081..085 ile tamamlanacak)

## 1) Hedef
- Dev/Stg/Prod ortamlarinda App Check politikasini tek standarda baglamak.
- Prod ortaminda Firestore/RTDB/Functions icin enforce, debug token kapali.

## 2) Ortam Matrisi

| Ortam | Android | iOS | Web | Not |
|---|---|---|---|---|
| dev | Debug provider | Debug provider | reCAPTCHA (opsiyonel) | Lokal gelistirme hizli dongu |
| stg | Debug provider (sinirli cihaz) | Debug provider (sinirli cihaz) | reCAPTCHA (opsiyonel) | Release oncesi test |
| prod | Play Integrity | DeviceCheck (App Attest V1.1 adayi) | reCAPTCHA Enterprise (web aktifse) | Debug token kesin kapali |

## 3) Enforcement Plani

| Servis | dev | stg | prod |
|---|---|---|---|
| Firestore | monitor (opsiyonel enforce) | monitor/enforce | enforce |
| RTDB | monitor (opsiyonel enforce) | monitor/enforce | enforce |
| Functions Callable | monitor | monitor/enforce | enforce |
| Storage | ihtiyaca gore | ihtiyaca gore | ihtiyaca gore |

## 4) Uygulama Tarafi Kurallar
- Flavor bazli App Check init zorunlu (`dev`, `stg`, `prod`).
- Debug tokenlar kodda hardcode edilmez.
- Debug token sadece local secure storage / CI secret uzerinden okunur.
- Prod flavor debug fallback kapali olur.

## 5) Console Uygulama Sirasi (Manual Gate)
1. Firebase Console > Build > App Check
2. Her proje icin app bazinda provider sec:
   - Android prod: Play Integrity
   - iOS prod: DeviceCheck
3. Once `monitor`, sonra kontrollu olarak `enforce`.
4. Enforce sonrasi smoke test:
   - Auth login
   - Firestore read
   - RTDB live read/write (yetkili path)
   - Callable invoke

## 6) CI / Release Gate
- Release checklistte zorunlu satirlar:
  - `prod debug token yok`
  - `App Check enforce acik`
  - `permission/red fallback akisi bozulmadi`

## 7) Risk ve Geri Alma
- Risk: Yanlis enforce -> canli trafikte 403 artis.
- Geri alma:
  1) Kisa sureli `monitor` moduna don
  2) Hata kaynagini loglardan ayikla
  3) Duzeltme sonrasi tekrar enforce

## 8) Debug Token Hijyen Komutu (STEP-081/082)
- Script: `scripts/appcheck_debug_token_policy.ps1`
- Komut (enforce):
  - `powershell -ExecutionPolicy Bypass -File .\\scripts\\appcheck_debug_token_policy.ps1 -Enforce`
- Beklenen sonuc:
  - `stg` ve `prod` icin `debugTokenCount=0`
  - `dev` tokenlari silinmez (yalnizca audit edilir)

