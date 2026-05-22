namespace HappierFarm.Domain.Entities;

/// <summary>
/// Barn resource economy (sell price per unit). Admin/catalog edits this table;
/// crop/factory rows reference the same codes.
/// </summary>
public sealed class ResourceDefinition
{
    public string Code { get; set; } = string.Empty;

    public string DisplayNameEn { get; set; } = string.Empty;
    public string DisplayNameAr { get; set; } = string.Empty;

    public int SellValue { get; set; }

    /// <summary>crop | animal_product | factory_product</summary>
    public string Category { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsEnabled { get; set; } = true;
}
