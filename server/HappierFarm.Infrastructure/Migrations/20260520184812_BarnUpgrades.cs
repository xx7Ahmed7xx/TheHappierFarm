using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BarnUpgrades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBarn",
                table: "FactoryDefinitions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "BarnUpgradeTier",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                column: "IsBarn",
                value: false);

            migrationBuilder.InsertData(
                table: "FactoryDefinitions",
                columns: new[] { "Id", "BuyPrice", "FootprintHeight", "FootprintWidth", "InputQuantity", "InputResourceCode", "IsBarn", "MaxOwned", "MaxPlaced", "MinLevelRequired", "Name", "OutputQuantity", "OutputResourceCode", "ProcessSeconds", "SellValue" },
                values: new object[] { 2, 350, 2, 2, 0, "milk", true, 1, 1, 3, "Hearty Barn", 0, "milk", 0, 0 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DropColumn(
                name: "IsBarn",
                table: "FactoryDefinitions");

            migrationBuilder.DropColumn(
                name: "BarnUpgradeTier",
                table: "AspNetUsers");
        }
    }
}
