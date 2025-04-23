const express = require('express')
const pool = require('./data-access/db');
const cors = require('cors');
const app = express()
const port = 3000

// app.use(cors());





const allowedOrigins = [
  'http://localhost:3001',          // פיתוח מקומי
  'https://get-your-book-client.onrender.com/', // אתר הלקוח
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());







app.get('/', (req, res) => {
  res.send('Hello Hodaya!!!!!!!')
})



// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`✅ DB connected! Current time from DB: ${result.rows[0].now}`);
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).send('❌ Failed to connect to DB');
  }
});





app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).send('❌ Failed to fetch users');
  }
});



app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // בדיקה כלשהי...
  res.json({ message: 'Logged in successfully!' });
});

app.post('/users', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("❌ Missing username or password");
  }

 
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, password]
    );
    res.status(201).send(`✅ User created: ${result.rows[0].username}`);
  } catch (err) {
    console.error('❌ Error inserting user:', err);
    res.status(500).send("❌ Failed to create user");
  }
});





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})