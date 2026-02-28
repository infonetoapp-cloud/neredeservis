# Design Quality Review + Handoff Checklist (Web)

Tarih: 2026-02-24
Durum: V0 / tasarim kalite sureci

## 1. Amaç

Tasarim kararlarinin:
- guzel gorunup
- kodlanabilir olup
- tutarlı kalmasini saglamak.

Bu dokuman "tasarim tamam" kriterini netlestirir.

## 2. Tasarim Review Katmanlari

1. Brand/visual review
2. IA/UX flow review
3. Component/system review
4. Engineering handoff review

## 3. Screen Review Checklist (her ekran icin)

### 3.1 Information hierarchy
- [ ] Baslik ve ana amac ilk bakista net
- [ ] Birincil aksiyon belirgin
- [ ] Ikincil aksiyonlar hiyerarsiyi bozmuyor
- [ ] Bilgi yogunlugu kontrol altinda

### 3.2 Visual quality
- [ ] "Muhasebe/ERP" hissi yok
- [ ] Spacing tutarli
- [ ] Typografi hiyerarsisi net
- [ ] Renk kullanimi semantik ve sade
- [ ] Premium hissi var ama abarti yok

### 3.3 Interaction states
- [ ] loading state dusunulmus
- [ ] empty state dusunulmus
- [ ] error state dusunulmus
- [ ] forbidden state dusunulmus (gerekliyse)
- [ ] success feedback pattern net

### 3.4 Accessibility
- [ ] kontrast kabul edilebilir
- [ ] klavye akisi dusunulmus
- [ ] focus state var
- [ ] icon-only butonlarda label/tooltip dusunulmus

## 4. Flow Review Checklist (user flow bazli)

- [ ] Happy path net
- [ ] Failure path net
- [ ] Permission-denied path net
- [ ] Back navigation net
- [ ] Multi-step formlarda kayip/veri kaybi riski dusunulmus

## 5. Handoff Checklist (tasarimdan kodlamaya)

Bir ekran/flow kodlamaya verilmeden once:
- [ ] route/path tanimli
- [ ] role/permission etkisi not edildi
- [ ] API baglantı noktasi belli
- [ ] component breakdown belli
- [ ] responsive davranis not edildi
- [ ] state listesi yazildi
- [ ] acceptance criteria issue'ya yazildi

## 6. Token/System Handoff Checklist

- [ ] typography scale tokenlari net
- [ ] color tokens net
- [ ] spacing/radius/shadow tokenlari net
- [ ] component variants listesi net
- [ ] semantik status componentleri tanimli

## 7. Tasarim-Kod Tutarlilik Review (implementation sonrasi)

Kontrol:
- [ ] ekrandaki spacing/tokenlar tasarima uygun
- [ ] state ekranlari atlanmamis
- [ ] desktop/tablet davranisi tutarli
- [ ] premium hissi implementation'da kaybolmamis

## 8. Tasarim Borc Kaydi Kuralı

Tasarımdan taviz verildiyse:
- issue acilir
- neden taviz verildigi yazilir
- hangi fazda duzeltilecegi yazilir

Bu sayede "sonra duzeltiriz" unutulmaz.

## 9. Faz Bazli Tasarim Review Ritmi

Faz 1:
- shell/auth ekranlari review

Faz 2:
- individual driver CRUD ekranlari review

Faz 3/4:
- company ops ve live ops ekranlari review

Faz 8:
- landing final premium polish review

## 10. Mimar Karari (tasarim kalite)

Profesyonel gorunum sans eseri cikmaz.

Bu nedenle:
- tasarim review checklistleri
- handoff checklistleri
- implementation review
zorunlu uygulanir.
