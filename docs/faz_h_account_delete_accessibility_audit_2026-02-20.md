# FAZ H Hesap Silme Erisilebilirlik Audit (STEP-388B)

Tarih: 2026-02-20  
Durum: Tamamlandi  
Etiket: codex

## Kapsam
- Apple guideline 5.1.1(v) risk gate'i icin hesap silme akisinin kolay erisilebilir olup olmadigi kontrol edildi.

## Bulgular
- Ayarlar route'u dogrudan mevcut:
  - `AppRoutePath.settings = /settings`
- `SettingsScreen` icinde ana kart seviyesinde `Hesabimi Sil` butonu var.
- Aksiyon callback bagli:
  - `onDeleteAccountTap -> _handleDeleteAccount(context)`
- UI testi var:
  - `test/ui/settings_screen_test.dart` icinde `Hesabimi Sil` render + tap callback dogrulamasi mevcut.

## Sonuc
- Hesap silme akisi ayarlar icinde derine gomulu degil.
- Erişim: ana ayarlar ekraninda tek dokunusla ulasilabilir.
