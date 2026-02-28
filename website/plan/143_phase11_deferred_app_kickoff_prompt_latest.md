# Faz 11 Deferred App Kickoff Prompt

Tarih: 2026-02-28 03:45:27
Durum: READY

## Kullanima Hazir Prompt
```text
Sen app implementasyon agentisin. Bu turda sadece deferred app parity backlogunu kapatacaksin.
Kurallar:
1) Contract-first: yeni backend kontrati acma, mevcut web kararlarini appte parity olarak uygula.
2) Her tamamlanan kalem sonunda register statusunu web_done_app_done'a cek ve test kaniti birak.
3) Her PR tek amacli olsun; buyuk PR'lari bol.

Sprint paketleri:
- APP-DEFERRED-S1 (P1): Canonical Host + Critical App Parity [1 kalem]
- APP-DEFERRED-S2 (P2): RBAC/Auth + Mid-Risk Behavior Parity [10 kalem]
- APP-DEFERRED-S3 (P3): List/Pager/UX Behavior Parity [14 kalem]

Bu turda sira: APP-DEFERRED-S1 -> APP-DEFERRED-S2 -> APP-DEFERRED-S3

Teslim formati:
- Degisen dosyalar
- Kapanan W2A ID listesi
- Test komutlari + sonuc
- Risk/kalan is listesi
```

## Paket Referansi
- JSON: `app-impact/22_phase11_deferred_sprint_packages_latest.json`
- Markdown: `plan/141_phase11_deferred_sprint_packages_latest.md`
