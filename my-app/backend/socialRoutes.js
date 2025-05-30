const express = require('express');
const db = require('./db'); // For conceptual DB interaction
const { verifyToken } = require('./middleware/authMiddleware'); // Conceptual auth middleware

const router = express.Router();

// POST /api/users/:userIdToFollow/follow
router.post('/users/:userIdToFollow/follow', verifyToken, async (req, res) => {
    const followerId = req.user.id; // User performing the action
    const userIdToFollow = parseInt(req.params.userIdToFollow, 10);

    if (isNaN(userIdToFollow)) {
        return res.status(400).json({ message: 'Invalid user ID to follow.' });
    }

    if (followerId === userIdToFollow) {
        return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const sql = 'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
    const params = [followerId, userIdToFollow];
    console.log('Conceptual query for following user:', sql, params);

    try {
        // Conceptual execution: db.query would attempt to run this.
        // We'll simulate a success if no error.
        await db.query(sql, params); // In db.js, this currently returns a default object.
                                     // For INSERT, it might not return rows unless RETURNING is used.
                                     // Assume it conceptually works.
        res.status(201).json({ message: `Successfully followed user ${userIdToFollow}.` });
    } catch (error) {
        // This catch is for unexpected errors during conceptual query logging or if db.query itself throws.
        console.error('Error following user:', error);
        // A real DB might throw for FK violation if userIdToFollow doesn't exist.
        // Our conceptual db.query doesn't simulate this level of detail yet.
        res.status(500).json({ message: 'Server error while trying to follow user.' });
    }
});

// DELETE /api/users/:userIdToUnfollow/unfollow
router.delete('/users/:userIdToUnfollow/unfollow', verifyToken, async (req, res) => {
    const followerId = req.user.id; // User performing the action
    const userIdToUnfollow = parseInt(req.params.userIdToUnfollow, 10);

    if (isNaN(userIdToUnfollow)) {
        return res.status(400).json({ message: 'Invalid user ID to unfollow.' });
    }

    // Not strictly necessary to check for self-unfollow as it wouldn't exist in DB anyway,
    // but good for consistency if self-follow is disallowed.
    if (followerId === userIdToUnfollow) {
        return res.status(400).json({ message: 'You cannot unfollow yourself.' });
    }

    const sql = 'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const params = [followerId, userIdToUnfollow];
    console.log('Conceptual query for unfollowing user:', sql, params);

    try {
        // Conceptual execution. db.query might return {rowCount: 1} on success in a real driver.
        await db.query(sql, params);
        // We can't easily check rowCount here with current db.js, so assume success.
        res.json({ message: `Successfully unfollowed user ${userIdToUnfollow}.` });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ message: 'Server error while trying to unfollow user.' });
    }
});

// GET /api/users/:userId/followers
// For this example, making it public (no verifyToken middleware)
router.get('/users/:userId/followers', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    // Conceptual query: Select users who are following :userId
    const sql = `
        SELECT u.id, u.username -- Add other user details as needed (e.g., profile picture)
        FROM users u
        JOIN user_follows uf ON u.id = uf.follower_id
        WHERE uf.following_id = $1;
    `;
    const params = [userId];
    console.log('Conceptual query for fetching followers:', sql, params);

    try {
        // Conceptual execution. db.js needs to be able to simulate this.
        // For now, returning a placeholder.
        const placeholderFollowers = [
            { id: 101, username: 'follower_one' },
            { id: 102, username: 'follower_two' }
        ];
        // const { rows } = await db.query(sql, params);
        // res.json(rows);
        res.json(placeholderFollowers);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Server error while fetching followers.' });
    }
});

// GET /api/users/:userId/following
// For this example, making it public (no verifyToken middleware)
router.get('/users/:userId/following', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    // Conceptual query: Select users whom :userId is following
    const sql = `
        SELECT u.id, u.username -- Add other user details as needed
        FROM users u
        JOIN user_follows uf ON u.id = uf.following_id
        WHERE uf.follower_id = $1;
    `;
    const params = [userId];
    console.log('Conceptual query for fetching users being followed:', sql, params);

    try {
        // Conceptual execution.
        const placeholderFollowing = [
            { id: 201, username: 'user_im_following_one' },
            { id: 202, username: 'user_im_following_two' }
        ];
        // const { rows } = await db.query(sql, params);
        // res.json(rows);
        res.json(placeholderFollowing);
    } catch (error) {
        console.error('Error fetching users being followed:', error);
        res.status(500).json({ message: 'Server error while fetching users being followed.' });
    }
});

module.exports = router;
