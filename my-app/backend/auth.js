const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Assuming db.js is in the same directory

const router = express.Router();
const JWT_SECRET = 'YOUR_SECRET_KEY'; // Placeholder secret key

// Input validation helper (basic)
const validateInput = (email, password, username) => {
    if (username && (typeof username !== 'string' || username.trim() === '')) return false;
    if (typeof email !== 'string' || !email.includes('@')) return false;
    if (typeof password !== 'string' || password.length < 6) return false;
    return true;
};

// POST /api/users/signup
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!validateInput(email, password, username)) {
        return res.status(400).json({ message: 'Invalid input: username, email, and password (min 6 chars) are required.' });
    }

    try {
        // Conceptually check if user already exists
        const checkUserSql = 'SELECT * FROM users WHERE email = $1 OR username = $2';
        console.log('Conceptual query for checking user:', checkUserSql, [email, username]);
        // const { rows: existingUsers } = await db.query(checkUserSql, [email, username]);
        // if (existingUsers.length > 0) {
        //     return res.status(409).json({ message: 'Username or email already exists.' });
        // }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const insertUserSql = 'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email';
        console.log('Conceptual query for inserting user:', insertUserSql, [username, email, password_hash]);
        
        // Conceptual insertion:
        // In a real scenario, db.query would interact with the database.
        // We're simulating this based on the db.js mock.
        const { rows } = await db.query(insertUserSql, [username, email, password_hash]);
        const newUser = rows[0];

        // For now, just returning a success message as per instructions
        res.status(201).json({ message: 'User registered successfully.', userId: newUser.id, username: newUser.username });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!validateInput(email, password)) {
        return res.status(400).json({ message: 'Invalid input: email and password (min 6 chars) are required.' });
    }

    try {
        const fetchUserSql = 'SELECT * FROM users WHERE email = $1';
        console.log('Conceptual query for fetching user:', fetchUserSql, [email]);

        // Conceptual fetch and password comparison:
        const { rows } = await db.query(fetchUserSql, [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials (user not found).' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (password mismatch).' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ message: 'Login successful.', token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;
