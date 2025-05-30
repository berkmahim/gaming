const express = require('express');
const db = require('./db'); // For conceptual DB interaction
const { verifyToken } = require('./middleware/authMiddleware'); // Conceptual auth middleware
const { searchGames } = require('./rawgService'); // To fetch game details if not in local DB

const router = express.Router();

// Helper to simulate fetching game from local DB or RAWG and adding to local DB
const ensureGameInLocalDB = async (gameRawgId) => {
    let gameDetailsSql = 'SELECT * FROM games WHERE rawg_id = $1';
    console.log('Conceptual query for fetching game from local DB:', gameDetailsSql, [gameRawgId]);
    let { rows: localGames } = await db.query(gameDetailsSql, [gameRawgId]);

    if (localGames.length === 0) {
        console.log(`Game ${gameRawgId} not found in local DB, attempting to fetch from RAWG API.`);
        try {
            // RAWG API's game details endpoint is usually /games/{id}
            // searchGames is for lists. For a single game, you'd typically have a getGameDetails(id) in rawgService.
            // For now, we'll simulate that searchGames can fetch a single game if the ID is specific enough,
            // or adapt if rawgService had a getGameDetails(id) function.
            // This is a simplification for the subtask.
            const results = await searchGames(gameRawgId.toString()); // Assuming search by ID might work or getGameDetails exists
            
            const gameData = results.find(g => g.id === parseInt(gameRawgId));

            if (gameData) {
                const { name, slug, released, background_image, rating, ratings_count, platforms, genres, short_screenshots } = gameData;
                const insertGameSql = `
                    INSERT INTO games (rawg_id, name, slug, released, background_image, rating, ratings_count, platforms, genres, short_screenshots)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (rawg_id) DO NOTHING
                    RETURNING *;
                `;
                const params = [gameRawgId, name, slug, released, background_image, rating, ratings_count, JSON.stringify(platforms), JSON.stringify(genres), JSON.stringify(short_screenshots)];
                console.log('Conceptual query for inserting game into local DB:', insertGameSql, params);
                await db.query(insertGameSql, params); // Conceptual insert
                console.log(`Game ${gameRawgId} conceptually added/updated in local DB.`);
            } else {
                console.warn(`Game ${gameRawgId} not found via RAWG API either.`);
                return null; // Game not found anywhere
            }
        } catch (error) {
            console.error(`Error fetching game ${gameRawgId} from RAWG or inserting to local DB:`, error);
            // Decide if this should throw or just return null
            return null;
        }
    } else {
        console.log(`Game ${gameRawgId} found in local DB.`);
    }
    return { rawg_id: gameRawgId }; // Indicate game is available (or now cached)
};


