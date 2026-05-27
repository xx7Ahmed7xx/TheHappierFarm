# The Happier Farm! — Project context (single source of truth)

This document is the **authoritative reference** for how we build and operate *The Happier Farm!*: a nostalgic, **original** browser/mobile social farming game inspired by the *feel* of classic social farms (timers, visits, gifting, progression), **without** copying copyrighted names, art, or branding.

Older brainstorming files live under `docs/chatgptDocs.md` and `docs/geminiDocs.md`; **when anything conflicts, this file wins** after we update it together.

---

## 1) Product vision

- **Emotional loop**: plant → wait → harvest → sell/reward → buy seeds → decorate/socialize (later slices).
- **Not a clone**: original crop names, UI, audio, and story. Mechanics can feel familiar; assets and brand must not.
- **Platforms**: responsive web first (mobile + desktop). Optional native wrapper later.
- **MVP success**: a player can **register with email + password** (Identity), get a JWT, see a **9×9** farm, **buy seeds**, **plant**, **wait** (timestamp growth), **harvest**, earn **gold + XP**, and receive **live farm refresh hints** via SignalR. Friends/gifts/visits are next slices (see roadmap).

---

## 2) Locked tech stack (v1)

| Layer | Choice | Notes |
|------|--------|------|
| Runtime | **.NET 8 LTS** | Broad support; modular monolith. |
| API | **ASP.NET Core** minimal APIs + Swagger in dev | REST for authoritative actions. |
| DB | **SQL Server** (existing VPS) | EF Core first-class provider; composite indexes on tiles. |
| ORM | **EF Core 8** | Migrations in `server/HappierFarm.Infrastructure/Migrations` — workflow in `docs/migrations.md`. |
| Realtime | **SignalR** (JSON) | Push + future chat/presence; **not** the source of truth for economy. |
| Auth | **ASP.NET Core Identity** + **JWT Bearer** | Email/password register & login; farm + hub require valid JWT. |
| Client | **Phaser 3** + **TypeScript** + **Vite 8** | Canvas = farm grid; DOM = HUD/shop-style controls. **Procedural** isometric sprites at preload (cow/cheese-press style) — no external sprite pack required. |
| Dev proxy | **Vite `server.proxy`** | `/api` and `/hubs` proxied to **`VITE_API_ORIGIN`** (default `http://localhost:5216`). |

**Deferred (not v1 blockers)**  
Redis caching, **OAuth** (Google/Apple/etc.), Kubernetes, microservices, steal/weeds/pest “friction” systems (see §10).

---

## 2a) Ports, URLs, and keeping front ↔ back in sync

| What | Default | Where to change |
|------|---------|-----------------|
| **API HTTP port** | **5216** | `server/HappierFarm.WebAPI/Properties/launchSettings.json` → profile **`http`** → `applicationUrl`. (Profile **`https`** also binds **5216** for HTTP.) |
| **Vite dev port** | **5173** | `client/.env` or `.env.local`: `VITE_DEV_PORT` (see `client/.env.example`). Must match the **origin** the browser uses. |
| **Proxy target (API base)** | **http://localhost:5216** | `client/.env`: `VITE_API_ORIGIN` — must match the API’s **`applicationUrl`** scheme/host/port. |
| **CORS allowed browser origins** | `http://localhost:5173`, `http://127.0.0.1:5173` | `server/HappierFarm.WebAPI/appsettings*.json` → **`Cors:AllowedOrigins`**. If you change Vite’s port, add that exact origin here. |

**Rules of thumb**

1. **Client → API in dev**: the game uses **relative** URLs (`/api/...`, `/hubs/...`). Vite forwards them to `VITE_API_ORIGIN`; you should **not** hardcode `http://localhost:5216` inside Phaser/TS fetch paths.  
2. **API → browser**: only **CORS** matters for credentialed requests; keep **`Cors:AllowedOrigins`** aligned with whatever URL bar you use (`localhost` vs `127.0.0.1` are different origins).  
3. **Production**: set `applicationUrl` / reverse proxy URL, set SPA public URL in **`Cors:AllowedOrigins`**, and build the client with the correct **`VITE_*`** only if you still use a dev-style proxy (usually the SPA is served from the same host as the API and paths stay relative).

