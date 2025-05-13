const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();


// Get user profile
app.get('/get-user-profile/:username/:role', async (req, res) => {
    const { username, role } = req.params; 
  
    if(role == 'customer') {
    
    try {
      const result = await pool.query(
        'SELECT username, password FROM "user" WHERE username = $1',
        [username]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = result.rows[0];
  
      res.json({
        success: true,
        user: {
          username: user.username,
          password: user.password
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error during profile retrieval' });
    }
  }
  else if(role == 'admin') {
    try {
      const result = await pool.query(
        'SELECT username, password FROM "manager" WHERE username = $1',
        [username]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = result.rows[0];
  
      res.json({
        success: true,
        user: {
          username: user.username,
          password: user.password
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error during profile retrieval' });
    }
  }
});
  
// Update user profile
app.post('/update-profile', async (req, res) => {
const { currentUsername, newUsername, newPassword, role } = req.body;

if (!currentUsername || !newUsername || !newPassword || !role) {
    return res.status(400).json({ message: 'Missing input fields' });
}

try {
    // Use const since tableName does not change after being assigned
    const tableName = (role === 'customer') ? 'user' : (role === 'admin') ? 'manager' : null;

    if (!tableName) {
    return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if the new username is already taken by another user (in the appropriate table)
    const userExists = await pool.query(
    `SELECT id FROM "${tableName}" WHERE username = $1 AND username != $2`,
    [newUsername, currentUsername]
    );

    if (userExists.rows.length > 0) {
    return res.status(400).json({ message: 'Username already taken, please choose another' });
    }

    // Check if the current username exists
    const result = await pool.query(`SELECT password FROM "${tableName}" WHERE username = $1`, [currentUsername]);

    if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
    }

    // Check if the new username and password are the same as the current ones
    const currentPassword = result.rows[0].password;
    if (currentPassword === newPassword && currentUsername === newUsername) {
    return res.status(400).json({ message: 'No changes detected in provided credentials.' });
    }

    // Update the user profile (in the appropriate table)
    await pool.query(
    `UPDATE "${tableName}" SET username = $1, password = $2 WHERE username = $3`,
    [newUsername, newPassword, currentUsername]
    );

    res.status(200).json({ success: true, message: 'Profile updated successfully' });

} catch (error) {
    res.status(500).json({ message: 'Server error during profile update' });
}
});


module.exports = app;