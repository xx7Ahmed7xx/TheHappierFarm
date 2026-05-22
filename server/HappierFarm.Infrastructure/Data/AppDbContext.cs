using HappierFarm.Domain;
using HappierFarm.Domain.Entities;
using HappierFarm.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HappierFarm.Infrastructure.Data;

public sealed class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<FarmTile> FarmTiles => Set<FarmTile>();
    public DbSet<CropDefinition> CropDefinitions => Set<CropDefinition>();
    public DbSet<PlayerSeedStock> PlayerSeedStocks => Set<PlayerSeedStock>();
    public DbSet<AnimalDefinition> AnimalDefinitions => Set<AnimalDefinition>();
    public DbSet<FactoryDefinition> FactoryDefinitions => Set<FactoryDefinition>();
    public DbSet<PlayerAnimal> PlayerAnimals => Set<PlayerAnimal>();
    public DbSet<PlayerFactory> PlayerFactories => Set<PlayerFactory>();
    public DbSet<PlayerResource> PlayerResources => Set<PlayerResource>();
    public DbSet<FarmPlacement> FarmPlacements => Set<FarmPlacement>();
    public DbSet<DecorationDefinition> DecorationDefinitions => Set<DecorationDefinition>();
    public DbSet<PlayerDecoration> PlayerDecorations => Set<PlayerDecoration>();
    public DbSet<ResourceDefinition> ResourceDefinitions => Set<ResourceDefinition>();
    public DbSet<GameSettings> GameSettings => Set<GameSettings>();
    public DbSet<BarnUpgradeTierDefinition> BarnUpgradeTierDefinitions => Set<BarnUpgradeTierDefinition>();
    public DbSet<CatalogTimingOverride> CatalogTimingOverrides => Set<CatalogTimingOverride>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.DisplayName).HasMaxLength(128).IsRequired();
            e.Property(u => u.DisplayNameNormalized).HasMaxLength(128).IsRequired();
            e.HasIndex(u => u.DisplayNameNormalized).IsUnique();
        });

        modelBuilder.Entity<GameSettings>(e =>
        {
            e.ToTable("GameSettings");
            e.HasKey(s => s.Id);
            e.HasData(new GameSettings { Id = 1 });
        });

        modelBuilder.Entity<BarnUpgradeTierDefinition>(e =>
        {
            e.ToTable("BarnUpgradeTierDefinitions");
            e.HasKey(t => t.Tier);
            e.HasData(
                new BarnUpgradeTierDefinition { Tier = 1, BonusSlots = 20, GoldCost = 250 },
                new BarnUpgradeTierDefinition { Tier = 2, BonusSlots = 50, GoldCost = 600 },
                new BarnUpgradeTierDefinition { Tier = 3, BonusSlots = 100, GoldCost = 1500 });
        });

        modelBuilder.Entity<CatalogTimingOverride>(e =>
        {
            e.ToTable("CatalogTimingOverrides");
            e.HasKey(t => new { t.CatalogKind, t.CatalogId });
            e.Property(t => t.CatalogKind).HasMaxLength(16);
        });

        modelBuilder.Entity<ResourceDefinition>(e =>
        {
            e.ToTable("ResourceDefinitions");
            e.HasKey(r => r.Code);
            e.Property(r => r.Code).HasMaxLength(32);
            e.Property(r => r.Category).HasMaxLength(32).IsRequired();
            e.Property(r => r.DisplayNameEn).HasMaxLength(64).IsRequired();
            e.Property(r => r.DisplayNameAr).HasMaxLength(64).IsRequired();
            e.Property(r => r.IsEnabled).HasDefaultValue(true);
            e.HasData(
                new ResourceDefinition { Code = "barley", SellValue = 28, Category = "crop", SortOrder = 10 },
                new ResourceDefinition { Code = "carrot", SellValue = 55, Category = "crop", SortOrder = 20 },
                new ResourceDefinition { Code = "wheat", SellValue = 38, Category = "crop", SortOrder = 30 },
                new ResourceDefinition { Code = "tomato", SellValue = 72, Category = "crop", SortOrder = 40 },
                new ResourceDefinition { Code = "pumpkin", SellValue = 120, Category = "crop", SortOrder = 50 },
                new ResourceDefinition { Code = "milk", SellValue = 12, Category = "animal_product", SortOrder = 60 },
                new ResourceDefinition { Code = "egg", SellValue = 8, Category = "animal_product", SortOrder = 70 },
                new ResourceDefinition { Code = "wool", SellValue = 18, Category = "animal_product", SortOrder = 80 },
                new ResourceDefinition { Code = "cheese", SellValue = 80, Category = "factory_product", SortOrder = 90 },
                new ResourceDefinition { Code = "yarn", SellValue = 45, Category = "factory_product", SortOrder = 100 },
                new ResourceDefinition { Code = "bread", SellValue = 55, Category = "factory_product", SortOrder = 110 });
        });

        modelBuilder.Entity<CropDefinition>(e =>
        {
            e.ToTable("CropDefinitions");
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).HasMaxLength(128).IsRequired();
            e.Property(c => c.DisplayNameEn).HasMaxLength(128).IsRequired();
            e.Property(c => c.DisplayNameAr).HasMaxLength(128).IsRequired();
            e.Property(c => c.HarvestResourceCode).HasMaxLength(32).IsRequired();
            e.HasData(
                new CropDefinition
                {
                    Id = 1,
                    Name = "Sunny Barley",
                    BuyPrice = 8,
                    SellValue = 18,
                    BaseYield = 1,
                    HarvestResourceCode = "barley",
                    GrowthDurationSeconds = 1800,
                    XpReward = 5,
                    MinLevelRequired = 1
                },
                new CropDefinition
                {
                    Id = 2,
                    Name = "Swift Carrot",
                    BuyPrice = 15,
                    SellValue = 35,
                    BaseYield = 1,
                    HarvestResourceCode = "carrot",
                    GrowthDurationSeconds = 2700,
                    XpReward = 12,
                    MinLevelRequired = 2
                },
                new CropDefinition
                {
                    Id = 3,
                    Name = "Golden Wheat",
                    BuyPrice = 12,
                    SellValue = 28,
                    BaseYield = 1,
                    HarvestResourceCode = "wheat",
                    GrowthDurationSeconds = 2400,
                    XpReward = 8,
                    MinLevelRequired = 2
                },
                new CropDefinition
                {
                    Id = 4,
                    Name = "Vine Tomato",
                    BuyPrice = 30,
                    SellValue = 65,
                    BaseYield = 1,
                    HarvestResourceCode = "tomato",
                    GrowthDurationSeconds = 7200,
                    XpReward = 18,
                    MinLevelRequired = 4
                },
                new CropDefinition
                {
                    Id = 5,
                    Name = "Autumn Pumpkin",
                    BuyPrice = 45,
                    SellValue = 110,
                    BaseYield = 1,
                    HarvestResourceCode = "pumpkin",
                    GrowthDurationSeconds = 14400,
                    XpReward = 28,
                    MinLevelRequired = 6
                });
        });

        modelBuilder.Entity<FarmTile>(e =>
        {
            e.ToTable("FarmTiles");
            e.HasKey(t => t.Id);
            e.HasIndex(t => new { t.PlayerId, t.CoordinateX, t.CoordinateY }).IsUnique();
            e.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(t => t.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(t => t.CropType)
                .WithMany()
                .HasForeignKey(t => t.CropTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PlayerSeedStock>(e =>
        {
            e.ToTable("PlayerSeedStocks");
            e.HasKey(s => s.Id);
            e.HasIndex(s => new { s.PlayerId, s.CropTypeId }).IsUnique();
            e.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(s => s.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.CropType)
                .WithMany()
                .HasForeignKey(s => s.CropTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AnimalDefinition>(e =>
        {
            e.ToTable("AnimalDefinitions");
            e.HasKey(a => a.Id);
            e.Property(a => a.Name).HasMaxLength(128).IsRequired();
            e.Property(a => a.DisplayNameEn).HasMaxLength(128).IsRequired();
            e.Property(a => a.DisplayNameAr).HasMaxLength(128).IsRequired();
            e.Property(a => a.ProductCode).HasMaxLength(32).IsRequired();
            e.Property(a => a.FeedResourceCode).HasMaxLength(32).IsRequired();
            e.Property(a => a.FeedQuantity).HasDefaultValue(1);
            e.Property(a => a.MaxOwned).HasDefaultValue(4);
            e.Property(a => a.MaxPlaced).HasDefaultValue(4);
            e.HasData(
                new AnimalDefinition
                {
                    Id = 1,
                    Name = "Happy Holstein",
                    BuyPrice = 250,
                    ProductionIntervalSeconds = 2700,
                    FeedResourceCode = "wheat",
                    FeedQuantity = 2,
                    ProductCode = "milk",
                    ProductQuantity = 2,
                    MaxOwned = 4,
                    MaxPlaced = 4,
                    FootprintWidth = 2,
                    FootprintHeight = 1,
                    MinLevelRequired = 3
                },
                new AnimalDefinition
                {
                    Id = 2,
                    Name = "Woolly Sheep",
                    BuyPrice = 200,
                    ProductionIntervalSeconds = 3600,
                    FeedResourceCode = "barley",
                    FeedQuantity = 2,
                    ProductCode = "wool",
                    ProductQuantity = 2,
                    MaxOwned = 4,
                    MaxPlaced = 4,
                    FootprintWidth = 1,
                    FootprintHeight = 1,
                    MinLevelRequired = 4
                },
                new AnimalDefinition
                {
                    Id = 3,
                    Name = "Clucking Hen",
                    BuyPrice = 60,
                    ProductionIntervalSeconds = 1200,
                    FeedResourceCode = "carrot",
                    FeedQuantity = 1,
                    ProductCode = "egg",
                    ProductQuantity = 3,
                    MaxOwned = 6,
                    MaxPlaced = 6,
                    FootprintWidth = 1,
                    FootprintHeight = 1,
                    MinLevelRequired = 2
                });
        });

        modelBuilder.Entity<FactoryDefinition>(e =>
        {
            e.ToTable("FactoryDefinitions");
            e.HasKey(f => f.Id);
            e.Property(f => f.Name).HasMaxLength(128).IsRequired();
            e.Property(f => f.DisplayNameEn).HasMaxLength(128).IsRequired();
            e.Property(f => f.DisplayNameAr).HasMaxLength(128).IsRequired();
            e.Property(f => f.InputResourceCode).HasMaxLength(32).IsRequired();
            e.Property(f => f.OutputResourceCode).HasMaxLength(32).IsRequired();
            e.Property(f => f.MaxOwned).HasDefaultValue(2);
            e.Property(f => f.MaxPlaced).HasDefaultValue(2);
            e.HasData(
                new FactoryDefinition
                {
                    Id = 1,
                    Name = "Meadow Cheese Press",
                    BuyPrice = 220,
                    InputResourceCode = "milk",
                    InputQuantity = 3,
                    OutputResourceCode = "cheese",
                    OutputQuantity = 1,
                    ProcessSeconds = 1800,
                    SellValue = 80,
                    MaxOwned = 2,
                    MaxPlaced = 2,
                    FootprintWidth = 2,
                    FootprintHeight = 2,
                    MinLevelRequired = 4,
                    IsBarn = false
                },
                new FactoryDefinition
                {
                    Id = 3,
                    Name = "Wool Spinner",
                    BuyPrice = 200,
                    InputResourceCode = "wool",
                    InputQuantity = 2,
                    OutputResourceCode = "yarn",
                    OutputQuantity = 1,
                    ProcessSeconds = 2400,
                    SellValue = 45,
                    MaxOwned = 2,
                    MaxPlaced = 2,
                    FootprintWidth = 2,
                    FootprintHeight = 2,
                    MinLevelRequired = 5,
                    IsBarn = false
                },
                new FactoryDefinition
                {
                    Id = 4,
                    Name = "Village Bakery",
                    BuyPrice = 280,
                    InputResourceCode = "wheat",
                    InputQuantity = 3,
                    OutputResourceCode = "bread",
                    OutputQuantity = 1,
                    ProcessSeconds = 3000,
                    SellValue = 55,
                    MaxOwned = 2,
                    MaxPlaced = 2,
                    FootprintWidth = 2,
                    FootprintHeight = 2,
                    MinLevelRequired = 6,
                    IsBarn = false
                },
                new FactoryDefinition
                {
                    Id = 2,
                    Name = "Hearty Barn",
                    BuyPrice = 350,
                    InputResourceCode = "none",
                    InputQuantity = 0,
                    OutputResourceCode = "none",
                    OutputQuantity = 0,
                    ProcessSeconds = 0,
                    SellValue = 0,
                    MaxOwned = 1,
                    MaxPlaced = 1,
                    FootprintWidth = 2,
                    FootprintHeight = 2,
                    MinLevelRequired = 3,
                    IsBarn = true
                });
        });

        modelBuilder.Entity<PlayerAnimal>(e =>
        {
            e.ToTable("PlayerAnimals");
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.PlayerId, a.AnimalTypeId }).IsUnique();
            e.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(a => a.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.AnimalType)
                .WithMany()
                .HasForeignKey(a => a.AnimalTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PlayerFactory>(e =>
        {
            e.ToTable("PlayerFactories");
            e.HasKey(f => f.Id);
            e.HasIndex(f => new { f.PlayerId, f.FactoryTypeId }).IsUnique();
            e.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(f => f.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(f => f.FactoryType)
                .WithMany()
                .HasForeignKey(f => f.FactoryTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PlayerResource>(e =>
        {
            e.ToTable("PlayerResources");
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.PlayerId, r.ResourceCode }).IsUnique();
            e.Property(r => r.ResourceCode).HasMaxLength(32).IsRequired();
            e.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(r => r.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FarmPlacement>(e =>
        {
            e.ToTable("FarmPlacements");
            e.HasKey(p => p.Id);
            e.HasIndex(p => new { p.PlayerId, p.CoordinateX, p.CoordinateY }).IsUnique();
            e.Property(p => p.Kind).HasMaxLength(16).IsRequired();
            e.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(p => p.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DecorationDefinition>(e =>
        {
            e.ToTable("DecorationDefinitions");
            e.HasKey(d => d.Id);
            e.Property(d => d.Id).ValueGeneratedNever();
            e.Property(d => d.Name).HasMaxLength(128).IsRequired();
            e.Property(d => d.DisplayNameEn).HasMaxLength(128).IsRequired();
            e.Property(d => d.DisplayNameAr).HasMaxLength(128).IsRequired();
            e.HasData(
                new DecorationDefinition
                {
                    Id = 1,
                    Name = "Sunflower Patch",
                    BuyPrice = 35,
                    FootprintWidth = 1,
                    FootprintHeight = 1,
                    MaxOwned = 30,
                    MaxPlaced = 30,
                    MinLevelRequired = 2
                },
                new DecorationDefinition
                {
                    Id = 2,
                    Name = "Wooden Fence",
                    BuyPrice = 60,
                    FootprintWidth = 2,
                    FootprintHeight = 1,
                    MaxOwned = 20,
                    MaxPlaced = 20,
                    MinLevelRequired = 3
                },
                new DecorationDefinition
                {
                    Id = 3,
                    Name = "Cozy Hay Bale",
                    BuyPrice = 45,
                    FootprintWidth = 1,
                    FootprintHeight = 1,
                    MaxOwned = 30,
                    MaxPlaced = 30,
                    MinLevelRequired = 5
                });
        });

        modelBuilder.Entity<PlayerDecoration>(e =>
        {
            e.ToTable("PlayerDecorations");
            e.HasKey(d => d.Id);
            e.HasIndex(d => new { d.PlayerId, d.DecorationTypeId }).IsUnique();
            e.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(d => d.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(d => d.DecorationType)
                .WithMany()
                .HasForeignKey(d => d.DecorationTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
