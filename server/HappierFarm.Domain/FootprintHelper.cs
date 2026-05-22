using HappierFarm.Domain.Entities;

namespace HappierFarm.Domain;

public static class FootprintHelper
{
    public static IEnumerable<(int X, int Y)> Cells(int anchorX, int anchorY, int width, int height)
    {
        for (var dy = 0; dy < height; dy++)
        {
            for (var dx = 0; dx < width; dx++)
            {
                yield return (anchorX + dx, anchorY + dy);
            }
        }
    }

    public static bool Contains(FarmPlacement placement, int x, int y) =>
        x >= placement.CoordinateX
        && x < placement.CoordinateX + placement.FootprintWidth
        && y >= placement.CoordinateY
        && y < placement.CoordinateY + placement.FootprintHeight;

    public static FarmPlacement? FindCovering(IEnumerable<FarmPlacement> placements, int x, int y)
    {
        foreach (var p in placements)
        {
            if (Contains(p, x, y))
            {
                return p;
            }
        }

        return null;
    }

    public static bool FitsInGrid(int anchorX, int anchorY, int width, int height, int gridSize) =>
        anchorX >= 0
        && anchorY >= 0
        && anchorX + width <= gridSize
        && anchorY + height <= gridSize;
}
