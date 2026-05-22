using HappierFarm.Infrastructure.Data;
using HappierFarm.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace HappierFarm.WebAPI.Services;

public sealed class DisplayNameService(AppDbContext db)
{
    public const int MinLength = 2;
    public const int MaxLength = 128;

    public static string Normalize(string displayName) =>
        displayName.Trim().ToLowerInvariant();

    public string? ValidateForNewAccount(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            return "Display name is required.";
        }

        var trimmed = displayName.Trim();
        if (trimmed.Length < MinLength || trimmed.Length > MaxLength)
        {
            return $"Display name must be {MinLength}–{MaxLength} characters.";
        }

        if (trimmed.Any(c => char.IsControl(c)))
        {
            return "Display name contains invalid characters.";
        }

        return null;
    }

    public async Task<bool> IsTakenAsync(string displayName, Guid? excludeUserId = null, CancellationToken ct = default)
    {
        var normalized = Normalize(displayName);
        var query = db.Users.AsNoTracking().Where(u => u.DisplayNameNormalized == normalized);
        if (excludeUserId is Guid id)
        {
            query = query.Where(u => u.Id != id);
        }

        return await query.AnyAsync(ct);
    }

    public void ApplyDisplayName(ApplicationUser user, string displayName)
    {
        var trimmed = displayName.Trim();
        user.DisplayName = trimmed;
        user.DisplayNameNormalized = Normalize(trimmed);
    }

    public static string ResolveDisplayName(ApplicationUser user) =>
        string.IsNullOrWhiteSpace(user.DisplayName) ? "Farmer" : user.DisplayName.Trim();
}
