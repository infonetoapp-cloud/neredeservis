# Faz 8 Marketing SEO Smoke Report

Tarih: 2026-02-27 20:20:04
Durum: PARTIAL

| Check | Status | Detail |
| --- | --- | --- |
| marketing root reachable | PASS | HTTP=200; content-type=text/html; charset=utf-8 |
| iletisim reachable | PASS | HTTP=200 |
| gizlilik reachable | PASS | HTTP=200 |
| kvkk reachable | PASS | HTTP=200 |
| robots endpoint + sitemap reference | FAIL | HTTP=404; sitemap-ref=False |
| sitemap endpoint + root url | FAIL | HTTP=404; root-url=False |
| opengraph image reachable | FAIL | HTTP=404; content-type=text/html; charset=utf-8 |
| twitter image reachable | FAIL | HTTP=404; content-type=text/html; charset=utf-8 |
| manifest reachable | FAIL | HTTP=404; content-type=text/html; charset=utf-8 |
| panel login reachable | PASS | HTTP=200 |
| www to apex canonical redirect | PASS | HTTP=308; location=https://neredeservis.app/ |

Not:
- Bu smoke SEO/metadata endpoint erisimi ve canonical redirect davranisini dogrular.
- Faz 8 landing polish kapsaminda sosyal onizleme + sitemap + robots + manifest butunlugu icin operasyonel kanittir.
