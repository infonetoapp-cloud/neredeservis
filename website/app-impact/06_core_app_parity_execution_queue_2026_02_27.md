# Core App Parity Execution Queue (Adminsiz Fokus)

Tarih: 2026-02-27  
Durum: Active

## 1) Scope Kilidi

- Admin panel UI genisletmesi bu dongude **donduruldu**.
- Odak:
  - Web + Functions cekirdek kontrat stabilitesi
  - App parity icin bloklayici kontrat/mesaj/davranis maddeleri
  - Pilot cutover riski tasiyan kalemlerin kapanisi

## 2) Aktif Kapanis Sirasi

### Blok A - Cutover Kritik (P0/P1, once kapanacak)

1. `W2A-001` Force update + `426` cutoff parity
2. `W2A-002` Live ops offline/stale/drift parity
3. `W2A-003` Active-trip route soft-lock hata semantigi
4. `W2A-004` Company context / mode resolver parity
5. `W2A-006` Company bootstrap (`createCompany`, `listMyCompanies`) parity
6. `W2A-007` Company members read parity
7. `W2A-008` Company routes read parity
8. `W2A-009` Company vehicles read parity
9. `W2A-010` Vehicle create/update mutation parity
10. `W2A-011` Route create parity
11. `W2A-012` Route update + token mismatch parity
12. `W2A-013` Stop upsert parity
13. `W2A-014` Stop delete parity
14. `W2A-015` Stop reorder parity
15. `W2A-016` Active trips read parity
16. `W2A-017` RTDB stream overlay + fallback semantigi parity

### Blok B - Membership/Permission Kontratlari (P1)

1. `W2A-100` updateCompanyMember
2. `W2A-101` inviteCompanyMember
3. `W2A-102` acceptCompanyInvite
4. `W2A-103` declineCompanyInvite
5. `W2A-104` removeCompanyMember
6. `W2A-105` grant/revoke route permissions
7. `W2A-106` listRouteDriverPermissions

### Blok C - Davranis Parity (P2/P3, kontrat degisimi yok)

- `W2A-107` ... `W2A-128`
- Bu blok kontrat bloklari kapanmadan code-level zorunlu degil.
- Web-only kontrat hardening kayitlari:
  - `W2A-465`: `generateRouteShareLink`, `getDynamicRoutePreview`, `listCompanyAuditLogs`, `getCompanyAdminTenantState`, `updateCompanyAdminTenantState` runtime response guardlari eklendi.
  - `API-DIFF-025..027`: web admin/share kontratlari runtime-validated; app icin `none (simdilik)` / `n/a`.

### Blok D - Opsiyonel Auth Provider Parity (P2)

- `W2A-005` Microsoft sign-in app parity (web tamam, app pending)

## 3) Bu Hafta Uygulama Kurali

1. Her implementasyondan once sor:
   - "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?"
2. Cevap "evet" ise:
   - `00_web_to_app_change_register.md` kaydina not dus
   - gerekiyorsa `04_api_contract_diff_register.md` girdisini guncelle
3. Cevap "hayir" ise:
   - `not_required` gerekcesini tek satir kaydet
4. Deploy disiplini:
   - Local gate yesil olmadan Vercel deploy yok
   - Gunde en fazla 1 stg + 1 prod deploy

## 4) Bir Sonraki Teknik Blok (Hemen)

1. [done] `04_api_contract_diff_register.md` icinde Blok A endpointleri icin error-code/policy tablosu tekillestirildi.
2. [done] Blok A kontrat eslesme matrixi acildi: `08_block_a_contract_alignment_matrix_2026_02_27.md`.
3. [done] Blok B kontrat eslesme matrixi acildi: `09_block_b_membership_permission_alignment_matrix_2026_02_27.md`.
4. `07_app_parser_mapping_checklist_2026_02_27.md` uzerinden app parser/mapping closure ciktilari tek tek isaretlenecek (A+B zorunlu, C web-only referans).
5. `W2A-001` force-update/cutoff parity app tarafinda kapanmadan pilot cutover final onayi verilmeyecek.

## 5) Son Durum Snapshot (2026-02-27)

- `W2A-001`: **web_done_app_pending**  
  Web tarafinda `UPGRADE_REQUIRED/FORCE_UPDATE_REQUIRED/426` user-facing hata semantigi eklendi ve web closure tamamlandi.  
  App force-update/cutoff UX hala bloklayici.
- `W2A-002`: **web_done_app_pending**  
  Web live-ops stale/offline/lag/mismatch + reconnect/backoff semantigi aktif.
- `W2A-003`: **web_done_app_pending**  
  Web route/stop conflict + soft-lock hata semantigi tamam.
- `W2A-004`: **web_done_app_pending**  
  Web dashboard company context auto-reconcile eklendi (single active auto-select + invalid clear).
- `W2A-006..009`: **web_done_app_pending**  
  Company bootstrap + members + routes + vehicles read kontratlarinda web callable response-shape runtime guardlari aktif edildi (`CONTRACT_MISMATCH` sinyali).
- `W2A-010..016`: **web_done_app_pending**  
  Vehicle/route/stop/live-ops callable response-shape runtime guardlari aktif edildi (`CONTRACT_MISMATCH` sinyali).
- `W2A-100..106`: **web_done_app_pending**  
  Membership/permission mutasyon-read kontratlarinda web callable response-shape runtime guardlari aktif edildi (`CONTRACT_MISMATCH` sinyali).
  Detay matrix: `website/app-impact/09_block_b_membership_permission_alignment_matrix_2026_02_27.md`.
- `W2A-465`: **web_done_app_n/a**  
  Share + admin read/mutation callables icin runtime response-shape guardlari aktif edildi; app davranis/kontrat etkisi yok.
- `API-DIFF-025..027`: **web_runtime_validated_app_n/a**  
  Admin/share kontratlari webde fail-fast (`CONTRACT_MISMATCH`) korumasi altinda; app tarafinda bu dongude aksiyon gerekmez.
