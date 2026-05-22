namespace HappierFarm.Domain.Entities;

public sealed class FarmTile
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }

    public int CoordinateX { get; set; }
    public int CoordinateY { get; set; }

    /// <summary>Planted crop type, or null when tile is empty.</summary>
    public int? CropTypeId { get; set; }
    public CropDefinition? CropType { get; set; }

    /// <summary>UTC moment the current crop was planted; null when empty.</summary>
    public DateTimeOffset? PlantedAtUtc { get; set; }
}
