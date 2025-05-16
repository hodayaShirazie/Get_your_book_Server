const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();


// Add product to shopping cart
app.post('/add-to-shopping-cart', async (req, res) => {
  const { username, productId } = req.body;

  if (!username || !productId) {
    return res.status(400).json({ message: 'Missing username or product ID' });
  }

  try {
    // Get the user ID from the username
    const userResult = await pool.query(
      'SELECT id FROM "user" WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

     //  Check product stock
     const stockResult = await pool.query(
      'SELECT stock_quantity FROM product WHERE id = $1',
      [productId]
    );
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const stock = parseInt(stockResult.rows[0].stock_quantity);
    console.log("Stock from DB:", stockResult.rows[0].stock_quantity);
    console.log("Parsed stock:", stock);

    if (isNaN(stock) || stock <= 0) {
      return res.status(200).json({ message: 'Out of Stock' });
    }

    
    // Check if the product already exists in the user's cart
    const existingItem = await pool.query(
      'SELECT quantity FROM shopping_cart WHERE user_id = $1 AND book_id = $2',
      [userId, productId]
    );

    if (existingItem.rows.length > 0) {
      // If exists – update quantity
      await pool.query(
        'UPDATE shopping_cart SET quantity = quantity + 1 WHERE user_id = $1 AND book_id = $2',
        [userId, productId]
      );
    } else {
      // If not exists – insert new item
      await pool.query(
        'INSERT INTO shopping_cart (user_id, book_id, quantity) VALUES ($1, $2, $3)',
        [userId, productId, 1]
      );
    }

    res.status(200).json({ message: 'Product added to shopping cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while adding to cart' });
  }
});

// Remove product from shopping cart
app.post('/remove-from-shopping-cart', async (req, res) => {
  const { username, productId } = req.body;

  if (!username || !productId) {
    return res.status(400).json({ message: 'Missing username or product ID' });
  }

  try {
    // Get the user ID from the username
    const userResult = await pool.query(
      'SELECT id FROM "user" WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Check the current quantity of the item in the shopping cart
    const existingItem = await pool.query(
      'SELECT quantity FROM shopping_cart WHERE user_id = $1 AND book_id = $2',
      [userId, productId]
    );

    if (existingItem.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    const quantity = existingItem.rows[0].quantity;

    if (quantity > 1) {
      // If quantity is greater than 1, decrease the quantity by 1
      await pool.query(
        'UPDATE shopping_cart SET quantity = quantity - 1 WHERE user_id = $1 AND book_id = $2',
        [userId, productId]
      );
    } else {
      // If quantity is 1, remove the product from the cart
      await pool.query(
        'DELETE FROM shopping_cart WHERE user_id = $1 AND book_id = $2',
        [userId, productId]
      );
    }

    res.status(200).json({ message: 'Product quantity updated or removed from cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while removing from cart' });
  }
});

// Get all products in the shopping cart for a specific user
app.get('/shopping-cart/:username', async (req, res) => {
  const {username} = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Missing username' });
  }
  try {
    const userResult = await pool.query(
      'SELECT id FROM "user" WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Get the products in the user's shopping cart
    const result = await pool.query(
      `SELECT p.id, p.name, p.price, sc.quantity, p.stock_quantity, p.image 
       FROM shopping_cart sc
       JOIN product p ON sc.book_id = p.id
       WHERE sc.user_id = $1`,
      [userId]
    );


    // Convert image from BYTEA to Base64
    const products = result.rows.map(product => ({
      ...product,
      image: `data:image/jpeg;base64,${Buffer.from(product.image).toString('base64')}`,
    }));
    
    res.json(products);
  } catch (error) {
    res.status(500).send('Error retrieving cart:', error);
  }
});

// Delete all products of user from the shopping cart
app.delete('/shopping-cart/:username', async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Missing username' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id FROM "user" WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Delete the product from the shopping cart
    await pool.query(
      'DELETE FROM shopping_cart WHERE user_id = $1',
      [userId]
    );

    res.status(200).json({ message: 'Products removed from shopping cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while removing from cart' });
  }
});

module.exports = app;