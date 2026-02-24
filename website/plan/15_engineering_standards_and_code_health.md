# Engineering Standards + Code Health Rules (Web)

Tarih: 2026-02-24
Durum: Non-negotiable (taslak V0)

## 1. Amac

Web sistemin:
- spagetti olmamasi
- tek kisiyle baslayip ekip buyudugunde bozulmamasi
- bakimi kolay kalmasi
icin muhendislik kurallarini bastan kilitlemek.

## 2. Ana Ilkeler

1. Modulerlik once gelir
2. Kisa dosya, kisa fonksiyon, net sorumluluk
3. Server-side authorization zorunlu
4. Dokumansiz kritik karar olmaz (ADR veya plan notu)
5. "Hizli yazalim sonra duzeltiriz" kalici politika olamaz

## 3. Dosya Boyutu ve Kod Karmasikligi Limitleri

### 3.1 Dosya satir limiti (soft cap)

Soft cap (genel):
- `500` satir / dosya

Hedef:
- cogu dosya `300` satir altinda kalsin

`500+` satir izinli olabilir ama su sartlarla:
- gercekten birlestirilmesi anlamli ise
- bolunme plani acikca not edilmis ise
- kod review'da gerekce yazilmis ise

Prototype/preview istisnasi:
- `website/prototype/*` gibi tasarim prototiplerinde kalite/deneysellik icin 500+ satir kabul edilebilir
- yine de duzensiz/spagetti yapi kabul edilmez (HTML/CSS/JS ayrimi, section disiplini korunur)

UI component/pragmatik istisna (review sonrasi netlestirme):
- render-agir sayfa/componentlerde (form + table + layout state) soft cap `800`e kadar esneyebilir
- ancak business logic / data mapping / authz hesaplari component icinden ayrilmis olmali
- `800+` satir UI dosyasi refactor alarmidir

Logic/Service dosyalari icin daha siki hedef:
- hooks/services/validators/policy dosyalari tercihen `300-400` satir bandinda tutulur
- `500+` satir logic dosyasi istisna degil, refactor adayi kabul edilir

### 3.2 Fonksiyon limiti (onerilen)

Hedef:
- cogu fonksiyon `<= 60` satir

`>100` satir fonksiyon:
- refactor adayi kabul edilir
- PR'da gerekce istenir

### 3.3 React component limiti (onerilen)

Hedef:
- ekran componenti container olsun
- UI parcaciklari ayrissin
- tek componentte business logic + render + fetch + forms birikmesin

Pratik kural:
- buyuk ekranlar `page + sections + hooks + services` olarak bolunur
- satir limiti yerine sorumluluk ayrimi esastir:
  - UI render yogunlugu olabilir
  - domain logic ve policy hesaplari merkezi kalir

## 4. Klasorleme ve Sorumluluk Ayrimi

Kural:
- feature bazli klasorleme
- ortak utility'ler `lib/*`
- authz/policy merkezi katmanda

Panel icin hedef:
- `features/<feature>/components`
- `features/<feature>/api`
- `features/<feature>/schemas`
- `features/<feature>/hooks`
- `features/<feature>/types`

Yasak:
- tum ekranlarin tek `components/` klasorunde yigılması
- ortak helper adi altinda domain logic gommek

## 5. API ve Veri Erisim Kurallari

1. Browser direct Firestore write yok (kritik mutasyonlarda)
2. Endpoint input validation (schema)
3. Typed response/error
4. Request correlation/requestId
5. Audit zorunlu mutasyonlar listesi korunur

## 6. State Management Kurallari (Web)

Varsayilan:
- server-state icin query katmani
- local UI state component icinde

Yasak/Limitli:
- her seyi global store'a atmak
- authz kararlarini sadece client state'e emanet etmek

## 7. UI/UX Kod Sagligi Kurallari

1. Harita ekrani ile CRUD ekranlarini ayri feature olarak ele al
2. Table/filter/sort mantigini tekrar etme; ortak util/component kullan
3. Form validation UI'da da schema'da da tutarli olsun
4. Accessibility:
   - keyboard navigation
   - focus visible
   - semantic structure

## 8. Naming / Tip / Contract Standartlari

- Kod dili: Ingilizce identifier
- UI metni: Turkce (MVP)
- Domain terimleri sabit:
  - company
  - member
  - driver
  - vehicle
  - route
  - stop
  - trip
  - assignment
  - audit

Kural:
- Ayni kavrama birden cok isim verilmez (ornek: `firmaUser`, `companyMember`, `operatorUser`)

## 9. Test Minimumu (MVP)

PR merge icin minimum:
- lint pass
- typecheck pass
- build pass
- kritik feature testleri (ilgili ise)

Kritik alanlar:
- auth guards
- RBAC policies
- route/durak mutasyon validation
- canli ops read modeli

## 10. PR ve Refactor Kurallari

1. Davranis degisimi + buyuk refactor ayni PR'da toplanmaz
2. PR aciklamasi su 4 maddeyi icermeli:
   - ne degisti
   - neden degisti
   - risk
   - test
3. 500+ satir dosya olustuysa gerekce notu zorunlu

## 11. ADR (Architecture Decision Record) Kurali

ADR gerektiren kararlar:
- hosting mimarisi degisikligi
- authz modeli degisikligi
- live ops read modeli degisikligi
- endpoint versionlama stratejisi
- map provider/ETA stratejisi degisikligi

Format kisa olabilir ama yazili olmak zorunda.

## 12. "Spagettiyi Durdurma" Alarm Listesi

Asagidakiler gorulurse refactor/task acilir:
- tek dosyada birden cok feature akisi
- UI component icinde dogrudan role/policy hesaplama karmasasi
- ayni endpoint logic'inin 2+ yerde kopyasi
- `TODO` ile gecistirilen authz/acik yetki bosluklari
- isimsiz utility dosyalari buyumesi (`helpers.ts`, `utils.ts`) 

## 13. Mimar Karari (senin talebine uygun net kural)

Varsayilan kural:
- "Tek dosya 500 satiri gecmeyecek" (genel soft cap)

Istisna:
- ancak teknik olarak anlamli ve savunulabilir ise
- review notu ile
- bolme plani backlog'a yazilarak

Ek not (review sonrasi):
- UI render-agir componentlerde kontrollu esneme olabilir (`~800`)
- logic/policy/service dosyalarinda esneme daha sinirli tutulur

Bu kural web projesinin bakim kalitesini korumak icin aktif uygulanacak.
