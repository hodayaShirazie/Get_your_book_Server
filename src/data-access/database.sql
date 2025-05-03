-- Create SecurityQuestion table
CREATE TABLE IF NOT EXISTS "security_question" (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL
      );

-- Create User table
CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        security_question_id INTEGER NOT NULL REFERENCES "security_question"(id),
        security_answer TEXT NOT NULL
);

-- Create Manager table
CREATE TABLE IF NOT EXISTS "manager" (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

-- Insert 3 rows into SecurityQuestion
   INSERT INTO "security_question" (question) VALUES
       ('What is your favorite color?'),
       ('What was your first pet''s name?'),
       ('What is the name of your elementary school?');

-- Create Categort table
CREATE TABLE IF NOT EXISTS "category"(
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL
)

-- Create Product table
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



  
