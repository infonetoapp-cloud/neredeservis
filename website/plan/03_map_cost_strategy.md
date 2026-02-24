# Harita ve Maliyet Stratejisi (Google tasarruf + tutarlilik)

Tarih: 2026-02-24
Durum: Oneri

## 1. Sorun Tanimi

Senin onceligin dogru:
- Canli konum ve rota ozellikleri olacak
- Ama Google Maps maliyeti kontrolden cikmasin

Mevcut durumda:
- Mobilde Google Maps kullanimi var
- Backendde Mapbox proxy/cap altyapisi da var

## 2. Mapbox kullanirsak "konum uyumsuzlugu" olur mu?

Kisa cevap:
- Canli konum koordinatlari acisindan normalde hayir.

Neden:
- Konum verisi `lat/lng` olarak RTDB/Firestore tarafinda tutuluyor.
- Google ve Mapbox ayni koordinati farkli baz haritada gosterir.

Olabilecek farklar:
- Yol uzerine "snap" davranisi farkli olabilir
- Rota cizimi (polyline) farkli olabilir
- ETA farkli olabilir
- Geocoding/adres metni farkli olabilir

Yani:
- "Arac burada mi?" sorusunda buyuk sorun olmaz
- "Rota/ETA ayni mi?" sorusunda kucuk farklar olabilir

## 3. Tutarlilik icin ana prensip

Tek source-of-truth:
- Konum: backendden gelen ham koordinat
- Rota geometrisi: server tarafinda hesaplanan/cached polyline
- ETA: tek provider uzerinden hesaplanan deger (munkunse server)

Kural:
- Her istemci (mobil/web) kendi kafasina gore yeniden rota hesaplamasin.

## 4. Onerilen Harita Stratejisi (MVP)

### Web Panel
- Harita render: Mapbox (onerilen)
- Rota/directions: mevcut backend Mapbox proxy (cap + rate limit ile)
- Geocoding/autocomplete:
  - Faz 1: minimum kullan (manual pin / kayitli nokta)
  - Faz 2: gerekiyorsa sinirli autocomplete

### Mobil
- Mevcut Google Maps kalsin (simdilik)
- Cunku mobil app uzerinde zaten aktif gelisim baska agent'ta gidiyor

Bu hybrid model calisir.

## 5. Google maliyetini dusuren somut kurallar

1. Autocomplete cagrisini azalt
- min 3 karakter
- debounce 300-500 ms
- session token reuse
- secilen sonucu local cachele

2. Haritayi "liste yerine her yerde" acma
- Liste ekranlarinda once tablo/kart
- Harita panelini kullanici isteyince ac

3. Canli takipte sadece aktif ekran subscribe
- Tum rota/soforler icin surekli realtime dinleme yapma
- Aktif operasyon ekrani acikken subscribe et

4. Rota hesaplamayi cachele
- Ayni rota icin tekrar tekrar directions isteme
- Route update degismediyse mevcut polyline kullan

5. ETA update frekansini sinirla
- Her konum noktasinda ETA recalc yapma
- Zamana/mesafeye dayali throttling kullan

## 6. Mapbox maliyetini de kontrol et (unutma)

Mapbox da limitsiz degil. Bu yuzden:
- server-side cap
- runtime flag
- rate limit
- fallback

Repo tarafinda bu yonde temel hazirlik oldugu goruluyor; bu buyuk avantaj.

## 7. Karar (net tavsiye)

MVP icin:
- Web: Mapbox-first
- Mobil: mevcut Google kalsin
- Backend: Mapbox proxy/cap kullan

Sonraki asama:
- Mobilde de provider standardizasyonu istenirse ayrica degerlendirilir

Bu, maliyet + hiz + risk dengesi acisindan en saglam yol.
