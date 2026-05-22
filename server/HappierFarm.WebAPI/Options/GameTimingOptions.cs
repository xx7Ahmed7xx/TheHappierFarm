namespace HappierFarm.WebAPI.Options;

/// <summary>
/// Global pacing for crops, animals, and factories. 100% = catalog/base speed;
/// lower % = slower (longer timers); higher % = faster (shorter timers).
/// </summary>
public sealed class GameTimingOptions
{
    public const string SectionName = "GameTiming";

    /// <summary>Default pacing when no event override is active (10–1000).</summary>
    public int GlobalTimePercent { get; set; } = 100;

    /// <summary>Premium currency granted on new account registration.</summary>
    public int StarterDinars { get; set; } = 100;

    /// <summary>Optional per-crop base seconds before <see cref="GlobalTimePercent"/> is applied.</summary>
    public Dictionary<int, int> CropGrowthSecondsById { get; set; } = new();

    /// <summary>Optional per-animal base production interval seconds (before global %).</summary>
    public Dictionary<int, int> AnimalIntervalSecondsById { get; set; } = new();

    /// <summary>Optional per-factory base process seconds (before global %).</summary>
    public Dictionary<int, int> FactoryProcessSecondsById { get; set; } = new();

    /// <summary>When set, overrides <see cref="GlobalTimePercent"/> and can surface a message to all players.</summary>
    public GameTimingEventOptions? ActiveEvent { get; set; }
}

public sealed class GameTimingEventOptions
{
    public string? Name { get; set; }
    public string? Message { get; set; }

    /// <summary>Event pacing override (e.g. 150 = 1.5× faster growth).</summary>
    public int TimePercent { get; set; } = 100;
}
