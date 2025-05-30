const express = require('express');
const authRoutes = require('./auth'); // Import auth routes
const gameRoutes = require('./gameRoutes'); // Import game routes
const userGameRoutes = require('./userGameRoutes'); // Import user game routes
const socialRoutes = require('./socialRoutes'); // Import social routes
const listRoutes = require('./listRoutes'); // Import list routes
const db = require('./db'); // Import db module (optional, for direct pool access if needed)

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Use authentication routes (e.g. /api/users/signup, /api/users/login)
// Note: socialRoutes also uses /api/users/:userId/follow etc.
// Ensure path specificity or re-route if there are clashes.
// Current authRoutes are /api/users/signup and /api/users/login, so no direct clash with /api/users/:userId/... from socialRoutes.
app.use('/api/users', authRoutes); 

// Use game routes (general game searching)
app.use('/api/games', gameRoutes);

// Use user-specific game library routes
app.use('/api/user', userGameRoutes); // Path like /api/user/games

// Use social routes (mounted at /api, so paths will be /api/users/:userId/follow etc.)
app.use('/api', socialRoutes); // This will make routes like /api/users/:userId/follow available

// Use list routes (e.g., /api/lists, /api/lists/:listId, /api/lists/user/:userId)
// Mounting listRoutes at '/api/lists' means its internal '/user/:userId' becomes '/api/lists/user/:userId'
app.use('/api/lists', listRoutes);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
