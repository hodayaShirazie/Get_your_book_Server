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

    // Create Manager table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "manager" (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

        // Create Category table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "category" (
          id SERIAL PRIMARY KEY,
          category TEXT UNIQUE NOT NULL
      );      
    `);


    // Create product table
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

  

    // Create orders table 
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          sum_of_purchase NUMERIC(10, 2) NOT NULL,
          number_of_products INTEGER NOT NULL,
          order_date TIMESTAMP NOT NULL,
          user_id INTEGER NOT NULL REFERENCES "user"(id),
          status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'canceled')),
          delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('pickup-point', 'home-delivery')),
          address VARCHAR(255),
          delivery_date DATE,
          time_slot_delivery VARCHAR(10) CHECK (time_slot_delivery IN ('morning', 'afternoon', 'evening'))
      );
    `);

    //Create order_product table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_product (
        user_id INTEGER NOT NULL,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1 CHECK (quantity > 0),

        PRIMARY KEY (order_id, product_id),
        
        FOREIGN KEY (user_id) REFERENCES "user"(id),
        FOREIGN KEY (order_id) REFERENCES "orders"(id),
        FOREIGN KEY (product_id) REFERENCES "product"(id) ON DELETE CASCADE
        );
    `);


    // Create available_delivery_times table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS available_delivery_times (
        id SERIAL PRIMARY KEY,
        day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN (
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        )),
        morning_available BOOLEAN DEFAULT FALSE,
        afternoon_available BOOLEAN DEFAULT FALSE,
        evening_available BOOLEAN DEFAULT FALSE
    );`)

    // Create shopping_cart table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shopping_cart (
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    
        PRIMARY KEY (user_id, book_id),
    
        FOREIGN KEY (user_id) REFERENCES "user"(id),
        FOREIGN KEY (book_id) REFERENCES "product"(id) ON DELETE CASCADE
        );
    `);


    // Create book_rating table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS book_rating (
          user_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),

          PRIMARY KEY (user_id, book_id),

          FOREIGN KEY (user_id) REFERENCES "user"(id),
          FOREIGN KEY (book_id) REFERENCES "product"(id) ON DELETE CASCADE
          );
    `);
    
    // Create wish_list table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS wish_list (
          user_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,

          PRIMARY KEY (user_id, book_id),

          FOREIGN KEY (user_id) REFERENCES "user"(id),
          FOREIGN KEY (book_id) REFERENCES "product"(id) ON DELETE CASCADE
          );
    `);




    process.exit(0);
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
};

initDb();
