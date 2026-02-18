# SRV Code Algorithm (Step-197A)

Tarih: 2026-02-18  
Kapsam: Faz E / 197A

## Kontrat
- Uretim yalniz server-side yapilir.
- Alfabe: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Uzunluk: `6`
- Uretim fonksiyonu: `nanoid(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')`
- Collision retry limiti: `5`

## Collision Akisi
1. Yeni aday kod uret.
2. `routes.srvCode` uzerinde transaction/unique check yap.
3. Cakisma varsa tekrar dene.
4. Toplam deneme sayisi `5` olunca deterministic hata don:
   - `RESOURCE_EXHAUSTED`
   - internal code: `SRVCODE_COLLISION_LIMIT`

## Neden Bu Alfabe
- Karismaya acik karakterler dislanmistir:
  - Harf: `I`, `O`
  - Rakam: `1`, `0`
- Kullanici tarafinda sesli/paylasimli iletimde hata orani dusurulur.

## Client Dogrulama Notu
- Client kod uretmez.
- Client sadece pre-validation yapabilir:
  - regex: `^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$`
