namespace HappierFarm.Domain.Entities;

public sealed class PlayerFactory
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public int FactoryTypeId { get; set; }
    public FactoryDefinition FactoryType { get; set; } = null!;
    public int Quantity { get; set; }
    public DateTimeOffset? LastProcessedUtc { get; set; }
}