---

## 3) Core engineering rules

### Server authority

- The **server** validates and applies every gameplay mutation (gold, seeds, plant time, harvest payouts, XP).
- The client **never** sends computed rewards, ripeness, or “current gold” as facts—only **intent** (e.g. “plant at tile (x,y)”).

### Timestamp growth (no crop tick threads)

- Each planted tile stores **`PlantedAtUtc`** + **`CropTypeId`** (FK to static `CropDefinitions`).
- Ripeness and growth **buckets** are computed on read/commands from **`DateTimeOffset.UtcNow`** vs `PlantedAtUtc + GrowthDurationSeconds`.
- **No** background thread simulating every farm. Optional **batch jobs** later (digest emails, etc.) are not per-crop tickers.

### Async I/O vs “async gameplay”

- **Async/await** in the API is normal HTTP/DB/SignalR I/O. It does **not** conflict with later realtime presence.
- **Async gameplay** (offline growth) stays timestamp-based; SignalR/polling only **refreshes views**.

### Client timers + SignalR (agreed pattern)

- **Client**: smooth growth visuals using **server timestamps** (`plantedAtUtc`, `growthDurationSeconds`) so the field “breathes” between HTTP refreshes.
- **Server push**: after successful mutations, broadcast **`farmStateChanged`** so any open client can re-fetch the farm snapshot.
- **Polling**: light `GET /api/farm` on an interval while playing (backup if a push is missed).

---

## 4) Repository layout

```
The Happier Farm!/
  docs/
    context.md           ← this file (decisions + spec)
    chatgptDocs.md       ← legacy notes
    geminiDocs.md        ← legacy notes
  server/
    HappierFarm.sln
    HappierFarm.Domain/            ← entities + shared constants
    HappierFarm.Infrastructure/    ← EF Core DbContext + migrations
    HappierFarm.WebAPI/            ← HTTP + SignalR + FarmService
  client/                          ← Vite + Phaser HUD + farm canvas
```

---

## 5) Domain model (v1)

### `AspNetUsers` (`ApplicationUser` — Identity)

- Standard Identity columns (`Email`, `PasswordHash`, `UserName`, etc.). We use **email as `UserName`** for simplicity.  
- Game fields: **`GoldCoins`** (starts **100** on register), **`ExperiencePoints`**, **`Level`**, **`CreatedAt`**, **`DisplayName`** (required, shown in UI), **`DisplayNameNormalized`** (unique index, case-insensitive).  
- Email confirmation is **off** for v1 so players can play immediately after register.

### `FarmTiles`

- `Id` (Guid)  
- `PlayerId` (FK)  
- `CoordinateX`, `CoordinateY` (0-based, **0..gridSize−1**; default grid **9×9**, expandable per player)  
- `CropTypeId` nullable; `PlantedAtUtc` nullable  
- **Unique** index on `(PlayerId, CoordinateX, CoordinateY)`

### Economy (authoritative — SQL + `CatalogTimingOverrides`)

**Pacing rule:** effective seconds = `round(baseSeconds × 100 / GlobalTimePercent)`.  
**Base seconds** come from `CatalogTimingOverrides` when present, else the catalog row (`GrowthDurationSeconds`, `ProductionIntervalSeconds`, `ProcessSeconds`).  
**Dev and Production** both use **`GlobalTimePercent: 100`** and the same override table (see `appsettings.json` / migration `20260522120000_ProductionEconomyBalance`).

#### Crops (`CropDefinitions` + timing override `crop`)

| Id | EN name | Lvl | Plant (g) | Sell (g) | Growth | XP | Harvest |
|----|---------|-----|-----------|----------|--------|-----|---------|
| 1 | Sunny Barley | 1 | 8 | 18 | **30 min** (1800s) | 5 | barley |
| 2 | Swift Carrot | 2 | 15 | 35 | **45 min** (2700s) | 12 | carrot |
| 3 | Golden Wheat | 2 | 12 | 28 | **40 min** (2400s) | 8 | wheat |
| 4 | Vine Tomato | 4 | 30 | 65 | **2 h** (7200s) | 18 | tomato |
| 5 | Autumn Pumpkin | 6 | 45 | 110 | **4 h** (14400s) | 28 | pumpkin |

