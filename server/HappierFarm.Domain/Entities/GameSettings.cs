namespace HappierFarm.Domain.Entities;

/// <summary>Singleton row (Id = 1) — global economy and pacing for admin edits.</summary>
public sealed class GameSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    public int DefaultGridSize { get; set; } = 9;
    public int MinGridSize { get; set; } = 9;
    public int AbsoluteMaxGridSize { get; set; } = 999;

    public int ExpansionBasePrice { get; set; } = 450;
    public double ExpansionGrowthRate { get; set; } = 2.08;
    public int ExpansionAreaTaxPerStepSq { get; set; } = 25;

    public int BaseStorageCapacity { get; set; } = 50;
    public int StoragePerLevel { get; set; } = 10;
    public int MaxBankedAnimalCycles { get; set; } = 30;
    public int BarnFactoryTypeId { get; set; } = 2;

    public int StarterGold { get; set; } = 100;
    public int StarterDinars { get; set; } = 100;

    public int GlobalTimePercent { get; set; } = 100;
    public string? ActiveEventName { get; set; }
    public string? ActiveEventMessage { get; set; }

    /// <summary>When &gt; 0, overrides <see cref="GlobalTimePercent"/> for event pacing.</summary>
    public int ActiveEventTimePercent { get; set; }
}
