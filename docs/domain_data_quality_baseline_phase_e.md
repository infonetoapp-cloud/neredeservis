# Faz E Domain/Data Quality Baseline (STEP-211..217)

Tarih (UTC): 2026-02-18

## Kapsam
- STEP-211: `api_contracts.md` ile domain data model anahtar uyumu.
- STEP-212: Tip guvenligi analizi.
- STEP-213: Dead code taramasi.
- STEP-214: Use-case klasor sadeleştirme.
- STEP-215: Performans baseline.
- STEP-216: Memory leak pattern taramasi.
- STEP-217: Test + analyze + build dogrulamasi.

## Sonuclar
1. API kontrat uyumu:
- `test/domain/api_contract_data_alignment_test.dart` eklendi.
- User/Driver/Route/Trip/Announcement/Consent/GuestSession model `toMap()` anahtar setleri kontrata kilitlendi.
- `docs/api_contracts.md` icinde `GuestSessionDoc` optional ownership alanlari (`ownerUid`, `previousOwnerUid`, `migratedAt`) netlestirildi.

2. Tip guvenligi:
- Komut: `dart analyze --fatal-infos lib test`
- Komut: `dart analyze --fatal-warnings lib test`
- Sonuc: `No issues found`.

3. Dead code:
- `dead_code` analyzer warning seviyesi gate olarak calistirildi (`--fatal-warnings`).
- Sonuc: `No issues found`.

4. Use-case klasor sadeleştirme:
- `lib/features/domain/application/domain_use_cases.dart` barrel export eklendi.
- Tuketimler barrel uzerinden guncellendi.

5. Performans baseline (lokal):
- `flutter analyze`: 11021 ms
- `flutter test`: 19541 ms
- `flutter build apk --debug --flavor dev -t lib/main_dev.dart`: 33641 ms
- `app-dev-debug.apk`: 256642928 bytes

6. Memory leak taramasi:
- Script: `scripts/check_memory_leak_patterns.ps1`
- Komut: `powershell -ExecutionPolicy Bypass -File scripts/check_memory_leak_patterns.ps1`
- Sonuc: `OK. No leak-prone dispose/cancel gaps found in scanned files.`

7. DOGRULAMA (STEP-217):
- `flutter analyze` -> pass
- `flutter test` -> pass
- `flutter build apk --debug --flavor dev -t lib/main_dev.dart` -> pass

## Not
- Android `minSdkVersion` satiri Flutter tool tarafindan otomatik modernize edildigi icin satir kalici olarak:
  - `minSdkVersion = Math.max(flutter.minSdkVersion, 23)`
  sekline alinmistir. Bu sayede hem Flutter template uyumu korunur hem de proje alt limiti `23` olarak sabit kalir.
