-- Lists table
CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- The list owner
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically update updated_at timestamp for lists table
-- Assumes the function update_updated_at_column() already exists from schema.sql
CREATE TRIGGER update_lists_updated_at
BEFORE UPDATE ON lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index on user_id for lists table for quick lookup of user's lists
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);


-- List Games table (join table for lists and games)
CREATE TABLE list_games (
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    game_rawg_id INTEGER NOT NULL, -- Referencing RAWG ID.
                                 -- Similar to user_games, could conceptually link to a local games.rawg_id.
                                 -- Application logic would handle fetching game details from RAWG API.
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- User's notes about this game in this specific list
    PRIMARY KEY (list_id, game_rawg_id)
);

-- Optional: Index on game_rawg_id in list_games if you often query for lists containing a specific game
CREATE INDEX IF NOT EXISTS idx_list_games_game_rawg_id ON list_games(game_rawg_id);

-- Note on game_rawg_id:
-- Similar to user_games, application logic should ensure that when a game is added to a list,
-- its details are fetched from RAWG (if not already available) and potentially cached in the local 'games' table.
-- A foreign key to 'games.rawg_id' could be added if strict local caching is enforced.
-- ALTER TABLE games ADD CONSTRAINT IF NOT EXISTS unique_rawg_id UNIQUE (rawg_id);
-- ALTER TABLE list_games ADD CONSTRAINT fk_list_games_game_rawg_id
-- FOREIGN KEY (game_rawg_id) REFERENCES games(rawg_id) ON DELETE RESTRICT;
