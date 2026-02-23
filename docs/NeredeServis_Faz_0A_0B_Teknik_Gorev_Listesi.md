# NeredeServis Faz 0A + 0B Teknik Gorev Listesi

Tarih: 2026-02-22  
Durum: Baslangic Paketi (Execution Plan)  
Kapsam: Baseline stabilization + test/CI governance

## 1. Faz Kapsami (Net)

Bu dokuman, master plandaki:

- Faz 0A (Baseline Stabilization)
- Faz 0B (Test/CI Governance)

icin dosya-dosya uygulanabilir teknik gorev listesidir.

Bu fazda amac:

- mimari refactor baslamadan once zemini sabitlemek,
- test sinyalini ayristirmak,
- FVM/toolchain karmasasini bitirmek,
- refactor sirasinda kullanacagimiz kalite kapilarini tanimlamak.

## 2. Web Belirsizligi Notu (Bu Fazda Nasil Ele Alinacak)

Web sitesi icerigi/IA henuz net degil. Bu fazda bunun etkisi:

- Web panel UI/icerik kararlari alinmaz.
- Ancak web uzerinden sirket/fabrika yetkilendirme kesin gereksinim oldugu icin:
  - tenant/RBAC/API boundary notlari korunur,
  - Faz 0B governance kurallari icine `web-api` review ownership eklenir,
  - test/CI lane tasarimi ileride web lane'lerini eklemeye uygun yazilir.

## 3. Faz Cikis Kriteri (High-Level)

Faz 0A + 0B tamamlandi sayilmasi icin:

- FVM preflight scripti local `.fvm` SDK'yi dogrular
- Router guard lane tek komutla kosar (yesil hedeflenir)
- Test lane'leri isimlendirilmis ve scriptlenmis olur
- Baseline compile/test kiriklari triage listesi yazili olur
- CI workflow iyilestirme plani/net gorevleri tanimli olur (hedef: ilk asama update veya net takip maddesi)
- Quarantine mantigi dokumante edilir (owner + target date ile)

## 4. Calisma Sirasi (WIP Disiplini)

1. Toolchain preflight
2. Test lane scriptleri
3. Baseline triage dokumani (compile/test kiriklari)
4. Guard stale test cleanup
5. CI/governance dokumani + workflow degisiklikleri (kademeli)

Kural:

- Router refactor yok
- Feature ekleme yok
- Davranis degistiren UI degisikligi yok

## 5. Dosya-Dosya Teknik Gorev Listesi

## 5.1 Toolchain / FVM Guardrail (Faz 0A)

### Yeni/degisecek dosyalar

- `scripts/flutter_preflight.ps1` (yeni)
- `docs/flutter_lock.md` (gerekirse guncelleme)
- `README_SETUP.md` (gerekirse komut standardi notu)

### Gorevler

1. `scripts/flutter_preflight.ps1` olustur
- `.fvm/fvm_config.json` varligini kontrol et
- `.fvm/flutter_sdk/bin/flutter.bat` varligini kontrol et
- Local `.fvm` Flutter versiyonunu raporla
- Global `flutter` varsa versiyonunu raporla
- Mismatch durumunu acik uyar (fail davranisi opsiyonel/strict)
- `.fvmrc` ve `.fvm/fvm_config.json` uyumunu raporla

2. Komut standardini belgeye sabitle
- Local komutlarda `.fvm/flutter_sdk/bin/flutter.bat` fallback
- `fvm` CLI PATH'de yoksa fallback yolunu acik yaz

### Acceptance Criteria

- `powershell -File scripts/flutter_preflight.ps1` calisir
- Local `.fvm` SDK versiyonu raporlanir
- Global Flutter mismatch varsa acik gorulur

## 5.2 Test Lane Scriptleme (Faz 0A -> 0B Koprusu)

### Yeni/degisecek dosyalar

- `scripts/test_lane.ps1` (yeni)
- `docs/NeredeServis_Faz_0A_0B_Teknik_Gorev_Listesi.md` (bu dokuman)

### Lane Tanimlari (ilk versiyon)

- `router-guards`
- `domain-core`
- `ui-widget`
- `integration-smoke` (lokalde cihaz/emulator bagimli)

Not:

- Lane adlari zamanla split edilebilir.
- Ilk hedef "tek test komutunu parcalamak ve sinyal almak".

### Gorevler

1. `scripts/test_lane.ps1` olustur
- Parametreli lane secimi (`ValidateSet`)
- `.fvm` Flutter binary'sini kullan
- Opsiyonel `-SkipPubGet`
- Komutlari echo et (observability)

2. Lane komutlarini ilk etapta tanimla
- `router-guards` -> `test/app/router`
- `domain-core` -> `test/auth`, `test/config`, `test/core`, `test/domain`, `test/features/domain`
- `ui-widget` -> `test/ui`, `test/widget_test.dart`
- `integration-smoke` -> `integration_test/smoke_startup_test.dart` (device notu ile)

### Acceptance Criteria

- Her lane scriptten cagrilabilir
- Script lane ismini ve komutunu acik basar
- Fail durumunda hangi lane'in kirdigi net gorunur

## 5.3 Baseline Triage (Compile/Test Kiriklari Haritalama) - Faz 0A

### Yeni/degisecek dosyalar

- `docs/faz_0a_baseline_triage_YYYY-MM-DD.md` (yeni; tarihli)
- `docs/NeredeServis_Faz_0A_0B_Teknik_Gorev_Listesi.md` (gerekirse durum update)

