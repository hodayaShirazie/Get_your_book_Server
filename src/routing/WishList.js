const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();


app.use(express.json());

// Add a product to the wishlist
app.post('/add-to-wishlist', async (req, res) => {
  const { username, productId } = req.body;

  if (!username || !productId) {
    return res.status(400).json({ message: 'Missing username or productId' });
  }

  try {
    const userResult = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    const existsResult = await pool.query(
      'SELECT 1 FROM wish_list WHERE user_id = $1 AND book_id = $2',
      [userId, productId]
    );
    if (existsResult.rows.length > 0) {
      return res.json({ message: 'Already in Wishlist' });
    }

    await pool.query(
      'INSERT INTO wish_list(user_id, book_id) VALUES ($1, $2)',
      [userId, productId]
    );

    return res.json({ message: 'Added to Wishlist' });

  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get wishlist products for a user
app.get('/wishlist/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const userResult = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image FROM wish_list w
       JOIN product p ON w.book_id = p.id WHERE w.user_id = $1`,
      [userId]
    );

    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      imageBase64: row.image.toString('base64'),
    }));

    res.json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching wishlist' });
  }
});

// Remove a product from the wishlist
app.delete('/wishlist/:username/:bookId', async (req, res) => {
  const username = req.params.username;
  const bookId = parseInt(req.params.bookId, 10);

  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID' });
  }

  try {
    const userResult = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    const deleteResult = await pool.query(
      'DELETE FROM wish_list WHERE user_id = $1 AND book_id = $2 RETURNING *',
      [userId, bookId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    res.json({ message: 'Product removed from wishlist' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error removing product from wishlist' });
  }
});


module.exports = app;