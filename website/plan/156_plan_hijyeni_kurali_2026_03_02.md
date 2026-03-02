# Plan Klasoru Hijyen Kurali

Tarih: 2026-03-02

## Amaç
Plan klasorunu calisir, okunur ve izlenebilir tutmak.

## Kurallar
- Tarihli snapshot dosyalarinda ayni konu icin sadece en guncel dosya ana klasorde kalir.
- Daha eski snapshotlar `website/plan/_archive/<batch>/` altina tasinir.
- `*_latest.md` dosyalari referans dosyasi olarak korunur.
- Yeni plan yazarken su sirayi kullan:
  1. `NNN_konu_yyyy_mm_dd.md` (tek aktif dosya)
  2. gerekirse `NNN_konu_latest.md` guncelle
- Ayni gunde tekrar cikan raporlar yeni dosya acmak yerine mevcut aktif dosyaya eklenir.

## Temizlik Batch
- `2026-03-02_scope_lock_cleanup`
- Arsave tasinan dosya sayisi: 82
- Konum: `website/plan/_archive/2026-03-02_scope_lock_cleanup`
