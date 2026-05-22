using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class V1PolishStorageLevelUnlocks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MinLevelRequired",
                table: "FactoryDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinLevelRequired",
                table: "DecorationDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinLevelRequired",
                table: "CropDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinLevelRequired",
                table: "AnimalDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                column: "MinLevelRequired",
                value: 3);

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                column: "MinLevelRequired",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                column: "MinLevelRequired",
                value: 2);

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                column: "MinLevelRequired",
                value: 2);

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                column: "MinLevelRequired",
                value: 3);

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                column: "MinLevelRequired",
                value: 5);

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                column: "MinLevelRequired",
                value: 4);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MinLevelRequired",
                table: "FactoryDefinitions");

            migrationBuilder.DropColumn(
                name: "MinLevelRequired",
                table: "DecorationDefinitions");

            migrationBuilder.DropColumn(
                name: "MinLevelRequired",
                table: "CropDefinitions");

            migrationBuilder.DropColumn(
                name: "MinLevelRequired",
                table: "AnimalDefinitions");
        }
    }
}
