using HappierFarm.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HappierFarm.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260520120000_AddUniqueDisplayName")]
public partial class AddUniqueDisplayName : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "DisplayNameNormalized",
            table: "AspNetUsers",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql(
            """
            UPDATE AspNetUsers
            SET DisplayName = COALESCE(NULLIF(LTRIM(RTRIM(DisplayName)), ''), LEFT(Email, 128), 'Farmer')
            WHERE DisplayName IS NULL OR LTRIM(RTRIM(DisplayName)) = '';
            """);

        migrationBuilder.Sql(
            """
            UPDATE AspNetUsers
            SET DisplayNameNormalized = LOWER(LTRIM(RTRIM(DisplayName)));
            """);

        migrationBuilder.AlterColumn<string>(
            name: "DisplayName",
            table: "AspNetUsers",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "nvarchar(128)",
            oldMaxLength: 128,
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_AspNetUsers_DisplayNameNormalized",
            table: "AspNetUsers",
            column: "DisplayNameNormalized",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_AspNetUsers_DisplayNameNormalized",
            table: "AspNetUsers");

        migrationBuilder.DropColumn(
            name: "DisplayNameNormalized",
            table: "AspNetUsers");

        migrationBuilder.AlterColumn<string>(
            name: "DisplayName",
            table: "AspNetUsers",
            type: "nvarchar(128)",
            maxLength: 128,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "nvarchar(128)",
            oldMaxLength: 128);
    }
}
