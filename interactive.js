// interactive.js
// 2024-03-29

// Handles interactions between html and 'database'
//
// To initalize workspace, do 'npm init -y'
// To use Express, install it via 'npm install express'
// To use Cookie Parser, install it via 'npm install cookie-parser'
// To use MongoDB, install it via 'npm install mongodb'
// To use JSON Web Tokens, install it via 'npm install jsonwebtoken'
// To use .env files, install it via 'npm install dotenv'
// To use bcrypt, install it via 'npm install bcrypt'

const PORT = 8080; // Easier to change if need be

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const path = require('path'); 
const app = express();
const fs = require('fs');

app.use(cookieParser());
//const { cookieJwtAuth } = require('./middleware/cookieJwtAuth');

const jwt = require('jsonwebtoken');

require('dotenv').config()

app.use(express.static('public'));
app.use(express.json());
// Allows access to information (encoded url) from forms
app.use(express.urlencoded({ extended: true}));

// Generate a salt to hash the password
const saltRounds = 10;

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

app.get('/welcome', authenticateToken, (req, res) => {
    const username = req.user.username; // For user data extraction
    const role = req.user.role;
    if (role == 'viewer') res.redirect('/viewerhome');
    else if (role == 'contenteditor') res.redirect('/editorhome');
    else if (role == 'marketmanager') res.redirect('/managerhome');
    //res.sendFile(path.join(__dirname, 'public', '/welcome.html'));
});

app.get('/viewerhome', authenticateToken, (req, res) => {
    const username = req.user.username; // For user data extraction
    const role = req.user.role;
    if (role != 'viewer')
    {
        if (role == 'contenteditor') res.redirect("/editorhome");
        else if (role == 'marketmanager') res.redirect("/managerhome");
    }
    res.sendFile(path.join(__dirname, 'public', '/viewerhome.html'));
});

app.get('/editorhome', authenticateToken, (req, res) => {
    const username = req.user.username; // For user data extraction
    const role = req.user.role;
    if (role != 'contenteditor')
    {
        if (role == 'viewer') res.redirect("/viewerhome");
        else if (role == 'marketmanager') res.redirect("/managerhome");
    }
    res.sendFile(path.join(__dirname, 'public', '/editorhome.html'));
});

app.get('/managerhome', authenticateToken, (req, res) => {
    const username = req.user.username; // For user data extraction
    const role = req.user.role;
    if (role != 'marketmanager')
    {
        if (role == 'viewer') res.redirect("/viewerhome");
        else if (role == 'contenteditor') res.redirect("/editorhome");
    }
    res.sendFile(path.join(__dirname, 'public', '/managerhome.html'));
});

/*
app.get('/PLACEHOLDER', authenticateToken, (req, res) => {
    const username = req.user.username; // For user data extraction
    const role = req.user.role;
    res.sendFile(path.join(__dirname, 'public', '/PLACEHOLDER.html'));
});
*/

app.get('/movies.json', (req, res) => {
    const moviesFilePath = path.join(__dirname, 'database', 'movies.json');
    res.sendFile(moviesFilePath);
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
            // Checks if username meets requiremetns, if so, create user
            if (usernameRequirements(username) && passwordRequirements(password)) {

                bcrypt.hash(password, saltRounds, (err, hash) => {
                    const user = { username, hash, attempts : 0, role : "viewer"};
                    userData.push(user);
                    writeUserData(userData);
                });

                console.log('User successfully created');

                const userTokenInfo = { username , role : "viewer" };
                const token = jwt.sign(userTokenInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        
                res.cookie("token", token, {
                    //httpOnly: true,
                });
                // Redirect to the welcome.html page after successful sign-up
                res.redirect('/welcome');
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
    const user = userData.find(user => user.username === username);

    if (!user) {
        console.log('Invalid username');
        res.redirect('/login.html?error=⚠️Invalid%20username⚠️');
    } else {
        bcrypt.compare(password, user.hash, (err, result) => {
            if (err) {
                // Error occurred while comparing passwords
                console.error('Error occurred while comparing passwords:', err);
                return res.redirect('/login.html?error=⚠️An%20error%20occurred.%20Please%20try%20again⚠️');
            }
            if (!result) {
                user.attempts = (user.attempts || 0) + 1;

                console.log('Attempts:', user.attempts);
                if (user.attempts >= 5) {
                    // If attempts reach 5 or more, remove the user
                    userData.splice(userData.findIndex(u => u.username === username), 1);
                    writeUserData(userData);
                    console.log('User deleted due to 5 or more login attempts');
                    return res.redirect('/login.html?error=⚠️Account%20deleted%20due%20to%205%20or%20more%20login%20attempts⚠️');
                }
                // Update attempts in userData array
                writeUserData(userData);

                console.log('Invalid password');
                return res.redirect(`/login.html?error=⚠️Invalid%20password.%20Failed%20Attempts:%20${user.attempts}⚠️`);
            }

            console.log('User successfully logged in');

            const userTokenInfo = { username: user.username, role: user.role };
            const token = jwt.sign(userTokenInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                //httpOnly: true,
            });

            // Redirect to the welcome.html page after successful login
            return res.redirect('/welcome');
        });
    }
}
});

