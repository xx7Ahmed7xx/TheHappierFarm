namespace HappierFarm.WebAPI.Contracts;

public sealed record RegisterRequest(string Email, string Password, string DisplayName);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponseDto(
    Guid UserId,
    string Email,
    string DisplayName,
    int GoldCoins,
    int Level,
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc);

public sealed record BuySeedRequest(int CropTypeId, int Quantity);

public sealed record PlantRequest(int X, int Y, int CropTypeId);

public sealed record HarvestRequest(int X, int Y);

public sealed record TileCoordRequest(int X, int Y);

public sealed record PlantBatchRequest(int CropTypeId, IReadOnlyList<TileCoordRequest> Tiles);

public sealed record HarvestBatchRequest(IReadOnlyList<TileCoordRequest> Tiles);

public sealed record BuyAnimalRequest(int AnimalTypeId, int Quantity);

public sealed record BuyFactoryRequest(int FactoryTypeId, int Quantity);

public sealed record BuyDecorationRequest(int DecorationTypeId, int Quantity);

public sealed record ProcessFactoryRequest(int FactoryTypeId, int X, int Y, int BatchRuns = 1);

public sealed record CollectAnimalRequest(int AnimalTypeId, int X, int Y);

public sealed record FeedAnimalRequest(int AnimalTypeId, int X, int Y);

public sealed record PlaceItemRequest(string Kind, int TypeId, int X, int Y);

public sealed record SellResourceRequest(string ResourceCode, int Quantity);
