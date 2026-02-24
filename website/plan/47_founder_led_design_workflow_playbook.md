# Founder-Led Design Workflow Playbook (No Designer, UI Kit-First)

Tarih: 2026-02-24
Durum: V2 (Faz 0 -> Faz 2 kullanimi icin, review sonrasi revize)

## 1. Amac

Bu dokuman, tasarimci olmadan ama profesyonel kalite hedefiyle ilerlemek icin kuralli workflow tanimlar.

Hedef:
- guzel gorunen
- tutarli
- kodlanabilir
- bakimi kolay
UI cikarmak.

## 2. Ana Prensip

Sen "tasarimci gibi sanat yapmak" zorunda degilsin.

Senin yapacagin sey:
- dogru tabani secmek (UI kit)
- dogru sira ile ilerlemek
- token ve component kurallarina uymak
- review checklist ile kaliteyi korumak

## 3. Arac Seti (onerilen, revize)

Founder modu icin:
- Ana implementation araci: `React/Tailwind UI Kit` (premium, sistemli)
- Ideation araci (opsiyonel): `Google Stitch`
- Freeze/handoff (opsiyonel ama tavsiye): `Figma`
- Not/karar: `website/plan/*`
- Ekran goruntu toplama: `website/design-freeze/` (ileride acilacak) veya Figma board

Not:
- UI kit ile baslamak default
- Stitch ile cizmek serbest ama zorunlu degil
- kuralsiz cizmek serbest degil

## 4. Calisma Sirasi (her ekran icin)

1. Akisi sec
- `34_panel_user_flows_and_wireflow_plan.md` icinden ekran akisini sec

2. Icerik iskeleti yaz
- ekran basligi
- ana aksiyon
- kritik veri bloklari
- hata/empty/loading durumlari

3. UI kit tabanini sec / yerlestir (default)
- uygun layout/component pattern sec
- shell / table / form / card iskeletini kur
- bilgi hiyerarsisini kit uzerinde yerlestir

4. Tokenli UI uyarlamasina gec
- `44_design_tokens_v1_numeric_table.md` disina cikma
- spacing/radius/tipografi/renkleri kendi sistemine cek
- kitin generic izlerini temizle

5. (Opsiyonel) Stitch ile varyasyon dene
- sadece kompozisyon/hero/panel alternatifleri icin
- sonuc iyi ise tokenli sisteme uyarlayarak kullan
- sonuc generic ise zaman kaybetme, kiti gelistirmeye devam et

6. Interaction state'leri ciz / varyasyonla
- hover
- active
- focus
- disabled
- loading
- empty
- error

7. Freeze artifact kaydi
- final ekran export (PNG/PDF veya Figma frame)
- kullanilan token notlari
- state notlari
- open issue listesi

8. Review checklist
- `41_design_quality_review_and_handoff_checklist.md`

9. Handoff hazirligi
- `45_figma_design_handoff_structure_plan.md` (Figma varsa)
- veya freeze notlari (Figma yoksa)

## 5. 80/20 Tasarim Kurali (seni hizlandirir)

Kaliteyi en cok etkileyen 5 sey:
1. spacing
2. tipografi hiyerarsisi
3. renk disiplini
4. bilgi gruplama
5. gereksiz UI kalabaligini kesmek

Ilk asamada "ozel efekt" kovalamayacagiz.

## 6. Apple-benzeri His Icin Uygulanabilir Kurallar

YAP:
- daha buyuk bosluk kullan
- daha az ama daha net kart kullan
- baslik / alt bilgi / aksiyon hiyerarsisini netlestir
- ikonlari sade tut
- renk yerine tipografi ve boslukla hiyerarsi kur

YAPMA:
- her karta farkli renk
- cok sert border + cok sert shadow + cok sert blur ayni anda
- kucuk fontla fazla bilgi sikistirma
- her problemi modal ile cozme

## 7. Haftalik Founder Design Rutini (onerilen)

Haftada 3 blok yeterli:

- Blok A (60-90 dk): 1 ekran wireframe + content hierarchy
- Blok B (90-120 dk): UI kit tabanli tokenli UI + states
- Blok C (45 dk): self review + handoff notes

Kural:
- Bir ekrani "yarim guzel" birakip 5 yeni ekran acma.
- Az ekran, ama bitmis ekran.

## 8. Faz 1 Tasarim Sirasi (net)

Sirayi bozma:
1. Panel shell (nav/topbar/content shell)
2. Login
3. Mode selector
4. Company selector
5. Dashboard shell (individual + company)
6. Table base pattern
7. Form base pattern
8. Route/stop editor shell
9. Live ops split-pane shell

Bu siralama ile once tasarim sistemi olusur, sonra ekranlar hizlanir.

## 9. "Tasarimci Yok" Riskini Azaltan Kontroller

- Token disi deger yasak
- Her ekranda ayni base components
- Checklist review zorunlu
- Once desktop shell, sonra responsive varyant
- Koddan once tasarim freeze (Figma frame/export)
- Stitch kullanimi varsa sadece ideation rolu ile sinirla

## 10. Donanimli Olmadan Guzel Tasarim Yapmak Icin Kisa Egzersizler

Her ekran oncesi 10 dakikalik mini egzersiz:
- 3 benzer ekran referansi topla (Apple-like / premium SaaS)
- ortak desenleri not et (spacing, header, card, table)
- sadece 1 farkli vurgu sec (hero, map shell, KPI block)

Kural:
- Referanslari birlestir, kopyalama yapma.

## 11. Faz 1 "Done" (tasarim acisindan)

Bir ekran tasarim olarak "done" sayilmasi icin:
- flow dokumanindaki amaci karsiliyor
- desktop + mobile/compact hali var (gereken ekranlarda)
- loading/empty/error state var
- token uyumu tam
- handoff/freeze notu var
- review checklistten gecti

## 12. Referans Dokumanlar

- `34_panel_user_flows_and_wireflow_plan.md`
- `37_visual_design_direction_apple_like_modern.md`
- `40_panel_visual_patterns_and_interaction_spec.md`
- `41_design_quality_review_and_handoff_checklist.md`
- `44_design_tokens_v1_numeric_table.md`
- `45_figma_design_handoff_structure_plan.md`
- `46_design_tooling_decision_figma_vs_google_stitch.md`
- `50_stitch_first_prompting_and_freeze_workflow.md` (opsiyonel ideation)
- `52_reference_collection_and_reference_driven_prompting.md` (opsiyonel ideation)
