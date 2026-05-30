# NeredeServis Welcome Video (Remotion)

Bu klasor, NeredeServis icin kisa karşılama videosunu Remotion ile uretmek icin hazirlandi.

## 1) Kurulum

```bash
npm install
```

## 2) ElevenLabs seslendirme + timestamp uretimi

```bash
set ELEVENLABS_API_KEY=YOUR_KEY
npm run voice
```

Olusan dosyalar:
- `public/audio/narration.mp3`
- `src/data/timings.generated.json`
- `out/transcript.txt`

## 3) Muzik (Pixabay)

Cloudflare doğrulaması nedeniyle otomasyonla Pixabay indirmesi her ortamda çalışmayabilir.
Muzigi manuel eklemek icin:

1. Pixabay'den telifsiz bir parca indirin (`.mp3`)
2. Dosyayi `public/audio/pixabay-track.mp3` olarak koyun
3. `src/data/video-config.json` icinde:
   - `"musicFile": "audio/pixabay-track.mp3"`

Baslangic ve bitis fade-in/fade-out otomatik uygulanir.

## 4) Studio

```bash
npm run studio
```

## 5) Render

```bash
npm run render
```

Cikti:
- `out/neredeservis-welcome.mp4`

## 6) Dini TikTok video (1080x1920, Pexels + ElevenLabs)

Bu akista sahne klipleri Pexels API ile otomatik indirilir ve dini metinler ElevenLabs ile seslendirilir.

### Gerekli anahtarlar
`video/.env.video-keys` (bir ust klasor) icinde:

```bash
PEXELS_API_KEY=...
ELEVENLABS_API_KEY=...
```

### Adimlar

```bash
npm run pexels:fetch
npm run voice:dini
npm run render:dini
```

Tek komut:

```bash
npm run build:dini
```

Cikti:
- `out/dini-tiktok-1080x1920.mp4`
- `out/pexels-attribution.txt`
