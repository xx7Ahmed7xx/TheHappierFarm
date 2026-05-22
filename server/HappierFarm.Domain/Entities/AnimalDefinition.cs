namespace HappierFarm.Domain.Entities;

public sealed class AnimalDefinition
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayNameEn { get; set; } = string.Empty;
    public string DisplayNameAr { get; set; } = string.Empty;
    public int BuyPrice { get; set; }
    public int ProductionIntervalSeconds { get; set; }

    /// <summary>Harvested crop/resource code consumed from the barn each production cycle.</summary>
    public string FeedResourceCode { get; set; } = string.Empty;

    public int FeedQuantity { get; set; } = 1;

    public string ProductCode { get; set; } = string.Empty;
    public int ProductQuantity { get; set; }

    /// <summary>Max total owned (stash + placed on farm).</summary>
    public int MaxOwned { get; set; }

    /// <summary>Max simultaneously placed on tiles (cannot exceed <see cref="MaxOwned"/>).</summary>
    public int MaxPlaced { get; set; }

    public int FootprintWidth { get; set; } = 1;
    public int FootprintHeight { get; set; } = 1;

    public int MinLevelRequired { get; set; } = 1;
}
