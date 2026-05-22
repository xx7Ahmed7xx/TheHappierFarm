using HappierFarm.Infrastructure.Data;
using HappierFarm.Infrastructure.Identity;
using HappierFarm.WebAPI.Contracts;
using HappierFarm.WebAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HappierFarm.WebAPI;

public static class AuthApiExtensions
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var auth = routes.MapGroup("/api/auth");

        auth.MapPost(
                "/register",
                async (
                    RegisterRequest body,
                    UserManager<ApplicationUser> users,
                    FarmService farm,
                    GameConfigService gameConfig,
                    DisplayNameService names,
                    JwtTokenService jwt,
                    CancellationToken ct) =>
                {
                    if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                    {
                        return Results.BadRequest(new { error = "Email and password are required." });
                    }

                    var email = body.Email.Trim();
                    if (!email.Contains('@', StringComparison.Ordinal))
                    {
                        return Results.BadRequest(new { error = "Invalid email address." });
                    }

                    var nameError = names.ValidateForNewAccount(body.DisplayName);
                    if (nameError is not null)
                    {
                        return Results.BadRequest(new { error = nameError });
                    }

                    if (await names.IsTakenAsync(body.DisplayName, ct: ct))
                    {
                        return Results.Conflict(new { error = "That display name is already taken. Pick another." });
                    }

                    await gameConfig.EnsureLoadedAsync(ct);

                    var user = new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
                        UserName = email,
                        Email = email,
                        EmailConfirmed = true,
                        GoldCoins = gameConfig.StarterGold,
                        Dinars = gameConfig.StarterDinars,
                        ExperiencePoints = 0,
                        Level = 1,
                        CreatedAt = DateTimeOffset.UtcNow,
                    };
                    names.ApplyDisplayName(user, body.DisplayName);

                    var result = await users.CreateAsync(user, body.Password);
                    if (!result.Succeeded)
                    {
                        return Results.BadRequest(new
                        {
                            errors = result.Errors.Select(e => e.Description).ToArray(),
                        });
                    }

                    await farm.EnsureFarmTilesAsync(user.Id, ct);
                    return Results.Ok(jwt.CreateAuthResponse(user));
                })
            .AllowAnonymous()
            .WithName("Register");

        auth.MapPost(
                "/login",
                async (LoginRequest body, UserManager<ApplicationUser> users, JwtTokenService jwt, CancellationToken ct) =>
                {
                    var email = body.Email?.Trim();
                    if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(body.Password))
                    {
                        return Results.BadRequest(new { error = "Email and password are required." });
                    }

                    var user = await users.FindByEmailAsync(email);
                    if (user is null || !await users.CheckPasswordAsync(user, body.Password))
                    {
                        return Results.Json(new { error = "Invalid email or password." }, statusCode: StatusCodes.Status401Unauthorized);
                    }

                    return Results.Ok(jwt.CreateAuthResponse(user));
                })
            .AllowAnonymous()
            .WithName("Login");

        auth.MapGet(
                "/me",
                async (HttpContext http, AppDbContext db, CancellationToken ct) =>
                {
                    var userId = http.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    if (!Guid.TryParse(userId, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
                    if (user is null)
                    {
                        return Results.NotFound(new { error = "User not found." });
                    }

                    return Results.Ok(new PlayerProfileDto(
                        user.Id,
                        user.Email ?? string.Empty,
                        DisplayNameService.ResolveDisplayName(user),
                        user.GoldCoins,
                        user.Level));
                })
            .RequireAuthorization()
            .WithName("GetProfile");
    }
}

public sealed record PlayerProfileDto(
    Guid UserId,
    string Email,
    string DisplayName,
    int GoldCoins,
    int Level);
