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
  
