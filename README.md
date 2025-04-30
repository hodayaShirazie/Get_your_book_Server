# Get Your Book - Server

## Description  
This project is the backend for the **Get Your Book** online bookstore platform. The server is responsible for handling user authentication, book management, order processing, and delivering data to the frontend. It is built using **Node.js** and **Express.js**, providing a RESTful API to interact with the client-side application.

## The project is structured as follows:
```plaintext

├── circleci/
│   └── config.yml
├── node_modules/
├── src/
│   ├── data-access/
│   │   ├── database.sql
│   │   └── db.js
│   ├── index.js
│   └── init.js
│   
├── tests/
│   └── demoTest.spec.js
├── .env
├── package.json
├── package-lock.json
├── .gitignore
└── README.md

```


## Setup and Usage  
To run the backend server on your local machine, follow these steps:

1. Clone the repository:  
   `git clone https://github.com/hodayaShirazie/Get_your_book_Server.git`

2. Navigate to the project directory:  
   `cd Get_your_book_Server`
3. Install dependencies:
   `npm install` 

4. Create a `.env` file in the root directory and add your DB external URL connection.

5. Start the server:  
   `npm start`