**Planting** charges **`BuyPrice` gold per successful tile** (no seed inventory). **Harvest** adds `BaseYield` of `HarvestResourceCode` to the barn; **sell** uses `ResourceDefinitions.SellValue`. **`MinLevelRequired`** is enforced on **server** (`EnsureMinLevel`) and **client** (shop lock, equip, plant, buy, place).

#### Animals (`AnimalDefinitions` + timing override `animal`)

| Id | EN name | Lvl | Buy (g) | Feed (barn) | Cycle | Product |
|----|---------|-----|---------|-------------|-------|---------|
| 3 | Clucking Hen | 2 | 60 | 1× carrot | **20 min** (1200s) | 3× egg |
| 1 | Happy Holstein | 3 | 250 | 2× wheat | **45 min** (2700s) | 2× milk |
| 2 | Woolly Sheep | 4 | 200 | 2× barley | **60 min** (3600s) | 2× wool |

**Feed gate:** placed animals with no timer must be fed via **`POST /api/barn/feed-animal`** (consumes feed from barn, starts production timer).

#### Factories (`FactoryDefinitions` + timing override `factory`)

| Id | EN name | Lvl | Buy (g) | Recipe | Process |
|----|---------|-----|---------|--------|---------|
| 2 | Hearty Barn | 3 | 350 | (storage upgrades) | — |
| 1 | Meadow Cheese Press | 4 | 220 | 3 milk → 1 cheese | **30 min** (1800s) |
| 3 | Wool Spinner | 5 | 200 | 2 wool → 1 yarn | **40 min** (2400s) |
| 4 | Village Bakery | 6 | 280 | 3 wheat → 1 bread | **50 min** (3000s) |

Idle factory: spend inputs from barn → timer → collect output (batch runs 1–10).

#### Decorations (`DecorationDefinitions`)

| Id | Name | Lvl | Buy (g) |
|----|------|-----|---------|
| 1 | Sunflower Patch | 2 | 35 |
| 2 | Wooden Fence | 3 | 60 |
| 3 | Cozy Hay Bale | 5 | 45 |

#### Progression & storage (`GameSettings` singleton)

| Setting | Value |
|---------|-------|
| Starter gold / dinars | 100 / 100 |
| Base storage | 50 + (level − 1) × 10 |
| Barn factory id | 2 (Hearty Barn) |
| Max banked animal cycles | 30 |
| Expansion price | `round(450 × 2.08^step + 25 × step²)` per +1 grid side |
| Level formula | `max(1, xp / 100 + 1)` |

**Barn upgrade tiers** (`BarnUpgradeTierDefinitions`): +20 (250g), +50 (600g), +100 (1500g) — requires barn placed.

> **Admin v2+**: edit SQL or future admin API — see `docs/admin-catalog.md`. Client reads snapshot only; small `DEFAULT_GAME_CONFIG` fallback if `gameConfig` is missing.

### `PlayerSeedStocks` (legacy table — unused)

- Table remains in DB for migration compatibility. **No seed packs** — planting charges gold per successful tile only.

**Sprites**: PNG art in `client/public/assets/farm/` (`npm run farm-sprites:copy`). `PreloadScene` loads PNGs first; procedural fallback in `farmProceduralSprites.ts`. Keys: `farm-crop-{id}-{seed|grow|ripe}`, `farm-animal-{id}`, `farm-factory-{id}`, `farm-decoration-{id}`.

**Locales**: English + Arabic (`client/src/i18n/`). Catalog display names from SQL (`DisplayNameEn` / `DisplayNameAr` on all catalog tables — filled by migration `20260527081901_SeedArabicCatalogDisplayNames`). Client fallbacks in `catalogFallbacks.ts` used if API rows are still empty. HUD/shop/modals use `catalogNames.ts` (no raw English codes in Arabic UI). Browser form validation messages translated via `formValidation.ts`; gold price labels use `shop.goldPrice` / `shop.goldPerTile`; timer chips use `formatGameTimer` (compact on mobile).