// Endpoint to handle adding a movie
app.post('/addMovie', (req, res) => {
    const { movieName, youtubeLink, genres } = req.body;

    // Read the existing movies data
    const moviesFilePath = path.join(__dirname, 'database', 'movies.json');
    let movies = [];
    try {
        movies = JSON.parse(fs.readFileSync(moviesFilePath));
    } catch (error) {
        console.error('Error reading movies file:', error);
    }

    // Check if the movie name or link already exists
    const isDuplicateName = movies.some(movie => movie.name === movieName);
    const isDuplicateLink = movies.some(movie => movie.youtubeLink === youtubeLink);

    if (isDuplicateName && isDuplicateLink) {
        console.log('Duplicate movie name and link detected');
        res.redirect('/editorhome.html?error=Duplicate%20movie%20name%20and%20link%20detected');
    } else if (isDuplicateName) {
        console.log('Duplicate movie name detected');
        res.redirect('/editorhome.html?error=Duplicate%20movie%20name%20detected');
    } else if (isDuplicateLink) {
        console.log('Duplicate YouTube link detected');
        res.redirect('/editorhome.html?error=Duplicate%20YouTube%20link%20detected');
    } else {
        // Convert genres to an array if it's not already one to ensure it works with various functions
        const genresArray = Array.isArray(genres) ? genres : [genres];

        // Create a JSON object with the movie data including selected genres
        const movieData = {
            name: movieName,
            youtubeLink: youtubeLink,
            genres: genresArray,
            comment: '', 
            likes: 0
        };

        // Add the movie data to the movies array
        movies.push(movieData);

        // Write the updated movies data to the JSON file
        fs.writeFile(moviesFilePath, JSON.stringify(movies, null, 2), err => {
            if (err) {
                console.error('Error writing movies file:', err);
                res.status(500).send('Internal server error');
            } else {
                console.log('Movie added:', movieData);
                res.redirect('/editorhome.html?error=Movie%20added%20successfully');
            }
        });
    }
});

// Endpoint to handle removing a movie
app.post('/removeMovie', (req, res) => {
    const movieNameToRemove = req.body.movieNameToRemove;

    // Read the existing movies data
    const moviesFilePath = path.join(__dirname, 'database', 'movies.json');
    let movies = [];
    try {
        movies = JSON.parse(fs.readFileSync(moviesFilePath));
    } catch (error) {
        console.error('Error reading movies file:', error);
    }

    // Check if the movie to remove exists
    const movieExists = movies.some(movie => movie.name === movieNameToRemove);

    if (!movieExists) {
        console.log('Movie not found');
        res.redirect('/editorhome.html?error=Movie%20not%20found');
    } else {
        // Filter out the movie to remove
        const updatedMovies = movies.filter(movie => movie.name !== movieNameToRemove);

        // Write the updated movie data to the JSON file
        fs.writeFile(moviesFilePath, JSON.stringify(updatedMovies, null, 2), err => {
            if (err) {
                console.error('Error writing movies file:', err);
                res.status(500).send('Internal server error');
            } else {
                console.log('Movie removed:', movieNameToRemove);
                res.redirect('/editorhome.html?error=Movie%20removed%20successfully');
            }
        });
    }
});

// Function to extract video ID from YouTube link
function extractVideoId(link) {
    const videoIdMatch = link.match(/(?:\?v=|&v=|youtu\.be\/)(.*?)(?:\?|&|$)/);
    if (videoIdMatch && videoIdMatch[1]) {
        return videoIdMatch[1];
    }
    return null;
}

// Endpoint to handle liking a movie
app.post('/likeMovie', (req, res) => {
    const movieName = req.body.movieName;
    
    // Read the existing movies data
    const moviesFilePath = path.join(__dirname, 'database', 'movies.json');
    let movies = [];
    try {
        movies = JSON.parse(fs.readFileSync(moviesFilePath));
    } catch (error) {
        console.error('Error reading movies file:', error);
        res.status(500).send('Internal server error');
        return;
    }

    // Find the movie by name
    const movie = movies.find(movie => movie.name === movieName);

    if (!movie) {
        console.log('Movie not found');
        res.status(404).send('Movie not found');
        return;
    }

    // Increment the likes counter
    movie.likes++;

    // Write the updated movie data to the JSON file
    fs.writeFile(moviesFilePath, JSON.stringify(movies, null, 2), err => {
        if (err) {
            console.error('Error writing movies file:', err);
            res.status(500).send('Internal server error');
        } else {
            console.log('Movie liked:', movieName);
            res.status(200).send('Movie liked successfully');
        }
    });
});

// Endpoint to handle updating movie comment
app.post('/updateComment', (req, res) => {
    const updatedMovie = req.body;
    
    // Read the existing movies data
    const moviesFilePath = path.join(__dirname, 'database', 'movies.json');
    let movies = [];
    try {
        movies = JSON.parse(fs.readFileSync(moviesFilePath));
    } catch (error) {
        console.error('Error reading movies file:', error);
        res.status(500).send('Internal server error');
        return;
    }

    // Find the index of the movie to update
    const index = movies.findIndex(movie => movie.name === updatedMovie.name);
    
    if (index === -1) {
        console.error('Movie not found');
        res.status(404).send('Movie not found');
        return;
    }

    // Update the movie comment
    movies[index].comment = updatedMovie.comment;

    // Write the updated movie data to the JSON file
    fs.writeFile(moviesFilePath, JSON.stringify(movies, null, 2), err => {
        if (err) {
            console.error('Error writing movies file:', err);
            res.status(500).send('Internal server error');
        } else {
            console.log('Movie comment updated:', updatedMovie.name);
            res.status(200).send('Movie comment updated successfully');
        }
    });
});

function authenticateToken(req, res, next)
{
    const token = req.cookies.token;

    if (!token) {
        res.redirect("/");
    }
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.redirect("/");
        }
        req.user = decoded; // Save decoded token payload to request object for further use
        next();
    });
}

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});