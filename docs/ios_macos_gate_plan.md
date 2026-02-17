# iOS Gate Plan (Mac/iPhone Yokken)

## Hedef
Mac veya iPhone erisimi yokken gelistirmeyi durdurmadan ilerlemek, ama iOS yayin riskini biriktirmemek.

## Asama 1 - Simdiki Durum (Windows + Android)
- Android ve backend uretim hizinda ilerler.
- iOS icin kod kontratlari ve izin metinleri repoda tutulur.
- CI tarafinda `flutter build ios --no-codesign` derleme kontrolu calisir.

## Asama 2 - CI Compile Guard
- GitHub Actions `mobile_ci.yml` iOS compile job'i ile:
  - Pod entegrasyonu kirildi mi?
  - Firebase iOS baglantisi bozuldu mu?
  - Flutter kodu iOS'ta derlenebilir mi?
  sorulari her PR'da kontrol edilir.
- Not: Mac/iPhone yok donemde iOS compile job'i `continue-on-error` modunda calisir (non-blocking sinyal).

## Asama 3 - Final iOS Gate (Zorunlu)
Yayina cikmadan once tek seferde tamamlanmasi gereken fiziksel gate:
1. Mac + Xcode erisimi
2. Apple Developer hesabinda signing/provisioning kurulumu
3. En az 1 fiziksel iPhone ile test:
   - notification izin akisi
   - background location (Always izinleri)
   - kill/uyku senaryolari
4. TestFlight dagitimi + crash/log kontrolu
5. App Store review notu + privacy metinleri son kontrol

## Neden Bu Model
- Mac yok diye tum projeyi bekletmez.
- iOS tarafini da tamamen karanlikta birakmaz.
- Son anda cikacak iOS surprizlerini azaltir.
