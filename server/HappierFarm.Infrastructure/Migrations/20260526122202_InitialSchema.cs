using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HappierFarm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnimalDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameEn = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameAr = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    BuyPrice = table.Column<int>(type: "int", nullable: false),
                    ProductionIntervalSeconds = table.Column<int>(type: "int", nullable: false),
                    FeedResourceCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    FeedQuantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    ProductCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ProductQuantity = table.Column<int>(type: "int", nullable: false),
                    MaxOwned = table.Column<int>(type: "int", nullable: false, defaultValue: 4),
                    MaxPlaced = table.Column<int>(type: "int", nullable: false, defaultValue: 4),
                    FootprintWidth = table.Column<int>(type: "int", nullable: false),
                    FootprintHeight = table.Column<int>(type: "int", nullable: false),
                    MinLevelRequired = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnimalDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GoldCoins = table.Column<int>(type: "int", nullable: false),
                    Dinars = table.Column<int>(type: "int", nullable: false),
                    ExperiencePoints = table.Column<int>(type: "int", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameNormalized = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    FarmGridSize = table.Column<int>(type: "int", nullable: false),
                    BarnUpgradeTier = table.Column<int>(type: "int", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BarnUpgradeTierDefinitions",
                columns: table => new
                {
                    Tier = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BonusSlots = table.Column<int>(type: "int", nullable: false),
                    GoldCost = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BarnUpgradeTierDefinitions", x => x.Tier);
                });

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

            migrationBuilder.CreateTable(
                name: "CropDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameEn = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameAr = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    BuyPrice = table.Column<int>(type: "int", nullable: false),
                    SellValue = table.Column<int>(type: "int", nullable: false),
                    BaseYield = table.Column<int>(type: "int", nullable: false),
                    HarvestResourceCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    GrowthDurationSeconds = table.Column<int>(type: "int", nullable: false),
                    XpReward = table.Column<int>(type: "int", nullable: false),
                    MinLevelRequired = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CropDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DecorationDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameEn = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameAr = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    BuyPrice = table.Column<int>(type: "int", nullable: false),
                    FootprintWidth = table.Column<int>(type: "int", nullable: false),
                    FootprintHeight = table.Column<int>(type: "int", nullable: false),
                    MaxOwned = table.Column<int>(type: "int", nullable: false),
                    MaxPlaced = table.Column<int>(type: "int", nullable: false),
                    MinLevelRequired = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DecorationDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FactoryDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameEn = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayNameAr = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    BuyPrice = table.Column<int>(type: "int", nullable: false),
                    InputResourceCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    InputQuantity = table.Column<int>(type: "int", nullable: false),
                    OutputResourceCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    OutputQuantity = table.Column<int>(type: "int", nullable: false),
                    ProcessSeconds = table.Column<int>(type: "int", nullable: false),
                    SellValue = table.Column<int>(type: "int", nullable: false),
                    MaxOwned = table.Column<int>(type: "int", nullable: false, defaultValue: 2),
                    MaxPlaced = table.Column<int>(type: "int", nullable: false, defaultValue: 2),
                    FootprintWidth = table.Column<int>(type: "int", nullable: false),
                    FootprintHeight = table.Column<int>(type: "int", nullable: false),
                    MinLevelRequired = table.Column<int>(type: "int", nullable: false),
                    IsBarn = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FactoryDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GameSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
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
                    ActiveEventName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActiveEventMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActiveEventTimePercent = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ResourceDefinitions",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DisplayNameEn = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    DisplayNameAr = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    SellValue = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceDefinitions", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    LastActionUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    BatchRuns = table.Column<int>(type: "int", nullable: false),
                    FootprintWidth = table.Column<int>(type: "int", nullable: false),
                    FootprintHeight = table.Column<int>(type: "int", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "FarmTiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CoordinateX = table.Column<int>(type: "int", nullable: false),
                    CoordinateY = table.Column<int>(type: "int", nullable: false),
                    CropTypeId = table.Column<int>(type: "int", nullable: true),
                    PlantedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FarmTiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FarmTiles_AspNetUsers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FarmTiles_CropDefinitions_CropTypeId",
                        column: x => x.CropTypeId,
                        principalTable: "CropDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlayerSeedStocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CropTypeId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerSeedStocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerSeedStocks_AspNetUsers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerSeedStocks_CropDefinitions_CropTypeId",
                        column: x => x.CropTypeId,
                        principalTable: "CropDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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

            migrationBuilder.InsertData(
                table: "AnimalDefinitions",
                columns: new[] { "Id", "BuyPrice", "DisplayNameAr", "DisplayNameEn", "FeedQuantity", "FeedResourceCode", "FootprintHeight", "FootprintWidth", "MaxOwned", "MaxPlaced", "MinLevelRequired", "Name", "ProductCode", "ProductQuantity", "ProductionIntervalSeconds" },
                values: new object[,]
                {
                    { 1, 250, "", "", 2, "wheat", 1, 2, 4, 4, 3, "Happy Holstein", "milk", 2, 2700 },
                    { 2, 200, "", "", 2, "barley", 1, 1, 4, 4, 4, "Woolly Sheep", "wool", 2, 3600 },
                    { 3, 60, "", "", 1, "carrot", 1, 1, 6, 6, 2, "Clucking Hen", "egg", 3, 1200 }
                });

            migrationBuilder.InsertData(
                table: "BarnUpgradeTierDefinitions",
                columns: new[] { "Tier", "BonusSlots", "GoldCost" },
                values: new object[,]
                {
                    { 1, 20, 250 },
                    { 2, 50, 600 },
                    { 3, 100, 1500 }
                });

            migrationBuilder.InsertData(
                table: "CropDefinitions",
                columns: new[] { "Id", "BaseYield", "BuyPrice", "DisplayNameAr", "DisplayNameEn", "GrowthDurationSeconds", "HarvestResourceCode", "MinLevelRequired", "Name", "SellValue", "XpReward" },
                values: new object[,]
                {
                    { 1, 1, 8, "", "", 1800, "barley", 1, "Sunny Barley", 18, 5 },
                    { 2, 1, 15, "", "", 2700, "carrot", 2, "Swift Carrot", 35, 12 },
                    { 3, 1, 12, "", "", 2400, "wheat", 2, "Golden Wheat", 28, 8 },
                    { 4, 1, 30, "", "", 7200, "tomato", 4, "Vine Tomato", 65, 18 },
                    { 5, 1, 45, "", "", 14400, "pumpkin", 6, "Autumn Pumpkin", 110, 28 }
                });

            migrationBuilder.InsertData(
                table: "DecorationDefinitions",
                columns: new[] { "Id", "BuyPrice", "DisplayNameAr", "DisplayNameEn", "FootprintHeight", "FootprintWidth", "MaxOwned", "MaxPlaced", "MinLevelRequired", "Name" },
                values: new object[,]
                {
                    { 1, 35, "", "", 1, 1, 30, 30, 2, "Sunflower Patch" },
                    { 2, 60, "", "", 1, 2, 20, 20, 3, "Wooden Fence" },
                    { 3, 45, "", "", 1, 1, 30, 30, 5, "Cozy Hay Bale" }
                });

            migrationBuilder.InsertData(
                table: "FactoryDefinitions",
                columns: new[] { "Id", "BuyPrice", "DisplayNameAr", "DisplayNameEn", "FootprintHeight", "FootprintWidth", "InputQuantity", "InputResourceCode", "IsBarn", "MaxOwned", "MaxPlaced", "MinLevelRequired", "Name", "OutputQuantity", "OutputResourceCode", "ProcessSeconds", "SellValue" },
                values: new object[,]
                {
                    { 1, 220, "", "", 2, 2, 3, "milk", false, 2, 2, 4, "Meadow Cheese Press", 1, "cheese", 1800, 80 },
                    { 2, 350, "", "", 2, 2, 0, "none", true, 1, 1, 3, "Hearty Barn", 0, "none", 0, 0 },
                    { 3, 200, "", "", 2, 2, 2, "wool", false, 2, 2, 5, "Wool Spinner", 1, "yarn", 2400, 45 },
                    { 4, 280, "", "", 2, 2, 3, "wheat", false, 2, 2, 6, "Village Bakery", 1, "bread", 3000, 55 }
                });

            migrationBuilder.InsertData(
                table: "GameSettings",
                columns: new[] { "Id", "AbsoluteMaxGridSize", "ActiveEventMessage", "ActiveEventName", "ActiveEventTimePercent", "BarnFactoryTypeId", "BaseStorageCapacity", "DefaultGridSize", "ExpansionAreaTaxPerStepSq", "ExpansionBasePrice", "ExpansionGrowthRate", "GlobalTimePercent", "MaxBankedAnimalCycles", "MinGridSize", "StarterDinars", "StarterGold", "StoragePerLevel" },
                values: new object[] { 1, 999, null, null, 0, 2, 50, 9, 25, 450, 2.0800000000000001, 100, 30, 9, 100, 100, 10 });

            migrationBuilder.InsertData(
                table: "ResourceDefinitions",
                columns: new[] { "Code", "Category", "DisplayNameAr", "DisplayNameEn", "IsEnabled", "SellValue", "SortOrder" },
                values: new object[,]
                {
                    { "barley", "crop", "", "", true, 28, 10 },
                    { "bread", "factory_product", "", "", true, 55, 110 },
                    { "carrot", "crop", "", "", true, 55, 20 },
                    { "cheese", "factory_product", "", "", true, 80, 90 },
                    { "egg", "animal_product", "", "", true, 8, 70 },
                    { "milk", "animal_product", "", "", true, 12, 60 },
                    { "pumpkin", "crop", "", "", true, 120, 50 },
                    { "tomato", "crop", "", "", true, 72, 40 },
                    { "wheat", "crop", "", "", true, 38, 30 },
                    { "wool", "animal_product", "", "", true, 18, 80 },
                    { "yarn", "factory_product", "", "", true, 45, 100 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_DisplayNameNormalized",
                table: "AspNetUsers",
                column: "DisplayNameNormalized",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_FarmPlacements_PlayerId_CoordinateX_CoordinateY",
                table: "FarmPlacements",
                columns: new[] { "PlayerId", "CoordinateX", "CoordinateY" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FarmTiles_CropTypeId",
                table: "FarmTiles",
                column: "CropTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_FarmTiles_PlayerId_CoordinateX_CoordinateY",
                table: "FarmTiles",
                columns: new[] { "PlayerId", "CoordinateX", "CoordinateY" },
                unique: true);

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
                name: "IX_PlayerDecorations_DecorationTypeId",
                table: "PlayerDecorations",
                column: "DecorationTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerDecorations_PlayerId_DecorationTypeId",
                table: "PlayerDecorations",
                columns: new[] { "PlayerId", "DecorationTypeId" },
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

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSeedStocks_CropTypeId",
                table: "PlayerSeedStocks",
                column: "CropTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSeedStocks_PlayerId_CropTypeId",
                table: "PlayerSeedStocks",
                columns: new[] { "PlayerId", "CropTypeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "BarnUpgradeTierDefinitions");

            migrationBuilder.DropTable(
                name: "CatalogTimingOverrides");

            migrationBuilder.DropTable(
                name: "FarmPlacements");

            migrationBuilder.DropTable(
                name: "FarmTiles");

            migrationBuilder.DropTable(
                name: "GameSettings");

            migrationBuilder.DropTable(
                name: "PlayerAnimals");

            migrationBuilder.DropTable(
                name: "PlayerDecorations");

            migrationBuilder.DropTable(
                name: "PlayerFactories");

            migrationBuilder.DropTable(
                name: "PlayerResources");

            migrationBuilder.DropTable(
                name: "PlayerSeedStocks");

            migrationBuilder.DropTable(
                name: "ResourceDefinitions");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AnimalDefinitions");

            migrationBuilder.DropTable(
                name: "DecorationDefinitions");

            migrationBuilder.DropTable(
                name: "FactoryDefinitions");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "CropDefinitions");
        }
    }
}
