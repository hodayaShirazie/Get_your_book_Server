const express = require('express');
const router = express.Router();
const db = require('../data-access/db');

let cachedTopBooks = null;
let lastCacheTime = null;
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

router.get('/top-books', async (req, res) => {
  try {

     const now = Date.now();
     if (cachedTopBooks && lastCacheTime && (now - lastCacheTime) < CACHE_DURATION) {
      return res.json(cachedTopBooks);
     }

    const result = await db.query(`
      SELECT 
      p.id,
      p.name,
      p.image,
      c.category,
      COALESCE(SUM(op.quantity), 0) AS total_quantity_ordered
      FROM product p
      LEFT JOIN order_product op ON p.id = op.product_id
      LEFT JOIN category c ON p.category_id = c.id
      GROUP BY p.id, p.name, c.category
      ORDER BY total_quantity_ordered DESC
      LIMIT 3
    `);
    
    const booksWithBase64 = result.rows.map(book => ({
      ...book,
      image: book.image ? `data:image/jpeg;base64,${book.image.toString('base64')}` : null
    }));

    cachedTopBooks = booksWithBase64;
    lastCacheTime = now;

    res.json(booksWithBase64);
    
  } catch (err) {
    console.error('Error fetching top books:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
