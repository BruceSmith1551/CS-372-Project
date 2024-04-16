# Project for CS 372 (Software Construction)
## Contributers:
- Bruce Smith
- Anand Egan

## Features
- User authentication (sign up, log in) with JWT tokens.
- Different roles for users (viewer, content editor, market manager).
- Access control based on user roles.
- Ability to add, remove, and like movies.
- View different pages based on user roles.
- Retrieve movie data from MongoDB database.

## Setup Instructions
To set up the website, follow these instructions:

0. **Install Node.js:**
   - If you haven't already installed Node.js on your system, you can download and install it from the [official Node.js website](https://nodejs.org/).

1. **Clone the Repository:**
```
git clone <repository_url>
```

3. **Navigate to Project Directory:**

4. **Initialize NPM:**
```
npm init -y
```

5. **Install Dependencies:**
```
npm install express cookie-parser mongodb mongoose jsonwebtoken dotenv bcrypt
```


6. **Set Environment Variables:**
- Create a `.env` file in the project root directory.
- Add the following content to the `.env` file:
  ```
  ACCESS_TOKEN_SECRET=937c9463b159dff2eb2d31ac0ce773b4202e47557d802e9b1fa904552327d7fd
  REFRESH_TOKEN_SECRET=b4bc67f8ff1fe157952ae34a356e4405f22e8f368c3e9e07c5cf41743c165611
  ```

6. **Start the MongoDB Server:**
- Ensure that MongoDB is installed and running on your system.
- Start the MongoDB server.

7. **Create MongoDB Database:**
- In the MongoDB shell, create a database named 'database':
  ```
  use database
  ```

8. **Run the Application:**
- Navigate to the directory containing the interactive.js file and run the following command:
```
node interactive.js
```

9. **Access the Website:**
Open a web browser and navigate to `http://localhost:8080`.

## Notes for creating an account
- Username Requirements:
  - At least 5 characters long
  - Needs one underscore '_' but cannot be at the very beginning of a username (i.e '_abcd' is not allowed)
- Password Requirements:
  - At least 8 characters long
  - At least one upper-case letter
  - At least one lower-case letter
  - At least one letter
  - At least one special character

## Notes for Admins
- To change a user's role to a viewer, content editor, or marketing manager, the admin must manually update the user's role in the MongoDB database and type either `viewer`, `contenteditor`, and `marketmanager`. This functionality is not exposed through the website interface and requires direct manipulation of the database records.
