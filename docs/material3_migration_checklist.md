# Material 3 Migration Checklist (STEP-094B)

Tarih: 2026-02-17  
Durum: Baseline kilidi tamamlandi

## 1) Baseline Karari
- [x] `ThemeData(useMaterial3: true)` aktif.
- [x] Seed tabanli `ColorScheme` tanimli.
- [x] Uygulama default tema akisi M3'e sabitlendi.

## 2) Zorunlu Kontrol Listesi
- [x] `MaterialApp.theme` M3 theme ile set edildi.
- [ ] Typography tokenlari (Space Grotesk + Manrope) M3 scale ile eslestirildi.
- [ ] Component theme override'lari (AppBar, FilledButton, Card, SnackBar) M3 uyumlu hale getirildi.
- [ ] Dark theme varyanti M3 standartlarina gore eklendi.
- [ ] Semantics ve contrast audit raporu cikartildi.

## 3) Teknik Not
- Baslangic kilidi `lib/app/nerede_servis_app.dart` icinde uygulanmistir.
- UI token entegrasyonu (Faz D) geldikce bu checklist append-only guncellenir.

## 4) Regression Guard
- M3 kapatma (`useMaterial3: false`) yasak degisikliktir.
- Her PR'da:
  - `flutter analyze`
  - `flutter test`
  komutlari green olmadan merge edilmez.
