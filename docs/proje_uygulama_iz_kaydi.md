# NeredeServis Uygulama Iz Kaydi (Append-Only)

Bu dosya adim adim ilerleme kaydidir.
Kural: hicbir kayit silinmez. Hata varsa yeni kayitla "duzeltildi" olarak eklenir.

## Zorunlu Kayit Protokolu (Tum Muhendisler ve Tum Ajanlar Icin)
- Bu dosya append-only'dir; onceki kayitlar duzenlenmez/silinmez.
- Her yeni calisma `STEP-XXX` basligi ile eklenir.
- Her STEP kaydinda zorunlu alanlar: `Amac`, `Calistirilan Komutlar`, `Bulgular`, `Hata Kaydi`, `Sonraki Adim Icin Beklenen Onay`.
- Hatalar gizlenmez; "yanlis yapildi", "duzeltildi" seklinde yeni satirla kaydedilir.
- Bu projede calisan sonraki muhendisler/ajanlar da ayni kurala tabidir.

---

## STEP-001 - Runtime vs Strateji Cakisma Taramasi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- `docs/` altindaki runbook + teknik plan + urun stratejisi dosyalarini karsilastirip cakisma bulmak.

### Calistirilan Komutlar (Ham)
1. `Get-ChildItem docs -Name`
2. `rg -n ... NeredeServis_Cursor_Amber_Runbook.md ...` (HATA: yanlis path)
3. `rg -n ... docs/NeredeServis_Cursor_Amber_Runbook.md docs/NeredeServis_Teknik_Plan.md docs/NeredeServis_UrunStratejisi.md ...`
4. `rg -n "celisirse Teknik Plan kazanir|..." docs/NeredeServis_Cursor_Amber_Runbook.md ...`
5. `Get-Content docs/NeredeServis_Cursor_Amber_Runbook.md -TotalCount 260`
6. `Get-Content docs/NeredeServis_Teknik_Plan.md -TotalCount 260`
7. `Get-Content docs/NeredeServis_UrunStratejisi.md -TotalCount 260`
8. `rg -n "Abonelik / Paywall Ekranı|V1.1|V1.0 pilot karari|mock/read-only|production billing kapali|352AA|352F|RevenueCat product id" docs/NeredeServis_UrunStratejisi.md docs/NeredeServis_Teknik_Plan.md docs/NeredeServis_Cursor_Amber_Runbook.md`

### Hata Kaydi (Silinmez)
- Ilk `rg` denemesinde dosya path'leri `docs/` olmadan calistirildi ve "file not found" hatasi alindi.
- Duzeltme: tum hedef dosyalar `docs/` prefix'i ile tekrar tarandi.

### Bulgular
- Cakisma-01 (Onemli): Paywall zamanlamasi
  - Strateji: `Abonelik / Paywall Ekrani` V1.1 olarak isaretli (`docs/NeredeServis_UrunStratejisi.md:264`).
  - Teknik Plan: V1.0'da paywall UI + mock/read-only state var (`docs/NeredeServis_Teknik_Plan.md:35`, `docs/NeredeServis_Teknik_Plan.md:874`).
  - Runbook: V1.0'da paywall entry + V1.0 mock kilidi var (`docs/NeredeServis_Cursor_Amber_Runbook.md:708`, `docs/NeredeServis_Cursor_Amber_Runbook.md:713`).
  - Sonuc: Strateji tablosu ile plan/runbook arasinda kapsamsal tutarsizlik var.

- Cakisma-02 (Dokuman Hijyeni): Strateji dosyasi encoding bozuk gorunuyor
  - `docs/NeredeServis_UrunStratejisi.md` iceriginde Turkce karakterler bozulmus gorunuyor (örn. "ÃœRÃœN").
  - Sonuc: Icerik okunabilirligi ve diff takibi riske giriyor; UTF-8 normalizasyonu gerekli.

- Uyumlu Basliklar (Kritik)
  - RTDB timestamp penceresi (`now-30000`) uyumlu.
  - `driver_directory` direct read kapali uyumlu.
  - Timezone (`Europe/Istanbul`) uyumlu.
  - `single-active-device` + `startedByDeviceId` kurali uyumlu.
  - V1.0 monetization mock/read-only kurali teknik plan + runbook tarafinda uyumlu.

### Onerilen Duzeltme Sirasi
1. Strateji tablosunda paywall satirini V1.0 (UI + mock) / V1.1 (production billing) olarak acik ayir.
2. `docs/NeredeServis_UrunStratejisi.md` UTF-8 normalizasyonu yap.
3. Sonra FAZ A STEP-001'e resmi olarak gec (RUNBOOK_LOCKED + diff raporu).

### Sonraki Adim Icin Beklenen Onay
- STEP-002: `docs/NeredeServis_UrunStratejisi.md` icinde paywall satiri ve monetization bolumunu teknik planla birebir hizalayayim.

## STEP-002 - Strateji Hizalama ve Iz Kaydi Protokol Kilidi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Paywall surum cakismasini (Strateji vs Teknik Plan/Runbook) kapatmak.
- Iz kaydini tum muhendisler icin zorunlu append-only protokole baglamak.
- Encoding bulgusunu dogrulamak.

### Calistirilan Komutlar (Ham)
1. `Get-Content docs/NeredeServis_UrunStratejisi.md -TotalCount 40 -Encoding UTF8`
2. `Get-Content docs/NeredeServis_UrunStratejisi.md -TotalCount 40 -Encoding Default`
3. `rg -n "Abonelik / Paywall Ekranı|V1.0 pilot karari|mock/read-only|RevenueCat|V1.1" docs/NeredeServis_UrunStratejisi.md`
4. `apply_patch` -> `docs/NeredeServis_UrunStratejisi.md` (paywall satiri hizalandi)
5. `apply_patch` -> `docs/proje_uygulama_iz_kaydi.md` (zorunlu kayit protokolu eklendi)

### Hata Kaydi (Silinmez)
- STEP-001'deki "encoding bozuk" bulgusu teknik olarak yanlis tespit edildi.
- Neden: dosya `-Encoding UTF8` ile dogru okunuyor; mojibake goruntusu `-Encoding Default` okumasindan kaynaklaniyor.
- Duzeltme: `docs/NeredeServis_UrunStratejisi.md` dosya encoding'i degistirilmedi; okuma standardi UTF-8 olarak kilitlendi.

### Yapilan Degisiklikler
- `docs/NeredeServis_UrunStratejisi.md:264`
  - Paywall satiri su sekilde netlestirildi:
  - `V1.0 (UI+mock), V1.1 (production billing)`
  - V1.0'da gercek tahsilat kapali notu eklendi.
- `docs/proje_uygulama_iz_kaydi.md`
  - `Zorunlu Kayit Protokolu` bolumu eklendi.
  - Tum muhendisler/ajanlar icin append-only, adim bazli raporlama zorunlulugu yazildi.

### Sonuc
- Cakisma-01 kapatildi (paywall surum hizasi).
- Cakisma-02 "yanlis tespit" olarak kayda gecildi ve duzeltildi.
- Iz kaydi, senden sonraki muhendisler icin de kosullu zorunlu hale getirildi.

### Sonraki Adim Icin Beklenen Onay
- STEP-003: Runbook FAZ A resmi baslangicini yapayim:
  1) `docs/RUNBOOK_LOCKED.md` olusturma
  2) `docs/runbook_diff_report.md` olusturma
  3) teknik plan-runbook farklarini satir bazli kaydetme

## STEP-002A - Paywall Rehberleme Duzeltmesi (Kullanici Geri Bildirimi)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Teknik plani, paywall copy dokumanini (`docs/NeredeServis_Paywall_Copy_TR.md`) resmi rehber/single source olarak referanslayacak sekilde guncellemek.

### Calistirilan Komutlar (Ham)
1. `rg -n "Paywall|RevenueCat|Restore Purchases|Satin Alimlari Geri Yukle|Manage Subscription|copy|l10n" docs/NeredeServis_Teknik_Plan.md docs/NeredeServis_Paywall_Copy_TR.md docs/NeredeServis_Cursor_Amber_Runbook.md`
2. `Get-Content docs/NeredeServis_Teknik_Plan.md ...` (ilgili satir araliklari)
3. `apply_patch` -> `docs/NeredeServis_Teknik_Plan.md` (6.9 Monetization surface)
4. `apply_patch` -> `docs/NeredeServis_Teknik_Plan.md` (9.5 Store billing uyum gate)

### Hata Kaydi (Silinmez)
- Onceki adimda (STEP-002) paywall surum hizasi duzeltildi, ancak teknik plana paywall copy dosyasinin "single source" oldugu acik yazilmamisti.
- Duzeltme: Bu adimda teknik plana acik rehberlik/governance kurali eklendi.

### Yapilan Degisiklikler
- `docs/NeredeServis_Teknik_Plan.md` -> `6.9 Monetization surface (Sofor)`
  - `docs/NeredeServis_Paywall_Copy_TR.md` "Paywall copy single source of truth" olarak eklendi.
  - "Teknik plan metin kaynagi degildir" ve "copy degisikligi once paywall dokumaninda yapilir" kurali eklendi.
  - Zorunlu buton/label ve delete interceptor metinlerinin paywall copy ile birebir eslesme kurali eklendi.
  - l10n anahtar referansi paywall copy dosyasina baglandi.
- `docs/NeredeServis_Teknik_Plan.md` -> `9.5 Store billing uyum gate`
  - Copy governance maddesi eklendi.
  - "Paywall/store metin degisikliginde paywall copy guncellenmeden release yok" kurali eklendi.

### Sonuc
- Teknik plan artik paywall copy dosyasini resmi rehber olarak kullaniyor.
- Senin geri bildirimin dogrudan plana islendi.

### Sonraki Adim Icin Beklenen Onay
- STEP-003: Runbook FAZ A resmi baslangici:
  1) `docs/RUNBOOK_LOCKED.md` olusturma
  2) `docs/runbook_diff_report.md` olusturma
  3) runbook-teknik plan satir bazli fark kaydi

## STEP-003 - RUNBOOK Lock + Satir Bazli Diff Raporu
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Runbook'u kilitlemek (`RUNBOOK_LOCKED.md`).
- Runbook ve teknik plan arasinda satir bazli fark raporu olusturmak.

### Calistirilan Komutlar (Ham)
1. `Get-Item docs/NeredeServis_Cursor_Amber_Runbook.md ...`
2. `Get-Item docs/NeredeServis_Teknik_Plan.md ...`
3. `Copy-Item docs/NeredeServis_Cursor_Amber_Runbook.md docs/RUNBOOK_LOCKED.md -Force`
4. `Get-FileHash docs/NeredeServis_Cursor_Amber_Runbook.md -Algorithm SHA256`
5. `Get-FileHash docs/RUNBOOK_LOCKED.md -Algorithm SHA256`
6. `rg -n ... docs/NeredeServis_Cursor_Amber_Runbook.md` (fazlar, onaylar, dogrulamalar)
7. `rg -n ... docs/NeredeServis_Teknik_Plan.md` (bolumler, rules, contracts)
8. `Set-Content docs/runbook_diff_report.md -Encoding UTF8` (satir bazli diff raporu)

### Hata Kaydi (Silinmez)
- Bu adimda komut hatasi yok.

### Yapilan Degisiklikler
- `docs/RUNBOOK_LOCKED.md` olusturuldu.
- `docs/runbook_diff_report.md` olusturuldu.
  - Lock hash kontrolu eklendi.
  - Satir bazli farklar (expected/non-conflict) listelendi.
  - Kritik hizalamalar (timezone, multi-device, RTDB window, driver_directory, monetization/paywall source) satir referanslariyla kaydedildi.

### Sonuc
- Runbook lock basarili (source ve locked SHA256 eslesiyor).
- Runbook vs teknik plan icin guncel diff raporu olusturuldu.
- Aktif kritik celiski raporlanmadi.

### Sonraki Adim Icin Beklenen Onay
- STEP-004: FAZ A dokuman cekirdegini tamamlayayim:
  1) `docs/security_gate.md` olusturma
  2) `docs/ui_amber_spec.md` olusturma (runbook 018)
  3) `docs/flutter_upgrade_guard.md` taslagi olusturma

## STEP-003A - Diff Raporu Hash Alanlari Duzeltmesi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- `docs/runbook_diff_report.md` icindeki SHA metadata alanlarinin literal degisken kalmasi hatasini duzeltmek.

