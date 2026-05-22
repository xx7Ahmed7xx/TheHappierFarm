using HappierFarm.Domain;
using HappierFarm.Domain.Entities;
using HappierFarm.Infrastructure.Data;
using HappierFarm.Infrastructure.Identity;
using HappierFarm.WebAPI.Hubs;
using HappierFarm.WebAPI.Options;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HappierFarm.WebAPI.Services;

public sealed class FarmService(
    AppDbContext db,
    IHubContext<FarmHub> farmHub,
    GameConfigService config,
    IOptionsMonitor<ClientPresentationOptions> clientPresentation,
    ILogger<FarmService> logger)
{
    private Task PrepareConfigAsync(CancellationToken ct) => config.EnsureLoadedAsync(ct);

    public async Task<ApplicationUser?> GetUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);

    public async Task EnsureFarmTilesAsync(Guid playerId, CancellationToken ct = default)
    {
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        var existing = await db.FarmTiles.CountAsync(t => t.PlayerId == playerId, ct);
        var expected = gridSize * gridSize;
        if (existing >= expected)
        {
            return;
        }

        for (var x = 0; x < gridSize; x++)
        {
            for (var y = 0; y < gridSize; y++)
            {
                var has = await db.FarmTiles.AnyAsync(
                    t => t.PlayerId == playerId && t.CoordinateX == x && t.CoordinateY == y,
                    ct);
                if (has)
                {
                    continue;
                }

                db.FarmTiles.Add(new FarmTile
                {
                    Id = Guid.NewGuid(),
                    PlayerId = playerId,
                    CoordinateX = x,
                    CoordinateY = y,
                    CropTypeId = null,
                    PlantedAtUtc = null
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<CropCatalogDto>> GetCropCatalogAsync(CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var (_, sellByCode) = await LoadResourceEconomyAsync(ct);
        return await BuildCropCatalogAsync(sellByCode, ct);
    }

    private async Task<(IReadOnlyList<ResourceCatalogDto> Catalog, Dictionary<string, int> SellByCode)> LoadResourceEconomyAsync(
        CancellationToken ct)
    {
        var rows = await db.ResourceDefinitions.AsNoTracking()
            .Where(r => r.IsEnabled)
            .OrderBy(r => r.SortOrder)
            .ThenBy(r => r.Code)
            .ToListAsync(ct);

        var catalog = rows
            .Select(r => new ResourceCatalogDto(
                r.Code,
                r.SellValue,
                r.Category,
                r.DisplayNameEn,
                r.DisplayNameAr))
            .ToList();

        var sellByCode = rows.ToDictionary(
            r => r.Code.Trim().ToLowerInvariant(),
            r => r.SellValue,
            StringComparer.OrdinalIgnoreCase);

        return (catalog, sellByCode);
    }

    private static int ResolveSellValue(string code, IReadOnlyDictionary<string, int> sellByCode, int fallback = 0)
    {
        var key = code.Trim().ToLowerInvariant();
        return sellByCode.TryGetValue(key, out var value) ? value : fallback;
    }

    private async Task<List<CropCatalogDto>> BuildCropCatalogAsync(
        IReadOnlyDictionary<string, int> sellByCode,
        CancellationToken ct)
    {
        var rows = await db.CropDefinitions.AsNoTracking().OrderBy(c => c.Id).ToListAsync(ct);
        return rows
            .Select(c => new CropCatalogDto(
                c.Id,
                c.Name,
                c.DisplayNameEn,
                c.DisplayNameAr,
                c.BuyPrice,
                ResolveSellValue(c.HarvestResourceCode, sellByCode, c.SellValue),
                config.GetCropGrowthSeconds(c.Id, c.GrowthDurationSeconds),
                c.XpReward,
                c.MinLevelRequired,
                c.HarvestResourceCode,
                c.BaseYield))
            .ToList();
    }

    public async Task<FarmSnapshotDto> GetFarmSnapshotAsync(Guid playerId, CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        await EnsureFarmTilesAsync(playerId, ct);

        var now = DateTimeOffset.UtcNow;

        var player = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        var tiles = await db.FarmTiles.AsNoTracking()
            .Where(t => t.PlayerId == playerId)
            .Include(t => t.CropType)
            .OrderBy(t => t.CoordinateY).ThenBy(t => t.CoordinateX)
            .ToListAsync(ct);

        var placements = await db.FarmPlacements.AsNoTracking()
            .Where(p => p.PlayerId == playerId)
            .ToListAsync(ct);

        var decorationNames = await db.DecorationDefinitions.AsNoTracking()
            .ToDictionaryAsync(d => d.Id, d => d.Name, ct);

        var animalNames = await db.AnimalDefinitions.AsNoTracking()
            .ToDictionaryAsync(a => a.Id, a => a.Name, ct);

        var factoryNames = await db.FactoryDefinitions.AsNoTracking()
            .ToDictionaryAsync(f => f.Id, f => f.Name, ct);

        var animalIntervals = await db.AnimalDefinitions.AsNoTracking()
            .ToDictionaryAsync(
                a => a.Id,
                a => config.GetAnimalIntervalSeconds(a.Id, a.ProductionIntervalSeconds),
                ct);

        var factoryIntervals = await db.FactoryDefinitions.AsNoTracking()
            .ToDictionaryAsync(
                f => f.Id,
                f => config.GetFactoryProcessSeconds(f.Id, f.ProcessSeconds),
                ct);

        var tileDtos = tiles.Select(t =>
            ToTileDto(
                t,
                FootprintHelper.FindCovering(placements, t.CoordinateX, t.CoordinateY),
                animalNames,
                factoryNames,
                decorationNames,
                animalIntervals,
                factoryIntervals,
                now)).ToList();

        // Seeds are not stored — gold is charged per successful plant.
        IReadOnlyList<SeedStockDto> stocks = Array.Empty<SeedStockDto>();

        var (resourceCatalog, sellByCode) = await LoadResourceEconomyAsync(ct);
        var catalog = await BuildCropCatalogAsync(sellByCode, ct);

        var animalCatalogRows = await db.AnimalDefinitions.AsNoTracking().OrderBy(a => a.Id).ToListAsync(ct);
        var animalCatalog = animalCatalogRows
            .Select(a => new AnimalCatalogDto(
                a.Id,
                a.Name,
                a.DisplayNameEn,
                a.DisplayNameAr,
                a.BuyPrice,
                config.GetAnimalIntervalSeconds(a.Id, a.ProductionIntervalSeconds),
                a.FeedResourceCode,
                a.FeedQuantity,
                a.ProductCode,
                a.ProductQuantity,
                ResolveSellValue(a.ProductCode, sellByCode),
                a.MaxOwned,
                a.MaxPlaced,
                a.FootprintWidth,
                a.FootprintHeight,
                a.MinLevelRequired))
            .ToList();

        var factoryCatalogRows = await db.FactoryDefinitions.AsNoTracking().OrderBy(f => f.Id).ToListAsync(ct);
        var factoryCatalog = factoryCatalogRows
            .Select(f => new FactoryCatalogDto(
                f.Id,
                f.Name,
                f.DisplayNameEn,
                f.DisplayNameAr,
                f.BuyPrice,
                f.InputResourceCode,
                f.InputQuantity,
                f.OutputResourceCode,
                f.OutputQuantity,
                config.GetFactoryProcessSeconds(f.Id, f.ProcessSeconds),
                f.IsBarn || f.OutputQuantity <= 0
                    ? 0
                    : ResolveSellValue(f.OutputResourceCode, sellByCode, f.SellValue),
                f.MaxOwned,
                f.MaxPlaced,
                f.FootprintWidth,
                f.FootprintHeight,
                f.MinLevelRequired,
                f.IsBarn))
            .ToList();

        var decorationCatalog = await db.DecorationDefinitions.AsNoTracking()
            .OrderBy(d => d.Id)
            .Select(d => new DecorationCatalogDto(
                d.Id,
                d.Name,
                d.DisplayNameEn,
                d.DisplayNameAr,
                d.BuyPrice,
                d.FootprintWidth,
                d.FootprintHeight,
                d.MaxOwned,
                d.MaxPlaced,
                d.MinLevelRequired))
            .ToListAsync(ct);

        var placedAnimals = placements
            .Where(p => p.Kind == PlacementKinds.Animal)
            .GroupBy(p => p.TypeId)
            .ToDictionary(g => g.Key, g => g.Count());

        var placedFactories = placements
            .Where(p => p.Kind == PlacementKinds.Factory)
            .GroupBy(p => p.TypeId)
            .ToDictionary(g => g.Key, g => g.Count());

        var placedDecorations = placements
            .Where(p => p.Kind == PlacementKinds.Decoration)
            .GroupBy(p => p.TypeId)
            .ToDictionary(g => g.Key, g => g.Count());

        var animalRows = await db.PlayerAnimals.AsNoTracking()
            .Where(a => a.PlayerId == playerId)
            .Include(a => a.AnimalType)
            .ToListAsync(ct);

        var animals = animalRows
            .Select(a => new PlayerAnimalDto(
                a.AnimalTypeId,
                a.AnimalType!.Name,
                a.Quantity,
                placedAnimals.GetValueOrDefault(a.AnimalTypeId),
                config.GetAnimalIntervalSeconds(
                    a.AnimalTypeId,
                    a.AnimalType.ProductionIntervalSeconds)))
            .ToList();

        var factoryRows = await db.PlayerFactories.AsNoTracking()
            .Where(f => f.PlayerId == playerId)
            .Include(f => f.FactoryType)
            .ToListAsync(ct);

        var factories = factoryRows
            .Select(f => new PlayerFactoryDto(
                f.FactoryTypeId,
                f.FactoryType!.Name,
                f.Quantity,
                placedFactories.GetValueOrDefault(f.FactoryTypeId),
                config.GetFactoryProcessSeconds(f.FactoryTypeId, f.FactoryType.ProcessSeconds)))
            .ToList();

        var resources = await db.PlayerResources.AsNoTracking()
            .Where(r => r.PlayerId == playerId)
            .OrderBy(r => r.ResourceCode)
            .Select(r => new ResourceStockDto(r.ResourceCode, r.Quantity))
            .ToListAsync(ct);

        var decorationRows = await db.PlayerDecorations.AsNoTracking()
            .Where(d => d.PlayerId == playerId)
            .Include(d => d.DecorationType)
            .ToListAsync(ct);

        var decorations = decorationRows
            .Select(d => new PlayerDecorationDto(
                d.DecorationTypeId,
                d.DecorationType!.Name,
                d.Quantity,
                placedDecorations.GetValueOrDefault(d.DecorationTypeId)))
            .ToList();

        var expansionOffer = config.GetExpansionOffer(player.FarmGridSize) is { } tier
            ? new FarmExpansionOfferDto(tier.NextSize, tier.Price)
            : null;

        var storageUsed = resources.Sum(r => r.Quantity);
        var storageCapacity = config.GetStorageCapacity(player.Level, player.BarnUpgradeTier);
        var barnPlaced = placements.Any(p =>
            p.Kind == PlacementKinds.Factory && p.TypeId == config.BarnFactoryTypeId);
        var nextBarnOffer = config.GetNextBarnUpgradeOffer(player.BarnUpgradeTier);
        BarnUpgradeOfferDto? nextBarnDto = nextBarnOffer is null
            ? null
            : new BarnUpgradeOfferDto(
                nextBarnOffer.NextTier,
                nextBarnOffer.BonusSlots,
                nextBarnOffer.GoldCost,
                nextBarnOffer.TotalBarnBonus);

        return new FarmSnapshotDto(
            now,
            player.FarmGridSize,
            DisplayNameService.ResolveDisplayName(player),
            player.Email ?? string.Empty,
            player.GoldCoins,
            player.Dinars,
            player.ExperiencePoints,
            player.Level,
            storageCapacity,
            storageUsed,
            player.BarnUpgradeTier,
            barnPlaced,
            nextBarnDto,
            tileDtos,
            stocks,
            catalog,
            animalCatalog,
            factoryCatalog,
            decorationCatalog,
            animals,
            factories,
            decorations,
            resources,
            resourceCatalog,
            expansionOffer,
            config.ToTimingStateDto(),
            config.ToConfigStateDto(),
            ToClientPresentationDto());
    }

    private ClientPresentationDto ToClientPresentationDto()
    {
        var p = clientPresentation.CurrentValue;
        return new ClientPresentationDto(
            p.ShowBetaBadge,
            p.BetaBadgeLabelEn?.Trim() ?? "Beta",
            p.BetaBadgeLabelAr?.Trim() ?? "نسخة تجريبية");
    }

    public Task BuySeedsAsync(Guid playerId, int cropTypeId, int quantity, CancellationToken ct = default) =>
        throw new InvalidOperationException(
            "Seed packs are not used — gold is charged only when you successfully plant on empty soil.");

    public async Task PlantAsync(Guid playerId, int x, int y, int cropTypeId, CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        ValidateTileCoords(x, y, gridSize);

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var tile = await db.FarmTiles.FirstOrDefaultAsync(
                t => t.PlayerId == playerId && t.CoordinateX == x && t.CoordinateY == y,
                ct)
            ?? throw new InvalidOperationException("Tile not found.");

        if (tile.CropTypeId is not null)
        {
            throw new InvalidOperationException("Tile is not empty.");
        }

        if (await HasPlacementOverlapAtCellAsync(playerId, x, y, ct))
        {
            throw new InvalidOperationException("Remove the building or animal on this tile first.");
        }

        var crop = await db.CropDefinitions.FirstOrDefaultAsync(c => c.Id == cropTypeId, ct)
            ?? throw new InvalidOperationException("Unknown crop type.");

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        EnsureMinLevel(player.Level, crop.MinLevelRequired, crop.Name);

        if (player.GoldCoins < crop.BuyPrice)
        {
            throw new InvalidOperationException(
                $"Need {crop.BuyPrice} gold to plant {crop.Name}.");
        }

        player.GoldCoins -= crop.BuyPrice;
        tile.CropTypeId = cropTypeId;
        tile.PlantedAtUtc = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task HarvestAsync(Guid playerId, int x, int y, CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        ValidateTileCoords(x, y, gridSize);

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        var tile = await db.FarmTiles
            .Include(t => t.CropType)
            .FirstOrDefaultAsync(t => t.PlayerId == playerId && t.CoordinateX == x && t.CoordinateY == y, ct)
            ?? throw new InvalidOperationException("Tile not found.");

        if (tile.CropType is null || tile.PlantedAtUtc is null)
        {
            throw new InvalidOperationException("Nothing to harvest.");
        }

        var now = DateTimeOffset.UtcNow;
        var elapsed = (now - tile.PlantedAtUtc.Value).TotalSeconds;
        var growthSeconds = config.GetCropGrowthSeconds(tile.CropType.Id, tile.CropType.GrowthDurationSeconds);
        if (elapsed < growthSeconds)
        {
            throw new InvalidOperationException("Crop is not ripe yet.");
        }

        var yield = Math.Max(1, tile.CropType.BaseYield);
        await AddResourceAsync(
            playerId,
            player.Level,
            tile.CropType.HarvestResourceCode,
            yield,
            ct);
        player.ExperiencePoints += tile.CropType.XpReward;
        player.Level = ComputeLevel(player.ExperiencePoints);

        tile.CropTypeId = null;
        tile.PlantedAtUtc = null;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task<BatchActionResultDto> PlantBatchAsync(
        Guid playerId,
        int cropTypeId,
        IReadOnlyList<(int X, int Y)> tiles,
        CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        if (tiles.Count == 0)
        {
            return new BatchActionResultDto(0, 0);
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var crop = await db.CropDefinitions.FirstOrDefaultAsync(c => c.Id == cropTypeId, ct)
            ?? throw new InvalidOperationException("Unknown crop type.");

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        EnsureMinLevel(player.Level, crop.MinLevelRequired, crop.Name);

        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        var success = 0;
        var skipped = 0;
        var seen = new HashSet<string>();

        foreach (var (x, y) in tiles)
        {
            var key = $"{x},{y}";
            if (!seen.Add(key))
            {
                continue;
            }

            if (x < 0 || y < 0 || x >= gridSize || y >= gridSize)
            {
                skipped++;
                continue;
            }

            if (player.GoldCoins < crop.BuyPrice)
            {
                skipped++;
                continue;
            }

            var tile = await db.FarmTiles.FirstOrDefaultAsync(
                t => t.PlayerId == playerId && t.CoordinateX == x && t.CoordinateY == y,
                ct);

            if (tile is null || tile.CropTypeId is not null)
            {
                skipped++;
                continue;
            }

            if (await HasPlacementOverlapAtCellAsync(playerId, x, y, ct))
            {
                skipped++;
                continue;
            }

            player.GoldCoins -= crop.BuyPrice;
            tile.CropTypeId = cropTypeId;
            tile.PlantedAtUtc = DateTimeOffset.UtcNow;
            success++;
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        if (success > 0)
        {
            await NotifyFarmChangedAsync(playerId, ct);
        }

        return new BatchActionResultDto(success, skipped);
    }

    public async Task<BatchActionResultDto> HarvestBatchAsync(
        Guid playerId,
        IReadOnlyList<(int X, int Y)> tiles,
        CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        if (tiles.Count == 0)
        {
            return new BatchActionResultDto(0, 0);
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        var now = DateTimeOffset.UtcNow;
        var success = 0;
        var skipped = 0;
        var seen = new HashSet<string>();

        foreach (var (x, y) in tiles)
        {
            var key = $"{x},{y}";
            if (!seen.Add(key))
            {
                continue;
            }

            if (x < 0 || y < 0 || x >= gridSize || y >= gridSize)
            {
                skipped++;
                continue;
            }

            var tile = await db.FarmTiles
                .Include(t => t.CropType)
                .FirstOrDefaultAsync(t => t.PlayerId == playerId && t.CoordinateX == x && t.CoordinateY == y, ct);

            if (tile?.CropType is null || tile.PlantedAtUtc is null)
            {
                skipped++;
                continue;
            }

            var elapsed = (now - tile.PlantedAtUtc.Value).TotalSeconds;
            var growthSeconds = config.GetCropGrowthSeconds(tile.CropType.Id, tile.CropType.GrowthDurationSeconds);
            if (elapsed < growthSeconds)
            {
                skipped++;
                continue;
            }

            var yield = Math.Max(1, tile.CropType.BaseYield);
            try
            {
                await AddResourceAsync(
                    playerId,
                    player.Level,
                    tile.CropType.HarvestResourceCode,
                    yield,
                    ct);
            }
            catch (InvalidOperationException)
            {
                skipped++;
                continue;
            }

            player.ExperiencePoints += tile.CropType.XpReward;
            tile.CropTypeId = null;
            tile.PlantedAtUtc = null;
            success++;
        }

        if (success > 0)
        {
            player.Level = ComputeLevel(player.ExperiencePoints);
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        if (success > 0)
        {
            await NotifyFarmChangedAsync(playerId, ct);
        }

        return new BatchActionResultDto(success, skipped);
    }

    public async Task BuyFarmExpansionAsync(Guid playerId, CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        var offer = config.GetExpansionOffer(player.FarmGridSize)
            ?? throw new InvalidOperationException("Cannot expand further.");

        if (player.GoldCoins < offer.Price)
        {
            throw new InvalidOperationException("Not enough gold.");
        }

        player.GoldCoins -= offer.Price;
        player.FarmGridSize = offer.NextSize;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await EnsureFarmTilesAsync(playerId, ct);
        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task BuyDecorationAsync(Guid playerId, int decorationTypeId, int quantity, CancellationToken ct = default)
    {
        if (quantity <= 0 || quantity > 99)
        {
            throw new InvalidOperationException("Invalid quantity.");
        }

        var def = await db.DecorationDefinitions.FirstOrDefaultAsync(d => d.Id == decorationTypeId, ct)
            ?? throw new InvalidOperationException("Unknown decoration.");

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        EnsureMinLevel(player.Level, def.MinLevelRequired, def.Name);

        var cost = checked(def.BuyPrice * quantity);
        if (player.GoldCoins < cost)
        {
            throw new InvalidOperationException("Not enough gold.");
        }

        player.GoldCoins -= cost;

        var owned = await db.PlayerDecorations.FirstOrDefaultAsync(
            d => d.PlayerId == playerId && d.DecorationTypeId == decorationTypeId,
            ct);

        if (owned is null)
        {
            owned = new PlayerDecoration
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                DecorationTypeId = decorationTypeId,
                Quantity = 0
            };
            db.PlayerDecorations.Add(owned);
        }

        var placed = await CountPlacedAsync(playerId, PlacementKinds.Decoration, decorationTypeId, ct);
        var totalAfter = owned.Quantity + placed + quantity;
        if (totalAfter > def.MaxOwned)
        {
            throw new InvalidOperationException(
                $"You can own at most {def.MaxOwned} {def.Name} (stash + placed).");
        }

        owned.Quantity += quantity;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task BuyAnimalAsync(Guid playerId, int animalTypeId, int quantity, CancellationToken ct = default)
    {
        if (quantity <= 0 || quantity > 99)
        {
            throw new InvalidOperationException("Invalid quantity.");
        }

        var animal = await db.AnimalDefinitions.FirstOrDefaultAsync(a => a.Id == animalTypeId, ct)
            ?? throw new InvalidOperationException("Unknown animal.");

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        EnsureMinLevel(player.Level, animal.MinLevelRequired, animal.Name);

        var cost = checked(animal.BuyPrice * quantity);
        if (player.GoldCoins < cost)
        {
            throw new InvalidOperationException("Not enough gold.");
        }

        player.GoldCoins -= cost;

        var owned = await db.PlayerAnimals.FirstOrDefaultAsync(
            a => a.PlayerId == playerId && a.AnimalTypeId == animalTypeId,
            ct);

        if (owned is null)
        {
            owned = new PlayerAnimal
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                AnimalTypeId = animalTypeId,
                Quantity = 0,
                LastCollectedUtc = DateTimeOffset.UtcNow
            };
            db.PlayerAnimals.Add(owned);
        }

        var placed = await CountPlacedAsync(playerId, PlacementKinds.Animal, animalTypeId, ct);
        var totalAfter = (owned?.Quantity ?? 0) + placed + quantity;
        if (totalAfter > animal.MaxOwned)
        {
            throw new InvalidOperationException(
                $"You can own at most {animal.MaxOwned} {animal.Name} (stash + placed).");
        }

        owned!.Quantity += quantity;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task BuyFactoryAsync(Guid playerId, int factoryTypeId, int quantity, CancellationToken ct = default)
    {
        if (quantity <= 0 || quantity > 99)
        {
            throw new InvalidOperationException("Invalid quantity.");
        }

        var factory = await db.FactoryDefinitions.FirstOrDefaultAsync(f => f.Id == factoryTypeId, ct)
            ?? throw new InvalidOperationException("Unknown factory.");

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        EnsureMinLevel(player.Level, factory.MinLevelRequired, factory.Name);

        var cost = checked(factory.BuyPrice * quantity);
        if (player.GoldCoins < cost)
        {
            throw new InvalidOperationException("Not enough gold.");
        }

        player.GoldCoins -= cost;

        var owned = await db.PlayerFactories.FirstOrDefaultAsync(
            f => f.PlayerId == playerId && f.FactoryTypeId == factoryTypeId,
            ct);

        if (owned is null)
        {
            owned = new PlayerFactory
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                FactoryTypeId = factoryTypeId,
                Quantity = 0,
                LastProcessedUtc = null
            };
            db.PlayerFactories.Add(owned);
        }

        var placed = await CountPlacedAsync(playerId, PlacementKinds.Factory, factoryTypeId, ct);
        var totalAfter = (owned?.Quantity ?? 0) + placed + quantity;
        if (totalAfter > factory.MaxOwned)
        {
            throw new InvalidOperationException(
                $"You can own at most {factory.MaxOwned} {factory.Name} (stash + placed).");
        }

        owned!.Quantity += quantity;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task PlaceItemAsync(
        Guid playerId,
        string kind,
        int typeId,
        int x,
        int y,
        CancellationToken ct = default)
    {
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        var normalizedKind = kind.Trim().ToLowerInvariant();
        if (normalizedKind is not (
            PlacementKinds.Animal
            or PlacementKinds.Factory
            or PlacementKinds.Decoration))
        {
            throw new InvalidOperationException("Unknown placement kind.");
        }

        var (footprintW, footprintH) = await ResolveFootprintAsync(normalizedKind, typeId, ct);

        if (!FootprintHelper.FitsInGrid(x, y, footprintW, footprintH, gridSize))
        {
            throw new InvalidOperationException("Footprint does not fit on the farm.");
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        if (await FootprintBlockedAsync(playerId, x, y, footprintW, footprintH, ct))
        {
            throw new InvalidOperationException("Those tiles are blocked by crops or other items.");
        }

        if (normalizedKind == PlacementKinds.Animal)
        {
            var def = await db.AnimalDefinitions.FirstOrDefaultAsync(a => a.Id == typeId, ct)
                ?? throw new InvalidOperationException("Unknown animal.");

            var stash = await db.PlayerAnimals.FirstOrDefaultAsync(
                a => a.PlayerId == playerId && a.AnimalTypeId == typeId,
                ct);

            if (stash is null || stash.Quantity < 1)
            {
                throw new InvalidOperationException("No animals in inventory — buy one in the market.");
            }

            var placed = await CountPlacedAsync(playerId, PlacementKinds.Animal, typeId, ct);
            if (placed >= def.MaxPlaced)
            {
                throw new InvalidOperationException(
                    $"You can place at most {def.MaxPlaced} {def.Name} on the farm.");
            }

            stash.Quantity -= 1;
            db.FarmPlacements.Add(new FarmPlacement
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                CoordinateX = x,
                CoordinateY = y,
                Kind = PlacementKinds.Animal,
                TypeId = typeId,
                LastActionUtc = null,
                FootprintWidth = def.FootprintWidth,
                FootprintHeight = def.FootprintHeight
            });
        }
        else if (normalizedKind == PlacementKinds.Factory)
        {
            var def = await db.FactoryDefinitions.FirstOrDefaultAsync(f => f.Id == typeId, ct)
                ?? throw new InvalidOperationException("Unknown factory.");

            var stash = await db.PlayerFactories.FirstOrDefaultAsync(
                f => f.PlayerId == playerId && f.FactoryTypeId == typeId,
                ct);

            if (stash is null || stash.Quantity < 1)
            {
                throw new InvalidOperationException("No buildings in inventory — buy one in the market.");
            }

            var placed = await CountPlacedAsync(playerId, PlacementKinds.Factory, typeId, ct);
            if (placed >= def.MaxPlaced)
            {
                throw new InvalidOperationException(
                    $"You can place at most {def.MaxPlaced} {def.Name} on the farm.");
            }

            stash.Quantity -= 1;
            db.FarmPlacements.Add(new FarmPlacement
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                CoordinateX = x,
                CoordinateY = y,
                Kind = PlacementKinds.Factory,
                TypeId = typeId,
                LastActionUtc = null,
                FootprintWidth = def.FootprintWidth,
                FootprintHeight = def.FootprintHeight
            });
        }
        else
        {
            var def = await db.DecorationDefinitions.FirstOrDefaultAsync(d => d.Id == typeId, ct)
                ?? throw new InvalidOperationException("Unknown decoration.");

            var stash = await db.PlayerDecorations.FirstOrDefaultAsync(
                d => d.PlayerId == playerId && d.DecorationTypeId == typeId,
                ct);

            if (stash is null || stash.Quantity < 1)
            {
                throw new InvalidOperationException("No decorations in inventory — buy one in the market.");
            }

            var placed = await CountPlacedAsync(playerId, PlacementKinds.Decoration, typeId, ct);
            if (placed >= def.MaxPlaced)
            {
                throw new InvalidOperationException(
                    $"You can place at most {def.MaxPlaced} {def.Name} on the farm.");
            }

            stash.Quantity -= 1;
            db.FarmPlacements.Add(new FarmPlacement
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                CoordinateX = x,
                CoordinateY = y,
                Kind = PlacementKinds.Decoration,
                TypeId = typeId,
                LastActionUtc = null,
                FootprintWidth = def.FootprintWidth,
                FootprintHeight = def.FootprintHeight
            });
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task PickupItemAsync(Guid playerId, int x, int y, CancellationToken ct = default)
    {
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        ValidateTileCoords(x, y, gridSize);

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var placements = await db.FarmPlacements
            .Where(p => p.PlayerId == playerId)
            .ToListAsync(ct);

        var placement = FootprintHelper.FindCovering(placements, x, y)
            ?? throw new InvalidOperationException("Nothing to pick up on that tile.");

        if (placement.Kind == PlacementKinds.Animal)
        {
            var stash = await db.PlayerAnimals.FirstOrDefaultAsync(
                a => a.PlayerId == playerId && a.AnimalTypeId == placement.TypeId,
                ct);

            if (stash is null)
            {
                stash = new PlayerAnimal
                {
                    Id = Guid.NewGuid(),
                    PlayerId = playerId,
                    AnimalTypeId = placement.TypeId,
                    Quantity = 0
                };
                db.PlayerAnimals.Add(stash);
            }

            stash.Quantity += 1;
        }
        else if (placement.Kind == PlacementKinds.Factory)
        {
            var stash = await db.PlayerFactories.FirstOrDefaultAsync(
                f => f.PlayerId == playerId && f.FactoryTypeId == placement.TypeId,
                ct);

            if (stash is null)
            {
                stash = new PlayerFactory
                {
                    Id = Guid.NewGuid(),
                    PlayerId = playerId,
                    FactoryTypeId = placement.TypeId,
                    Quantity = 0
                };
                db.PlayerFactories.Add(stash);
            }

            stash.Quantity += 1;
        }
        else if (placement.Kind == PlacementKinds.Decoration)
        {
            var stash = await db.PlayerDecorations.FirstOrDefaultAsync(
                d => d.PlayerId == playerId && d.DecorationTypeId == placement.TypeId,
                ct);

            if (stash is null)
            {
                stash = new PlayerDecoration
                {
                    Id = Guid.NewGuid(),
                    PlayerId = playerId,
                    DecorationTypeId = placement.TypeId,
                    Quantity = 0
                };
                db.PlayerDecorations.Add(stash);
            }

            stash.Quantity += 1;
        }
        else
        {
            throw new InvalidOperationException("This item cannot be stored yet.");
        }

        db.FarmPlacements.Remove(placement);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task<int> CollectAnimalsAsync(Guid playerId, CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var now = DateTimeOffset.UtcNow;
        var placements = await db.FarmPlacements
            .Where(p => p.PlayerId == playerId && p.Kind == PlacementKinds.Animal)
            .ToListAsync(ct);

        if (placements.Count == 0)
        {
            throw new InvalidOperationException("Place animals on the farm first, then collect.");
        }

        var defs = await db.AnimalDefinitions.ToDictionaryAsync(a => a.Id, ct);
        var maxCycles = config.MaxBankedAnimalCycles;
        var pending = new List<(FarmPlacement Placement, AnimalDefinition Def, int Amount)>();

        foreach (var placement in placements)
        {
            if (!defs.TryGetValue(placement.TypeId, out var def))
            {
                continue;
            }

            var interval = config.GetAnimalIntervalSeconds(def.Id, def.ProductionIntervalSeconds);
            if (TryCollectAnimalPlacement(placement, interval, def.ProductQuantity, now, maxCycles, out var amount))
            {
                pending.Add((placement, def, amount));
            }
        }

        if (pending.Count == 0)
        {
            throw new InvalidOperationException("Nothing ready yet — wait until the timer shows Ready.");
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstAsync(p => p.Id == playerId, ct);
        var freeSlots = await GetStorageFreeSlotsAsync(playerId, player.Level, ct);
        if (freeSlots <= 0)
        {
            throw new InvalidOperationException(
                $"Barn full. Sell from inventory or upgrade storage ({await GetStorageUsedAsync(playerId, ct)}/{config.GetStorageCapacity(player.Level, player.BarnUpgradeTier)} slots).");
        }

        var totalProduced = 0;
        foreach (var (placement, def, amount) in pending)
        {
            if (freeSlots <= 0)
            {
                break;
            }

            var take = TakeAnimalCollectAmount(amount, def.ProductQuantity, freeSlots);
            if (take <= 0)
            {
                continue;
            }

            var interval = config.GetAnimalIntervalSeconds(def.Id, def.ProductionIntervalSeconds);
            ApplyAnimalCollection(placement, interval, def.ProductQuantity, now, take, maxCycles);
            await AddResourceAsync(playerId, player.Level, def.ProductCode, take, ct, skipCapacityCheck: true);
            freeSlots -= take;
            totalProduced += take;
        }

        if (totalProduced <= 0)
        {
            throw new InvalidOperationException(
                "Barn full — free at least one slot, then collect again.");
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
        return totalProduced;
    }

    public async Task FeedAnimalAtAsync(
        Guid playerId,
        int animalTypeId,
        int x,
        int y,
        CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        ValidateTileCoords(x, y, gridSize);

        var placements = await db.FarmPlacements
            .Where(p => p.PlayerId == playerId && p.Kind == PlacementKinds.Animal && p.TypeId == animalTypeId)
            .ToListAsync(ct);

        var placement = FootprintHelper.FindCovering(placements, x, y)
            ?? throw new InvalidOperationException("No animal on that tile.");

        var def = await db.AnimalDefinitions.FirstOrDefaultAsync(a => a.Id == animalTypeId, ct)
            ?? throw new InvalidOperationException("Unknown animal.");

        if (placement.LastActionUtc is not null)
        {
            var interval = config.GetAnimalIntervalSeconds(def.Id, def.ProductionIntervalSeconds);
            var elapsed = (DateTimeOffset.UtcNow - placement.LastActionUtc.Value).TotalSeconds;
            if (elapsed < interval)
            {
                throw new InvalidOperationException("This animal is still eating — wait for the timer to finish.");
            }

            throw new InvalidOperationException("Collect produce first, then feed again for the next cycle.");
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var feedCode = def.FeedResourceCode.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(feedCode))
        {
            throw new InvalidOperationException("This animal has no feed configured.");
        }

        var feedNeeded = Math.Max(1, def.FeedQuantity);
        var feedStock = await GetOrCreateResourceAsync(playerId, feedCode, ct);
        if (feedStock.Quantity < feedNeeded)
        {
            throw new InvalidOperationException(
                $"Need {feedNeeded} {feedCode} in the barn to feed {def.Name} (you have {feedStock.Quantity}).");
        }

        feedStock.Quantity -= feedNeeded;
        placement.LastActionUtc = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
    }

    public async Task<int> CollectAnimalAtAsync(
        Guid playerId,
        int animalTypeId,
        int x,
        int y,
        CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        ValidateTileCoords(x, y, gridSize);

        var placements = await db.FarmPlacements
            .Where(p => p.PlayerId == playerId && p.Kind == PlacementKinds.Animal && p.TypeId == animalTypeId)
            .ToListAsync(ct);

        var placement = FootprintHelper.FindCovering(placements, x, y)
            ?? throw new InvalidOperationException("No animal on that tile.");

        var def = await db.AnimalDefinitions.FirstOrDefaultAsync(a => a.Id == animalTypeId, ct)
            ?? throw new InvalidOperationException("Unknown animal.");

        var now = DateTimeOffset.UtcNow;

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstAsync(p => p.Id == playerId, ct);

        var interval = config.GetAnimalIntervalSeconds(def.Id, def.ProductionIntervalSeconds);
        var maxCycles = config.MaxBankedAnimalCycles;
        if (!TryCollectAnimalPlacement(placement, interval, def.ProductQuantity, now, maxCycles, out var amount))
        {
            throw new InvalidOperationException("Nothing ready yet — wait until the timer shows Ready.");
        }

        var freeSlots = await GetStorageFreeSlotsAsync(playerId, player.Level, ct);
        if (freeSlots <= 0)
        {
            throw new InvalidOperationException(
                $"Barn full. Sell from inventory or upgrade storage ({await GetStorageUsedAsync(playerId, ct)}/{config.GetStorageCapacity(player.Level, player.BarnUpgradeTier)} slots).");
        }

        var take = TakeAnimalCollectAmount(amount, def.ProductQuantity, freeSlots);
        ApplyAnimalCollection(placement, interval, def.ProductQuantity, now, take, maxCycles);
        await AddResourceAsync(playerId, player.Level, def.ProductCode, take, ct, skipCapacityCheck: true);

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
        return take;
    }

    public async Task<int> CollectFactoriesAsync(Guid playerId, CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var now = DateTimeOffset.UtcNow;
        var placements = await db.FarmPlacements
            .Where(p => p.PlayerId == playerId && p.Kind == PlacementKinds.Factory)
            .ToListAsync(ct);

        if (placements.Count == 0)
        {
            throw new InvalidOperationException("Place factories on the farm first.");
        }

        var defs = await db.FactoryDefinitions.ToDictionaryAsync(f => f.Id, ct);
        var pending = new List<(FarmPlacement Placement, FactoryDefinition Def, int OutputQty)>();

        foreach (var placement in placements)
        {
            if (!defs.TryGetValue(placement.TypeId, out var def) || def.IsBarn)
            {
                continue;
            }

            if (TryGetReadyFactoryOutput(placement, def.Id, def.ProcessSeconds, def.OutputQuantity, placement.BatchRuns, now, out var outputQty))
            {
                pending.Add((placement, def, outputQty));
            }
        }

        if (pending.Count == 0)
        {
            throw new InvalidOperationException(
                "No factory output ready — start production or wait until Work done.");
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstAsync(p => p.Id == playerId, ct);
        var freeSlots = await GetStorageFreeSlotsAsync(playerId, player.Level, ct);
        if (freeSlots <= 0)
        {
            throw new InvalidOperationException(
                $"Barn full. Sell from inventory or upgrade storage ({await GetStorageUsedAsync(playerId, ct)}/{config.GetStorageCapacity(player.Level, player.BarnUpgradeTier)} slots).");
        }

        var totalProduced = 0;
        foreach (var (placement, def, outputQty) in pending)
        {
            if (freeSlots < outputQty)
            {
                continue;
            }

            await AddResourceAsync(
                playerId,
                player.Level,
                def.OutputResourceCode,
                outputQty,
                ct,
                skipCapacityCheck: true);
            placement.LastActionUtc = null;
            placement.BatchRuns = 1;
            freeSlots -= outputQty;
            totalProduced += outputQty;
        }

        if (totalProduced <= 0)
        {
            throw new InvalidOperationException(
                "Barn full — free at least one slot, then collect again.");
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
        return totalProduced;
    }

    public async Task<int> ProcessFactoryAsync(
        Guid playerId,
        int factoryTypeId,
        int x,
        int y,
        int batchRuns = 1,
        CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var gridSize = await GetPlayerGridSizeAsync(playerId, ct);
        ValidateTileCoords(x, y, gridSize);

        var placements = await db.FarmPlacements
            .Where(p => p.PlayerId == playerId && p.Kind == PlacementKinds.Factory && p.TypeId == factoryTypeId)
            .ToListAsync(ct);

        var placement = FootprintHelper.FindCovering(placements, x, y)
            ?? throw new InvalidOperationException("Place this factory on that tile first.");

        var def = await db.FactoryDefinitions.FirstOrDefaultAsync(f => f.Id == factoryTypeId, ct)
            ?? throw new InvalidOperationException("Unknown factory.");

        if (def.IsBarn)
        {
            throw new InvalidOperationException("This is your storage barn — click it on the farm to upgrade capacity.");
        }

        var now = DateTimeOffset.UtcNow;

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstAsync(p => p.Id == playerId, ct);

        // Idle — load ingredients and start the timer (output comes when you collect).
        if (placement.LastActionUtc is null)
        {
            var runs = Math.Clamp(batchRuns, 1, 10);
            var inputNeeded = checked(def.InputQuantity * runs);
            var input = await GetOrCreateResourceAsync(playerId, def.InputResourceCode, ct);
            if (input.Quantity < inputNeeded)
            {
                throw new InvalidOperationException(
                    $"Need {inputNeeded} {def.InputResourceCode} in the barn to start {runs}× production.");
            }

            input.Quantity -= inputNeeded;
            placement.BatchRuns = runs;
            placement.LastActionUtc = now;
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            await NotifyFarmChangedAsync(playerId, ct);
            return 0;
        }

        var perRun = config.GetFactoryProcessSeconds(def.Id, def.ProcessSeconds);
        var durationSeconds = FactoryProcessDurationSeconds(perRun, placement.BatchRuns);
        var elapsed = (now - placement.LastActionUtc.Value).TotalSeconds;
        if (elapsed < durationSeconds)
        {
            var left = (int)Math.Ceiling(durationSeconds - elapsed);
            throw new InvalidOperationException($"{def.Name} is still working ({left}s left).");
        }

        var outputQty = checked(def.OutputQuantity * Math.Max(1, placement.BatchRuns));
        await EnsureCanAddResourcesAsync(playerId, player.Level, outputQty, ct);
        await AddResourceAsync(
            playerId,
            player.Level,
            def.OutputResourceCode,
            outputQty,
            ct,
            skipCapacityCheck: true);
        placement.LastActionUtc = null;
        placement.BatchRuns = 1;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
        return outputQty;
    }

    public async Task<int> SellResourceAsync(Guid playerId, string resourceCode, int quantity, CancellationToken ct = default)
    {
        if (quantity <= 0 || quantity > 9999)
        {
            throw new InvalidOperationException("Invalid quantity.");
        }

        var code = resourceCode.Trim().ToLowerInvariant();
        var sellEach = await db.ResourceDefinitions
            .Where(r => r.IsEnabled && r.Code == code)
            .Select(r => r.SellValue)
            .FirstOrDefaultAsync(ct);

        if (sellEach <= 0)
        {
            throw new InvalidOperationException("Cannot sell that resource.");
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var player = await db.Users.FirstOrDefaultAsync(p => p.Id == playerId, ct)
            ?? throw new InvalidOperationException("Player not found.");

        var stock = await db.PlayerResources.FirstOrDefaultAsync(
            r => r.PlayerId == playerId && r.ResourceCode == code,
            ct);

        if (stock is null || stock.Quantity < quantity)
        {
            throw new InvalidOperationException("Not enough in storage.");
        }

        stock.Quantity -= quantity;
        player.GoldCoins += checked(sellEach * quantity);

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
        return checked(sellEach * quantity);
    }

    private async Task<PlayerResource> GetOrCreateResourceAsync(Guid playerId, string code, CancellationToken ct)
    {
        var normalized = code.Trim().ToLowerInvariant();

        var row = await db.PlayerResources.FirstOrDefaultAsync(
            r => r.PlayerId == playerId && r.ResourceCode == normalized,
            ct);

        if (row is not null)
        {
            return row;
        }

        // Same transaction may have already staged this resource (e.g. harvest-batch on many tiles).
        row = db.PlayerResources.Local.FirstOrDefault(
            r => r.PlayerId == playerId
                && string.Equals(r.ResourceCode, normalized, StringComparison.Ordinal));

        if (row is not null)
        {
            return row;
        }

        row = new PlayerResource
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            ResourceCode = normalized,
            Quantity = 0
        };
        db.PlayerResources.Add(row);
        return row;
    }

    private async Task AddResourceAsync(
        Guid playerId,
        int playerLevel,
        string code,
        int amount,
        CancellationToken ct,
        bool skipCapacityCheck = false)
    {
        if (amount <= 0)
        {
            return;
        }

        if (!skipCapacityCheck)
        {
            await EnsureCanAddResourcesAsync(playerId, playerLevel, amount, ct);
        }

        var row = await GetOrCreateResourceAsync(playerId, code, ct);
        row.Quantity += amount;
    }

    private async Task<int> GetStorageUsedAsync(Guid playerId, CancellationToken ct)
    {
        var used = await db.PlayerResources
            .Where(r => r.PlayerId == playerId)
            .SumAsync(r => r.Quantity, ct);

        foreach (var local in db.PlayerResources.Local.Where(r => r.PlayerId == playerId))
        {
            var entry = db.Entry(local);
            if (entry.State == EntityState.Added)
            {
                used += local.Quantity;
            }
            else if (entry.State == EntityState.Modified)
            {
                var original = entry.Property(r => r.Quantity).OriginalValue;
                used += local.Quantity - original;
            }
        }

        return used;
    }

    private async Task EnsureCanAddResourcesAsync(
        Guid playerId,
        int playerLevel,
        int amountToAdd,
        CancellationToken ct)
    {
        var barnTier = await db.Users.AsNoTracking()
            .Where(p => p.Id == playerId)
            .Select(p => p.BarnUpgradeTier)
            .FirstAsync(ct);
        var capacity = config.GetStorageCapacity(playerLevel, barnTier);
        var used = await GetStorageUsedAsync(playerId, ct);
        if (used + amountToAdd > capacity)
        {
            throw new InvalidOperationException(
                $"Barn full ({used}/{capacity} slots). Sell from inventory, level up (+{config.Snapshot.StoragePerLevel}/level), or upgrade your barn on the farm.");
        }
    }

    public async Task<int> UpgradeBarnAsync(Guid playerId, CancellationToken ct = default)
    {
        await PrepareConfigAsync(ct);
        var player = await db.Users.FirstAsync(p => p.Id == playerId, ct);
        var offer = config.GetNextBarnUpgradeOffer(player.BarnUpgradeTier)
            ?? throw new InvalidOperationException("Barn storage is fully upgraded.");

        var barnPlaced = await db.FarmPlacements.AnyAsync(
            p => p.PlayerId == playerId
                && p.Kind == PlacementKinds.Factory
                && p.TypeId == config.BarnFactoryTypeId,
            ct);
        if (!barnPlaced)
        {
            throw new InvalidOperationException("Place your Hearty Barn on the farm before upgrading storage.");
        }

        if (player.GoldCoins < offer.GoldCost)
        {
            throw new InvalidOperationException($"Need {offer.GoldCost} gold to upgrade barn storage (+{offer.BonusSlots} slots).");
        }

        player.GoldCoins -= offer.GoldCost;
        player.BarnUpgradeTier = offer.NextTier;
        await db.SaveChangesAsync(ct);
        await NotifyFarmChangedAsync(playerId, ct);
        return config.GetStorageCapacity(player.Level, player.BarnUpgradeTier);
    }

    private bool TryGetReadyFactoryOutput(
        FarmPlacement placement,
        int factoryTypeId,
        int databaseProcessSeconds,
        int outputPerRun,
        int batchRuns,
        DateTimeOffset now,
        out int outputQuantity)
    {
        outputQuantity = 0;
        if (placement.LastActionUtc is null || databaseProcessSeconds <= 0)
        {
            return false;
        }

        var elapsed = (now - placement.LastActionUtc.Value).TotalSeconds;
        var perRun = config.GetFactoryProcessSeconds(factoryTypeId, databaseProcessSeconds);
        if (elapsed < FactoryProcessDurationSeconds(perRun, batchRuns))
        {
            return false;
        }

        outputQuantity = checked(outputPerRun * Math.Max(1, batchRuns));
        return true;
    }

    private static int FactoryProcessDurationSeconds(int scaledProcessSecondsPerRun, int batchRuns) =>
        checked(scaledProcessSecondsPerRun * Math.Max(1, batchRuns));

    private async Task<int> GetStorageFreeSlotsAsync(
        Guid playerId,
        int playerLevel,
        CancellationToken ct)
    {
        var barnTier = await db.Users.AsNoTracking()
            .Where(p => p.Id == playerId)
            .Select(p => p.BarnUpgradeTier)
            .FirstAsync(ct);
        var capacity = config.GetStorageCapacity(playerLevel, barnTier);
        var used = await GetStorageUsedAsync(playerId, ct);
        return Math.Max(0, capacity - used);
    }

    private static int TakeAnimalCollectAmount(int pendingAmount, int productQuantity, int freeSlots)
    {
        if (pendingAmount <= 0 || productQuantity <= 0 || freeSlots <= 0)
        {
            return 0;
        }

        var maxCycles = freeSlots / productQuantity;
        if (maxCycles <= 0)
        {
            return 0;
        }

        var pendingCycles = pendingAmount / productQuantity;
        var cycles = Math.Min(pendingCycles, maxCycles);
        return cycles * productQuantity;
    }

    private static void ApplyAnimalCollection(
        FarmPlacement placement,
        int productionIntervalSeconds,
        int productQuantity,
        DateTimeOffset now,
        int collectAmount,
        int maxBankedCycles)
    {
        var last = placement.LastActionUtc ?? now;
        var elapsed = (now - last).TotalSeconds;
        var cyclesTotal = (int)(elapsed / productionIntervalSeconds);
        cyclesTotal = Math.Min(cyclesTotal, maxBankedCycles);
        var cyclesCollected = collectAmount / productQuantity;
        var cyclesRemaining = Math.Max(0, cyclesTotal - cyclesCollected);
        placement.LastActionUtc = cyclesRemaining <= 0
            ? null
            : now.AddSeconds(-cyclesRemaining * productionIntervalSeconds);
    }

    private static bool TryCollectAnimalPlacement(
        FarmPlacement placement,
        int productionIntervalSeconds,
        int productQuantity,
        DateTimeOffset now,
        int maxBankedCycles,
        out int amount)
    {
        amount = 0;
        if (placement.LastActionUtc is null)
        {
            return false;
        }

        var elapsed = (now - placement.LastActionUtc.Value).TotalSeconds;
        if (elapsed < productionIntervalSeconds)
        {
            return false;
        }

        var cycles = (int)(elapsed / productionIntervalSeconds);
        cycles = Math.Min(cycles, maxBankedCycles);
        amount = cycles * productQuantity;
        return amount > 0;
    }

    private static void EnsureMinLevel(int playerLevel, int requiredLevel, string itemName)
    {
        if (playerLevel < requiredLevel)
        {
            throw new InvalidOperationException(
                $"{itemName} unlocks at level {requiredLevel}. You are level {playerLevel}.");
        }
    }

    private static int ComputeLevel(int xp) => Math.Max(1, xp / 100 + 1);

    private async Task<int> GetPlayerGridSizeAsync(Guid playerId, CancellationToken ct) =>
        await db.Users.Where(u => u.Id == playerId).Select(u => u.FarmGridSize).FirstAsync(ct);

    private static void ValidateTileCoords(int x, int y, int gridSize)
    {
        if (x < 0 || y < 0 || x >= gridSize || y >= gridSize)
        {
            throw new InvalidOperationException("Tile out of bounds.");
        }
    }

    private async Task<bool> HasPlacementOverlapAtCellAsync(Guid playerId, int x, int y, CancellationToken ct)
    {
        var placements = await db.FarmPlacements
            .AsNoTracking()
            .Where(p => p.PlayerId == playerId)
            .ToListAsync(ct);
        return FootprintHelper.FindCovering(placements, x, y) is not null;
    }

    private async Task<bool> FootprintBlockedAsync(
        Guid playerId,
        int anchorX,
        int anchorY,
        int footprintW,
        int footprintH,
        CancellationToken ct)
    {
        var placements = await db.FarmPlacements
            .Where(p => p.PlayerId == playerId)
            .ToListAsync(ct);

        foreach (var (cx, cy) in FootprintHelper.Cells(anchorX, anchorY, footprintW, footprintH))
        {
            if (FootprintHelper.FindCovering(placements, cx, cy) is not null)
            {
                return true;
            }

            var tile = await db.FarmTiles.FirstOrDefaultAsync(
                t => t.PlayerId == playerId && t.CoordinateX == cx && t.CoordinateY == cy,
                ct);

            if (tile?.CropTypeId is not null)
            {
                return true;
            }
        }

        return false;
    }

    private async Task<(int Width, int Height)> ResolveFootprintAsync(
        string kind,
        int typeId,
        CancellationToken ct)
    {
        switch (kind)
        {
            case PlacementKinds.Animal:
            {
                var def = await db.AnimalDefinitions.FirstOrDefaultAsync(a => a.Id == typeId, ct)
                    ?? throw new InvalidOperationException("Unknown animal.");
                return (def.FootprintWidth, def.FootprintHeight);
            }
            case PlacementKinds.Factory:
            {
                var def = await db.FactoryDefinitions.FirstOrDefaultAsync(f => f.Id == typeId, ct)
                    ?? throw new InvalidOperationException("Unknown factory.");
                return (def.FootprintWidth, def.FootprintHeight);
            }
            case PlacementKinds.Decoration:
            {
                var def = await db.DecorationDefinitions.FirstOrDefaultAsync(d => d.Id == typeId, ct)
                    ?? throw new InvalidOperationException("Unknown decoration.");
                return (def.FootprintWidth, def.FootprintHeight);
            }
            default:
                throw new InvalidOperationException("Unknown placement kind.");
        }
    }

    private Task<int> CountPlacedAsync(Guid playerId, string kind, int typeId, CancellationToken ct) =>
        db.FarmPlacements.CountAsync(
            p => p.PlayerId == playerId && p.Kind == kind && p.TypeId == typeId,
            ct);

    private FarmTileDto ToTileDto(
        FarmTile tile,
        FarmPlacement? placement,
        IReadOnlyDictionary<int, string> animalNames,
        IReadOnlyDictionary<int, string> factoryNames,
        IReadOnlyDictionary<int, string> decorationNames,
        IReadOnlyDictionary<int, int> animalIntervals,
        IReadOnlyDictionary<int, int> factoryIntervals,
        DateTimeOffset now)
    {
        string? placementKind = null;
        int? placementTypeId = null;
        string? placementName = null;
        DateTimeOffset? placementLastActionUtc = null;
        int? placementCooldownSeconds = null;
        int? placementSecondsRemaining = null;
        int? placementBatchRuns = null;
        int? placementAnchorX = null;
        int? placementAnchorY = null;
        int? placementFootprintW = null;
        int? placementFootprintH = null;
        bool placementIsAnchor = false;

        if (placement is not null)
        {
            placementKind = placement.Kind;
            placementTypeId = placement.TypeId;
            placementName = placement.Kind switch
            {
                PlacementKinds.Animal => animalNames.GetValueOrDefault(placement.TypeId),
                PlacementKinds.Factory => factoryNames.GetValueOrDefault(placement.TypeId),
                PlacementKinds.Decoration => decorationNames.GetValueOrDefault(placement.TypeId),
                _ => null
            };
            placementLastActionUtc = placement.LastActionUtc;
            placementAnchorX = placement.CoordinateX;
            placementAnchorY = placement.CoordinateY;
            placementFootprintW = placement.FootprintWidth;
            placementFootprintH = placement.FootprintHeight;
            placementIsAnchor = tile.CoordinateX == placement.CoordinateX
                && tile.CoordinateY == placement.CoordinateY;

            var interval = placement.Kind switch
            {
                PlacementKinds.Animal => animalIntervals.GetValueOrDefault(placement.TypeId),
                PlacementKinds.Factory => factoryIntervals.GetValueOrDefault(placement.TypeId),
                _ => 0
            };

            if (interval > 0)
            {
                if (placement.Kind == PlacementKinds.Factory && placement.LastActionUtc is not null)
                {
                    interval = FactoryProcessDurationSeconds(interval, placement.BatchRuns);
                }

                placementCooldownSeconds = interval;
                if (placement.LastActionUtc is null)
                {
                    placementSecondsRemaining = placement.Kind == PlacementKinds.Animal
                        ? null
                        : 0;
                }
                else
                {
                    var elapsed = (now - placement.LastActionUtc.Value).TotalSeconds;
                    placementSecondsRemaining = elapsed >= interval
                        ? 0
                        : (int)Math.Ceiling(interval - elapsed);
                }
            }

            if (placement.Kind == PlacementKinds.Factory && placement.LastActionUtc is not null)
            {
                placementBatchRuns = Math.Max(1, placement.BatchRuns);
            }
        }

        if (tile.CropTypeId is null || tile.PlantedAtUtc is null || tile.CropType is null)
        {
            return new FarmTileDto(
                tile.CoordinateX,
                tile.CoordinateY,
                "Empty",
                null,
                null,
                null,
                null,
                null,
                null,
                placementKind,
                placementTypeId,
                placementName,
                placementLastActionUtc,
                placementCooldownSeconds,
                placementSecondsRemaining,
                placementBatchRuns,
                placementAnchorX,
                placementAnchorY,
                placementFootprintW,
                placementFootprintH,
                placementIsAnchor);
        }

        var growth = config.GetCropGrowthSeconds(tile.CropType.Id, tile.CropType.GrowthDurationSeconds);
        var (phase, progress, remaining) = GrowthCalculator.Compute(now, tile.PlantedAtUtc.Value, growth);

        return new FarmTileDto(
            tile.CoordinateX,
            tile.CoordinateY,
            phase,
            tile.CropTypeId,
            tile.CropType.Name,
            tile.PlantedAtUtc,
            growth,
            progress,
            remaining,
            placementKind,
            placementTypeId,
            placementName,
            placementLastActionUtc,
            placementCooldownSeconds,
            placementSecondsRemaining,
            null,
            placementAnchorX,
            placementAnchorY,
            placementFootprintW,
            placementFootprintH,
            placementIsAnchor);
    }

    private async Task NotifyFarmChangedAsync(Guid farmOwnerId, CancellationToken ct)
    {
        try
        {
            await farmHub.Clients.Group(FarmHub.FarmGroupName(farmOwnerId))
                .SendAsync("farmStateChanged", new FarmStateChangedPayload(farmOwnerId, DateTimeOffset.UtcNow), ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SignalR broadcast failed for farm {FarmOwnerId}", farmOwnerId);
        }
    }
}

internal static class GrowthCalculator
{
    public static (string Phase, double Progress01, int? SecondsRemaining) Compute(
        DateTimeOffset now,
        DateTimeOffset plantedAt,
        int growthSeconds)
    {
        if (growthSeconds <= 0)
        {
            return ("Ripe", 1, 0);
        }

        var elapsed = Math.Max(0, (now - plantedAt).TotalSeconds);
        if (elapsed >= growthSeconds)
        {
            return ("Ripe", 1, 0);
        }

        var progress = elapsed / growthSeconds;
        var remaining = (int)Math.Ceiling(growthSeconds - elapsed);

        if (progress < 1.0 / 3.0)
        {
            return ("Seedling", progress, remaining);
        }

        if (progress < 2.0 / 3.0)
        {
            return ("Growing", progress, remaining);
        }

        return ("Mature", progress, remaining);
    }
}

public sealed record CropCatalogDto(
    int Id,
    string Name,
    string DisplayNameEn,
    string DisplayNameAr,
    int BuyPrice,
    int SellValue,
    int GrowthDurationSeconds,
    int XpReward,
    int MinLevelRequired,
    string HarvestResourceCode,
    int BaseYield);

public sealed record SeedStockDto(int CropTypeId, string CropName, int Quantity);

public sealed record FarmTileDto(
    int X,
    int Y,
    string Phase,
    int? CropTypeId,
    string? CropName,
    DateTimeOffset? PlantedAtUtc,
    int? GrowthDurationSeconds,
    double? Progress01,
    int? SecondsRemaining,
    string? PlacementKind,
    int? PlacementTypeId,
    string? PlacementName,
    DateTimeOffset? PlacementLastActionUtc,
    int? PlacementCooldownSeconds,
    int? PlacementSecondsRemaining,
    int? PlacementBatchRuns,
    int? PlacementAnchorX,
    int? PlacementAnchorY,
    int? PlacementFootprintW,
    int? PlacementFootprintH,
    bool PlacementIsAnchor);

public sealed record ResourceCatalogDto(
    string Code,
    int SellValue,
    string Category,
    string DisplayNameEn,
    string DisplayNameAr);

public sealed record AnimalCatalogDto(
    int Id,
    string Name,
    string DisplayNameEn,
    string DisplayNameAr,
    int BuyPrice,
    int ProductionIntervalSeconds,
    string FeedResourceCode,
    int FeedQuantity,
    string ProductCode,
    int ProductQuantity,
    int ProductSellValue,
    int MaxOwned,
    int MaxPlaced,
    int FootprintWidth,
    int FootprintHeight,
    int MinLevelRequired);

public sealed record FactoryCatalogDto(
    int Id,
    string Name,
    string DisplayNameEn,
    string DisplayNameAr,
    int BuyPrice,
    string InputResourceCode,
    int InputQuantity,
    string OutputResourceCode,
    int OutputQuantity,
    int ProcessSeconds,
    int SellValue,
    int MaxOwned,
    int MaxPlaced,
    int FootprintWidth,
    int FootprintHeight,
    int MinLevelRequired,
    bool IsBarn);

public sealed record BarnUpgradeOfferDto(
    int NextTier,
    int BonusSlots,
    int GoldCost,
    int TotalBarnBonus);

public sealed record DecorationCatalogDto(
    int Id,
    string Name,
    string DisplayNameEn,
    string DisplayNameAr,
    int BuyPrice,
    int FootprintWidth,
    int FootprintHeight,
    int MaxOwned,
    int MaxPlaced,
    int MinLevelRequired);

public sealed record PlayerDecorationDto(
    int DecorationTypeId,
    string Name,
    int StashQuantity,
    int PlacedCount);

public sealed record FarmExpansionOfferDto(int NextSize, int Price);

public sealed record PlayerAnimalDto(
    int AnimalTypeId,
    string Name,
    int StashQuantity,
    int PlacedCount,
    int ProductionIntervalSeconds);

public sealed record PlayerFactoryDto(
    int FactoryTypeId,
    string Name,
    int StashQuantity,
    int PlacedCount,
    int ProcessSeconds);

public sealed record ResourceStockDto(string ResourceCode, int Quantity);

public sealed record BatchActionResultDto(int SuccessCount, int SkippedCount);

public sealed record FarmSnapshotDto(
    DateTimeOffset ServerTimeUtc,
    int GridSize,
    string DisplayName,
    string Email,
    int Gold,
    int Dinars,
    int Xp,
    int Level,
    int StorageCapacity,
    int StorageUsed,
    int BarnUpgradeTier,
    bool BarnPlacedOnFarm,
    BarnUpgradeOfferDto? NextBarnUpgrade,
    IReadOnlyList<FarmTileDto> Tiles,
    IReadOnlyList<SeedStockDto> SeedStocks,
    IReadOnlyList<CropCatalogDto> CropCatalog,
    IReadOnlyList<AnimalCatalogDto> AnimalCatalog,
    IReadOnlyList<FactoryCatalogDto> FactoryCatalog,
    IReadOnlyList<DecorationCatalogDto> DecorationCatalog,
    IReadOnlyList<PlayerAnimalDto> Animals,
    IReadOnlyList<PlayerFactoryDto> Factories,
    IReadOnlyList<PlayerDecorationDto> Decorations,
    IReadOnlyList<ResourceStockDto> Resources,
    IReadOnlyList<ResourceCatalogDto> ResourceCatalog,
    FarmExpansionOfferDto? ExpansionOffer,
    GameTimingStateDto GameTiming,
    GameConfigStateDto GameConfig,
    ClientPresentationDto ClientPresentation);

public sealed record ClientPresentationDto(
    bool ShowBetaBadge,
    string BetaBadgeLabelEn,
    string BetaBadgeLabelAr);

public sealed record FarmStateChangedPayload(Guid FarmOwnerId, DateTimeOffset ServerTimeUtc);
