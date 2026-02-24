# External Critique Prompt Template (Copy/Paste)

Tarih: 2026-02-24
Durum: Ready-to-use

## 1. Amac

Bu dokuman, dis reviewer (insan veya AI) icin kopyala-yapistir prompt sabloni verir.

Hedef:
- plani ovdurmek degil
- riskleri, eksikleri, gereksiz karmasikligi erkenden yakalamak
- solo-founder + MVP + satilabilir SaaS gercekligine gore filtreletmek
- mantik hatalari ve kullanici deneyimi firsatlarini da ortaya cikarmak

## 2. Uzun Prompt (onerilen)

```text
Merhaba, web-first gelistirdigim bir SaaS projesi icin detayli master plan hazirladim. 
Amacim bu plani teknik olarak guclu ama solo-founder (tek kisilik ekip) gercekligine uygun tutmak.

Lutfen plani "nazik yorum" gibi degil, profesyonel teknik review gibi elestir.
Ozellikle su soruya cevap ariyorum:

"Bu plan satilabilir bir SaaS'a giderken teknik borcu, delivery hizini ve operasyon riskini yonetebilir mi; yoksa hala temel mimaride yanlis eksenler var mi?"

Ek olarak acikca aradigim sey:
- mantik hatalari / celisen akis varsayimlari var mi?
- app ici ve website tarafinda kullanici dostu, isi kolaylastiran hangi iyilestirmeler onerilir?

Kontekst:
- Web-first ilerliyorum, mobil app sonradan yeni backend/web kontratlarina uyarlanacak
- Hedef: firma + bireysel sofor destekli operasyon paneli
- Realtime / canli takip var
- Azure SWA + Firebase + Cloudflare tabani planlandi
- Solo-founderim (delivery hizi kritik)
- Planlar cok detayli ama gereksiz karmasikliga dusmek istemiyorum
- Kaliteyi bozacak gereksiz sadeleştirme istemiyorum; "sadeleştir" onerisi veriyorsan kalite/güvenlik etkisini de yaz
- Internal admin zorunlu (sirketleri kontrol/uzaktan mudahale icin) ama web panel UI'i sonra; simdilik altyapi/policy/runbook seviyesi planli

Ozellikle incelemeni istedigim dokumanlar (oncelik sirasi):
1. `69_external_critique_round2_review_brief.md`
2. `54_adr_006_company_of_one_tenant_standardization.md`
3. `55_adr_007_mvp_read_model_simplification_and_projection_triggers.md`
4. `56_adr_008_vehicle_collection_security_revision.md`
5. `57_adr_009_map_standardization_and_eta_consistency.md`
6. `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
7. `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
8. `60_billing_internal_admin_and_suspension_policy_plan.md`
9. `62_route_trip_versioning_recurrence_timezone_dst_and_concurrent_editing_spec.md`
10. `08_domain_model_company_rbac.md`
11. `11_web_repo_structure_and_stack.md`
12. `15_engineering_standards_and_code_health.md`
13. `71_mobile_force_update_and_client_version_enforcement_plan.md`
14. `72_mobile_offline_stale_location_tolerance_plan.md`
15. `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`

Referans / ozet icin bakilabilecekler:
- `00_master_plan.md`
- `16_master_phase_plan_detailed.md`
- `17_workstream_breakdown_and_sequence.md`
- `19_risk_register_and_mitigation.md`
- `20_decision_log_and_open_questions.md`

Lutfen su lenslerle degerlendir:
- Solo-founder delivery hizi acisindan fazla karmasik yerler
- MVP -> Pilot fazlamasinda siralama hatalari
- Mantik hatalari / celisen varsayimlar (domain, role, flow, state machine)
- Cross-tenant / authz / data leakage riskleri
- Migration / backward compatibility gercekciligi
- Live ops / route / ETA tutarlilik riskleri
- Force update / compatibility sunset gercekciligi
- Offline/stale location toleransi pratikligi
- Satilabilir SaaS icin eksik ticari veya operasyonel planlar
- App ici ve website tarafinda kullanici dostu / isi kolaylastiran oneriler
- Fazla planlama yapilip gereksiz ertelenen yerler

Ozellikle "kirmizi bayrak" gordugun konulari belirt:
- Hangi kararlar ileride pahali geri donus yaratir?
- Hangi kisimlar MVP icin fazla?
- Hangi kisimlar tam tersine eksik ve acilen planlanmali?

Cevap formatini boyle isterim:
1. En kritik 7 risk / hata (oncelik sirasiyla)
2. Mantik hatalari / celisen plan kararları (dosya referansiyla)
3. Kismi dogru ama revizyon isteyen kararlar
4. Fazlama (MVP/Pilot) sadeleştirme onerileri
5. Guvenlik / migration / operasyon acisindan eksikler
6. App ici ve website icin kullanici dostu, isi kolaylastiran oneriler (somut)
7. "Dogru yoldasiniz" dedigin kisimlar (kisa)
8. Bir sonraki revizyon turunda netlestirmem gereken 5 karar
9. Son hukmun: "baslanir / sartli baslanir / baslanmaz" + neden

Mumkunse teorik degil, uygulanabilir ve pragmatik yorum yap.
Dosya adi referansi ver (or: `59_...md`, `60_...md`).
```

## 3. Kisa Prompt (arkadasa / DM icin)

```text
Bu web SaaS master planimi ciddi teknik review gibi elestirir misin?
Solo-founder olarak delivery hizini dusuren yerleri, mantik hatalarini ve guvenlik/live-ops risklerini ariyorum.

Lutfen sunlari yaz:
- en kritik riskler
- mantik hatalari / celisen kararlar
- gereksiz karmasik kisimlar
- sadeleştirme onerileri
- app + website icin kullanici dostu / isi kolaylastiran oneriler

Once su dosyalara bak:
- `69_external_critique_round2_review_brief.md`
- `59_*.md`, `60_*.md`, `62_*.md`
- `08_*.md`, `11_*.md`, `15_*.md`
- `71_*.md`, `72_*.md`

Ana soru:
"Bu plan satilabilir SaaS'a gider mi, yoksa hala temel mimaride yanlis eksenler var mi?"
```

## 4. Reviewer'a Ek Not (istersen eklersin)

- "Acimasiz ol, ama pratik cozum de oner."
- "MVP'yi gereksiz sisiren yerleri tek tek isaretle."
- "Security ve migration tarafinda varsayimlari zorla."
- "Bana shipping hizi acisindan bak."
- "Kaliteyi bozacak gereksiz sadeleştirme onerme; trade-off'u acik yaz."
- "Sadece teknik degil, kullanici dostu ve is kolaylastiran urun onerileri de ver."
