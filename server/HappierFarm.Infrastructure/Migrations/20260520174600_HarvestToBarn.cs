using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HarvestToBarn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HarvestResourceCode",
                table: "CropDefinitions",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                column: "HarvestResourceCode",
                value: "barley");

            migrationBuilder.UpdateData(
                table: "CropDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                column: "HarvestResourceCode",
                value: "carrot");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HarvestResourceCode",
                table: "CropDefinitions");
        }
    }
}
