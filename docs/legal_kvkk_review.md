# KVKK Hukuk Review Paketi (STEP-090A)

Tarih: 2026-02-17  
Durum: PENDING_EXTERNAL_LEGAL_REVIEW

## 1) Meta
- kvkk_text_version: `v1.0-draft`
- legal_approval: `HAYIR`
- legal_approval_date: `<BOS>`
- legal_approver: `<BOS>`
- owner: `Sinan Canpolat`
- support_email: `infonetoapp@gmail.com`
- source_of_truth:
  - `docs/NeredeServis_Teknik_Plan.md` (Bolum 7 - KVKK/Gizlilik)
  - `docs/NeredeServis_UrunStratejisi.md` (KVKK riskleri ve urun akislari)
  - `docs/api_contracts.md` (`consents/{uid}` sozlesmesi)

## 2) Hukuga Gonderilecek Paket
- [x] Teknik plan KVKK bolumu
- [x] Urun stratejisindeki KVKK risk bolumu
- [x] Consent veri modeli (`consents/{uid}`)
- [x] Veri silme ve retention akisi (delete + cron)
- [x] Misafir modu veri siniri (guest tracking policy)
- [ ] Gercek KVKK metni avukat redaksiyonu
- [ ] Gizlilik politikasi nihai metni

## 3) Hukuktan Zorunlu Cevap Bekleyen Konular
- [ ] Acik riza metni yayin icin yeterli mi?
- [ ] Aydinlatma metni dili/scope yeterli mi?
- [ ] Konum verisi retention suresi hukuken uygun mu?
- [ ] Misafir modu ve gecici veri modeli KVKK ile uyumlu mu?
- [ ] Hesap silme + log saklama istisnalari dogru mu?
- [ ] Cocuk/veli segmentine ozel ek metin gerekli mi?
- [ ] Yurt disi veri aktarimi ibaresi gerekli mi?

## 4) Teknik Uyum Haritasi (Hukuk <-> Kod)
- Consent alani: `consents/{uid}`
  - `privacyVersion`
  - `kvkkTextVersion`
  - `locationConsent`
  - `acceptedAt`
  - `platform`
- Runtime gate:
  - Riza yoksa tracking acilmaz.
- Data minimization:
  - Yolcu/guest icin konum izni isteme yok.
- Delete flow:
  - `deleteUserData` fonksiyonu + retention cron.

## 5) Hukuk Yorum Kaydi (Append-Only)
| Tarih | Kaynak | Karar/Yorum | Etki | Aksiyon |
|---|---|---|---|---|
| 2026-02-17 | Sistem | Ilk hukuk review paketi olusturuldu. | Release gate acik kalir. | Avukata gonderim bekleniyor. |

## 6) Gonderim E-Posta Taslagi
Konu: `NeredeServis KVKK Hukuki Inceleme Talebi (v1.0-draft)`

Metin:
`Merhaba, NeredeServis mobil uygulamasi icin KVKK aydinlatma/acik riza metinleri ve veri isleme akislarinin hukuki uygunluk incelemesini rica ederim. Eklerde teknik kapsam, consent modeli, retention ve delete akislari vardir. Ozellikle konum verisi, misafir modu, acik riza dili, yurt disi aktarim ibareleri ve hesap silme surecine yorum rica ederim.`

## 7) 090A Durum Notu
- Bu dosya olusturulmustur.
- Dis hukuk inceleme sonucu gelmeden `legal_approval=EVET` yapilmaz.
- Sonuc geldikce sadece bu dosyaya append yapilir; eski kararlar silinmez.
