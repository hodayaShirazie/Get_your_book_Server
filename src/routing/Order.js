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
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
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
  
      res.status(201).json({ orderId }); 
    } catch (error) {
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
  
    const stockResult = await pool.query(
      `SELECT stock_quantity FROM product WHERE id = $1`,
      [productId]
    );
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const currentStock = parseInt(stockResult.rows[0].stock_quantity);
    if (currentStock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    const result = await pool.query(
      `INSERT INTO order_product (user_id, order_id, product_id, quantity)
          VALUES ($1, $2, $3, $4)`,
      [userId, orderId, productId, quantity]
      );

    await pool.query(
      `UPDATE product
       SET stock_quantity  = stock_quantity - $1
       WHERE id = $2`,
      [quantity, productId]
    );
    // Check if product is now in low stock
    const updatedStockResult = await pool.query(
      'SELECT stock_quantity, min_stock_threshold FROM product WHERE id = $1',
      [productId]
    );

    const { stock_quantity, min_stock_threshold } = updatedStockResult.rows[0];

    if (stock_quantity <= min_stock_threshold) {
      console.log(`Product ID ${productId} is now in LOW STOCK (${stock_quantity} <= ${min_stock_threshold})`);
    }



    res.status(201).json({ message: 'Product added to order and stock updated' });
  } catch (error) {

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
    res.status(500).json({ message: 'Error fetching order details:', error });
}
});

// Get all orders (sorted from newest to oldest)
app.get('/all-orders', async (req, res) => {
try {
    const ordersResult = await pool.query(`
    SELECT o.id, o.order_date, o.sum_of_purchase, o.number_of_products, o.status, u.username
      FROM "orders" o
      JOIN "user" u ON o.user_id = u.id
      ORDER BY o.order_date DESC, o.id DESC
    `);

    const orders = ordersResult.rows;

    
    res.json(orders);
} catch (error) {
    res.status(500).json({ message: 'Error fetching all orders:', error });
}
});

// update order status
app.put('/update-order-status/:orderId', async (req, res) => {
const { orderId } = req.params;
const { status } = req.body;


try {
    const result = await pool.query(
    `UPDATE "orders" SET status = $1 WHERE id = $2 RETURNING *`,
    [status, orderId]
    );

    if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result.rows[0]);
} catch (error) {
    res.status(500).json({ message: 'Error updating order status:', error });
}

});

// filter orders by status, price range, and username
app.get('/filtered-orders', async (req, res) => {
  try {
    const { status, priceRange, username } = req.query;
    const values = [];

    const conditions = [
      ...(status ? [`o.status = $${values.push(status)}`] : []),
      ...(priceRange === '1' ? [`o.sum_of_purchase < $${values.push(50)}`] : []),
      ...(priceRange === '2' ? [`o.sum_of_purchase >= $${values.push(50)} AND o.sum_of_purchase < $${values.push(100)}`] : []),
      ...(priceRange === '3' ? [`o.sum_of_purchase >= $${values.push(100)} AND o.sum_of_purchase < $${values.push(200)}`] : []),
      ...(priceRange === '4' ? [`o.sum_of_purchase >= $${values.push(200)}`] : []),
      ...(username ? [`LOWER(u.username) = LOWER($${values.push(username)})`] : []),
    ];

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT o.id, o.order_date, o.sum_of_purchase, o.number_of_products, o.status, u.username
      FROM "orders" o
      JOIN "user" u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.order_date DESC, o.id DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error();
    res.status(500).json({ message: 'Error filtering orders:', error });
  }
});

// Get all orders for a specific user
app.get('/user-orders/:username', async (req, res) => {
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

    const ordersResult = await pool.query(`
      SELECT id, order_date, sum_of_purchase, number_of_products, status
      FROM "orders"
      WHERE user_id = $1
      ORDER BY order_date DESC
    `, [userId]);

    if (ordersResult.rows.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    const orders = [];

    for (const order of ordersResult.rows) {
      const productsResult = await pool.query(`
        SELECT p.name, p.price, op.quantity
        FROM order_product op
        JOIN product p ON op.product_id = p.id
        WHERE op.order_id = $1
      `, [order.id]);

      orders.push({
        ...order,
        products: productsResult.rows,
      });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user orders:', error });
  }
});

// Cancel order
app.delete("/cancel-order/:id", async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT order_date, NOW() - order_date AS diff
      FROM orders
      WHERE id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).send("Order not found.");
    }

    const timeDiff = result.rows[0].diff;
    const hours = parseFloat(timeDiff.hours) || 0;
    const minutes = parseFloat(timeDiff.minutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    console.log("Time difference in minutes:", totalMinutes);

    if (totalMinutes > 60) {
      return res.status(400).send("Cannot cancel after one hour.");
    }

    await pool.query(`
      DELETE FROM order_product WHERE order_id = $1
    `, [orderId]);

    await pool.query(`
      DELETE FROM orders WHERE id = $1
    `, [orderId]);

    res.status(200).send("Order cancelled successfully.");
  } catch (err) {
    }
});

// Get missing delivery days
app.get('/missing-delivery-days', async (req, res) => {
  try {
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const result = await pool.query(`
      SELECT DISTINCT day_of_week
      FROM available_delivery_times
    `);

    const existingDays = result.rows.map(row => row.day_of_week);

    const missingDays = allDays.filter(day => !existingDays.includes(day));

    res.json({ missingDeliveryDays: missingDays });
  } catch (error) {
    res.status(500).send('Failed to fetch missing delivery days:', error);
  }
});

// Get available delivery slots for a specific day
app.get('/available-slots/:day', async (req, res) => {
  try {
    const { day } = req.params;

    const result = await pool.query(`
      SELECT morning_available, afternoon_available, evening_available
      FROM available_delivery_times
      WHERE day_of_week = $1
    `, [day]);

    if (result.rows.length === 0) {
      return res.json({ availableSlots: [] });
    }

    const row = result.rows[0];
    const slots = [];

    if (row.morning_available) slots.push("morning");
    if (row.afternoon_available) slots.push("afternoon");
    if (row.evening_available) slots.push("evening");

    res.json({ availableSlots: slots });
  } catch (err) {
    res.status(500).send("Error fetching available slots:", err);
  }
});

// Check if order can be cancelled
app.get("/can-cancel-order/:id", async (req, res) => {
  console.log("Checking if order can be cancelled Id...", req.params.id);
  const orderId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT order_date, NOW() - order_date AS diff
      FROM orders
      WHERE id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).send("Order not found.");
    }

    const timeDiff = result.rows[0].diff;
    const hours = parseFloat(timeDiff.hours) || 0;
    const minutes = parseFloat(timeDiff.minutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    console.log("Time difference in minutes:", totalMinutes);

    if (totalMinutes > 60) {
      return res.status(200).send("Cannot cancel after one hour.");
    }

    res.status(200).send("Order can be cancelled.");
  } catch (err) {
    res.status(500).send("Error checking order cancellation:", err);
  }
});

//get low stock products
app.get('/low-stock-alerts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, stock_quantity, min_stock_threshold
      FROM product
      WHERE stock_quantity <= min_stock_threshold
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ message: 'Server error while fetching low stock alerts' });
  }
});


module.exports = app;