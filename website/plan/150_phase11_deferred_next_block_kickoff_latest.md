# Faz 11 Deferred Next Block Kickoff Prompt

Tarih: 2026-02-28 04:34:21
Durum: EMPTY

## Kullanima Hazir Prompt
```text
Sen app implementasyon agentisin. Bu turda sadece asagidaki 4 deferred parity kalemini kapatacaksin.

Kurallar:
1) Contract-first: mevcut backend kontratlarini bozma, yeni endpoint acma.
2) Her kalem kapandiginda register statusunu web_done_app_done veya web_done_app_not_required yap.
3) Her PR tek amacli olsun; buyuk degisiklikleri bol.

Bu tur kapsam (sirayla):
- Deferred kalem kalmadi.

Test/kanit:
- Ilgili app testleri + smoke komutlari PASS
- Register status guncellemeleri
- Kisa kapanis notu (degisen dosyalar + kalan risk)

Blok sonu zorunlu:
- npm run readiness:phase11:sync
- npm run plan:phase11:deferred-worklist
- npm run plan:phase11:deferred-next-block
```

## Kaynak
- JSON: app-impact/25_phase11_deferred_next_block_latest.json
- Markdown: plan/148_phase11_deferred_next_block_latest.md
