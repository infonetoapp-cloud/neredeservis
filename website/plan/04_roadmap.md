# Web Sistem Yol Haritasi (Plan)

Tarih: 2026-02-24
Durum: Plan / tahmini

## Faz 0 - Plan ve Altyapi Kararlari (1 hafta)

Hedef:
- Kararlari kilitlemek, yanlis teknoloji secimini engellemek

Ciktilar:
- Hosting/domain karari
- Subdomain plani
- Web mimari ve RBAC plani
- MVP kapsam listesi
- Risk listesi

Bu klasorde olusan dokumanlar Faz 0 ciktisidir.

## Faz 1 - Web Temel Iskelet (1-2 hafta)

Hedef:
- Panel ve landing iskeleti acilsin, auth girisi calissin

Kapsam:
- Next.js projesi (ileride)
- `neredeservis.app` landing skeleton
- `app.neredeservis.app` panel skeleton
- "Giris Yap" akisi
- Firebase Auth web entegrasyonu
- temel layout/nav

Not:
- Landing tasarimi final olmayacak

## Faz 2 - Bireysel Sofor Paneli (2-3 hafta)

Hedef:
- Bireysel sofor webden temel operasyonu yapabilsin

Kapsam:
- profil / arac
- rota listesi + rota detayi
- durak yonetimi
- aktif sefer/son sefer gorunumu
- temel canli konum paneli (read-only)

Neden once bireysel?
- Firma RBAC'den daha basit
- Sistem omurgasini hizli test eder

## Faz 3 - Firma Tenant + RBAC + Operasyon (3-5 hafta)

Hedef:
- Firma admin/dispatcher kullanimi aktif olsun

Kapsam:
- Company / CompanyMember modeli
- roller: owner/admin/dispatcher/viewer
- sofor yonetimi (firma bagli)
- arac yonetimi
- rota sahipligi / atama
- canli operasyon haritasi (filo gorunumu)
- audit log (minimum)

## Faz 4 - Stabilizasyon + Raporlama + Guvenlik (2-3 hafta)

Hedef:
- Uretime yakin kalite

Kapsam:
- hata/telemetry dashboard
- performans ve maliyet optimizasyonu
- KVKK/log gozden gecirme
- rol/policy testleri
- operasyon runbook

## Faz 5 - Billing + Internal Admin UI + Landing Final (sonra)

Hedef:
- Ticari operasyonu olceklendir

Kapsam:
- abonelik satin alma akisi
- paketleme / fiyatlandirma paneli
- internal admin panel UI (kontrol altyapisi daha once planlanmis olacak)
- landing final tasarim ve marketing sayfalari

## Riskler (erken gorulecek)

1. Tenant/RBAC modeli gec netlesirse tekrar is olur
2. Canli takip read-grant modeli webde eksik cikarsa panel gecikir
3. Harita maliyetleri kontrolsuz acilirsa butceyi zorlar
4. Landing tasarimini erken yapmak core delivery'i yavaslatir

## Basari Kriteri (MVP)

- Bireysel sofor webden rota/durak yonetebiliyor
- Firma dispatcher birden cok sofor/rota gorebiliyor
- Aktif seferler haritada izlenebiliyor
- Kritik mutasyonlar audit kayit uretiyor
- Maliyet artisi kontrollu (harita/API)
