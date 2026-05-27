using System.Text;
using System.Text.Json;
using HappierFarm.Infrastructure.Data;
using HappierFarm.Infrastructure.Identity;
using HappierFarm.WebAPI;
using HappierFarm.WebAPI.Hubs;
using HappierFarm.WebAPI.Options;
using HappierFarm.WebAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<GameTimingOptions>(
    builder.Configuration.GetSection(GameTimingOptions.SectionName));
builder.Services.Configure<ClientPresentationOptions>(
    builder.Configuration.GetSection(ClientPresentationOptions.SectionName));
builder.Services.AddScoped<GameConfigService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<DisplayNameService>();

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedEmail = false;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKeyBytes = Encoding.UTF8.GetBytes(jwtSection.SigningKey);
if (signingKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:SigningKey must be at least 32 UTF-8 bytes. Set it in appsettings, user secrets, or environment variables.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection.Issuer,
            ValidAudience = jwtSection.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(signingKeyBytes),
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier,
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<FarmService>();
builder.Services.AddSignalR().AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "The Happier Farm! API", Version = "v1" });
    c.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste JWT from /api/auth/register or /api/auth/login",
        });
    c.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
                },
                Array.Empty<string>()
            },
        });
});

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
if (corsOrigins is null || corsOrigins.Length == 0)
{
    corsOrigins = new[] { "http://localhost:5173", "http://127.0.0.1:5173" };
}

const string corsPolicyName = "ClientCors";
builder.Services.AddCors(options => options.AddPolicy(corsPolicyName, policy =>
    policy.WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
startupLogger.LogInformation(
    "Environment={Environment} Cors:AllowedOrigins=[{Origins}] AllowedHosts={AllowedHosts}",
    app.Environment.EnvironmentName,
    string.Join(", ", corsOrigins),
    builder.Configuration["AllowedHosts"] ?? "(not set)");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

await ApplyPendingMigrationsAsync(app);

static async Task ApplyPendingMigrationsAsync(WebApplication app)
{
    var apply = app.Configuration.GetValue("Database:ApplyMigrationsOnStartup", app.Environment.IsDevelopment());
    if (!apply)
    {
        return;
    }

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Database");

    try
    {
        var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
        if (pending.Count == 0)
        {
            logger.LogInformation("Database schema is up to date (no pending migrations).");
            return;
        }

        logger.LogInformation(
            "Applying {Count} pending migration(s): {Names}",
            pending.Count,
            string.Join(", ", pending));
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply database migrations. Check connection string and __EFMigrationsHistory.");
        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

app.UseCors(corsPolicyName);

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new
{
    environment = app.Environment.EnvironmentName,
    corsAllowedOrigins = corsOrigins,
}))
    .AllowAnonymous()
    .RequireCors(corsPolicyName);

app.MapHub<FarmHub>("/hubs/game").RequireCors(corsPolicyName);
app.MapAuthEndpoints();
app.MapFarmEndpoints();

app.Run();