### Calistirilan Komutlar (Ham)
1. `Get-Content docs/runbook_diff_report.md`
2. `Get-FileHash docs/NeredeServis_Cursor_Amber_Runbook.md -Algorithm SHA256`
3. `Get-FileHash docs/RUNBOOK_LOCKED.md -Algorithm SHA256`
4. `Set-Content docs/runbook_diff_report.md -Encoding UTF8` (metadata alanlari gercek hash ile yeniden yazildi)

### Hata Kaydi (Silinmez)
- STEP-003'te ilk yazilan diff raporunda `Source SHA256: $runbookHash` ve `Locked SHA256: $lockedHash` literal kaldi.
- Duzeltme: rapor metadata alani gercek hash degerleri ile yeniden olusturuldu.

### Sonuc
- Diff raporu metadata alani artik dogru hash degerlerini iceriyor.

### Sonraki Adim Icin Beklenen Onay
- STEP-004: FAZ A dokuman cekirdegini tamamlayayim:
  1) `docs/security_gate.md` olusturma
  2) `docs/ui_amber_spec.md` olusturma
  3) `docs/flutter_upgrade_guard.md` taslagi olusturma

## STEP-004 - FAZ A Dokuman Cekirdegi Olusturma
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Runbook FAZ A'daki eksik cekirdek dokumanlari olusturmak:
  1) `docs/security_gate.md`
  2) `docs/ui_amber_spec.md`
  3) `docs/flutter_upgrade_guard.md`

### Calistirilan Komutlar (Ham)
1. `Get-ChildItem docs -Name`
2. `Test-Path docs/security_gate.md; Test-Path docs/ui_amber_spec.md; Test-Path docs/flutter_upgrade_guard.md`
3. `rg -n ... docs/NeredeServis_Cursor_Amber_Runbook.md docs/NeredeServis_Teknik_Plan.md docs/permission_orchestration.md docs/api_contracts.md`
4. `Set-Content docs/security_gate.md -Encoding UTF8`
5. `Set-Content docs/ui_amber_spec.md -Encoding UTF8`
6. `Set-Content docs/flutter_upgrade_guard.md -Encoding UTF8`
7. `Get-Content` dogrulama (3 dosya)
8. `rg -n "security_gate.md|ui_amber_spec.md|flutter_upgrade_guard.md" docs/NeredeServis_Cursor_Amber_Runbook.md docs/proje_uygulama_iz_kaydi.md`

### Hata Kaydi (Silinmez)
- Bu adimda komut hatasi yok.

### Yapilan Degisiklikler
- `docs/security_gate.md`
  - V1.0 release-blocking security/policy gate tanimlari eklendi.
  - Android+iOS birlikte kapsandi.
  - P0 gate checklist ve fail->block kurali eklendi.
- `docs/ui_amber_spec.md`
  - Amber tokenlar, tipografi, spacing, screen contracts, permission UX, paywall UX, accessibility ve acceptance kurallari eklendi.
- `docs/flutter_upgrade_guard.md`
  - Flutter lock, upgrade policy, precheck, test gate, rollback ve CI kurallari eklendi.

### Sonuc
- Runbook FAZ A'daki 018, 020, 094A adimlari icin temel dokumanlar artik mevcut.
- Dokumanlar plan/runbook ile uyumlu sekilde olusturuldu.

### Sonraki Adim Icin Beklenen Onay
- STEP-005: Firebase terminal hazirlik adimlarina gecelim:
  1) `firebase --version` kontrolu
  2) `firebase login:list` kontrolu
  3) `firebase projects:list` erisim dogrulamasi
  4) Ardindan senden proje adlari/ID formati onayi isteyecegim

## STEP-014B - Temiz Hesapta Proje Olusturma + Firebase Baglama Girisimi
Tarih: 2026-02-17
Durum: Kismi Tamamlandi (GCP proje olustu, Firebase baglama bloklu)

### Amac
- Yeni hesapta sifirdan `dev/stg/prod` ortamlarini olusturmak.
- Ardindan Firebase kaynaklarini baglayip (addFirebase) kuruluma devam etmek.

### Calistirilan Komutlar (Ham)
1. `$gcloud config unset project`
2. `$gcloud config list --format="value(core.account,core.project)"`
3. `firebase login:list`
4. `firebase projects:list --json`
5. `firebase projects:create neredeservis-dev --display-name "NeredeServis Dev"`
6. `firebase projects:create neredeservis-dev-01 --display-name "NeredeServis Dev 01"`
7. `firebase projects:create neredeservis-stg-01 --display-name "NeredeServis Staging 01"`
8. `firebase projects:create neredeservis-prod-01 --display-name "NeredeServis Production 01"`
9. `firebase projects:addfirebase neredeservis-dev-01`
10. `Get-Content firebase-debug.log -Tail 220`
11. `$gcloud projects get-iam-policy neredeservis-dev-01 --flatten="bindings[].members" --filter="bindings.members:user:canpolatmail0@gmail.com" --format="table(bindings.role,bindings.members)"`
12. `$gcloud projects describe neredeservis-dev-01 --format=json`
13. `$gcloud projects describe neredeservis-stg-01 --format=json`
14. `$gcloud projects describe neredeservis-prod-01 --format=json`
15. `firebase projects:list --json`

### Hata Kaydi (Silinmez)
- `neredeservis-dev` ID zaten mevcut oldugu icin olusturma reddedildi (`ALREADY_EXISTS`).
- `neredeservis-*-01` projelerinde GCP create basarili, ancak Firebase baglama (`addFirebase`) 403 ile reddedildi:
  - `POST https://firebase.googleapis.com/v1beta1/projects/<projectId>:addFirebase`
  - `PERMISSION_DENIED: The caller does not have permission`
- `gcloud config unset project` komutu basarili olsa da `config list` cikisinda eski proje uyarisi gorunmeye devam etti (bloklayici degil).

### Duzeltme / Ara Teshis
- ID cakismasi icin fallback adlandirma uygulandi:
  - `neredeservis-dev-01`
  - `neredeservis-stg-01`
  - `neredeservis-prod-01`
- IAM dogrulamasi:
  - `canpolatmail0@gmail.com` ilgili projede `roles/owner` yetkisine sahip.
- Sonuc: sorun GCP proje yetkisinden degil, Firebase add islemi tarafinda hesap-konsol seviyesinde bir gate/izin blokaji.

### Bulgular
- Uc GCP proje olustu ve `ACTIVE`:
  - `neredeservis-dev-01`
  - `neredeservis-stg-01`
  - `neredeservis-prod-01`
- Firebase CLI listesi hala bos (`[]`), yani projelere Firebase kaynaklari baglanmamis durumda.

### Sonuc
- Teknik akisin GCP kismi tamamlandi.
- Firebase baglama adimi icin kullanici tarafinda ek bir konsol onayi/gate tamamlanmadan ilerlenemiyor.

### Sonraki Adim Icin Beklenen Onay
- STEP-014C (kullanici aksiyonu + tekrar deneme):
  1) `https://console.firebase.google.com` ac.
  2) Hesapla Firebase "Get started/Terms" onaylarini tamamla.
  3) Mumkunse konsoldan `neredeservis-dev-01` icin "Add Firebase" islemini bir kez manuel tetikle.
  4) Sonra bana "hazir" yaz; ben CLI'dan `projects:addfirebase` + billing + API enable adimlarini devam ettirecegim.

## STEP-014C - Firebase Add Tekrar Deneme + Cift Dev Proje Tespiti
Tarih: 2026-02-17
Durum: Tamamlandi (kritik karar bekliyor)

### Amac
- Kullanici konsol aksiyonundan sonra `addFirebase` adiminin calistigini dogrulamak.
- Yeni hesapta aktif proje setini netlestirmek.

### Calistirilan Komutlar (Ham)
1. `firebase projects:list --json`
2. `$gcloud projects describe neredeservis-dev-01 --format=json`
3. `$gcloud projects describe neredeservis-stg-01 --format=json`
4. `firebase projects:addfirebase neredeservis-dev-01`
5. `firebase projects:list --json`
6. `$gcloud projects describe neredeservis-dev-01 --format='json(projectId,projectNumber,labels,lifecycleState)'`
7. `firebase login:list`
8. `$gcloud projects list --filter='projectId:neredeservis-*' --format='table(projectId,name,lifecycleState)'`
9. `$gcloud projects describe neredeservis-dev-01-30262 --format='json(projectId,projectNumber,labels,lifecycleState,name,createTime)'`
10. `firebase use --add`

### Hata Kaydi (Silinmez)
- `firebase use --add` hatasi:
  - `firebase use must be run from a Firebase project directory.`
- Etki: bloklayici degil; bu adimda sadece global hesap/proje durumu dogrulamasi hedefleniyordu.

### Bulgular
- `firebase projects:addfirebase neredeservis-dev-01` bu kez basarili oldu.
- Fakat hesapta su an iki farkli `dev` projesi gorunuyor:
  - `neredeservis-dev-01` (CLI ile olusturulan GCP proje + sonradan addFirebase basarili)
  - `neredeservis-dev-01-30262` (konsolda olusan ek Firebase proje)
- `gcloud projects list` ciktisinda toplam ortamlar:
  - `neredeservis-dev-01`
  - `neredeservis-dev-01-30262`
  - `neredeservis-stg-01`
  - `neredeservis-prod-01`

### Sonuc
- Firebase add blokaji asilmis durumda.
- Ancak "tek dev ortami" prensibi bozuldu; cift dev proje nedeniyle ileride yanlis deploy/yanlis billing riski var.

### Sonraki Adim Icin Beklenen Onay
- STEP-014D:
  1) Tek dev ortam secimini kilitleyelim (`onerilen: neredeservis-dev-01`).
  2) Diger dev projesini (`neredeservis-dev-01-30262`) silip sadeleyelim.
  3) Sonra `stg-01` ve `prod-01` icin de `addFirebase` + billing + API enable adimlarina gecelim.

## STEP-014D - Ortam Sadelestirme + stg/prod AddFirebase + Billing Teshisi
Tarih: 2026-02-17
Durum: Tamamlandi (billing manuel aksiyon bekliyor)

### Amac
- Cift `dev` proje riskini kapatmak.
- `stg/prod` ortamlarini Firebase'e baglamak.
- Billing "unsuccessful payment" durumunun teknik sonucunu netlemek.

### Calistirilan Komutlar (Ham)
1. `$gcloud projects delete neredeservis-dev-01-30262 --quiet`
2. `firebase projects:addfirebase neredeservis-stg-01`
3. `firebase projects:addfirebase neredeservis-prod-01`
4. `firebase projects:list --json`
5. `$gcloud billing accounts list --format='table(name,open,displayName)'`
6. `$gcloud projects describe neredeservis-dev-01 --format='value(lifecycleState,projectNumber)'`
7. `$gcloud projects describe neredeservis-stg-01 --format='value(lifecycleState,projectNumber)'`
8. `$gcloud projects describe neredeservis-prod-01 --format='value(lifecycleState,projectNumber)'`
9. `$gcloud beta billing projects describe neredeservis-dev-01`
10. `$gcloud beta billing projects describe neredeservis-stg-01`
11. `$gcloud beta billing projects describe neredeservis-prod-01`
12. `$gcloud billing projects describe neredeservis-dev-01`
13. `$gcloud billing projects describe neredeservis-stg-01`
14. `$gcloud billing projects describe neredeservis-prod-01`
15. `$gcloud billing accounts list --format='json(name,open,displayName)'`

### Hata Kaydi (Silinmez)
- `gcloud beta billing ...` komutlari bu ortamda `beta` komponenti kurulu olmadigi icin calismadi.
- Duzeltme:
  - `gcloud billing projects describe ...` (beta olmayan komut) kullanilarak ayni kontrol basariyla tamamlandi.
- `firebase projects:list` bir sure silinen projeyi gostermeye devam edebilir (gecikmeli yansima); otoriter kontrol `gcloud projects describe` ile yapildi.

### Bulgular
- `neredeservis-dev-01-30262` kapatma talebine alindi (silme sureci basladi).
- `stg-01` ve `prod-01` icin `addFirebase` basarili.
- Uc ortam da `ACTIVE`:
  - `neredeservis-dev-01`
  - `neredeservis-stg-01`
  - `neredeservis-prod-01`
- Billing durumu:
  - Her uc projede `billingEnabled: false`
  - `billingAccountName: ''`
  - Hesapta gorunen billing account listesi: `[]`

