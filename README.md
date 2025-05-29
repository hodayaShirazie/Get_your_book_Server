# Get Your Book Server-side

This project is the backend for the **Get Your Book** online bookstore platform. The server is responsible for handling user authentication, book management, order processing, and delivering data to the frontend. It is built using **Node.js** and **Express.js**, providing a RESTful API to interact with the client-side application.


## Installation

To run the backend server on your local machine, follow these steps:

1. Clone the repository:  
   `git clone https://github.com/hodayaShirazie/Get_your_book_Server.git`

2. Navigate to the project directory:  
   `cd Get_your_book_Server`
3. Install dependencies:
   `npm install` 

4. Create a `.env` file in the root directory and add your DB external URL connection(environment variable are detailed below).

5. Start the server:  
   `npm start`


## Project Structure:
```plaintext

├── circleci/
│   └── config.yml
├── node_modules/
├── public/
├── src/
│   ├── data-access/
│   │   └── database.sql
│   │   ├── db.js
│   │   ├── routing/
│   │   │   └── ProtectedRoutes.jsx
│   │   │   ├── Authentication.js
│   │   │   ├── Order.js
│   │   │   ├── productRating.js
│   │   │   ├── Products.js
│   │   │   ├── ShoppingCart.js
│   │   │   ├── StoreManagement.js
│   │   │   ├── TopBooks.js
│   │   │   ├── UserProfile.js
│   │   │   └── WishList.js
├── index.js
├── init-db.js
├── tests/
│   ├── deleteProduct.api.spec.js
│   └─── login.api.spec.js
├── .env
├── package.json
├── package-lock.json
├── eslint.config.js
├── .gitignore
└── README.md

```

## Test cases

[View Test cases (PDF)](./docs/Teset_Cases.pdf)



## Running Tests

To run tests, run the following command

```bash
  npm run test
```


### Environment Variables

To run this project, you will need to add the following environment variable to your `.env` file: `DATABASE_URL=your_database_connection_string`

Replace `your_database_connection_string` with the actual DB connection string provided by your hosting service.



## Contributing

Contributions are always welcome!

If you’d like to contribute, please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a pull request

Please make sure your code follows the project's style guidelines and includes relevant tests or documentation updates if needed.


## Authors

- [@Hodaya Shirazie](https://github.com/hodayaShirazie)
- [@Tamar Mosheev](https://github.com/TamarMosheev)
- [@Tehila Partush](https://github.com/tehilaPa)
- [@Rina binushashvili](https://github.com/R-B-613)
- [@Merav Hashta](https://github.com/MeravBest)

![Logo](./docs/GYB_logo.png)
