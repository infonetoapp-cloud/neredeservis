# ADR-004: Staging Domain Strategy (MVP-Cut Revision)

Tarih: 2026-02-24
Durum: Accepted (revize)

## 1. Problem

Staging icin custom domain'i hemen acalim mi?

Hedefler:
- operasyonel sadelik
- kalite algisi
- domain/DNS karmasikligini kontrollu yonetmek
- solo-founder delivery hizini korumak

## 2. Karar (revize)

Asamali strateji:

Faz 1-2:
- Azure generated preview/staging domain yeterli (default)
- Ortam badge ve env uyarisi zorunlu

Faz 2/3+ (dis paydas demo / guven beklentisi artarsa):
- Yalnizca net ihtiyac varsa `stg-app.neredeservis.app` custom staging domain acilir

## 3. Neden?

Erken custom staging domain acmanin bedeli:
- DNS/SSL/cert yonetimi
- env/cors domain listesi artisi
- operasyon karmasikligi

SWA preview domainleri zaten release disiplini icin yeterli olabilir.

Bu nedenle:
- default = generated preview
- custom staging domain = ihtiyac tetikli iyilestirme

## 4. Uygulama Kurali

Dis paydaslara (musteri, ortak, resmi demo) gosterilecek build:
- generated preview domain olabilir (MVP hiz/sadelik icin kabul)
- ama ortam badge / demo notu / env ayrimi net olmalidir
- custom staging domain kalite/guven gereksinimi artinca acilir

## 5. Review Zamani

Faz 1 kapanisinda:
- generated preview domain yeterli mi?
- CORS/domain operasyonu karmaşıklasti mi?
- custom staging domain acilis tarihi gerekli mi?
