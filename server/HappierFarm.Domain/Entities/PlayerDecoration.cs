namespace HappierFarm.Domain.Entities;

public sealed class PlayerDecoration
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public int DecorationTypeId { get; set; }
    public int Quantity { get; set; }

    public DecorationDefinition? DecorationType { get; set; }
}
