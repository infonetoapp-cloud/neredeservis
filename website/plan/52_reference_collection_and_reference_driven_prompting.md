# Reference Collection + Reference-Driven Prompting (Stitch)

Tarih: 2026-02-24
Durum: V1 (tasarim kalite artirma rehberi)

## 1. Amac

Stitch ciktisi guzel olmadiginda, referans kullanarak kaliteyi yukselten sistemli bir yontem tanimlamak.

Bu dokuman:
- referans nasil toplanir
- nasil secilir
- prompta nasil yazilir
- kopyaya dusmeden nasil yon verilir
sorularini cevaplar.

## 2. Ne Zaman Referans Zorunlu?

Asagidaki durumlardan biri varsa referans kullan:
- ekran generic/template gibi gorunuyorsa
- premium his gelmiyorsa
- hiyerarsi daginiksa
- Stitch tekrar tekrar ayni kaliteyi veriyorsa
- ne istedigini tarif etmekte zorlanıyorsan

Pratik kural:
- 2 basarisiz prompt turundan sonra referansli moda gec

## 3. Referans Secme Kurallari

Referans sayisi:
- ideal: `2-4`
- 1 = dar kalabilir
- 5+ = modeli karistirabilir

Referans cesitliligi:
- 1 layout/composition referansi
- 1 typografi/spacing referansi
- 1 premium SaaS panel hissi referansi
- (opsiyonel) 1 spesifik ekran referansi (login/mode/shell)

## 4. Referans Toplarken Neye Bakacaksin?

Referansi parcalayarak sec:
- layout ritmi (bosluklar)
- header kompozisyonu
- card density
- navigation sakinligi
- typografi hiyerarsisi
- CTA hiyerarsisi
- surface/border/shadow dengesi

Kopyalamayacagimiz seyler:
- marka rengi
- logo/ikon
- birebir component formu
- marka dili/metinler

## 5. Referans Notlama Formu (sana ozel)

```text
Reference [A/B/C]:
- Source: [link or screenshot note]
- Borrow:
  - [layout/header/nav/card/spacing/...]
  - [what exactly works]
- Do not copy:
  - [brand/color/component/logo/etc.]
```

## 6. Prompta Referans Yazma Formu (kisa)

```text
Reference direction (do not copy directly):
- Reference A: Borrow the page composition and whitespace rhythm
- Reference B: Borrow the typography hierarchy and calm card spacing
- Reference C: Borrow the premium admin shell navigation structure and active-state clarity

Do not copy:
- exact colors
- exact component shapes
- branding
- icons/logos
```

## 7. Kaynak Kalitesi Notu

Kural:
- sadece "dribbble shot" ile gitme
- guzel ama kodlanamaz fantezi UI'lerden kac
- gercek urun ekranlarindan da referans topla

## 8. Kopya Riskini Onleyen Kurallar (locked)

1. En az 2 referans birlestir
2. "Neyi kopyalamayacagini" prompta yaz
3. Marka renklerini bizim tokenlara gore ayarla
4. Component formunu birebir tasima
5. Sonucu `44` token tablosuna yaklastir

## 9. Faz 1 Ekranlarinda Referans Kullanimi (onerilen)

### Login
- 1 auth composition referansi
- 1 premium spacing/typografi referansi
- 1 subtle visual panel referansi

### Mode Selector
- 1 decision screen/card hierarchy referansi
- 1 premium card/surface referansi
- 1 calm modern screen referansi

### Panel Shell
- 1 premium admin shell/nav referansi
- 1 page header/canvas rhythm referansi
- 1 sidebar active state quality referansi

## 10. Freeze Sirasinda Referans Kaydi

Her freeze artifact notasina ekle:
- hangi referanslar kullanildi
- hangi kisimlar etkilendi
- hangi kisimlar degistirildi

Bu, ileride tutarlilik ve tekrar uretim icin faydalidir.

## 11. Referanslar

- `37_visual_design_direction_apple_like_modern.md`
- `41_design_quality_review_and_handoff_checklist.md`
- `44_design_tokens_v1_numeric_table.md`
- `50_stitch_first_prompting_and_freeze_workflow.md`
- `51_stitch_phase1_prompts_login_mode_shell.md`

