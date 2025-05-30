// rawgService.js

// This file handles communication with the RAWG API to fetch game data.

const axios = require('axios'); // Import axios for making HTTP requests

// Load environment variables from .env file
//require('dotenv').config();

// Retrieve the RAWG API key from environment variables
const RAWG_API_KEY = '824e7f0766b44af1bb4d44d684c1a71';

// Base URL for the RAWG API
const RAWG_API_BASE_URL = 'https://api.rawg.io/api';

/**
 * Searches for games using the RAWG API with extended filtering capabilities.
 * This function consolidates previous search implementations to accept a filters object.
 *
 * @param {object} filters - An object containing various filters for the API request.
 * @param {string} [filters.search] - Search query for games.
 * @param {string} [filters.genres] - Comma-separated list of genre IDs or slugs.
 * @param {string} [filters.platforms] - Comma-separated list of platform IDs or slugs.
 * @param {string} [filters.developers] - Comma-separated list of developer IDs or slugs.
 * @param {string} [filters.publishers] - Comma-separated list of publisher IDs or slugs.
 * @param {string} [filters.tags] - Comma-separated list of tag IDs or slugs.
 * @param {string} [filters.dates] - A string of comma-separated dates, e.g., '2020-01-01,2021-12-31'.
 * @param {string} [filters.ordering] - Field to order the results by, e.g., 'released', '-rating'.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.page_size] - Number of results per page (max 40).
 * @returns {Promise<object>} - A promise that resolves to the API response data (including results, count, next, previous).
 * @throws {Error} If the API request fails or returns an error.
 */
const searchGames = async (filters = {}) => {
    // Ensure filters object is not null/undefined
    filters = filters || {};

    // If a direct searchQuery was passed instead of a filters object, convert it
    // This handles the case where `searchGames("some query")` might still be used
    if (typeof filters === 'string') {
        filters = { search: filters };
    }

    if (!filters.search && Object.keys(filters).length === 0) {
        // Only throw error if no search term AND no other filters are provided
        // This allows fetching all games if no filters are specified
        // throw new Error('Search query or filters cannot be empty.');
        console.warn('No search query or filters provided, fetching general game list.');
    }

    let url = `${RAWG_API_BASE_URL}/games?key=${RAWG_API_KEY}`;

    // Dynamically add filters to the URL
    if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
    }
    if (filters.platforms) {
        url += `&platforms=${encodeURIComponent(filters.platforms)}`;
    }
    if (filters.genres) {
        url += `&genres=${encodeURIComponent(filters.genres)}`;
    }
    if (filters.tags) {
        url += `&tags=${encodeURIComponent(filters.tags)}`;
    }
    if (filters.ordering) {
        url += `&ordering=${encodeURIComponent(filters.ordering)}`;
    }
    if (filters.page) {
        url += `&page=${filters.page}`;
    }
    if (filters.page_size) {
        url += `&page_size=${filters.page_size}`;
    }
    // Add other RAWG supported filters as needed: dates, metacritic, parent_platforms, etc.
    // Example for dates: if (filters.dates) { url += `&dates=${encodeURIComponent(filters.dates)}`; }

    console.log(`Requesting RAWG API (searchGames): ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'GameCollectionApp/1.0' // RAWG API sometimes requires a User-Agent
            }
        });

        if (response.data) {
            // RAWG returns results in response.data.results, along with count, next, previous
            return response.data;
        } else {
            // Handle cases where API returns success but no main data object
            console.warn('RAWG API returned success but no main data object for filters:', filters);
            return { results: [], count: 0 }; // Consistent return type
        }
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('RAWG API Error Response (searchGames):', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
                queryUrl: url // Log the full URL that caused the error
            });
            throw new Error(`RAWG API request (searchGames) failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('RAWG API No Response (searchGames):', { errorRequest: error.request, queryUrl: url });
            throw new Error('No response received from RAWG API (searchGames).');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('RAWG API Request Setup Error (searchGames):', { errorMessage: error.message, queryUrl: url });
            throw new Error(`Failed to make RAWG API request (searchGames): ${error.message}`);
        }
    }
};

/**
 * Fetches detailed information for a specific game from RAWG API.
 * @param {string|number} rawgId The RAWG ID of the game.
 * @returns {Promise<Object>} A promise that resolves to the detailed game object.
 * @throws {Error} If the API request fails or returns an error.
 */
