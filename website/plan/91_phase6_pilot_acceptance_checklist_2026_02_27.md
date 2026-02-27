# Faz 6 Pilot Acceptance Checklist (2026-02-27)

Tarih: 2026-02-27
Durum: Closed

## 1) Amac

Faz 5 kapanisindan Faz 6 pilot rollout'a geciste, devreden acceptance maddelerini tek checklistte kapatmak.

## 2) Faz 5'ten Devreden Zorunlu Maddeler

1. Route/stop tam CRUD acceptance smoke (pilot tenant).
2. Live ops stream/triage acceptance smoke (pilot tenant).
3. Audit log operasyon acceptance smoke.
4. Prod CORS/cost/monitoring/Firebase mapping final kontrolleri.
5. Pilot onboarding checklist adimlari.

## 3) Route/Stop CRUD Acceptance (Pilot Tenant)

- [x] Pilot owner ile login.
- [x] `/routes` liste aciliyor.
- [x] Yeni rota olusturuluyor.
- [x] Rota detay panelinde ad/etiket guncellemesi kaydediliyor.
- [x] Durak ekle/sil/sirala mutasyonlari calisiyor.
- [x] Aktif sefer soft-lock durumunda kritik stop mutasyonlari beklenen uyarilari veriyor.
- [x] Rota arsivleme ve arsivden okuma akisi dogrulaniyor.

Kanit:
- [x] Otomasyon raporu: `website/plan/96_phase6_acceptance_closeout_2026_02_27_1651.md`
- [x] Log dosyasi: `website/plan/92_phase6_execution_log_2026_02_27.md`

## 4) Live Ops Acceptance (Pilot Tenant)

- [x] `/live-ops` liste+harita+detay paneli aciliyor.
- [x] Secili sefer degisimi, risk odagi ve triage aksiyonlari calisiyor.
- [x] Stream reconnect/backoff durumunda UI semantigi (lag/stale/offline) dogru yansiyor.
- [x] Clipboard/paylasim aksiyonlari (kopyala/whatsapp/link) beklenen metni uretiyor.
- [x] Harita secili sefer odagi ve panel parity korunuyor.

Kanit:
- [x] Otomasyon raporu: `website/plan/96_phase6_acceptance_closeout_2026_02_27_1651.md`
- [x] Log dosyasi: `website/plan/92_phase6_execution_log_2026_02_27.md`

## 5) Audit Acceptance (Pilot Tenant)

- [x] `/admin` audit listeye erisim var.
- [x] Filtre/siralama/deep-link aksiyonlari calisiyor.
- [x] Kritik mutasyon sonrasi audit satiri gorunuyor.
- [x] Hedefe git / audit id kopyala / csv indir aksiyonlari calisiyor.

Kanit:
- [x] Otomasyon raporu: `website/plan/96_phase6_acceptance_closeout_2026_02_27_1651.md`
- [x] Log dosyasi: `website/plan/92_phase6_execution_log_2026_02_27.md`

## 6) Prod Operasyon Kontrolleri

- [x] CORS/origin allow-list prod hostlarla uyumlu.
- [x] Firebase prod project mapping dogrulandi.
- [x] Cost alert kanallari aktif ve test sinyali alindi.
- [x] Monitoring dashboard ulasilabilir.
- [x] Rollback adimlari son kez dry-run edildi.

Kanit:
- [x] Prod ops closeout: `website/plan/97_phase6_prod_ops_closeout_2026_02_27_1707.md`
- [x] Domain probe: `website/plan/84_domain_probe_2026_02_27_1708.md`
- [x] Vercel env audit: `website/plan/83_vercel_env_audit_2026_02_27_1707.md`

## 7) Pilot Onboarding Checklist

- [x] Pilot company olusturma
- [x] Owner atama
- [x] En az 1 driver + 1 vehicle + 1 route seed
- [x] Live ops ilk smoke
- [x] Audit ilk smoke
- [x] Support/incident temas noktasi paylasildi

Kanit:
- [x] Pilot onboarding closeout: `website/plan/95_phase6_pilot_onboarding_check_2026_02_27_1707.md`

## 8) Kapanis Kriteri

Tum maddeler isaretlendi. Faz 6 acceptance checklist kapatildi.
