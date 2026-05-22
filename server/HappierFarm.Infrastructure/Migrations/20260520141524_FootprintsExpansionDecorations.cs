using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HappierFarm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FootprintsExpansionDecorations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FootprintHeight",
                table: "FarmPlacements",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "FootprintWidth",
                table: "FarmPlacements",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "FootprintHeight",
                table: "FactoryDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "FootprintWidth",
                table: "FactoryDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "FarmGridSize",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 9);

            migrationBuilder.AddColumn<int>(
                name: "FootprintHeight",
                table: "AnimalDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "FootprintWidth",
                table: "AnimalDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "DecorationDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    BuyPrice = table.Column<int>(type: "int", nullable: false),
                    FootprintWidth = table.Column<int>(type: "int", nullable: false),
                    FootprintHeight = table.Column<int>(type: "int", nullable: false),
                    MaxOwned = table.Column<int>(type: "int", nullable: false),
                    MaxPlaced = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DecorationDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlayerDecorations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DecorationTypeId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerDecorations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerDecorations_AspNetUsers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerDecorations_DecorationDefinitions_DecorationTypeId",
                        column: x => x.DecorationTypeId,
                        principalTable: "DecorationDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FootprintHeight", "FootprintWidth" },
                values: new object[] { 1, 2 });

            migrationBuilder.InsertData(
                table: "DecorationDefinitions",
                columns: new[] { "Id", "BuyPrice", "FootprintHeight", "FootprintWidth", "MaxOwned", "MaxPlaced", "Name" },
                values: new object[,]
                {
                    { 1, 35, 1, 1, 30, 30, "Sunflower Patch" },
                    { 2, 60, 1, 2, 20, 20, "Wooden Fence" },
                    { 3, 45, 1, 1, 30, 30, "Cozy Hay Bale" }
                });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FootprintHeight", "FootprintWidth" },
                values: new object[] { 2, 2 });

            migrationBuilder.Sql(
                """
                UPDATE FarmPlacements SET FootprintWidth = 2, FootprintHeight = 1
                  WHERE Kind = 'animal' AND TypeId = 1;
                UPDATE FarmPlacements SET FootprintWidth = 2, FootprintHeight = 2
                  WHERE Kind = 'factory' AND TypeId = 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerDecorations_DecorationTypeId",
                table: "PlayerDecorations",
                column: "DecorationTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerDecorations_PlayerId_DecorationTypeId",
                table: "PlayerDecorations",
                columns: new[] { "PlayerId", "DecorationTypeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlayerDecorations");

            migrationBuilder.DropTable(
                name: "DecorationDefinitions");

            migrationBuilder.DropColumn(
                name: "FootprintHeight",
                table: "FarmPlacements");

            migrationBuilder.DropColumn(
                name: "FootprintWidth",
                table: "FarmPlacements");

            migrationBuilder.DropColumn(
                name: "FootprintHeight",
                table: "FactoryDefinitions");

            migrationBuilder.DropColumn(
                name: "FootprintWidth",
                table: "FactoryDefinitions");

            migrationBuilder.DropColumn(
                name: "FarmGridSize",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "FootprintHeight",
                table: "AnimalDefinitions");

            migrationBuilder.DropColumn(
                name: "FootprintWidth",
                table: "AnimalDefinitions");

        }
    }
}
