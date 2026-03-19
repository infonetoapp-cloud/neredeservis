# NeredeServis Backend API

Bu servis, `Nerede Servis` icin self-hosted backend migration'in ilk risksiz adimidir.

Su anda amaci:
- DigitalOcean + Coolify uzerinde ayri bir backend container calistirmak
- health/version endpointlerini saglamak
- Firebase Functions'tan cikis icin yeni HTTP API yuzeyini acmak

## Ilk endpointler

- `GET /healthz`
- `GET /readyz`
- `GET /version`

## Lokal calistirma

```powershell
cd backend/api
node src/server.js
```

Varsayilan port: `3001`

## Coolify icin not

- Port: `3001`
- Dockerfile: `backend/api/Dockerfile`
- Ilk deployment sonrasi test:
  - `/healthz`
  - `/version`

## Sonraki saglikli adim

Bu servise ilk olarak `web-only`, `read-only` endpointler eklenmeli.

Onerilen sira:
1. `GET /healthz`
2. `GET /version`
3. `GET /api/platform/landing-config`
4. `GET /api/company/:companyId/profile`
5. Sonra secili write endpointleri
