# Happier Farm - Deployment on OVHcloud VPS
# VPS: 57.129.191.113 (Ubuntu 24.04)
# Domain: https://thehappierfarm.click/

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    57.129.191.113 (Ubuntu 24.04)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐       ┌─────────────────┐                    │
│   │   Port 80       │       │   Port 8080    │                    │
│   │   (Frontend)    │       │   (API Backend) │                    │
│   │   nginx         │       │   ASP.NET Core  │                    │
│   │   Phaser.js     │       │   .NET 8        │                    │
│   └────────┬────────┘       └─────────┬──────┘                    │
│            │                            │                           │
│            │                            │                           │
│   ┌────────┴────────┐       ┌──────────┴──────────┐               │
│   │   /api/*         │       │   /hubs/game        │               │
│   │   /api/health    │       │   WebSocket (SignalR)              │
│   └──────────────────┘       └──────────────────────┘               │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │              EXISTING SERVICES (docker-compose.yml)           │ │
│   │   - postgres:17-alpine                    port 5432          │ │
│   │   - sqlserver:2025-latest                 port 1433          │ │
│   │   - caddy:2-alpine                         ports 80,443       │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │              HAPPIER FARM SERVICES                            │ │
│   │   - happier-farm-api      → ghcr.io/xx7ahmed7xx/*:api:latest │ │
│   │   - happier-farm-front    → ghcr.io/xx7ahmed7xx/*:front:latest│ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │              EXTERNAL ACCESS (Caddy reverse proxy)            │ │
│   │   thehappierfarm.click     → happier-farm-front (port 80)    │ │
│   │   api.thehappierfarm.click → happier-farm-api (port 8080)    │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- VPS: `57.129.191.113` (Ubuntu 24.04 LTS)
- SSH access: `ssh ubuntu@57.129.191.113`
- Existing `~/infra/docker-compose.yml` and `~/infra/Caddyfile`

## Files Created

| File | Purpose |
|------|---------|
| `server/Dockerfile.api` | ASP.NET Core 8 container (port 8080) |
| `server/Dockerfile.front` | nginx + Phaser.js container (port 80) |
| `docker-compose.additions.yml` | Docker Compose additions |
| `Caddyfile` | Reverse proxy for subdomains |
| `scripts/init-db.sql` | Database initialization |
| `README.md` | This documentation |

## Configuration

You must fill in these values in `appsettings.json`:

```json
{
  "ASPNETCORE_ENVIRONMENT": "Production",
  "AllowedHosts": ["thehappierfarm.click", "api.thehappierfarm.click"],
  "ConnectionStrings__DefaultConnection": "Server=57.129.191.113;...",
  "Jwt__SigningKey": "your-key-here",
  "GameTiming__BaseTimePercent": 100,
  "ClientPresentation__DefaultGridSize": 4
}
```

## Deployment Steps

```bash
# 1. Build Docker images
docker build -t ghcr.io/xx7ahmed7xx/happier-farm-api:latest -f server/Dockerfile.api .
docker build -t ghcr.io/xx7ahmed7xx/happier-farm-front:latest -f server/Dockerfile.front .

# 2. Login to ghcr
docker login ghcr.io

# 3. Push images
docker push ghcr.io/xx7ahmed7xx/happier-farm-api:latest
docker push ghcr.io/xx7ahmed7xx/happier-farm-front:latest

# 4. Deploy using existing docker-compose.yml
cd ~/infra
docker compose up -d happier-farm-api happier-farm-front

# 5. Initialize database
ssh ubuntu@57.129.191.113 "psql -h 57.129.191.113 -U happier_farm -d happier_farm -f ~/infra/scripts/init-db.sql"

# 6. Update Caddyfile with correct domain
cd ~/infra
sudo caddy reload

# 7. Verify deployment
curl https://thehappierfarm.click/
curl https://api.thehappierfarm.click/health
```

## Container Ports

| Container | Exposed Port |
|-----------|-------------|
| happier-farm-api | 8080 |
| happier-farm-front | 80 |

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/hubs/game` - WebSocket connection (SignalR)
- REST API at `/api/*`

## Docker Images

- `ghcr.io/xx7ahmed7xx/happier-farm-api:latest` - ASP.NET Core 8
- `ghcr.io/xx7ahmed7xx/happier-farm-front:latest` - nginx + Phaser.js
