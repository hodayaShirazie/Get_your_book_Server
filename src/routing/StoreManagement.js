const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();

// get statistics
app.get("/statistics", async (req, res) => {
    const { range } = req.query;
  
    let dateCondition = ""; 
  
    if (range === "lastMonth") {
      dateCondition = "WHERE created_at >= NOW() - INTERVAL '1 month'";
    } else if (range === "last3Months") {
      dateCondition = "WHERE created_at >= NOW() - INTERVAL '3 months'";
    }
  
    try {
      const usersQuery = await pool.query("SELECT COUNT(*) FROM \"user\"");
      const productsQuery = await pool.query(
        `SELECT COUNT(*) FROM product ${dateCondition}`
      );
      const sellsQuery = await pool.query(
        `SELECT COALESCE(SUM(sells), 0) FROM product ${dateCondition}`
      );
      const revenueQuery = await pool.query(
        `SELECT SUM(sum_of_purchase) FROM orders`
      );

  
      res.json({
        users: parseInt(usersQuery.rows[0].count),
        products: parseInt(productsQuery.rows[0].count),
        sells: parseInt(sellsQuery.rows[0].coalesce),
        revenue: revenueQuery.rows[0].sum || 0
      });
    } catch (err) {
      res.status(500).json({ error: "Error fetching statistics:", err });
    }
});

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


module.exports = app;