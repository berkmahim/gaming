const axios = require('axios');

// IMPORTANT: In a real application, store the API key in an environment variable.
const RAWG_API_KEY = '824e7f0766b44af1bb4d44d684c1a71';
const RAWG_API_URL = 'https://api.rawg.io/api';

/**
 * Searches for games using the RAWG API.
 * @param {string} searchQuery The search term for games.
 * @returns {Promise<Array>} A promise that resolves to an array of game objects.
 * @throws {Error} If the API request fails or returns an error.
 */
const searchGames = async (searchQuery) => {
  if (!searchQuery) {
    throw new Error('Search query cannot be empty.');
  }

  const url = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}`;
  console.log(`Requesting RAWG API: ${url}`);

  try {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'GameCollectionApp/1.0' // RAWG API sometimes requires a User-Agent
        }
    });

    if (response.data && response.data.results) {
      return response.data; // Return the whole response object for search to get count, next, prev
    } else {
      // Handle cases where API returns success but no results array
      console.warn('RAWG API returned success but no results array for query:', searchQuery);
      return { results: [], count: 0 }; // Consistent return type
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('RAWG API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        query: searchQuery
      });
      throw new Error(`RAWG API request failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('RAWG API No Response:', { errorRequest: error.request, query: searchQuery });
      throw new Error('No response received from RAWG API.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('RAWG API Request Setup Error:', { errorMessage: error.message, query: searchQuery });
      throw new Error(`Failed to make RAWG API request: ${error.message}`);
    }
  }
};

module.exports = {
  searchGames,
  getGameDetails,
  // Conceptual functions for developers and publishers
  getDeveloperDetails,
  getPublisherDetails,
  getGamesByDeveloper,
  getGamesByPublisher,
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

  const url = `${RAWG_API_URL}/games/${rawgId}?key=${RAWG_API_KEY}`;
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


// Conceptual function signatures for developer and publisher info

/**
 * Fetches details for a specific developer from RAWG API.
 * Endpoint: https://api.rawg.io/api/developers/{developer_slug_or_id}
 * @param {string|number} developerSlugOrId Slug or ID of the developer.
 */
const getDeveloperDetails = async (developerSlugOrId) => {
    console.log(`Conceptual: Fetch developer details for ${developerSlugOrId} from RAWG API.`);
    // const url = `${RAWG_API_URL}/developers/${developerSlugOrId}?key=${RAWG_API_KEY}`;
    // Actual implementation would use axios.get(url) and error handling.
    return { conceptual: true, type: 'developer', id: developerSlugOrId, message: "Not implemented yet." };
};

/**
 * Fetches details for a specific publisher from RAWG API.
 * Endpoint: https://api.rawg.io/api/publishers/{publisher_slug_or_id}
 * @param {string|number} publisherSlugOrId Slug or ID of the publisher.
 */
const getPublisherDetails = async (publisherSlugOrId) => {
    console.log(`Conceptual: Fetch publisher details for ${publisherSlugOrId} from RAWG API.`);
    // const url = `${RAWG_API_URL}/publishers/${publisherSlugOrId}?key=${RAWG_API_KEY}`;
    return { conceptual: true, type: 'publisher', id: publisherSlugOrId, message: "Not implemented yet." };
};

/**
 * Fetches games by a specific developer from RAWG API.
 * Endpoint: https://api.rawg.io/api/games?developers={developer_slug_or_id}
 * @param {string|number} developerSlugOrId Slug or ID of the developer.
 * @param {object} queryParams Additional query parameters (e.g., page, page_size).
 */
const getGamesByDeveloper = async (developerSlugOrId, queryParams = {}) => {
    console.log(`Conceptual: Fetch games by developer ${developerSlugOrId} with params:`, queryParams);
    // let url = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&developers=${developerSlugOrId}`;
    // Object.keys(queryParams).forEach(key => url += `&${key}=${queryParams[key]}`);
    return { conceptual: true, type: 'games_by_developer', id: developerSlugOrId, params: queryParams, message: "Not implemented yet." };
};

/**
 * Fetches games by a specific publisher from RAWG API.
 * Endpoint: https://api.rawg.io/api/games?publishers={publisher_slug_or_id}
 * @param {string|number} publisherSlugOrId Slug or ID of the publisher.
 * @param {object} queryParams Additional query parameters.
 */
const getGamesByPublisher = async (publisherSlugOrId, queryParams = {}) => {
    console.log(`Conceptual: Fetch games by publisher ${publisherSlugOrId} with params:`, queryParams);
    // let url = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&publishers=${publisherSlugOrId}`;
    // Object.keys(queryParams).forEach(key => url += `&${key}=${queryParams[key]}`);
    return { conceptual: true, type: 'games_by_publisher', id: publisherSlugOrId, params: queryParams, message: "Not implemented yet." };
};

// Modify searchGames to accept more filters
/**
 * Searches for games using the RAWG API with extended filtering.
 * @param {object} filters Object containing search query and other filters.
 *        Example: { search: "witcher", platforms: "4", genres: "action", tags: "singleplayer", ordering: "-rating" }
 * @returns {Promise<Object>} A promise that resolves to an object containing results and count.
 * @throws {Error} If the API request fails or returns an error.
 */
const searchGames = async (filters = {}) => {
  let query = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}`;
  
  if (filters.search) {
    query += `&search=${encodeURIComponent(filters.search)}`;
  }
  if (filters.platforms) { // e.g., "4,187" (PC, PS5)
    query += `&platforms=${encodeURIComponent(filters.platforms)}`;
  }
  if (filters.genres) { // e.g., "action,adventure"
    query += `&genres=${encodeURIComponent(filters.genres)}`;
  }
  if (filters.tags) { // e.g., "singleplayer,multiplayer"
    query += `&tags=${encodeURIComponent(filters.tags)}`;
  }
  if (filters.ordering) { // e.g., "-released", "rating"
    query += `&ordering=${encodeURIComponent(filters.ordering)}`;
  }
  if (filters.page) {
    query += `&page=${filters.page}`;
  }
   if (filters.page_size) {
    query += `&page_size=${filters.page_size}`;
  }
  // Add other RAWG supported filters as needed: dates, metacritic, parent_platforms, etc.

  console.log(`Requesting RAWG API (searchGames): ${query}`);

  try {
    const response = await axios.get(query, {
        headers: {
            'User-Agent': 'GameCollectionApp/1.0'
        }
    });

    if (response.data) { // RAWG returns results in response.data.results
      return response.data; // Return the whole response for pagination (count, next, previous)
    } else {
      console.warn('RAWG API returned success but no main data object for filters:', filters);
      return { results: [], count: 0 }; // Consistent return type
    }
  } catch (error) {
    if (error.response) {
      console.error('RAWG API Error Response (searchGames):', {
        status: error.response.status,
        data: error.response.data,
        query: query
      });
      throw new Error(`RAWG API request (searchGames) failed with status ${error.response.status}: ${error.response.data.detail || error.message}`);
    } else if (error.request) {
      console.error('RAWG API No Response (searchGames):', { errorRequest: error.request, query: query });
      throw new Error('No response received from RAWG API (searchGames).');
    } else {
      console.error('RAWG API Request Setup Error (searchGames):', { errorMessage: error.message, query: query });
      throw new Error(`Failed to make RAWG API request (searchGames): ${error.message}`);
    }
  }
};
