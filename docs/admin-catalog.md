# Admin catalog & game config (v2+ roadmap)

The live game stores **all economy, pacing, and shop content in SQL**. The client reads everything from `GET /api/farm` (catalogs, `resourceCatalog`, `gameConfig`, `gameTiming`). Build the admin panel as CRUD over these tables — no redeploy for balance or copy changes.

## Tables (admin-editable)

| Table | Purpose |
|-------|---------|
| `GameSettings` | Singleton row `Id=1`: grid limits, expansion formula, storage formula, starter gold/dinars, global time %, active event |
| `BarnUpgradeTierDefinitions` | Per-tier barn upgrade: `BonusSlots`, `GoldCost` |
| `CatalogTimingOverrides` | Optional base seconds per `CatalogKind` + `CatalogId` (crop/animal/factory) before global % |
| `ResourceDefinitions` | Sell price + EN/AR display names per barn resource code |
| `CropDefinitions` | Plant economy, harvest code, growth base seconds, EN/AR names |
| `AnimalDefinitions` | Feed/product codes, timers, footprints, EN/AR names |
| `FactoryDefinitions` | Recipes, process time, `IsBarn`, EN/AR names |
| `DecorationDefinitions` | Decor buy/place rules, EN/AR names |
| `PlayerResources` | Per-player barn stacks (not catalog) |

## Snapshot API fields

| JSON field | Source |
|------------|--------|
| `cropCatalog` / `animalCatalog` / … | Catalog tables (sell values joined from `ResourceDefinitions`) |
| `resourceCatalog` | `ResourceDefinitions` |
| `gameConfig` | `GameSettings` + barn tiers (caps, barn factory id, storage formula inputs) |
| `gameTiming` | `GameSettings` global % + active event |
| `expansionOffer` / `nextBarnUpgrade` | Computed from `GameSettings` + `BarnUpgradeTierDefinitions` |

## `GameSettings` columns (singleton)

- **Grid:** `DefaultGridSize`, `MinGridSize`, `AbsoluteMaxGridSize`
- **Expansion price:** `ExpansionBasePrice`, `ExpansionGrowthRate`, `ExpansionAreaTaxPerStepSq`
- **Storage:** `BaseStorageCapacity`, `StoragePerLevel`, `MaxBankedAnimalCycles`, `BarnFactoryTypeId`
- **Registration:** `StarterGold`, `StarterDinars`
- **Pacing:** `GlobalTimePercent`, `ActiveEventName`, `ActiveEventMessage`, `ActiveEventTimePercent` (0 = no event)

## Recommended v2 admin API

1. `GET/PATCH /api/admin/game-settings` — singleton
2. `CRUD /api/admin/barn-upgrade-tiers`
3. `CRUD /api/admin/catalog-timing-overrides`
4. `CRUD /api/admin/resources` — `ResourceDefinitions`
5. `CRUD /api/admin/catalog/{crops|animals|factories|decorations}`
6. Audit log + `IsEnabled` flags on catalog rows

## Appsettings role

`appsettings.json` → `GameTiming` is only a **bootstrap fallback** when `GameSettings` / timing override rows are missing (first run). After migration, edit SQL or the admin API.

## Sprites

See previous sprite convention (`farm-crop-{id}`, `farm-animal-{id}`, etc.) in `client/public/assets/farm/`.

## Adding content today (developer)

1. Add rows via EF migration `InsertData` or `AppDbContext` seed.
2. Add sprites / `catalogVisuals.ts` emojis for shop UI.
3. `dotnet ef database update` (or API auto-migrate on startup).
4. Document new ids in `docs/context.md`.
