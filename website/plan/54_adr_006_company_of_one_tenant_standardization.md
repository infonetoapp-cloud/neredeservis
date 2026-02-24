# ADR-006: Company-of-1 Tenant Standardization

Tarih: 2026-02-24
Durum: Accepted
Supersedes/clarifies: `08_domain_model_company_rbac.md` bireysel model bolumleri (kismi)

## 1. Problem

Bireysel sofor ve kurumsal firma deneyimlerini ayri domain modelleri olarak tasarlamak:
- policy kodunda dallanma artirir
- route guard / API authz katmanini sisirir
- migration ve billing tarafinda iki farkli dunya olusturur

Solo-founder MVP icin bu tekrarli yapi delivery hizini dusurur.

## 2. Karar

Sistemde tek tenant modeli kullanilacak: `Company`.

Bireysel sofor kullanicilar icin arka planda gorunmez bir `Company of 1` tenant olusturulacak.

Yani:
- bireysel sofor UX'i korunur
- backend/policy/data modeli company-temelli ortak kalir

## 3. Pratik Model

### Company tipleri

`company.type`:
- `business`
- `individual_operator`

### Bireysel sofor nasil temsil edilir?

Varsayilan yaklasim (revize - lazy initialization):
- `individual_operator` company her kullanici signup aninda zorunlu yaratilmaz
- Shadow company, kullanici ilk kez bireysel sofor aksiyonuna girdiginde (ornegin bireysel paneli acma / arac/rota olusturma) olusturulur
- Kullanici bu company'nin `owner` uye kaydi olur
- Arac/rota/durak/sefer verileri bu company tenant'i altinda tutulur

## 4. Neden Bu Karar?

1. RBAC/policy sadeleşir
- Her sey company context ile calisir
- "individual mode" sadece UI mode farki olur

2. Migration kolaylasir
- Bireyselden kurumsala gecis yeni model degil, ayni modelin buyumesi olur

3. Billing / paketleme kolaylasir
- Her tenant icin ayni abonelik mantigi calisabilir

4. Audit / export / reporting standardizasyonu artar

## 5. Sonuclar (pozitif / bedel)

Pozitif:
- daha az if/else policy kodu
- ortak endpoint semantigi
- tek tenant lifecycle

Bedel:
- bireysel moda ilk giriste lazy company olusturma akisi gerekir
- UX tarafinda "sen aslinda company'sin" dili gizlenmeli

## 6. Uygulama Kurallari (MVP)

1. Individual mode UI route'lari company-aware backend kullanir
2. `activeCompanyId` kavrami individual kullanicida da bulunur
3. Membership sorgulari tek sistem uzerinden yurur
4. Bireysel kullanici bireysel operator modunu ilk kullandiginda default tek company uye kaydina sahip olur
5. Bireysel -> kurumsal buyume akisi "company type/paket/uye ekleme" ile genisler

## 7. Etkilenen Dokumanlar / Planlar

Guncellenecek veya referanslanacak:
- `08_domain_model_company_rbac.md`
- `14_auth_and_rbac_flow.md`
- `42_p0_endpoint_contracts_v1_draft.md`
- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `60_billing_internal_admin_and_suspension_policy_plan.md`

## 8. Fazlama Etkisi

- Faz 1: session bootstrap / mode selector company-aware olur
- Faz 2: bireysel panel aslinda company-of-1 tenant ustunde calisir
- Faz 3: kurumsal tenant ozellikleri genisler

## 9. Review Zamani

Faz 3 sonunda tekrar degerlendir:
- company-of-1 UX friction olustu mu?
- billing paketleme sade kaldi mi?
- migration kolaylastirdi mi?
