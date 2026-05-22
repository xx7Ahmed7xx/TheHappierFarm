namespace HappierFarm.Domain.Entities;

/// <summary>Optional base seconds for a catalog row before global time % is applied.</summary>
public sealed class CatalogTimingOverride
{
    /// <summary>crop | animal | factory</summary>
    public string CatalogKind { get; set; } = string.Empty;

    public int CatalogId { get; set; }

    public int BaseSeconds { get; set; }
}
