using HappierFarm.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations;

/// <summary>Production-paced timers, prices, level gates, and catalog timing overrides.</summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260522120000_ProductionEconomyBalance")]
public partial class ProductionEconomyBalance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE CropDefinitions SET
                BuyPrice = 8, SellValue = 18, GrowthDurationSeconds = 1800, XpReward = 5, MinLevelRequired = 1
                WHERE Id = 1;
            UPDATE CropDefinitions SET
                BuyPrice = 15, SellValue = 35, GrowthDurationSeconds = 2700, XpReward = 12, MinLevelRequired = 2
                WHERE Id = 2;
            UPDATE CropDefinitions SET
                BuyPrice = 12, SellValue = 28, GrowthDurationSeconds = 2400, XpReward = 8, MinLevelRequired = 2
                WHERE Id = 3;
            UPDATE CropDefinitions SET
                BuyPrice = 30, SellValue = 65, GrowthDurationSeconds = 7200, XpReward = 18, MinLevelRequired = 4
                WHERE Id = 4;
            UPDATE CropDefinitions SET
                BuyPrice = 45, SellValue = 110, GrowthDurationSeconds = 14400, XpReward = 28, MinLevelRequired = 6
                WHERE Id = 5;

            UPDATE AnimalDefinitions SET
                BuyPrice = 250, ProductionIntervalSeconds = 2700, FeedResourceCode = N'wheat', FeedQuantity = 2,
                ProductQuantity = 2, MinLevelRequired = 3
                WHERE Id = 1;
            UPDATE AnimalDefinitions SET
                BuyPrice = 200, ProductionIntervalSeconds = 3600, FeedResourceCode = N'barley', FeedQuantity = 2,
                ProductQuantity = 2, MinLevelRequired = 4
                WHERE Id = 2;
            UPDATE AnimalDefinitions SET
                BuyPrice = 60, ProductionIntervalSeconds = 1200, FeedResourceCode = N'carrot', FeedQuantity = 1,
                ProductQuantity = 3, MinLevelRequired = 2
                WHERE Id = 3;

            UPDATE FactoryDefinitions SET BuyPrice = 220, ProcessSeconds = 1800, MinLevelRequired = 4 WHERE Id = 1;
            UPDATE FactoryDefinitions SET BuyPrice = 350, ProcessSeconds = 0, MinLevelRequired = 3 WHERE Id = 2;
            UPDATE FactoryDefinitions SET BuyPrice = 200, ProcessSeconds = 2400, MinLevelRequired = 5 WHERE Id = 3;
            UPDATE FactoryDefinitions SET BuyPrice = 280, ProcessSeconds = 3000, MinLevelRequired = 6 WHERE Id = 4;

            UPDATE DecorationDefinitions SET MinLevelRequired = 2 WHERE Id = 1;
            UPDATE DecorationDefinitions SET MinLevelRequired = 3 WHERE Id = 2;
            UPDATE DecorationDefinitions SET MinLevelRequired = 5 WHERE Id = 3;

            UPDATE ResourceDefinitions SET SellValue = 18 WHERE Code = N'barley';
            UPDATE ResourceDefinitions SET SellValue = 35 WHERE Code = N'carrot';
            UPDATE ResourceDefinitions SET SellValue = 28 WHERE Code = N'wheat';
            UPDATE ResourceDefinitions SET SellValue = 65 WHERE Code = N'tomato';
            UPDATE ResourceDefinitions SET SellValue = 110 WHERE Code = N'pumpkin';
            UPDATE ResourceDefinitions SET SellValue = 14 WHERE Code = N'milk';
            UPDATE ResourceDefinitions SET SellValue = 10 WHERE Code = N'egg';
            UPDATE ResourceDefinitions SET SellValue = 20 WHERE Code = N'wool';
            UPDATE ResourceDefinitions SET SellValue = 85 WHERE Code = N'cheese';
            UPDATE ResourceDefinitions SET SellValue = 48 WHERE Code = N'yarn';
            UPDATE ResourceDefinitions SET SellValue = 58 WHERE Code = N'bread';

            UPDATE GameSettings SET GlobalTimePercent = 100, StarterGold = 100, StarterDinars = 100 WHERE Id = 1;

            DELETE FROM CatalogTimingOverrides;

            INSERT INTO CatalogTimingOverrides (CatalogKind, CatalogId, BaseSeconds) VALUES
            (N'crop', 1, 1800),
            (N'crop', 2, 2700),
            (N'crop', 3, 2400),
            (N'crop', 4, 7200),
            (N'crop', 5, 14400),
            (N'animal', 1, 2700),
            (N'animal', 2, 3600),
            (N'animal', 3, 1200),
            (N'factory', 1, 1800),
            (N'factory', 3, 2400),
            (N'factory', 4, 3000);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally no-op: prior balance was playtest-fast; restore from backup if needed.
    }
}