### Sonuc
- Teknik kurulum Firebase tarafinda tamamlandi, ancak billing baglanmadan Functions/Storage gibi kritik servisler devreye giremeyecek.
- "unsuccessful payment" sorununun etkisi dogrudan dogrulandi: yeni hesapta kullanilabilir billing account olusmamis.

### Sonraki Adim Icin Beklenen Onay
- STEP-014E (manuel billing cozum aksiyonu):
  1) Ya yeni hesapta odeme profili/billing hesabini basariyla ac.
  2) Ya da onceki calisan billing hesabina `canpolatmail0@gmail.com` kullanicisini billing admin/user olarak ekle.
  3) Sonra ben uc projeyi bu billing hesabina linkleyip API enable adimlarini tamamlayacagim.

## STEP-014E - Billing Hesabinin Baglanmasi (dev/stg/prod)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici billing hesabini ekledikten sonra uc ortama billing linklemek.
- "unsuccessful payment" durumunun operasyonel etkisini kapatmak.

### Calistirilan Komutlar (Ham)
1. `$gcloud billing accounts list --format='table(name,open,displayName)'`
2. `$gcloud billing accounts list --format=json`
3. `$gcloud auth list`
4. `$gcloud billing projects describe neredeservis-dev-01`
5. `$gcloud billing projects link neredeservis-dev-01 --billing-account=01F9DF-7BF097-CE63A7`
6. `$gcloud billing projects link neredeservis-stg-01 --billing-account=01F9DF-7BF097-CE63A7`
7. `$gcloud billing projects link neredeservis-prod-01 --billing-account=01F9DF-7BF097-CE63A7`
8. `$gcloud billing projects describe neredeservis-dev-01`
9. `$gcloud billing projects describe neredeservis-stg-01`
10. `$gcloud billing projects describe neredeservis-prod-01`

### Hata Kaydi (Silinmez)
- Ilk `table` formatli billing liste komutu bos cikti verdi.
- Duzeltme:
  - JSON formatla tekrarlandi (`--format=json`) ve aktif billing hesabi goruldu:
    - `billingAccounts/01F9DF-7BF097-CE63A7`

### Bulgular
- Aktif billing hesabi gorundu ve uc projeye basariyla baglandi.
- Dogrulama ciktilari:
  - `neredeservis-dev-01`: `billingEnabled: true`
  - `neredeservis-stg-01`: `billingEnabled: true`
  - `neredeservis-prod-01`: `billingEnabled: true`

### Sonuc
- Billing blokaji kapandi.
- Cloud Functions/Storage gibi Blaze gerektiren adimlara teknik olarak gecise haziriz.