**Audio**: Web Audio SFX + looping MP3 BGM (`client/public/assets/audio/bgm-menu.mp3`, `bgm-farm.mp3`) with procedural fallback (`audio.ts`, `bgmPlayer.ts`). Menu vs farm tracks differ. Global **♪** toggles music (`ClientPresentation` unrelated).

**Brand / link previews**: Source logo `client/public/assets/brand/happier-farm-logo.png`. Build script `npm run brand:images` (`scripts/generate-brand-images.mjs`, runs on `prebuild`) outputs square **favicons** (`favicon-32.png`, `favicon-192.png`, `favicon-512.png`) on `#0d2818` and **og-share.png** (1200×630) for social cards. `client/index.html` includes Open Graph + Twitter meta tags (absolute `og:image` / `og:url` → `https://thehappierfarm.click`). After deploy, refresh caches via Facebook Sharing Debugger / Telegram Saved Messages if previews look stale.

**Factory batch runs**: `FarmPlacement.BatchRuns` (1–10). Starting consumes `inputQuantity × runs`; timer duration is **`processSeconds × runs`** (cumulative); collect yields **`outputQuantity × runs`**. Snapshot exposes `placementBatchRuns` and scaled `placementCooldownSeconds` / `placementSecondsRemaining`.

**Locales (v1)**: English + Arabic player UI (`client/src/i18n/`). Header language switcher; `POST /api/barn/sell-resource` accepts `quantity` 1–9999 in one request (sell ×5 / ×10 buttons).

### Barn storage (server enforced)

- **Base capacity**: **`GameSettings.BaseStorageCapacity + (level − 1) × StoragePerLevel`** (defaults 50 + 10/level).  
- **Barn upgrades** (requires **Hearty Barn placed** on farm): tier 1 **+20** (250g), tier 2 **+50** (600g), tier 3 **+100** (1500g) — cumulative bonuses on `ApplicationUser.BarnUpgradeTier`.  
- Snapshot: **`storageCapacity`**, **`storageUsed`**, **`barnUpgradeTier`**, **`barnPlacedOnFarm`**, **`nextBarnUpgrade`** `{ nextTier, bonusSlots, goldCost, totalBarnBonus }`.  
- Collect/process **reject** when full. Sell from sidebar inventory frees slots.  
- **Level** = `max(1, xp / 100 + 1)`; level-up unlocks shop rows (see table above + decor levels 2/3/5).

- **Buy** → item goes to **stash** (`PlayerAnimals.Quantity` / `PlayerFactories.Quantity`). Shop enforces **`MaxOwned`** (stash + placed).  
- **Place** on an empty soil tile (`POST /api/farm/place`) → moves 1 from stash to **`FarmPlacements`** (tile-locked until pickup). Enforces **`MaxPlaced`**.  
- **Pickup** (`POST /api/farm/pickup`) → returns placement to stash.  
- **Collect / process** only affect **placed** units (each placement has its own timer).  
- **Factories (cheese press, etc.)**: click when **idle** to **spend inputs from the barn** and **start** the timer; when it shows **Ready**, click again (Harvest tool works) to **collect** output into the barn. Unlike the old instant-craft + cooldown model.  
- Crops and placements are **mutually exclusive** per tile. Decorations will reuse `PlacementKinds.Decoration` later.

### Growth phases (server + client visual buckets)

Pre-ripe buckets (same math on client for **display only**):

1. **Seedling** — progress \< 1/3  
2. **Growing** — 1/3 ≤ progress \< 2/3  
3. **Mature** — 2/3 ≤ progress \< 1  
4. **Ripe** — elapsed ≥ `GrowthDurationSeconds`

Empty tile: `CropTypeId` null → phase **Empty**.

---

## 6) HTTP API

> **Auth**: send header **`Authorization: Bearer {jwt}`** on all farm/shop calls. Obtain JWT from **`/api/auth/register`** or **`/api/auth/login`**.

