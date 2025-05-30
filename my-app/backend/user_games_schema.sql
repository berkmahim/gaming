-- User Games table to link users to games and store their interactions
CREATE TABLE user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_rawg_id INTEGER NOT NULL, -- This will store the RAWG API ID.
                                 -- Conceptually, it might reference a local 'games.rawg_id' if the game is cached in our DB.
                                 -- For direct linking without mandatory local caching first, we don't enforce a FK to games.rawg_id here initially.
                                 -- A trigger or application logic could ensure 'games' table is populated.
    status VARCHAR(50) CHECK (status IN ('Playing', 'Completed', 'Want to Play', 'Dropped', 'Paused', 'Wishlist')), -- Example statuses
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Nullable, e.g., 1-5 stars
    review_text TEXT,
    log_entries JSONB, -- To store an array of log objects like {"timestamp": "...", "entry": "..."}
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, game_rawg_id) -- Ensures a user can only have one entry per game
);

-- Trigger to automatically update updated_at timestamp for user_games table
-- Assumes the function update_updated_at_column() already exists from schema.sql
CREATE TRIGGER update_user_games_updated_at
BEFORE UPDATE ON user_games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional: Index on game_rawg_id if you often query user_games by game_rawg_id across all users
CREATE INDEX IF NOT EXISTS idx_user_games_game_rawg_id ON user_games(game_rawg_id);

-- Note on foreign key to games.rawg_id:
-- If you want to ensure that every game_rawg_id in user_games corresponds to an entry
-- in your local 'games' table (which should also have a UNIQUE constraint on rawg_id),
-- you would first ensure 'games.rawg_id' is unique and then add a foreign key:
-- ALTER TABLE games ADD CONSTRAINT unique_rawg_id UNIQUE (rawg_id);
-- ALTER TABLE user_games ADD CONSTRAINT fk_user_games_game_rawg_id
-- FOREIGN KEY (game_rawg_id) REFERENCES games(rawg_id) ON DELETE RESTRICT;
-- This makes adding games to user_games dependent on them first being in the 'games' table.
-- The current schema allows adding to user_games even if the game isn't in our local 'games' cache yet.
-- Application logic would handle fetching game details from RAWG API and populating 'games' table as needed.
