// init-db.js

const pool = require('./data-access/db');

const initDb = async () => {
  try {
    console.log("Connecting with:", process.env.DATABASE_URL);

    // Create SecurityQuestion table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "security_question" (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL
      );
    `);

    console.log("Table 'security_question' created.");

    // // Insert 3 rows into SecurityQuestion
    // await pool.query(`
    //   INSERT INTO "security_question" (question) VALUES
    //   ('What is your favorite color?'),
    //   ('What was your first pet''s name?'),
    //   ('What is the name of your elementary school?');
    // `);

    console.log("Default security questions inserted.");

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

    console.log("Table 'user' created.");

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


        // Create Category table
        await pool.query(`
        CREATE TABLE IF NOT EXISTS "category" (
          id SERIAL PRIMARY KEY,
          category TEXT UNIQUE NOT NULL
      );      
    `);

    console.log("Table 'category' created.");

    // // Insert default categories
    // await pool.query(`
    // INSERT INTO "category" (category)
    // VALUES 
    //     ('Fiction'),
    //     ('Non-Fiction'),
    //     ('Children');    
    // `);

    console.log("Default categories inserted.");

    // Create Product table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "product" (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category_id INTEGER NOT NULL REFERENCES "category"(id),
            price NUMERIC(10, 2) NOT NULL,
            image BYTEA NOT NULL,
            stock_quantity INTEGER DEFAULT 30 NOT NULL,
            min_stock_threshold INTEGER DEFAULT 10 NOT NULL,
            rating NUMERIC(3, 2) DEFAULT 0.00 NOT NULL,
            sells INTEGER DEFAULT 0 NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    

    console.log("Table 'product' created.");

 

 

    console.log("Table 'manager' created.");

    process.exit(0);
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
};

initDb();