| Method | Path | Body | Notes |
|--------|------|------|------|
| POST | `/api/auth/register` | `{ "email", "password", "displayName" }` | **Display name required**, unique (case-insensitive). Creates user + **9×9** farm; returns JWT. |
| GET | `/api/auth/me` | — | **Authorize**. Current profile (`displayName`, email, gold, level). |
| POST | `/api/auth/login` | `{ "email", "password" }` | Returns JWT + profile snippet. |
| GET | `/api/farm` | — | **Authorize**. Full snapshot + crop catalog. |
| POST | `/api/shop/buy-seeds` | `{ "cropTypeId", "quantity" }` | **Deprecated** — use plant; gold is charged per successful tile. |
| POST | `/api/shop/buy-animal` | `{ "animalTypeId", "quantity" }` | **Authorize**. Buy to **stash** (respects `maxOwned`). |
| POST | `/api/shop/buy-factory` | `{ "factoryTypeId", "quantity" }` | **Authorize**. Buy to **stash** (respects `maxOwned`). |
| POST | `/api/farm/place` | `{ "kind", "typeId", "x", "y" }` | **Authorize**. `kind`: `animal` \| `factory`. Empty soil only. |
| POST | `/api/farm/pickup` | `{ "x", "y" }` | **Authorize**. Store placement back to stash. |
| POST | `/api/farm/plant` | `{ "x", "y", "cropTypeId" }` | **Authorize**. Consumes 1 seed; sets `PlantedAtUtc`. |
| POST | `/api/farm/plant-batch` | `{ "cropTypeId", "tiles": [{x,y},…] }` | **Authorize**. Mass plant while dragging on client. |
| POST | `/api/farm/harvest` | `{ "x", "y" }` | **Authorize**. Only if ripe; credits gold/XP; clears tile. |
| POST | `/api/farm/harvest-batch` | `{ "tiles": [{x,y},…] }` | **Authorize**. Mass harvest ripe tiles. |
| POST | `/api/barn/upgrade` | — | **Authorize**. Upgrade barn storage (barn must be placed). Returns `{ storageCapacity }`. |
| POST | `/api/barn/collect-animals` | — | **Authorize**. Collect from **all ready** placed animals. |
| POST | `/api/barn/collect-animal` | `{ "animalTypeId", "x", "y" }` | **Authorize**. Collect one placement (footprint-safe). |
| POST | `/api/barn/feed-animal` | `{ "animalTypeId", "x", "y" }` | **Authorize**. Feed placed animal from barn; starts production timer. |
| POST | `/api/barn/process-factory` | `{ "factoryTypeId", "x", "y", "batchRuns" }` | **Authorize**. **Idle** → start 1–10× (consumes inputs×runs, one timer; collect `output×runs`). **Done** → collect into barn (checks capacity). |
| POST | `/api/barn/collect-factories` | — | **Authorize**. Collect all finished factory outputs; **total slots** checked before any add. |
| POST | `/api/barn/sell-resource` | `{ "resourceCode", "quantity" }` | **Authorize**. Sell stored goods (e.g. cheese) for gold. |

JSON uses **camelCase** (`ConfigureHttpJsonOptions`).

### SQL Server connection (current default)

- **`Server=.`** — default instance on the same machine.  
- **`Database=HappierFarmX7`**.  
- **`Trusted_Connection=True`** — Windows integrated auth (adjust for SQL login on the VPS if needed).

Override via **`ConnectionStrings:DefaultConnection`** (environment variable, user secrets, or `appsettings.*.json`).

### JWT configuration

- Section **`Jwt`** in `appsettings`: `Issuer`, `Audience`, **`SigningKey`** (must be ≥ **32 UTF-8 bytes** — use a long random secret in production), `AccessTokenMinutes`.  
- **Never** commit production secrets; use environment variables or a secret store on the VPS.

---

## 7) SignalR

