using HappierFarm.Domain;
using Microsoft.AspNetCore.Identity;

namespace HappierFarm.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public int GoldCoins { get; set; }

    /// <summary>Premium currency (دنانير / Dinars) — monetization & events later.</summary>
    public int Dinars { get; set; }

    public int ExperiencePoints { get; set; }
    public int Level { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Farmer name shown in UI (unique, case-insensitive).</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Lowercase trimmed form used for uniqueness checks.</summary>
    public string DisplayNameNormalized { get; set; } = string.Empty;

    /// <summary>Side length of the square farm grid (9–12).</summary>
    public int FarmGridSize { get; set; } = FarmConstants.DefaultGridSize;

    /// <summary>Purchased barn storage upgrades (0–<see cref="FarmProgression.MaxBarnUpgradeTier"/>).</summary>
    public int BarnUpgradeTier { get; set; }
}
