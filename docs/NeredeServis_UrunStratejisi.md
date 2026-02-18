# NeredeServis — Anahtar Teslim Ürün Strateji Raporu

**Tarih:** 16 Şubat 2026  
**Pilot Bölge:** Darıca – Gebze Sanayi Koridoru  
**Hedef Kullanıcılar:** Personel servisi şoförleri + sanayi çalışanları  
**Geliştirici Profili:** Tek kişi, düşük bütçe, maksimum etki

---

# 1️⃣ ÜRÜNÜ YENİDEN TANIMLA

## Bu Uygulama Aslında Ne?

PDF'deki tanım yüzeysel: "servis takip uygulaması" diyor. Hayır. Bu tanım pazarda ölür.

**NeredeServis, bir "sabah güvencesi" uygulamasıdır.**

Sanayi çalışanı sabah 06:45'te kapısının önünde servisin gelip gelmeyeceğini bilmek ister. Geç mi kalacak? Atlayacak mı? Kaza mı yaptı? Bu belirsizlik her sabah yaşanan sessiz bir stres kaynağıdır. WhatsApp gruplarına "abi geliyor musun?" yazmak çözüm değil, semptomdur.

**NeredeServis = "Bir bakışta güven" sistemidir.**

Kullanıcı uygulamayı açar → servisin nerede olduğunu görür → telefonunu kapatır → hayatına devam eder. Bu döngü 8 saniye sürmelidir. 8 saniyeden fazla etkileşim gerektiren her tasarım hatalıdır.

## Bu Uygulama Ne DEĞİLDİR?

- **WhatsApp grubu değildir.** Mesajlaşma özelliği KOYMUYORUZ. PDF'de "Canlı Duyuru Kanalı" önerilmiş — bu özellik doğru ama chat'e dönüşmemeli. Tek yönlü duyuru, sadece şoförden yolcuya.
- **Tam kapsamlı navigasyon uygulaması değildir.** Turn-by-turn vermiyoruz; ancak şoför ekranında **Driver Guidance Lite** (sıradaki durak + mesafe + sade harita) var.
- **Sosyal platform değildir.** Profil fotoğrafı, yorum, beğeni yok. Bunlar bu ürünün DNA'sında yok.

## İnsanlar Bunu Neden Her Sabah Açsın?

Tek bir nedenden: **belirsizliği öldürmek.**

"Servis 7 dakika uzakta" bilgisi, o sabah yaşanacak 15 dakikalık stresi sıfırlar. Bu bilgiyi her sabah verebilirsen, kullanıcı senden vazgeçemez.

## Darıca–Gebze'de Neden Tutar?

1. **Coğrafi zorunluluk:** Darıca–Gebze arası 15-25 km'lik bir sanayi koridorudur. Toplu taşıma yetersizdir. Personel servisleri tek gerçek ulaşım aracıdır.
2. **WhatsApp kaosunun yoğunluğu:** Her servisin bir WhatsApp grubu var. Bu gruplar sabah "geliyor musun abi?" mesajlarıyla patlıyor. Bu, talep kanıtıdır.
3. **Yüksek yolcu yoğunluğu:** Bir serviste 14-25 kişi taşınıyor. Tek bir şoförü kazanmak = 14-25 kullanıcı kazanmak demek.
4. **Sanayi saatleri katı:** Vardiya başlangıcına geç kalmak = ücret kesintisi. "Servis nerede?" sorusu lüks değil, ekonomik zorunluluktur.

## PDF Değerlendirmesi: Güçlü ve Zayıf Noktalar

### ✅ Güçlü Taraflar
| Özellik | Neden Güçlü |
|---|---|
| Firebase RTDB ile GPS yayını | Doğru karar. Gerçek zamanlı konum için en hızlı ve en ucuz çözüm |
| 8 saniye GPS aralığı | Makul. Pil ve veri dengesi iyi kurulmuş |
| QR kod ile katılım | Onboarding sürtünmesini sıfıra indirir. Kritik büyüme mekaniği |
| Mapbox önerisi | Doğru. 50.000 ücretsiz yükleme/ay yeterli |
| Adapty entegrasyonu | Tek SDK ile çift platform ödeme. Akıllı tercih |
| Offline mod önerisi | Sanayi bölgelerinde sinyal sorunu gerçek. Doğru tespit |

### ❌ Zayıf / Hatalı Taraflar
| Özellik | Neden Sorunlu |
|---|---|
| Supabase + Firebase birlikte | Gereksiz karmaşıklık. Tek geliştirici için bakımı zor. Firebase Auth + RTDB yeterli. Supabase'i kaldır |
| 99 TL/ay fiyatlandırma | Şoföre pahalı. Türkiye'de aylık 99 TL'ye alternatif çok. 49 TL'den başlamalı |
| Trafik bazlı gecikme uyarısı | Güzel fikir ama MVP'de imkansız. Trafik API'si ek maliyet ve karmaşıklık. V2'ye bırak |
| Şoför analitik paneli | MVP değil. Gamification'ın alışkanlık yaratacağını varsaymak riskli. İlk 90 gün gereksiz |
| Flutter + Riverpod + go_router | Stack doğru ama PDF'de state management stratejisi eksik. Riverpod mimarisi detaylandırılmamış |
| Cursor AI prompt'ları ile geliştirme | Tehlikeli varsayım. Prompt ile üretim kodu yazılmaz. Foundation'ı manuel kur, detayları AI'a bırak |

---

# 2️⃣ GERÇEK PROBLEM ANALİZİ (SAHADAN)

## Yolcu Sabah En Çok Neden Sinir Olur?

1. **"Servis geldi mi, gelmedi mi?" belirsizliği.** Kapının önünde 10-15 dakika beklemek, özellikle kışın -5°C'de, öfke biriktirir.
2. **"Geç mi kalacağım?" kaygısı.** Vardiya saati sabittir. Geç kalmak somut para kaybıdır.
3. **WhatsApp grubundaki spam.** "Günaydın" mesajları arasında kaybolmuş "10 dk gecikeceğim" bilgisini aramak.
4. **Servis şoförünün ulaşılamaması.** Telefon çalmıyor, cevap yok, sinyal yok.

## Şoför En Çok Neden Telefonla Uğraşmak Zorunda Kalır?

1. **"Neredesin?" aramaları.** Her sabah 5-10 yolcudan aynı soru. Trafikte telefona bakmak hem tehlikeli hem sinir bozucu.
2. **"Bugün gelmiyor" bilgilendirmesi.** Bir yolcu gelmeyecekse şoförün durağa boşuna gitmemesi gerekir — ama bu bilgi genelde gelmez.
3. **Yeni yolcu ekleme/çıkarma.** WhatsApp'ta "abi beni de al" tarzı mesajlar, düzensiz rotalar.

## Mevcut Çözümler Neden Kullanılmıyor?

- **Google Maps konum paylaşımı:** Her seferinde manuel başlatma gerektirir. Pil yer. WhatsApp'ta link kaybolur. Çözüm değil, geçici yama.
- **Trink, Moovit vb.:** Şehiriçi toplu taşıma odaklı. Özel personel servisi takibi yok.
- **Firma yazılımları (SAP, vb.):** Büyük kurumsal. Küçük servis işletmecilerine hitap etmiyor. Fiyatları uçuk.

## "Olmazsa Olmaz" Tek Özellik

**Tek bakışta canlı konum + tahmini varış süresi.**

Haritada kayan bir nokta + "3 dakika uzakta" yazısı. Bu kadar. Kullanıcı bunu gördüğü an uygulamanın varlık sebebini anlıyor. Bu tek özellik yoksa uygulama yoktur.

---

# 3️⃣ ÜRÜN STRATEJİSİ (MVP → BAĞIMLILIK)

## Piyasanın Gerçek Yapısı

Sahadan gelen veri, PDF'deki "şoför + yolcu" ikili modelini çürüttü. Gerçek yapı üç katmanlıdır:

```
ŞİRKET (Komisyoncu Firma)
  │── Güzergahları belirler, araç sahipleriyle anlaşır
  │── Geç kalma / sorumluluk şirkette
  │── Komisyon alır
  ▼
ARAÇ SAHİBİ → ŞOFÖR (aynı kişi veya farklı)
  │── Araç sahibinindir, şirketle anlaşmalı
  │── Günde 2-6 sefer çalışır
  │── Uğraşmak istemez, angarya düşman
  ▼
YOLCU
  │── Sabah servisi: Şoför A
  └── Akşam dönüş: Şoför B (çok yaygın senaryo)
```

Bu yapıda üç giriş noktası var: **Şirket (web paneli)**, **Şoför (mobil)**, **Yolcu (mobil)**. Hepsini aynı veri modeliyle besliyoruz.

## Güzergah Yönetim Sistemi (Kritik Tasarım Kararları)

### Güzergah ≠ Sefer Ayrımı

| Kavram | Tanım | Oluşturan | Örnek |
|---|---|---|---|
| **Güzergah (Route)** | Sabit şablon. Bir kez tanımlanır, her gün tekrar kullanılır | Şirket VEYA Şoför | "Darıca → GOSB Sabah" |
| **Sefer (Trip)** | Güzergahın belirli bir günde çalıştırılması | Şoför "Başlat" deyince | 16 Şubat, 07:00, Darıca → GOSB |
| **Durak (Stop)** | Güzergah üzerinde opsiyonel ara nokta | Şirket (detaylı) veya Şoför (isterse) | Durak 1: Darıca Sahil |
| **Yolcu-Güzergah Bağı** | Yolcu güzergaha bir kez kaydolur, kalıcı olarak bağlı kalır | Yolcu kendisi (SRV/QR) | Ahmet → "Darıca → GOSB" |

Bu ayrım ürünün bel kemiğidir. Şoför her sabah güzergah oluşturmuyor — şablona dokunup **"Başlat"** diyor. Bu kadar.

### Güzergah Oluşturma: İki Senaryo

**Şirket üzerinden (kurumsal):** Şoför hiçbir şey yapmaz. Şirket web panelden güzergahı oluşturur, durakları tek tek ekler, şoföre atar. Şoför uygulamayı açınca güzergahı hazır görür. Sıfır efor.

