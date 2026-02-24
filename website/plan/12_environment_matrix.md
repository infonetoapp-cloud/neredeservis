# Web <-> Firebase Environment Matrix (V0)

Tarih: 2026-02-24
Durum: Oneri / Faz 0

## 1. Amac

Web ortamlarinin hangi Firebase projelerine baglanacagini kesinlestirmek.

Bu dokumanin amaci:
- ortam karmasasini engellemek
- prod kirlenmesini onlemek
- release dogrulamasini guvenilir yapmak

## 2. Matrix (onerilen)

| Katman | Dev | Staging | Production |
|---|---|---|---|
| Web frontend | `web-dev` / preview | `web-stg` | `web-prod` |
| Azure plan | Student + SWA Free | Student veya PayG + SWA Free/Std (gecici) | PayG + SWA Standard |
| Firebase project | `neredeservis-dev-01` | `neredeservis-stg-01` | `neredeservis-prod-01` |
| Mapbox token | dev token / shared low-risk | stg token | prod token |
| Analytics | kapali veya test | sinirli/test | production policy |
| Sentry | opsiyonel | acik | acik |

## 3. Domain Matrix

Dev:
- Azure preview generated domain (public duyuru yok)

Staging:
- Oneri: `stg-app.neredeservis.app` (faz 1/2'de acilabilir)

Prod:
- `app.neredeservis.app`
- `neredeservis.app` (landing)

Not:
- MVP baslangicinda staging custom domain ertelenebilir; ama environment ayrimi yine korunur.

## 4. Firebase Web Config Ayirma Kurali

Her web env kendi Firebase config setini kullanir:
- API key
- authDomain
- projectId
- appId
- databaseURL

Kural:
- `web-prod` bundle'inda dev/stg config bulunmaz
- `web-dev` preview'da prod Firebase config bulunmaz

## 5. Secrets / Public Config Listesi (Panel)

### 5.1 Public (bundle'a girebilir)
- Firebase web public config alanlari
- Mapbox public token
- app env badge (`dev/stg/prod`)

### 5.2 Secret (bundle'a giremez)
- server-side admin keys
- webhook secrets
- signing secrets
- service credentials

## 6. Build-Time / Run-Time Karari

Panel webde baslangicta:
- build-time env + Azure env vars yeterli

Ileride:
- runtime config endpoint (gerekirse)

## 7. Gecis Kurali (Student -> Prod)

Student crediti biterse:
- kod degismez
- env keyler degismez (hedef subscription/resource ayni ise)
- sadece Azure plan/subscription tarafi guncellenir

Eger yeni production subscription acilirsa:
- sadece Azure deployment target / DNS / env secret baglantilari guncellenir

## 8. Operasyon Kurali (musteri acilisi)

Ilk musteri onboarding oncesi zorunlu:
- `web-prod -> firebase prod` dogrulama
- cost alertlar aktif
- env badge prod haric yerlerde gorunur
- CORS allow-list prod domainlerle sinirli

## 9. Kontrol Checklisti (Faz 1 kod baslangici oncesi)

- [ ] `web-dev` Firebase dev config hazir
- [ ] `web-stg` Firebase stg config hazir
- [ ] `web-prod` Firebase prod config hazir
- [ ] Mapbox token ayrimi planlandi
- [ ] Azure env var isimleri standardize edildi
