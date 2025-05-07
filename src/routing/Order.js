const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();


// add order to orders table
app.post('/add-order', async (req, res) => {
    const {
      sum_of_purchase,
      number_of_products,
      username,
      status,
      delivery_method,
      address,
      delivery_date,
      time_slot_delivery
    } = req.body;
  
    const userResult = await pool.query(
      'SELECT id FROM "user" WHERE username = $1',
      [username]
    );
  
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    const user_id = userResult.rows[0].id;
  
    try {
      const result = await pool.query(
        `INSERT INTO "orders" (
          sum_of_purchase,
          number_of_products,
          order_date,
          user_id,
          status,
          delivery_method,
          address,
          delivery_date,
          time_slot_delivery
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          sum_of_purchase,
          number_of_products,
          user_id,
          status,
          delivery_method,
          address || null,
          delivery_date || null,
          time_slot_delivery || null
        ]
      );
      const orderId = result.rows[0].id;
      console.log('New order ID:', orderId);
  
      res.status(201).json({ orderId }); // Return the new order ID to the client
    } catch (error) {
      console.error('Error inserting order:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
// add to orde products table
app.post('/add-order-products', async (req, res) => {
const {username, orderId, productId, quantity } = req.body;

const userResult = await pool.query(
    'SELECT id FROM "user" WHERE username = $1',
    [username]
);

if (userResult.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
}

const userId = userResult.rows[0].id;
try {
    const result = await pool.query(
    `INSERT INTO order_product (user_id, order_id, product_id, quantity)
        VALUES ($1, $2, $3, $4)`,
    [userId, orderId, productId, quantity]
    );

    res.status(201).json(result.rows[0]);
} catch (error) {
    console.error('Error inserting order products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

// Get specific order by orderId
app.get('/order-products/:orderId', async (req, res) => {
const { orderId } = req.params;

try {
    const orderResult = await pool.query(`
    SELECT id, sum_of_purchase, delivery_method, address, delivery_date, time_slot_delivery, sum_of_purchase
    FROM "orders"
    WHERE id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
    return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    const productsResult = await pool.query(`
    SELECT p.name, p.price, op.quantity
    FROM order_product op
    JOIN product p ON op.product_id = p.id
    WHERE op.order_id = $1
    `, [orderId]);

    order.products = productsResult.rows;

    res.json(order);
} catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error' });
}
});

// Get all orders (sorted from newest to oldest)
app.get('/all-orders', async (req, res) => {
try {
    const ordersResult = await pool.query(`
    SELECT id, order_date, sum_of_purchase, number_of_products
    FROM "orders"
    ORDER BY order_date DESC, id DESC
    `);

    const orders = ordersResult.rows;

    
    res.json(orders);
} catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error' });
}
});

app.put('/update-order-status/:orderId', async (req, res) => {
const { orderId } = req.params;
const { status } = req.body;

console.log('SERVER Updating order status:', { orderId, status });

try {
    const result = await pool.query(
    `UPDATE "orders" SET status = $1 WHERE id = $2 RETURNING *`,
    [status, orderId]
    );

    if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Order not found' });
    }
    console.log('SERVER Updating order success:', { orderId, status });


    res.json(result.rows[0]);
} catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
}

});

module.exports = app;