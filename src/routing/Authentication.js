const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();


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
  
      await pool.query(`
        INSERT INTO "user" (username, password, security_question_id, security_answer)
        VALUES ($1, $2, $3, $4)
      `, [username, password, securityQuestionId, securityAnswer]);
  
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Server error during registration', err });
    }
});

// login user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
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
        res.status(500).json({ message: 'System error', err });
    }
});
  
// Get all security questions
app.get('/security-questions', async (req, res) => {
    try {
      const result = await pool.query('SELECT id, question FROM security_question');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: 'Server error loading security questions', err });
    }
});

// Get security question for a specific user
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
      res.status(500).json({ message: 'Security question fetch error:', error });
    }
});

// Password recovery
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
  
      // Important: In production, you should NOT return the password.
      res.json({ success: true, password: user.password });
  
    } catch (error) {
      res.status(500).json({ success: false });
    }
});

// Reset password
app.post('/reset-password', async (req, res) => {
  const { username, password} = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {  
    
    const samePassword = await pool.query('SELECT password FROM "user" WHERE username = $1', [username]);
    if (samePassword.rows.length > 0 && samePassword.rows[0].password === password) {
      return res.status(400).json({ message: 'New password cannot be the same as the old password' });
    }
    
    await pool.query(`
      UPDATE "user" SET password = $1
      WHERE username = $2
    `, [password,username]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', err });
  }
});


module.exports = app;