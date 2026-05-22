using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using HappierFarm.WebAPI.Contracts;
using HappierFarm.WebAPI.Services;

namespace HappierFarm.WebAPI;

public static class FarmApiExtensions
{
    public static void MapFarmEndpoints(this IEndpointRouteBuilder routes)
    {
        var secured = routes.MapGroup("/api").RequireAuthorization();

        secured.MapGet(
                "/farm",
                async (ClaimsPrincipal user, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var snap = await farm.GetFarmSnapshotAsync(id, ct);
                        return Results.Ok(snap);
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(new { error = ex.Message });
                    }
                })
            .WithName("GetFarm");

        secured.MapPost(
                "/shop/buy-seeds",
                async (ClaimsPrincipal user, BuySeedRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.BuySeedsAsync(id, body.CropTypeId, body.Quantity, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("BuySeeds");

        secured.MapPost(
                "/farm/plant",
                async (ClaimsPrincipal user, PlantRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.PlantAsync(id, body.X, body.Y, body.CropTypeId, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("PlantCrop");

        secured.MapPost(
                "/farm/harvest",
                async (ClaimsPrincipal user, HarvestRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.HarvestAsync(id, body.X, body.Y, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("HarvestCrop");

        secured.MapPost(
                "/farm/plant-batch",
                async (ClaimsPrincipal user, PlantBatchRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var tiles = body.Tiles.Select(t => (t.X, t.Y)).ToList();
                        var result = await farm.PlantBatchAsync(id, body.CropTypeId, tiles, ct);
                        return Results.Ok(result);
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("PlantBatch");

        secured.MapPost(
                "/farm/harvest-batch",
                async (ClaimsPrincipal user, HarvestBatchRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var tiles = body.Tiles.Select(t => (t.X, t.Y)).ToList();
                        var result = await farm.HarvestBatchAsync(id, tiles, ct);
                        return Results.Ok(result);
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("HarvestBatch");

        secured.MapPost(
                "/farm/place",
                async (ClaimsPrincipal user, PlaceItemRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.PlaceItemAsync(id, body.Kind, body.TypeId, body.X, body.Y, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("PlaceItem");

        secured.MapPost(
                "/farm/pickup",
                async (ClaimsPrincipal user, TileCoordRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.PickupItemAsync(id, body.X, body.Y, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("PickupItem");

        secured.MapPost(
                "/shop/buy-animal",
                async (ClaimsPrincipal user, BuyAnimalRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.BuyAnimalAsync(id, body.AnimalTypeId, body.Quantity, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("BuyAnimal");

        secured.MapPost(
                "/shop/buy-expansion",
                async (ClaimsPrincipal user, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.BuyFarmExpansionAsync(id, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("BuyFarmExpansion");

        secured.MapPost(
                "/shop/buy-decoration",
                async (ClaimsPrincipal user, BuyDecorationRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.BuyDecorationAsync(id, body.DecorationTypeId, body.Quantity, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("BuyDecoration");

        secured.MapPost(
                "/shop/buy-factory",
                async (ClaimsPrincipal user, BuyFactoryRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.BuyFactoryAsync(id, body.FactoryTypeId, body.Quantity, ct);
                        return Results.Ok(new { ok = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("BuyFactory");

        secured.MapPost(
                "/barn/upgrade",
                async (ClaimsPrincipal user, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var capacity = await farm.UpgradeBarnAsync(id, ct);
                        return Results.Ok(new { storageCapacity = capacity });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("UpgradeBarn");

        secured.MapPost(
                "/barn/collect-animals",
                async (ClaimsPrincipal user, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var produced = await farm.CollectAnimalsAsync(id, ct);
                        return Results.Ok(new { produced });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("CollectAnimals");

        secured.MapPost(
                "/barn/collect-animal",
                async (ClaimsPrincipal user, CollectAnimalRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var produced = await farm.CollectAnimalAtAsync(
                            id,
                            body.AnimalTypeId,
                            body.X,
                            body.Y,
                            ct);
                        return Results.Ok(new { produced });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("CollectAnimal");

        secured.MapPost(
                "/barn/feed-animal",
                async (ClaimsPrincipal user, FeedAnimalRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        await farm.FeedAnimalAtAsync(id, body.AnimalTypeId, body.X, body.Y, ct);
                        return Results.Ok(new { fed = true });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("FeedAnimal");

        secured.MapPost(
                "/barn/process-factory",
                async (ClaimsPrincipal user, ProcessFactoryRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var produced = await farm.ProcessFactoryAsync(
                            id,
                            body.FactoryTypeId,
                            body.X,
                            body.Y,
                            body.BatchRuns,
                            ct);
                        return Results.Ok(new { produced });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("ProcessFactory");

        secured.MapPost(
                "/barn/collect-factories",
                async (ClaimsPrincipal user, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var produced = await farm.CollectFactoriesAsync(id, ct);
                        return Results.Ok(new { produced });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("CollectFactories");

        secured.MapPost(
                "/barn/sell-resource",
                async (ClaimsPrincipal user, SellResourceRequest body, FarmService farm, CancellationToken ct) =>
                {
                    if (!TryGetUserId(user, out var id))
                    {
                        return Results.Unauthorized();
                    }

                    try
                    {
                        var gold = await farm.SellResourceAsync(id, body.ResourceCode, body.Quantity, ct);
                        return Results.Ok(new { goldEarned = gold });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("SellResource");
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out Guid id)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(sub, out id);
    }
}
