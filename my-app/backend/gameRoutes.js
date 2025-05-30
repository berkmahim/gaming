const express = require('express');
const { searchGames, getGameDetails } = require('./rawgService');
const db = require('./db'); // For conceptual DB interaction
const { verifyToken } = require('./middleware/authMiddleware'); // Conceptual, for user-specific data

const router = express.Router();

// GET /api/games/search (or /api/games for general browsing with filters)
router.get('/search', async (req, res) => {
  // Extract filters from query parameters
  const { q: search, platforms, genres, tags, ordering, page, page_size } = req.query;
  
  const filters = {};
  if (search) filters.search = search;
  if (platforms) filters.platforms = platforms;
  if (genres) filters.genres = genres;
  if (tags) filters.tags = tags;
  if (ordering) filters.ordering = ordering;
  if (page) filters.page = page;
  if (page_size) filters.page_size = page_size;

  try {
    // searchGames now expects an object of filters and returns { results, count, next, previous }
    const rawgResponse = await searchGames(filters); 
    res.json(rawgResponse); // Send the whole response for pagination support
  } catch (error) {
    console.error(`Error in /api/games/search with filters "${JSON.stringify(filters)}":`, error);
    if (error.message.startsWith('RAWG API') || error.message.startsWith('No response') || error.message.startsWith('Failed to make')) {
        return res.status(502).json({ message: 'Failed to fetch data from external game service.', details: error.message });
    }
    res.status(500).json({ message: 'Server error while searching for games.' });
  }
});


// GET /api/games/:rawg_id
router.get('/:rawg_id', async (req, res) => {
    const { rawg_id } = req.params;
    const authenticatedUserId = req.user ? req.user.id : null; // Conceptual: check if verifyToken was used and set req.user

    try {
        const gameDetails = await getGameDetails(rawg_id);

        // Conceptual: Cache the fetched game details into local 'games' table
        const {
            name, slug, released, background_image, rating, ratings_count, platforms, genres, short_screenshots,
            description_raw, // Assuming RAWG API provides this as 'description'
            description: description_plain, // Assuming RAWG API provides this as 'description_raw' or similar, needs mapping
            website, esrb_rating, metacritic: metacritic_score, // Assuming 'metacritic' is the score
            metacritic_url, developers, publishers, tags, stores, tba, playtime
            // release date parts might need to be extracted from 'released' string if not separate fields
        } = gameDetails;
        
        // Simplified parsing of release date, RAWG provides "YYYY-MM-DD"
        let released_year = null, released_month = null, released_day = null;
        if (released) {
            const parts = released.split('-');
            if (parts.length === 3) {
                released_year = parseInt(parts[0]);
                released_month = parseInt(parts[1]);
                released_day = parseInt(parts[2]);
            }
        }
        
        const parent_platforms = gameDetails.parent_platforms; // Already in correct format from RAWG

        const cacheSql = `
            INSERT INTO games (
                rawg_id, name, slug, released, background_image, rating, ratings_count, platforms, genres, short_screenshots,
                description_raw, description_plain, website, esrb_rating, metacritic_score, metacritic_url, developers, publishers, tags, stores, tba, 
                released_day, released_month, released_year, parent_platforms, playtime
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
            )
            ON CONFLICT (rawg_id) DO UPDATE SET
                name = EXCLUDED.name,
                slug = EXCLUDED.slug,
                released = EXCLUDED.released,
                background_image = EXCLUDED.background_image,
                rating = EXCLUDED.rating,
                ratings_count = EXCLUDED.ratings_count,
                platforms = EXCLUDED.platforms,
                genres = EXCLUDED.genres,
                short_screenshots = EXCLUDED.short_screenshots,
                description_raw = EXCLUDED.description_raw,
                description_plain = EXCLUDED.description_plain,
                website = EXCLUDED.website,
                esrb_rating = EXCLUDED.esrb_rating,
                metacritic_score = EXCLUDED.metacritic_score,
                metacritic_url = EXCLUDED.metacritic_url,
                developers = EXCLUDED.developers,
                publishers = EXCLUDED.publishers,
                tags = EXCLUDED.tags,
                stores = EXCLUDED.stores,
                tba = EXCLUDED.tba,
                released_day = EXCLUDED.released_day,
                released_month = EXCLUDED.released_month,
                released_year = EXCLUDED.released_year,
                parent_platforms = EXCLUDED.parent_platforms,
                playtime = EXCLUDED.playtime,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const esrb = esrb_rating ? esrb_rating.name : null; // RAWG esrb_rating is an object
        const params = [
            rawg_id, name, slug, released, background_image, rating, ratings_count, JSON.stringify(platforms), JSON.stringify(genres), JSON.stringify(short_screenshots),
            gameDetails.description, // description_raw (HTML content from RAWG)
            gameDetails.description_raw, // description_plain (often also HTML or sometimes plain, depends on RAWG specific game) -> this mapping might need adjustment based on actual RAWG output. For now, using description_raw for plain text.
            website, esrb, metacritic_score, metacritic_url, JSON.stringify(developers), JSON.stringify(publishers), JSON.stringify(tags), JSON.stringify(stores), tba,
            released_day, released_month, released_year, JSON.stringify(parent_platforms), playtime
        ];
        console.log('Conceptual query for caching game details:', cacheSql, params.slice(0, 5)); // Log only a few params for brevity
        await db.query(cacheSql, params); // Conceptual execution

        let userSpecificData = null;
        if (authenticatedUserId) {
            const userGameSql = 'SELECT status, rating, review_text, log_entries FROM user_games WHERE user_id = $1 AND game_rawg_id = $2';
            console.log('Conceptual query for user-specific game data:', userGameSql, [authenticatedUserId, rawg_id]);
            // const { rows: userRows } = await db.query(userGameSql, [authenticatedUserId, rawg_id]);
            // if (userRows.length > 0) {
            //     userSpecificData = userRows[0];
            // }
            // Simulate finding user data
            userSpecificData = { status: "Playing", rating: 5, review_text: "Awesome game!", log_entries: [] };
        }

        res.json({ ...gameDetails, user_game_data: userSpecificData });

    } catch (error) {
        console.error(`Error fetching game details for RAWG ID ${rawg_id}:`, error);
        if (error.message.startsWith('RAWG API') || error.message.startsWith('No response')) {
            return res.status(502).json({ message: 'Failed to fetch data from external game service.', details: error.message });
        }
        res.status(500).json({ message: 'Server error while fetching game details.' });
    }
});


module.exports = router;