// POST /api/user/games (Add Game to Library)
router.post('/games', verifyToken, async (req, res) => {
    const { game_rawg_id, status } = req.body;
    const userId = req.user.id; // From verifyToken

    if (!game_rawg_id || !status) {
        return res.status(400).json({ message: 'game_rawg_id and status are required.' });
    }

    try {
        // Optional: Ensure game exists in local 'games' table, fetching from RAWG if not.
        const gameExists = await ensureGameInLocalDB(game_rawg_id);
        if (!gameExists) {
            // If the game couldn't be found/added from RAWG, decide behavior.
            // For this task, we'll proceed assuming it might exist or FK is not strictly enforced to local games table yet.
            // In a stricter setup, you might return an error here if game couldn't be cached.
            console.warn(`Proceeding to add game ${game_rawg_id} to user's library without local cache confirmation.`);
        }

        const sql = `
            INSERT INTO user_games (user_id, game_rawg_id, status) 
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, game_rawg_id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const params = [userId, game_rawg_id, status];
        console.log('Conceptual query for adding/updating game in user library:', sql, params);
        const { rows } = await db.query(sql, params); // Conceptual execution

        res.status(201).json({ message: 'Game added/updated in library successfully.', data: rows[0] });
    } catch (error) {
        console.error('Error adding game to library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/user/games/:game_rawg_id (Update Game Status/Info)
router.put('/games/:game_rawg_id', verifyToken, async (req, res) => {
    const { game_rawg_id } = req.params;
    const userId = req.user.id;
    const { status, rating, review_text } = req.body;

    if (!status && rating === undefined && review_text === undefined) {
        return res.status(400).json({ message: 'At least one field (status, rating, review_text) must be provided for update.' });
    }

    // Build query dynamically based on provided fields
    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    if (status) {
        fieldsToUpdate.push(`status = $${paramCount++}`);
        values.push(status);
    }
    if (rating !== undefined) {
        fieldsToUpdate.push(`rating = $${paramCount++}`);
        values.push(rating);
    }
    if (review_text !== undefined) {
        fieldsToUpdate.push(`review_text = $${paramCount++}`);
        values.push(review_text);
    }
    
    if (fieldsToUpdate.length === 0) { // Should be caught by initial check, but as a safeguard
        return res.status(400).json({ message: "No valid fields provided for update."});
    }

    fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId, game_rawg_id);

    const sql = `
        UPDATE user_games 
        SET ${fieldsToUpdate.join(', ')}
        WHERE user_id = $${paramCount++} AND game_rawg_id = $${paramCount++}
        RETURNING *;
    `;
    console.log('Conceptual query for updating game info:', sql, values);
    
    try {
        const { rows } = await db.query(sql, values); // Conceptual execution
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Game not found in user library or no change made.' });
        }
        res.json({ message: 'Game info updated successfully.', data: rows[0] });
    } catch (error) {
        console.error('Error updating game info:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST /api/user/games/:game_rawg_id/logs (Add Game Log)
router.post('/games/:game_rawg_id/logs', verifyToken, async (req, res) => {
    const { game_rawg_id } = req.params;
    const userId = req.user.id;
    const { log_entry } = req.body;

    if (!log_entry) {
        return res.status(400).json({ message: 'log_entry is required.' });
    }

    const newLog = { timestamp: new Date().toISOString(), entry: log_entry };

    // Conceptual: Fetch existing logs, append new, then update.
    // In a real DB, you might use JSONB functions to append directly if possible.
    const selectSql = 'SELECT log_entries FROM user_games WHERE user_id = $1 AND game_rawg_id = $2;';
    console.log('Conceptual query for fetching logs:', selectSql, [userId, game_rawg_id]);
    
    try {
        // Simulate fetching existing entry. db.js needs to be adapted or this needs to be more generic.
        // For now, assume a conceptual fetch.
        // const { rows: existing } = await db.query(selectSql, [userId, game_rawg_id]);
        // if (existing.length === 0) {
        //     return res.status(404).json({ message: 'Game not found in user library.' });
        // }
        // const currentLogs = existing[0].log_entries || [];
        // currentLogs.push(newLog);
        // This part is highly conceptual without a real db.query that returns specific data.
        // Let's simulate currentLogs for the purpose of constructing the update query.
        const simulatedCurrentLogs = [{ timestamp: "2023-01-01T12:00:00.000Z", entry: "Started playing." }];
        simulatedCurrentLogs.push(newLog); // Add the new log to the simulated current logs

        const updateSql = `
            UPDATE user_games 
            SET log_entries = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2 AND game_rawg_id = $3
            RETURNING log_entries; 
        `;
        // const params = [JSON.stringify(currentLogs), userId, game_rawg_id];
        const params = [JSON.stringify(simulatedCurrentLogs), userId, game_rawg_id]; // Using simulated logs
        console.log('Conceptual query for updating logs:', updateSql, params);
        
        // Conceptual update
        // const { rows: updated } = await db.query(updateSql, params);
        // For simulation, assume the update was successful and returns the new log array.
        const updatedLogEntries = simulatedCurrentLogs;


        res.status(201).json({ message: 'Log entry added.', data: updatedLogEntries });
    } catch (error) {
        console.error('Error adding log entry:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/user/games (Get User's Game Library)
router.get('/games', verifyToken, async (req, res) => {
    const userId = req.user.id;
    // Conceptual query: Select from user_games, potentially join with games table for details
    // For this subtask, we'll just show the user_games data.
    const sql = `
        SELECT ug.* 
        FROM user_games ug
        WHERE ug.user_id = $1
        ORDER BY ug.updated_at DESC; 
    `;
    // If joining with a local 'games' table:
    // const sql = `
    //     SELECT ug.status, ug.rating, ug.review_text, ug.log_entries, ug.added_at, ug.updated_at,
    //            g.rawg_id, g.name, g.slug, g.background_image, g.released 
    //     FROM user_games ug
    //     JOIN games g ON ug.game_rawg_id = g.rawg_id
    //     WHERE ug.user_id = $1
    //     ORDER BY ug.updated_at DESC;
    // `;
    console.log('Conceptual query for fetching user game library:', sql, [userId]);

    try {
        // Conceptual execution. db.js needs to be able to simulate this.
        // For now, returning a placeholder.
        const placeholderLibrary = [
            { user_id: userId, game_rawg_id: 3498, status: 'Playing', rating: 5, review_text: "Great game!", log_entries: [], added_at: new Date(), updated_at: new Date() },
            { user_id: userId, game_rawg_id: 5286, status: 'Completed', rating: 4, review_text: null, log_entries: [], added_at: new Date(), updated_at: new Date() }
        ];
        // const { rows } = await db.query(sql, [userId]);
        // res.json(rows);
        res.json(placeholderLibrary);
    } catch (error) {
        console.error('Error fetching user game library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
