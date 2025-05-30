const express = require('express');
const db = require('./db'); // For conceptual DB interaction
const { verifyToken } = require('./middleware/authMiddleware'); // Conceptual auth middleware
const { searchGames } = require('./rawgService'); // To fetch game details if not in local DB (optional helper)

const router = express.Router();

// Helper (similar to one in userGameRoutes.js) to ensure game is in local DB (conceptual)
const ensureGameInLocalDB_conceptual = async (gameRawgId) => {
    // This is a simplified conceptual check. In a real app, this would be more robust.
    console.log(`Conceptual: Checking if game ${gameRawgId} is in local DB or fetching from RAWG.`);
    // Simulate that the game is found or fetched and added.
    // Actual implementation would involve querying 'games' table and calling rawgService if not found.
    return true; 
};


// POST /api/lists (Create List)
router.post('/', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { name, description, is_public = true } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'List name is required.' });
    }

    const sql = 'INSERT INTO lists (user_id, name, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *';
    const params = [userId, name, description, is_public];
    console.log('Conceptual query for creating list:', sql, params);

    try {
        // const { rows } = await db.query(sql, params);
        // Simulate DB returning the new list.
        const newList = { id: Date.now(), user_id: userId, name, description, is_public, created_at: new Date(), updated_at: new Date() };
        res.status(201).json(newList);
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({ message: 'Server error while creating list.' });
    }
});