### Sonraki Adim Icin Beklenen Onay
- STEP-015: Uc projede zorunlu Cloud API enable + kanit dosyasi guncellemesi.
  - `cloudfunctions.googleapis.com`
  - `run.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `eventarc.googleapis.com`
  - `pubsub.googleapis.com`
  - `cloudbuild.googleapis.com`
  - `secretmanager.googleapis.com`

## STEP-014A - Temiz Hesap Kimlik Dogrulama (gcloud + Firebase)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Yeni temiz hesapla (`canpolatmail0@gmail.com`) gcloud ve Firebase kimlik gecisini dogrulamak.
- Sonraki proje olusturma adimindan once aktif hesabin dogru oldugunu netlestirmek.

### Kullanici Tarafinda Calistirilan Komutlar (Paylasilan Cikti)
1. `& $gcloud auth login`
2. `& $gcloud auth list`
3. `firebase logout`
4. `firebase login`
5. `firebase login:list`

### Agent Tarafinda Calistirilan Dogrulama Komutlari (Ham)
1. `$gcloud auth list`
2. `$gcloud config list --format="value(core.account,core.project)"`
3. `firebase login:list`

### Bulgular
- Aktif gcloud hesap: `canpolatmail0@gmail.com`
- Ikinci hesap credential olarak duruyor: `sinancnplt21@gmail.com` (aktif degil).
- Firebase CLI girisi: `canpolatmail0@gmail.com`
- gcloud `core.project` degeri su an: `neredeservis-stg` (eski/silinmis ortamdan kalma config).

### Hata Kaydi (Silinmez)
- Bloklayici hata yok.
- Uyari:
  - `Project 'neredeservis-stg' lacks an 'environment' tag...`
  - Bu uyari mevcut `core.project` alaninin eski projeya isaret etmesinden gorunuyor.
- Duzeltme: sonraki adimda `core.project` sifirlanacak ve yeni projelerle tekrar set edilecek.

### Sonuc
- Kimlik gecisi basarili.
- Yeni hesapla sifirdan Firebase kurulumuna gecmeye haziriz.

### Sonraki Adim Icin Beklenen Onay
- STEP-014B:
  1) gcloud config temizligi (`core/project` sifirlama)
  2) yeni hesapta `neredeservis-dev`, `neredeservis-stg`, `neredeservis-prod` olusturma girisimi
  3) olusan projelerde billing + zorunlu API enable kontrolu

## STEP-012 - Firebase ile Devam Karari + Maliyet Esigi Netlestirme
Tarih: 2026-02-17
Durum: Tamamlandi (karar + teknik dogrulama)

### Amac
- Kullanici karariyla altyapiyi Firebase uzerinde kesinlestirmek.
- "Firebase bizi ne kadar ucretsiz goturur?" sorusunu mevcut urun trafik varsayimlariyla sayisal esige baglamak.
- Prod proje olusturma adimini tekrar deneyip mevcut blokaj durumunu netlemek.

### Calistirilan Komutlar (Ham)
1. `rg -n "8 sn|konum|RTDB|Directions|Maliyet guardrail" docs/NeredeServis_Teknik_Plan.md docs/NeredeServis_UrunStratejisi.md docs/NeredeServis_Cursor_Amber_Runbook.md`
2. `Get-Content -Path "docs/NeredeServis_Teknik_Plan.md" | Select-Object -Skip 850 -First 40`
3. `Get-Content -Path "docs/NeredeServis_UrunStratejisi.md" | Select-Object -Skip 1500 -First 40`
4. `firebase --version`
5. `$gcloud = "C:\Users\sinan\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"; & $gcloud --version`
6. `firebase projects:list --json`
7. `$gcloud projects describe neredeservis-dev --format=json`
8. `$gcloud projects describe neredeservis-stg --format=json`
9. `$gcloud projects describe neredeservis-prod --format=json`
10. `firebase projects:create neredeservis-prod --display-name "NeredeServis Production"`
11. `Get-Content -Path "firebase-debug.log" -Tail 120`
12. `$gcloud projects describe sence-860e8 --format='value(lifecycleState,projectNumber)'`
13. `$gcloud projects describe nefes-36bf6 --format='value(lifecycleState,projectNumber)'`
14. `$gcloud projects list --format='table(projectId,lifecycleState)'`

### Hata Kaydi (Silinmez)
- `firebase projects:create neredeservis-prod` tekrar denemesinde hata:
  - `The project cannot be created because you have exceeded your allotted project quota.`
- `gcloud --version` ilk denemede timeout verdi; tekrar denemede surum cikisi alindi.

### Bulgular
- Firebase ve gcloud CLI calisiyor (`firebase 15.4.0`, `gcloud 556.0.0`).
- `neredeservis-dev` ve `neredeservis-stg` `ACTIVE` durumda.
- `neredeservis-prod` henuz olusturulamiyor (kota limiti).
- Daha once silinmesi onaylanan eski projeler:
  - `sence-860e8`: `DELETE_REQUESTED`
  - `nefes-36bf6`: `DELETE_REQUESTED`
- Hesapta birden fazla `ACTIVE` proje kaldigi icin yeni proje kotasi dolu.
- Maliyet esigi (mevcut urun varsayimlariyla):
  - Ilk faturayi en erken RTDB download tetikler.
  - Yaklasik `50-80 aktif sofor` bandinda ucretsiz limitten tasma riski belirginlesir.
  - Ilk fazda Firebase ile devam etmek teknik olarak en saglikli secim olarak kilitlendi.

### Karar
- Altyapi karari: `Firebase ile devam`.
- Degisim yok: dev/stg uzerinden ilerlenecek, prod kotasi acildiginda aninda olusturulacak.

### Sonraki Adim Icin Beklenen Onay
- STEP-013: Kota acma icin gereksiz `ACTIVE` projeleri (senden tek tek onay alarak) silip `neredeservis-prod` olusturma adimini tekrar calistiralim.
- Not (zorunlu): Bu iz dosyasi append-only'dir. Benden sonra gelen her muhendis her adimi, hata ve duzeltme kayitlariyla bu dosyaya eklemek zorundadir.

## STEP-012A - Proje Kota Analizi (Silme Yok, Sadece Siniflandirma)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- `prod` olusturma kotasini tikayan `ACTIVE` proje yukunu net gormek.
- Silme islemi yapmadan once adaylari belirlemek.

### Calistirilan Komutlar (Ham)
1. `$gcloud projects list --format='json(projectId,name,lifecycleState,createTime)'`
2. `$gcloud projects list --filter='projectId:gen-lang-client-* OR projectId:project-fb* OR projectId:stunning-ripsaw*' --format='table(projectId,name,lifecycleState)'`

### Hata Kaydi (Silinmez)
- Bu adimda hata yok.

### Bulgular
- Su an `ACTIVE` proje sayisi yuksek ve kota blokaji devam ediyor.
- Gecici/deneme niteliginde gorunen adaylar:
  - `gen-lang-client-0150101664`
  - `gen-lang-client-0476855362`
  - `gen-lang-client-0700977354`
  - `project-fb037c14-795d-4c94-af3`
  - `stunning-ripsaw-482620-j1`
- Kritik not: Bu adimda hicbir silme komutu calistirilmadi.

### Sonraki Adim Icin Beklenen Onay
- STEP-013'te yukaridaki adaylardan hangilerini silmemi onayliyorsan, sadece onlar icin silme komutu calistiralim.

## STEP-013 - NeredeServis Projelerini Kapatma (Hesap Tasima Karari)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici karariyla mevcut Google hesabindaki NeredeServis deneme projelerini kapatmak.
- Temiz bir Google hesaba gecis icin zemin acmak.

### Calistirilan Komutlar (Ham)
1. `firebase projects:list --json`
2. `$gcloud projects describe neredeservis-dev --format='value(lifecycleState,projectNumber)'`
3. `$gcloud projects describe neredeservis-stg --format='value(lifecycleState,projectNumber)'`
4. `firebase projects:delete neredeservis-dev --force`
5. `firebase projects:delete neredeservis-stg --force`
6. `$gcloud projects delete neredeservis-dev --quiet`
7. `$gcloud projects delete neredeservis-stg --quiet`
8. `$gcloud projects describe neredeservis-dev --format='value(lifecycleState,projectNumber)'`
9. `$gcloud projects describe neredeservis-stg --format='value(lifecycleState,projectNumber)'`
10. `firebase projects:list --json`
11. `$gcloud projects list --filter='projectId:neredeservis-*' --format='table(projectId,lifecycleState)'`

### Hata Kaydi (Silinmez)
- `firebase projects:delete` komutu hatali:
  - `Error: projects:delete is not a Firebase command`
- Duzeltme:
  - GCP tarafinda dogru komutla kapatma yapildi:
    - `gcloud projects delete neredeservis-dev --quiet`
    - `gcloud projects delete neredeservis-stg --quiet`

### Bulgular
- `gcloud projects describe` ciktilari:
  - `neredeservis-dev`: `DELETE_REQUESTED`
  - `neredeservis-stg`: `DELETE_REQUESTED`
- `firebase projects:list` ve `gcloud projects list` bir sure daha `ACTIVE` gosterebiliyor (eventual consistency/gecikmeli yansima).
- Otoriter dogrulama bu adimda `gcloud projects describe` olarak sabitlendi.

### Sonuc
- Bu hesapta olusturulmus NeredeServis ortam projeleri kapatma surecine alindi.
- Temiz Google hesapla yeni kurulum akisina gecis karari uygulanabilir durumda.

### Sonraki Adim Icin Beklenen Onay
- STEP-014: Temiz hesapla yeni baslangic.
  1) Sen yeni Google hesapta `gcloud auth login` yapacaksin.
  2) Ben auth + account + project olusturma + API enable adimlarini bastan, iz kaydina yazarak yurutecegim.

## STEP-011A - Maliyet/Faturalama Risk Analizi (Bilgi Adimi)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici sorusuna net cevap verebilmek icin Firebase/Cloud Billing resmi dokumanlariyla maliyet ve odeme riski analizi yapmak.

### Calistirilan Arastirma Basliklari (Kaynak Taramasi)
1. Firebase pricing (Spark/Blaze no-cost limitleri)
2. Firestore billing/free quota
3. Realtime Database billing
4. Cloud Billing odeme reddi/suspension davranisi
5. Cloud Functions free tier + billing gereksinimi

### Bulgular
- Blaze planda Spark no-cost limitleri dahildir; limit asiminda pay-as-you-go faturalanir.
- Realtime Database maliyetinde ana kalem outbound trafik (download + protokol overhead) olur.
- Firestore free limitleri gunluk bazda sabittir (read/write/delete).
- Odeme reddinde servisler durdurulabilir; uzun sureli invalid durumda kaynak kaybi riski vardir.
- Budget alarmlari tek basina hard cap degildir (uyari verir, otomatik durdurmaz).

### Hata Kaydi (Silinmez)
- Altyapi degisikligi yapilmadi; bu adim bilgi/analiz adimidir.

### Sonuc
- Maliyet sorusu teknik olarak yanitlanabilir duruma getirildi; sonraki cevapta sayisal esitlik ve risk azaltma aksiyonlari verilecek.

### Sonraki Adim Icin Beklenen Onay
- Altyapi adimlarina kaldigimiz yerden devam.

## STEP-011 - Eski Projelerin Silinmesi (Kota Acma)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici onayina gore `sence-860e8` ve `nefes-36bf6` projelerini silerek yeni prod proje kotasi icin yer acmak.

### Calistirilan Komutlar (Ham)
1. `gcloud projects list --filter="projectId=('sence-860e8' OR 'nefes-36bf6')" --format="table(projectId,name,projectNumber,lifecycleState)"`
2. `gcloud projects delete sence-860e8 --quiet`
3. `gcloud projects delete nefes-36bf6 --quiet`
4. `gcloud projects list --filter="projectId=('sence-860e8' OR 'nefes-36bf6')" --format="table(...)"` (ilk kontrol)
5. `gcloud projects describe sence-860e8 --format="value(projectId,lifecycleState,createTime)"`
6. `gcloud projects describe nefes-36bf6 --format="value(projectId,lifecycleState,createTime)"`

### Bulgular
- Silme komutlari basarili calisti:
  - `Deleted .../projects/sence-860e8`
  - `Deleted .../projects/nefes-36bf6`
- `projects describe` sonucunda her iki proje icin lifecycle state:
  - `DELETE_REQUESTED`
- Bu, silme isleminin kabul edilip geri alinabilir pencereye girdigini gosterir.

### Hata Kaydi (Silinmez)
- Silme sonrasi ilk `projects list` kontrolunde projeler bir sure `ACTIVE` gorunmeye devam etti.
- Duzeltme: `projects describe` ile dogrudan lifecycle sorgulandi ve durum `DELETE_REQUESTED` olarak dogrulandi.

### Sonuc
- Kullanici talebi tamamlandi: iki eski proje silme surecine alindi.
- Prod proje olusturma icin kota acilmasi beklenebilir; propagation gecikmesi olasiligi vardir.

### Sonraki Adim Icin Beklenen Onay
- STEP-012: `neredeservis-prod` olusturma adimini tekrar deneyelim.

## STEP-010 - Prod Proje Olusturma Girisimi (Kota Engeli)
Tarih: 2026-02-17
Durum: Bloklandi (Kota)

### Amac
- `neredeservis-prod` projesini olusturup billing + API gate zincirini kapatmak.

### Calistirilan Komutlar (Ham)
1. `firebase projects:create neredeservis-prod --display-name "NeredeServis Prod"`
2. `Get-Content firebase-debug.log -Tail ...` (kök neden analizi)
3. `firebase apps:list --project neredeservis-prod --json`
4. `firebase projects:list`
5. `gcloud projects list --format=table(projectId,name,projectNumber,lifecycleState)`
6. `gcloud projects list --filter="projectId:neredeservis-*" --format=table(...)`

### Bulgular
- `firebase projects:create` denemesi fail verdi.
- Debug log kok neden:
  - `The project cannot be created because you have exceeded your allotted project quota.`
- `neredeservis-prod` olusmadi (Firebase app listeleme `PERMISSION_DENIED` / proje yok durumu).
- Hesapta aktif GCP proje sayisi yuksek; `gcloud projects list` ciktisinda Firebase disi ek projeler de gorunuyor.
- Mevcut NeredeServis ortamlari:
  - `neredeservis-dev` (hazir)
  - `neredeservis-stg` (hazir)
  - `neredeservis-prod` (olusturulamadi)

### Hata Kaydi (Silinmez)
- Ana hata: `project quota exceeded`.
- Bu, gecici komut hatasi degil; yonetsel kaynak kotasi engeli.

### Sonuc
- STEP-010 hedefi bu turda tamamlanamadi.
- Dev ve Staging saglam; Prod ortami icin kota acilmasi veya mevcut proje havuzunda yer acilmasi gerekiyor.

### Sonraki Adim Icin Beklenen Onay
- Blok acmak icin secim gerekli:
  1) Eski/kullanilmayan bir GCP projesini silip kotada yer acalim (onerilen, hizli yol).
  2) Google Cloud quota artisi talebi acalim (daha yavas).
  3) Gecici olarak mevcut bir projeyi prod olarak ayiralim (isim standardindan sapma riski).

## STEP-009 - Staging Proje Kurulumu + Billing Baglama + API Enable Gate
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- `neredeservis-stg` projesini olusturmak.
- Staging ortaminda billing bagini dogru kurup zorunlu Cloud API setini acmak.
- Kanit dosyasi ile API enable sonucunu kalici kaydetmek.

### Calistirilan Komutlar (Ham)
1. `firebase projects:create neredeservis-stg --display-name "NeredeServis Staging"`
2. `firebase apps:list --project neredeservis-stg`
3. `firebase apps:list --project neredeservis-stg --json`
4. `gcloud config set project neredeservis-stg`
5. `gcloud services enable ... --project=neredeservis-stg` (zorunlu API seti)
6. `gcloud billing projects describe neredeservis-dev`
7. `gcloud billing projects describe neredeservis-stg`
8. `gcloud billing accounts list`
9. `gcloud billing projects link neredeservis-stg --billing-account=01F9DF-7BF097-CE63A7`
10. `gcloud services enable ... --project=neredeservis-stg` (tekrar)
11. `required[]` set-karsilastirma dogrulamasi -> `ALL_REQUIRED_APIS_ENABLED`
12. `docs/firebase_api_enable_evidence.md` olusturma (`dev` + `stg` billing/API kaniti)

### Bulgular
- Staging proje basariyla olusturuldu:
  - `projectId: neredeservis-stg`
- Ilk API enable denemesi billing yok nedeniyle fail verdi.
- Root cause:
  - `neredeservis-dev`: billing bagli
  - `neredeservis-stg`: billing bagli degil
- Staging billing baglandiktan sonra API enable basariyla tamamlandi.
- Programatik dogrulama:
  - `neredeservis-stg` -> `ALL_REQUIRED_APIS_ENABLED`
- Kanit dosyasi:
  - `docs/firebase_api_enable_evidence.md`
  - `neredeservis-dev` ve `neredeservis-stg` icin billing+API durumu kayitli.

### Hata Kaydi (Silinmez)
- Ilk `services enable` denemesinde hata:
  - `FAILED_PRECONDITION: Billing account ... not found`
  - etkileyen servisler: `artifactregistry`, `cloudbuild`, `cloudscheduler`, `run`, `secretmanager` (ve bagli zincir)
- Duzeltme:
  - `gcloud billing accounts list` ile acik account bulundu.
  - `gcloud billing projects link neredeservis-stg --billing-account=01F9DF-7BF097-CE63A7` ile staging baglandi.
  - `services enable` tekrarlandi ve basarili oldu.
- `environment tag` uyarisi goruldu (bloklayici degil); sonraki governance adiminda eklenecek.

### Sonuc
- `staging` ortami artik billing ve zorunlu API seti acisindan hazir.
- Bir sonraki kritik adim `prod` proje olusturma ve ayni gate zincirinin uygulanmasi.

### Sonraki Adim Icin Beklenen Onay
- STEP-010: `neredeservis-prod` projesini olusturalim, billing baglayalim ve ayni API enable gate'ini kapatalim.

## STEP-008C - neredeservis-dev Zorunlu Cloud API Enable
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- `neredeservis-dev` icin runbook `037B/037C` kapsamindaki zorunlu API listesini acmak.
- Enable sonrasi kanit dogrulamasini almak.

### Calistirilan Komutlar (Ham)
1. `gcloud config set project neredeservis-dev`
2. `gcloud services enable cloudfunctions.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com eventarc.googleapis.com pubsub.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com firestore.googleapis.com firebasedatabase.googleapis.com identitytoolkit.googleapis.com --project=neredeservis-dev`
3. `gcloud services list --enabled --project=neredeservis-dev --format="value(config.name)"`
4. `required[]` listesi ile set-karsilastirma dogrulamasi (`ALL_REQUIRED_APIS_ENABLED`)

### Bulgular
- API enable operasyonu basarili tamamlandi (`operation ... finished successfully`).
- Zorunlu API seti tam:
  - cloudfunctions.googleapis.com
  - run.googleapis.com
  - cloudbuild.googleapis.com
  - artifactregistry.googleapis.com
  - eventarc.googleapis.com
  - pubsub.googleapis.com
  - cloudscheduler.googleapis.com
  - secretmanager.googleapis.com
  - firestore.googleapis.com
  - firebasedatabase.googleapis.com
  - identitytoolkit.googleapis.com
- Programatik dogrulama sonucu: `ALL_REQUIRED_APIS_ENABLED`

### Hata Kaydi (Silinmez)
- Ilk dogrulama denemesinde `rg` ile regex filtreleme sonucu bos dondu (exit code 1).
- Duzeltme: API listesi tam cekilip PowerShell set-karsilastirma ile eksik kontrolu yapildi; sonuc dogrulandi.
- `environment tag` uyarisi proje set adiminda gorundu; bloklayici degil, ayrica governance adiminda ele alinacak.

### Sonuc
- `dev` projesi icin API enable gate kapandi.
- Cloud Functions tarafi artik "API disabled" engeline takilmayacak.

### Sonraki Adim Icin Beklenen Onay
- STEP-009: `neredeservis-stg` projesini olusturalim ve ayni API enable zincirini staging icin uygulayalim.

## STEP-008B - gcloud Auth Gate Basariyla Tamamlandi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici tarafinda manuel `gcloud auth login` isleminin tamamlandigini dogrulamak.
- API enable adimina gecmek icin hesap/proje baglamini kilitlemek.

### Calistirilan Komutlar (Ham)
1. `gcloud auth login` (kullanici terminalinde manuel)
2. `gcloud auth list` (kullanici terminalinde manuel)
3. `gcloud config set project neredeservis-dev` (kullanici terminalinde manuel)
4. `gcloud config list --format="value(core.account,core.project)"` (kullanici terminalinde manuel)
5. `& gcloud.cmd auth list` (ajan terminalinde dogrulama)
6. `& gcloud.cmd config list --format="value(core.account,core.project)"` (ajan terminalinde dogrulama)

### Bulgular
- Auth basarili:
  - aktif hesap: `sinancnplt21@gmail.com`
- Aktif proje basarili:
  - `neredeservis-dev`
- API enable adimina gecis onkosulu saglandi.

### Hata Kaydi (Silinmez)
- `Project 'neredeservis-dev' lacks an 'environment' tag` uyarisi goruldu.
- Etki: bu adimda bloklayici degil; proje secimi ve auth tamamlandi.
- Aksiyon: Ortam etiketleri (Development/Staging/Production) sonraki governance adiminda eklenecek.

### Sonuc
- gcloud auth gate tamamlandi.
- Bir sonraki kritik adim: `neredeservis-dev` icin zorunlu Cloud API listesini enable etmek.

### Sonraki Adim Icin Beklenen Onay
- STEP-008C: `neredeservis-dev` projesinde zorunlu API enable komutlarini calistirayim.

## STEP-008A-3 - Auth Code Retry (Agent Terminal Limiti)
Tarih: 2026-02-17
Durum: Manuel Kullanici Adimi Bekliyor

### Amac
- Kullanicidan gelen yeni auth code ile gcloud auth adimini tekrar tamamlamak.

### Calistirilan Komutlar (Ham)
1. `$code | gcloud auth login --no-launch-browser` (yeni code ile)

### Bulgular
- Hata tekrarlandi: `(gcloud.auth.login) (invalid_grant) Malformed auth code`.
- Her denemede gcloud yeni `state/code_challenge` urettigi icin, bu ajan terminalinde non-interaktif code pipe akisi stabil degil.

### Hata Kaydi (Silinmez)
- Kok neden: ajan terminali "aynı auth oturumu acik kalip kod bekleme" davranisini tutamiyor (EOF/pipe kaynakli state uyumsuzlugu).
- Duzeltme plani (zorunlu):
  - `gcloud auth login` komutu kullanici tarafinda dogrudan interaktif terminalde bir kez calistirilacak.
  - Ardindan `gcloud auth list` kaniti alinacak.

### Sonuc
- API enable adimina gecmek icin manuel auth gate zorunlu hale geldi.

### Sonraki Adim Icin Beklenen Onay
- Kullanici asagidaki komutu kendi terminalinde calistirsin:
  - `C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd auth login`
- Sonra ciktidan aktif hesabin gorundugunu paylassin; ben API enable adimina devam edeyim.

## STEP-008A-2 - gcloud Auth Retry (Code Verifier Eslesme Sorunu)
Tarih: 2026-02-17
Durum: Kullanici Etkilesimi Bekliyor

### Amac
- Kullanicidan gelen yeni verification code ile gcloud auth adimini tamamlamak.

### Calistirilan Komutlar (Ham)
1. `$code | gcloud auth login --no-launch-browser` (PowerShell uzerinden)
2. `cmd /c "echo <code>|gcloud auth login --no-launch-browser"` (stdin farki icin alternatif deneme)

### Bulgular
- Ilk denemede hata: `invalid_grant / Malformed auth code`
- Ikinci denemede hata: `invalid_grant / Invalid code verifier`
- Hata tipi, kodun mevcut auth flow state/challenge ile eslesmedigini gosteriyor.

### Hata Kaydi (Silinmez)
- `Invalid code verifier` sebebiyle auth tamamlanamadi.
- Duzeltme:
  - Komut her calistiginda yeni URL+state uretiyor.
  - Kod mutlaka o anki son URL'den uretilmis olmalidir (eski kodlar gecersiz olur).

### Sonuc
- gcloud auth henuz tamamlanmadi; yeni ve eszamanli code girisi gerekli.

### Sonraki Adim Icin Beklenen Onay
- Kullaniciya son uretilen URL verilecek; bu URL'den alinan yeni kodla auth tekrar denenecek.

## STEP-008A-1 - gcloud Auth Code Girisi Denemesi (invalid_grant)
Tarih: 2026-02-17
Durum: Kullanici Etkilesimi Bekliyor

### Amac
- Kullanicidan gelen verification code ile `gcloud auth login` adimini tamamlamak.

### Calistirilan Komutlar (Ham)
1. `$gcloud = "C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd"; $code = "<REDACTED_AUTH_CODE>"; $code | & $gcloud auth login --no-launch-browser`

### Bulgular
- Komut yeni bir auth URL uretti.
- Girilen kodla oturum tamamlanamadi.

### Hata Kaydi (Silinmez)
- Hata: `(gcloud.auth.login) (invalid_grant) Malformed auth code`
- Olasi nedenler:
  - Kodun onceki auth oturumuna ait olmasi (state/code_challenge eslesmiyor)
  - Kopyalama sirasinda bosluk/satir sonu karakteri bozulmasi
- Duzeltme plani:
  - Yeni uretilen URL uzerinden tekrar auth alinacak
  - Kod tek satir ve bosluksuz sekilde tekrar girilecek

### Sonuc
- gcloud auth adimi henuz tamamlanmadi.

### Sonraki Adim Icin Beklenen Onay
- Kullanici yeni auth kodunu paylassin; ayni adim tekrar calistirilacak.

## STEP-008A - gcloud Auth Baslatma ve API Enable Onkosul Gate
Tarih: 2026-02-17
Durum: Kullanici Etkilesimi Bekliyor

### Amac
- Cloud API enable (Functions dahil) adimini baslatmak icin gcloud auth durumunu hazirlamak.
- Atlanamaz kritik gate olarak "gcloud auth + services enable + enabled-list kaniti" zincirini uygulamak.

### Calistirilan Komutlar (Ham)
1. `$gcloud = "C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd"; & $gcloud auth login --no-launch-browser`
2. `$gcloud = "C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd"; & $gcloud auth login --help`
3. `& 'C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd' --version`
4. `& 'C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd' auth list`
5. `& 'C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd' config list --format=json`
6. `apply_patch` -> `docs/firebase_platform_blueprint.md` (`Cloud API Enable Checklist (Non-Negotiable)`)
7. `apply_patch` -> `docs/NeredeServis_Cursor_Amber_Runbook.md` (`037B`, `037C`)

### Bulgular
- gcloud binary calisiyor (surum: `556.0.0`), ancak PATH'te degil.
- gcloud'da credential yok: `No credentialed accounts`.
- `auth login --no-launch-browser` URL uretti, ama terminal input alamadigi icin EOF ile sonlandi.
- Bu davranis beklenen: auth code girisi icin kullanici etkilisimi gerekiyor.

### Hata Kaydi (Silinmez)
- `auth login --no-launch-browser` komutu interaktif kod beklerken `EOF when reading a line` ile durdu.
- Teknik kok neden: bu ajan terminali auth code prompt'una canli giris yapamiyor.
- Duzeltme: URL browser'da acilacak, authorization code kullanicidan alinip komut yeniden kodlu sekilde calistirilacak.

### Sonuc
- Cloud API enable oncesi zorunlu gcloud auth gate'i tetiklendi.
- Sonraki adim kullanici code girisi tamamlaninca ayni adimdan devam edecek.

### Sonraki Adim Icin Beklenen Onay
- Kullanici browser auth kodunu paylassin; sonra `gcloud auth login` tamamlanip API enable komutlari calistirilacak.

## STEP-007A - Blaze Gecisi Sonrasi Teknik Dogrulama Notu
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici beyanina gore Blaze gecisini kayda almak.
- Bu makinede billing dogrulama araclari durumunu test etmek ve izlenebilir not dusmek.

### Calistirilan Komutlar (Ham)
1. `gcloud --version`
2. `firebase functions:list --project neredeservis-dev`
3. `firebase --debug functions:list --project neredeservis-dev`
4. `firebase --help | Select-String -Pattern "billing|plan"`
5. `apply_patch` -> `docs/firebase_platform_blueprint.md` (snapshot billing notu)

### Bulgular
- `gcloud` bu makinede kurulu degil (`command not found`), bu nedenle Cloud Billing API ile dogrudan CLI dogrulamasi yapilamadi.
- `functions:list` denemesi `Cloud Functions API disabled` nedeniyle fail verdi (billing hatasi degil, servis etkinlestirme durumu).
- Firebase CLI yardim cikisinda billing/plans icin dogrudan komut bulunmadi.
- Blueprint snapshot billing satiri kullanici beyanina gore guncellendi; teknik dogrulama beklemede notu eklendi.

### Hata Kaydi (Silinmez)
- `gcloud --version` komutu bu ortamda yok.
- `firebase projects:get neredeservis-dev` komutu daha once yanlis denenmisti; Firebase CLI komutu degil.
- `functions:list` ilk denemede detay vermedi; `--debug` ile kok neden `Cloud Functions API disabled` olarak netlesti.

### Sonuc
- Blaze gecisi kullanici beyaniyla kabul edildi, ancak bu makinede billing API teknik kaniti (gcloud) henuz yok.
- Sonraki adimda staging/prod proje olusturup Firebase tarafini tamamlayarak API enable/deploy asamasinda billing durumunu pratikte de dogrulayacagiz.

### Sonraki Adim Icin Beklenen Onay
- STEP-008: `neredeservis-stg` projesini olusturalim.

## STEP-007B - gcloud Kurulum/Path Kontrolu ve Cloud API Enable Hazirligi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici talebine gore gcloud durumunu tekrar kontrol etmek.
- Cloud Functions API enable akisinin teknik onkosullarini hazirlamak.
- "atlanamaz" API checklist'ini dokumanlara zorunlu gate olarak eklemek.

### Calistirilan Komutlar (Ham)
1. `gcloud --version`
2. `gcloud auth list`
3. `gcloud config list --format=json`
4. `Get-ChildItem ... gcloud.cmd` aramalari (`Program Files`, `AppData\\Local`, aday pathler)
5. `where.exe gcloud`
6. `winget search --source winget "Google Cloud SDK"`
7. `winget list --id Google.CloudSDK`
8. `winget install --id Google.CloudSDK --accept-package-agreements --accept-source-agreements` (timeout)
9. `winget install --id Google.CloudSDK --accept-package-agreements --accept-source-agreements` (ikinci deneme, baska installer bekleme + iptal)
10. `winget list --id Google.CloudSDK` (kurulu kaydi)
11. `& 'C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd' --version`
12. `& 'C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd' auth list`
13. `& 'C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd' config list --format=json`
14. `apply_patch` -> `docs/firebase_platform_blueprint.md` (API enable non-negotiable checklist)
15. `apply_patch` -> `docs/NeredeServis_Cursor_Amber_Runbook.md` (`037B`, `037C`)

### Bulgular
- `gcloud` sistem PATH'inde degildi, bu nedenle `gcloud` kisa komutlari bulunamadi.
- Gcloud binary bulundu:
  - `C:\\Users\\sinan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd`
- Tam path ile gcloud surumu dogrulandi:
  - `Google Cloud SDK 556.0.0`
- Gcloud tarafinda aktif credential yok:
  - `No credentialed accounts`
- Cloud API enable adimina gecmeden once `gcloud auth login` zorunlu.
- Runbook ve blueprint'e "non-negotiable API enable checklist" eklendi.

### Hata Kaydi (Silinmez)
- Ilk `winget install` denemesi timeout oldu.
- Ikinci `winget install` denemesinde uzun sure "another install/uninstall" bekledi; sonra kurulum UAC asamasinda kullanici tarafindan iptal edildi (`0x800704c7`).
- Buna ragmen gcloud binary'si dosya sisteminde mevcut, ancak PATH ve auth tamamlanmamis.

### Sonuc
- Cloud Functions API enable akisinin teknik yolu net:
  1) gcloud auth login
  2) project set
  3) zorunlu API listesi enable
  4) enabled-list kaniti
- Bu gate artik dokumanlarda zorunlu ve atlanamaz olarak kilitlendi.

### Sonraki Adim Icin Beklenen Onay
- STEP-008A: `gcloud auth login` yapalim ve `neredeservis-dev` icin zorunlu API listesini acalim.

## STEP-007 - Firebase Dev Projesinin Olusturulmasi (Spark-First)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici onayina gore (personal hesap, billing yok) Firebase `dev` projesini olusturmak.
- Kurulumun Spark-first modda devam edecegini teknik olarak kayda almak.

### Calistirilan Komutlar (Ham)
1. `firebase projects:create neredeservis-dev --display-name "NeredeServis Dev"`
2. `firebase projects:list`
3. `firebase projects:list --json`
4. `firebase apps:list --project neredeservis-dev`
5. `firebase projects:get neredeservis-dev` (hata)
6. `firebase apps:list --project neredeservis-dev --json`
7. `apply_patch` -> `docs/firebase_platform_blueprint.md` (Spark-first + karar snapshot)
8. `apply_patch` -> `docs/NeredeServis_Cursor_Amber_Runbook.md` (`037A` billing gate)

### Bulgular
- `neredeservis-dev` basariyla olusturuldu (CLI create sonucu green).
- `firebase apps:list --project neredeservis-dev` komutu proje erisimini dogruladi (`No apps found` = beklenen durum).
- `projects:list` ciktisinda yeni projenin gec gorunmesi olasiligina karsi `apps:list --project` ile dogrudan dogrulama yontemi benimsendi.
- Spark-first mod netlestirildi:
  - Billing yokken Functions/Scheduler deploy adimlari "billing sonrasi" gate'ine alinacak.

### Hata Kaydi (Silinmez)
- `firebase projects:get neredeservis-dev` komutu denendi; CLI'da gecersiz oldugu icin hata verdi (`projects:get is not a Firebase command`).
- Duzeltme: proje varligi `firebase apps:list --project neredeservis-dev --json` ile dogrulandi.

### Sonuc
- `dev` ortami olusturuldu ve proje varligi dogrulandi.
- Billing olmadan ilerleme modeli (Spark-first) blueprint + runbook'a resmi olarak islendi.

### Sonraki Adim Icin Beklenen Onay
- STEP-008: `staging` projesini olusturalim (`neredeservis-stg`), sonra durup onay isteyeyim.

## STEP-005 - Firebase CLI Hazirlik ve Erisim Dogrulamasi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Terminalde Firebase CLI'nin calistigini, aktif login hesabini ve erisilebilir proje listesini dogrulamak.
- Faz B'ye gecmeden once yerel arac seti ve hesap baglanti durumunu netlestirmek.

### Calistirilan Komutlar (Ham)
1. `firebase --version`
2. `firebase login:list`
3. `firebase projects:list`

### Bulgular
- Firebase CLI surumu: `15.4.0`
- Aktif login: `sinancnplt21@gmail.com`
- Erisilebilen proje sayisi: `5`
  - `avukat-47678`
  - `nefes-36bf6`
  - `sence-860e8`
  - `sonodeme-app`
  - `vicdan-fb7e7`
- Firebase komutlari basarili ve proje listeleme yetkisi mevcut.

### Hata Kaydi (Silinmez)
- `firebase login:list` ve `firebase projects:list` cikislarinda `firebase-tools update check failed` uyarisi goruldu.
- Uyari metni yerel update config izinlerini (`C:\Users\sinan\.config`) isaret ediyor.
- Etki: bloklayici degil; komutlar 0 exit code ile basariyla tamamlandi.
- Duzeltme durumu: bu adimda duzeltme uygulanmadi; ileride CLI guncelleme ihtiyaci olursa ayrica ele alinacak.

### Sonuc
- STEP-005 hedefi tamamlandi; Firebase terminal erisimi hazir.
- Sonraki adim olarak yeni `dev/staging/prod` proje olusturma planina gecebiliriz.

### Sonraki Adim Icin Beklenen Onay
- STEP-006: Firebase proje ad/ID kararlarini kilitleyelim, sonra proje olusturmaya gecelim.

## STEP-006 - Uzun Omurlu Firebase Kurulum Tasariminin Kilitlenmesi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici onayi ile isim kokunu (`neredeservis`) sabitleyip, uzun omurlu Firebase/GCP platform tasarimini yazmak.
- Kurulum adimlari baslamadan once naming, IAM, budget, backup, App Check ve operasyon modelini tek dokumanda kilitlemek.

### Calistirilan Komutlar (Ham)
1. `rg -n "Firebase|FAZ B|project|App Check|IAM|budget|Secret Manager|europe-west3|monitor|backup|disaster" docs/NeredeServis_Cursor_Amber_Runbook.md docs/NeredeServis_Teknik_Plan.md docs/security_gate.md docs/runbook_diff_report.md`
2. `Get-Content docs/security_gate.md -TotalCount 240`
3. `Get-Content docs/NeredeServis_Teknik_Plan.md | Select-Object -Skip 1050 -First 150`
4. `apply_patch` -> `docs/firebase_platform_blueprint.md` (yeni dosya)
5. `apply_patch` -> `docs/NeredeServis_Cursor_Amber_Runbook.md` (FAZ B'ye blueprint baglayici adimlar)
6. `apply_patch` -> `docs/NeredeServis_Teknik_Plan.md` (`1.7 Firebase platform governance` bolumu)
7. `rg -n "firebase_platform_blueprint|034A|034B|038A|041A" docs/NeredeServis_Cursor_Amber_Runbook.md`
8. `rg -n "1.7 Firebase platform governance|firebase_platform_blueprint|keyless deploy" docs/NeredeServis_Teknik_Plan.md`
9. `Get-Content docs/firebase_platform_blueprint.md -TotalCount 260`

### Bulgular
- Uzun omurlu platform dokumani olusturuldu: `docs/firebase_platform_blueprint.md`
- Runbook FAZ B, bu blueprint ile baglandi:
  - `034A`: blueprint tabanli platform karari kilidi
  - `034B`: org/folder + billing + fallback + region onayi
  - `038A`: budget alarmlari
  - `041A`: service account baseline
- Teknik plana governance baglantisi eklendi:
  - `docs/NeredeServis_Teknik_Plan.md` -> `1.7 Firebase platform governance`

### Hata Kaydi (Silinmez)
- Bu adimda komut/patch hatasi yok.

### Sonuc
- Firebase kurulumu artik sadece "proje acma" degil, operasyonel olarak uzun omurlu bir platform modeliyle kilitlendi.
- Proje olusturma adimina gecmeden once eksik yonetsel onaylar net kaldiraclara indirildi.

### Sonraki Adim Icin Beklenen Onay
- STEP-007: Gercek Firebase proje olusturma adimina gecelim.
- Bu adim icin senden gerekli net bilgiler:
  1) Organization/Folder kullanacak miyiz, personal hesap altinda mi acalim?
  2) Billing account secimi nedir? (staging/prod icin baglayacagiz)
  3) Project ID fallback (`-01`) politikasini onayliyor musun?
  4) Region `europe-west3` kilidi kesin onay mi?

## STEP-004B - Onboarding Video Fazlama Kararinin Dokumanlara Islenmesi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Onboarding/video giris ekranini "en sona birakma" riskini kapatmak.
- Runbook + Teknik Plan + UI Spec uzerinde 3 asamali uygulama sirasini netlestirmek:
  1) Erken asama shell
  2) Core stabil olunca gercek video
  3) Release yakini performans/polish

### Calistirilan Komutlar (Ham)
1. `Get-ChildItem -Path docs -File | Select-Object -ExpandProperty Name`
2. `Get-Content docs/NeredeServis_Cursor_Amber_Runbook.md -TotalCount 260`
3. `Get-Content docs/NeredeServis_Teknik_Plan.md -TotalCount 260`
4. `rg -n "onboard|onboarding|video|giris|login|splash|auth" docs/NeredeServis_Cursor_Amber_Runbook.md docs/NeredeServis_Teknik_Plan.md docs/NeredeServis_UrunStratejisi.md`
5. `Get-Content docs/NeredeServis_Cursor_Amber_Runbook.md | Select-Object -Skip 260 -First 220`
6. `Get-Content docs/NeredeServis_Cursor_Amber_Runbook.md | Select-Object -Skip 560 -First 260`
7. `Get-Content docs/NeredeServis_Teknik_Plan.md | Select-Object -Skip 700 -First 240`
8. `Get-Content docs/NeredeServis_Teknik_Plan.md | Select-Object -Skip 960 -First 90`
9. `apply_patch` -> `docs/NeredeServis_Cursor_Amber_Runbook.md` (3.13 + FAZ D/G/H onboarding video adimlari)
10. `apply_patch` -> `docs/NeredeServis_Teknik_Plan.md` (6.7 onboarding video kontrati)
11. `apply_patch` -> `docs/NeredeServis_Teknik_Plan.md` (8.3 test listesi + P0 checklist onboarding maddesi)
12. `apply_patch` -> `docs/ui_amber_spec.md` (Splash/Hook ve motion kurali guncellemesi)
13. `rg -n "3.13 Onboarding Video|152A|352G|390A|401G" docs/NeredeServis_Cursor_Amber_Runbook.md`
14. `rg -n "6.7 Onboarding video|Onboarding video shell testi|Onboarding video fail-safe fallback" docs/NeredeServis_Teknik_Plan.md`
15. `rg -n "Video onboarding uses phased rollout|Video failure must fallback|reduced-motion" docs/ui_amber_spec.md`

### Hata Kaydi (Silinmez)
- `docs/NeredeServis_Teknik_Plan.md` fonksiyonel test listesine ilk patch denemesi context mismatch nedeniyle basarisiz oldu.
- Duzeltme: hedef satir tekil context ile yeniden patchlendi ve degisiklikler basariyla uygulandi.

### Yapilan Degisiklikler
- `docs/NeredeServis_Cursor_Amber_Runbook.md`
  - `3.13 Onboarding Video Entegrasyon Zamani Kurali` eklendi.
  - FAZ D'ye erken asama `video-ready shell` + fail-safe + performans dogrulama adimlari eklendi (`152A-152D`).
  - FAZ G'ye gercek video entegrasyonu + cihaz performans testi + kullanici onayi eklendi (`352G-352J`).
  - FAZ H'ye release varlik sabitleme + final performans gate eklendi (`390A`, `401G`).
- `docs/NeredeServis_Teknik_Plan.md`
  - `6.7 Onboarding video entegrasyon kontrati` eklendi (3 asama + fail-safe + performans + erisilebilirlik + dagitim).
  - `8.3 Fonksiyonel test senaryolari`na onboarding video fallback/perf testleri eklendi.
  - `11) V1.0 P0 Checklist`e onboarding video fail-safe maddesi eklendi.
- `docs/ui_amber_spec.md`
  - Splash/Hook kontratina phased video rollout + fallback + muted policy eklendi.
  - Motion kurallarina reduced-motion fallback eklendi.

### Sonuc
- Video onboarding artik "sona birakilan kozmetik is" degil; planli teknik fazlarin parcasi.
- Dokumanlar arasi (Runbook/Teknik/UI Spec) senkron kurallar olustu.
- Kritik koruma netlesti: video bozulsa bile onboarding/auth akisi durmayacak.

### Sonraki Adim Icin Beklenen Onay
- STEP-005: Firebase terminal hazirlik adimlarina gecelim:
  1) `firebase --version` kontrolu
  2) `firebase login:list` kontrolu
  3) `firebase projects:list` erisim dogrulamasi
  4) Ardindan senden proje adlari/ID formati onayi isteyecegim

## STEP-015 - Zorunlu Cloud API Enable (dev/stg/prod) + Kanit Guncelleme
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Uc ortamda (dev/stg/prod) Functions/Run/Event altyapisini calistirmak icin zorunlu API setini acmak.
- API enable + billing dogrulama kanitini dokumante etmek.

### Calistirilan Komutlar (Ham)
1. `Get-ChildItem docs -File`
2. `Get-Content docs/firebase_api_enable_evidence.md -TotalCount 220`
3. `$gcloud auth list`
4. `$gcloud services enable cloudfunctions.googleapis.com run.googleapis.com artifactregistry.googleapis.com eventarc.googleapis.com pubsub.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project neredeservis-dev-01`
5. `$gcloud services enable cloudfunctions.googleapis.com run.googleapis.com artifactregistry.googleapis.com eventarc.googleapis.com pubsub.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project neredeservis-stg-01`
6. `$gcloud services enable cloudfunctions.googleapis.com run.googleapis.com artifactregistry.googleapis.com eventarc.googleapis.com pubsub.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project neredeservis-prod-01`
7. `$gcloud services list --enabled --project <projectId> --format='value(config.name)'` (3 proje icin required set dogrulamasi)
8. `$gcloud billing projects describe neredeservis-dev-01`
9. `$gcloud billing projects describe neredeservis-stg-01`
10. `$gcloud billing projects describe neredeservis-prod-01`
11. `Set-Content docs/firebase_api_enable_evidence.md` (guncel kanit yazimi)

### Hata Kaydi (Silinmez)
- `firebase_api_enable_evidence.md` ilk `apply_patch` denemesi context mismatch nedeniyle basarisiz oldu.
- Duzeltme:
  - Dosya icerigi `Set-Content` ile tam ve guncel formatta yeniden yazildi.

### Bulgular
- API enable islemi uc projede de basariyla tamamlandi.
- Required API dogrulamasi:
  - `neredeservis-dev-01`: `ALL_ENABLED`
  - `neredeservis-stg-01`: `ALL_ENABLED`
  - `neredeservis-prod-01`: `ALL_ENABLED`
- Billing dogrulamasi:
  - Uc projede de `billingEnabled: true`
  - Billing account: `billingAccounts/01F9DF-7BF097-CE63A7`
- Kanit dosyasi guncellendi:
  - `docs/firebase_api_enable_evidence.md`

### Sonuc
- Faz B'nin kritik altyapi gate'i (billing + zorunlu API seti) yeni hesapta basariyla kapatildi.
- Functions/Secrets/App deployment adimlarina gecmek icin platform hazir.

### Sonraki Adim Icin Beklenen Onay
- STEP-016: Firebase proje alias ve local config baglama (`.firebaserc` + `firebase use --add`) adimina gecelim.

## STEP-015A - Ortam Son Dogrulama (3 Proje Seti)
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Yeni hesapta sadece hedef 3 ortam projesinin aktif kaldigini dogrulamak.

### Calistirilan Komutlar (Ham)
1. `$gcloud projects list --filter='projectId:neredeservis-*' --format='table(projectId,name,lifecycleState)'`

### Bulgular
- Aktif proje seti net olarak 3 proje:
  - `neredeservis-dev-01`
  - `neredeservis-stg-01`
  - `neredeservis-prod-01`

### Sonuc
- Ortam naming ve proje seti stabil.
- Sonraki faza gecis icin platform tarafi temiz.

## STEP-016 - Firebase Local Alias ve Repo Config Kilidi
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Bu repository'yi Firebase CLI tarafinda tanimli proje dizinine cevirmek.
- `dev/stg/prod` aliaslarini kalici olarak kilitlemek.

### Calistirilan Komutlar (Ham)
1. `Get-ChildItem -Force`
2. `Get-Content .firebaserc` (dosya yok kontrolu)
3. `Get-Content firebase.json` (dosya yok kontrolu)
4. `firebase use --alias dev neredeservis-dev-01`
5. `firebase use --alias stg neredeservis-stg-01`
6. `firebase use --alias prod neredeservis-prod-01`
7. `Set-Content .firebaserc` (alias mapping yazimi)
8. `Set-Content firebase.json` (minimal firebase proje config)
9. `firebase use dev`
10. `firebase use stg`
11. `firebase use prod`
12. `firebase use`
13. `firebase use dev`
14. `firebase use`
15. `Get-Content .firebaserc`
16. `Get-Content firebase.json`

### Hata Kaydi (Silinmez)
- Ilk denemede `firebase use --alias ...` komutlari su hatayi verdi:
  - `firebase use must be run from a Firebase project directory.`
- Duzeltme:
  - Repository kokune `.firebaserc` ve minimal `firebase.json` eklendi.
- Ek not:
  - `firebase use dev/stg/prod` komutlari ayni turde birlikte calistirildiginda aktif alias sonucu deterministik degil.
  - Duzeltme: son durumda aktif alias bilincli olarak `firebase use dev` ile sabitlendi.

### Yapilan Dosya Degisiklikleri
- `.firebaserc` olusturuldu:
  - `default -> neredeservis-dev-01`
  - `dev -> neredeservis-dev-01`
  - `stg -> neredeservis-stg-01`
  - `prod -> neredeservis-prod-01`
- `firebase.json` olusturuldu (minimal):
  - `{ "emulators": {} }`

### Bulgular
- Firebase CLI artik bu repository'de proje dizini olarak calisiyor.
- Aktif alias son durumda: `dev` (`neredeservis-dev-01`).

### Sonuc
- Local Firebase hedefleme kilitlendi; yanlis projeye deploy etme riski azaldi.

### Sonraki Adim Icin Beklenen Onay
- STEP-017: Firebase temel servislerini (Firestore, RTDB, Storage, Hosting) proje bazinda dev/stg icin bootstrap edelim ve kural dosyalarini repo icine olusturalim.

## STEP-017 - Firebase Servis Bootstrap (Rules/Indexes + DB Kurulumu)
Tarih: 2026-02-17
Durum: Tamamlandi (Storage console bootstrap bekliyor)

### Amac
- Tum ortamlarda (dev/stg/prod) Firestore + RTDB altyapisini bolge/kural uyumlu kurmak.
- Repository tarafinda Firebase konfig dosyalarini teknik planla birebir kilitlemek.
- dev/stg/prod guvenlik kurallarini deploy etmek.

### Calistirilan Komutlar (Ham)
1. `gcloud firestore databases list` (dev/stg/prod mevcut durum)
2. `firebase database:instances:list` (dev/stg/prod mevcut durum)
3. `firebase hosting:sites:list --json` (dev/stg/prod)
4. `gcloud storage buckets list` (dev/stg/prod)
5. `gcloud services enable firestore.googleapis.com firebasedatabase.googleapis.com identitytoolkit.googleapis.com cloudscheduler.googleapis.com --project <dev|stg|prod>`
6. `gcloud firestore databases create --location=europe-west3 --type=firestore-native --project <dev|stg|prod>`
7. `firebase database:instances:create <instance> --location=europe-west3 --project <dev>` (ilk deneme)
8. `firebase init database --project neredeservis-dev-01` (non-interactive deneme)
9. `Invoke-RestMethod POST https://firebasedatabase.googleapis.com/v1beta/projects/<projectNumber>/locations/<location>/instances?databaseId=<dbId>`
   - type/user-project header varyasyonlari ile (asagidaki hata kaydinda)
