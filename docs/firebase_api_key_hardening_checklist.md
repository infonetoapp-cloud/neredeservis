# Firebase API Key Hardening Checklist (Dev/Stg/Prod)

Tarih: 2026-02-17  
Durum: In Progress  
Sorumlu: Sinan + Codex

## 0) Neden bu checklist var?
- GitHub secret scanning `Google API Key` alertleri geldi.
- Kod tarafinda key-bearing Dart dosyalari kaldirildi (`commit: 57ca6b7`).
- Simdi panel tarafinda key kisitlama/rotasyon kilidi kapanmali.

## 1) GitHub Alert Kapatma (Manual)

1. Repo -> `Security` -> `Secret scanning alerts` ac.
2. `Google API Key` alertlerinin her birini ac.
3. Asagidaki notla resolve et:
   - `Key removed from tracked source in commit 57ca6b7. Firebase init moved to native config files. Key restrictions/rotation applied.`
4. Tum alertler icin durum:
   - [x] Dev alert kapandi
   - [x] Stg alert kapandi
   - [x] Prod alert kapandi

## 2) Firebase/GCP API Key Restriction (Zorunlu)

Not: API key Firebase'de "public identifier" olabilir, ama kisitlanmazsa kotuye kullanilabilir.

### 2.1 Android key kisitlari
Her environment icin (dev/stg/prod):
1. Google Cloud Console -> `APIs & Services` -> `Credentials` -> ilgili key.
2. `Application restrictions`:
   - `Android apps`
   - Package name + SHA-1 fingerprint ekle.
3. `API restrictions`:
   - `Restrict key` sec.
   - Sadece uygulamanin ihtiyac duydugu API'leri sec.
4. Kaydet.

Kontrol:
- [x] Dev Android key restricted
- [x] Stg Android key restricted
- [x] Prod Android key restricted

### 2.2 iOS key kisitlari
Her environment icin:
1. Ilgili key'i ac.
2. `Application restrictions`:
   - `iOS apps`
   - Bundle ID ekle:
     - dev: `com.neredeservis.app.dev`
     - stg: `com.neredeservis.app.stg`
     - prod: `com.neredeservis.app`
3. `API restrictions` -> sadece gerekli API seti.
4. Kaydet.

Kontrol:
- [x] Dev iOS key restricted
- [x] Stg iOS key restricted
- [x] Prod iOS key restricted

### 2.3 Browser key kisitlari (Firebase Hosting / Web)
Her environment icin:
1. Ilgili `Browser key (auto created by Firebase)` kaydini ac.
2. `Application restrictions`:
   - `Websites`
   - Yetkili referrer'lari ekle:
     - dev:
       - `https://neredeservis-dev-01.web.app/*`
       - `https://neredeservis-dev-01.firebaseapp.com/*`
       - `http://localhost/*`
     - stg:
       - `https://neredeservis-stg-01.web.app/*`
       - `https://neredeservis-stg-01.firebaseapp.com/*`
       - `http://localhost/*`
     - prod:
       - `https://neredeservis-prod-01.web.app/*`
       - `https://neredeservis-prod-01.firebaseapp.com/*`
       - `https://nerede.servis/*` (domain aktif oldugunda)
3. Kaydet.

Kontrol:
- [x] Dev Browser key restricted
- [x] Stg Browser key restricted
- [x] Prod Browser key restricted

## 3) API Seti Minimize Etme

Prensip: "Needed only". Gereksiz API secilmez.

Baslangicta tipik gerekenler:
- Firebase Management / Firebase Installations (uygulama durumuna gore)
- Identity Toolkit (Auth)
- Firestore / Realtime Database / Cloud Functions cagrilarinin gerektirdigi minimum set

Kontrol:
- [x] API listesi minimuma indirildi
- [x] Gereksiz API izinleri kaldirildi

## 4) Rotasyon Karari

Risk yuksekse rotasyon zorunlu:
1. Yeni key olustur.
2. Yeni key icin ayni kisitlari uygula.
3. Uygulamayi yeni key ile calistigini dogrula.
4. Eski key'i disable et (veya sil).

Kontrol:
- [ ] Dev key rotation tamam
- [ ] Stg key rotation tamam
- [ ] Prod key rotation tamam

## 5) Dogrulama Testi

1. Android dev flavor calistir:
   - `.\scripts\run_flavor.ps1 dev`
2. Android stg flavor:
   - `.\scripts\run_flavor.ps1 stg`
3. Android prod flavor:
   - `.\scripts\run_flavor.ps1 prod`
4. CI run green kalmali (`Mobile CI`).

Kontrol:
- [ ] Dev app auth/firestore baglandi
- [ ] Stg app auth/firestore baglandi
- [ ] Prod app auth/firestore baglandi
- [ ] CI green

## 6) Kalici Koruma

1. `lib/firebase/firebase_options_*.dart` repoda yasak (gitignore aktif).
2. Her yeni muhendis onboarding'de bu dosya repoya eklenmeyecek.
3. Secret scanning alerti gelirse once kod kaynagini kapat, sonra panelden resolve et.

Kontrol:
- [ ] Onboarding notuna eklendi
- [ ] `proje_uygulama_iz_kaydi.md` adim kapanis kaydi yazildi
