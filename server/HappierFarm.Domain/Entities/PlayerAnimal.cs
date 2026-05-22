namespace HappierFarm.Domain.Entities;

public sealed class PlayerAnimal
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public int AnimalTypeId { get; set; }
    public AnimalDefinition AnimalType { get; set; } = null!;
    /// <summary>Unplaced units in inventory (place on a tile to use).</summary>
    public int Quantity { get; set; }
    public DateTimeOffset? LastCollectedUtc { get; set; }
}
