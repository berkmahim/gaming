-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    rawg_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    released DATE,
    background_image TEXT,
    rating DECIMAL,
    ratings_count INTEGER,
    platforms JSONB,
    genres JSONB,
    short_screenshots JSONB,
    -- Additional fields for more detailed game information
    description_raw TEXT, -- Raw description, often HTML
    description_plain TEXT, -- Plain text description
    website VARCHAR(255),
    esrb_rating VARCHAR(100), -- e.g., "Mature", "Everyone 10+"
    metacritic_score INTEGER,
    metacritic_url VARCHAR(255),
    developers JSONB,
    publishers JSONB,
    tags JSONB,
    stores JSONB, -- To store info about where to buy the game
    tba BOOLEAN, -- To be announced
    released_day INTEGER,
    released_month INTEGER,
    released_year INTEGER,
    parent_platforms JSONB, -- Broader platform categories like PC, PlayStation, Xbox
    playtime INTEGER, -- Average playtime in hours
    slug VARCHAR(255) UNIQUE, -- Ensure slug is unique if not already
    -- End of additional fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure slug is unique (if not already handled by the previous slug definition)
-- ALTER TABLE games DROP CONSTRAINT IF EXISTS games_slug_key; -- Drop if it exists from a previous less specific definition
-- ALTER TABLE games ADD CONSTRAINT games_slug_key UNIQUE (slug);


-- Optional: Add triggers to automatically update updated_at timestamps

-- For users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table (if not already present from previous steps)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Trigger for games table (if not already present from previous steps)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_games_updated_at') THEN
        CREATE TRIGGER update_games_updated_at
        BEFORE UPDATE ON games
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
