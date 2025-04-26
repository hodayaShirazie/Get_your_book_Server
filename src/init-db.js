// init-db.js

const pool = require('./data-access/db');

const initDb = async () => {
  try {
    console.log("Connecting with:", process.env.DATABASE_URL);

    // // Drop existing tables (if they exist)
    // await pool.query(`DROP TABLE IF EXISTS "User" CASCADE;`);
    // await pool.query(`DROP TABLE IF EXISTS "Manager" CASCADE;`);
    // await pool.query(`DROP TABLE IF EXISTS "security_question" CASCADE;`);

    // console.log("✅ Old tables dropped.");

    // Create SecurityQuestion table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "security_question" (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL
      );
    `);

    console.log("✅ Table 'security_question' created.");

    // // Insert 3 rows into SecurityQuestion
    // await pool.query(`
    //   INSERT INTO "security_question" (question) VALUES
    //   ('What is your favorite color?'),
    //   ('What was your first pet''s name?'),
    //   ('What is the name of your elementary school?');
    // `);

    console.log("✅ Default security questions inserted.");

    // Create User table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        security_question_id INTEGER NOT NULL REFERENCES "security_question"(id),
        security_answer TEXT NOT NULL
      );
    `);

    console.log("✅ Table 'user' created.");

    // Create Manager table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "manager" (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    // // Insert default manager
    // await pool.query(`
    //     INSERT INTO "manager" (username, password)
    //     VALUES ('admin', 'admin123')
    // `);

 

    console.log("✅ Table 'manager' created.");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error initializing database:", err);
    process.exit(1);
  }
};

initDb();
