using HappierFarm.Domain;
using HappierFarm.Domain.Entities;
using HappierFarm.Infrastructure.Data;
using HappierFarm.WebAPI.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HappierFarm.WebAPI.Services;

/// <summary>Loads economy/progression/timing from SQL (admin-editable). Appsettings seeds missing rows on first load.</summary>
public sealed class GameConfigService(
    AppDbContext db,
    IOptionsMonitor<GameTimingOptions> timingFallback)
{
    private GameConfigSnapshot? _snapshot;

    public GameConfigSnapshot Snapshot =>
        _snapshot ?? throw new InvalidOperationException("Call EnsureLoadedAsync before using game config.");

    public async Task EnsureLoadedAsync(CancellationToken ct = default)
    {
        if (_snapshot is not null)
        {
            return;
        }

        await EnsureSettingsRowAsync(ct);
        var settings = await db.GameSettings.AsNoTracking()
            .FirstAsync(s => s.Id == GameSettings.SingletonId, ct);

        var barnTiers = await db.BarnUpgradeTierDefinitions.AsNoTracking()
            .OrderBy(t => t.Tier)
            .Select(t => new BarnUpgradeTierData(t.Tier, t.BonusSlots, t.GoldCost))
            .ToListAsync(ct);

        var timingRows = await db.CatalogTimingOverrides.AsNoTracking().ToListAsync(ct);
        var timingOverrides = timingRows.ToDictionary(
            r => (r.CatalogKind.Trim().ToLowerInvariant(), r.CatalogId),
            r => r.BaseSeconds);

        _snapshot = new GameConfigSnapshot(
            settings.DefaultGridSize,
            settings.MinGridSize,
            settings.AbsoluteMaxGridSize,
            settings.ExpansionBasePrice,
            settings.ExpansionGrowthRate,
            settings.ExpansionAreaTaxPerStepSq,
            settings.BaseStorageCapacity,
            settings.StoragePerLevel,
            settings.MaxBankedAnimalCycles,
            settings.BarnFactoryTypeId,
            settings.StarterGold,
            settings.StarterDinars,
            settings.GlobalTimePercent,
            settings.ActiveEventName,
            settings.ActiveEventMessage,
            settings.ActiveEventTimePercent,
            barnTiers,
            timingOverrides);
    }

    public int StarterGold => Snapshot.StarterGold;
    public int StarterDinars => Math.Max(0, Snapshot.StarterDinars);
    public int BarnFactoryTypeId => Snapshot.BarnFactoryTypeId;
    public int MaxBankedAnimalCycles => Snapshot.MaxBankedAnimalCycles;

    public int GetStorageCapacity(int level, int barnUpgradeTier = 0) =>
        GameConfigRules.GetStorageCapacity(Snapshot, level, barnUpgradeTier);

    public BarnUpgradeOfferData? GetNextBarnUpgradeOffer(int currentTier) =>
        GameConfigRules.GetNextBarnUpgradeOffer(Snapshot, currentTier);

    public (int NextSize, int Price)? GetExpansionOffer(int currentSize) =>
        GameConfigRules.GetExpansionOffer(Snapshot, currentSize);

    public GameTimingStateDto ToTimingStateDto() =>
        new(
            Math.Clamp(Snapshot.GlobalTimePercent, 10, 1000),
            Math.Clamp(GameConfigRules.EffectiveTimePercent(Snapshot), 10, 1000),
            Snapshot.ActiveEventName,
            Snapshot.ActiveEventMessage);

    public GameConfigStateDto ToConfigStateDto() =>
        new(
            Snapshot.MaxBankedAnimalCycles,
            Snapshot.BarnFactoryTypeId,
            Snapshot.BaseStorageCapacity,
            Snapshot.StoragePerLevel,
            Snapshot.DefaultGridSize);

    public int GetCropGrowthSeconds(int cropTypeId, int databaseSeconds) =>
        GameConfigRules.ResolveTimedSeconds(Snapshot, "crop", cropTypeId, databaseSeconds);

    public int GetAnimalIntervalSeconds(int animalTypeId, int databaseSeconds) =>
        GameConfigRules.ResolveTimedSeconds(Snapshot, "animal", animalTypeId, databaseSeconds);

    public int GetFactoryProcessSeconds(int factoryTypeId, int databaseSeconds) =>
        GameConfigRules.ResolveTimedSeconds(Snapshot, "factory", factoryTypeId, databaseSeconds);

    private async Task EnsureSettingsRowAsync(CancellationToken ct)
    {
        if (await db.GameSettings.AnyAsync(ct))
        {
            return;
        }

        var fb = timingFallback.CurrentValue;
        db.GameSettings.Add(new GameSettings
        {
            Id = GameSettings.SingletonId,
            GlobalTimePercent = fb.GlobalTimePercent,
            StarterDinars = fb.StarterDinars,
            ActiveEventName = fb.ActiveEvent?.Name,
            ActiveEventMessage = fb.ActiveEvent?.Message,
            ActiveEventTimePercent = fb.ActiveEvent?.TimePercent > 0 ? fb.ActiveEvent.TimePercent : 0,
        });

        foreach (var (id, seconds) in fb.CropGrowthSecondsById)
        {
            if (seconds > 0)
            {
                db.CatalogTimingOverrides.Add(new CatalogTimingOverride
                {
                    CatalogKind = "crop",
                    CatalogId = id,
                    BaseSeconds = seconds,
                });
            }
        }

        foreach (var (id, seconds) in fb.AnimalIntervalSecondsById)
        {
            if (seconds > 0)
            {
                db.CatalogTimingOverrides.Add(new CatalogTimingOverride
                {
                    CatalogKind = "animal",
                    CatalogId = id,
                    BaseSeconds = seconds,
                });
            }
        }

        foreach (var (id, seconds) in fb.FactoryProcessSecondsById)
        {
            if (seconds > 0)
            {
                db.CatalogTimingOverrides.Add(new CatalogTimingOverride
                {
                    CatalogKind = "factory",
                    CatalogId = id,
                    BaseSeconds = seconds,
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }
}

public sealed record GameConfigStateDto(
    int MaxBankedAnimalCycles,
    int BarnFactoryTypeId,
    int BaseStorageCapacity,
    int StoragePerLevel,
    int DefaultGridSize);

public sealed record GameTimingStateDto(
    int GlobalTimePercent,
    int EffectiveTimePercent,
    string? ActiveEventName,
    string? ActiveEventMessage);
