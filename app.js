const express = require('express');
const mariadb = require('mariadb');
const app = express();
const PORT = 3000;

// Middleware and setup
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// MariaDB setup
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_new_password',
    database: 'miniblog'
});

async function connect() {
    try {
        return await pool.getConnection();
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
}

// Home Route
app.get('/', (req, res) => {
    res.render('home', { data: {}, errors: [] });
});

// Submission Route
app.post('/submit', async (req, res) => {
    const { author, title, content } = req.body;
    const errors = [];
    const data = { author: author.trim(), title: title.trim(), content: content.trim() };

    // Validation
    if (!title || title.length <= 5) errors.push('Title must be more than 5 characters.');
    if (!content) errors.push('Content cannot be empty.');

    if (errors.length > 0) {
        return res.render('home', { data, errors });
    }

    try {
        const conn = await connect();
        await conn.query(
            `INSERT INTO posts (author, title, content) VALUES (?, ?, ?)`,
            [author || null, title, content]
        );
        res.render('confirmation', { post: { author, title, content } });
    } catch (err) {
        console.error('Error inserting data:', err);
    }
});

// Entries Route
app.get('/entries', async (req, res) => {
    try {
        const conn = await connect();
        const rows = await conn.query(`SELECT * FROM posts ORDER BY created_at DESC`);
        res.render('entries', { data: rows });
    } catch (err) {
        console.error('Error retrieving data:', err);
        res.render('entries', { data: [] });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
