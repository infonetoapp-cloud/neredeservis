# Design Tooling Decision (Figma + UI Kit vs Google Stitch)

Tarih: 2026-02-24
Durum: Accepted (Faz 0 karar, review sonrasi revize)
ADR: ADR-005

## 1. Karar (net, revize)

Bu proje icin `UI Kit-first (implementation mode)` yaklasimi kabul edildi.

Yani:
- premium React/Tailwind UI kit / component kit implementation default olacak
- `Google Stitch` fikir/varyasyon araci olarak kullanilabilecek (opsiyonel)
- `Figma` handoff / sistemlesme / freeze kaydi icin kullanilabilecek (opsiyonel ama guclu)

Eski `Stitch-first` yaklasimi MVP implementation defaultu olmaktan cikarildi.

## 2. Neden bu revizyon yapildi?

Hedefimiz:
- modern premium web urunu
- token disiplini
- solo-founder delivery hizi

Risk (Stitch-first defaultta):
- tekrar eden prompt/revizyon dongusu
- token uyumsuz AI ciktisi
- IA hiyerarsisinde tutarsizlik
- "guzel ama sistemsiz" ekranlar

UI kit-first yaklasimi:
- spacing/typography/component temelini hizla oturtur
- premium kaliteyi daha deterministik hale getirir
- kodlama hizini artirir

## 3. Arac Rolleri (yeni denge)

### 3.1 UI Kit (default)

Rol:
- uygulama ekranlarinin iskeleti ve component tabani
- hizli ama sistemli tasarim/kodlama
- premium panel kalitesine daha hizli ulasma

Kurallar:
- kit birebir tema olarak birakilmaz
- `44_*` tokenlariyla uyarlanir
- marka dili / spacing / typography bizim sistemimize cekilir

### 3.2 Stitch (opsiyonel ideation araci)

Rol:
- alternatif kompozisyon denemeleri
- hero / landing section fikirleri
- blokaj aninda varyasyon uretimi

Kurallar:
- final source-of-truth degil
- token ve IA disiplini yerine gecmez
- direkt kopya UI olarak kodlanmaz

### 3.3 Figma (opsiyonel ama guclu)

Rol:
- freeze artifact / handoff
- component naming / inspect
- ekip buyumesi halinde ortak dil

## 4. Uygulama Kurali (locked)

1. Kodlamaya girecek her ekranin final hali `freeze artifact` olarak kaydedilecek (Figma frame veya export).
2. Token disi rasgele renk/spacing kullanimi yasak.
3. UI kit componentleri tokenlara uydurulmadan dogrudan birakilmaz.
4. Stitch ciktisi kullanilacaksa referans/freeze review'dan gecmeden koda girmez.
5. Ekip buyumesi / handoff ihtiyaci artarsa Figma source-of-truth seviyesi artirilir.

## 5. Maliyet / Erisim Notu

- Figma'da ucretsiz baslangic plani bulunur; ogrenci uygunlugu varsa ekstra avantaj olabilir.
- Stitch tarafi deneysel urun oldugu icin erisim/sinirlar degisebilir.
- UI kit lisansi delivery hizi icin maliyet-etkin yatirim olarak degerlendirilir.
- Tasarim araci secimi mimariyi etkilemez.

## 6. Faz 1 Kullanimi (pratik, revize)

Faz 1'de default akis:
1. UI kit secimi / temel theme uyarlama
2. Panel shell + auth ekranlari kit tabanli kurulum
3. Token uyarlama (`44_*`)
4. Freeze + review

Stitch (opsiyonel):
- sadece kompozisyon alternatifleri / landing fikirleri / canli ops panel varyasyonlari icin

## 7. Referans Dokumanlar

- `37_visual_design_direction_apple_like_modern.md`
- `41_design_quality_review_and_handoff_checklist.md`
- `44_design_tokens_v1_numeric_table.md`
- `45_figma_design_handoff_structure_plan.md`
- `47_founder_led_design_workflow_playbook.md`
- `50_stitch_first_prompting_and_freeze_workflow.md`
