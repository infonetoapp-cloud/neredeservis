# Quality Gates + Definition of Done (Web Program)

Tarih: 2026-02-24
Durum: Oneri / kalite standardi

## 1. Amac

"Kod calisiyor" seviyesini yeterli kabul etmemek.

Bu dokuman:
- PR bazli kalite kapilari
- feature bazli done kriteri
- faz bazli done kriteri
tanımlar.

## 2. Global Definition of Done (DoD)

Bir is "done" sayilmasi icin:
- kapsam tamam
- test/plansiz degil, dogrulama yapilmis
- authz etkisi varsa kontrol edilmis
- hata/empty/loading durumlari dusunulmus
- dokuman/plan gerekiyorsa guncellenmis

## 3. PR Quality Gates (minimum)

Zorunlu:
- lint pass
- typecheck pass
- build pass
- degisiklikle ilgili testler pass

Gerekli oldugunda:
- e2e smoke
- permission/authz smoke
- manual QA checklist

## 4. Feature-Level DoD (ornekler)

### CRUD ekrani
- list/load/error state
- create/update validation
- unauthorized davranis
- optimistic UI varsa rollback
- audit etkisi varsa dogrulama

### RBAC ozelligi
- menu görünürlüğü
- route guard
- server-side deny testi
- cross-tenant deny testi

### Live map/ops ekrani
- harita load fallback
- stale/empty state
- subscription cleanup
- performans smoke
- quota/cost farkindaligi (gereksiz recalc yok)

## 5. Faz Bazli Gates

### Faz 1 Gate
- landing + panel shell deploy
- login/logout
- env badge
- CI temel pipeline

### Faz 2 Gate
- bireysel sofor rota/durak akisi calisiyor
- unauthorized access yok
- temel smoke testler var

### Faz 3 Gate
- company/member RBAC calisiyor
- role-based navigation + server authz tutarli
- cross-tenant deny testleri var

### Faz 4 Gate
- live ops ekrani calisiyor
- rota/durak policy enforced
- performans kabul edilebilir

### Faz 5 Gate
- audit log kritik mutasyonlari kapsiyor
- budget alerts aktif
- staging smoke suite yeşil

## 6. Non-Functional Gates (MVP)

### Performance
- panel ilk acilis kabul edilebilir
- live map ekrani tarayiciyi kitlemiyor
- gereksiz re-render / re-fetch kontrol altinda

### Security
- browser direct critical write yok
- secret leakage yok
- CORS/origin allow-list
- authz server-side enforced

### Maintainability
- 500+ satir dosya istisnalari gerekceli
- feature boundaries korunmus
- debug/todo birikimi kontrol altinda

## 7. Manual QA Checklist (MVP cekirdek)

Her release adayi icin en az:
- login/logout
- role switch / mode switch
- route list/detail
- stop add/edit/delete
- live ops screen smoke
- denied action UX

## 8. Regression Politikasi

Bug fix merge oncesi:
- ilgili regression testi veya test notu

Kritik bug:
- incident kaydi
- kok neden notu
- tekrarini onleyen task

## 9. Dokuman Guncelleme Kuralı

Asagidaki durumlarda plan/dokuman guncellenir:
- yeni endpoint eklendi
- role policy degisti
- env mapping degisti
- hosting/domain akisi degisti
- faz kapsamı kaydi

## 10. Mimar Karari (kalite tavizi)

MVP = kalitesiz degil.

Taviz verilebilecek:
- görsel polish
- advanced reporting
- billing UI

Taviz verilemeyecek:
- authz
- tenant isolation
- audit tasarimi
- code health kurallari
