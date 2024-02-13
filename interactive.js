// interactive.js
// 2024-02-12
// Handles interactions between html and 'database' (a text file)
//
// To use Express, install it via 'npm install express'
// Link to Express documentation: https://expressjs.com/en/5x/api.html
// 
// Link to Express tutorial: https://www.youtube.com/watch?v=Oe421EPjeBE&ab_channel=freeCodeCamp.org     GO TO: 4:51:50
//
// TO DO:
// - Handle input from HTML page
//   - Use 'app.post' to recieve input data
//     - Here we take data to either store/compare/process data from HTML page 
//   - Will need app.use to parse JSON and URL-encoded bodies that is inputted
//
// - When receiving sign in input, add or compare to existing data in 'user_data.txt'
//   - Update page to display error/success to client
//     - e.g: "User successfully created" "User already exists"
//   
// - In response to successful login input, serve a new HTML page to HTML form

const express = require('express');
const path = require('path'); 

const app = express();
const PORT = 8080; // Easier to change if need be

// Essentially 'serving' the HTML form
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
	// KEEP BACKTICKS SO ${PORT} = 8080 when printed
	console.log(`Server is running on http://localhost:${PORT}`);
});
