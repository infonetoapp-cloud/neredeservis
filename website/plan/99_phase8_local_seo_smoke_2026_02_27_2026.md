# Faz 8 Local SEO Smoke Report

Tarih: 2026-02-27 20:26:53
Durum: PASS
Base URL: http://127.0.0.1:3210

| Check | Status | Detail |
| --- | --- | --- |
| dev server bootstrap | PASS | ready on http://127.0.0.1:3210 |
| marketing root reachable | PASS | HTTP=200; content-type=text/html; charset=utf-8 |
| iletisim reachable | PASS | HTTP=200 |
| gizlilik reachable | PASS | HTTP=200 |
| kvkk reachable | PASS | HTTP=200 |
| giris reachable | PASS | HTTP=200 |
| robots endpoint + sitemap reference | PASS | HTTP=200; sitemap-ref=True |
| sitemap endpoint reachable | PASS | HTTP=200; has-loc=True |
| opengraph image reachable | PASS | HTTP=200; content-type=image/png |
| twitter image reachable | PASS | HTTP=200; content-type=image/png |
| manifest reachable | PASS | HTTP=200; content-type=application/manifest+json |
| panel login reachable | PASS | HTTP=200 |

Not:
- Bu smoke sadece lokal build/dev akisinda Faz 8 SEO endpointlerinin calistigini dogrular.
- Canli ortam 404 bulgulari deploy penceresinde smoke:phase8:seo ile kapanacaktir.