const getGameDetails = async (rawgId) => {
    if (!rawgId) {
        throw new Error('RAWG ID cannot be empty.');
    }

    const url = `${RAWG_API_BASE_URL}/games/${rawgId}?key=${RAWG_API_KEY}`;
    console.log(`Requesting RAWG API for game details: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });

        if (response.data) {
            return response.data;
        } else {
            throw new Error(`No data returned from RAWG API for game ID ${rawgId}`);
        }
    } catch (error) {
        if (error.response) {
            console.error('RAWG API Error Response (getGameDetails):', {
                status: error.response.status,
                data: error.response.data,
                query: rawgId
            });
            throw new Error(`RAWG API request for game details failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
        } else if (error.request) {
            console.error('RAWG API No Response (getGameDetails):', { errorRequest: error.request, query: rawgId });
            throw new Error('No response received from RAWG API for game details.');
        } else {
            console.error('RAWG API Request Setup Error (getGameDetails):', { errorMessage: error.message, query: rawgId });
            throw new Error(`Failed to make RAWG API request for game details: ${error.message}`);
        }
    }
};

/**
 * Fetches screenshots for a specific game by its ID.
 * @param {number|string} gameId - The ID of the game to fetch screenshots for.
 * @returns {Promise<object>} - A promise that resolves to the screenshots data.
 */
