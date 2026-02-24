# Risk Register + Mitigation Plan (Web SaaS Program)

Tarih: 2026-02-24
Durum: V0

## 1. Amac

Teknik ve operasyon risklerini erken gorup planlamak.

Format:
- Risk
- Etki
- Olasilik
- Azaltma plani
- Tetik/izleme

## 2. Risk Listesi (MVP -> Pilot)

### R1 - Tenant/RBAC modeli gec netlesir

Etki:
- tekrar is
- authz buglari
- spagetti policy kodu

Olasilik:
- orta

Azaltma:
- Faz 0'da yetki matrisi + domain model kilidi
- endpoint backlogu role-aware tasarla

Tetik:
- UI gelistirirken role kararlarinin ekran icine dagilmasi

### R2 - Live ops read modeli webde problem cikarir

Etki:
- canli harita gecikir
- performans veya yetki sorunlari olur

Olasilik:
- orta

Azaltma:
- live ops read modeli (MVP company-level RTDB + projection triggerleri) erken netlestirilir
- degraded mode + stale-state semantigi erken tanimlanir

Tetik:
- web client RTDB read yetki sorunlari

### R3 - Harita/API maliyetleri beklenenden hizli artar

Etki:
- butce sapmasi
- feature kisma baskisi

Olasilik:
- orta

Azaltma:
- Mapbox cap/rate-limit
- autocomplete azaltma
- cache/throttle
- budget alerts

Tetik:
- haftalik usage trend artisi

### R4 - Dev/Stg/Prod disiplinine uyulmaz

Etki:
- prod veri kirlenir
- telemetry anlamsizlasir
- release riski artar

Olasilik:
- orta

Azaltma:
- environment usage policy
- env badge
- deploy checklist

Tetik:
- prod'da test tenant/artik veri

### R5 - Azure Student credit'e fazla guvenilir

Etki:
- kesinti riski
- beklenmedik durma

Olasilik:
- orta

Azaltma:
- production'u student uzerinde tutmama
- PayG + SWA Standard gecis tetiklerini yazili tutma

Tetik:
- pilot musteri oncesi hala student/free uzerinde kalma

### R6 - Tek kisi gelistirmede dokuman disiplini kaybolur

Etki:
- "neden boyle yaptik" unutulur
- onboarding zorlasir

Olasilik:
- yuksek

Azaltma:
- ADR mini format
- faz kapanis notu zorunlu
- plan dokumani referansli PR aciklamalari

Tetik:
- ayni karar tekrar tekrar tartisilmaya baslar

### R7 - Buyuk dosya/buyuk component birikimi (spagetti)

Etki:
- bakim zor
- bug riski yuksek
- refactor maliyeti artar

Olasilik:
- yuksek

Azaltma:
- 500 satir soft cap
- PR quality gate
- feature bazli klasorleme

Tetik:
- 500+ satir dosya artis trendi

### R8 - Security/Authz eksikleri MVP hiziyla kacir

Etki:
- veri sÄ±zÄ±ntÄ±sÄ± / yetkisiz erisim
- urun guveni zedelenir

Olasilik:
- orta

Azaltma:
- server-side authz zorunlu
- deny testleri
- audit log
- staging security smoke

Tetik:
- "UI gizledik yeter" yaklasimi

### R9 - Legacy mobile + yeni web kontratlari cakisir (migration/backward compatibility)

Etki:
- veri tutarsizligi
- policy bypass riski
- rollout gecikmesi

Olasilik:
- orta

Azaltma:
- versioned API / compatibility layer
- migration rehearsal
- schema/policy version logging
- legacy cutoff takvimi
- aggressive force update + server-side min version enforcement + `426` reject path
- compatibility adapter write-path sunset tarihi

Tetik:
- ayni kayitta legacy ve yeni mutasyon semantigi catismasi

### R10 - Bulk import olmadan kurumsal onboarding tikanir

Etki:
- satis/pilot gecikir
- manuel operasyon yuklenir

Olasilik:
- yuksek

Azaltma:
- MVP'de white-glove onboarding + import scriptlerini hazirlamak
- self-serve import UI'yi trigger tabanli post-pilot backlogda tutmak

Tetik:
- 3-5 musteri sonrasinda import support suresi/kodlama zamanini bozmaya basliyor

### R11 - Live ops RTDB yetkilendirme/coarse access hatasi veya stale token davranisi sorun yaratir

Etki:
- yetkisiz canli veri goruntuleme
- live ops kesintisi

Olasilik:
- orta

Azaltma:
- company-level RTDB access spec + claims + RTDB access mirror coarse gate
- revoke latency hardening (refresh token revoke + re-auth/refresh akisi)
- mirror sync failure alert + reconcile job + max session refresh failsafe
- company suspension icin fan-out mirror write yerine company-level live access kill-switch optimizasyonu degerlendirilir
- token refresh/company switch testleri + degraded mode fallback
- cross-company deny tests