10. `Invoke-RestMethod ... location=europe-west1, type=DEFAULT_DATABASE` (dev/stg/prod icin basarili create)
11. `firebase deploy --only firestore:rules,firestore:indexes,database,storage --project dev`
12. `firebase deploy --only firestore:rules,firestore:indexes,database,storage --project stg`
13. `firestore.indexes.json` icinden gereksiz srvCode composite index temizligi
14. `firebase deploy --only firestore:rules,firestore:indexes,database,storage --project dev` (tekrar)
15. `firebase deploy --only firestore:rules,firestore:indexes,database,storage --project stg` (tekrar)
16. `firebase deploy --only database --project dev`
17. `firebase deploy --only database --project stg`
18. `firebase deploy --only storage --project dev`
19. `firebase deploy --only storage --project stg`
20. `gcloud services list --enabled` (required API set + storage API kontrol)
21. `gcloud firestore databases list` (dev/stg/prod)
22. `firebase database:instances:list` (dev/stg/prod)
23. `gcloud services enable firebasestorage.googleapis.com --project neredeservis-prod-01`
24. `firebase deploy --only firestore:rules,firestore:indexes,database --project prod`
25. `firebase deploy --only database --project prod`
26. `firebase deploy --only storage --project prod`
27. Repo config dosyalarinin yazimi:
   - `.firebaserc`
   - `firebase.json`
   - `firestore.rules`
   - `database.rules.json`
   - `firestore.indexes.json`
   - `storage.rules`

