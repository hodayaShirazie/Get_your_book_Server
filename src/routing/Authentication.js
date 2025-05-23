const express = require('express')
const pool = require('../data-access/db');
const app = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const port = 3000;
// const serverUrl = `http://localhost:${port}`;
const serverUrl = `https://get-your-book-server.onrender.com`;

app.use(express.static('public'));



// registration user
// app.post('/register-OLD', async (req, res) => {
//     const { username, password, securityQuestionId, securityAnswer } = req.body;
//     if (!username || !password || !securityQuestionId || !securityAnswer) {
//       return res.status(400).json({ message: 'Missing fields' });
//     }
//     try {
//       const userExists = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
//       if (userExists.rows.length > 0) {
//         return res.status(400).json({ message: 'Username already taken, please choose another' });
//       }
  
//       await pool.query(`
//         INSERT INTO "user" (username, password, security_question_id, security_answer)
//         VALUES ($1, $2, $3, $4)
//       `, [username, password, securityQuestionId, securityAnswer]);
  
//       res.json({ success: true });
//     } catch (err) {
//       res.status(500).json({ message: 'Server error during registration', err });
//     }
// });

app.post('/register', async (req, res) => {
  const { username, email, password, securityQuestionId, securityAnswer } = req.body;

  if (!username || !email || !password || !securityQuestionId || !securityAnswer) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const userExists = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username already taken, please choose another' });
    }

    const emailExists = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    await pool.query(`
      INSERT INTO "user" (username, password, email, security_question_id, security_answer)
      VALUES ($1, $2, $3, $4, $5)
    `, [username, password, email, securityQuestionId, securityAnswer]);

    res.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
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


const transporterO = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info.getyourbook@gmail.com',
    pass: 'mlya kgio qvuf dftu' 
  }
});

const resetTokens = {}; 
app.post('/forgot-password-Old', async (req, res) => {
  const { username } = req.body;  

  try {
    const result = await pool.query('SELECT email FROM "user" WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(400).send('User not found');
    }

    const email = result.rows[0].email; 

    const token = crypto.randomBytes(20).toString('hex');

    resetTokens[token] = {
      username,
      email,
      expiry: Date.now() + 5600000
    };

    const resetLink = `${serverUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: 'info.getyourbook@gmail.com',
      to: email,
      subject: 'Password Reset',
      replyTo: 'no-reply@getyourbook.com',
      html: `<p>To reset your password, click the link below:</p><a href="${resetLink}">${resetLink}</a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Failed to send email:', error);
        return res.status(500).send('Failed to send email');
      }
      res.send('Password reset email sent successfully');
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Server error');
  }
});


