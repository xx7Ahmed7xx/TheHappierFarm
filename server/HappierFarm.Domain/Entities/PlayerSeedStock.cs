namespace HappierFarm.Domain.Entities;

public sealed class PlayerSeedStock
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }

    public int CropTypeId { get; set; }
    public CropDefinition CropType { get; set; } = null!;

    public int Quantity { get; set; }
}
