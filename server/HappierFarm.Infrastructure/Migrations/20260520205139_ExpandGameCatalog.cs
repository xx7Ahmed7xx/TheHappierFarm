using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HappierFarm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandGameCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AnimalDefinitions",
                columns: new[] { "Id", "BuyPrice", "FootprintHeight", "FootprintWidth", "MaxOwned", "MaxPlaced", "MinLevelRequired", "Name", "ProductCode", "ProductQuantity", "ProductionIntervalSeconds" },
                values: new object[,]
                {
                    { 2, 120, 1, 1, 4, 4, 4, "Woolly Sheep", "wool", 2, 120 },
                    { 3, 80, 1, 1, 6, 6, 2, "Clucking Hen", "egg", 3, 60 }
                });

            migrationBuilder.InsertData(
                table: "CropDefinitions",
                columns: new[] { "Id", "BaseYield", "BuyPrice", "GrowthDurationSeconds", "HarvestResourceCode", "MinLevelRequired", "Name", "SellValue", "XpReward" },
                values: new object[,]
                {
                    { 3, 1, 15, 90, "wheat", 2, "Golden Wheat", 38, 8 },
                    { 4, 1, 35, 180, "tomato", 4, "Vine Tomato", 72, 18 },
                    { 5, 1, 50, 300, "pumpkin", 6, "Autumn Pumpkin", 120, 28 }
                });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "InputResourceCode", "OutputResourceCode" },
                values: new object[] { "none", "none" });

            migrationBuilder.InsertData(
                table: "FactoryDefinitions",
                columns: new[] { "Id", "BuyPrice", "FootprintHeight", "FootprintWidth", "InputQuantity", "InputResourceCode", "IsBarn", "MaxOwned", "MaxPlaced", "MinLevelRequired", "Name", "OutputQuantity", "OutputResourceCode", "ProcessSeconds", "SellValue" },
                values: new object[,]
                {
                    { 3, 200, 2, 2, 2, "wool", false, 2, 2, 5, "Wool Spinner", 1, "yarn", 60, 45 },
                    { 4, 280, 2, 2, 3, "wheat", false, 2, 2, 6, "Village Bakery", 1, "bread", 75, 55 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "InputResourceCode", "OutputResourceCode" },
                values: new object[] { "milk", "milk" });
        }
    }
}
