# The Happier Farm! / المزرعة الأسعد!

A browser-based isometric farming game with server-authoritative progression, barn economy, animals, factories, and real-time farm updates. Built for playtesting and private deployment on **.NET 8** + **SQL Server**, with an **English / Arabic** player interface.

> **Not a clone** — original crops, branding, and audio. Familiar social-farm *feel* without copied assets or names.

---

## Features

| Area | What players can do |
|------|---------------------|
| **Account** | Register / log in with email + password (JWT), unique display name |
| **Crops** | Equip a crop, plant on soil (gold per tile), wait for growth, harvest into barn |
| **Barn** | Sell goods, upgrade storage (Hearty Barn), capacity enforced server-side |
| **Animals** | Buy, place, **feed from barn**, collect milk / eggs / wool on timers |
| **Factories** | Load ingredients, run batch production (1–10×), collect when ready |
| **Build** | Footprint-aware placement, pickup to stash, decorations, farm expansion |
| **Live sync** | SignalR `farmStateChanged` + light polling; growth visuals from server timestamps |
| **UX** | Phaser farm canvas + DOM HUD/shop, MP3 menu/farm music, optional beta badge |

**Level gates** — catalog items unlock by player level (enforced on API and in the client shop).

**Economy** — prices, growth times, and pacing live in **SQL** (`GameSettings`, `CatalogTimingOverrides`, catalog tables). See [docs/context.md](docs/context.md) §5 for the full balance tables.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| API | ASP.NET Core 8, minimal APIs, Swagger (dev) |
| Auth | ASP.NET Core Identity + JWT Bearer |
| Database | SQL Server, EF Core 8 migrations |
| Realtime | SignalR (`/hubs/game`) |
| Client | TypeScript, Vite 8, Phaser 3 |
| i18n | English + Arabic (`client/src/i18n/`) |

---

## Repository layout

```
The Happier Farm!/
├── README.md                 ← this file
├── docs/
│   ├── context.md            ← authoritative spec & economy reference
│   ├── admin-catalog.md      ← SQL tables for future admin panel
│   └── …
├── server/
│   ├── HappierFarm.sln
│   ├── HappierFarm.Domain/
│   ├── HappierFarm.Infrastructure/   ← EF migrations
│   └── HappierFarm.WebAPI/           ← API + SignalR
└── client/
    ├── public/assets/        ← audio, brand, farm sprites, backgrounds
    └── src/                  ← Phaser scenes, HUD, network, i18n
```

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- **SQL Server** (local instance, LocalDB, or remote) with a database you can create/migrate (default name: `HappierFarmX7`)

---

## Quick start (local)

### 1. Database & API

```powershell
cd server\HappierFarm.WebAPI
dotnet run
```

- HTTP: **http://localhost:5216** (see `Properties/launchSettings.json`)
- On startup (Development), pending EF migrations are applied automatically
- Default connection string in `appsettings.json`:

  `Server=.;Database=HappierFarmX7;Trusted_Connection=True;TrustServerCertificate=True`

  Change `ConnectionStrings:DefaultConnection` for your SQL host/login.

### 2. Client

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

- Open **http://localhost:5173**
- Vite proxies `/api` and `/hubs` to `VITE_API_ORIGIN` (default `http://localhost:5216`)
- If you change the Vite port, add that origin to `Cors:AllowedOrigins` in the API `appsettings`

### 3. First play

1. **Register** (display name + email + password) or **Log in**
2. Open the **Crops** tab → **Equip** a crop → drag on empty soil to plant
3. Wait for ripeness (production pacing: e.g. barley ~30 min at 100% speed)
4. **Harvest** into barn → sell from **Barn & inventory**
5. Unlock animals/factories by level; feed animals from barn before production timers run

---

## Configuration highlights

| File | Purpose |
|------|---------|
| `server/HappierFarm.WebAPI/appsettings.json` | SQL, JWT, CORS, `GameTiming`, `ClientPresentation` |
| `server/.../appsettings.Development.json` | Dev logging; same production timers as base config |
| `server/.../appsettings.Production.json` | `ApplyMigrationsOnStartup: false` template for VPS |
| `client/.env` | `VITE_DEV_PORT`, `VITE_API_ORIGIN` |

**JWT** — set `Jwt:SigningKey` to at least 32 UTF-8 bytes; never commit production secrets.

**Beta badge** — `ClientPresentation:ShowBetaBadge` (labels EN/AR). Set `false` to hide without a client rebuild.

**Pacing** — `GlobalTimePercent` in `GameSettings` (100 = normal). Overrides per crop/animal/factory in `CatalogTimingOverrides`.

Full detail: [docs/context.md](docs/context.md).

---

## Client scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server + asset prep |
| `npm run build` | Production bundle → `client/dist/` |
| `npm run brand:sync` | Regenerate logo PNG from `happier-farm-logo-source.png` |
| `npm run farm-sprites:copy` | Sync farm sprite PNGs into `public/assets/farm/` |

---

## Production deployment (summary)

1. Publish the WebAPI (`dotnet publish`)
2. Apply migrations on production SQL (`dotnet ef database update` or controlled startup flag)
3. Serve `client/dist/` and reverse-proxy `/api` + `/hubs` (HTTPS + WebSockets for SignalR)
4. Set connection string, JWT secret, and CORS to your public URL via environment variables or secrets

See [docs/context.md](docs/context.md) §10.

---

## API overview

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Create account + farm grid |
| POST | `/api/auth/login` | JWT |
| GET | `/api/farm` | Full snapshot (catalogs, tiles, barn, config) |
| POST | `/api/farm/plant-batch` | Mass plant |
| POST | `/api/farm/harvest-batch` | Mass harvest |
| POST | `/api/barn/feed-animal` | Feed placed animal from barn |
| POST | `/api/barn/process-factory` | Start or collect factory run |
| Hub | `/hubs/game` | `farmStateChanged` events |

Swagger UI is available in Development at `/swagger`.

---

## Roadmap

| Status | Scope |
|--------|--------|
| **Shipped (v1.x)** | Core loop, animals, factories, expansion, SQL economy, EN/AR, beta badge |
| **Next (v2)** | Admin panel/API, friends / visits / gifting, multi-recipe factories |
| **Later** | Steal/weeds, OAuth, richer social systems |

---

## Documentation

- **[docs/context.md](docs/context.md)** — single source of truth (architecture, economy tables, ports, decisions)
- **[docs/admin-catalog.md](docs/admin-catalog.md)** — editable SQL catalog for future admin tools

---

## Authors

| | |
|---|---|
| **X7 Solutions** | Product studio |
| **Ahmed Mansour** | Design & development |
| **Cursor** | AI-assisted development (implementation support via the [Cursor](https://cursor.com) editor) |

---

## License

Proprietary — © X7 Solutions & Ahmed Mansour. All rights reserved unless otherwise agreed in writing.

Third-party assets (e.g. background music) are credited in `client/public/assets/audio/LICENSE.txt`.
