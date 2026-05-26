# Development vs Production configuration

ASP.NET Core loads settings in this order (later wins):

1. `appsettings.json` — shared defaults (local SQL, dev JWT placeholder, game timing)
2. `appsettings.{Environment}.json` — **Development** or **Production** overrides
3. Environment variables
4. `appsettings.{Environment}.local.json` (optional, **gitignored**)

Set the environment with:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"   # or Production
```

---

## File map

| File | Committed | Purpose |
|------|-----------|---------|
| `appsettings.json` | Yes | Base: local SQL (`Server=.`), dev CORS, dev JWT key, `ApplyMigrationsOnStartup: true` |
| `appsettings.Development.json` | Yes | Local dev: Swagger-friendly logging, localhost CORS, auto-migrate |
| `appsettings.Production.json` | Yes | Production **template** — placeholders; override secrets on the server |
| `appsettings.Production.example.json` | Yes | Annotated example for your VPS (copy ideas, not secrets) |
| `appsettings.Production.local.json` | **No** (gitignored) | Optional real production secrets on your machine for testing |

---

## Development (daily work on your PC)

### What it does

| Setting | Value |
|---------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Development` (default in `launchSettings.json`) |
| SQL | `Server=.` + Windows auth (`Trusted_Connection=True`) |
| Migrations | **Auto** on API startup (`Database:ApplyMigrationsOnStartup: true`) |
| Swagger | **On** at `/swagger` |
| CORS | `http://localhost:5173`, `http://127.0.0.1:5173` |
| HTTPS redirect | Off |
| JWT key | Dev key from `appsettings.json` (not for public internet) |

### Run API

```powershell
cd server\HappierFarm.WebAPI
dotnet run
# or explicitly:
dotnet run --launch-profile http
```

Listens on **http://localhost:5216**.

### Run client

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` and `/hubs` to the API.

### Optional: test Production config locally

1. Copy secrets into `appsettings.Production.local.json` (see example file), **or** set environment variables below.
2. Run:

```powershell
dotnet run --launch-profile Production
```

Swagger is **off**. You must use the built client or call the API with a valid JWT. Use this to verify production settings before deploying.

---

## Production (VPS / public host)

### What it does

| Setting | Value |
|---------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| SQL | **Your** SQL Server connection string (SQL login recommended) |
| Migrations | **Not** auto-applied on startup (`ApplyMigrationsOnStartup: false`) |
| Swagger | **Off** |
| CORS | **Your** public HTTPS origin only (e.g. `https://farm.example.com`) |
| HTTPS redirect | **On** (behind reverse proxy with HTTPS) |
| JWT key | **Must** be a long random secret (≥ 32 bytes), never the dev key |
| Logging | Warning level (less noise) |
| `AllowedHosts` | Your public hostname |

### 1. Publish the API

```powershell
cd server\HappierFarm.WebAPI
dotnet publish -c Release -o .\publish
```

Copy the `publish` folder to the VPS.

### 2. Apply database migrations (once per release)

Schema is managed with EF Core — see **[migrations.md](migrations.md)** for add/update commands and rules (always use `dotnet ef migrations add`, never hand-ordered files).

**First deploy after baseline squash:** drop empty `HappierFarmX7` on the VPS if a failed publish left a database without tables, then:

```powershell
cd server
dotnet ef database update `
  --project HappierFarm.Infrastructure `
  --startup-project HappierFarm.WebAPI `
  --connection "Server=...;Database=HappierFarmX7;User Id=...;Password=...;Encrypt=True;TrustServerCertificate=False"
```

Do **not** rely on `ApplyMigrationsOnStartup` in production unless you intentionally want the app to migrate on boot.

### 3. Set production secrets (choose one)

#### A) Environment variables (recommended on VPS)

Windows (PowerShell, service, or IIS):

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:ConnectionStrings__DefaultConnection = "Server=SQLHOST;Database=HappierFarmX7;User Id=app;Password=SECRET;Encrypt=True;TrustServerCertificate=False"
$env:Jwt__SigningKey = "your-long-random-secret-at-least-32-characters"
$env:Cors__AllowedOrigins__0 = "https://farm.your-domain.com"
$env:AllowedHosts = "farm.your-domain.com"
```

