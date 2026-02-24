# Panel Visual Patterns + Interaction Spec (MVP V0)

Tarih: 2026-02-24
Durum: V0 / plan

## 1. Amaç

Panel ekranlarini tek tek tasarlamak yerine ortak pattern'lerle tasarlamak.

Hedef:
- tutarlilik
- hizli gelistirme
- premium gorunum
- bakimi kolay UI

## 2. Core Layout Patterns

### P-01: Standard Management Page

Kullanim:
- drivers
- vehicles
- routes
- members

Yapı:
- top context bar (title + subtitle + actions)
- filter/search row
- content area (table/cards)
- detail drawer veya detail route

### P-02: Detail Workspace Page

Kullanim:
- route detail
- driver detail
- vehicle detail

Yapı:
- page header
- summary cards / metadata
- tabs veya sections
- contextual actions

### P-03: Live Ops Split View (showcase pattern)

Kullanim:
- canli operasyon

Yapı:
- left pane: active trips list / filters
- center: map
- right drawer: selected trip/driver details

Kural:
- split layout responsive ama desktop-first optimize

## 3. Table Pattern (ERP hissine kaymadan)

### 3.1 Table design rules

- rahat satir yuksekligi
- temiz header
- gereksiz grid line kalabaligi yok
- status chip semantik
- inline actionlar sade
- bulk actions sadece gerekliyse

### 3.2 Table + Drawer pattern

Detaylari tablonun icine sıkıştırma:
- satira tikla -> drawer/detail

Neden:
- ekran nefes alir
- premium hissi artar
- satirlar okunakli kalir

## 4. Forms Pattern (Create/Edit)

### 4.1 Form layout

- section bazli form grouping
- max width kontrollu
- uzun formlarda sticky action bar (gerektiginde)

### 4.2 Validation UX

- field-level validation
- submit-level summary (gerekirse)
- hata mesajlari teknik degil, kullanici dostu

### 4.3 Dangerous actions

- archive/delete/suspend icin ayrik alan
- accidental click riski azaltilir

## 5. Status System (UI)

Durumlar standard component'lerle gosterilecek:
- `Active`
- `Inactive`
- `Pending`
- `Suspended`
- `Archived`
- `Live`
- `Stale`
- `Error`

Kural:
- Her feature kendi status badge'ini sifirdan yazmaz

## 6. Feedback Patterns

Standart feedback tipleri:
- toast (basari/kisa bilgi)
- inline error
- empty state
- confirmation modal
- destructive confirm dialog

Kural:
- her mutasyon sessiz bitmez
- kullanıcıya sonuc net gosterilir

## 7. Navigation Interaction Rules

- sol nav collapse/expand (opsiyonel)
- current route vurgusu belirgin
- company context ustte sabit
- env badge gorunur (dev/stg)

## 8. Live Ops Map Pattern (detay)

### 8.1 Map UX hedefi

- bir bakista durum anlasilsin
- harita merkezli ama veriyle dengeli

### 8.2 Layering

- map base
- route path layer
- vehicle markers
- stale/live visual states
- selected marker highlight

### 8.3 Side panel behavior

- secili trip/driver detay drawer
- quick actions (role'e gore)
- related route/driver screens'e gecis

## 9. Responsive Strategy (MVP)

Desktop:
- primary hedef

Tablet:
- split pane sadeleşebilir

Mobile web:
- temel kullanım/smoke support
- tam operasyon ekranı yerine sade görünüm olabilir

Kural:
- responsive = her sey aynı değil, kullanilabilirlik korunur

## 10. Skeleton / Empty / Error Pattern Library

Her ana pattern icin skeleton tasarlanır:
- management table
- detail page
- live ops split

Empty state kurali:
- sadece "veri yok" degil
- ne yapmali CTA'si olsun

## 11. Premium Hissin Teknik Karsiligi

Premium his = su kombinasyon:
- spacing disiplini
- typography hiyerarsisi
- sade renk sistemi
- tutarli interactions
- temiz state tasarimi

Sadece parlak gradient ile premium olunmaz.

## 12. Faz 1-3 Uygulama Sirasi (UI pattern)

Faz 1:
- auth pages
- shell layout
- nav/top bar pattern
- basic cards/buttons/inputs

Faz 2:
- management page pattern
- route form + stop editor pattern

Faz 3/4:
- company member pattern
- live ops split view pattern
- audit log pattern
