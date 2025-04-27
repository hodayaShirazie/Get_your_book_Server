const express = require('express')
const pool = require('./data-access/db');
const cors = require('cors');
const app = express()
const port = 3000

app.use(cors());

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





app.get('/user', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).send('❌ Failed to fetch users');
  }
});



// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   console.log("Received data:", req.body);

//   // If no username or password is provided
//   if (!username || !password) {
//       return res.status(400).json({ message: 'Username and password are required' });
//   }

//   try {
//       // Query the database for the user
//       const result = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);

//       if (result.rows.length === 0) {
//           return res.status(401).json({ message: 'Invalid username or password' });
//       }

//       const user = result.rows[0];

    
//       if (user.password !== password) {
//         return res.status(401).json({ message: 'Invalid username or password' });
//     }

//       // Success - return user details
//       res.status(200).json({success: true, message: 'Login successful', userId: user.id, username: user.username
//       });  } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: 'System error' });
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











/**
 * GET /security-question/:username
 * - Retrieve the security question associated with a given username
 */
app.get('/security-question/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(`
      SELECT sq.question
      FROM "user" u
      JOIN security_question sq ON u.security_question_id = sq.id
      WHERE u.username = $1
    `, [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ question: result.rows[0].question });
  } catch (error) {
    console.error('Security question fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /recover-password
 * - Verify the user's answer to the security question
 * - (For demonstration purposes, returns the password. In production, should allow resetting password instead.)
 */
app.post('/recover-password', async (req, res) => {
  const { username, securityAnswer } = req.body;
  try {
    const result = await pool.query(`
      SELECT password, security_answer
      FROM "user"
      WHERE username = $1
    `, [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    const user = result.rows[0];

    if (user.security_answer !== securityAnswer) {
      return res.json({ success: false });
    }

    // ⚠️ Important: In production, you should NOT return the password.
    res.json({ success: true, password: user.password });

  } catch (error) {
    console.error('Password recovery error:', error);
    res.status(500).json({ success: false });
  }
});


















app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log("Received data:", req.body);

  // If no username or password is provided
  if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
      // Check if the user is in the "user" table
      const userResult = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);

      if (userResult.rows.length > 0) {
          const user = userResult.rows[0];

          if (user.password !== password) {
              return res.status(401).json({ message: 'Invalid username or password' });
          }

          // User found, return success and role as 'customer'
          return res.status(200).json({
              success: true,
              message: 'Login successful',
              role: 'customer',
              userId: user.id,
              username: user.username,
              role: 'customer'
          });
      }

      // Check if the user is in the "manager" table
      const managerResult = await pool.query('SELECT * FROM "manager" WHERE username = $1', [username]);

      if (managerResult.rows.length > 0) {
          const manager = managerResult.rows[0];

          if (manager.password !== password) {
              return res.status(401).json({ message: 'Invalid username or password' });
          }

          // Manager found, return success and role as 'admin'
          return res.status(200).json({
              success: true,
              message: 'Login successful',
              role: 'admin',
              userId: manager.id,
              username: manager.username
          });
      }

      return res.status(401).json({ message: 'Invalid username or password' });

  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'System error' });
  }
});












app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
}) 