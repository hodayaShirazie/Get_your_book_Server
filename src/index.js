const express = require('express')
const app = express()
const port = 3000


const pool = require('./data-access/db');



app.get('/', (req, res) => {
  res.send('Hello Hodaya!!!!!!!')
})




// בדיקה לחיבור מול הדאטהבייס
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`✅ DB connected! Current time from DB: ${result.rows[0].now}`);
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).send('❌ Failed to connect to DB');
  }
});





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})