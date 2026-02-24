# Visual Design Direction (Apple-like, Modern, Premium, Not ERP)

Tarih: 2026-02-24
Durum: Design Direction V0 (tasarim kodu degil)

## 1. Tasarim Hedefi (net)

Panel "muhasebe ekrani" gibi gorunmeyecek.

Hedef hissiyat:
- modern
- premium
- sade ama guclu
- Apple tarzi disiplinli arayuz hissi
- operasyonel veriyi temiz gosteren bilgi mimarisi

Not:
- Apple'i kopyalamak degil
- ayni kalite hissini veren tasarim prensipleri kullanmak

## 2. Temel Tasarim Prensipleri

1. Ferahlik:
- bosluk kullanimi cömert
- gereksiz grid/box kalabaligi yok

2. Hiyerarsi:
- basliklar net
- bilgi katmanlari belirgin
- en kritik veri once

3. Derinlik:
- hafif elevation / blur / surface layering
- ama "cam efekti spam" yok

4. Tipografi:
- temiz, premium, okunakli
- operasyon ekraninda hizli taranabilirlik

5. Motion:
- anlamli gecisler
- yavaslatmayan animasyon
- reduced motion destegi

## 3. Neler YAPMAYACAGIZ (anti-pattern)

- gri tablo + mavi buton + sıkışık form ERP gorunumu
- her ekranda 20 filtre
- bilgi kartlarini rastgele renklerle boyama
- zorunlu olmayan modal patlamasi
- kucuk font + yogun kolon cehennemi

## 4. Panel Visual Language (MVP)

### 4.1 Genel Yapi

- Sol nav + ust bar (veya compact rail + top context bar)
- Ana icerikte buyuk baslik + context + aksiyonlar
- Kartlar sade ama premium
- Harita ekraninda split-pane (liste + map + drawer)

### 4.2 Surface Sistemi

Yuzey katmanlari (taslak):
- background canvas
- primary surface
- elevated card
- floating panel/drawer

Kural:
- Border, shadow, blur ayni anda agresif kullanilmaz
- 1-2 gorsel teknikle derinlik verilir

### 4.3 Renk Yonu

MVP karakteri:
- acik tema oncelikli
- neutral base + tek kuvvetli vurgu rengi
- operasyon durumlari icin kontrollu status renkleri

Not:
- rastgele "dashboard rainbow" yok
- status renkleri semantik ve tutarli

## 5. Tipografi Yonu

Amaç:
- premium ama operasyonel
- uzun listede okunabilir

Kural:
- Baslik ve body icin net bir sistem
- sayisal/operasyonel degerlerde hizli taranabilirlik
- line-height ve spacing standardize

Font yonu (taslak):
- SF benzeri modern grotesk hissi veren bir tercih
- fallback planli

## 6. Component Tasarim Yaklasimi

### 6.1 Dashboard
- "finance ERP" kutu yigini degil
- buyuk sinyal kartlari + trend/uyari chipleri
- dikkat dagitmayan ozetler

### 6.2 Tables
- tablo agirlikli ekranlar modernlestirilecek:
  - rahat satir yuksekligi
  - sticky headers (gerektiginde)
  - inline actions sade
  - detail drawer ile bilgi yogunlugunu dagitma

### 6.3 Forms
- kademeli form layout
- section bazli grouping
- anlik validasyon ama gergin UX yok

### 6.4 Live Ops Map
- tasarimin vitrini
- panelin "premium" hissini en cok burasi verecek
- map + list + detail drawer kombinasyonu temiz olmalı

## 7. IA ile Iliski (tasarim kurali)

Premium gorunum sadece renk/font degildir.

Asil fark:
- iyi bilgi mimarisi
- dogru onceliklendirme
- temiz navigation
- tutarli states

Bu yuzden:
- `30_information_architecture_and_navigation.md` ile birlikte uygulanir
- `34_panel_user_flows_and_wireflow_plan.md` akislari temel alinır

## 8. Accessibility (premium olmanin parcasi)

Zorunlu:
- kontrast
- klavye erisimi
- focus states
- semantic labels

Premium = sadece güzel degil, kullanilabilir.

## 9. Fazli Tasarim Stratejisi

Faz 1:
- shell + nav + auth ekranlari (minimal premium temel)

Faz 2/3:
- CRUD ekran patternleri
- dashboard patternleri
- live ops map patterni

Faz 8:
- landing final visual polish

## 10. Tasarim Review Kriterleri (UI merge oncesi)

Bir ekran su sorulari gecmeli:
- bilgi yogunlugu kontrol altında mi?
- muhasebe/ERP hissine kayiyor mu?
- en onemli aksiyon ilk bakista bulunuyor mu?
- mobile/tablet davranisi dusunulmus mu?
- states (loading/empty/error/forbidden) tasarlanmis mi?

## 11. Mimar Karari (tasarim)

Panelin kimligi:
- modern operasyon merkezi
- sade, premium, hizli
- Apple-benzeri kalite hissi
- ama SaaS operasyon gercegine uygun