### Hata Kaydi (Silinmez)
- Firestore API ilk kontrolde kapaliydi (`SERVICE_DISABLED`).
  - Duzeltme: API seti acildi (`firestore.googleapis.com`).
- `firebase database:instances:create` ilk instance icin CLI'da bloke oldu:
  - `Please run firebase init database to create your default Realtime Database instance.`
  - `firebase init database` non-interactive ortamda tamamlanmadi.
  - Duzeltme: Firebase Management REST API ile default RTDB instance olusturuldu.
- RTDB REST create denemelerinde ara hatalar:
  1) `PERMISSION_DENIED` (quota project header eksigi benzeri) -> `x-goog-user-project` eklendi.
  2) `Invalid location "europe-west3"` -> RTDB'nin bu lokasyonu desteklemedigi dogrulandi.
  3) `Non-default namespaces cannot end with '-default-rtdb'` (type USER_DATABASE ile) -> default instance icin `type=DEFAULT_DATABASE` kullanildi.
- Firestore index deploy ilk denemede hata verdi:
  - `this index is not necessary, configure using single field index controls`
  - Duzeltme: `routes.srvCode` composite index kaldirildi (single-field index implicit).
- Storage deploy (dev/stg/prod) hatasi:
  - `Firebase Storage has not been set up ... click 'Get Started'`
  - Duzeltme: `firebasestorage.googleapis.com` API acildi, fakat Storage bootstrap icin Console `Get Started` adimi hala zorunlu.

