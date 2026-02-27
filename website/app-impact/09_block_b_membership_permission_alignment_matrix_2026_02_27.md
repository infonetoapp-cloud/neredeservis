# Block B Membership & Permission Alignment Matrix (W2A-100..106)

Tarih: 2026-02-27  
Durum: Active (app parity icin kaynak matrix)

## 1) Amac

Blok B membership/permission kontratlari icin:
- web tarafinda mutasyon + read kontratinin closure seviyesini,
- app tarafinda parser/mapping kalanlarini,
- ilgili API-DIFF referanslarini
tek tabloda gostermek.

## 2) Matrix

| W2A | Kapsam | Kontrat Kaynagi | Web Durumu | App Durumu |
| --- | --- | --- | --- | --- |
| W2A-100 | updateCompanyMember | `API-DIFF-017` | done (runtime guard) | pending |
| W2A-101 | inviteCompanyMember | `API-DIFF-018` | done (runtime guard) | pending |
| W2A-102 | acceptCompanyInvite | `API-DIFF-019` | done (runtime guard) | pending |
| W2A-103 | declineCompanyInvite | `API-DIFF-020` | done (runtime guard) | pending |
| W2A-104 | removeCompanyMember | `API-DIFF-021` | done (runtime guard) | pending |
| W2A-105 | grant/revoke route permissions | `API-DIFF-022..023` | done (runtime guard) | pending |
| W2A-106 | listRouteDriverPermissions | `API-DIFF-024` | done (runtime guard) | pending |

## 3) Hemen Uygulanacak App Parser Paketleri

1. Membership mutation parser paketi: `W2A-100..104`
2. Route permission mutation parser paketi: `W2A-105`
3. Route permission read parser paketi: `W2A-106`
4. Membership/permission error-code copy paketi: owner/self/admin guard reason'lari

## 4) Not

- Bu matrix yeni endpoint acmaz, yalnizca app cutover takip kaynagidir.
- App tarafinda her closure adimi sonrasi `00_web_to_app_change_register.md` statusu guncellenir.
