const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();

/*
Number of Registered Users
Number of Products
Number of Sells

*/
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
      console.error("Error fetching statistics:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });



module.exports = app;