- Hub path: **`/hubs/game`** (`FarmHub`). Hub is **`[Authorize]`** — connect with the same JWT (SignalR passes it as **`access_token`** query string during the negotiate/WebSocket upgrade; `JwtBearer` reads it in `OnMessageReceived`).
- Client calls:
  - `JoinFarm(farmOwnerIdString)` — subscribe to `farm:{guid}` group. **v1 rule:** caller id must match `farmOwnerId` (own farm only).
  - `LeaveFarm(farmOwnerIdString)` — optional unsubscribe.
- Server → client event (explicit name): **`farmStateChanged`**  
  Payload: `{ farmOwnerId, serverTimeUtc }` (camelCase via hub JSON protocol).  
  Client should **`GET /api/farm`** after receiving it.

**Future**: chat messages, visitor presence, typing indicators—same hub or split hubs if needed.

---

## 8) Local development

### Prerequisites

- .NET 8 SDK  
- Node 20+ (or current LTS)  
- SQL Server reachable at **`Server=.`** with database **`HappierFarmX7`** (see `ConnectionStrings` in `appsettings`). Use **LocalDB** or another host by changing the connection string only.

### Terminal A — API

```powershell
cd "...\server\HappierFarm.WebAPI"
dotnet run
```

- Listens **http://localhost:5216** (see `launchSettings.json`).
- **Development** auto-runs `Database.Migrate()` on startup.

### Terminal B — Client

```powershell
cd "...\client"
npm install   # first time
npm run dev
```

- Open the printed **http://localhost:5173** URL.  
- Vite proxies `/api` and `/hubs` to the API.

### First-time flow in the UI

1. **Log in** or **Register** on separate pages (different backgrounds). Register requires a **unique display name** (2–128 chars).  
2. After auth → stores JWT + display name in `localStorage`, connects SignalR. Header shows **display name** + email from server.  
2. **Buy 1 seed pack** (selected crop).  
3. Click an **empty** brown tile → plants.  
4. Wait growth duration (or use short crops for testing).  
5. Click **ripe** (gold) tile → harvest.

---

## 9) Configuration (appsettings)

**How to run Development vs Production:** see **[docs/environments.md](environments.md)**.

| Section | Purpose |
|---------|---------|
| `ConnectionStrings:DefaultConnection` | SQL Server |
| `Jwt` | Issuer, audience, signing key (≥ 32 bytes), token lifetime |
| `Cors:AllowedOrigins` | Browser origins allowed to call API with credentials |
| `Database:ApplyMigrationsOnStartup` | `true` in Development; `false` in Production — run migrations explicitly on VPS |
| `GameTiming` | Bootstrap/fallback pacing when seeding empty DB |
| `ClientPresentation` | `ShowBetaBadge`, `BetaBadgeLabelEn`, `BetaBadgeLabelAr` — sent on every `GET /api/farm` as `clientPresentation` |

Files: `appsettings.json` (base), `appsettings.Development.json`, `appsettings.Production.json`, optional gitignored `appsettings.Production.local.json`.

## 10) Deployment (VPS + SQL Server)

- Publish **WebAPI** + apply EF migrations on production SQL Server.  
- Serve **Vite `dist/`** behind IIS/nginx with `/api` and `/hubs` proxied to Kestrel, **or** same-origin static + API.  
- Set **`ConnectionStrings`**, **`Jwt:SigningKey`**, **`Cors:AllowedOrigins`**, and **`ClientPresentation`** via environment or secrets.  
- **HTTPS** + WebSocket proxy for SignalR required in production.

---

## 11) Roadmap (high level)

**Release status:** **v1 + v1.5 + v1.x polish shipped** (playtest-ready). **v2** = admin UI, social, multi-recipe factories.

**v1 + v1.5 (shipped)**  
- Core loop + **email/password accounts** + seed bag + SignalR refresh + light polling.  
- Animals, factories, batch plant/harvest, PNG farm art, placement caps.  
- Footprints, per-player **farm expansion**, decorations, pan/move on large farms.

**v1 polish (shipped)**  
- Server barn cap + snapshot `storageCapacity` / `storageUsed`.  
- Level unlocks (`MinLevelRequired`) enforced server + client.  
- Unified inventory UI; harvest → barn; sell from inventory.

