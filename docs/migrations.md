# Database migrations (EF Core)

All schema changes go through **EF Core migrations** in `server/HappierFarm.Infrastructure/Migrations/`.

**Baseline (2026-05-26):** history was squashed to a single migration, `20260526122202_InitialSchema`. Every environment must **drop and recreate** (or use a new empty database) once when moving to this baseline — there is no upgrade path from the old multi-migration chain.

**Catalog Arabic names (2026-05-27):** `20260527081901_SeedArabicCatalogDisplayNames` updates `DisplayNameEn` / `DisplayNameAr` on all seeded crops, animals, factories, decorations, and resources. Safe to apply on existing local and VPS databases (data-only `UpdateData`).

---

## Rules (avoid publish / ordering bugs)

1. **Always** create migrations with the EF CLI — never copy-paste old migration files or hand-pick timestamps.
2. Run commands from the **`server/`** folder (see below).
3. After changing `AppDbContext` or entity configuration, add a migration **before** committing.
4. Review the generated `Up()` / `Down()` in the new file; fix data moves with `migrationBuilder.Sql(...)` if needed.
5. **Production:** apply with `dotnet ef database update` (or a tested script). Prefer **not** “Update database” in Visual Studio publish — see [environments.md](environments.md).
6. **Do not** rename an applied migration’s timestamp/id. If you need a squash again, plan a new baseline and coordinated DB reset.

---

## Add a migration (schema change)

```powershell
cd server
dotnet ef migrations add YourDescriptiveName `
  --project HappierFarm.Infrastructure `
  --startup-project HappierFarm.WebAPI
```

Examples: `AddFriendVisits`, `ExpandCropCatalog`.

Commit the new `.cs`, `.Designer.cs`, and updated `AppDbContextModelSnapshot.cs`.

---

## Apply migrations

### Local Development

With `Database:ApplyMigrationsOnStartup: true` (default in `appsettings.json`), the API applies pending migrations on startup.

Or manually:

```powershell
cd server
dotnet ef database update `
  --project HappierFarm.Infrastructure `
  --startup-project HappierFarm.WebAPI
```

Uses the connection string from `AppDbContextFactory` (`Server=.;Database=HappierFarmX7;...`) or override with `--connection "..."`.

### Production (VPS)

```powershell
cd server
dotnet ef database update `
  --project HappierFarm.Infrastructure `
  --startup-project HappierFarm.WebAPI `
  --connection "Server=...;Database=HappierFarmX7;User Id=...;Password=...;Encrypt=True;TrustServerCertificate=False"
```

`ApplyMigrationsOnStartup` is **false** in Production — run this once per release that includes a new migration.

---

## Fresh database (baseline or full reset)

**Local (PowerShell + sqlcmd):**

```powershell
sqlcmd -S . -Q "IF DB_ID('HappierFarmX7') IS NOT NULL BEGIN ALTER DATABASE HappierFarmX7 SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE HappierFarmX7; END"
cd server
dotnet ef database update --project HappierFarm.Infrastructure --startup-project HappierFarm.WebAPI
```

**VPS (SSMS):** delete database `HappierFarmX7` (or create a new empty one), then run `dotnet ef database update` with the production connection string.

All player data is lost on drop — expected for a reset.

---

## Verify

```powershell
cd server
dotnet ef migrations list --project HappierFarm.Infrastructure --startup-project HappierFarm.WebAPI
```

All migrations should show without `(Pending)`.

In SSMS: `SELECT * FROM __EFMigrationsHistory` should list one row: `20260526122202_InitialSchema` until you add more.

---

## Design-time factory

`AppDbContextFactory.cs` supplies the default local SQL connection for `dotnet ef` when the web host is not running. Override with `--connection` for VPS.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot find object "X"` during publish | Drop empty/partial DB; use `dotnet ef database update` instead of VS publish DB step |
| `There is already an object named ...` | DB has tables but wrong history — drop DB or baseline `__EFMigrationsHistory` only if schema truly matches snapshot |
| `(Pending)` on local after pull | `dotnet ef database update` |
| Migration order / manual files | Remove hand-edited migrations; use `dotnet ef migrations add` only |

More deploy context: [environments.md](environments.md). Architecture: [context.md](context.md).
