using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HappierFarm.WebAPI.Hubs;

[Authorize]
public sealed class FarmHub : Hub
{
    public static string FarmGroupName(Guid farmOwnerId) => $"farm:{farmOwnerId:D}";

    /// <summary>Subscribe to live farm updates (plant/harvest/etc.) for this owner&apos;s grid.</summary>
    public Task JoinFarm(string farmOwnerId)
    {
        if (!Guid.TryParse(farmOwnerId, out var id))
        {
            throw new HubException("Invalid farm owner id.");
        }

        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var callerId) || callerId != id)
        {
            throw new HubException("You can only subscribe to your own farm channel (for now).");
        }

        return Groups.AddToGroupAsync(Context.ConnectionId, FarmGroupName(id));
    }

    public Task LeaveFarm(string farmOwnerId)
    {
        if (!Guid.TryParse(farmOwnerId, out var id))
        {
            return Task.CompletedTask;
        }

        return Groups.RemoveFromGroupAsync(Context.ConnectionId, FarmGroupName(id));
    }
}