Linux (systemd `Environment=` lines use the same `__` nesting).

Generate a JWT secret (example):

```powershell
# PowerShell — 48 random bytes as Base64
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### B) `appsettings.Production.local.json` on the server only

Copy `appsettings.Production.example.json` → `appsettings.Production.local.json`, fill real values, place next to the published DLL. File is gitignored; do not commit it.

#### C) User Secrets (only for local Production testing on your PC)

```powershell
cd server\HappierFarm.WebAPI
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...."
dotnet user-secrets set "Jwt:SigningKey" "your-production-secret-32-chars-minimum"
```

User secrets apply in Development by default; for Production profile, set `ASPNETCORE_ENVIRONMENT=Production` and ensure secrets are loaded (optional `UserSecretsId` in csproj — add only if you use this workflow).

### 4. Run the API on the VPS

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Production"
dotnet HappierFarm.WebAPI.dll
```

Or host behind **IIS** / **nginx** with WebSocket support for `/hubs/game`.

### 5. Serve the client

```powershell
cd client
npm run build
```

Deploy `client/dist/` to the same site (static files) or a CDN. Reverse-proxy:

| Path | Target |
|------|--------|
| `/` | Static files from `dist/` |
| `/api` | Kestrel API |
| `/hubs` | Kestrel SignalR (WebSockets) |

**CORS:** the browser origin must match `Cors:AllowedOrigins` exactly (scheme + host + port). If the game is at `https://farm.example.com`, that full origin must be listed.

### 6. Client in production

Usually the SPA is served from the **same host** as the API, so the client keeps relative URLs (`/api/...`, `/hubs/...`) and you do **not** need `VITE_API_ORIGIN` in production.

If the API is on a different subdomain, build with env vars (example):

```powershell
# Only if API is on another origin — otherwise skip
$env:VITE_API_ORIGIN = "https://api.your-domain.com"
npm run build
```

---

## Quick comparison

| | Development | Production |
|---|-------------|------------|
| **Command** | `dotnet run` | `ASPNETCORE_ENVIRONMENT=Production` + published DLL |
| **Client** | `npm run dev` (port 5173) | `npm run build` → static `dist/` |
| **Database** | Local `HappierFarmX7` on `.` | VPS SQL Server |
| **Migrations** | Auto on startup | Manual `dotnet ef database update` |
| **Swagger** | Yes | No |
| **Secrets in git** | Dev JWT only (local) | **Never** — use env or local json on server |

---

## Checklist before going live

- [ ] `Jwt:SigningKey` is a new random secret (not the dev key from `appsettings.json`)
- [ ] `ConnectionStrings:DefaultConnection` points to production SQL with SQL auth (or secured Windows auth)
- [ ] `Cors:AllowedOrigins` matches your real HTTPS game URL
- [ ] `AllowedHosts` matches your hostname
- [ ] Migrations applied successfully
- [ ] HTTPS + WebSockets enabled on reverse proxy
- [ ] `ClientPresentation:ShowBetaBadge` set to `false` when you leave beta (optional)
- [ ] `client/dist` deployed and `/api` + `/hubs` proxied correctly

---

## Visual Studio publish + database

**Recommended:** leave **“Update database”** unchecked on the publish profile. Apply schema with [migrations.md](migrations.md) (`dotnet ef database update`) once per release.

If publish runs EF scripts and fails on a fresh VPS database, **drop** `HappierFarmX7` in SSMS and run `dotnet ef database update` with the production connection string, then publish the app only.

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Publish: missing table / script failed | Drop empty or partial DB; use `dotnet ef database update` — see [migrations.md](migrations.md) |
| CORS error in browser | Add exact browser URL to `Cors:AllowedOrigins` |
| 401 / invalid token after deploy | JWT signing key changed — users must log in again |
| API starts then DB errors | Check `ConnectionStrings__DefaultConnection` on the server |
| MARS savepoint warnings | Removed from default connection string; restart API |
| Swagger missing | Expected in Production |

More architecture and economy: [context.md](context.md).