### Yapilan Dosya Degisiklikleri
- `.firebaserc`: env aliases + hosting target map eklendi.
- `firebase.json`: firestore/database/storage/hosting/emulator konfig eklendi.
- `firestore.rules`: Teknik Plan 4.2 ozetine uyumlu strict read/write kurallari.
- `database.rules.json`: Teknik Plan 4.3 ozetine uyumlu live window (`now-30000..now+5000`) ve routeWriters/guestReaders kontrolleri.
- `firestore.indexes.json`: Teknik Plan 2.4 ile uyumlu composite indexler (gecersiz srvCode composite kaldirildi).
- `storage.rules`: deny-all baseline.
- `docs/firebase_api_enable_evidence.md`: guncel ortam/API/DB kaniti ile yeniden yazildi.

### Bulgular
- Firestore `(default)` DB olustu:
  - dev/stg/prod -> `location=europe-west3`.
- RTDB default instance olustu:
  - dev: `neredeservis-dev-01-default-rtdb`
  - stg: `neredeservis-stg-01-default-rtdb`
  - prod: `neredeservis-prod-01-default-rtdb`
  - lokasyon: `europe-west1` (RTDB `europe-west3` desteklemiyor).
- Firestore rules + indexes deploy:
  - dev/stg/prod basarili.
- RTDB rules deploy:
  - dev/stg/prod basarili.
- Storage rules deploy:
  - dev/stg/prod basarisiz (Storage urunu console'da initialize edilmedigi icin).
- Required API set (Runbook 037B + storage API) all-enabled.

### Sonuc
- Step-017 hedefi buyuk oranda kapandi: Firestore ve RTDB altyapisi + kurallari tum ortamlarda aktif.
- Tek acik kalan teknik gate: Firebase Storage urun bootstrap (`Console -> Storage -> Get Started`).

### Sonraki Adim Icin Beklenen Onay
- STEP-018:
  1) Sen dev/stg/prod icin Firebase Console'da Storage `Get Started` adimini tamamla.
  2) Ben storage rules deploy + final dogrulama + kanit dosyasi guncellemesini yapayim.

## STEP-018 - Storage Bootstrap Tamamlama + Storage Rules Deploy
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- Kullanici tarafinda tamamlanan Storage `Get Started` adimindan sonra tum ortamlarda storage.rules deploy etmek.
- Storage lokasyon/mod seciminin teknik planla uyumunu kanitlamak.

### Calistirilan Komutlar (Ham)
1. `$gcloud storage buckets list --project neredeservis-dev-01 --format='table(name,location,locationType,storageClass)'`
2. `$gcloud storage buckets list --project neredeservis-stg-01 --format='table(name,location,locationType,storageClass)'`
3. `$gcloud storage buckets list --project neredeservis-prod-01 --format='table(name,location,locationType,storageClass)'`
4. `firebase deploy --only storage --project dev`
5. `firebase deploy --only storage --project stg`
6. `firebase deploy --only storage --project prod`
7. `docs/firebase_api_enable_evidence.md` guncellemesi

### Bulgular
- Storage bucket'lar olustu ve 3 ortamda da lokasyon tutarli:
  - dev: `neredeservis-dev-01.firebasestorage.app` -> `EUROPE-WEST3` (region)
  - stg: `neredeservis-stg-01.firebasestorage.app` -> `EUROPE-WEST3` (region)
  - prod: `neredeservis-prod-01.firebasestorage.app` -> `EUROPE-WEST3` (region)
- Storage rules deploy sonucu:
  - dev: success
  - stg: success
  - prod: success

### Hata Kaydi (Silinmez)
- Bu adimda hata yok.

### Sonuc
- STEP-017'de acik kalan Storage bootstrap gate tamamen kapandi.
- Firestore + RTDB + Storage kurallari tum ortamlarda aktif.
- Platform tarafinda FAZ B bootstrap adimlari release-grade seviyede kilitlendi.

### Sonraki Adim Icin Beklenen Onay
- STEP-019: App kayitlari + Firebase app config dosyalari (`google-services.json`, `GoogleService-Info.plist`, `flutterfire configure`) adimina gecelim.

## STEP-019 - Android/iOS Firebase App Kayitlari + SDK Config Indirme
Tarih: 2026-02-17
Durum: Tamamlandi

### Amac
- 3 ortam icin (dev/stg/prod) Android ve iOS Firebase app kayitlarini acmak.
- Package/bundle kimliklerini flavor stratejisine gore kilitlemek.
- Her ortam icin `google-services.json` ve `GoogleService-Info.plist` dosyalarini indirmek.

### Package/Bundle Karari (Kilit)
- Base: `com.neredeservis.app`
- dev: `com.neredeservis.app.dev`
- stg: `com.neredeservis.app.stg`
- prod: `com.neredeservis.app`

