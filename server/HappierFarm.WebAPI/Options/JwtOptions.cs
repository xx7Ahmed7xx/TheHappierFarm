namespace HappierFarm.WebAPI.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "HappierFarm";
    public string Audience { get; set; } = "HappierFarmClient";

    /// <summary>Symmetric signing secret (UTF-8). Use a long random string in production.</summary>
    public string SigningKey { get; set; } = "";

    public int AccessTokenMinutes { get; set; } = 20160;
}
