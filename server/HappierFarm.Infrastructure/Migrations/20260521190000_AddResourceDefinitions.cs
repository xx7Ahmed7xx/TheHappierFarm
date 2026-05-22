using HappierFarm.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260521190000_AddResourceDefinitions")]
public partial class AddResourceDefinitions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ResourceDefinitions",
            columns: table => new
            {
                Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                SellValue = table.Column<int>(type: "int", nullable: false),
                Category = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                SortOrder = table.Column<int>(type: "int", nullable: false),
                IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ResourceDefinitions", x => x.Code);
            });

        migrationBuilder.Sql(
            """
            INSERT INTO ResourceDefinitions (Code, SellValue, Category, SortOrder, IsEnabled) VALUES
            (N'barley', 28, N'crop', 10, 1),
            (N'carrot', 55, N'crop', 20, 1),
            (N'wheat', 38, N'crop', 30, 1),
            (N'tomato', 72, N'crop', 40, 1),
            (N'pumpkin', 120, N'crop', 50, 1),
            (N'milk', 12, N'animal_product', 60, 1),
            (N'egg', 8, N'animal_product', 70, 1),
            (N'wool', 18, N'animal_product', 80, 1),
            (N'cheese', 80, N'factory_product', 90, 1),
            (N'yarn', 45, N'factory_product', 100, 1),
            (N'bread', 55, N'factory_product', 110, 1);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ResourceDefinitions");
    }
}
