using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HappierFarm.Infrastructure.Identity;
using HappierFarm.WebAPI.Contracts;
using HappierFarm.WebAPI.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HappierFarm.WebAPI.Services;

public sealed class JwtTokenService(IOptions<JwtOptions> options)
{
    public AuthResponseDto CreateAuthResponse(ApplicationUser user)
    {
        var token = CreateAccessToken(user);
        return new AuthResponseDto(
            user.Id,
            user.Email ?? user.UserName ?? string.Empty,
            DisplayNameService.ResolveDisplayName(user),
            user.GoldCoins,
            user.Level,
            token.Token,
            token.ExpiresAtUtc);
    }

    private (string Token, DateTimeOffset ExpiresAtUtc) CreateAccessToken(ApplicationUser user)
    {
        var jwt = options.Value;
        var keyBytes = Encoding.UTF8.GetBytes(jwt.SigningKey);
        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:SigningKey must be at least 32 UTF-8 bytes (configure in appsettings or user secrets).");
        }

        var signingKey = new SymmetricSecurityKey(keyBytes);
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var expires = DateTimeOffset.UtcNow.AddMinutes(jwt.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, DisplayNameService.ResolveDisplayName(user)),
        };

        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: expires.UtcDateTime,
            signingCredentials: credentials);

        var handler = new JwtSecurityTokenHandler();
        return (handler.WriteToken(token), expires);
    }
}
