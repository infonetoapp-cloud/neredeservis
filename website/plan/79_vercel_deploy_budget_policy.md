# Vercel Deploy Budget Policy (Mandatory)

Tarih: 2026-02-26  
Durum: Aktif zorunlu kural

## 1. Amac

Vercel ucretsiz plan gunluk limitini tuketmeden, urun gelisim hizini korumak ve deploy kaynakli kesintileri azaltmak.

## 2. Kapsam

- `website/apps/web` icin tum Vercel deploy akisları
- preview + production deploy denemeleri
- manuel ve otomatik release aksiyonlari

## 3. Gunluk Deploy Butcesi (Hard Limit)

Her gun en fazla:

1. `1` adet normal release deploy (tercihen production)
2. `1` adet opsiyonel preview/dogrulama deploy
3. `1` adet acil hotfix deploy rezervi

Toplam: `max 3` deploy denemesi/gun.

## 4. Release Penceresi (Hard Rule)

- Normal deploy sadece tek release penceresinde yapilir.
- Varsayilan pencere: `21:00-23:00` (TR saati).
- Bu pencere disinda deploy sadece acil hotfix ise serbest.

## 5. Batch Deploy Kurali

- Surekli kucuk push/deploy yasak.
- Deploy icin asgari kosul:
  - en az `8` tamamlanmis dilim/slice birikmis olmali
  - veya `P0/P1` kritik bug fix hazir olmali

## 6. Deploy Oncesi Zorunlu Gate

Deploy oncesi hepsi yesil olmadan push yok:

1. `npm run lint` (website/apps/web)
2. `npm run build` (website/apps/web)
3. Manuel smoke:
  - login ekrani aciliyor
  - `/drivers`, `/routes`, `/vehicles`, `/live-ops` aciliyor

## 7. Kota Koruma Kurali

- Gunluk limitin `%80` seviyesine gelindiginde:
  - preview deploylar durdurulur
  - sadece acil hotfix rezervi korunur

## 8. Push ve Branch Disiplini

- Vercel'e bagli ana branch'e gun icinde surekli push yasak.
- Normal akista:
  - local gelisim + local dogrulama
  - release penceresinde tek toplu merge/push

## 9. Acil Hotfix Istisnasi

Acil hotfix yalnizca su durumlarda kullanilir:

- login tamamen bozuk
- kritik rota/sefer akisi kirik
- tenant guvenlik veya veri sizmasi riski

Hotfix sonrasi ayni gun ikinci normal release yapilmaz.

## 10. Kayit ve Izlenebilirlik

Her deploy denemesi sonrasi asagidaki dosyalarda kayit tutulur:

- `website/plan/29_phase1_first_sprint_backlog.md`
- `website/plan/75_phase2_closeout_and_phase3_entry.md`

Deploy nedeniyle app kontrat/mesaj/davranis etkisi varsa:

- `website/app-impact/00_web_to_app_change_register.md` guncellenir

## 11. Uygulama Sorumlulugu

- Bu politika varsayilan ve zorunlu calisma standardidir.
- Yeni bir karar alinmadikca bu kurallar degismez.

## 12. Limit Asimi Olayi (402) Proseduru

Eger Vercel CLI su hatayi verirse:

- `402 api-deployments-free-per-day`

zorunlu adimlar:

1. Ayni saat icinde yeni deploy denemesi yapma.
2. Hata mesajindaki retry penceresini checklist loguna yaz.
3. O pencereden sonra tek bir redeploy denemesi yap.
4. Redeploy sonrasi yalniz bir smoke probe raporu uretip checklist'i guncelle.
5. Otomasyon tercihi: `npm run redeploy:phase5:wait-retry` (bekleme + tek yeniden deneme).
