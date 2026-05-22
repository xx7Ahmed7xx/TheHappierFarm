namespace HappierFarm.Domain.Entities;

public sealed class FactoryDefinition
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayNameEn { get; set; } = string.Empty;
    public string DisplayNameAr { get; set; } = string.Empty;
    public int BuyPrice { get; set; }
    public string InputResourceCode { get; set; } = string.Empty;
    public int InputQuantity { get; set; }
    public string OutputResourceCode { get; set; } = string.Empty;
    public int OutputQuantity { get; set; }
    public int ProcessSeconds { get; set; }
    public int SellValue { get; set; }

    public int MaxOwned { get; set; }
    public int MaxPlaced { get; set; }

    public int FootprintWidth { get; set; } = 1;
    public int FootprintHeight { get; set; } = 1;

    public int MinLevelRequired { get; set; } = 1;

    /// <summary>Storage barn on farm — click to upgrade capacity, not a processor.</summary>
    public bool IsBarn { get; set; }
}
