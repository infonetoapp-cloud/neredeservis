# App Contract + Backend Sync Backlog (Web-Driven)

Tarih: 2026-02-24
Durum: Working backlog

## 1. Kapsam

Sadece su etkiler burada detaylanir:
- endpoint request/response semantik farklari
- error code / reason code eklemeleri
- auth/session/version enforcement davranislari
- payload field rename/deprecate/cutoff

UI makyaji bu dosyada tutulmaz (`02_*` dosyasina gider).

## 2. Takip Basliklari

- Error code mapping (web/backend -> app)
- Version enforcement (`426`, force update)
- Authz reason codes (tenant mismatch, policy denied, active route lock vb.)
- Payload compatibility sunset notlari
- Cutoff tarihleri / legacy endpoint read-only davranislari

## 3. Baslangic Notlari

- `426 Upgrade Required` handling app tarafinda standart hale gelmeli (tek yerden)
- Route/trip mutasyon reason code'lari app UX metinlerine map edilmeli
- `routeId/companyId` mismatch ve authz hatalari "genel hata" olarak yutulmamalı
- Web/backend kontrat freeze yapildikca burasi guncellenir

