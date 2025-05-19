const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();


// add times for delivery
app.post('/api/delivery-days', async (req, res) => {
  const { deliveryDays } = req.body;

  try {
    
    await pool.query('DELETE FROM available_delivery_times');

    for (const dayObj of deliveryDays) {
      const { day, timeSlots } = dayObj;
      const morning = timeSlots.includes("Morning");
      const afternoon = timeSlots.includes("Afternoon");
      const evening = timeSlots.includes("Evening");

      await pool.query(`
        INSERT INTO available_delivery_times 
        (day_of_week, morning_available, afternoon_available, evening_available)
        VALUES ($1, $2, $3, $4)
      `, [day, morning, afternoon, evening]);
    }

    res.status(200).send('Delivery days updated successfully');
  } catch (err) {
    res.status(500).send('Failed to update delivery days');
  }
});

// get delivery days
app.get('/api/delivery-days', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT day_of_week, morning_available, afternoon_available, evening_available
      FROM available_delivery_times
    `);

    const formatted = result.rows.map(row => {
      const timeSlots = [];
      if (row.morning_available) timeSlots.push("Morning");
      if (row.afternoon_available) timeSlots.push("Afternoon");
      if (row.evening_available) timeSlots.push("Evening");

      return {
        day: row.day_of_week,
        timeSlots,
      };
    });

    res.json({ deliveryDays: formatted });
  } catch (error) {
    res.status(500).send('Failed to fetch delivery days:', error);
  }
});

// get available delivery days
app.get('/available-delivery-days', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT day_of_week, morning_available, afternoon_available, evening_available
      FROM available_delivery_times
    `);

    const validDays = result.rows
      .filter(row =>
        row.morning_available || row.afternoon_available || row.evening_available
      )
      .map(row => row.day_of_week);

    res.json({ validDeliveryDays: validDays });
  } catch (error) {
    res.status(500).send('Failed to fetch delivery days:', error);
  }
});

// get unavailable delivery times
app.get('/unavailable-delivery-times', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT day_of_week, morning_available, afternoon_available, evening_available
      FROM available_delivery_times
    `);

    const formatted = result.rows.map(row => {
      const timeSlots = [];
      if (!row.morning_available) timeSlots.push("Morning");
      if (!row.afternoon_available) timeSlots.push("Afternoon");
      if (!row.evening_available) timeSlots.push("Evening");

      return {
        day: row.day_of_week,
        timeSlots,
      };
    }).filter(entry => entry.timeSlots.length > 0); 

    res.json({ unavailableDeliveryTimes: formatted });
  } catch (error) {
    res.status(500).send('Failed to fetch unavailable delivery times:', error);
  }
});

// get missing delivery days
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

// get store statistics
app.get('/statistics/:range', async (req, res) => {
  try {
    const { range } = req.params;
    let startDate;

    const now = new Date();
    if (range === 'last-month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (range === 'last-3-months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else {
      return res.status(400).json({ error: "Invalid range parameter" });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) AS "totalPurchases",
        COALESCE(SUM(sum_of_purchase), 0) AS "totalRevenue"
      FROM "orders"
      WHERE order_date >= $1 AND status = 'approved';
    `;

    const topProductQuery = `
      SELECT 
        p.id,
        p.name,
        SUM(op.quantity) AS quantity_sold
      FROM order_product op
      JOIN "orders" o ON op.order_id = o.id
      JOIN product p ON op.product_id = p.id
      WHERE o.order_date >= $1 AND o.status = 'approved'
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC
      LIMIT 1;
    `;

    const client = await pool.connect();

    const statsResult = await client.query(statsQuery, [startDate]);
    const topProductResult = await client.query(topProductQuery, [startDate]);

    client.release();

    const stats = statsResult.rows[0];
    const topProduct = topProductResult.rows[0] || null;

    res.json({
      totalPurchases: parseInt(stats.totalPurchases, 10),
      totalRevenue: parseFloat(stats.totalRevenue),
      bestSellingBook: topProduct ? {
        id: topProduct.id,
        name: topProduct.name,
        quantitySold: parseInt(topProduct.quantity_sold, 10),
      } : null
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = app;