# MVP Ürün Amacı ve Rol/Yetki Matrisi

Tarih: 2026-03-02
Durum: AKTİF (Web-first)

## 1. Rol Modeli Kararı (Kilidi)
Bu ürün artık 4 rolden oluşur:

- SaaS Sahibi (Platform Owner) - Web panel (ayrı platform paneli)
- Şirket - Web panel (tek şirket rolü, iç rol yok)
- Şoför - Mobil uygulama
- Yolcu/Misafir - Mobil uygulama (misafir, yolcu ile aynı izleme kapsamı)

Kural: Şirket tarafı `admin/viewer/dispatcher` gibi alt rollere bölünmez.

## 2. Uygulama Ne İşe Yarıyor?
NeredeServis, servis operasyonunu platform sahibinden saha kullanıcılarına kadar tek sistemde yürütür:

- SaaS Sahibi: şirketi sisteme alır, kullanıcılarını tanımlar, kapasitesini açar.
- Şirket: kendi operasyonunu (şoför, araç, rota, canlı takip) yönetir.
- Şoför: atanmış seferi güvenli şekilde yürütür.
- Yolcu/Misafir: servisi canlı takip eder.

Temel vaat: "Kurulum ve operasyon sürtünmesini azaltıp seferi doğru bilgiyle yönetmek."

## 3. Rol ve Yetki Matrisi

| Rol | Kanal | Kapsam | Ana Yetki |
|---|---|---|---|
| SaaS Sahibi | Web (Platform Panel) | Tüm tenant/şirketler | Şirket açma, şirket kullanıcılarını oluşturma, şirket kapasitesi/araç hakkı tanımlama, platform genel yönetim |
| Şirket | Web (Şirket Paneli) | Kendi şirketi | Şoför/araç/rota yönetimi, atama, canlı operasyon takibi ve müdahalesi |
| Şoför | Mobil | Kendi ataması | Atanmış seferi görüntüleme, sefer başlat/bitir, canlı konum gönderme |
| Yolcu/Misafir | Mobil | Kendi takip kapsamı | Canlı konum izleme, temel rota/sefer bilgisi, duyuru görüntüleme |

## 4. Kanal Erişim Kuralı

- SaaS Sahibi: yalnız web platform panelinden giriş yapar.
- Şirket: yalnız web şirket panelinden giriş yapar.
- Şoför: yalnız mobil uygulamadan giriş yapar.
- Yolcu/Misafir: yalnız mobil uygulamadan giriş yapar.

## 5. Platform Bazlı MVP Kapsamı

### 5.1 Platform Paneli (SaaS Sahibi)
- Şirket oluşturma
- Şirkete kullanıcı/profil tanımlama
- Şirkete araç kapasitesi/limit tanımlama
- Şirket aktivasyon/dondurma gibi platform seviyesinde yönetim

### 5.2 Şirket Paneli (Web)
- Fleet Setup (tek bağlam):
  - Şoför oluştur/düzenle
  - Araç oluştur/düzenle
  - Rota oluştur/düzenle
  - Şoför-rota ataması
- Live Ops:
  - Aktif sefer listesi
  - Harita üstünde canlı araçlar
  - Risk kuyruğu (critical/warning/stale)
  - Seçili sefer detay çekmecesi
  - Hızlı müdahale aksiyonları

### 5.3 Şoför Mobil
- Giriş
- Atanmış rota/sefer görüntüleme
- Sefer başlat/bitir
- Konum akışı gönderme

### 5.4 Yolcu/Misafir Mobil
- Takip girişi
- Canlı konum izleme
- Temel rota/sefer bilgisi
- Duyuru görüntüleme

## 6. MVP Dışı (Bu Fazda Yok)
- AI tahminleme/optimizasyon
- UKOME tarife motoru
- Muhasebe/finans modülleri
- Gelişmiş enterprise raporlama paketleri

## 7. Kabul Kriteri (Bu Belgenin)
Bu belge onaylandığında ekip şu soruları net yanıtlar:

- Platform sahibi bu SaaS ile neyi yönetiyor?
- Şirket panelde tam olarak hangi işi bitiriyor?
- Şoför mobilde hangi operasyon adımlarını tamamlıyor?
- Yolcu/misafir mobilde hangi bilgiyi görüyor?

Onay sonrası adım: ekran ekran IA ve akış tasarımı (önce web).
