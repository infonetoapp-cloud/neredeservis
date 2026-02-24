# App Impact Tracking (Web -> App Sync Queue)

Tarih: 2026-02-24
Durum: Aktif (web implementasyon boyunca kullanilacak)

## 1. Amac

Web tarafinda alinan kararlarin ve yapilan implementasyonlarin mobil app tarafinda
gerektirecegi degisiklikleri tek yerde toplamak.

Bu klasor:
- "web bitti, app'te ne degisecekti?" kaosunu engeller
- web implementasyonu sirasinda app etkilerini kayda alir
- en sonda app stabilizasyon/migrasyon sprinti icin net backlog olusturur

## 2. Ne Zaman Kayit Acilir?

Webde herhangi bir is:
- API kontratini degistiriyorsa
- auth/session davranisini degistiriyorsa
- role/permission semantigini degistiriyorsa
- route/trip/stop veri semantigini degistiriyorsa
- live ops/offline/stale davranisini degistiriyorsa
- UX copy / status state / error code semantigini etkiliyorsa

=> `00_web_to_app_change_register.md` icine kayit acilir.

## 3. Klasor Yapisi

- `00_web_to_app_change_register.md` -> Tek kaynak backlog / master kuyruk
- `01_contract_backend_sync_backlog.md` -> API/payload/authz etkileri
- `02_mobile_ui_ux_followups.md` -> App ekran/flow/UI/UX takipleri
- `03_app_integration_cutover_checklist.md` -> Web+app hizalama icin kapanis checklisti
- `TEMPLATE_change_entry.md` -> Yeni kayit acarken kopyalanacak sablon

## 4. Kullanim Kurali (kisa)

1. Web isine basla
2. App etkisi fark edilirse kayit ac
3. Etki yoksa kayit acma
4. Kayitlari "simdi yap" diye degil, "app sprintinde yap" backlog mantigiyla biriktir
5. Web bitisi/cutover oncesi `03_*` checklistinden gec

## 4.1 Sorumluluk (Default calisma kurali)

Web implementasyonu sirasinda `W2A` kayit acma sorumlulugu:
- varsayilan olarak **Codex/agent** tarafindadir
- kullanicinin ayrica hatirlatmasi beklenmez

Pratik kural:
- Web tarafinda app'i etkileyen bir karar/implementasyon yapildiginda agent ilgili `W2A` kaydini ayni turda acar veya mevcut kaydi gunceller.
- Eger etkisi belirsizse en azindan `Status: new` ile kisa bir kayit acilir (sonra triage edilir).

Agent'in kendine zorunlu kontrol sorusu (her web gorevinde):
- **"Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?"**

## 5. Durum Etiketleri (onerilen)

- `new` -> yeni fark edildi
- `triaged` -> kapsami netlesti
- `planned` -> app sprintine alindi
- `blocked` -> web tarafi kesinlesmeden yapilamaz
- `done` -> app tarafinda uygulandi
- `wont_do_mvp` -> bilincli ertelendi

## 6. Oncelik Etiketleri

- `P0` -> cutover/stabilite/security icin zorunlu
- `P1` -> user experience / correctness icin yuksek onem
- `P2` -> polish / ergonomi

## 7. Mini Disiplin (onerilen)

Her web gorevi sonunda agent su kontrolu yapar:
- `Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?`
- `API/contract etkisi var mi?`
- `App error handling/copy etkisi var mi?`
- `Live ops/offline/state semantigi etkisi var mi?`
- `Auth/session/mode/company context etkisi var mi?`

En az birine `evet` ise `00_web_to_app_change_register.md` guncellenir.

## 8. Tamamlayici Dokumanlar (onerilen)

- `04_api_contract_diff_register.md` -> web ilerledikce app'e yansiyan endpoint/payload/error-code farklari
- `05_copy_and_state_semantics_glossary.md` -> web+app ortak durum dili (offline/stale/access denied vb.)
- `06_cutover_calendar_and_milestones.md` -> force update / legacy read-only / cutoff takvimi