**v1.x (shipped — current train)**  
- **SQL economy:** `GameSettings`, `ResourceDefinitions`, `CatalogTimingOverrides`, `BarnUpgradeTierDefinitions`.  
- **Animal feeding** from barn before production.  
- **Production-paced timers** (30 min – 4 h crops; 20–60 min animals/factories).  
- **EN/AR** catalog display names; localized factory recipes.  
- **MP3 BGM** (menu vs farm), mute fix, single global ♪ control.  
- **Beta badge** via `ClientPresentation` in appsettings.

**v1.x UI polish (current)**  
- **Mobile layout**: side rail (Tools / Market / Barn / Settings) + 3-column shrink grid (rail | drawer | farm) on phones; farm always visible when menu is open.  
- **Auth split layout**: landscape = branding hero (left/start) + form panel (right/end) via CSS grid; portrait = stacked.  
- **i18n**: `formValidation.ts` for browser-native validation messages; `catalogFallbacks.ts` client-side Arabic name fallbacks while API rows are empty; `formatGameTimer` compact timers on mobile; gold prices use `shop.goldPrice` / `shop.goldPerTile` so Arabic shows "ذهب" not "g".  
- **Barn stats** split into primary line (`storage X/Y slots`) + detail line (level / base cap / barn bonus / farm size).  
- **Shop cards** compact footer (price left, buy button right); no horizontal overflow in mobile drawer.  
- **Beta badge** moved to fixed bottom-end corner.  
- **Sprite copy script** now filters out Cursor screenshot PNGs (`c__Users_*`) and deletes any that were already copied.  
- **Arabic catalog seed** migration `20260527081901_SeedArabicCatalogDisplayNames` fills `DisplayNameEn` / `DisplayNameAr` on all catalog tables.  
- **Runtime config**: `client/public/config.production.example.json` → copy to `config.json` on server; `runtimeConfig.ts` loads `apiBaseUrl` at startup (no rebuild to change API host).
- **Square favicons + social previews**: `generate-brand-images.mjs`; OG/Twitter meta in `index.html` for Telegram, WhatsApp, Facebook, X link cards.

**v1.5 features (shipped)**  
- **Multi-tile footprints**: Holstein **2×1**, Cheese Press **2×2**; anchor at top-left; occupancy on all cells; sprite only on anchor tile in snapshot (`placementIsAnchor`).  
- **Per-player farm size**: `ApplicationUser.FarmGridSize` (9 default, **uncapped** with formula pricing); `FarmExpansionCatalog`: `price = round(450 × 2.08^step + 25 × step²)` per +1 side length; client **pan** (drag empty grass / middle-mouse) on large farms.  
- **Decorations**: `DecorationDefinitions` + `PlayerDecorations`; place/pickup like buildings, no timers; shop **Decor** tab (sunflower, fence 2×1, hay bale).  
- Client: dynamic `gridSize`, footprint place validation (`farmFootprint.ts`), deduped pickup by anchor.

**v2 (next)**  
- **Multi-recipe factories** (`FactoryRecipe` + picker UI).  
- **Barn upgrade building** on farm (+efficiency upgrades).  
- Friends / visits / gifting; richer progression curves.

**v2+ (explicitly later)**  
- Friends list + visit read-only farm + daily gifting.  
- Steal caps, weeds/pests sabotage loops, anti-abuse telemetry, ads/cosmetics, richer progression curves.

---

## 12) Performance notes

- A 9×9 grid is tiny: one indexed query is enough for a long time.  
- Phaser bundle is large; later we can **lazy-load** Phaser or split chunks—acceptable for MVP.

---

## 13) Decision log

