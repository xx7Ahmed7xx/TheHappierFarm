using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using HappierFarm.Infrastructure.Data;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260520140000_AddAnimalsFactories")]
public partial class AddAnimalsFactories : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AnimalDefinitions",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false),
                Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                BuyPrice = table.Column<int>(type: "int", nullable: false),
                ProductionIntervalSeconds = table.Column<int>(type: "int", nullable: false),
                ProductCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                ProductQuantity = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AnimalDefinitions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "FactoryDefinitions",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false),
                Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                BuyPrice = table.Column<int>(type: "int", nullable: false),
                InputResourceCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                InputQuantity = table.Column<int>(type: "int", nullable: false),
                OutputResourceCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                OutputQuantity = table.Column<int>(type: "int", nullable: false),
                ProcessSeconds = table.Column<int>(type: "int", nullable: false),
                SellValue = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FactoryDefinitions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "PlayerAnimals",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                AnimalTypeId = table.Column<int>(type: "int", nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false),
                LastCollectedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlayerAnimals", x => x.Id);
                table.ForeignKey(
                    name: "FK_PlayerAnimals_AnimalDefinitions_AnimalTypeId",
                    column: x => x.AnimalTypeId,
                    principalTable: "AnimalDefinitions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_PlayerAnimals_AspNetUsers_PlayerId",
                    column: x => x.PlayerId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "PlayerFactories",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FactoryTypeId = table.Column<int>(type: "int", nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false),
                LastProcessedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlayerFactories", x => x.Id);
                table.ForeignKey(
                    name: "FK_PlayerFactories_AspNetUsers_PlayerId",
                    column: x => x.PlayerId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_PlayerFactories_FactoryDefinitions_FactoryTypeId",
                    column: x => x.FactoryTypeId,
                    principalTable: "FactoryDefinitions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "PlayerResources",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ResourceCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlayerResources", x => x.Id);
                table.ForeignKey(
                    name: "FK_PlayerResources_AspNetUsers_PlayerId",
                    column: x => x.PlayerId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.Sql(
            """
            IF NOT EXISTS (SELECT 1 FROM AnimalDefinitions WHERE Id = 1)
            INSERT INTO AnimalDefinitions (Id, Name, BuyPrice, ProductionIntervalSeconds, ProductCode, ProductQuantity)
            VALUES (1, N'Happy Holstein', 150, 90, N'milk', 2);
            """);

        migrationBuilder.Sql(
            """
            IF NOT EXISTS (SELECT 1 FROM FactoryDefinitions WHERE Id = 1)
            INSERT INTO FactoryDefinitions (Id, Name, BuyPrice, InputResourceCode, InputQuantity, OutputResourceCode, OutputQuantity, ProcessSeconds, SellValue)
            VALUES (1, N'Meadow Cheese Press', 220, N'milk', 3, N'cheese', 1, 45, 80);
            """);

        migrationBuilder.CreateIndex(
            name: "IX_PlayerAnimals_AnimalTypeId",
            table: "PlayerAnimals",
            column: "AnimalTypeId");

        migrationBuilder.CreateIndex(
            name: "IX_PlayerAnimals_PlayerId_AnimalTypeId",
            table: "PlayerAnimals",
            columns: new[] { "PlayerId", "AnimalTypeId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_PlayerFactories_FactoryTypeId",
            table: "PlayerFactories",
            column: "FactoryTypeId");

        migrationBuilder.CreateIndex(
            name: "IX_PlayerFactories_PlayerId_FactoryTypeId",
            table: "PlayerFactories",
            columns: new[] { "PlayerId", "FactoryTypeId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_PlayerResources_PlayerId_ResourceCode",
            table: "PlayerResources",
            columns: new[] { "PlayerId", "ResourceCode" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "PlayerAnimals");
        migrationBuilder.DropTable(name: "PlayerFactories");
        migrationBuilder.DropTable(name: "PlayerResources");
        migrationBuilder.DropTable(name: "AnimalDefinitions");
        migrationBuilder.DropTable(name: "FactoryDefinitions");
    }
}
