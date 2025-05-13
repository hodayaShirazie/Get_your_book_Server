const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

// add product
app.post('/add-product', upload.single('image'), async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        price,
        stock_quantity,
        min_stock_threshold
      } = req.body;
  
      const imageBuffer = req.file.buffer;
  
      await pool.query(
        `INSERT INTO product 
         (name, description, category_id, price, image, stock_quantity, min_stock_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [name, description, category, price, imageBuffer, stock_quantity, min_stock_threshold]
      );
  
      res.status(200).json({ message: 'Product added successfully' });
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ error: 'Server error while adding product' });
    }
});
  

app.get('/products', async (req, res) => {
try {
    const result = await pool.query('SELECT id, name, price, image, category_id FROM product ORDER BY created_at DESC');
    const products = result.rows.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageBase64: Buffer.from(p.image).toString('base64'),
    category_id: p.category_id  
    }));
    res.json(products);
} catch (err) {
    console.error('Failed to fetch products', err);
    res.status(500).send('Server error');
}
});

app.get('/products-all/:id', async (req, res) => {
const { id } = req.params;

try {
    const result = await pool.query(
    `SELECT id, name, description, category_id, price, image, stock_quantity, min_stock_threshold
        FROM product
        WHERE id = $1`, [id]
    );

    if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];
    const productData = {
    id: product.id,
    name: product.name,
    description: product.description,
    category_id: product.category_id,
    price: product.price,
    image_url: `data:image/jpeg;base64,${Buffer.from(product.image).toString('base64')}`,
    stock_quantity: product.stock_quantity,
    min_stock_threshold: product.min_stock_threshold
    };

    res.json(productData);
} catch (err) {
    console.error('Failed to fetch product by ID', err);
    res.status(500).send('Server error');
}
});
  
// Update product
app.put('/update-product/:id', upload.single('image'), async (req, res) => {
const { id } = req.params;
const {
    name,
    description,
    category,
    price,
    stock_quantity,
    min_stock_threshold
} = req.body;

try {
    // step 1: Check if the product exists
    const existingResult = await pool.query(
    `SELECT * FROM product WHERE id = $1`,
    [id]
    );

    if (existingResult.rows.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
    }

    const existing = existingResult.rows[0];

    // step 2: Check if any changes were made
    const noChange =
    existing.name === name &&
    (existing.description || '') === (description || '') &&
    existing.category_id == category &&
    Number(existing.price) === Number(price) &&
    Number(existing.stock_quantity) === Number(stock_quantity) &&
    Number(existing.min_stock_threshold) === Number(min_stock_threshold) &&
    !req.file; 

    if (noChange) {
    return res.status(200).json({ message: 'No changes detected, nothing was updated.' });
    }

    // step 3: Update the product
    let query = `
    UPDATE product SET
        name = $1,
        description = $2,
        category_id = $3,
        price = $4,
        stock_quantity = $5,
        min_stock_threshold = $6
    `;
    const values = [
    name,
    description || null,
    category,
    price,
    stock_quantity,
    min_stock_threshold
    ];

    if (req.file) {
    query += `, image = $7 WHERE id = $8`;
    values.push(req.file.buffer, id);
    } else {
    query += ` WHERE id = $7`;
    values.push(id);
    }

    await pool.query(query, values);

    res.status(200).json({ message: 'Product updated successfully' });
} catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).send('Server error');
}
});

// Delete product

app.delete('/delete-product/:id', async (req, res) => {
const { id } = req.params;
console.log("Received DELETE request for ID:", id);

try {
    const result = await pool.query('DELETE FROM product WHERE id = $1 RETURNING *', [id]);
    console.log("Result from DB:", result.rows);

    if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ message: 'Product deleted successfully.' });
} catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).send('Server error');
}
});

// Search for books
app.get('/search-books', async (req, res) => {
    const searchTerm = req.query.q;
  
    try {
      const result = await pool.query(
        'SELECT id, name, price, image, category_id FROM product WHERE name ILIKE $1 ORDER BY created_at DESC',
        [`%${searchTerm}%`]
      );
      const products = result.rows.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageBase64: Buffer.from(p.image).toString('base64'),
        category_id: p.category_id  
        }));
        res.json(products);
    } catch (err) {
        console.error('Failed to fetch products', err);
        res.status(500).send('Server error');
    }
});
  

module.exports = app;