Tetik:
- cross-company read deny hatalari / stale token kaynakli live denylar

### R12 - Full versioning ertelenince route edit davranisi operasyon tartismasi yaratir

Etki:
- aktif seferde beklenmeyen rota degisikligi
- operator/sofor tartismalari

Olasilik:
- orta

Azaltma:
- trip start snapshot + route edit warning + audit
- aktif tripte yapisal route mutasyonlari (stop delete/reorder) icin server-side soft-lock
- pilotta incident telemetry ile full versioning tetigi

Tetik:
- aktif sefer varken route edit kaynakli tartisma / support incidenti

### R13 - Timezone/DST/recurrence hatalari sefer saatlerini kaydirir

Etki:
- operasyonel hata
- guven kaybi

Olasilik:
- orta

Azaltma:
- timezone policy freeze
- UTC storage + tenant timezone display
- DST testleri

Tetik:
- saat kaymasi veya recurrence buglari

### R14 - Concurrent editing silent overwrite

Etki:
- kayip update
- gizli veri bozulmasi

Olasilik:
- orta

Azaltma:
- server-side enforced minimal precondition (Firestore `updateTime`/version token + transaction/precondition)
- conflict UX

Tetik:
- ayni rota/duraga coklu dispatcher erisimi

### R15 - Billing/suspension politikasi gec netlesir

Etki:
- ticari operasyon aksar
- musteri erisim politikasi kriz cikarir

Olasilik:
- orta

Azaltma:
- Faz 5 oncesi MVP 3-state billing/suspension kurallari freeze
- advanced grace/limited state'leri post-pilot backlogta tut
- `billingValidUntil` + scheduled failsafe lock/past_due job (provider olmadan da)

Tetik:
- pilot sonrasi odeme akisi tanimsizligi

### R16 - Test strategy eksikligi pilotta regresyon patlatir

Etki:
- release guvenilirligi dusuk
- fix maliyeti artar

Olasilik:
- yuksek

Azaltma:
- rules/functions/web E2E minimum paketleri faz bazli zorunlu

Tetik:
- staging smoke olmadan release baskisi

### R17 - Backup/retention/deletion politikasi eksikligi hukuk/operasyon riski yaratir

Etki:
- veri kaybi
- silme taleplerinde sorun
- uyum riski

Olasilik:
- orta

Azaltma:
- backup/restore runbook
- retention/deletion policy doc
- restore rehearsal

Tetik:
- ilk data incident veya silme talebi

### R18 - Landing SEO/analytics/consent ve support SOP gecikirse ticari ogrenme yavaslar

Etki:
- conversion olcumu zayif
- support operasyonu daginik

Olasilik:
- orta

Azaltma:
- Faz 5-6'da baseline SEO/analytics/consent + support severity SOP

Tetik:
- pilot leads / support issue tracking daginikligi

### R19 - Force update/cutoff gecikirse compatibility layer kalici borca donusur

Etki:
- legacy endpointler kapanamaz
- data corruption riski uzar
- delivery hizi duser

Olasilik:
- orta

Azaltma:
- Remote Config + server-side min version enforcement birlikte planlanir
- cutoff takvimi endpoint bazli yazilir
- pilot oncesi rehearsal yapilir

Tetik:
- legacy endpoint cagri hacmi dusmesine ragmen shutdown tarihinin ertelenmesi

### R20 - Live ops stale/offline semantigi net olmazsa operator yanlis karar verir

Etki:
- arac durumu yanlis yorumlanir
- gereksiz operasyon tartismasi ve support yuku artar

Olasilik:
- orta

Azaltma:
- stale/degraded/offline_assumed esikleri dokumante edilir
- web UI state semantigi ve telemetry izlenir
- pilotta threshold tuning yapilir
- onDisconnect sinyali geldiginde timestamp stale timer'ina gore beklemeden offline semantigi uygulanir

Tetik:
- \"arac hareket ediyor saniyorduk\" tipinde operasyon geri bildirimleri

### R21 - Offline burst replay harita UI'yi kilitler (live ops)

Etki:
- live ops panel performansi duser
- operatör canli ekranı guvensiz hisseder

Olasilik:
- orta

Azaltma:
- backend latest-only coalescing + UI throttling tasarimi
- mumkunse client-side latest-only live write + history ayrimi (hibrit)
- marker render frequency limiti
- burst replay smoke testi

Tetik:
- reconnect sonrasi ayni arac icin coklu update'te UI takilmasi

## 3. Risk Review Rutini

Haftalik:
- yeni risk eklendi mi?
- olasilik/etki degisti mi?
- mitigasyon taska donustu mu?

Faz kapanisinda:
- riskler yeniden puanlanir

## 4. Kirmizi Cizgiler (Escalation Triggers)

Asagidaki durumlarda feature hizi yavaslatilir:
- cross-tenant authz bug
- prod veri kirlenmesi
- cost spike + alert yok
- audit olmayan kritik mutasyonlarin artisÄ±

