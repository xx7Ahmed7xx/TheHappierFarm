namespace HappierFarm.Domain.Entities;

public sealed class PlayerResource
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public string ResourceCode { get; set; } = string.Empty;
    public int Quantity { get; set; }
}
