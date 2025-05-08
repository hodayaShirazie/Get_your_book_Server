const express = require('express')
const pool = require('./data-access/db');
const cors = require('cors');
const app = express()
const port = 3000

app.use(cors());
app.use(express.json());


const Authentication = require('./routing/Authentication');
const Order = require('./routing/Order');
const Product = require('./routing/Products');
const ShoppingCart = require('./routing/ShoppingCart');
const UserProfile = require('./routing/UserProfile');
const StoreManagement = require('./routing/StoreManagement');

app.use(Authentication);
app.use(Order);
app.use(Product);
app.use(ShoppingCart);
app.use(UserProfile);
app.use(StoreManagement);




app.get('/', (req, res) => {
  res.send('Hello Hodaya!!!!!!!')
})

// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`DB connected! Current time from DB: ${result.rows[0].now}`);
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).send('Failed to connect to DB');
  }
});

// app.get('/user', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM user');
//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error('Error fetching users:', err);
//     res.status(500).send('Failed to fetch users');
//   }
// });

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




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
}); 