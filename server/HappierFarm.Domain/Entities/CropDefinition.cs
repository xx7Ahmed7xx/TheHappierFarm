namespace HappierFarm.Domain.Entities;

/// <summary>Static catalog row (seeded); growth and economy are server-driven from these values.</summary>
public sealed class CropDefinition
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayNameEn { get; set; } = string.Empty;
    public string DisplayNameAr { get; set; } = string.Empty;
    public int BuyPrice { get; set; }
    /// <summary>Gold per unit when selling harvested goods from the barn.</summary>
    public int SellValue { get; set; }

    /// <summary>Quantity added to barn per ripe tile harvested.</summary>
    public int BaseYield { get; set; }

    /// <summary>Resource code stored in <c>PlayerResources</c> on harvest (e.g. barley).</summary>
    public string HarvestResourceCode { get; set; } = string.Empty;
    public int GrowthDurationSeconds { get; set; }
    public int XpReward { get; set; }

    /// <summary>Player level required to buy seeds in the shop.</summary>
    public int MinLevelRequired { get; set; } = 1;
}