| Date | Decision |
|------|-----------|
| 2026-05-20 | **.NET 8** over 9 for LTS/support comfort. |
| 2026-05-20 | **SQL Server** on existing VPS instead of PostgreSQL. |
| 2026-05-20 | **Steal/weeds/pest** deferred to v2+. |
| 2026-05-20 | **Client display timers** + **SignalR `farmStateChanged`** + **slow polling** as the live refresh strategy. |
| 2026-05-20 | **Modular monolith**: Domain + Infrastructure + WebAPI (no microservices). |
| 2026-05-20 | **Phaser 3** on canvas; DOM for HUD/forms (`client/src/main.ts` + `FarmScene.ts`). |
| 2026-05-20 | **SQL Server** default: `Server=.` + database **`HappierFarmX7`**. |
| 2026-05-20 | **Identity + JWT** for register/login; removed temporary `X-Player-Id` header auth. |
| 2026-05-20 | **Solution + projects** live under **`server/`** (not `HappierFarm/` at repo root). |
| 2026-05-20 | **Animals + factories** shop/barn loop; **batch plant/harvest**; client **no tile flicker** on poll; **Web Audio** SFX; Phaser **HiDPI** + antialias. |
| 2026-05-20 | **v1.5**: footprints on placements + catalog; **FarmGridSize** + expansion shop; **decorations** catalog/shop/place; migration `20260520200000_FootprintsExpansionDecorations`. |
| 2026-05-20 | **v2 UX (client)**: storage panel sell rows; click factory on farm; build stash-only sidebar; canvas **RESIZE** + viewport-centered origin for small grids; starter **50** storage slots (display only). |
| 2026-05-20 | **V1 polish**: `FarmProgression` barn cap; `MinLevelRequired` on catalogs; `POST /barn/collect-animal`; migration `V1PolishStorageLevelUnlocks`. |
| 2026-05-20 | **Harvest → barn**: `CropDefinition.HarvestResourceCode`; unified inventory panel + filters; migration `HarvestToBarn`. |
| 2026-05-20 | **Barn building + UI**: Hearty Barn (`FactoryDefinitions` id 2); `POST /api/barn/upgrade`; sidebar inventory + horizontal shop scroll; migration `BarnUpgrades`. |
| 2026-05-21 | **SQL game config** + `GameConfigService`; animal **feed** API; harvest → `ResourceDefinitions`. |
| 2026-05-21 | **Production economy** migration; dev appsettings = production pacing (`GlobalTimePercent` 100). |
| 2026-05-21 | **ClientPresentation** beta badge; full EN/AR catalog names in modals; level gates wired on plant/buy/place. |
| 2026-05-26 | **Migration baseline:** squashed to single `20260526122202_InitialSchema`; all envs reset DB once; future changes only via `dotnet ef migrations add` — see `docs/migrations.md`. |
| 2026-05-27 | **Mobile-first UI overhaul** — side rail navigation, 3-column farm-visible layout, split auth landscape layout, full i18n (validation, catalog names, gold labels), compact shop cards, beta badge to bottom corner. |
| 2026-05-27 | **Arabic catalog migration** `20260527081901_SeedArabicCatalogDisplayNames` — fills `DisplayNameEn`/`DisplayNameAr` on crops, animals, factories, decorations, resources. |
| 2026-05-27 | **Runtime API config** — `client/public/config.json` + `runtimeConfig.ts`; no rebuild needed to change `apiBaseUrl` on deploy. |
| 2026-05-27 | **Sprite copy script** hardened to reject Cursor screenshot PNGs (`c__Users_*`) and auto-delete any stray copies in `public/assets/farm/`. |
| 2026-05-27 | **BGM restore + auth backgrounds** — audio back under `public/assets/audio/`; CSS points to `/assets/farm/bg-*.png`; `config.production.example.json` for VPS. |
| 2026-05-27 | **Favicons + OG metadata** — `generate-brand-images.mjs` (square favicons + `og-share.png`); Open Graph / Twitter tags in `index.html` for link previews. |

## 14) Maintenance

When we change mechanics, APIs, or schema:

1. Update **this file** in the same PR.  
2. Add a row to **§13 Decision log**.  
3. Update **§5 Economy** tables when changing prices or timers.  
4. **Database:** follow **`docs/migrations.md`** — always `dotnet ef migrations add <Name>` from `server/`; never hand-reorder migration timestamps; apply with `dotnet ef database update` (Production) or dev auto-migrate on startup.

---

*End of context — keep it current.*