### Calistirilan Komutlar (Ham)
1. `firebase apps:list --project neredeservis-dev-01 --json`
2. `firebase apps:list --project neredeservis-stg-01 --json`
3. `firebase apps:list --project neredeservis-prod-01 --json`
4. `firebase --json apps:create ANDROID "NeredeServis Android Dev" --package-name com.neredeservis.app.dev --project neredeservis-dev-01`
5. `firebase --json apps:create IOS "NeredeServis iOS Dev" --bundle-id com.neredeservis.app.dev --project neredeservis-dev-01`
6. `firebase --json apps:create ANDROID "NeredeServis Android Staging" --package-name com.neredeservis.app.stg --project neredeservis-stg-01`
7. `firebase --json apps:create IOS "NeredeServis iOS Staging" --bundle-id com.neredeservis.app.stg --project neredeservis-stg-01`
8. `firebase --json apps:create ANDROID "NeredeServis Android Prod" --package-name com.neredeservis.app --project neredeservis-prod-01`
9. `firebase --json apps:create IOS "NeredeServis iOS Prod" --bundle-id com.neredeservis.app --project neredeservis-prod-01`
10. `firebase apps:sdkconfig ANDROID <appId> --project <project> --out firebase_app_configs/<env>/google-services.json`
11. `firebase apps:sdkconfig IOS <appId> --project <project> --out firebase_app_configs/<env>/GoogleService-Info.plist`
12. `firebase apps:list --project <dev|stg|prod> --json` (post-check)

### Bulgular
- Toplam 6 app kaydi basarili:
  - dev: Android + iOS
  - stg: Android + iOS
  - prod: Android + iOS
- Config dosyalari indirildi:
  - `firebase_app_configs/dev/google-services.json`
  - `firebase_app_configs/dev/GoogleService-Info.plist`
  - `firebase_app_configs/stg/google-services.json`
  - `firebase_app_configs/stg/GoogleService-Info.plist`
  - `firebase_app_configs/prod/google-services.json`
  - `firebase_app_configs/prod/GoogleService-Info.plist`
- App kimlikleri ve mapping kaydi olusturuldu:
  - `docs/firebase_app_registry.md`

### Hata Kaydi (Silinmez)
- Bu adimda hata yok.

### Sonuc
- Firebase app katmani (Android+iOS, dev/stg/prod) tamamlandi.
- Flutter flavor tarafi icin gerekli config varliklari hazir.

### Sonraki Adim Icin Beklenen Onay
- STEP-020:
  1) Flutter proje iskeletini olusturma (heniz repository'de Flutter app yok).
  2) App flavor yapisini kurma (dev/stg/prod).
  3) Indirilen config dosyalarini dogru platform/flavor klasorlerine yerlestirme.
  4) Sonra `flutterfire configure` ile `firebase_options.dart` uretme.

## STEP-020 - Flutter Flavor Iskeleti + Firebase Runtime Bootstrap
Tarih: 2026-02-17
Durum: Tamamlandi (iOS multi-scheme ayri adima birakildi)

### Amac
- Flutter app iskeletini FVM kilidine uygun sekilde olusturmak.
- Android flavor yapisini (dev/stg/prod) package kimlikleri ile aktif etmek.
- Firebase runtime baslatmayi ortam bazli hale getirmek.
- Firebase config varliklarini dogru dizinlere yerlestirmek.

### Calistirilan Komutlar (Ham)
1. `fvm flutter create . --project-name neredeservis --org com.neredeservis --platforms android,ios`
2. Android flavor gradle konfigurasyonu yazimi (`android/settings.gradle`, `android/app/build.gradle`)
3. `Copy-Item firebase_app_configs/<env>/google-services.json android/app/src/<env>/google-services.json`
4. `dart pub global activate flutterfire_cli`
5. `flutterfire configure --project=neredeservis-dev-01 --platforms=android,ios --android-package-name=com.neredeservis.app.dev --ios-bundle-id=com.neredeservis.app.dev --out=lib/firebase/firebase_options_dev.dart`
6. `flutterfire configure --project=neredeservis-stg-01 --platforms=android,ios --android-package-name=com.neredeservis.app.stg --ios-bundle-id=com.neredeservis.app.stg --out=lib/firebase/firebase_options_stg.dart`
7. `flutterfire configure --project=neredeservis-prod-01 --platforms=android,ios --android-package-name=com.neredeservis.app --ios-bundle-id=com.neredeservis.app --out=lib/firebase/firebase_options_prod.dart`
8. `fvm flutter pub get`
9. `fvm flutter build apk --debug --flavor dev --dart-define=APP_FLAVOR=dev -t lib/main.dart`
10. `fvm flutter build apk --debug --flavor stg --dart-define=APP_FLAVOR=stg -t lib/main.dart`
11. `fvm flutter build apk --debug --flavor prod --dart-define=APP_FLAVOR=prod -t lib/main.dart`
12. Build hatasi sonrasi ortam duzeltmesi:
    - `winget install --id Microsoft.OpenJDK.17 --silent`
    - `sdkmanager --uninstall "platforms;android-34"`
    - `sdkmanager --install "platforms;android-34"`
13. `fvm flutter analyze`
14. `fvm flutter test`

### Hata Kaydi (Silinmez)
- `fvm` PATH'te bulunamadi (`fvm is not recognized`).
  - Duzeltme: tum komutlar `%LOCALAPPDATA%\Pub\Cache\bin\fvm.bat` uzerinden calistirildi.
- Firebase eklendikten sonra Android build hatasi alindi:
  - `:firebase_core:compileDebugJavaWithJavac` + `JdkImageTransform core-for-system-modules.jar`
  - Koken neden: local toolchain JDK 21 ile AGP/Firebase kombinasyon uyumsuzlugu.
  - Duzeltme:
    1) Microsoft OpenJDK 17 kuruldu.
    2) `android/gradle.properties` icinde `org.gradle.java.home` JDK17'ye pinlendi.
    3) Android platform 34 yeniden kuruldu.
  - Sonrasi: dev/stg/prod debug apk build basarili.
- Uyari (bloklayici degil):
  - `SDK XML version 4` uyari mesaji. Build'i durdurmadi.

### Yapilan Dosya Degisiklikleri
- Android:
  - `android/settings.gradle` -> `com.google.gms.google-services` plugin version pin
  - `android/app/build.gradle` -> namespace + flavorDimensions + productFlavors (dev/stg/prod)
  - `android/app/src/main/AndroidManifest.xml` -> `android:label=@string/app_name`
  - `android/app/src/dev/google-services.json`
  - `android/app/src/stg/google-services.json`
  - `android/app/src/prod/google-services.json`
  - `android/gradle.properties` -> JDK17 pin (`org.gradle.java.home`)
- iOS:
  - `ios/Runner.xcodeproj/project.pbxproj` -> base bundle id `com.neredeservis.app`
  - `ios/Runner/GoogleService-Info.plist` (prod)
  - `ios/firebase/dev/GoogleService-Info.plist`
  - `ios/firebase/stg/GoogleService-Info.plist`
  - `ios/firebase/prod/GoogleService-Info.plist`
- Flutter runtime:
  - `pubspec.yaml` -> `firebase_core`
  - `lib/config/app_flavor.dart`
  - `lib/firebase/firebase_bootstrap.dart`
  - `lib/firebase/firebase_options_dev.dart`
  - `lib/firebase/firebase_options_stg.dart`
  - `lib/firebase/firebase_options_prod.dart`
  - `lib/main.dart` (ortam bazli Firebase initialize)
  - `test/widget_test.dart` (yeni app yapisina gore)
  - `README.md` (flavor run/build komutlari)

### Bulgular
- Android flavor package id'leri kilitlendi:
  - dev: `com.neredeservis.app.dev`
  - stg: `com.neredeservis.app.stg`
  - prod: `com.neredeservis.app`
- iOS base bundle id `com.neredeservis.app` olarak guncellendi.
- Firebase runtime baslatma artik `APP_FLAVOR` ile seciliyor.
- Dogrulama sonucu:
  - `flutter analyze` -> temiz
  - `flutter test` -> tum testler gecti
  - `flutter build apk` -> dev/stg/prod basarili

### Sureklilik Kurali (Mecburi)
- Bu dosya append-only iz kaydidir.
- Sonraki muhendisler her adim sonunda ayni formatta yeni `STEP-XXX` eklemek zorundadir.
- Hatalar silinmez; sadece "duzeltildi" notu ile kapatilir.

### Sonuc
- STEP-020 teknik olarak kapandi: Flutter iskeleti + Android flavor + Firebase runtime secimi aktif.
- Android tarafi build-edilebilir durumda.

### Sonraki Adim Icin Beklenen Onay
- STEP-021:
  1) iOS dev/stg/prod scheme+configuration ayrimini (Xcode flavor) tamamlayalim.
  2) Entry-point dosyalari (`main_dev.dart`, `main_stg.dart`, `main_prod.dart`) ile CI-friendly calistirma standardini kilitleyelim.
  3) `flutterfire` ve flavor komutlari icin otomasyon scripti ekleyelim (Windows PowerShell + macOS shell).

## STEP-021 - No-Mac iOS Stratejisi + CI Compile Guard + Entry Point Standardi
Tarih: 2026-02-17
Durum: Tamamlandi

### Kullanici Karari (Onayli)
- Kullanici tarafindan Mac veya iPhone erisimi olmadigi teyit edildi.
- Operasyon modeli: Android-first + iOS-ready + CI no-codesign compile guard + final fiziksel iOS gate.

### Amac
- Mac/iPhone yokken iOS riskini biriktirmeden ilerlemek.
- Flutter giris noktalarini flavor-bazli netlestirmek.
- Sonraki muhendislerin tek komutla ayni akisi calistirabilmesini saglamak.

### Calistirilan Komutlar (Ham)
1. Kod refactor:
   - `lib/main_dev.dart`, `lib/main_stg.dart`, `lib/main_prod.dart` eklendi.
   - `lib/main.dart` ortam degiskeninden flavor cozen fallback giris noktasi olarak birakildi.
2. Script altyapisi:
   - `scripts/run_flavor.ps1`, `scripts/build_flavor.ps1`
   - `scripts/run_flavor.sh`, `scripts/build_flavor.sh`
3. CI workflow:
   - `.github/workflows/mobile_ci.yml` eklendi.
   - Android job: analyze + test + dev/stg/prod apk build
   - iOS job: `flutter build ios --no-codesign -t lib/main_prod.dart`
4. Dogrulama:
   - `fvm flutter pub get`
   - `fvm flutter analyze`
   - `fvm flutter test`
   - `fvm flutter build apk --debug --flavor dev -t lib/main_dev.dart`
   - `fvm flutter build apk --debug --flavor stg -t lib/main_stg.dart`
   - `fvm flutter build apk --debug --flavor prod -t lib/main_prod.dart`

### Hata Kaydi (Silinmez)
- Bu adimda bloklayici hata yok.

### Yapilan Dosya Degisiklikleri
- Yeni:
  - `.github/workflows/mobile_ci.yml`
  - `lib/app/nerede_servis_app.dart`
  - `lib/bootstrap/app_bootstrap.dart`
  - `lib/main_dev.dart`
  - `lib/main_stg.dart`
  - `lib/main_prod.dart`
  - `scripts/run_flavor.ps1`
  - `scripts/build_flavor.ps1`
  - `scripts/run_flavor.sh`
  - `scripts/build_flavor.sh`
  - `docs/ios_macos_gate_plan.md`
- Guncellenen:
  - `lib/config/app_flavor.dart`
  - `lib/main.dart`
  - `test/widget_test.dart`
  - `README.md`
  - `docs/NeredeServis_Teknik_Plan.md` (No-Mac iOS operasyon modu + P0 checklist maddeleri)

### Bulgular
- Android build zinciri entrypoint bazli calisiyor (dev/stg/prod hepsi green).
- `flutter analyze` temiz, `flutter test` green.
- iOS tarafinda local cihaz yokken dahi PR seviyesinde compile guard tanimlandi (GitHub Actions macos runner).
- Teknik plan, su anki fiziksel kisitla uyumlu hale getirildi.

### Sureklilik Kurali (Mecburi)
- Sonraki muhendisler iOS gelistirme adimlarini Mac'siz ortamda bu strateji disina cikarmayacak:
  1) CI no-codesign compile guard zorunlu,
  2) App Store oncesi fiziksel iOS gate zorunlu,
  3) Tum adimlar bu iz kaydina append-only sekilde eklenecek.

### Sonuc
- STEP-021 kapandi.
- Mac/iPhone yokken saglikli ilerleme modeli teknik olarak kuruldu ve dokumante edildi.

### Sonraki Adim Icin Beklenen Onay
- STEP-022:
  1) Firebase Auth + role bootstrap (driver/passenger/guest) katmanini yazalim.
  2) Platform izin orkestrasyonu (Android tam, iOS dokuman + kod-hazir) temelini kuralim.
  3) Emulator test iskeletini acip ilk entegrasyon testlerini yesile cekelim.