// GET /api/lists (Get Public Lists)
router.get('/', async (req, res) => {
    const sql = 'SELECT * FROM lists WHERE is_public = TRUE ORDER BY created_at DESC';
    console.log('Conceptual query for fetching public lists:', sql);
    try {
        // const { rows } = await db.query(sql);
        const placeholderLists = [{ id: 1, name: 'Public List 1', user_id: 99, description: 'Fun games', is_public: true }];
        res.json(placeholderLists);
    } catch (error) {
        console.error('Error fetching public lists:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/users/:userId/lists (Get User's Lists)
router.get('/user/:userId', verifyToken, async (req, res) => {
    const targetUserId = parseInt(req.params.userId, 10);
    const authenticatedUserId = req.user.id;
    let sql;
    let params = [targetUserId];

    if (targetUserId === authenticatedUserId) {
        // User is requesting their own lists, show all (public and private)
        sql = 'SELECT * FROM lists WHERE user_id = $1 ORDER BY updated_at DESC';
    } else {
        // User is requesting another user's lists, only show public
        sql = 'SELECT * FROM lists WHERE user_id = $1 AND is_public = TRUE ORDER BY updated_at DESC';
    }
    console.log('Conceptual query for fetching user lists:', sql, params);
    try {
        // const { rows } = await db.query(sql, params);
        const placeholderUserLists = [{ id: 2, name: 'My Private List', user_id: targetUserId, is_public: false }];
        res.json(placeholderUserLists);
    } catch (error) {
        console.error('Error fetching user lists:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/lists/:listId (Get Specific List Details)
router.get('/:listId', async (req, res) => { // verifyToken could be added if private lists need strict checking
    const listId = parseInt(req.params.listId, 10);
    // Conceptual: Fetch list details and its games.
    // Needs to check if list is public or if user is owner for private lists.
    // This logic can be complex: fetch list, then if private, check ownership via req.user.id
    
    const listDetailsSql = 'SELECT * FROM lists WHERE id = $1';
    console.log('Conceptual query for list details:', listDetailsSql, [listId]);
    // const { rows: listRows } = await db.query(listDetailsSql, [listId]);
    const placeholderList = { id: listId, name: 'Awesome Games', user_id: 123, description: 'List of awesome games', is_public: true }; // Simulate fetched list

    if (!placeholderList) { // if (!listRows || listRows.length === 0)
        return res.status(404).json({ message: 'List not found.' });
    }
    
    // Conceptual: if (!list.is_public && (!req.user || list.user_id !== req.user.id)) return res.status(403)
    // For now, assume list is accessible or user is owner.

    const listGamesSql = `
        SELECT lg.*, g.name as game_name, g.background_image as game_background_image 
        FROM list_games lg
        LEFT JOIN games g ON lg.game_rawg_id = g.rawg_id -- Conceptual join with local games table
        WHERE lg.list_id = $1
        ORDER BY lg.added_at ASC;
    `;
    console.log('Conceptual query for games in list:', listGamesSql, [listId]);
    // const { rows: gameRows } = await db.query(listGamesSql, [listId]);
    const placeholderGamesInList = [
        { game_rawg_id: 3498, notes: 'Must play!', game_name: 'The Witcher 3', game_background_image: 'url1' },
        { game_rawg_id: 5286, notes: 'Epic story', game_name: 'RDR2', game_background_image: 'url2' }
    ];
    
    res.json({ ...placeholderList, games: placeholderGamesInList });
});

// PUT /api/lists/:listId (Update List)
router.put('/:listId', verifyToken, async (req, res) => {
    const listId = parseInt(req.params.listId, 10);
    const userId = req.user.id;
    const { name, description, is_public } = req.body;

    // Conceptual: First, verify ownership
    const checkOwnerSql = 'SELECT user_id FROM lists WHERE id = $1';
    console.log('Conceptual query for checking list ownership:', checkOwnerSql, [listId]);
    // const { rows: ownerRows } = await db.query(checkOwnerSql, [listId]);
    // if (ownerRows.length === 0) return res.status(404).json({ message: 'List not found.' });
    // if (ownerRows[0].user_id !== userId) return res.status(403).json({ message: 'Forbidden: You do not own this list.' });
    console.log(`Conceptual: User ${userId} is trying to update list ${listId}. Ownership check passed.`);

    // Build query dynamically (omitted for brevity, assume all fields can be updated)
    const updateSql = 'UPDATE lists SET name = $1, description = $2, is_public = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *';
    const params = [name, description, is_public, listId, userId];
    console.log('Conceptual query for updating list:', updateSql, params);
    
    try {
        // const { rows } = await db.query(updateSql, params);
        const updatedList = { id: listId, user_id: userId, name, description, is_public };
        res.json(updatedList);
    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/lists/:listId (Delete List)
router.delete('/:listId', verifyToken, async (req, res) => {
    const listId = parseInt(req.params.listId, 10);
    const userId = req.user.id;

    // Conceptual: Verify ownership before delete (similar to PUT)
    console.log(`Conceptual: User ${userId} trying to delete list ${listId}. Ownership check passed.`);

    const sql = 'DELETE FROM lists WHERE id = $1 AND user_id = $2';
    console.log('Conceptual query for deleting list:', sql, [listId, userId]);
    try {
        // await db.query(sql, [listId, userId]); (CASCADE should handle list_games)
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST /api/lists/:listId/games (Add Game to List)
router.post('/:listId/games', verifyToken, async (req, res) => {
    const listId = parseInt(req.params.listId, 10);
    const userId = req.user.id; // For ownership check
    const { game_rawg_id, notes } = req.body;

    if (!game_rawg_id) {
        return res.status(400).json({ message: 'game_rawg_id is required.' });
    }
    
    // Conceptual: Verify list ownership (similar to PUT/DELETE)
    console.log(`Conceptual: User ${userId} trying to add game to list ${listId}. Ownership check passed.`);
    
    // Optional: Ensure game exists in local 'games' table
    await ensureGameInLocalDB_conceptual(game_rawg_id);

    const sql = 'INSERT INTO list_games (list_id, game_rawg_id, notes) VALUES ($1, $2, $3) ON CONFLICT (list_id, game_rawg_id) DO UPDATE SET notes = EXCLUDED.notes RETURNING *';
    const params = [listId, game_rawg_id, notes];
    console.log('Conceptual query for adding game to list:', sql, params);
    try {
        // const { rows } = await db.query(sql, params);
        const addedGame = { list_id: listId, game_rawg_id, notes, added_at: new Date() };
        res.status(201).json(addedGame);
    } catch (error) {
        console.error('Error adding game to list:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/lists/:listId/games/:game_rawg_id (Remove Game from List)
router.delete('/:listId/games/:game_rawg_id', verifyToken, async (req, res) => {
    const listId = parseInt(req.params.listId, 10);
    const gameRawgId = parseInt(req.params.game_rawg_id, 10);
    const userId = req.user.id; // For ownership check

    // Conceptual: Verify list ownership (similar to PUT/DELETE)
    console.log(`Conceptual: User ${userId} trying to remove game ${gameRawgId} from list ${listId}. Ownership check passed.`);

    const sql = 'DELETE FROM list_games WHERE list_id = $1 AND game_rawg_id = $2';
    console.log('Conceptual query for removing game from list:', sql, [listId, gameRawgId]);
    try {
        // await db.query(sql, [listId, gameRawgId]);
        res.status(204).send();
    } catch (error) {
        console.error('Error removing game from list:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