**Bağımsız şoför:** Kendisi oluşturur:
1. "Yeni Güzergah" → mod seç: `Hızlı Kurulum (Pin)` veya `Ghost Drive (Rotayı Kaydet)`
2. `Hızlı Kurulum`: başlangıç/bitiş pin'i seç + opsiyonel durak
3. `Ghost Drive`: sabah servise çıkarken "Kaydı Başlat" → normal sürüşünü yap → "Kaydı Bitir"
4. Sistem başlangıç/bitiş ve durak adaylarını otomatik çıkarır, şoför tek ekranda onaylar
5. BİTTİ. QR kodu otomatik üretildi.
- Teknik kalite notu: Ghost Drive kaydi yayinlanmadan once `sanitize + Douglas-Peucker + Map Matching` hattindan gecer. Harita cizgisi sahada "zigzag" gorunmez.
- Canli suruste marker titremesini azaltmak icin istemci tarafinda Kalman smoothing uygulanir (ham GPS saklanir, UI'da filtreli marker gosterilir).

**60 saniyede güzergah hazır** (pin modu) veya **tek sürüşte kalıcı rota hazır** (Ghost Drive modu). Durak opsiyonel — sadece başlangıç + bitiş yeterli.
**Varsayılan öneri:** bağımsız şoförde ilk kurulumda `Ghost Drive` birincil CTA, `Pin ile Kur` ikincil seçenek.

### Güzergah Düzenleme: Uğraştırmadan

| Değişiklik | Nasıl | Süre |
|---|---|---|
| İsim değiştir | Dokunup yaz | 2 sn |
| Durak ekle | Haritada pin at veya "+" | 5 sn |
| Durak sil | Sola kaydır → sil | 2 sn |
| Durak sırasını değiştir | Drag & drop (tutup sürükle) | 3 sn |
| Güzergahı arşivle | Menüden "Arşivle" (silme, yolcu kayıtları kalsın) | 2 sn |

**Altın kural:** Duraklar opsiyonel. Başlangıç + bitiş yeterli. Zamanla durak eklenebilir, acele yok.

**Yetki:** Şirketin atadığı güzergahlarda şoför düzenleme yapabilir. Sahada anlık kararlar gerekebiliyor, şoförü kısıtlamak kargaşa yaratır.

### Yolcu Çoklu Güzergah Kaydı

Yolcunun sabah servisi Şoför A, akşam dönüşü Şoför B olabilir. Uygulama bunu destekler:
- Yolcu birden fazla güzergaha kayıt olabilir
- Bir kez kaydolunca kalıcı. Çıkmak isterse kendisi çıkar
- Uygulama açıldığında aktif sefer otomatik gösterilir
- Aktif sefer yoksa "Servislerim" listesi çıkar
- **Akıllı varsayılan:** Saat 06-10 arası sabah güzergahı, 16-20 arası akşam güzergahı otomatik ön plana gelir

## Sürüm Planı (V1.0 → V1.1 → V1.2)

### V1.0 — Çekirdek (İlk 30 gün)
| Özellik | Gerekçe |
|---|---|
| Şoför kaydı (Google veya e-posta/şifre + profil: plaka, ad, telefon) | Giriş kapısı |
| Yolcu girişi (SRV kodu / QR ile) | Sürtünmesiz onboarding |
| Çoklu güzergah oluşturma + yönetim | Ürünün omurgası. Şoförler 2-6 güzergah çalışıyor |
| Opsiyonel durak ekleme | Kurumsal detaylı ekler, bağımsız şoför atlayabilir |
| Canlı GPS yayını (arka planda) | Ürünün kalbi |
| Canlı harita (yolcu tarafı) | Ürünün yüzü |
| Tahmini varış süresi (ETA) | "Neden açayım?" sorusunun cevabı |
| Push bildirim (yaklaşıyor + gecikme) | Sabah alışkanlığı oluşturucu |
| QR kod ile hızlı katılım (güzergaha özel) | Viral büyümenin motoru |
| Şoför → yolcu tek yönlü duyuru | WhatsApp grubunun yerini alan mekanik |
| Yolcu çoklu güzergah kaydı | Sabah/akşam farklı servis senaryosu |
| Telefon numara görünürlük ayarı (şoför + yolcu) | Geçiş döneminde telefon iletişimi için |
| "Bugün Binmiyorum" yolcu bildirimi | Şoför boşuna durmağa gitmesin |
| Saat bazlı akıllı dürtme (sefer başlatma hatırlatması) | Unutkan şoför senaryosu |
| WhatsApp köprüsü (duyuru → WhatsApp share) | Viral büyüme + WhatsApp alışkanlığıyla köprü |
| İkame şoför desteği (yetkili şoför listesi) | Şoför değişikliği sürekli oluyor, seferin durmamalı |
| Tatil / sefer yok modu | Bayram, izin günlerinde yolcular boşa beklemesin |
| Misafir yolcu modu (kayıtsız takip) | Geçici / deneme kullanıcılar için sıfır sürtünme |
| Offline cache + "son güncelleme" UI | Sanayi bölgelerinde sinyal sorunu çözümü |
| KVKK onay + aydınlatma metni | Yasal zorunluluk |

### V1.1 — Monetization + Polish (30-45. gün)
| Özellik | Gerekçe |
|---|---|
| Adapty abonelik entegrasyonu | Gelir kapısı |
| 14 gün deneme → ödeme akışı | Dönüşüm mekanizması |
| Paylaşım linki (nerede.servis/SRV4821) | Viral büyüme hızlandırıcı |
| Referans ödülü (firmadan firmaya: tanıt → 1 ay ücretsiz) | B2B organik büyüme |

### V1.2 — Kurumsal + Analitik (60-90. gün)
| Özellik | Gerekçe |
|---|---|
| Şirket web paneli (güzergah oluşturma, şoföre atama) | B2B kanalı açma |
| Şirket → şoför yolcu listesi görüntüleme | Firma yönetim ihtiyacı |
| Toplu duyuru (firma → tüm şoförler/yolcular) | Kurumsal iletişim |
| Şoför analitik paneli (sefer sayısı, dakiklik skoru) | Retention güçlendirici |
| Sefer geçmişi (şoför + yolcu) | Veri şeffaflığı |
| Trafik bazlı gecikme tahmini | ETA kalitesini artırma |

**Altyapı notu:** V1.2 özellikleri sonradan eklenecek olsa da, Firestore veri modeli V1.0'dan itibaren şirket (company) koleksiyonunu ve ilişkilerini içerecek. Altyapı hazır, UI sonra gelir.

## 30 Günde Alışkanlık Yaratacak Mekanikler

### 1. Sabah Tetik Bildirimi (Hook)
Her sabah aynı saatte: **"Servisin hareket etti. Durağınıza ~12 dk."** Bu bildirim bir "alışkanlık çapası"dır. Nir Eyal'ın Hook Modeli'ndeki External Trigger'a karşılık gelir. Kullanıcı bildirime tıklayıp 5 saniye haritaya bakar, telefonunu kapatır. Bu döngü 5 gün tekrarlandığında alışkanlık oluşur.

### 2. "Bildirim Takvimi" (Variable Reward)
Her sabah biraz farklı bildirim metni: "Servisin bugün 2 dk erken!", "Trafik sakin, tam vaktinde geliyor", "Hafif gecikme, +4 dk." Bu değişkenlik, beynin ödül merkezini uyarır. Monoton bildirim → mute. Değişken bildirim → merak.

### 3. İlk Kullanım Anındaki "Aha!" Anı
Yolcu QR kodunu okuttuğu an → haritada servisi görür → "vay be çalışıyor" tepkisi. Bu "aha anı" 10 saniye içinde gerçekleşmelidir. 10 saniyeden uzun süren onboarding = ölü kullanıcı.

**V1.1 viral büyüme notu (zorunlu):**
- iOS: App Clip
- Android: Instant App (uygunsa)
- Hedef: "sadece servis nerede bakacağım" kullanıcısını store indirme sürtünmesine sokmadan mini native deneyimle karşılamak.

## Bildirimler Nasıl Rahatsız Etmeden Bağımlılık Yapar?

**Kural: Günde maksimum 2 bildirim.** Bunlar:
1. **Sabah tetik:** "Servisin hareket etti" (06:30-07:30 arası, kullanıcının tercihine göre)
2. **Yaklaşma uyarısı:** "Servisin 3 dk uzakta" (durağa yaklaşınca)

Bunların dışında bildirim atmayacaksın. "Uygulamayı güncelle", "Bizi puanla", "Yeni özellik" tarzı bildirimler YASAK. Tek istisna: şoförün gönderdiği duyuru ("Bugün D3 durağı atlanıyor").

---

# 4️⃣ SAYFA & EKRAN HARİTASI

## Tam Ekran Listesi

| # | Ekran Adı | Kullanıcı | Amaç | Sürüm | Kritik Not |
|---|---|---|---|---|---|
| 1 | Splash + Onboarding | Herkes | İlk izlenim + değer anlatımı (3 slayt) | V1.0 | 2 sn splash → 3 slayt → rol seçimi |
| 2 | Rol Seçim | Herkes | Şoför/Yolcu seçimi | V1.0 | 2 kart, başka hiçbir şey yok |
| 3 | Şoför Kayıt / Giriş | Şoför | Hesap oluşturma veya giriş | V1.0 | Google Sign-In (tek buton) VEYA e-posta + şifre → sonra profil: Ad + Plaka + Telefon + KVKK |
| 4 | Şifre Sıfırlama | Şoför | Şifre yenileme | V1.0 | Firebase standart e-posta reset → uygulamaya yönlendirme |
| 5 | Yolcu Katılım | Yolcu | Güzergaha katılma | V1.0 | SRV kodu veya QR → güzergah kartı → Ad + Telefon + Biniş noktası (serbest yaz) + tel göster toggle → Harita |
| 6 | **Şoför Ana Ekran (Güzergah Listesi)** | Şoför | Güzergah seçimi + sefer başlatma | V1.0 | Kartlar halinde 2-6 güzergah, kaydırmalı, büyük başlıklar. Son kullanılan üstte |
| 7 | **Güzergah Detay / Düzenleme** | Şoför | Güzergah bilgileri + yolcu listesi + durak yönetimi | V1.0 | Üst: isim/başlangıç/bitiş. Alt: kayıtlı yolcular (ad + biniş noktası + 📞) |
| 8 | **Yeni Güzergah Oluşturma** | Şoför | Sıfırdan güzergah kurma | V1.0 | `Pin` veya `Ghost Drive` modu. Pin: 4-6 dokunma. Ghost: "Kaydı Başlat/Bitir" + tek onay |
| 9 | **Aktif Sefer Ekranı (Şoför)** | Şoför | Seferdeyken kontrol paneli | V1.0 | Sade harita + **YAYINDASIN heartbeat** + "Sıradaki Durak / Mesafe" + güvenli `Seferi Bitir` (slide/uzun bas) |
| 10 | **Yolcu Servislerim Listesi** | Yolcu | Kayıtlı güzergahlarını görme | V1.0 | Çoklu güzergah kartları. Aktif sefer varsa otomatik öne çıkar. Akıllı saat bazlı sıralama |
| 11 | Yolcu Canlı Takip (Harita) | Yolcu | Tek bakışta servis nerede | V1.0 | Harita + ETA + bottom-sheet + son güncelleme. TEK EKRAN. Ürünün KENDİSİ |
| 12 | Şoför Duyuru | Şoför | Yolculara mesaj gönderme | V1.0 | Hazır şablonlar + WhatsApp'a otomatik paylaylaşım linkleri |
| 13 | Bildirim Ayarları | Yolcu | Sabah bildirim saati seçimi | V1.0 | Saat seçici (güzergah bazlı) |
| 14 | Profil / Ayarlar | Herkes | Şifre, bildirim, çıkış | V1.0 | Minimal |
| 15 | Abonelik / Paywall Ekranı | Şoför | Plan görünümü + trial/soft-lock yönetimi | V1.0 (UI+mock), V1.1 (production billing) | `Ayarlar > Abonelik`, trial bitiş banner'ı ve premium aksiyon tetiklerinde açılır. V1.0'da gerçek tahsilat kapalıdır |
| 16 | Şoför Analitik | Şoför | Haftalık istatistikler | V1.2 | Sefer sayısı, dakiklik skoru, ortalama yolcu |
| 17 | Sefer Geçmişi | Herkes | Geçmiş seferler | V1.2 | Şoför ve yolcu kendi geçmişini görür |
| 18 | **Şirket Web Paneli** | Şirket | Güzergah oluşturma, şoföre atama, yolcu listesi, toplu duyuru | V1.2 | Web (Firebase Hosting). Altyapısı V1.0'da hazır |

## Kritik Ekranların Detaylı Analizi

### Ekran 6: Şoför Ana Ekran — Güzergah Listesi (YENİ TASARIM)

Eski tasarımda tek güzergah vardı. Yeni tasarımda şoför 2-6 güzergahını kartlar halinde görür:

```
┌─────────────────────────────┐
│  Günaydın, Mehmet 👋         │
│                              │
│  ┌─────────────────────────┐ │
│  │ 🟢 Darıca → GOSB Sabah  │ │
│  │ 6 durak · 14 yolcu      │ │
│  │ [████ BAŞLAT ████]       │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │ ⚪ GOSB → Darıca Akşam   │ │
│  │ 6 durak · 12 yolcu      │ │
│  │ [     BAŞLAT     ]       │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │ ⚪ Gebze → Dilovası Öğle │ │
│  │ duraksız · 8 yolcu      │ │
│  │ [     BAŞLAT     ]       │ │
│  └─────────────────────────┘ │
│                              │
│  + Yeni Güzergah Ekle        │
└─────────────────────────────┘
```

- **Arama yok.** Kaydırma yeterli. Arama işi karıştırır.
- **Büyük başlıklar.** Şoför trafikte bir bakışta doğru kartı bulsun.
- **Son kullanılan üstte.** Saate göre akıllı sıralama da devrede.
- **"Duraksız"** etiketi: Durak tanımlanmamış güzergahlar böyle görünür.
- **Kaldırılsa ürün ölür mü:** Ölür. Çoklu güzergah desteği olmazsa gerçek kullanıma uygun değil.

### Ekran 10: Yolcu Servislerim Listesi (YENİ)

```
┌──────────────────────────────┐
│  Servislerim                  │
│                               │
│  ┌──────────────────────────┐ │
│  │ 🟢 AKTİF                 │ │
│  │ Darıca → GOSB Sabah      │ │
│  │ Şoför: Mehmet · 4 dk     │ │
│  │ [  Canlı Takip Et  ]     │ │
│  └──────────────────────────┘ │
│                               │
│  ┌──────────────────────────┐ │
│  │ ⏰ 17:30'da              │ │
│  │ GOSB → Darıca Akşam     │ │
│  │ Şoför: Ali               │ │
│  └──────────────────────────┘ │
│                               │
│  + Yeni Servise Katıl        │
└──────────────────────────────┘
```

- Aktif sefer (birisi "Başlat" demiş) otomatik öne çıkar, doğrudan haritayı gösterir.
- Aktif sefer yoksa bu liste görünür.
- **Akıllı varsayılan:** Saat 06-10 → sabah güzergahı üstte, 16-20 → akşam güzergahı üstte.
- **Kaldırılsa ürün ölür mü:** Ölmez ama dönüş servisi farklı şoför senaryosu çalışmaz. Bu senaryo çok yaygın.

### Ekran 11: Yolcu Canlı Takip (EN KRİTİK EKRAN)
- **Ne işe yarar:** Kullanıcının bir bakışta servisin nerede olduğunu görmesi. Harita + ETA + "Son güncelleme: 12 sn önce" etiketi.
- **Kullanıcı ne hisseder:** "Tamam, geliyor. Rahatsın."
- **Kaldırılsa ürün ölür mü:** Bu ekran ürünün KENDİSİDİR.

### Ekran 12: Şoför Duyuru
- **Ne işe yarar:** WhatsApp grubunun yerini alır. "5 dk geç kalıyorum" gibi hazır şablonlar.
- **Kaldırılsa ürün ölür mü:** Ölmez ama etkisi %50 düşer.

### Ekran 18: Şirket Web Paneli (V1.2)

| İşlev | Açıklama |
|---|---|
| Şoför ekleme | Telefon/plaka ile şoförü şirkete bağla |
| Güzergah oluşturma | Başlangıç, bitiş, duraklar (haritadan), saat |
| Güzergahı şoföre atama | Dropdown ile seç, ata |
| Yolcu listesi görme | Hangi güzergahta kim var |
| Sefer geçmişi | Bugün hangi seferler yapıldı, gecikmeler |
| Toplu duyuru | Tüm şoförlere veya tüm yolculara mesaj |

Web paneli neden web? Firma yöneticisi masabaşında 10 güzergahı yönetecek. Mobil ekranda bu iş işkenceye döner. Firebase Hosting + vanilla JS veya basit Next.js yeterli.

---

# 5️⃣ UX PRENSİPLERİ (2026 STANDARTLARI)

## Map-First Tasarım: EVET

Yolcu uygulamayı açtığı an haritayı görmelidir. Giriş yapılmışsa bir tab görmemeli, bir menü görmemeli — doğrudan harita. Harita üzerinde servis marker'ı + ETA bottom-sheet. Bu kadar.

**Referans:** Uber'in açılış ekranını düşün. Harita anında görünür. Kullanıcı nerde olduğunu ve ne yapacağını 1 saniyede anlar.

## Bottom-Sheet Mimarisi: EVET

2026'da tam ekran sayfalar arası geçiş mobilde arkaik hissettiriyor. Doğru yaklaşım:
- **Harita:** Sabit arka plan, her zaman görünür
- **Bottom-sheet (küçük):** ETA + servis bilgisi + son güncelleme zamanı
- **Bottom-sheet (yukarı çekildiğinde):** Duyurular + bildirim ayarları + durak listesi

Bu yapı tek ekranla çok fonksiyon barındırır. Sayfa geçişi yok, context kaybı yok.

## Tek Ekran mı, Çok Ekran mı?

**Yolcu için: TEK EKRAN + bottom-sheet.** Yolcunun ihtiyacı sadece "servisim nerede?" sorusunun cevabı. Tek ekranda harita + ETA + bildirimler. Birden fazla güzergahı varsa → "Servislerim" listesi önce görünür, aktif sefere dokunca haritaya geçer. Aktif sefer varsa doğrudan harita açılır.

**Şoför için: 3-4 ekran.** Güzergah listesi (ana ekran) + güzergah düzenleme + aktif sefer paneli + duyuru gönderme. Şoförün daha fazla kontrole ihtiyacı var ama her ekran "sıfır angarya" prensibine uymalı.

## Şoför Harita Görmeli mi?

**Aktif sefer sırasında: EVET, ama sade (Guidance Lite).** Kesin karar.

**Gerekçe:**
1. Şoförün "yayında mıyım?" güvenini yükseltir, stresi azaltır.
2. Apple review tarafında arka plan konum kullanımının sürücüye anlık faydasını net gösterir.
3. Durak kaçırma riskini düşürür (sıradaki durak + mesafe görünür).
4. Tam navigasyon değil; sade harita + tek kararlı UI ile dikkat dağınıklığı kontrol edilir.

**Güzergah oluşturma/düzenleme sırasında: EVET.** Şoför başlangıç ve bitiş noktasını haritada görmeden emin olamaz. Bu anlarda harita gösterilir:
- Yeni güzergah oluşturma → haritada başlangıç pin'i seç → bitiş pin'i seç
- Durak ekleme → haritada pin at
- Nokta seçimi basit olmalı: haritaya dokun → pin düşer → adres otomatik dolar → "Onayla"

**Şoför aktif sefer ekranı (V1.0):**
- Sade harita (rota çizgisi + araç marker + sıradaki durak marker)
- Büyük `YAYINDASIN` heartbeat göstergesi
- `Sıradaki Durak: X` + `Kuş uçuşu: 300m`
- Büyük birincil aksiyon (`Seferi Bitir`) ama tek dokunuşla çalışmaz (`slide-to-finish` veya `uzun bas`)
- Turn-by-turn yok, metin yoğunluğu yok, dikkat dağıtıcı panel yok

**Şirket web paneli (V1.2):** Aynı harita tabanlı güzergah oluşturma. Web'de fare ile pin atma, durak ekleme. Mapbox GL JS ile.

### Şoför Güven Katmanı: Connection Heartbeat (Kesinleşti)

Aktif seferde sade harita olsa bile şoför "yayında mıyım?" kaygısı yaşayabilir. Bu nedenle harita üstünde **Heartbeat** zorunlu:
- Buyuk durum etiketi: `YAYINDASIN`
- Nefes alan pulse halka (1 sn ritim)
- Durumlar:
  - `🟢 Canlı`: konum akıyor
  - `🟡 Dalgalı`: internet/gps gecikmeli
  - `🔴 Koptu`: yayın durmuş veya kuyruğa düşmüş
- Metinler kısa ve aksiyon odaklı olmalı: `Buluta yaziliyor...`, `Baglanti zayif`, `Yayin durdu - tekrar dene`
- `🔴 Koptu` durumunda periferik alarm zorunlu: ekran kenarlarında kırmızı flash + normal bildirimden farklı haptic pattern.
- `🔴 -> 🟡/🟢` iyileşmesinde tek seferlik "geri geldi" haptik geri bildirimi olmalı.
- Sesli geri bildirim katmani zorunlu:
  - `Baglanti kesildi` (red state)
  - `Baglandim` (iyilesme)
  - `Sefer sonlandirildi` (finish)
- Sesli geri bildirim ayarlardan kapanabilir; varsayilan acik gelir.
- OLED burn-in korumasi: heartbeat halkasi + `YAYINDASIN` etiketi her 60 saniyede 2-3 px micro-shift yapar (kullanici fark etmez, panel omru korunur).

## Yolcu İçin "Sadece Bak ve Çık" UX

Bu prensip ürünün DNA'sıdır:
1. **Uygulama açılır** → Harita hemen yüklenir (skeleton + cache)
2. **Marker görünür** → Servisin konumu haritada
3. **ETA görünür** → "4 dakika uzakta"
4. **Kullanıcı telefonunu kapatır** → Toplam etkileşim: 5-8 saniye

Buna **"Glance & Go" UX** denir. Pinterest'in "yarım ekranlık" pinleri veya Apple Watch'un "quick glance" yaklaşımı. Bilgiyi ver, tutma, bırak gitsin.

### 2026 Glance Surface Eklentisi (Kesinleşti)

Yolcu uygulamaya girmeden de kritik bilgiyi gormeli:
- iOS: Live Activities (Lock Screen + Dynamic Island, destekli modellerde)
- Android 14+: Live Updates API (destek varsa), fallback: promoted ongoing notification
- Desteklenmeyen cihaz fallback: push bildirimi + uygulama ici tek ekran harita

---

# 5️⃣.5 GÖRSEL KİMLİK & UX TASARIM SİSTEMİ (Kesinleşti)

**Referans uygulama: Bolt.** Minimal, tek renkli, büyük butonlu, 3-tablı, saha dostu arayüz. NeredeServis bu yaklaşımı birebir alır ama kendi renk ve kimliğiyle.

## Renk Paleti

**Ana aksent: Amber (#E8760A)**. Sıcak, tanıdık, güven veren. Servis = her gün gördüğün araç = tanıdıklık. Yeşil = Bolt, Mavi = kurumsal soğukluk. Amber bu ürüne uyar.

| Token | Hex | Kullanım |
|---|---|---|
| `accent` | **#E8760A** | Butonlar, aktif tab, linkler, CTA |
| `accent-dark` | **#C4620A** | Basılı durum (pressed state), metin vurgu |
| `accent-light` | **#FEF3E2** | Badge arka planları, seçili kart, hafif vurgu |
| `background` | **#FFFFFF** | Tüm ekran arka planları |
| `surface` | **#F8F9FA** | Kart arka planları, input alanları |
| `text-primary` | **#1F2937** | Başlıklar, güzergah adları |
| `text-secondary` | **#6B7280** | Detay metinler, meta bilgi |
| `text-tertiary` | **#9CA3AF** | Placeholder, inaktif tab |
| `border` | **#E5E7EB** | Kart sınırları, ayırıcılar |
| `danger` | **#DC2626** | Kaza, iptal, silme aksiyonları |
| `success` | **#16A34A** | Yolda, aktif sefer göstergesi |
| `warning` | **#F59E0B** | Tatil modu, gecikme |

**Kural: Ekranda asla 2'den fazla renk olmamalı.** Beyaz zemin + koyu metin + tek amber aksent. Bolt'un kuralı: bakınca hangisine tıklayacağınızı 1 saniyede anlamalısınız.

## Tipografi

**Font: [Inter](https://fonts.google.com/specimen/Inter)** — Google Fonts'ta ücretsiz, Flutter'da `google_fonts` paketi ile 1 satır kurulum. Neden Inter: mobilde okunabilirliği en yüksek sans-serif. Apple SF Pro'dan esinlenmiş ama açık kaynak.

| Seviye | Boyut | Ağırlık | Kullanım |
|---|---|---|---|
| Başlık (h1) | 22sp | Bold (700) | Ekran başlıkları: "Güzergahlarım", "Canlı Takip" |
| Alt başlık (h2) | 16sp | SemiBold (600) | Kart başlıkları: "Darıca → GOSB" |
| Gövde | 14sp | Regular (400) | Meta bilgi, açıklamalar, input metinleri |
| Etiket | 12sp | SemiBold (600) | Badge'ler, tab isimleri, zaman damgaları |

**4 boyut, 3 ağırlık. Başka hiçbir şey yok.** 5. bir font boyutu eklemek yasak. Bolt'un kuralı: tipografi ile oynamak görsel kirliliğin en hızlı yolu.

**Flutter implementasyonu:**
```dart
// lib/core/theme/typography.dart
class AppTypography {
  static const h1 = TextStyle(fontSize: 22, fontWeight: FontWeight.w700);
  static const h2 = TextStyle(fontSize: 16, fontWeight: FontWeight.w600);
  static const body = TextStyle(fontSize: 14, fontWeight: FontWeight.w400);
  static const label = TextStyle(fontSize: 12, fontWeight: FontWeight.w600);
}
```

## İkon Sistemi

**Paket: [Phosphor Icons](https://phosphoricons.com/)** — Flutter'da `phosphor_flutter` paketi. Neden Phosphor:
1. 6 ağırlık var (thin → bold). Uygulama genelinde `regular` kullan, aktif durumda `fill` kullan.
2. 1200+ ikon — servis, harita, bildirim tüm ihtiyaçları karşılar.
3. Açık kaynak (MIT lisansı), ticari kullanım serbest.
4. Pixel-perfect, 24×24 grid üzerine kurulu.
5. Figma'da da aynı paket var → tasarım-kod uyumu sıfır sürtünme.

| Kullanım | İkon | Phosphor adı |
|---|---|---|
| Güzergahlar tab | 🚐 | `PhosphorIcons.bus` |
| Aktif sefer tab | 📡 | `PhosphorIcons.broadcast` |
| Profil tab | 👤 | `PhosphorIcons.user` |
| Saat/zamanlama | 🕐 | `PhosphorIcons.clock` |
| Yolcu sayısı | 👥 | `PhosphorIcons.usersThree` |
| Telefon arama | 📞 | `PhosphorIcons.phone` |
| Numara gizli | 🔒 | `PhosphorIcons.lockSimple` |
| Konum/durak | 📍 | `PhosphorIcons.mapPin` |
| Bildirim | 🔔 | `PhosphorIcons.bell` |
| Ayarlar | ⚙️ | `PhosphorIcons.gear` |
| QR tarama | 📷 | `PhosphorIcons.qrCode` |
| WhatsApp paylaş | ↗️ | `PhosphorIcons.shareNetwork` |

**Kural:** Emoji ikonlar SADECE duyuru şablonlarında (🟢 🟡 🔴) ve boş durum illüstrasyonlarında kullanılır. UI navigasyonunda Phosphor ikonlar kullanılır. Tutarlılık zorunlu.

## Bileşen Kütüphanesi

### 1. Güzergah Kartı
```
┌──────────────────────────────┐
│ [Bus] Darıca → GOSB   [Sabah]│  ← h2 + badge (accent-light)
│ 🕐 06:30  👥 14  📍 6 durak  │  ← body, text-secondary
│ [███████ BAŞLAT ███████]      │  ← full-width CTA, accent bg
└──────────────────────────────┘
```
- Border radius: 16px
- Padding: 16px
- Border: 1px solid `border`
- Hover/tap: scale(0.98) + shadow artışı
- CTA buton: 48dp yükseklik minimum (parmak hedefi)

### 2. Bottom Sheet
Bolt'un konum izni tarzı. Her modal aksiyon bottom sheet üzerinden:
- Yukarıdan aşağı kaydırıp kapatılabilir (drag-to-dismiss)
- Üstte 40px handle bar
- Border radius: 24px üst köşeler
- Shadow: yukarı yönlü, hafif
- İçerik scroll olabilir (uzun yolcu listesi gibi)

### 3. Snackbar (Geri Al)
Gmail tarzı, ekranın altında, bottom nav'ın üstünde:
- Background: #1F2937 (koyu)
- Text: beyaz, 13sp
- "GERİ AL" butonu: amber renkte, sağda
- 5 saniye timeout → otomatik kaybolur
- Border radius: 12px

### 4. Boş Durum Ekranları
Bolt'un 3D illüstrasyon yaklaşımı. Her boş durumda:
- **Merkeze büyük illüstrasyon** (72×72 emoji V1.0'da, V1.1'de Lottie animasyon)
- **Başlık** (h1, 18sp, bold): "Yaklaşan sefer yok"
- **Açıklama** (body, text-secondary): "Güzergahlarınıza katılın"
- **CTA butonu** (full-width, accent): "QR Okut"

V1.1'de emoji yerine **Lottie animasyonları** kullanılabilir: [LottieFiles](https://lottiefiles.com/) üzerinden servis/harita temalı animasyon. `lottie` Flutter paketi ile 1 satır entegrasyon.

### 5. Tab Göstergesi (Bottom Navigation)
- 3 tab, eşit genişlik
- Aktif: amber renk ikon + etiket, `fill` ikon varyantı
- İnaktif: `text-tertiary` renk, `regular` ikon varyantı
- Tab değişiminde: 200ms fade animasyonu
- Safe area padding (iPhone notch/home indicator)

## Mikro-Animasyonlar

| Tetikleyici | Animasyon | Süre | Easing |
|---|---|---|---|
| Kart'a dokunma | scale(0.98) | 150ms | easeOut |
| Bottom sheet açılma | slide-up + fade-in | 300ms | easeOutCubic |
| Snackbar görünme | slide-up | 250ms | easeOut |
| Tab değişimi | crossfade | 200ms | easeInOut |
| Sefer başlatma | buton → yeşile dönüş + confetti | 500ms | spring |
| ETA güncelleme | sayı morph (eski → yeni) | 400ms | easeInOut |
| Harita pin hareketi | smooth interpolation | 1000ms | linear |

**Kural: Animasyon 500ms'yi geçmez.** Kullanıcı beklemez. Bolt'ta animasyonlar neredeyse bilinçaltı — fark etmezsin ama olmazsa eksik hissedersin.

## Karanlık Mod (V1.1)

V1.0'da sadece açık tema. V1.1'de sistem temasına uyumlu karanlık mod:
- `background` → #121212
- `surface` → #1E1E1E
- `text-primary` → #E5E7EB
- `accent` → aynı amber (#E8760A, karanlıkta daha çok parlıyor)

Flutter `ThemeData.dark()` ile 1 dosyada tüm geçişler.

## Uygulama İkonu + Splash

**İkon:** Amber zemin üzerine beyaz stilize servis silueti. Köşe radius: iOS için otomatik, Android için adaptive icon.

**Splash:** 2 saniye. Beyaz zemin, ortada amber ikon, altında "NeredeServis" logotipi (Inter Bold, 24sp, text-primary).

## Tasarım Dosyaları

V1.0 için Figma'ya gerek yok. Prototip (`color_compare.html`) ve bu dokümandaki açıklamalar yeterli. Flutter'da direkt kod yazılır. V1.1'de kullanıcı testi sonuçlarına göre Figma'ya geçilebilir.

---

# 6️⃣ TEKNİK MİMARİ

## Firebase Servis Haritası

| Servis | Kullanım | Maliyet |
|---|---|---|
| **Firebase Auth** | Şoför + yolcu kimlik doğrulama (Google Sign-In + e-posta/şifre) | **$0** (ücretsiz tier, sınırsız) |
| **Firebase Realtime Database** | Canlı konum verisi (lat, lng, heading, speed, timestamp) | **$0** (1GB altında) |
| **Firebase Firestore** | Yapısal veri: şirket, şoför, güzergah, durak, yolcu, sefer | **$0** (50K okuma/gün altında) |
| **Firebase Cloud Messaging** | Push bildirimler (FCM Topics, güzergah bazlı) | **$0** (tamamen ücretsiz) |
| **Firebase Cloud Functions** | Sunucu tarafı mantığı (5 fonksiyon, aşağıda detay) | **$0** (2M çağrı/ay altında) |
| **Firebase Hosting** | QR landing page + şirket web paneli (V1.2) | **$0** (10GB/ay altında) |

## Auth Modeli: Google Sign-In + E-posta/Şifre (Kesinleşti)

Firebase Auth ile iki giriş yöntemi sunulur:

| Yöntem | Nasıl | Avantaj |
|---|---|---|
| **Google Sign-In** | Tek dokunma. Google hesabıyla giriş | Sıfır sürtünme, şifre hatırlama yok |
| **E-posta + Şifre** | Gerçek e-posta adresi + şifre | Google hesabı olmayanlar için |

**Her iki yöntem de tamamen ücretsiz.** Maliyet: $0.

**Şoför kayıt formu:**
```
1. [Google ile Giriş Yap] (tek dokunma)
   VEYA
2. E-posta + Şifre oluştur

Sonrasında profil tamamlama:
  │─ Ad Soyad (zorunlu)
  │─ Plaka (zorunlu, sadece profil verisi — auth'ta KULLANILMAZ)
  │─ Telefon (zorunlu, gösterim + destek amaçlı)
  └─ KVKK onay checkbox (zorunlu)
```

- Plaka artık auth değil, Firestore `drivers/{id}/plate` alanında tutulur.
- UID, tüm Firestore ilişkilerinde `driverId` olarak kullanılır.
- Plaka değişikliği: Profil'den düzenlenir. Auth'a dokunulmaz.

**Yolcu girişi (kademeli):**
```
İlk kullanım:  QR okut → Anonim hesap → 3 saniyede haritayı gör
3. kullanım:   "Hesabını kaydet" soft prompt → Google veya e-posta ile bağla
7. kullanım:   Son nudge. Kabul etmezse bir daha sorma.
```
- İlk giriş sıfır sürtünme (anonim). Telefon değişiminde güzergahlar kaybolur.
- Kayıt yapan yolcu: `linkWithCredential()` ile anonim hesap yükseltilir. Kalıcı.
- Kritik migration kuralı: `linkWithCredential()` sonrası yerel Drift tablolarında `ownerUid` atomik olarak yeni UID'ye devredilir (veri kaybı yok, idempotent tekrar çalışabilir).
- Crash-safe migration: app kapanırsa açılışta `migration_lock + version` ile yarım kalan devir kaldığı yerden tamamlanır.

**Şifre sıfırlama:** Firebase'in standart `sendPasswordResetEmail()` akışı. Gerçek e-posta olduğu için reset linki gider → kullanıcı tıklar → yeni şifre belirler → uygulamaya yönlendirilir. Google ile giriş yapanlarda şifre sıfırlama yok (zaten Google şifresini kullanıyor).

**Maliyet: $0.** Google Sign-In + Email/Password = Firebase Auth ücretsiz tier'da sınırsız.

## Çoklu Cihaz ve Çoklu Sefer Önleme (Kesinleşti)

**Multi-device:** `drivers/{id}/activeDeviceToken` alanı. Giriş yapıldığında FCM token kaydedilir. İkinci cihazdan giriş → birinci cihaz oturumu sonlanır + "Başka cihazda giriş yapıldı" bildirimi.
- Varsayılan politika: `single-active-device`.
- Sefer güvenliği: `finishTrip` varsayılan olarak `startedByDeviceId` ile sınırlıdır; acil override olursa audit log zorunlu.

**Multi-trip:** Aktif bir `trip` varsa (status = "active") yeni sefer başlatılamaz. "Başlat" butonu devre dışı.

## Firebase Güvenlik Kuralları (Zorunlu, Hafta 1)

**Firestore Rules (özet):**
```
drivers/{driverId}:
  │ Okuma/yazma: sadece request.auth.uid == driverId
  └ subscriptionStatus, trialStartDate: CLIENT YAZAMAZ (sadece Cloud Function)

driver_directory/{driverId}:
  │ Firestore direct read: KAPALI
  └ Erisim: sadece callable `searchDriverDirectory` (limitli sonuc, rate limit)

routes/{routeId}:
  │ Yazma: sadece callable (server)
  └ Okuma: sadece memberIds icindeki kullanicilar

routes/{routeId}/passengers/{passengerId}:
  │ Yazma: sadece request.auth.uid == passengerId (kendi kaydı)
  └ Okuma: passengerId == auth.uid VEYA route sahibi (sayı görmek için)

routes/{routeId}/stops/{stopId}:
  │ Yazma: route sahibi
  └ Okuma: herkes

trips/{tripId}:
  │ Yazma: route sahibi
  └ Okuma: ilgili güzergahın yolcuları
```

**RTDB Rules:**
```
/locations/{routeId}:
  │ Yazma: sadece route sahibi (şoför)
  │ timestamp kurali: <= now+5000 ve >= now-30000
  └ Okuma: sadece routeReaders + aktif guestReaders
```

## Cloud Functions Gen 2 (Zorunlu, $0)

Bildirim gönderme, veri tutarlılığı ve KVKK temizliği sunucu tarafı gerektirir. Firebase Blaze plan zorunlu (ama $0 taban maliyet — kullandığın kadar öde, ücretsiz limitler dahilinde).

| Fonksiyon | Tetikleyici | Ne Yapar |
|---|---|---|
| `onTripStarted` | Firestore `trips` yazıldığında | FCM Topic'e "Servisiniz hareket etti" bildirimi gönderir + route bazli 15 dk cooldown uygular |
| `onPassengerJoined` | Firestore `passengers` alt koleksiyonuna yazıldığında | `passengerCount++` atomik artır + FCM topic subscribe |
| `onPassengerLeft` | Firestore `passengers` silindiğinde | `passengerCount--` atomik azalt + FCM topic unsubscribe |
| `generateSrvCode` | Callable (güzergah oluşturulurken) | `nanoid(6, A-Z2-9)` ile SRV kodu üret, collision retry max 5 |
| `abandonedTripGuard` | Event-driven stale sinyal + schedule fallback | stale aktif seferleri tutarlı şekilde `abandoned` yapar |
| `cleanupStaleData` | Scheduled (her gece 03:00) | 7 günden eski RTDB konum/skip log temizliği |

**Ücretsiz limit:** 2M çağrı/ay. Bizim kullanım: ~50K/ay. Sınırın %2.5'i.

## Bildirim Altyapısı: FCM Topics (Kesinleşti)

Her güzergah bir FCM Topic: `route_{routeId}`

```
Yolcu katılır  → client: subscribeToTopic("route_xyz")
Yolcu ayrılır  → client: unsubscribeFromTopic("route_xyz")
Sefer başlar   → Cloud Function: topic'e tek mesaj → O(1)
```

Topic yaklaşımı 100 yolcu olsa bile tek API çağrısı. Client-side subscribe/unsubscribe sunucu gerektirmez.

## Supabase Kararı

**PDF Supabase'i önermiş. Reddedildi.** Tek geliştirici Firebase + Supabase birlikte yönetmek bakım yükünü ikiye katlar. Firebase ekosistemi içinde kalıyoruz: Auth + RTDB + Firestore + FCM + Functions + Hosting. Tek platform, tek konsol, tek fatura.

## Harita Kararı: Mapbox

**Kesin karar: Mapbox.**

| Kriter | Google Maps | Mapbox | OSM (flutter_map) |
|---|---|---|---|
| Ücretsiz limit | 28.500 yükleme/ay ($200 kredi) | 50.000 yükleme/ay | Sınırsız |
| Limit sonrası | $7/1.000 yükleme | $0.50/1.000 yükleme | $0 |
| Flutter SDK | Resmi, iyi | İyi (mapbox_maps_flutter) | flutter_map (topluluk) |
| Görsel kalite | En iyi | Çok iyi, özelleştirilebilir | Zayıf |
| Offline destek | Sınırlı | Tam destek | Manuel tile cache |
| Özelleştirme | Sınırlı tema | Tam Studio desteği | Sınırlı |
| KVKK uyumu | Google veri politikası karmaşık | Daha dostane | En iyi |

**Neden Mapbox?**
1. **50.000 ücretsiz yükleme** = 500 günlük aktif kullanıcı ile bile aylarca ücretsiz.
2. **Offline harita desteği** = sanayi bölgelerinde sinyal sorunu çözülür.
3. **Karanlık tema** = sabah karanlığında göz yormaz.
4. **Google'a bağımlılık yok** = Play Store politika riskleri azalır.
5. Limit aşılırsa $0.50/1.000 yükleme → Google'ın $7'sine kıyasla %93 ucuz.
6. **Agresif cache stratejisi** (style pack + tile cache) ile tekrar açılışlarda ağ ve yükleme maliyeti düşer.

**OSM neden değil?** Görsel kalitesi kullanıcı güveni oluşturamaz. "Bu uygulama amatör mü?" sorusunu akla getirir. Ücretsiz olması, kullanıcı kaybetme maliyetinden ucuz değil.

## Tam Mimari Şema (Final)

```
┌────────────────────────────────────────────────────────────┐
│                    Flutter Mobil App                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐            │
│  │  Şoför   │  │  Yolcu   │  │  Route Mgmt   │            │
│  │  Modülü  │  │  Modülü  │  │  Modülü       │            │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘            │
│  ┌────┴──────────────┴───────────────┴───────────────────┐ │
│  │              Riverpod State Layer                      │ │
│  └───────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼────────────────────────────────┘
                            │
      ┌─────────┬───────────┼──────────┬───────────┐
      ▼         ▼           ▼          ▼           ▼
┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Firebase │ │Firebase │ │Firebase│ │Firebase│ │ Mapbox │
│  Auth   │ │  RTDB   │ │  Fire- │ │  FCM   │ │  Maps  │
│(Google +│ │ (canlı  │ │ store  │ │(Topics)│ │+ Direc │
│ email)  │ │ konum)  │ │        │ │        │ │  API   │
│ $0/ay   │ │ $0/ay   │ │ $0/ay  │ │ $0/ay  │ │ $0/ay  │
└─────────┘ └─────────┘ └───┬────┘ └───┬────┘ └────────┘
                             │          │
                    ┌────────┴──────────┴──┐
                    │  Cloud Functions     │
                    │  Gen 2 (5 fonksiyon) │
                    │  $0/ay               │
                    └────────┬─────────────┘
                             │
                    ┌────────┴────────┐
                    │  Firebase       │
                    │  Hosting        │
                    │  QR Landing +   │
                    │  Şirket Paneli  │
                    │  (V1.2)         │
                    └─────────────────┘
```

## Firestore Veri Modeli (Final — Tüm boşluklar kapatıldı)

```
companies/{companyId}
  ├─ name: "ABC Ulaşım"
  ├─ phone: "+905xx..."
  ├─ createdAt: Timestamp
  └─ driverIds: ["driver1", "driver2"]

drivers/{driverId}                         // driverId = Firebase Auth UID
  ├─ plate: "34 ABC 123"                   // Profil verisi, auth'ta KULLANILMAZ
  ├─ name: "Mehmet Yılmaz"
  ├─ phone: "+905xx..."                    // Gösterim + destek amaçlı
  ├─ showPhoneToPassengers: true           // Numaramı yolculara göster toggle
  ├─ authProvider: "google" | "email"      // Giriş yöntemi
  ├─ companyId: "company1" | null
  ├─ subscriptionStatus: "trial" | "active" | "expired"   // CLIENT YAZAMAZ
  ├─ trialStartDate: Timestamp             // CLIENT YAZAMAZ
  ├─ activeDeviceToken: "fcm_token" | null // Çoklu cihaz önleme
  └─ createdAt: Timestamp

routes/{routeId}
  ├─ name: "Darıca → GOSB Sabah"
  ├─ driverId: "driver1"                    // Asıl (birincil) şoför
  ├─ authorizedDriverIds: ["driver2"]        // İkame şoförler (seferi başlatabilir)
  ├─ companyId: "company1" | null
  ├─ srvCode: "SRV4821"                   // Cloud Function üretir (Global unique, çakışma yok)
  ├─ startPoint: GeoPoint
  ├─ startAddress: "Darıca Sahil"          // Gösterim amaçlı
  ├─ endPoint: GeoPoint
  ├─ endAddress: "GOSB Ana Giriş"
  ├─ scheduledTime: "06:30"                // Tahmini kalkış saati
  ├─ timeSlot: "morning"                   // "morning" | "evening" | "midday" | "custom"
  ├─ isArchived: false
  ├─ vacationUntil: Timestamp | null       // Tatil modu (bu tarihe kadar sefer yok)
  ├─ passengerCount: 14                    // Denormalize, Cloud Function günceller
  └─ createdAt: Timestamp

routes/{routeId}/stops/{stopId}            // Opsiyonel
  ├─ name: "Darıca Sahil"
  ├─ location: GeoPoint
  └─ order: 1

routes/{routeId}/passengers/{passengerId}  // passengerId = Firebase Auth UID
  ├─ name: "Ahmet"                          // Kayıtta alınır (zorunlu)
  ├─ phone: "+905xx..."                     // Kayıtta alınır (zorunlu)
  ├─ showPhoneToDriver: true               // Varsayılan: true. Yolcu isterse kapar
  ├─ boardingArea: "Sahil Sitesi yanı"      // Serbest metin, şoför okur anlar
  ├─ joinedAt: Timestamp
  └─ notificationTime: "07:30"

trips/{tripId}
  ├─ routeId: "route1"
  ├─ driverId: "driver1"                    // Seferi fiilen yapan şoför (ikame olabilir)
  ├─ driverSnapshot: {                      // Sefer anındaki şoför kimliği (Yolcuya gösterilecek)
  │    name: "Ali Kaya",
  │    phone: "+905xx...",
  │    plate: "34 ABC 456"
  │  }
  ├─ startedAt: Timestamp
  ├─ endedAt: Timestamp | null
  ├─ startedByDeviceId: "device_abc"
  ├─ transitionVersion: 3                   // start/finish transition optimistic lock
  └─ status: "active" | "completed" | "abandoned"

RTDB: /locations/{routeId}
  ├─ lat, lng, heading, speed
  └─ timestamp: ServerTimestamp
```

**Tasarım kararları:**
- `driverId` ve `passengerId` = Firebase Auth UID (Google veya e-posta ile giriş)
- `routes` üst seviye → firma panelinden şoförden bağımsız sorgulanabilir
- `stops` ve `passengers` alt koleksiyon → güzergaha özel atomik işlemler
- `scheduledTime` + `timeSlot` → akıllı sıralama + "henüz hareket etmedi" UI
- Zaman standardi: `scheduledTime` `Europe/Istanbul` timezone'unda yorumlanir; timestamp'ler UTC saklanir
- `startAddress` / `endAddress` → gösterim amaçlı, GeoPoint'ten reverse geocode etmemek için
- `passengerCount` denormalize → Cloud Function atomik günceller, client'ta hızlı görüntüleme
- `showPhoneToPassengers` / `showPhoneToDriver` → geçiş döneminde telefon iletişimi için, varsayılan: true
- `abandoned` statusu → event-driven stale sinyal + schedule fallback ile otomatik yapilir
- RTDB key = `routeId` → aynı şoför farklı güzergahlarda farklı konum yayını yapabilir
- `companyId` V1.0'da null, V1.2'de doldurulur → migration gerekmez
- `transitionVersion` optimistic lock ile kullanilir: `expectedTransitionVersion` eslesmeden start/finish yazimi kabul edilmez

## Flutter Proje Yapısı (Güncellenmiş)

```
lib/
├── main.dart
├── app/
│   ├── router.dart              # GoRouter tanımları
│   ├── theme.dart               # Koyu lacivert tema
│   └── providers.dart           # Global provider'lar
├── core/
│   ├── constants.dart           # Sabitler, renkler, süreler
│   ├── exceptions.dart          # Özel hata sınıfları
│   └── extensions.dart          # Dart extension'ları
├── models/
│   ├── company.dart             # Şirket modeli
│   ├── driver.dart              # Şoför modeli
│   ├── route.dart               # Güzergah modeli
│   ├── stop.dart                # Durak modeli
│   ├── passenger.dart           # Yolcu-güzergah bağı
│   ├── trip.dart                # Sefer modeli
│   └── location_data.dart       # Canlı konum verisi
├── services/
│   ├── location_service.dart    # GPS alma + arka plan
│   ├── firebase_rtdb_service.dart  # RTDB okuma/yazma
│   ├── firestore_service.dart   # Firestore CRUD (tüm koleksiyonlar)
│   ├── notification_service.dart   # FCM + local bildirim
│   ├── auth_service.dart        # Firebase Auth wrapper
│   └── subscription_service.dart   # Adapty wrapper
├── features/
│   ├── auth/
│   │   ├── screens/             # Giriş, kayıt, rol seçim
│   │   └── providers/           # Auth state
│   ├── driver/
│   │   ├── screens/             # Güzergah listesi, aktif sefer, duyuru
│   │   ├── providers/           # Güzergah + sefer state
│   │   └── widgets/             # Güzergah kartı, QR widget, sefer butonu
│   ├── route_management/
│   │   ├── screens/             # Güzergah oluşturma, düzenleme, durak yönetimi
│   │   ├── providers/           # Route CRUD state
│   │   └── widgets/             # Durak listesi, harita pin seçici
│   └── passenger/
│       ├── screens/             # Servislerim listesi + harita takip ekranı
│       ├── providers/           # Konum dinleme + çoklu güzergah state
│       └── widgets/             # Bottom-sheet, ETA kartı, servis kartı
└── shared/
    └── widgets/                 # Ortak widget'lar
```

---

# 7️⃣ GERÇEK ZAMANLI TAKİP MODELİ

## Konum Gönderim Aralığı

**Karar: 10 saniye.**

PDF 8 saniye öneriyor. 10 saniye daha doğru. Gerekçe:

| Aralık | Pil Etkisi | Veri Kullanımı | Kullanıcı Deneyimi |
|---|---|---|---|
| 3 sn | Yüksek. Telefonun şarjı 4 saatte biter | ~2.5 MB/saat | Gereksiz hassasiyet |
| 5 sn | Orta-yüksek | ~1.5 MB/saat | Servis için fazla hassas |
| **10 sn** | **Düşük-orta. Günü çıkarır** | **~750 KB/saat** | **Servis hızında yeterli** |
| 15 sn | Düşük | ~500 KB/saat | "Servis neden atlıyor?" hissi |
| 30 sn | Minimal | ~250 KB/saat | Kullanılamaz. Güven kırılır |

Servis ortalama 40 km/saat hızla gider. 10 saniyede ~111 metre yol alır. Bu mesafe haritada akıcı bir hareket olarak görünür. 15+ saniyede marker "zıplar", güven kırılır.

## Pil Tüketimi Kontrolü

### Android
- `background_locator_2` veya `flutter_background_service` kullan
- `FOREGROUND_SERVICE` bildirimi zorunlu (Android 12+): "NeredeServis konumunuzu paylaşıyor"
- GPS doğruluğu: `LocationAccuracy.high` yerine `LocationAccuracy.balanced` yeterli. Servis takibi için 15-20 metre hata kabul edilebilir
- Sefer bittiğinde GPS tamamen durdur. "Seferi Bitir" butonuna basılmadan konum alınmamalı

### iOS Arka Plan Kısıtları

Bu projenin en tehlikeli teknik noktası burasıdır.

**iOS politikası:** Apple, arka planda sürekli konum almayı enerji israfı sayar ve uygulamayı reddedebilir veya arka plan iznini iptal edebilir.

**Çözüm stratejisi:**
1. **`allowsBackgroundLocationUpdates = true`** + **`pausesLocationUpdatesAutomatically = false`**
2. **`CLLocationManager` significant change monitoring** ile kombine et: Telefon hareket etmediğinde GPS'i kıs, hareket algılayınca tam moda geç
3. **App Store açıklamasında net kullanım senaryosu yaz:** "Bu uygulama personel servisi şoförleri tarafından kullanılır. Arka planda konum toplamak, yolcuların servis takibi yapabilmesi için zorunludur." Apple bu senaryoyu kabul eder (Uber, Lyft benzeri)
4. **`Info.plist` açıklamaları:** `NSLocationAlwaysAndWhenInUseUsageDescription` — kullanıcıya net Türkçe açıklama
5. **Pil tasarrufu modu:** Telefon %20 pilin altına düşünce aralığı 10 sn → 20 sn'ye çıkar

### İnternet Kesildiğinde Ne Olur?

**Şoför tarafı:**
- Konum verileri SQLite'a lokal olarak kaydedilir
- İnternet geldiğinde toplu gönderim (batch upload)
- Maksimum 100 lokasyon cache'lenir (10 sn × 100 = ~16.5 dakika)
- 16.5 dakikadan uzun kesinti → en eski veriyi sil, son verileri tut
- Kritik kural: `now - sampledAt > 60 sn` olan replay noktaları "canlı konum" yoluna basılmaz; sadece geçmişe işlenir
- Uygulama kapali (terminated) olsa bile kuyruk kaybolmaz:
  - Android: WorkManager periyodik flush dener
  - iOS: BGTask/Background Fetch uygun pencerede flush dener
- Wi-Fi/mobil veri geri geldiginde pending `trip_action_queue` once, `location_queue` sonra gonderilir.

**Yolcu tarafı:**
- Son bilinen konum haritada sabit kalır
- ETA "Son güncelleme: X dk önce" etiketiyle gösterilir
- 2 dakikadan eski veri: Sarı uyarı bandı → "Bağlantı sorunlu, son bilgi 2 dk öncesi"
- 5 dakikadan eski veri: Kırmızı uyarı bandı → "Canlı takip şu an mevcut değil"

### "Son Güncelleme" Güven Hissi

Bu küçük UI detayı ürünün güvenilirliğini belirler. 4 seviyeli sistem (kesinleşti):

| Seviye | Koşul | UI Davranışı |
|---|---|---|
| 🟢 **Canlı** | < 30 sn | Normal harita, ETA göster |
| 🟡 **Gecikmiş** | 30 sn – 2 dk | "Son güncelleme: Xs önce" sarı etiket, harita normal |
| 🔴 **Bayat** | 2 dk – 5 dk | "Bağlantı zayıf" kırmızı etiket, harita soluk, ETA gizle |
| ⚫ **Kayıp** | > 5 dk | "Servis bağlantısı koptu" overlay. Cloud Function seferi "abandoned" yapar |

> **Offline UI:** Yolcu interneti koptuğunda veya sunucu erişilemediğinde harita grileşir, "Bağlantı yok, son konum gösteriliyor" uyarısı çıkar. Asla eski veriyi canlı gibi göstermez. Yanıltıcılık = güven kaybı.

> **Hayalet Araba Koruması:** Offline replay sırasında eski noktalar canlı marker'ı "ışınlama" yapmaz. Canlı yayın sadece taze noktalardan beslenir.

**İmplementasyon:** RTDB `timestamp` ile `DateTime.now()` farkı client-side hesaplanır. Sunucu çağrısı gerektirmez.

## ETA Hesaplama Yöntemi (Kesinleşti)

**Hibrit:** Mapbox Directions API + client-side interpolasyon + Trafik Tamponu.

Mapbox Türkiye trafiğinde %100 hassas olmayabilir. Bu yüzden hesaplanan süreye **x1.3 güvenlik katsayısı** eklenir. 10 dk diyorsa 13 dk gösterilir. Erken gelmesi, geç kalmasından iyidir.

```
Yolcu uygulamayı açıyor
  → Mapbox Directions API çağrısı (servis konumu → yolcunun biniş bölgesi veya güzergah başlangıcı)
  → Yol bazlı ETA alınır (ör: 8 dk)
  → Her 10 sn konum güncellendikçe kalan mesafe client-side hesaplanır
  → ETA = (kalan mesafe / anlık hız) ile güncellenir
  → Her 2 dk'da bir API tekrar çağrılarak kalibre edilir
```

**Neden her 10 sn API çağırmıyoruz:** 500 yolcu × 6 çağrı/dk × 10 dk = 30K çağrı/gün = 900K/ay. Ücretsiz limit: 100K. O yüzden açılışta 1 kez + her 2 dk'da kalibrasyon.

**Maliyet:** ~500 yolcu × 5 çağrı/gün = 75K/ay. 100K ücretsiz limit dahilinde. **$0.**
- Ghost Drive Map Matching maliyeti canli akisa degil, sadece "kaydi bitir" post-process adimina yazilir; pilotta dusuk hacim nedeniyle etkisi sinirlidir.

**Ghost Drive rota esneklik kuralı (yeni):**
- Araç konumu kaydedilen `routePolyline` hattından `>500m` saparsa sistem `off-route ETA` moduna geçer.
- Bu modda marker zorla eski çizgiye yapıştırılmaz (snapping yok), ham GPS gösterilir.
- ETA, mevcut konumdan hedef/durağa yeniden hesaplanır; yolcu gerçek durumu görür.
- Teknik not: Trace verisi ham halde saklanmaz; Douglas-Peucker sadeleştirme ile polyline boyutu ve render maliyeti kontrol edilir.
- Teknik not 2: DP sonrasi Map Matching post-process ile rota geometri kalitesi temizlenir; servis hata verirse DP sonucu fallback olarak kalir.

**Virtual Stop (Sanal Durak) kurali:**
- Yolcu katiliminda haritadan bir nokta secerse bu nokta `Sanal Durak` olur.
- ETA onceligi: `Servis -> Sanal Durak`; sanal durak yoksa `boardingArea`/guzergah baslangici fallback.
- Bu sayede "genel ETA" yerine yolcuya kisisel ETA verilir.

## "Şoför Henüz Hareket Etmedi" Durumu (Kesinleşti)

Yolcu uygulamayı açtı, şoför henüz "Başlat" dememiş. En sık karşılaşılacak durum.

**Karar:** Harita gösterme. Bilgi kartı göster. Mapbox API çağrısı yapma ($0).

```
┌──────────────────────────────┐
│    🚐                           │
│  Darıca → GOSB Sabah            │
│  Şoför: Mehmet Usta             │
│                               │
│  ┌──────────────────────────┐ │
│  │  ⏰ Tahmini kalkış: 06:30   │ │
│  │  Henüz hareket etmedi       │ │
│  └──────────────────────────┘ │
│                               │
│  Hareket ettiğinde bildirim    │
│  alacaksınız. 🔔              │
└──────────────────────────────┘
```

"Tahmini kalkış" bilgisi `routes/{routeId}/scheduledTime` alanından çekilir. Şoför "Başlat" dediğinde `onTripStarted` Cloud Function tetiklenir → push bildirim → yolcu haritaya geçer. Bildirim fırtınasını engellemek için route bazlı 15 dk cooldown uygulanır.

**Delay inference kuralı (yeni):**
- Eğer `now > scheduledTime + 10 dk` ve hâlâ `activeTrip` yoksa kart etiketi otomatik olarak:
  - `Şoför henüz başlatmadı (Olası Gecikme)`
- Bu etiket stale/bağlantı hatası etiketiyle karıştırılmaz; kullanıcıya "uygulama bozuk" değil "sefer geç başladı" mesajını verir.

## Yolcunun Güzergahtan Çıkması (Kesinleşti)

Servislerim listesinde karta sola kaydır → "Ayrıl" (kırmızı) → onay dialogu → Firestore'dan `passengers/{passengerId}` hard delete → Cloud Function: `passengerCount--` + FCM topic unsubscribe.

Şoför V1.0'da yolcu çıkaramaz (KVKK: şoför yolcu sayısını görür, numara görünürlüğü yolcunun tercihine bağlı). V1.2'de şirket panelinden yönetilebilir.

## Yolcu Hızlı Aksiyonları (Kesinleşti)

Yolcunun gün içinde şoföre ileteceği 2 kısayol. Servislerim listesinde veya canlı takip ekranında her zaman erişilebilir:

| Buton | Ne olur | Ne zaman aktif |
|---|---|---|
| 🚫 **Bugün Binmiyorum** | Şoföre push: "Ahmet bugün binmiyor" | Sefer öncesi + sırası |
| ⏰ **Geç Kalıyorum** | Şoföre push: "Ahmet 5 dk geç kalacak" | Sadece aktif sefer |

**İkisi de geçici** — ertesi gün otomatik sıfırlanır.

**Şoför tarafı liste davranışı (net kural):**
- `Bugün Binmiyorum` işaretli yolcu, şoför yolcu listesinde satırı üstü çizili (`strikethrough`) görünür.
- Aynı yolcu liste sıralamasında en alta alınır (operasyonel öncelik düşürme).
- Gün değişiminde bu durum otomatik resetlenir; yolcu normale döner.
- Teknik reset kuralı: ekstra "reset write" yok; UI yalnızca `dateKey == today (Europe/Istanbul)` kaydını dikkate alır. Eski kayıt retention ile temizlenir.

**Geri alma (her iki aksiyon için):** Basınca ekranın altında 5 saniyelik snackbar görünür:

```
┌──────────────────────────────┐
│  ✅ Şoföre bildirildi   [GERİ AL] │
└──────────────────────────────┘
```

FCM bildirimi 5 saniye geciktirilir. "Geri Al"a basılırsa bildirim iptal edilir, hiçbir şey gitmez. Gmail'in "Undo Send" mantığı.

## İkame Şoför (Yedek Şoför) Mekanizması (Kesinleşti)

Bu sektörde şoför değişikliği rutin. Hasta, izin, araç değişikliği — her hafta olur.

**Çözüm:** Güzergah birden fazla yetkili şoförü destekler.

- Her güzergahın bir **asıl şoförü** (`driverId`) ve bir **yetkili şoför listesi** (`authorizedDriverIds`) vardır.
- Asıl şoför, Güzergah Detay ekranından "İkame Şoför Ekle" → diğer şoförün plaka veya adıyla arama → yetkilendir.
- İkame şoför, kendi uygulamasında bu güzergahı görür ve seferi başlatabilir.
- Sefer kaydında `driverId` = seferi fiilen yapan kişi. Geçmişte kimin kullandığı belli olur.
- Yolculara "Bugün şoförünüz: Hasan" bildirimi gider (opsiyonel).

```
┌──────────────────────────────┐
│  İkame Şoförler               │
├──────────────────────────────┤
│  Hasan Demir   34 XYZ 789   │
│  Ali Kaya      34 ABC 456   │
│  [+ İkame Şoför Ekle]        │
└──────────────────────────────┘
```

**Ön koşul:** İkame şoförün de uygulamada hesabı olmalı. Bu sektörde şoförler birbirini tanır, genelde aynı firmada çalışır. Bir şoför birden fazla güzergahta yetkili olabilir.

> **Kritik:** Sefer başladığında `trips` dokümanına o anki şoförün adı, plakası ve telefonu kopyalanır (`driverSnapshot`). Böylece asıl şoför "Mehmet" iken ikame "Ali" sefere çıkarsa, yolcu ekranında "Şoförünüz: Ali (34 ABC 456)" yazar. Güven sorunu çözülür.

## Vardiya / Esnek Sefer Yönetimi (Saha Geri Bildirimi)

Aynı güzergah günde 3 kez (08:00, 16:00, 00:00) çalışabilir.
- **Çözüm:** Şoför her vardiya için ayrı kart açabilir ("GOSB Sabah", "GOSB Akşam") VEYA tek kartı kullanıp sefer başlatırken saati güncelleyebilir.
- V1.0'da ayrı kart açmak daha temizdir (Passenger listesi de farklı olabilir).

## Tatil / Sefer Yok Modu (Kesinleşti)

Bayram, resmi tatil, şoför izni. Yolcuların boş yere beklemesini önle.

**Akış:** Güzergah Detay → "Tatil Modu" → tarih seç (bugün / bu hafta / belirli tarih aralığı) → onayla.

**Ne olur:**
- Yolculara tek push: "Şoförünüz 18-22 Şubat arası tatilde. Bu tarihler arasında sefer yok."
- Akıllı dürtme bildirimi devre dışı (alarm çalmaz).
- Yolcunun ekranında "Bu güzergah tatilde — 22 Şubat'ta devam" kartı.
- Tatil sonu: otomatik normal moda döner, ertesi gün her şey eskisi gibi.

**Veri:** `routes/{routeId}/vacationUntil: Timestamp | null`. Null = aktif. Dolu = o tarihe kadar tatil.

## Akıllı Dürtme: Sefer Başlatma Hatırlatması (Kesinleşti)

Şoför "Başlat" demeyi unutursa tüm sistem çöker. Çözüm: `scheduledTime` saatinden 5 dakika önce tam ekran bildirim (Full Screen Intent).

```
┌──────────────────────────────┐
│    🚨 SEFER ZAMANI!              │
│                               │
│    Darıca → GOSB Sabah         │
│    14 yolcu bekliyor           │
│                               │
│   [████ SEFERİ BAŞLAT ████]     │
│                               │
│       5 dk içinde kalkış       │
└──────────────────────────────┘
```

**V1.0:** Saat bazlı bildirim (geofence yok). `scheduledTime - 5min` → push. Basit, etkili, ek izin gerektirmez.
**Timezone kuralı:** Bu hesap `Europe/Istanbul` ile yapılır; UTC farkı nedeniyle 3 saat kayma kabul edilmez.

**V1.1:** Geofence eklenebilir (başlangıç noktasına 500m çit + saat kontrolü).

**Hatalı Start koruması (V1.0, zorunlu):**
- Şoför `Seferi Baslat` butonuna bastığında 10 saniyelik `Iptal` penceresi açılır.
- Bu pencere içinde `Iptal` seçilirse server'a `startTrip` yazılmaz, push tetiklenmez.
- 10 saniye dolduğunda commit edilir ve normal `startTrip` akışı başlar.

## Şoför Duyuru + WhatsApp Köprüsü (Kesinleşti)

Şoför büyük butonlara basar, iki şey aynı anda olur:
1. Uygulama içi: FCM Topic üzerinden tüm yolculara push bildirim
2. WhatsApp: Share intent açılır, hazır metin + canlı takip linki yapıştırılır

**Hazır şablonlar:**
- 🟢 **"Yola Çıktım"** → "Arkadaşlar yola çıktım. Canlı takip: neredeservis.app/join/SRV4821"
- 🟡 **"5 dk Rötar"** → "Arkadaşlar 5 dakika geç kalacağım. Takip: ..."
- 🟡 **"Araç Arızalı"** → "Arkadaşlar araç arızalandı, ~30 dk gecikme. Takip: ..."
- 🔴 **"Kaza"** → "Arkadaşlar kaza oluştu, alternatif düşünün. Bilgi vereceğim."
- 🔴 **"Sefer İptal"** → "Arkadaşlar bugün sefer iptal. Özür dilerim."

WhatsApp'a her gün uygulama linki atılması = bedava viral büyüme. Flutter'da `share_plus` paketi ile 10 satır kod.

**Paylasim linki davranis kontrati (V1.0):**
- `https://nerede.servis/r/{srvCode}` acildiginda:
  - App yuklu ise route preview/deep link.
  - App yuklu degilse landing page mini kart (guzergah adi + sefer durumu + store CTA).
- "Bos sayfa" veya sadece store yonlendirme yok; once bilgi, sonra CTA.

**Geri alma:** Şoför yanlışlıkla "Sefer İptal" basarsa felaket — 14 kişi alternatif arar. Çözüm: Yolcu aksiyonlarıyla aynı → 5 saniyelik "Geri Al" snackbarı. FCM bildirimi 5 saniye geciktirilir, geri alınırsa hiçbir şey gitmez. 🔴 kırmızı şablonlar (Kaza, İptal) için ek onay dialogu: "Emin misin? Bu 14 yolcuya bildirim gidecek."

## Telefon Numara Görünürlük Ayarı (Kesinleşti)

Geçiş döneminde şoför ve yolcu telefonla konuşacak. Bunu engellememek lazım ama KVKK'ya da uymak lazım.

**Şoför:** Profil ayarlarında "Numaramı yolculara göster" toggle. Varsayılan: EVET.

**Yolcu:** Kayıt sırasında "Numaramı şoföre göster" checkbox. Varsayılan: EVET. Sonradan Profil/Ayarlar'dan değiştirilebilir.

**Mutlak kural:** Yolcular birbirinin numarasını ASLA göremez. Sadece şoför → yolcu ve yolcu → şoför. Tek yönlü.
> **QR Güvenliği:** QR kodu tarayıp güzergaha katılan bir yolcu, uygulamasında diğer yolcuların listesini GÖRMEZ. Sadece şoförü ve kendi durumunu görür. Kötü niyetli biri QR tarasa bile veri çalamaz.

> **Hayalet Mod (Gizlilik):** Yolcu uygulamayı açtığında konumu sunucuya GÖNDERİLMEZ. Sadece sunucudan araç konumu indirilir. UI'da "Konumunuz paylaşılmıyor, sadece izliyorsunuz" ibaresi yer alır.

**Şoförün yolcu listesi (Güzergah Detay ekranı):**
```
┌──────────────────────────────┐
│  Kayıtlı Yolcular (14)          │
├──────────────────────────────┤
│  Ahmet       Sahil Sitesi  📞  │
│  Fatma       Migros önü   🔒  │  ← numarasını gizlemiş
│  Mehmet      Kırmızı apt   📞  │
│  Ayşe       Cami yanı    📞  │
└──────────────────────────────┘
```

📞 = dokuninca arama açılır. 🔒 = yolcu numara gizlemiş, arama yok.

**KVKK:** Toggle = açık rıza. Kapatanın numarası hiç görünmez, hiçbir yerde saklanmaz (client-side filtre).

## Yolcu Katılım Akışı — Hibrit (Kesinleşti)

QR kodu okut veya SRV yaz → güzergah tanıtım kartı → **iki kapı:**

```
┌──────────────────────────────┐
│  🚐 Darıca → GOSB Sabah      │
│  Şoför: Mehmet Usta          │
│  Kalkış: 06:30               │
│                               │
│  ┌────────────────────────┐  │
│  │  📋 KATIL              │  │
│  │  Her gün biniyorum     │  │
│  └────────────────────────┘  │
│                               │
│  ┌────────────────────────┐  │
│  │  👁 SADECE TAKİP ET    │  │
│  │  Bugünlük bakacağım    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Yol 1: "KATIL" → Kalıcı Yolcu

```
┌──────────────────────────────┐
│  Adınız: [Ahmet          ]    │
│  Telefon: [0532 xxx xx xx]    │
│  Nereden binersiniz:          │
│  [Sahil Sitesi yanı     ]    │
│  ☑ Numaramı şoföre göster    │
│  [████ KATIL ████]            │
└──────────────────────────────┘
```

3 alan, 1 checkbox, 20 saniye. Soyad sorma. "Nereden binersiniz" serbest metin: "Migros önü", "Cami yanı" ne yazarsa. Şoför okur, kafasında canlanır.

**Sonuç:** `passengers` koleksiyonuna yazılır → şoför listesinde görünür → bildirim alır → her gün otomatik açılır.

### Yol 2: "SADECE TAKİP ET" → Misafir

- Hiçbir form yok. Dokunur → harita açılır. 3 saniye.
- Firebase Anonymous Auth (arka planda, görünmez UID)
- Cihaz konum izni istenmez (guest sadece şoför yayınını izler).
- Haritayı görür, ETA'yı görür, servisin nerede olduğunu izler.
- `passengers` koleksiyonuna yazılmaz → şoför listesinde görünmez.
- Push bildirim almaz (FCM token kaydı yapılmaz).
- Gece 00:00'da oturum otomatik biter. Ertesi gün tekrar QR gerekir.
- **3. kullanımda:** "Düzenli biniyorsan kayıt ol, bildirim al" promptu → Yol 1'e yönlendirir.

**Teknik:** Misafir sadece RTDB'den konum okur. Firestore'da izi yok. KVKK açısından temiz — veri toplamadan izleme.

**Misafir → Kayıtlı geçiş güvence notu:** Misafir kullanırken oluşan lokal tercih/veriler (son izlenen güzergah, bildirim niyeti, önbellek) hesap yükseltme anında yeni UID'ye taşınır. "Kayıt oldum her şey silindi" senaryosu kabul edilmez.

## QR Kod İçeriği (Kesinleşti)

**Universal Link:** `https://neredeservis.app/join/SRV4821`

- App yüklü → deep link ile güzergah katılma ekranı açılır
- App yüklü değil → Firebase Hosting landing page: "NeredeServis'i İndirin" + store linkleri + SRV kodu (kopyalanabilir)
- V1.0'da basit landing page (tek HTML dosyası). 1 saatlik iş.
- V1.1 hedefi: landing page adımını azaltmak için iOS App Clip + Android Instant App mini takip kartı.

---

# 8️⃣ MONETIZATION (SATILABİLİR Mİ?)

## Kim Öder?

**Şoför öder.** Kesin karar.

**Gerekçe:**
1. **Şoför, uygulamadan direkt ticari fayda sağlar:** Daha az telefon, daha az "neredesin?" çağrısı, daha profesyonel iş yönetimi.
2. **Yolcudan para almak viral büyümeyi öldürür.** Yolcu ücretsiz kullanmalı ki yeni yolculara tavsiye etsin.
3. **Şoför sayısı az ama değerli.** 1 şoför = 14-25 yolcu. Şoförü kazan, yolcular bedava gelir.
4. **Firmadan para almak B2B satış gerektirir.** Tek geliştirici B2B satış yapamaz. V3+ hedefi.

## Fiyatlandırma (PDF'den Farklı)

PDF 99 TL/ay öneriyor. Bu yanlış. Darıca–Gebze'deki bir servis şoförü için 99 TL caydırıcı.

| Plan | Fiyat | Net Gelir (komisyon sonrası) | Gerekçe |
|---|---|---|---|
| Ücretsiz deneme | 0 TL / 14 gün | - | Alışkanlık oluşturma süresi |
| Aylık | **49 TL/ay** | ~34 TL (ilk yıl %15 komisyon) | Giriş bariyerini düşür |
| Yıllık | **399 TL/yıl** | ~339 TL (ilk yıl %15 komisyon) | ~33 TL/ay'a denk, %32 tasarruf |

**Neden 49 TL?**
- Bir servis şoförünün günlük yakıt masrafının yarısından az
- Bir telefon faturasının yarısı
- Psikolojik olarak "50 TL altı" sınırı
- Rakip çıkarsa fiyat yarışında manevra alanı kalır
- 100 şoför × 34 TL = 3.400 TL/ay net. Küçük ama uygulamanın kendini finanse etmesi için yeterli

## Para Vermeye Neyi Mecbur Bırakılır?

**V1.0 pilot karari (net):**
- Gercek Adapty uretim odeme akisi kapali.
- Paywall UI ve soft-lock davranisi simule edilir (mock/read-only subscription state).
- Gercek tahsilat ve entitlement acilisi V1.1'de aktif edilir.

**14 günlük deneme bittikten sonra kilitlenen özellikler:**
- GPS yayını (canlı konum paylaşımı)
- Yolculara push bildirim gönderme
- Duyuru kanalı

**Deneme bittikten sonra hâlâ ücretsiz olan:**
- Yolcuların canlı takip ekranı (ASLA KİLİTLENMEZ)
- QR kod ile yolcu ekleme
- Temel profil yönetimi

**Mantık:** Yolcu tarafını asla kilitleme. Yolcu ücretsiz kullanmaya devam etmeli ki şoföre baskı yapsın: "Abi uygulama çok iyiydi, neden kapattın?"

## Deneme Süresi Gerçekten İşe Yarar mı?

**Evet, AMA 30 gün çok uzun.**

**Karar: 14 gün deneme süresi.**

Gerekçe:
- 14 gün = 10 iş günü = alışkanlık oluşturmak için yeterli
- 30 gün kullanıcıya "acelem yok" hissi verir → erteleme → unutma
- 14 günün sonunda "bunu kaybetmek istemiyorum" hissi daha güçlü (loss aversion)

## Odeme Sayfasi Nerede Gorunmeli? (App Store / Play Uyumlu)

Paywall rastgele pop-up olmamali. Sadece 3 noktada gorunmeli:
1. `Ayarlar > Abonelik` (kullanici kendi iradesiyle)
2. Trial bittiginde ana ekranda persistent banner (`Denemeniz bitti - canli modu ac`)
3. Premium aksiyon aninda intent-driven gecis (ornek: canli takip frekansi artirma)

Kullanici deneyimi kurallari:
- Yolcuya paywall gosterilmez; yalniz sofor rolune gosterilir.
- Paywall kapaninca uygulama kullanilabilir kalir (soft-lock), veri kaybi olmaz.
- Ekranda her zaman iki kontrol bulunur:
  - `Restore Purchases` (iOS) / `Satin Alimlari Geri Yukle` (Android)
  - `Manage Subscription` (store abonelik ekranina gider)

Store uyum kurallari:
- iOS dijital ozellik satin alimlari sadece App Store IAP ile yapilir.
- Android dijital ozellik satin alimlari sadece Google Play Billing ile yapilir.
- Varsayilan global akista uygulama ici harici odeme linki veya "webden daha ucuz al" metni kullanilmaz.
- Eger storefront bazli policy istisnasi kullanilacaksa (ulkeye ozel program), feature flag + hukuk/policy onayi olmadan acilmaz.
- Zorunlu feature flag seti (tek kaynak): `tracking_enabled`, `announcement_enabled`, `guest_tracking_enabled`, `force_update_min_version`, `directions_enabled`, `map_matching_enabled`.

**Hesap silme + abonelik uyum kurali (zorunlu):**
- Aktif aboneligi olan kullanici `Hesabimi Sil` dediginde direkt silme yapilmaz.
- Once su uyari gosterilir: `Hesabi silmek odemeyi durdurmaz. Once store aboneligini iptal et.`
- Ayni ekranda `Manage Subscription` linki zorunlu bulunur.

**Soft-lock metin notu (korunacak):**
- Yolcu tarafindaki `Servis Baglantisi: Dusuk Oncelik Modu` ifadesi aynen korunur (teknik ariza metniyle karistirilmaz).

---

# 9️⃣ BÜYÜME & VİRAL DÖNGÜ

## Şoför Bu Uygulamayı Neden Başkasına Önerir?

1. **"Artık telefonum çalmıyor" etkisi.** Şoför ilk hafta farkı yaşar: yolcular aramıyor, çünkü uygulamadan bakıyorlar. Bu rahatlığı meslektaşına anlatır.
2. **Profesyonellik algısı.** "Ben artık uygulamalı çalışıyorum" demek, şoföre statü kazandırır.
3. **WhatsApp köprüsü:** Her duyuruda uygulama linki WhatsApp'a gider → grubun 14 kişisi linki görür → merak eden indirir.

## Yolcu Arkadaşına Neden Link Atar?

1. **"Bak servisi canlı izliyorum" gösterişi.** İlk gördüklerinde insanlar bunu paylaşmak ister.
2. **Paylaşım linki:** `nerede.servis/SRV4821` → tarayıcıda harita açılır → uygulama indirme tetiklenir. Bu özellik MVP'de OLMALI.
3. **Aynı servisteki iş arkadaşı etkisi.** Bir kişi kullanmaya başlayınca aynı servisteki 14 kişiye bulaşır.

## Viral Döngü Mekanizması

```
Şoför kayıt olur
    ↓
QR kodu arabanın camına yapıştırır
    ↓
Yolcu QR kodu okutup katılır
    ↓
Yolcu sabah "vay be, çalışıyor!" diyor
    ↓
WhatsApp'ta iş arkadaşına link atıyor
    ↓
Yeni yolcu katılıyor (uygulama veya web)
    ↓
Başka servisteki arkadaşına "sizin şoförde de olsa keşke" diyor
    ↓
Yeni şoför merak edip indiriyor
    ↓
Döngü tekrarlanır
```

**Kritik büyüme kanalları:**
1. **QR kod (fiziksel):** Servissin ön camına yapıştırılır. Sabah binen herkes görür.
2. **Paylaşım linki (dijital):** WhatsApp'ta tek tıkla paylaşım.
3. **Sabah bildirimi (hatırlatma):** Uygulamayı açtıran, günlük alışkanlık kuran kanal.
4. **Şoför ağı (sosyal):** Şoförler birbirini tanır. Bir kahvehanede 5 şoföre ulaşabilirsin.

## Darıca'dan Gebze'ye Yayılma Stratejisi

1. **Hafta 1-2:** Darıca'da 3-5 şoförle başla. Yüz yüze git, uygulamayı yükle, QR kodlarını yazdırıp ver.
2. **Hafta 3-4:** Bu şoförlerin yolcuları katılır. 3 şoför × 15 yolcu = ~45 yolcu.
3. **Ay 2:** Memnun yolcular Gebze'deki servislerde sormaya başlar: "Sizde de var mı bu?"
4. **Ay 3:** Gebze'deki ilk şoförler katılır. Aynı döngü.
5. **Ay 4-6:** "OSB bölgesi" hedefi. Gebze OSB, GOSB, Dilovası OSB — büyük fabrikalar, çok servis.

**Organik büyüme hedefi:** Ayda %30-50 kullanıcı artışı, ilk 6 ay sıfır reklam bütçesiyle.

---

# 🔟 RİSKLER & GERÇEKLER

## "Bu Ürün Tutmayabilir" Noktaları

| Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|
| Şoförler telefon kullanmak istemez | Orta | Ölümcül | Minimal etkileşim tasarımı. "Tek butona bas" prensibi |
| WhatsApp alışkanlığı kırılamaz | Yüksek | Yüksek | WhatsApp'ı yenmeye çalışma, tamamla. Paylaşım linki WhatsApp'tan atılır |
| Yolcular "gerek yok" der | Orta | Yüksek | İlk "aha anı"nı 10 saniye içinde yaşat |
| İnternet/sinyal sorunu | Yüksek | Orta | Offline mod + cache + "son güncelleme" UI |
| Rakip çıkar (Google Maps canlı konum, vs.) | Düşük-Orta | Yüksek | Niş odaklanma. "Personel servisi" spesifik çözümü genel araçtan her zaman iyidir |
| **Firebase Vendor Lock-in** | Düşük | Yüksek | **Risk.** Çözüm: V1.0'da hız > bağımsızlık. V2.0'da Hexagonal mimari düşünülebilir. |
| **SRV Çakışması** | Düşük | Yüksek | **Çözüldü.** Cloud Function global unique kod üretir. Transaction ile DB'de var mı diye bakar. Çakışma imkansız. |

## KVKK Riskleri

**Bu ciddi bir risk. Hafife alma.**

1. **Konum verisi = kişisel veri.** KVKK kapsamında "hassas olmayan kişisel veri" kategorisinde. Ama yine de açık rıza gerekli.
2. **Zorunlu adımlar:**
   - Aydınlatma metni (uygulama içi + web sitesi)
   - Açık rıza onay ekranı (ilk kullanımda)
   - Veri saklama süresi politikası (konum verisi 7 gün sonra otomatik silinir)
   - VERBİS kaydı (6698 sayılı kanun gereği)
   - Veri sorumlusu iletişim bilgileri
3. **Firebase sunucuları Avrupa'da mı?** Firebase `europe-west1` (Belçika) veya `europe-west3` (Frankfurt) bölgesini MUTLAKA seç. ABD sunucusu kullanma — KVKK ihlali riski.
**Konum verisi minimizasyonu:** Yalnızca sefer sırasında topla. Sefer bittiğinde GPS tamamen dursun.
> **Kritik:** Şoför seferi bitirdiğinde ekrana kocaman yeşil bir "KONUM TAKİBİ KAPANDI 🔒" onayı gelmeli. Şoförün içi rahat etmeli: "Beni artık izlemiyorlar." Bu psikolojik güvenlik şart.

## Apple / Google Mağaza Politikaları

### Apple App Store
- **Arka plan konum izni:** Apple bu konuda çok sıkı. "Always" konum izni gerektiren uygulamaları sıkı denetler. Review sürecinde red yeme riski var.
- **Çözüm:** Review notlarına detaylı açıklama yaz. Video demo gönder. "Şoför seferdeyken konum paylaşır, sefer bitince durur" senaryosunu net anlat.
- **Review kalkanı:** Şoför aktif sefer ekranında Driver Guidance Lite goster (sıradaki durak + mesafe + sade harita). "Yolcu izlesin" tek basina gerekce olmasin.
- **Terminoloji kuralı:** Apple ile iletişimde `tracking` yerine `Route Coordination` ve `Trip Sharing` dili kullan.
- **14 gün deneme:** Apple "auto-renewable subscription" kurallarına uygun olmalı. "Restore purchase" butonu ZORUNLU.
- **Odeme akisi:** Dijital ozellik satisi icin app ici odeme zorunlu (IAP). Harici odeme linki verme.
- **Hesap silme gorunurlugu:** `Hesabimi Sil` akisi Ayarlar icinde kolay erisilir olmali (derine gomme; guideline 5.1.1(v) riski).
- **Grace period:** App Store Connect'te billing grace period acik olmali (odeme sorunu yasayan kullanicida ani churn'i azaltir).
- **Not:** Bolgesel policy istisnalari varsa (storefront bazli), yalniz o ulkede ve hukuki onayla ac.

### Google Play Store
- **Foreground service bildirimi:** Android 12+ zorunlu. "NeredeServis konumunuzu paylaşıyor" bildirimi sürekli görünmeli.
- **Konum izni dialogu:** Google'ın önerdiği "incremental permission" yaklaşımını kullan. Önce "kullanırken", sonra "her zaman" iste.
- **Role-based izin:** Konum izni sadece şoför rolünde istenir. Yolcu/guest için konum izni asla istenmez.
- **Background location beyanı (Play form):** `Şoför aktif sefer başlattığında, yolcuların güvenli ve doğru takip edebilmesi için uygulama arka planda konum paylaşır. Sefer bittiğinde takip durur.`
- **Data Safety uyumu:** Driver location = evet, passenger/guest location = hayır, third-party sharing = hayır, hesap silme = evet.
- **Kategori önerisi:** `Travel & Local` (Play reviewer açısından en temiz konumlandırma).
- **Kapalı test:** Production öncesi Play closed testing koşulları kanıtlı tamamlanmalı.
- **Manifest zorunlulugu:** Android 14+ icin servis `foregroundServiceType=\"location\"` ile tanimlanmali; `WAKE_LOCK` ve ilgili FGS izinleri dogru eklenmeli.
- **Billing uyumu:** Adapty SDK + native store billing bagimlilik surumu release gate'te kanitlanmali.
- **Odeme akisi:** Dijital ozellik satisi icin Google Play Billing zorunlu. Abonelik iptal/yonetim linki acik olmalı.
- **Not:** Uygun storefront/policy programi disinda alternatif billing acilmaz.

## Teknik Borç Riski

| Risk | Çözüm |
|---|---|
| Firestore veri modeli büyümesi | Koleksiyon yapısını baştan doğru kur. V1.0'da company alanı boş olsa bile yapı hazır olmalı |
| Firebase RTDB veri büyümesi | Sefer bittiğinde konum verisini sil veya arşivle. RTDB sadece "şu an" için |
| Mapbox API değişiklikleri | Harita servisini soyutla (MapProvider interface). Geçiş kolaylaşır |
| Flutter paket sürüm uyumsuzlukları | `pubspec.yaml` sürüm pinleme. Her güncelleme öncesi test |
| Çoklu güzergah karmaşıklığı | Route şablon + Trip ayrımını temiz tut. God class yaratma |
| Adapty entegrasyonu karmaşıklığı | V1.1'de basit boolean "isPremium" yeterli |
| Support yükünün patlaması | `Sorun Bildir` + `Shake to Report` ile tanılama paketini otomatik topla, PII redaction zorunlu |

## Tek Geliştirici İçin En Tehlikeli Noktalar

1. **iOS arka plan GPS:** En çok vakit kaybedilen nokta. iOS simülatörde çalışır, gerçek cihazda çalışmaz senaryosu yaşanabilir. Erken test et.
2. **App Store review süreci:** İlk submission 1-2 hafta sürebilir. Red → düzelt → yeniden gönder döngüsü aylar alabilir. Erken başvur.
3. **Burnout:** Tek kişi olarak "her şeyi yapmalıyım" hissi tüketir. MVP'yi dar tut. "Yeterince iyi" kavramını kabul et.
4. **Şoför desteği:** Teknoloji okuryazarlığı düşük şoförlerle yüz yüze destek gerekebilir. Bunu zaman planına dahil et.
5. **Tanilama yoksa destek kilitlenir:** `Sorun Bildir`/`Shake to Report` yoksa "uygulama bozuk" geri bildirimi aksiyona donusmez.

---

# 1️⃣0️⃣.5 MALİYET ANALİZİ (Kesinleşti)

## Aylık Altyapı Maliyeti: **$0**

Google Sign-In + e-posta/şifre auth modeli ile SMS maliyeti sıfırlandı. Tüm Firebase servisleri ücretsiz limitler dahilinde.

| Servis | Ücretsiz Limit | Bizim Kullanım (100 şoför, 1500 yolcu) | Maliyet |
|---|---|---|---|
| Firebase Auth (Google + email/password) | Sınırsız | ~1600 hesap | **$0** |
| Firebase RTDB | 1GB depolama, 10GB/ay transfer | ~50MB (temizleme ile) | **$0** |
| Firestore | 50K okuma/gün, 20K yazma/gün | ~30K okuma, ~5K yazma | **$0** |
| Cloud Functions | 2M çağrı/ay | ~50K/ay | **$0** |
| FCM Push | Tamamen ücretsiz | Sınırsız | **$0** |
| Firebase Hosting | 10GB/ay, 1GB depolama | ~1GB transfer | **$0** |
| Mapbox Maps | 50K yükleme/ay | ~30K/ay | **$0** |
| Mapbox Directions | 100K istek/ay | ~75K/ay | **$0** |

## Tek Seferlik Maliyetler

| Kalem | Maliyet |
|---|---|
| Apple Developer Account | $99/yıl (~₺3.500) |
| Google Play Developer | $25 tek seferlik (~₺875) |
| Domain (neredeservis.app) | ~$14/yıl (~₺490) |
| **TOPLAM** | **~₺4.865** |

> **Not:** Apple Developer hesabı olmadan sadece Android'de başlanabilir. Bu durumda başlangıç maliyeti **₺1.365**.

> **Not:** Firebase Blaze planına geçiş zorunlu (Cloud Functions için). Blaze = kullandığın kadar öde, $0 taban maliyet. Ücretsiz limitler aynen geçerli.

---

# 1️⃣1️⃣ SÜRÜM PLANI (V1.0 → V1.1 → V1.2)

## V1.0 — Çekirdek (İlk 30 Gün)

### Hafta 1-2: Temel Altyapı + Veri Modeli
- [ ] Flutter proje kurulumu + tema + routing (GoRouter)
- [ ] Flutter/FVM lock (`3.24.5`) + `docs/flutter_lock.md`
- [ ] Firebase projesi oluşturma (Blaze plan, `europe-west3`)
- [ ] Firestore veri modeli kurulumu (tüm koleksiyonlar + güvenlik kuralları)
- [ ] Firebase Auth (Google Sign-In + e-posta/şifre) + anonim giriş + şifre sıfırlama
- [ ] Firestore + RTDB güvenlik kuralları yazımı
- [ ] `driver_directory` direct read kapatma + callable arama kontratı
- [ ] Cloud Functions projesi: `generateSrvCode` + `onPassengerJoined` + `onPassengerLeft`
- [ ] Dart modelleri (Company, Driver, Route, Stop, Passenger, Trip, LocationData)
- [ ] Drift `schemaVersion` + migration stratejisi (veri kaybı testiyle)
- [ ] Feature flag sözleşmesi (`tracking/directions/map_matching/...`) ve varsayılanları
- [ ] Onboarding + rol seçim ekranları
- [ ] Firebase Hosting: QR landing page (tek HTML)

### Hafta 2-3: Güzergah Yönetimi + GPS
- [ ] Güzergah oluşturma ekranı (`Pin` + `Ghost Drive` modları, scheduledTime, opsiyonel durak)
- [ ] Ghost Drive kalite hatti (`sanitize + DP + Map Matching`, timeoutta DP fallback)
- [ ] Güzergah düzenleme (haritadan pin, drag-drop durak sıralama)
- [ ] Şoför ana ekranı (güzergah listesi + sefer başlat/bitir)
- [ ] Şoför aktif sefer heartbeat UI (`YAYINDASIN` + durum renkleri + red periferik alarm + ayri haptic pattern)
- [ ] Heartbeat sesli geri bildirim (`Baglanti kesildi`, `Baglandim`, `Sefer sonlandirildi`) + ayarlardan ac/kapa
- [ ] `Seferi Bitir` güvenli etkileşim (`slide-to-finish` veya `uzun bas`)
- [ ] GPS servisi (arka planda 10 sn aralıkla konum alma)
- [ ] Canli marker icin Kalman smoothing (jitter azaltma)
- [ ] Firebase RTDB'ye konum yazma (routeId bazlı)
- [ ] QR kod üretme (universal link formatında)
- [ ] Cloud Functions: `onTripStarted` (FCM Topic bildirimi)
- [ ] `startTrip/finishTrip` icin `expectedTransitionVersion` optimistic lock
- [ ] `registerDevice` single-active-device policy + finishTrip cihaz kurali
- [ ] Akıllı dürtme: scheduledTime - 5dk'da tam ekran sefer başlatma bildirimi

### Hafta 3-4: Yolcu Tarafı + Bildirim + Polish
- [ ] Yolcu katılım akışı: hibrit (KATIL formu + SADECE TAKİP ET misafir modu)
- [ ] Yolcu katilim/ayar ekraninda `Sanal Durak` secimi (haritadan nokta)
- [ ] Role-based permission gate (konum izni sadece şoför, yolcu/guest için hiç isteme)
- [ ] UTF-8/TR karakter kalite testi (`ı, ş, ğ, ü, ö, ç`) uygulama + listing metinlerinde sorunsuz
- [ ] Yolcu "Servislerim" listesi (çoklu güzergah, timeSlot sıralama)
- [ ] "Şoför henüz hareket etmedi" bekleme kartı UI + delay inference (`scheduled + 10 dk` etiketi)
- [ ] Mapbox harita entegrasyonu + canlı takip ekranı
- [ ] Şoför aktif seferde Driver Guidance Lite (sade harita + sıradaki durak + mesafe + heartbeat)
- [ ] ETA hesaplama (Mapbox Directions API + client interpolasyon) + bottom-sheet
- [ ] ETA hedef onceligi: `Sanal Durak` varsa birincil, yoksa `boardingArea` fallback
- [ ] 4 seviyeli bayat veri UI (30sn/2dk/5dk/kayıp)
- [ ] FCM push bildirim (sabah tetik + yaklaşma)
- [ ] Şoför duyuru mekanizması + WhatsApp share intent köprüsü (`share_plus`)
- [ ] Yolcu güzergahtan çıkma (sola kaydır + onay)
- [ ] "Bugün Binmiyorum" yolcu bildirimi (sefer öncesi + sırası çalışır)
- [ ] "Bugün Binmiyorum" sonrası şoför listesinde alt sıraya alma + strikethrough + gün sonu reset
- [ ] Telefon numara görünürlük toggle (şoför + yolcu tarafı)
- [ ] İkame şoför mekanizması (authorizedDriverIds + şoför arama/ekleme)
- [ ] Tatil / sefer yok modu (vacationUntil + yolculara push + bildirim durdurma)
- [ ] Cloud Functions: `cleanupStaleData` (scheduled, gece 03:00)
- [ ] `morningReminderDispatcher` timezone enforce (`Europe/Istanbul`)
- [ ] Cloud Functions: `onTripStarted` 15 dk cooldown (notification storm engeli)
- [ ] Offline sefer başlatma/bitirme kuyruğu (GOSB'ta telefon çekmezse sefer kilitlenmesin)
- [ ] Offline sefer başlatma UI uyarısı (Firestore offline persistence)
- [ ] Offline replay stale filtre: `>60 sn` noktalar canlı marker path'ine yazilmaz
- [ ] Terminated app queue flush (Android WorkManager + iOS BGTask/Background Fetch)
- [ ] Sync truth UI (`Buluta yaziliyor...` / `Senkronlandi` / `Senkron hatasi`) + `PopScope` kapanis korumasi
- [ ] `Sorun Bildir` + opsiyonel `Shake to Report` (son 5 dk tanilama paketi + PII redaction)
- [ ] Misafir -> kayıtlı hesap geçişinde local ownership migration (Drift ownerUid transferi)
- [ ] iOS Live Activities + Android Live Updates API (fallback: promoted ongoing notification)
- [ ] Play Data Safety form taslağı (driver-only location + no third-party sharing) ve Privacy Policy uyum kontrolü
- [ ] Apple review metni terminoloji kontrolü (`tracking` yerine `Route Coordination` / `Trip Sharing`)
- [ ] Mapbox token güvenliği (bundle ID kısıtlaması)
- [ ] Offline cache + KVKK aydınlatma metni + onay ekranı

### 30. Gün Sonunda:
- 3-5 test şoförü ile gerçek ortamda çalışan uygulama
- Çoklu güzergah + opsiyonel durak çalışıyor
- Canlı GPS takibi + ETA + bildirimler çalışıyor
- QR ile yolcu ekleme + çoklu güzergah kaydı çalışıyor
- Saha geri bildirimleri toplanmış

## V1.1 — Monetization + Polish (30-45. Gün)
- [ ] Adapty entegrasyonu (49 TL/ay, 399 TL/yıl)
- [ ] 14 gün deneme → ödeme geçiş akışı
- [ ] Paywall entry-point kuralı (Ayarlar + trial banner + premium aksiyon tetigi)
- [ ] Store uyumu: IAP/Billing + Restore Purchases + Manage Subscription
- [ ] App Store billing grace period aktif + başarısız yenileme senaryosu testi
- [ ] Adapty SDK ve native billing bagimlilik surumu release gate'te kilitli
- [ ] iOS App Clip POC (QR -> mini native takip karti -> tam app'e gecis CTA)
- [ ] Android Instant App feasibility + uygun cihazlarda mini takip akisi
- [ ] QR scan -> mini deneyim -> full install donusum metrigi
- [ ] Paylaşım linki (nerede.servis/SRV4821)
- [ ] Referans ödülü mekanizması
- [ ] App Store + Play Store ilk gönderim
- [ ] Saha testlerinden gelen bug fix'ler
- [ ] Şirket Satış Kozu: "Demo Yönetim Paneli" (Fake data ile çalışan React frontend). Satış yapabilmek için şirkete bir hayal satmak lazım. V1.0'da sadece görüntü.

## V1.2 — Kurumsal + Analitik (60-90. Gün)
- [ ] Şirket web paneli (Firebase Hosting, vanilla JS veya Next.js)
- [ ] Şirket kayıt + şoför bağlama
- [ ] Şirket → güzergah oluşturma + şoföre atama
- [ ] Toplu duyuru (firma → tüm şoförler/yolcular)
- [ ] Şoför analitik paneli (sefer sayısı, dakiklik skoru)
- [ ] Sefer geçmişi (şoför + yolcu)
- [ ] Trafik bazlı gecikme tahmini

## 90. Gün Sonunda Elimizde Olması Gereken:

| Alan | Hedef |
|---|---|
| Kullanıcı sayısı | 15-30 şoför, 200-400 yolcu |
| Günlük aktif kullanıcı (DAU) | En az 100 |
| App Store durumu | iOS + Android'de yayında |
| Abonelik | Adapty entegre, ilk ödemeli kullanıcılar |
| Şirket paneli | En az 1 firma aktif kullanıyor |
| Bölge | Darıca tamamen, Gebze başlangıç |
| Stabilite | Crash rate < %1, uptime > %99.5 |

## "Devam / Bırak" Kararı Verdiren Metrikler

| Metrik | Devam Et | Pivot Yap | Bırak |
|---|---|---|---|
| Günlük aktif yolcu (DAU) | > 50 | 20-50 | < 20 |
| Şoför retention (7 gün) | > %60 | %30-60 | < %30 |
| Yolcu retention (7 gün) | > %40 | %20-40 | < %20 |
| Organik şoför kaydı (aylık) | > 5 yeni şoför | 2-5 | < 2 |
| Abonelik dönüşümü | > %10 deneme → ödeme | %5-10 | < %5 |

**90 günde "devam" sinyali alamazsan**, ürün yeniden düzenlenmeli veya bırakılmalı. Duygusallık yok. Veriye bak.

---

# 1️⃣2️⃣ SONUÇ: ANAHTAR TESLİM ÖZET

## Bu Ürün Neye Dönüşüyor?

NeredeServis, Türkiye'deki personel servisi ekosisteminin **dijital sinir sistemi** olmaya aday. Pilot bölgeden başlayıp, OSB'ler → il geneli → Türkiye geneli ölçeklenebilir. Ama önce Darıca–Gebze'de çivinin çakılması gerekiyor.

## Kim İçin Vazgeçilmez Oluyor?

1. **Sabah servisini bekleyen sanayi çalışanı:** "Bir bakışta servisim nerede?" sorusuna 5 saniyede cevap.
2. **Sürekli aranan servis şoförü:** Telefonun çalmaması = huzur. Çoklu güzergah yönetimi = düzen.
3. **Servis firması sahibi (V1.2, B2B):** Web panelden filo yönetimi + yolcu memnuniyeti verileri.

## MVP Net Tanımı (Güncellenmiş)

> **14 gün deneme süreli, Google Sign-In + e-posta/şifre auth ile $0 altyapılı, Firebase güvenlik kurallarıyla korunan, çoklu güzergah destekli, opsiyonel duraklı, Mapbox haritada canlı servis takibi yapan, ETA'yı Mapbox Directions API ile hesaplayan, QR universal link ile güzergaha özel yolcu ekleyen, FCM Topics ile bildirim atan, Cloud Functions Gen 2 ile sunucu mantığı çalıştıran, 4 seviyeli bayat veri UI'lı, çoklu cihaz korumalı, Firebase altyapılı Flutter mobil uygulama. Şirket paneli altyapısı hazır, UI V1.2'de.**

Bunun dışında her şey V1.1 veya V1.2.

## En Doğru İlk Adım

Darıca'da fiziksel olarak 3 servis şoförüyle tanış. Onlara prototipi göster. "Bunu kullanır mısın?" değil, "bunu kullanmak için telefon numaranı verir misin?" de. Numara veriyorsa gerçek talep var. Vermiyorsa ürüne değil, sahaya dön.

---

# "Eğer Tek Başıma Başlasaydım, İlk Satır Kodu Atmadan Önce Şunları Kesin Yapardım"

**1. 3 şoförün yanına oturur, bir sabah seferine biner, gözlemler.** Teoriyi bırakır, gerçeği yaşaıdım. Kim ne zaman telefona bakıyor? Hangi durağa kaç dakika gecikiyor? WhatsApp grubuna ne yazıyor? Yolcuların yüz ifadeleri nasıl?

**2. Bu 3 şoföre kağıt üstünde (veya Figma prototipi) ekranları gösterirdim.** "Bu işe yarar mı?" diye sormazdım — o soruya herkes "evet" der. "Bunu kullanmak için ayda kaç lira verirsiniz?" diye sorardım. Ve yalana karşı dikkatli dinlerdim.

**3. Firebase projesini kurardım ama sadece RTDB yazdığını doğrulayan tek bir script yazardım.** GPS → RTDB → okuma döngüsünü 2 saat içinde kanıtlardım. Bu çalışmazsa veya gecikme yaşatırsa, mimariyi değiştirmem gerektiğini daha kod yazmadan bilirdim.

**4. iOS arka plan GPS testini en baştan yapardım.** Fiziksel bir iPhone'da (simülatörde değil) arka planda 10 saniye aralıkla GPS almanın gerçekten çalıştığını, Apple'ın bunu kapatmadığını doğrulardım. Bu 50 yıllık deneyimimin bana öğrettiği en acı ders: "Sonra çözerim" hiçbir zaman çözülmez.

**5. KVKK aydınlatma metnini ve gizlilik politikasını bir avukata yazdırırdım.** 500-1.000 TL'ye avukat masrafı, App Store red cezasından çok daha ucuz. Bu belgeleri yazmadan mağazaya asla göndermezdim.

**6. Mapbox hesabı açar, API anahtarını alır, Flutter'da haritayı gösterirdim.** Haritayı görmeden mimari kararı kesinleştirmezdim. Belgelere güvenme, ekranında gör.

**7. Son olarak, kendime dürüst bir soru sorardım: "Bu uygulamayı 6 ay boyunca bakımını üstlenecek enerjim var mı?" Çünkü MVP yazmak 1 ay. Ama onu ayakta tutmak, şoförlerin telefonuna destek vermek, App Store güncellemeleri, Firebase kuralları, Mapbox yeniliklemeleri — bunlar aylar ve yıllar sürer.** Buna hazır değilsen başlama.

---

> **Tek cümleyle:** Bu ürün "servis nerede?" sorusuna 5 saniyede cevap veren bir güven motorudur. Daha az, daha fazla olmak zorunda değil. Ama bu "azı" kusursuz yapmazsan kimse kullanmaz.
