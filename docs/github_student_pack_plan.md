# GitHub Student Pack Uygulama Plani (NeredeServis)

Tarih: 2026-02-17
Sahip: `infonetoapp-cloud` / `NeredeServis`

## 1) Dogrulanmis cekirdek avantajlar (GitHub resmi kaynak)
- GitHub Copilot Pro: dogrulanmis ogrencilere ucretsiz.
- GitHub Codespaces: GitHub Pro seviyesinde dahil kullanim (180 core-hour / ay, 20 GB-month storage).
- GitHub Pro dahil kullanim: Actions dakika ve paket depolama limitleri Pro seviyesinde.

Not: Partner teklifleri zamanla degisir, bazi teklifler tek seferlik olabilir; her biri Education portalindan tek tek claim edilmelidir.

## 2) NeredeServis icin dogrudan uygulama

### A) Copilot Pro (hemen)
- Kullanim amaci:
  - Flutter widget/refactor hizlandirma
  - Type-safe Cloud Functions kontratlari
  - Test skeleton uretimi
- Kural:
  - Copilot ile uretilen kod merge edilmeden once `flutter analyze`, `flutter test`, CI green zorunlu.

### B) Codespaces (hemen)
- Kullanim amaci:
  - Yerel ortam bozuldugunda yedek cloud dev ortami
  - CI ile ayni Linux tabanli tekrar uretilebilir ortama gecis
- Kural:
  - Repo icin tek bir `devcontainer` standardi korunur.
  - Kullanilmayan codespace'ler silinir (quota korumasi).

### C) GitHub Actions kotasi (hemen)
- Kullanim amaci:
  - Android lint/test/build + iOS no-codesign guard
- Kural:
  - PR disinda gereksiz push buildlerinden kacin.
  - Gece saatlerinde toplu test branch stratejisi kullan.

### D) Packages / Artifact stratejisi (hemen)
- Kullanim amaci:
  - Build artifact saklama, surum izlenebilirligi
- Kural:
  - Kisa saklama politikasi (or. 7-14 gun) ile storage tuketimi kontrol edilir.

## 3) Claim ve aktivasyon kontrol listesi

1. GitHub Education portalinda ogrenci dogrulamasi aktif oldugunu kontrol et.
2. Copilot Pro lisansinin hesapta aktif oldugunu kontrol et.
3. Codespaces monthly quota degerlerini kontrol et.
4. Actions/Packages kullanim panellerini ac ve aylik takip rutini baslat.
5. Ihtiyacimiz olan partner tekliflerini sec:
   - Monitoring/observability
   - Cloud kredi
   - Domain/SSL
   - DB/cache
6. Her claim sonrasi bu dosyaya tarih + teklif + son kullanma notu islenir.

## 4) Operasyonel guardrail
- Partner teklifine guvenip mimariyi kilitleme:
  - V1.0 cekirdek: Firebase + Flutter ile devam.
  - Student Pack teklifleri yardimci katman olarak eklenir.
- Kritik urun fonksiyonlari (Auth, realtime, queue, notification) sadece tek bir partner teklifine baglanmaz.

## 5) Bu dosyanin isletim kurali
- Her yeni muhendis claim/aktivasyon yaptiginda bu dosyaya:
  - `Tarih`
  - `Ne aktif edildi`
  - `Nerede kullanildi`
  - `Maliyet etkisi`
  yazmak zorundadir.
