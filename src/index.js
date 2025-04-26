const express = require('express')
const pool = require('./data-access/db');
const cors = require('cors');
const app = express()
const port = 3000

app.use(cors());

app.use(express.json());

app.post("/user/login", async (req, res) => {
  const { username, password } = req.body;
  if (
    typeof username === "string" &&
    typeof password === "string" &&
    username.length >= 3 &&
    password.length >= 6
  ) {
    return res.status(200).json({ message: "Login successful" });
  }

  return res
    .status(400)
    .json({
      error: "Username is at least 4 characters and password is at least 3 characters.",
    });
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (
    typeof username === "string" &&
    typeof password === "string" &&
    username.length >= 3 &&
    password.length >= 6
  ) {
    return res.status(200).json({ message: "Login successful" });
  }

  return res
    .status(400)
    .json({
      error: "Username and password must be at least 5 characters long",
    });
});

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


app.get('/about', (req, res) => {
  res.json({
    about_project: 'Welcome to Get Your Book - a new shopping experience for book lovers.\nHere, you’ll find a wide selection of books, a simple and user-friendly system, and an interface that lets you order your next read in just a few clicks.\nWe’re here to make your search for a good book pleasant, fast, and fun.',
    about_team: ' We’re Team 9 – students who love building cool stuff together. \nFueled by caffeine and teamwork, we created this project with a lot of passion and a bit of fun on the side.'
  });
});



app.get('/ping', (req, res) => {
  res.json({
    message: 'pong team 9 '
  })
})




























// import express from 'express';
// import pool from './data-access/db.js';
// import bcrypt from 'bcrypt';


// security questions
app.get('/security-questions', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, question FROM security_question');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error loading security questions' });
  }
});

// registration user
app.post('/register', async (req, res) => {
  const { username, password, securityQuestionId, securityAnswer } = req.body;
  if (!username || !password || !securityQuestionId || !securityAnswer) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const userExists = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username already taken, please choose another' });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(`
      INSERT INTO "user" (username, password, security_question_id, security_answer)
      VALUES ($1, $2, $3, $4)
    `, [username, password, securityQuestionId, securityAnswer]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});










app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
}) 