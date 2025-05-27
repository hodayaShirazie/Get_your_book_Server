const express = require('express');
const router = express.Router();
const pool = require('../data-access/db'); 


router.post('/product-rating', async (req, res) => {
  const { username, bookId, stars } = req.body;

  try {
    console.log('📦 Received request body:', req.body);

    
    const userResult = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      console.warn('⚠️ משתמש לא נמצא:', username);
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // הכנסת דירוג או עדכון אם כבר קיים
    await pool.query(`
      INSERT INTO book_rating (user_id, book_id, stars)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, book_id)
      DO UPDATE SET stars = EXCLUDED.stars
    `, [userId, bookId, stars]);

    console.log('Rating saved successfully for user', username);
    res.json({ message: 'Rating saved successfully' });

  } catch (error) {
    console.error('Error saving rating:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/product-rating/average/:bookId', async (req, res) => {
  const { bookId } = req.params;

  try {
    const result = await pool.query(
      'SELECT ROUND(AVG(stars), 1) AS average FROM book_rating WHERE book_id = $1',
      [bookId]
    );

    res.json({ average: result.rows[0].average || 0 });

  } catch (error) {
    console.error('Error fetching average rating:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/product-rating/user/:bookId/:username', async (req, res) => {
  const { bookId, username } = req.params;

  try {
    const result = await pool.query(
      'SELECT stars FROM book_rating INNER JOIN "user" ON book_rating.user_id = "user".id WHERE book_id = $1 AND username = $2',
      [bookId, username]
    );

    if (result.rows.length === 0) {
      return res.json({ userRating: 0 }); // לא דירג עדיין
    }

    res.json({ userRating: result.rows[0].stars });
  } catch (error) {
    console.error('Error fetching user rating:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
