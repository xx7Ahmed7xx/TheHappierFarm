-- Happier Farm Database Initialization
-- Run this once during first deployment
-- Creates the 'happier_farm' database and role in existing postgres

-- Create the happier_farm database
CREATE DATABASE happier_farm;

-- Create the happier_farm role with appropriate privileges
CREATE ROLE happier_farm WITH PASSWORD '__DB_PASSWORD__' LOGIN CREATEROLE;

-- Grant all privileges on the new database
GRANT ALL PRIVILEGES ON DATABASE happier_farm TO happier_farm;

-- Create farm placement tiles
CREATE TABLE FarmPlacement (
    id SERIAL PRIMARY KEY,
    x INTEGER NOT NULL CHECK (x >= 0),
    y INTEGER NOT NULL CHECK (y >= 0),
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    placement_kind INTEGER NOT NULL REFERENCES PlacementKinds(id),
    player_id INTEGER NOT NULL REFERENCES Player(id),
    UNIQUE(player_id, x, y, width, height, placement_kind)
);

-- Create player resources (barn inventory)
CREATE TABLE PlayerResources (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES Player(id),
    resource_code VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    UNIQUE(player_id, resource_code)
);

-- Create player-owned items (inventory)
CREATE TABLE PlayerInventory (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES Player(id),
    entity_code VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL REFERENCES HappierFarm.Domain.Entities.Id,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE(player_id, entity_code, entity_id)
);

-- Create game config snapshot (loaded once on startup)
CREATE TABLE GameConfigSnapshot (
    id SERIAL PRIMARY KEY,
    default_grid_size INTEGER NOT NULL,
    min_grid_size INTEGER NOT NULL,
    absolute_max_grid_size INTEGER NOT NULL,
    expansion_base_price INTEGER NOT NULL,
    expansion_growth_rate DOUBLE PRECISION NOT NULL,
    expansion_area_tax_per_step_sq INTEGER NOT NULL,
    base_storage_capacity INTEGER NOT NULL,
    storage_per_level INTEGER NOT NULL,
    max_banked_animal_cycles INTEGER NOT NULL,
    barn_factory_type_id INTEGER NOT NULL,
    starter_gold INTEGER NOT NULL,
    starter_dinars INTEGER NOT NULL,
    global_time_percent INTEGER NOT NULL,
    active_event_name TEXT,
    active_event_message TEXT,
    active_event_time_percent INTEGER NOT NULL,
    barn_upgrade_tiers TEXT NOT NULL,  -- JSON array of {tier, bonus_slots, gold_cost}
    timing_overrides TEXT NOT NULL    -- JSON object keyed by (kind,id)
);

-- Create barn upgrade tiers (loaded once on startup)
CREATE TABLE BarnUpgradeTier (
    tier INTEGER PRIMARY KEY,
    bonus_slots INTEGER NOT NULL,
    gold_cost INTEGER NOT NULL
);

-- Create player decorations
CREATE TABLE PlayerDecoration (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES Player(id),
    x INTEGER NOT NULL CHECK (x >= 0),
    y INTEGER NOT NULL CHECK (y >= 0),
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    decoration_code VARCHAR(50) NOT NULL,
    decoration_id INTEGER NOT NULL REFERENCES HappierFarm.Domain.Entities.Id,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE(player_id, x, y, width, height, decoration_code, decoration_id)
);

-- Create player animals
CREATE TABLE PlayerAnimal (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES Player(id),
    x INTEGER NOT NULL CHECK (x >= 0),
    y INTEGER NOT NULL CHECK (y >= 0),
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    animal_code VARCHAR(50) NOT NULL,
    animal_id INTEGER NOT NULL REFERENCES HappierFarm.Domain.Entities.Id,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE(player_id, x, y, width, height, animal_code, animal_id)
);

-- Create player factories
CREATE TABLE PlayerFactory (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES Player(id),
    x INTEGER NOT NULL CHECK (x >= 0),
    y INTEGER NOT NULL CHECK (y >= 0),
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    factory_code VARCHAR(50) NOT NULL,
    factory_id INTEGER NOT NULL REFERENCES HappierFarm.Domain.Entities.Id,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE(player_id, x, y, width, height, factory_code, factory_id)
);

-- Create barn upgrade tiers table (denormalized for performance)
CREATE TABLE BarnUpgradeTierData (
    tier INTEGER PRIMARY KEY,
    bonus_slots INTEGER NOT NULL,
    gold_cost INTEGER NOT NULL
);

-- Create player XP (if needed)
CREATE TABLE PlayerXp (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES Player(id),
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    UNIQUE(player_id)
);

-- Indexes for performance
CREATE INDEX idx_player_resources ON PlayerResources(player_id, resource_code);
CREATE INDEX idx_player_inventory ON PlayerInventory(player_id, entity_code, entity_id);
CREATE INDEX idx_player_decoration ON PlayerDecoration(player_id, x, y, decoration_code, decoration_id);
CREATE INDEX idx_player_animal ON PlayerAnimal(player_id, x, y, animal_code, animal_id);
CREATE INDEX idx_player_factory ON PlayerFactory(player_id, x, y, factory_code, factory_id);

-- Insert default values for enums if not present
DO $$
BEGIN
    -- Create PlacementKinds enum if not exists
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlacementKind') THEN
            CREATE TYPE PlacementKind AS ENUM ('animal', 'factory', 'decoration');
        END IF;
    END $$;

    -- Seed default config snapshot
    INSERT INTO GameConfigSnapshot (
        default_grid_size, min_grid_size, absolute_max_grid_size,
        expansion_base_price, expansion_growth_rate, expansion_area_tax_per_step_sq,
        base_storage_capacity, storage_per_level, max_banked_animal_cycles,
        barn_factory_type_id, starter_gold, starter_dinars, global_time_percent,
        barn_upgrade_tiers, timing_overrides
    ) VALUES (
        4, 4, 64,
        100, 1.5, 10,
        100, 50, 20,
        0, 10000, 100,
        100, '{\"tiers\":[]}', '{\"(kind,id)\":{}}'
    );
    
    -- Seed default barn upgrade tiers
    INSERT INTO BarnUpgradeTierData (tier, bonus_slots, gold_cost)
    VALUES (1, 2, 1000),
           (2, 4, 3000),
           (3, 6, 7000),
           (4, 8, 12000),
           (5, 10, 18000);
END $$;

-- Verify creation
SELECT 'happier_farm database created' AS status;