app.post('/reset-password-Old', bodyParser.urlencoded({ extended: true }), async (req, res) => {
  const { token, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  const data = resetTokens[token];
  if (!data || data.expiry < Date.now() || data.email !== email) {
    return res.status(400).send('Token expired or invalid');
  }

  try {

    console.log(`New password for user "${data.username}": ${password}`);  

    await pool.query(
      'UPDATE "user" SET password = $1 WHERE username = $2',
      [password, data.username]
    );
    

    delete resetTokens[token];

    res.send('Password reset successfully!<br/>Please login with your new password');

  } catch (err) {
    console.error('DB error:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/reset-password-Old', (req, res) => {
  const { token } = req.query;
  const data = resetTokens[token];

  console.log('🔍 expiry from DB:', data.expiry);
  console.log('🕒 Date.now():', Date.now());


  const tokenValid = data && data.expiry > Date.now();

  if (!tokenValid) {
    return res.send('<p>Invalid or expired token.</p>');
  }

  const email = data.email;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reset Password</title>
      <link rel="stylesheet" href="/styles/reset.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>
        body {
          margin: 0;
          padding: 0;
          background-image: url('/background-book.jpg');
          background-size: cover;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          font-family: sans-serif;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(255, 255, 255, 0.6);
          z-index: 1;
        }

        .recovery-form {
          position: relative;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 0 15px rgba(0,0,0,0.2);
          width: 350px;
          text-align: center;
          z-index: 2;
        }

        .recovery-form h2 {
          color: #2d4739;
          margin-bottom: 20px;
        }

        .recovery-form label {
          display: block;
          text-align: left;
          margin-bottom: 5px;
          font-weight: bold;
          color: #2d4739;
        }

        .recovery-form input {
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }

        .submit-button {
          background-color: #2d4739;
          color: white;
          padding: 10px;
          width: 100%;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }

        .submit-button:hover {
          background-color: #416353;
        }

        .password-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input input {
          flex: 1;
          padding-right: 30px;
        }

        .password-input span {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #666;
          font-size: 0.9rem;
        }

        .error-message {
          color: red;
          margin-top: 10px;
          font-size: 14px;
        }
      </style>
      <script>
        function togglePassword(id, iconId) {
          const input = document.getElementById(id);
          const icon = document.getElementById(iconId);
          if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
          } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
          }
        }

        function validateForm(event) {
          event.preventDefault();

          const password = document.getElementById("password").value;
          const confirmPassword = document.getElementById("confirmPassword").value;
          const errorDiv = document.getElementById("error-message");

          if (password !== confirmPassword) {
            errorDiv.textContent = "Passwords do not match";
            return;
          }

          if (password.length < 8) {
            errorDiv.textContent = "Password must be at least 8 characters long";
            return;
          }

          if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errorDiv.textContent = "Password must contain at least one special character";
            return;
          }

          // אם הכל תקין - שולחים את הטופס
          event.target.submit();
        }
      </script>
    </head>
    <body>
      <div class="overlay"></div>
      <form class="recovery-form" method="POST" action="/reset-password" onsubmit="validateForm(event)">
        <h2>Set a new password</h2>

        <input type="hidden" name="token" value="${token}" />
        <input type="hidden" name="email" value="${email}" />

        <label>New Password</label>
        <div class="password-input">
          <input id="password" name="password" type="password" required />
          <span onclick="togglePassword('password', 'eyeNew')">
            <i id="eyeNew" class="fa fa-eye"></i>
          </span>
        </div>

        <label>Confirm Password</label>
        <div class="password-input">
          <input id="confirmPassword" name="confirmPassword" type="password" required />
          <span onclick="togglePassword('confirmPassword', 'eyeConfirm')">
            <i id="eyeConfirm" class="fa fa-eye"></i>
          </span>
        </div>

        <button type="submit" class="submit-button">Reset Password</button>
        <div id="error-message" class="error-message"></div>
      </form>
    </body>
    </html>
  `);
});
///////////////////////////////////////

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info.getyourbook@gmail.com',
    pass: 'mlya kgio qvuf dftu'
  }
});


//WORKS WELL
app.post('/forgot-password', async (req, res) => {
  const { username } = req.body;

  try {
    const result = await pool.query('SELECT email FROM "user" WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(400).send('User not found');

    const email = result.rows[0].email;
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 5600000;

    await pool.query(
      'INSERT INTO password_reset_tokens (token, username, expiry) VALUES ($1, $2, $3)',
      [token, username, expiry]
    );

    const resetLink = `${serverUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const mailOptions = {
      from: 'info.getyourbook@gmail.com',
      to: email,
      subject: 'Password Reset',
      replyTo: 'no-reply@getyourbook.com',
      html: `<p>To reset your password, click the link below:</p><a href="${resetLink}">${resetLink}</a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Failed to send email:', error);
        return res.status(500).send('Failed to send email');
      }
      res.send('Password reset email sent successfully');
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Server error');
  }
});


app.get('/reset-password', async (req, res) => {
  const { token } = req.query;

  try {
    const result = await pool.query('SELECT u.email, prt.expiry FROM "password_reset_tokens" prt JOIN "user" u ON prt.username = u.username WHERE prt.token = $1', [token]);

    console.log('🔍 expiry from DB:', result.rows[0].expiry);
    console.log('🕒 Date.now():', Date.now());


    if (result.rows.length === 0 || result.rows[0].expiry < Date.now()) {
      return res.send('<p>Invalid or expired token.</p>');
    }

    const email = result.rows[0].email;

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reset Password</title>
      <link rel="stylesheet" href="/styles/reset.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>
        body {
          margin: 0;
          padding: 0;
          background-image: url('/background-book.jpg');
          background-size: cover;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          font-family: sans-serif;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(255, 255, 255, 0.6);
          z-index: 1;
        }

        .recovery-form {
          position: relative;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 0 15px rgba(0,0,0,0.2);
          width: 350px;
          text-align: center;
          z-index: 2;
        }

        .recovery-form h2 {
          color: #2d4739;
          margin-bottom: 20px;
        }

        .recovery-form label {
          display: block;
          text-align: left;
          margin-bottom: 5px;
          font-weight: bold;
          color: #2d4739;
        }

        .recovery-form input {
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }

        .submit-button {
          background-color: #2d4739;
          color: white;
          padding: 10px;
          width: 100%;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }

        .submit-button:hover {
          background-color: #416353;
        }

        .password-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input input {
          flex: 1;
          padding-right: 30px;
        }

        .password-input span {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #666;
          font-size: 0.9rem;
        }

        .error-message {
          color: red;
          margin-top: 10px;
          font-size: 14px;
        }
      </style>
      <script>
        function togglePassword(id, iconId) {
          const input = document.getElementById(id);
          const icon = document.getElementById(iconId);
          if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
          } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
          }
        }

        function validateForm(event) {
          event.preventDefault();

          const password = document.getElementById("password").value;
          const confirmPassword = document.getElementById("confirmPassword").value;
          const errorDiv = document.getElementById("error-message");

          if (password !== confirmPassword) {
            errorDiv.textContent = "Passwords do not match";
            return;
          }

          if (password.length < 8) {
            errorDiv.textContent = "Password must be at least 8 characters long";
            return;
          }

          if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errorDiv.textContent = "Password must contain at least one special character";
            return;
          }

          // אם הכל תקין - שולחים את הטופס
          event.target.submit();
        }
      </script>
    </head>
    <body>
      <div class="overlay"></div>
      <form class="recovery-form" method="POST" action="/reset-password" onsubmit="validateForm(event)">
        <h2>Set a new password</h2>

        <input type="hidden" name="token" value="${token}" />
        <input type="hidden" name="email" value="${email}" />

        <label>New Password</label>
        <div class="password-input">
          <input id="password" name="password" type="password" required />
          <span onclick="togglePassword('password', 'eyeNew')">
            <i id="eyeNew" class="fa fa-eye"></i>
          </span>
        </div>

        <label>Confirm Password</label>
        <div class="password-input">
          <input id="confirmPassword" name="confirmPassword" type="password" required />
          <span onclick="togglePassword('confirmPassword', 'eyeConfirm')">
            <i id="eyeConfirm" class="fa fa-eye"></i>
          </span>
        </div>

        <button type="submit" class="submit-button">Reset Password</button>
        <div id="error-message" class="error-message"></div>
      </form>
    </body>
    </html>
  `);

  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).send('Server error');
  }
});

// 3. איפוס סיסמה
app.post('/reset-password', bodyParser.urlencoded({ extended: true }), async (req, res) => {
  const { token, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) return res.status(400).send('Passwords do not match');

  try {
    const result = await pool.query(
      'SELECT prt.username, prt.expiry FROM "password_reset_tokens" prt JOIN "user" u ON prt.username = u.username WHERE prt.token = $1 AND u.email = $2',
      [token, email]
    );

    if (result.rows.length === 0 || result.rows[0].expiry < Date.now()) {
      return res.status(400).send('Token expired or invalid');
    }

    const username = result.rows[0].username;

    await pool.query(
      'UPDATE "user" SET password = $1 WHERE username = $2',
      [password, username]
    );

    await pool.query('DELETE FROM "password_reset_tokens" WHERE token = $1', [token]);

    res.send('Password reset successfully!<br/>Please login with your new password');

  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).send('Internal Server Error');
  }
});






module.exports = app;