require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use the connection string .env file
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.connect()
  .then(() => {
    console.log('Connected to the database successfully!');
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });

module.exports = pool;