const getGameScreenshots = async (gameId) => {
    try {
        const response = await axios.get(`${RAWG_API_BASE_URL}/games/${gameId}/screenshots`, {
            params: {
                key: RAWG_API_KEY,
            },
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching screenshots for game ID ${gameId}:`, error.message);
        if (error.response) {
            console.error('RAWG API Response Error:', error.response.status, error.response.data);
        }
        throw new Error(`Failed to fetch screenshots for game ID ${gameId} from RAWG API.`);
    }
};

/**
 * Fetches game trailers/movies for a specific game by its ID.
 * @param {number|string} gameId - The ID of the game to fetch trailers for.
 * @returns {Promise<object>} - A promise that resolves to the trailers data.
 */
const getGameTrailers = async (gameId) => {
    try {
        const response = await axios.get(`${RAWG_API_BASE_URL}/games/${gameId}/movies`, {
            params: {
                key: RAWG_API_KEY,
            },
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching trailers for game ID ${gameId}:`, error.message);
        if (error.response) {
            console.error('RAWG API Response Error:', error.response.status, error.response.data);
        }
        throw new Error(`Failed to fetch trailers for game ID ${gameId} from RAWG API.`);
    }
};

/**
 * Fetches a list of game genres.
 * @returns {Promise<object>} - A promise that resolves to the genres data.
 */
const getGenres = async () => {
    try {
        const response = await axios.get(`${RAWG_API_BASE_URL}/genres`, {
            params: {
                key: RAWG_API_KEY,
            },
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching genres:', error.message);
        if (error.response) {
            console.error('RAWG API Response Error:', error.response.status, error.response.data);
        }
        throw new Error('Failed to fetch genres from RAWG API.');
    }
};

/**
 * Fetches a list of game platforms.
 * @returns {Promise<object>} - A promise that resolves to the platforms data.
 */
const getPlatforms = async () => {
    try {
        const response = await axios.get(`${RAWG_API_BASE_URL}/platforms`, {
            params: {
                key: RAWG_API_KEY,
            },
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching platforms:', error.message);
        if (error.response) {
            console.error('RAWG API Response Error:', error.response.status, error.response.data);
        }
        throw new Error('Failed to fetch platforms from RAWG API.');
    }
};

/**
 * Fetches details for a specific developer from RAWG API.
 * Endpoint: https://api.rawg.io/api/developers/{developer_slug_or_id}
 * @param {string|number} developerSlugOrId Slug or ID of the developer.
 * @returns {Promise<Object>} A promise that resolves to the detailed developer object.
 * @throws {Error} If the API request fails or returns an error.
 */
const getDeveloperDetails = async (developerSlugOrId) => {
    if (!developerSlugOrId) {
        throw new Error('Developer slug or ID cannot be empty.');
    }
    const url = `${RAWG_API_BASE_URL}/developers/${developerSlugOrId}?key=${RAWG_API_KEY}`;
    console.log(`Requesting RAWG API for developer details: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        if (response.data) {
            return response.data;
        } else {
            throw new Error(`No data returned from RAWG API for developer ID ${developerSlugOrId}`);
        }
    } catch (error) {
        console.error('RAWG API Error Response (getDeveloperDetails):', {
            status: error.response.status,
            data: error.response.data,
            query: developerSlugOrId
        });
        throw new Error(`RAWG API request for developer details failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
    }
};

/**
 * Fetches details for a specific publisher from RAWG API.
 * Endpoint: https://api.rawg.io/api/publishers/{publisher_slug_or_id}
 * @param {string|number} publisherSlugOrId Slug or ID of the publisher.
 * @returns {Promise<Object>} A promise that resolves to the detailed publisher object.
 * @throws {Error} If the API request fails or returns an error.
 */
const getPublisherDetails = async (publisherSlugOrId) => {
    if (!publisherSlugOrId) {
        throw new Error('Publisher slug or ID cannot be empty.');
    }
    const url = `${RAWG_API_BASE_URL}/publishers/${publisherSlugOrId}?key=${RAWG_API_KEY}`;
    console.log(`Requesting RAWG API for publisher details: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        if (response.data) {
            return response.data;
        } else {
            throw new Error(`No data returned from RAWG API for publisher ID ${publisherSlugOrId}`);
        }
    } catch (error) {
        console.error('RAWG API Error Response (getPublisherDetails):', {
            status: error.response.status,
            data: error.response.data,
            query: publisherSlugOrId
        });
        throw new Error(`RAWG API request for publisher details failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
    }
};

/**
 * Fetches games by a specific developer from RAWG API.
 * Endpoint: https://api.rawg.io/api/games?developers={developer_slug_or_id}
 * @param {string|number} developerSlugOrId Slug or ID of the developer.
 * @param {object} queryParams Additional query parameters (e.g., page, page_size).
 * @returns {Promise<Object>} A promise that resolves to an object containing results and count.
 * @throws {Error} If the API request fails or returns an error.
 */
const getGamesByDeveloper = async (developerSlugOrId, queryParams = {}) => {
    if (!developerSlugOrId) {
        throw new Error('Developer slug or ID cannot be empty.');
    }
    let url = `${RAWG_API_BASE_URL}/games?key=${RAWG_API_KEY}&developers=${encodeURIComponent(developerSlugOrId)}`;
    Object.keys(queryParams).forEach(key => {
        url += `&${key}=${encodeURIComponent(queryParams[key])}`;
    });
    console.log(`Requesting RAWG API for games by developer: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        if (response.data) {
            return response.data;
        } else {
            console.warn('RAWG API returned success but no main data object for games by developer:', developerSlugOrId);
            return { results: [], count: 0 };
        }
    } catch (error) {
        console.error('RAWG API Error Response (getGamesByDeveloper):', {
            status: error.response.status,
            data: error.response.data,
            query: developerSlugOrId
        });
        throw new Error(`RAWG API request for games by developer failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
    }
};

/**
 * Fetches games by a specific publisher from RAWG API.
 * Endpoint: https://api.rawg.io/api/games?publishers={publisher_slug_or_id}
 * @param {string|number} publisherSlugOrId Slug or ID of the publisher.
 * @param {object} queryParams Additional query parameters.
 * @returns {Promise<Object>} A promise that resolves to an object containing results and count.
 * @throws {Error} If the API request fails or returns an error.
 */
const getGamesByPublisher = async (publisherSlugOrId, queryParams = {}) => {
    if (!publisherSlugOrId) {
        throw new Error('Publisher slug or ID cannot be empty.');
    }
    let url = `${RAWG_API_BASE_URL}/games?key=${RAWG_API_KEY}&publishers=${encodeURIComponent(publisherSlugOrId)}`;
    Object.keys(queryParams).forEach(key => {
        url += `&${key}=${encodeURIComponent(queryParams[key])}`;
    });
    console.log(`Requesting RAWG API for games by publisher: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'GameCollectionApp/1.0' }
        });
        if (response.data) {
            return response.data;
        } else {
            console.warn('RAWG API returned success but no main data object for games by publisher:', publisherSlugOrId);
            return { results: [], count: 0 };
        }
    } catch (error) {
        console.error('RAWG API Error Response (getGamesByPublisher):', {
            status: error.response.status,
            data: error.response.data,
            query: publisherSlugOrId
        });
        throw new Error(`RAWG API request for games by publisher failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
    }
};


// Export all functions to be used by other modules
module.exports = {
    searchGames,
    getGameDetails,
    getGameScreenshots,
    getGameTrailers,
    getGenres,
    getPlatforms,
    getDeveloperDetails,
    getPublisherDetails,
    getGamesByDeveloper,
    getGamesByPublisher,
};
