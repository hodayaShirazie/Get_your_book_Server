const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// פונקציה להרשמה
const registerUser = async (fullName, email, password) => {
  // בדיקה אם כבר יש משתמש עם דואר אלקטרוני כזה
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // הצפנת הסיסמה
  const hashedPassword = await bcrypt.hash(password, 10);

  // יצירת משתמש חדש
  const newUser = new User({ fullName, email, password: hashedPassword });

  await newUser.save();
  return newUser;
};

// פונקציה להתחברות
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // השוואת סיסמאות
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // יצירת טוקן JWT
  const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
  return token;
};

// פונקציה לקבלת פרטי משתמש
const getUserData = async (userId) => {
  const user = await User.findById(userId).select('-password'); // שולף את פרטי המשתמש בלי הסיסמה
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

module.exports = { registerUser, loginUser, getUserData };
