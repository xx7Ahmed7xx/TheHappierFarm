using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using HappierFarm.Infrastructure.Data;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260520180000_AddFarmPlacementsAndCaps")]
public partial class AddFarmPlacementsAndCaps : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "MaxOwned",
            table: "AnimalDefinitions",
            type: "int",
            nullable: false,
            defaultValue: 4);

        migrationBuilder.AddColumn<int>(
            name: "MaxPlaced",
            table: "AnimalDefinitions",
            type: "int",
            nullable: false,
            defaultValue: 4);

        migrationBuilder.AddColumn<int>(
            name: "MaxOwned",
            table: "FactoryDefinitions",
            type: "int",
            nullable: false,
            defaultValue: 2);

        migrationBuilder.AddColumn<int>(
            name: "MaxPlaced",
            table: "FactoryDefinitions",
            type: "int",
            nullable: false,
            defaultValue: 2);

        migrationBuilder.Sql(
            """
            UPDATE AnimalDefinitions SET MaxOwned = 4, MaxPlaced = 4 WHERE Id = 1;
            UPDATE FactoryDefinitions SET MaxOwned = 2, MaxPlaced = 2 WHERE Id = 1;
            """);

        migrationBuilder.CreateTable(
            name: "FarmPlacements",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CoordinateX = table.Column<int>(type: "int", nullable: false),
                CoordinateY = table.Column<int>(type: "int", nullable: false),
                Kind = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                TypeId = table.Column<int>(type: "int", nullable: false),
                LastActionUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FarmPlacements", x => x.Id);
                table.ForeignKey(
                    name: "FK_FarmPlacements_AspNetUsers_PlayerId",
                    column: x => x.PlayerId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_FarmPlacements_PlayerId_CoordinateX_CoordinateY",
            table: "FarmPlacements",
            columns: new[] { "PlayerId", "CoordinateX", "CoordinateY" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "FarmPlacements");

        migrationBuilder.DropColumn(name: "MaxOwned", table: "AnimalDefinitions");
        migrationBuilder.DropColumn(name: "MaxPlaced", table: "AnimalDefinitions");
        migrationBuilder.DropColumn(name: "MaxOwned", table: "FactoryDefinitions");
        migrationBuilder.DropColumn(name: "MaxPlaced", table: "FactoryDefinitions");
    }
}
