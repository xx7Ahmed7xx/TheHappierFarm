using HappierFarm.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260521200000_AddGameConfig")]
public partial class AddGameConfig : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "GameSettings",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false),
                DefaultGridSize = table.Column<int>(type: "int", nullable: false),
                MinGridSize = table.Column<int>(type: "int", nullable: false),
                AbsoluteMaxGridSize = table.Column<int>(type: "int", nullable: false),
                ExpansionBasePrice = table.Column<int>(type: "int", nullable: false),
                ExpansionGrowthRate = table.Column<double>(type: "float", nullable: false),
                ExpansionAreaTaxPerStepSq = table.Column<int>(type: "int", nullable: false),
                BaseStorageCapacity = table.Column<int>(type: "int", nullable: false),
                StoragePerLevel = table.Column<int>(type: "int", nullable: false),
                MaxBankedAnimalCycles = table.Column<int>(type: "int", nullable: false),
                BarnFactoryTypeId = table.Column<int>(type: "int", nullable: false),
                StarterGold = table.Column<int>(type: "int", nullable: false),
                StarterDinars = table.Column<int>(type: "int", nullable: false),
                GlobalTimePercent = table.Column<int>(type: "int", nullable: false),
                ActiveEventName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                ActiveEventMessage = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                ActiveEventTimePercent = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_GameSettings", x => x.Id));

        migrationBuilder.Sql(
            """
            INSERT INTO GameSettings (
                Id, DefaultGridSize, MinGridSize, AbsoluteMaxGridSize,
                ExpansionBasePrice, ExpansionGrowthRate, ExpansionAreaTaxPerStepSq,
                BaseStorageCapacity, StoragePerLevel, MaxBankedAnimalCycles, BarnFactoryTypeId,
                StarterGold, StarterDinars, GlobalTimePercent, ActiveEventTimePercent)
            VALUES (1, 9, 9, 999, 450, 2.08, 25, 50, 10, 30, 2, 100, 100, 100, 0);
            """);

        migrationBuilder.CreateTable(
            name: "BarnUpgradeTierDefinitions",
            columns: table => new
            {
                Tier = table.Column<int>(type: "int", nullable: false),
                BonusSlots = table.Column<int>(type: "int", nullable: false),
                GoldCost = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_BarnUpgradeTierDefinitions", x => x.Tier));

        migrationBuilder.Sql(
            """
            INSERT INTO BarnUpgradeTierDefinitions (Tier, BonusSlots, GoldCost) VALUES
            (1, 20, 250),
            (2, 50, 600),
            (3, 100, 1500);
            """);

        migrationBuilder.CreateTable(
            name: "CatalogTimingOverrides",
            columns: table => new
            {
                CatalogKind = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                CatalogId = table.Column<int>(type: "int", nullable: false),
                BaseSeconds = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CatalogTimingOverrides", x => new { x.CatalogKind, x.CatalogId });
            });

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameEn",
            table: "ResourceDefinitions",
            type: "nvarchar(64)",
            maxLength: 64,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameAr",
            table: "ResourceDefinitions",
            type: "nvarchar(64)",
            maxLength: 64,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameEn",
            table: "CropDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameAr",
            table: "CropDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameEn",
            table: "AnimalDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameAr",
            table: "AnimalDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameEn",
            table: "FactoryDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameAr",
            table: "FactoryDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameEn",
            table: "DecorationDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "DisplayNameAr",
            table: "DecorationDefinitions",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql(
            """
            UPDATE CropDefinitions SET DisplayNameEn = N'Sunny Barley', DisplayNameAr = N'شعير مشمس' WHERE Id = 1;
            UPDATE CropDefinitions SET DisplayNameEn = N'Swift Carrot', DisplayNameAr = N'جزر سريع' WHERE Id = 2;
            UPDATE CropDefinitions SET DisplayNameEn = N'Golden Wheat', DisplayNameAr = N'قمح ذهبي' WHERE Id = 3;
            UPDATE CropDefinitions SET DisplayNameEn = N'Vine Tomato', DisplayNameAr = N'طماطم العنب' WHERE Id = 4;
            UPDATE CropDefinitions SET DisplayNameEn = N'Autumn Pumpkin', DisplayNameAr = N'يقطين الخريف' WHERE Id = 5;
            UPDATE AnimalDefinitions SET DisplayNameEn = N'Happy Holstein', DisplayNameAr = N'بقرة هولشتاين سعيدة' WHERE Id = 1;
            UPDATE AnimalDefinitions SET DisplayNameEn = N'Woolly Sheep', DisplayNameAr = N'خروف صوفي' WHERE Id = 2;
            UPDATE AnimalDefinitions SET DisplayNameEn = N'Clucking Hen', DisplayNameAr = N'دجاجة مُقَرْقِرة' WHERE Id = 3;
            UPDATE FactoryDefinitions SET DisplayNameEn = N'Meadow Cheese Press', DisplayNameAr = N'مكبس جبن المرج' WHERE Id = 1;
            UPDATE FactoryDefinitions SET DisplayNameEn = N'Hearty Barn', DisplayNameAr = N'حظيرة القلب' WHERE Id = 2;
            UPDATE FactoryDefinitions SET DisplayNameEn = N'Wool Spinner', DisplayNameAr = N'غزّال الصوف' WHERE Id = 3;
            UPDATE FactoryDefinitions SET DisplayNameEn = N'Village Bakery', DisplayNameAr = N'مخبز القرية' WHERE Id = 4;
            UPDATE DecorationDefinitions SET DisplayNameEn = Name, DisplayNameAr = Name;
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Barley', DisplayNameAr = N'شعير' WHERE Code = N'barley';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Carrot', DisplayNameAr = N'جزر' WHERE Code = N'carrot';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Wheat', DisplayNameAr = N'قمح' WHERE Code = N'wheat';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Tomato', DisplayNameAr = N'طماطم' WHERE Code = N'tomato';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Pumpkin', DisplayNameAr = N'يقطين' WHERE Code = N'pumpkin';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Milk', DisplayNameAr = N'حليب' WHERE Code = N'milk';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Egg', DisplayNameAr = N'بيض' WHERE Code = N'egg';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Wool', DisplayNameAr = N'صوف' WHERE Code = N'wool';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Cheese', DisplayNameAr = N'جبن' WHERE Code = N'cheese';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Yarn', DisplayNameAr = N'خيط' WHERE Code = N'yarn';
            UPDATE ResourceDefinitions SET DisplayNameEn = N'Bread', DisplayNameAr = N'خبز' WHERE Code = N'bread';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "DisplayNameAr", table: "DecorationDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameEn", table: "DecorationDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameAr", table: "FactoryDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameEn", table: "FactoryDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameAr", table: "AnimalDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameEn", table: "AnimalDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameAr", table: "CropDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameEn", table: "CropDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameAr", table: "ResourceDefinitions");
        migrationBuilder.DropColumn(name: "DisplayNameEn", table: "ResourceDefinitions");
        migrationBuilder.DropTable(name: "CatalogTimingOverrides");
        migrationBuilder.DropTable(name: "BarnUpgradeTierDefinitions");
        migrationBuilder.DropTable(name: "GameSettings");
    }
}
