# Yetki Matrisi (MVP V0)

Tarih: 2026-02-24
Durum: Oneri / Faz 0

## 1. Kapsam

Bu dokuman su aktorler icin MVP yetki cercevesini tanimlar:
- Bireysel sofor (web panel)
- Firma bagli sofor (app + web gorunurluk)
- Firma panel roller

Not:
- Mobil roller (`driver/passenger/guest`) ile firma panel roller ayri katmandir.
- Ayni kullanici hem `driver` hem `companyMember(dispatcher)` olabilir.

## 2. Roller (MVP)

Firma panel rolleri:
- `owner`
- `admin`
- `dispatcher`
- `viewer`

Sofor tipleri:
- `individual_driver` (UX modu; backend'de Company-of-1 tenant context'iyle temsil edilir)
- `company_driver` (aktif firma assignment'i olan sofor)

## 3. Yetki Ilkeleri

1. Least privilege (minimum gerekli yetki)
2. Tenant siniri zorunlu (`companyId`)
3. Kritik mutasyonlar server-side authorization ile korunur
4. UI gizleme tek basina yetki degildir
5. Kritik islem audit log uretir

MVP live ops notu (review netlestirmesi):
- RTDB canli takip erisimi MVP'de `company-level coarse` modeldir
- Bu tabloda rol bazli canli harita yetkisi "ekrana erisim var/yok" seviyesini ifade eder
- Arac/bolge/rota bazli ince taneli canli gorunum kisitlari MVP kapsaminda server-side authz olarak garanti edilmez (post-pilot)

## 4. Firma Paneli Yetki Matrisi (MVP)

Kisaltmalar:
- Y = izinli
- S = sinirli/kuralli
- N = izin yok

| Islem / Rol | owner | admin | dispatcher | viewer |
|---|---:|---:|---:|---:|
| Firma ayarlari goruntule | Y | Y | Y | Y |
| Firma ayarlari guncelle | Y | S | N | N |
| Firma uyeleri listele | Y | Y | Y | Y |
| Kullanici davet et | Y | Y | N | N |
| Kullanici rol degistir | Y | S | N | N |
| Kullanici kaldir/deaktif et | Y | S | N | N |
| Sofor listele | Y | Y | Y | Y |
| Sofor olustur/bagla | Y | Y | Y | N |
| Sofor pasife al | Y | Y | S | N |
| Sofor detay guncelle | Y | Y | Y | N |
| Arac listele | Y | Y | Y | Y |
| Arac olustur/guncelle | Y | Y | Y | N |
| Arac pasife al | Y | Y | Y | N |
| Sofor-arac atama | Y | Y | Y | N |
| Rota listele | Y | Y | Y | Y |
| Rota olustur | Y | Y | Y | N |
| Rota guncelle | Y | Y | Y | N |
| Rota arsivle/ac | Y | Y | Y | N |
| Durak ekle/sirala/sil | Y | Y | Y | N |
| Yetkili sofor ata (`authorizedDriverIds`) | Y | Y | Y | N |
| Aktif seferleri gor | Y | Y | Y | Y |
| Canli harita/konum gor | Y | Y | Y | Y |
| Sefer manuel sonlandir (ops) | Y | S | S | N |
| Audit log gor | Y | Y | S | S |
| KVKK/hassas export | Y | S | N | N |

### 4.1 "S" (sinirli) kurallari (MVP)

`admin` sinirlari:
- `owner` rolunu veremez/almaz
- Firma kritik fatura/abonelik ayari degistiremez (zaten MVP disi)
- Kendi hesabinin ustunde rol duzenleyemez (self-escalation yok)

`dispatcher` sinirlari:
- Firma uye/rol yonetimi yapamaz
- Kurumsal ayarlari degistiremez
- Soforu silemez; pasife alma sinirli olabilir (ops policy)
- Sadece operasyonel mutasyonlar yapar

`viewer` sinirlari:
- Salt okuma
- PII alanlar role-policy ile maskelenebilir

## 5. Bireysel Sofor (Web Panel) Yetkileri

| Islem | individual_driver |
|---|---:|
| Kendi profilini gor/guncelle | Y |
| Kendi araclarini gor/guncelle | Y |
| Kendi rotalarini gor | Y |
| Kendi rota olustur/guncelle | Y |
| Kendi duraklarini yonet | Y |
| Kendi aktif seferini gor | Y |
| Kendi gecmis seferleri | Y |
| Kendi canli konum statusunu gor | Y |
| Baska sofor verisini gor | N |
| Firma kullanici/rol yonetimi | N |

## 6. Firma Bagli Sofor (App) Yetkileri

MVP'de bu yetkiler firma tarafindan verilir ve server-side policy ile enforce edilir.

Onerilen permission flag'leri:
- `can_start_finish_trip`
- `can_send_announcements`
- `can_view_assigned_route`
- `can_view_passenger_list`
- `can_edit_assigned_route_meta`
- `can_edit_stops`
- `can_manage_route_schedule`

### 6.1 Varsayilan Guvenli Profil (MVP)

Varsayilan:
- `can_start_finish_trip` = true
- `can_view_assigned_route` = true
- digerleri = false

Bu sayede ilk kurulumda soforler sefer operasyonu yapar ama rota yapisini bozamaz.

## 7. PII Gorunurluk (MVP)

Alan bazli policy (ornek):
- Telefon/email:
  - owner/admin = tam veya maske opsiyonlu
  - dispatcher = is ihtiyacina gore (tercihen maske + explicit reveal)
  - viewer = maske
- Yolcu verisi:
  - dispatcher sadece operasyon icin gerekli alanlari gorur
  - export yok (MVP)

## 8. Audit Log Zorunlu Islem Listesi (MVP)

Asagidakiler audit uretmeli:
- kullanici daveti
- rol degisikligi
- sofor olusturma/pasife alma
- arac olusturma/guncelleme/pasife alma
- rota olusturma/guncelleme/arsivleme
- durak degisiklikleri
- yetkili sofor atamasi
- kritik sefer operasyon mutasyonlari

## 9. Faz 2+ Genisleme Notlari

Ileride eklenecek roller:
- `support_agent`
- `auditor`
- `fleet_manager`

Ileride eklenecek policy'ler:
- ip allow-list
- 2FA zorunlulugu (firma bazli)
- saat bazli operasyon kisitlari
- onayli degisiklik akislari
Review sonrasi not (ADR-006):
- `individual_driver` UX rol adi korunur
- backend/domain modelde `Company of 1` tenant uzerinden temsil edilir
