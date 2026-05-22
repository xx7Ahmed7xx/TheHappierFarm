namespace HappierFarm.Domain;

/// <summary>Pure rules over loaded <see cref="GameConfigSnapshot"/> (from SQL).</summary>
public static class GameConfigRules
{
    public static int GetBarnStorageBonus(GameConfigSnapshot cfg, int upgradeTier)
    {
        if (upgradeTier <= 0)
        {
            return 0;
        }

        var sum = 0;
        foreach (var tier in cfg.BarnUpgradeTiers.OrderBy(t => t.Tier))
        {
            if (tier.Tier > upgradeTier)
            {
                break;
            }

            sum += tier.BonusSlots;
        }

        return sum;
    }

    public static int GetStorageCapacity(GameConfigSnapshot cfg, int level, int barnUpgradeTier = 0) =>
        cfg.BaseStorageCapacity
        + Math.Max(0, level - 1) * cfg.StoragePerLevel
        + GetBarnStorageBonus(cfg, barnUpgradeTier);

    public static BarnUpgradeOfferData? GetNextBarnUpgradeOffer(GameConfigSnapshot cfg, int currentTier)
    {
        var next = cfg.BarnUpgradeTiers.FirstOrDefault(t => t.Tier == currentTier + 1);
        if (next is null)
        {
            return null;
        }

        return new BarnUpgradeOfferData(
            next.Tier,
            next.BonusSlots,
            next.GoldCost,
            GetBarnStorageBonus(cfg, next.Tier));
    }

    public static int GetExpansionPrice(GameConfigSnapshot cfg, int currentSize)
    {
        if (currentSize < cfg.DefaultGridSize)
        {
            currentSize = cfg.DefaultGridSize;
        }

        var step = currentSize - cfg.DefaultGridSize;
        var exponential = cfg.ExpansionBasePrice * Math.Pow(cfg.ExpansionGrowthRate, step);
        var areaTax = cfg.ExpansionAreaTaxPerStepSq * step * step;
        return Math.Max(1, (int)Math.Round(exponential + areaTax));
    }

    public static bool CanExpand(GameConfigSnapshot cfg, int currentSize) =>
        currentSize >= cfg.MinGridSize && currentSize < cfg.AbsoluteMaxGridSize;

    public static (int NextSize, int Price)? GetExpansionOffer(GameConfigSnapshot cfg, int currentSize)
    {
        if (!CanExpand(cfg, currentSize))
        {
            return null;
        }

        return (currentSize + 1, GetExpansionPrice(cfg, currentSize));
    }

    public static int EffectiveTimePercent(GameConfigSnapshot cfg)
    {
        if (cfg.ActiveEventTimePercent > 0)
        {
            return cfg.ActiveEventTimePercent;
        }

        return cfg.GlobalTimePercent;
    }

    public static int ScaleDuration(GameConfigSnapshot cfg, int baseSeconds)
    {
        if (baseSeconds <= 0)
        {
            return baseSeconds;
        }

        var pct = Math.Clamp(EffectiveTimePercent(cfg), 10, 1000);
        return Math.Max(1, (int)Math.Round(baseSeconds * 100.0 / pct));
    }

    public static int ResolveTimedSeconds(
        GameConfigSnapshot cfg,
        string catalogKind,
        int catalogId,
        int databaseSeconds) =>
        ScaleDuration(
            cfg,
            cfg.TimingOverrides.TryGetValue((catalogKind, catalogId), out var custom) && custom > 0
                ? custom
                : databaseSeconds);
}

public sealed record GameConfigSnapshot(
    int DefaultGridSize,
    int MinGridSize,
    int AbsoluteMaxGridSize,
    int ExpansionBasePrice,
    double ExpansionGrowthRate,
    int ExpansionAreaTaxPerStepSq,
    int BaseStorageCapacity,
    int StoragePerLevel,
    int MaxBankedAnimalCycles,
    int BarnFactoryTypeId,
    int StarterGold,
    int StarterDinars,
    int GlobalTimePercent,
    string? ActiveEventName,
    string? ActiveEventMessage,
    int ActiveEventTimePercent,
    IReadOnlyList<BarnUpgradeTierData> BarnUpgradeTiers,
    IReadOnlyDictionary<(string Kind, int Id), int> TimingOverrides);

public sealed record BarnUpgradeTierData(int Tier, int BonusSlots, int GoldCost);

public sealed record BarnUpgradeOfferData(int NextTier, int BonusSlots, int GoldCost, int TotalBarnBonus);
