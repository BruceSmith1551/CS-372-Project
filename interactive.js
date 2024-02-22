// interactive.js
// 2024-02-21

// Handles interactions between html and 'database'
//
// To use Express, install it via 'npm install express'
// Link to Express documentation: https://expressjs.com/en/5x/api.html
// 
// Link to Express tutorial: https://www.youtube.com/watch?v=Oe421EPjeBE&ab_channel=freeCodeCamp.org   GO TO: 4:51:50
// Another Express tutorial: https://www.youtube.com/watch?v=SccSCuHhOw0&ab_channel=WebDevSimplified 

const express = require('express');
const path = require('path'); 
const app = express();
const fs = require('fs')

const PORT = 8080; // Easier to change if need be

app.use(express.static('public'));

// Allows access to information (encoded url) from forms
app.use(express.urlencoded({ extended: true}))

const userDataFilePath = 'database/user_data.json';

// Checks if a given username meets requirements
// - at least 5 characters long
// - no special characters besides 1 underscore
// Will use regular expressions to check if username 
function usernameRequirements(str) {
    // Test for a letter at start and underscore at any point in string, else return false
    if (!(/^[a-zA-Z]{1,}.*_.*$/.test(str))) return false;

    // Test for special characteres (besides underscore), if found, return false
    if (/[!@#$%^&*()+{}\[\]:;<>,.?~\\/-]/.test(str)) return false;

    // Test if username at least 5 and at most 63 characters long
    if (str.length < 5 || str.length > 63) return false;

    // Username is good
    return true;
}

// Checks if a given password meets requirements
// - at least 8 characters long
// - at least 1 special character
// - at least 1 upper case letter
// - at least 1 lower case letter
// - at least 1 number
function passwordRequirements(str) {
    // Check if the password is at least 8 characters long and at most 63 characters long
    if (str.length < 8 || str.length > 63) return false;

    // Check if the password contains at least one uppercase letter
    if (!/[A-Z]/.test(str)) return false;

    // Check if the password contains at least one lowercase letter
    if (!/[a-z]/.test(str)) return false;

    // Check if the password contains at least one number
    if (!/\d/.test(str)) return false;

    // Check if password contains special characters, if so, return false
    if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(str)) return false;

    // Password is good
    return true;
}

const readUserData = () => {
    try {
        const userData = fs.readFileSync(userDataFilePath);
        return JSON.parse(userData);
    } catch (err) {
        // If the file doesn't exist or is empty, return an empty array
        return [];
    }
};

const writeUserData = (userData) => {
    fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));
};

// Served as default as this '.get' comes first, basically the root
app.get('/', (req, res) => {
	res.redirect('login.html');
});

app.get('/getErrorMessage', (req, res) => {
    // Retrieve the error message from wherever it's stored
    const errorMessage = 'Sample error message'; // Replace this with your actual error message

    // Send the error message as the response
    res.send(errorMessage);
});

// Essentially 'serving' the HTML form
app.get('/login.html', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', '/login.html'));
});

app.get('/welcome.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '/welcome.html'));
});

// Recieving data from forms, posts to 'interactive.js'
app.post('/interactive.js', (req, res) => {
    const { username, password, action } = req.body;

    // SIGN UP REQUEST
    if (action === 'sign up') {
        console.log('Sign up Request:');
        console.log('Username:', username);
        console.log('Password:', password);

        const userData = readUserData();
        const existingUser = userData.find(user => user.username === username);

        // UNSUCCESSFUL SIGN UP: user already exists
        if (existingUser) {
            console.log('User already exists');
            res.redirect('/login.html?error=⚠️User%20already%20exists%20⚠️');
        }
        // USER DOESN'T EXIST
        else {
            // attempts is how many the user has before their account gets deleted
            attempts = 0
            // Checks if username meets requiremetns, if so, create user
            if (usernameRequirements(username) && passwordRequirements(password)) {
                userData.push({ username, password, attempts });
                writeUserData(userData);
                console.log('User successfully created');
                // Redirect to the welcome.html page after successful sign-up
                res.redirect(`/welcome.html?message=Welcome%20${username}!`);
            }
            // If user doesn't meet both username and password requirements signal error
            else if(!usernameRequirements(username) && !passwordRequirements(password)) {
                console.log('Bad username and password detected');
                res.redirect('/login.html?error=⚠️Bad%20username%20and%20password%20detected⚠️');
            }
			// If user doesn't meet username requirements signal error
            else if(!usernameRequirements(username)) {
                console.log('Bad username detected');
                res.redirect('/login.html?error=⚠️Bad%20username%20detected⚠️');
            }
			// If user doesn't meet password requirements signal error
            else if(!passwordRequirements(password)) {
                console.log('Bad password detected');
                res.redirect('/login.html?error=⚠️Bad%20password%20detected⚠️');
            }
			// Backup error if the user somehow bypasses all other errors
            else {
                console.log('Bad username and/or password detected');
                res.redirect('/login.html?error=⚠️Bad%20username/password%20detected⚠️');
            }
        }

    // LOG IN REQUEST
	} else if (action === 'log in') {
		console.log('Log in Request:');
		console.log('Username:', username);
		console.log('Password:', password);

		const userData = readUserData();
		const user = userData.find(user => user.username === username && user.password === password);
        // const password = userData.find(password => user.password === password);

        // UNSUCCESSFUL LOG IN: user doesn't exist or information doesn't match
		if (!user) {
            const userExists = userData.find(user => user.username === username);
            // Information doesn't match but user exists
            if (userExists) {
                userAttempts = userExists.attempts;
                userAttempts++;
                
                console.log('Attempts: ', userAttempts);
                if (userAttempts >= 5) {
                    // If attempts reach 5 or more, remove the user
                    userData.splice(userData.findIndex(u => u.username === username), 1);
                    writeUserData(userData);
                    console.log('User deleted due to 5 or more login attempts');
                    res.redirect('/login.html?error=⚠️Account%20deleted%20due%20to%205%20or%20more%20login%20attempts⚠️');
                    return; // Exit the function to prevent further execution
                }
                // Update attempts in userData array
                userExists.attempts = userAttempts;
                writeUserData(userData);
                
                console.log('Invalid password');
                res.redirect(`/login.html?error=⚠️Invalid%20password.%20Failed%20Attempts:%20${userAttempts}⚠️`);
            }
			// Invalid username error
            else {
                console.log('Invalid username');
                res.redirect(`/login.html?error=⚠️Invalid%20username⚠️`);
            }
		}
        // Successful login: user exists and information matches
        else {
		console.log('User successfully logged in');
		// Redirect to the welcome.html page after successful login
        res.redirect(`/welcome.html?message=Welcome%20back,%20${username}!`);
        }
	}

});

app.listen(PORT, () => {
	// KEEP BACKTICKS SO ${PORT} = 8080 when printed
	console.log(`Server is running on http://localhost:${PORT}`);
});
