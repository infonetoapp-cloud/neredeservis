# Web Auth + RBAC Flow (V0)

Tarih: 2026-02-24
Durum: Oneri / Faz 0

## 1. Amac

Web panelde "kim girer, ne gorur, ne yapar" akisini netlestirmek.

Kapsam:
- login
- tenant secimi
- role resolution
- route guards
- authorization

## 2. Kimlik ve Yetki Ayrimi (kritik)

Kimlik (authentication):
- Kullanici kim? (`uid`)

Yetki (authorization):
- Bu kullanici hangi firmada hangi rolde?
- Bireysel sofor mu, firma panel uyesi mi?

Kural:
- `auth` basarili olmak = panelde her yere girebilir demek degil

## 3. Login Sonrasi Rol Cozumleme (high-level)

Login sonrasi sira:
1. Auth session al
2. `users/{uid}` temel profil oku
3. Driver profili var mi kontrol et (`drivers/{uid}`)
4. `company memberships` listele
5. Kullanici experience modunu sec:
   - bireysel sofor paneli
   - firma paneli (firma secerek)

Not:
- Ayni kullanici birden cok rol/deneyime sahip olabilir.

## 3.1 Web Auth Provider Seti (MVP karari)

MVP provider seti:
- Email/Password
- Google Sign-In

Neden:
- Operasyon ekipleri icin hizli onboarding
- Sifre unutma yukunu azaltma
- Kurumsal/kisisel kullanimda esneklik

Not:
- Bu karar ayrica `22_web_auth_provider_decision.md` icinde ADR olarak kayitlidir.

## 4. Deneyim Modlari (MVP)

### 4.1 Individual Driver Mode

Sart:
- driver profili var
- aktif firma paneli secilmemis (veya company assignment yok)

Ana navigasyon:
- Dashboard
- Rotalarim
- Duraklar
- Seferlerim
- Profil/Arac

### 4.2 Company Panel Mode

Sart:
- en az bir aktif `CompanyMember` kaydi var

Ek adim:
- bir firma sec (tek firma varsa otomatik)

Ana navigasyon (role'e gore):
- Dashboard
- Soforler
- Araclar
- Rotalar
- Canli Operasyon
- Kullanicilar (role uygun)
- Audit Log (role uygun)

## 5. Route Guard Stratejisi (web)

Guard katmanlari:
1. `auth guard` -> login gerekli mi?
2. `mode guard` -> individual vs company mode dogru mu?
3. `tenant guard` -> `companyId` secili ve erisilebilir mi?
4. `role/permission guard` -> islem yetkisi var mi?

Kural:
- UI route guard sadece UX katmani
- server endpoint authorization asla yerine gecmez

## 6. Yetki Karar Mekanizmasi (onerilen)

Role tabanli policy + opsiyonel permission override

Pseudo mantik:
- `can(role, action, resourceContext)`
- varsa `permissions` override uygulaniyor
- sonra tenant/policy kosullari uygulanıyor

Ornek:
- `dispatcher` rota olusturabilir
- ama baska firmanin rotasinda asla islem yapamaz

## 7. Coklu Firma Uyeligi (faz 2 uyumlu tasarim)

MVP'de:
- desteklenebilir ama UI basit tutulur

Kural:
- aktif `companyId` session state'te tutulur
- firma degisince cache/queries temizlenir
- tum mutasyonlar secili `companyId` context'iyle gider

## 8. Unauthorized / Forbidden UX Kurallari

401 (unauthenticated):
- login sayfasina yonlendir

403 (forbidden):
- "Bu islem icin yetkin yok" mesaji + geri donus yolu

404 (not found / tenant mismatch):
- bilgi sızdırmayacak sekilde genel hata/empty state

## 9. Audit ile Iliski

Authz reddi de audit olabilir (en azindan kritik endpointlerde):
- actorUid
- companyId (varsa)
- action
- status = denied
- reason

Bu, suistimal / yanlis konfigurasyon takibi icin faydali olur.

## 10. Faz 1 Uygulama Sirasi

1. Login + logout
2. Session bootstrap
3. Mode selector (individual vs company)
4. Company selector
5. Route guards
6. Role-based navigation
7. Server endpoint authz enforcement

## 11. Faz 2 Gelistirmeleri

- 2FA zorunlulugu (company policy)
- SSO (kurumsal)
- IP allow-list
- session timeout policy
- just-in-time elevated actions
