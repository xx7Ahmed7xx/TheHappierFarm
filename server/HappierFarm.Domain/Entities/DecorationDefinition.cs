namespace HappierFarm.Domain.Entities;

public sealed class DecorationDefinition
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayNameEn { get; set; } = string.Empty;
    public string DisplayNameAr { get; set; } = string.Empty;
    public int BuyPrice { get; set; }
    public int FootprintWidth { get; set; } = 1;
    public int FootprintHeight { get; set; } = 1;
    public int MaxOwned { get; set; } = 20;
    public int MaxPlaced { get; set; } = 20;

    public int MinLevelRequired { get; set; } = 1;
}
