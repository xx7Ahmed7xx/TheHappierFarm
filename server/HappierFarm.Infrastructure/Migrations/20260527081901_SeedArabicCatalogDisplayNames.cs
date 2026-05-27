using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedArabicCatalogDisplayNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "بقرة هولشتاين سعيدة", "Happy Holstein" });

            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "خروف صوفي", "Woolly Sheep" });

            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "دجاجة بياض", "Clucking Hen" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "شعير مشمس", "Sunny Barley" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "جزر سريع", "Swift Carrot" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "قمح ذهبي", "Golden Wheat" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "طماطم متسلقة", "Vine Tomato" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "يقطين خريفي", "Autumn Pumpkin" });

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "بستان عباد الشمس", "Sunflower Patch" });

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "سياج خشبي", "Wooden Fence" });

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "بالة قش مريحة", "Cozy Hay Bale" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "مكبس جبن المرج", "Meadow Cheese Press" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "حظيرة تخزين", "Hearty Barn" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "غزّالة الصوف", "Wool Spinner" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "مخبز القرية", "Village Bakery" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "barley",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "شعير", "Barley" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "bread",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "خبز", "Bread" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "carrot",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "جزر", "Carrot" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "cheese",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "جبن", "Cheese" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "egg",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "بيض", "Egg" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "milk",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "حليب", "Milk" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "pumpkin",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "يقطين", "Pumpkin" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "tomato",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "طماطم", "Tomato" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "wheat",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "قمح", "Wheat" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "wool",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "صوف", "Wool" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "yarn",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "غزل", "Yarn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "AnimalDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "DecorationDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "FactoryDefinitions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "barley",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "bread",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "carrot",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "cheese",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "egg",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "milk",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "pumpkin",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "tomato",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "wheat",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "wool",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "ResourceDefinitions",
                keyColumn: "Code",
                keyValue: "yarn",
                columns: new[] { "DisplayNameAr", "DisplayNameEn" },
                values: new object[] { "", "" });
        }
    }
}
