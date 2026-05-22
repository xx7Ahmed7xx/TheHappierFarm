namespace HappierFarm.Domain.Entities;

/// <summary>An animal, factory, or decoration fixed to a farm tile until picked up to stash.</summary>
public sealed class FarmPlacement
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public int CoordinateX { get; set; }
    public int CoordinateY { get; set; }

    /// <summary><see cref="PlacementKinds"/> value.</summary>
    public string Kind { get; set; } = string.Empty;

    /// <summary>AnimalTypeId, FactoryTypeId, or future DecorationTypeId.</summary>
    public int TypeId { get; set; }

    /// <summary>Per-placement production timer (collect / process).</summary>
    public DateTimeOffset? LastActionUtc { get; set; }

    /// <summary>Factory only: output multiplier when the current run completes (inputs consumed at start).</summary>
    public int BatchRuns { get; set; } = 1;

    public int FootprintWidth { get; set; } = 1;
    public int FootprintHeight { get; set; } = 1;
}