### Gorevler

1. Triage cikart
- Toolchain/FVM kaynakli kiriklar
- Stale test expectation kiriklari
- Yari kalmis rename/refactor kaynakli compile kiriklari
- API kontrat/isim degisimi kaynakli test kiriklari

2. Her kirigi siniflandir
- `must-fix-now`
- `quarantine-candidate`
- `phase-blocking`
- `non-blocking`

3. Quarantine kurali belirle (dokumante)
- owner
- target date
- cikis kosulu

### Acceptance Criteria

- Kiriklar kategori bazli listelenmis
- Faz 1'i bloke edenler net isaretlenmis
- Quarantine edilenlerde owner + target date var

## 5.4 Guard Stale Test Cleanup (Faz 0A)

### Degisecek dosyalar (beklenen)

- `test/app/router/auth_guard_test.dart`
- `test/app/router/consent_guard_test.dart`
- `test/app/router/role_guard_test.dart`
- Gerekirse:
  - `lib/app/router/auth_guard.dart`
  - `lib/app/router/consent_guard.dart`
  - `lib/app/router/role_guard.dart`

### Gorevler

1. Mevcut guard davranisini kaynak kabul et (ilk adim)
- Testler mevcut davranisa uyarlanir
- Test isimleri davranisi dogru ifade eder

2. Guard matrix taslagi olustur (bu fazda dokuman veya test helper)
- public/private route
- role transitions
- consent hard/soft gate

3. Yanlis expectationlari temizle
- driver passenger corridor istisna kurali
- consent hard gate sadece gerekli ekranlarda mi? (mevcut davranisla hizalama)

### Acceptance Criteria

- `router-guards` lane yesil (hedef)
- Test isimleri ve expectationlar guncel davranisla uyumlu
- Faz 1 oncesi guard semantics "bilincli" hale gelir

## 5.5 CI / Governance (Faz 0B)

### Yeni/degisecek dosyalar

- `.github/workflows/mobile_ci.yml`
- (opsiyonel) `docs/engineering_ci_lane_policy.md` (yeni)
- (opsiyonel) `.github/pull_request_template.md`
- (opsiyonel) `.github/CODEOWNERS`

### Gorevler

1. Mevcut CI'yi lane mantigina hazirla (kademeli)
- `flutter test` yerine lane bazli job stratejisi tasarlansin
- Ilk adimda `router-guards` ve `domain-core` ayrilabilir
- `unit_test` job'u gecis surecinde non-blocking veya daraltilmis olabilir (karar ADR/step notu ile)

2. CODEOWNERS/ownership matrisi tanimla
- `app/router/*`
- `features/auth/*`
- `features/domain/*`
- `functions/*` / web-api alanlari
- `ui/*`

3. Quarantine policy dokumanini sabitle
- flaky != stale != compile break
- target date olmadan quarantine yok

### Acceptance Criteria

- CI lane stratejisi dokumante
- En az bir lane ayristirmasi uygulanmis veya net backlog item olarak kilitlenmis
- Ownership matrisi yazili

## 6. Test Matrix (Faz 0A + 0B)

## Zorunlu Kosular (local)

1. `scripts/flutter_preflight.ps1`
2. `scripts/test_lane.ps1 -Lane router-guards -SkipPubGet`
3. `scripts/test_lane.ps1 -Lane domain-core -SkipPubGet` (compile sinyali almak icin)

## Opsiyonel/Ortam Bagimli

1. `scripts/test_lane.ps1 -Lane ui-widget -SkipPubGet`
2. `scripts/test_lane.ps1 -Lane integration-smoke -DeviceId <id>`

## CI Hedefi (faz sonuna kadar)

- `analyze`
- `router-guards`
- `domain-core`
- build jobs (gecici olarak ayrik tutulabilir)

## 7. Riskler (Bu Faz Ozelinde)

Risk: Yari kalmis UI rename/refactor gundemi Faz 0A'yi dagitir  
Karsi hamle: Faz 0A scope kilidi, sadece baseline/blocker triage

Risk: Test lane scriptleri "tum testler duzeliyor" algisi yaratir  
Karsi hamle: Bu fazin hedefi sinyal ayristirma, tam yesil degil (guard lane haric)

Risk: CI degisikligi erken yapilinca PR akisi bozulur  
Karsi hamle: Kademeli rollout, once dokuman + script, sonra workflow split

## 8. Rollback / Geri Donus Plani

Bu fazdaki degisiklikler agirlikla script/dokuman/test oldugu icin rollback dusuk risklidir.

- CI workflow degisikligi sorun yaratirsa:
  - workflow lane split geri alinabilir
  - scriptler kalir (non-disruptive)
- Guard test cleanup sorun yaratirsa:
  - test expectation degisikligi revert edilir
  - kaynak guard davranisi degistirilmediyse urun riski dusuktur

## 9. Ilk Uygulama Paketi (Bu Dokuman Sonrasi Hemen)

Bu dokumandan sonra uygulanacak ilk somut adimlar:

1. `scripts/flutter_preflight.ps1`
2. `scripts/test_lane.ps1`
3. Scriptlerin baseline kosusu ve sonuclarin kaydi
4. `test/app/router/*` stale expectation duzeltmeleri
5. Baseline triage dokumani

---

Bu dokuman Faz 0A + 0B icin "uygulama checklist"tir.
Faz ilerledikce durum notlari `docs/proje_uygulama_iz_kaydi.md` icine append-only kaydedilecektir.
