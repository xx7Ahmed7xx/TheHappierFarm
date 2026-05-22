using HappierFarm.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260521180000_AddAnimalFeed")]
public partial class AddAnimalFeed : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "FeedResourceCode",
            table: "AnimalDefinitions",
            type: "nvarchar(32)",
            maxLength: 32,
            nullable: false,
            defaultValue: "wheat");

        migrationBuilder.AddColumn<int>(
            name: "FeedQuantity",
            table: "AnimalDefinitions",
            type: "int",
            nullable: false,
            defaultValue: 1);

        migrationBuilder.Sql(
            """
            UPDATE AnimalDefinitions SET FeedResourceCode = N'wheat', FeedQuantity = 2 WHERE Id = 1;
            UPDATE AnimalDefinitions SET FeedResourceCode = N'barley', FeedQuantity = 2 WHERE Id = 2;
            UPDATE AnimalDefinitions SET FeedResourceCode = N'carrot', FeedQuantity = 1 WHERE Id = 3;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "FeedResourceCode", table: "AnimalDefinitions");
        migrationBuilder.DropColumn(name: "FeedQuantity", table: "AnimalDefinitions");
    }
}
