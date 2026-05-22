Project Context — “The Happier Farm!”
Project Vision

“The Happier Farm!” is a nostalgic browser/mobile social farming game inspired by classic social farming games like Happy Farm and FarmVille.

The goal is NOT to directly clone copyrighted assets or branding.

The goal IS to recreate:

the emotional gameplay loop,
asynchronous farming mechanics,
social gifting/helping systems,
satisfying progression,
lightweight accessibility,
and nostalgic casual gameplay.

This project must:

launch fast,
support gradual evolution,
be playable on browser/mobile,
support future scaling,
and remain maintainable for a solo/small-team developer.

The initial MVP intentionally prioritizes:

gameplay loop,
responsiveness,
retention mechanics,
and clean architecture

over:

advanced graphics,
large content volume,
or microservice complexity.
Core Product Principles
1. Fast MVP First

Ship a playable version quickly.

Avoid:

feature creep,
premature scaling,
unnecessary microservices,
advanced multiplayer systems.
2. Server Authoritative

ALL important game logic MUST live server-side.

Never trust client values.

Frontend is presentation + intent only.

3. Asynchronous Gameplay

This is NOT a realtime MMO.

Crop growth and timers are timestamp-based.

Example:

crop planted at timestamp X
harvest ready at timestamp Y

The server calculates state dynamically.

Avoid continuous ticking simulation.

4. Mobile-Friendly

UI/UX must be optimized for:

mobile browsers,
touch devices,
responsive layouts.

Desktop support is also required.

5. Low Resource Usage

The game should:

load quickly,
run on low-end devices,
minimize backend/server cost.
Recommended Tech Stack
Backend
Primary Stack
.NET 9
ASP.NET Core Web API
Entity Framework Core
PostgreSQL
Redis
SignalR
Docker
Why

This is optimized for:

rapid development,
maintainability,
strong typing,
scalability,
and existing developer expertise.
Frontend
Game Client
Phaser.js
TypeScript
Vite
UI Layer
Phaser UI initially
HTML overlays allowed where beneficial
Infrastructure
VPS Deployment

Initial deployment target:

Ubuntu VPS
Docker Compose

Later:

Kubernetes optional
Cloud optional
Architecture Decision
IMPORTANT:
START AS A MODULAR MONOLITH

DO NOT start with microservices.

Use:

one deployable backend app,
clean module boundaries internally.

This enables:

fast development,
easier debugging,
simpler deployment,
future extraction to services if needed.
Backend Architecture
Pattern

Use:

Clean Architecture principles
Feature-based modular structure

Avoid:

overengineered CQRS everywhere,
unnecessary abstraction layers,
repository-over-repository madness.
Suggested Structure
/src
  /Api
  /Modules
    /Auth
    /Players
    /Farms
    /Crops
    /Inventory
    /Economy
    /Social
    /Shop
    /Notifications
  /Shared
  /Infrastructure
Each Module Contains
/Application
/Domain
/Infrastructure
/Contracts
Domain Philosophy

Domain models should contain:

business rules,
validation,
gameplay behavior.

Avoid anemic models everywhere.

Database
PostgreSQL

Use PostgreSQL from the beginning.

Why:

reliability
strong relational consistency
excellent EF support
scalability
Redis Usage

Use Redis for:

caching,
sessions,
rate limiting,
realtime presence,
temporary social data.

DO NOT overcomplicate Redis usage early.

Authentication
MVP

Use:

email/password
OR
Google OAuth

DO NOT begin with Facebook integration.

Later add:

Facebook
Discord
Apple
Game State Design
IMPORTANT

The server is the source of truth.

Frontend never calculates:

rewards,
growth completion,
currency changes,
XP.
Core Entities
Player

Contains:

id
level
xp
currencies
profile
timestamps
Farm

Contains:

owner
dimensions
unlock progression
Tile

Contains:

position
state
planted crop
timestamps

States:

empty
plowed
planted
harvestable
Crop

Contains:

growth duration
reward
XP reward
seed cost
Inventory

Contains:

seeds
decorations
consumables
Crop Growth Design

NEVER use realtime ticking.

Use timestamps only.

Example:

HarvestReadyAt = DateTime.UtcNow.AddMinutes(crop.GrowthMinutes);

When loading farm:

if (DateTime.UtcNow >= HarvestReadyAt)

This massively reduces server load.

Frontend Architecture
IMPORTANT

Use ONE Phaser application initially.

DO NOT split frontend into microfrontends.

