// interactive.js
// 2024-02-12
// Handles interactions between html and 'database' (a text file)
//
// To use Express, install it via 'npm install express'
// Link to Express documentation: https://expressjs.com/en/5x/api.html
// 
// Link to Youtube tutorial: https://www.youtube.com/watch?v=Oe421EPjeBE&ab_channel=freeCodeCamp.org     GO TO: 4:51:50

const express = require('express');
const path = require('path'); 

const app = express();
const PORT = 8080; // Easier to change if need be

// Allows express to access files in current directory (known as serving)
//app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
	// KEEP BACKTICKS SO ${PORT} = 8080 when printed
	console.log(`Server is running on http://localhost:${PORT}`);
});