Phaser Scene Structure

Suggested scenes:

BootScene
PreloadScene
LoginScene
FarmScene
ShopScene
InventoryScene
SocialScene
UIScene
Rendering Style

Use:

tile-based rendering
sprite atlases
layered depth sorting

Avoid:

complex 3D
WebGL-heavy effects initially.
State Management

Frontend state:

lightweight
client-side cache only

Authoritative state:

backend only.
Networking
API

REST APIs for:

login
inventory
crop actions
shop
progression
SignalR

Use SignalR ONLY for:

notifications
social updates
lightweight realtime interactions

Avoid heavy realtime synchronization.

Social Features
MVP Social Features
Friend System
add friend
remove friend
visit farm
Gifting

Daily gifting system:

seeds
coins
consumables

This is a CORE retention mechanic.

Farm Help

Friends can:

water crops
speed growth slightly
clean weeds later
Monetization Strategy

DO NOT aggressively monetize MVP.

MVP Monetization

Allowed:

optional rewarded ads
cosmetics later
decorative content later

Avoid:

pay-to-win
aggressive popups
energy system abuse
Analytics (VERY IMPORTANT)

Track:

retention
session length
crop usage
player progression
gifting activity
economy inflation

Use:

structured logging
analytics events

Even in MVP.

Logging

Use:

Serilog
structured logs
request tracing

Log:

gameplay events
economy changes
exceptions
suspicious activity
Anti-Cheat Principles

Assume:

users modify requests
users automate actions
users manipulate frontend

Therefore:

validate all actions server-side
validate economy operations
validate timestamps
validate ownership
Deployment
Use Docker Immediately

Required services:

backend
postgres
redis
nginx
Suggested Initial Deployment
Nginx
  -> ASP.NET API
  -> Phaser Frontend Static Files
PostgreSQL
Redis
CI/CD

Recommended:

GitHub Actions

Pipeline:

build backend
run tests
build frontend
docker build
deploy to VPS
Content Pipeline
IMPORTANT

Start with placeholder assets.

Allowed:

AI-generated placeholders
free prototype assets
temporary sprites

Do NOT block MVP waiting for artists.

Asset Standards

Define early:

tile size
sprite scale
animation frame counts
layer ordering
naming conventions

Suggested:

32x32 or 64x64 tiles
Sound

Even MVP should include:

planting sound
harvest sound
coin sound
button clicks

Casual games rely heavily on feedback audio.

Performance Goals

Target:

smooth gameplay on low-end phones
low memory usage
low bandwidth

Avoid:

unnecessary asset loading
giant spritesheets
excessive websocket traffic
Development Workflow
IMPORTANT

Use iterative vertical slices.

DO NOT build entire backend first.

Correct Workflow
Step 1

Implement:

login
one farm
one crop
one tile interaction

FULLY WORKING.

Step 2

Add:

persistence
inventory
shop
Step 3

Add:

progression
XP
leveling
Step 4

Add:

social features
Step 5

Add:

monetization
polish
events
AI-Assisted Development Rules

AI is used as:

accelerator,
assistant engineer,
boilerplate generator.

Human developer remains responsible for:

architecture,
security,
balancing,
gameplay feel,
final review.
AI Coding Constraints

AI-generated code MUST:

remain modular,
include comments,
follow naming conventions,
avoid duplication,
avoid premature abstraction.
Coding Standards
Backend
async everywhere appropriate
cancellation tokens
DTO validation
structured error handling
Frontend
strict TypeScript
reusable Phaser components
scene isolation
lazy asset loading
Git Strategy

Use:

feature branches
small commits
conventional commits
MVP Definition

The MVP is COMPLETE when players can:

register/login
own a farm
plant crops
wait for crops to grow
harvest crops
gain coins/xp
buy seeds
visit friends
send gifts

Anything beyond this is NOT MVP.

Long-Term Expansion Ideas (NOT MVP)

Future possible systems:

seasonal events
pets
factories
guilds
cooperative farming
weather
quests
crafting
mobile app wrapper
AI NPCs
Go microservices later

These MUST NOT delay MVP launch.

Final Engineering Philosophy

Prioritize:

simplicity,
responsiveness,
nostalgic gameplay feel,
clean architecture,
rapid iteration,
and actual shipping.

Avoid:

overengineering,
premature optimization,
unnecessary scalability complexity,
and infinite planning.

The primary goal is:
“Launch fast, validate gameplay loop, iterate from real player feedback.”